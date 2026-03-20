// Класс для управления загрузкой страницы
class PageLoader {
    constructor() {
        this.loader = document.getElementById('loader');
        this.content = document.getElementById('content');
        this.images = document.querySelectorAll('img');
        this.progressFill = document.querySelector('.progress-fill');
        this.percentText = document.querySelector('.percent-text');
        this.loadingText = document.querySelector('.loading-text');
        
        // Общее количество ресурсов для загрузки
        this.totalResources = this.images.length + 2; // +2 для основного контента и API
        this.loadedResources = 0;
        this.progress = 0;
        
        // Сообщения для разных этапов загрузки
        this.loadingMessages = [
            'Загрузка контента...',
            'Оптимизация изображений...',
            'Подготовка данных...',
            'Почти готово...'
        ];
    }
    
    init() {
        this.updateProgress(0);
        this.loadImages();
        this.loadContent();
        this.loadApiData();
        
        // Смена сообщений для разнообразия
        this.startMessageRotation();
    }
    
    startMessageRotation() {
        let messageIndex = 0;
        this.messageInterval = setInterval(() => {
            if (this.loadedResources < this.totalResources) {
                messageIndex = (messageIndex + 1) % this.loadingMessages.length;
                if (this.loadingText) {
                    this.loadingText.textContent = this.loadingMessages[messageIndex];
                }
            } else {
                clearInterval(this.messageInterval);
            }
        }, 800);
    }
    
    loadImages() {
        if (this.images.length === 0) {
            this.resourceLoaded('image');
            return;
        }
        
        let loadedImages = 0;
        this.images.forEach((img, index) => {
            if (img.complete) {
                loadedImages++;
                this.resourceLoaded('image');
            } else {
                img.addEventListener('load', () => {
                    loadedImages++;
                    this.resourceLoaded('image');
                });
                img.addEventListener('error', () => {
                    loadedImages++;
                    this.resourceLoaded('image');
                    console.warn(`Не удалось загрузить изображение: ${img.src}`);
                });
            }
        });
    }
    
    loadContent() {
        // Имитация загрузки динамического контента
        setTimeout(() => {
            this.resourceLoaded('content');
        }, 500);
    }
    
    loadApiData() {
        // Имитация загрузки данных с API
        setTimeout(() => {
            this.resourceLoaded('api');
        }, 800);
    }
    
    resourceLoaded(resourceName) {
        this.loadedResources++;
        const newProgress = (this.loadedResources / this.totalResources) * 100;
        this.updateProgress(newProgress);
        
        console.log(`Загружено: ${resourceName} (${this.loadedResources}/${this.totalResources})`);
        
        if (this.loadedResources === this.totalResources) {
            this.onAllResourcesLoaded();
        }
    }
    
    updateProgress(percent) {
        this.progress = Math.min(percent, 100);
        
        if (this.progressFill) {
            this.progressFill.style.width = `${this.progress}%`;
        }
        
        if (this.percentText) {
            this.percentText.textContent = `${Math.round(this.progress)}%`;
        }
        
        // Изменяем текст в зависимости от прогресса
        if (this.loadingText && this.progress < 30) {
            this.loadingText.textContent = 'Подготовка к загрузке...';
        } else if (this.loadingText && this.progress < 60) {
            this.loadingText.textContent = 'Загрузка изображений...';
        } else if (this.loadingText && this.progress < 90) {
            this.loadingText.textContent = 'Обработка данных...';
        } else if (this.loadingText && this.progress >= 90) {
            this.loadingText.textContent = 'Завершение...';
        }
    }
    
    onAllResourcesLoaded() {
        clearInterval(this.messageInterval);
        
        if (this.loadingText) {
            this.loadingText.textContent = 'Готово!';
        }
        
        // Небольшая задержка для плавности
        setTimeout(() => {
            this.hideLoader();
        }, 500);
    }
    
    hideLoader() {
        // Анимация исчезновения лоадера
        this.loader.classList.add('fade-out');
        
        setTimeout(() => {
            this.loader.style.display = 'none';
            this.content.classList.remove('hidden');
            
            // Анимация появления контента
            setTimeout(() => {
                this.content.classList.add('fade-in');
            }, 50);
        }, 500);
    }
}

// Дополнительная функция для имитации реальной загрузки данных
function initializeAdditionalFeatures() {
    // Здесь можно добавить инициализацию слайдеров, анимаций и т.д.
    console.log('Дополнительные функции инициализированы');
    
    // Добавляем анимацию для кнопок
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(button => {
        button.addEventListener('click', function() {
            alert('Функция в разработке!');
        });
    });
}

// Запуск загрузчика при полной загрузке DOM
document.addEventListener('DOMContentLoaded', () => {
    const pageLoader = new PageLoader();
    pageLoader.init();
    
    // Инициализируем дополнительные функции после загрузки контента
    setTimeout(() => {
        initializeAdditionalFeatures();
    }, 1500);
});

// Обработка ошибок загрузки
window.addEventListener('error', (e) => {
    console.error('Ошибка загрузки ресурса:', e.target);
    // Можно добавить логику повторной попытки загрузки
});

// Оптимизация для мобильных устройств
if ('IntersectionObserver' in window) {
    const lazyImages = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.add('loaded');
                imageObserver.unobserve(img);
            }
        });
    });
    
    lazyImages.forEach(img => imageObserver.observe(img));
}