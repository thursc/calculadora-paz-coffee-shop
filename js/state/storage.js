/**
 * Persistência e compatibilidade com localStorage
 */

import { STORAGE_KEY, DEFAULT_HOURLY_RATE } from '../config.js';

/**
 * Carrega a lista de funcionários do localStorage de forma segura
 * @returns {Array<Object>} Lista de funcionários salvos
 */
export function loadStoredEmployees() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];

        return parsed.map((emp, index) => {
            const rawRate = emp.hourlyRate;
            const hourlyRate = (rawRate === null || rawRate === undefined || rawRate === '')
                ? DEFAULT_HOURLY_RATE
                : rawRate;
            return {
                id: emp.id || `employee-${Date.now()}-${index}`,
                name: typeof emp.name === 'string' ? emp.name : '',
                hourlyRate,
                shifts: Array.isArray(emp.shifts) ? emp.shifts : [],
                bonusDobradinha: Boolean(emp.bonusDobradinha),
                events: Array.isArray(emp.events) ? emp.events : [],
                open: emp.open !== false
            };
        });
    } catch (err) {
        console.error('Erro ao ler dados do localStorage:', err);
        return [];
    }
}

/**
 * Salva a lista de funcionários no localStorage com tratamento para QuotaExceededError
 * @param {Array<Object>} employeesData
 * @returns {boolean} True se persistido com sucesso, false caso ocorra falha de quota ou segurança
 */
export function saveStoredEmployees(employeesData) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(employeesData));
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('storage-save-success'));
        }
        return true;
    } catch (err) {
        console.error('Erro ao salvar dados no localStorage:', err);
        if (typeof window !== 'undefined') {
            const isQuota = err.name === 'QuotaExceededError' ||
                            err.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
                            err.code === 22 ||
                            err.code === 1014;
            const message = isQuota
                ? 'O limite de armazenamento do navegador foi atingido. Seus dados recentes não puderam ser gravados no disco.'
                : 'Não foi possível gravar no armazenamento local (navegador em modo anônimo restrito ou cookies desativados).';

            window.dispatchEvent(new CustomEvent('storage-save-error', {
                detail: { error: err, isQuota, message }
            }));
        }
        return false;
    }
}

