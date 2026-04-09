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

    const resendButton = document.getElementById('resend-cod');
    const TIME_LIMIT = 300;
    const STORAGE_KEY = 'resend_code_timer_end';

    let timerInterval = null;

    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
    }

    function saveTimerState(endTime) {
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

    function startTimer(endTimestamp) {
        clearExistingTimer();
        
        const updateTimer = () => {
            const currentTime = Math.floor(Date.now() / 1000);
            const timeLeft = endTimestamp - currentTime;
            
            if (timeLeft <= 0) {
                clearExistingTimer();
                updateButtonState(true, 'Отправить ещё раз');
                localStorage.removeItem(STORAGE_KEY);
            } else {
                updateButtonState(false, `Повторная отправка через ${formatTime(timeLeft)}`);
            }
        };
        
        updateTimer();
        
        if (endTimestamp > Math.floor(Date.now() / 1000)) {
            timerInterval = setInterval(updateTimer, 1000);
        }
    }

    function startNewTimer() {
        clearExistingTimer();
        const newEndTime = Math.floor(Date.now() / 1000) + TIME_LIMIT;
        saveTimerState(newEndTime);
        startTimer(newEndTime);
    }

    function initTimer() {
        const savedEndTime = localStorage.getItem(STORAGE_KEY);
        
        if (savedEndTime) {
            const currentTime = Math.floor(Date.now() / 1000);
            const endTime = parseInt(savedEndTime);
            const timeLeft = endTime - currentTime;

            if (timeLeft > 0) {
                startTimer(endTime);
            } else {
                localStorage.removeItem(STORAGE_KEY);
                updateButtonState(true, 'Отправить ещё раз');
            }
        } else {
            startNewTimer();
        }
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
                startNewTimer();
                
                if (data.message) {
                }
            } else {
                updateButtonState(true, 'Отправить ещё раз');
            }
        } catch (error) {
            console.error('Ошибка при отправке кода:', error);
            updateButtonState(true, 'Отправить ещё раз');
        }
    });

    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            const savedEndTime = localStorage.getItem(STORAGE_KEY);
            if (savedEndTime) {
                const currentTime = Math.floor(Date.now() / 1000);
                const endTime = parseInt(savedEndTime);
                const timeLeft = endTime - currentTime;
                
                if (timeLeft > 0) {
                    clearExistingTimer();
                    startTimer(endTime);
                }
            }
        }
    });
});