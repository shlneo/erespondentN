from . import db
from flask_login import UserMixin
from datetime import datetime, timedelta
from sqlalchemy.orm import relationship, backref
from sqlalchemy import Numeric
import uuid
from .time import current_utc_time

class Message(db.Model):
    __tablename__ = 'message'
    id = db.Column(db.Integer, primary_key=True)
    create_time = db.Column(db.DateTime, default=current_utc_time)
    sender_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    recipient_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    text = db.Column(db.String(500))

    sender = db.relationship('User', foreign_keys=[sender_id], backref=backref('sent_messages', lazy=True, cascade="all, delete-orphan"))
    recipient = db.relationship('User', foreign_keys=[recipient_id], backref=backref('received_messages', lazy=True, cascade="all, delete-orphan"))

class UserSession(db.Model):
    __tablename__ = 'user_session' 
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    session_token = db.Column(db.String(36), unique=True, nullable=False, default=lambda: str(uuid.uuid4()))
    device_name = db.Column(db.String(64), default='None')
    device_app = db.Column(db.String(64), default='None')
    device_place = db.Column(db.String(64), default='None')
    ip_address = db.Column(db.String(45), default='None')
    created_at = db.Column(db.DateTime, default=current_utc_time)
    last_active = db.Column(db.DateTime, default=current_utc_time)
    user = db.relationship('User', backref=backref('sessions', lazy=True, cascade="all, delete-orphan"))

class User(db.Model, UserMixin):
    __tablename__ = 'user'
    id = db.Column(db.Integer, primary_key=True)
    type = db.Column(db.String(13), default='Респондент')
    email = db.Column(db.String(), unique=True)
    fio = db.Column(db.String(100))
    telephone = db.Column(db.String())
    password = db.Column(db.String())
    last_active = db.Column(db.DateTime, nullable=False, default=current_utc_time)
    reports = db.relationship('Report', backref='user', lazy=True, cascade="all, delete-orphan")
    organization_id = db.Column(db.Integer, db.ForeignKey('organization.id'))
    organization = db.relationship('Organization', backref='users')

class Organization(db.Model):
    __tablename__ = 'organization'
    id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String())
    okpo = db.Column(db.String, unique=True)
    ynp = db.Column(db.String(), nullable=True)
    # ministry_id = db.Column(db.Integer, db.ForeignKey('ministry.id'), nullable=True)
    ministry = db.Column(db.String()) 
    is_active = db.Column(db.Boolean, default=True)
    reports = db.relationship('Report', backref='organization', lazy=True)

    # @property
    # def ministry(self):
    #     return self.ministry_rel.name if self.ministry_rel else None


# class Ministry(db.Model):
#     __tablename__ = 'ministry'
#     id = db.Column(db.Integer, primary_key=True)
#     name = db.Column(db.String(200), nullable=False, unique=True)
#     code = db.Column(db.String(50), nullable=True)
    
#     # Связь с организациями
#     organizations = db.relationship('Organization', backref='ministry_rel', lazy=True)

class Report(db.Model):
    __tablename__ = 'report'
    id = db.Column(db.Integer, primary_key=True)
    okpo = db.Column(db.String, default=None)
    org_id = db.Column(db.Integer, db.ForeignKey('organization.id'))  
    year = db.Column(db.Integer)
    quarter = db.Column(db.Integer)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))  
    time_of_receipt = db.Column(db.Date) 
    versions = db.relationship('Version_report', backref='report', cascade="all, delete-orphan")

class Version_report(db.Model):
    __tablename__ = 'version_report'
    id = db.Column(db.Integer, primary_key=True)
    begin_time = db.Column(db.Date, default=current_utc_time)
    change_time = db.Column(db.Date)
    sent_time = db.Column(db.Date)
    audit_time = db.Column(db.Date)
    status = db.Column(db.String(20))
    fio = db.Column(db.String(100))
    telephone = db.Column(db.String())    
    email = db.Column(db.String())
    hasNot = db.Column(db.Boolean, default=False)
    report_id = db.Column(db.Integer, db.ForeignKey('report.id'))
    sections = db.relationship('Sections', backref='version_report', lazy=True, cascade="all, delete-orphan")
    tickets = db.relationship('Ticket', back_populates='version_report', lazy=True, cascade="all, delete-orphan")

class Ticket(db.Model):
    __tablename__ = 'ticket'
    id = db.Column(db.Integer, primary_key=True)
    begin_time = db.Column(db.Date, default=current_utc_time)
    luck = db.Column(db.Boolean, default=False)
    note = db.Column(db.String(500))
    version_report_id = db.Column(db.Integer, db.ForeignKey('version_report.id'))

    version_report = db.relationship("Version_report", back_populates="tickets")

class DirUnit(db.Model):
    __tablename__ = 'DirUnit'
    IdUnit = db.Column(db.Integer, primary_key=True)
    CodeUnit = db.Column(db.String(400))
    NameUnit = db.Column(db.String(400))

    def __repr__(self):
        return str(self.CodeUnit)

class DirProduct(db.Model):
    __tablename__ = 'DirProduct'
    id = db.Column(db.Integer, primary_key=True)
    CodeProduct = db.Column(db.String(400))
    NameProduct = db.Column(db.String(400))
    IsFuel = db.Column(db.Boolean)
    IsHeat = db.Column(db.Boolean) 
    IsElectro = db.Column(db.Boolean)
    IdUnit = db.Column(db.Integer, db.ForeignKey('DirUnit.IdUnit'))
    DateStart = db.Column(db.Date)
    DateEnd = db.Column(db.Date)
    unit = relationship("DirUnit", foreign_keys=[IdUnit], backref="products")

    def __repr__(self):
        return str(self.NameProduct)

class Sections(db.Model):
    __tablename__ = 'sections'
    id = db.Column(db.Integer, primary_key=True) 
    id_version = db.Column(db.Integer, db.ForeignKey('version_report.id'))
    id_product = db.Column(db.Integer, db.ForeignKey('DirProduct.id'))
    code_product = db.Column(db.String)
    section_number = db.Column(db.Integer)
    Oked = db.Column(db.String(20))
    produced = db.Column(Numeric(scale=2))
    Consumed_Quota = db.Column(Numeric(scale=2))
    Consumed_Fact = db.Column(Numeric(scale=2))
    Consumed_Total_Quota = db.Column(Numeric(scale=2))
    Consumed_Total_Fact = db.Column(Numeric(scale=2))
    total_differents = db.Column(Numeric(scale=2))
    note = db.Column(db.String(200))
    product = relationship("DirProduct", foreign_keys=[id_product], backref="sections")

class News(db.Model):
    __tablename__ = 'news'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100))
    text = db.Column(db.String(4000))
    img_name = db.Column(db.String(20))
    created_time = db.Column(db.DateTime, nullable=False, default=current_utc_time)