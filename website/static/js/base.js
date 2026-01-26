const header = document.querySelector('.fixed-header');

function scrollToForm() {
    const formElement = document.getElementById('toadmin');
    if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth' });
    }
}

window.addEventListener('scroll', () => {
    if (window.scrollY > 0) {
        header.style.backgroundColor = 'white';
        if (window.innerWidth >= 1000) {
            header.style.boxShadow = '0 0 20px rgba(0, 0, 0, 0.1)';
        } else {
            header.style.boxShadow = 'none';
        }
    } else {
        header.style.backgroundColor = 'transparent';
        header.style.boxShadow = 'none';
    }
});


window.addEventListener('resize', () => {
    if (window.scrollY > 0) {
        if (window.innerWidth < 1000) {
            header.style.boxShadow = 'none';
        }
    }
});


const clearButtons = document.querySelectorAll('.clear-btn');
clearButtons.forEach(btn => {
    btn.addEventListener('click', function() {
        const input = this.previousElementSibling;
        if (input && input.tagName === 'INPUT') {
            input.value = '';
        }
    });
});

function searchUnit() {
    let input = document.getElementById('searchUnit').value.toLowerCase();
    let rows = document.querySelectorAll('.table_report-area .dirUnit tr');

    rows.forEach(row => {
        let code = row.cells[0].querySelector('input').value.toLowerCase();
        let name = row.cells[1].querySelector('input').value.toLowerCase();
        
        if (code.includes(input) || name.includes(input)) {
            row.style.display = ''; 
        } else {
            row.style.display = 'none';
        }
    });
}

function searchUnitProduct() {
    let input = document.getElementById('searchUnitProduct').value.toLowerCase();
    let rows = document.querySelectorAll('.dirUnitProduct tr');

    rows.forEach(row => {
        let code = row.cells[0].querySelector('input').value.toLowerCase();
        let name = row.cells[1].querySelector('input').value.toLowerCase();
        if (code.includes(input) || name.includes(input)) {
            row.style.display = '';  
        } else {
            row.style.display = 'none'; 
        }
    });
}

function setupPasswordToggle(passwordFieldId, showIconClass, hideIconClass) {
    const passwordField = document.querySelector(`#${passwordFieldId}`);
    const showPasswordIcon = document.querySelector(`.${showIconClass}`); 
    const hidePasswordIcon = document.querySelector(`.${hideIconClass}`);
    
    if (passwordField && showPasswordIcon && hidePasswordIcon) {
        showPasswordIcon.style.display = 'none';
        hidePasswordIcon.style.display = 'none';

        function showIcons() {
            updateIconsVisibility();
            showPasswordIcon.style.visibility = 'visible';
            hidePasswordIcon.style.visibility = 'visible';
        }

        function hideIcons() {
            showPasswordIcon.style.visibility = 'hidden';
            hidePasswordIcon.style.visibility = 'hidden';
        }

        function updateIconsVisibility() {
            if (passwordField.type === 'password') {
                showPasswordIcon.style.display = 'inline';
                hidePasswordIcon.style.display = 'none';
            } else {
                showPasswordIcon.style.display = 'none';
                hidePasswordIcon.style.display = 'inline';
            }
        }

        passwordField.addEventListener('mouseover', showIcons);
        showPasswordIcon.addEventListener('mouseover', showIcons);
        hidePasswordIcon.addEventListener('mouseover', showIcons);

        passwordField.addEventListener('mouseout', hideIcons);
        showPasswordIcon.addEventListener('mouseout', hideIcons);
        hidePasswordIcon.addEventListener('mouseout', hideIcons);

        showPasswordIcon.addEventListener('click', function() {
            passwordField.type = 'text';
            updateIconsVisibility();
        });

        hidePasswordIcon.addEventListener('click', function() {
            passwordField.type = 'password';
            updateIconsVisibility();
        });
    }
}

function filterSentedReports() {
    var year = document.getElementById('quantity_year').value;
    var quarter = document.getElementById('quantity_quarter').value;
    var url = `/audit-area/all_reports?year=${year}&quarter=${quarter}`;
    window.location.href = url;
}

// function increment_year() {
//     var input = document.getElementById("quantity_year");
//     input.value = parseInt(input.value) + 1;
// }

// function decrement_year() {
//     var input = document.getElementById("quantity_year");
//     if (parseInt(input.value) > 0) {
//         input.value = parseInt(input.value) - 1;
//     }
// }

// function increment_quarter() {
//     var input = document.getElementById("quantity_quarter");
//     var value = parseInt(input.value);

//     if (value < 4) {
//         input.value = value + 1;
//     }
// }

// function decrement_quarter() {
//     var input = document.getElementById("quantity_quarter");
//     var value = parseInt(input.value);

//     if (value > 1) {
//         input.value = value - 1;
//     }
// }

// function coppy_increment_year() {
//     var input = document.getElementById("coppy_quantity_year");
//     input.value = parseInt(input.value) + 1;
// }

// function coppy_decrement_year() {
//     var input = document.getElementById("coppy_quantity_year");
//     if (parseInt(input.value) > 0) {
//         input.value = parseInt(input.value) - 1;
//     }
// }

// function coppy_increment_quarter() {
//     var input = document.getElementById("coppy_quantity_quarter");
//     var value = parseInt(input.value);

//     if (value < 4) {
//         input.value = value + 1;
//     }
// }

// function coppy_decrement_quarter() {
//     var input = document.getElementById("coppy_quantity_quarter");
//     var value = parseInt(input.value);

//     if (value > 1) {
//         input.value = value - 1;
//     }
// }

// function edit_increment_year() {
//     var input = document.querySelector('input[name="modal_change_report_year"]');
//     input.value = parseInt(input.value) + 1;
// }

// function edit_decrement_year() {
//     var input = document.querySelector('input[name="modal_change_report_year"]');
//     if (parseInt(input.value) > 0) {
//         input.value = parseInt(input.value) - 1;
//     }
// }

// function edit_increment_quarter() {
//     var input = document.querySelector('input[name="modal_change_report_quarter"]');
//     var value = parseInt(input.value);

//     if (value < 4) {
//         input.value = value + 1;
//     }
// }

// function edit_decrement_quarter() {
//     var input = document.querySelector('input[name="modal_change_report_quarter"]');
//     var value = parseInt(input.value);

//     if (value > 1) {
//         input.value = value - 1;
//     }
// }

function changeValueByButton(button) {
    // Находим связанный input (предыдущий или следующий элемент)
    const container = button.closest('.input-container');
    const input = container.querySelector('input[data-type]');
    const type = input.getAttribute('data-type');
    const isIncrement = button.classList.contains('dis_button');
    const delta = isIncrement ? 1 : -1;
    
    // Конфигурация по типам
    const configs = {
        'year': { min: 0, max: Infinity },
        'quarter': { min: 1, max: 4 }
    };
    
    const config = configs[type] || { min: -Infinity, max: Infinity };
    const currentValue = parseInt(input.value) || config.min;
    const newValue = currentValue + delta;
    
    // Проверяем границы
    if (newValue >= config.min && newValue <= config.max) {
        input.value = newValue;
        // Триггерим события если нужно
        input.dispatchEvent(new Event('change', { bubbles: true }));
    }
}



/* message-animation */
(function() {
    var alertBox = document.querySelector('.custom-alert');
    if (alertBox) {
        var progressBar = alertBox.querySelector('.notif-progress');
        if (progressBar) {
            progressBar.style.animation = 'runProgress-mes 7.7s linear forwards';
        }
        setTimeout(function() {
            alertBox.classList.add('show');
        }, 100); 

        setTimeout(function() {
            alertBox.classList.remove('show');
            alertBox.classList.add('hidden');
        }, 7700); 
    }
})();
/* end message-animation */

/* only numbers */
var numericInputs = document.querySelectorAll('.numericInput');
numericInputs.forEach(function(input) {
    input.addEventListener('input', function(event) {
        this.value = this.value.replace(/\D/g, '');
    });
});
/* end only numbers */

/* numbers + dot only */
var numeric_dotInputs = document.querySelectorAll('.numeric_dotInput');
numeric_dotInputs.forEach(function(input) {
    input.addEventListener('input', function(event) {
        var oldValue = this.value;
        var selectionStart = this.selectionStart;
        var selectionEnd = this.selectionEnd;
        
        var value = oldValue.replace(/[^\d.]/g, '');
        var parts = value.split('.');
        if (parts.length > 1) {
            value = parts[0] + '.' + parts[1].slice(0, 2);
        }
        
        if (value.startsWith('0') && value.length > 1 && value[1] !== '.') {
            value = value.substring(1);
        }

        if (!value.includes('.')) {
            value += '.00';
        }

        var oldDotIndex = oldValue.indexOf('.');
        var newDotIndex = value.indexOf('.');

        this.value = value;

        if (selectionEnd - selectionStart > 1) {
            this.setSelectionRange(selectionEnd, selectionEnd);
        } else if (selectionStart <= oldDotIndex) {
            var cursorPos = selectionStart + (newDotIndex - oldDotIndex);
            this.setSelectionRange(cursorPos, cursorPos);
        } else {
            this.setSelectionRange(selectionStart, selectionStart);
        }
    });

    input.addEventListener('focus', function(event) {
        if (this.value === '') {
            this.value = '0.00';
        }

        var dotIndex = this.value.indexOf('.');
        if (dotIndex !== -1) {
            this.setSelectionRange(dotIndex, dotIndex);
        }
    });

    input.addEventListener('click', function(event) {
        this.select();
    });
});
/* end numbers + dot only */

function initResizableTables() {
    const tables = document.querySelectorAll('.table_report-area');
    tables.forEach(table => {
        const thElements = table.querySelectorAll('th.resizable');
        let isResizing = false;
        let startX = 0;
        let startWidth = 0;
        let currentTh = null;

        thElements.forEach(th => {
            const resizer = th.querySelector('.resizer');
            if (resizer) {
                resizer.addEventListener('mousedown', function(e) {
                    isResizing = true;
                    startX = e.clientX;
                    startWidth = th.offsetWidth;
                    currentTh = th;
                    document.body.style.cursor = 'col-resize';
                    e.preventDefault();
                });
            }
        });

        table.addEventListener('mousemove', function(e) {
            if (isResizing) {
                const newWidth = startWidth + (e.clientX - startX);
                currentTh.style.width = newWidth + 'px';
                currentTh.style.minWidth = newWidth + 'px';
            }
        });

        table.addEventListener('mouseup', function() {
            if (isResizing) {
                isResizing = false;
                document.body.style.cursor = '';
            }
        });

        table.addEventListener('mouseleave', function() {
            if (isResizing) {
                isResizing = false;
                document.body.style.cursor = '';
            }
        });
    });
}


document.addEventListener('DOMContentLoaded', function () {
    if(document.querySelector('.table_report-area')){
        initResizableTables();
    }


    const menuButton = document.getElementById('menu-button');   
    const img = menuButton.querySelector('img'); 
    
    const headerCenter = document.querySelector('.header-center');
    const fixed_header = document.querySelector('.fixed-header');
    
    const userHoverNavigation = document.getElementById('user_hover_navigation');
    const closeHeaderCenter = document.querySelector('.close_header_center');
    const overlay = document.querySelector('.overlay');
    
    function showHeaderCenter() {
        if (headerCenter && overlay) {
            userHoverNavigation.classList.add('hidden');
            headerCenter.classList.remove('hidden');                 
            fixed_header.style.backgroundColor = '#fff';
            headerCenter.classList.add('show');
    
            overlay.classList.add('show');
        }
    }
    
    function hideHeaderCenter() {
        if (headerCenter && overlay) {
            headerCenter.classList.remove('show');
            headerCenter.classList.add('hidden');
            overlay.classList.remove('show');
        }
    }
    
    if (menuButton && headerCenter && overlay) {
        menuButton.addEventListener('click', function(event) {
            if (headerCenter.classList.contains('show')) {
                // Если headerCenter уже показан, скрываем его и удаляем rotate
                img.classList.remove('rotate');
                hideHeaderCenter();
            } else {
                // Если headerCenter скрыт, показываем его и добавляем rotate
                showHeaderCenter();
                img.classList.toggle('rotate');
            }
            event.stopPropagation();
        });
    
        document.addEventListener('click', function(event) {
            if (!headerCenter.contains(event.target) && !menuButton.contains(event.target)) {
                img.classList.remove('rotate'); 
                hideHeaderCenter();
            }
        });
    
        headerCenter.addEventListener('click', function(event) {
            img.classList.remove('rotate'); 
            event.stopPropagation();
        });
    }
    
  /* end menuButton */

    /* show and hide buttons passwords */
    setupPasswordToggle('password-field', 'show-icon', 'hide-icon');
    setupPasswordToggle('password-field1', 'show-icon1', 'hide-icon1');
    /* end show and hide buttons passwords */

    /* hoveruser panel */
    const userImgs = document.querySelectorAll('.icon_black, .icon_white');
    let timeoutId;
    
    function showUserHoverNavigation() {
        if (userHoverNavigation && overlay) {
            headerCenter.classList.add('hidden');
            userHoverNavigation.classList.remove('hidden');
            userHoverNavigation.classList.add('show');
            overlay.classList.add('show');
        }
    }
    
    function hideUserHoverNavigation() {
        if (userHoverNavigation && overlay) {
            userHoverNavigation.classList.remove('show');
            userHoverNavigation.classList.add('hidden');
            overlay.classList.remove('show');
        }
    }
    
    function setupEventListeners(element) {
        element.addEventListener('click', function(event) {
            clearTimeout(timeoutId);
            showUserHoverNavigation();
            event.stopPropagation();
        });
    }
    
    if (userHoverNavigation && overlay) {
        document.addEventListener('click', function(event) {
            if (!userHoverNavigation.contains(event.target)) {
                hideUserHoverNavigation();
            }
        });
    
        userHoverNavigation.addEventListener('click', function(event) {
            event.stopPropagation();
        });
    }
    
    // Для всех иконок обработчик клика
    userImgs.forEach(setupEventListeners);
    
    // Обработчик клика для документа
    document.addEventListener('click', function(event) {
        if (!user_hover_navigation.contains(event.target)) {
            hideUserHoverNavigation();
        }
    });
    
    //  скрытие, если клик был внутри user_hover_navigation
    user_hover_navigation.addEventListener('click', function(event) {
        event.stopPropagation();
    });
    /* end hoveruser panel */

    /* for report_area*/
    var reportRows = document.querySelectorAll('.report_row');
    var versionRows = document.querySelectorAll('.version-row');
    var ticketRows = document.querySelectorAll('.ticket-row');
    
    var previousReportRow = null;
    var previousVersionRow = null;
    var previousTicketRow = null;

    var contextMenuReport = document.getElementById('contextMenu_report');
    var contextMenuVersion = document.getElementById('contextMenu_version');

    reportRows.forEach(function(row) {
        row.addEventListener('click', function() {
            contextMenuVersion.style.display = 'none';
            versionRows.forEach(function(versionRow) {
                versionRow.classList.remove('active-report_version');
            });
            ticketRows.forEach(function(ticketRow) {
                ticketRow.classList.remove('active-ticket');
            });
            activeRow = null;

            updateVersionButtonStyle(false, false, false, false);         
            updateTicketButtonStyle(false);
            if (this.dataset.id) {
                selectedReportId = this.dataset.id;
                if (this.classList.contains('active-report')) {
                    this.classList.remove('active-report');
                    previousReportRow = null;
                    updateVersionButtonStyle(false, false, false, false);
                    updateTicketButtonStyle(false);
                } else {
                    if (previousReportRow !== null) {
                        previousReportRow.classList.remove('active-report');
                    }
                    this.classList.add('active-report');
                    previousReportRow = this;
                }
            }
        });

        row.addEventListener('dblclick', function() {
            contextMenuVersion.style.display = 'none';
            var versionsRow = this.nextElementSibling.nextElementSibling;
            if (versionsRow.style.display === 'none' || versionsRow.style.display === '') {
                versionsRow.style.display = 'table-row';
                setTimeout(function() {
                    versionsRow.classList.add('show');
                }, 10);
                contextMenuReport.style.display = 'none';
                contextMenuVersion.style.display = 'none';
            } else {
                versionsRow.classList.remove('show');
                versionsRow.addEventListener('transitionend', function handler() {
                    versionsRow.style.display = 'none';
                    versionsRow.removeEventListener('transitionend', handler);
                });
                contextMenuReport.style.display = 'none';
                contextMenuVersion.style.display = 'none';
            }

            var imgBlack = this.querySelector('.close_black');
            if (imgBlack) {
                imgBlack.classList.toggle('rotated');
            }
        });
        row.addEventListener('contextmenu', function(event) {
            contextMenuVersion.style.display = 'none';
            event.preventDefault();
        
            versionRows.forEach(function(versionRow) {
                versionRow.classList.remove('active-report_version');
            });
        
            if (this.dataset.id) {
                selectedReportId = this.dataset.id;
        
                if (previousReportRow !== null) {
                    previousReportRow.classList.remove('active-report');
                }
                this.classList.add('active-report');
                previousReportRow = this;
        
                contextMenuReport.style.top = event.pageY + 'px';
                contextMenuReport.style.left = event.pageX + 'px';
                contextMenuReport.style.display = 'flex';
            }
        });
    });

    versionRows.forEach(function(row) {
        row.addEventListener('click', function() {
            contextMenuVersion.style.display = 'none';

            reportRowsd.forEach(function(versionRow) {
                versionRow.classList.remove('active-report');
            });

            if (this.dataset.id) {
                selectedVersiontId = this.dataset.id;

                if (this.classList.contains('active-report_version')) {
                    this.classList.remove('active-report_version');
                    previousVersionRow = null;

                } else {
                    if (previousVersionRow !== null) {
                        previousVersionRow.classList.remove('active-report_version');
                    }
                    this.classList.add('active-report_version');
                    previousVersionRow = this;
                }
            }
        });

        

        row.addEventListener('contextmenu', function(event) {
            contextMenuReport.style.display = 'none';
            event.preventDefault();
        
            reportRows.forEach(function(reportRow) {
                reportRow.classList.remove('active-report');
            });
        
            if (this.dataset.id) {
                selectedVersionId = this.dataset.id;
        
                if (previousVersionRow !== null) {
                    previousVersionRow.classList.remove('active-report_version');
                }
                this.classList.add('active-report_version');
                previousVersionRow = this;
        
                contextMenuVersion.style.top = event.pageY + 'px';
                contextMenuVersion.style.left = event.pageX + 'px';
                contextMenuVersion.style.display = 'flex';
            }
        });
    });

    ticketRows.forEach(function(row) {
        row.addEventListener('click', function() {
            reportRowsd.forEach(function(ticketRow) {
                ticketRow.classList.remove('active-ticket');
            });
            if (this.dataset.id) {
                selectedTicketId = this.dataset.id;
    
                if (this.classList.contains('active-ticket')) {
                    this.classList.remove('active-ticket');
                    previousTicketRow = null;
    
                } else {
                    if (previousTicketRow !== null) {
                        previousTicketRow.classList.remove('active-ticket');
                    }
                    this.classList.add('active-ticket');
                    previousTicketRow = this;
                }
            }
        });
    });

    document.addEventListener('click', function(event) {
        if (!contextMenuReport.contains(event.target)) {
            contextMenuReport.style.display = 'none';
        }
        if (!contextMenuVersion.contains(event.target)) {
            contextMenuVersion.style.display = 'none';
        }
    });
    /*end*/

    /*Переход на страницу с fuel*/
    document.querySelectorAll('.version-row').forEach(function(row) {
        row.addEventListener('dblclick', function() {
            var id = this.dataset.id;
            var url = "/report-area/fuel/" + id;
            console.log(id);
            window.location.href = url;
        });
    });


    document.querySelector('[data-action="editSectionButtonMenu"]').addEventListener('click', function() {
        var activeVersionRow = document.querySelector('.version-row.active-report_version');
        if (activeVersionRow) {
            var id = activeVersionRow.dataset.id;
            var url = "/report-area/fuel/" + id;
            console.log(id);
            window.location.href = url;
        } else {
            alert('Нет активной версии. Пожалуйста, выберите версию.');
        }
    });

    document.querySelector('[data-action="checkVersionButton"]').addEventListener('click', function() {
        var activeVersionRow = document.querySelector('.version-row.active-report_version');
        if (activeVersionRow) {
            var id = activeVersionRow.dataset.id;
            var url = "/report-area/fuel/" + id;
            console.log(id);
            window.location.href = url;
        } else {
            alert('Нет активной версии. Пожалуйста, выберите версию.');
        }
    });
    /*end*/

    /*кнопка для отображения версий отчета*/
    var show_versions_button = document.querySelectorAll('.show-versions_button');
    show_versions_button.forEach(function(button) {
        button.addEventListener('click', function(event) {
            event.stopPropagation();
            var versionsRow = this.closest('.report_row').nextElementSibling.nextElementSibling;
            var span = this.querySelector('span');
            
            if (versionsRow.style.display === 'none' || versionsRow.style.display === '') {
                versionsRow.style.display = 'table-row';
                setTimeout(function() {
                    versionsRow.classList.add('show');
                }, 10);
                if (span) span.textContent = 'Скрыть';
                contextMenuReport.style.display = 'none';
                contextMenuVersion.style.display = 'none';
            } else {
                versionsRow.classList.remove('show');
                versionsRow.addEventListener('transitionend', function handler() {
                    versionsRow.style.display = 'none';
                    versionsRow.removeEventListener('transitionend', handler);
                });
                if (span) span.textContent = 'Раскрыть';
                contextMenuReport.style.display = 'none';
                contextMenuVersion.style.display = 'none';
            }
            var imgBlack = this.querySelector('.close_black');
            if (imgBlack) {
                imgBlack.classList.toggle('rotated');
            }
        });
    });
    /*end*/

    /*кнопка для отображения квитанций отчета*/
    var showCheksButtons = document.querySelectorAll('.show-tickets_button');   
    showCheksButtons.forEach(function(button) {
        button.addEventListener('click', function(event) {
            event.stopPropagation();
            var checkRow = this.closest('.version-row').nextElementSibling;
            var span = this.querySelector('span');
            
            if (checkRow.style.display === 'none' || checkRow.style.display === '') {
                checkRow.style.display = 'table-row';
                setTimeout(function() {
                    checkRow.classList.add('show');
                }, 10);
                if (span) span.textContent = 'Скрыть';
                contextMenuReport.style.display = 'none';
                contextMenuVersion.style.display = 'none';
            } else {
                checkRow.classList.remove('show');
                checkRow.addEventListener('transitionend', function handler() {
                    checkRow.style.display = 'none';
                    checkRow.removeEventListener('transitionend', handler);
                });
                if (span) span.textContent = 'Раскрыть';
                contextMenuReport.style.display = 'none';
                contextMenuVersion.style.display = 'none';
            }
            var imgBlack = this.querySelector('.close_black');
            if (imgBlack) {
                imgBlack.classList.toggle('rotated');
            }
        });
    });
    /*end*/


    handleModal(document.getElementById('add_report_modal'), document.getElementById('link_add_report'), document.getElementById('close_add_report_modal'));
    handleModal(document.getElementById('change_report_modal'), document.getElementById('link_change_report'), document.getElementById('close_change_report_modal'));
    handleModal(document.getElementById('coppy_report_modal'), document.getElementById('link_coppy_report'), coppy_report_modal.querySelector('.close'));
    handleModal(document.getElementById('coppy_second_report_modal'), document.getElementById('link_second_coppy_report'), coppy_second_report_modal.querySelector('.close'));
    handleModal(document.getElementById('SentModal'), document.getElementById('sentVersionButton'), SentModal.querySelector('.close'));

    link_change_report.addEventListener('click', function(event) {
        event.preventDefault();
        var reportRow = document.querySelector('.report_row.active-report');
        if (reportRow) {
            var reportId = reportRow.querySelector('#report_id').value;
            var reportOkpo = reportRow.querySelector('#report_okpo').value;
            var organizationName = reportRow.querySelector('#report_organization_name').value;
            var reportYear = reportRow.querySelector('#report_year').value;
            var reportQuarter = reportRow.querySelector('#report_quarter').value;
            
            document.getElementById('modal_report_id').value = reportId;
            document.getElementById('modal_organization_name').value = organizationName;
            document.getElementById('modal_report_okpo').value = reportOkpo;
            document.getElementById('modal_report_year').value = reportYear;
            document.getElementById('modal_report_quarter').value = reportQuarter;
        }
        change_report_modal.classList.add('active');
        contextMenuReport.style.display = 'none';
    });


    link_coppy_report.addEventListener('click', function(event) {
        event.preventDefault();
        var reportRow = document.querySelector('.report_row.active-report');
        if (reportRow) {
            var reportId = reportRow.querySelector('#report_id').value;
            document.getElementById('copped_second_id').value = reportId;
        }
        coppy_report_modal.classList.add('active');
        contextMenuReport.style.display = 'none';
    });

    link_second_coppy_report.addEventListener('click', function(event) {
        event.preventDefault();
        var reportRow = document.querySelector('.report_row.active-report');
        if (reportRow) {
            var reportId = reportRow.querySelector('#report_id').value;
            document.getElementById('copped_second_id').value = reportId;
        }
        coppy_second_report_modal.classList.add('active');
        contextMenuReport.style.display = 'none';
    });

    var del_reportButton = document.getElementById('del_reportButton');
    del_reportButton.addEventListener('click', function(event) {
        var activeRow = document.querySelector('.report_row.active-report');
        if (activeRow !== null) {
            var ReportId = activeRow.dataset.id;
            if (ReportId) {
                var deleteForm = document.getElementById('deleteReport');
                deleteForm.action = '/delete-report/' + ReportId;
            }
        } else {
            alert('Выберите отчет для удаления');
            event.preventDefault();
        }
    });

    var agreedVersionButton = document.getElementById('agreedVersionButton');
    var agreedForm = document.getElementById('agreed-version-form');

    var controlVersionButton = document.getElementById('control_versionButton');

    var controlForm = document.getElementById('control-version-form');
    var sentVersionButton = document.getElementById('sentVersionButton');

    var exportVersionButton = document.getElementById('export_versionButton');
    var exportForm = document.getElementById('export-version-form');

    var link_edit_sections = document.getElementById('link_edit_sections');


    function updateVersionButtonStyle(agreedActive, controlActive, sentActive, exportActive, editActive) {
        if (agreedActive) {
            agreedVersionButton.style.opacity = '1';
            agreedVersionButton.style.cursor = 'pointer';
            agreedVersionButton.querySelector('img').style.filter = 'none';
            agreedVersionButton.querySelector('a').style.filter = 'none';
        } else {
            agreedVersionButton.style.opacity = '0.5';
            agreedVersionButton.style.cursor = 'not-allowed';
            agreedVersionButton.querySelector('img').style.filter = 'grayscale(100%)';
            agreedVersionButton.querySelector('a').style.filter = 'grayscale(100%)';
        }
        if (controlActive) {
            controlVersionButton.style.opacity = '1';
            controlVersionButton.style.cursor = 'pointer';
            controlVersionButton.querySelector('img').style.filter = 'none';
            controlVersionButton.querySelector('a').style.filter = 'none';
        } else {
            controlVersionButton.style.opacity = '0.5';
            controlVersionButton.style.cursor = 'not-allowed';
            controlVersionButton.querySelector('img').style.filter = 'grayscale(100%)';
            controlVersionButton.querySelector('a').style.filter = 'grayscale(100%)';
        }
        if (sentActive) {
            sentVersionButton.style.opacity = '1';
            sentVersionButton.style.cursor = 'pointer';
            sentVersionButton.querySelector('img').style.filter = 'none';
            sentVersionButton.querySelector('a').style.filter = 'none';
        } else {
            sentVersionButton.style.opacity = '0.5';
            sentVersionButton.style.cursor = 'not-allowed';
            sentVersionButton.querySelector('img').style.filter = 'grayscale(100%)';
            sentVersionButton.querySelector('a').style.filter = 'grayscale(100%)';
        }
        if (exportActive) {
            exportVersionButton.style.opacity = '1';
            exportVersionButton.style.cursor = 'pointer';
            exportVersionButton.querySelector('img').style.filter = 'none';
            exportVersionButton.querySelector('a').style.filter = 'none';
        } else {
            exportVersionButton.style.opacity = '0.5';
            exportVersionButton.style.cursor = 'not-allowed';
            exportVersionButton.querySelector('img').style.filter = 'grayscale(100%)';
            exportVersionButton.querySelector('a').style.filter = 'grayscale(100%)';
        }
        if (editActive) {
            link_edit_sections.style.opacity = '1';
            link_edit_sections.style.cursor = 'pointer';
            link_edit_sections.querySelector('img').style.filter = 'none';
            link_edit_sections.querySelector('a').style.filter = 'none';
        } else {
            link_edit_sections.style.opacity = '0.5';
            link_edit_sections.style.cursor = 'not-allowed';
            link_edit_sections.querySelector('img').style.filter = 'grayscale(100%)';
            link_edit_sections.querySelector('a').style.filter = 'grayscale(100%)';
        }
    }


    var activeAgreedRow = document.querySelector('.version-row.active-report_version');
    updateVersionButtonStyle(activeAgreedRow !== null, activeAgreedRow !== null, activeAgreedRow !== null, activeAgreedRow !== null);

    var versionRows = document.querySelectorAll('.version-row');
    versionRows.forEach(function(row) {
        row.addEventListener('click', function() {
            var isActive = this.classList.contains('active-report_version');

            versionRows.forEach(function(row) {
                row.classList.remove('active-report_version');
            });
            if (isActive) {
                activeAgreedRow = null;
                updateVersionButtonStyle(false, false, false, false, false);
            } else {
                this.classList.add('active-report_version');
                activeAgreedRow = this;
                updateVersionButtonStyle(true, true, true, true, true);
            }
        });
    });

    var PrintTicketButton = document.getElementById('PrintTicketButton');
    var printForm = document.getElementById('print-ticket-form');

    function updateTicketButtonStyle(printActive) {
        if (printActive) {
            PrintTicketButton.style.opacity = '1';
            PrintTicketButton.style.cursor = 'pointer';
            PrintTicketButton.querySelector('img').style.filter = 'none';
            PrintTicketButton.querySelector('a').style.filter = 'none';
        } else {
            PrintTicketButton.style.opacity = '0.5';
            PrintTicketButton.style.cursor = 'not-allowed';
            PrintTicketButton.querySelector('img').style.filter = 'grayscale(100%)';
            PrintTicketButton.querySelector('a').style.filter = 'grayscale(100%)';
        }
    }

    var activePrintRow = document.querySelector('.ticket-row.active-ticket');
    updateTicketButtonStyle(activePrintRow !== null);

    var ticketRows = document.querySelectorAll('.ticket-row');
    ticketRows.forEach(function(row) {
        row.addEventListener('click', function() {
            var isActive = this.classList.contains('active-ticket');
            ticketRows.forEach(function(row) {
                row.classList.remove('active-ticket');
            });
            if (isActive) {
                activeAgreedRow = null;
                updateTicketButtonStyle(false);
            } else {
                this.classList.add('active-ticket');
                activeAgreedRow = this;
                updateTicketButtonStyle(true);
            }
        });
    });

    agreedVersionButton.addEventListener('click', function(event) {
        if (activeAgreedRow === null) {
            event.preventDefault();
        } else {
            var versionId = activeAgreedRow.dataset.id;
            if (versionId) {
                agreedForm.action = '/agreed-version/' + versionId;
                agreedForm.submit();
            }
        }
    });

    controlVersionButton.addEventListener('click', function(event) {
        var activeControlRow = document.querySelector('.version-row.active-report_version');
        if (activeControlRow !== null) {
            var versionId = activeControlRow.dataset.id;
            if (versionId) {
                controlForm.action = '/control-version/' + versionId; // control_version_onReportAreaPage
                controlForm.submit();
            }
        } else {
            event.preventDefault();
        }
    });

    exportVersionButton.addEventListener('click', function(event) {
        var activeexportRow = document.querySelector('.version-row.active-report_version');
        if (activeexportRow !== null) {
            var versionId = activeexportRow.dataset.id;
            if (versionId) {
                exportForm.action = '/export-version/' + versionId;
                exportForm.submit();
            }
        } else {
            event.preventDefault();
        }
    });
    
    PrintTicketButton.addEventListener('click', function(event) {
        var activePrintRow = document.querySelector('.ticket-row.active-ticket');
        if (activePrintRow !== null) {
            var ticketId = activePrintRow.dataset.id;
            if (ticketId) {
                printForm.action = '/print-ticket/' + ticketId;
                printForm.submit();
            }
        } else {
            event.preventDefault();
        }
    });
});

document.addEventListener('DOMContentLoaded', function() {
    const dropArea = document.getElementById("drop-area");
    const fileInput = document.getElementById("certificate_to_check");

    var submit_sent_button = document.getElementById('submit_sent_button');
    var sentForm = document.getElementById('sentForm');

    dropArea.addEventListener("click", function () {
        fileInput.click();
    });


    fileInput.addEventListener("change", function () {
        handleFiles(fileInput.files);
    });

    ["dragenter", "dragover", "dragleave", "drop"].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ["dragenter", "dragover"].forEach(eventName => {
        dropArea.addEventListener(eventName, () => dropArea.classList.add("highlight"), false);
    });
    
    ["dragleave", "drop"].forEach(eventName => {
        dropArea.addEventListener(eventName, () => dropArea.classList.remove("highlight"), false);
    });

    dropArea.addEventListener("drop", function (e) {
        const files = e.dataTransfer.files;
        fileInput.files = files;
        handleFiles(files);
    });

    function handleFiles(files) {
        if (files.length > 0) {
            dropArea.querySelector("p").textContent = `Выбран файл: ${files[0].name}`;
        }
    }

    submit_sent_button.addEventListener('click', function(event) {
        var activesentRow = document.querySelector('.version-row.active-report_version');
        if (activesentRow !== null) {
            var versionId = activesentRow.dataset.id;
            if (versionId) {
                sentForm.action = '/sent-version/' + versionId;
            }
        } else {
            event.preventDefault();
            alert('Выберите отчет перед отправкой!');
        }
    });
});

document.addEventListener('DOMContentLoaded', (event) => {
    /* change pozition modal */
    const headers = document.querySelectorAll(".change-position");
    headers.forEach(header => {
        const modal = header.closest('.modal-content');

        let isDragging = false;
        let startX, startY, initialX, initialY;

        header.addEventListener('mousedown', (e) => {
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            const rect = modal.getBoundingClientRect();
            initialX = rect.left;
            initialY = rect.top;
            modal.style.position = "absolute";
            modal.style.margin = 0;
            document.body.style.userSelect = 'none';
        });
        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                const dx = e.clientX - startX;
                const dy = e.clientY - startY;
                modal.style.left = `${initialX + dx}px`;
                modal.style.top = `${initialY + dy}px`;
            }
        });
        document.addEventListener('mouseup', () => {
            isDragging = false;
            document.body.style.userSelect = 'auto';
        });
    });
    /* end change pozition modal */
});

/* sort table by tt dif */
let sortOrder = 'asc';
function sortTable() {
    var table, rows, switching, i, x, y, shouldSwitch;
    table = document.querySelector(".table_report-area tbody");
    switching = true;
    while (switching) {
        switching = false;
        rows = table.rows;
        for (i = 0; i < (rows.length - 3 - 1); i++) {
            shouldSwitch = false;
            var input1 = rows[i].querySelector('input[name="product-cod_fuel"]');
            var input2 = rows[i + 1].querySelector('input[name="product-cod_fuel"]');
            if (input1 && input2) {
                x = input1.value;
                y = input2.value;
                if (sortOrder === 'asc') {
                    if (parseFloat(x) > parseFloat(y)) {
                        shouldSwitch = true;
                        break;
                    }
                } else {
                    if (parseFloat(x) < parseFloat(y)) {
                        shouldSwitch = true;
                        break;
                    }
                }
            } else {

            }
        }
        if (shouldSwitch) {
            rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
            switching = true;
        } else {
            sortOrder = (sortOrder === 'asc') ? 'desc' : 'asc';
        }
    }
}
/* end sort tablel by tt dif */

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

handleModal(document.getElementById('load_stats_modal'), document.getElementById('link_stats'), load_stats_modal.querySelector('.close'));


function deleteMessage(messageId) {
    const messageElement = document.getElementById(`message-${messageId}`);
    const deleteBtn = messageElement.querySelector('.delete_btn');
    const messageActions = messageElement.querySelector('.message_actions');
    
    const originalText = deleteBtn.innerHTML;
    
    deleteBtn.disabled = true;
    deleteBtn.innerHTML = '⌛ Удаление...';
    deleteBtn.style.opacity = '0.5';
    deleteBtn.style.cursor = 'default';
    
    let secondsLeft = 5;
    
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'cancel_btn';
    cancelBtn.innerHTML = `Отмена (${secondsLeft})`;
    cancelBtn.style.marginLeft = '8px';
    cancelBtn.style.padding = '2px 8px';
    cancelBtn.style.background = '#f56565';
    cancelBtn.style.color = 'white';
    cancelBtn.style.border = 'none';
    cancelBtn.style.borderRadius = '4px';
    cancelBtn.style.cursor = 'pointer';
    cancelBtn.style.fontSize = '12px';
    
    messageActions.appendChild(cancelBtn);
    
    const countdown = setInterval(() => {
        secondsLeft--;
        cancelBtn.innerHTML = `Отмена (${secondsLeft})`;
        
        if (secondsLeft <= 0) {
            clearInterval(countdown);
            performDeletion(messageId, messageElement, deleteBtn, originalText, cancelBtn);
        }
    }, 1000);
    
    const cancelDeletion = () => {
        clearInterval(countdown);
        resetDeleteButton(deleteBtn, originalText);
        cancelBtn.remove();

    };
    
    cancelBtn.addEventListener('click', cancelDeletion);
    
    cancelBtn.__cancelHandler = cancelDeletion;
    
    setTimeout(() => {
        clearInterval(countdown);
        if (deleteBtn.disabled && cancelBtn.parentNode) {
            cancelBtn.removeEventListener('click', cancelBtn.__cancelHandler);
            performDeletion(messageId, messageElement, deleteBtn, originalText, cancelBtn);
        }
    }, 5000);
}

function performDeletion(messageId, messageElement, deleteBtn, originalText, cancelBtn) {
    if (cancelBtn && cancelBtn.parentNode) {
        cancelBtn.remove();
    }
    
    fetch(`/delete_message/${messageId}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            messageElement.style.transition = 'all 0.3s ease';
            messageElement.style.height = messageElement.offsetHeight + 'px';
            
            setTimeout(() => {
                messageElement.style.height = '0';
                messageElement.style.padding = '0';
                messageElement.style.margin = '0';
                messageElement.style.opacity = '0';
                messageElement.style.border = 'none';
                messageElement.style.overflow = 'hidden';
                
                setTimeout(() => {
                    messageElement.remove();
                    checkEmptyState();
                    updateMessageCount(data.remaining_count);
                }, 300);
            }, 50);
        } else {
            showNotification(data.error || 'Ошибка при удалении', 'error');
            resetDeleteButton(deleteBtn, originalText);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('Ошибка соединения с сервером', 'error');
        resetDeleteButton(deleteBtn, originalText);
    });
}

function checkEmptyState() {
    const container = document.getElementById('messagesContainer');
    const messages = container.querySelectorAll('.mes:not(.empty)');
    
    if (messages.length === 0) {
        if (!container.querySelector('.mes.empty')) {
            const emptyDiv = document.createElement('div');
            emptyDiv.className = 'mes empty';
            emptyDiv.innerHTML = `<div class="text_mes">Нет уведомлений</div>`;
            container.appendChild(emptyDiv);
        }
    } else {
        const emptyState = container.querySelector('.mes.empty');
        if (emptyState) {
            emptyState.remove();
        }
    }
}

function updateMessageCount(count) {
    const countElement = document.getElementById('messageCount');
    if (countElement) {
        countElement.textContent = count;
    }
}

function resetDeleteButton(button, originalText) {
    button.disabled = false;
    button.innerHTML = originalText;
    button.style.opacity = '0.7';
    button.style.cursor = 'pointer';
    button.style.opacity = '';
}

function showNotification(text, type) {
    const notification = document.createElement('div');
    notification.textContent = text;
    
    let backgroundColor;
    switch(type) {
        case 'success':
            backgroundColor = '#48bb78';
            break;
        case 'error':
            backgroundColor = '#f56565';
            break;
        case 'info':
            backgroundColor = '#4299e1';
            break;
        default:
            backgroundColor = '#4299e1';
    }
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        background: ${backgroundColor};
        color: white;
        border-radius: 6px;
        z-index: 1000;
        animation: slideIn 0.3s ease;
        font-size: 14px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}


function showReplyForm(messageId, recipientEmail) {
    document.querySelectorAll('.reply_form').forEach(form => {
        form.style.display = 'none';
    });
    
    const replyForm = document.getElementById(`replyForm-${messageId}`);
    const textarea = document.getElementById(`replyText-${messageId}`);
    const recipientName = document.getElementById(`recipientName-${messageId}`);
    
    if (recipientName) {
        recipientName.textContent = recipientEmail;
    }
    
    replyForm.style.display = 'block';
    textarea.value = '';
    textarea.placeholder = `Ответ для ${recipientEmail}`;
    textarea.focus();
    
    replyForm.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Отмена ответа
function cancelReply(messageId) {
    const replyForm = document.getElementById(`replyForm-${messageId}`);
    const textarea = document.getElementById(`replyText-${messageId}`);
    
    textarea.value = '';
    replyForm.style.display = 'none';
}

// Отправка ответа
function submitReply(messageId) {
    const textarea = document.getElementById(`replyText-${messageId}`);
    const replyText = textarea.value.trim();
    const submitBtn = document.querySelector(`#replyForm-${messageId} .reply_submit_btn`);
    
    if (!replyText) {
        flashNotification('Введите текст ответа', 'error');
        return;
    }
    
    submitBtn.disabled = true;
    submitBtn.textContent = 'Отправка...';
    
    fetch(`/reply_to_message/${messageId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            text: replyText
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            flashNotification(data.message || 'Ответ отправлен успешно', 'success');
            
            textarea.value = '';
            const replyForm = document.getElementById(`replyForm-${messageId}`);
            replyForm.style.display = 'none';
            
            if (data.refresh) {
                setTimeout(() => {
                    location.reload();
                }, 1500);
            }
        } else {
            flashNotification(data.error || 'Ошибка при отправке ответа', 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        flashNotification('Ошибка соединения с сервером', 'error');
    })
    .finally(() => {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Отправить';
    });
}

function flashNotification(message, type = 'info') {
    console.log(`${type}: ${message}`);
}