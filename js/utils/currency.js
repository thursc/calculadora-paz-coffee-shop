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
    if (typeof value === 'number') return Number.isNaN(value) || value < 0 ? 0 : value;

    let str = String(value).replace(/R\$/g, '').trim();

    // Trata separadores pt-BR vs internacional:
    if (str.includes(',')) {
        str = str.replace(/\./g, '').replace(',', '.');
    } else if (str.includes('.')) {
        const parts = str.split('.');
        // Se tiver mais de um ponto (ex: 1.000.000) ou padrão milhar com 3 zeros (ex: 1.000), remove ponto
        if (parts.length > 2 || (parts.length === 2 && parts[1].length === 3 && parts[1] === '000')) {
            str = str.replace(/\./g, '');
        }
    }

    const parsed = parseFloat(str);
    if (Number.isNaN(parsed) || parsed < 0) return 0;
    return parsed;
}

/**
 * Habilita seleção automática de todo o texto ao focar ou clicar em um campo numérico
 * @param {HTMLInputElement} input
 */
export function enableAutoSelect(input) {
    if (!input) return;

    const selectAll = () => {
        requestAnimationFrame(() => {
            if (typeof input.select === 'function') {
                input.select();
            }
        });
    };

    input.addEventListener('focus', selectAll);
    input.addEventListener('click', selectAll);
}

/**
 * Vincula comportamento de máscara/foco amigável para campos monetários
 * @param {HTMLInputElement} input
 * @param {Function} [onBlurCallback]
 * @param {Function} [onInputCallback]
 */
export function setupCurrencyHandlers(input, onBlurCallback, onInputCallback) {
    const initialValue = parseCurrency(input.value);
    input.value = formatCurrency(initialValue);

    input.addEventListener('focus', (e) => {
        const numericValue = parseCurrency(e.target.value);
        if (numericValue !== 0) {
            e.target.value = numericValue.toFixed(2).replace('.', ',');
        } else {
            e.target.value = '';
        }
        requestAnimationFrame(() => {
            input.select();
        });
    });

    input.addEventListener('click', () => {
        requestAnimationFrame(() => {
            input.select();
        });
    });

    input.addEventListener('input', (e) => {
        const raw = e.target.value;
        if (raw.includes('-')) {
            e.target.value = raw.replace(/-/g, '');
        }
        if (typeof onInputCallback === 'function') {
            const currentNumericValue = parseCurrency(e.target.value);
            onInputCallback(currentNumericValue);
        }
    });

    input.addEventListener('blur', (e) => {
        const numericValue = parseCurrency(e.target.value);
        e.target.value = formatCurrency(numericValue);
        if (typeof onBlurCallback === 'function') {
            onBlurCallback(numericValue);
        }
    });
}
