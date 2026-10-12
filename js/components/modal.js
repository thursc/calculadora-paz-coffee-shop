/**
 * Gerenciamento dos modais da aplicação (Holerite e Confirmação de Exclusão)
 * Inclui Focus Trap acessível (WCAG 2.1 AA) e Focus Restoration para tecnologias assistivas
 */

import { copyTextToClipboard } from '../utils/clipboard.js';

const FOCUSABLE_SELECTOR = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export class ModalManager {
    constructor() {
        this.holeriteModal = document.getElementById('holerite-modal');
        this.deleteConfirmModal = document.getElementById('delete-confirm-modal');
        this.holeriteTextarea = document.getElementById('holerite-text');
        this.copyHoleriteBtn = document.getElementById('copy-holerite-btn');
        this.sendWhatsappBtn = document.getElementById('send-whatsapp-btn');
        this.deleteConfirmText = document.getElementById('delete-confirm-text');
        this.confirmDeleteBtn = document.getElementById('confirm-delete-btn');

        this.copyBtnText = this.copyHoleriteBtn?.querySelector('.copy-btn-text');
        this.copyTimeout = null;

        this.onConfirmDeleteCallback = null;
        this.lastFocusedElement = null;
        this.activeModal = null;

        this.init();
    }

    init() {
        // Fechamento ao clicar em botões de fechar ou no overlay escuro
        document.querySelectorAll('.modal-close-btn, .modal-overlay').forEach(el => {
            el.addEventListener('click', () => {
                this.closeAll();
            });
        });

        // Fechamento com a tecla Escape e Focus Trap para a tecla Tab
        document.addEventListener('keydown', (e) => {
            this.handleKeyDown(e);
        });

        // Copiar holerite com API moderna e feedback visual sem destruir a árvore SVG
        if (this.copyHoleriteBtn) {
            this.copyHoleriteBtn.addEventListener('click', async () => {
                const text = this.holeriteTextarea?.value || '';
                const copied = await copyTextToClipboard(text, this.holeriteTextarea);

                if (copied) {
                    if (this.copyTimeout) clearTimeout(this.copyTimeout);

                    if (this.copyBtnText) {
                        this.copyBtnText.textContent = 'Copiado!';
                    }
                    this.copyHoleriteBtn.classList.add('is-copied');

                    this.copyTimeout = setTimeout(() => {
                        if (this.copyBtnText) {
                            this.copyBtnText.textContent = 'Copiar Texto';
                        }
                        this.copyHoleriteBtn.classList.remove('is-copied');
                        this.copyTimeout = null;
                    }, 2000);
                }
            });
        }

        // Disparo direto de mensagem pré-formatada para o WhatsApp
        if (this.sendWhatsappBtn) {
            this.sendWhatsappBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const text = this.holeriteTextarea?.value || '';
                if (!text) return;
                const encodedText = encodeURIComponent(text);
                window.open(`https://api.whatsapp.com/send?text=${encodedText}`, '_blank', 'noopener,noreferrer');
            });
        }

        // Confirmação de exclusão
        if (this.confirmDeleteBtn) {
            this.confirmDeleteBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const callback = this.onConfirmDeleteCallback;
                this.close(this.deleteConfirmModal);
                if (typeof callback === 'function') {
                    // Executa a saída no próximo frame para que a resposta do clique e fechamento do modal seja 100% instantânea
                    requestAnimationFrame(() => {
                        callback();
                    });
                }
            });
        }
    }

    handleKeyDown(e) {
        if (!this.activeModal) return;

        if (e.key === 'Escape') {
            e.preventDefault();
            this.closeAll();
            return;
        }

        if (e.key === 'Tab') {
            this.trapFocus(e);
        }
    }

    trapFocus(e) {
        const modal = this.activeModal;
        if (!modal) return;

        const focusables = Array.from(modal.querySelectorAll(FOCUSABLE_SELECTOR)).filter(
            el => el.offsetParent !== null || el.getClientRects().length > 0
        );

        if (focusables.length === 0) {
            e.preventDefault();
            return;
        }

        const firstElement = focusables[0];
        const lastElement = focusables[focusables.length - 1];

        if (e.shiftKey) {
            if (document.activeElement === firstElement || !modal.contains(document.activeElement)) {
                e.preventDefault();
                lastElement.focus();
            }
        } else {
            if (document.activeElement === lastElement || !modal.contains(document.activeElement)) {
                e.preventDefault();
                firstElement.focus();
            }
        }
    }

    open(modal, initialFocusElement = null) {
        if (!modal) return;
        this.lastFocusedElement = document.activeElement;
        this.activeModal = modal;

        // Aplica overflow-hidden apenas para modais com rolagem extensa (holerite),
        // evitando forçar recálculo global de layout (reflow) da página no modal de exclusão
        if (modal === this.holeriteModal) {
            document.body.classList.add('overflow-hidden');
        }
        modal.classList.remove('pointer-events-none', 'opacity-0');
        modal.setAttribute('aria-hidden', 'false');

        // Mover foco para o elemento inicial ou primeiro focalizável dentro do modal
        requestAnimationFrame(() => {
            if (initialFocusElement && typeof initialFocusElement.focus === 'function') {
                initialFocusElement.focus();
            } else {
                const firstFocusable = modal.querySelector(FOCUSABLE_SELECTOR);
                if (firstFocusable && typeof firstFocusable.focus === 'function') {
                    firstFocusable.focus();
                }
            }
        });
    }

    close(modal) {
        if (!modal) return;
        modal.classList.add('pointer-events-none', 'opacity-0');
        modal.setAttribute('aria-hidden', 'true');

        if (this.activeModal === modal) {
            this.activeModal = null;
        }

        if (modal === this.holeriteModal || (this.holeriteModal?.classList.contains('opacity-0') && this.deleteConfirmModal?.classList.contains('opacity-0'))) {
            document.body.classList.remove('overflow-hidden');
        }

        // Restaura o foco para o elemento que disparou a abertura do modal
        if (this.lastFocusedElement && typeof this.lastFocusedElement.focus === 'function') {
            this.lastFocusedElement.focus();
        }
        this.lastFocusedElement = null;
    }

    closeAll() {
        this.close(this.holeriteModal);
        this.close(this.deleteConfirmModal);
        this.activeModal = null;
        this.onConfirmDeleteCallback = null;
    }

    openHolerite(text) {
        if (this.holeriteTextarea) {
            this.holeriteTextarea.value = text;
        }
        if (this.copyTimeout) {
            clearTimeout(this.copyTimeout);
            this.copyTimeout = null;
        }
        if (this.copyBtnText) {
            this.copyBtnText.textContent = 'Copiar Texto';
        }
        if (this.copyHoleriteBtn) {
            this.copyHoleriteBtn.classList.remove('is-copied');
        }
        this.open(this.holeriteModal, this.copyHoleriteBtn);
    }

    openDeleteConfirm(employeeName, onConfirm) {
        if (this.deleteConfirmText) {
            const name = (employeeName || '').trim() || 'este colaborador';
            this.deleteConfirmText.innerHTML = `Tem certeza que deseja excluir <strong class="font-bold text-stone-900 dark:text-stone-50 bg-amber-500/10 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/20">${name}</strong>? Todos os turnos e adicionais desta escala serão removidos.`;
        }
        this.onConfirmDeleteCallback = onConfirm;
        const cancelBtn = this.deleteConfirmModal?.querySelector('.modal-close-btn');
        this.open(this.deleteConfirmModal, cancelBtn);
    }
}

