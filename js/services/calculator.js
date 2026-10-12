/**
 * Serviço puro de cálculos financeiros e regras de pagamento da Paz Coffee Shop
 */

import { BONUS_DOBRADINHA_VALUE, SHIFTS } from '../config.js';
import { formatCurrency, parseCurrency } from '../utils/currency.js';

/**
 * Calcula os totais de um funcionário
 * @param {Object} employee
 * @returns {Object} Detalhamento dos cálculos
 */
export function calculateEmployee(employee) {
    const rawHourlyRate = typeof employee.hourlyRate === 'number'
        ? employee.hourlyRate
        : parseCurrency(employee.hourlyRate);
    const hourlyRate = Math.max(0, rawHourlyRate || 0);

    let salaryFromShifts = 0;
    let workedSundayMorning = false;
    let workedSundayNight = false;
    const shiftsBreakdown = [];

    const shifts = Array.isArray(employee.shifts) ? employee.shifts : [];

    shifts.forEach(shiftItem => {
        if (!shiftItem.checked) return;

        const shiftDef = SHIFTS.find(s => s.id === shiftItem.id) || {};
        const label = shiftItem.label || shiftDef.label || shiftItem.id;
        const rawHours = parseFloat(shiftItem.hours);
        const hours = (!Number.isNaN(rawHours) && rawHours > 0) ? rawHours : 0;
        const shiftValue = Math.max(0, hours * hourlyRate);

        salaryFromShifts += shiftValue;

        if (shiftItem.id === 'domingo_manha') workedSundayMorning = true;
        if (shiftItem.id === 'domingo_noite') workedSundayNight = true;

        shiftsBreakdown.push({
            id: shiftItem.id,
            label,
            hours,
            value: shiftValue,
            formattedText: `${label}: ${formatCurrency(shiftValue)} (por ${hours} horas)`
        });
    });

    const isDobradinhaApplicable = workedSundayMorning && workedSundayNight;
    const bonusDobradinhaChecked = isDobradinhaApplicable && Boolean(employee.bonusDobradinha);
    const bonusDobradinha = bonusDobradinhaChecked ? BONUS_DOBRADINHA_VALUE : 0;

    const bonusBreakdown = [];
    if (bonusDobradinhaChecked) {
        bonusBreakdown.push({
            label: 'Dobradinha',
            value: BONUS_DOBRADINHA_VALUE,
            formattedText: `Dobradinha: ${formatCurrency(BONUS_DOBRADINHA_VALUE)}`
        });
    }

    let eventsTotal = 0;
    const eventsBreakdown = [];
    const events = Array.isArray(employee.events) ? employee.events : [];

    const calculatedEvents = events.map(eventItem => {
        const rawEventHours = parseFloat(eventItem.hours);
        const eventHours = (!Number.isNaN(rawEventHours) && rawEventHours > 0) ? rawEventHours : 0;
        let eventValue = 0;
        let specificRate = 0;

        if (eventItem.checked) {
            if (eventItem.type === 'hours') {
                eventValue = Math.max(0, eventHours * hourlyRate);
            } else if (eventItem.type === 'fixed') {
                eventValue = Math.max(0, parseCurrency(eventItem.fixedValue));
            } else if (eventItem.type === 'hours_specific') {
                specificRate = Math.max(0, parseCurrency(eventItem.specificRate));
                eventValue = Math.max(0, eventHours * specificRate);
            }

            eventsTotal += eventValue;

            if (eventValue > 0) {
                const eventName = eventItem.name?.trim() || 'Adicional sem nome';
                let detailText = `${eventName}: ${formatCurrency(eventValue)}`;

                if ((eventItem.type === 'hours' || eventItem.type === 'hours_specific') && eventHours > 0) {
                    const rateDetail = eventItem.type === 'hours_specific' ? ` @ ${formatCurrency(specificRate)}/h` : '';
                    detailText = `${eventName}: ${formatCurrency(eventValue)} (${eventHours}h${rateDetail})`;
                }

                eventsBreakdown.push({
                    name: eventName,
                    type: eventItem.type,
                    hours: eventHours,
                    value: eventValue,
                    specificRate,
                    formattedText: detailText
                });
            }
        }

        return {
            name: eventItem.name,
            type: eventItem.type,
            hours: eventHours,
            checked: Boolean(eventItem.checked),
            specificRate,
            value: eventValue,
            formattedValue: formatCurrency(eventValue)
        };
    });

    const totalPay = Math.max(0, salaryFromShifts + bonusDobradinha + eventsTotal);

    // Horas acumuladas da equipe
    const shiftHours = shiftsBreakdown.reduce((acc, s) => acc + (s.hours || 0), 0);
    const eventHours = eventsBreakdown.reduce((acc, e) => {
        return (e.type === 'hours' || e.type === 'hours_specific') ? acc + (e.hours || 0) : acc;
    }, 0);
    const totalHours = shiftHours + eventHours;
    const hasActiveWork = totalPay > 0 || totalHours > 0;

    return {
        hourlyRate,
        salaryFromShifts,
        isDobradinhaApplicable,
        bonusDobradinhaChecked,
        bonusDobradinha,
        bonusBreakdown,
        shiftsBreakdown,
        eventsTotal,
        eventsBreakdown,
        calculatedEvents,
        totalPay,
        totalHours,
        hasActiveWork
    };
}
