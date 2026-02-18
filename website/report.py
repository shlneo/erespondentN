from flask import flash, redirect, request
from .models import (
    Version_report, Sections
)
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


from collections import defaultdict

def swap_products_for_same_section():

    groups = defaultdict(list)
    sections = Sections.query.all()
    
    for section in sections:
        key = (section.section_number, section.id_version)
        groups[key].append(section)
    
    for key, group_sections in groups.items():
        if len(group_sections) > 1:
            print(f"Обрабатываю группу: section_number={key[0]}, id_version={key[1]}, записей: {len(group_sections)}")

            product_ids = [section.id_product for section in group_sections]
            
            for i, section in enumerate(group_sections):
                next_id = product_ids[(i + 1) % len(product_ids)]
                section.id_product = next_id
                print(f"  Запись {section.id}: id_product изменен на {next_id}")
    
    db.session.commit()
    print("Все изменения сохранены")