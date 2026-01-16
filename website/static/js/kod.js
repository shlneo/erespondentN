document.addEventListener('DOMContentLoaded', () => {
    // Часть 1: Обработка полей ввода кода
    const inputs = document.querySelectorAll('.activation_code_input');
    
    // Автоматическое перемещение между полями ввода
    inputs.forEach((input, index) => {
        input.addEventListener('input', () => {
            if (input.value.length >= input.maxLength && index < inputs.length - 1) {
                inputs[index + 1].focus();
            }
            else if (!input.value && index > 0) {
                inputs[index - 1].focus();
            }
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === "Backspace" && !input.value && index > 0) {
                e.preventDefault();
                inputs[index - 1].focus();
                inputs[index - 1].value = '';
            }
        });
    });

    // Обработка вставки из буфера обмена
    inputs[0].addEventListener('paste', (e) => {
        e.preventDefault();
        const pasteData = e.clipboardData.getData('text').trim();
        const digits = pasteData.replace(/\D/g, '').split('');
        
        digits.forEach((digit, i) => {
            if (i < inputs.length) {
                inputs[i].value = digit;
            }
        });

        const nextFocusIndex = Math.min(digits.length, inputs.length - 1);
        inputs[nextFocusIndex].focus();
    });

    // Часть 2: Таймер для кнопки повторной отправки
    const resendButton = document.getElementById('relod_button_kod');
    const TIME_LIMIT = 60; // 60 секунд (1 минута)
    const STORAGE_KEY = 'resend_code_timer';
    
    // Глобальная переменная для хранения интервала таймера
    let timerInterval = null;

    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
    }

    function saveTimerState(timeLeft) {
        const endTime = Math.floor(Date.now() / 1000) + timeLeft;
        localStorage.setItem(STORAGE_KEY, endTime.toString());
    }

    function updateButtonState(isEnabled, text) {
        resendButton.disabled = !isEnabled;
        resendButton.innerHTML = text;
        
        if (isEnabled) {
            resendButton.classList.remove('disabled');
        } else {
            resendButton.classList.add('disabled');
        }
    }

    function clearExistingTimer() {
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
    }

    function startTimer(seconds) {
        clearExistingTimer();
        
        let timeLeft = seconds;
        
        // Блокируем кнопку и показываем таймер
        updateButtonState(false, `Повторная отправка через ${formatTime(timeLeft)}`);
        
        // Сохраняем начальное состояние
        saveTimerState(timeLeft);
        
        timerInterval = setInterval(() => {
            timeLeft--;
            
            if (timeLeft <= 0) {
                // Таймер завершен
                clearExistingTimer();
                updateButtonState(true, 'Отправить ещё раз');
                localStorage.removeItem(STORAGE_KEY);
            } else {
                // Обновляем сохраненное время только раз в 5 секунд для производительности
                if (timeLeft % 5 === 0) {
                    saveTimerState(timeLeft);
                }
                
                // Обновляем отображение
                updateButtonState(false, `Повторная отправка через ${formatTime(timeLeft)}`);
            }
        }, 1000);
    }

    function initTimer() {
        const savedEndTime = localStorage.getItem(STORAGE_KEY);
        
        if (savedEndTime) {
            const currentTime = Math.floor(Date.now() / 1000);
            const endTime = parseInt(savedEndTime);
            const timeLeft = endTime - currentTime;

            if (timeLeft > 0 && timeLeft <= TIME_LIMIT) {
                // Продолжаем отсчет с сохраненного времени
                startTimer(timeLeft);
            } else if (timeLeft > TIME_LIMIT) {
                // Время в хранилище некорректно (больше лимита)
                // Запускаем новый таймер
                startTimer(TIME_LIMIT);
            } else {
                // Таймер уже истек или некорректный
                localStorage.removeItem(STORAGE_KEY);
                updateButtonState(true, 'Отправить ещё раз');
            }
        } else {
            // Нет сохраненного таймера, кнопка активна
            updateButtonState(true, 'Отправить ещё раз');
        }
    }

    function resetTimer() {
        clearExistingTimer();
        startTimer(TIME_LIMIT);
    }

    // Инициализация таймера сразу при загрузке страницы
    initTimer();

    // Обработчик клика по кнопке повторной отправки
    resendButton.addEventListener('click', async (e) => {
        e.preventDefault();
        
        if (resendButton.disabled) return;
        
        // Блокируем кнопку сразу при клике
        updateButtonState(false, 'Отправка...');
        
        try {
            // Отправляем запрос на повторную отправку кода
            const response = await fetch('/resend-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            
            const data = await response.json();
            
            if (data.status === 'success') {
                // Запускаем таймер после успешной отправки
                resetTimer();
                
                // Показываем уведомление, если нужно
                if (data.message) {
                    showNotification(data.message, 'success');
                }
            } else {
                // В случае ошибки возвращаем кнопку в активное состояние
                updateButtonState(true, 'Отправить ещё раз');
                showNotification(data.message || 'Произошла ошибка при отправке кода', 'error');
            }
        } catch (error) {
            console.error('Ошибка при отправке кода:', error);
            updateButtonState(true, 'Отправить ещё раз');
            showNotification('Не удалось отправить код. Проверьте подключение к интернету.', 'error');
        }
    });

    // Функция для показа уведомлений (можно заменить на свою реализацию)
    function showNotification(message, type = 'info') {
        // Временная реализация - можно заменить на toast или модальное окно
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px;
            background: ${type === 'success' ? '#4caf50' : '#f44336'};
            color: white;
            border-radius: 4px;
            z-index: 1000;
            animation: slideIn 0.3s ease-out;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // Обработка видимости страницы для синхронизации таймера
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden && timerInterval) {
            // Страница снова стала активной - пересчитываем таймер
            const savedEndTime = localStorage.getItem(STORAGE_KEY);
            if (savedEndTime) {
                const currentTime = Math.floor(Date.now() / 1000);
                const endTime = parseInt(savedEndTime);
                const timeLeft = endTime - currentTime;
                
                if (timeLeft > 0 && timeLeft <= TIME_LIMIT) {
                    // Перезапускаем таймер с актуальным временем
                    clearExistingTimer();
                    startTimer(timeLeft);
                } else if (timeLeft <= 0) {
                    // Таймер истек, пока страница была неактивна
                    clearExistingTimer();
                    updateButtonState(true, 'Отправить ещё раз');
                    localStorage.removeItem(STORAGE_KEY);
                }
            }
        }
    });
});