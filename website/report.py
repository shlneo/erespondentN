from flask import redirect, flash, request
from flask_login import current_user
# from .email import send_email

from sqlalchemy import and_, or_
from sqlalchemy.sql import func, or_

from .models import Organization, Report, Version_report
from . import db

def cancel_sending(id):
    current_version = Version_report.query.filter_by(id=id).first()
    if current_version.status == 'Отправлен':
        current_version.status = 'Заполнение'
        db.session.commit()
        flash('Отправка отчета была отменена! Новый статус отчета - "Заполнение".', 'succes')
    else:
        flash('Отменить можно только непросмотренный отчет!', 'error')
    return redirect(request.referrer)

SPECIAL_OKPO_LISTS = { # убрать откуда номер региона : ['ОКПО']
    6: ['020133895000'],
    5: ['305144986000'],
}

EXCLUDED_OKPO_LISTS = { # добавить куда номер региона : ['ОКПО']
    5: ['020133895000'],
    6: ['305144986000']
}

def get_reports_by_status(status, year=None, quarter=None):
    def translate_status(status):
        status_map = {
            'not_viewed': 'Отправлен',
            'remarks': 'Есть замечания',
            'to_download': 'Одобрен',
            'to_delete': 'Готов к удалению'
        }
        return status_map.get(status)

    filters = []
    statuses = [
        'Отправлен',
        'Есть замечания',
        'Одобрен',
        'Готов к удалению'
    ]
    
    if year:
        filters.append(Report.year == year)
    if quarter:
        filters.append(Report.quarter == quarter)
    
    user_type = current_user.type
    okpo_digit = str(current_user.organization.okpo)[0]
    # current_app.logger.info(f"Первая цифра OKPO: {okpo_digit}")

    special_condition = False
    if okpo_digit.isdigit() and int(okpo_digit) in SPECIAL_OKPO_LISTS:
        special_condition = True
    
    excluded_condition = False
    if okpo_digit.isdigit() and int(okpo_digit) in EXCLUDED_OKPO_LISTS:
        excluded_condition = True

    if user_type == "Администратор" or (user_type == "Аудитор" and okpo_digit == "8"):
        if status == 'all_reports':
            return Report.query.join(Version_report).filter(
                or_(*[Version_report.status == s for s in statuses]),
                *filters
            ).order_by().all() 
        else:
            trans_status = translate_status(status)
            if trans_status:
                return Report.query.join(Version_report).filter(
                    Version_report.status == trans_status,
                    *filters
                ).order_by().all()
            else:
                return []
    else:
        if status == 'all_reports':
            query = Report.query.join(Version_report).join(Organization)
            
            if special_condition and excluded_condition:
                return query.filter(
                    or_(
                        and_(
                            or_(*[Version_report.status == s for s in statuses]),
                            func.substr(Organization.okpo, func.length(Organization.okpo) - 3, 1) == okpo_digit
                        ),
                        and_(
                            or_(*[Version_report.status == s for s in statuses]),
                            Organization.okpo.in_(SPECIAL_OKPO_LISTS[int(okpo_digit)])
                        )
                    ),
                    ~Organization.okpo.in_(EXCLUDED_OKPO_LISTS[int(okpo_digit)]),
                    *filters
                ).order_by().all()
            elif special_condition:
                return query.filter(
                    or_(
                        and_(
                            or_(*[Version_report.status == s for s in statuses]),
                            func.substr(Organization.okpo, func.length(Organization.okpo) - 3, 1) == okpo_digit
                        ),
                        and_(
                            or_(*[Version_report.status == s for s in statuses]),
                            Organization.okpo.in_(SPECIAL_OKPO_LISTS[int(okpo_digit)])
                        )
                    ),
                    *filters
                ).order_by().all()
            elif excluded_condition:
                return query.filter(
                    or_(*[Version_report.status == s for s in statuses]),
                    *filters,
                    func.substr(Organization.okpo, func.length(Organization.okpo) - 3, 1) == okpo_digit,
                    ~Organization.okpo.in_(EXCLUDED_OKPO_LISTS[int(okpo_digit)])
                ).order_by().all()
            else:
                return query.filter(
                    or_(*[Version_report.status == s for s in statuses]),
                    *filters,
                    func.substr(Organization.okpo, func.length(Organization.okpo) - 3, 1) == okpo_digit
                ).order_by().all()
        else:
            trans_status = translate_status(status)
            if trans_status:
                query = Report.query.join(Version_report).join(Organization)
                
                if special_condition and excluded_condition:
                    return query.filter(
                        or_(
                            and_(
                                Version_report.status == trans_status,
                                func.substr(Organization.okpo, func.length(Organization.okpo) - 3, 1) == okpo_digit
                            ),
                            and_(
                                Version_report.status == trans_status,
                                Organization.okpo.in_(SPECIAL_OKPO_LISTS[int(okpo_digit)])
                            )
                        ),
                        ~Organization.okpo.in_(EXCLUDED_OKPO_LISTS[int(okpo_digit)]),
                        *filters
                    ).order_by().all()
                elif special_condition:
                    return query.filter(
                        or_(
                            and_(
                                Version_report.status == trans_status,
                                func.substr(Organization.okpo, func.length(Organization.okpo) - 3, 1) == okpo_digit
                            ),
                            and_(
                                Version_report.status == trans_status,
                                Organization.okpo.in_(SPECIAL_OKPO_LISTS[int(okpo_digit)])
                            )
                        ),
                        *filters
                    ).order_by().all()
                elif excluded_condition:
                    return query.filter(
                        Version_report.status == trans_status,
                        *filters,
                        func.substr(Organization.okpo, func.length(Organization.okpo) - 3, 1) == okpo_digit,
                        ~Organization.okpo.in_(EXCLUDED_OKPO_LISTS[int(okpo_digit)])
                    ).order_by().all()
                else:
                    return query.filter(
                        Version_report.status == trans_status,
                        *filters,
                        func.substr(Organization.okpo, func.length(Organization.okpo) - 3, 1) == okpo_digit
                    ).order_by().all()
            else:
                return []