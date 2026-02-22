// cookie.js
window.initCookieBanner = function() {
    const COOKIE_NAME = 'eresespondentN_acces';
    const COOKIE_DAYS = 365;
    const UPDATE_MODAL_COOKIE = 'system_update_shown_eres';
    
    function setCookie(name, value, days) {
        let expires = '';
        if (days) {
            const date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = '; expires=' + date.toUTCString();
        }
        document.cookie = name + '=' + (value || '') + expires + '; path=/; SameSite=Lax';
    }
    
    function getCookie(name) {
        const nameEQ = name + '=';
        const ca = document.cookie.split(';');
        for(let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
    }

    function initUpdateModal() {
        const modal = document.getElementById('system-update-modal');
        if (!modal) return;
        
        const shouldShowOnPage = checkPageForUpdateModal();
        
        if (shouldShowOnPage && !getCookie(UPDATE_MODAL_COOKIE)) {
            setTimeout(() => {
                modal.style.display = 'flex';
                setTimeout(() => {
                    modal.classList.add('active');
                    initSlides();
                }, 10);
            }, 500);
            
            const closeBtn = modal.querySelector('.close');
            if (closeBtn) {
                closeBtn.addEventListener('click', function() {
                    closeUpdateModal(modal);
                });
            }
            
            const dontShowBtn = modal.querySelector('.close');
            if (dontShowBtn) {
                dontShowBtn.addEventListener('click', function() {
                    setCookie(UPDATE_MODAL_COOKIE, 'shown', COOKIE_DAYS);
                    closeUpdateModal(modal);
                });
            }
        }
    }
    
    function closeUpdateModal(modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 400);
    }

    function checkPageForUpdateModal() {
        const updatePages = [
            '/report-area',
            '/',
        ];
        
        const currentPath = window.location.pathname;
        
        return updatePages.some(page => {
            if (page === '/') {
                return currentPath === '/' || currentPath === '';
            }
            return currentPath.startsWith(page);
        });
    }
    
    function initSlides() {
        const slides = document.querySelectorAll('.modal-slide');
        const prevBtn = document.querySelector('.slide-prev-vertical');
        const nextBtn = document.querySelector('.slide-next-vertical');
        
        if (!slides.length) return;
        
        let currentSlide = 0;
        
        function showSlide(index) {
            slides.forEach(slide => slide.classList.remove('active'));
            slides[index].classList.add('active');
            
            updateSlideCounter(index + 1, slides.length);
            
            currentSlide = index;
        }
        
        function updateSlideCounter(current, total) {
            const activeSlide = slides[current - 1];
            if (activeSlide) {
                const counter = activeSlide.querySelector('.slide-counter');
                if (counter) {
                    counter.textContent = `${current}/${total}`;
                }
            }
        }
        
        function nextSlide() {
            currentSlide = (currentSlide + 1) % slides.length;
            showSlide(currentSlide);
        }
        
        function prevSlide() {
            currentSlide = (currentSlide - 1 + slides.length) % slides.length;
            showSlide(currentSlide);
        }
        
        if (prevBtn) {
            prevBtn.addEventListener('click', prevSlide);
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', nextSlide);
        }
        
        showSlide(0);
    }
    
    if (!getCookie(COOKIE_NAME)) {
        const banner = document.getElementById('cookie-consent-banner');
        if (banner) {
            setTimeout(() => {
                banner.style.display = 'block';
                setTimeout(() => {
                    banner.classList.add('show');
                }, 10);
            }, 500);
            
            const acceptBtn = document.getElementById('accept-cookies');
            const declineBtn = document.getElementById('decline-cookies');
            
            if (acceptBtn) {
                acceptBtn.addEventListener('click', function() {
                    setCookie(COOKIE_NAME, 'accepted', COOKIE_DAYS);
                    banner.classList.remove('show');
                    setTimeout(() => {
                        banner.style.display = 'none';
                    }, 400);
                });
            }
            
            if (declineBtn) {
                declineBtn.addEventListener('click', function() {
                    banner.classList.remove('show');
                    setTimeout(() => {
                        banner.style.display = 'none';
                    }, 400);
                });
            }
        }
    }
    initUpdateModal();
};

document.addEventListener('DOMContentLoaded', function() {
    if (typeof window.initCookieBanner === 'function') {
        window.initCookieBanner();
    }
});