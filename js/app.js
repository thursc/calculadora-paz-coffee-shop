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

        // Atalho global rápido (Ctrl+K ou barra '/') para focar a busca no desktop
        window.addEventListener('keydown', (e) => {
            const isCtrlK = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k';
            const isSlash = e.key === '/';
            const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
            const isEditing = activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select' || document.activeElement?.isContentEditable;

            if (isCtrlK || (isSlash && !isEditing)) {
                e.preventDefault();
                searchInput.focus();
                searchInput.select();
            } else if (e.key === 'Escape' && document.activeElement === searchInput) {
                searchInput.blur();
            }
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
    // 2.5 Alternador de Visualização Desktop (Grade Fluida vs Kanban)
    // ==========================================
    const VIEW_MODE_KEY = 'pazCoffeeDesktopView';
    const viewGridBtn = document.getElementById('view-mode-grid');
    const viewKanbanBtn = document.getElementById('view-mode-kanban');

    function setDesktopViewMode(mode) {
        const isGrid = mode === 'grid';
        if (employeeContainer) {
            employeeContainer.classList.toggle('desktop-grid-view', isGrid);
            employeeContainer.classList.toggle('desktop-kanban-view', !isGrid);
        }

        const activeClasses = ['bg-white', 'dark:bg-stone-800', 'text-stone-900', 'dark:text-stone-100', 'shadow-sm'];
        const inactiveClasses = ['text-stone-500', 'hover:text-stone-800', 'dark:text-stone-400', 'dark:hover:text-stone-200'];

        if (viewGridBtn && viewKanbanBtn) {
            if (isGrid) {
                viewGridBtn.classList.add(...activeClasses);
                viewGridBtn.classList.remove(...inactiveClasses);
                viewKanbanBtn.classList.remove(...activeClasses);
                viewKanbanBtn.classList.add(...inactiveClasses);
            } else {
                viewKanbanBtn.classList.add(...activeClasses);
                viewKanbanBtn.classList.remove(...inactiveClasses);
                viewGridBtn.classList.remove(...activeClasses);
                viewGridBtn.classList.add(...inactiveClasses);
            }
        }

        try {
            localStorage.setItem(VIEW_MODE_KEY, mode);
        } catch (err) {
            console.warn('Erro ao salvar preferência de layout:', err);
        }
    }

    function initDesktopView() {
        let savedView = null;
        try {
            savedView = localStorage.getItem(VIEW_MODE_KEY);
        } catch (err) {
            console.warn('Erro ao ler preferência de layout:', err);
        }

        // Padrão no desktop: grid fluido moderno
        setDesktopViewMode(savedView || 'grid');

        if (viewGridBtn) {
            viewGridBtn.addEventListener('click', (e) => {
                e.preventDefault();
                setDesktopViewMode('grid');
            });
        }

        if (viewKanbanBtn) {
            viewKanbanBtn.addEventListener('click', (e) => {
                e.preventDefault();
                setDesktopViewMode('kanban');
            });
        }
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
                            // Feedback visual animado de saída suave
                            cardElement.classList.add('card-animate-delete');
                            setTimeout(() => {
                                cardElement.remove();
                                recalculateAndSave();
                            }, 280);
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
                // Feedback visual animado de entrada suave
                card.classList.add('card-animate-enter');
                setTimeout(() => {
                    card.classList.remove('card-animate-enter');
                }, 500);

                const nameInput = card.querySelector('.employee-name');
                if (nameInput) {
                    nameInput.focus();
                }

                // Rola suavemente a esteira horizontal até o novo colaborador
                requestAnimationFrame(() => {
                    employeeContainer.scrollTo({
                        left: card.offsetLeft - 24,
                        behavior: 'smooth'
                    });
                });
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
    // 5. Início Focado no Topo e Primeiro Colaborador (x=0, y=0)
    // ==========================================
    function resetScrollPosition() {
        window.scrollTo({ left: 0, top: 0, behavior: 'instant' });
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
        if (employeeContainer) {
            employeeContainer.scrollLeft = 0;
        }
    }

    // ==========================================
    // 6. Navegação Desktop: Scroll do Mouse e Setas
    // ==========================================
    function setupDesktopNavigation() {
        // Scroll horizontal fluido e responsivo com a roda do mouse (wheel)
        function handleWheel(e) {
            // Se algum modal estiver aberto ou o cursor estiver dentro de um modal, mantém o comportamento vertical nativo
            if (document.body.classList.contains('overflow-hidden') || e.target.closest('.modal')) {
                return;
            }

            // No modo Grade no Desktop (>= 768px), o scroll vertical da página deve ser 100% natural e nativo
            if (employeeContainer && employeeContainer.classList.contains('desktop-grid-view') && window.innerWidth >= 768) {
                return;
            }

            // Se o usuário estiver usando trackpad com rolagem horizontal nativa (deltaX), preserva o evento nativo
            if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
                return;
            }

            if (e.deltaY === 0 || !employeeContainer) return;

            // Normalização universal do deltaY (compatibilidade total Chrome, Firefox e Edge no Windows e Mac)
            let delta = e.deltaY;
            if (e.deltaMode === 1) { // Firefox Windows deltaMode = 1 (lines)
                delta *= 36;
            } else if (e.deltaMode === 2) { // Pages
                delta *= 360;
            }

            e.preventDefault();
            employeeContainer.scrollLeft += (delta * 1.35);
        }

        window.addEventListener('wheel', handleWheel, { passive: false });
        employeeContainer.addEventListener('wheel', handleWheel, { passive: false });

        // Setas do teclado (Esquerda e Direita)
        window.addEventListener('keydown', (e) => {
            // Ignora se algum modal estiver aberto
            if (document.body.classList.contains('overflow-hidden') || document.querySelector('.modal:not(.opacity-0)')) {
                return;
            }

            // Se estiver no modo Grade no desktop, as setas horizontais não devem forçar rolagem de esteira
            if (employeeContainer && employeeContainer.classList.contains('desktop-grid-view') && window.innerWidth >= 768) {
                return;
            }

            // Preserva as teclas caso o usuário esteja editando algum input, textarea ou select
            const activeEl = document.activeElement;
            const activeTag = activeEl ? activeEl.tagName.toLowerCase() : '';
            if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select' || activeEl?.isContentEditable) {
                return;
            }

            // Largura média de um card com espaçamento (~340px + gap 24px)
            const step = 360;

            if (e.key === 'ArrowRight') {
                e.preventDefault();
                employeeContainer.scrollBy({ left: step, behavior: 'smooth' });
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                employeeContainer.scrollBy({ left: -step, behavior: 'smooth' });
            } else if (e.key === 'Home') {
                e.preventDefault();
                employeeContainer.scrollTo({ left: 0, behavior: 'smooth' });
            } else if (e.key === 'End') {
                e.preventDefault();
                employeeContainer.scrollTo({ left: employeeContainer.scrollWidth, behavior: 'smooth' });
            }
        });
    }

    // ==========================================
    // 7. Inicialização da Aplicação
    // ==========================================
    function init() {
        if ('scrollRestoration' in history) {
            history.scrollRestoration = 'manual';
        }

        initTheme();
        initDesktopView();
        setupDesktopNavigation();

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

        // Sempre posiciona no topo e no primeiro colaborador (x=0, y=0) ao iniciar
        resetScrollPosition();
        requestAnimationFrame(resetScrollPosition);
    }

    init();

    window.addEventListener('load', resetScrollPosition, { once: true });
    window.addEventListener('pageshow', resetScrollPosition);
});
