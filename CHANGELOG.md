# Notas de Atualização (Patch Notes)

Todas as alterações notáveis deste projeto serão documentadas neste arquivo.

## [v1.8.0] - 12/10/2026

### 🚀 Otimização Extrema de Fluidez para Displays de Alta Taxa de Atualização (120Hz, 144Hz, 240Hz, 320Hz+)

#### 1. Aceleração por Hardware 3D e Promoção de Camadas no Compositor da GPU
- **Eliminação de Jitter de Sub-Pixel:** Todas as transformações que utilizavam primitivas 2D (`translate`, `scale`, `rotate`) foram migradas para primitivas 3D (`translate3d(x, y, 0)`, `scale3d(x, y, 1)`, `rotate3d(0, 0, 1, deg)`). Isso força os motores de renderização a manter interpolação com precisão de ponto flutuante na GPU em cada intervalo de quadro (8.33ms em 120Hz, 4.16ms em 240Hz, ~3.12ms em 320Hz), sem arredondamentos discretos de pixels.
- **Isolamento de Camadas (Composite Layer Promotion):** Aplicado `transform: translateZ(0)` e `backface-visibility: hidden` nos componentes interativos (`.employee-card-details`, `.shift-pill`, `.dobradinha-pill`, `.event-item`, `.reset-btn`, `.modal-container`). Animações de clique ou hover agora redesenham exclusivamente sua própria textura de GPU sem disparar repaints nas árvores DOM vizinhas.

#### 2. Curvas Bézier Cinemáticas Contínuas (Liquid Motion)
- **Substituição de Curvas Abruptas:** Substituídas curvas com desaceleração seca ou `ease` genérico por curvas cúbicas cinemáticas de alta continuidade (`cubic-bezier(0.16, 1, 0.3, 1)` e `cubic-bezier(0.22, 1, 0.36, 1)`), características de interfaces flagship de alto refresh rate (como Apple ProMotion).
- **Remoção de `transition: all`:** Pílulas de turnos e dobradinha tiveram `transition: all` substituído por declarações estritas de propriedades (`background`, `border-color`, `box-shadow`, `transform`), eliminando o recálculo redundante de estilos computados em cada sub-frame.

#### 3. Sincronização Precisa com o V-Sync do Monitor (`transitionend` e `animationend`)
- **Fim do Descompasso por `setTimeout`:** Nas transições FLIP de reorganização de cards, na exclusão de colaboradores, na remoção de adicionais e no flash de reset, o ciclo de vida agora é controlado pelos eventos nativos `transitionend` e `animationend` (com fallback de segurança). Isso garante que o término da animação ocorra exatamente no ciclo de V-Sync do display, eliminando qualquer micro-stuttering no frame final.

#### 4. Otimização de Renderização de Tipografia e Acessibilidade
- **Antialiasing Sub-Pixel Estável:** Adicionado `-webkit-font-smoothing: antialiased` e `text-rendering: optimizeLegibility` globalmente, impedindo cintilações (text shimmer) durante animações de escala.
- **Suporte a `prefers-reduced-motion`:** Usuários com preferências de redução de movimento recebem resposta instantânea sem transições desnecessárias.

---

## [v1.7.0] - 12/10/2026

### 🎨 Padronização Visual de Eventos Adicionais e Feedback Tátil no Reset (Opção B)

#### 1. Padronização Visual e Desacoplamento de Estados em Eventos/Adicionais
- **Espelhamento Fiel das Pílulas de Turnos Ativos:** O estado ativado (`.event-item.is-active`) agora espelha exatamente a identidade visual das pílulas de turnos (`.shift-pill.is-active`), recebendo borda âmbar (`var(--accent-amber)`), gradiente de fundo quente e anel com sombra de realce âmbar (`var(--accent-amber-glow)`).
- **Desacoplamento Completo da Fixação ("Manter ao Resetar"):**
  - O estado de fixação (`is-locked`) foi totalmente desacoplado da ativação de cálculo. Um item fixado porém desativado **não** recebe mais gradiente ou contorno âmbar no card, eliminando qualquer ambiguidade de que estaria somando no total.
  - **Badge "Fixado" Inteligente:**
    - Quando o item está **desativado e fixado**: o badge exibe estilo neutro e discreto (`stone-500/stone-600`), com botão de cadeado neutro, deixando 100% evidente que o evento está protegido contra o reset, mas não está ativo no holerite.
    - Quando o item está **ativado e fixado**: o badge harmoniza em tom âmbar brilhante com o restante do card ativo.
- **Matriz 2×2 de Estados Consistente:** Todas as 4 combinações (Desativado/Livre, Ativado/Livre, Desativado/Fixado e Ativado/Fixado) possuem representação visual intuitiva e sem ruídos.
- **Opacidade Dinâmica e Subtotal Suave:** Itens inativos operam com opacidade sutil (0.72) e subtotal esmaecido, enquanto itens ativos têm opacidade plena (1.0).

#### 2. Microinteração do Botão "Resetar Turnos e Eventos" (Opção B - High Contrast Flash + Snap Spin)
- **High Contrast Flash:** Ao clicar em resetar, o botão dispara um flash sólido em âmbar vibrante (`#f59e0b`), invertendo o ícone para preto café de alto contraste (`#1c1917`), acompanhado por um pulso com anel expansivo de luz (`box-shadow`), dissipando suavemente de volta ao repouso.
- **Snap Spin Anti-Horário:** O ícone SVG executa uma rotação anti-horária ágil com efeito de snap elástico (`rotate(0deg) → -220deg → -370deg → -360deg` com easing `cubic-bezier(0.25, 1, 0.5, 1)`), transmitindo a sensação tátil de mola rebobinada.
- **Prevenção de Cliques Múltiplos:** `pointer-events: none` aplicado durante o ciclo da animação para evitar acionamentos concorrentes.

---

## [v1.6.0] - 12/10/2026

### ⚡ Otimização de Performance, Animação Responsiva e Consistência Visual nos Eventos Adicionais

#### 1. Performance e Eliminação de Engasgo na Exclusão
- **Eliminação de Reflow na Abertura do Modal:** Removida a alternância de `overflow-hidden` no `body` ao abrir o modal de confirmação de exclusão (que forçava reflow global sincrônico da página inteira devido ao desaparecimento da barra de rolagem).
- **Overlay Otimizado por GPU:** Removido o filtro pesado de `backdrop-blur` no overlay de confirmação em favor de overlay com aceleração de hardware e animação de escala instantânea (`scale(0.96) → 1` em 0.15s), eliminando qualquer engasgo quando a janela aparece.
- **Feedback Tátil Imediato:** Adicionado `active:scale-95` e `cursor-pointer` aos botões de confirmar e cancelar, além de desacoplar o fechamento da janela com `requestAnimationFrame` para resposta imediata ao toque/clique.
- **Eliminação de Layout Thrashing:** O recálculo síncrono e a reconstrução do DOM de todos os cards vizinhos foi desacoplada da medição de posições. Ao excluir um colaborador, o nó é removido e as posições são medidas instantaneamente sem forçar reflow desnecessário na thread principal.
- **Persistência Assíncrona:** A persistência no `localStorage` é executada de forma assíncrona após a conclusão da animação visual, garantindo 60/120 FPS ininterruptos durante a transição.

#### 2. Animação de Exclusão Responsiva e Suave no Mobile
- **Eliminação de Jitter:** Durante a animação de exclusão no mobile, o `scroll-snap-type` da esteira Kanban é suspenso temporariamente e restaurado ao término, impedindo o conflito do snap nativo com o transform dos elementos.
- **Isolamento de Eixo:** No mobile (esteira horizontal), foi travado qualquer deslocamento vertical espúrio (`deltaY = 0`), garantindo um deslizamento limpo, natural e sem tremores.
- **Aceleração por Hardware:** Aplicação de `will-change: transform` durante o movimento nos cards irmãos.

#### 3. Padronização Visual do Checkbox dos Eventos Adicionais
- **Design System Coerente:** Substituído o checkbox quadrado nativo pelo controle arredondado customizado (`rounded-full`), idêntico aos chips de "Turnos Trabalhados" e "Dobradinha de Domingo".
- **Destaque Âmbar/Laranja:** Quando marcado/ativo, o controle recebe o anel com destaque âmbar (`border-amber-500 bg-amber-500/20`) e o ícone de check em tom âmbar vibrante.

#### 4. Inputs dos Adicionais Sempre Desbloqueados para Edição
- **Liberdade de Edição:** Removido o bloqueio com `disabled` nos campos dos adicionais. Agora o usuário pode preencher ou alterar o nome, tipo, horas ou valores do evento adicional a qualquer momento, mesmo quando estiver desmarcado.
- **Estado Inativo Claro:** Quando desmarcado, o item apenas sinaliza visualmente a inatividade sem limitar a digitação ou foco.

#### 5. Feedback Visual Evidente para "Manter ao Resetar" (Lock)
- **Destaque Evidente do Item Fixado:** Quando a opção "Manter ao resetar" está ativa, o container do evento recebe classe `.is-locked` com borda contornada em tom âmbar dourado sutil, gradiente suave de fundo e sombra de realce.
- **Badge e Ícone:** Exibição de um badge visível `Fixado` e realce no botão de cadeado, tornando o estado travado imediatamente reconhecível à primeira vista.

---

## [v1.5.0] - 12/10/2026

### 🚀 Refinamentos de UX, Limpeza de Recursos e Feedback Visual

#### 1. Remoção do Botão Recolher/Expandir Card
- **Motivação:** Com a evolução da interface e densidade das informações, a funcionalidade de recolher o card tornou-se redundante e sem utilidade prática.
- **Implementação:** Removido o botão `.minimize-btn` do template HTML e todo o código relacionado no JavaScript (`js/components/employeeCard.js`).
- **Layout:** Removidas as regras de accordion/0fr do CSS; os cards de colaboradores agora mantêm seu conteúdo aberto e pronto para uso de forma contínua e estável.

#### 2. Turnos Desmarcados Exibem 0 com Memória do Valor Anterior
- **Comportamento visual:** Ao desmarcar um turno, o campo de horas exibe visualmente `0` para reforçar claramente que nenhuma hora está sendo computada.
- **Preservação de memória:** O valor anterior (ex: 7 ou 8 horas) permanece salvo em `data-last-value` e no estado do colaborador. Ao reativar o turno, o valor anterior é imediatamente restaurado.

#### 3. Proteção Completa no Campo de Horas de Turnos Inativos
- **Problema corrigido:** Clicar no campo de horas de um turno inativo acabava ativando o turno indevidamente (devido ao `pointer-events: none` que deixava o clique vazar para o elemento pai).
- **Correção:** O wrapper de horas agora mantém `pointer-events: auto` com `stopPropagation()`. Quando desmarcado, o input permanece desabilitado (`disabled`, `cursor: not-allowed`), impedindo digitação e garantindo que o clique no campo **não** ative o turno acidentalmente.

#### 4. Renomeação de "Dobradinha Dom." para "Dobradinha de Domingo"
- Atualizado o rótulo da pílula no template de colaboradores para texto completo e claro: **Dobradinha de Domingo**.

#### 5. Correção do Contorno Verde da Dobradinha Selecionada
- **Problema corrigido:** Apenas os cantos arredondados ficavam verdes por vazamento do `box-shadow`, enquanto as bordas retas eram sobrescritas pela classe de borda escura do modo noturno (`dark:border-stone-800`).
- **Correção:** Adicionado seletor com `html.dark .dobradinha-pill.is-active` e `border-color: #10b981 !important;`, garantindo contorno verde nítido, contínuo e uniforme em todas as faces da célula.

#### 6. Micro-animação de Feedback no Botão "Resetar Turnos e Eventos"
- **Feedback tátil:** Ao clicar no botão de reset, ele executa uma micro-animação de pulso tátil acompanhada de rotação suave em sentido anti-horário (sentido correto da seta de restauração), além de realce âmbar instantâneo.

#### 7. Animação Suave (FLIP) na Exclusão de Cards
- **Problema corrigido:** Ao excluir um colaborador, especialmente no Desktop (CSS Grid), os cards restantes davam um salto abrupto e truncado.
- **Solução FLIP (First, Last, Invert, Play):** Ao confirmar a exclusão, as posições dos cards irmãos são medidas antes da remoção e interpoladas com bezier suave `cubic-bezier(0.2, 0.8, 0.2, 1)`, fazendo com que os cards deslizem com total fluidez para o lado para preencher o espaço.

---

## [v1.4.0] - 12/10/2026

### 🎯 4 Ajustes Pontuais de Ergonomia, UX e Estabilidade Visual

#### 1. Accordion do Card: Animação Precisa com `grid-template-rows` (Passo 1)
- **Problema corrigido:** `max-height: 2500px` gerava timing errático (a transição percorria 2500px mas o conteúdo real tinha ~600px, causando abertura quase instantânea com travamento visual no final).
- **Solução:** Substituída a técnica de `max-height` pela técnica moderna `grid-template-rows: 0fr → 1fr`, que usa a **altura real do conteúdo**. A curva de animação é agora linear e precisa, sem artefatos visuais.
- **Bônus — `overflow: clip` no card raiz:** O `overflow: hidden` do card foi trocado por `overflow: clip` (inline style). A diferença: `clip` aplica o corte visual mas **não cria um stacking context** que bloquearia `box-shadow`, eliminando o bug de sombra cortada durante a abertura/fechamento do accordion.

#### 2. Grid Desktop Nativo Permanente, Sem Toggle (Passo 2)
- **Problema corrigido:** O toggle Grade/Esteira adicionava complexidade JS desnecessária, classes dinâmicas no DOM e `!important` em cascata para sobrepor Tailwind.
- **Solução:** Removido completamente o seletor Grade ↔ Esteira do header. O Grid é agora o layout **permanente** no desktop, controlado exclusivamente por CSS via `@media (min-width: 768px)` diretamente no `#employee-container`. Mobile (`< 768px`) continua 100% intacto com a esteira Kanban horizontal com snap tátil.
- **JS simplificado:** Removidas as funções `initDesktopView()`, `setDesktopViewMode()` e toda a lógica de `localStorage` de preferência de layout. `handleWheel` e o listener de setas de teclado agora verificam apenas `window.innerWidth >= 768` (sem depender de classes no DOM).
- **Scroll de novo card adaptado:** No desktop, usa `card.scrollIntoView()` (grid vertical); no mobile, continua usando `scrollTo({ left })` (esteira horizontal).

#### 3. Hitbox do Turno Expandida para o Row Inteiro (Passo 3)
- **Problema corrigido:** O toggle do turno só respondia ao clique nos ~60% esquerdos da linha (`.shift-toggle-btn`), tornando a interação frustrante, especialmente em telas touch.
- **Solução:** O listener de `click` foi movido do `.shift-toggle-btn` para o `shiftEl` completo (a linha inteira). Um filtro `e.target.closest('.shift-hours-wrapper')` impede que cliques diretos no input de horas ou no label "hrs" disparem o toggle acidentalmente.
- **Proteção dupla no input:** `e.stopPropagation()` no próprio `hoursInput` garante que foco/clique no campo nunca altere o estado do turno. O cursor `default` é restaurado no wrapper de horas (evita o cursor pointer no input).

#### 4. Feedback Visual Claro de Horas Inativas (Passo 4)
- **Problema corrigido:** Quando um turno estava desmarcado, o input de horas aparecia visualmente idêntico ao ativo (dando a impressão de que o valor contava no cálculo) e exibia `0` — um valor ambíguo entre "horas zeradas" e "turno inativo".
- **Solução — CSS:** O `.shift-hours-wrapper` esmaesce para `opacity: 0.38` com transição suave quando `.shift-pill:not(.is-active)`. O `pointer-events: none` bloqueia toda interação visualmente. Isso comunica claramente o estado inativo sem precisar alterar a lógica de dados.
- **Solução — JS (`setShiftState`):** Ao desmarcar um turno, o input agora exibe o `lastValue` (as horas reais configuradas) em vez de `0`. O usuário vê "7 hrs" esmaecido, não um zero confuso, e sabe exatamente o que será reativado ao marcar o turno novamente.

---

## [v1.3.0] - 12/10/2026

### 🖥️ Refatoração de Ergonomia e Responsividade Desktop (Mobile-First Estrito)
- **Cabeçalho Unificado e Barra de Comandos Integrada**:
  - Em telas médias e grandes (`md:`, `lg:`, `xl:`), o topo organiza-se em uma barra executiva horizontal fluida: Logotipo e marca à esquerda, campo de busca com foco rápido e atalho visual `<kbd>Ctrl K</kbd>` centralizado, e botões de ação à direita.
  - No mobile (`< md`), a busca quebra de linha de forma limpa na segunda fileira sem esmagar o logotipo ou os botões de ação.
- **Visualização em Grade Fluida (`Grid Mode`) no Desktop**:
  - Fim da sensação de espaço ocioso em monitores Full HD, Ultrawide e notebooks: os colaboradores distribuem-se automaticamente em colunas dinâmicas fluidas (`repeat(auto-fill, minmax(320px, 1fr))` com container máximo de 1560px centralizado).
  - Cards equalizados verticalmente: rodapés (`employee-footer`) fixados de forma homogênea no fundo através de alinhamento `margin-top: auto`.
  - Cards recolhidos no modo grade alinham-se no topo (`align-self: start`) sem esticar espaço vazio indesejado.
- **Alternador de Visualização Desktop (Grade ↔ Esteira)**:
  - Adicionado seletor segmentado elegante no cabeçalho exclusivo para telas desktop (`hidden md:flex`) permitindo alternar instantaneamente entre **Grade Fluida** e **Esteira Horizontal (Kanban)**.
  - Preferência de visualização persistida no `localStorage ('pazCoffeeDesktopView')`.
- **Scroll Inteligente e Atalhos Ergonômicos**:
  - Quando no modo Grade no desktop, a rolagem do mouse e teclas voltam ao comportamento vertical natural da página, sem retenção desnecessária. No modo Esteira, a navegação horizontal fluida e suave permanece ativa.
  - Atalhos globais `Ctrl + K` e barra `/` focam e selecionam instantaneamente o campo de busca de colaboradores, e `Escape` desseleciona.
- **Microinterações e Ergonomia de Cursor com Mouse**:
  - Efeitos de `hover` sutis com sombras suaves e realce de borda âmbar nos cards de colaborador, chips táteis e botão de adicionar via `@media (hover: hover) and (pointer: fine)`.
  - Modais (Holerite e Confirmação de Exclusão) com desfoque de fundo mais profundo (`backdrop-blur-md`), largura máxima controlada (`max-w-lg`) e centralização geométrica perfeita.
  - Cursores interativos explícitos (`cursor-pointer`) em todos os botões, chips e áreas clicáveis.
- **Garantia de Não-Regressão Mobile**:
  - Nenhuma classe base utilizada pelo mobile foi alterada ou quebrada; todas as regras desktop foram escopadas em `min-width: 768px`.
- **Cache-Busting**:
  - Versão dos assets elevada para `v=1.3.0`.

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
