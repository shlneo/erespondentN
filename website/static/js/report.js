document.addEventListener('DOMContentLoaded', function() {
    var section_row = document.querySelectorAll('.section_row');
    var previousfuelRow = null;
    var selectedfuelId = null;
    var contextMenu_report = document.getElementById('contextMenu_report');
    var remove_section = document.getElementById('remove_section');
    var longPressTimer = null;
    var LONG_PRESS_DELAY = 500;
    var isLongPress = false;

    function showContextMenu(event, row, index) {
        event.preventDefault();
        if (row.dataset.id) {
            if (!row.classList.contains('active-report')) {
                selectRow(row, index);
            }
            
            var pageX, pageY;
            if (event.touches) {
                pageX = event.touches[0].pageX;
                pageY = event.touches[0].pageY;
            } else {
                pageX = event.pageX;
                pageY = event.pageY;
            }
            
            contextMenu_report.style.top = pageY + 'px';
            contextMenu_report.style.left = pageX + 'px';
            contextMenu_report.style.display = 'flex';
            
            if (navigator.vibrate) {
                navigator.vibrate(50);
            }
        }
    }

    section_row.forEach(function(row, index) {
        row.addEventListener('click', function(event) {
            if (isLongPress) {
                isLongPress = false;
                return;
            }
            
            if (event.button === 0 && this.dataset.id) {
                selectRow(this, index);
            }
        });

        row.addEventListener('contextmenu', function(event) {
            event.preventDefault();
            showContextMenu(event, this, index);
        });
        
        row.addEventListener('touchstart', function(event) {
            isLongPress = false;
            longPressTimer = setTimeout(() => {
                isLongPress = true;
                showContextMenu(event, this, index);
            }, LONG_PRESS_DELAY);
        });
        
        row.addEventListener('touchmove', function(event) {
            clearTimeout(longPressTimer);
        });
        
        row.addEventListener('touchend', function(event) {
            clearTimeout(longPressTimer);
        });
        
        row.addEventListener('touchcancel', function(event) {
            clearTimeout(longPressTimer);
        });
    });

    document.addEventListener('click', function(event) {
        if (!contextMenu_report.contains(event.target)) {
            contextMenu_report.style.display = 'none';
        }
    });

    document.addEventListener('touchstart', function(event) {
        if (!contextMenu_report.contains(event.target)) {
            contextMenu_report.style.display = 'none';
        }
    });

    function selectRow(row, index) {
        selectedfuelId = row.dataset.id;
        
        var productCodeInput = row.querySelector('.product-cod_fuel');
        var productCode = productCodeInput ? productCodeInput.value : '';
        
        if (row.classList.contains('active-report')) {
            row.classList.remove('active-report');
            row.querySelectorAll('input').forEach(function(input) {
                input.classList.remove('active-input');
            });
            previousfuelRow = null;
            remove_section.disabled = true;
            link_changefuel_modal.disabled = true;
        } else {
            if (previousfuelRow !== null) {
                previousfuelRow.classList.remove('active-report');
                previousfuelRow.querySelectorAll('input').forEach(function(input) {
                    input.classList.remove('active-input');
                });
            }
            
            row.classList.add('active-report');
            row.querySelectorAll('input').forEach(function(input) {
                input.classList.add('active-input');
            });
            previousfuelRow = row;
            
            if (productCode === '9010') {
                remove_section.disabled = true;
                link_changefuel_modal.disabled = false;
            } 
            else if (productCode === '9100' || productCode === '9001') {
                remove_section.disabled = true;
                link_changefuel_modal.disabled = true;
            }
            else {
                remove_section.disabled = false;
                link_changefuel_modal.disabled = false;
            }
        }
    }

    var nameOfProductInput = document.querySelector('input[name="name_of_product"]');
    var add_id_productInput = document.querySelector('input[name="add_id_product"]');
    var chooseProductArea = document.querySelector('.choose-product-area');
    var chooseProdTableBody = document.getElementById('chooseProdTableBody');
    var nameOfProductButton = document.getElementById('nameOfProductButton');

    nameOfProductButton.addEventListener('click', function() {
        if (chooseProductArea.style.display === 'none' || chooseProductArea.style.display === '') {
            chooseProductArea.style.display = 'flex';
            nameOfProductButton.textContent = '-';
            document.querySelector('input[name="search_product"]').value = '';
            filterProducts('');
        } else {        chooseProductArea.style.display = 'none';
            nameOfProductButton.textContent = '+';
        }
    });

    chooseProdTableBody.addEventListener('click', function(event) {
        if (event.target.tagName === 'TD') {
            var productName = event.target.parentNode.querySelector('td:nth-child(2)').textContent;
            var productId = event.target.parentNode.querySelector('td:nth-child(4)').textContent;
            nameOfProductInput.value = productName;
            nameOfProductInput.title = productName;
            add_id_productInput.value = productId;
            chooseProductArea.style.display = 'none';
            nameOfProductButton.textContent = '+';
        }   
    });
    
    remove_section.addEventListener('click', function(event) {
        var activeRow = document.querySelector('.section_row.active-report');
        if (activeRow !== null) {
            var section_id = activeRow.dataset.id;
            if (section_id) {
                var deleteForm = document.getElementById('remove_section_form');
                deleteForm.action = '/remove_section/' + section_id;
                addCsrfTokenToForm(deleteForm);
            }
        } else {
            alert('Выберите продукцию для удаления');
            event.preventDefault();
        }
    });

    function openChangefuel_modal() {
        var activeRow = document.querySelector('.section_row.active-report');
        if (activeRow) {

            var productCode = activeRow.querySelector('.product-cod_fuel').value;
            var productName = activeRow.querySelector('.product-name_fuel').value;

            function replaceDotsWithCommas(value) {
                return (value || '').replace(/\./g, ',');
            }

            document.getElementById('modal_product_name').value = productName;
            document.getElementById('modal_oked').value = activeRow.querySelector('input[name="Oked_fuel"]').value;
            document.getElementById('modal_produced').value = replaceDotsWithCommas(activeRow.querySelector('input[name="produced_fuel"]').value);
            document.getElementById('modal_Consumed_Quota').value = replaceDotsWithCommas(activeRow.querySelector('input[name="Consumed_Quota_fuel"]').value);
            document.getElementById('modal_Consumed_Fact').value = replaceDotsWithCommas(activeRow.querySelector('input[name="Consumed_Fact_fuel"]').value);
            document.getElementById('modal_Consumed_Total_Quota').value = replaceDotsWithCommas(activeRow.querySelector('input[name="Consumed_Total_Quota_fuel"]').value);
            document.getElementById('modal_Consumed_Total_Fact').value = replaceDotsWithCommas(activeRow.querySelector('input[name="Consumed_Total_Fact_fuel"]').value);
            document.getElementById('modal_note').value = activeRow.querySelector('input[name="note_fuel"]').value;
            document.getElementById('modal_id').value = selectedfuelId;
    
            var inputs = document.querySelectorAll('#changefuel_modal input[type="text"]');
            var isOtherConsumption = productCode === "9010";
            var is7000 = productCode === "7000";
       
            inputs.forEach(function(input, index) {
                if (isOtherConsumption) {
                    if (index < inputs.length - 2) {
                        input.style.color = "rgb(132, 132, 132)";
                        input.readOnly = true;
                    } else {
                        input.style.color = "";
                        input.readOnly = false;
                    }
                    input.required = index >= inputs.length - 2;
                } 
                else if (is7000){
                    if (index === 5 || index === 6 || index === 7) {
                        input.readOnly = false;
                        input.style.color = "";
                    }
                    else {
                        input.style.color = "rgb(132, 132, 132)";
                        input.readOnly = true;
                    }
                }
                else {
                    if (index === 0 || index === 1 || index === 4 || index === 5) {
                        input.style.color = "rgb(132, 132, 132)";
                        input.readOnly = true;
                    }
                    else {
                        input.style.color = "";
                        input.readOnly = false;
                    }
                }            
            });
            changefuel_modal.classList.add('active');
        }
    }
    
    document.getElementById('link_changefuel_modal').addEventListener('click', function() {
        if (selectedfuelId) {
            contextMenu_report.style.display = 'none';
            openChangefuel_modal();
        }
    });


    if(document.getElementById('changefuel_modal')){
        handleModal(document.getElementById('changefuel_modal'), document.getElementById('link_changefuel_modal'));
    }

    if(document.getElementById('addSection_modal')){
         handleModal(document.getElementById('addSection_modal'), document.querySelector('[data-action="link_addSection_modal"]'));
    }
});


function filterProducts(searchText) {
    const tbody = document.getElementById('chooseProdTableBody');
    const rows = tbody.querySelectorAll('tr:not(#noResultsRow)');
    const noResultsRow = document.getElementById('noResultsRow');
    let hasVisibleRows = false;
    
    searchText = searchText.toLowerCase().trim();
    
    rows.forEach(row => {
        const codeCell = row.cells[0]; // Код продукта
        const nameCell = row.cells[1]; // Наименование продукта
        let shouldShow = false;
        
        if (codeCell && nameCell) {
            const code = codeCell.textContent.toLowerCase();
            const name = nameCell.textContent.toLowerCase();
            
            if (searchText === '') {
                shouldShow = true;
            } else {
                shouldShow = (code.includes(searchText) || name.includes(searchText));
            }
        }
        
        row.style.display = shouldShow ? '' : 'none';
        if (shouldShow) hasVisibleRows = true;
    });

    if (hasVisibleRows || searchText === '') {
        noResultsRow.style.display = 'none';
    } else {
        noResultsRow.style.display = '';
    }
}

const searchInput = document.querySelector('input[name="search_product"]');
if (searchInput) {
    searchInput.addEventListener('input', function(e) {
        filterProducts(e.target.value);
    });
}

document.getElementById('chooseProdTableBody').addEventListener('click', function(e) {
    const row = e.target.closest('tr');
    if (row && row.getAttribute('data-id')) {
        const productId = row.getAttribute('data-id');
        const productCode = row.cells[0].textContent;
        const productName = row.cells[1].textContent;
        
        console.log('Выбран продукт:', { id: productId, code: productCode, name: productName });
        chooseProductArea.style.display = 'none';
        nameOfProductButton.textContent = '+';
    }
});

document.querySelector('#chooseProdTableBody').addEventListener('click', function(event) {
    var selectedRow = event.target.closest('tr');
    var productCode= selectedRow.querySelector('td:nth-child(1)').textContent;
    var is7000 = productCode === "7000";
    var is0020 = productCode === "0020";
    var is0021 = productCode === "0021";
    var is0024 = productCode === "0024";
    var is0025 = productCode === "0025";
    var is0026 = productCode === "0026";
    var is0027 = productCode === "0027";
    var is0030 = productCode === "0030";
    var is0031 = productCode === "0031";

    if (is7000) {
        var inputs = document.querySelectorAll('.modal_table input');
        inputs.forEach(function(input) {
            var inputName = input.getAttribute('name');
            if (inputName !== 'oked_add' && inputName !== 'Consumed_Total_Quota_add' && inputName !== 'Consumed_Total_Fact_add' && inputName !== 'note_add' && inputName !== 'current_version' &&  inputName !== 'add_id_product' &&  inputName !== 'search_product' &&  inputName !== 'section_number') {
                input.readOnly = true;
                if (inputName !== 'name_of_product'){
                    input.style.color = "rgb(132, 132, 132)";
                    input.value = '0,00';
                }
            } else {
                input.readOnly = false;
                input.style.color = "";
            }   
        });
    }
    else if (is0020 || is0021 || is0024 || is0025 || is0026 || is0027 || is0030 || is0031){
        var inputs = document.querySelectorAll('.modal_table input');
        inputs.forEach(function(input) {
            var inputName = input.getAttribute('name');
            if (inputName !== 'Consumed_Total_Fact_add' && inputName !== 'produced_add' && inputName !== 'Consumed_Quota_add' && inputName !== 'note_add' && inputName !== 'current_version' &&  inputName !== 'add_id_product' &&  inputName !== 'search_product' &&  inputName !== 'section_number') {
                input.readOnly = true;
                if (inputName !== 'name_of_product' && inputName !== 'oked_add'){
                    input.style.color = "rgb(132, 132, 132)";
                    input.value = '0,00';     
                }
                else if(inputName === 'oked_add'){
                    input.readOnly = true;  
                    input.value = '';
                    input.style.color = "rgb(132, 132, 132)";
                }
            } else {
                input.readOnly = false;
                input.style.color = "";   
            }   
        });
    } 
    else {
        var inputs = document.querySelectorAll('.modal_table input');
        inputs.forEach(function(input) {
            var inputName = input.getAttribute('name');
            if (inputName !== 'oked_add' && inputName !== 'produced_add' && inputName !== 'Consumed_Quota_add' && inputName !== 'Consumed_Total_Fact_add' && inputName !== 'note_add' && inputName !== 'current_version' &&  inputName !== 'add_id_product' &&  inputName !== 'search_product' &&  inputName !== 'section_number') {
                input.readOnly = true;
                if (inputName !== 'name_of_product'){
                    input.style.color = "rgb(132, 132, 132)";
                    input.value = '0,00';
                }
            } else {
                input.readOnly = false;
                input.style.color = "";
            }
        });
    }
});

if(document.getElementById('control-report-btn')){
    document.getElementById('control-report-btn').addEventListener('click', function() {
        document.getElementById('control-report-form').submit();
    });
}

if(document.getElementById('agreed-report-btn')){
    document.getElementById('agreed-report-btn').addEventListener('click', function() {
        document.getElementById('agreed-report-form').submit();
    });
}

if(document.getElementById('sent-report-btn')){
    handleModal(document.getElementById('SentModal'), document.getElementById('sent-report-btn'));
}

if(document.getElementById('cancel-sending-btn')){
    document.getElementById('cancel-sending-btn').addEventListener('click', function() {
        document.getElementById('cancel-sending-form').submit();
    });
}

document.getElementById('export-table-btn').addEventListener('click', function() {
    document.getElementById('export-table-form').submit();
});

function scrollToTickets() {
    const formElement = document.getElementById('ticket-area');
    if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth' });
    }
}