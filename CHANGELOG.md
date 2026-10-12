# Notas de Atualização (Patch Notes)

Todas as alterações notáveis deste projeto serão documentadas neste arquivo.

---

## [v1.2.8] - 12/10/2026

### ✨ Animações Fluidas e Leves para Adicionar e Excluir Colaboradores
- **Animação de Adição de Colaborador (`card-animate-enter`)**:
  - Ao adicionar um novo colaborador, o card surge com uma animação de escala e elevação (`0.32s cubic-bezier`), acompanhada de um destaque luminoso âmbar que chama a atenção do usuário.
  - A esteira Kanban rola horizontalmente de forma suave até o novo card criado e coloca o cursor no campo de nome sem alterar a rolagem vertical da página.
- **Animação de Exclusão com Deslizamento dos Cards Vizinhos (`card-animate-delete`)**:
  - Ao confirmar a exclusão no modal, o card desaparece suavemente reduzindo escala, opacidade e largura ao longo de 280ms.
  - O espaço ocupado pelo card é contraído de forma contínua, fazendo com que os outros cards da esteira deslizem fluidamente para a esquerda para preencher o vazio antes da remoção definitiva do DOM.
- **Micro-animações em Adicionais/Eventos**:
  - Novos eventos entram com transição de opacidade e subida (`event-item-animate-enter`).
  - Remoção de adicionais executa fade-out e escala suave antes de sair do DOM.
- **Cache-Busting**:
  - Versão dos assets elevada para `v=1.2.9`.

---

## [v1.2.7] - 12/10/2026

### 🖱️ Fluidez Total no Scroll do Mouse, Ancoragem em (x=0, y=0) e Novo Card Compacto
- **Scroll do Mouse Horizontal Buttery-Smooth no Desktop**:
  - Eliminado o travamento na roda do mouse: adicionada normalização universal de `deltaMode` (no Firefox/Windows, cada notch emitia apenas 3px de scroll em modo linhas, tornando a esteira quase estática; agora é escalonado em pixels reais proporcionais).
  - Desativado o `scroll-snap-type` em resoluções desktop (`min-width: 768px`) em [styles.css](file:///d:/dev/calculadora-paz-coffee-shop/css/styles.css), impedindo que o motor de snap dispute com a rolagem do mouse e cause estalos ou paradas bruscas.
  - Multiplicador de fluidez calibrado (1.35x) com captura ativa no container e na janela.
- **Ancoragem Fiel no Topo e Início da Página (x=0, y=0)**:
  - Eliminada a rolagem vertical indesejada gerada anteriormente por `scrollIntoView`, que ocultava o cabeçalho e a barra de busca.
  - Criado `resetScrollPosition()` com garantia de `window.scrollTo(0, 0)`, `scrollTop = 0` e `employeeContainer.scrollLeft = 0` na inicialização e recarregamento da página.
- **Card Recolhido com Resumo Financeiro Completo (Conforme Mockup)**:
  - Reestruturado o template do colaborador: o rodapé com **Total a Pagar**, botão **"Gerar Holerite"** e link **"Ver cálculo detalhado"** agora permanece **sempre visível**, tanto no card aberto quanto fechado.
  - Ao recolher o card, a Taxa Horária, Turnos Trabalhados, Dobradinha e Adicionais/Eventos são suavemente recolhidos sem ocupar espaço.
  - Visual minimalista e contínuo no modo recolhido, com bordas divisórias aplicadas apenas quando expandido.
- **Cache-Busting**:
  - Versão dos assets elevada para `v=1.2.8`.

---

## [v1.2.6] - 12/10/2026

### 🖱️ Navegação Horizontal Desktop, Início no Primeiro Colaborador e Taxa Padrão de R$ 20,00
- **Scroll do Mouse e Teclas de Seta Horizontais no Desktop**:
  - A roda do mouse (`wheel`) agora translada o scroll vertical para a esteira horizontal de colaboradores, proporcionando navegação fluida e natural no desktop.
  - O scroll vertical nativo é mantido intacto dentro dos modais de Holerite e Confirmação.
  - Adicionado suporte às teclas de seta (`ArrowLeft` e `ArrowRight`) para avançar e retroceder cards na esteira (passo de 360px), além das teclas `Home` (início) e `End` (fim).
  - Preserva a digitação em inputs, textareas e seletores de formulário sem capturar as setas.
  - Ajustado `scroll-snap-type: x proximity` em telas maiores que 640px para evitar travamentos ou estalos bruscos durante a rolagem contínua com a roda do mouse.
- **Início Sempre Focado no Primeiro Colaborador (Extrema Esquerda)**:
  - Desativada a restauração automática de scroll do histórico do navegador (`history.scrollRestoration = 'manual'`).
  - Implementado `scrollToFirstEmployee()`, garantindo que ao abrir ou recarregar a página a visualização comece sempre no primeiro funcionário à esquerda (posição 0).
- **Atualização da Taxa Horária Padrão para R$ 20,00**:
  - Constante `DEFAULT_HOURLY_RATE` alterada de `R$ 15,00` para `R$ 20,00` em [config.js](file:///d:/dev/calculadora-paz-coffee-shop/js/config.js).
  - Atualizado o valor padrão no template HTML em [index.html](file:///d:/dev/calculadora-paz-coffee-shop/index.html) e em [employeeCard.js](file:///d:/dev/calculadora-paz-coffee-shop/js/components/employeeCard.js).
  - Adicionada rotina de migração em [storage.js](file:///d:/dev/calculadora-paz-coffee-shop/js/state/storage.js) para atualizar colaboradores salvos no localStorage com o padrão antigo de R$ 15,00 para o novo valor de R$ 20,00.
- **Cache-Busting**:
  - Versão dos assets elevada para `v=1.2.7`.

---

## [v1.2.5] - 12/10/2026

### 📱 Centralização Definitiva do Modal e Bloqueio de Zoom Out no Mobile
- **Centralização do Modal de Holerite em Qualquer Posição da Lista**:
  - Resolvido o erro em que clicar em colaboradores no final da lista horizontal fazia a janela modal surgir fora da tela (à esquerda).
  - Travado o scroll horizontal em nível de documento (`html`, `body` e `<main>` limitados a `width: 100%`, `max-width: 100vw`, `overflow-x: hidden`), garantindo que apenas a trilha de colaboradores (`.kanban-track`) faça scroll horizontal.
  - Fixação do modal com `position: fixed !important`, cobrindo exatamente `100dvh` e `100vw` centralizado na viewport visível do dispositivo.
  - Bloqueio dinâmico do scroll da página (`body.overflow-hidden`) enquanto o modal estiver aberto, restaurando a rolagem suave ao fechar.
- **Prevenção de Quebra por Zoom Out Acidental**:
  - Viewport travada com `maximum-scale=1.0, user-scalable=no`, impedindo que gestos de pinça quebrem a proporção da tela ou tornem o layout estreito e inutilizável.
- **Renomeação de Interface**:
  - Botão principal do card atualizado de *"Gerar Demonstrativo"* para **"Gerar Holerite"**.
  - Título da janela atualizado para **"Holerite de Pagamento"**.
- **Cache-Busting**:
  - Versão dos assets atualizada para `v=1.2.6`.

---

## [v1.2.4] - 12/10/2026

### 📐 Alinhamento Vertical Homogêneo no Detalhamento de Cálculos
- **Eliminação do Espaço Vazio Superior nos Cálculos Detalhados**:
  - Substituído `space-y-2` por `flex flex-col gap-2` em `.details-content` no [index.html](file:///d:/dev/calculadora-paz-coffee-shop/index.html). O seletor `space-y` aplicava margem superior incorreta no primeiro bloco visível quando os blocos anteriores estavam com `display: none`.
  - Igualada a altura inicial dos textos de detalhamento (*"Turnos:"*, *"Adicionais:"*, *"Bônus:"*) com a mensagem de estado vazio (*"Nenhum turno ou adicional marcado nesta semana."*).
  - Adicionado reset preventivo de `margin-top: 0 !important` em [styles.css](file:///d:/dev/calculadora-paz-coffee-shop/css/styles.css) para o primeiro elemento visível do container.
- **Cache-Busting**:
  - Assets atualizados para `v=1.2.5`.

---

## [v1.2.3] - 12/10/2026

### 🛠️ Correção da Taxa Específica nos Adicionais
- **Eliminação da Expansão e Sobreposição do Input de Taxa**:
  - Corrigida a classe de largura da taxa específica: substituído `w-18` (que não existe na escala padrão do Tailwind e fazia o input expandir para o tamanho nativo do HTML de ~180px) por `w-[76px] flex-shrink-0`.
  - Ajustado o campo de horas da taxa específica para `w-12` (48px), liberando mais de 50px de espaço livre antes do subtotal (`= R$ XX,XX`).
  - Garantido que nenhum campo sofra encolhimento ou colisão lateral em nenhuma resolução ou navegador.
- **Cache-Busting**:
  - Assets atualizados para `v=1.2.4`.

---

## [v1.2.2] - 12/10/2026

### 📐 Estruturação Robusta dos Adicionais / Eventos (Eliminação de Overflow)
- **Layout em 3 Linhas Funcionais**:
  - **Linha 1**: Checkbox de ativação + Nome do adicional + Botões de Trava/Exclusão.
  - **Linha 2**: Seletor de Tipo de Cálculo em largura total (`w-full`), exibindo os nomes completos das regras sem cortes nem colisão horizontal.
  - **Linha 3**: Entradas numéricas (Horas / Valor Fixo / Taxa) à esquerda e subtotal calculado (`= R$ XX,XX`) perfeitamente posicionado à direita.
- **Eliminação Definitiva de Estouro Lateral**:
  - Resolução dos erros onde inputs de taxa específica (`@ R$ ...`) e valores fixos saíam do container ou sobrepunham o sinal de igualdade (`=`).
  - Totalmente adaptado para colunas Kanban estreitas (mobile e desktop) com suporte flexível.
- **Cache-Busting**:
  - Assets atualizados para `v=1.2.3`.

---

## [v1.2.1] - 12/10/2026

### 🛠️ Refinamento de Legibilidade e Escala Visual nos Cards
- **Legibilidade Total dos Turnos**:
  - Reorganização dos turnos trabalhados em lista vertical de largura total (`space-y-2`), eliminando completamente o truncamento de texto ("Dom. ...", "Segun...").
  - Nomeação clara e sem ambiguidades: **Sábado**, **Domingo (Manhã)**, **Domingo (Noite)** e **Segunda-feira**.
- **Unificação de Proporção e Escala Visual (Chrome e Firefox Mobile)**:
  - Removido override global de `16px !important` em inputs/selects mobile que inflava desproporcionalmente os controles nativos no Chrome Android.
  - Reset unificado de estilização para `<select>` com chevron SVG e dimensões controladas em todos os navegadores.
  - Estruturação compacta e inline dos Adicionais / Eventos, mantendo seletor de tipo, valor e total em linha única sem quebras verticais excessivas.
- **Detalhamento de Cálculo com Estado Vazio Tratado**:
  - Adicionada mensagem amigável (*"Nenhum turno ou adicional marcado nesta semana."*) ao expandir a seção "Ver cálculo detalhado" sem itens selecionados, evitando exibir caixas em branco.
- **Cache-Busting de Assets**:
  - Adicionados sufixos de versão nos links de CSS e scripts para garantir carregamento instantâneo das últimas melhorias no mobile sem depender de limpeza de cache manual.

---

## [v1.2.0] - 12/10/2026

### ☕ Redesign Operacional Focado em Freelancers (Paz Coffee Shop)

Esta versão reformulou integralmente a interface visual e o fluxo de uso da calculadora, adaptando-a com exatidão à rotina real de pagamento de freelancers da cafeteria: **cálculo individual ágil, busca instantânea e geração imediata de demonstrativo para WhatsApp**.

---

### 🎨 Principais Mudanças Visuais e Estruturais

1. **Cabeçalho Ultra-Compacto e Limpo**:
   - Marca **"Paz Coffee Shop"** sempre por extenso em linha única (`whitespace-nowrap`), ao lado do logotipo vetorial da cafeteria.
   - Remoção de textos secundários e indicadores desnecessários que poluíam o topo da tela no celular.
   - Apenas duas ações essenciais no topo: **Alternância de Tema (Modo Escuro/Claro)** e **Adicionar Colaborador**.

2. **Busca Instantânea de Colaboradores**:
   - Campo de pesquisa inteligente integrado no topo da esteira (`🔍 Buscar colaborador...`).
   - Filtro instantâneo em tempo real conforme a digitação, facilitando localizar qualquer freelancer entre os ~10 templates salvos.
   - Botão rápido para limpar o filtro com um toque.

3. **Layout Horizontal em Colunas (Esteira Kanban)**:
   - Cards dos freelancers dispostos lado a lado com rolagem horizontal suave e snap tátil (`310px` a `360px`).
   - Cada card funciona como um **template independente e permanente**: os turnos padrão ficam salvos e a mãe apenas ajusta as horas ou desmarca quem não trabalhou.
   - Card tracejado de ação rápida no final da fila para cadastrar novos colaboradores no banco.

4. **Foco 100% no Pagamento Individual**:
   - Eliminação de métricas e KPIs consolidados ("Total da semana", "Projeção mensal", etc.), mantendo a tela despoluída e centrada no valor individual a ser enviado a cada colaborador.
   - Destaque em tipografia nobre para o **Total a Pagar Individual** e botão largo para **Gerar Demonstrativo**.

5. **Design Tátil com Chips Interativos (Toggle Pills)**:
   - Substituição de caixas de seleção tradicionais por pílulas táteis em tom âmbar/caramelo para alternância rápida de turnos.
   - Pílula dedicada para a **Dobradinha Domingo** (+R$ 50,00) com trava inteligente.
   - Campos de adicionais/eventos compactos e harmoniosos.

6. **Padronização Tipográfica Rigorosa**:
   - Toda a aplicação foi unificada sob a família tipográfica **Inter** com hierarquia visual consistente de pesos e contrastes.

---

## [v1.1.0] - 12/10/2026

### 🚀 Refatoração Modular e Otimização para Mobile
- Separação da arquitetura em ES Modules (`js/services/`, `js/components/`, `js/utils/`, `js/state/`).
- Extração de `assets/logo.svg` e `css/styles.css`.
- Preservação total da compatibilidade com os dados do `localStorage` (`pazCoffeeCalculatorData`).
- Substituição de `execCommand` por `navigator.clipboard.writeText`.

---

## [v1.0.0] - Versão Inicial
- Calculadora de turnos e custos semanais para a cafeteria Paz Coffee Shop.
- Suporte a turnos (Sábado, Dom. Manhã, Dom. Noite, Segunda-feira).
- Bônus automático de dobradinha para trabalho integral aos domingos.
- Adicionais/Eventos com valor fixo ou por taxa/hora.
- Geração de demonstrativo de pagamento formatado para envio à equipe.
- Persistência local no navegador via `localStorage`.
