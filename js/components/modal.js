/**
 * Gerenciamento dos modais da aplicação (Holerite e Confirmação de Exclusão)
 */

import { copyTextToClipboard } from '../utils/clipboard.js';

export class ModalManager {
    constructor() {
        this.holeriteModal = document.getElementById('holerite-modal');
        this.deleteConfirmModal = document.getElementById('delete-confirm-modal');
        this.holeriteTextarea = document.getElementById('holerite-text');
        this.copyHoleriteBtn = document.getElementById('copy-holerite-btn');
        this.deleteConfirmText = document.getElementById('delete-confirm-text');
        this.confirmDeleteBtn = document.getElementById('confirm-delete-btn');

        this.onConfirmDeleteCallback = null;

        this.init();
    }

    init() {
        // Fechamento ao clicar em botões de fechar ou no overlay escuro
        document.querySelectorAll('.modal-close-btn, .modal-overlay').forEach(el => {
            el.addEventListener('click', () => {
                this.closeAll();
            });
        });

        // Fechamento com a tecla Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAll();
            }
        });

        // Copiar holerite com API moderna e feedback visual
        if (this.copyHoleriteBtn) {
            this.copyHoleriteBtn.addEventListener('click', async () => {
                const text = this.holeriteTextarea.value;
                const copied = await copyTextToClipboard(text, this.holeriteTextarea);

                if (copied) {
                    const originalText = this.copyHoleriteBtn.textContent;
                    this.copyHoleriteBtn.textContent = 'Copiado!';
                    this.copyHoleriteBtn.classList.remove('bg-blue-500', 'hover:bg-blue-700');
                    this.copyHoleriteBtn.classList.add('bg-green-500', 'hover:bg-green-600');

                    setTimeout(() => {
                        this.copyHoleriteBtn.textContent = originalText;
                        this.copyHoleriteBtn.classList.remove('bg-green-500', 'hover:bg-green-600');
                        this.copyHoleriteBtn.classList.add('bg-blue-500', 'hover:bg-blue-700');
                    }, 2000);
                }
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

    open(modal) {
        if (!modal) return;
        // Aplica overflow-hidden apenas para modais com rolagem extensa (holerite),
        // evitando forçar recálculo global de layout (reflow) da página no modal de exclusão
        if (modal === this.holeriteModal) {
            document.body.classList.add('overflow-hidden');
        }
        modal.classList.remove('pointer-events-none', 'opacity-0');
        modal.setAttribute('aria-hidden', 'false');
    }

    close(modal) {
        if (!modal) return;
        modal.classList.add('pointer-events-none', 'opacity-0');
        modal.setAttribute('aria-hidden', 'true');
        if (modal === this.holeriteModal || (this.holeriteModal?.classList.contains('opacity-0') && this.deleteConfirmModal?.classList.contains('opacity-0'))) {
            document.body.classList.remove('overflow-hidden');
        }
    }

    closeAll() {
        this.close(this.holeriteModal);
        this.close(this.deleteConfirmModal);
        document.body.classList.remove('overflow-hidden');
        this.onConfirmDeleteCallback = null;
    }

    openHolerite(text) {
        if (this.holeriteTextarea) {
            this.holeriteTextarea.value = text;
        }
        if (this.copyHoleriteBtn) {
            this.copyHoleriteBtn.textContent = 'Copiar Texto';
            this.copyHoleriteBtn.classList.remove('bg-green-500', 'hover:bg-green-600');
            this.copyHoleriteBtn.classList.add('bg-blue-500', 'hover:bg-blue-700');
        }
        this.open(this.holeriteModal);
    }

    openDeleteConfirm(message, onConfirm) {
        if (this.deleteConfirmText) {
            this.deleteConfirmText.textContent = message;
        }
        this.onConfirmDeleteCallback = onConfirm;
        this.open(this.deleteConfirmModal);
    }
}
