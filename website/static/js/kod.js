document.addEventListener('DOMContentLoaded', () => {
    const inputs = document.querySelectorAll('.activation_code_input');
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

    const resendButton = document.getElementById('relod_button_kod');
    const TIME_LIMIT = 60; // 60 секунд (1 минута)
    const STORAGE_KEY = 'resend_code_timer';

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
        updateButtonState(false, `Повторная отправка через ${formatTime(timeLeft)}`);
        saveTimerState(timeLeft);
        
        timerInterval = setInterval(() => {
            timeLeft--;
            
            if (timeLeft <= 0) {
                clearExistingTimer();
                updateButtonState(true, 'Отправить ещё раз');
                localStorage.removeItem(STORAGE_KEY);
            } else {
                if (timeLeft % 5 === 0) {
                    saveTimerState(timeLeft);
                }
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
                startTimer(timeLeft);
            } else if (timeLeft > TIME_LIMIT) {
                startTimer(TIME_LIMIT);
            } else {
                localStorage.removeItem(STORAGE_KEY);
                updateButtonState(true, 'Отправить ещё раз');
            }
        } else {
            updateButtonState(true, 'Отправить ещё раз');
        }
    }

    function resetTimer() {
        clearExistingTimer();
        startTimer(TIME_LIMIT);
    }

    initTimer();

    resendButton.addEventListener('click', async (e) => {
        e.preventDefault();
        
        if (resendButton.disabled) return;
        
        updateButtonState(false, 'Отправка...');
        
        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');

            const response = await fetch('/resend-code', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken
                }
            });
            
            const data = await response.json();
            
            if (data.status === 'success') {
                resetTimer();
                
                if (data.message) {
                    showNotification(data.message, 'success');
                }
            } else {
                updateButtonState(true, 'Отправить ещё раз');
                showNotification(data.message || 'Произошла ошибка при отправке кода', 'error');
            }
        } catch (error) {
            console.error('Ошибка при отправке кода:', error);
            updateButtonState(true, 'Отправить ещё раз');
        }
    });

    function showNotification(message, type = 'info') {
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

    document.addEventListener('visibilitychange', () => {
        if (!document.hidden && timerInterval) {
            const savedEndTime = localStorage.getItem(STORAGE_KEY);
            if (savedEndTime) {
                const currentTime = Math.floor(Date.now() / 1000);
                const endTime = parseInt(savedEndTime);
                const timeLeft = endTime - currentTime;
                
                if (timeLeft > 0 && timeLeft <= TIME_LIMIT) {
                    clearExistingTimer();
                    startTimer(timeLeft);
                } else if (timeLeft <= 0) {
                    clearExistingTimer();
                    updateButtonState(true, 'Отправить ещё раз');
                    localStorage.removeItem(STORAGE_KEY);
                }
            }
        }
    });
});