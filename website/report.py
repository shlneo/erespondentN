from datetime import datetime
from flask import Blueprint, current_app, render_template, redirect, url_for, flash, request, jsonify, session
from flask_login import current_user, login_required
from .email import send_email
from website.sessions import session_required

from sqlalchemy import and_, asc, case, or_, desc
from functools import wraps
from sqlalchemy.sql import func, or_
from sqlalchemy.types import String
from collections import defaultdict

from .time import get_previous_quarter, get_report_year, current_utc_time

from .models import User, Organization, Report, Version_report, Ticket, DirUnit, DirProduct, Sections, Message, News
from . import db

def cancel_sending(id):
    current_version = Version_report.query.filter_by(id=id).first()
    if current_version.status == 'Отправлен':
        current_version.status = 'Заполнение'
        # current_version.sent_time = None
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
            ).order_by(Report.year.asc(), Report.quarter.asc(), Version_report.sent_time.desc()).all() 
        else:
            trans_status = translate_status(status)
            if trans_status:
                return Report.query.join(Version_report).filter(
                    Version_report.status == trans_status,
                    *filters
                ).order_by(Report.year.asc(), Report.quarter.asc(), Version_report.sent_time.desc()).all()
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
                ).order_by(Report.year.asc(), Report.quarter.asc(), Version_report.sent_time.desc()).all()
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
                ).order_by(Report.year.asc(), Report.quarter.asc(), Version_report.sent_time.desc()).all()
            elif excluded_condition:
                return query.filter(
                    or_(*[Version_report.status == s for s in statuses]),
                    *filters,
                    func.substr(Organization.okpo, func.length(Organization.okpo) - 3, 1) == okpo_digit,
                    ~Organization.okpo.in_(EXCLUDED_OKPO_LISTS[int(okpo_digit)])
                ).order_by(Report.year.asc(), Report.quarter.asc(), Version_report.sent_time.desc()).all()
            else:
                return query.filter(
                    or_(*[Version_report.status == s for s in statuses]),
                    *filters,
                    func.substr(Organization.okpo, func.length(Organization.okpo) - 3, 1) == okpo_digit
                ).order_by(Report.year.asc(), Report.quarter.asc(), Version_report.sent_time.desc()).all()
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
                    ).order_by(Report.year.asc(), Report.quarter.asc(), Version_report.sent_time.desc()).all()
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
                    ).order_by(Report.year.asc(), Report.quarter.asc(), Version_report.sent_time.desc()).all()
                elif excluded_condition:
                    return query.filter(
                        Version_report.status == trans_status,
                        *filters,
                        func.substr(Organization.okpo, func.length(Organization.okpo) - 3, 1) == okpo_digit,
                        ~Organization.okpo.in_(EXCLUDED_OKPO_LISTS[int(okpo_digit)])
                    ).order_by(Report.year.asc(), Report.quarter.asc(), Version_report.sent_time.desc()).all()
                else:
                    return query.filter(
                        Version_report.status == trans_status,
                        *filters,
                        func.substr(Organization.okpo, func.length(Organization.okpo) - 3, 1) == okpo_digit
                    ).order_by(Report.year.asc(), Report.quarter.asc(), Version_report.sent_time.desc()).all()
            else:
                return []


# def swap_products_for_same_section():
#     groups = defaultdict(list)
#     sections = Sections.query.all()
    
#     for section in sections:
#         key = (section.section_number, section.id_version)
#         groups[key].append(section)
    
#     for key, group_sections in groups.items():
#         if len(group_sections) > 1:
#             print(f"Обрабатываю группу: section_number={key[0]}, id_version={key[1]}, записей: {len(group_sections)}")

#             product_ids = [section.id_product for section in group_sections]
            
#             for i, section in enumerate(group_sections):
#                 next_id = product_ids[(i + 1) % len(product_ids)]
#                 section.id_product = next_id
#                 print(f"  Запись {section.id}: id_product изменен на {next_id}")
    
#     db.session.commit()
#     print("Все изменения сохранены")