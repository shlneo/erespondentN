document.addEventListener('DOMContentLoaded', function () {
    // Получаем параметр из URL
    function getURLParameter(name) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(name);
    }
    // Пытаемся получить значение параметра 'modal'
    const modalId = getURLParameter('modal');
    if (modalId) {
        // Ищем модальное окно с соответствующим id
        const modalElement = document.getElementById(modalId);
        if (modalElement) {
            modalElement.classList.add('active');
        } else {
            console.error(`Модальное окно с id '${modalId}' не найдено.`);
        }
    }
});


document.addEventListener('DOMContentLoaded', function() {
    var urladdComment_modal = new URLSearchParams(window.location.search);
    if (urladdComment_modal.get('addCommentModal') === 'true') {
        var addCommentModal = document.getElementById('addCommentModal');
        if (addCommentModal) {
            addCommentModal.style.display = 'block';
        }
    }

    /* всплывающее окно с респондентом */
    /* модальное окно показа комментариев */
    /* модальное окно добавления комментария */
    /* всплывающее окно с единицами измерения */
    /* всплывающее окно с продуктами */
    /* всплывающее окно с inf vers */

    function handleModal(modalElement, openLink, closeLink) {
        openLink.addEventListener('click', function(event) {
            if (openLink.style.opacity === '0.5') {
                event.preventDefault();
            } else {
                modalElement.classList.add('active');
            }
        });

        closeLink.addEventListener('click', function() {
            modalElement.classList.remove('active');
        });

        window.addEventListener('click', function(event) {
            if (event.target === modalElement) {
                modalElement.classList.remove('active');
            }
        });
    }

    // handleModal(document.getElementById('RespondentModal'), document.getElementById('RespondentLink'), document.getElementById('CloseRespondent'));
    handleModal(document.getElementById('addCommentModal'), document.getElementById('addCommentLink'), document.getElementById('CloseaddComment'));
    handleModal(document.getElementById('showCommentsModal'), document.getElementById('showCommentsLink'), document.getElementById('CloseshowComments'));
    /* end */

    const sectionLinks = document.querySelectorAll('[data-section]');
    sectionLinks.forEach(link => {
        link.addEventListener('click', function() {
            const sectionId = this.getAttribute('data-section').replace('link', 'table');
            sectionLinks.forEach(item => {
                item.classList.remove('activefunctions_menu');
            });
            this.classList.add('activefunctions_menu');

            document.querySelectorAll('.report-area > div').forEach(div => {
                div.style.display = 'none';
            });

            const sectionToShow = document.getElementById(sectionId);
            if (sectionToShow) {
                sectionToShow.style.display = 'block';
            }
        });
    });

    function initTableKeyboardNavigation() {
        let currentActiveIndex = -1;
        let previousActiveRow = null;
        
        function getVisibleTableRows() {
            const tables = ['fuel_section_table', 'heat_section_table', 'electro_section_table'];
            
            for (const tableId of tables) {
                const table = document.getElementById(tableId);
                if (table && table.style.display !== 'none') {
                    return table.querySelectorAll('.section_row');
                }
            }
            return [];
        }
        
        document.addEventListener('click', function(event) {
            const row = event.target.closest('.section_row');
            if (row && event.button === 0) {
                const rows = getVisibleTableRows();
                
                if (Array.from(rows).includes(row)) {
                    const index = Array.from(rows).indexOf(row);
                    selectRow(row, index);
                }
            }
        });
        
        function selectRow(row, index) {
            const rows = getVisibleTableRows();
            
            row.focus();
            
            if (row.classList.contains('active-report')) {
                row.classList.remove('active-report');
                row.querySelectorAll('input').forEach(input => {
                    input.classList.remove('active-input');
                });
                previousActiveRow = null;
                currentActiveIndex = -1;
            } else {
                if (previousActiveRow !== null) {
                    previousActiveRow.classList.remove('active-report');
                    previousActiveRow.querySelectorAll('input').forEach(input => {
                        input.classList.remove('active-input');
                    });
                }
                
                row.classList.add('active-report');
                row.querySelectorAll('input').forEach(input => {
                    input.classList.add('active-input');
                });
                previousActiveRow = row;
                currentActiveIndex = index;
            }
        }
        
        document.addEventListener('keydown', function(event) {
            const rows = getVisibleTableRows();
            if (rows.length === 0) return;
            
            switch(event.key) {
                case 'ArrowDown':
                    event.preventDefault();
                    if (currentActiveIndex === -1) {
                        selectRow(rows[0], 0);
                    } else {
                        const newIndex = (currentActiveIndex + 1) % rows.length;
                        selectRow(rows[newIndex], newIndex);
                    }
                    break;
                    
                case 'ArrowUp':
                    event.preventDefault();
                    if (currentActiveIndex === -1) {
                        selectRow(rows[rows.length - 1], rows.length - 1);
                    } else {
                        const newIndex = (currentActiveIndex - 1 + rows.length) % rows.length;
                        selectRow(rows[newIndex], newIndex);
                    }
                    break;
                    
                case 'Home':
                    event.preventDefault();
                    if (rows.length > 0 && (currentActiveIndex !== 0 || previousActiveRow === null)) {
                        selectRow(rows[0], 0);
                    }
                    break;
                    
                case 'End':
                    event.preventDefault();
                    if (rows.length > 0) {
                        const lastIndex = rows.length - 1;
                        if (currentActiveIndex !== lastIndex || previousActiveRow === null) {
                            selectRow(rows[lastIndex], lastIndex);
                        }
                    }
                    break;
                    
                case 'Escape':
                    if (previousActiveRow) {
                        previousActiveRow.classList.remove('active-report');
                        previousActiveRow.querySelectorAll('input').forEach(input => {
                            input.classList.remove('active-input');
                        });
                        previousActiveRow = null;
                        currentActiveIndex = -1;
                    }
                    break;
                    
                case ' ':
                    if (event.target.classList.contains('section_row')) {
                        event.preventDefault();
                        const row = event.target;
                        const rows = getVisibleTableRows();
                        const index = Array.from(rows).indexOf(row);
                        if (index !== -1) {
                            selectRow(row, index);
                        }
                    }
                    break;
            }
        });
        
        function setupRows() {
            document.querySelectorAll('.section_row').forEach(row => {
                row.setAttribute('tabindex', '-1');
            });
        }
        
        setupRows();
        
        return {
            selectRowByIndex: function(index) {
                const rows = getVisibleTableRows();
                if (index >= 0 && index < rows.length) {
                    selectRow(rows[index], index);
                }
            },
            
            getActiveRow: function() {
                return {
                    element: previousActiveRow,
                    index: currentActiveIndex
                };
            },
            
            clearSelection: function() {
                if (previousActiveRow) {
                    previousActiveRow.classList.remove('active-report');
                    previousActiveRow.querySelectorAll('input').forEach(input => {
                        input.classList.remove('active-input');
                    });
                    previousActiveRow = null;
                    currentActiveIndex = -1;
                }
            }
        };
    }

    // Инициализация
    const tableNav = initTableKeyboardNavigation();

    // Функции переключения таблиц
    function switchToFuelTable() {
        document.getElementById('fuel_section_table').style.display = '';
        document.getElementById('heat_section_table').style.display = 'none';
        document.getElementById('electro_section_table').style.display = 'none';
        tableNav.clearSelection();
    }

    function switchToHeatTable() {
        document.getElementById('fuel_section_table').style.display = 'none';
        document.getElementById('heat_section_table').style.display = '';
        document.getElementById('electro_section_table').style.display = 'none';
        tableNav.clearSelection();
    }

    function switchToElectroTable() {
        document.getElementById('fuel_section_table').style.display = 'none';
        document.getElementById('heat_section_table').style.display = 'none';
        document.getElementById('electro_section_table').style.display = '';
        tableNav.clearSelection();
    }
});

document.getElementById('export-table-btn').addEventListener('click', function() {
    document.getElementById('export-table-form').submit();
});


