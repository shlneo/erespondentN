from flask_admin.contrib.sqla import ModelView
from flask import redirect, url_for
from flask_login import current_user

class SessionView(ModelView):
    column_display_pk = True
    column_list = ['id', 'user_id', 'session_token', 'device_name', 'device_app', 'device_place', 'ip_address', 'created_at', 'last_active', 'user']
    
    column_default_sort = ('id', True)
    
    column_sortable_list = ('id', 'user_id', 'session_token', 'device_name', 'device_app', 'device_place', 'ip_address', 'created_at', 'last_active', 'user')
    
    
    def is_accessible(self):
        return current_user.is_authenticated and current_user.type == "Администратор"

    def inaccessible_callback(self, name, **kwargs):
        return redirect(url_for('views.login'))