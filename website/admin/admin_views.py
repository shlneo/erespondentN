from flask_admin import AdminIndexView, expose
from flask_login import current_user
from ..models import User, Organization, Report, Version_report, Ticket, DirUnit, DirProduct, Sections, Message, News, current_utc_time
from sqlalchemy.exc import SQLAlchemyError
from flask_admin.contrib.sqla import ModelView
import os
import tempfile
from flask import flash, redirect, request, url_for, send_file, current_app
from functools import wraps
import shutil
from datetime import datetime, timedelta
from collections import defaultdict
from .. import db

def admin_only(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if current_user.type != 'Администратор':
            flash('Недостаточно прав для входа в админ-панель', 'error')
            return redirect(url_for('views.beginPage'))   
        return f(*args, **kwargs)
    return decorated_function

class MyMainView(AdminIndexView):
    @expose('/')
    def admin_stats(self):
        if not current_user.is_authenticated:
            return redirect(url_for('auth.login')) 

        if not self.is_accessible():
            return redirect(url_for('views.catalog'))

        try:
            user_data = User.query.count()
            dirUnit_data = DirUnit.query.count()
            organization_data = Organization.query.count()
            report_data = Report.query.count()
            version_report_data = Version_report.query.count()
            dirProduct_data = DirProduct.query.count()
            sections_data = Sections.query.count()
            ticket_data = Ticket.query.count()
            now = current_utc_time()
            threshold = now - timedelta(minutes=3)

        except SQLAlchemyError:
            user_data = dirUnit_data = organization_data = report_data = version_report_data = dirProduct_data = sections_data = ticket_data = 0 # Если ошибка БД, данные по нулям

        return self.render('admin/stats.html', 
                        user_data=user_data,
                        dirUnit_data=dirUnit_data,
                        organization_data=organization_data,
                        report_data=report_data,
                        version_report_data=version_report_data,
                        dirProduct_data=dirProduct_data,
                        sections_data=sections_data,
                        ticket_data=ticket_data
                           )
    # @admin_only
    # @expose('/backup')
    # def backup_database(self):
    #     try:
    #         database_path = current_app.config['SQLALCHEMY_DATABASE_URI'].replace('sqlite:///', '')

    #         if not os.path.exists(database_path):
    #             flash('Файл базы данных не найден.', 'error')
    #             return redirect(request.referrer or url_for('admin.index'))

    #         with tempfile.NamedTemporaryFile(delete=False, suffix='.sqlite') as temp_file:
    #             shutil.copy2(database_path, temp_file.name)
    #             temp_file_path = temp_file.name

    #         flash('Резервная копия базы данных успешно создана.', 'success')
    #         return send_file(temp_file_path, as_attachment=True, download_name=f"backup_{current_utc_time().strftime('%Y%m%d_%H%M%S')}.sqlite")

    #     except Exception as e:
    #         flash(f'Ошибка при создании резервной копии базы данных: {str(e)}', 'error')
    #         return redirect(request.referrer or url_for('admin.index'))
        
    # @expose('/epic_faeil/', methods=['GET', 'POST'])
    # def epic_faeil(self):
    #     """Endpoint для замены конкретных code_product 9100 и 9001"""
    #     try:
    #         changes_made = False
            

    #         target_pairs = Sections.query.filter(
    #             Sections.id_version.isnot(None),
    #             Sections.section_number.in_([1, 2, 3]),
    #             Sections.code_product.in_(['9100', '9001'])
    #         ).all()
            

    #         from collections import defaultdict
    #         groups = defaultdict(list)
            
    #         for section in target_pairs:
    #             key = (section.id_version, section.section_number)
    #             groups[key].append(section)
            

    #         for key, sections in groups.items():
    #             id_version, section_number = key
                
    #             if len(sections) == 2:
    #                 product_9100 = next((s for s in sections if s.code_product == '9100'), None)
    #                 product_9001 = next((s for s in sections if s.code_product == '9001'), None)
                    
    #                 if product_9100 and product_9001:
    #                     old_id_9100 = product_9100.id_product
    #                     old_id_9001 = product_9001.id_product
                        
    #                     product_9100.id_product = old_id_9001
    #                     product_9001.id_product = old_id_9100
                        
    #                     changes_made = True
    #                     print(f"Заменены: version={id_version}, section={section_number}")
            
    #         if changes_made:
    #             db.session.commit()
    #             flash('Успешно заменены id_product для пар 9100/9001 в sections 1-3', 'success')
    #         else:
    #             flash('Не найдено пар 9100/9001 для замены', 'info')
                
    #     except Exception as e:
    #         db.session.rollback()
    #         flash(f'Ошибка: {str(e)}', 'error')
        
    #     return redirect('/admin/')()










    def is_accessible(self):
        return current_user.is_authenticated and getattr(current_user, 'type', '') == "Администратор"

    def inaccessible_callback(self, name, **kwargs):
        if not current_user.is_authenticated:
            return redirect(url_for('auth.login'))
        return redirect(url_for('views.catalog'))


class BaseAdminView(ModelView):
    def is_accessible(self):
        return current_user.is_authenticated and getattr(current_user, 'type', '') == "Администратор" 

    def inaccessible_callback(self, name, **kwargs):
        return redirect(url_for('auth.login'))  
    

