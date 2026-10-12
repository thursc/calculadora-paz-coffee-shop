/**
 * Componente do Card de Funcionário
 */

import { SHIFTS } from '../config.js';
import { setupCurrencyHandlers, formatCurrency } from '../utils/currency.js';
import { calculateEmployee } from '../services/calculator.js';
import { generateHoleriteText } from '../services/holerite.js';
import { createEventElement } from './eventItem.js';

export function createEmployeeCard(data = {}, callbacks = {}) {
    const { onStateChange, onRequestDelete, onOpenHolerite } = callbacks;

    const template = document.getElementById('employee-template');
    const fragment = template.content.cloneNode(true);
    const cardDetails = fragment.querySelector('.employee-card-details');
    const cardContent = cardDetails.querySelector('.employee-content');
    const summary = cardDetails.querySelector('.employee-summary');
    const nameInput = cardDetails.querySelector('.employee-name');
    const hourlyRateInput = cardContent.querySelector('.hourly-rate');
    const dobradinhaCheckbox = cardContent.querySelector('.bonus-dobradinha-checkbox');
    const dobradinhaContainer = cardContent.querySelector('[data-bonus="dobradinha"]');
    const shiftsContainer = cardContent.querySelector('.shifts-container');
    const eventList = cardContent.querySelector('.event-list');
    const employeeTotalEl = cardContent.querySelector('.employee-total');

    const shiftsBreakdownContainer = cardContent.querySelector('.shifts-breakdown-container');
    const eventsBreakdownContainer = cardContent.querySelector('.events-breakdown-container');
    const bonusBreakdownContainer = cardContent.querySelector('.bonus-breakdown-container');
    const shiftsListEl = cardContent.querySelector('.shifts-breakdown-list');
    const eventsListEl = cardContent.querySelector('.events-breakdown-list');
    const bonusListEl = cardContent.querySelector('.bonus-breakdown-list');

    const uniqueId = data.id || `employee-${Date.now()}`;
    cardDetails.dataset.id = uniqueId;

    const contentId = `employee-content-${uniqueId}`;
    summary.setAttribute('aria-controls', contentId);
    cardContent.id = contentId;

    const isOpen = data.open !== false;
    cardDetails.classList.toggle('is-open', isOpen);
    summary.setAttribute('aria-expanded', String(isOpen));

    nameInput.value = data.name || '';
    hourlyRateInput.value = data.hourlyRate || 'R$ 15,00';
    dobradinhaCheckbox.checked = Boolean(data.bonusDobradinha);

    // Renderizar Turnos da semana
    const savedShifts = data.shifts || [];
    SHIFTS.forEach(shift => {
        const savedShift = savedShifts.find(s => s.id === shift.id) || {};
        const shiftEl = document.createElement('div');
        shiftEl.className = 'shift-item flex items-center justify-between p-2 rounded-lg sm:max-w-xs';
        shiftEl.innerHTML = `
            <label class="flex items-center space-x-2 cursor-pointer">
                <input type="checkbox" class="shift-checkbox h-5 w-5 text-orange-600 rounded focus:ring-orange-500" data-shift="${shift.id}">
                <span class="shift-label-text">${shift.label}</span>
            </label>
            <div class="flex items-center gap-1">
                <input type="number" class="shift-hours w-16 p-1 text-right border border-gray-300 rounded-md" step="0.5" min="0">
                <span class="text-xs text-gray-500">hrs</span>
            </div>
        `;
        shiftsContainer.appendChild(shiftEl);

        const checkbox = shiftEl.querySelector('.shift-checkbox');
        const hoursInput = shiftEl.querySelector('.shift-hours');

        hoursInput.dataset.lastValue = savedShift.hours || shift.hours;
        checkbox.checked = savedShift.checked || false;

        const setShiftState = (isChecked) => {
            hoursInput.disabled = !isChecked;
            shiftEl.classList.toggle('bg-orange-50', isChecked);
            shiftEl.classList.toggle('opacity-60', !isChecked);
            hoursInput.value = isChecked ? hoursInput.dataset.lastValue : 0;
        };

        hoursInput.addEventListener('input', () => {
            if (hoursInput.value && !isNaN(parseFloat(hoursInput.value))) {
                hoursInput.dataset.lastValue = hoursInput.value;
            }
            notifyChange();
        });

        checkbox.addEventListener('change', () => {
            setShiftState(checkbox.checked);
            notifyChange();
        });

        setShiftState(checkbox.checked);
    });

    // Renderizar Eventos / Adicionais
    if (data.events && data.events.length) {
        data.events.forEach(eventData => {
            const eventEl = createEventElement(eventData, notifyChange);
            eventList.appendChild(eventEl);
        });
    }

    // Função de notificação para a aplicação principal
    function notifyChange() {
        if (typeof onStateChange === 'function') {
            onStateChange();
        }
    }

    // Botão Adicionar Evento
    const addEventBtn = cardContent.querySelector('.add-event-btn');
    addEventBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const eventEl = createEventElement({}, notifyChange);
        eventList.appendChild(eventEl);
        notifyChange();
    });

    // Botão Minimizar / Expandir Accordion
    const minimizeBtn = cardDetails.querySelector('.minimize-btn');
    minimizeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const currentlyOpen = cardDetails.classList.contains('is-open');

        if (currentlyOpen) {
            cardDetails.classList.remove('is-open');
            summary.setAttribute('aria-expanded', 'false');
        } else {
            cardDetails.classList.add('is-opening');
            cardDetails.classList.add('is-open');
            summary.setAttribute('aria-expanded', 'true');

            cardContent.addEventListener('transitionend', () => {
                cardDetails.classList.remove('is-opening');
            }, { once: true });
        }

        notifyChange();
    });

    // Botão Excluir Funcionário
    const removeBtn = cardDetails.querySelector('.remove-employee');
    removeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const empName = nameInput.value?.trim() || 'este funcionário';
        if (typeof onRequestDelete === 'function') {
            onRequestDelete(cardDetails, empName);
        }
    });

    // Botão Resetar Turnos e Eventos
    const resetBtn = cardDetails.querySelector('.reset-btn');
    resetBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const icon = resetBtn.querySelector('svg');
        if (icon.classList.contains('is-resetting')) return;

        icon.classList.add('is-resetting');

        cardDetails.querySelectorAll('.shift-checkbox, .bonus-dobradinha-checkbox').forEach(cb => {
            cb.checked = false;
            cb.dispatchEvent(new Event('change'));
        });

        cardDetails.querySelectorAll('.event-item').forEach(eventItem => {
            if (eventItem.dataset.locked !== 'true') {
                eventItem.remove();
            }
        });

        notifyChange();

        icon.addEventListener('animationend', () => {
            icon.classList.remove('is-resetting');
        }, { once: true });
    });

    // Botão Gerar Holerite
    const generateHoleriteBtn = cardContent.querySelector('.generate-holerite-btn');
    generateHoleriteBtn.addEventListener('click', () => {
        const empData = cardDetails.getEmployeeData();
        const calculation = calculateEmployee(empData);
        const text = generateHoleriteText(empData.name, calculation);
        if (typeof onOpenHolerite === 'function') {
            onOpenHolerite(text);
        }
    });

    // Event listeners dos inputs e detalhes
    cardDetails.querySelectorAll('input:not([data-type="currency"]), select, details').forEach(el => {
        el.addEventListener('input', notifyChange);
        el.addEventListener('change', notifyChange);
        if (el.tagName === 'DETAILS') {
            el.addEventListener('toggle', notifyChange);
        }
    });

    setupCurrencyHandlers(hourlyRateInput, notifyChange);

    // Extração estruturada de dados compatível com o schema do localStorage
    cardDetails.getEmployeeData = () => {
        const shifts = [];
        cardContent.querySelectorAll('.shift-item').forEach(shiftItem => {
            const cb = shiftItem.querySelector('.shift-checkbox');
            const hoursInput = shiftItem.querySelector('.shift-hours');
            shifts.push({
                id: cb.dataset.shift,
                checked: cb.checked,
                hours: hoursInput.dataset.lastValue || hoursInput.value
            });
        });

        const events = [];
        cardContent.querySelectorAll('.event-item').forEach(eventItem => {
            if (typeof eventItem.getEventData === 'function') {
                events.push(eventItem.getEventData());
            }
        });

        return {
            id: cardDetails.dataset.id,
            name: nameInput.value,
            hourlyRate: hourlyRateInput.value,
            shifts,
            bonusDobradinha: dobradinhaCheckbox.checked,
            events,
            open: cardDetails.classList.contains('is-open')
        };
    };

    // Atualização visual do card a partir do resultado puro do cálculo
    cardDetails.updateCalculations = () => {
        const empData = cardDetails.getEmployeeData();
        const calculation = calculateEmployee(empData);

        // Atualizar estado e trava da dobradinha
        dobradinhaCheckbox.disabled = !calculation.isDobradinhaApplicable;
        if (!calculation.isDobradinhaApplicable) {
            dobradinhaCheckbox.checked = false;
        }
        dobradinhaContainer.classList.toggle('bg-green-100', calculation.bonusDobradinhaChecked);

        // Atualizar valores parciais dos eventos na UI
        const eventElements = cardContent.querySelectorAll('.event-item');
        eventElements.forEach((el, index) => {
            const eventData = empData.events[index];
            if (!eventData) return;

            let val = 0;
            if (eventData.checked) {
                const hours = parseFloat(eventData.hours) || 0;
                if (eventData.type === 'hours') {
                    val = hours * calculation.hourlyRate;
                } else if (eventData.type === 'fixed') {
                    val = parseFloat(String(eventData.fixedValue).replace(/R\$/g, '').replace(/\./g, '').replace(',', '.').trim()) || 0;
                } else if (eventData.type === 'hours_specific') {
                    const specific = parseFloat(String(eventData.specificRate).replace(/R\$/g, '').replace(/\./g, '').replace(',', '.').trim()) || 0;
                    val = hours * specific;
                }
            }
            if (typeof el.setCalculatedValue === 'function') {
                el.setCalculatedValue(formatCurrency(val));
            }
        });

        // Atualizar lista de detalhamento dos turnos
        shiftsListEl.innerHTML = '';
        calculation.shiftsBreakdown.forEach(item => {
            const li = document.createElement('li');
            li.textContent = item.formattedText;
            shiftsListEl.appendChild(li);
        });

        // Atualizar lista de detalhamento dos eventos
        eventsListEl.innerHTML = '';
        calculation.eventsBreakdown.forEach(item => {
            const li = document.createElement('li');
            li.textContent = item.formattedText;
            eventsListEl.appendChild(li);
        });

        // Atualizar lista de detalhamento dos bônus
        bonusListEl.innerHTML = '';
        calculation.bonusBreakdown.forEach(item => {
            const li = document.createElement('li');
            li.textContent = item.formattedText;
            bonusListEl.appendChild(li);
        });

        // Esconder seções vazias
        shiftsBreakdownContainer.classList.toggle('hidden', calculation.shiftsBreakdown.length === 0);
        eventsBreakdownContainer.classList.toggle('hidden', calculation.eventsBreakdown.length === 0);
        bonusBreakdownContainer.classList.toggle('hidden', calculation.bonusBreakdown.length === 0);

        // Atualizar total individual formatado
        employeeTotalEl.textContent = formatCurrency(calculation.totalPay);

        return calculation.totalPay;
    };

    return cardDetails;
}
