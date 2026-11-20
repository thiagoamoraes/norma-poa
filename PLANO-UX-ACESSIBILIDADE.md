# Plano: design visual e acessibilidade das páginas estáticas

Auditoria exploratória (20/11/2026) de `docs/index.html`, `docs/revisao.html` e `docs/compara.html`. **Nada foi alterado nas páginas**; este arquivo é o único produto. Método: Chromium/Playwright em 1440, 1024, 768, 390 e 320 px, claro e escuro; **axe-core 4.x rodado de verdade** (tags wcag2a/2aa/21a/21aa/best-practice, 5 estados por esquema = 10 execuções) **mais** medições manuais (razão WCAG calculada dos tokens, teclado, alvos, desempenho). Dados reais (LC 320, LC 434, LC 1.076) servidos de `dados/` local. Regra do projeto: o que sustenta uma decisão deve ser reconferido antes de aplicar (regra 6).

**Resultado do axe: 0 violações em todas as execuções (41 regras aprovadas por página).** O axe não enxerga o que importa aqui: ordem de foco, uso de `listbox`, cor como único sinal, atalhos de letra, anúncios `aria-live`, contraste de bordas e de destaques. Esses achados são manuais.

## 1. Conformidade WCAG 2.1 AA

| Critério | Veredito | Evidência medida |
|---|---|---|
| 1.1.1 Conteúdo não textual | Passa | Sem imagens; ícones são caracteres (✓ ⚠ ✗) com texto ao lado. |
| 1.3.1 Informação e relações | **Parcial** | `li` clicáveis sem `role`/botão (index, revisao); `listbox` com 521 `option` focáveis; texto da norma em `div` sem lista/heading para Capítulo/Seção (`.grupo`). |
| 1.3.4 Orientação / 1.3.5 Finalidade | Passa | Sem trava de orientação; campos sem dados pessoais. |
| 1.4.1 Uso de cor | **Falha** | `mark.m`/`mark.c` (compara) e `.disp.mudou` (index) distinguem-se só por fundo; ver F2. |
| 1.4.3 Contraste (texto) | **Parcial** | Todos os pares dos tokens passam (mín. 4,81:1 claro, 5,36:1 escuro). Exceção: `.disp.antiga .nota` (suave com `opacity:.75`) = **3,44:1** claro, 4,40:1 escuro, a 11,5 px. |
| 1.4.4 Redimensionar texto | **Parcial** | Zoom do navegador a 200%: sem perda. Mas `body{font:16px}` (px) ignora o tamanho-base do usuário: com `html{font-size:200%}` o corpo continua 16 px enquanto títulos/controles (rem) dobram (h1 21,6→43,2 px). |
| 1.4.5 Imagens de texto | Passa | Nenhuma. |
| 1.4.10 Refluxo | Passa | `scrollWidth == clientWidth` em 1440/1024/768/390/320, as 3 páginas. |
| 1.4.11 Contraste não textual | **Falha** | Borda de campos/selects/botões `--linha` = **1,42:1** (claro) e **1,37:1** (escuro) contra `--papel` (exige 3:1). Destaques de fundo `*-fraca` contra o papel: 1,10 a 1,25:1. Focus ring passa (8,29:1). |
| 1.4.12 Espaçamento de texto | Passa | Com line-height 1.5, letter-spacing .12em, word-spacing .16em + fonte 200%: sem rolagem horizontal nem recorte (os `line-clamp` já recortam por desenho; ver M3). |
| 1.4.13 Conteúdo em hover/foco | Passa | Só `title=` nativo e hover de fundo. |
| 2.1.1 Teclado | **Parcial** | Tudo alcançável por Tab, mas `Space` não ativa `li`/`option` (só Enter); `.r[data-ref]` (copiar referência) só funciona com mouse; setas não navegam o `listbox`. |
| 2.1.2 Sem armadilha | Passa | Nenhuma armadilha encontrada. |
| 2.1.4 Atalhos de tecla única | **Falha** (A) | revisao: `J K A D C E` sem modificador, sem opção de desligar/remapear. |
| 2.4.1 Contornar blocos | **Parcial** | Sem link "pular". Index: 5 controles + 50 `li` + "Mostrar mais" = 55 Tab até o fim da lista. Revisao: 178 pontos de Tab, 521 só na árvore. |
| 2.4.2 Título | Passa | Três títulos distintos, "Norma — …". |
| 2.4.3 Ordem do foco | **Falha** | revisao: `abrir()` chama `pintarFila()` (`replaceChildren`) e o elemento focado some: foco vai a `BODY` após Enter na fila **e** após `J`/`K` (medido). |
| 2.4.6 Cabeçalhos e rótulos | Parcial | h1>h2 coerentes; revisao não tem h2 (painéis em `h3` sem h2 pai: `#norma h2` existe só após abrir; `.painel h3` pula nível quando vazio). |
| 2.4.7 Foco visível | Passa | `outline:2px solid var(--marca); offset 2px` em todos os interativos; 8,29:1 (claro) / 7,58:1 (escuro). |
| 2.5.3 Rótulo no nome | Passa | Botões "Aceitar como está (A)": nome acessível contém o texto visível. |
| 3.1.1 Idioma | Passa | `lang="pt-BR"`. |
| 3.2.x Previsibilidade | Passa | Sem mudança de contexto por foco/entrada. |
| 3.3.1/3.3.2 Erros e rótulos | **Parcial** | compara: `#estado` (erros "Não consegui comparar…") sem `aria-live`; placeholders longos como única dica em `#busca`. |
| 4.1.2 Nome, função, valor | **Parcial** | `li tabindex=0` sem papel (leitor diz "item de lista", não "botão/link"); `aria-current="false"` explícito em todos os não atuais (válido, ruído). |
| 4.1.3 Mensagens de status | **Parcial** | `aria-live=polite` envolve `#detalhe` (18.424 caracteres após abrir a LC 320), `#norma` e `#painel` inteiros: tudo é relido a cada atualização. `#toast`/`#copiado` com `role=status` estão corretos. |

(2.2.x, 2.3.x, 1.2.x, 1.4.2: não aplicáveis ou sem achado; sem áudio, sem animação automática, sem timeout.)

Contrastes medidos (claro / escuro), pares realmente usados: tinta/papel 15,80 / 12,61 · suave/papel 6,00 / 6,66 · suave/fundo 5,46 / 7,33 · suave sobre `*-fraca` 4,81 a 5,29 / 5,36 a 6,07 · marca/papel 8,29 / 7,58 · marca/marca-fraca 6,75 / 6,43 · ok/ok-fraca 5,28 / 7,30 · alerta/alerta-fraca 5,23 / 7,67 · erro/erro-fraca 5,85 / 7,18 · papel sobre marca (botão pressionado) 8,29 / 7,58 · toast 15,80 / 12,61 · tinta sobre azul de `.fr` (`#3b82c4` a 18%) 12,79 / 10,20 · borda azul `.fr` contra papel 4,06 / 3,98 (passa 3:1).

## 2. Falhas por severidade, com correção

### Alta
**A1. Foco perdido em revisao (2.4.3).** `pintarFila()` recria todos os `li`. Correção em `abrir()`/`J`/`K`, depois de `pintarFila()`:
```js
const foco = document.activeElement?.closest?.('#fila li')?.dataset.id; // antes de pintarFila()
pintarFila();
if (foco) document.querySelector(`#fila li[data-id="${foco}"]`)?.focus({ preventScroll: true });
```
Para `J`/`K`, focar o `li` novo (`.focus()`), não o corpo. Alternativa mais barata: em `pintarFila()` só alternar `aria-current` e recriar a lista apenas quando o filtro mudar.

**A2. Atalhos de letra (2.1.4, A).** Só ativar com a lista de revisão em foco, ou permitir desligar. Mínimo: botão "Atalhos: ligados/desligados" (`aria-pressed`, guardado em `localStorage` com try/catch) e no `keydown`: `if (!estado.atalhos) return;`. Trecho:
```js
if (!estado.atalhos || e.target.closest('button,a,summary')) return;
```
Colide com navegação rápida de leitores de tela (J/K/E/D/C/A no modo foco/NVDA/VoiceOver com teclas de letra).

**A3. `listbox` de 521 opções (4.1.2, 2.1.1, 2.4.1).** `role=option` com `tabindex=0` em todos é padrão errado (521 paradas de Tab). Opção 1 (recomendada): remover `role=listbox/option` e `aria-selected`; usar `button` com `aria-pressed`/`aria-current="true"` dentro de `<ul>`. Opção 2: manter listbox com **foco itinerante** (`tabindex=-1` em todos, `0` só no selecionado; setas ↑/↓/Home/End; `aria-activedescendant` opcional). Em ambas, Space e Enter ativam.

**A4. `li` clicável sem semântica (index e revisao).** Trocar por `<li><button type="button" class="item">…</button></li>` (ou `<a href="#n=ID">`, que já daria URL e Space/Enter corretos):
```html
<li><a class="item" href="#n=51969" data-id="51969">…</a></li>
```
```css
ul#lista a.item{display:block;color:inherit;text-decoration:none;background:var(--papel);border:1px solid var(--linha);border-radius:6px;padding:10px 12px}
```
Remove também o `keydown` Enter manual e o `cursor:pointer` em `li`.

**A5. Contraste não textual das bordas (1.4.11).** Novo token e uso em controles (não em divisórias decorativas):
```css
:root{--borda-controle:#857f76}                                   /* 3,97:1 papel, 3,61:1 fundo */
@media (prefers-color-scheme:dark){:root{--borda-controle:#737a83}} /* 3,73:1 papel, 4,10:1 fundo */
input[type=search],input[type=text],select,textarea,button{border-color:var(--borda-controle)}
```
(`.selo.no` e botões ficam com o mesmo token.)

**A6. Destaques só por cor (1.4.1/1.4.11), compara.** `mark.m` (erro-fraca) e `mark.c` (alerta-fraca) têm 1,10 a 1,25:1 contra o papel e entre si, e nada além de cor os distingue. Correção:
```css
mark.m{background:var(--erro-fraca);text-decoration:underline wavy var(--erro);text-underline-offset:3px}
mark.c{background:var(--alerta-fraca);text-decoration:underline dotted var(--alerta);text-decoration-thickness:2px;text-underline-offset:3px}
```
e legenda textual acima da lista: "sublinhado ondulado = diverge do motor; pontilhado = só na compilação" (confirmar com o código de `compararComCompilacao` qual lado cada classe marca antes de redigir). Idem index: `.disp.mudou` tem barra de 3 px à esquerda (forma), mas sem texto; incluir `<span class="nota">alterado nesta versão</span>` ou `aria-label`.

### Média
**M1. `aria-live` amplo (4.1.3).** Remover `aria-live` de `#detalhe`, `#norma` e `#painel`. Manter só `#contagem` (index) e `role=status` num `<p class="sr-only" id="anuncio">` com frases curtas ("Lei Complementar nº 320 aberta, 78 dispositivos"; "131 pendentes"). Mover o foco para o `h2` da norma (`tabindex="-1"` + `.focus()`) ao abrir.

**M2. Painel de revisao no desktop some (bug de layout/teclado).** `#fila-col` é `details` fechado no mobile (`open=false` em `abrir`) e o `summary` fica `display:none` ≥1000 px: ao redimensionar (ou girar tablet) a coluna esquerda fica vazia e sem como reabrir (medido: coluna em branco). Correção:
```js
const mq = matchMedia('(min-width:1000px)');
const ajusta = () => { if (mq.matches) $('fila-col').open = true; };
mq.addEventListener('change', ajusta); ajusta();
```

**M3. Índice recortado por `line-clamp`.** `.em` (3 linhas) e `.chaves` (2) cortam ementas; o texto completo existe no detalhe, aceitável, mas em revisao `.disp .t` (3 linhas) corta o texto jurídico justamente onde o revisor precisa ler. Manter, mas adicionar `title` ou expandir ao selecionar (já expande no selecionado).

**M4. Opacidade em texto (1.4.3).** `.disp.antiga{opacity:.75}` reduz o `.nota` a 3,44:1. Trocar por cor, não opacidade:
```css
.disp.antiga{opacity:1;color:var(--suave)} .disp.antiga .t{text-decoration:line-through;text-decoration-thickness:1px}
```
(suave/papel 6,00 claro, 6,66 escuro.)

**M5. `prefers-reduced-motion` (2.3.3 é AAA, mas há ganho real).** 0 ocorrências nas três páginas; `scrollIntoView({behavior:'smooth'})` (index 418, 468; revisao 320, 322) e `transition` do toast. Correção:
```css
@media (prefers-reduced-motion:reduce){*{scroll-behavior:auto!important;transition:none!important}}
```
```js
const sm = () => matchMedia('(prefers-reduced-motion:reduce)').matches ? 'auto' : 'smooth'; // behavior: sm()
```

**M6. `color-scheme` ausente.** Barras de rolagem, caixas de seleção e `select` nativo ficam claros no escuro. Acrescentar `:root{color-scheme:light dark}` (e `accent-color:var(--marca)` para checkboxes).

**M7. Tamanhos em px que ignoram a preferência do usuário.** `body{font:16px/1.5 …}` nas três. Trocar por `font:100%/1.5 …` (equivale a 16 px por padrão) para o corpo da norma (index `.texto`) escalar junto com a interface.

**M8. `#estado` sem anúncio (compara).** `<span class="ajuda" id="estado" role="status"></span>`; resultado: `aria-live="polite"` curto com `#resumo` ("72 iguais, 6 diferentes…") em vez de rolar silenciosamente.

### Baixa
**B1. Alvos de toque < 44 px (medido em 390 px).** Index: 4 checkboxes **13×13**, 3 links 17–22 px de altura, 1 summary, selects 4. Revisao: **39 botões** abaixo de 44 px (medida de altura: botões de decisão ~40 px, botões do guia e de exportar menores), 3 links. Compara: links "Voltar"/"Consulta" 17 px de altura. (2.5.8 do WCAG 2.2 exige 24 px: abaixo disso só os 3 checkboxes de 13 px e links de 17–22 px.) Correção:
```css
@media (pointer:coarse){button,select,input:not([type=checkbox]),summary{min-height:44px}
 input[type=checkbox]{width:22px;height:22px} label.caixa{min-height:44px}
 .links a,header a{display:inline-block;padding:11px 4px}}
```
**B2. Texto pequeno.** Revisao tem 8.942 caracteres em 12 px e 24 em 11,2 px; index 747 em 11,5 px (`.nota`) e `.selo` em .72rem. Piso sugerido 12 px (0,75rem) com peso 500 nos selos; `.nota` a .8em.
**B3. Sem favicon** (404 a cada abertura) e sem `<meta name="color-scheme">`. **Sem navegação cruzada**: index não liga a revisao/compara; revisao liga às duas; compara liga às duas (ver seção 3).
**B4. Heading/landmark.** Adicionar `<nav aria-label="Páginas do Norma">` comum; trocar `<section aria-label="Busca">` por `role="search"`; `div.grupo` → `<h3 class="grupo">`; em revisao `h3` dos painéis sob um `<h2 class="sr-only">Norma em revisão</h2>`.
**B5. Link "Pular para o conteúdo"** (primeiro foco): `<a class="pular" href="#norma">Ir para o texto da norma</a>` com `.pular:not(:focus){position:absolute;left:-9999px}`.

## 3. Desempenho percebido (medido)

| Item | Medido |
|---|---|
| `catalogo.json` | 5.518.270 B (**1,14 MB gzip**), 16.328 normas; lista pronta em 456 ms (CPU 1×); a página parseia tudo antes do primeiro `filtrar()`. |
| Busca por palavras | ~13 ms (CPU 1×). |
| Busca no texto | 4 fatias, 5,4 MB (1,05 MB gzip); carga + índice 412 ms em localhost; **em rede real somam ~6 MB** (o rótulo da página diz "cerca de 6 MB", correto). |
| Norma grande (LC 434/1999) | `30209.json` 2,1 MB; 1.353 dispositivos, **7.619 nós de DOM, página de 136.617 px**; abre em 639 ms (CPU 1×) e **2.597 ms (CPU 4×)**; "mostrar redações anteriores" 144 ms / 770 ms (4×), pois `desenharHistorico()` refaz todo o `innerHTML`. Em produção os dados vêm de `raw.githubusercontent.com` (latência extra, sem controle de cache). |
Sugestões sem reescrever: (a) `content-visibility:auto; contain-intrinsic-size:auto 80px` em `.disp` (corta o custo de layout fora da tela sem virtualizar); (b) indicar "Carregando o texto… (2 MB)" antes do fetch em normas > 1 MB; (c) nenhum ganho em fatiar o catálogo agora (1,14 MB gzip cabe).

## 4. Inconsistências entre as três páginas

| Aspecto | index | revisao | compara |
|---|---|---|---|
| Largura máxima | 1280 | 1500 | 1300 |
| h1 | 1.35rem | 1.3rem | 1.3rem |
| Tokens de erro | **ausentes** (`--erro*`) | sim | sim |
| `button` | fundo transparente | fundo `--papel` | `--papel` + `.principal` |
| `.selo` | 1px 7px, .72rem | 0 7px, .7rem | 0 8px, .72rem |
| Padding de campo | 10px 12px | 7px 10px | 8px 10px |
| `.aviso` | `border-left` + raio 4 | `#aviso-export` (equivalente) | `.aviso` |
| `-webkit-text-size-adjust` | sim | sim | **não** |
| `.num`, `.estado`, `.selo`, `kbd` | `.estado` | `.num`, `.selo` | `.num`, `.selo` (copiados) |
| Lista de foco-visível | 5 seletores | 6 | 6 (inclui `summary`) |
| Navegação entre páginas | nenhuma | 2 links | 2 links |
| Fonte do texto jurídico | Georgia 16 px | Georgia .9rem + mono .82rem na origem | Georgia .88rem |
Os **valores dos tokens são idênticos** nas três (mesmos hex, claro e escuro): a base é boa; a divergência está nos componentes. Texto jurídico em serifa e texto bruto de origem em monoespaçada (revisao `#origem`) é adequado: a fonte monoespaçada preserva o alinhamento de OCR/extração; manter, mas elevar de .82rem (13,1 px) para .875rem.

## 5. Proposta de tokens e componentes comuns (a ser consolidada num único `<style>` ou arquivo, quando decidido)
```css
:root{color-scheme:light dark;
 /* já existentes, iguais nas 3 páginas */ --fundo --papel --tinta --suave --linha --marca --marca-fraca --ok --ok-fraca --alerta --alerta-fraca --erro --erro-fraca;
 /* novos */ --borda-controle:#857f76; --foco:var(--marca); --info:#2f6fa8; --info-fraca:#e1ecf6; /* hoje #3b82c4 inline */
 --raio:6px; --raio-g:8px; --gap:8px; --alvo:44px; --medida:72ch; --fs-pequena:.8125rem; --fs-base:1rem;
 --f-ui:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif; --f-lei:Georgia,"Times New Roman",serif; --f-bruto:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;}
```
Escuro: `--borda-controle:#737a83; --info:#7fb2e5; --info-fraca:#1f2f3f`. Componentes a unificar: `.pagina` (max-width 1400, gutter 16), `.cabecalho` + `nav` das 3 páginas, `.botao`/`.botao.principal`/`.botao[aria-pressed]`, `.campo`, `.selo` (+ variantes ok/al/er/info/neutro, sempre com texto ou símbolo), `.aviso` (bordas + ícone textual "Aviso:"), `.num`, `.destaque-diff` (dois sublinhados distintos), `.estado`, `.sr-only`, `.pular`, `.toast`.

## 6. O que NÃO mexer
- **Tokens de cor atuais:** todos os pares de texto passam AA em ambos os esquemas; mudar só o que está em A5/A6/M4.
- **Foco visível** (`outline` 2 px marca, offset 2 px): passa; não trocar por `box-shadow`.
- **Sem rolagem horizontal** em 320 a 1440: manter `minmax(0,1fr)`, `min-width:0` e `overflow-wrap`.
- **`aria-live` dos toasts** (`role=status` curto) e `aria-label` nos `select`/`input`: corretos.
- **Serifa para texto de lei e monoespaçada para a origem extraída**; não "limpar" o texto (precisão jurídica; o texto de OCR/origem nunca é corrigido).
- **Não alterar `norma-core.js`, o texto das normas, nem a lógica de decisão**; as correções são CSS/HTML/UX. A `norma-simulacao.html` **não** foi avaliada (fora do escopo pedido).
- **Aviso "Experimento pessoal, sem caráter oficial"**: manter, com o mesmo texto e destaque.
- **Camada de decisões** (`localStorage` + `decisoes.jsonl`): intocada por estas mudanças.

## 7. Ordem sugerida de execução (uma rodada, diff mínimo e aditivo)
1. A1, M2 (bugs de foco/layout, revisao). 2. A5, A6, M4, M6 (somente CSS). 3. A4/A3 (trocar `li` por link/botão; teste em leitor de tela). 4. A2, M1, M5, M7, M8, B-itens. 5. Reexecutar axe e as medições deste relatório; adicionar um teste Playwright mínimo (foco após `J`, contraste das bordas via token) que **falhe no código atual**.
