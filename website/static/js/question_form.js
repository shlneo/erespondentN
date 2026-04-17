document.addEventListener('DOMContentLoaded', function() {
    const questionTypeSelect = document.getElementById('questionType');
    const form = document.getElementById('askquestion-form');
    const submitButton = document.getElementById('send-btn');
    
    const addNameInput = document.getElementById('organizationName');
    const addOkpoInput = document.getElementById('organizationOkpo');
    const addYnpInput = document.getElementById('organizationYnp');
    const problemTextarea = document.getElementById('problemDescription');
    
    const newNameInput = document.getElementById('newOrganizationName');
    const newOkpoInput = document.getElementById('newOrganizationOkpo');
    const newYnpInput = document.getElementById('newOrganizationYnp');
    
    const addOrgFields = document.getElementById('addOrgFields');
    const organizationSearchBlock = document.getElementById('organizationSearchBlock');
    const currentOrgInfo = document.getElementById('currentOrgInfo');
    const newOrgData = document.getElementById('newOrgData');
    
    const organizationSearch = document.getElementById('organizationSearch');
    const searchResults = document.getElementById('searchResults');
    
    const selectedOrgId = document.getElementById('selectedOrgId');
    const organizationOldName = document.getElementById('organizationOldName');
    const organizationOldOkpo = document.getElementById('organizationOldOkpo');
    const organizationOldYnp = document.getElementById('organizationOldYnp');
    
    const currentOrgNameSpan = document.getElementById('currentOrgName');
    const currentOrgOkpoSpan = document.getElementById('currentOrgOkpo');
    const currentOrgYnpSpan = document.getElementById('currentOrgYnp');
    
    let searchTimeout = null;
    let currentPage = 1;
    let isLoading = false;
    let hasMore = true;

    function checkOkpoValidity(value) {
        if (value.length === 0) return true;
        if (value.length !== 12) return false;
        const fourthFromEnd = value[value.length - 4];
        const allowedDigits = ['1', '2', '3', '4', '5', '6', '7'];
        return allowedDigits.includes(fourthFromEnd);
    }

    function checkYnpValidity(value) {
        if (value.length === 0) return true;
        return value.length === 9;
    }

    function updateOkpoError(inputElement) {
        if (!inputElement) return;
        const value = inputElement.value;
        const existingError = document.getElementById('okpoError');
        if (existingError) existingError.remove();
        
        if (value.length === 0) {
            inputElement.classList.remove('input-error');
            return;
        }
        
        if (value.length !== 12) {
            inputElement.classList.add('input-error');
            const errorDiv = document.createElement('div');
            errorDiv.id = 'okpoError';
            errorDiv.style.color = 'red';
            errorDiv.style.fontSize = '12px';
            errorDiv.style.marginBottom = '15px';
            errorDiv.textContent = 'ОКПО должен содержать 12 цифр, 9-ая цифра отражает регион остальные могут быть 0';
            inputElement.parentNode.insertBefore(errorDiv, inputElement.nextSibling);
            return;
        }
        
        const fourthFromEnd = value[value.length - 4];
        const allowedDigits = ['1', '2', '3', '4', '5', '6', '7'];
        
        if (!allowedDigits.includes(fourthFromEnd)) {
            inputElement.classList.add('input-error');
            const errorDiv = document.createElement('div');
            errorDiv.id = 'okpoError';
            errorDiv.style.color = 'red';
            errorDiv.style.fontSize = '12px';
            errorDiv.style.marginBottom = '15px';
            errorDiv.textContent = '4-я цифра с конца в коде ОКПО отражает регион, она должна быть от 1 до 7';
            inputElement.parentNode.insertBefore(errorDiv, inputElement.nextSibling);
            return;
        }
        
        inputElement.classList.remove('input-error');
    }

    function updateYnpError(inputElement) {
        if (!inputElement) return;
        const value = inputElement.value;
        const existingError = document.getElementById('ynpError');
        if (existingError) existingError.remove();
        
        if (value.length === 0) {
            inputElement.classList.remove('input-error');
            return;
        }
        
        if (value.length !== 9) {
            inputElement.classList.add('input-error');
            const errorDiv = document.createElement('div');
            errorDiv.id = 'ynpError';
            errorDiv.style.color = 'red';
            errorDiv.style.fontSize = '12px';
            errorDiv.style.marginBottom = '15px';
            errorDiv.textContent = 'УНП должен содержать ровно 9 цифр';
            inputElement.parentNode.insertBefore(errorDiv, inputElement.nextSibling);
            return;
        }
        
        inputElement.classList.remove('input-error');
    }

    function validateForm() {
        const selectedValue = questionTypeSelect.value;
        
        if (selectedValue === '') {
            submitButton.disabled = true;
            submitButton.style.display = 'none';
            return;
        } else {
            submitButton.style.display = 'flex';
        }
        
        if (selectedValue === 'organization-none') {
            const nameValid = addNameInput && addNameInput.value.trim() !== '';
            const okpoValid = addOkpoInput && addOkpoInput.value.length === 12 && checkOkpoValidity(addOkpoInput.value);
            const ynpValid = addYnpInput && addYnpInput.value.length === 9;
            
            submitButton.disabled = !(nameValid && okpoValid && ynpValid);
        } else if (selectedValue === 'organization-edit') {
            const hasSelectedOrg = selectedOrgId.value !== '';
            const hasChanges = (newNameInput && newNameInput.value.trim() !== '') || 
                              (newOkpoInput && newOkpoInput.value.trim() !== '') || 
                              (newYnpInput && newYnpInput.value.trim() !== '');
            submitButton.disabled = !(hasSelectedOrg && hasChanges);
        } else if (selectedValue === 'other') {
            const textareaValid = problemTextarea && problemTextarea.value.trim() !== '';
            submitButton.disabled = !textareaValid;
        }
    }

    async function searchOrganizations(query, page = 1) {
        if (!query.trim() || query.length < 2) {
            if (searchResults) {
                searchResults.innerHTML = '';
                searchResults.classList.remove('show');
            }
            return;
        }
        
        if (isLoading) return;
        isLoading = true;
        
        if (page === 1 && searchResults) {
            searchResults.innerHTML = '<div class="search-loading">Поиск...</div>';
            searchResults.classList.add('show');
        }
        
        try {
            const response = await fetch(`/api/organizations?q=${encodeURIComponent(query)}&page=${page}`);
            const data = await response.json();
            
            if (page === 1 && searchResults) {
                searchResults.innerHTML = '';
            }
            
            if (data.organizations.length === 0 && page === 1 && searchResults) {
                searchResults.innerHTML = '<div class="search-loading">Ничего не найдено</div>';
                hasMore = false;
            } else if (searchResults) {
                data.organizations.forEach(org => {
                    const item = document.createElement('div');
                    item.className = 'search-result-item';
                    item.innerHTML = `
                        <div class="search-result-name">${escapeHtml(org.full_name)}</div>
                        <div class="search-result-details">
                            <span class="search-result-okpo">ОКПО: ${org.okpo || '—'}</span>
                            <span class="search-result-ynp">УНП: ${org.ynp || '—'}</span>
                        </div>
                    `;
                    item.addEventListener('click', () => selectOrganization(org));
                    searchResults.appendChild(item);
                });
                
                hasMore = data.has_next;
                currentPage = data.page;
            }
            
            if (searchResults && searchResults.children.length > 0) {
                searchResults.classList.add('show');
            }
            
        } catch (error) {
            console.error('Ошибка поиска:', error);
            if (page === 1 && searchResults) {
                searchResults.innerHTML = '<div class="search-loading">Ошибка при поиске</div>';
            }
        } finally {
            isLoading = false;
        }
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function selectOrganization(org) {
        selectedOrgId.value = org.id;
        organizationOldName.value = org.full_name;
        organizationOldOkpo.value = org.okpo || '';
        organizationOldYnp.value = org.ynp || '';
        
        if (currentOrgNameSpan) currentOrgNameSpan.textContent = org.full_name;
        if (currentOrgOkpoSpan) currentOrgOkpoSpan.textContent = org.okpo || '—';
        if (currentOrgYnpSpan) currentOrgYnpSpan.textContent = org.ynp || '—';
        
        if (newNameInput) newNameInput.value = '';
        if (newOkpoInput) newOkpoInput.value = '';
        if (newYnpInput) newYnpInput.value = '';
        
        if (organizationSearch) organizationSearch.value = org.full_name;
        if (searchResults) {
            searchResults.innerHTML = '';
            searchResults.classList.remove('show');
        }
        
        if (currentOrgInfo) currentOrgInfo.style.display = 'block';
        if (newOrgData) newOrgData.style.display = 'block';
        
        validateForm();
    }

    function clearOrganizationSelection() {
        selectedOrgId.value = '';
        organizationOldName.value = '';
        organizationOldOkpo.value = '';
        organizationOldYnp.value = '';
        
        if (newNameInput) newNameInput.value = '';
        if (newOkpoInput) newOkpoInput.value = '';
        if (newYnpInput) newYnpInput.value = '';
        if (organizationSearch) organizationSearch.value = '';
        if (currentOrgInfo) currentOrgInfo.style.display = 'none';
        if (newOrgData) newOrgData.style.display = 'none';
        
        validateForm();
    }

    if (organizationSearch) {
        organizationSearch.addEventListener('input', function(e) {
            clearTimeout(searchTimeout);
            const query = e.target.value;
            
            if (selectedOrgId.value) {
                clearOrganizationSelection();
            }
            
            searchTimeout = setTimeout(() => {
                if (query.length >= 2) {
                    searchOrganizations(query, 1);
                } else if (searchResults) {
                    searchResults.innerHTML = '';
                    searchResults.classList.remove('show');
                }
            }, 300);
        });

        organizationSearch.addEventListener('focus', function() {
            if (organizationSearch.value.length >= 2 && searchResults && searchResults.children.length > 0) {
                searchResults.classList.add('show');
            }
        });
    }

    document.addEventListener('click', function(e) {
        if (organizationSearchBlock && !organizationSearchBlock.contains(e.target)) {
            if (searchResults) searchResults.classList.remove('show');
        }
    });

    if (addYnpInput) {
        addYnpInput.addEventListener('input', function(e) {
            let value = this.value.replace(/[^\d]/g, '');
            if (value.length > 9) value = value.slice(0, 9);
            this.value = value;
            updateYnpError(this);
            validateForm();
        });
    }

    if (addOkpoInput) {
        addOkpoInput.addEventListener('input', function(e) {
            let value = this.value.replace(/[^\d]/g, '');
            if (value.length > 12) value = value.slice(0, 12);
            this.value = value;
            updateOkpoError(this);
            validateForm();
        });
    }

    if (newYnpInput) {
        newYnpInput.addEventListener('input', function(e) {
            let value = this.value.replace(/[^\d]/g, '');
            if (value.length > 9) value = value.slice(0, 9);
            this.value = value;
            updateYnpError(this);
            validateForm();
        });
    }

    if (newOkpoInput) {
        newOkpoInput.addEventListener('input', function(e) {
            let value = this.value.replace(/[^\d]/g, '');
            if (value.length > 12) value = value.slice(0, 12);
            this.value = value;
            updateOkpoError(this);
            validateForm();
        });
    }

    function updateFieldsVisibility() {
        const selectedValue = questionTypeSelect.value;
        
        if (addOrgFields) addOrgFields.style.display = 'none';
        if (organizationSearchBlock) organizationSearchBlock.style.display = 'none';
        if (currentOrgInfo) currentOrgInfo.style.display = 'none';
        if (newOrgData) newOrgData.style.display = 'none';
        if (problemTextarea) problemTextarea.style.display = 'none';
        
        document.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));
        const okpoError = document.getElementById('okpoError');
        const ynpError = document.getElementById('ynpError');
        if (okpoError) okpoError.remove();
        if (ynpError) ynpError.remove();
        
        if (selectedValue === '') {
            if (problemTextarea) {
                problemTextarea.style.display = 'block';
                problemTextarea.required = true;
            }
            if (addNameInput) addNameInput.required = false;
            if (addOkpoInput) addOkpoInput.required = false;
            if (addYnpInput) addYnpInput.required = false;
            submitButton.disabled = true;
            submitButton.style.display = 'none';
            
        } else if (selectedValue === 'organization-none') {
            if (addOrgFields) addOrgFields.style.display = 'block';
            if (addNameInput) addNameInput.required = true;
            if (addOkpoInput) addOkpoInput.required = true;
            if (addYnpInput) addYnpInput.required = true;
            if (problemTextarea) problemTextarea.required = false;
            submitButton.style.display = 'flex';
            validateForm();
            
        } else if (selectedValue === 'organization-edit') {
            if (organizationSearchBlock) organizationSearchBlock.style.display = 'block';
            if (newNameInput) newNameInput.required = true;
            if (newOkpoInput) newOkpoInput.required = true;
            if (newYnpInput) newYnpInput.required = true;
            if (problemTextarea) problemTextarea.required = false;
            submitButton.style.display = 'flex';
            if (selectedOrgId.value) {
                if (currentOrgInfo) currentOrgInfo.style.display = 'block';
                if (newOrgData) newOrgData.style.display = 'block';
            }
            validateForm();
            
        } else if (selectedValue === 'other') {
            if (problemTextarea) {
                problemTextarea.style.display = 'block';
                problemTextarea.required = true;
            }
            if (addNameInput) addNameInput.required = false;
            if (addOkpoInput) addOkpoInput.required = false;
            if (addYnpInput) addYnpInput.required = false;
            if (newNameInput) newNameInput.required = false;
            if (newOkpoInput) newOkpoInput.required = false;
            if (newYnpInput) newYnpInput.required = false;
            submitButton.style.display = 'flex';
            validateForm();
        }
    }
    
    if (addNameInput) addNameInput.addEventListener('input', validateForm);
    if (addYnpInput) addYnpInput.addEventListener('input', validateForm);
    if (addOkpoInput) addOkpoInput.addEventListener('input', validateForm);
    if (newNameInput) newNameInput.addEventListener('input', validateForm);
    if (newYnpInput) newYnpInput.addEventListener('input', validateForm);
    if (newOkpoInput) newOkpoInput.addEventListener('input', validateForm);
    if (problemTextarea) problemTextarea.addEventListener('input', validateForm);
    if (questionTypeSelect) questionTypeSelect.addEventListener('change', updateFieldsVisibility);
    
    updateFieldsVisibility();
});

function updateComparison() {
    const oldName = document.getElementById('organizationOldName').value;
    const oldOkpo = document.getElementById('organizationOldOkpo').value;
    const oldYnp = document.getElementById('organizationOldYnp').value;
    
    const newName = document.getElementById('newOrganizationName').value;
    const newOkpo = document.getElementById('newOrganizationOkpo').value;
    const newYnp = document.getElementById('newOrganizationYnp').value;
    
    document.getElementById('oldNameValue').textContent = oldName || '—';
    document.getElementById('oldOkpoValue').textContent = oldOkpo || '—';
    document.getElementById('oldYnpValue').textContent = oldYnp || '—';
    
    document.getElementById('newNameValue').textContent = newName || '—';
    document.getElementById('newOkpoValue').textContent = newOkpo || '—';
    document.getElementById('newYnpValue').textContent = newYnp || '—';
    
    function getStatusIcon(oldVal, newVal) {
        if (!newVal || newVal.trim() === '') {
            return '<span class="status-empty">Не указано</span>';
        }
        if (oldVal !== newVal) {
            return '<span class="status-changed">✏️ Будет изменено</span>';
        }
        return '<span class="status-unchanged">✓ Без изменений</span>';
    }
    
    document.getElementById('nameStatus').innerHTML = getStatusIcon(oldName, newName);
    document.getElementById('okpoStatus').innerHTML = getStatusIcon(oldOkpo, newOkpo);
    document.getElementById('ynpStatus').innerHTML = getStatusIcon(oldYnp, newYnp);
    
    const comparisonBlock = document.getElementById('comparisonBlock');
    if (newName || newOkpo || newYnp) {
        comparisonBlock.style.display = 'block';
    } else {
        comparisonBlock.style.display = 'none';
    }
}

document.getElementById('newOrganizationName').addEventListener('input', updateComparison);
document.getElementById('newOrganizationOkpo').addEventListener('input', updateComparison);
document.getElementById('newOrganizationYnp').addEventListener('input', updateComparison);