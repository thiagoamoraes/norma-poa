# PLANO F2 — Anexo na árvore de versões e no histórico

Relatório de planejamento (agente de planejamento, somente leitura; 21/11/2026), salvo pela sessão principal em forma condensada (mantém achados, modelo, decisões e fases). **Insumo, não decisão** (regra 12). Nenhum código de produção foi escrito.
Baseline medida pelo agente (0 falhas): core 153 (regressão 47, vetado 13, peças 2–3 30, lei publicada 11, peça 4 29, URN 7, gruposAntes 16); versionamento 34, histórico 28, anexos no fecho 20, revogação parcial 4, minuta 33, revisão 86.

## 1. Onde a árvore e o histórico perdem o anexo

| # | Onde | O que acontece |
|---|---|---|
| 1 | `norma-core.js:645` e `:772` (`parseMinuta`, estágio fecho) | Depois da linha de fecho, tudo vai para `fechoBuf` e vira `doc.fecho`; o anexo viaja como texto do fecho, aparado. |
| 2 | `norma-core.js:1344-1352` (`criarVersaoOriginal`) | O objeto devolvido leva só `id, urn, leiBase, versaoAnterior, fonte, dataVigencia, artigos`. `doc.fecho` (e o anexo) é descartado (conferido em 49707, 41114, 39825, 46293, 40426). |
| 3 | `norma-core.js:1257-1266` (`desFixoParaChaveArtigo`, `chaveDoNo`) | `desFixo` que não começa por "Art." não tem chave; `indexarVersao` e `localizarCaminho` ignoram o nó. Hoje não existe endereço de anexo. |
| 4 | `ingestao/estrutura.mjs:64-76` (`slugDoRotulo`) | Não conhece `'anexo'` e devolve null; em `historico.mjs:139` cairia em `anexo-sem-rotulo` (todos os anexos se fundiriam). |
| 5 | `ingestao/historico.mjs:74` e `:160` | `v0 = criarVersaoOriginal(parseMinuta(...))`; só há um laço, sobre artigos. |
| 6 | `ingestao/historico.mjs:92` | `efetivos` só aceita `replace_text`, `insert_node`, `revoke_node`. |
| 7 | `ingestao/historico.mjs:55-66` (`artigosQueMexemEmAnexo`) | Só lê a frase de introdução: falsos negativos medidos (50200 art. 9, 45238 art. 9 II, 48437 art. 12 III). |

O estruturador já tem o anexo como nó (`estrutura.mjs`, `dividirFechoEAnexos`, `slugDoAnexo`). Nos 203 `dados/historico/sapl/*.json` há 0 dispositivos de anexo, mas 18 bases têm anexo no fecho: 107 anexos (33 gráficos/título, 3 com rótulo repetido), ~309 KB de bruto (+2,7% sobre 11,3 MB). Só 1 das 8 bases com `anexosAlterados` tem anexo lido hoje: a LC 1.033/2025 (id 49707, 8 anexos).

## 2. Modelo proposto (aditivo)

- **Onde mora:** `versao.anexos[]`, lista ao lado de `artigos` (não dentro). Misturar em `artigos` obrigaria `insert_node` de raiz, `localizarCaminho` e `indexarVersao` a conviver com nós sem chave. Com a lista separada, o compartilhamento estrutural vem de graça (verificado: depois de `apurarTextoVigente`, `versaoFinal.anexos === v0.anexos`).
- **Forma do nó** (como `mk()`): `{ id, tipo: 'anexo', texto: <bruto>, rawL: null, desFixo: <rótulo escrito>, titulo?, vetado?, semTexto?, children: [], conj: null, origem: { tipo: 'promulgacao_original', dataPublicacao } }`. O bruto é aparado linha a linha e sem linhas em branco (não preserva recuo). `desFixo` = rótulo escrito com espaços colapsados, atribuído uma vez. Chave de citação: `anexo i`, `anexo 1.2`, `anexo iii-c`, `anexo` (único) → ids `anexo-i`, `anexo-1-2`, `anexo-iii-c`.
- Lei sem anexo NÃO ganha a chave `anexos` (spread condicional): a versão original de leis sem anexo fica idêntica byte a byte (conferido em LC 810, lc320, 384, 412, 611, 9 ordinárias de fixture).
- **Detecção no core:** mover `dividirFechoEAnexos` e `slugDoAnexo` para o core (função pura de texto); `estrutura.mjs` reexporta (imports de `teste_anexos_no_fecho.mjs` mantidos); `parseMinuta` intocado; `criarVersaoOriginal` deriva de `doc.anexos ?? dividirFechoEAnexos(doc.fecho).anexos`. Alternativa B (injetar `doc.anexos` pela ingestão): diff menor, mas cada chamador teria de lembrar.
- **Histórico:** cada anexo vira dispositivo `{ id: 'anexo-i', pai: null, tipo: 'anexo', rotulo, estados: [...] }` (estados só quando muda); entram em `ordem` depois do último artigo. Rótulo repetido (26743, 23829, 37090): sufixo `~N`, os dois nós ficam, e qualquer comando contra rótulo repetido é recusado como ambíguo.
- **Vetado:** 3 anexos vetados no acervo (41114 ANEXO II; 40791 ANEXOS XXXII e XXXIII); nenhum anexo "revogado" em corpo de lei-base.

**Consumidores a blindar (não são o motor):** minuta (`docs/index.html:291`, `minuta-cli.mjs:39`: filtrar `tipo !== 'anexo'`); `revisao-compilacao.mjs:40-43`; `gerar-site.mjs:49-55` (busca); `docs/index.html:447-453` (ramo estruturado hoje mostra o anexo como texto colapsado: defeito já existente); `revisao-comandos.mjs` (`OPERACOES_COM_EFEITO` não conhece `replace_node`); `docs/js/*` (cópias atrás do core; a rotina noturna regenera). Problema já existente: as 66 normas aceitas sem histórico têm 114 anexos (~146 mil caracteres) que entram na busca e aparecem como texto corrido.

## 3. Anexo substituído, incluído ou revogado por INTEIRO (sem interpretar células)

121 artigos em 78 normas (68 recentes) incluem/alteram/revogam anexo, tabela ou quadro de OUTRA lei; hoje 118 `nao_classificado`, 3 `indeterminado`; zero `revoke_lei`/`replace_text` indevidos (a rodada 46 já cobriu 47547).

| Forma | Exemplos | Hoje | Proposta |
|---|---|---|---|
| F1 Incluir anexo inteiro | 39694/10 (Anexo 6 da LC 626), 40830/2 (Anexos I e II da LC 740), 42994/36 (Anexo III-C da Lei 6.309), 48437/9, 48987/10, 51835/3 | `nao_classificado` | `insert_node` com `alvoTipo:'anexo'`, só se passar em C1–C8 |
| F2 Alterar anexo inteiro "conforme o Anexo K desta Lei" | 42994/37–40, 51577/3, 51833/3, 44398/12, 41578/2 | `nao_classificado` | `replace_node` só no caso forte (42994) |
| F2' Tabela inteira | 39825/12, 43346/5, 40426/2, 45422/6, 42216/10, 46293/2 | `nao_classificado` | fora deste plano (é o nó `tabela`); a LC 7/1973 (id 17478) é `.doc` sem texto |
| F3 Item/linha/valor/evento dentro de anexo | efemérides (30 normas), LOA 51387/51809, cargos (Lei 6.309: 40111 etc.), PDDUA, imóveis 51735 | `nao_classificado` | humano; o nó ganha `aConferir` (fase D) |
| F4 Revogar parte de anexo | 47547/6; 48437/12 III; 50200/9; 45238/9 II | `indeterminado`/`nao_classificado` | humano |
| F5 Revogar anexo/tabela INTEIRO | nenhum "Fica revogado o Anexo X"; só "a Tabela V" (46293/4 IV) | — | stub com falha explícita (regra 1) |
| F6 "passam a vigorar … conforme em anexo" (antigas) | 27475/52, 22311, 30818 | `nao_classificado` | humano |
| F7 Mapa/planta/figura | 40791, 33619, 38791, 22535 | `nao_classificado` | humano |

**Achados laterais (conferidos):** (1) o aviso da decisão 37 tem falsos negativos (revogação por incisos: 50200/9, 45238/9, 48437/12); (2) **"Ficam revogados/revogadas" (plural) nunca casa o gatilho de revogação** (`RE_GATILHO_REVOGACAO`, `norma-core.js:1986`): 54 normas (48 recentes) lidas como `nao_classificado`, e `apurarHistorico` ignora `nao_classificado`, então não geram comando nem `naoAplicadas` nem `aConferir` — item próprio, não resolver aqui; (3) **anexo gráfico nunca pode substituir anexo com texto** (51833: o anexo da alteradora é só "ANEXO / 14.677 / carimbo"); (4) **"alterado conforme o Anexo desta Lei" não prova substituição integral** (51577: excerto com pontilhado; 42994/37–40: quadro inteiro entre aspas com "(NR)" — mesma fórmula, resultado oposto); (5) o anexo incluído pode estar com a fronteira truncada (39694: sem aspa de fechamento; confiança média, como a decisão 9); (6) o arquivo da alteradora pode nem trazer o anexo (48987: 49 linhas, "modelo georreferenciado" em outro arquivo, caso da decisão 36).

**Operações mínimas (só anexo inteiro), discriminador `alvoTipo: 'anexo'`** com ramo no topo de `aplicarComandoLei` (caminhos de artigo intactos):
- `insert_node` de anexo (F1): recusa se o rótulo já existe (inclusive vetado/revogado); cria o nó no fim de `versao.anexos`; `desFixo` = rótulo interno do bloco, senão o do comando.
- `replace_node` de anexo (F2, só caso forte): o nó mantém `id` e `desFixo` do alvo; troca `texto` pelo bruto da alteradora verbatim; guarda `origem.rotuloNaAlteradora`.
- `revoke_node` de anexo (F5): continua falhando explicitamente até haver exemplo real.
- **Condições C1–C8 (todas):** C1 o artigo abre com "Fica(m) incluído(s)/alterado(s) [o(s)] Anexo(s) <rótulos> na/no/da/do Lei <ref>" (a 1ª lei citada é a alvo; 0 casamentos nas 21 fixtures do core); C2 sem objeto parcial entre o verbo e a lei ("item", "linha", "letra", "pela inclusão", "o evento X no Anexo…"); C3 o anexo da alteradora a que o artigo se liga existe entre os lidos e é 1:1; C4 o bloco não tem linha de omissão (5+ pontos) e, se abre aspas, fecha (com "(NR)" para replace); C5 (replace) o rótulo interno do bloco é igual ao citado no artigo; C6 (replace) o bruto novo não é `semTexto`; C7 `leiAlvoBateComVersao` cobre as operações novas; C8 (insert) o rótulo não existe nem como vetado, (replace) existe, não vetado/revogado, não repetido. Qualquer falha: nenhuma operação nova (aviso + `aConferir`).
- Protótipo: dos 18 artigos F1/F2, só 42994/36–40 cumpre a dupla confirmação, e sua lei-base (Leis 6.309, 6.203, 6.253, 6.310, 8.986, ordinárias) não tem texto no acervo. Casos com lei-base COM texto, todos inclusão: 40830→39422, 48437→43937 (anexo só cabeçalho, `semTexto`), 39694→36255 (sem aspa de fechamento; a base reprova por `fecho_com_texto_demais`), 48987→48855 (sem anexo no arquivo). **Não existe caso real de substituição inteira testável de ponta a ponta: a fase F pára (regra 1).**
- **`aConferir` por nó:** com o anexo na árvore, `citacaoDeAnexo(intro)` devolve os rótulos citados e marca o nó (`anexo-i`, `anexo-iii`) a partir da data da alteradora; rótulo citado sem nó continua só no aviso geral.

## 4. Consulta pública (`docs/index.html`)

1. Bloco colapsável fechado por padrão depois do último artigo: `<details class="anexo">` com rótulo, título, "N linhas" e selo; dentro `<pre tabindex="0">` com `white-space: pre`, `overflow-x: auto`, monoespaçado (o `.texto` tem `max-width: 72ch`: rolagem horizontal obrigatória).
2. Selos já decididos: "anexo preservado, não interpretado" (38) e "anexo gráfico, não lido" (36; com link para a fonte quando `semTexto`).
3. Nota no próprio nó: "(Incluído pela …)" / "(Redação dada pela …)"; alteração parcial não aplicada: selo "não conferido" + "alterado por LC X, art. N, em tal data; este bloco NÃO traz a alteração".
4. Seletor de versão funciona como nos artigos; anexo vetado aparece vetado.
5. O mesmo componente no ramo estruturado (corrige o texto colapsado de hoje nas 66 normas aceitas sem histórico).
6. Anexo fora da busca e fora das opções de alvo da minuta.
**Rótulo de confiança (decisão 15):** mantém os três níveis; ressalva "(texto vigente apurado; anexos não apurados)" só quando houve alteração de anexo NÃO aplicada. Lei com anexo sem alteração: nada muda no rótulo (respeita a decisão 37). Nunca "consolidado". Acessibilidade: `<details>` nativo; `<pre tabindex="0">` com `aria-label`; validar no navegador e testar a apresentação em função pura.

## 5. Testes (novos, com texto real; falham contra o código atual) — arquivo `teste_anexo_na_arvore.mjs`
T1 49707: `criarVersaoOriginal(parseMinuta)` traz `versao.anexos` com 8 nós `anexo-i…anexo-viii`, texto = bruto do estruturador. T2 41114/40791: anexos vetados mantidos (`vetado:true`); histórico `situacao:'vetado'`. T3 `slugDoRotulo('anexo','ANEXO I') === 'anexo-i'` (hoje null). T4 guarda: LC 810 e fixtures sem anexo não ganham a chave `anexos` (JSON idêntico). T5 histórico de 49707: 8 dispositivos `tipo:'anexo'`, 1 estado cada. T6 26743 (rótulo repetido): nenhum nó perdido; ids `anexo` e `anexo~2`; comando contra rótulo repetido recusado. T7 compartilhamento estrutural. T8 alinhamento histórico × estruturado nas 18 bases. T9 (fase A) `artigosQueMexemEmAnexo` sinaliza 50200/9, 45238/9, 48437/12; negativos mantidos. T10–T12 (fase E) 40830→39422 (dois `insert_node`), 48437→43937 (`semTexto`), 48987→48855 (recusa). Negativos de extração (4.2): 47547/6 segue `indeterminado`; 51577/3, 51833/3, 33502/1, 42216/10, 39694 sem operação; efemérides não aplicam.
Contagens previstas: core 153, versionamento 34, histórico 28, anexos no fecho 20, revisão 86, estrutura 62, peça 4 29, regressão 47 — todas iguais; `normateste.mjs` byte a byte; só 18 históricos mudam na fase B. Fixtures a copiar: 39422, 40830, 43937, 48437, 51735, 48987, 50200, 51577, 51833, 39694, 45238, 26743.

## 6. Riscos
Espelho em `norma-simulacao.html` (cada função mudada precisa de patch igual; `criarVersaoOriginal`, `aplicarComandoLei` e `apurarTextoVigente` são idênticos nos dois hoje); ids de nó (`nid()` global: leis com anexo consomem ids a mais); tamanho (+~309 KB; substituição guarda o bruto novo inteiro; o maior anexo lido tem 97 KB, id 26743); bruto aparado (colunas largas menos legíveis); leitor de anexo estrito (só `ANEXO` em maiúsculas: não pega "Anexo 1 à Lei Complementar nº 626." nem anexo antes do fecho nem lei sem fecho reconhecido, 144 normas); rótulo errado falha alto ("Anexo Único" × "ANEXO", `Anexo 1` ≠ `Anexo I`); em 15 alteradoras recentes o anexo é bloco "“ANEXO … ” (NR)" de outra lei (na árvore da alteradora é anexo dela, rotulado "bloco de alteração"); LC 7/1973 sem texto (9 normas de tabela dependem dela); bases ordinárias sem texto (10.903, 10.904, 14.429, 6.309, 6.203, 7.815).

## 7. Perguntas ao mantenedor (entrevista, regra 11; recomendação do agente)
1. Anexo substituído inteiro troca o bruto do nó (A, recomendado: mesmo nó, bruto verbatim com o cabeçalho da alteradora, `origem.rotuloNaAlteradora`, anterior na linha do tempo) ou cria nó novo e marca o antigo (B)?
2. O que basta para dizer "inteiro"? Recomenda exigir bloco entre aspas, "(NR)", rótulo interno igual ao do artigo e sem pontilhado; senão `aConferir`. Alternativa mais frouxa (40830: sem aspas, rótulos 1:1): aceitar com confiança média.
3. Anexo incluído com conteúdo gráfico ou ausente: (A) criar nó `semTexto` registrando existência e origem (recomendado quando há cabeçalho, 48437); (B) recusar (48987).
4. Revogação de anexo inteiro marca o nó como artigo (`revogado:true`, "(Revogado)")? Sem exemplo real: sem código.
5. Rótulo de anexo vetado ocupado por anexo novo: recomenda recusar.
6. Anexo gráfico ou carimbo nunca substitui anexo com texto (51833): confirmar.
7. Posição do anexo novo: fim da lista (recomendado) ou ordenado por rótulo (III-C depois de III).
8. Ressalva "anexos não apurados" só quando houve alteração não aplicada (recomendado) ou em toda lei com anexo?
9. Consulta: anexo colapsado por padrão e fora da busca (recomendado), ou aberto e indexado?
10. Efemérides, LOA, cargos (F3): item em anexo continua só `aConferir` por nó? (30 normas de efeméride, cresce toda semana; pode ser frente própria.)
11. Revogação plural (54 normas): abrir item próprio?
12. LC 7/1973 em `.doc` (id 17478): priorizar a extração, que destrava 9 normas de tabela?

## 8. Fases
- **A (sem mexer no core; pode ir primeiro):** A1 `artigosQueMexemEmAnexo` também varre incisos de "Ficam revogados/revogadas"; A2 `gerar-site.mjs` exclui o tipo anexo da busca e a consulta renderiza o anexo do ramo estruturado como `<details><pre>`. Término: T9 verde; nenhum id `anexo*` em `docs/dados/texto-*.json`; conferido no navegador; bateria igual.
- **B (core + espelho):** mover `dividirFechoEAnexos`/`slugDoAnexo` para o core; `versao.anexos` (spread condicional); `slugDoRotulo('anexo')`; laço de anexos e `~N` no histórico; excluir anexo de minuta, comparação e busca. Término: T1–T8 verdes (falhando no código antigo); bateria igual; `normateste.mjs` byte a byte; `git diff --stat` do histórico só nas 18 bases; `diff` das funções entre core e simulador igual.
- **C (consulta):** bloco colapsável, selos, nota de origem, "mudou", ressalva. Término: conferido no navegador em 49707, 41114, 40791 e numa lei sem anexo (idêntica).
- **D (`aConferir` por nó):** `citacaoDeAnexo(intro)`. Término: histórico de 49707 marca `anexo-i` e `anexo-iii` (alteradora 50200); 43937 marca `anexo-iii` (51735) e `anexo-i` (47547).
- **E (inclusão de anexo inteiro):** depende das respostas 1–3. `insert_node` de anexo (C1–C8), `efetivos` e `revisao-comandos.mjs`, espelho. Término: T10–T12 e negativos 4.2; nenhuma lei existente muda de operação; ponta a ponta só em 40830→39422 e 48437→43937.
- **F (substituição inteira):** depende das respostas 1, 2 e 6 **e de texto real da lei-base**; sem isso, pela regra 1, para.
- **G (revogação de anexo inteiro):** só com exemplo real e a resposta 4.
Ordem recomendada: A, B, C, D, E; F e G ficam bloqueadas.
