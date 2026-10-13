/**
 * Geração de texto do demonstrativo de pagamento (Holerite para WhatsApp)
 */

import { formatCurrency } from '../utils/currency.js';

/**
 * Gera a mensagem formatada para envio ao funcionário
 * @param {string} employeeName
 * @param {Object} calculationResult
 * @returns {string}
 */
export function generateHoleriteText(employeeName, calculationResult = {}) {
    const name = employeeName?.trim() || 'Freelancer';
    const totalFormatted = formatCurrency(calculationResult?.totalPay ?? 0);

    let text = `Olá, ${name}! Tudo bem?\n\n`;
    text += `Segue o demonstrativo dos seus pagamentos para esta semana.\n\n`;

    if (calculationResult.shiftsBreakdown?.length > 0) {
        text += `* Turnos Trabalhados:\n`;
        calculationResult.shiftsBreakdown.forEach(item => {
            text += `  - ${item.formattedText}\n`;
        });
    }

    if (calculationResult.eventsBreakdown?.length > 0) {
        text += `\n* Eventos / Adicionais:\n`;
        calculationResult.eventsBreakdown.forEach(item => {
            text += `  - ${item.formattedText}\n`;
        });
    }

    if (calculationResult.bonusBreakdown?.length > 0) {
        text += `\n* Bônus:\n`;
        calculationResult.bonusBreakdown.forEach(item => {
            text += `  - ${item.formattedText}\n`;
        });
    }

    text += `\n--------------------------------\n`;
    text += `VALOR TOTAL A RECEBER: ${totalFormatted}\n\n`;
    text += `Muito obrigado pela sua dedicação e pelo excelente trabalho!\n\n`;
    text += `Abraços,\nRuth - Paz Coffee Shop`;

    return text;
}
