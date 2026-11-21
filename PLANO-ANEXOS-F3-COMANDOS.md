# PLANO — Anexos, fase 3: comandos de alteradoras que mexem em anexo ou tabela de outra lei

Relatório de pesquisa e planejamento (agente de planejamento, somente leitura; 21/11/2026), salvo pela sessão principal em forma condensada (mantém contagens, ids, achados, decisões e fases). **Insumo, não decisão** (regra 12). Nenhum código de produção foi escrito.

## 0. Escopo e limites
- Acervo: 1.109 normas (8 LO, 52 EC, 916 LC, 133 ordinárias recentes), passadas por `prepararTextoExtraido` + `parseMinuta`/`detectNRCandidates` + `extrairComandosLei`/`extrairReferenciasLei`.
- Critério: artigo da alteradora (caput + incisos filhos) que cita lei-alvo e anexo, tabela, quadro, figura, planta, mapa, folha ou lista. Cada um dos 226 artigos foi conferido à mão contra o texto.
- Limites: lei-alvo estragada pelo OCR fica de fora; classificação das antigas (ids 22xxx a 31xxx) é grosseira.

## 1. Taxonomia medida (226 artigos; 175 alteram, em 115 normas, 87 recentes; 51 são só remissão)
Hoje: 168 saem `nao_classificado`, 5 `indeterminado` e **2 `replace_text` FALSO**.

| Forma | Artigos | Recentes | Ex. (id/art.) |
|---|---|---|---|
| Inclui ANEXO inteiro | 6 | 6 | 39694/10, 40830/2, 42994/36, 48437/9, 48987/10, 51835/3 |
| Substitui/altera ANEXO "conforme anexo/planta" | 12 | 4 | 42994/37-40, 51577/3, 51833/3, 41578/2, 33619/1 |
| Revoga ANEXO inteiro | **0 reais** | | nenhum "Fica revogado o Anexo X" |
| Inclui TABELA inteira | 4 | 4 | 40426/2, 45422/6, 39825/14, 42216/10 |
| Substitui TABELA inteira | 5 | 4 | 39825/12, 43346/5, 38217/1, 37945/5, 30298/14 |
| Renomeia tabela | 1 | 1 | 39825/13 |
| Revoga TABELA inteira | 5 | 5 | 46293/4, 43501/3, 43503/6, 50200/9, 45238/9 |
| Altera ITEM/subitem/inciso dentro de tabela ou lista | 11 | 8 | 46293/2, 47758/1, 47805/2, 49638/5, 41876/26, 41723/8, 44071/9, 41019/3; **falsos `replace_text`: 31027/8 e 32301/1** |
| Revoga ITEM/alínea dentro de anexo/tabela | 2 | 2 | 47547/6, 48437/12 |
| Altera LINHA: regime urbanístico (PDDUA) | 13 | 6 | 36060/1-2, 38309/1-2, 40641/1, 44398/12 |
| Altera LINHA: quadro de cargos (Anexo I da Lei 6.309 etc.) | 50 | 12 | 40111 (30 artigos), 47888, 48003, 50200, 50385, 51150 |
| Altera LINHA: orçamento (LOA, Anexo II) | 4 | 2 | 51387/2-4, 51809/3 |
| Altera por MAPA/PLANTA/limites | 29 | 10 | 34798/1, 38673/1, 40350/1, 50842/2 |
| Inclui efeméride ou evento em lista de anexo | 30 | 30 | 51407/1 (Lei 10.904), 51487/1 (Lei 10.903) |
| Inclui logradouro/via/imóvel em lista de anexo | 3 | 2 | 38791/2, 34244/5, 51735/6 |
| Remissão sem alteração | 51 | 38 | 51498 (denominações, ~25 normas), 42216/15, 49707/18, 36114/2, 27976/9 |

Trechos-chave: 39825/12 "Fica alterada a Tabela II da LC 7/1973 … conforme Anexo I desta LC" (anexo-i = Tabela II completa, 58 linhas); 51577/3 "Fica alterado o Anexo I da Lei nº 6.309/1988 … conforme o Anexo desta Lei" (anexo da alteradora é PARCIAL: "ANEXO I" + pontilhado + "” (NR)"); 40426/2 "Fica incluída Tabela VIII na LC 7"; 46293/2 "Ficam alterados os incs. VI e VII e fica incluído inc. V-A na Tabela IV da LC 7"; 47547/6 "Fica revogado o item 4 do Anexo I da LC 942/2022"; 36060/1 "No Anexo 1.2 da LC 434 … fica alterado para 03 o código referente ao Regime de Atividades".

## 2. Achados que mudam o plano
1. **O detector da decisão 37 (`artigosQueMexemEmAnexo`) pega só 106 de 174 artigos.** `[^.;]` para no ponto de "Anexo 1.2" e "9.1" (confirmado com texto sintético); "Tabela", "Lista" e "Quadro" nem estão na regex (tabela: 1 de 15; item ou lista: 1 de 13). O "8 de 203 leis" da rodada 46 é subestimado.
2. **Falso `replace_text` em lista anexa:** 31027 art. 8 ("itens 4 e 91 da Lista de Serviço anexa ao art. 18 da LC 07/1973") gera `replace_text` com alvo "art. 18" (o artigo é só o lugar onde a lista está anexa). Não ocorre hoje só porque a LC 7 (id 17478, `.doc`) não tem texto extraído.
3. **Revogação plural/em lista nunca é lida:** `RE_GATILHO_REVOGACAO` não casa "revogados"/"revogadas"; 95 artigos, 91 normas (84 recentes), todos `nao_classificado`; os incisos filhos nunca são lidos. Lacuna geral (não só de anexo), não documentada: **precisa de rodada própria** antes de qualquer `revoke` de anexo/tabela. A revogação real de tabela vem quase só nessa forma (46293/4, 43501, 43503, 50200, 45238).
4. **Painel:** `descreverComandos` põe `nao_classificado` em "semEfeito" ("dispositivo(s) da própria lei sem efeito sobre outra"); alterar a Tabela II da LC 7 (39825) aparece como irrelevante. O `indeterminado` do ramo anexo/tabela não leva `leiAlvo` e o painel diz "lei-alvo não identificada" (47547, 40426).
5. **Histórico:** `slugDoRotulo` devolve null para `tipo: 'anexo'` (todo anexo viraria `anexo-sem-rotulo` e colidiria); `chaveParaId` só entende art., §, inc., ali.; um comando futuro `altera_anexo` cairia em `recusados` e geraria `naoAplicadas` falso.
6. **O verbo não decide inteiro × parcial:** "Fica alterado o Anexo I … conforme o Anexo desta Lei" — 51577 é parcial; 39825/12 e 40426 são inteiros. Dos 14 casos recentes com anexo da alteradora legível: 6 parciais (46293, 47758, 47805, 49638, 51577, 43346) e 8 inteiros. Só olhando o anexo da alteradora.
7. **Ligação ao anexo da alteradora** (21 artigos recentes de forma inteira): 14 com anexo textual legível; 4 só gráfico (41578, 48437/9, 51833, 51835); 2 sem anexo lido (45422/6, 48987/10); 1 sem remissão (42216/10).
8. **Hoje não existe NENHUM par real aplicável** (alteradora com anexo legível × lei-alvo com nó de anexo e rótulo igual): a LC 7/1973 (alvo de 21 normas) é `.doc` sem extração; a LC 626 usa "Anexo N à Lei Complementar nº 626." em caixa mista (não vira cabeçalho); a LC 942 e a LC 1.017 não trazem anexos no texto; Leis 6.309, 6.203, 10.903, 10.904 sem texto. Único candidato: 40830 art. 2 → LC 740 (id 39422), que inclui os Anexos I e II (diagramas) numa lei sem anexo.
9. **Rótulo de tabela × texto da lei-alvo:** 50200 art. 9 revoga "a Tabela II – Distribuição dos Cargos em Comissão…", mas na LC 1.033 o anexo-i traz "II – Distribuição dos Cargos em Comissão (CC)…" sem a palavra "Tabela". Casar "tabela N" exige rótulo literal; senão, humano.

## 3. Classificação-alvo e menor conjunto de operações
Princípios: nada interpreta célula; nenhuma operação nasce sem `leiAlvo`; ambíguo vira `altera_anexo` (detectado, não aplicado); a decisão 37 vale até haver par real.

**3.1 Núcleo mínimo (F3.1–F3.4: detectar e avisar).** Função pura nova no core `extrairAlvosDeAnexo(texto)` → `[{ raw, objeto, rotulo, chave, lei? }]` (objetos: anexo/tabela/lista/quadro/figura/planta/mapa/folha; rótulos romano, "III-C", "1.2", "9.1", "único", sem rótulo; ids `anexo-ii`, `anexo-1-2`, `anexo-iii-c`, `tab-iv`, `anexo-i/tab-iv`). UMA operação nova `altera_anexo` sem efeito no motor (campos: `leiAlvo`, `objeto`, `alvoAnexo`, `acao` inclui/substitui/revoga/altera_parte/null, `forma` objeto_inteiro/item_dentro/linha/mapa_ou_planta/lista_item/por_artigo/indefinida, `blocoDaAlteradora {rotulo, parcial}`, `aplicavel:false`, `motivo`). A guarda de anexo/tabela/lista roda ANTES do ramo `nrBloco` (corrige 31027/32301) e do gatilho de revogação. `opts.anexosDaAlteradora` (dado pelo chamador via `dividirFechoEAnexos`; o core não importa ingestão) liga "conforme o Anexo X desta Lei"; "Anexo desta Lei" sem rótulo só liga se a alteradora tem exatamente 1 anexo; anexo gráfico ou não lido → humano.

**3.2 Por forma:** anexo inteiro (incluir/substituir) → aplicável só em F3.6 com par real, antes disso `altera_anexo`; anexo gráfico ou parcial → sempre `altera_anexo`; revogar anexo inteiro → stub (0 exemplos reais); tabela (15) → detectar e avisar (aplicar só depois do nó `tabela` e do texto da LC 7; 39825/14 traz 4 tabelas num anexo de 771 linhas → humano); item/inciso/linha/célula (28) → sempre humano; mapa/planta (29) → só avisar; efeméride/evento/logradouro (33) → só avisar; remissão (51) → sem comando.

**3.3 Aplicação (F3.6, só com par real):** `replace_node` nova (substitui `texto` de nó `anexo-X`; nunca cria; erro se não existe, vetado ou revogado; NÃO usar a heurística "existe → replace" do `leiBaseIndex` para anexo); `insert_node` de anexo (recusa se o rótulo já existe, inclusive vetado/revogado; exige `anexosDaBase: 'lidos'`); `revoke_node` estendido ao nó anexo. Core: `chaveDoNo` para nó raiz `anexo` devolve `anexo ii`; `localizarCaminho`/`indexarVersao` passam a ver anexos. Os nós entram no `v0` pela ingestão (`historico.mjs`).

## 4. Revogação de anexo/tabela: como marcar o nó
Mesma regra do artigo: `revogado: true`, `texto: "(Revogado)"`, `origem` da revogadora, filhos em cascata; `id`, `desFixo` e posição ficam; o bruto anterior permanece na versão anterior e na linha do tempo ("Revogado pela…"). Rótulo ocupado: `insert_node` do mesmo `anexo-X` e `replace_node` sobre revogado são recusados; também sobre anexo VETADO (41114, 40791; a exceção `ocupouPosicaoDeVetado` de 17/11 foi dada para artigos e não se estende por analogia). Revogar ITEM ou tabela dentro de anexo NUNCA marca o anexo (mesmo erro do `revoke_lei` de 47547). **Bloqueio:** `revoke_node` de anexo não tem exemplo real; de tabela há 5, mas sem nó `tabela` e sem a LC 7 legível; até lá, `altera_anexo{acao:'revoga'}` (falha explícita).

## 5. Painel e histórico
`revisao-comandos.mjs`: situação nova `anexo_nao_aplicado` (selo âmbar, entre as "A ver"); `semEfeito` deixa de contar `altera_anexo`; corrigir "lei-alvo não identificada". `historico.mjs`: `anexosAlterados` passa a vir dos comandos `altera_anexo` (uma fonte) com objeto, rótulo e forma; `altera_anexo` fora de `recusados`; `slugDoRotulo('anexo')`; `chaveParaId` entende `anexo ii`; `aConferir` com ids de anexo. Consulta: o aviso diz o objeto ("a Tabela IV da LC 7"). Qualquer mudança em `norma-core.js` espelha em `norma-simulacao.html`.

## 6. Testes com texto real (todos devem falhar contra o código de hoje)
T1 detector reconhece 36060/1-2, 41578/2, 35933/2, 38309/1, 34244/5, 33619/1 ("Anexo 1.2", "9.1") e Tabelas da LC 7 (39825/12, 40426/2, 46293/2-4, 47758/1) — hoje 8 de 8 sem detecção. T2 39825/12 → `altera_anexo{tabela ii, substitui, objeto_inteiro}` ligado ao `anexo-i` (parcial:false); /14 → anexo-ii; /13 renomeação. T3 46293/2 → `item_dentro`, `tabela iv`, parcial:true; 51577/3 → parcial:true. T4 31027/8 e 32301/1 NÃO geram `replace_text` de "art. 18". T5 47547/6 → `altera_anexo` COM `leiAlvo lc 942/2022`, sem `revoke_lei`. T6 negativos de remissão (51498 e 25 denominações, 42216/15-16, 49707/18, 51150/47, 36114/2, 34142/4, 34244/3, 51911/72, 27976/9): 0 falsos positivos nos 51 e 174/174 nos demais. T7 revogação plural (F3.3): 46293/4, 43501/3, sintéticos. T8 histórico: anexo-i…anexo-viii reais de 49707 com ids distintos; `altera_anexo` não gera `naoAplicadas`. T9 (F3.6) 40830/2 → LC 740. T10 (F3.6, sintético) `revoke_node` de anexo. `VERSAO_ESTRUTURADOR` não muda; rodar `teste_minuta` e `teste_leis_ordinarias`.

## 7. Decisões do mantenedor (entrevista, com recomendação do agente)
1. "Fica alterada a Tabela II … conforme Anexo I desta LC" substitui o bloco inteiro? O verbo decide ou o conteúdo do anexo da alteradora (sem pontilhado nem "(NR)" = inteiro)? Recomenda: o conteúdo decide; parcial sempre humano.
2. Alteração de inciso ou subitem dentro de tabela é aplicável se a tabela for nó? Recomenda: não, sempre `altera_anexo` + aviso.
3. Revogação de ANEXO inteiro (0 exemplos): marcar como artigo? Recomenda sim, só implementar com exemplo.
4. Revogação de TABELA inteira (5 reais): aplicar só com nó `tabela` de rótulo literal "Tabela N"? Recomenda rótulo literal ou humano.
5. Rótulo do anexo incluído (42994/36 "Anexo III-C … conforme o Anexo I"): o nó novo leva o rótulo da frase e o corpo sem a linha "ANEXO I"?
6. Listas de anexo repetitivas (30 efemérides/eventos recentes nas Leis 10.903 e 10.904; ~30 alterações por ano): continuar só avisando ou formato próprio de "linha de lista"?
7. Anexo gráfico/mapa (29 artigos): só avisar; `replace_node` nunca sobre anexo gráfico.
8. Revogação plural/em lista (95 artigos): rodada própria, prioridade geral, antes de F3.3.
9. LC 7/1973 (.doc, 21 normas citam anexo/tabela dela) e Leis 6.309, 10.903, 10.904: priorizar extração de `.doc` e coleta do texto? (decisão da ingestão)
10. Ligação ao anexo da alteradora: "Anexo desta Lei" sem rótulo com mais de 1 anexo → humano; com exatamente 1 → ligado.
11. Consulta: lei-base que recebeu `replace_node`/`insert_node` de anexo leva "texto vigente apurado" com ressalva "anexo apurado pela lei X"?
12. Nós `tabela` (decisão 39 pendente) são pré-requisito de qualquer aplicação em tabela; recomenda não implementar o `parseMinuta` antes da Fase 0 de orçamento e do texto da LC 7.

## 8. Fases
- **F3.1 Detecção correta:** `extrairAlvosDeAnexo` (core, pura); `artigosQueMexemEmAnexo` usa o mesmo núcleo. Término: T1 e T6 verdes; recall 174/174 e 0 falsos positivos na remissão; bateria idêntica; `normateste.mjs` byte a byte.
- **F3.2 `altera_anexo` + guardas:** operação, guarda antes do `nrBloco` (T4), `leiAlvo` no ramo de anexo (T5), `revisao-comandos`, `historico`, espelho no simulador. Término: T3, T4, T5, T8 verdes; nenhum `replace_text` de anexo no acervo de comandos.
- **F3.3 Revogação plural e em lista** (rodada própria, geral). Término: T7 verde; `nao_classificado` "Ficam revogad…" cai de 95 a perto de 0, com os restantes explicados.
- **F3.4 Ligação ao anexo da alteradora:** `opts.anexosDaAlteradora`, `blocoDaAlteradora`, `parcial`. Término: T2 e T3 com ids reais; 14 ligados e 7 sem texto reportados.
- **F3.5 Dados para aplicar (sem mudar o motor):** anexos na árvore de versões, cabeçalho "Anexo N à Lei Complementar nº N" (LC 626), extração `.doc` da LC 7, flag `anexosDaBase`. Término: pelo menos um par real com anexo legível dos dois lados (hoje 0).
- **F3.6 Aplicação mínima** (só com F3.5 e as decisões 1, 2, 5, 7, 11): `replace_node`, `insert_node`/`revoke_node` de anexo inteiro, nunca célula. Término: T9 e T10 verdes.

## 9. O que não foi verificado
Bateria completa (só 4 testes ligados ao tema, verdes); nenhum texto de LC 7, Lei 6.309, 10.903 ou 10.904 (formas medidas só do lado da alteradora); se os anexos de 40830 são diagramas sem texto útil; antigas por OCR; efeito de `altera_anexo` em `estrutura.mjs`/`gerar-revisao.mjs` (leitura por grep).
