from flask import Blueprint, render_template, redirect, url_for, flash, request, jsonify, session
from flask_login import current_user, login_required
from website.session_utils import session_required
from .models import User, Organization, Report, Version_report, Ticket, DirUnit, DirProduct, Sections, Message, News, UserSession
from . import db
from sqlalchemy import asc, or_, desc
from functools import wraps
from sqlalchemy.sql import func, or_
from sqlalchemy.types import String

from .time_for_app import get_previous_quarter, get_report_year, current_utc_time

views = Blueprint('views', __name__)

def owner_only(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        version_id = kwargs.get('id')
        version = Version_report.query.get(version_id)
        if version is None:
            flash('Версия отчета не найдена.', 'error')
            return redirect(url_for('views.report_area', user=current_user))
        report = version.report
        if report.user_id != current_user.id and current_user.type != 'Администратор' and current_user.type != 'Аудитор':
            flash('Недостаточно прав для доступа к этому отчёту.', 'error')
            return redirect(url_for('views.report_area', user=current_user))
        return f(*args, **kwargs)
    return decorated_function

def profile_complete(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not current_user.is_authenticated:
            flash('Требуется авторизация.', 'error')
            return redirect(url_for('views.login'))  
          
        if not current_user.fio or not current_user.telephone or not current_user.organization_id:
            flash('Пожалуйста, заполните полностью свой профиль.', 'error')
            return redirect(url_for('views.profile_common'))
        
        return f(*args, **kwargs)
    
    return decorated_function

def auditors_only(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if current_user.type not in ['Аудитор', 'Администратор']:
            flash('У вас нет прав доступа', 'error')
            return redirect(url_for('views.profile_common'))
        if not current_user.fio or not current_user.telephone:
            flash('Пожалуйста, заполните ФИО и номер телефона в профиле', 'error')
            return redirect(url_for('views.profile_common'))
        return f(*args, **kwargs)
    return decorated_function

def get_reports_by_status(status, year=None, quarter=None):
    filters = []
    statuses = [
        'Отправлен',
        'Есть замечания',
        'Одобрен',
        'Готов к удалению'
    ]

    okpo_digit = str(current_user.organization.okpo)[0]

    print(f"{okpo_digit}")
    user_type = current_user.type

    if year:
        filters.append(Report.year == year)
    if quarter:
        filters.append(Report.quarter == quarter)

    if user_type == "Администратор" or (user_type == "Аудитор" and str(current_user.organization.okpo)[-4] == "8"):
        print(f"АДМИНЫ + ДЕПАРТАМЕНТ --- {status}")
        if status == 'all_reports':
            return Report.query.join(Version_report).filter(
                or_(*[Version_report.status == s for s in statuses]),
                *filters
            ).order_by(Report.year.asc(), Report.quarter.asc()).all()
        else:
            trans_status = translate_status(status)
            if trans_status:
                return Report.query.join(Version_report).filter(
                    Version_report.status == trans_status,
                    *filters
                ).order_by(Report.year.asc(), Report.quarter.asc()).all()
            else:
                return []
    else:
        print(f"{status}")
        if status == 'all_reports':
            return Report.query.join(Version_report).join(Organization).filter(
                or_(*[Version_report.status == s for s in statuses]),
                *filters,
                func.substr(Organization.okpo, func.length(Organization.okpo) - 3, 1) == okpo_digit
            ).order_by(Report.year.asc(), Report.quarter.asc()).all()
        else:
            trans_status = translate_status(status)
            if trans_status:
                return Report.query.join(Version_report).join(Organization).filter(
                    Version_report.status == trans_status,
                    *filters,
                    func.substr(Organization.okpo, func.length(Organization.okpo) - 3, 1) == okpo_digit
                ).order_by(Report.year.asc(), Report.quarter.asc()).all()
            else:
                return []

def translate_status(status):
    status_map = {
        'not_viewed': 'Отправлен',
        'remarks': 'Есть замечания',
        'to_download': 'Одобрен',
        'to_delete': 'Готов к удалению'
    }
    return status_map.get(status)

@views.route('/', methods=['GET'])
def beginPage():
    user_data = User.query.filter_by(type="Респондент").count()
    organization_data = Organization.query.count()
    report_data = Report.query.count()
    latest_news = News.query.order_by(desc(News.id)).first()
    return render_template('begin_page.html', 
                           latest_news=latest_news,
                           user=current_user, 
                           user_data = user_data, 
                           organization_data = organization_data, 
                           report_data = report_data,
                           previous_quarter = get_previous_quarter(),
                           previous_year=get_report_year()
                           )

@views.route('/sign', methods=['GET'])
def sign():
    return render_template('sign.html', 
                           user=current_user,
            hide_header=True,
            hide_circle_buttons=True,
                           )

@views.route('/login', methods=['GET'])
def login():
    return render_template('login.html', user=current_user,
            hide_header=True,
            hide_circle_buttons=True,)

@views.route('/kod', methods=['GET'])
def kod():
    return render_template('kod.html', user=current_user,
            hide_header=True,
            hide_circle_buttons=True,)

@views.route('/account', methods=['GET'])
@login_required
@session_required
def account():
    messages = Message.query.filter_by(recipient=current_user).order_by(Message.id.desc()).all()
    return render_template('account.html', 
                           previous_quarter = get_previous_quarter(),
                           previous_year=get_report_year(),
                           current_user=current_user, 
                           messages=messages)

@views.route('/delete_message/<int:message_id>', methods=['DELETE'])
@login_required
def delete_message(message_id):
    """Удаление сообщения текущего пользователя"""
    try:
        message = Message.query.filter_by(
            id=message_id, 
            recipient_id=current_user.id
        ).first()
        
        if not message:
            return jsonify({
                'success': False, 
                'error': 'Сообщение не найдено или у вас нет прав на его удаление'
            }), 404
        
        db.session.delete(message)
        db.session.commit()
        
        remaining_messages = Message.query.filter_by(
            recipient_id=current_user.id
        ).order_by(Message.id.desc()).all()
        
        return jsonify({
            'success': True, 
            'message': 'Сообщение удалено',
            'remaining_count': len(remaining_messages)
        })
            
    except Exception as e:
        db.session.rollback()
        print(f"Ошибка при удалении сообщения: {str(e)}")
        return jsonify({'success': False, 'error': 'Внутренняя ошибка сервера'}), 500


@views.route('/get_messages_count')
@login_required
def get_messages_count():
    """Получить количество сообщений пользователя"""
    count = Message.query.filter_by(recipient_id=current_user.id).count()
    return jsonify({'count': count})





@views.route('/profile/common', methods=['GET'])
@login_required
@session_required
def profile_common():
    count_reports = Report.query.filter_by(user_id=current_user.id).count()
    return render_template('profile_common.html', 
                        user=current_user, 
                        count_reports=count_reports,
                        active_tab = 'common'
                        )

@views.route('/profile/session', methods=['GET'])
@login_required
@session_required
def profile_session():
    current_token = request.cookies.get('session_token')
    sessions = UserSession.query.filter_by(user_id=current_user.id).all()

    current_session = None
    other_sessions = []

    for sess in sessions:
        if sess.session_token == current_token:
            current_session = sess
        else:
            other_sessions.append(sess)

    return render_template(
        'profile_session.html',
        current_session=current_session,
        other_sessions=other_sessions,
                        active_tab = 'session'
    )

@views.route('/api/organizations', methods=['GET'])
@login_required
@session_required
def get_organizations():
    page = request.args.get("page", 1, type=int)
    search_query = request.args.get("q", "", type=str)

    query = Organization.query
    if search_query:
        query = query.filter(
            db.or_(
                Organization.full_name.ilike(f"%{search_query}%"),
                Organization.okpo.ilike(f"%{search_query}%")
            )
        )

    per_page = 10
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    
    return jsonify({
        "organizations": [
            {
                "id": org.id,
                "full_name": org.full_name,
                "okpo": org.okpo,
                "ynp": org.ynp,
                "ministry": org.ministry,
            }
            for org in pagination.items
        ],
        "page": pagination.page,
        "has_next": pagination.has_next,
        "total_pages": pagination.pages,  
        "total_items": pagination.total 
    })


@views.route('/profile/password', methods=['GET'])
@login_required
@session_required
def profile_password():
    return render_template('profile_password.html', 
                    user=current_user, 
                    active_tab  = 'pass')

@views.route('/report-area', methods=['GET'])
@profile_complete
@login_required
@session_required
def report_area():
    report = Report.query.filter_by(user_id=current_user.id).order_by(Report.year.asc(), Report.quarter.asc()).all()
    version = Version_report.query.all()

    for rep in report:
        rep.versions = Version_report.query.filter_by(report_id=rep.id).all()
        for version in rep.versions:
            version.tickets = Ticket.query.filter_by(version_report_id=version.id).all()

    organization = Organization.query.filter_by(id=current_user.organization.id).first()
    open_report_id = session.pop('open_report_id', None) # номер отчета для автоматического раскрытия

    return render_template('report_area.html',
                           previous_quarter = get_previous_quarter(),
                           previous_year=get_report_year(),
                           report=report,
                           user=current_user,
                           organization=organization,
                           version=version,
                           open_report_id=open_report_id)

@views.route('/report-area/<string:report_type>/<int:id>', methods=['GET'])
@profile_complete
@login_required
@session_required
@owner_only
def report_section(report_type, id):
    current_version = Version_report.query.filter_by(id=id).first()
    current_report = Report.query.filter_by(id=current_version.report_id).first()
    report_config = {
        'fuel': {'section_number': 1, 'product_filter': DirProduct.IsFuel},
        'heat': {'section_number': 2, 'product_filter': DirProduct.IsHeat},
        'electro': {'section_number': 3, 'product_filter': DirProduct.IsElectro},
    }

    if report_type not in report_config:
        return render_template('views.not_found')

    config = report_config[report_type]
    section_number = config['section_number']
    product_filter = config['product_filter']

    dirUnit = DirUnit.query.all()
    dirProduct = DirProduct.query.filter(
        product_filter == True,
        ~DirProduct.CodeProduct.in_(['9001', '9010', '9100'])
    ).order_by(asc(DirProduct.CodeProduct)).all()

    sections = Sections.query.filter_by(id_version=current_version.id, section_number=section_number).order_by(asc(Sections.code_product)).all()
    return render_template('respondent_report.html', 
        id_report = id,
        section_number=section_number,
        sections=sections,              
        dirUnit=dirUnit,
        dirProduct=dirProduct,
        current_user=current_user, 
        current_report=current_report,
        current_version=current_version
    )

@views.route('/audit-area/<status>', methods=['GET'])
@login_required
@profile_complete
@session_required
@auditors_only
def audit_area(status):
    year_filter = request.args.get('year')
    quarter_filter = request.args.get('quarter')
    
    reports = get_reports_by_status(status, year_filter, quarter_filter)

    sent_count = len(get_reports_by_status('not_viewed', year_filter, quarter_filter))
    remarks_count = len(get_reports_by_status('remarks', year_filter, quarter_filter))
    approved_count = len(get_reports_by_status('to_download', year_filter, quarter_filter))
    delete_count = len(get_reports_by_status('to_delete', year_filter, quarter_filter))
    total_count = len(get_reports_by_status('all_reports', year_filter, quarter_filter))

    return render_template('audit_area.html',
                           current_user=current_user,
                           reports=reports,
                           year_filter=year_filter,
                           quarter_filter=quarter_filter,
                           previous_quarter=get_previous_quarter(),
                           previous_year=get_report_year(),
                           sent_count=sent_count,
                           remarks_count=remarks_count,
                           approved_count=approved_count,
                           delete_count=delete_count,
                           total_count=total_count,
                           )

@views.route('/audit-area/report/<int:id>', methods=['GET'])
@login_required
@session_required
@profile_complete
@auditors_only
def audit_report(id):
    dirUnit = DirUnit.query.filter_by().all()
    dirProduct = DirProduct.query.filter_by().all()
    current_version = Version_report.query.filter_by(id=id).first()
    current_report = Report.query.filter_by(id=current_version.report_id).first()
    tickets = Ticket.query.filter_by(version_report_id = current_version.id).all()
    sections_fuel = Sections.query.filter_by(id_version=current_version.id, section_number=1).order_by(asc(Sections.code_product)).all()
    sections_heat = Sections.query.filter_by(id_version=current_version.id, section_number=2).order_by(asc(Sections.code_product)).all()
    sections_electro = Sections.query.filter_by(id_version=current_version.id, section_number=3).order_by(asc(Sections.code_product)).all()

    return render_template('audit_report.html', 
        id_report = id,
        sections_fuel=sections_fuel,   
        sections_heat=sections_heat,  
        sections_electro=sections_electro,      
        dirUnit=dirUnit,
        dirProduct=dirProduct,
        current_user=current_user, 
        current_report=current_report,
        current_version=current_version,
        tickets=tickets
    )


@views.route('/FAQ', methods=['GET'])
def FAQ():
    return render_template('FAQ.html', 
        current_user=current_user
    )

@views.route('/FAQ/<int:id>', methods=['GET'])
def FAQ_question(id):
    if (id < 15):
        return render_template(f'Questions/{id}.html', 
            current_user=current_user
        )
    else:
        return render_template('404.html'), 404

@views.route('/news/<int:id>', methods=['GET'])
def news_post(id):
    post = News.query.filter_by(id = id).first()
    return render_template(f'Posts/1.html', 
        current_user=current_user,
        post=post
    )

@views.route('/news', methods=['GET'])
def news():
    all_news = News.query.order_by(News.created_time.desc()).all()
    return render_template('news.html', 
        current_user=current_user,
        all_news=all_news
    )

@views.route('/contacts', methods=['GET'])
def contacts():
    return render_template('contacts.html', 
        current_user=current_user
    )