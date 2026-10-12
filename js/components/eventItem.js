/**
 * Componente do item de Evento / Adicional
 */

import { setupCurrencyHandlers } from '../utils/currency.js';

export function createEventElement(data = {}, onChangeCallback) {
    const eventItem = document.createElement('div');
    eventItem.className = 'event-item flex flex-col gap-2 p-3 border rounded-lg bg-gray-50';

    eventItem.innerHTML = `
        <div class="flex items-center gap-2 w-full">
            <input type="checkbox" class="event-checkbox h-5 w-5 text-blue-600 rounded focus:ring-blue-500 flex-shrink-0 mt-1 self-start" aria-label="Ativar adicional">
            <div class="flex-grow">
                <input type="text" placeholder="Nome do Evento/Adicional" class="event-name w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
            </div>
            <div class="flex items-center self-start">
                <button type="button" class="lock-event-btn p-2 rounded-full hover:bg-gray-200 text-gray-400 hover:text-orange-500" title="Manter ao resetar" aria-label="Travar evento para não apagar ao resetar">
                    <svg class="lock-icon-unlocked w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M14,15c0,1.1-0.9,2-2,2s-2-0.9-2-2s0.9-2,2-2S14,13.9,14,15z"/>
                        <path fill="none" stroke="currentColor" stroke-width="2" stroke-miterlimit="10" d="M17,9c0,0,0-1.6,0-2c0-2.8-2.2-5-5-5S7,4.2,7,7c0,0.4,0,2,0,2"/>
                        <path fill="none" stroke="currentColor" stroke-width="2" stroke-miterlimit="10" d="M18,21H6c-0.552,0-1-0.448-1-1V10c0-0.552,0.448-1,1-1h12c0.552,0,1,0.448,1,1v10C19,20.552,18.552,21,18,21z"/>
                    </svg>
                    <svg class="lock-icon-locked w-5 h-5 hidden" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M20,20V10c0-1.1-0.9-2-2-2H6c-1.1,0-2,0.9-2,2v10c0,1.1,0.9,2,2,2h12C19.1,22,20,21.1,20,20z M14,15c0,1.1-0.9,2-2,2s-2-0.9-2-2s0.9-2,2-2S14,13.9,14,15z"/>
                        <path fill="none" stroke="currentColor" stroke-width="2" stroke-miterlimit="10" d="M17,12c0-0.4,0-4.6,0-5c0-2.8-2.2-5-5-5S7,4.2,7,7c0,0.4,0,4.6,0,5"/>
                    </svg>
                </button>
                <button type="button" class="remove-event-btn p-2 rounded-full hover:bg-red-100 text-red-500 hover:text-red-700 flex items-center justify-center" title="Excluir Evento" aria-label="Excluir evento">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
        <div class="flex items-center flex-wrap gap-y-2 w-full">
            <div class="flex items-center flex-wrap gap-x-4 gap-y-2 flex-grow">
                <select class="event-type-selector bg-white border border-gray-300 rounded-lg p-2 flex-shrink-0">
                    <option value="hours">Horas (Taxa Padrão)</option>
                    <option value="hours_specific">Horas (Taxa Específica)</option>
                    <option value="fixed">Valor Fixo</option>
                </select>
                
                <div class="event-input-container flex items-center flex-wrap gap-x-2 gap-y-1 justify-start">
                    <div class="event-hours-input-wrapper flex items-center gap-1">
                        <input type="number" class="event-hours w-20 p-2 text-right border border-gray-300 rounded-lg" placeholder="0" step="0.5" min="0">
                        <span class="text-sm text-gray-500">hrs</span>
                    </div>
                    
                    <div class="event-specific-rate-wrapper hidden flex items-center gap-1">
                        <span class="text-sm text-gray-500">@</span>
                        <input type="text" inputmode="decimal" data-type="currency" class="event-specific-rate w-24 p-2 text-right border border-gray-300 rounded-lg" placeholder="R$ 0,00">
                    </div>

                    <div class="event-fixed-value-input-wrapper hidden flex items-center gap-1">
                        <input type="text" inputmode="decimal" data-type="currency" class="event-fixed-value w-24 p-2 text-right border border-gray-300 rounded-lg" placeholder="R$ 0,00">
                    </div>
                </div>
            </div>

            <div class="flex items-center gap-2 flex-shrink-0 ml-auto">
                 <span class="text-gray-500">=</span>
                 <span class="event-calculated-value w-24 text-right font-semibold text-blue-600 text-lg">R$ 0,00</span>
            </div>
        </div>
    `;

    const eventCheckbox = eventItem.querySelector('.event-checkbox');
    const eventNameInput = eventItem.querySelector('.event-name');
    const typeSelector = eventItem.querySelector('.event-type-selector');
    const hoursInput = eventItem.querySelector('.event-hours');
    const fixedValueInput = eventItem.querySelector('.event-fixed-value');
    const specificRateInput = eventItem.querySelector('.event-specific-rate');

    const hoursWrapper = eventItem.querySelector('.event-hours-input-wrapper');
    const fixedWrapper = eventItem.querySelector('.event-fixed-value-input-wrapper');
    const specificWrapper = eventItem.querySelector('.event-specific-rate-wrapper');

    const lockBtn = eventItem.querySelector('.lock-event-btn');
    const unlockedIcon = lockBtn.querySelector('.lock-icon-unlocked');
    const lockedIcon = lockBtn.querySelector('.lock-icon-locked');
    const removeBtn = eventItem.querySelector('.remove-event-btn');

    const setLockState = (isLocked) => {
        if (isLocked) {
            eventItem.dataset.locked = 'true';
            lockBtn.classList.add('locked');
            unlockedIcon.classList.add('hidden');
            lockedIcon.classList.remove('hidden');
        } else {
            delete eventItem.dataset.locked;
            lockBtn.classList.remove('locked');
            unlockedIcon.classList.remove('hidden');
            lockedIcon.classList.add('hidden');
        }
    };

    if (data && Object.keys(data).length > 0) {
        eventNameInput.value = data.name || '';
        typeSelector.value = data.type || 'hours';
        hoursInput.value = data.hours ?? 0;
        fixedValueInput.value = data.fixedValue || 'R$ 0,00';
        specificRateInput.value = data.specificRate || 'R$ 0,00';
        eventCheckbox.checked = data.checked !== false;
        setLockState(data.locked === true);
    } else {
        eventCheckbox.checked = true;
    }

    lockBtn.addEventListener('click', (e) => {
        e.preventDefault();
        setLockState(eventItem.dataset.locked !== 'true');
        if (typeof onChangeCallback === 'function') onChangeCallback();
    });

    const inputs = eventItem.querySelectorAll('input:not(.event-checkbox), select');
    const setEventState = (isChecked) => {
        inputs.forEach(input => { input.disabled = !isChecked; });
        eventItem.classList.toggle('disabled', !isChecked);
    };

    setEventState(eventCheckbox.checked);

    eventCheckbox.addEventListener('change', () => {
        setEventState(eventCheckbox.checked);
        if (typeof onChangeCallback === 'function') onChangeCallback();
    });

    typeSelector.addEventListener('change', () => {
        const isHours = typeSelector.value === 'hours';
        const isHoursSpecific = typeSelector.value === 'hours_specific';
        const isFixed = typeSelector.value === 'fixed';

        hoursWrapper.classList.toggle('hidden', !isHours && !isHoursSpecific);
        specificWrapper.classList.toggle('hidden', !isHoursSpecific);
        fixedWrapper.classList.toggle('hidden', !isFixed);

        if (typeof onChangeCallback === 'function') onChangeCallback();
    });
    typeSelector.dispatchEvent(new Event('change'));

    eventItem.querySelectorAll('input:not([data-type="currency"]), select').forEach(input => {
        input.addEventListener('input', () => {
            if (typeof onChangeCallback === 'function') onChangeCallback();
        });
        input.addEventListener('change', () => {
            if (typeof onChangeCallback === 'function') onChangeCallback();
        });
    });

    eventItem.querySelectorAll('input[data-type="currency"]').forEach(input => {
        setupCurrencyHandlers(input, () => {
            if (typeof onChangeCallback === 'function') onChangeCallback();
        });
    });

    removeBtn.addEventListener('click', () => {
        eventItem.remove();
        if (typeof onChangeCallback === 'function') onChangeCallback();
    });

    // Helper de extração de dados compatível com o schema do localStorage
    eventItem.getEventData = () => ({
        name: eventNameInput.value,
        type: typeSelector.value,
        hours: hoursInput.value,
        fixedValue: fixedValueInput.value,
        specificRate: specificRateInput.value,
        checked: eventCheckbox.checked,
        locked: eventItem.dataset.locked === 'true'
    });

    eventItem.setCalculatedValue = (formattedValue) => {
        const valEl = eventItem.querySelector('.event-calculated-value');
        if (valEl) valEl.textContent = formattedValue;
    };

    return eventItem;
}
