from flask import Blueprint, request, flash, redirect, Response
from flask_login import login_required, current_user
from functools import wraps
import io
import zipfile
from tempfile import NamedTemporaryFile
import dbf
import pandas as pd
from sqlalchemy import func, String
from sqlalchemy.orm import joinedload
from . import db
from .models import Report, Version_report, Sections

export = Blueprint('export', __name__)

def get_approved_versions(form_data):
    """Получает одобренные версии отчетов по фильтрам, выбирая последнюю версию для каждого отчета"""
    year_filter = form_data.get('year_filter')
    quarter_filter = form_data.get('quarter_filter')

    filters = []
    if year_filter:
        filters.append(Report.year == year_filter)
    if quarter_filter:
        filters.append(Report.quarter == quarter_filter)

    current_user_type = current_user.type
    okpo_digit = str(current_user.organization.okpo)[-4]

    subquery = db.session.query(
        Report.okpo,
        Report.year,
        Report.quarter,
        func.max(Version_report.sent_time).label('max_sent_time')
    ).join(
        Version_report, Version_report.report_id == Report.id
    ).filter(
        Version_report.status == "Одобрен",
        *filters
    ).group_by(
        Report.okpo, Report.year, Report.quarter
    ).subquery()

    query = Version_report.query.options(
        joinedload(Version_report.report),
        joinedload(Version_report.sections).joinedload(Sections.product)
    ).join(Report).join(
        subquery,
        db.and_(
            Report.okpo == subquery.c.okpo,
            Report.year == subquery.c.year,
            Report.quarter == subquery.c.quarter,
            Version_report.sent_time == subquery.c.max_sent_time
        )
    ).filter(
        Version_report.status == "Одобрен",
        *filters
    )

    if not (current_user_type == "Администратор" or (current_user_type == "Аудитор" and okpo_digit == "8")):
        query = query.filter(
            func.substr(func.cast(Report.okpo, String), func.length(Report.okpo) - 3, 1) == okpo_digit
        )

    return query.all()

def create_dbf_zip(versions):
    """Создает ZIP-архив с DBF-файлами"""
    zip_buffer = io.BytesIO()
    
    with zipfile.ZipFile(zip_buffer, 'a', zipfile.ZIP_DEFLATED) as zip_file:
        for version in versions:
            dbf_data = prepare_dbf_data(version)
            dbf_content = create_dbf_file(dbf_data, version.report)
            zip_file.writestr(
                f'{version.report.okpo}_{version.report.year}_{version.report.quarter}_{version.report.id}.dbf',
                dbf_content
            )
    
    zip_buffer.seek(0)
    return zip_buffer

def prepare_dbf_data(version):
    """Подготавливает данные для DBF-файла"""
    if not version or not version.report:
        return pd.DataFrame()
    
    report = version.report
    sections = version.sections
    
    data = []
    
    for section in sections:
        product = getattr(section, 'product', None)
        row = create_dbf_row(report, version, section, product)
        data.append(row)
    
    if not data:
        return pd.DataFrame()
    
    df = pd.DataFrame(data)
    df = sort_and_format_dataframe(df)
    return df

def create_dbf_row(report, version, section, product):
    """Создает строку данных для DBF"""
    unit_code = str(product.unit.CodeUnit) if (product and hasattr(product, 'unit') and product.unit) else ''
    code_product_str = str(section.code_product) if section.code_product else ''
    
    return {
        'YEAR_': str(report.year) if report.year is not None else '',
        'KVARTAL': str(report.quarter) if report.quarter is not None else '',
        'IDPREDPR': str(report.okpo) if report.okpo is not None else '',
        'DATERECEIV': version.sent_time.strftime('%d.%m.%Y') if version.sent_time else '',
        'EXCEED': '0,000',
        'SECTIONNUM': str(section.section_number) if section.section_number is not None else '',
        'CODEPROD': code_product_str,
        'OKED': str(section.Oked) if section.Oked is not None else '',
        'PRODUCED': format_number(section.produced), 
        'CONSUMEDQ': format_number(section.Consumed_Quota),
        'CONSUMEDF': format_number(section.Consumed_Fact),
        'CONSUMEDQT': format_number(section.Consumed_Total_Quota),
        'CONSUMEDFT': format_number(section.Consumed_Total_Fact),
        'COMMENT1': safe_encode_cp866(str(section.note), max_length=200) if section.note is not None else '',
        'COMMENT2': '',
        'NAMEPROD': safe_encode_cp866(product.NameProduct, max_length=254) if product and hasattr(product, 'NameProduct') and product.NameProduct else '',
        'CODEUNIT': unit_code[:20] if unit_code else '',
        'NAMEORG': safe_encode_cp866(report.organization.full_name, max_length=254) if report.organization.full_name is not None else '',
        '_SECTIONNUM': int(section.section_number) if section.section_number else 0,
        '_CODEPROD': int(section.code_product) if section.code_product and section.code_product.isdigit() else 0,
        '_SORT_PRIORITY': {'9001': 0, '9010': 1, '9100': 2}.get(code_product_str, 3),
    }

def sort_and_format_dataframe(df):
    """Сортирует и форматирует DataFrame перед экспортом"""
    df = df.sort_values(by=['_SECTIONNUM', '_SORT_PRIORITY', '_CODEPROD'])
    df = df.drop(columns=['_SECTIONNUM', '_CODEPROD', '_SORT_PRIORITY'])
    df['INDX'] = range(1, len(df) + 1)
    df['INDX'] = df['INDX'].astype(str)
    return df[['INDX'] + [col for col in df.columns if col != 'INDX']]

def create_dbf_file(df, report):
    """Создает DBF-файл из DataFrame"""
    with NamedTemporaryFile(delete=False, suffix='.dbf') as temp_file:
        temp_filename = temp_file.name
        
        table = dbf.Table(
            temp_filename,
            'INDX C(10); YEAR_ C(20); KVARTAL C(20); IDPREDPR C(20); DATERECEIV C(20); '
            'EXCEED C(20); SECTIONNUM C(20); CODEPROD C(20); OKED C(20); PRODUCED C(20); '
            'CONSUMEDQ C(20); CONSUMEDF C(20); CONSUMEDQT C(20); CONSUMEDFT C(20); '
            'COMMENT1 C(200); COMMENT2 C(200); NAMEPROD C(200); CODEUNIT C(20); NAMEORG C(254); ',
            codepage='cp866'
        )
        
        table.open(mode=dbf.READ_WRITE)
        try:
            for _, row in df.iterrows():
                row_dict = row.to_dict()
                for key, value in row_dict.items():
                    if pd.isna(value) or value is None:
                        row_dict[key] = ''
                    elif isinstance(value, str):
                        try:
                            value.encode('cp866', 'strict')
                        except UnicodeEncodeError:
                            row_dict[key] = safe_encode_cp866(value)
                
                table.append(row_dict)
        finally:
            table.close()
        
        with open(temp_filename, 'rb') as f:
            return f.read()

def format_number(value, decimal_places=None):
    """Форматирует число с запятой в качестве десятичного разделителя"""
    if value is None or value == '':
        return '0'
    
    try:
        str_value = str(value).strip()
        str_value = str_value.replace('.', ',').replace(',', '.', 1) if '.' in str_value and ',' in str_value else str_value
        str_value = str_value.replace(',', '.')
        
        num = float(str_value)
        if decimal_places is None:
            if '.' in str_value:
                decimal_places = len(str_value.split('.')[1])
            else:
                decimal_places = 0
        
        if decimal_places == 0:
            return f"{int(round(num))}"
        else:
            formatted = f"{num:.{decimal_places}f}"
            return formatted.replace('.', ',')
            
    except (ValueError, TypeError):
        return '0,000'

def safe_encode_cp866(text, max_length=None):
    """Безопасное кодирование текста в CP866 с заменой проблемных символов"""
    if text is None:
        return ""
    
    text = str(text)
    
    replacements = {
        '\xb3': '3',      # ³ -> 3
        '\xb2': '2',      # ² -> 2
        '\xb9': '1',      # ¹ -> 1
        '\xa3': 'фунт',   # £ -> фунт
        '\xa7': 'S',      # § -> S
        '\xb5': 'мк',     # µ -> мк
        '\xb0': 'град',   # ° -> град
        '\xb1': '+/-',    # ± -> +/-
        '\xf7': '/',      # ÷ -> /
        '\xd7': 'x',      # × -> x
        '\xae': '(R)',    # ® -> (R)
        '\xa9': '(c)',    # © -> (c)
        '\u2122': '(TM)', # ™ -> (TM)
        '\u20ac': 'EUR',  # € -> EUR
        '\u2013': '-',    # – -> -
        '\u2014': '-',    # — -> -
        '\u2018': "'",    # ‘ -> '
        '\u2019': "'",    # ’ -> '
        '\u201c': '"',    # " -> "
        '\u201d': '"',    # " -> "
        '\u2026': '...',  # … -> ...
        '\u2022': '*',    # • -> *
        '\xa0': ' ',      # неразрывный пробел -> пробел
        '\xad': '',       # мягкий перенос
        '\x96': '-',      # – -> -
        '\x97': '-',      # — -> -
        '\x84': '"',      # „ -> "
        '\x93': '"',      # " -> "
        '\x94': '"',      # " -> "
        '\x85': '...',    # … -> ...
    }
    
    for old, new in replacements.items():
        text = text.replace(old, new)
    
    if max_length and len(text) > max_length:
        text = text[:max_length]
    
    try:
        encoded = text.encode('cp866', 'strict')
    except UnicodeEncodeError:

        encoded = text.encode('cp866', 'replace')
    
    return encoded.decode('cp866')

def send_zip_file(zip_buffer):
    """Отправляет ZIP-файл клиенту"""
    return Response(
        zip_buffer,
        mimetype='application/zip',
        headers={"Content-Disposition": "attachment;filename=reports_DBF.zip"}
    )