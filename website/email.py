import smtplib
import os
import time
import random
import hashlib
import datetime
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.utils import formatdate, make_msgid
from queue import Queue, Empty, PriorityQueue
from threading import Thread, Lock, Event
import atexit
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# === КОНФИГУРАЦИЯ ДЛЯ ОДНОГО GMAIL ЯЩИКА ===
MAX_WORKERS = 1                     # Только 1 воркер для одного аккаунта
EMAILS_PER_MINUTE = 1               # 1 письмо в минуту для стабильности
SMTP_TIMEOUT = 30                   # Увеличенный таймаут
DAILY_LIMIT = 400                   # Максимум 400 писем в день (с запасом от 500)
HOURLY_LIMIT = 80                   # Максимум 80 писем в час

# Приоритеты типов писем (чем выше число - тем выше приоритет)
PRIORITY_LEVELS = {
    "activation_kod": 3,    # Высший приоритет - коды активации
    "new_pass": 2,          # Высокий приоритет - сброс пароля
    "to_admin": 1,          # Средний приоритет - админу
    "to_recipient": 1,      # Средний приоритет - пользователям
    "default": 0            # Низкий приоритет - остальные
}

# Задержки между письмами в секундах
DELAYS_BY_PRIORITY = {
    3: random.uniform(5, 10),    # 5-10 сек для кодов активации
    2: random.uniform(10, 20),   # 10-20 сек для сброса пароля
    1: random.uniform(30, 60),   # 30-60 сек для обычных уведомлений
    0: random.uniform(60, 120)   # 60-120 сек для массовых рассылок
}


class SingleAccountSMTPManager:
    """Оптимизированный менеджер для одного Gmail аккаунта"""
    
    def __init__(self):
        self.sender = os.getenv('EMAILNAME')
        self.password = os.getenv('EMAILPASS')
        
        if not self.sender or not self.password:
            logger.error("Email credentials not configured!")
            raise ValueError("Email credentials not set")
        
        # Rate limiting для одного аккаунта
        self.last_sent_time = 0
        self.min_interval = 60.0 / EMAILS_PER_MINUTE
        
        # Лимиты дня и часа
        self.sent_today = 0
        self.sent_this_hour = 0
        self.daily_limit = DAILY_LIMIT
        self.hourly_limit = HOURLY_LIMIT
        self.last_hour_reset = time.time()
        self.last_day_reset = time.time()
        
        # Блокировки
        self.lock = Lock()
        
        # Статистика
        self.stats = {
            'success': 0,
            'failed': 0,
            'last_error': None
        }
        
        logger.info(f"SMTP Manager initialized for {self.sender}")
        logger.info(f"Daily limit: {self.daily_limit}, Hourly limit: {self.hourly_limit}")
    
    def _reset_counters_if_needed(self):
        """Сброс счетчиков по времени"""
        current_time = time.time()
        
        # Сброс часового счетчика
        if current_time - self.last_hour_reset >= 3600:
            self.sent_this_hour = 0
            self.last_hour_reset = current_time
            logger.info("Hourly counter reset")
        
        # Сброс дневного счетчика
        if current_time - self.last_day_reset >= 86400:
            self.sent_today = 0
            self.last_day_reset = current_time
            logger.info("Daily counter reset")
    
    def _check_limits(self):
        """Проверка всех лимитов"""
        self._reset_counters_if_needed()
        
        if self.sent_today >= self.daily_limit:
            return False, f"Daily limit reached ({self.sent_today}/{self.daily_limit})"
        
        if self.sent_this_hour >= self.hourly_limit:
            wait_time = 3600 - (time.time() - self.last_hour_reset)
            return False, f"Hourly limit reached, wait {int(wait_time)} seconds"
        
        return True, "OK"
    
    def _get_unique_message_id(self, recipient_email):
        """Генерация уникального ID для письма"""
        timestamp = int(time.time() * 1000)
        random_str = hashlib.md5(f"{recipient_email}{timestamp}{random.random()}".encode()).hexdigest()[:8]
        return f"<{timestamp}.{random_str}@erespondentn.energoeffect.gov.by>"
    
    def create_connection(self):
        """Создать новое SMTP соединение с обработкой ошибок"""
        try:
            server = smtplib.SMTP('smtp.gmail.com', 587, timeout=SMTP_TIMEOUT)
            server.starttls()
            
            # Устанавливаем debug уровень для диагностики
            server.set_debuglevel(0)
            
            server.login(self.sender, self.password)
            
            logger.debug("SMTP connection created successfully")
            return server
            
        except smtplib.SMTPAuthenticationError as e:
            logger.error(f"SMTP Authentication failed: {e}")
            return None
        except smtplib.SMTPException as e:
            logger.error(f"SMTP Error: {e}")
            return None
        except Exception as e:
            logger.error(f"Failed to create SMTP connection: {e}")
            return None
    
    def send_email_direct(self, recipient_email, html_content, email_type="default"):
        """Прямая отправка одного email с учетом лимитов"""
        with self.lock:
            # 1. Проверяем лимиты
            can_send, message = self._check_limits()
            if not can_send:
                return False, message
            
            # 2. Rate limiting между письмами
            current_time = time.time()
            time_since_last = current_time - self.last_sent_time
            if time_since_last < self.min_interval:
                sleep_time = self.min_interval - time_since_last
                logger.debug(f"Rate limiting: sleeping {sleep_time:.2f}s")
                time.sleep(sleep_time)
            
            # 3. Создаем соединение
            conn = self.create_connection()
            if not conn:
                return False, "Could not create SMTP connection"
            
            try:
                # 4. Создаем уникальное письмо
                msg = MIMEMultipart()
                
                # Уникальные заголовки для обхода спам-фильтров
                msg["From"] = self._get_sender_alias(email_type)
                msg["To"] = recipient_email
                msg["Subject"] = self._generate_subject(email_type, recipient_email)
                msg["Date"] = formatdate(localtime=True)
                msg["Message-ID"] = self._get_unique_message_id(recipient_email)
                msg["X-Mailer"] = "ErespondentN Mail System v2.0"
                msg["X-Priority"] = str(PRIORITY_LEVELS.get(email_type, 0))
                msg["List-Unsubscribe"] = "<https://erespondentn.energoeffect.gov.by/unsubscribe>"
                
                # Уникализируем HTML контент
                unique_html = self._make_html_unique(html_content, recipient_email)
                msg.attach(MIMEText(unique_html, "html"))
                
                # 5. Отправляем
                conn.sendmail(self.sender, recipient_email, msg.as_string())
                
                # 6. Обновляем статистику
                self.last_sent_time = time.time()
                self.sent_today += 1
                self.sent_this_hour += 1
                self.stats['success'] += 1
                
                logger.info(f"Email sent to {recipient_email}. Today: {self.sent_today}/{self.daily_limit}, Hour: {self.sent_this_hour}/{self.hourly_limit}")
                
                return True, "Email sent successfully"
                
            except smtplib.SMTPRecipientsRefused as e:
                error_msg = f"Recipient refused: {recipient_email}"
                logger.error(error_msg)
                self.stats['failed'] += 1
                self.stats['last_error'] = error_msg
                return False, error_msg
            except smtplib.SMTPSenderRefused as e:
                error_msg = f"Sender refused: {e}"
                logger.error(error_msg)
                self.stats['failed'] += 1
                self.stats['last_error'] = error_msg
                return False, error_msg
            except smtplib.SMTPDataError as e:
                error_msg = f"SMTP data error: {e}"
                logger.error(error_msg)
                self.stats['failed'] += 1
                self.stats['last_error'] = error_msg
                
                # При ошибке данных ждем дольше
                time.sleep(60)
                return False, error_msg
            except Exception as e:
                error_msg = f"Send error: {e}"
                logger.error(error_msg)
                self.stats['failed'] += 1
                self.stats['last_error'] = error_msg
                return False, error_msg
            finally:
                try:
                    conn.quit()
                except:
                    pass
    
    def _get_sender_alias(self, email_type):
        """Разные имена отправителя для разных типов писем"""
        aliases = {
            "activation_kod": "ErespondentN Security",
            "new_pass": "ErespondentN Password Manager",
            "to_admin": "ErespondentN Administration",
            "to_recipient": "ErespondentN Support",
            "default": "ErespondentN Notifications"
        }
        
        display_name = aliases.get(email_type, aliases["default"])
        return f'{display_name} <{self.sender}>'
    
    def _generate_subject(self, email_type, recipient_email):
        """Генерация уникальных тем писем"""
        user_part = recipient_email.split('@')[0]
        
        subjects = {
            "activation_kod": [
                f"Код безопасности для {user_part}",
                f"Код подтверждения входа",
                f"Ваш код доступа в ErespondentN"
            ],
            "new_pass": [
                f"Новый пароль для вашего аккаунта",
                f"Сброс пароля ErespondentN",
                f"Обновление данных для входа"
            ],
            "to_admin": [
                f"Сообщение администратору",
                f"Уведомление для администрации"
            ],
            "to_recipient": [
                f"Сообщение от ErespondentN",
                f"Уведомление от администратора"
            ],
            "default": [
                f"Уведомление от ErespondentN",
                f"Сообщение из системы ErespondentN"
            ]
        }
        
        subject_list = subjects.get(email_type, subjects["default"])
        return random.choice(subject_list)
    
    def _make_html_unique(self, html_content, recipient_email):
        """Делает каждое письмо уникальным для обхода спам-фильтров"""
        # Добавляем уникальный комментарий
        unique_id = hashlib.md5(f"{recipient_email}{time.time()}".encode()).hexdigest()[:12]
        timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        # Добавляем скрытый комментарий в конец HTML
        hidden_comment = f"\n<!-- Email ID: {unique_id} | Recipient: {recipient_email} | Time: {timestamp} -->"
        
        # Добавляем случайный невидимый span
        random_span = f'<span style="display:none; font-size:0px; color:transparent;">{unique_id}</span>'
        
        # Вставляем перед закрывающим body
        if '</body>' in html_content:
            html_content = html_content.replace('</body>', f'{random_span}\n</body>')
        
        return html_content + hidden_comment
    
    def get_stats(self):
        """Получить статистику отправки"""
        return {
            **self.stats,
            'sent_today': self.sent_today,
            'sent_this_hour': self.sent_this_hour,
            'daily_limit': self.daily_limit,
            'hourly_limit': self.hourly_limit,
            'next_hour_reset': int(3600 - (time.time() - self.last_hour_reset)),
            'next_day_reset': int(86400 - (time.time() - self.last_day_reset))
        }


class PriorityEmailQueue:
    """Очередь с приоритетами для одного аккаунта"""
    
    def __init__(self):
        # PriorityQueue: чем МЕНЬШЕ число - тем ВЫШЕ приоритет
        # Для совместимости инвертируем наши приоритеты
        self.queue = PriorityQueue(maxsize=200)
        self.workers = []
        self.running = False
        self.stop_event = Event()
        self.smtp_manager = SingleAccountSMTPManager()
        
        logger.info("Priority Email Queue initialized")
    
    def _invert_priority(self, priority_level):
        """Инвертируем приоритет для PriorityQueue"""
        # PriorityQueue: меньше число = выше приоритет
        # У нас: больше число = выше приоритет
        return -priority_level
    
    def start(self):
        """Запуск воркеров"""
        if not self.running:
            self.running = True
            self.stop_event.clear()
            
            for i in range(MAX_WORKERS):
                worker = Thread(
                    target=self._worker,
                    args=(i,),
                    daemon=True,
                    name=f"EmailWorker-{i}"
                )
                worker.start()
                self.workers.append(worker)
            
            logger.info(f"Started {MAX_WORKERS} priority email worker(s)")
    
    def stop(self):
        """Остановка воркеров"""
        self.running = False
        self.stop_event.set()
        
        for worker in self.workers:
            worker.join(timeout=5)
        
        logger.info("Email workers stopped")
    
    def add_email(self, message_body, recipient_email, email_type, **kwargs):
        """Добавить email в очередь с приоритетом"""
        try:
            priority = PRIORITY_LEVELS.get(email_type, 0)
            
            email_data = {
                'message_body': str(message_body) if message_body else "",
                'recipient_email': recipient_email,
                'email_type': email_type,
                'priority': priority,
                **kwargs,
                'attempt': 0,
                'created_at': time.time(),
                'unique_id': hashlib.md5(f"{recipient_email}{time.time()}{random.random()}".encode()).hexdigest()[:8]
            }
            
            # Добавляем в PriorityQueue с инвертированным приоритетом
            self.queue.put_nowait((self._invert_priority(priority), email_data))
            self.start()  # Запускаем воркеры если еще не запущены
            
            logger.info(f"Email queued for {recipient_email}, type: {email_type}, priority: {priority}")
            return True, "Email queued"
            
        except Exception as e:
            logger.error(f"Failed to queue email: {e}")
            return False, str(e)
    
    def _worker(self, worker_id):
        """Воркер для обработки очереди с приоритетами"""
        logger.info(f"Worker {worker_id} started")
        
        while self.running and not self.stop_event.is_set():
            try:
                # Получаем email с наивысшим приоритетом
                priority, email_data = self.queue.get(timeout=2)
                
                logger.info(f"Worker {worker_id}: Processing {email_data['recipient_email']}, "
                          f"type: {email_data['email_type']}, "
                          f"attempt: {email_data['attempt'] + 1}")
                
                try:
                    # Генерация HTML контента
                    html_content = generate_html_template(
                        email_data['message_body'],
                        email_data['email_type'],
                        email_data.get('location'),
                        email_data.get('device'),
                        email_data.get('browser'),
                        email_data.get('ip_address')
                    )
                    
                    # Задержка в зависимости от приоритета
                    delay = DELAYS_BY_PRIORITY.get(email_data['priority'], 60)
                    
                    # Для повторных попыток увеличиваем задержку
                    if email_data['attempt'] > 0:
                        delay *= (email_data['attempt'] + 1)
                    
                    logger.debug(f"Worker {worker_id}: Delaying {delay:.1f}s before sending")
                    time.sleep(delay)
                    
                    # Отправка email
                    success, message = self.smtp_manager.send_email_direct(
                        email_data['recipient_email'],
                        html_content,
                        email_data['email_type']
                    )
                    
                    if success:
                        logger.info(f"Worker {worker_id}: Email sent to {email_data['recipient_email']}")
                        
                        # Для приоритетных писем логируем время доставки
                        if email_data['priority'] >= 2:
                            delivery_time = time.time() - email_data['created_at']
                            logger.info(f"Priority email delivered in {delivery_time:.1f}s")
                    
                    else:
                        logger.warning(f"Worker {worker_id}: Failed to send to {email_data['recipient_email']}: {message}")
                        
                        # Повторная попытка только для приоритетных писем
                        if email_data['attempt'] < 2 and email_data['priority'] >= 1:
                            email_data['attempt'] += 1
                            # Увеличиваем приоритет при повторной попытке
                            new_priority = email_data['priority'] + 1
                            self.queue.put((self._invert_priority(new_priority), email_data))
                            logger.info(f"Worker {worker_id}: Retry {email_data['attempt']} for {email_data['recipient_email']}")
                        else:
                            logger.error(f"Worker {worker_id}: Max attempts reached for {email_data['recipient_email']}")
                
                except Exception as e:
                    logger.error(f"Worker {worker_id}: Processing error: {e}")
                    time.sleep(10)  # Пауза при ошибке
                
                finally:
                    self.queue.task_done()
                
            except Empty:
                # Очередь пуста, небольшая пауза
                time.sleep(1)
                continue
            except Exception as e:
                logger.error(f"Worker {worker_id} error: {e}")
                time.sleep(5)
        
        logger.info(f"Worker {worker_id} stopped")
    
    def get_queue_stats(self):
        """Получить статистику очереди"""
        return {
            'queue_size': self.queue.qsize(),
            'workers_active': len([w for w in self.workers if w.is_alive()]),
            'smtp_stats': self.smtp_manager.get_stats()
        }


def generate_html_template(message_body, email_type, location=None, 
                          device=None, browser=None, ip_address=None):
    """Генератор HTML шаблонов (без изменений)"""
    # ... (ваш существующий код generate_html_template остается без изменений) ...
    # Версия из вашего оригинального кода
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


# ========== ГЛОБАЛЬНЫЕ ОБЪЕКТЫ ==========
_email_queue = None


def get_email_queue():
    """Получить или создать очередь email"""
    global _email_queue
    if _email_queue is None:
        _email_queue = PriorityEmailQueue()
        logger.info("Priority email queue created")
    return _email_queue


# ========== ОСНОВНАЯ ФУНКЦИЯ ==========
def send_email(message_body, recipient_email, email_type, location=None, 
              device=None, browser=None, ip_address=None, immediate=False):
    """
    Основная функция отправки email
    
    Args:
        immediate (bool): True для немедленной отправки (только для критичных писем)
    """
    logger.info(f"Request to send email to {recipient_email}, type: {email_type}, immediate: {immediate}")
    
    if not recipient_email:
        return "Error: recipient email is required"
    
    if message_body is None:
        message_body = ""
    
    # Проверяем, является ли письмо критичным
    is_critical = email_type in ["activation_kod", "new_pass"]
    
    # Если запрошена немедленная отправка И письмо критичное
    if immediate and is_critical:
        try:
            logger.info(f"Immediate send for critical email to {recipient_email}")
            
            html_content = generate_html_template(
                str(message_body), email_type, location, device, browser, ip_address
            )
            
            # Создаем отдельный менеджер для немедленной отправки
            smtp_manager = SingleAccountSMTPManager()
            success, message = smtp_manager.send_email_direct(
                recipient_email,
                html_content,
                email_type
            )
            
            if success:
                logger.info(f"Immediate email sent to {recipient_email}")
                return "Письмо отправлено немедленно"
            else:
                logger.warning(f"Immediate send failed: {message}, falling back to queue")
                # При неудаче падаем в очередь
        
        except Exception as e:
            logger.error(f"Immediate send error: {e}")
    
    # Все остальные случаи - через очередь
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
        if is_critical:
            return "Критичное письмо поставлено в приоритетную очередь"
        else:
            return "Письмо поставлено в очередь"
    else:
        return f"Ошибка: {message}"


def get_email_stats():
    """Получить статистику отправки"""
    global _email_queue
    if _email_queue:
        return _email_queue.get_queue_stats()
    return {"error": "Email queue not initialized"}


def cleanup_email_system():
    """Очистка при завершении"""
    global _email_queue
    if _email_queue:
        _email_queue.stop()
        logger.info("Email system cleaned up")


atexit.register(cleanup_email_system)