/**
 * Ponto de entrada da Calculadora Paz Coffee Shop
 * Orquestra componentes, estado, cálculos e interações com a UI
 */

import { formatCurrency } from './utils/currency.js';
import { loadStoredEmployees, saveStoredEmployees } from './state/storage.js';
import { ModalManager } from './components/modal.js';
import { createEmployeeCard } from './components/employeeCard.js';

document.addEventListener('DOMContentLoaded', () => {
    const employeeContainer = document.getElementById('employee-container');
    const addEmployeeButton = document.getElementById('add-employee');
    const totalCostEl = document.getElementById('total-cost');

    const modalManager = new ModalManager();

    /**
     * Recalcula todos os funcionários, atualiza o custo total e salva no localStorage
     */
    function recalculateAndSave() {
        let grandTotal = 0;
        const employeesData = [];
        const cards = employeeContainer.querySelectorAll('.employee-card-details');

        cards.forEach(card => {
            if (typeof card.updateCalculations === 'function') {
                const total = card.updateCalculations();
                grandTotal += total;
            }
            if (typeof card.getEmployeeData === 'function') {
                employeesData.push(card.getEmployeeData());
            }
        });

        if (totalCostEl) {
            totalCostEl.textContent = formatCurrency(grandTotal);
        }

        saveStoredEmployees(employeesData);
    }

    /**
     * Adiciona um novo funcionário à interface
     * @param {Object} [data] Dados prévios do funcionário
     * @param {boolean} [shouldFocus=false] Se deve focar no campo de nome
     */
    function addEmployee(data = {}, shouldFocus = false) {
        const card = createEmployeeCard(data, {
            onStateChange: recalculateAndSave,
            onRequestDelete: (cardElement, employeeName) => {
                modalManager.openDeleteConfirm(
                    `Tem certeza que quer excluir ${employeeName}?`,
                    () => {
                        cardElement.remove();
                        recalculateAndSave();
                    }
                );
            },
            onOpenHolerite: (holeriteText) => {
                modalManager.openHolerite(holeriteText);
            }
        });

        employeeContainer.appendChild(card);

        if (shouldFocus) {
            const nameInput = card.querySelector('.employee-name');
            if (nameInput) nameInput.focus();
        }

        recalculateAndSave();
    }

    // Botão Adicionar Funcionário
    if (addEmployeeButton) {
        addEmployeeButton.addEventListener('click', () => {
            addEmployee({}, true);
        });
    }

    // Carregar dados salvos do localStorage
    function init() {
        const saved = loadStoredEmployees();
        if (saved && saved.length > 0) {
            saved.forEach(empData => addEmployee(empData, false));
        } else {
            // Se não houver dados salvos, inicia com um cartão vazio
            addEmployee({}, false);
        }
        recalculateAndSave();
    }

    init();
});
