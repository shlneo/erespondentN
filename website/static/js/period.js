(function() {
    class PeriodSelector {
        constructor(selectorId, options = {}) {
            this.container = document.getElementById(selectorId);
            if (!this.container) return;
            
            // Получаем начальные значения из hidden полей или используем текущую дату
            const hiddenYear = options.hiddenYearInput;
            const hiddenQuarter = options.hiddenQuarterInput;
            
            // Определяем начальный год
            let initialYear;
            if (hiddenYear && hiddenYear.value && !isNaN(parseInt(hiddenYear.value))) {
                initialYear = parseInt(hiddenYear.value);
            } else {
                initialYear = new Date().getFullYear();
            }
            
            // Определяем начальный квартал
            let initialQuarter = null;
            if (hiddenQuarter && hiddenQuarter.value && !isNaN(parseInt(hiddenQuarter.value))) {
                initialQuarter = hiddenQuarter.value;
            }
            
            this.currentYear = initialYear;
            this.activeQuarter = initialQuarter || null;
            this.callbacks = options.callbacks || {};
            this.selectorId = selectorId;
            this.hiddenYearInput = hiddenYear;
            this.hiddenQuarterInput = hiddenQuarter;
            this.infoElement = options.infoElement || null;
            
            this.init();
        }
        
        init() {
            this.yearDisplay = this.container.querySelector('.year-display');
            this.upArrow = this.container.querySelector('.up-arrow');
            this.downArrow = this.container.querySelector('.down-arrow');
            this.quarterCells = this.container.querySelectorAll('.q-cell');
            
            // Устанавливаем отображение года из hidden поля
            if (this.yearDisplay) {
                this.yearDisplay.textContent = this.currentYear;
            }
            
            this.updateHiddenInputs();
            this.updateInfoDisplay();
            this.addEventListeners();
            
            // Если есть активный квартал из hidden поля, выделяем его
            if (this.activeQuarter) {
                const initialCell = this.container.querySelector(`.q-cell[data-q="${this.activeQuarter}"]`);
                if (initialCell) {
                    setTimeout(() => this.selectQuarter(initialCell, this.activeQuarter), 0);
                }
            }
            
            if (this.callbacks.onInit) {
                this.callbacks.onInit(this);
            }
        }
        
        addEventListeners() {
            this.upArrow.addEventListener('click', (e) => {
                e.preventDefault();
                this.currentYear++;
                this.updateYearDisplay();
                this.updateHiddenInputs();
                this.updateInfoDisplay();
                this.triggerCallback('onYearChange');
            });
            
            this.downArrow.addEventListener('click', (e) => {
                e.preventDefault();
                this.currentYear--;
                this.updateYearDisplay();
                this.updateHiddenInputs();
                this.updateInfoDisplay();
                this.triggerCallback('onYearChange');
            });
            
            this.quarterCells.forEach(cell => {
                cell.addEventListener('click', (e) => {
                    e.preventDefault();
                    const quarter = cell.dataset.q;
                    this.selectQuarter(cell, quarter);
                });
            });
        }
        
        selectQuarter(cell, quarter) {
            this.quarterCells.forEach(c => {
                c.style.background = 'white';
                c.style.border = '1px solid #e2e8f0';
                c.style.color = '#334155';
                const qNumber = c.querySelector('.q-number');
                const qMonths = c.querySelector('.q-months');
                if (qNumber) qNumber.style.color = '#2563eb';
                if (qMonths) qMonths.style.color = '#64748b';
            });
            
            cell.style.background = 'white';
            cell.style.border = '2px solid #2563eb';
            cell.style.color = '#334155';
            const qNumber = cell.querySelector('.q-number');
            const qMonths = cell.querySelector('.q-months');
            if (qNumber) qNumber.style.color = '#2563eb';
            if (qMonths) qMonths.style.color = '#334155';
            
            this.activeQuarter = quarter;
            this.updateHiddenInputs();
            this.updateInfoDisplay();
            
            this.triggerCallback('onQuarterSelect', {
                quarter: quarter,
                year: this.currentYear
            });
        }
        
        updateYearDisplay() {
            if (this.yearDisplay) {
                this.yearDisplay.textContent = this.currentYear;
            }
        }
        
        updateHiddenInputs() {
            if (this.hiddenYearInput) {
                this.hiddenYearInput.value = this.currentYear;
            }
            if (this.hiddenQuarterInput && this.activeQuarter) {
                this.hiddenQuarterInput.value = this.activeQuarter;
            }
        }
        
        updateInfoDisplay() {
            if (this.infoElement) {
                if (this.activeQuarter) {
                    this.infoElement.textContent = `Выбран: ${this.activeQuarter} квартал ${this.currentYear} года`;
                    this.infoElement.style.color = '#2563eb';
                } else {
                    this.infoElement.textContent = `Выберите квартал`;
                    this.infoElement.style.color = '#94a3b8';
                }
            }
        }
        
        triggerCallback(eventName, data = {}) {
            if (this.callbacks[eventName]) {
                this.callbacks[eventName]({
                    selector: this,
                    selectorId: this.selectorId,
                    year: this.currentYear,
                    quarter: this.activeQuarter,
                    ...data
                });
            }
        }
        
        getSelectedPeriod() {
            return {
                year: this.currentYear,
                quarter: this.activeQuarter
            };
        }
        
        setYear(year) {
            this.currentYear = year;
            this.updateYearDisplay();
            this.updateHiddenInputs();
            this.updateInfoDisplay();
            this.triggerCallback('onYearChange');
        }
        
        setQuarter(quarter) {
            const cell = this.container.querySelector(`.q-cell[data-q="${quarter}"]`);
            if (cell) {
                this.selectQuarter(cell, quarter);
            }
        }
        
        resetSelection() {
            this.activeQuarter = null;
            this.quarterCells.forEach(c => {
                c.style.background = 'white';
                c.style.border = '1px solid #e2e8f0';
                c.style.color = '#334155';
                const qNumber = c.querySelector('.q-number');
                const qMonths = c.querySelector('.q-months');
                if (qNumber) qNumber.style.color = '#2563eb';
                if (qMonths) qMonths.style.color = '#64748b';
            });
            this.updateHiddenInputs();
            this.updateInfoDisplay();
        }
    }

    document.addEventListener('DOMContentLoaded', function() {
        window.periodSelectors = window.periodSelectors || {};
        
        const addSelector = document.getElementById('add-period-selector');
        if (addSelector) {
            try {
                window.periodSelectors.add = new PeriodSelector('add-period-selector', {
                    hiddenYearInput: document.getElementById('selected-year-add'),
                    hiddenQuarterInput: document.getElementById('selected-quarter-add'),
                    infoElement: document.getElementById('selector-info-add'),
                    callbacks: {
                        onInit: (selector) => {
                            // console.log('Селектор создания отчета готов');
                        },
                        onQuarterSelect: (data) => {
                            // console.log('Создание отчета:', data);
                        }
                    }
                });
            } catch (error) {
                console.error('Ошибка инициализации селектора создания:', error);
            }
        }

        const changeSelector = document.getElementById('change-period-selector');
        if (changeSelector) {
            try {
                window.periodSelectors.change = new PeriodSelector('change-period-selector', {
                    hiddenYearInput: document.getElementById('selected-year-change'),
                    hiddenQuarterInput: document.getElementById('selected-quarter-change'),
                    infoElement: document.getElementById('selector-info-change'),
                    callbacks: {
                        onInit: (selector) => {
                            // console.log('Селектор изменения отчета готов');
                        },
                        onQuarterSelect: (data) => {
                            // console.log('Изменение отчета:', data);
                        }
                    }
                });
            } catch (error) {
                console.error('Ошибка инициализации селектора изменения:', error);
            }
        }

        const copySelector = document.getElementById('copy-period-selector');
        if (copySelector) {
            try {
                window.periodSelectors.copy = new PeriodSelector('copy-period-selector', {
                    hiddenYearInput: document.getElementById('selected-year-copy'),
                    hiddenQuarterInput: document.getElementById('selected-quarter-copy'),
                    infoElement: document.getElementById('selector-info-copy'),
                    callbacks: {
                        onInit: (selector) => {
                            // console.log('Селектор копирования отчета готов');
                        },
                        onQuarterSelect: (data) => {
                            // console.log('Копирование отчета:', data);
                        }
                    }
                });
            } catch (error) {
                console.error('Ошибка инициализации селектора копирования:', error);
            }
        }
        const periodAuditSelector = document.getElementById('audit-period-selector');
        if (periodAuditSelector) {
            try {
                window.periodSelectors.audit = new PeriodSelector('audit-period-selector', {
                    hiddenYearInput: document.getElementById('selected-year-audit'),
                    hiddenQuarterInput: document.getElementById('selected-quarter-audit'),
                    infoElement: document.getElementById('selector-info-audit'),
                    callbacks: {
                        onInit: (selector) => {
                            // console.log('Селектор копирования отчета готов');
                        },
                        onQuarterSelect: (data) => {
                            // console.log('Копирование отчета:', data);
                        }
                    }
                });
            } catch (error) {
                console.error('Ошибка инициализации селектора копирования:', error);
            }
        }
    }); 
})();