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
                            // 1. FLIP (First): Armazena as posições dos elementos irmãos antes da exclusão
                            const siblings = Array.from(employeeContainer.children).filter(
                                el => el !== cardElement && (el.classList.contains('kanban-col') || el.id === 'add-employee-card')
                            );
                            const firstPositions = siblings.map(el => {
                                const rect = el.getBoundingClientRect();
                                return { el, left: rect.left, top: rect.top };
                            });

                            // 2. Animação de saída sutil do card excluído
                            cardElement.classList.add('card-animate-delete');

                            setTimeout(() => {
                                // 3. Remove o card do DOM e recalcula
                                cardElement.remove();
                                recalculateAndSave();

                                // 4. FLIP (Invert): Mede nova posição e inverte instantaneamente
                                const movingElements = [];
                                firstPositions.forEach(({ el, left, top }) => {
                                    if (!el.isConnected) return;
                                    const newRect = el.getBoundingClientRect();
                                    const deltaX = left - newRect.left;
                                    const deltaY = top - newRect.top;

                                    if (Math.abs(deltaX) > 0.5 || Math.abs(deltaY) > 0.5) {
                                        el.style.transition = 'none';
                                        el.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
                                        movingElements.push(el);
                                    }
                                });

                                // 5. FLIP (Play): No frame seguinte, desliza suavemente até a nova posição
                                requestAnimationFrame(() => {
                                    requestAnimationFrame(() => {
                                        movingElements.forEach(el => {
                                            el.style.transition = 'transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1)';
                                            el.style.transform = '';
                                        });

                                        setTimeout(() => {
                                            movingElements.forEach(el => {
                                                el.style.transition = '';
                                            });
                                        }, 380);
                                    });
                                });
                            }, 200);
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

                // Desktop: usa scrollIntoView para o grid nativo da página
                // Mobile: rola a esteira horizontal até o novo card
                requestAnimationFrame(() => {
                    if (window.innerWidth >= 768) {
                        card.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
                    } else {
                        employeeContainer.scrollTo({
                            left: card.offsetLeft - 16,
                            behavior: 'smooth'
                        });
                    }
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
    // 6. Navegação Desktop: Scroll do Mouse e Setas (Mobile Kanban)
    // ==========================================
    function setupDesktopNavigation() {
        // Wheel: no desktop (≥ 768px) o grid nativo da página cuida do scroll vertical.
        // No mobile (< 768px / esteira Kanban), converte deltaY em scrollLeft horizontal.
        function handleWheel(e) {
            // Modal aberto: comportamento nativo
            if (document.body.classList.contains('overflow-hidden') || e.target.closest('.modal')) {
                return;
            }

            // Desktop (≥ 768px): scroll vertical nativo da página — não interceptar
            if (window.innerWidth >= 768) {
                return;
            }

            // Trackpad com scroll horizontal nativo: preservar
            if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
                return;
            }

            if (e.deltaY === 0 || !employeeContainer) return;

            // Normalização universal do deltaY (Chrome, Firefox, Edge no Windows/Mac)
            let delta = e.deltaY;
            if (e.deltaMode === 1) { // Firefox Windows: deltaMode = 1 (linhas)
                delta *= 36;
            } else if (e.deltaMode === 2) { // Páginas
                delta *= 360;
            }

            e.preventDefault();
            employeeContainer.scrollLeft += (delta * 1.35);
        }

        window.addEventListener('wheel', handleWheel, { passive: false });
        employeeContainer.addEventListener('wheel', handleWheel, { passive: false });

        // Teclas de seta: apenas ativas no mobile / esteira Kanban
        window.addEventListener('keydown', (e) => {
            // Modal aberto: ignorar
            if (document.body.classList.contains('overflow-hidden') || document.querySelector('.modal:not(.opacity-0)')) {
                return;
            }

            // Desktop: setas não controlam a esteira (grid nativo)
            if (window.innerWidth >= 768) {
                return;
            }

            // Editando um campo: preservar comportamento nativo das setas
            const activeEl = document.activeElement;
            const activeTag = activeEl ? activeEl.tagName.toLowerCase() : '';
            if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select' || activeEl?.isContentEditable) {
                return;
            }

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
