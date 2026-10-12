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
 * Salva a lista de funcionários no localStorage
 * @param {Array<Object>} employeesData
 */
export function saveStoredEmployees(employeesData) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(employeesData));
    } catch (err) {
        console.error('Erro ao salvar dados no localStorage:', err);
    }
}
