/**
 * Ponto de entrada da Calculadora Paz Coffee Shop
 * Foco operacional em freelancers: busca rápida por colaborador, cálculo individual e tema
 */

import { loadStoredEmployees, saveStoredEmployees } from './state/storage.js';
import { ModalManager } from './components/modal.js';
import { createEmployeeCard } from './components/employeeCard.js';

document.addEventListener('DOMContentLoaded', () => {
    const employeeContainer = document.getElementById('employee-container');
    const addEmployeeHeaderBtn = document.getElementById('add-employee');
    const addEmployeeCardBtn = document.getElementById('add-employee-card-btn');
    const addEmployeeCard = document.getElementById('add-employee-card');
    const themeToggleBtn = document.getElementById('theme-toggle');
    const searchInput = document.getElementById('employee-search');
    const clearSearchBtn = document.getElementById('clear-search-btn');

    const modalManager = new ModalManager();

    // ==========================================
    // 1. Gerenciamento de Tema (Dark / Light Mode)
    // ==========================================
    const THEME_KEY = 'pazCoffeeTheme';
    
    function applyTheme(theme) {
        const isDark = theme === 'dark';
        document.documentElement.classList.toggle('dark', isDark);
        try {
            localStorage.setItem(THEME_KEY, theme);
        } catch (err) {
            console.warn('LocalStorage inacessível para salvar tema:', err);
        }

        if (themeToggleBtn) {
            const sunIcon = themeToggleBtn.querySelector('.sun-icon');
            const moonIcon = themeToggleBtn.querySelector('.moon-icon');
            if (sunIcon && moonIcon) {
                sunIcon.classList.toggle('hidden', !isDark);
                moonIcon.classList.toggle('hidden', isDark);
            }
        }
    }

    function initTheme() {
        let savedTheme = null;
        try {
            savedTheme = localStorage.getItem(THEME_KEY);
        } catch (err) {
            console.warn('Erro ao ler tema salvo:', err);
        }

        if (savedTheme) {
            applyTheme(savedTheme);
        } else {
            // Padrão escuro inspirado no cardápio da Paz Coffee Shop
            applyTheme('dark');
        }

        if (themeToggleBtn) {
            themeToggleBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const currentIsDark = document.documentElement.classList.contains('dark');
                applyTheme(currentIsDark ? 'light' : 'dark');
            });
        }
    }

    // ==========================================
    // 2. Busca Instantânea de Colaboradores
    // ==========================================
    function filterEmployees(query) {
        const term = query.toLowerCase().trim();
        const cards = employeeContainer.querySelectorAll('.employee-card-details');

        cards.forEach(card => {
            const name = (card.querySelector('.employee-name')?.value || '').toLowerCase();
            const matches = !term || name.includes(term);
            card.classList.toggle('hidden', !matches);
        });

        // Oculta o card tracejado de adicionar se estiver filtrando por texto
        if (addEmployeeCard) {
            addEmployeeCard.classList.toggle('hidden', term.length > 0);
        }

        if (clearSearchBtn) {
            clearSearchBtn.classList.toggle('hidden', term.length === 0);
        }
    }

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            filterEmployees(e.target.value);
        });
    }

    if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', () => {
            if (searchInput) {
                searchInput.value = '';
                filterEmployees('');
                searchInput.focus();
            }
        });
    }

    // ==========================================
    // 3. Recálculo Individual e Persistência
    // ==========================================
    function recalculateAndSave() {
        const employeesData = [];
        const cards = employeeContainer.querySelectorAll('.employee-card-details');

        cards.forEach(card => {
            if (typeof card.updateCalculations === 'function') {
                card.updateCalculations();
            }
            if (typeof card.getEmployeeData === 'function') {
                employeesData.push(card.getEmployeeData());
            }
        });

        saveStoredEmployees(employeesData);
    }

    // ==========================================
    // 4. Adicionar Colaborador à Esteira
    // ==========================================
    function addEmployee(data = {}, shouldFocus = false) {
        try {
            const card = createEmployeeCard(data, {
                onStateChange: recalculateAndSave,
                onRequestDelete: (cardElement, employeeName) => {
                    modalManager.openDeleteConfirm(
                        `Tem certeza que deseja excluir ${employeeName}?`,
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

            // Insere sempre antes do card tracejado de ação rápida
            if (addEmployeeCard && addEmployeeCard.parentNode === employeeContainer) {
                employeeContainer.insertBefore(card, addEmployeeCard);
            } else {
                employeeContainer.appendChild(card);
            }

            // Se havia busca ativa, limpa para exibir o novo card criado
            if (searchInput && searchInput.value) {
                searchInput.value = '';
                filterEmployees('');
            }

            if (shouldFocus) {
                const nameInput = card.querySelector('.employee-name');
                if (nameInput) {
                    nameInput.focus();
                    card.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'end' });
                }
            }

            recalculateAndSave();
        } catch (err) {
            console.error('Erro ao adicionar colaborador:', err);
        }
    }

    // Botões de Adicionar Colaborador (Topo e Card da Esteira)
    if (addEmployeeHeaderBtn) {
        addEmployeeHeaderBtn.addEventListener('click', (e) => {
            e.preventDefault();
            addEmployee({}, true);
        });
    }
    if (addEmployeeCardBtn) {
        addEmployeeCardBtn.addEventListener('click', (e) => {
            e.preventDefault();
            addEmployee({}, true);
        });
    }

    // ==========================================
    // 5. Inicialização da Aplicação
    // ==========================================
    function init() {
        initTheme();

        try {
            const saved = loadStoredEmployees();
            if (saved && saved.length > 0) {
                saved.forEach(empData => addEmployee(empData, false));
            } else {
                // Se for primeira vez, inicia com 1 colaborador vazio
                addEmployee({}, false);
            }
        } catch (err) {
            console.error('Erro ao carregar colaboradores salvos:', err);
            addEmployee({}, false);
        }

        recalculateAndSave();
    }

    init();
});
