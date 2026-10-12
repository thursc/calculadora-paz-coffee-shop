/**
 * Componente do Card de Funcionário
 * Visual moderno estilo Cafeteria com Chips Táteis (Toggle Pills) e Coluna Kanban
 */

import { SHIFTS, DEFAULT_HOURLY_RATE } from '../config.js';
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
    
    // Importante: hourly-rate está localizado no resumo (summary) do card
    const hourlyRateInput = cardDetails.querySelector('.hourly-rate');

    const dobradinhaCheckbox = cardDetails.querySelector('.bonus-dobradinha-checkbox');
    const dobradinhaContainer = cardDetails.querySelector('[data-bonus="dobradinha"]');
    const dobradinhaIndicator = cardDetails.querySelector('.dobradinha-indicator svg');
    const shiftsContainer = cardDetails.querySelector('.shifts-container');
    const eventList = cardDetails.querySelector('.event-list');
    const employeeTotalEl = cardDetails.querySelector('.employee-total');

    const shiftsBreakdownContainer = cardDetails.querySelector('.shifts-breakdown-container');
    const eventsBreakdownContainer = cardDetails.querySelector('.events-breakdown-container');
    const bonusBreakdownContainer = cardDetails.querySelector('.bonus-breakdown-container');
    const shiftsListEl = cardDetails.querySelector('.shifts-breakdown-list');
    const eventsListEl = cardDetails.querySelector('.events-breakdown-list');
    const bonusListEl = cardDetails.querySelector('.bonus-breakdown-list');
    const emptyBreakdownMessage = cardDetails.querySelector('.empty-breakdown-message');

    const uniqueId = data.id || `employee-${Date.now()}`;
    cardDetails.dataset.id = uniqueId;

    const contentId = `employee-content-${uniqueId}`;
    summary.setAttribute('aria-controls', contentId);
    cardContent.id = contentId;

    cardDetails.classList.add('is-open');

    nameInput.value = data.name || '';
    if (hourlyRateInput) {
        hourlyRateInput.value = data.hourlyRate || DEFAULT_HOURLY_RATE;
    }
    dobradinhaCheckbox.checked = Boolean(data.bonusDobradinha);

    // Renderizar Turnos da semana como Chips Táteis (Toggle Pills) em largura total legível
    const savedShifts = data.shifts || [];
    SHIFTS.forEach(shift => {
        const savedShift = savedShifts.find(s => s.id === shift.id) || {};
        const shiftEl = document.createElement('div');
        // cursor-pointer no container inteiro — toda a linha é clicável
        shiftEl.className = 'shift-item shift-pill flex items-center justify-between p-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/30 select-none cursor-pointer';
        shiftEl.innerHTML = `
            <div class="shift-toggle-btn flex items-center gap-2.5 flex-grow min-w-0 pr-2">
                <input type="checkbox" class="shift-checkbox sr-only" data-shift="${shift.id}">
                <span class="shift-check-indicator w-4 h-4 rounded-full border border-stone-300 dark:border-stone-600 flex items-center justify-center flex-shrink-0 transition-colors">
                    <svg class="w-2.5 h-2.5 hidden text-amber-600 dark:text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                    </svg>
                </span>
                <span class="shift-label-text text-sm font-semibold text-stone-800 dark:text-stone-200 whitespace-nowrap">
                    ${shift.label}
                </span>
            </div>
            <div class="flex items-center gap-1.5 flex-shrink-0 shift-hours-wrapper">
                <input type="number" class="shift-hours w-16 py-1 px-2 text-right text-sm bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-800 dark:text-stone-100 font-bold focus:ring-1 focus:ring-amber-500 transition-opacity" step="0.5" min="0">
                <span class="text-xs text-stone-400 font-medium">hrs</span>
            </div>
        `;
        shiftsContainer.appendChild(shiftEl);

        const checkbox = shiftEl.querySelector('.shift-checkbox');
        const checkIcon = shiftEl.querySelector('.shift-check-indicator svg');
        const indicatorRing = shiftEl.querySelector('.shift-check-indicator');
        const hoursInput = shiftEl.querySelector('.shift-hours');
        const hoursWrapper = shiftEl.querySelector('.shift-hours-wrapper');

        hoursInput.dataset.lastValue = savedShift.hours || shift.hours;
        checkbox.checked = savedShift.checked || false;

        const setShiftState = (isChecked) => {
            hoursInput.disabled = !isChecked;
            shiftEl.classList.toggle('is-active', isChecked);

            if (isChecked) {
                checkIcon.classList.remove('hidden');
                indicatorRing.classList.add('border-amber-500', 'bg-amber-500/20');
                // Restaura o valor anterior da memória ao ativar
                hoursInput.value = hoursInput.dataset.lastValue || shift.hours;
            } else {
                checkIcon.classList.add('hidden');
                indicatorRing.classList.remove('border-amber-500', 'bg-amber-500/20');
                // Guarda o valor anterior na memória se for maior que 0
                if (hoursInput.value && parseFloat(hoursInput.value) > 0) {
                    hoursInput.dataset.lastValue = hoursInput.value;
                }
                // Visualmente exibe 0 quando não selecionado
                hoursInput.value = '0';
            }
        };

        // Clique em qualquer parte da linha ativa/desativa o turno,
        // EXCETO se o alvo for dentro do wrapper de horas
        shiftEl.addEventListener('click', (e) => {
            if (e.target.closest('.shift-hours-wrapper')) return;
            e.preventDefault();
            checkbox.checked = !checkbox.checked;
            setShiftState(checkbox.checked);
            notifyChange();
        });

        // Impede que qualquer clique no wrapper de horas borbulhe para a linha e ative o turno
        hoursWrapper.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        hoursInput.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        hoursInput.addEventListener('input', () => {
            const raw = parseFloat(hoursInput.value);
            if (!Number.isNaN(raw) && raw < 0) {
                hoursInput.value = '0';
            }
            if (hoursInput.value && !isNaN(parseFloat(hoursInput.value)) && parseFloat(hoursInput.value) > 0) {
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


    // Pílula interativa da Dobradinha
    if (dobradinhaContainer) {
        dobradinhaContainer.addEventListener('click', (e) => {
            if (dobradinhaCheckbox.disabled) return;
            dobradinhaCheckbox.checked = !dobradinhaCheckbox.checked;
            notifyChange();
        });
    }

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
    if (addEventBtn) {
        addEventBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const eventEl = createEventElement({}, notifyChange);
            eventList.appendChild(eventEl);
            notifyChange();
        });
    }

    // Botão Excluir Funcionário
    const removeBtn = cardDetails.querySelector('.remove-employee');
    if (removeBtn) {
        removeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const empName = nameInput.value?.trim() || 'este colaborador';
            if (typeof onRequestDelete === 'function') {
                onRequestDelete(cardDetails, empName);
            }
        });
    }

    // Botão Resetar Turnos e Eventos (feedback visual animado no botão, ícone e card)
    const resetBtn = cardDetails.querySelector('.reset-btn');
    let btnResetTimer = null;
    let cardResetTimer = null;

    if (resetBtn) {
        resetBtn.addEventListener('click', (e) => {
            e.preventDefault();

            // Cancela timers pendentes para suportar reinicialização imediata em cliques consecutivos
            if (btnResetTimer) clearTimeout(btnResetTimer);
            if (cardResetTimer) clearTimeout(cardResetTimer);

            // Reinicia classes e força reflow para que a animação recomece do frame 0 a cada clique
            resetBtn.classList.remove('is-resetting');
            cardDetails.classList.remove('is-card-resetting');
            void resetBtn.offsetWidth;
            void cardDetails.offsetWidth;

            resetBtn.classList.add('is-resetting');
            cardDetails.classList.add('is-card-resetting');

            cardDetails.querySelectorAll('.shift-checkbox, .bonus-dobradinha-checkbox').forEach(cb => {
                cb.checked = false;
                cb.dispatchEvent(new Event('change'));
            });

            // Remove eventos não fixados com animação FLIP suave (Proposta 1)
            const unlockedEvents = Array.from(cardDetails.querySelectorAll('.event-item')).filter(
                el => el.dataset.locked !== 'true'
            );

            if (unlockedEvents.length > 0) {
                const lockedEvents = Array.from(cardDetails.querySelectorAll('.event-item')).filter(
                    el => el.dataset.locked === 'true'
                );
                const footer = cardDetails.querySelector('.employee-footer');
                const targetsToAnimate = [...lockedEvents];
                if (footer) targetsToAnimate.push(footer);

                const firstPositions = targetsToAnimate.map(el => ({
                    el,
                    top: el.getBoundingClientRect().top
                }));

                let remaining = unlockedEvents.length;
                unlockedEvents.forEach(eventItem => {
                    if (typeof eventItem.removeWithAnimation === 'function') {
                        eventItem.removeWithAnimation(() => {
                            remaining--;
                            if (remaining === 0) {
                                executeBatchFlip();
                                notifyChange();
                            }
                        }, { skipFlip: true });
                    } else {
                        eventItem.remove();
                        remaining--;
                        if (remaining === 0) {
                            executeBatchFlip();
                            notifyChange();
                        }
                    }
                });

                function executeBatchFlip() {
                    if (targetsToAnimate.length === 0) return;
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
            } else {
                notifyChange();
            }

            // Limpeza do botão de reset (flash e rotação horária de 0.8s)
            btnResetTimer = setTimeout(() => {
                resetBtn.classList.remove('is-resetting');
                btnResetTimer = null;
            }, 820);

            // Limpeza da varredura líquida do card (sweep suave e cadenciado de 0.85s)
            cardResetTimer = setTimeout(() => {
                cardDetails.classList.remove('is-card-resetting');
                cardResetTimer = null;
            }, 880);
        });
    }

    // Botão Gerar Holerite
    const generateHoleriteBtn = cardDetails.querySelector('.generate-holerite-btn');
    if (generateHoleriteBtn) {
        generateHoleriteBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const empData = cardDetails.getEmployeeData();
            const calculation = calculateEmployee(empData);
            const text = generateHoleriteText(empData.name, calculation);
            if (typeof onOpenHolerite === 'function') {
                onOpenHolerite(text);
            }
        });
    }

    // Event listeners dos inputs e detalhes
    cardDetails.querySelectorAll('input:not([data-type="currency"]), select, details').forEach(el => {
        el.addEventListener('input', notifyChange);
        el.addEventListener('change', notifyChange);
        if (el.tagName === 'DETAILS') {
            el.addEventListener('toggle', notifyChange);
        }
    });

    if (hourlyRateInput) {
        setupCurrencyHandlers(hourlyRateInput, notifyChange);
    }

    // Extração estruturada de dados compatível com o schema do localStorage
    cardDetails.getEmployeeData = () => {
        const shifts = [];
        cardDetails.querySelectorAll('.shift-item').forEach(shiftItem => {
            const cb = shiftItem.querySelector('.shift-checkbox');
            const hoursInput = shiftItem.querySelector('.shift-hours');
            shifts.push({
                id: cb.dataset.shift,
                checked: cb.checked,
                hours: hoursInput.dataset.lastValue || hoursInput.value
            });
        });

        const events = [];
        cardDetails.querySelectorAll('.event-item').forEach(eventItem => {
            if (typeof eventItem.getEventData === 'function') {
                events.push(eventItem.getEventData());
            }
        });

        return {
            id: cardDetails.dataset.id,
            name: nameInput.value,
            hourlyRate: hourlyRateInput ? hourlyRateInput.value : (data.hourlyRate || DEFAULT_HOURLY_RATE),
            shifts,
            bonusDobradinha: dobradinhaCheckbox.checked,
            events,
            open: true
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

        if (dobradinhaContainer) {
            dobradinhaContainer.classList.toggle('is-active', calculation.bonusDobradinhaChecked);
            dobradinhaContainer.classList.toggle('opacity-50', !calculation.isDobradinhaApplicable);
            dobradinhaContainer.classList.toggle('cursor-not-allowed', !calculation.isDobradinhaApplicable);
        }

        if (dobradinhaIndicator) {
            dobradinhaIndicator.classList.toggle('hidden', !calculation.bonusDobradinhaChecked);
        }

        // Atualizar valores parciais dos eventos na UI a partir do resultado oficial de calculator.js (SSOT)
        const eventElements = cardContent.querySelectorAll('.event-item');
        eventElements.forEach((el, index) => {
            const calculated = calculation.calculatedEvents?.[index];
            if (typeof el.setCalculatedValue === 'function') {
                el.setCalculatedValue(calculated ? calculated.formattedValue : 'R$ 0,00');
            }
        });

        // Atualizar lista de detalhamento dos turnos
        if (shiftsListEl) {
            shiftsListEl.innerHTML = '';
            calculation.shiftsBreakdown.forEach(item => {
                const li = document.createElement('li');
                li.textContent = item.formattedText;
                shiftsListEl.appendChild(li);
            });
        }

        // Atualizar lista de detalhamento dos eventos
        if (eventsListEl) {
            eventsListEl.innerHTML = '';
            calculation.eventsBreakdown.forEach(item => {
                const li = document.createElement('li');
                li.textContent = item.formattedText;
                eventsListEl.appendChild(li);
            });
        }

        // Atualizar lista de detalhamento dos bônus
        if (bonusListEl) {
            bonusListEl.innerHTML = '';
            calculation.bonusBreakdown.forEach(item => {
                const li = document.createElement('li');
                li.textContent = item.formattedText;
                bonusListEl.appendChild(li);
            });
        }

        // Esconder seções vazias ou exibir mensagem amigável quando nada estiver marcado
        const hasAnyBreakdown = calculation.shiftsBreakdown.length > 0 ||
                                calculation.eventsBreakdown.length > 0 ||
                                calculation.bonusBreakdown.length > 0;

        if (emptyBreakdownMessage) {
            emptyBreakdownMessage.classList.toggle('hidden', hasAnyBreakdown);
        }

        if (shiftsBreakdownContainer) {
            shiftsBreakdownContainer.classList.toggle('hidden', calculation.shiftsBreakdown.length === 0);
        }
        if (eventsBreakdownContainer) {
            eventsBreakdownContainer.classList.toggle('hidden', calculation.eventsBreakdown.length === 0);
        }
        if (bonusBreakdownContainer) {
            bonusBreakdownContainer.classList.toggle('hidden', calculation.bonusBreakdown.length === 0);
        }

        // Atualizar total individual formatado
        if (employeeTotalEl) {
            employeeTotalEl.textContent = formatCurrency(calculation.totalPay);
        }

        return calculation;
    };

    return cardDetails;
}
