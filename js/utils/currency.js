/**
 * Utilitários para formatação e manipulação de valores monetários (BRL)
 */

export function formatCurrency(value) {
    const numericValue = Number(value) || 0;
    return numericValue.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });
}

export function parseCurrency(value) {
    if (value === null || value === undefined || value === '') return 0;
    if (typeof value === 'number') return Number.isNaN(value) ? 0 : value;

    const cleaned = String(value)
        .replace(/R\$/g, '')
        .replace(/\./g, '')
        .replace(',', '.')
        .trim();

    const parsed = parseFloat(cleaned);
    return Number.isNaN(parsed) ? 0 : parsed;
}

/**
 * Vincula comportamento de máscara/foco amigável para campos monetários
 * @param {HTMLInputElement} input
 * @param {Function} [onBlurCallback]
 */
export function setupCurrencyHandlers(input, onBlurCallback) {
    const initialValue = parseCurrency(input.value);
    input.value = formatCurrency(initialValue);

    input.addEventListener('focus', (e) => {
        const numericValue = parseCurrency(e.target.value);
        if (numericValue !== 0) {
            e.target.value = numericValue.toFixed(2).replace('.', ',');
        } else {
            e.target.value = '';
        }
    });

    input.addEventListener('blur', (e) => {
        const numericValue = parseFloat(e.target.value.replace(',', '.')) || 0;
        e.target.value = formatCurrency(numericValue);
        if (typeof onBlurCallback === 'function') {
            onBlurCallback(numericValue);
        }
    });
}
