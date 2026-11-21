# PLANO — `bloco_de_alteracao_sem_dono` (causas, conserto provado, decisões)

Pesquisa somente leitura de 21/11/2026. Lista-alvo: 24 normas recentes (18 só com o motivo). Medido sobre as 823 normas do acervo, lendo o texto como o estruturador lê (`prepararTextoExtraido`). Nada do repositório foi alterado além deste arquivo; os scripts e a cópia de teste estão no scratchpad da sessão (`.../scratchpad/agente-bloco/`, ver fim).

## 1. Onde o motivo nasce

- `ingestao/estrutura.mjs:167` `detectNRCandidates` acha os blocos entre aspas; `:171` `proximoBloco`; `:199` cada dispositivo com `nrBloco` consome o próximo bloco; `:266` `if (proximoBloco !== blocos.length) motivos.push('bloco_de_alteracao_sem_dono')`.
- `norma-core.js:645-651` (`parseMinuta`): depois do fecho (`stage === "fecho"`, `:645`) toda linha vai para o buffer do fecho e nenhum bloco é ligado; e um bloco só é ligado se já existe um dispositivo anterior (`alvoNode = last.al||last.i||last.p||last.a`, `:650`); sem ele, o bloco é pulado em silêncio. Dois blocos seguidos no mesmo dispositivo: o 2º sobrescreve o 1º. Os três caminhos aparecem só pela diferença de contagem em `:266`.
- Contagem medida: 50 normas das 823 têm o motivo (24 recentes + 26 antigas). Só as 24 recentes foram analisadas a fundo.

## 2. Tabela causa × contagem × ids

| Causa | Classe | Normas | Ids |
|---|---|---|---|
| **R1** Lei impressa 3 vezes no mesmo PDF; as cópias só diferem no espaçamento (e, em 3 casos, na ordem das linhas do timbre). As cópias 2 e 3 caem depois do 1º fecho e os blocos delas não são ligados | A (preparo) / B (fonte); regra do mantenedor: decisão 24 | **20** | 39259, 39249, 39213, 38800, 38712, 38695, 38330, 38298, 38041, 37136, 37132, 37109, 36907, 36862, 36850, 36811, 36741, 36717, 36530, 36529 |
| **R2** Camada de texto de PDF digitalizado com "Art. I" no lugar de "Art. 1º" (e "§ I", `"Art. 58` sem texto): o 1º artigo não é reconhecido, não há dispositivo anterior ao bloco, e o bloco é descartado | A (qualidade da camada de texto); OCR não se corrige por regra | **2** | 44305, 44307 |
| **R3** PDF de página de Diário Oficial em 2 colunas: a extração entremeia linhas das duas colunas; introdução e bloco ficam misturados (52 blocos detectados, 2 ligados) | A (extração) | **1** | 36841 |
| **R4** Arquivo com dois atos: promulgação parcial (fecho em 23/09/2026) seguida da LC 1.075 inteira; o 1º fecho põe o leitor em estágio "fecho" e os arts. 223 e 224 (alteram a LC 612 e a LC 946) ficam sem dono | B (arquivo composto) | **1** | 51485 |
| C (forma legítima que o leitor não entende) | — | 0 | — |
| D (bug de `detectNRCandidates` ou da atribuição de dono) | — | 0 | — |
| E (aspas que não são bloco) | — | 0 | — |

Nas 24 normas não há falha do leitor: o motivo está acusando um problema real do texto lido. Total: 20 + 2 + 1 + 1 = 24.

### Evidência por causa

**R1.** `blocos = 3k`, `consumidos = k`, três "Art. 1º" e três fechos por arquivo. Exemplo 38800 (3 blocos, 1 consumido): linhas 22-23 `Art. 1º Fica incluído art. 164-A na Lei Complementar nº 395,… conforme segue:` / linha 25 `“Art. 164-A. O uso do uniforme…`; a cópia 2 começa na linha 54 (`brasao.g`, `Prefeitura Municipal de Porto`, `(2807`, `Alegre`, `bytes)`) e a 3ª na 108. O fecho está na linha 35, e os blocos das linhas 79 e 132 estão depois dele. Exemplo 36529: 54 blocos, 18 consumidos; fechos nas linhas 555, 1142, 1729. Exemplo 39259: 3 blocos, 1 consumido (`“Art. 222-A. Fica permitido o uso de telhado verde…` nas linhas 23, 68 e 112).
Por que `removerRepeticaoDeTexto` não pega: só aceita igualdade exata de linha (`ingestao/extracao-texto.mjs:30` `removerRepeticaoIntegral`, `:128`). Em 17 dos 20 o total de linhas cheias é divisível por 3, mas as cópias diferem por 1-2 linhas só em espaçamento (`(2807 bytes)           Prefeitura…` × `(2807 bytes)          Prefeitura…`; `outras         providências       –,      e`). Em 3 (38800, 38712, 38695) o total não é divisível por 3 porque a ordem das linhas do timbre muda (`(2807 / bytes) / Prefeitura` × `Prefeitura / (2807 / Alegre / bytes)`). Os 20 são PDFs lidos por `pdftotext` (impressão da página do SIREL com a lei 3 vezes); mesma natureza do caso já tratado na Lei 9.113/2003 e na LC 692/2012, só que com espaçamento diferente.
Os mesmos arquivos fazem a norma sair "a revisar" por acidente: o texto das cópias 2 e 3 é engolido pelo buffer do fecho (e, quando não há fecho, pelo último artigo — ver 39600 abaixo).

**R2.** 44305 (EC 43/2017), linhas 26-34: `Art. I Fica alterado o inc. VI do § 2" do art. 58 … conforme segue:` / `"Art. 58` / `§2` / `VI - discutir e votar…` / linha 43 `"(NR)`. O arquivo é `pdftotext` (1.009 alfanuméricos; o OCR não foi acionado). Sem "Art. 1º" reconhecido não existe `last.a` quando o bloco chega. Idem 44307 (EC 42/2016, `Art. I Fica alterado o § I do art. 157…`). O cabeçalho também não é reconhecido (`E M E N D A À L E I O R G Â N I C A N° 43`), por isso as duas normas já saem com `cabecalho_nao_reconhecido`, `sem_fecho` e `rotulo_nao_confere_com_a_origem`. Não há PDF local nem tesseract: não pude testar se o OCR do PDF daria "Art. 1º".

**R3.** 36841 (LC 646/2010, republicação no Diário Oficial de 30/11/2010): a extração cola as duas colunas na mesma linha ou alterna linhas (`Art. 2º Fica incluído parágrafo único no art. 2º…` ao lado da ementa; `Parágrafo único. Na aplicação, na alteração e na interpretação des-Altera e inclui dispositivos…`). 52 blocos, 2 ligados, 1 fecho (linha 69, no meio da página). Também carrega `alteracao_sem_aspas_nao_delimitada`.

**R4.** 51485: linha 33 `PREFEITURA MUNICIPAL DE PORTO ALEGRE, 23 de setembro de 2026.` (fecho da promulgação parcial); linha 49 recomeça `LEI COMPLEMENTAR Nº 1.075, DE 14 DE JULHO DE 2026.` e a lei inteira vai até a linha 4574 (segundo fecho, 14/07/2026). Blocos não ligados: linhas 4366-4373 (`“Art. 2º ……… VII – recursos auferidos com a outorga onerosa… ” (NR)` — alteração da LC 612) e 4378-4386 (`“Art. 23. Fica criado o Fundo Municipal de Gestão de Território (FMGT)…` — LC 946). Os dois estão depois do 1º fecho.

## 3. Menor conserto por causa

### R1 — conserto provado (depende da decisão 24; ver seção 5)

Função nova `removerCopiasDoDocumento(texto)` em `ingestao/extracao-texto.mjs` (puro, junto de `removerRepeticaoDeTexto`), chamada como último passo de `prepararTextoExtraido` (`:205`). O `.txt` guardado não muda (mesmo critério da decisão 22). Regra estrita:

1. a epígrafe (linha `LEI|EMENDA|RESOLUÇÃO|DECRETO|ORDEM … <algarismo>`) tem de aparecer 2+ vezes, igual depois de tirar tudo que não é letra/algarismo;
2. cada cópia vai da epígrafe até a seguinte (a última, até o fim), sem as linhas finais do timbre da cópia seguinte (linhas formadas só por `brasao.*`, `(2807`, `bytes)`, `Prefeitura Municipal de Porto Alegre`);
3. as cópias têm de ser **iguais** entre si (letras e algarismos), sem tolerância; qualquer diferença: não mexe.

Diff pronto: `.../scratchpad/agente-bloco/patch-copias.diff` (52 linhas, aditivo, ~25 linhas de código). Aplicar com `git apply` (regra 10).

**Prova sobre as 823** (cópia do repositório no scratchpad; leitor antes × depois, `estruturarNorma` com registro do catálogo):

| Medida | Resultado |
|---|---|
| Normas cujo texto lido muda | 29 (28 com 3 cópias, 1 com 5: o id 38364) |
| Normas que perdem `bloco_de_alteracao_sem_dono` | **20 de 20** do grupo R1 (e nenhuma das outras 4 da lista-alvo, nem as 26 antigas) |
| Normas que **ganham** motivo novo | **0** |
| Outros motivos que somem | 1: `rotulo_nao_confere_com_a_origem` do id 39600 (o texto das cópias 2 e 3 estava colado no art. 3º por falta de fecho; o motivo se devia à repetição, não ao rótulo; continua `sem_fecho`) |
| Normas "aceitas" | 579 → 597 (+18 = as 18 da lista-alvo que só tinham o motivo; as 2 restantes de R1 ainda têm outros motivos: 38041 `rotulo_nao_confere_com_a_origem`, 37136 `texto_fora_da_arvore`+`trecho_nao_localizado_na_origem`) |
| Dispositivos das 29 | **idênticos** antes e depois, exceto o art. 3º do id 39600 (perde o texto repetido colado) |
| Testes existentes rodados com o patch (cópia) | `teste_textos_sapl` 36, `teste_estrutura` 62, `teste_blocos_sem_aspas` 26, `teste_referencias_alvo` 27, `teste_agrupadores` 12, `teste_ruido_de_pagina` 11, `teste_historico` 24, `teste_versionamento` 34, `teste_rotulos_reais` 8: todos passam. `teste_revisao`: 74 de 75; falha só "as âncoras concordam com o veredito gravado em 823 normas (divergem: 29)", que é esperado até subir `VERSAO_ESTRUTURADOR` (16 → 17) e regravar `dados/estruturado/` (comando do mantenedor/sessão principal; eu não rodei `estruturar.mjs`). |

**Não afrouxa nenhuma conferência** (a conferência de `:266` não foi tocada). Casos negativos, medidos com o id 38800 na cópia:

- arquivo real: sem o motivo (52 linhas lidas);
- cópia 2 com uma palavra trocada (`restrito` → `proibido`): não deduplica (160 linhas), **o motivo continua**;
- cópia 3 truncada em 12 linhas: não deduplica, **o motivo continua**;
- arquivo já sem repetição, sem a introdução ("Art. 1º … conforme segue:") antes do bloco: **o motivo continua** (bloco real sem dono é acusado);
- as 4 normas R2/R3/R4 (44305, 44307, 36841, 51485) e as 26 antigas continuam com o motivo.

Os 16 arquivos do acervo em que uma epígrafe se repete mas **não** são cópias (ex.: 51485, 30209, 42994 e ECs antigas) ficam como estão.

Teste novo a escrever (regra 5; falha no código antigo): `teste_copias_documento.mjs` com texto REAL de `dados/textos/sapl/38800.txt` (caso do timbre em ordem diferente) e `36529.txt` (3 cópias com divisão exata); asserções: 1 cópia; zero blocos além dos ligados; negativos acima marcados `(sintético)` (alteração de palavra, cópia truncada). Registrar no CHANGELOG com a medida 579 → 597.

### R2 — sem conserto de código aceitável

O texto vem de camada de OCR do próprio PDF; "OCR nunca é corrigido à mão nem por regra" (CLAUDE.md). Reconhecer "Art. I" como "Art. 1º" seria corrigir texto. Opções (todas fora de código): (a) revisor marca "defeito de fonte"; (b) tentar OCR novo desses 2 PDFs (`ingestao/ocr.mjs`, limiar de 1,3× em `baixar-textos.mjs:57`) — o limiar provavelmente não dispara, pois a camada ruim tem 1.009 alfanuméricos; precisaria de um critério de "digitalização com camada ruim" pelo conteúdo (ex.: `Art. I` seguido de texto) — não provado, não tenho PDF nem tesseract aqui. O motivo está correto e útil: não mexer em `:266`.

### R3 — conserto fora do leitor

Extração com ordem de colunas (`pdftotext` sem `-layout`, ou por página dividida ao meio) para PDFs de Diário Oficial. Fica na ingestão, é decisão de reextração de 1 arquivo. Não tentei: não há PDF local. O motivo continua correto.

### R4 — decisão

Arquivo com dois atos. Opções (ver seção 5): deixar como está (a norma sai a revisar, correto); ou o leitor reconhecer segunda epígrafe depois do fecho como novo ato. A segunda é mudança de `parseMinuta` (core) com um único exemplo real, e esbarra na pendência "promulgação parcial": não recomendo agora.

## 4. Riscos

1. `VERSAO_ESTRUTURADOR` tem de subir (16 → 17), senão `estruturar.mjs` reaproveita registro antigo (`estruturar.mjs:53`). Pela decisão 7, a decisão humana só reabre se o veredito mudou: ela reabre nas 20 normas (veredito mudou) e fica nas 9 em que não mudou.
2. As âncoras do dashboard usam o texto lido: linhas e deslocamentos das 29 normas mudam (o texto fica 1/3 do tamanho). É coerente porque `gerar-revisao.mjs` regenera; o teste "âncoras concordam com o veredito" cobre.
3. Cinco normas hoje "aceitas" têm o texto 3 vezes e nenhum bloco (39392, 38272, 38022, 37173, 36892): o texto repetido ia para o buffer do fecho sem ninguém notar. Com o conserto o veredito não muda, só o fecho lido fica limpo. É um falso aceite sem consequência hoje, mas mostra que a repetição era invisível sem bloco.
4. O conjunto de palavras de timbre (`brasao.*`, `(2807`, `bytes)`, `Prefeitura Municipal de Porto Alegre`) é do SIREL. Outro timbre (Câmara) faz a cópia não ser deduplicada: cai no comportamento atual (falha segura, motivo mantido).
5. Risco de apagar conteúdo real: só se as cópias forem idênticas em letras e algarismos; nada se perde. Texto acentuado/símbolos comparados após normalização NFD; pontuação ignorada (diferença só de pontuação entre cópias passaria; nas 29 normas medidas não houve diferença nenhuma além de espaço).
6. Este conserto não substitui a correção na origem (`baixar-textos.mjs` continuaria guardando o `.txt` com 3 cópias).

## 5. O que é decisão do mantenedor (não é código)

1. **Reabrir a decisão 24** ("documento repetido com diferença de espaçamento: sem regra nova; igualdade exata é trava de segurança"). Evidência nova: ela citava 2 ids (38364 e 37136); medido, são **29 normas do acervo** e **20 das 24 recentes com este motivo**. Alternativas: (A) regra estrita acima, no preparo da leitura, sem tocar o `.txt` (recomendada: não perde texto, nada ganha motivo, +18 aceitas legítimas); (B) manter a decisão e só trocar o título do motivo/roteiro para "documento repetido no arquivo" quando os blocos sem dono estão depois do 1º fecho e a epígrafe se repete (não resolve; o revisor continua marcando "defeito de fonte" 20 vezes); (C) corrigir só na origem (reextrair o PDF; exige rede e a regra de 1 requisição por minuto).
2. **R2:** aceitar que as ECs 42 e 43 de 2016/2017 ficam "a revisar" (defeito de fonte) ou autorizar OCR novo desses PDFs.
3. **R4:** como tratar arquivo com promulgação parcial seguida da lei inteira (o Plano Diretor). Não tem regra; um exemplo só.
4. Rótulo do motivo no dashboard: "Redação nova entre aspas sem artigo que a introduza" (`ingestao/revisao.mjs:202` e `gerar-revisao.mjs:112`) descreve mal R1 (a introdução existe, o que falta é o bloco da cópia estar fora do texto lido). Só vale mudar se a decisão 1 for (B).

## 6. Ordem de ataque

1. Decidir o item 1 da seção 5.
2. Se (A): aplicar `patch-copias.diff`, `teste_copias_documento.mjs` (falha no código antigo), bateria antes/depois, `VERSAO_ESTRUTURADOR` 17, regravar `dados/estruturado/`, CHANGELOG (20 sem o motivo; aceitas 579 → 597; 0 motivos novos). Conferir de forma independente: contar `LEI COMPLEMENTAR Nº N` no PDF de 2 ids (`pdftotext | grep -c`) para provar as 3 cópias.
3. R2/R3/R4: nada no core; deixar o motivo como está e levar ao revisor.
4. As 26 antigas: não analisadas a fundo (esperam-se problemas de época). Amostra: 26405 e 27350 (ECs de 1991-92) são digitalizações com `Art. lº`/`S 1º`, ou seja, a mesma natureza de R2.

## 7. O que não consegui verificar

- OCR dos PDFs de 44305/44307 (sem PDF local, sem tesseract) e extração em colunas de 36841.
- As 26 antigas, uma a uma (só contagem de blocos/consumidos/posição do fecho).
- Contagem independente das cópias direto no PDF (regra 6): só medi pelo `.txt` e pela saída das funções do código (`detectNRCandidates`, `parseLeiPublicada`, `estruturarNorma`); o `.txt` é a única base local. A conferência no PDF fica para a sessão principal.
- `teste_estrutura` e demais foram rodados numa cópia com os dados ligados por link; a bateria completa do core (`normateste.mjs` byte a byte, 153 asserções) não foi rodada porque o core não foi alterado.

## 8. Artefatos no scratchpad

Pasta `/tmp/claude-0/-home-user-norma-poa/6f77e18e-f055-5f0b-99c2-42f683ae1059/scratchpad/agente-bloco/`: `diag.mjs`, `diag2.mjs` (blocos × consumidos × fecho), `rep.mjs` (por que a repetição não é pega), `neg.mjs` (casos negativos), `cmpdisp.mjs` (dispositivos antes × depois), `chg.mjs` (29 textos que mudam), `patch-copias.diff`, `exp/` (cópia modificada), `base.json` e `novo.json` (motivos das 823 antes e depois).
