const mobileMenuToggle = document.getElementById('mobileMenuToggle');
const faqMenu = document.getElementById('status-faqlist');

if (mobileMenuToggle && faqMenu) {
    mobileMenuToggle.addEventListener('click', function() {
        faqMenu.classList.toggle('mobile-open');
        
        if (faqMenu.classList.contains('mobile-open')) {
            this.textContent = 'Скрыть категории вопросов';
        } else {
            this.textContent = 'Показать категории вопросов';
        }
    });
    
    // Закрытие меню при клике на вопрос на мобильных
    document.querySelectorAll('#status-faqlist li[data-question]').forEach(item => {
        item.addEventListener('click', function() {
            if (window.innerWidth <= 768) {
                faqMenu.classList.remove('mobile-open');
                mobileMenuToggle.textContent = 'Показать категории вопросов';
            }
        });
    });
}

// Поиск вопросов FAQ
const faqSearch = document.getElementById('faqSearch');
const faqSearchResults = document.getElementById('faqSearchResults');

faqSearch.addEventListener('input', function(e) {
    const searchTerm = e.target.value.toLowerCase().trim();
    faqSearchResults.innerHTML = '';
    
    if (searchTerm.length < 2) {
        faqSearchResults.style.display = 'none';
        return;
    }
    
    const allQuestions = document.querySelectorAll('#status-faqlist li[data-question]');
    const matchingQuestions = [];
    
    allQuestions.forEach(questionItem => {
        const questionText = questionItem.textContent.toLowerCase();
        const questionId = questionItem.getAttribute('data-question');
        
        if (questionText.includes(searchTerm)) {
            matchingQuestions.push({
                id: questionId,
                text: questionItem.textContent,
                element: questionItem
            });
        }
    });
    
    if (matchingQuestions.length > 0) {
        matchingQuestions.forEach(question => {
            const resultItem = document.createElement('div');
            resultItem.className = 'faq-search-result-item';
            resultItem.textContent = question.text;
            resultItem.dataset.questionId = question.id;
            
            resultItem.addEventListener('click', function() {
                loadFAQContent(question.id);
                faqSearch.value = '';
                faqSearchResults.style.display = 'none';
            });
            
            faqSearchResults.appendChild(resultItem);
        });
        faqSearchResults.style.display = 'block';
    } else {
        const noResults = document.createElement('div');
        noResults.className = 'faq-search-no-results';
        noResults.textContent = 'Вопросов не найдено';
        faqSearchResults.appendChild(noResults);
        faqSearchResults.style.display = 'block';
    }
});

// Закрытие результатов поиска при клике вне
document.addEventListener('click', function(e) {
    if (!faqSearch.contains(e.target) && !faqSearchResults.contains(e.target)) {
        faqSearchResults.style.display = 'none';
    }
});

// Очистка поиска при клике на ESC
faqSearch.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        faqSearch.value = '';
        faqSearchResults.style.display = 'none';
    }
});

document.querySelectorAll('#status-faqlist li[data-content]').forEach(item => {
    item.addEventListener('click', (e) => {
        // Блокируем только клик на SVG и path
        // const clickedElement = e.target;
        // if (clickedElement.closest('svg') || clickedElement.closest('path')) {
        //     return;
        // }
        
        const contentId = item.getAttribute('data-content');
        const contentElement = document.getElementById(contentId);
        const svg = item.querySelector('svg');
        
        if (contentElement.style.display === 'none' || contentElement.style.display === '') {
            contentElement.style.display = 'block';
            if (svg) svg.classList.add('rotate-180');
        } else {
            contentElement.style.display = 'none';
            if (svg) svg.classList.remove('rotate-180');
        }
    });
});

function loadFAQContent(questionId) {
    const faqContent = document.getElementById('faqContent');
    const placeholder = faqContent.querySelector('.faq-content-placeholder');
    
    document.querySelectorAll('.info_page[data-question-id]').forEach(container => {
        container.style.display = 'none';
    });
    
    if (placeholder) {
        placeholder.style.display = 'none';
    }
    
    const contentDiv = faqContent.querySelector(`.info_page[data-question-id="${questionId}"]`);
    if (contentDiv) {
        contentDiv.style.display = 'block';
        
        faqContent.classList.add('faq-content-active');
        
        history.pushState({ questionId: questionId }, '', `#faq${questionId}`);
        
        document.querySelectorAll('#status-faqlist li[data-question]').forEach(item => {
            item.classList.remove('active-question');
        });
        const selectedItem = document.querySelector(`#status-faqlist li[data-question="${questionId}"]`);
        if (selectedItem) {
            selectedItem.classList.add('active-question');
        }
    }
}

function loadContentFromHash() {
    const hash = window.location.hash.substring(1);
    if (hash && hash.startsWith('faq')) {
        const questionId = hash.replace('faq', '');
        loadFAQContent(questionId);
        
        const questionItem = document.querySelector(`li[data-question="${questionId}"]`);
        if (questionItem) {
            const parentCategory = questionItem.closest('.content');
            if (parentCategory) {
                const categoryId = parentCategory.id;
                const categoryHeader = document.querySelector(`li[data-content="${categoryId}"]`);
                if (categoryHeader) {
                    parentCategory.style.display = 'block';
                    const svg = categoryHeader.querySelector('svg');
                    if (svg) svg.classList.add('rotate-180');
                }
            }
        }
    } else {
        const faqContent = document.getElementById('faqContent');
        const placeholder = faqContent.querySelector('.faq-content-placeholder');
        if (placeholder) {
            placeholder.style.display = 'block';
        }
        document.querySelectorAll('.info_page[data-question-id]').forEach(container => {
            container.style.display = 'none';
        });
    }
}

document.querySelectorAll('#status-faqlist li[data-question]').forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        const questionId = item.getAttribute('data-question');
        loadFAQContent(questionId);
    });
});

window.addEventListener('popstate', function(event) {
    loadContentFromHash();
});

document.addEventListener('DOMContentLoaded', function() {
    loadContentFromHash();
    
    // Удаляем этот блок полностью - он очищает контент при клике на категорию
    // document.querySelectorAll('#status-faqlist li[data-content]').forEach(item => {
    //     item.addEventListener('click', function(e) {
    //         if (!e.target.closest('[data-question]')) {
    //             history.pushState({}, '', window.location.pathname);
    //             const faqContent = document.getElementById('faqContent');
    //             const placeholder = faqContent.querySelector('.faq-content-placeholder');
    //             if (placeholder) {
    //                 placeholder.style.display = 'block';
    //             }
    //             document.querySelectorAll('.info_page[data-question-id]').forEach(container => {
    //                 container.style.display = 'none';
    //             });
    //             document.querySelectorAll('#status-faqlist li[data-question]').forEach(item => {
    //                 item.classList.remove('active-question');
    //             });
    //         }
    //     });
    // });
});

