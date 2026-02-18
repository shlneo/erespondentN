function addCsrfTokenToForm(form) {
    var csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
    if (!csrfToken) return;
    
    var csrfInput = form.querySelector('input[name="csrf_token"]');
    if (!csrfInput) {
        csrfInput = document.createElement('input');
        csrfInput.type = 'hidden';
        csrfInput.name = 'csrf_token';
        form.appendChild(csrfInput);
    }
    csrfInput.value = csrfToken;
}

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
    let rows = document.querySelectorAll('.table-report-area .dirUnit tr');

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
    const tables = document.querySelectorAll('.table-report-area');
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
    if(document.querySelector('.table-report-area')){
        initResizableTables();
    }

    const menuButton = document.getElementById('menu-button');   
    const img = menuButton.querySelector('img'); 
    
    const headerCenter = document.querySelector('.header-center');
    const fixed_header = document.querySelector('.fixed-header');
    
    const usernavigation = document.getElementById('user-navigation');
    const overlay = document.querySelector('.overlay');
    
    function showHeaderCenter() {
        if (headerCenter && overlay) {
            usernavigation.classList.add('hidden');
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
                img.classList.remove('rotate');
                hideHeaderCenter();
            } else {
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
    
    function showusernavigation() {
        if (usernavigation && overlay) {
            headerCenter.classList.add('hidden');
            usernavigation.classList.remove('hidden');
            usernavigation.classList.add('show');
            overlay.classList.add('show');
        }
    }
    
    function hideusernavigation() {
        if (usernavigation && overlay) {
            usernavigation.classList.remove('show');
            usernavigation.classList.add('hidden');
            overlay.classList.remove('show');
        }
    }
    
    function setupEventListeners(element) {
        element.addEventListener('click', function(event) {
            clearTimeout(timeoutId);
            showusernavigation();
            event.stopPropagation();
        });
    }
    
    if (usernavigation && overlay) {
        document.addEventListener('click', function(event) {
            if (!usernavigation.contains(event.target)) {
                hideusernavigation();
            }
        });
    
        usernavigation.addEventListener('click', function(event) {
            event.stopPropagation();
        });
    }
    

    userImgs.forEach(setupEventListeners);
    document.addEventListener('click', function(event) {
        if (!usernavigation.contains(event.target)) {
            hideusernavigation();
        }
    });
    
    usernavigation.addEventListener('click', function(event) {
        event.stopPropagation();
    });
    /* end hoveruser panel */

    /* ============= report_area =============*/
    var reportRows = document.querySelectorAll('.report_row');
    var previousReportRow = null;

    var contextMenuReport = document.getElementById('contextMenu_report');

    reportRows.forEach(function(row) {
        row.addEventListener('click', function() {
            activeRow = null;
            updateHeaderButtonStyle(true, true, true, true);
            if (this.dataset.id) {
                selectedReportId = this.dataset.id;
                if (this.classList.contains('active-report')) {
                    this.classList.remove('active-report');
                    previousReportRow = null;
                    updateHeaderButtonStyle(false, false, false, false);
                } else {
                    if (previousReportRow !== null) {
                        previousReportRow.classList.remove('active-report');
                    }
                    this.classList.add('active-report');
                    previousReportRow = this;
                }
            }
        });
        row.addEventListener('contextmenu', function(event) {
            event.preventDefault();

            if (this.dataset.id) {
                selectedReportId = this.dataset.id;
                
                if (previousReportRow !== null) {
                    previousReportRow.classList.remove('active-report');
                }
                this.classList.add('active-report');
                
                updateHeaderButtonStyle(true, true, true, true);
                previousReportRow = this;
        
                contextMenuReport.style.top = event.pageY + 'px';
                contextMenuReport.style.left = event.pageX + 'px';
                contextMenuReport.style.display = 'flex';
            }
        });
    });

    document.addEventListener('click', function(event) {
        if (!contextMenuReport.contains(event.target)) {
            contextMenuReport.style.display = 'none';
        }
    });
    /*end*/

    /*Переход на страницу с fuel*/
    // document.querySelector('[data-action="editSectionButtonMenu"]').addEventListener('click', function() {
    //     var activeReport = document.querySelector('.report_row.active-report');
    //     if (activeReport) {
    //         var id = activeReport.dataset.versionId;
    //         var url = "/report-area/fuel/" + id;
    //         window.location.href = url;
    //     } else {
    //         alert('Пожалуйста, выберите отчет.');
    //     }
    // });
    /*end*/

    handleModal(document.getElementById('add_report_modal'), document.getElementById('link_add_report'), document.getElementById('close_add_report_modal'));
    handleModal(document.getElementById('change_period_report_modal'), document.getElementById('link_change_report'), document.getElementById('close_change_period_report_modal'));
    handleModal(document.getElementById('copy_report_modal'), document.getElementById('link_coppy_report'), copy_report_modal.querySelector('.close'));
    handleModal(document.getElementById('SentModal'), document.getElementById('sentVersionButton'), SentModal.querySelector('.close'));

    link_change_report.addEventListener('click', function(event) {
        event.preventDefault();
        var reportRow = document.querySelector('.report_row.active-report');
        if (reportRow) {
            var reportId = reportRow.querySelector('#report_id').value;
            var reportYear = reportRow.querySelector('#report_year').value;
            var reportQuarter = reportRow.querySelector('#report_quarter').value;

            document.getElementById('modal_change_report_id').value = reportId;
            document.getElementById('selected-year-change').value = reportYear;
            document.getElementById('selected-quarter-change').value = reportQuarter;

            if (window.periodSelectors && window.periodSelectors.change) {
                window.periodSelectors.change.setYear(parseInt(reportYear));
                if (reportQuarter) {
                    window.periodSelectors.change.setQuarter(reportQuarter);
                }
            }
        }
        change_period_report_modal.classList.add('active');
        contextMenuReport.style.display = 'none';
    });

    link_coppy_report.addEventListener('click', function(event) {
        event.preventDefault();
        var reportRow = document.querySelector('.report_row.active-report');
        if (reportRow) {
            var reportId = reportRow.querySelector('#report_id').value;
            var reportYear = reportRow.querySelector('#report_year').value;
            var reportQuarter = reportRow.querySelector('#report_quarter').value;

            document.getElementById('modal_copy_report_id').value = reportId;
            document.getElementById('selected-year-copy').value = reportYear;
            document.getElementById('selected-quarter-copy').value = reportQuarter;

            if (window.periodSelectors && window.periodSelectors.copy) {
                window.periodSelectors.copy.setYear(parseInt(reportYear));
                if (reportQuarter) {
                    window.periodSelectors.copy.setQuarter(reportQuarter);
                }
            }
        }
        copy_report_modal.classList.add('active');
        contextMenuReport.style.display = 'none';
    });

    const del_reportButton = document.getElementById('del_reportButton');
    del_reportButton.addEventListener('click', function(event) {
        var activeRow = document.querySelector('.report_row.active-report');
        if (activeRow !== null) {
            var ReportId = activeRow.dataset.id;
            if (ReportId) {
                var deleteForm = document.getElementById('deleteReport');
                deleteForm.action = '/delete-report/' + ReportId;
                addCsrfTokenToForm(deleteForm);
            }
        } else {
            alert('Выберите отчет для удаления');
            event.preventDefault();
        }
    });

    
    const agreedVersionButton = document.getElementById('agreedVersionButton');
    const controlVersionButton = document.getElementById('control_versionButton');
    const sentVersionButton = document.getElementById('sentVersionButton');
    const exportVersionButton = document.getElementById('export_versionButton');

    function updateHeaderButtonStyle(agreedActive, controlActive, sentActive, exportActive) {
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
    }

    const activeAgreedRow = document.querySelector('.report_row.active-report');
    updateHeaderButtonStyle(activeAgreedRow !== null, activeAgreedRow !== null, activeAgreedRow !== null, activeAgreedRow !== null);

    controlVersionButton.addEventListener('click', function(event) {
        var activeControlRow = document.querySelector('.report_row.active-report');
        if (activeControlRow !== null) {
            var controlForm = document.getElementById('control-version-form');
            var id = activeControlRow.dataset.versionId;
            if (id) {
                controlForm.action = '/control-version/' + id;
                addCsrfTokenToForm(controlForm);
                controlForm.submit();
            }
        } else {
            event.preventDefault();
        }
    });

    agreedVersionButton.addEventListener('click', function(event) {
        var activeRow = document.querySelector('.report_row.active-report');
        if (activeRow !== null) {
            var agreedForm = document.getElementById('agreed-version-form');
            var id = activeRow.dataset.versionId;
            if (id) {
                agreedForm.action = '/agreed-version/' + id;
                addCsrfTokenToForm(agreedForm);
                agreedForm.submit();
            }
        } else {
            event.preventDefault();
        }
    });

    exportVersionButton.addEventListener('click', function(event) {
        var activeexportRow = document.querySelector('.report_row.active-report');
        if (activeexportRow !== null) {
            var exportForm = document.getElementById('export-version-form');
            var id = activeexportRow.dataset.versionId;
            if (id) {
                exportForm.action = '/export-version/' + id;
                addCsrfTokenToForm(exportForm);
                exportForm.submit();
            }
        } else {
            event.preventDefault();
        }
    });
    
    // PrintTicketButton.addEventListener('click', function(event) {
    //     var activePrintRow = document.querySelector('.ticket-row.active-ticket');
    //     if (activePrintRow !== null) {
    //         var ticketId = activePrintRow.dataset.id;
    //         if (ticketId) {
    //             printForm.action = '/print-ticket/' + ticketId;
    //             printForm.submit();
    //         }
    //     } else {
    //         event.preventDefault();
    //     }
    // });
});

document.addEventListener('DOMContentLoaded', function() {
    const dropArea = document.getElementById("drop-area");
    const fileInput = document.getElementById("certificate_to_check");

    var send_button = document.getElementById('send_button');
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

    send_button.addEventListener('click', function(event) {
        var activeRow = document.querySelector('.report_row.active-report');
        if (activeRow !== null) {
            var id = activeRow.dataset.versionId;
            if (id) {
                sentForm.action = '/sent-version/' + id;
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
    table = document.querySelector(".table-report-area tbody");
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
if (document.getElementById('link_stats')) {
    handleModal(document.getElementById('load_stats_modal'), document.getElementById('link_stats'), load_stats_modal.querySelector('.close'));
}

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
    
    var csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
    
    fetch(`/delete_message/${messageId}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken
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

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}

function setCookie(name, value, days) {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
}

if (window.location.pathname.includes('/FAQ')) {
    setCookie('faq_visited', 'true', 365);
}

document.addEventListener('DOMContentLoaded', function() {
    const phoneElements = document.querySelectorAll('.phone-hidden');
    
    if (getCookie('faq_visited') === 'true') {
        phoneElements.forEach(phone => {
            phone.classList.remove('phone-hidden');
        });
    }
    
    const faqLinks = document.querySelectorAll('.faq-link');
    faqLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.stopPropagation();
            window.location.href = '/FAQ';
        });
    });
    
    phoneElements.forEach(phone => {
        phone.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = '/FAQ';
        });
    });
});

