import uuid
import jwt
from flask import request, redirect, url_for, flash, make_response, current_app
from functools import wraps
from datetime import datetime, timedelta
from user_agents import parse
import requests
from .time import current_utc_time

JWT_ALGORITHM = 'HS256'
SESSION_COOKIE_NAME = 'session_token'
SESSION_DURATION = timedelta(days=7)

def get_user_session_timeout(user_type):
    return timedelta(hours=9) if user_type in ['Администратор', 'Аудитор'] else timedelta(minutes=60)

def get_device_place(ip):
    try:
        response = requests.get(f'https://ipinfo.io/{ip}/json', timeout=2)
        data = response.json()
        city = data.get('city', '')
        country = data.get('country', '')
        return f'{city}, {country}' if city or country else 'Unknown'
    except Exception:
        return 'Unknown'

def create_session_token(user):
    ua_string = request.headers.get('User-Agent', '')
    user_agent = parse(ua_string)
    
    ip = request.remote_addr or '127.0.0.1'
    now = current_utc_time()
    
    payload = {
        'user_id': user.id,
        'email': user.email,
        'user_type': user.type,
        'username': user.fio,
        'session_id': str(uuid.uuid4()),
        'device_info': {
            'platform': user_agent.os.family or "Unknown",
            'browser': user_agent.browser.family or "Unknown",
            'ip': ip,
            'location': get_device_place(ip)
        },
        'created_at': now.isoformat(),
        'last_active': now.isoformat(),
        'exp': (now + SESSION_DURATION).timestamp()
    }
    
    token = jwt.encode(
        payload,
        current_app.config['SECRET_KEY'],
        algorithm=JWT_ALGORITHM
    )
    
    return token

def set_session_cookie(response, token):
    response.set_cookie(
        SESSION_COOKIE_NAME,
        value=token,
        max_age=int(SESSION_DURATION.total_seconds()),
        httponly=True,
        secure=False,
        samesite='Lax',
        path='/'
    )
    return response

def create_login_response(user, redirect_endpoint='views.account'):
    token = create_session_token(user)
    response = make_response(redirect(url_for(redirect_endpoint)))
    response = set_session_cookie(response, token)
    return response, token

def verify_session_token(token):
    try:
        payload = jwt.decode(
            token,
            current_app.config['SECRET_KEY'],
            algorithms=[JWT_ALGORITHM]
        )
        return payload
    except jwt.ExpiredSignatureError:
        print("Token expired")
        return None
    except jwt.InvalidTokenError as e:
        print(f"Invalid token: {e}")
        return None

def get_session_from_cookie():
    token = request.cookies.get(SESSION_COOKIE_NAME)
    if not token:
        return None
    return verify_session_token(token)

def update_session_activity(token):
    try:
        payload = jwt.decode(
            token,
            current_app.config['SECRET_KEY'],
            algorithms=[JWT_ALGORITHM],
            options={"verify_exp": False}
        )
        
        payload['last_active'] = current_utc_time().isoformat()
        
        new_token = jwt.encode(
            payload,
            current_app.config['SECRET_KEY'],
            algorithm=JWT_ALGORITHM
        )
        
        return new_token
    except jwt.InvalidTokenError:
        return None

def force_logout():
    response = make_response(redirect(url_for('views.login')))
    response.delete_cookie(SESSION_COOKIE_NAME, path='/')
    flash('Сессия недействительна или истекла. Пожалуйста, войдите снова.', 'error')
    return response

def session_required(view_func):
    @wraps(view_func)
    def wrapper(*args, **kwargs):
        from .models import User
        from . import db
        
        token = request.cookies.get(SESSION_COOKIE_NAME)
        
        if not token:
            print("No session token in cookie")
            return force_logout()
        
        session_data = verify_session_token(token)
        if not session_data:
            print("Invalid or expired token")
            return force_logout()
        
        user = User.query.get(session_data['user_id'])
        if not user:
            print(f"User not found: {session_data['user_id']}")
            return force_logout()
        
        # ИСПРАВЛЕНИЕ: преобразуем строку обратно в datetime для сравнения
        last_active = datetime.fromisoformat(session_data['last_active'])
        current_time = current_utc_time()
        
        # Убираем timezone для сравнения если нужно
        if hasattr(current_time, 'tzinfo') and current_time.tzinfo is not None:
            current_time = current_time.replace(tzinfo=None)
        if hasattr(last_active, 'tzinfo') and last_active.tzinfo is not None:
            last_active = last_active.replace(tzinfo=None)
        
        session_timeout = get_user_session_timeout(user.type)
        time_diff = current_time - last_active
        
        if time_diff > session_timeout:
            return force_logout()
        
        user.last_active = current_utc_time()
        db.session.commit()

        new_token = update_session_activity(token)
        response = view_func(*args, **kwargs)
        
        if isinstance(response, str):
            response = make_response(response)
        
        if new_token and new_token != token:
            response = set_session_cookie(response, new_token)
        
        return response
    
    return wrapper

def get_current_user():
    from .models import User
    
    session_data = get_session_from_cookie()
    if session_data:
        return User.query.get(session_data['user_id'])
    return None

def clear_session_cookie(response):
    response.delete_cookie(SESSION_COOKIE_NAME, path='/')
    return response