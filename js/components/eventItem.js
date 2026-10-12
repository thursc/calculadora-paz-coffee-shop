/**
 * Componente do item de Evento / Adicional
 */

import { setupCurrencyHandlers } from '../utils/currency.js';

export function createEventElement(data = {}, onChangeCallback) {
    const eventItem = document.createElement('div');
    eventItem.className = 'event-item event-item-animate-enter flex flex-col gap-2 p-2.5 border rounded-xl';

    eventItem.innerHTML = `
        <!-- Linha 1: Checkbox Estilizado, Nome do Adicional e Ações Rápidas -->
        <div class="flex items-center gap-2 w-full">
            <label class="event-toggle-label flex items-center cursor-pointer flex-shrink-0 select-none" title="Ativar ou desativar adicional">
                <input type="checkbox" class="event-checkbox sr-only" aria-label="Ativar adicional">
                <span class="event-check-indicator w-4 h-4 rounded-full border border-stone-300 dark:border-stone-600 flex items-center justify-center flex-shrink-0 transition-colors">
                    <svg class="w-2.5 h-2.5 hidden text-amber-600 dark:text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                    </svg>
                </span>
            </label>
            <div class="flex-grow min-w-0">
                <input type="text" placeholder="Nome do Adicional" class="event-name w-full px-2 py-1 text-xs sm:text-sm bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-800 dark:text-stone-100 placeholder-stone-400 focus:ring-1 focus:ring-amber-500">
            </div>
            <div class="flex items-center gap-1 flex-shrink-0">
                <span class="lock-badge hidden items-center text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md select-none">
                    Fixado
                </span>
                <button type="button" class="lock-event-btn p-1.5 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-400 hover:text-amber-500 transition-colors" title="Manter ao resetar" aria-label="Travar evento para não apagar ao resetar">
                    <svg class="lock-icon-unlocked w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M14,15c0,1.1-0.9,2-2,2s-2-0.9-2-2s0.9-2,2-2S14,13.9,14,15z"/>
                        <path fill="none" stroke="currentColor" stroke-width="2" stroke-miterlimit="10" d="M17,9c0,0,0-1.6,0-2c0-2.8-2.2-5-5-5S7,4.2,7,7c0,0.4,0,2,0,2"/>
                        <path fill="none" stroke="currentColor" stroke-width="2" stroke-miterlimit="10" d="M18,21H6c-0.552,0-1-0.448-1-1V10c0-0.552,0.448-1,1-1h12c0.552,0,1,0.448,1,1v10C19,20.552,18.552,21,18,21z"/>
                    </svg>
                    <svg class="lock-icon-locked w-4 h-4 hidden" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M20,20V10c0-1.1-0.9-2-2-2H6c-1.1,0-2,0.9-2,2v10c0,1.1,0.9,2,2,2h12C19.1,22,20,21.1,20,20z M14,15c0,1.1-0.9,2-2,2s-2-0.9-2-2s0.9-2,2-2S14,13.9,14,15z"/>
                        <path fill="none" stroke="currentColor" stroke-width="2" stroke-miterlimit="10" d="M17,12c0-0.4,0-4.6,0-5c0-2.8-2.2-5-5-5S7,4.2,7,7c0,0.4,0,4.6,0,5"/>
                    </svg>
                </button>
                <button type="button" class="remove-event-btn p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-stone-400 hover:text-red-500 transition-colors" title="Excluir Adicional" aria-label="Excluir adicional">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>

        <!-- Linha 2: Seletor de Tipo (Largura Total, Limpo e sem Cortes) -->
        <div class="w-full">
            <select class="event-type-selector w-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-200 rounded-lg px-2.5 py-1 text-xs focus:ring-1 focus:ring-amber-500">
                <option value="hours">Horas (Taxa Padrão)</option>
                <option value="hours_specific">Horas (Taxa Específica)</option>
                <option value="fixed">Valor Fixo (R$)</option>
            </select>
        </div>

        <!-- Linha 3: Entradas de Horas/Valor e Subtotal Calculado -->
        <div class="flex items-center justify-between gap-1.5 pt-1.5 border-t border-stone-200/50 dark:border-stone-800/60">
            <!-- Contêiner de Entradas de Valor/Horas -->
            <div class="event-input-container flex items-center gap-1.5 flex-shrink-0">
                <!-- Horas (Padrão e Específica) -->
                <div class="event-hours-input-wrapper flex items-center gap-1 flex-shrink-0">
                    <input type="number" class="event-hours w-12 px-1.5 py-1 text-right text-xs bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-800 dark:text-stone-100 font-bold focus:ring-1 focus:ring-amber-500" placeholder="0" step="0.5" min="0">
                    <span class="text-[11px] text-stone-400 font-medium">hrs</span>
                </div>
                
                <!-- Taxa Específica (@ R$) -->
                <div class="event-specific-rate-wrapper hidden flex items-center gap-1 flex-shrink-0">
                    <span class="text-xs text-stone-400 font-bold">@</span>
                    <input type="text" inputmode="decimal" data-type="currency" class="event-specific-rate w-[76px] px-1.5 py-1 text-right text-xs bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-800 dark:text-stone-100 font-bold focus:ring-1 focus:ring-amber-500 flex-shrink-0" placeholder="R$ 0,00">
                </div>

                <!-- Valor Fixo (R$) -->
                <div class="event-fixed-value-input-wrapper hidden flex items-center gap-1 flex-shrink-0">
                    <input type="text" inputmode="decimal" data-type="currency" class="event-fixed-value w-20 px-1.5 py-1 text-right text-xs bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-800 dark:text-stone-100 font-bold focus:ring-1 focus:ring-amber-500 flex-shrink-0" placeholder="R$ 0,00">
                </div>
            </div>

            <!-- Subtotal Calculado do Adicional -->
            <div class="flex items-center gap-1 flex-shrink-0 ml-auto pl-1">
                 <span class="text-xs text-stone-400 font-medium">=</span>
                 <span class="event-calculated-value text-xs sm:text-sm font-black text-amber-600 dark:text-amber-400 whitespace-nowrap">R$ 0,00</span>
            </div>
        </div>
    `;

    const eventCheckbox = eventItem.querySelector('.event-checkbox');
    const checkIndicator = eventItem.querySelector('.event-check-indicator');
    const checkIcon = eventItem.querySelector('.event-check-indicator svg');
    const eventNameInput = eventItem.querySelector('.event-name');
    const typeSelector = eventItem.querySelector('.event-type-selector');
    const hoursInput = eventItem.querySelector('.event-hours');
    const fixedValueInput = eventItem.querySelector('.event-fixed-value');
    const specificRateInput = eventItem.querySelector('.event-specific-rate');

    const hoursWrapper = eventItem.querySelector('.event-hours-input-wrapper');
    const fixedWrapper = eventItem.querySelector('.event-fixed-value-input-wrapper');
    const specificWrapper = eventItem.querySelector('.event-specific-rate-wrapper');

    const lockBtn = eventItem.querySelector('.lock-event-btn');
    const lockBadge = eventItem.querySelector('.lock-badge');
    const unlockedIcon = lockBtn.querySelector('.lock-icon-unlocked');
    const lockedIcon = lockBtn.querySelector('.lock-icon-locked');
    const removeBtn = eventItem.querySelector('.remove-event-btn');

    const setLockState = (isLocked) => {
        if (isLocked) {
            eventItem.dataset.locked = 'true';
            eventItem.classList.add('is-locked');
            lockBtn.classList.add('locked');
            unlockedIcon.classList.add('hidden');
            lockedIcon.classList.remove('hidden');
            if (lockBadge) lockBadge.classList.remove('hidden');
        } else {
            delete eventItem.dataset.locked;
            eventItem.classList.remove('is-locked');
            lockBtn.classList.remove('locked');
            unlockedIcon.classList.remove('hidden');
            lockedIcon.classList.add('hidden');
            if (lockBadge) lockBadge.classList.add('hidden');
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

    // Inputs permanecem SEMPRE editáveis (sem aplicar disabled),
    // permitindo ao usuário alterar nome, tipo, horas ou valores a qualquer momento.
    const setEventState = (isChecked) => {
        eventItem.classList.toggle('is-active', isChecked);
        if (isChecked) {
            checkIcon.classList.remove('hidden');
            checkIndicator.classList.add('border-amber-500', 'bg-amber-500/20');
            checkIndicator.classList.remove('border-stone-300', 'dark:border-stone-600');
        } else {
            checkIcon.classList.add('hidden');
            checkIndicator.classList.remove('border-amber-500', 'bg-amber-500/20');
            checkIndicator.classList.add('border-stone-300', 'dark:border-stone-600');
        }
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

    hoursInput.addEventListener('input', () => {
        const raw = parseFloat(hoursInput.value);
        if (!Number.isNaN(raw) && raw < 0) {
            hoursInput.value = '0';
        }
    });

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
        }, () => {
            if (typeof onChangeCallback === 'function') onChangeCallback();
        });
    });

    // Remoção suave com animação padronizada do site (Proposta 1: Dissolução no lugar + FLIP nos irmãos)
    eventItem.removeWithAnimation = (callback, options = {}) => {
        const { skipFlip = false } = options;
        const cardDetails = eventItem.closest('.employee-card-details');
        const parent = eventItem.parentElement;

        let targetsToAnimate = [];
        let firstPositions = [];

        if (!skipFlip && parent) {
            // Coleta os eventos irmãos que estão abaixo deste na lista
            let next = eventItem.nextElementSibling;
            while (next) {
                if (next.classList.contains('event-item')) {
                    targetsToAnimate.push(next);
                }
                next = next.nextElementSibling;
            }

            // Coleta também o rodapé do card para deslizar junto suavemente
            const footer = cardDetails ? cardDetails.querySelector('.employee-footer') : null;
            if (footer) {
                targetsToAnimate.push(footer);
            }

            firstPositions = targetsToAnimate.map(el => ({
                el,
                top: el.getBoundingClientRect().top
            }));
        }

        eventItem.classList.add('event-item-animate-leave');

        let cleaned = false;
        const onEnd = () => {
            if (cleaned) return;
            cleaned = true;
            eventItem.removeEventListener('transitionend', onEnd);
            eventItem.remove();

            // FLIP (Invert & Play) para os elementos que estavam abaixo
            if (!skipFlip && targetsToAnimate.length > 0) {
                const movingElements = [];
                firstPositions.forEach(({ el, top }) => {
                    if (!el.isConnected) return;
                    const newTop = el.getBoundingClientRect().top;
                    const deltaY = top - newTop;

                    if (Math.abs(deltaY) > 0.5) {
                        el.style.willChange = 'transform';
                        el.style.transition = 'none';
                        el.style.transform = `translate3d(0, ${deltaY}px, 0)`;
                        movingElements.push(el);
                    }
                });

                if (movingElements.length > 0) {
                    requestAnimationFrame(() => {
                        requestAnimationFrame(() => {
                            movingElements.forEach(el => {
                                el.style.transition = 'transform 0.28s cubic-bezier(0.16, 1, 0.3, 1)';
                                el.style.transform = 'translate3d(0, 0, 0)';
                            });

                            setTimeout(() => {
                                movingElements.forEach(el => {
                                    el.style.transition = '';
                                    el.style.transform = '';
                                    el.style.willChange = '';
                                });
                            }, 300);
                        });
                    });
                }
            }

            if (typeof callback === 'function') callback();
            if (typeof onChangeCallback === 'function') onChangeCallback();
        };

        eventItem.addEventListener('transitionend', onEnd, { once: true });
        setTimeout(onEnd, 200);
    };

    removeBtn.addEventListener('click', () => {
        eventItem.removeWithAnimation();
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
