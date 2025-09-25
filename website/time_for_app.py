from datetime import datetime, timedelta

def current_utc_time():
    return datetime.utcnow() + timedelta(hours=3)

def get_previous_quarter():
    current_time = current_utc_time()
    current_month = current_time.month
    current_quarter = (current_month - 1) // 3 + 1

    if current_quarter == 1:
        return 4
    else:
        return current_quarter - 1

def get_report_year():
    current_time = current_utc_time()
    current_month = current_time.month
    current_quarter = (current_month - 1) // 3 + 1

    if current_quarter == 1:
        return current_time.year - 1
    else:
        return current_time.year