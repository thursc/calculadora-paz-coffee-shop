# Notas de Atualização (Patch Notes)

Todas as alterações notáveis deste projeto serão documentadas neste arquivo.

---

## [v1.1.0] - 12/10/2026

### 🚀 Refatoração Modular e Otimização para Mobile

Esta atualização reorganizou a arquitetura interna da aplicação, transformando o arquivo monolítico original em uma estrutura modular baseada em **ES Modules**, sem quebrar a compatibilidade com os dados já salvos no celular e mantendo o carregamento 100% estático no **GitHub Pages**.

---

### 📂 Nova Estrutura do Projeto
- **`assets/logo.svg`**: Extração do logotipo vetorial para arquivo dedicado, limpando mais de 80 linhas de coordenadas do HTML principal.
- **`css/styles.css`**: Isolamento de todas as regras de animações, scrollbars personalizadas e comportamentos de sanfona (accordion).
- **`js/config.js`**: Centralização de constantes de negócio (turnos da semana, valor da dobradinha e chave de armazenamento).
- **`js/utils/`**:
  - `currency.js`: Parsing e formatação segura de moeda brasileira (BRL).
  - `clipboard.js`: Integração com a API moderna assíncrona `navigator.clipboard.writeText` com fallback resiliente para cópia no mobile.
- **`js/services/`**:
  - `calculator.js`: Regras de cálculo puras desacopladas do DOM (turnos, adicionais por hora/fixo, bônus de dobradinha).
  - `holerite.js`: Montagem e formatação do texto de demonstrativo para envio via WhatsApp.
- **`js/state/`**:
  - `storage.js`: Gerenciamento de leitura e gravação no `localStorage`, garantindo total retrocompatibilidade com a chave `pazCoffeeCalculatorData`.
- **`js/components/`**:
  - `employeeCard.js`: Componente isolado para o cartão do funcionário e seus turnos.
  - `eventItem.js`: Componente de adicionais/eventos com suporte a trava de reset.
  - `modal.js`: Gerenciamento acessível dos modais de demonstrativo e confirmação de exclusão (com suporte a tecla `Escape`).
- **`js/app.js`**: Ponto de entrada e orquestrador principal da aplicação.

---

### ✨ Melhorias e Correções
- **Performance Mobile**: `index.html` reduzido de **939 linhas** para **~120 linhas**, proporcionando leitura muito mais rápida e menor pegada de memória em aparelhos móveis (como o Poco X7 Pro).
- **Substituição de API Depreciada**: O botão "Copiar Texto" agora utiliza `navigator.clipboard.writeText` em vez de `document.execCommand('copy')`.
- **Validação e Acessibilidade**:
  - Inputs numéricos com trava para valores negativos (`min="0"`).
  - Modais com atributos de acessibilidade (`role="dialog"`, `aria-modal="true"`) e fechamento via teclado.
  - Ícones e botões de ação com atributos `aria-label` adequados.
- **Cálculo Puro e Testável**: Lógica financeira totalmente desacoplada de elementos HTML, testada com suíte automatizada.

---

## [v1.0.0] - Versão Inicial
- Calculadora de turnos e custos semanais para a cafeteria Paz Coffee Shop.
- Suporte a turnos (Sábado, Dom. Manhã, Dom. Noite, Segunda-feira).
- Bônus automático de dobradinha para trabalho integral aos domingos.
- Adicionais/Eventos com valor fixo ou por taxa/hora.
- Geração de demonstrativo de pagamento formatado para envio à equipe.
- Persistência local no navegador via `localStorage`.
