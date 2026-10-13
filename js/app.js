/**
 * Ponto de entrada da Calculadora Paz Coffee Shop
 * Foco operacional em freelancers: busca rápida por colaborador, cálculo individual e tema
 */

import { loadStoredEmployees, saveStoredEmployees } from './state/storage.js';
import { ModalManager } from './components/modal.js';
import { createEmployeeCard } from './components/employeeCard.js';
import { debounce } from './utils/debounce.js';

document.addEventListener('DOMContentLoaded', () => {
    const employeeContainer = document.getElementById('employee-container');
    const addEmployeeHeaderBtn = document.getElementById('add-employee');
    const addEmployeeCardBtn = document.getElementById('add-employee-card-btn');
    const addEmployeeCard = document.getElementById('add-employee-card');
    const themeToggleBtn = document.getElementById('theme-toggle');
    const searchInput = document.getElementById('employee-search');
    const clearSearchBtn = document.getElementById('clear-search-btn');

    const searchEmptyState = document.getElementById('search-empty-state');
    const searchEmptyTerm = document.getElementById('search-empty-term');
    const searchEmptyClearBtn = document.getElementById('search-empty-clear-btn');

    const storageAlertBanner = document.getElementById('storage-alert-banner');
    const storageAlertMessage = document.getElementById('storage-alert-message');
    const storageAlertCloseBtn = document.getElementById('storage-alert-close-btn');

    // Elementos do Toast de Desfazer Exclusão (Undo)
    const undoToast = document.getElementById('undo-toast');
    const undoToastMessage = document.getElementById('undo-toast-message');
    const undoToastBtn = document.getElementById('undo-toast-btn');
    const undoToastClose = document.getElementById('undo-toast-close');

    let undoTimeout = null;
    let pendingDeletedEmployee = null;

    function showUndoToast(employeeData, employeeName) {
        if (!undoToast) return;
        pendingDeletedEmployee = employeeData;

        if (undoToastMessage) {
            const displayName = (employeeName || employeeData.name || '').trim() || 'Colaborador';
            undoToastMessage.textContent = `"${displayName}" excluído`;
        }

        if (undoTimeout) {
            clearTimeout(undoTimeout);
        }

        undoToast.classList.add('is-visible');

        undoTimeout = setTimeout(() => {
            hideUndoToast();
        }, 5000);
    }

    function hideUndoToast() {
        if (undoTimeout) {
            clearTimeout(undoTimeout);
            undoTimeout = null;
        }
        if (undoToast) {
            undoToast.classList.remove('is-visible');
        }
        pendingDeletedEmployee = null;
    }

    if (undoToastBtn) {
        undoToastBtn.addEventListener('click', () => {
            if (pendingDeletedEmployee) {
                const dataToRestore = { ...pendingDeletedEmployee };
                hideUndoToast();
                addEmployee(dataToRestore, true);
            }
        });
    }

    if (undoToastClose) {
        undoToastClose.addEventListener('click', () => {
            hideUndoToast();
        });
    }

    const modalManager = new ModalManager();

    // ==========================================
    // 1. Gerenciamento de Tema (Dark / Light Mode)
    // ==========================================
    const THEME_KEY = 'pazCoffeeTheme';
    let activeViewTransition = null;
    let themeTransitionTimeout = null;
    
    function applyTheme(theme) {
        const isDark = theme === 'dark';
        document.documentElement.classList.toggle('dark', isDark);
        try {
            localStorage.setItem(THEME_KEY, theme);
        } catch (err) {
            console.warn('LocalStorage inacessível para salvar tema:', err);
        }

        if (themeToggleBtn) {
            const nextModeLabel = isDark ? 'Mudar para modo claro' : 'Mudar para modo escuro';
            themeToggleBtn.setAttribute('aria-label', nextModeLabel);
            themeToggleBtn.setAttribute('title', nextModeLabel);
        }
    }

    function toggleTheme() {
        const currentIsDark = document.documentElement.classList.contains('dark');
        const nextTheme = currentIsDark ? 'light' : 'dark';
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        // Caso 1: View Transitions API nativa (GPU cross-fade ultra fluido a 60/120Hz sem lag de layout)
        if (!prefersReducedMotion && typeof document.startViewTransition === 'function') {
            try {
                if (activeViewTransition) {
                    activeViewTransition.skipTransition();
                }
            } catch (_) {}

            try {
                activeViewTransition = document.startViewTransition(() => {
                    applyTheme(nextTheme);
                });
                activeViewTransition.finished.finally(() => {
                    activeViewTransition = null;
                });
                return;
            } catch (err) {
                // Fallback caso ocorra algum erro na API do navegador
                applyTheme(nextTheme);
                return;
            }
        }

        // Caso 2: Fallback sincronizado via classe temporária em navegadores legados
        if (!prefersReducedMotion) {
            if (themeTransitionTimeout) {
                clearTimeout(themeTransitionTimeout);
            }
            document.documentElement.classList.add('is-theme-transitioning');
            applyTheme(nextTheme);
            themeTransitionTimeout = setTimeout(() => {
                document.documentElement.classList.remove('is-theme-transitioning');
                themeTransitionTimeout = null;
            }, 280);
            return;
        }

        // Caso 3: Preferência do usuário por redução de movimento (a11y)
        applyTheme(nextTheme);
    }

    function initTheme() {
        let savedTheme = null;
        try {
            savedTheme = localStorage.getItem(THEME_KEY);
        } catch (err) {
            console.warn('Erro ao ler tema salvo:', err);
        }

        // Aplicação inicial síncrona sem disparar animação para prevenir flash de tema
        if (savedTheme) {
            applyTheme(savedTheme);
        } else {
            // Padrão escuro inspirado na cafeteria Paz Coffee Shop
            applyTheme('dark');
        }

        if (themeToggleBtn) {
            themeToggleBtn.addEventListener('click', (e) => {
                e.preventDefault();
                toggleTheme();
            });
        }
    }

    // ==========================================
    // 2. Busca Instantânea de Colaboradores (com A11y e Empty State)
    // ==========================================
    function filterEmployees(query) {
        const term = query.toLowerCase().trim();
        const cards = employeeContainer.querySelectorAll('.employee-card-details');
        let visibleCount = 0;

        cards.forEach(card => {
            const name = (card.querySelector('.employee-name')?.value || '').toLowerCase();
            const matches = !term || name.includes(term);
            card.classList.toggle('hidden', !matches);
            if (matches) visibleCount++;
        });

        // Oculta o card tracejado de adicionar se estiver filtrando por texto
        if (addEmployeeCard) {
            addEmployeeCard.classList.toggle('hidden', term.length > 0);
        }

        if (clearSearchBtn) {
            clearSearchBtn.classList.toggle('hidden', term.length === 0);
        }

        // Feedback de Busca Vazia (Item #13 - WCAG 4.1.3 Status Messages com aria-live)
        if (searchEmptyState) {
            const hasNoResults = term.length > 0 && visibleCount === 0;
            searchEmptyState.classList.toggle('hidden', !hasNoResults);
            if (employeeContainer) {
                employeeContainer.classList.toggle('hidden', hasNoResults);
            }
            if (hasNoResults && searchEmptyTerm) {
                searchEmptyTerm.textContent = `"${query.trim()}"`;
            }
        }
    }

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            filterEmployees(e.target.value);
        });

        // Atalho global rápido (Alt+N para novo colaborador, Ctrl+K ou barra '/' para focar a busca)
        window.addEventListener('keydown', (e) => {
            // Atalho global Alt+N para adicionar colaborador
            if (e.altKey && e.key.toLowerCase() === 'n') {
                e.preventDefault();
                addEmployee({}, true);
                return;
            }

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

    if (searchEmptyClearBtn) {
        searchEmptyClearBtn.addEventListener('click', () => {
            if (searchInput) {
                searchInput.value = '';
                filterEmployees('');
                searchInput.focus();
            }
        });
    }

    // ==========================================
    // 2.1 Alerta Visual de Armazenamento Local (Item #14)
    // ==========================================
    function initStorageNotifications() {
        window.addEventListener('storage-save-error', (e) => {
            const detail = e.detail || {};
            if (storageAlertBanner) {
                if (storageAlertMessage && detail.message) {
                    storageAlertMessage.textContent = detail.message;
                }
                storageAlertBanner.classList.remove('hidden');
            }
        });

        window.addEventListener('storage-save-success', () => {
            if (storageAlertBanner && !storageAlertBanner.classList.contains('hidden')) {
                storageAlertBanner.classList.add('hidden');
            }
        });

        if (storageAlertCloseBtn) {
            storageAlertCloseBtn.addEventListener('click', () => {
                storageAlertBanner?.classList.add('hidden');
            });
        }
    }

    initStorageNotifications();


    // ==========================================
    // 3. Recálculo Individual e Persistência (com Debounce para I/O)
    // ==========================================
    const debouncedSave = debounce((data) => {
        saveStoredEmployees(data);
    }, 250);

    function collectEmployeesData() {
        const employeesData = [];
        const cards = employeeContainer.querySelectorAll('.employee-card-details');
        cards.forEach(card => {
            if (typeof card.getEmployeeData === 'function') {
                employeesData.push(card.getEmployeeData());
            }
        });
        return employeesData;
    }

    function recalculateAndSave(options = false) {
        let immediate = false;
        let sourceCard = null;

        if (typeof options === 'boolean') {
            immediate = options;
        } else if (options && typeof options === 'object') {
            immediate = Boolean(options.immediate);
            sourceCard = options.sourceCard || null;
        }

        // Se a alteração partiu de um card específico, atualiza apenas ele na UI (O(1)).
        // Se for ação estrutural (adicionar, excluir, carga inicial), atualiza todos (O(N)).
        if (sourceCard && typeof sourceCard.updateCalculations === 'function') {
            sourceCard.updateCalculations();
        } else {
            const cards = employeeContainer.querySelectorAll('.employee-card-details');
            cards.forEach(card => {
                if (typeof card.updateCalculations === 'function') {
                    card.updateCalculations();
                }
            });
        }

        const employeesData = collectEmployeesData();

        // Persistência controlada: imediata em ações estruturais, com debounce em digitação contínua
        if (immediate) {
            debouncedSave.cancel();
            saveStoredEmployees(employeesData);
        } else {
            debouncedSave(employeesData);
        }
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
                        employeeName,
                        () => {
                            const isMobile = window.innerWidth < 768;
                            const deletedData = typeof cardElement.getEmployeeData === 'function'
                                ? cardElement.getEmployeeData()
                                : null;

                            // 1. FLIP (First): Armazena as posições dos elementos irmãos antes da exclusão
                            const siblings = Array.from(employeeContainer.children).filter(
                                el => el !== cardElement && (el.classList.contains('kanban-col') || el.id === 'add-employee-card')
                            );
                            const firstPositions = siblings.map(el => {
                                const rect = el.getBoundingClientRect();
                                return { el, left: rect.left, top: rect.top };
                            });

                            // Desativa temporariamente o scroll-snap no mobile para eliminar jitter/conflito
                            if (isMobile) {
                                employeeContainer.style.scrollSnapType = 'none';
                            }

                            // 2. Animação de saída sutil do card excluído
                            cardElement.classList.add('card-animate-delete');

                            let deletionHandled = false;
                            const proceedDeletion = () => {
                                if (deletionHandled) return;
                                deletionHandled = true;

                                // 3. Remove o card do DOM sem executar reflows pesados
                                cardElement.remove();

                                // 4. FLIP (Invert): Mede nova posição e inverte instantaneamente com precisão 3D
                                const movingElements = [];
                                firstPositions.forEach(({ el, left, top }) => {
                                    if (!el.isConnected) return;
                                    const newRect = el.getBoundingClientRect();
                                    const deltaX = left - newRect.left;
                                    // No mobile (esteira horizontal), anula qualquer deltaY espúrio
                                    const deltaY = isMobile ? 0 : (top - newRect.top);

                                    if (Math.abs(deltaX) > 0.5 || Math.abs(deltaY) > 0.5) {
                                        el.style.willChange = 'transform';
                                        el.style.transition = 'none';
                                        el.style.transform = `translate3d(${deltaX}px, ${deltaY}px, 0)`;
                                        movingElements.push(el);
                                    }
                                });

                                // 5. FLIP (Play): No frame seguinte, desliza suavemente até a nova posição
                                requestAnimationFrame(() => {
                                    requestAnimationFrame(() => {
                                        const transitionTiming = isMobile
                                            ? 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                                            : 'transform 0.34s cubic-bezier(0.16, 1, 0.3, 1)';

                                        movingElements.forEach(el => {
                                            el.style.transition = transitionTiming;
                                            el.style.transform = 'translate3d(0, 0, 0)';
                                        });

                                        let cleaned = false;
                                        const cleanup = () => {
                                            if (cleaned) return;
                                            cleaned = true;
                                            movingElements.forEach(el => {
                                                el.style.transition = '';
                                                el.style.transform = '';
                                                el.style.willChange = '';
                                            });
                                            if (isMobile) {
                                                employeeContainer.style.scrollSnapType = '';
                                            }
                                            // Persiste no storage de forma imediata após o término da animação
                                            recalculateAndSave(true);
                                            // Exibe o toast temporário de desfazer exclusão (Undo - 5s)
                                            if (deletedData) {
                                                showUndoToast(deletedData, employeeName);
                                            }
                                        };

                                        if (movingElements.length > 0) {
                                            movingElements[0].addEventListener('transitionend', cleanup, { once: true });
                                            setTimeout(cleanup, isMobile ? 320 : 360);
                                        } else {
                                            cleanup();
                                        }
                                    });
                                });
                            };

                            cardElement.addEventListener('transitionend', proceedDeletion, { once: true });
                            setTimeout(proceedDeletion, isMobile ? 180 : 200);
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
                // Feedback visual animado de entrada suave sincronizado via animationend
                card.classList.add('card-animate-enter');
                const onEnterEnd = () => {
                    card.classList.remove('card-animate-enter');
                    card.removeEventListener('animationend', onEnterEnd);
                };
                card.addEventListener('animationend', onEnterEnd, { once: true });
                setTimeout(onEnterEnd, 450);

                const nameInput = card.querySelector('.employee-name');

                // Desktop: usa scrollIntoView para o grid nativo da página
                // Mobile: rola a esteira horizontal suavemente até o novo card
                requestAnimationFrame(() => {
                    if (window.innerWidth >= 768) {
                        card.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
                        if (nameInput) {
                            nameInput.focus({ preventScroll: true });
                        }
                    } else {
                        employeeContainer.scrollTo({
                            left: card.offsetLeft - 16,
                            behavior: 'smooth'
                        });
                        setTimeout(() => {
                            if (nameInput && document.activeElement !== nameInput) {
                                nameInput.focus({ preventScroll: true });
                            }
                        }, 320);
                    }
                });
            }

            recalculateAndSave(true);
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
            employeeContainer.scrollLeft += delta;
        }

        // Listener vinculado exclusivamente ao container da esteira (elimina disparo duplo por borbulhamento no window)
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
    // 6.1 Header: Sombra Progressiva no Scroll
    // ==========================================
    function setupHeaderScrollShadow() {
        const header = document.querySelector('header');
        if (!header) return;

        let ticking = false;
        const onScroll = () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    header.classList.toggle('is-scrolled', window.scrollY > 8);
                    ticking = false;
                });
                ticking = true;
            }
        };

        window.addEventListener('scroll', onScroll, { passive: true });
        // Initial state
        onScroll();
    }

    // ==========================================
    // 6.2 Staggered Entrance Animation (Initial Load)
    // ==========================================
    function applyStaggeredEntrance() {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReducedMotion) return;

        const cards = employeeContainer.querySelectorAll('.employee-card-details');
        const addCard = document.getElementById('add-employee-card');

        const allItems = [...cards];
        if (addCard) allItems.push(addCard);

        allItems.forEach((card, index) => {
            card.classList.add('card-stagger-enter');
        });

        // Force layout flush then trigger staggered reveal
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                allItems.forEach((card, index) => {
                    const delay = Math.min(index * 60, 300); // cap at 300ms
                    setTimeout(() => {
                        card.classList.add('card-stagger-visible');
                        // Clean up after animation
                        const cleanup = () => {
                            card.classList.remove('card-stagger-enter', 'card-stagger-visible');
                            card.removeEventListener('transitionend', cleanup);
                        };
                        card.addEventListener('transitionend', cleanup, { once: true });
                        setTimeout(cleanup, 500);
                    }, delay);
                });
            });
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
        setupHeaderScrollShadow();

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

        recalculateAndSave(true);

        // Staggered entrance animation: each card fades in sequentially
        applyStaggeredEntrance();

        // Sempre posiciona no topo e no primeiro colaborador (x=0, y=0) ao iniciar
        resetScrollPosition();
        requestAnimationFrame(resetScrollPosition);
    }

    init();

    window.addEventListener('load', resetScrollPosition, { once: true });
    window.addEventListener('pageshow', resetScrollPosition);
    window.addEventListener('beforeunload', () => {
        debouncedSave.flush();
    });
});
