document.addEventListener('DOMContentLoaded', () => {
    const inputs = document.querySelectorAll('.activation_code_input');
    inputs.forEach((input, index) => {
        input.addEventListener('input', () => {
            if (input.value && index < inputs.length - 1) {
                inputs[index + 1].focus();
            }
            else if (!input.value && index > 0) {
                inputs[index - 1].focus();
            }
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === "Backspace" && index > 0 && !input.value) {
                inputs[index - 1].focus();
            }
        });
    });

    inputs[0].addEventListener('paste', (e) => {
        e.preventDefault();
        const pasteData = e.clipboardData.getData('text');
    
        pasteData.split('').forEach((char, i) => {
            if (i < inputs.length) {
                inputs[i].value = char;
            }
        });

        inputs[Math.min(pasteData.length - 1, inputs.length - 1)].focus();
    });
});

document.addEventListener('DOMContentLoaded', () => {
    const resendButton = document.getElementById('relod_button_kod');
    const TIME_LIMIT = 60; 
    const STORAGE_KEY = 'resend_code_timer';


    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
    }

    function startTimer(seconds) {
        let timeLeft = seconds;
        resendButton.disabled = true;
        resendButton.innerHTML = `Повторная отправка через ${formatTime(timeLeft)}`;
        
        const timerInterval = setInterval(() => {
            timeLeft--;
            
            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                resendButton.disabled = false;
                resendButton.innerHTML = 'Отправить ещё раз';
                localStorage.removeItem(STORAGE_KEY);
            } else {
                const endTime = Math.floor(Date.now() / 1000) + timeLeft;
                localStorage.setItem(STORAGE_KEY, endTime.toString());
                
                resendButton.innerHTML = `Повторная отправка через ${formatTime(timeLeft)}`;
            }
        }, 1000);
    }

    function initTimer() {
        const savedEndTime = localStorage.getItem(STORAGE_KEY);
        
        if (savedEndTime) {
            const currentTime = Math.floor(Date.now() / 1000);
            const endTime = parseInt(savedEndTime);
            const timeLeft = endTime - currentTime;

            if (timeLeft > 0) {
                startTimer(timeLeft);
            } else {
                localStorage.removeItem(STORAGE_KEY);
                resendButton.disabled = false;
                resendButton.innerHTML = 'Отправить ещё раз';
            }
        } else {
            const currentTime = Math.floor(Date.now() / 1000);
            const endTime = currentTime + TIME_LIMIT;
            localStorage.setItem(STORAGE_KEY, endTime.toString());
            startTimer(TIME_LIMIT);
        }
    }

    initTimer();

    resendButton.addEventListener('click', (e) => {
        e.preventDefault();
        
        if (resendButton.disabled) return;
        
        const currentTime = Math.floor(Date.now() / 1000);
        const endTime = currentTime + TIME_LIMIT;
        localStorage.setItem(STORAGE_KEY, endTime.toString());
        
        startTimer(TIME_LIMIT);
        
        fetch('/resend-code', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                alert(data.message); 
            } else {
                alert(data.message); 
            }
        })
        .catch(error => {
            console.error('Ошибка при отправке кода:', error);
            alert('Не удалось отправить код. Попробуйте еще раз позже.');
        });
    });
});