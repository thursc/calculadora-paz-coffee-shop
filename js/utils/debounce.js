/**
 * Utilitário de debounce para controle de frequência de chamadas (Performance & I/O)
 * @param {Function} fn Função a ser executada
 * @param {number} delay Tempo de espera em milissegundos (padrão: 250ms)
 * @returns {Function} Função debounced com métodos auxiliares cancel() e flush()
 */
export function debounce(fn, delay = 250) {
    let timer = null;
    let lastArgs = null;

    const debounced = (...args) => {
        lastArgs = args;
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
            timer = null;
            fn(...lastArgs);
        }, delay);
    };

    debounced.cancel = () => {
        if (timer) {
            clearTimeout(timer);
            timer = null;
        }
        lastArgs = null;
    };

    debounced.flush = () => {
        if (timer) {
            clearTimeout(timer);
            timer = null;
            if (lastArgs) {
                fn(...lastArgs);
                lastArgs = null;
            }
        }
    };

    return debounced;
}
