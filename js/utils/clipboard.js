/**
 * Utilitário moderno para cópia de texto para a Área de Transferência
 */

export async function copyTextToClipboard(text, fallbackElement = null) {
    if (!text) return false;

    // Tenta primeiro a API moderna Clipboard (funciona em HTTPS e navegadores recentes)
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (err) {
            console.warn('Falha no navigator.clipboard, tentando fallback...', err);
        }
    }

    // Fallback gracioso com seleção de textarea
    try {
        let textarea = fallbackElement;
        let createdTemporary = false;

        if (!textarea) {
            textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            textarea.style.pointerEvents = 'none';
            document.body.appendChild(textarea);
            createdTemporary = true;
        }

        textarea.focus();
        textarea.select();
        const successful = document.execCommand('copy');

        if (createdTemporary && textarea.parentNode) {
            textarea.parentNode.removeChild(textarea);
        }

        return successful;
    } catch (err) {
        console.error('Falha ao copiar texto:', err);
        return false;
    }
}
