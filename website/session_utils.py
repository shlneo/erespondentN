import uuid
from flask import request, redirect, url_for, flash, make_response, session
from .models import UserSession, db, User
from functools import wraps
from datetime import timedelta
from user_agents import parse
import requests
from .time_for_app import current_utc_time


def get_user_session_timeout(user_type):
    """Возвращает таймаут сессии в зависимости от типа пользователя."""
    return timedelta(hours=9) if user_type in ['Администратор', 'Аудитор'] else timedelta(minutes=60)

def get_device_place(ip):
    try:
        response = requests.get(f'https://ipinfo.io/{ip}/json')
        data = response.json()
        city = data.get('city', '')
        country = data.get('country', '')
        return f'{city}, {country}' if city or country else 'None'
    except Exception:
        return 'None'

def force_logout():
    from website.auth import logout_user
    logout_user()
    session.clear()
    response = make_response(redirect(url_for('auth.login')))
    response.delete_cookie('session_token')
    flash('Сессия недействительна или истекла. Пожалуйста, войдите снова.', 'error')
    return response

def delete_all_user_sessions(user_id):
    UserSession.query.filter_by(user_id=user_id).delete()
    db.session.commit()

def delete_all_user_sessions_timeout(timeout):
    """Удаляет все пользовательские сессии, у которых last_active превышает таймаут."""
    now = current_utc_time()
    expired_sessions = UserSession.query.filter(
        UserSession.last_active < (now - timeout)
    ).all()
    for session in expired_sessions:
        db.session.delete(session)
    db.session.commit()
    return force_logout()

def clear_all_sessions_and_logout():
    token = get_session_token_from_cookie()
    if token:
        session_obj = UserSession.query.filter_by(session_token=token).first()
        if session_obj:
            delete_all_user_sessions(session_obj.user_id)
    return force_logout()

def create_user_session(user_id):
    token = get_session_token_from_cookie()
    session = UserSession.query.filter_by(user_id=user_id, session_token=token).first()

    if session:
        session.last_active = current_utc_time()
        db.session.commit()
        return token
    else:
        new_token = str(uuid.uuid4())

        ua_string = request.headers.get('User-Agent', '')
        user_agent = parse(ua_string)

        platform = user_agent.os.family or "unknown"
        browser = user_agent.browser.family or "unknown"
        
        ip = request.remote_addr
        device_place = get_device_place(ip)

        session = UserSession(
            user_id=user_id,
            session_token=new_token,
            device_name=platform,
            device_app=browser,
            ip_address=ip,
            device_place=device_place,
            last_active=current_utc_time()
        )
        db.session.add(session)
        db.session.commit()
        return new_token

def get_session_token_from_cookie():
    return request.cookies.get('session_token')

def session_required(view_func):
    @wraps(view_func)
    def wrapper(*args, **kwargs):
        token = get_session_token_from_cookie()

        if not token:
            return force_logout()

        session_obj = UserSession.query.filter_by(session_token=token).first()
        if not session_obj:
            return force_logout()

        user = User.query.filter_by(id=session_obj.user_id).first()
        if not user:
            delete_all_user_sessions(session_obj.user_id)
            return force_logout()

        session_timeout = get_user_session_timeout(user.type)

        if current_utc_time() - session_obj.last_active > session_timeout:
            delete_all_user_sessions(user.id)
            return force_logout()
        
        user.last_active = current_utc_time()
        session_obj.last_active = current_utc_time()
        db.session.commit()

        return view_func(*args, **kwargs)
    return wrapper
