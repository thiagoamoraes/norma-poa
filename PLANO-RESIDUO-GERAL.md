# Plano — resíduo das 22 normas recentes em revisão (sem `rotulo_nao_confere_com_a_origem`)

Relatório de pesquisa (somente leitura do repositório; nada foi alterado fora deste arquivo). Estado medido: `VERSAO_ESTRUTURADOR` 17, 823 normas, 611 aceitas. Lista-alvo: 22 normas recentes. Scripts e patches no scratchpad (`.../scratchpad/agente-res-out/`).

Linha de base: `estruturarNorma` sobre as 823 (texto passado por `prepararTextoExtraido`, `ocr` pelo `_indice.jsonl`) reproduz os motivos gravados em `dados/estruturado/sapl/*.json` (0 divergências). Os consertos foram provados numa cópia do código contra essa base.

## 1. Tabela causa x contagem x ids

| Classe | Causa | N | Ids | Conserto |
|---|---|---|---|---|
| **D1** | Título de agrupador cercado de linhas em branco (limite de 8 linhas *brutas* na varredura do título, decisão 23): "TÍTULO II" + 3 linhas de título + 3 em branco + "CAPÍTULO I" estoura o limite; o título vira `""` e as 3 linhas viram texto do parágrafo anterior | 1 | 38364 | `norma-core.js`, 1 linha |
| **D2** | Extração "Art .10." (espaço antes do ponto, número colado): não é lido como artigo; o último artigo engole o texto e sobra lacuna | 1 | 37136 | `ingestao/extracao-texto.mjs` (preparo) |
| **D3** | Epígrafe "LEI Nº COMPLEMENTAR Nº 848, DE 22 DE MARÇO DE 2019." (grafia nova: "Nº" duplo) | 1 | 42014 | `norma-core.js`, regex `reCab` |
| **B-corpo** | Arquivo sem corpo de lei: capa de caderno, placeholder, mapa/anexo, aviso | 8 | 44158, 40514, 36914, 36188, 40318, 40303, 36372, 39395 | nenhum no leitor; ver 3 (cabeçalho/fonte) |
| **B-fecho** | Lei da Câmara sem linha de local/data (nas 3 cópias do arquivo) | 1 | 39600 | nenhum |
| **A** | OCR sem conserto seguro | 3 | 41179, 41347, 36190 | nenhum (regra: OCR não se corrige) |
| **C-decidida** | Divergência de data cabeçalho x catálogo (decisão 2: o revisor decide) | 5 | 50793, 49654, 42586, 42577, 41463 | só melhorar o painel |
| **C-decidida** | Técnica "Art. N ......" sem aspa de abertura (decisão 11: a revisar até o revisor confirmar) | 2 | 48437, 48226 | nenhum; comportamento correto |

Total 22 = 3 + 8 + 1 + 3 + 5 + 2. Depois de D1+D2+D3: 3 normas saem de revisão (aceitas no acervo: 611 -> 614) e 19 ficam, todas por causa que o motor deve continuar acusando.

## 2. Classe D — consertos com prova nas 823 normas

Método: cópia do código no scratchpad, `estruturarNorma` nas 823 antes/depois, comparando motivos, avisos, nº de artigos e um hash da árvore (dispositivos, cabeçalho, fecho, ementa, preâmbulo).

### D1 — varredura do título do agrupador conta linha em branco (38364)
- Evidência (texto lido, linhas 1136-1146): `TÍTULO II` / (branco) / `DOS DEVERES, DAS PROIBIÇÕES, DOSIMPEDIMENTOS,` / (branco) / `DOS DIREITOS, DAS GARANTIAS, DASPRERROGATIVAS` / (branco) / `E DAS NORMAS DISCIPLINARES` / 3 brancos / `CAPÍTULO I`. São 3 linhas de título (dentro da decisão 23), mas o `while (k < lines.length && k - ini < 8)` conta linhas brutas e para antes de `CAPÍTULO I` (distância 9): `fim` fica vazio e o título é descartado. Resultado atual: `agrupadores: [{titulo,"II",""}]` e o texto "DOS DEVERES … DISCIPLINARES" colado ao `art-41/par-unico` — por isso o único motivo restante ("trecho não localizado": a árvore tem "imediato" + título, a origem tem "imediato" + "TÍTULO II" + título).
- Menor conserto (`patch-D1-titulo-agrupador.diff`, `norma-core.js` ~l. 699): `while (k < lines.length && extra.length <= 3 && k - ini < 40) {` — o limite passa a contar linhas não vazias (as 3 da decisão 23; a 4ª já invalida) e o teto bruto sobe para 40.
- Prova: perde motivo **1** (38364: `trecho_nao_localizado_na_origem`, vira aceita); ganha motivo **0**; a árvore muda em 2 normas: 38364 (esperado) e **30209** (Plano Diretor, quadro numérico): o título de "PARTE III" ganha o fim "FIG. 11- A" (legenda de figura que está 6 linhas abaixo do título, entre brancos). O título dessa parte já era lixo de cabeçalho de página ("URBANO AMBIENTAL … DO PLANO REGULADOR"); não muda motivo nenhum. Medido também com tetos 10, 12 e 16: mesmo efeito em 30209, então não é evitável só com o teto.
- Negativo (sintético, `neg.mjs`): título de 4 ou 5 linhas continua não sendo lido como título (texto fica no artigo anterior, como hoje); título de 3 linhas com brancos passa a ser lido. Contra o código antigo o caso de 3 linhas falha.
- Risco: baixo; efeito colateral conhecido em 30209 (acima), a registrar. O trecho está dentro de `parseMinuta`, que tem cópia embutida em `norma-simulacao.html` (CLAUDE.md): espelhar ou registrar a divergência.

### D2 — "Art .10." (37136)
- Evidência: o arquivo (3 cópias iguais; decisão 28 já remove as 2 extras) tem, em vez de `Art. 10.`, a linha `Art .10. Esta Lei Complementar entra em vigor na data desua publicação.`. `reArt` (`Art\.?\s*(\d+…`) não casa (após o espaço vem ".", não algarismo). Consequência em cadeia: o art. 9º engole a linha 10; o "Fica incluído art. 134-A no Título IV …" deixa de ser contíguo à origem (o bloco entre aspas fica no meio) -> `trecho_nao_localizado_na_origem`; e "Art10Estaleicomplementar…" (57 caracteres) vira `texto_fora_da_arvore`. Os dois motivos são um só defeito.
- Menor conserto (`patch-D2-art-espaco-ponto.diff`, só preparo, core intacto): nova função `colarPontoDoArtigo` encadeada em `prepararTextoExtraido`: `texto.replace(/^([ \t]*Art) \.(?=\d)/gm, '$1. ')`. Só age quando o número vem *colado* ao ponto. A conferência de conservação ignora espaço e pontuação, então o `alnum` da origem não muda.
- Prova: perde motivo **1** (37136: `texto_fora_da_arvore` + `trecho_nao_localizado_na_origem`, vira aceita; artigos 9 -> 10); ganha **0**; nenhuma outra árvore muda. Grep no acervo: só 4 arquivos têm `Art .N`/`Art . N`; os de forma "Art . 59 -" (espaço dos dois lados, Lei Orgânica escaneada, texto antigo) **não** são tocados de propósito (mudariam estrutura de documento antigo sem exemplo validado).
- Risco: baixo. Falta apenas fixture real de teste (usar `dados/textos/sapl/37136.txt` copiado para `fixtures/textos/`, como fez a rodada 40).

### D3 — "LEI Nº COMPLEMENTAR Nº 848" (42014)
- Evidência (primeira linha do texto lido, exata): `LEI Nº COMPLEMENTAR Nº 848, DE 22 DE MARÇO DE 2019.` Seguem ementa, "O PREFEITO MUNICIPAL DE PORTO ALEGRE", "Faço saber…", Art. 1º…, fecho "PREFEITURA MUNICIPAL DE PORTO ALEGRE, 22 de março de 2019." — a norma está íntegra; só a epígrafe tem o "Nº" a mais. `reCab` exige `LEI (COMPLEMENTAR )?Nº <dígitos>`; "LEI Nº COMPLEMENTAR" não casa. O fallback do estruturador (`cabecalho_fora_do_padrao`) também não (`^LEI\s*COMPLEMENTAR`). O segundo motivo (`tipo_diverge_do_catalogo`) vem de `parseMinuta` (l. ~746), que lê `^LEI\s+(COMPLEMENTAR\s+)?N[º°O]` -> "LEI Nº" e grava `tipoAto = "LEI"`; com o cabeçalho reconhecido, `parseLeiPublicada` sobrescreve o tipo e os dois motivos somem.
- Menor conserto (`patch-D3-lei-n-complementar.diff`, `norma-core.js` l. 263): `/^LEI\s+(?:N[º°O]\s*)?(COMPLEMENTAR\s+)?N[º°O]\s*([\d.]+)…/i` (primeiro "Nº" opcional).
- Prova: perde **2** motivos em **1** norma (42014, vira aceita); ganha **0**; só 1 arquivo do acervo tem essa grafia (`grep`). Negativos conferidos: "LEI Nº 14.504, DE 5 DE JANEIRO DE 2026." continua LEI 14504; "LEI COMPLEMENTAR Nº 320, …" igual; "LEI Nº COMPLEMENTAR, DE 22 DE MARÇO DE 2019." (sem número) continua `null`.
- Risco: baixo. Está em `extrairCabecalhoLeiPublicada`, exportada; existe cópia embutida em `norma-simulacao.html`.

### Prova conjunta (D1+D2+D3)
Normas que perdem motivo: **3** (38364, 37136, 42014); que ganham motivo: **0**; árvore diferente em 4 (as 3 + 30209). Aceitas 611 -> 614. Bateria inteira (32 `teste_*.mjs`) numa cópia completa do repositório com os 3 patches: contagens idênticas às da cópia sem patch, todos com código de saída 0; `normateste.mjs` byte a byte igual (md5 `51a637…`). Observação: a bateria não tem teste novo; seguindo a regra 5, é preciso escrever os testes (ver 6) e confirmar que falham no código antigo — os casos sintéticos de `neg.mjs` já falham antes (3 linhas com brancos; "LEI Nº COMPLEMENTAR"; "Art .10.").

## 3. Classe B — defeito de fonte

### 3.1 Cabeçalho, ementa e `sem_artigos` (8)
Primeiras linhas EXATAS dos textos lidos (nome de pessoa omitido):

| id | método / tamanho | primeiras linhas | por que `extrairCabecalhoLeiPublicada` não reconhece |
|---|---|---|---|
| 44158 | pdftotext, 509 car. | `Órgão de Divulgação do Município - Ano XXVII - Edição 6826 - quarta-feira, 17 de agosto de 2022` / `Divulgação: …` / `Publicação: …` / `Executivo - EXECUTIVO` / `Leis Complementares` / `Gabinete do Prefeito` / `Protocolo: 373730` / `LEI COMPLEMENTAR Nº 951, DE 17 DE AGOSTO DE 2022, que` | o epígrafe vem com `, que "dispõe sobre…"` colado na mesma linha (sem ponto final) e depois de 7 linhas de capa; o fallback do catálogo aceita (`cabecalho_fora_do_padrao`), por isso aqui o motivo é só `sem_artigos` + `sem_fecho`. É a **capa do caderno do Diário**, sem o corpo. |
| 40514 | html_sirel, 1.748 bytes | `LC 790` x4 (e `<`) | placeholder; nenhum cabeçalho |
| 36914, 36188 | html_sirel, 1.038 bytes | `<` | placeholder idêntico (mesmo sha256 `1d1fb3ba…`) em 4 normas do acervo (31822, 33244, 36188, 36914) |
| 40318 | pdftotext, 418 car. | `GERÊNCI A DE REDAÇÃO OFICI AL` / `TORNA SEM EFEITO a publicação da Lei Complementar nº` / `779, de 3 de novembro de 2015, no Diário Oficial de Porto` / `Alegre, no EXECUTIVO, do dia 5 de novembro de 2015,` … `por inserção indevida.` | é o **aviso** de que a publicação do dia 5/11/2015 foi tornada sem efeito; não é o texto da lei. A ementa do catálogo desse registro é a mesma frase do aviso (o registro herdou o aviso como ementa). |
| 40303 | OCR, 1 página | `PREFEITURA` / `(e PORTO` / `ALEGRE` / `SCEETARIA E URANTIMO` / `Mapa do Município de Porto Alegre` / `PL 007/2014 - ZONA RURAL` … | **mapa do anexo** (nome do arquivo: `R LC 775 Anexo.pdf`) |
| 36372 | OCR, 1 página | `PREFEITURA MUNICIPAL DE PROJETO INTEGRADO` / `PORTO ALEGRE DESENVOLVIMENTO SUSTENTÁVEL DA LOMBA DO PINHEIRO …` / `LEGENDA` … | **mapa do anexo III** (nome do arquivo: `LC630_Anexo III.pdf`) |
| 39395 | pdftotext, 202 alfanum. | `Anexo   5` / `47` / `45` / `02` / `Praça  97` / `Brigadeiro` / `Sampaio` | **tabela numérica de anexo** (nome do arquivo: `LC 738 Anexo.pdf`) |

Achado novo que muda o encaminhamento: nos 4 casos de anexo/aviso (40318, 40303, 39395, 36372) o catálogo tem `texto.situacao = "arquivo"` apontando para o anexo, **mas a `observacao` traz também o link do HTML do SIREL** (`…/sirel/Norma_<n>_<data>_1.html`), que o coletor não baixou porque `situacaoTexto` prefere `texto_integral`. Em 40514 o registro tem **dois** links na observação (`…_1.html`, que veio só com "LC 790", e `…_2.html`, nunca baixado). Cruzamento no acervo: dos 16 `sem_artigos`, 7 têm arquivo + link SIREL alternativo (30198, 31419, 32105, 36372, 39395, 40303, 40318). 44158 não tem link alternativo (observação vazia). Os dois placeholders de HTML (36914, 36188) **são** o HTML do SIREL: nada a recuperar por esse caminho.
- **Isto é ingestão (rede, 1 requisição por minuto), não leitor.** Não verifiquei (sem rede): se esses HTML têm o texto da lei. Hipótese testável com ~6 requisições (40318, 40303, 39395, 36372, 40514 `_2`, mais as demais da seção 3.3).
- Dashboard (para decidir rápido, sem inventar redação): na etapa "início do arquivo" de `roteiroDeConferencia` acrescentar uma linha de **pistas**: nome do arquivo (com selo se contiver "anexo"), tamanho (caracteres/alfanuméricos) e método (`ocr`, `html_sirel`, `texto_curto`), **o link alternativo da observação, se houver e for diferente do baixado**, e a ementa do catálogo ao lado das 8 primeiras linhas (em 40318 a ementa é o próprio aviso). Texto sugerido: "O arquivo não traz o texto da lei (N caracteres; nome: …). Há outro arquivo ligado a esta norma: <link>. Abra-o; se a lei estiver lá, marque 'defeito de fonte'." Decisão do revisor continua a de sempre (aceitar ou defeito de fonte, decisão 12).
- Opcional, decisão do mantenedor (já levantada em `PLANO-SEM-FECHO.md`): em norma com `sem_artigos`, o `sem_fecho` é redundante.

### 3.2 39600 (LC 743/2014, promulgada pela Câmara, sem linha de fecho)
Termina (nas 3 cópias) em `Art. 3º Esta Lei Complementar entra em vigor na data de sua publicação,retroagindo seus efeitos a 1º de agosto de 2013.` + assinatura "Presidente." + `Registre-se epublique-se:` + "1º Secretário." Não há "CÂMARA MUNICIPAL DE PORTO ALEGRE, <data>" em nenhuma cópia (confirmado de novo). Não é fecho de forma nova (não há local nem data). Dashboard: mostrar as últimas 12 linhas (já faz) e as datas do catálogo (`data` 2014-09-02, `dataPublicacao` 2014-09-08) ao lado, com "a linha de local e data não existe no arquivo". Há link SIREL alternativo (`Norma_743_20140902_1.html`) para conferir na seção 3.3.

### 3.3 Verificação que depende de rede (não feita)
Candidatas a texto melhor pelo link da observação (todas com `arquivo` + SIREL): 40318, 40303, 39395, 36372 (corpo ausente); 40514 (`_2.html`); 41179, 41347, 36190 (OCR); 39600 (fecho). Dos 44 textos de OCR do acervo, **41** têm link SIREL alternativo. Se o HTML for texto limpo, é a saída para o OCR *sem corrigir OCR* (troca de fonte, decisão de política de dados do mantenedor: portal legado da própria PGM, mesmo host do catálogo, e o SIREL já é fonte de 66 normas).

## 4. Classe A — OCR sem conserto seguro

- **41179** (LC 813/2017): primeira linha útil `E LEI COMPLEMENTAR Nº 813, DE 20 DE MARÇO DE 2017. ST` (lixo de OCR antes e depois do cabeçalho); fecho `PREFEITURA MUNIÇIPAL DE PORTO ALEGRE, 20 de março de 2017.` ("MUNIÇIPAL"); no art. 2º a linha `CRMCL CRECI PLC UNE SL …` substitui o resto do bloco. Prova de um afrouxamento só para o cabeçalho (descartar até 3 caracteres antes de "LEI" quando `ocr`): recupera 41179 e 26639 (antiga), 0 ganhos; mas 41179 continuaria `sem_fecho`. **Recomendação: não fazer** (ganho de 2 normas, uma delas continua em revisão; abre exceção de OCR).
- **41347** (LC 818/2017): `alteracao_sem_aspas_nao_delimitada` é **acerto** do detector: "Art. 1º Fica incluída al. d no inc. I … conforme segue:" e o texto da alínea **não está** no OCR (vai direto ao "Art. 2º"). Fecho: `PREFEITURA M ALEGRE, 11 de setembro de 2017.`. Erro real, continua acusado (decisão 10).
- **36190** (LC 624/2009, OCR de 35 páginas): bloco falso por aspa solta, "Art." ilegível e quadro de croquis (já em `PLANO-SEM-FECHO.md` D' e `PLANO-TRECHO-NAO-LOCALIZADO.md` G9). Sem conserto proposto.

## 5. Classe C — decisões do mantenedor

### 5.1 `data_diverge_do_catalogo` (decisão 2: o revisor decide caso a caso) — 5 normas
Em todas, cabeçalho, preâmbulo (quando há) e fecho concordam entre si; o catálogo é quem difere. No acervo todo o motivo aparece em só 9 normas (8 com cabeçalho = fecho).

| id | cabeçalho = fecho | catálogo `data` | catálogo `dataPublicacao` | diferença |
|---|---|---|---|---|
| 50793 (LC 1.062/2025) | 2025-12-22 | 2025-12-15 | 2025-12-29 | -7 dias |
| 49654 (LC 1.031/2024) | 2024-12-30 | 2025-01-30 | 2025-01-03 | +31 dias; **o catálogo é incoerente em si**: `ano` 2024 mas `data` em 2025, e `data` > `dataPublicacao` |
| 42586 (LC 882/2020) | 2020-05-20 | 2020-05-21 | 2020-05-22 | +1 |
| 42577 (LC 878/2020, Câmara) | 2020-03-12 (cabeçalho, preâmbulo "Lei Complementar nº 878, de 12 de março de 2020" e fecho) | 2020-05-15 | 2020-05-18 | +64 |
| 41463 (LC 822/2017) | 2017-12-13 | 2017-12-12 | 2017-12-18 | -1 |

- O painel mostra hoje só duas datas (`norma.datas = { arquivo, catalogo }`). Proposta (sem decidir pelo revisor): mostrar **cinco** valores lado a lado: cabeçalho, preâmbulo (quando traz a data), fecho, `data` e `dataPublicacao` do catálogo; destacar "cabeçalho = fecho (arquivo coerente consigo mesmo)" e, quando verdadeiro, "catálogo: data posterior à publicação" / "ano do catálogo diferente do ano da data" (49654). É só informação; a escolha segue sendo do revisor.
- Não achei nenhum caso em que a data do arquivo seja a errada.

### 5.2 `aspa_de_abertura_ausente` — 48437 e 48226
Exatamente a forma da decisão 11: `Art. 4º .......` (48226, linha 9) e `Art. 3º …`/`Art. 10 … Art. 3º …` seguidos de linhas de pontos e `” (NR)` (48437, linhas 40-48), logo após introdução que cita o mesmo artigo. Fronteira inferida com confiança média, sai "a revisar" até o revisor confirmar. **Nada a fazer.** Nota sobre 48226: `promulgacaoParcial.suspeita = true` (cabeçalho 2022-12-22 x fecho 2023-02-23), sinal que já existe e não bloqueia.

## 6. Menor conserto por causa e onde (resumo)

| Causa | Onde | Linhas | Teste sugerido (real) |
|---|---|---|---|
| D1 | `norma-core.js` ~l. 699 (+ espelho em `norma-simulacao.html`) | 1 | 38364: agrupador "TÍTULO II" com título lido (e ausente do `par-unico` do art. 41); negativo: título de 4 linhas continua não sendo título |
| D2 | `ingestao/extracao-texto.mjs`, `colarPontoDoArtigo` + encadeamento em `prepararTextoExtraido` | ~8 | 37136: 10 artigos, sem lacuna; negativo: "Art . 59 -" intocado |
| D3 | `norma-core.js` l. 263 (+ espelho) | 1 | 42014: `extrairCabecalhoLeiPublicada` devolve LC 848, 2019-03-22; negativos: "LEI Nº 14.504", "LEI Nº COMPLEMENTAR," sem número |
| Painel B | `ingestao/revisao.mjs` (`roteiroDeConferencia`) e `gerar-revisao.mjs` | ~30 | `teste_revisao.mjs`: pistas (nome do arquivo, link alternativo) em 40303 e 44158 |
| Painel datas | `ingestao/gerar-revisao.mjs` l. 93 | ~10 | 49654 (catálogo incoerente), 41463 |

Patches (aplicam com `git apply --check`): `patch-D1-titulo-agrupador.diff`, `patch-D2-art-espaco-ponto.diff`, `patch-D3-lei-n-complementar.diff` no scratchpad. Regras do projeto a cumprir na integração: bateria antes/depois (feita aqui, idêntica), teste novo que falha no código antigo, `normateste.mjs` byte a byte, CHANGELOG, subir `VERSAO_ESTRUTURADOR` (17 -> 18) para reprocessar, e o espelho em `norma-simulacao.html` para D1/D3.

## 7. Decisão do mantenedor (não é código)

1. Trocar de fonte quando o catálogo traz `arquivo` anexo/aviso ou OCR e a `observacao` traz o HTML do SIREL (política de dados; ingestão, com a etiqueta de 1 requisição por minuto). Alternativa: só mostrar o link ao revisor (item 3.1).
2. Afrouxar o cabeçalho em OCR (41179/26639): recomendo **não**.
3. Ocultar `sem_fecho` quando já há `sem_artigos` (já pendente em `PLANO-SEM-FECHO.md`).
4. Aceitar o efeito de D1 em 30209 (título do "PARTE III" ganha "FIG. 11- A").
5. Painel de datas com cinco valores (item 5.1).

## 8. Ordem de ataque

1. D3 (1 linha, 1 norma, risco mínimo) e D2 (preparo, 1 norma), com fixtures reais e testes que falham antes.
2. D1 (1 linha; registrar o efeito em 30209).
3. Painel: pistas do roteiro "início do arquivo" e datas (sem mudar o motor).
4. Em horário permitido pela etiqueta de rede e fora da janela da coleta noturna: baixar à mão (1 por minuto) os HTML da seção 3.3 e decidir a troca de fonte.
5. Reprocessar (`VERSAO_ESTRUTURADOR` 18) só depois de 1 e 2.

## 9. O que não consegui verificar

- Conteúdo dos HTML do SIREL alternativos (40318, 40303, 39395, 36372, 40514 `_2`, 41179, 41347, 36190, 39600): sem rede. É a hipótese que mais pode reduzir o resíduo.
- Os PDF/DOCX originais (`dados/_bruto/` ausente): "capa de caderno" de 44158 e "sem linha de fecho" de 39600 são inferências do texto extraído; 44158 pode ter páginas só-imagem que o `pdftotext` não leu (o arquivo tem 86 KB para 509 caracteres de texto).
- Se `norma-simulacao.html` já contém exatamente os trechos de D1/D3 (não abri o HTML).
- Os testes novos (apenas protótipos sintéticos no scratchpad; não escrevi `.mjs` no repositório, por ser somente leitura).
