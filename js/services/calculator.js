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
    const hourlyRate = typeof employee.hourlyRate === 'number'
        ? employee.hourlyRate
        : parseCurrency(employee.hourlyRate);

    let salaryFromShifts = 0;
    let workedSundayMorning = false;
    let workedSundayNight = false;
    const shiftsBreakdown = [];

    const shifts = Array.isArray(employee.shifts) ? employee.shifts : [];

    shifts.forEach(shiftItem => {
        if (!shiftItem.checked) return;

        const shiftDef = SHIFTS.find(s => s.id === shiftItem.id) || {};
        const label = shiftItem.label || shiftDef.label || shiftItem.id;
        const hours = parseFloat(shiftItem.hours) || 0;
        const shiftValue = hours * hourlyRate;

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

    events.forEach(eventItem => {
        if (!eventItem.checked) return;

        const eventHours = parseFloat(eventItem.hours) || 0;
        let eventValue = 0;
        let specificRate = 0;

        if (eventItem.type === 'hours') {
            eventValue = eventHours * hourlyRate;
        } else if (eventItem.type === 'fixed') {
            eventValue = parseCurrency(eventItem.fixedValue);
        } else if (eventItem.type === 'hours_specific') {
            specificRate = parseCurrency(eventItem.specificRate);
            eventValue = eventHours * specificRate;
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
    });

    const totalPay = salaryFromShifts + bonusDobradinha + eventsTotal;

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
        totalPay
    };
}
