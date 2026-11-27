<!-- Relatório de agente de pesquisa (somente leitura), 27/11/2026. INSUMO, não autoridade: afirmações que sustentam decisão são reconferidas (regra 12c). Ver PLANO-REVISOES.md. -->
# F — Histórico de versões incompleto (leis e alteradoras recentes) — levantamento de 27/11/2026

Agente de pesquisa, somente leitura. Recortes, contagens e scripts temporários em `/tmp/claude-0/-home-user-norma-poa/211bc04a-a478-5c82-9b22-6e43f6487433/scratchpad/levantamento/` (`f1`…`f20.mjs`; nada foi escrito no repositório). Tudo recalculado a partir de `dados/historico/sapl/*.json`, do catálogo e dos textos; reexecutei a lógica de `apurarHistorico` (importando só `norma-core.js`, `historico.mjs` e `extracao-texto.mjs`, que são puros) para ver os comandos recusados com texto de origem.

## 0. Resumo executivo (o que o mantenedor precisa saber)

1. **Recorte medido:** das 207 leis com histórico incompleto, **100 têm a lei-base sancionada desde 03/02/2009** (as alteradoras de uma lei-base são sempre posteriores, logo também recentes). Elas somam **144 pares (lei-base, alteradora) pendentes** — 865 dispositivos em `aConferir`. Das outras 107 incompletas (antigas) nada aqui.
2. **Mais de um terço dos pares pendentes não é pendência de verdade.** 42 pares (RUIDO) só têm comandos de OUTRAS leis recusados como "lei-alvo diferente"; 8 (FALSO) são pares que a alteradora nem altera (só cita a lei-base em "alterada pela…"); 2 são vínculo da fonte da lei com ela mesma; 3 revogam a própria lei-base (já tratado em outro lugar); 17 são alteração/revogação de anexo ou tabela (já registrada em `anexosAlterados`, decisão 37). **72 de 144 pares (50%) somem só com correções determinísticas no `historico.mjs` (sem tocar o core).** E **~573 dos ~807 endereços "a conferir" (71%) são falsos**: endereço de dispositivo de outra lei carimbado como dúvida na lei-base (ex.: LC 946 altera a LC 434; os endereços `art-53-A/inc-III` e `art-111/par-5` caem em "a conferir" da LC 612).
3. **O segundo maior bloco é uma lacuna de funcionalidade com exemplos reais: alteração de EMENTA** ("Fica alterada a ementa da Lei nº X, conforme segue: “…” (NR)"): **32 pares**, hoje `indeterminado`.
4. **Só 8 pares são "texto da alteradora ainda não baixado" e só 1 deles se resolve com a fila**: 6 não têm arquivo no SAPL (`sem_texto`), 1 é `erro_definitivo`, 1 está na fila. **A fila de download não resolve este recorte.** Ela resolve outra coisa: 103 leis-base recentes aguardando texto (75 com arquivo + 27 link SIREL + 1 já baixada sem extração; nenhuma em `sem-texto.tsv`).
5. **Cenários (leis completas, de 100):** hoje 0 → só correções determinísticas **46** → + textos que ainda chegam **50** → + ementa, agrupador, revogação de alínea/lista **75** → + conserto do endereço duplicado, par falso e duplicata **81**. **Sobram 19 leis (19%) para humano ou defeito de fonte.**
6. **Achado de bug do motor:** o comando que altera inciso/alínea de parágrafo (ex.: "Fica alterado o inc. III do § 4º do art. 4º") é classificado `insert_node` e recusado com **endereço-pai duplicado** ("§ 4º do inc. iii do § 4º do art. 4º") mesmo quando o dispositivo existe na base. **7 pares reais**, todos com o mesmo padrão de bloco em cascata `Art… / § … / inc. …`.

## 1. Metodologia e fidelidade

- Universo: `naoAplicadas` e `aConferir` de `dados/historico/sapl/*.json` (278 leis; 207 incompletas). Data da lei-base lida do rótulo (≥ 2009-02-03): **100 leis recentes incompletas**, com **144 entradas em `naoAplicadas`** (uma por alteradora): `aplicada_em_parte` 83 · `comando_recusado` 27 · `comando_nao_reconhecido` 26 · `texto_indisponivel` 8. Origem do par: só vínculo da fonte 50 · vínculo + ementa 82 · só ementa 12.
- Reexecutei o laço de `apurarHistorico` por lei (mesma ordem, mesmo `leiBaseIndex` e `leiBaseConfere`) e conferi que as `naoAplicadas` reproduzem. De cada recusa extraí: operação, motivo, `leiAlvo`, e o trecho de introdução (`raw`) — é daí que vêm os trechos citados abaixo.
- Classes (do prompt): **1** regra determinística sem humano · **2** IA propõe/humano amostra · **3** humano ponto a ponto · **4** defeito da fonte.

## 2. Famílias de causa — contagem (soma fecha em 144 pares / 100 leis)

| Família (principal) | Pares | O que é | Classe | Resolve com |
|---|---|---|---|---|
| RUIDO | 42 | alteradora real; os comandos recusados são de OUTRAS leis ("comando aponta pra lei-alvo diferente…", `revoke_lei`/`revoke_node` alheios) | 1 | código (`historico.mjs`) |
| FALSO | 10 | par que a alteradora não altera: 8 só com comandos de outras leis, 2 com lei-alvo ilegível (id 36000<47275, 38022<39249) | 1 | código |
| AUTO | 2 | vínculo da fonte da lei com ela mesma (42380, 42591) | 1 | filtro `principal === relacionada` |
| REVOGA_BASE | 3 | a alteradora revoga a própria lei-base inteira (`revoke_lei` com lei-alvo = base) | 1 | código |
| ANEXO | 17 | alteração/revogação de anexo, tabela ou item de anexo (14 orçamentárias/planos + 1 anexo excluído + 2 revogações de Anexo/Tabela) | 1 (sair da pendência) → 3 | código + decisão 37/41 |
| EMENTA | 30 | "Fica alterada a ementa da Lei X, conforme segue: “…” (NR)" → `indeterminado` (mais 2 pares com ementa + endereço, contados em ENDERECO) | 1 após decisão | código novo |
| AGRUP | 1 | inclusão/renomeação de Capítulo/Seção/Subseção/Título (36316<36647; outros 12 pares com agrupador estão em EMENTA/ENDERECO/ANEXO) | 1/3 após decisão | código novo |
| REV_AL | 2 | `Fica revogada a al. j do inc. V do art. 35 da Lei nº 12.420` recusada pela trava da decisão 45 | 1 | código |
| ENDERECO | 14 | ver subtabela | misto | misto |
| JA_EXISTE | 3 | `insert_node` recusado "já existe" (duplicata da mesma alteradora; "art. 6ª"; LOA) | misto | misto |
| REV_INEXISTENTE | 5 | revoga dispositivo que não existe na versão apurada | 3 | humano |
| LC1075 | 4 | LC 1.075/2026 (promulgação parcial, `revisar`) altera/revoga em lista a LC 612, 720, 764, 946 | 3 | humano |
| FONTE | 2 | arquivo da LC 790 com 29 caracteres; arquivo da LC 738 que é só mapa | 4 | nada |
| DATA | 1 | `desetembro de 2012` (dia e espaço perdidos) | 2 | IA propõe |
| TEXTO | 8 | texto da alteradora não obtido | 4 (7) / tempo (1) | §3.1 |
| **Total** | **144** | | | |

Os pares com duas famílias (ementa+lista de revogação, ementa+agrupador, ementa+endereço ×2, endereço+lista, endereço+já-existe) foram contados uma vez, na família principal da tabela. O detalhe por par está na §4.

### Subtabela do ENDERECO (14 pares, conferidos um a um)
| Subcausa | Pares | Evidência | Classe |
|---|---|---|---|
| Endereço-pai duplicado (bug) | 7 | 36216<41342, 36216<40111, 38249<45657, 40111<47888, 43154<46551, 43154<49604 (parte), 50093<51125 | 1 (código) |
| Base mal lida / defeituosa | 3 | 42382 (1 artigo lido), 41676 ("Art. 29 Fica…" sem ponto), 40514 (29 caracteres) | 3 / 4 |
| Cascata de agrupador não aplicado | 1 | 36316<50376 (art. 134-A nasce na Seção VI-A da LC 640; 43154<49604 também cita art. 15-A ausente) | 3 (depende de AGRUP) |
| Orçamentária (decisão 41) | 1 | 42380<42727 | 3 |
| Espaçamento destruído no arquivo da fonte | 1 | 36316<37562 ("Compleme ntar", "200 9", "24 -A") | 4 |
| Inserção de artigo depois do último | 1 | 47235<48329 | 1 (após decisão: "inserção de artigo-irmão na raiz" tinha só exemplo sintético; este é real) |

## 3. Três eixos pedidos
### 3.1 O que se resolve SOZINHO com o tempo
**Quase nada deste recorte.** Dos 8 pares `texto_indisponivel`: 44397, 47145, 46106, 40513, 43649, 51969 estão em `dados/catalogo/sem-texto.tsv` (o SAPL **não tem arquivo**: `texto.situacao = sem_texto`; a fila de download não os pega); 40363 (LC 781) está `erro_definitivo` no `_indice.jsonl`; **só 38218 (Lei 11.270/2012) está na fila**. Logo a regra "quando o texto chegar, o histórico fecha" vale para **1 de 8**. O que a fila resolve é o outro grupo: **103 leis-base recentes** sem texto (75 `arquivo` + 27 `link_observacao`/SIREL + 1 `baixado`) que hoje contam entre as 914 — ao chegarem, entrarão na mesma distribuição de famílias abaixo (nesta amostra, 100 de 154 leis recentes com texto saíram incompletas = 65%; com as correções, caem para ~19%).
Fila geral: 5.077 arquivos, ~356/dia, ~15 dias (`dados/SITUACAO.md`); `prioridade-download.txt` só tem 6 ids (orçamentárias). Os 6 `sem_texto` recentes dependem de outra fonte (o Diário Oficial; 51969 é a Lei 14.697 de 13/11/2026 — vale checar se `dados/dopa/` traz o ato).

### 3.2 O que exige correção de código (resumo; regras na §5)
RUIDO, FALSO, AUTO, REVOGA_BASE, ANEXO (tirar da pendência), ENDERECO duplicado, JA_EXISTE-duplicata, EMENTA, AGRUP, REV_AL, REV_LISTA, inserção no fim.

### 3.3 O que exige humano / não tem remédio
REV_INEXISTENTE (5 pares, 5 leis), LC1075 (4 pares, 4 leis), FONTE (2), bases mal lidas (2), cascata (2), orçamentárias (2), espaçamento (1), DATA (1, IA). Ver estimativa na §6.

## 4. Tabela por par (lei-base, alteradora) — 144 linhas
Cada linha: causa verificada (trecho de `raw` do comando ou conferência no texto) e classe. Colunas "família" seguem a §2. As causas que não trazem trecho entre aspas foram agrupadas pela regra do motor que as produz (RUIDO, FALSO…), porque o trecho é "outra lei" por definição do erro e não mostra a lei-base.

| lei-base | rótulo | alteradora | motivo | família | causa verificada | classe |
|---|---|---|---|---|---|---|
| 35980 | LC 611 | 38218 | texto_indisponivel | TEXTO | o texto da alteradora ainda não foi obtido | tempo (na fila) |
| 36000 | LC 612 | 42031 | em_parte | RUIDO | só há comandos de OUTRAS leis recusados como "lei-alvo diferente"/revoke_lei alheio; a alteradora aplicou o que era desta lei | 1 |
| 36000 | LC 612 | 44102 | em_parte | RUIDO | só há comandos de OUTRAS leis recusados como "lei-alvo diferente"/revoke_lei alheio; a alteradora aplicou o que era desta lei | 1 |
| 36000 | LC 612 | 47275 | em_parte | ENDERECO/par falso | alteradora altera LC 703 (cita "LC nº 703, e alterações posteriores", sem data); a lei-alvo não resolve e o comando cai como insert_node na LC 612 | 1 |
| 36000 | LC 612 | 47833 | em_parte | RUIDO | só há comandos de OUTRAS leis recusados como "lei-alvo diferente"/revoke_lei alheio; a alteradora aplicou o que era desta lei | 1 |
| 36000 | LC 612 | 51485 | nao_reconhecido | LC1075 | LC 1.075/2026 (promulgação parcial, "revisar"): art. 223 "Fica alterado o inc. VII do art. 2º da LC 612 … “Art. 2º ……”" — cabeçalho com reticências sem aspas de abertura (decisão 11) | 3 |
| 36216 | LC 625 | 38330 | em_parte | EMENTA | "Fica alterada a ementa da Lei X, conforme segue: “…” (NR)" → comando indeterminado ("bloco sem citação de dispositivo-alvo") | 1 (após decisão) |
| 36216 | LC 625 | 40111 | em_parte | ENDERECO/duplicado | "Fica alterado o inc. I do parágrafo único do art. 17": endereço-pai montado em duplicidade ("parágrafo único do inc. i do parágrafo único do art. 17") | 1 |
| 36216 | LC 625 | 41342 | recusado | ENDERECO/duplicado | "inc. III do § 4º do art. 4º": o dispositivo existe na base (art-4/par-4/inc-III); o motor recusa com pai "§ 4º do inc. iii do § 4º do art. 4º" | 1 |
| 36255 | LC 626 | 38791 | nao_reconhecido | ANEXO | a alteração é de anexo/tabela (já registrada em `anexosAlterados`, decisão 37) — ou revogação de anexo/tabela/item (decisões 37, 41) | 1→3 |
| 36316 | LC 628 | 36647 | em_parte | EMENTA+REV_LISTA | "Fica alterada a ementa da Lei X, conforme segue: “…” (NR)" → comando indeterminado ("bloco sem citação de dispositivo-alvo"); revogação em lista ("§§ …", "inc. II do § 2º e § 3º do art. 42;") não interpretada | 1 (após decisão) / 1 por item (decisão 46) |
| 36316 | LC 628 | 37562 | em_parte | ENDERECO+JA_EXISTE/espaçamento | "Fica incluído art. 24 -A na Lei Compleme ntar nº 628, de 200 9": texto da fonte com espaços dentro de palavras e números | 4 |
| 36316 | LC 628 | 43290 | em_parte | RUIDO | só há comandos de OUTRAS leis recusados como "lei-alvo diferente"/revoke_lei alheio; a alteradora aplicou o que era desta lei | 1 |
| 36316 | LC 628 | 50376 | recusado | ENDERECO/cascata | art. 134-A foi incluído pela LC 640/2010 em "Seção VI-A" (agrupador, comando indeterminado); sem a Seção o art. 134-A não nasce e a LC 1.048 não acha o pai | 3 |
| 36372 | LC 630 | 40641 | nao_reconhecido | ANEXO | a alteração é de anexo/tabela (já registrada em `anexosAlterados`, decisão 37) — ou revogação de anexo/tabela/item (decisões 37, 41) | 1→3 |
| 36841 | LC 646 | 39395 | nao_reconhecido | FONTE | arquivo da LC 738 é só mapa (números soltos); sem texto de lei (decisão 36: 2 arquivos) | 4 |
| 36841 | LC 646 | 40350 | nao_reconhecido | FALSO | LC 780 altera o Anexo 1.1 da LC 434 "alterada pela LC 646"; não altera a LC 646 | 1 |
| 36892 | LC 650 | 38041 | em_parte | EMENTA | "Fica alterada a ementa da Lei X, conforme segue: “…” (NR)" → comando indeterminado ("bloco sem citação de dispositivo-alvo") | 1 (após decisão) |
| 37041 | LC 660 | 40682 | recusado | FALSO | a alteradora não altera esta lei (cita só "alterada pela" ou outra lei); só há comandos de outras leis | 1 |
| 37041 | LC 660 | 44372 | em_parte | RUIDO | só há comandos de OUTRAS leis recusados como "lei-alvo diferente"/revoke_lei alheio; a alteradora aplicou o que era desta lei | 1 |
| 37041 | LC 660 | 44374 | em_parte | RUIDO | só há comandos de OUTRAS leis recusados como "lei-alvo diferente"/revoke_lei alheio; a alteradora aplicou o que era desta lei | 1 |
| 37042 | LC 661 | 43828 | em_parte | RUIDO | só há comandos de OUTRAS leis recusados como "lei-alvo diferente"/revoke_lei alheio; a alteradora aplicou o que era desta lei | 1 |
| 37043 | LC 662 | 47235 | em_parte | REV_INEXISTENTE | revoga dispositivo que não existe na versão apurada (ex. "art. 19-A", "art. 10-A", "§ 1º do art. 8º") | 3 |
| 37090 | LC 663 | 39857 | nao_reconhecido | ANEXO | a alteração é de anexo/tabela (já registrada em `anexosAlterados`, decisão 37) — ou revogação de anexo/tabela/item (decisões 37, 41) | 1→3 |
| 37103 | LC 666 | 39221 | recusado | EMENTA | "Fica alterada a ementa da Lei X, conforme segue: “…” (NR)" → comando indeterminado ("bloco sem citação de dispositivo-alvo") | 1 (após decisão) |
| 37109 | LC 667 | 40370 | recusado | FALSO | a alteradora não altera esta lei (cita só "alterada pela" ou outra lei); só há comandos de outras leis | 1 |
| 37422 | LC 677 | 38051 | recusado | EMENTA | "Fica alterada a ementa da Lei X, conforme segue: “…” (NR)" → comando indeterminado ("bloco sem citação de dispositivo-alvo") | 1 (após decisão) |
| 38022 | LC 687 | 39249 | em_parte | ENDERECO/par falso | alteradora altera a LC 7/1973; "LeiComplementar nº 7, de 1973" (palavras coladas) impede o reconhecimento da lei-alvo; a base só é citada de passagem | 1 |
| 38022 | LC 687 | 41717 | em_parte | RUIDO | só há comandos de OUTRAS leis recusados como "lei-alvo diferente"/revoke_lei alheio; a alteradora aplicou o que era desta lei | 1 |
| 38249 | LC 694 | 40683 | em_parte | JA_EXISTE/duplicata | LC 797 insere o art. 69-A; a recusa "já existe" vem da própria LC 797 (origem do estado do art-69-A) — comando repetido | 1 |
| 38249 | LC 694 | 45657 | recusado | ENDERECO/duplicado | "inc. I do parágrafo único do art. 69-A": mesmo defeito | 1 |
| 38249 | LC 694 | 50386 | em_parte | EMENTA | "Fica alterada a ementa da Lei X, conforme segue: “…” (NR)" → comando indeterminado ("bloco sem citação de dispositivo-alvo") | 1 (após decisão) |
| 38249 | LC 694 | 44397 | texto_indisponivel | TEXTO | o texto da alteradora ainda não foi obtido | 4 (SAPL sem arquivo) |
| 38249 | LC 694 | 47145 | texto_indisponivel | TEXTO | o texto da alteradora ainda não foi obtido | 4 (SAPL sem arquivo) |
| 38330 | LC 700 | 40111 | recusado | FALSO | a alteradora não altera esta lei (cita só "alterada pela" ou outra lei); só há comandos de outras leis | 1 |
| 38364 | LC 701 | 42635 | em_parte | RUIDO | só há comandos de OUTRAS leis recusados como "lei-alvo diferente"/revoke_lei alheio; a alteradora aplicou o que era desta lei | 1 |
| 38364 | LC 701 | 50015 | em_parte | RUIDO | só há comandos de OUTRAS leis recusados como "lei-alvo diferente"/revoke_lei alheio; a alteradora aplicou o que era desta lei | 1 |
| 38364 | LC 701 | 51556 | em_parte | RUIDO | só há comandos de OUTRAS leis recusados como "lei-alvo diferente"/revoke_lei alheio; a alteradora aplicou o que era desta lei | 1 |
| 38523 | LC 703 | 39392 | nao_reconhecido | DATA | "Fica revogado o § 2º do art. 2º da LC nº 703, desetembro de 2012" (dia e espaço perdidos): lei-alvo não reconhecida | 2 |
| 38523 | LC 703 | 47275 | em_parte | RUIDO | só há comandos de OUTRAS leis recusados como "lei-alvo diferente"/revoke_lei alheio; a alteradora aplicou o que era desta lei | 1 |
| 38712 | LC 707 | 40706 | recusado | REVOGA_BASE | a alteradora revoga A PRÓPRIA lei-base inteira (revoke_lei) — não é pendência de texto | 1 |
| 38893 | LC 714 | 39221 | em_parte | EMENTA | "Fica alterada a ementa da Lei X, conforme segue: “…” (NR)" → comando indeterminado ("bloco sem citação de dispositivo-alvo") | 1 (após decisão) |
| 39106 | LC 720 | 51485 | nao_reconhecido | LC1075 | mesma norma: "XXXIV – o art. 3º da LC 720" em lista de revogação | 3 |
| 39138 | LC 721 | 42631 | em_parte | REV_INEXISTENTE | revoga dispositivo que não existe na versão apurada (ex. "art. 19-A", "art. 10-A", "§ 1º do art. 8º") | 3 |
| 39138 | LC 721 | 40363 | texto_indisponivel | TEXTO | o texto da alteradora ainda não foi obtido | 4 (erro definitivo) |
| 39220 | LC 726 | 39392 | nao_reconhecido | FALSO | a LC 737 só cita a LC 726 em "alterada pela LC nº 726"; revoga § 2º do art. 2º da LC 703. Par vindo da fonte/ementa é falso | 1 |
| 39223 | LC 728 | 40514 | nao_reconhecido | FONTE | arquivo da LC 790 com 29 caracteres | 4 |
| 39422 | LC 740 | 39697 | em_parte | EMENTA | "Fica alterada a ementa da Lei X, conforme segue: “…” (NR)" → comando indeterminado ("bloco sem citação de dispositivo-alvo") | 1 (após decisão) |
| 39422 | LC 740 | 46106 | texto_indisponivel | TEXTO | o texto da alteradora ainda não foi obtido | 4 (SAPL sem arquivo) |
| 39600 | LC 743 | 40856 | recusado | FALSO | a alteradora não altera esta lei (cita só "alterada pela" ou outra lei); só há comandos de outras leis | 1 |
| 39694 | LC 744 | 47235 | em_parte | REV_INEXISTENTE | revoga dispositivo que não existe na versão apurada (ex. "art. 19-A", "art. 10-A", "§ 1º do art. 8º") | 3 |
| 39862 | LC 757 | 41982 | em_parte | REV_INEXISTENTE | revoga dispositivo que não existe na versão apurada (ex. "art. 19-A", "art. 10-A", "§ 1º do art. 8º") | 3 |
| 40062 | LC 762 | 41306 | em_parte | RUIDO | só há comandos de OUTRAS leis recusados como "lei-alvo diferente"/revoke_lei alheio; a alteradora aplicou o que era desta lei | 1 |
| 40084 | LC 764 | 51485 | nao_reconhecido | LC1075 | mesma norma: "XXXVIII – os arts. 2º, 3º e 4º da LC 764" em lista de revogação | 3 |
| 40111 | LC 765 | 42468 | em_parte | RUIDO | só há comandos de OUTRAS leis recusados como "lei-alvo diferente"/revoke_lei alheio; a alteradora aplicou o que era desta lei | 1 |
| 40111 | LC 765 | 47888 | em_parte | ENDERECO/duplicado | "inc. II do § 1º do art. 63": mesmo defeito | 1 |
| 40237 | LC 770 | 40513 | texto_indisponivel | TEXTO | o texto da alteradora ainda não foi obtido | 4 (SAPL sem arquivo) |
| 40278 | LC 773 | 40405 | em_parte | RUIDO | só há comandos de OUTRAS leis recusados como "lei-alvo diferente"/revoke_lei alheio; a alteradora aplicou o que era desta lei | 1 |
| 40303 | LC 775 | 40377 | recusado | FALSO | a alteradora não altera esta lei (cita só "alterada pela" ou outra lei); só há comandos de outras leis | 1 |
| 40350 | LC 780 | 43649 | texto_indisponivel | TEXTO | o texto da alteradora ainda não foi obtido | 4 (SAPL sem arquivo) |
| 40514 | LC 790 | 42747 | recusado | ENDERECO/base defeituosa | texto da LC 790 (id 40514) tem 29 caracteres ("LC 790" ×4): base sem artigos | 4 |
| 40706 | LC 798 | 42519 | em_parte | EMENTA | "Fica alterada a ementa da Lei X, conforme segue: “…” (NR)" → comando indeterminado ("bloco sem citação de dispositivo-alvo") | 1 (após decisão) |
| 40706 | LC 798 | 49707 | em_parte | RUIDO | só há comandos de OUTRAS leis recusados como "lei-alvo diferente"/revoke_lei alheio; a alteradora aplicou o que era desta lei | 1 |
| 41098 | LC 810 | 41342 | em_parte | RUIDO | só há comandos de OUTRAS leis recusados como "lei-alvo diferente"/revoke_lei alheio; a alteradora aplicou o que era desta lei | 1 |
| 41098 | LC 810 | 42994 | em_parte | RUIDO | só há comandos de OUTRAS leis recusados como "lei-alvo diferente"/revoke_lei alheio; a alteradora aplicou o que era desta lei | 1 |
| 41098 | LC 810 | 43967 | em_parte | RUIDO | só há comandos de OUTRAS leis recusados como "lei-alvo diferente"/revoke_lei alheio; a alteradora aplicou o que era desta lei | 1 |
| 41098 | LC 810 | 44066 | em_parte | EMENTA | "Fica alterada a ementa da Lei X, conforme segue: “…” (NR)" → comando indeterminado ("bloco sem citação de dispositivo-alvo") | 1 (após decisão) |
| 41098 | LC 810 | 47274 | em_parte | RUIDO | só há comandos de OUTRAS leis recusados como "lei-alvo diferente"/revoke_lei alheio; a alteradora aplicou o que era desta lei | 1 |
| 41342 | LC 817 | 42994 | em_parte | RUIDO | só há comandos de OUTRAS leis recusados como "lei-alvo diferente"/revoke_lei alheio; a alteradora aplicou o que era desta lei | 1 |
| 41438 | LC 821 | 48329 | em_parte | RUIDO | só há comandos de OUTRAS leis recusados como "lei-alvo diferente"/revoke_lei alheio; a alteradora aplicou o que era desta lei | 1 |
| 41644 | L 12.411 | 42660 | recusado | AGRUP+EMENTA | inclusão/renomeação de Capítulo/Seção/Subseção/Título → indeterminado; "Fica alterada a ementa da Lei X, conforme segue: “…” (NR)" → comando indeterminado ("bloco sem citação de dispositivo-alvo") | 1/3 (após decisão) / 1 (após decisão) |
| 41676 | L 12.420 | 42518 | recusado | ENDERECO/base mal lida | base: "Art. 29 Fica definido…" (sem ponto/º) não vira artigo; só 11 artigos lidos | 3 |
| 41676 | L 12.420 | 46278 | recusado | REV_AL | revogação com "al. X do inc. Y do art. Z" legível, recusada pela trava da decisão 45 | 1 |
| 41859 | L 12.479 | 47227 | em_parte | EMENTA | "Fica alterada a ementa da Lei X, conforme segue: “…” (NR)" → comando indeterminado ("bloco sem citação de dispositivo-alvo") | 1 (após decisão) |
| 41955 | L 12.501 | 42994 | recusado | JA_EXISTE/typo | "Fica alterado o caput do art. 6ª" (ª no lugar de º) lido como inserção; art. 6º existe | 2 |
| 42120 | L 12.560 | 47151 | em_parte | EMENTA | "Fica alterada a ementa da Lei X, conforme segue: “…” (NR)" → comando indeterminado ("bloco sem citação de dispositivo-alvo") | 1 (após decisão) |
| 42216 | LC 859 | 43346 | em_parte | RUIDO | só há comandos de OUTRAS leis recusados como "lei-alvo diferente"/revoke_lei alheio; a alteradora aplicou o que era desta lei | 1 |
| 42221 | L 12.593 | 48297 | em_parte | RUIDO | só há comandos de OUTRAS leis recusados como "lei-alvo diferente"/revoke_lei alheio; a alteradora aplicou o que era desta lei | 1 |
| 42380 | L 12.655 | 42380 | nao_reconhecido | AUTO | vínculo da fonte "altera" liga a Lei 12.655 a ela mesma | 1 |
| 42380 | L 12.655 | 42727 | recusado | ENDERECO/orçamentária | LOA 12.655, "Art. 3º" com itens numerados sem o rótulo de § (decisão 41) | 3 |
| 42381 | L 12.655 | 42727 | em_parte | JA_EXISTE/orçamentária | LOA: mesmo art. 3º da Lei 12.655 (base 42381) | 3 |
| 42382 | L 12.656 | 45482 | recusado | REV_INEXISTENTE | revoga dispositivo que não existe na versão apurada (ex. "art. 19-A", "art. 10-A", "§ 1º do art. 8º") | 3 |
| 42382 | L 12.656 | 49687 | recusado | ENDERECO/base mal lida | base (Lei 12.656, id 42382) estruturada com 1 só artigo (baseConferida=false) | 3 |
| 42387 | LC 869 | 47275 | em_parte | RUIDO | só há comandos de OUTRAS leis recusados como "lei-alvo diferente"/revoke_lei alheio; a alteradora aplicou o que era desta lei | 1 |
| 42388 | LC 870 | 43543 | recusado | REVOGA_BASE | a alteradora revoga A PRÓPRIA lei-base inteira (revoke_lei) — não é pendência de texto | 1 |
| 42407 | LC 875 | 45238 | em_parte | EMENTA | "Fica alterada a ementa da Lei X, conforme segue: “…” (NR)" → comando indeterminado ("bloco sem citação de dispositivo-alvo") | 1 (após decisão) |
| 42542 | LC 881 | 43542 | em_parte | EMENTA | "Fica alterada a ementa da Lei X, conforme segue: “…” (NR)" → comando indeterminado ("bloco sem citação de dispositivo-alvo") | 1 (após decisão) |
| 42591 | L 12.708 | 42591 | nao_reconhecido | AUTO | vínculo da fonte liga a Lei 12.708 a ela mesma | 1 |
| 42648 | L 12.713 | 43581 | em_parte | RUIDO | só há comandos de OUTRAS leis recusados como "lei-alvo diferente"/revoke_lei alheio; a alteradora aplicou o que era desta lei | 1 |
| 42831 | L 12.742 | 49766 | em_parte | EMENTA | "Fica alterada a ementa da Lei X, conforme segue: “…” (NR)" → comando indeterminado ("bloco sem citação de dispositivo-alvo") | 1 (após decisão) |
| 42833 | L 12.744 | 43083 | em_parte | RUIDO | só há comandos de OUTRAS leis recusados como "lei-alvo diferente"/revoke_lei alheio; a alteradora aplicou o que era desta lei | 1 |
| 42890 | L 12.779 | 43769 | em_parte | RUIDO | só há comandos de OUTRAS leis recusados como "lei-alvo diferente"/revoke_lei alheio; a alteradora aplicou o que era desta lei | 1 |
| 42890 | L 12.779 | 48774 | em_parte | RUIDO | só há comandos de OUTRAS leis recusados como "lei-alvo diferente"/revoke_lei alheio; a alteradora aplicou o que era desta lei | 1 |
| 42894 | L 12.783 | 51833 | em_parte | EMENTA | "Fica alterada a ementa da Lei X, conforme segue: “…” (NR)" → comando indeterminado ("bloco sem citação de dispositivo-alvo") | 1 (após decisão) |
| 42968 | L 12.797 | 43083 | em_parte | RUIDO | só há comandos de OUTRAS leis recusados como "lei-alvo diferente"/revoke_lei alheio; a alteradora aplicou o que era desta lei | 1 |
| 42968 | L 12.797 | 43292 | nao_reconhecido | ANEXO | a alteração é de anexo/tabela (já registrada em `anexosAlterados`, decisão 37) — ou revogação de anexo/tabela/item (decisões 37, 41) | 1→3 |
| 42981 | LC 895 | 45887 | recusado | REVOGA_BASE | a alteradora revoga A PRÓPRIA lei-base inteira (revoke_lei) — não é pendência de texto | 1 |
| 42993 | L 12.801 | 49739 | em_parte | RUIDO | só há comandos de OUTRAS leis recusados como "lei-alvo diferente"/revoke_lei alheio; a alteradora aplicou o que era desta lei | 1 |
| 42994 | LC 897 | 43967 | em_parte | RUIDO | só há comandos de OUTRAS leis recusados como "lei-alvo diferente"/revoke_lei alheio; a alteradora aplicou o que era desta lei | 1 |
| 42994 | LC 897 | 51150 | em_parte | RUIDO | só há comandos de OUTRAS leis recusados como "lei-alvo diferente"/revoke_lei alheio; a alteradora aplicou o que era desta lei | 1 |
| 43154 | L 12.827 | 46551 | em_parte | ENDERECO/duplicado | "inc. V do parágrafo único do art. 7º" / "inc. II do § 1º do art. 8º": mesmo defeito | 1 |
| 43154 | L 12.827 | 47825 | em_parte | AGRUP | inclusão/renomeação de Capítulo/Seção/Subseção/Título → indeterminado | 1/3 (após decisão) |
| 43154 | L 12.827 | 49604 | em_parte | ENDERECO/duplicado + pai ausente | "al. d do inc. I do § 3º do art. 33" duplicado; "§§ 2º e 4º do art. 15-A": art. 15-A ausente na base | 1/3 |
| 43212 | LC 906 | 45807 | em_parte | EMENTA | "Fica alterada a ementa da Lei X, conforme segue: “…” (NR)" → comando indeterminado ("bloco sem citação de dispositivo-alvo") | 1 (após decisão) |
| 43310 | L 12.856 | 49710 | em_parte | EMENTA | "Fica alterada a ementa da Lei X, conforme segue: “…” (NR)" → comando indeterminado ("bloco sem citação de dispositivo-alvo") | 1 (após decisão) |
| 43332 | L 12.865 | 44056 | recusado | REV_AL | revogação com "al. X do inc. Y do art. Z" legível, recusada pela trava da decisão 45 | 1 |
| 43332 | L 12.865 | 48937 | nao_reconhecido | ANEXO | a alteração é de anexo/tabela (já registrada em `anexosAlterados`, decisão 37) — ou revogação de anexo/tabela/item (decisões 37, 41) | 1→3 |
| 43412 | L 12.884 | 43612 | nao_reconhecido | ANEXO | a alteração é de anexo/tabela (já registrada em `anexosAlterados`, decisão 37) — ou revogação de anexo/tabela/item (decisões 37, 41) | 1→3 |
| 43573 | L 12.942 | 44155 | nao_reconhecido | ANEXO | a alteração é de anexo/tabela (já registrada em `anexosAlterados`, decisão 37) — ou revogação de anexo/tabela/item (decisões 37, 41) | 1→3 |
| 43595 | LC 932 | 45238 | em_parte | RUIDO | só há comandos de OUTRAS leis recusados como "lei-alvo diferente"/revoke_lei alheio; a alteradora aplicou o que era desta lei | 1 |
| 43937 | LC 942 | 47547 | recusado | EMENTA | "Fica alterada a ementa da Lei X, conforme segue: “…” (NR)" → comando indeterminado ("bloco sem citação de dispositivo-alvo") | 1 (após decisão) |
| 43937 | LC 942 | 48437 | em_parte | EMENTA | "Fica alterada a ementa da Lei X, conforme segue: “…” (NR)" → comando indeterminado ("bloco sem citação de dispositivo-alvo") | 1 (após decisão) |
| 43937 | LC 942 | 51735 | em_parte | EMENTA | "Fica alterada a ementa da Lei X, conforme segue: “…” (NR)" → comando indeterminado ("bloco sem citação de dispositivo-alvo") | 1 (após decisão) |
| 43967 | L 13.131 | 49739 | em_parte | RUIDO | só há comandos de OUTRAS leis recusados como "lei-alvo diferente"/revoke_lei alheio; a alteradora aplicou o que era desta lei | 1 |
| 43976 | L 13.140 | 46767 | em_parte | EMENTA | "Fica alterada a ementa da Lei X, conforme segue: “…” (NR)" → comando indeterminado ("bloco sem citação de dispositivo-alvo") | 1 (após decisão) |
| 44002 | L 13.151 | 47414 | em_parte | RUIDO | só há comandos de OUTRAS leis recusados como "lei-alvo diferente"/revoke_lei alheio; a alteradora aplicou o que era desta lei | 1 |
| 44071 | LC 945 | 47674 | em_parte | RUIDO | só há comandos de OUTRAS leis recusados como "lei-alvo diferente"/revoke_lei alheio; a alteradora aplicou o que era desta lei | 1 |
| 44102 | LC 946 | 51485 | nao_reconhecido | LC1075 | mesma norma: art. 224 "Fica alterado o caput do art. 23 da LC 946, conforme segue" | 3 |
| 45390 | L 13.340 | 46655 | nao_reconhecido | ANEXO | a alteração é de anexo/tabela (já registrada em `anexosAlterados`, decisão 37) — ou revogação de anexo/tabela/item (decisões 37, 41) | 1→3 |
| 46674 | L 13.550 | 47414 | em_parte | RUIDO | só há comandos de OUTRAS leis recusados como "lei-alvo diferente"/revoke_lei alheio; a alteradora aplicou o que era desta lei | 1 |
| 46755 | L 13.561 | 49952 | em_parte | RUIDO | só há comandos de OUTRAS leis recusados como "lei-alvo diferente"/revoke_lei alheio; a alteradora aplicou o que era desta lei | 1 |
| 47235 | LC 985 | 48329 | em_parte | ENDERECO/inserção no fim | "Fica incluído art. 19 na LC 985": a lei vai até o art. 18; o motor procura "art. 19º" e falha em vez de acrescentar após o último | 1 |
| 47235 | LC 985 | 51142 | recusado | FALSO | a alteradora não altera esta lei (cita só "alterada pela" ou outra lei); só há comandos de outras leis | 1 |
| 47506 | L 13.681 | 51969 | texto_indisponivel | TEXTO | o texto da alteradora ainda não foi obtido | 4 (SAPL sem arquivo) |
| 47586 | L 13.700 | 48937 | nao_reconhecido | ANEXO | a alteração é de anexo/tabela (já registrada em `anexosAlterados`, decisão 37) — ou revogação de anexo/tabela/item (decisões 37, 41) | 1→3 |
| 47672 | L 13.740 | 50010 | recusado | ANEXO | a alteração é de anexo/tabela (já registrada em `anexosAlterados`, decisão 37) — ou revogação de anexo/tabela/item (decisões 37, 41) | 1→3 |
| 47813 | L 13.779 | 49952 | em_parte | RUIDO | só há comandos de OUTRAS leis recusados como "lei-alvo diferente"/revoke_lei alheio; a alteradora aplicou o que era desta lei | 1 |
| 47945 | L 12.477 | 47944 | em_parte | EMENTA | "Fica alterada a ementa da Lei X, conforme segue: “…” (NR)" → comando indeterminado ("bloco sem citação de dispositivo-alvo") | 1 (após decisão) |
| 47945 | L 12.477 | 51500 | em_parte | EMENTA | "Fica alterada a ementa da Lei X, conforme segue: “…” (NR)" → comando indeterminado ("bloco sem citação de dispositivo-alvo") | 1 (após decisão) |
| 48003 | LC 1.005 | 49739 | em_parte | EMENTA | "Fica alterada a ementa da Lei X, conforme segue: “…” (NR)" → comando indeterminado ("bloco sem citação de dispositivo-alvo") | 1 (após decisão) |
| 48855 | LC 1.017 | 48987 | em_parte | RUIDO | só há comandos de OUTRAS leis recusados como "lei-alvo diferente"/revoke_lei alheio; a alteradora aplicou o que era desta lei | 1 |
| 48987 | LC 1.018 | 49634 | nao_reconhecido | ANEXO | a alteração é de anexo/tabela (já registrada em `anexosAlterados`, decisão 37) — ou revogação de anexo/tabela/item (decisões 37, 41) | 1→3 |
| 49161 | L 14.048 | 51885 | em_parte | EMENTA | "Fica alterada a ementa da Lei X, conforme segue: “…” (NR)" → comando indeterminado ("bloco sem citação de dispositivo-alvo") | 1 (após decisão) |
| 49391 | L 14.094 | 49634 | nao_reconhecido | ANEXO | a alteração é de anexo/tabela (já registrada em `anexosAlterados`, decisão 37) — ou revogação de anexo/tabela/item (decisões 37, 41) | 1→3 |
| 49562 | L 13.989 | 49612 | em_parte | EMENTA | "Fica alterada a ementa da Lei X, conforme segue: “…” (NR)" → comando indeterminado ("bloco sem citação de dispositivo-alvo") | 1 (após decisão) |
| 49635 | L 14.155 | 50246 | nao_reconhecido | ANEXO | a alteração é de anexo/tabela (já registrada em `anexosAlterados`, decisão 37) — ou revogação de anexo/tabela/item (decisões 37, 41) | 1→3 |
| 49707 | LC 1.033 | 49739 | em_parte | RUIDO | só há comandos de OUTRAS leis recusados como "lei-alvo diferente"/revoke_lei alheio; a alteradora aplicou o que era desta lei | 1 |
| 49707 | LC 1.033 | 50200 | recusado | ANEXO | a alteração é de anexo/tabela (já registrada em `anexosAlterados`, decisão 37) — ou revogação de anexo/tabela/item (decisões 37, 41) | 1→3 |
| 49707 | LC 1.033 | 50699 | nao_reconhecido | ANEXO | a alteração é de anexo/tabela (já registrada em `anexosAlterados`, decisão 37) — ou revogação de anexo/tabela/item (decisões 37, 41) | 1→3 |
| 49739 | LC 1.037 | 51556 | recusado | EMENTA | "Fica alterada a ementa da Lei X, conforme segue: “…” (NR)" → comando indeterminado ("bloco sem citação de dispositivo-alvo") | 1 (após decisão) |
| 50093 | L 14.235 | 51125 | em_parte | ENDERECO/duplicado | "inc. III do § 1º do art. 1º": mesmo defeito | 1 |
| 50787 | L 14.429 | 51387 | nao_reconhecido | ANEXO | a alteração é de anexo/tabela (já registrada em `anexosAlterados`, decisão 37) — ou revogação de anexo/tabela/item (decisões 37, 41) | 1→3 |
| 50787 | L 14.429 | 51809 | nao_reconhecido | ANEXO | a alteração é de anexo/tabela (já registrada em `anexosAlterados`, decisão 37) — ou revogação de anexo/tabela/item (decisões 37, 41) | 1→3 |
| 50808 | LC 1.064 | 51276 | em_parte | EMENTA | "Fica alterada a ementa da Lei X, conforme segue: “…” (NR)" → comando indeterminado ("bloco sem citação de dispositivo-alvo") | 1 (após decisão) |

## 5. Regras propostas (classe 1 e 2)

Todas ficam em `ingestao/historico.mjs` (puro) salvo as marcadas "core". Medir antes/depois: rodar `gerar-historico.mjs` (a sessão principal, não eu) e comparar `dados/historico/_resumo.json` + `naoAplicadas`/`aConferir` por lei; rodar a bateria inteira antes/depois e `teste_historico.mjs` (28), `teste_versionamento.mjs` (34); teste novo tem de FALHAR no código antigo.

### R1 — Comando de OUTRA lei não é pendência desta (RUIDO, FALSO) — 42+10 pares
- **Gatilho:** entrada de `r.log` cujo erro é "comando aponta pra lei-alvo diferente…" ou "comando de revogação aponta pra lei-alvo diferente…", ou `revoke_lei` com lei-alvo ≠ base, **e** `leiAlvo` resolvido por chave (`chave` ≠ base e `daBase(leiAlvo)` falso). Tirá-la de `recusados` (como já é feito com `nao_classificado`).
- **Efeito colateral a corrigir junto:** hoje `enderecos` de `aplicada_em_parte` usa `k.dispositivoAlvo` **mesmo de comando de outra lei** (laço `reais.flatMap`): é daí que vêm os ~573 endereços falsos de `aConferir`. Usar `dispositivoAlvo` só quando `daBase(k.leiAlvo)`.
- **Se sobrar zero pendência e a versão não mudou** (par FALSO): registrar em `descartadas` ("a alteradora não altera esta lei"), como já se faz para candidata só-pela-ementa; **estender a condição atual** (`candidataPelaEmenta && !miraEstaLei && efetivos.length`) para pares vindos do vínculo da fonte. A trava `!miraEstaLei` é a que já existe.
- **Trava (quando NÃO aplicar):** `leiAlvo` ausente/ilegível (lei-alvo `null`) nunca é "outra lei": continua pendência (é o caso das "LeiComplementar" coladas e "LC nº 703" sem data — 36000<47275, 38022<39249 — que hoje caem em ENDERECO; sugestão: se o comando cita número de lei ≠ base e não casa nenhuma chave, tratar como `leiAlvo` desconhecida e **avisar**, sem descartar). Nunca descartar par cuja alteradora tenha pelo menos um comando com `leiAlvo` = base (`miraEstaLei`).
- **Risco de falso aceite:** a lei-alvo errada (OCR de número) esconder uma alteração real da base. Mitigação: a trava acima + contar quantos comandos miram a base; se zero e a alteradora cita a base só como "alterada pela", é par falso.
- **Teste (texto real):** prova — LC 946 (44102) sobre a LC 612 (36000): endereços `art-53-A/inc-III` e `art-111/par-5` NÃO devem ir a `aConferir` da 612; LC 987 (47275) sobre a 612; LC 765 (40111) sobre a LC 700; LC 780 (40350) sobre a LC 646 (par FALSO → `descartadas`). Desmentem (devem continuar pendentes): 36000<47275 e 38022<39249 (lei-alvo sem resolução).
- **Impacto:** 52 pares; 573 endereços saem de `aConferir`; combinada com R2–R4: ver §6.

### R2 — Vínculo da fonte de uma lei com ela mesma (AUTO) — 2 pares em 100 leis (7 em todo o acervo: 25553, 26402, 28080, 28117, 32299, 42380, 42591)
- **Gatilho:** `principal === relacionada` em `montarListaDeHistoricos` (hoje só `alteradorasPelaEmenta` filtra `base.idSapl === alt.idSapl`). 122 auto-vínculos no total, 67 de tipo altera.
- **Trava:** nenhuma (uma lei não é alteradora de si mesma por vínculo). **Risco:** nulo. **Teste:** ids 42380 e 42591 (reais); o teste falha no código antigo (os dois ficam incompletos).
- Observação: 42380 (LOA 12.655) tem promulgação parcial por derrubada de veto no próprio arquivo — é outra coisa, vai para as orçamentárias.

### R3 — Alteradora que revoga a lei-base inteira (REVOGA_BASE) — 3 pares
- **Gatilho:** `revoke_lei` cujo `leiAlvo` casa com a base (`daBase`). Casos: 42388<43543 ("Art. 3º Fica revogada a Lei Complementar nº 870, de 27 de dezembro de 2019."), 42981<45887 ("Art. 1º Fica revogada a Lei Complementar nº 895…"), 38712<40706 ("a Lei Complementar nº 707, de 27 de dezembro de 2012.").
- **Efeito:** gravar `revogadaPorInteiro: { alteradora, data }` no histórico (a consulta já mostra "último texto apurado; norma revogada por inteiro", decisão 15, hoje por vínculo da fonte) e não registrar como `naoAplicadas`. **Trava:** só `revoke_lei` com lei-alvo resolvida igual à base; revogação "de parte" ("o item 4 do Anexo I…") continua `indeterminado`. **Risco:** revogação condicionada ("produz efeitos a partir de…") — conferir se há vacatio no artigo; no caso 42388 o artigo 2º diz "produzindo efeitos a partir de 1º de janeiro de 2022". Sugestão: gravar a data da alteradora e a frase.

### R4 — Alteração de anexo já detectada não é "alteradora não aplicada" (ANEXO) — 17 pares
- **Gatilho:** comandos da alteradora sobre a base se resumem a `nao_classificado`/`indeterminado` cujos artigos entram em `artigosQueMexemEmAnexo(doc.artigos, chaveBase)` (decisão 37) **ou** revogação "do item/Anexo/Tabela" (`revogacao_de_anexo_ou_tabela`); nenhum `replace_text/insert_node/revoke_node` recusado sobre articulado.
- **Verificado:** nos 15 pares NENHUM dessas famílias, `artigosQueMexemEmAnexo` detecta ≥1 artigo (14 dos 15; o 15º, 37090<39857, "Fica excluído o Anexo 41 da LeiComplementar nº 663…", não é detectado — não verifiquei a causa; a suspeita é a palavra colada "LeiComplementar", anotar como achado). `anexosAlterados` já traz 1–5 itens nessas bases (ex.: 36255 → 2; 43573 → 3; 49707 → 5). **O mesmo fato hoje é contado duas vezes**: em `anexosAlterados` e em `naoAplicadas`; a consulta avisa "Anexo alterado" E "histórico incompleto".
- **Trava:** alteradora que também tem comando de articulado recusado continua pendente (só sai a parte de anexo); LOA/LDO/PPA e anexos grandes ficam para o plano de anexos (decisão 41) — aqui só deixam de contar como "alteradora não aplicada".
- **Risco:** o aviso "histórico incompleto" sumir e o leitor achar que o anexo está certo. Mitigação: manter o aviso "Anexo alterado" (já existe) e **não** mexer no aviso do anexo. **Teste real:** 36255<38791 ("Fica incluído o logradouro Avenida Ecoville na Figura 2 do Anexo 1 da Lei Complementar nº 626"), 43573<44155, 50787<51387/51809, 49707<50699; **desmentido:** 49707<50200 (revoga Tabelas II dos anexos + `art. 43/par-1` indeterminado: o articulado também pende).

### R5 — Revogação com alínea legível (REV_AL) — 2 pares (4 comandos em 4 leis) → estende a decisão 45
- **Gatilho:** citação `al. X do inc. Y [do caput] do art. Z` (ou `al. X do § N do art. Z`) em cadeia **completa e crescente**, sem `arts./incs./als./§§`, sem Capítulo/Seção. Reais: 41676<46278 "Fica revogada a al. j do inc. V do art. 35 da Lei nº 12.420, de 8 de junho de 2018."; 43332<44056 "Fica revogada a al. d do inc. I do caput do art. 3º da Lei nº 12.865…"; 38364<51556 / 49739<51556 "Fica revogada a al. i do inc. V do art. 13 da Lei Complementar nº 1.037…"; 41098<44066 "al. d do inc. II do caput do art. 4º-A da LC 810".
- **Trava:** a decisão 45 nasceu de erro real (id 44276: "inc. XXVII do caput do art. 18" virava revogação do art. 18). A nova leitura só vale se **todo** nível escrito vira nível do endereço e o dispositivo existe na árvore (`leiBaseIndex`); senão continua `indeterminado`. "Do caput" não é nível: some do endereço.
- **Risco de falso aceite:** revogar alínea errada por mapear `al. j` para posição em vez de rótulo (alíneas depois do "z", decisão 26). **Teste real:** os 4 ids acima + o desmentido 44276 (deve continuar `indeterminado`). **Impacto:** 2 pares aqui, mas 4–5 leis têm o mesmo padrão; mexe no core (extrator) → regra 10 (edição pontual) e bateria.

### R6 — Endereço-pai duplicado (ENDERECO) — 7 pares → bug do core, classe 1
- **Sintoma:** "Fica alterado o inc. III do § 4º do art. 4º da LC 625, … conforme segue: “Art. 4º …… § 4º …… III – ao secretário…” (NR)" (41342 art. 5º) — o dispositivo `art-4/par-4/inc-III` **existe** na base (conferido: `inc-III` "ao Secretário Municipal da Fazenda; e"), mas o comando vira `insert_node` com `dispositivoAlvo = "inc. iii do § 4º do art. 4º"` e pai `"§ 4º do inc. iii do § 4º do art. 4º"`.
- **Causa provável (não alterei o core; hipótese a conferir no `extrairComandosLei`):** o bloco traz a cadeia de cabeçalhos `Art. 4º ... / § 4º ... / inciso`, e o extrator concatena o caminho do cabeçalho com o endereço já completo da introdução. Idem "parágrafo único do inc. i do parágrafo único do art. 17/69-A".
- **Regra:** se o endereço montado repete um sufixo do endereço da introdução, usar o da introdução; se o dispositivo existe na versão, é `replace_text`. **Trava:** só quando o endereço final existe em `leiBaseIndex`; se não existe, fica `insert_node` recusado (falha alta).
- **Teste real:** 36216<41342, 36216<40111, 38249<45657, 40111<47888, 43154<46551, 50093<51125; **desmentem:** inserções legítimas de inciso novo em §/art. existente (ex. 38022<39249 "Fica incluído inc. XXIX no caput do art. 70", se a lei-alvo estivesse certa). **Risco:** o `replace_text` aplicar sobre inciso errado — mitigado porque o texto novo vem entre aspas e o endereço é do próprio texto.

### R7 — Duplicata da própria alteradora (JA_EXISTE) — 1 par (38249<40683)
- O estado do `art-69-A` tem como origem a própria LC 797; a recusa "já existe artigo com o rótulo de art. 69-A" vem de um segundo comando idêntico no mesmo arquivo. A regra atual só ignora quando `novoTexto` aparece **exatamente** em `idxDepois`; aqui o nó tem filhos (`parágrafo único`) e o texto do bloco difere. **Regra:** ignorar a recusa se o nó existente tem `origem.lei` = a alteradora que está sendo aplicada (mesma norma). **Trava:** `origem.lei` de outra lei = conflito real (humano). **Teste:** 38249<40683; desmentido hipotético: dois comandos de leis diferentes inserindo o mesmo artigo.

### R8 — Alteração de ementa (EMENTA) — 30–32 pares → **depende de decisão do mantenedor**
- **Gatilho exato:** artigo cuja introdução é `Fica(m) alterada(s)? a ementa da Lei … conforme segue:` seguido de um único bloco entre aspas com `(NR)`. Exemplos reais (todos sem ambiguidade): "Fica alterada a ementa da Lei nº 12.742, de 6 de novembro de 2020, conforme segue: “Determina a criação de repositório de julgados dos recursos apresentados às notificações de infração … ” (NR)" (49766 art. 1º); as demais alteradoras do mesmo padrão no recorte (ver a coluna "causa" da §4: ids 47151, 47227, 49710, 49612, 51885, 51500, 47944, 46767, 51833, 45807, 42519, 38041, 39221 aparecem no log com "Fica alterada a ementa da Lei …")
- **Como o motor faria:** novo comando `replace_ementa` (ou `replace_text` com alvo `ementa`) aplicado ao nó `ementa` da árvore, com `origem` registrada; `apurarTextoVigente` já tem o nó `ementa`. O histórico por dispositivo hoje só percorre `arv.artigos`; precisaria também registrar a ementa por versão.
- **Trava:** só quando o bloco tem uma única linha de texto entre aspas e termina em `(NR)`; ementa com "Fica incluída ao fim da ementa…" ou acréscimo parcial continua `indeterminado`. **Risco de falso aceite:** baixo (substituição total); o risco real é de política (ementa faz parte do texto vigente?) — ver pergunta P1. **Teste real:** 49766 e 49739 art. 23 ("Fica alterada a ementa da Lei Complementar nº 1.005, de 8 de fevereiro de 2024, conforme segue:") + um desmentido (ementa com `incluir` parcial, se existir; não encontrei exemplo — **dizer que falta**, regra 1). **Impacto:** 28 leis completas só com isso (cenário B).

### R9 — Agrupadores (AGRUP) — 1 par primário (+ presentes em 12 pares de outras famílias) → **precisa de decisão e de desenho**
- Exemplos reais de uso: "Fica incluída Seção VI-A no Capítulo VIII do Título II da Lei Complementar nº 628, de 2009, conforme segue: “Seção VI-A / Da Qualificação…” Art. 134-A…" (LC 640, art. 48); "Fica renomeada a Subseção IV da Seção II do Capítulo VIII…", "Fica incluído o Capítulo IV-A na Lei nº 12.827, de 2021", "Fica incluída Subseção I, com arts. 22-B…". O núcleo (`agrupadores` em `gruposAntes`) existe, mas não há comando. **Sem desenho aprovado e sem decisão (decisão 23 trata a leitura dos agrupadores, não a alteração).** Impacto cascata: sem o agrupador, o artigo inserido dentro (ex. art. 134-A) nasce em lugar errado/inexistente e as alteradoras seguintes falham (36316<50376).

### R10 — Revogação em lista (REV_LISTA) — 2 pares → já decidido (46: por item)
- Casos: 36316<36647 "inc. II do § 2º e § 3º do art. 42;" (rótulo ilegível "§ 2º e § 3º"); 43154<49604 "Ficam revogados, da Lei nº 12.827, de 2021:" + lista de incisos. Aplicar o que se lê limpo, avisar o resto — é o que a decisão 46 manda; a pendência continua para o item não lido, então só fecha a lei se todos os itens se lerem.

### R11 — Inserção de artigo no fim (1 par) — 47235<48329
- "Art. 6º Fica incluído art. 19 na Lei Complementar nº 985, de 21 de setembro de 2023, conforme segue: “Art. 19. Ficam repristinadas a Lei Complementar nº 821 … e a Lei Complementar nº 822 …”". A LC 985 termina no art. 18; o motor procura o artigo-base "art. 19º" (o próprio novo) e falha. É a pendência **"inserção de artigo-irmão na raiz (só sintético)"** do CLAUDE.md — agora existe exemplo real. Regra: número novo sem sufixo, maior que o último artigo existente e consecutivo → acrescentar ao fim; nos demais casos falha alto. **Pergunta ao mantenedor** só se for generalizar além de "consecutivo ao último".

### R12 — Texto colado/ilegível (DATA) — 1 par (38523<39392) → classe 2
- "Fica revogado o § 2º do art. 2º da Lei Complementar nº 703, desetembro de 2012" (dia e espaço perdidos pela extração) — número e ano são recuperáveis ("703" + "setembro de 2012"), mas a regra 5/OCR diz que texto de OCR não é corrigido à mão nem por regra. Classe 2: IA propõe a leitura; humano confere. Também 37090<39857 ("Fica excluído o Anexo 41 da LeiComplementar nº 663…").

## 6. Estimativa do que sobra de revisão HUMANA do histórico

Cenários sobre as **100 leis recentes incompletas** (hoje 0 completas):

| Cenário | O que se aplica | Leis completas | Leis ainda incompletas |
|---|---|---|---|
| A | R1–R4 (ruído, falso par, auto-vínculo, revoga-base, anexo fora da pendência) | 46 | 54 |
| A + T | + o 1 texto que está na fila (38218) | 50 | 50 |
| B | + R8 ementa, R9 agrupador, R5 alínea, R10 lista | 75 | 25 |
| C | + R6 endereço duplicado, R7 duplicata, par falso de lei-alvo ilegível | **81** | **19** |

**Fila humana residual: 19 leis (19 das 100), ~22 pares:**
- 5 leis, 5 pares: revogação de dispositivo inexistente (REV_INEXISTENTE): 37043 ("arts. 14, 15, 17, 18, 19, 19-A e o inc. II do art. 16 da LC 662" → LC 985 art. 18), 39138 ("art. 17-A" da LC 721), 39694 ("art. 10-A" da LC 744), 39862 ("§ 1º do art. 8º": a base tem dois "Art. 8º"), 42382 ("art. 8º da Lei 12.656", base lida com 1 só artigo). Suspeita: **alteradora intermediária ausente da lista de vínculos** — esses "-A" teriam sido inseridos por uma lei que a fonte não liga; só um humano resolve (e é sinal útil para completar vínculos).
- 4 leis: LC 1.075/2026 sobre a LC 612, 720, 764, 946 (promulgação parcial, `revisar`).
- 2 leis: arquivo-fonte inutilizável (36841/39395 mapa; 39223 e 40514 LC 790 com 29 caracteres).
- 2 leis: base mal lida (41676, 42382) + 1 lei com espaçamento destruído (36316<37562) + 1 cascata (36316<50376).
- 1 data ilegível (38523).
- Orçamentárias 42380/42381 (LOA 12.655/art. 3º, decisão 41); 41955<42994 ("art. 6ª").
- 47235<48329 (R11) e 40514<42747 (base defeituosa).

Em **dispositivos**: ~807 endereços de `aConferir` (865 contando repetição) → ~234 restam como "a conferir" legítimos (807 − 573), e ~83% deles agrupados nas 19 leis residuais.

**Humano ponto a ponto efetivo: ~19 leis; IA-propõe-e-humano-amostra: 1–3 (DATA, typo 6ª, espaçamento); defeito de fonte: 5 (FONTE ×2, espaçamento, base 40514, base 42382 mal lida).** Para as 103 leis-base recentes que ainda aguardam texto, esperar ~65% incompletas hoje e ~19% depois das regras (extrapolação da amostra, não medição).

## 7. Perguntas ao mantenedor (regra 11; todas com evidência e recomendação)

**P1 — A EMENTA faz parte do texto vigente que o Norma apura?** Evidência: 32 pares reais com "Fica alterada a ementa da Lei nº X, conforme segue: “…” (NR)" (ex. 49766 → Lei 12.742; 47151 → 12.560; 45807 → LC 906); hoje `indeterminado` e tornam 28 leis "incompletas". Alternativas: (a) **apurar** — nova versão da ementa em cada versão, registrada no histórico e mostrada na consulta (custo: novo comando `replace_ementa` no core + histórico por ementa; risco baixo: substituição total); (b) **não apurar** — ementa fica a do original; a alteradora vira "aviso" ("alterou a ementa") e **sai da pendência**; (c) apurar só quando a ementa nova vem integral entre aspas (que é todo caso real que vi). Recomendação: **(c)**, e exibir a ementa vigente + a original. Sem resposta, não implemento.
**P2 — Alteração de Capítulo/Seção/Subseção/Título (agrupador) entra no motor?** Evidência: LC 640 art. 48 ("Fica incluída Seção VI-A no Capítulo VIII do Título II da LC 628 … conforme segue: “Seção VI-A / Da Qualificação … Art. 134-A…”") deixa o art. 134-A de fora, e a LC 1.048 falha por consequência (cascata). Hoje 12–13 pares trazem agrupador. Alternativas: (a) implementar `insert_group`/`rename_group` (desenho novo, decisão 23 cobre só a leitura); (b) **tratar como aviso e inserir os artigos filhos mesmo assim** (o artigo 134-A nasce no lugar correto sem o título); (c) deixar para humano. Recomendação: **(b) agora, (a) depois**, mas é decisão sua: (b) muda o que o texto vigente mostra (artigo sem seu cabeçalho).
**P3 — Alteração de anexo conta como "histórico incompleto"?** Evidência: 17 pares; o mesmo fato já aparece como "Anexo alterado" (decisão 37), e como "histórico incompleto" — duas faixas para o mesmo problema. Alternativas: (a) **só o aviso de anexo** (sai de `naoAplicadas`); (b) manter as duas; (c) para LOA/LDO/PPA, tratar à parte (decisão 41). Recomendação: (a) e (c).
**P4 — Alteradora que revoga a lei-base inteira** (3 pares: LC 870 por LC 925, LC 895 por LC 971, LC 707 por LC 798): gravar `revogadaPorInteiro` no histórico e **não** listar como pendência? E o que fazer com a lei revogada com "produzindo efeitos a partir de 1º de janeiro de 2022" (LC 925 art. 2º)? Recomendação: gravar com a data da alteradora **e** a observação "efeitos a partir de…" quando o artigo seguinte tiver vacatio.
**P5 — Revogar dispositivo que não existe** (5 pares): "nada a revogar" é (a) pendência a investigar (provável alteradora intermediária sem vínculo) ou (b) aviso benigno? Evidência: 37043 (art. 19-A da LC 662), 39138 (art. 17-A da LC 721), 39694 (art. 10-A da LC 744) — em nenhuma base há o "-A" e só a alteradora revogadora o cita. Recomendação: (a) com título próprio ("dispositivo revogado não encontrado") e **não** marcar a lei como incompleta no topo da consulta, só o dispositivo.
**P6 — Quando o texto de uma alteradora não existe no SAPL** (6 pares `sem_texto`, ex. LC 959/2022, LC 984/2023, LC 973/2023, Lei 14.697/2026): aceitar o **DOPA** (já temos `dados/dopa/` com cabeçalho e link) como fonte de texto para essas alteradoras? Ou ficam eternamente `texto_indisponivel`? Recomendação: tentar o DOPA para as recentes (os atos de 2022–2026 saíram no Diário), registrando a origem do texto.
**P7 — Par (lei-base, alteradora) que só vem da ementa** (12 pares): "alterada pela LC 726" faz a LC 726 virar "base" de uma alteradora que não a altera (39220<39392). Aceita endurecer `alteradorasPelaEmenta`: só vale a lei citada **como objeto do verbo** (primeira lei após "Altera/Inclui/Revoga… da/na Lei …"), nunca a que vem depois de "alterada pela"? Recomendação: sim; mede-se pelo que some de `naoAplicadas`.

## 8. Achados inesperados (com evidência)

1. **Bug — endereço-pai duplicado** (R6): 7 pares reais; o dispositivo existe na base mas o comando vira `insert_node` com pai "§ 4º do inc. iii do § 4º do art. 4º" (id 36216 ← 41342, art. 5º; base tem `art-4/par-4/inc-III`).
2. **Contaminação de `aConferir`:** o laço de `aplicada_em_parte` usa `dispositivoAlvo` de comandos de OUTRA lei como endereço da base (id 36000 ← 44102: `art-53-A/inc-III` e `art-111/par-5` são da LC 434, não da LC 612). ~573 de ~807 endereços são falsos no recorte.
3. **Contagem dupla:** alteração de anexo é registrada em `anexosAlterados` (decisão 37) e em `naoAplicadas` (ids 36255, 36372, 43573, 50787, 49707, 43412).
4. **Auto-vínculos da fonte:** 122 vínculos de uma norma com ela mesma (67 do tipo "altera"); 7 leis com auto-par em `naoAplicadas` (25553, 26402, 28080, 28117, 32299, 42380, 42591). `montarListaDeHistoricos` não filtra.
5. **A "fila de download" não resolve o recorte** (6 de 8 sem arquivo no SAPL; 1 `erro_definitivo`, 40363 = LC 781). Apenas 38218 está na fila.
6. **Base com texto de 29 caracteres** (id 40514, LC 790: "LC 790" ×4) — `baseConferida` e `apurarHistorico` seguem como se fosse base válida e geram `endereço não encontrado` em alteradoras; arquivo incompleto passa o filtro de "tem texto". Idem 39223<40514 (alteradora com 29 caracteres).
7. **Base com 1 artigo lido** (id 42382, Lei 12.656) e **"Art. 29 Fica…" sem ponto** (id 41676): `baseConferida=false` mas o histórico é gerado mesmo assim; as pendências são todas efeito da base, não da alteradora.
8. **Pares falsos vindos do vínculo da fonte**, não só da ementa (ex. 37041<40682: LC 796 altera a LC 367 "alterada pela LC 660"; a fonte registrou "Altera" para a 660). 6 pares comando_recusado são só isso.
9. **"Revogam-se" de lei com condição:** 42388<43543 — "Art. 3º Fica revogada a LC 870" com "produzindo efeitos a partir de 1º de janeiro de 2022" no artigo anterior.
10. **Alteração de LC 703 sem data** ("da Lei Complementar nº 703, e alterações posteriores", 47275 art. 14) cai em `insert_node` na LC 612 sem lei-alvo — falso positivo em potencial se `leiBaseConfere` aceitasse só pelo número.

## 9. Amostra de 15 comandos recusados/não reconhecidos, conferidos no texto real

| # | Par | Trecho (alteradora) | Era interpretável sem ambiguidade? |
|---|---|---|---|
| 1 | 36216<41342 | "Art. 5º Fica alterado o inc. III do § 4º do art. 4º da Lei Complementar nº 625, de 3 de julho de 2009, e alterações posteriores, conforme segue: “Art. 4º …… § 4º …… III – ao secretário municipal de Transparência e Controladoria; e …” (NR)" | **Sim.** O inc. III do § 4º do art. 4º existe na base ("III – ao Secretário Municipal da Fazenda; e"); bug do extrator (R6). |
| 2 | 47235<48329 | "Art. 6º Fica incluído art. 19 na Lei Complementar nº 985, de 21 de setembro de 2023, conforme segue: “Art. 19. Ficam repristinadas…”" | **Sim.** A lei termina no art. 18 (arts 1–18 na árvore). Inserção no fim (R11). |
| 3 | 42831<49766 | "Art. 1º Fica alterada a ementa da Lei nº 12.742, de 6 de novembro de 2020, conforme segue: “Determina a criação de repositório de julgados … sessões de julgamentos.” (NR)" | **Sim**, se a decisão P1 for "apurar a ementa". |
| 4 | 36316<36647→50376 | "Art. 48. Fica incluída Seção VI-A no Capítulo VIII do Título II da LC 628, de 2009, conforme segue: “Seção VI-A / Da Qualificação… Art. 134-A. O Legislativo e o Executivo Municipais…”" ; depois LC 1.048: "Fica incluído § 2º … no art. 134-A da LC 628" | **Seção/artigo: sim, mas exige desenho de agrupador (P2).** A pendência da 1.048 é consequência. |
| 5 | 36255<38791 | "Art. 1º Fica incluído o logradouro Avenida Ecoville na Figura 2 do Anexo 1 da Lei Complementar nº 626, de 15 de julho de 2009." | **Sim, mas é anexo** (decisões 37/41): não há o que aplicar; só avisar. |
| 6 | 38523<39392 | "Art. 1º Fica revogado o § 2º do art. 2º da Lei Complementar nº 703, desetembro de 2012, alterada pela Lei Complementar nº 726, de 7 de janeiro de2014." | **Quase**: o dispositivo é claro; a data está estragada. Lei-alvo 703 ≠ 726 → par 39220<39392 é **falso** (a 726 só aparece em "alterada pela"). |
| 7 | 41676<46278 | "Art. 5º Fica revogada a al. j do inc. V do art. 35 da Lei nº 12.420, de 8 de junho de 2018." | **Sim.** Cadeia completa; recusada pela trava da decisão 45 (R5). |
| 8 | 43332<44056 | "Art. 1º Fica revogada a al. d do inc. I do caput do art. 3º da Lei nº 12.865, de 3 de setembro de 2021." | **Sim** (R5). |
| 9 | 42388<43543 | "Art. 3º Fica revogada a Lei Complementar nº 870, de 27 de dezembro de 2019." | **Sim.** Revoga a própria lei-base (R3). |
| 10 | 38249<40683 | "Art. 1º Fica incluído art. 69-A na Lei Complementar nº 694, de 21 de maio de 2012, alterada pela Lei Complementar nº 776, de 23 de outubro de 2015, conforme segue: “Art. 69-A. Ficam as clínicas veterinárias…”" | **Sim.** O art. 69-A existe porque a própria LC 797 o inseriu (origem da LC 797): duplicata de comando (R7). |
| 11 | 41955<42994 | "Art. 45 Fica alterado o caput do art. 6ª da Lei nº 12.501, de 24 de janeiro de 2019" | **Provável, mas o "ª" é erro da lei**: art. 6º do caput. Classe 2 (IA propõe, humano confere). |
| 12 | 38022<39249 | "Art. 4º Fica incluído inc. XXIX no caput do art. 70 da LeiComplementar nº 7, de 1973, e alterações posteriores" | **O comando é claro mas é da LC 7/1973**, não da LC 687 (base): par falso; palavras coladas impedem resolver a lei-alvo (R1). |
| 13 | 36841<40350 | ementa: "Altera os limites da Macrozona 08 … Anexo 1.1 da Lei Complementar nº 434, de 1º de dezembro de 1999 – PDDUA –, alterada pela Lei Complementar nº 646, de 22 de julho de 2010 …" | **Sim**: altera a LC 434, não a 646. Par falso da ementa. |
| 14 | 42380<42727 | "Art. 1º Fica alterado o art. 3º da Lei nº 12.655, de 27 de dezembro de 2019, conforme segue: “Art. 3º ……”" (LOA, itens 1, 2, 3 sem §) | **Parcial**: orçamentária (decisão 41): itens numerados sem rótulo de parágrafo; tratamento especial. |
| 15 | 36000<51485 | "Art. 223. Fica alterado o inc. VII do art. 2º da Lei Complementar nº 612, de 19 de fevereiro de 2009, conforme segue: “Art. 2º ………”" | **Sim**, mas o arquivo da LC 1.075 está `revisar` (cabeçalho com reticências sem aspas de abertura, decisão 11): depende da revisão da própria 1.075. |

**Resultado da amostra:** 15 casos conferidos no texto; **13 eram interpretáveis sem ambiguidade (ou eram par falso/anexo)**; 2 carregam ambiguidade real de texto ou de fonte (#11 "art. 6ª", #14 orçamentária).

## Confiança do levantamento
Conferi **norma a norma** (leitura do `raw` do comando no texto da alteradora, na árvore da base ou no `sem-texto.tsv`/`_indice.jsonl`): as famílias pequenas (ENDERECO 14, JA_EXISTE 3, REV_INEXISTENTE 5, REV_AL 2, LC1075 4, FONTE 2, DATA 1, AUTO 2, REVOGA_BASE 3, TEXTO 8 = 44 pares) e os 15 casos da §9. **Amostrei** (sem leitura de cada texto, classificação por regra sobre o log reexecutado do motor, validada em ~6 casos de cada) as famílias grandes: RUIDO (42), ANEXO (17; os 14 NENHUM conferidos pela detecção de anexo, 3 pela leitura), EMENTA (30–32; 2 lidos no texto: 42831<49766 e 49739 art. 23), FALSO (8). Os cenários (§6) são contas sobre essas etiquetas por lei, **não** uma re-execução do `apurarHistorico` com as regras novas: o número real de leis completas só sai ao implementar e medir (regra 12c). O trecho "AGRUP" e a causa raiz do R6 (cadeia de cabeçalhos do bloco) são hipóteses lidas dos sintomas, não do core.
