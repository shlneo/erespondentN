import smtplib
import os
import time
import logging
from queue import PriorityQueue, Empty
from threading import Thread, Lock
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.utils import formatdate

SMTP_HOST = "ms7.g-cloud.by"
SMTP_PORT = 465  # Или 587

EMAILS_PER_MINUTE = 10
DAILY_LIMIT = 200

PRIORITY = {
    "activation_kod": 3,
    "new_pass": 3,
    "to_admin": 1,
    "to_recipient": 1,
    "default": 0
}

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("email-service")

class Worker(Thread):
    def __init__(self, email, password, acc_id, queue):
        super().__init__(daemon=True)
        self.email = email
        self.password = password
        self.acc_id = acc_id
        self.queue = queue

        self.sent_today = 0
        self.last_sent = 0
        self.lock = Lock()

        self.start()

    def can_send(self):
        if self.sent_today >= DAILY_LIMIT:
            return False
        if time.time() - self.last_sent < 60 / EMAILS_PER_MINUTE:
            return False
        return True

    def send_email(self, to_email, subject, html):
        try:
            if SMTP_PORT == 465:
                server = smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, timeout=20)
            else:
                server = smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=20)
                if SMTP_PORT == 587:
                    server.starttls()
            
            server.ehlo()
            
            server.login(self.email, self.password)

            msg = MIMEMultipart()
            msg["From"] = self.email
            msg["To"] = to_email
            msg["Subject"] = subject
            msg["Date"] = formatdate(localtime=True)
            msg.attach(MIMEText(html, "html"))

            server.sendmail(self.email, to_email, msg.as_string())
            server.quit()

            with self.lock:
                self.sent_today += 1
                self.last_sent = time.time()

            log.info(f"[ACC {self.acc_id}] Отправлено на {to_email}")
            return True

        except Exception as e:
            log.error(f"[ACC {self.acc_id}] Ошибка: {str(e)}")
            return False

    def run(self):
        while True:
            try:
                pr, ts, task = self.queue.get(timeout=1)
            except Empty:
                continue

            if not self.can_send():
                time.sleep(2)
                self.queue.put((pr, ts, task))
                continue

            ok = self.send_email(
                task["to"],
                task["subject"],
                task["html"]
            )

            if not ok and task["attempt"] < 3:
                task["attempt"] += 1
                self.queue.put((pr, time.time(), task))

            self.queue.task_done()

class EmailQueue:
    def __init__(self):
        self.queue = PriorityQueue()
        self.workers = self._load_accounts()

    def _load_accounts(self):
        workers = []
        i = 1
        while True:
            email = os.getenv(f"ACC_{i}_EMAIL")
            password = os.getenv(f"ACC_{i}_PASS")
            if not email or not password:
                break

            workers.append(
                Worker(
                    email=email,
                    password=password,
                    acc_id=i,
                    queue=self.queue
                )
            )
            # log.info(f"Аккаунт #{i} ({email}) загружен")
            i += 1

        if not workers:
            raise RuntimeError("Не найдено ни одного аккаунта")

        log.info(f"Загружено {len(workers)} аккаунтов")
        return workers

    def add(self, to_email, subject, html, email_type="default"):
        pr = -PRIORITY.get(email_type, 0)
        self.queue.put((pr, time.time(), {
            "to": to_email,
            "subject": subject,
            "html": html,
            "attempt": 0,
            "type": email_type
        }))
        log.info(f"Задание добавлено в очередь: {to_email}, тип: {email_type}")

def build_html(message_body, email_type):
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
    elif email_type == "to_admin" or email_type == "to_recipient":
        html_template += f"""
                <p style="margin: 0 0 18px 0; font-size: 16px; line-height: 1.6; color: #2c3e50;">Здравствуйте!</p>
                <p style="margin: 0 0 25px 0; font-size: 16px; line-height: 1.6; color: #2c3e50;">Сообщение от системы.</p>
                <p style="margin: 20px 0 15px 0; font-size: 16px; color: #2c3e50;">Сообщение: <span style="font-size: 16px; color: black; font-weight: bold; margin-bottom: 20px;">{message_body}</span></p>
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

_email_queue = None

def get_email_queue():
    global _email_queue
    if _email_queue is None:
        _email_queue = EmailQueue()
    return _email_queue

def send_email(message, recipient_email, email_type="default"):
    subject_map = {
        "activation_kod": "Код подтверждения",
        "new_pass": "Новый пароль",
        "to_admin": "Сообщение администратору",
        "to_recipient": "Сообщение",
        "default": "Уведомление"
    }

    html = build_html(message, email_type)
    subject = subject_map.get(email_type, "Уведомление")

    queue = get_email_queue()
    queue.add(
        to_email=recipient_email,
        subject=subject,
        html=html,
        email_type=email_type
    )
    log.info(f"Письмо поставлено в очередь для {recipient_email}")
