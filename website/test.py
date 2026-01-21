import smtplib

def test_connection():
    try:
        print("Тестируем подключение к ms7.g-cloud.by...")
        
        # Пробуем порт 465 с SSL
        print("\n1. Тест порта 465 (SSL):")
        try:
            server = smtplib.SMTP_SSL("ms7.g-cloud.by", 465, timeout=10)
            print("   ✅ SSL подключение установлено")
            server.login("admin@kvant-as.by", "y78S56DnX3jU")
            print("   ✅ Аутентификация успешна")
            server.quit()
            print("   ✅ Порт 465 работает!")
        except Exception as e:
            print(f"   ❌ Ошибка с портом 465: {e}")
        
        # Пробуем порт 587 с STARTTLS
        print("\n2. Тест порта 587 (STARTTLS):")
        try:
            server = smtplib.SMTP("ms7.g-cloud.by", 587, timeout=10)
            print("   ✅ TCP подключение установлено")
            server.starttls()
            print("   ✅ STARTTLS выполнен")
            server.login("admin@kvant-as.by", "y78S56DnX3jU")
            print("   ✅ Аутентификация успешна")
            server.quit()
            print("   ✅ Порт 587 работает!")
        except Exception as e:
            print(f"   ❌ Ошибка с портом 587: {e}")
            
    except Exception as e:
        print(f"Общая ошибка: {e}")

test_connection()