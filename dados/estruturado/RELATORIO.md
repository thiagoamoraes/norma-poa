# Estruturação — relatório

Gerado em 2026-11-21T09:25:20.864Z por `ingestao/estruturar.mjs` (versão do estruturador: 19). Não editar à mão.

Uma norma só é **aceita** quando passa em todas as conferências: cabeçalho igual ao do catálogo (número, data, tipo), artigos numerados sem salto, rótulos iguais aos do texto de origem, nenhum texto fora da árvore, fecho presente. O resto vai para **revisar**, com o motivo.

Textos baixados: 1121 · com texto extraído e estruturados: 1109

| Situação | Normas | % |
|---|---|---|
| aceita | 758 | 68.3% |
| revisar | 351 | 31.7% |

## Por época (corte: sanção da LC 611, 03/02/2009)

Antes do corte a técnica legislativa era outra: falhas de compilação são esperadas e não medem o leitor. **A taxa das recentes é a que mede o motor.**

| Época | Aceitas | A revisar | Taxa de aceitação |
|---|---|---|---|
| recente | 553 | 58 | 90.5% |
| antiga | 205 | 293 | 41.2% |

## Revisão humana

O motor lê; o revisor decide em `docs/revisao.html`. **Aceita pelo motor** e **aceita por humano** são contadas separadamente: só a primeira mede o leitor. Decisão de versão antiga do texto ou do leitor volta como **desatualizada**.

| Situação | Recentes | Antigas | Total |
|---|---|---|---|
| aceita motor | 553 | 205 | 758 |
| aceita humano | 0 | 0 | 0 |
| corrigida | 0 | 0 | 0 |
| defeito de fonte | 0 | 0 | 0 |
| encaminhada | 0 | 0 | 0 |
| pendente | 58 | 293 | 351 |
| desatualizada | 0 | 0 | 0 |



### Motivos de revisão nas recentes

| Motivo | Normas |
|---|---|
| `rotulo_nao_confere_com_a_origem` | 28 |
| `sem_fecho` | 13 |
| `cabecalho_nao_reconhecido` | 10 |
| `bloco_sem_fechamento_de_aspas` | 10 |
| `data_diverge_do_catalogo` | 8 |
| `sem_artigos` | 8 |
| `bloco_de_alteracao_sem_dono` | 4 |
| `trecho_nao_localizado_na_origem` | 4 |
| `texto_fora_da_arvore` | 3 |
| `aspa_de_abertura_ausente` | 3 |
| `alteracao_sem_aspas_nao_delimitada` | 3 |
| `promulgacao_parcial` | 2 |
| `numero_diverge_do_catalogo` | 1 |

## Motivos de revisão (todas as épocas)

(uma norma pode ter mais de um)

| Motivo | Normas | % do total |
|---|---|---|
| `rotulo_nao_confere_com_a_origem` | 224 | 20.2% |
| `cabecalho_nao_reconhecido` | 222 | 20% |
| `sem_fecho` | 144 | 13% |
| `trecho_nao_localizado_na_origem` | 58 | 5.2% |
| `bloco_de_alteracao_sem_dono` | 49 | 4.4% |
| `texto_fora_da_arvore` | 48 | 4.3% |
| `sem_artigos` | 38 | 3.4% |
| `bloco_sem_fechamento_de_aspas` | 27 | 2.4% |
| `promulgacao_parcial` | 15 | 1.4% |
| `data_diverge_do_catalogo` | 11 | 1% |
| `tipo_sem_suporte` | 8 | 0.7% |
| `alteracao_sem_aspas_nao_delimitada` | 6 | 0.5% |
| `aspa_de_abertura_ausente` | 3 | 0.3% |
| `numero_diverge_do_catalogo` | 1 | 0.1% |

## Textos idênticos em registros diferentes

A fonte liga o mesmo texto a mais de um registro; o catálogo não é corrigido e o dashboard avisa.

- `18218` = `19746`
- `18490` = `21857`, `19808`, `19667`, `19519`, `19021`, `18502`
- `18502` = `21857`, `19808`, `19667`, `19519`, `19021`, `18490`
- `19021` = `21857`, `19808`, `19667`, `19519`, `18502`, `18490`
- `19330` = `29170`
- `19519` = `21857`, `19808`, `19667`, `19021`, `18502`, `18490`
- `19667` = `21857`, `19808`, `19519`, `19021`, `18502`, `18490`
- `19746` = `18218`
- `19808` = `21857`, `19667`, `19519`, `19021`, `18502`, `18490`
- `21857` = `19808`, `19667`, `19519`, `19021`, `18502`, `18490`
- `23346` = `23347`
- `23347` = `23346`
- `26196` = `26363`
- `26363` = `26196`
- `29170` = `19330`
- `31822` = `33244`, `36914`, `36188`
- `32299` = `32300`
- `32300` = `32299`
- `33244` = `36914`, `36188`, `31822`
- `36188` = `33244`, `36914`, `31822`
- `36914` = `33244`, `36188`, `31822`
- `42987` = `43595`
- `43595` = `42987`

## Avisos (não reprovam)

| Aviso | Normas | % do total |
|---|---|---|
| `cabecalho_fora_do_padrao` | 196 | 17.7% |
| `tem_anexo` | 94 | 8.5% |
| `texto_de_ocr` | 68 | 6.1% |
| `paragrafo_numerado_sem_irmao` | 20 | 1.8% |
| `dispositivo_muito_longo` | 15 | 1.4% |
| `possivel_dispositivo_embutido` | 15 | 1.4% |

## Fila de revisão — recentes (prioridade; só pendentes e desatualizadas)

- Emenda à Lei Orgânica nº 43, de 25 de maio de 2017 (`44305`): cabecalho_nao_reconhecido, sem_fecho, rotulo_nao_confere_com_a_origem, bloco_de_alteracao_sem_dono
- Emenda à Lei Orgânica nº 42, de 03 de agosto de 2016 (`44307`): cabecalho_nao_reconhecido, texto_fora_da_arvore, trecho_nao_localizado_na_origem, rotulo_nao_confere_com_a_origem, bloco_de_alteracao_sem_dono
- Emenda à Lei Orgânica nº 35, de 18 de junho de 2012 (`38297`): bloco_sem_fechamento_de_aspas
- Emenda à Lei Orgânica nº 31, de 15 de junho de 2011 (`37352`): bloco_sem_fechamento_de_aspas
- Lei Complementar municipal nº 1.075, de 14 de julho de 2026 (`51485`): promulgacao_parcial, rotulo_nao_confere_com_a_origem, bloco_de_alteracao_sem_dono
- Lei Complementar municipal nº 1.074, de 09 de julho de 2026 (`51463`): bloco_sem_fechamento_de_aspas, aspa_de_abertura_ausente
- Lei Complementar municipal nº 1.062, de 15 de dezembro de 2025 (`50793`): data_diverge_do_catalogo
- Lei Complementar municipal nº 1.037, de 02 de fevereiro de 2025 (`49739`): rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 1.031, de 30 de janeiro de 2025 (`49654`): data_diverge_do_catalogo
- Lei Complementar municipal nº 1.011, de 10 de maio de 2024 (`48437`): aspa_de_abertura_ausente
- Lei Complementar municipal nº 964, de 22 de dezembro de 2022 (`48226`): aspa_de_abertura_ausente
- Lei Complementar municipal nº 957, de 28 de setembro de 2022 (`44376`): rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 951, de 17 de agosto de 2022 (`44158`): sem_artigos, sem_fecho
- Lei Complementar municipal nº 932, de 06 de janeiro de 2022 (`43595`): rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 925, de 20 de dezembro de 2021 (`43543`): rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 915, de 29 de setembro de 2021 (`43376`): rotulo_nao_confere_com_a_origem, alteracao_sem_aspas_nao_delimitada
- Lei Complementar municipal nº 896, de 05 de janeiro de 2021 (`42987`): numero_diverge_do_catalogo, data_diverge_do_catalogo, rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 882, de 21 de maio de 2020 (`42586`): data_diverge_do_catalogo
- Lei Complementar municipal nº 878, de 15 de maio de 2020 (`42577`): data_diverge_do_catalogo
- Lei Complementar municipal nº 872, de 10 de janeiro de 2020 (`42401`): promulgacao_parcial, rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 868, de 10 de dezembro de 2019 (`42356`): rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 859, de 03 de setembro de 2019 (`42216`): bloco_sem_fechamento_de_aspas
- Lei Complementar municipal nº 835, de 26 de julho de 2018 (`41723`): rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 822, de 12 de dezembro de 2017 (`41463`): data_diverge_do_catalogo
- Lei Complementar municipal nº 818, de 11 de setembro de 2017 (`41347`): sem_fecho, alteracao_sem_aspas_nao_delimitada
- Lei Complementar municipal nº 813, de 20 de março de 2017 (`41179`): cabecalho_nao_reconhecido, sem_fecho, bloco_sem_fechamento_de_aspas
- Lei Complementar municipal nº 810, de 04 de janeiro de 2017 (`41098`): rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 790, de 10 de fevereiro de 2016 (`40514`): cabecalho_nao_reconhecido, sem_artigos, sem_fecho
- Lei Complementar municipal nº 779, de 03 de novembro de 2015 (`40318`): cabecalho_nao_reconhecido, sem_artigos, sem_fecho
- Lei Complementar municipal nº 777, de 28 de outubro de 2015 (`40311`): rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 775, de 23 de outubro de 2015 (`40303`): cabecalho_nao_reconhecido, sem_artigos, sem_fecho
- Lei Complementar municipal nº 766, de 21 de julho de 2015 (`40134`): bloco_sem_fechamento_de_aspas
- Lei Complementar municipal nº 757, de 14 de janeiro de 2015 (`39862`): rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 755, de 30 de dezembro de 2014 (`39825`): bloco_sem_fechamento_de_aspas
- Lei Complementar municipal nº 743, de 02 de setembro de 2014 (`39600`): sem_fecho
- Lei Complementar municipal nº 738, de 02 de maio de 2014 (`39395`): cabecalho_nao_reconhecido, sem_artigos, sem_fecho
- Lei Complementar municipal nº 733, de 24 de janeiro de 2014 (`39258`): bloco_sem_fechamento_de_aspas
- Lei Complementar municipal nº 721, de 29 de novembro de 2013 (`39138`): rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 694, de 21 de maio de 2012 (`38249`): rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 690, de 17 de fevereiro de 2012 (`38051`): bloco_sem_fechamento_de_aspas
- Lei Complementar municipal nº 688, de 15 de fevereiro de 2012 (`38041`): rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 679, de 26 de agosto de 2011 (`37517`): rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 678, de 22 de agosto de 2011 (`37491`): rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 677, de 19 de julho de 2011 (`37422`): rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 663, de 28 de dezembro de 2010 (`37090`): rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 661, de 07 de dezembro de 2010 (`37042`): rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 660, de 07 de dezembro de 2010 (`37041`): rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 652, de 13 de setembro de 2010 (`36914`): cabecalho_nao_reconhecido, sem_artigos, sem_fecho
- Lei Complementar municipal nº 646, de 22 de julho de 2010 (`36841`): texto_fora_da_arvore, trecho_nao_localizado_na_origem, rotulo_nao_confere_com_a_origem, bloco_de_alteracao_sem_dono, bloco_sem_fechamento_de_aspas, alteracao_sem_aspas_nao_delimitada
- Lei Complementar municipal nº 638, de 04 de março de 2010 (`36634`): rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 630, de 01 de outubro de 2009 (`36372`): cabecalho_nao_reconhecido, sem_artigos, sem_fecho
- Lei Complementar municipal nº 628, de 17 de agosto de 2009 (`36316`): rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 624, de 25 de junho de 2009 (`36190`): sem_fecho, texto_fora_da_arvore, trecho_nao_localizado_na_origem
- Lei Complementar municipal nº 623, de 23 de junho de 2009 (`36188`): cabecalho_nao_reconhecido, sem_artigos, sem_fecho
- Lei municipal nº 14.675, de 30 de outubro de 2026 (`51819`): data_diverge_do_catalogo
- Lei municipal nº 14.667, de 25 de setembro de 2026 (`51804`): rotulo_nao_confere_com_a_origem
- Lei municipal nº 14.619, de 31 de julho de 2026 (`51579`): data_diverge_do_catalogo
- Lei municipal nº 14.578, de 02 de julho de 2026 (`51452`): trecho_nao_localizado_na_origem

## Fila de revisão — antigas (antes da LC 611; revisão humana esperada)



- Lei Orgânica nº 1, de 03 de abril de 1990 (`25277`): cabecalho_nao_reconhecido, tipo_sem_suporte, sem_fecho, rotulo_nao_confere_com_a_origem
- Lei Orgânica nº 1, de 15 de dezembro de 1970 (`16471`): cabecalho_nao_reconhecido, tipo_sem_suporte, trecho_nao_localizado_na_origem, rotulo_nao_confere_com_a_origem, bloco_de_alteracao_sem_dono
- Lei Orgânica nº 1, de 24 de setembro de 1962 (`13529`): cabecalho_nao_reconhecido, tipo_sem_suporte, sem_fecho, texto_fora_da_arvore, trecho_nao_localizado_na_origem, rotulo_nao_confere_com_a_origem, bloco_de_alteracao_sem_dono
- Lei Orgânica nº 1, de 21 de setembro de 1956 (`11440`): cabecalho_nao_reconhecido, tipo_sem_suporte, sem_fecho, texto_fora_da_arvore, trecho_nao_localizado_na_origem, rotulo_nao_confere_com_a_origem
- Lei Orgânica nº 1, de 03 de abril de 1948 (`9133`): cabecalho_nao_reconhecido, tipo_sem_suporte, sem_fecho, texto_fora_da_arvore, trecho_nao_localizado_na_origem, rotulo_nao_confere_com_a_origem
- Lei Orgânica-PMPA nº 1, de 05 de março de 1936 (`8079`): cabecalho_nao_reconhecido, tipo_sem_suporte, sem_fecho, texto_fora_da_arvore, trecho_nao_localizado_na_origem, rotulo_nao_confere_com_a_origem, bloco_de_alteracao_sem_dono
- Lei Orgânica-Intendência nº 1, de 09 de abril de 1928 (`44366`): cabecalho_nao_reconhecido, tipo_sem_suporte, sem_fecho, trecho_nao_localizado_na_origem, rotulo_nao_confere_com_a_origem
- Lei Orgânica-Intendência nº 1, de 14 de outubro de 1892 (`44328`): cabecalho_nao_reconhecido, tipo_sem_suporte, sem_fecho, trecho_nao_localizado_na_origem, rotulo_nao_confere_com_a_origem
- Emenda à Lei Orgânica nº 24, de 31 de agosto de 2006 (`34476`): cabecalho_nao_reconhecido
- Emenda à Lei Orgânica nº 21, de 11 de junho de 2004 (`33244`): cabecalho_nao_reconhecido, sem_artigos, sem_fecho
- Emenda à Lei Orgânica nº 17, de 14 de setembro de 2001 (`31419`): sem_artigos, sem_fecho, texto_fora_da_arvore, bloco_de_alteracao_sem_dono
- Emenda à Lei Orgânica nº 16, de 10 de outubro de 2000 (`30834`): data_diverge_do_catalogo, bloco_sem_fechamento_de_aspas
- Emenda à Lei Orgânica nº 15, de 26 de novembro de 1999 (`30198`): cabecalho_nao_reconhecido, sem_artigos, sem_fecho
- Emenda à Lei Orgânica nº 14, de 10 de agosto de 1998 (`29490`): cabecalho_nao_reconhecido, sem_fecho, bloco_de_alteracao_sem_dono
- Emenda à Lei Orgânica nº 13, de 12 de dezembro de 1997 (`29170`): cabecalho_nao_reconhecido, sem_fecho
- Emenda à Lei Orgânica nº 12, de 12 de dezembro de 1997 (`29169`): cabecalho_nao_reconhecido, rotulo_nao_confere_com_a_origem
- Emenda à Lei Orgânica nº 10, de 13 de dezembro de 1996 (`28780`): sem_fecho
- Emenda à Lei Orgânica nº 9, de 04 de abril de 1995 (`28032`): cabecalho_nao_reconhecido
- Emenda à Lei Orgânica nº 7, de 26 de setembro de 1994 (`27784`): cabecalho_nao_reconhecido, rotulo_nao_confere_com_a_origem, bloco_sem_fechamento_de_aspas
- Emenda à Lei Orgânica nº 6, de 15 de dezembro de 1993 (`27395`): trecho_nao_localizado_na_origem, rotulo_nao_confere_com_a_origem
- Emenda à Lei Orgânica nº 5, de 08 de dezembro de 1993 (`27386`): cabecalho_nao_reconhecido, sem_fecho
- Emenda à Lei Orgânica nº 4, de 22 de novembro de 1993 (`27350`): sem_fecho, rotulo_nao_confere_com_a_origem, bloco_de_alteracao_sem_dono
- Emenda à Lei Orgânica nº 3, de 04 de novembro de 1992 (`26754`): cabecalho_nao_reconhecido, sem_fecho
- Emenda à Lei Orgânica nº 2, de 31 de março de 1992 (`26405`): rotulo_nao_confere_com_a_origem, bloco_de_alteracao_sem_dono
- Emenda à Lei Orgânica nº 13, de 25 de novembro de 1977 (`19330`): cabecalho_nao_reconhecido, sem_fecho
- Emenda à Lei Orgânica nº 11, de 15 de dezembro de 1970 (`16472`): cabecalho_nao_reconhecido, sem_fecho, texto_fora_da_arvore, trecho_nao_localizado_na_origem, rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 606, de 29 de dezembro de 2008 (`35933`): alteracao_sem_aspas_nao_delimitada
- Lei Complementar municipal nº 604, de 29 de dezembro de 2008 (`35931`): data_diverge_do_catalogo
- Lei Complementar municipal nº 584, de 27 de dezembro de 2007 (`35288`): rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 544, de 26 de janeiro de 2006 (`34142`): data_diverge_do_catalogo
- Lei Complementar municipal nº 540, de 29 de dezembro de 2005 (`34079`): bloco_sem_fechamento_de_aspas
- Lei Complementar municipal nº 534, de 28 de dezembro de 2005 (`34065`): rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 519, de 29 de dezembro de 2004 (`33620`): trecho_nao_localizado_na_origem, rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 501, de 30 de dezembro de 2003 (`32958`): texto_fora_da_arvore, trecho_nao_localizado_na_origem, rotulo_nao_confere_com_a_origem, bloco_de_alteracao_sem_dono
- Lei Complementar municipal nº 493, de 19 de agosto de 2003 (`32661`): rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 482, de 26 de dezembro de 2002 (`32300`): promulgacao_parcial, rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 482, de 26 de dezembro de 2002 (`32299`): promulgacao_parcial, rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 478, de 26 de setembro de 2002 (`32105`): promulgacao_parcial, sem_artigos, sem_fecho
- Lei Complementar municipal nº 473, de 02 de abril de 2002 (`31822`): cabecalho_nao_reconhecido, sem_artigos, sem_fecho
- Lei Complementar municipal nº 472, de 07 de janeiro de 2002 (`31736`): rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 471, de 02 de janeiro de 2002 (`31725`): rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 466, de 06 de setembro de 2001 (`31404`): rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 465, de 23 de agosto de 2001 (`31373`): texto_fora_da_arvore, trecho_nao_localizado_na_origem, bloco_sem_fechamento_de_aspas
- Lei Complementar municipal nº 463, de 23 de janeiro de 2001 (`31066`): promulgacao_parcial, cabecalho_nao_reconhecido, sem_fecho, texto_fora_da_arvore, trecho_nao_localizado_na_origem, rotulo_nao_confere_com_a_origem, bloco_de_alteracao_sem_dono
- Lei Complementar municipal nº 461, de 28 de dezembro de 2000 (`31027`): rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 460, de 22 de dezembro de 2000 (`31004`): rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 459, de 07 de dezembro de 2000 (`30950`): cabecalho_nao_reconhecido, sem_fecho
- Lei Complementar municipal nº 455, de 01 de setembro de 2000 (`30749`): rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 453, de 02 de agosto de 2000 (`30711`): bloco_sem_fechamento_de_aspas
- Lei Complementar municipal nº 451, de 28 de julho de 2000 (`30698`): rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 450, de 06 de julho de 2000 (`30641`): bloco_sem_fechamento_de_aspas
- Lei Complementar municipal nº 447, de 10 de maio de 2000 (`30519`): rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 445, de 19 de abril de 2000 (`30483`): texto_fora_da_arvore, trecho_nao_localizado_na_origem, rotulo_nao_confere_com_a_origem, bloco_de_alteracao_sem_dono
- Lei Complementar municipal nº 437, de 29 de dezembro de 1999 (`30298`): rotulo_nao_confere_com_a_origem, bloco_sem_fechamento_de_aspas
- Lei Complementar municipal nº 434, de 01 de dezembro de 1999 (`30209`): texto_fora_da_arvore, trecho_nao_localizado_na_origem, rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 426, de 29 de dezembro de 1998 (`29705`): bloco_sem_fechamento_de_aspas
- Lei Complementar municipal nº 425, de 13 de outubro de 1998 (`29581`): bloco_sem_fechamento_de_aspas
- Lei Complementar municipal nº 424, de 18 de setembro de 1998 (`29544`): cabecalho_nao_reconhecido, sem_fecho
- Lei Complementar municipal nº 422, de 09 de setembro de 1998 (`29528`): bloco_sem_fechamento_de_aspas
- Lei Complementar municipal nº 418, de 16 de junho de 1998 (`29418`): rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 417, de 10 de junho de 1998 (`29409`): bloco_sem_fechamento_de_aspas
- Lei Complementar municipal nº 415, de 07 de abril de 1998 (`29327`): cabecalho_nao_reconhecido, sem_fecho, rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 410, de 02 de abril de 1998 (`29316`): promulgacao_parcial, sem_artigos, sem_fecho, texto_fora_da_arvore, trecho_nao_localizado_na_origem, bloco_de_alteracao_sem_dono
- Lei Complementar municipal nº 412, de 24 de março de 1998 (`29309`): sem_fecho
- Lei Complementar municipal nº 410, de 20 de janeiro de 1998 (`29259`): bloco_sem_fechamento_de_aspas
- Lei Complementar municipal nº 404, de 14 de novembro de 1997 (`29125`): rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 402, de 25 de setembro de 1997 (`29061`): rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 400, de 27 de junho de 1997 (`28977`): rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 399, de 14 de janeiro de 1997 (`28863`): rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 398, de 13 de janeiro de 1997 (`28859`): bloco_sem_fechamento_de_aspas
- Lei Complementar municipal nº 397, de 13 de janeiro de 1997 (`28858`): cabecalho_nao_reconhecido, rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 395, de 26 de dezembro de 1996 (`28813`): sem_fecho, rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 390, de 05 de dezembro de 1996 (`28766`): sem_fecho
- Lei Complementar municipal nº 388, de 07 de novembro de 1996 (`28716`): cabecalho_nao_reconhecido, sem_fecho
- Lei Complementar municipal nº 385, de 18 de setembro de 1996 (`28637`): texto_fora_da_arvore, bloco_de_alteracao_sem_dono, bloco_sem_fechamento_de_aspas
- Lei Complementar municipal nº 380, de 01 de julho de 1996 (`28547`): cabecalho_nao_reconhecido, sem_fecho, rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 379, de 24 de junho de 1996 (`28539`): cabecalho_nao_reconhecido, sem_fecho, rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 375, de 24 de maio de 1996 (`28496`): cabecalho_nao_reconhecido, sem_fecho
- Lei Complementar municipal nº 373, de 25 de janeiro de 1996 (`28404`): rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 372, de 22 de janeiro de 1996 (`28399`): cabecalho_nao_reconhecido, sem_fecho
- Lei Complementar municipal nº 371, de 18 de janeiro de 1996 (`28392`): cabecalho_nao_reconhecido, sem_fecho, rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 370, de 16 de janeiro de 1996 (`28387`): cabecalho_nao_reconhecido, sem_fecho, rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 369, de 16 de janeiro de 1996 (`28386`): cabecalho_nao_reconhecido, rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 368, de 08 de janeiro de 1996 (`28369`): cabecalho_nao_reconhecido, sem_fecho, texto_fora_da_arvore, trecho_nao_localizado_na_origem, rotulo_nao_confere_com_a_origem, bloco_de_alteracao_sem_dono
- Lei Complementar municipal nº 367, de 08 de janeiro de 1996 (`28368`): cabecalho_nao_reconhecido, rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 364, de 28 de dezembro de 1995 (`28340`): cabecalho_nao_reconhecido, texto_fora_da_arvore, trecho_nao_localizado_na_origem, rotulo_nao_confere_com_a_origem, bloco_de_alteracao_sem_dono
- Lei Complementar municipal nº 363, de 28 de dezembro de 1995 (`28339`): cabecalho_nao_reconhecido, rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 361, de 19 de dezembro de 1995 (`28320`): cabecalho_nao_reconhecido, rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 360, de 06 de dezembro de 1995 (`28300`): cabecalho_nao_reconhecido, sem_fecho, rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 359, de 29 de novembro de 1995 (`28289`): cabecalho_nao_reconhecido, sem_fecho, rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 357, de 02 de outubro de 1995 (`28203`): cabecalho_nao_reconhecido
- Lei Complementar municipal nº 356, de 15 de setembro de 1995 (`28190`): cabecalho_nao_reconhecido
- Lei Complementar municipal nº 354, de 23 de agosto de 1995 (`28156`): cabecalho_nao_reconhecido, rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 352, de 08 de agosto de 1995 (`28148`): cabecalho_nao_reconhecido, rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 351, de 10 de julho de 1995 (`28118`): cabecalho_nao_reconhecido, sem_fecho, texto_fora_da_arvore, trecho_nao_localizado_na_origem, rotulo_nao_confere_com_a_origem, bloco_de_alteracao_sem_dono
- Lei Complementar municipal nº 350, de 10 de julho de 1995 (`28117`): cabecalho_nao_reconhecido, texto_fora_da_arvore, trecho_nao_localizado_na_origem, rotulo_nao_confere_com_a_origem, bloco_de_alteracao_sem_dono
- Lei Complementar municipal nº 349, de 13 de junho de 1995 (`28092`): rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 347, de 30 de maio de 1995 (`28080`): cabecalho_nao_reconhecido, sem_fecho, rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 346, de 17 de abril de 1995 (`28047`): cabecalho_nao_reconhecido, rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 344, de 20 de março de 1995 (`28021`): cabecalho_nao_reconhecido, sem_fecho, rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 342, de 09 de março de 1995 (`28014`): cabecalho_nao_reconhecido, rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 340, de 12 de janeiro de 1995 (`27973`): cabecalho_nao_reconhecido, sem_fecho, rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 339, de 12 de janeiro de 1995 (`27972`): cabecalho_nao_reconhecido, sem_fecho
- Lei Complementar municipal nº 338, de 12 de janeiro de 1995 (`27971`): cabecalho_nao_reconhecido, sem_fecho, texto_fora_da_arvore, trecho_nao_localizado_na_origem
- Lei Complementar municipal nº 337, de 10 de janeiro de 1995 (`27968`): cabecalho_nao_reconhecido, sem_fecho, rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 336, de 06 de janeiro de 1995 (`27966`): cabecalho_nao_reconhecido, rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 334, de 27 de dezembro de 1994 (`27924`): cabecalho_nao_reconhecido, rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 331, de 25 de novembro de 1994 (`27875`): rotulo_nao_confere_com_a_origem, bloco_de_alteracao_sem_dono
- Lei Complementar municipal nº 329, de 06 de setembro de 1994 (`27750`): bloco_sem_fechamento_de_aspas
- Lei Complementar municipal nº 328, de 27 de julho de 1994 (`27707`): cabecalho_nao_reconhecido, rotulo_nao_confere_com_a_origem, bloco_de_alteracao_sem_dono
- Lei Complementar municipal nº 326, de 11 de julho de 1994 (`27684`): cabecalho_nao_reconhecido, sem_fecho, bloco_sem_fechamento_de_aspas
- Lei Complementar municipal nº 325, de 07 de julho de 1994 (`27682`): cabecalho_nao_reconhecido, rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 323, de 25 de maio de 1994 (`27604`): cabecalho_nao_reconhecido, sem_fecho, rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 320, de 02 de maio de 1994 (`27569`): cabecalho_nao_reconhecido, rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 317, de 22 de março de 1994 (`27526`): rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 316, de 20 de janeiro de 1994 (`27475`): cabecalho_nao_reconhecido, texto_fora_da_arvore, trecho_nao_localizado_na_origem, rotulo_nao_confere_com_a_origem, bloco_de_alteracao_sem_dono
- Lei Complementar municipal nº 315, de 06 de janeiro de 1994 (`27459`): rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 314, de 04 de janeiro de 1994 (`27453`): cabecalho_nao_reconhecido, sem_fecho, trecho_nao_localizado_na_origem
- Lei Complementar municipal nº 312, de 29 de dezembro de 1993 (`27449`): rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 311, de 28 de dezembro de 1993 (`27443`): cabecalho_nao_reconhecido, bloco_sem_fechamento_de_aspas
- Lei Complementar municipal nº 308, de 28 de dezembro de 1993 (`27441`): rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 305, de 21 de dezembro de 1993 (`27406`): promulgacao_parcial, cabecalho_nao_reconhecido, trecho_nao_localizado_na_origem, rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 303, de 20 de dezembro de 1993 (`27404`): texto_fora_da_arvore, trecho_nao_localizado_na_origem, rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 299, de 06 de outubro de 1993 (`27249`): sem_fecho
- Lei Complementar municipal nº 297, de 27 de julho de 1993 (`27111`): cabecalho_nao_reconhecido, rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 282, de 22 de junho de 1993 (`27049`): promulgacao_parcial, sem_artigos, sem_fecho, texto_fora_da_arvore, trecho_nao_localizado_na_origem, bloco_de_alteracao_sem_dono
- Lei Complementar municipal nº 292, de 15 de janeiro de 1993 (`26885`): sem_fecho, rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 291, de 15 de janeiro de 1993 (`26884`): cabecalho_nao_reconhecido, rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 289, de 13 de janeiro de 1993 (`26874`): cabecalho_nao_reconhecido, rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 286, de 29 de dezembro de 1992 (`26844`): cabecalho_nao_reconhecido, sem_fecho
- Lei Complementar municipal nº 285, de 29 de dezembro de 1992 (`26843`): cabecalho_nao_reconhecido, texto_fora_da_arvore, trecho_nao_localizado_na_origem, rotulo_nao_confere_com_a_origem, bloco_de_alteracao_sem_dono
- Lei Complementar municipal nº 284, de 27 de outubro de 1992 (`26743`): rotulo_nao_confere_com_a_origem, bloco_de_alteracao_sem_dono
- Lei Complementar municipal nº 283, de 23 de outubro de 1992 (`26739`): cabecalho_nao_reconhecido, sem_fecho, rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 282, de 16 de outubro de 1992 (`26729`): cabecalho_nao_reconhecido, sem_fecho, rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 279, de 17 de agosto de 1992 (`26639`): cabecalho_nao_reconhecido
- Lei Complementar municipal nº 278, de 24 de junho de 1992 (`26547`): cabecalho_nao_reconhecido, sem_fecho, texto_fora_da_arvore, trecho_nao_localizado_na_origem, rotulo_nao_confere_com_a_origem, bloco_de_alteracao_sem_dono
- Lei Complementar municipal nº 277, de 20 de maio de 1992 (`26465`): rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 276, de 23 de abril de 1992 (`26424`): cabecalho_nao_reconhecido, rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 275, de 06 de abril de 1992 (`26412`): rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 267, de 30 de março de 1992 (`26402`): sem_artigos, sem_fecho, texto_fora_da_arvore, trecho_nao_localizado_na_origem, bloco_de_alteracao_sem_dono
- Lei Complementar municipal nº 274, de 25 de março de 1992 (`26393`): cabecalho_nao_reconhecido, sem_fecho, trecho_nao_localizado_na_origem, rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 258, de 28 de fevereiro de 1992 (`26363`): promulgacao_parcial, cabecalho_nao_reconhecido, texto_fora_da_arvore, trecho_nao_localizado_na_origem, bloco_de_alteracao_sem_dono
- Lei Complementar municipal nº 270, de 20 de fevereiro de 1992 (`26353`): cabecalho_nao_reconhecido, rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 269, de 22 de janeiro de 1992 (`26317`): cabecalho_nao_reconhecido, rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 268, de 21 de janeiro de 1992 (`26315`): rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 266, de 15 de janeiro de 1992 (`26307`): cabecalho_nao_reconhecido, rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 263, de 28 de dezembro de 1991 (`26276`): cabecalho_nao_reconhecido, sem_fecho, rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 260, de 11 de dezembro de 1991 (`26224`): cabecalho_nao_reconhecido, sem_fecho, rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 258, de 29 de novembro de 1991 (`26196`): promulgacao_parcial, cabecalho_nao_reconhecido, texto_fora_da_arvore, trecho_nao_localizado_na_origem, bloco_de_alteracao_sem_dono
- Lei Complementar municipal nº 257, de 27 de novembro de 1991 (`26189`): rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 256, de 06 de novembro de 1991 (`26156`): cabecalho_nao_reconhecido, sem_fecho, rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 254, de 22 de outubro de 1991 (`26118`): cabecalho_nao_reconhecido, sem_fecho, rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 252, de 08 de outubro de 1991 (`26076`): cabecalho_nao_reconhecido
- Lei Complementar municipal nº 251, de 25 de julho de 1991 (`25978`): cabecalho_nao_reconhecido, sem_fecho, texto_fora_da_arvore, trecho_nao_localizado_na_origem, rotulo_nao_confere_com_a_origem, bloco_de_alteracao_sem_dono
- Lei Complementar municipal nº 250, de 11 de julho de 1991 (`25946`): sem_fecho
- Lei Complementar municipal nº 248, de 23 de janeiro de 1991 (`25789`): cabecalho_nao_reconhecido, sem_fecho, rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 247, de 22 de janeiro de 1991 (`25788`): cabecalho_nao_reconhecido, rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 245, de 18 de janeiro de 1991 (`25781`): cabecalho_nao_reconhecido, rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 244, de 14 de janeiro de 1991 (`25770`): cabecalho_nao_reconhecido, texto_fora_da_arvore, rotulo_nao_confere_com_a_origem, bloco_de_alteracao_sem_dono
- Lei Complementar municipal nº 243, de 11 de janeiro de 1991 (`25757`): cabecalho_nao_reconhecido, rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 242, de 09 de janeiro de 1991 (`25748`): cabecalho_nao_reconhecido, rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 241, de 04 de janeiro de 1991 (`25739`): rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 239, de 28 de dezembro de 1990 (`25723`): cabecalho_nao_reconhecido, rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 238, de 26 de dezembro de 1990 (`25709`): cabecalho_nao_reconhecido, sem_fecho, texto_fora_da_arvore, trecho_nao_localizado_na_origem, rotulo_nao_confere_com_a_origem, bloco_de_alteracao_sem_dono
- Lei Complementar municipal nº 237, de 17 de dezembro de 1990 (`25687`): cabecalho_nao_reconhecido
- Lei Complementar municipal nº 236, de 10 de dezembro de 1990 (`25679`): trecho_nao_localizado_na_origem
- Lei Complementar municipal nº 235, de 19 de outubro de 1990 (`25573`): cabecalho_nao_reconhecido, sem_fecho
- Lei Complementar municipal nº 233, de 05 de outubro de 1990 (`25553`): promulgacao_parcial, cabecalho_nao_reconhecido, texto_fora_da_arvore, trecho_nao_localizado_na_origem, rotulo_nao_confere_com_a_origem, bloco_de_alteracao_sem_dono
- Lei Complementar municipal nº 232, de 21 de setembro de 1990 (`25522`): cabecalho_nao_reconhecido, rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 231, de 05 de setembro de 1990 (`25504`): cabecalho_nao_reconhecido, rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 230, de 24 de julho de 1990 (`25446`): cabecalho_nao_reconhecido, sem_fecho
- Lei Complementar municipal nº 229, de 18 de julho de 1990 (`25426`): cabecalho_nao_reconhecido
- Lei Complementar municipal nº 228, de 27 de junho de 1990 (`25391`): cabecalho_nao_reconhecido
- Lei Complementar municipal nº 227, de 19 de junho de 1990 (`25378`): cabecalho_nao_reconhecido, sem_fecho, rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 226, de 07 de junho de 1990 (`25350`): cabecalho_nao_reconhecido
- Lei Complementar municipal nº 225, de 05 de junho de 1990 (`25339`): cabecalho_nao_reconhecido
- Lei Complementar municipal nº 224, de 25 de maio de 1990 (`25324`): cabecalho_nao_reconhecido, sem_fecho
- Lei Complementar municipal nº 206, de 02 de maio de 1990 (`25306`): cabecalho_nao_reconhecido, rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 203, de 02 de maio de 1990 (`25305`): promulgacao_parcial, sem_artigos, sem_fecho, texto_fora_da_arvore, trecho_nao_localizado_na_origem, bloco_de_alteracao_sem_dono
- Lei Complementar municipal nº 223, de 23 de abril de 1990 (`25294`): cabecalho_nao_reconhecido, sem_fecho, rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 222, de 19 de abril de 1990 (`25291`): cabecalho_nao_reconhecido, sem_fecho, rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 221, de 31 de janeiro de 1990 (`25226`): cabecalho_nao_reconhecido, rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 220, de 19 de janeiro de 1990 (`25208`): promulgacao_parcial, texto_fora_da_arvore, trecho_nao_localizado_na_origem, bloco_de_alteracao_sem_dono
- Lei Complementar municipal nº 219, de 19 de janeiro de 1990 (`25207`): cabecalho_nao_reconhecido, rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 218, de 16 de janeiro de 1990 (`25202`): cabecalho_nao_reconhecido, rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 217, de 12 de janeiro de 1990 (`25193`): cabecalho_nao_reconhecido
- Lei Complementar municipal nº 216, de 12 de janeiro de 1990 (`25192`): cabecalho_nao_reconhecido, rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 215, de 12 de janeiro de 1990 (`25191`): cabecalho_nao_reconhecido, rotulo_nao_confere_com_a_origem, bloco_de_alteracao_sem_dono
- Lei Complementar municipal nº 214, de 04 de janeiro de 1990 (`25159`): cabecalho_nao_reconhecido, sem_fecho, texto_fora_da_arvore, trecho_nao_localizado_na_origem, rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 213, de 28 de dezembro de 1989 (`25143`): rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 212, de 28 de dezembro de 1989 (`25142`): cabecalho_nao_reconhecido, sem_fecho, rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 211, de 28 de dezembro de 1989 (`25141`): cabecalho_nao_reconhecido, sem_fecho, rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 209, de 28 de dezembro de 1989 (`25139`): texto_fora_da_arvore, trecho_nao_localizado_na_origem, rotulo_nao_confere_com_a_origem, bloco_de_alteracao_sem_dono
- Lei Complementar municipal nº 204, de 28 de dezembro de 1989 (`25134`): cabecalho_nao_reconhecido, sem_fecho, rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 202, de 28 de dezembro de 1989 (`25132`): promulgacao_parcial, texto_fora_da_arvore, trecho_nao_localizado_na_origem, rotulo_nao_confere_com_a_origem, bloco_de_alteracao_sem_dono
- Lei Complementar municipal nº 201, de 18 de dezembro de 1989 (`25081`): cabecalho_nao_reconhecido, rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 200, de 30 de maio de 1989 (`24811`): cabecalho_nao_reconhecido, rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 199, de 15 de maio de 1989 (`24795`): cabecalho_nao_reconhecido, rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 195, de 30 de dezembro de 1988 (`24667`): cabecalho_nao_reconhecido, rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 193, de 28 de dezembro de 1988 (`24616`): cabecalho_nao_reconhecido, sem_fecho, rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 192, de 27 de dezembro de 1988 (`24601`): cabecalho_nao_reconhecido, sem_fecho
- Lei Complementar municipal nº 191, de 27 de dezembro de 1988 (`24600`): cabecalho_nao_reconhecido, rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 189, de 27 de dezembro de 1988 (`24598`): cabecalho_nao_reconhecido
- Lei Complementar municipal nº 182, de 28 de setembro de 1988 (`24430`): cabecalho_nao_reconhecido, rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 180, de 18 de agosto de 1988 (`24368`): cabecalho_nao_reconhecido, texto_fora_da_arvore, trecho_nao_localizado_na_origem, rotulo_nao_confere_com_a_origem, bloco_de_alteracao_sem_dono, alteracao_sem_aspas_nao_delimitada
- Lei Complementar municipal nº 177, de 03 de fevereiro de 1988 (`24154`): cabecalho_nao_reconhecido, sem_fecho, rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 176, de 29 de janeiro de 1988 (`24152`): cabecalho_nao_reconhecido
- Lei Complementar municipal nº 175, de 20 de janeiro de 1988 (`24140`): cabecalho_nao_reconhecido, rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 174, de 13 de janeiro de 1988 (`24128`): cabecalho_nao_reconhecido, sem_fecho, rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 170, de 31 de dezembro de 1987 (`24099`): rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 169, de 29 de dezembro de 1987 (`24086`): cabecalho_nao_reconhecido, sem_fecho, texto_fora_da_arvore, trecho_nao_localizado_na_origem, rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 162, de 17 de dezembro de 1987 (`24028`): cabecalho_nao_reconhecido, sem_fecho, rotulo_nao_confere_com_a_origem, bloco_de_alteracao_sem_dono
- Lei Complementar municipal nº 160, de 19 de setembro de 1987 (`23877`): cabecalho_nao_reconhecido, sem_fecho
- Lei Complementar municipal nº 159, de 22 de julho de 1987 (`23830`): cabecalho_nao_reconhecido, sem_fecho, rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 158, de 22 de julho de 1987 (`23829`): cabecalho_nao_reconhecido, texto_fora_da_arvore, trecho_nao_localizado_na_origem, rotulo_nao_confere_com_a_origem, bloco_de_alteracao_sem_dono
- Lei Complementar municipal nº 153, de 04 de fevereiro de 1987 (`23686`): cabecalho_nao_reconhecido, sem_fecho, rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 150, de 12 de janeiro de 1987 (`23652`): cabecalho_nao_reconhecido, rotulo_nao_confere_com_a_origem, bloco_de_alteracao_sem_dono
- Lei Complementar municipal nº 173, de 08 de janeiro de 1987 (`23646`): cabecalho_nao_reconhecido, sem_fecho, texto_fora_da_arvore, trecho_nao_localizado_na_origem, rotulo_nao_confere_com_a_origem, bloco_de_alteracao_sem_dono
- Lei Complementar municipal nº 149, de 08 de janeiro de 1987 (`23645`): cabecalho_nao_reconhecido, sem_fecho, rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 148, de 30 de dezembro de 1986 (`23623`): cabecalho_nao_reconhecido, sem_fecho, rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 147, de 16 de dezembro de 1986 (`23576`): cabecalho_nao_reconhecido, texto_fora_da_arvore, trecho_nao_localizado_na_origem, bloco_de_alteracao_sem_dono
- Lei Complementar municipal nº 144, de 14 de novembro de 1986 (`23540`): cabecalho_nao_reconhecido, sem_fecho, rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 140, de 22 de julho de 1986 (`23454`): cabecalho_nao_reconhecido
- Lei Complementar municipal nº 139, de 22 de julho de 1986 (`23453`): cabecalho_nao_reconhecido, sem_fecho, rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 136, de 22 de julho de 1986 (`23450`): cabecalho_nao_reconhecido, sem_fecho
- Lei Complementar municipal nº 135, de 22 de julho de 1986 (`23449`): cabecalho_nao_reconhecido, sem_fecho, rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 134, de 13 de janeiro de 1986 (`23364`): cabecalho_nao_reconhecido, sem_fecho
- Lei Complementar municipal nº 133b, de 31 de dezembro de 1985 (`23347`): trecho_nao_localizado_na_origem, rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 133, de 31 de dezembro de 1985 (`23346`): trecho_nao_localizado_na_origem, rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 131, de 10 de dezembro de 1985 (`23254`): cabecalho_nao_reconhecido
- Lei Complementar municipal nº 129, de 05 de dezembro de 1985 (`23247`): cabecalho_nao_reconhecido, sem_fecho, rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 128, de 27 de novembro de 1985 (`23237`): cabecalho_nao_reconhecido, rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 126, de 05 de novembro de 1985 (`23208`): cabecalho_nao_reconhecido, sem_fecho, rotulo_nao_confere_com_a_origem, alteracao_sem_aspas_nao_delimitada
- Lei Complementar municipal nº 124, de 22 de outubro de 1985 (`23188`): cabecalho_nao_reconhecido, sem_fecho, rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 123, de 09 de outubro de 1985 (`23172`): cabecalho_nao_reconhecido, rotulo_nao_confere_com_a_origem, bloco_de_alteracao_sem_dono
- Lei Complementar municipal nº 117, de 09 de janeiro de 1985 (`22979`): cabecalho_nao_reconhecido, rotulo_nao_confere_com_a_origem, bloco_de_alteracao_sem_dono
- Lei Complementar municipal nº 114, de 28 de dezembro de 1984 (`22961`): cabecalho_nao_reconhecido, rotulo_nao_confere_com_a_origem, bloco_de_alteracao_sem_dono
- Lei Complementar municipal nº 113, de 21 de dezembro de 1984 (`22932`): cabecalho_nao_reconhecido, rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 111, de 18 de dezembro de 1984 (`22911`): cabecalho_nao_reconhecido, rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 110, de 23 de novembro de 1984 (`22858`): cabecalho_nao_reconhecido, sem_fecho, texto_fora_da_arvore, trecho_nao_localizado_na_origem, rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 109, de 22 de outubro de 1984 (`22821`): cabecalho_nao_reconhecido, rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 108, de 28 de setembro de 1984 (`22802`): cabecalho_nao_reconhecido, sem_fecho, texto_fora_da_arvore, rotulo_nao_confere_com_a_origem, bloco_de_alteracao_sem_dono
- Lei Complementar municipal nº 107, de 27 de julho de 1984 (`22769`): cabecalho_nao_reconhecido, rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 106, de 27 de abril de 1984 (`22711`): cabecalho_nao_reconhecido, rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 105, de 17 de abril de 1984 (`22701`): cabecalho_nao_reconhecido, rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 104, de 16 de abril de 1984 (`22700`): cabecalho_nao_reconhecido, rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 103, de 16 de janeiro de 1984 (`22675`): rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 102, de 13 de janeiro de 1984 (`22673`): cabecalho_nao_reconhecido, rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 101, de 11 de janeiro de 1984 (`22669`): cabecalho_nao_reconhecido, sem_fecho
- Lei Complementar municipal nº 100, de 05 de janeiro de 1984 (`22652`): cabecalho_nao_reconhecido, sem_fecho, rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 99, de 04 de janeiro de 1984 (`22651`): cabecalho_nao_reconhecido, rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 98, de 04 de janeiro de 1984 (`22650`): cabecalho_nao_reconhecido, rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 92, de 21 de dezembro de 1983 (`22600`): cabecalho_nao_reconhecido, sem_fecho, rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 91, de 13 de dezembro de 1983 (`22566`): cabecalho_nao_reconhecido, sem_fecho, rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 89, de 25 de novembro de 1983 (`22552`): cabecalho_nao_reconhecido, rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 88, de 10 de novembro de 1983 (`22537`): cabecalho_nao_reconhecido, sem_fecho, rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 87, de 08 de novembro de 1983 (`22535`): cabecalho_nao_reconhecido
- Lei Complementar municipal nº 86, de 27 de janeiro de 1983 (`22312`): cabecalho_nao_reconhecido, sem_fecho, rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 85, de 27 de janeiro de 1983 (`22311`): cabecalho_nao_reconhecido, sem_fecho, texto_fora_da_arvore, trecho_nao_localizado_na_origem, rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 84, de 20 de janeiro de 1983 (`22307`): cabecalho_nao_reconhecido, sem_fecho, rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 83, de 20 de janeiro de 1983 (`22306`): cabecalho_nao_reconhecido, sem_artigos, sem_fecho
- Lei Complementar municipal nº 82, de 17 de janeiro de 1983 (`22304`): cabecalho_nao_reconhecido, sem_artigos, sem_fecho
- Lei Complementar municipal nº 80, de 11 de janeiro de 1983 (`22296`): cabecalho_nao_reconhecido, sem_artigos, sem_fecho
- Lei Complementar municipal nº 79, de 10 de janeiro de 1983 (`22291`): cabecalho_nao_reconhecido, sem_artigos, sem_fecho
- Lei Complementar municipal nº 76, de 15 de dezembro de 1982 (`22196`): cabecalho_nao_reconhecido, sem_artigos, sem_fecho
- Lei Complementar municipal nº 75, de 23 de novembro de 1982 (`22159`): cabecalho_nao_reconhecido, sem_artigos, sem_fecho
- Lei Complementar municipal nº 73, de 30 de junho de 1982 (`21968`): cabecalho_nao_reconhecido, sem_artigos, sem_fecho
- Lei Complementar municipal nº 72, de 06 de janeiro de 1982 (`21858`): cabecalho_nao_reconhecido, rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 71, de 06 de janeiro de 1982 (`21857`): cabecalho_nao_reconhecido, sem_artigos, sem_fecho
- Lei Complementar municipal nº 70, de 06 de janeiro de 1982 (`21856`): cabecalho_nao_reconhecido, sem_artigos, sem_fecho
- Lei Complementar municipal nº 67, de 04 de janeiro de 1982 (`21849`): cabecalho_nao_reconhecido, trecho_nao_localizado_na_origem, rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 65, de 22 de dezembro de 1981 (`21812`): cabecalho_nao_reconhecido, sem_fecho, rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 63, de 11 de dezembro de 1981 (`21758`): cabecalho_nao_reconhecido, sem_artigos, sem_fecho
- Lei Complementar municipal nº 60, de 25 de maio de 1981 (`21462`): cabecalho_nao_reconhecido, sem_fecho, rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 57, de 27 de janeiro de 1981 (`21396`): cabecalho_nao_reconhecido, rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 55, de 31 de dezembro de 1980 (`21375`): cabecalho_nao_reconhecido, trecho_nao_localizado_na_origem, rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 54, de 29 de dezembro de 1980 (`21359`): cabecalho_nao_reconhecido, rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 53, de 29 de dezembro de 1980 (`21358`): cabecalho_nao_reconhecido, sem_fecho, rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 51, de 15 de dezembro de 1980 (`21317`): rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 49, de 02 de dezembro de 1980 (`21280`): cabecalho_nao_reconhecido, texto_fora_da_arvore, trecho_nao_localizado_na_origem, rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 44, de 27 de novembro de 1979 (`20533`): cabecalho_nao_reconhecido, sem_artigos, sem_fecho
- Lei Complementar municipal nº 43, de 21 de julho de 1979 (`20255`): sem_fecho, texto_fora_da_arvore, trecho_nao_localizado_na_origem, rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 41, de 11 de dezembro de 1978 (`19808`): cabecalho_nao_reconhecido, sem_artigos, sem_fecho
- Lei Complementar municipal nº 39, de 17 de novembro de 1978 (`19746`): cabecalho_nao_reconhecido, sem_artigos, sem_fecho
- Lei Complementar municipal nº 37, de 13 de setembro de 1978 (`19667`): cabecalho_nao_reconhecido, sem_artigos, sem_fecho
- Lei Complementar municipal nº 36, de 19 de abril de 1978 (`19519`): cabecalho_nao_reconhecido, sem_artigos, sem_fecho
- Lei Complementar municipal nº 34, de 31 de maio de 1977 (`19021`): cabecalho_nao_reconhecido, sem_artigos, sem_fecho
- Lei Complementar municipal nº 26, de 21 de julho de 1976 (`18502`): cabecalho_nao_reconhecido, sem_artigos, sem_fecho
- Lei Complementar municipal nº 24, de 16 de julho de 1976 (`18490`): cabecalho_nao_reconhecido, sem_artigos, sem_fecho
- Lei Complementar municipal nº 23, de 09 de julho de 1976 (`18469`): cabecalho_nao_reconhecido, sem_artigos, sem_fecho
- Lei Complementar municipal nº 17, de 02 de dezembro de 1975 (`18218`): cabecalho_nao_reconhecido, sem_artigos, sem_fecho
- Lei Complementar municipal nº 12, de 07 de janeiro de 1975 (`17878`): rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 10, de 22 de março de 1974 (`17547`): cabecalho_nao_reconhecido, sem_artigos, sem_fecho
