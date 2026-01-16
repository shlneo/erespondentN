import smtplib
import os
import time
import threading
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from queue import Queue, Empty
from threading import Thread, Lock
import atexit
from contextlib import contextmanager
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

MAX_WORKERS = 2
EMAILS_PER_MINUTE = 20
SMTP_TIMEOUT = 15

class SimpleSMTPManager:
    def __init__(self):
        self.sender = os.getenv('EMAILNAME')
        self.password = os.getenv('EMAILPASS')
        self.last_sent_time = 0
        self.min_interval = 60.0 / EMAILS_PER_MINUTE
        self.lock = Lock()
        
        if not self.sender or not self.password:
            logger.error("Email credentials not configured!")
    
    def create_connection(self):
        """Создать новое SMTP соединение"""
        try:
            if not self.sender or not self.password:
                raise ValueError("Email credentials not set")
            
            server = smtplib.SMTP('smtp.gmail.com', 587, timeout=SMTP_TIMEOUT)
            server.starttls()
            server.login(self.sender, self.password)
            
            logger.info("SMTP connection created")
            return server
            
        except Exception as e:
            logger.error(f"Failed to create SMTP connection: {e}")
            return None
    
    def send_email_direct(self, recipient_email, html_content):
        """Прямая отправка одного email"""
        with self.lock:
            # Rate limiting
            current_time = time.time()
            time_since_last = current_time - self.last_sent_time
            if time_since_last < self.min_interval:
                sleep_time = self.min_interval - time_since_last
                logger.info(f"Rate limiting: sleeping {sleep_time:.2f}s")
                time.sleep(sleep_time)
            
            conn = self.create_connection()
            if not conn:
                return False, "Could not create SMTP connection"
            
            try:
                msg = MIMEMultipart()
                msg["From"] = self.sender
                msg["To"] = recipient_email
                msg["Subject"] = "Уведомление от ErespondentN"
                msg.attach(MIMEText(html_content, "html"))
                
                conn.sendmail(self.sender, recipient_email, msg.as_string())
                self.last_sent_time = time.time()
                
                return True, "Email sent"
                
            except Exception as e:
                return False, f"Send error: {e}"
            finally:
                try:
                    conn.quit()
                except:
                    pass

def generate_html_template(message_body, email_type, location=None, 
                          device=None, browser=None, ip_address=None):
    html_template = f"""
        <!DOCTYPE html>
        <html lang="ru">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap" rel="stylesheet">
        </head>
        <body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f3f3; margin: 0; padding: 0; line-height: 1.6;">
            <div style="text-align: center; margin-bottom: 0;">
                <h1 style="color: #f3f3f3; font-family: 'Inter', sans-serif; font-size: 25px; font-weight: bold; margin: 0; padding: 0;">ErespondentN</h1>
            </div>
            <div style="max-width: 600px; margin: 20px auto; background-color: #ffffff; margin-top: 20px; overflow: hidden; border-radius: 8px; box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);">
                <div style="padding: 20px; color: #333333;">
        """

    if email_type == "activation_kod":
        html_template += f"""
                <p style="margin: 0 0 16px 0; font-size: 16px; color: #2c3e50;">Здравствуйте!</p>
                <p style="margin: 0 0 20px 0; font-size: 16px; color: #2c3e50;">Кто-то пытается войти в ErespondentN используя вашу электронную почту.</p>
        """
        
        if any([location, device, browser, ip_address]):
            html_template += f"""
                <div style="background-color: #f9f9f9; padding: 15px 20px; border-left: 4px solid #028dff; margin: 20px 0; border-radius: 4px;">
                    {f'<p style="margin: 8px 0; font-size: 15px; color: #333;"><strong style="color: #2c3e50;">Расположение:</strong> {location}</p>' if location else ''}
                    {f'<p style="margin: 8px 0; font-size: 15px; color: #333;"><strong style="color: #2c3e50;">Устройство:</strong> {device}</p>' if device else ''}
                    {f'<p style="margin: 8px 0; font-size: 15px; color: #333;"><strong style="color: #2c3e50;">Браузер:</strong> {browser}</p>' if browser else ''}
                    {f'<p style="margin: 8px 0; font-size: 15px; color: #333;"><strong style="color: #2c3e50;">IP-адрес:</strong> {ip_address}</p>' if ip_address else ''}
                </div>
        """
        
        html_template += f"""
                <p style="margin: 20px 0 15px 0; font-size: 16px; color: #2c3e50;">Чтобы активировать вход, введите следующий код:</p>
                <div style="text-align: center; font-size: 32px; font-weight: bold; background-color: #f9f9f9; padding: 20px; border: 1px solid #dddddd; border-radius: 5px; margin: 20px 0; letter-spacing: 5px; color: #2c3e50;">
                    {message_body}
                </div>
                <p style="margin: 15px 0 0 0; font-size: 14px; color: #666666; font-style: italic;">Обратите внимание, что срок действия этого кода истекает через 15 минут.</p>
        """
    
    elif email_type == "new_pass":
        html_template += f"""
                <p style="margin: 0 0 16px 0; font-size: 16px; color: #2c3e50;">Здравствуйте!</p>
                <p style="margin: 0 0 20px 0; font-size: 16px; color: #2c3e50;">Кто-то пытается изменить пароль в ErespondentN используя вашу электронную почту.</p>
        """
        
        if any([location, device, browser, ip_address]):
            html_template += f"""
                <div style="background-color: #f9f9f9; padding: 15px 20px; border-left: 4px solid #028dff; margin: 20px 0; border-radius: 4px;">
                    {f'<p style="margin: 8px 0; font-size: 15px; color: #333;"><strong style="color: #2c3e50;">Расположение:</strong> {location}</p>' if location else ''}
                    {f'<p style="margin: 8px 0; font-size: 15px; color: #333;"><strong style="color: #2c3e50;">Устройство:</strong> {device}</p>' if device else ''}
                    {f'<p style="margin: 8px 0; font-size: 15px; color: #333;"><strong style="color: #2c3e50;">Браузер:</strong> {browser}</p>' if browser else ''}
                    {f'<p style="margin: 8px 0; font-size: 15px; color: #333;"><strong style="color: #2c3e50;">IP-адрес:</strong> {ip_address}</p>' if ip_address else ''}
                </div>
        """
        
        html_template += f"""
                <p style="margin: 20px 0 15px 0; font-size: 16px; color: #2c3e50;">Вот ваш новый пароль:</p>
                <div style="text-align: center; font-size: 32px; font-weight: bold; background-color: #f9f9f9; padding: 20px; border: 1px solid #dddddd; border-radius: 5px; margin: 20px 0; letter-spacing: 5px; color: #2c3e50;">
                    {message_body}
                </div>
                <p style="margin: 20px 0 10px 0; font-size: 16px; color: #2c3e50;">При желании его можно сменить в профиле пользователя, для этого требуется перейти:</p>
                <ul style="margin: 15px 0 25px 0; padding-left: 25px; color: #2c3e50;">
                    <li style="margin: 8px 0; font-size: 15px;">Личный кабинет →</li>
                    <li style="margin: 8px 0; font-size: 15px;">Параметры профиля →</li>
                    <li style="margin: 8px 0; font-size: 15px;">Безопасность</li>
                </ul>
        """
    
    elif email_type == "to_admin":
        html_template += f"""
                <p style="margin: 0 0 18px 0; font-size: 16px; line-height: 1.6; color: #2c3e50;">Здравствуйте!</p>
                <p style="margin: 0 0 25px 0; font-size: 16px; line-height: 1.6; color: #2c3e50;">Сообщение администратору.</p>
                <p style="margin: 0 0 12px 0; font-size: 16px; line-height: 1.6; color: #2c3e50; font-weight: 600;">Сообщение:</p>
                <div style="
                    background: linear-gradient(120deg, rgba(67, 97, 238, 0.08) 0%, rgba(76, 201, 240, 0.08) 100%);
                    border-left: 4px solid #4361ee;
                    border-radius: 0 8px 8px 0;
                    padding: 20px 25px;
                    margin: 15px 0 25px 0;
                    font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', monospace;
                    font-size: 14.5px;
                    line-height: 1.7;
                    color: #2d3748;
                    white-space: pre-wrap;
                    word-wrap: break-word;
                    overflow-wrap: break-word;
                    box-shadow: 0 2px 8px rgba(67, 97, 238, 0.08);
                ">{message_body}</div>
        """
    
    elif email_type == "to_recipient":
        html_template += f"""
                <p style="margin: 0 0 18px 0; font-size: 16px; line-height: 1.6; color: #2c3e50;">Здравствуйте!</p>
                <p style="margin: 0 0 25px 0; font-size: 16px; line-height: 1.6; color: #2c3e50;">Вам поступило сообщение от администратора.</p>
                <p style="margin: 0 0 12px 0; font-size: 16px; line-height: 1.6; color: #2c3e50; font-weight: 600;">Сообщение:</p>
                <div style="
                    background: linear-gradient(120deg, rgba(67, 97, 238, 0.08) 0%, rgba(76, 201, 240, 0.08) 100%);
                    border-left: 4px solid #4361ee;
                    border-radius: 0 8px 8px 0;
                    padding: 20px 25px;
                    margin: 15px 0 25px 0;
                    font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', monospace;
                    font-size: 14.5px;
                    line-height: 1.7;
                    color: #2d3748;
                    white-space: pre-wrap;
                    word-wrap: break-word;
                    overflow-wrap: break-word;
                    box-shadow: 0 2px 8px rgba(67, 97, 238, 0.08);
                ">{message_body}</div>
        """
    
    else:
        html_template += f"""
                <p style="margin: 0 0 16px 0; font-size: 16px; color: #2c3e50;">Здравствуйте!</p>
                <p style="margin: 0 0 20px 0; font-size: 16px; color: #2c3e50;">Сообщение об изменении статуса отчета.</p>
                <p style="margin: 20px 0 15px 0; font-size: 16px; color: #2c3e50;">Статус отчета изменен на: <span style="font-size: 16px; color: black; font-weight: bold; margin-bottom: 20px;">{message_body}</span></p>
        """
        
    html_template += """
            </div>
            <div style="background-color: #f3f3f3; padding: 20px; text-align: center; font-size: 13px; color: #777777; border-top: 1px solid #eeeeee;">
                <p style="margin: 0 0 12px 0;">
                    Дополнительную информацию можно найти 
                    <a href="https://erespondentn.energoeffect.gov.by/FAQ" style="color: #6441a5; text-decoration: none; font-weight: 500;">здесь</a>.
                </p>
                <p style="margin: 0; font-size: 14px; color: #555555;">
                    Спасибо,<br>
                    <span style="font-weight: 600; color: #2c3e50;">Служба поддержки ErespondentN</span>
                </p>
            </div>
        </div>
    </body>
    </html>
    """
    
    return html_template

# ========== ПРОСТАЯ ОЧЕРЕДЬ ==========
class SimpleEmailQueue:
    def __init__(self):
        self.queue = Queue(maxsize=100)
        self.workers = []
        self.running = False
        self.smtp_manager = SimpleSMTPManager()
        
    def start(self):
        """Запуск воркеров"""
        if not self.running:
            self.running = True
            for i in range(MAX_WORKERS):
                worker = Thread(
                    target=self._worker,
                    args=(i,),
                    daemon=True,
                    name=f"EmailWorker-{i}"
                )
                worker.start()
                self.workers.append(worker)
            logger.info(f"Started {MAX_WORKERS} email workers")
    
    def stop(self):
        """Остановка воркеров"""
        self.running = False
        for worker in self.workers:
            worker.join(timeout=5)
    
    def add_email(self, message_body, recipient_email, email_type, **kwargs):
        """Добавить email в очередь"""
        try:
            email_data = {
                'message_body': str(message_body) if message_body else "",
                'recipient_email': recipient_email,
                'email_type': email_type,
                **kwargs,
                'attempt': 0
            }
            
            self.queue.put_nowait(email_data)
            self.start()
            
            logger.info(f"Email queued for {recipient_email}")
            return True, "Email queued"
            
        except Exception as e:
            logger.error(f"Failed to queue email: {e}")
            return False, str(e)
    
    def _worker(self, worker_id):
        """Воркер для обработки очереди"""
        while self.running:
            try:
                email_data = self.queue.get(timeout=2)
                
                try:
                    html_content = generate_html_template(
                        email_data['message_body'],
                        email_data['email_type'],
                        email_data.get('location'),
                        email_data.get('device'),
                        email_data.get('browser'),
                        email_data.get('ip_address')
                    )
                    
                    # Отправляем email
                    success, message = self.smtp_manager.send_email_direct(
                        email_data['recipient_email'],
                        html_content
                    )
                    
                    if success:
                        logger.info(f"Worker {worker_id}: Email sent to {email_data['recipient_email']}")
                    else:
                        logger.warning(f"Worker {worker_id}: Failed to send to {email_data['recipient_email']}: {message}")
                        
                        # Повторная попытка
                        if email_data['attempt'] < 2:
                            email_data['attempt'] += 1
                            self.queue.put(email_data)
                            logger.info(f"Worker {worker_id}: Retry {email_data['attempt']} for {email_data['recipient_email']}")
                
                except Exception as e:
                    logger.error(f"Worker {worker_id}: Error: {e}")
                
                finally:
                    self.queue.task_done()
                
                # Небольшая пауза
                time.sleep(0.1)
                
            except Empty:
                continue
            except Exception as e:
                logger.error(f"Worker {worker_id} error: {e}")
                time.sleep(1)

# ========== ГЛОБАЛЬНЫЕ ОБЪЕКТЫ ==========
_email_queue = None

def get_email_queue():
    """Получить или создать очередь email"""
    global _email_queue
    if _email_queue is None:
        _email_queue = SimpleEmailQueue()
        logger.info("Email queue created")
    return _email_queue

# ========== ОСНОВНАЯ ФУНКЦИЯ ==========
def send_email(message_body, recipient_email, email_type, location=None, 
              device=None, browser=None, ip_address=None, priority=False):
    """
    Основная функция отправки email
    """
    logger.info(f"Request to send email to {recipient_email}, type: {email_type}")
    
    if not recipient_email:
        return "Error: recipient email is required"
    
    if message_body is None:
        message_body = ""
    
    if priority or email_type in ["activation_kod", "new_pass"]:
        try:
            html_content = generate_html_template(
                str(message_body), email_type, location, device, browser, ip_address
            )
            
            smtp_manager = SimpleSMTPManager()
            success, message = smtp_manager.send_email_direct(recipient_email, html_content)
            
            if success:
                return "Письмо отправлено"
            else:
                logger.warning(f"Direct send failed, using queue: {message}")
        
        except Exception as e:
            logger.warning(f"Direct send failed, using queue: {e}")
    
    queue = get_email_queue()
    success, message = queue.add_email(
        message_body=message_body,
        recipient_email=recipient_email,
        email_type=email_type,
        location=location,
        device=device,
        browser=browser,
        ip_address=ip_address
    )
    
    if success:
        return "Письмо поставлено в очередь"
    else:
        return f"Ошибка: {message}"



def cleanup_email_system():
    """Очистка при завершении"""
    global _email_queue
    if _email_queue:
        _email_queue.stop()
    logger.info("Email system cleaned up")

atexit.register(cleanup_email_system)