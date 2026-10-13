/**
 * Componente do Card de Funcionário
 * Visual moderno estilo Cafeteria com Chips Táteis (Toggle Pills) e Coluna Kanban
 */

import { SHIFTS, DEFAULT_HOURLY_RATE } from '../config.js';
import { setupCurrencyHandlers, formatCurrency, enableAutoSelect } from '../utils/currency.js';
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
    const eventsEmptyPlaceholder = cardContent.querySelector('.events-empty-placeholder');

    function updateEventsEmptyState() {
        if (eventsEmptyPlaceholder) {
            const hasEvents = eventList.querySelectorAll('.event-item').length > 0;
            eventsEmptyPlaceholder.classList.toggle('hidden', hasEvents);
        }
    }

    // Função de notificação para a aplicação principal (passando o card de origem para recálculo O(1))
    function notifyChange(options = {}) {
        updateEventsEmptyState();
        if (typeof onStateChange === 'function') {
            onStateChange({ sourceCard: cardDetails, ...options });
        }
    }

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
        const shiftInputId = `shift-${uniqueId}-${shift.id}`;
        shiftEl.className = 'shift-item shift-pill flex items-center justify-between p-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/30 select-none cursor-pointer';
        shiftEl.setAttribute('role', 'checkbox');
        shiftEl.setAttribute('aria-label', shift.label);
        shiftEl.innerHTML = `
            <div class="shift-toggle-btn flex items-center gap-2.5 flex-grow min-w-0 pr-2 pointer-events-none">
                <input type="checkbox" class="shift-checkbox sr-only" data-shift="${shift.id}" id="${shiftInputId}" aria-label="${shift.label}">
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
                <input type="number" class="shift-hours w-16 py-1 px-2 text-right text-sm bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-800 dark:text-stone-100 font-bold focus:ring-1 focus:ring-amber-500 transition-opacity" step="0.5" min="0" aria-label="Horas de ${shift.label}">
                <span class="text-xs text-stone-400 font-medium pointer-events-none">hrs</span>
            </div>
        `;
        shiftsContainer.appendChild(shiftEl);

        const checkbox = shiftEl.querySelector('.shift-checkbox');
        const checkIcon = shiftEl.querySelector('.shift-check-indicator svg');
        const indicatorRing = shiftEl.querySelector('.shift-check-indicator');
        const hoursInput = shiftEl.querySelector('.shift-hours');
        const hoursWrapper = shiftEl.querySelector('.shift-hours-wrapper');

        const defaultHours = String(shift.hours);
        let initialSavedHours;
        if (savedShift.checked) {
            initialSavedHours = savedShift.hours !== undefined ? String(savedShift.hours) : defaultHours;
        } else {
            // Se estava desmarcado e salvo como '0', restaura o padrão original do turno (7, 7, 8, 5)
            const parsed = parseFloat(savedShift.hours);
            initialSavedHours = (!Number.isNaN(parsed) && parsed > 0) ? String(savedShift.hours) : defaultHours;
        }

        hoursInput.dataset.lastValue = initialSavedHours;
        checkbox.checked = savedShift.checked || false;

        const setShiftState = (isChecked, isUserAction = false) => {
            hoursInput.disabled = !isChecked;
            shiftEl.classList.toggle('is-active', isChecked);
            shiftEl.setAttribute('aria-checked', isChecked ? 'true' : 'false');

            if (isChecked) {
                checkIcon.classList.remove('hidden');
                indicatorRing.classList.add('border-amber-500', 'bg-amber-500/20');
                if (isUserAction) {
                    const lastVal = hoursInput.dataset.lastValue;
                    hoursInput.value = (lastVal !== undefined && lastVal !== '' && !Number.isNaN(parseFloat(lastVal)) && parseFloat(lastVal) >= 0)
                        ? lastVal
                        : defaultHours;
                } else if (!hoursInput.value) {
                    hoursInput.value = hoursInput.dataset.lastValue || defaultHours;
                }
            } else {
                checkIcon.classList.add('hidden');
                indicatorRing.classList.remove('border-amber-500', 'bg-amber-500/20');
                if (hoursInput.value !== '' && !Number.isNaN(parseFloat(hoursInput.value)) && parseFloat(hoursInput.value) >= 0) {
                    hoursInput.dataset.lastValue = hoursInput.value;
                }
                // Exibe o valor padrão do turno (ou último valor customizado > 0) esmaecido no input
                const lastVal = hoursInput.dataset.lastValue;
                const parsedLast = parseFloat(lastVal);
                hoursInput.value = (!Number.isNaN(parsedLast) && parsedLast > 0) ? lastVal : defaultHours;
            }
        };

        // Clique em qualquer parte da pílula (inclusive bordas e texto) ativa/desativa o turno,
        // EXCETO se o alvo for dentro do wrapper de horas
        shiftEl.addEventListener('click', (e) => {
            if (e.target.closest('.shift-hours-wrapper')) return;
            e.preventDefault();
            checkbox.checked = !checkbox.checked;
            setShiftState(checkbox.checked, true);
            notifyChange();
        });

        // Suporte acessível via teclado no checkbox
        checkbox.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                checkbox.checked = !checkbox.checked;
                setShiftState(checkbox.checked, true);
                notifyChange();
            }
        });

        // Impede que qualquer clique no wrapper de horas borbulhe para a linha e ative o turno
        hoursWrapper.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        hoursInput.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        // Habilita auto-seleção imediata do texto ao focar ou clicar no campo de horas
        enableAutoSelect(hoursInput);

        hoursInput.addEventListener('input', () => {
            const raw = parseFloat(hoursInput.value);
            if (!Number.isNaN(raw) && raw < 0) {
                hoursInput.value = '0';
            }
            if (hoursInput.value !== '' && !Number.isNaN(raw) && raw >= 0) {
                hoursInput.dataset.lastValue = hoursInput.value;
            }
            notifyChange();
        });

        hoursInput.addEventListener('blur', () => {
            if (hoursInput.value.trim() === '') {
                hoursInput.value = checkbox.checked ? '0' : defaultHours;
                hoursInput.dataset.lastValue = hoursInput.value;
                notifyChange();
            }
        });

        checkbox.addEventListener('change', () => {
            setShiftState(checkbox.checked, false);
            notifyChange();
        });

        // Inicialização de estado do turno
        if (checkbox.checked) {
            hoursInput.value = initialSavedHours;
            setShiftState(true, false);
        } else {
            hoursInput.value = initialSavedHours;
            setShiftState(false, false);
        }
    });


    // Pílula interativa da Dobradinha (com foco acessível e teclado)
    if (dobradinhaContainer) {
        dobradinhaContainer.addEventListener('click', (e) => {
            if (dobradinhaCheckbox.disabled) return;
            if (e.target === dobradinhaCheckbox) {
                notifyChange();
                return;
            }
            dobradinhaCheckbox.checked = !dobradinhaCheckbox.checked;
            notifyChange();
        });

        dobradinhaCheckbox.addEventListener('focus', () => dobradinhaContainer.classList.add('is-focused'));
        dobradinhaCheckbox.addEventListener('blur', () => dobradinhaContainer.classList.remove('is-focused'));

        dobradinhaCheckbox.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !dobradinhaCheckbox.disabled) {
                e.preventDefault();
                dobradinhaCheckbox.checked = !dobradinhaCheckbox.checked;
                notifyChange();
            }
        });

        dobradinhaCheckbox.addEventListener('change', () => {
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

    // Atualiza estado visual inicial da seção de adicionais
    updateEventsEmptyState();

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

            // Reinicia classes via rAF duplo sem forçar reflow síncrono (eliminando Layout Thrashing)
            resetBtn.classList.remove('is-resetting');
            cardDetails.classList.remove('is-card-resetting');
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    resetBtn.classList.add('is-resetting');
                    cardDetails.classList.add('is-card-resetting');
                });
            });

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

    // Nome do funcionário e detalhes do cálculo (evita listeners duplicados nos turnos e dobradinha que já possuem handlers dedicados)
    if (nameInput) {
        nameInput.addEventListener('input', () => notifyChange());
    }
    const calcDetails = cardDetails.querySelector('.calculation-details');
    if (calcDetails) {
        calcDetails.addEventListener('toggle', () => notifyChange());
    }

    if (hourlyRateInput) {
        setupCurrencyHandlers(hourlyRateInput, () => notifyChange(), () => notifyChange());
    }

    // Extração estruturada de dados compatível com o schema do localStorage
    cardDetails.getEmployeeData = () => {
        const shifts = [];
        cardDetails.querySelectorAll('.shift-item').forEach(shiftItem => {
            const cb = shiftItem.querySelector('.shift-checkbox');
            const hoursInput = shiftItem.querySelector('.shift-hours');
            const currentVal = hoursInput.value.trim();
            const shiftDef = SHIFTS.find(s => s.id === cb.dataset.shift) || {};
            const defHours = String(shiftDef.hours || 0);
            const resolvedHours = cb.checked
                ? (currentVal !== '' ? currentVal : '0')
                : ((hoursInput.dataset.lastValue && parseFloat(hoursInput.dataset.lastValue) > 0) ? hoursInput.dataset.lastValue : defHours);

            shifts.push({
                id: cb.dataset.shift,
                checked: cb.checked,
                hours: resolvedHours
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
            dobradinhaContainer.setAttribute('role', 'checkbox');
            dobradinhaContainer.setAttribute('aria-checked', calculation.bonusDobradinhaChecked ? 'true' : 'false');
            dobradinhaContainer.setAttribute('aria-disabled', !calculation.isDobradinhaApplicable ? 'true' : 'false');
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
