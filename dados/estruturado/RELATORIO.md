# Estruturação — relatório

Gerado em 2026-11-20T22:44:14.071Z por `ingestao/estruturar.mjs` (versão do estruturador: 14). Não editar à mão.

Uma norma só é **aceita** quando passa em todas as conferências: cabeçalho igual ao do catálogo (número, data, tipo), artigos numerados sem salto, rótulos iguais aos do texto de origem, nenhum texto fora da árvore, fecho presente. O resto vai para **revisar**, com o motivo.

Textos baixados: 834 · com texto extraído e estruturados: 823

| Situação | Normas | % |
|---|---|---|
| aceita | 582 | 70.7% |
| revisar | 241 | 29.3% |

## Por época (corte: sanção da LC 611, 03/02/2009)

Antes do corte a técnica legislativa era outra: falhas de compilação são esperadas e não medem o leitor. **A taxa das recentes é a que mede o motor.**

| Época | Aceitas | A revisar | Taxa de aceitação |
|---|---|---|---|
| recente | 389 | 89 | 81.4% |
| antiga | 193 | 152 | 55.9% |

## Revisão humana

O motor lê; o revisor decide em `docs/revisao.html`. **Aceita pelo motor** e **aceita por humano** são contadas separadamente: só a primeira mede o leitor. Decisão de versão antiga do texto ou do leitor volta como **desatualizada**.

| Situação | Recentes | Antigas | Total |
|---|---|---|---|
| aceita motor | 389 | 193 | 582 |
| aceita humano | 0 | 0 | 0 |
| corrigida | 0 | 0 | 0 |
| defeito de fonte | 0 | 0 | 0 |
| encaminhada | 0 | 0 | 0 |
| pendente | 89 | 152 | 241 |
| desatualizada | 0 | 0 | 0 |



### Motivos de revisão nas recentes

| Motivo | Normas |
|---|---|
| `rotulo_nao_confere_com_a_origem` | 40 |
| `sem_fecho` | 28 |
| `bloco_de_alteracao_sem_dono` | 24 |
| `cabecalho_nao_reconhecido` | 11 |
| `sem_artigos` | 8 |
| `trecho_nao_localizado_na_origem` | 6 |
| `data_diverge_do_catalogo` | 6 |
| `texto_fora_da_arvore` | 5 |
| `aspa_de_abertura_ausente` | 3 |
| `alteracao_sem_aspas_nao_delimitada` | 3 |
| `promulgacao_parcial` | 2 |
| `numero_diverge_do_catalogo` | 1 |
| `tipo_diverge_do_catalogo` | 1 |

## Motivos de revisão (todas as épocas)

(uma norma pode ter mais de um)

| Motivo | Normas | % do total |
|---|---|---|
| `rotulo_nao_confere_com_a_origem` | 137 | 16.6% |
| `cabecalho_nao_reconhecido` | 96 | 11.7% |
| `sem_fecho` | 93 | 11.3% |
| `bloco_de_alteracao_sem_dono` | 50 | 6.1% |
| `trecho_nao_localizado_na_origem` | 38 | 4.6% |
| `texto_fora_da_arvore` | 31 | 3.8% |
| `sem_artigos` | 16 | 1.9% |
| `bloco_sem_fechamento_de_aspas` | 12 | 1.5% |
| `promulgacao_parcial` | 11 | 1.3% |
| `data_diverge_do_catalogo` | 9 | 1.1% |
| `tipo_sem_suporte` | 8 | 1% |
| `alteracao_sem_aspas_nao_delimitada` | 4 | 0.5% |
| `aspa_de_abertura_ausente` | 3 | 0.4% |
| `numero_diverge_do_catalogo` | 1 | 0.1% |
| `tipo_diverge_do_catalogo` | 1 | 0.1% |

## Avisos (não reprovam)

| Aviso | Normas | % do total |
|---|---|---|
| `cabecalho_fora_do_padrao` | 168 | 20.4% |
| `tem_anexo` | 50 | 6.1% |
| `texto_de_ocr` | 44 | 5.3% |
| `paragrafo_numerado_sem_irmao` | 19 | 2.3% |
| `possivel_dispositivo_embutido` | 17 | 2.1% |
| `dispositivo_muito_longo` | 13 | 1.6% |

## Fila de revisão — recentes (prioridade; só pendentes e desatualizadas)

- Emenda à Lei Orgânica nº 43, de 25 de maio de 2017 (`44305`): cabecalho_nao_reconhecido, sem_fecho, rotulo_nao_confere_com_a_origem, bloco_de_alteracao_sem_dono
- Emenda à Lei Orgânica nº 42, de 03 de agosto de 2016 (`44307`): cabecalho_nao_reconhecido, sem_fecho, texto_fora_da_arvore, trecho_nao_localizado_na_origem, rotulo_nao_confere_com_a_origem, bloco_de_alteracao_sem_dono
- Emenda à Lei Orgânica nº 35, de 18 de junho de 2012 (`38297`): rotulo_nao_confere_com_a_origem
- Emenda à Lei Orgânica nº 31, de 15 de junho de 2011 (`37352`): rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 1.075, de 14 de julho de 2026 (`51485`): promulgacao_parcial, rotulo_nao_confere_com_a_origem, bloco_de_alteracao_sem_dono
- Lei Complementar municipal nº 1.074, de 09 de julho de 2026 (`51463`): rotulo_nao_confere_com_a_origem, aspa_de_abertura_ausente
- Lei Complementar municipal nº 1.062, de 15 de dezembro de 2025 (`50793`): data_diverge_do_catalogo
- Lei Complementar municipal nº 1.037, de 02 de fevereiro de 2025 (`49739`): rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 1.031, de 30 de janeiro de 2025 (`49654`): data_diverge_do_catalogo
- Lei Complementar municipal nº 1.017, de 08 de julho de 2024 (`48855`): sem_fecho, rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 1.011, de 10 de maio de 2024 (`48437`): aspa_de_abertura_ausente
- Lei Complementar municipal nº 964, de 22 de dezembro de 2022 (`48226`): aspa_de_abertura_ausente
- Lei Complementar municipal nº 957, de 28 de setembro de 2022 (`44376`): rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 951, de 17 de agosto de 2022 (`44158`): sem_artigos, sem_fecho
- Lei Complementar municipal nº 932, de 06 de janeiro de 2022 (`43595`): rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 915, de 29 de setembro de 2021 (`43376`): rotulo_nao_confere_com_a_origem, alteracao_sem_aspas_nao_delimitada
- Lei Complementar municipal nº 896, de 05 de janeiro de 2021 (`42987`): numero_diverge_do_catalogo, data_diverge_do_catalogo, rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 882, de 21 de maio de 2020 (`42586`): data_diverge_do_catalogo
- Lei Complementar municipal nº 878, de 15 de maio de 2020 (`42577`): data_diverge_do_catalogo
- Lei Complementar municipal nº 875, de 21 de janeiro de 2020 (`42407`): rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 872, de 10 de janeiro de 2020 (`42401`): promulgacao_parcial, rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 868, de 10 de dezembro de 2019 (`42356`): rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 859, de 03 de setembro de 2019 (`42216`): rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 848, de 22 de março de 2019 (`42014`): cabecalho_nao_reconhecido, tipo_diverge_do_catalogo
- Lei Complementar municipal nº 835, de 26 de julho de 2018 (`41723`): rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 822, de 12 de dezembro de 2017 (`41463`): data_diverge_do_catalogo
- Lei Complementar municipal nº 818, de 11 de setembro de 2017 (`41347`): sem_fecho, alteracao_sem_aspas_nao_delimitada
- Lei Complementar municipal nº 813, de 20 de março de 2017 (`41179`): cabecalho_nao_reconhecido, sem_fecho
- Lei Complementar municipal nº 810, de 04 de janeiro de 2017 (`41098`): rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 790, de 10 de fevereiro de 2016 (`40514`): cabecalho_nao_reconhecido, sem_artigos, sem_fecho
- Lei Complementar municipal nº 779, de 03 de novembro de 2015 (`40318`): cabecalho_nao_reconhecido, sem_artigos, sem_fecho
- Lei Complementar municipal nº 777, de 28 de outubro de 2015 (`40311`): rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 775, de 23 de outubro de 2015 (`40303`): cabecalho_nao_reconhecido, sem_artigos, sem_fecho
- Lei Complementar municipal nº 766, de 21 de julho de 2015 (`40134`): rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 757, de 14 de janeiro de 2015 (`39862`): rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 755, de 30 de dezembro de 2014 (`39825`): rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 746, de 03 de novembro de 2014 (`39708`): sem_fecho
- Lei Complementar municipal nº 743, de 02 de setembro de 2014 (`39600`): sem_fecho, rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 741, de 05 de agosto de 2014 (`39563`): sem_fecho
- Lei Complementar municipal nº 738, de 02 de maio de 2014 (`39395`): cabecalho_nao_reconhecido, sem_artigos, sem_fecho
- Lei Complementar municipal nº 734, de 24 de janeiro de 2014 (`39259`): bloco_de_alteracao_sem_dono
- Lei Complementar municipal nº 733, de 24 de janeiro de 2014 (`39258`): rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 731, de 21 de janeiro de 2014 (`39249`): bloco_de_alteracao_sem_dono
- Lei Complementar municipal nº 726, de 07 de janeiro de 2014 (`39220`): sem_fecho
- Lei Complementar municipal nº 724, de 03 de janeiro de 2014 (`39213`): bloco_de_alteracao_sem_dono
- Lei Complementar municipal nº 721, de 29 de novembro de 2013 (`39138`): rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 712, de 19 de fevereiro de 2013 (`38800`): bloco_de_alteracao_sem_dono
- Lei Complementar municipal nº 707, de 27 de dezembro de 2012 (`38712`): bloco_de_alteracao_sem_dono
- Lei Complementar municipal nº 706, de 26 de dezembro de 2012 (`38695`): bloco_de_alteracao_sem_dono
- Lei Complementar municipal nº 701, de 18 de julho de 2012 (`38364`): trecho_nao_localizado_na_origem
- Lei Complementar municipal nº 700, de 03 de julho de 2012 (`38330`): bloco_de_alteracao_sem_dono
- Lei Complementar municipal nº 697, de 18 de junho de 2012 (`38298`): bloco_de_alteracao_sem_dono
- Lei Complementar municipal nº 694, de 21 de maio de 2012 (`38249`): rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 692, de 29 de março de 2012 (`38117`): sem_fecho
- Lei Complementar municipal nº 690, de 17 de fevereiro de 2012 (`38051`): rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 688, de 15 de fevereiro de 2012 (`38041`): rotulo_nao_confere_com_a_origem, bloco_de_alteracao_sem_dono
- Lei Complementar municipal nº 680, de 08 de setembro de 2011 (`37562`): sem_fecho
- Lei Complementar municipal nº 679, de 26 de agosto de 2011 (`37517`): sem_fecho, rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 678, de 22 de agosto de 2011 (`37491`): sem_fecho, rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 677, de 19 de julho de 2011 (`37422`): sem_fecho, rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 676, de 06 de julho de 2011 (`37403`): sem_fecho
- Lei Complementar municipal nº 675, de 22 de junho de 2011 (`37379`): sem_fecho
- Lei Complementar municipal nº 674, de 16 de junho de 2011 (`37358`): sem_fecho
- Lei Complementar municipal nº 672, de 01 de fevereiro de 2011 (`37172`): sem_fecho
- Lei Complementar municipal nº 670, de 20 de janeiro de 2011 (`37136`): texto_fora_da_arvore, trecho_nao_localizado_na_origem, bloco_de_alteracao_sem_dono
- Lei Complementar municipal nº 669, de 19 de janeiro de 2011 (`37132`): bloco_de_alteracao_sem_dono
- Lei Complementar municipal nº 667, de 03 de janeiro de 2011 (`37109`): bloco_de_alteracao_sem_dono
- Lei Complementar municipal nº 663, de 28 de dezembro de 2010 (`37090`): rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 662, de 07 de dezembro de 2010 (`37043`): rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 661, de 07 de dezembro de 2010 (`37042`): rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 660, de 07 de dezembro de 2010 (`37041`): rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 652, de 13 de setembro de 2010 (`36914`): cabecalho_nao_reconhecido, sem_artigos, sem_fecho
- Lei Complementar municipal nº 651, de 08 de setembro de 2010 (`36907`): bloco_de_alteracao_sem_dono
- Lei Complementar municipal nº 649, de 06 de agosto de 2010 (`36862`): bloco_de_alteracao_sem_dono
- Lei Complementar municipal nº 647, de 27 de julho de 2010 (`36850`): bloco_de_alteracao_sem_dono
- Lei Complementar municipal nº 646, de 22 de julho de 2010 (`36841`): texto_fora_da_arvore, trecho_nao_localizado_na_origem, rotulo_nao_confere_com_a_origem, bloco_de_alteracao_sem_dono, alteracao_sem_aspas_nao_delimitada
- Lei Complementar municipal nº 645, de 14 de julho de 2010 (`36824`): sem_fecho
- Lei Complementar municipal nº 644, de 02 de julho de 2010 (`36811`): bloco_de_alteracao_sem_dono
- Lei Complementar municipal nº 643, de 18 de maio de 2010 (`36741`): bloco_de_alteracao_sem_dono
- Lei Complementar municipal nº 642, de 30 de abril de 2010 (`36717`): bloco_de_alteracao_sem_dono
- Lei Complementar municipal nº 640, de 09 de março de 2010 (`36647`): rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 638, de 04 de março de 2010 (`36634`): rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 634, de 29 de dezembro de 2009 (`36530`): bloco_de_alteracao_sem_dono
- Lei Complementar municipal nº 633, de 29 de dezembro de 2009 (`36529`): bloco_de_alteracao_sem_dono
- Lei Complementar municipal nº 632, de 15 de outubro de 2009 (`36400`): texto_fora_da_arvore, trecho_nao_localizado_na_origem, rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 630, de 01 de outubro de 2009 (`36372`): cabecalho_nao_reconhecido, sem_artigos, sem_fecho
- Lei Complementar municipal nº 628, de 17 de agosto de 2009 (`36316`): rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 624, de 25 de junho de 2009 (`36190`): sem_fecho, texto_fora_da_arvore, trecho_nao_localizado_na_origem
- Lei Complementar municipal nº 623, de 23 de junho de 2009 (`36188`): cabecalho_nao_reconhecido, sem_artigos, sem_fecho

## Fila de revisão — antigas (antes da LC 611; revisão humana esperada)



- Lei Orgânica nº 1, de 03 de abril de 1990 (`25277`): cabecalho_nao_reconhecido, tipo_sem_suporte, sem_fecho, rotulo_nao_confere_com_a_origem
- Lei Orgânica nº 1, de 15 de dezembro de 1970 (`16471`): cabecalho_nao_reconhecido, tipo_sem_suporte, trecho_nao_localizado_na_origem, rotulo_nao_confere_com_a_origem, bloco_de_alteracao_sem_dono
- Lei Orgânica nº 1, de 24 de setembro de 1962 (`13529`): cabecalho_nao_reconhecido, tipo_sem_suporte, sem_fecho, texto_fora_da_arvore, trecho_nao_localizado_na_origem, rotulo_nao_confere_com_a_origem, bloco_de_alteracao_sem_dono
- Lei Orgânica nº 1, de 21 de setembro de 1956 (`11440`): cabecalho_nao_reconhecido, tipo_sem_suporte, sem_fecho, texto_fora_da_arvore, trecho_nao_localizado_na_origem, rotulo_nao_confere_com_a_origem
- Lei Orgânica nº 1, de 03 de abril de 1948 (`9133`): cabecalho_nao_reconhecido, tipo_sem_suporte, sem_fecho, texto_fora_da_arvore, trecho_nao_localizado_na_origem, rotulo_nao_confere_com_a_origem
- Lei Orgânica-PMPA nº 1, de 05 de março de 1936 (`8079`): cabecalho_nao_reconhecido, tipo_sem_suporte, sem_fecho, texto_fora_da_arvore, trecho_nao_localizado_na_origem, rotulo_nao_confere_com_a_origem, bloco_de_alteracao_sem_dono
- Lei Orgânica-Intendência nº 1, de 09 de abril de 1928 (`44366`): cabecalho_nao_reconhecido, tipo_sem_suporte, sem_fecho, trecho_nao_localizado_na_origem, rotulo_nao_confere_com_a_origem
- Lei Orgânica-Intendência nº 1, de 14 de outubro de 1892 (`44328`): cabecalho_nao_reconhecido, tipo_sem_suporte, sem_fecho, trecho_nao_localizado_na_origem, rotulo_nao_confere_com_a_origem
- Emenda à Lei Orgânica nº 27, de 29 de dezembro de 2008 (`35930`): sem_fecho
- Emenda à Lei Orgânica nº 24, de 31 de agosto de 2006 (`34476`): cabecalho_nao_reconhecido
- Emenda à Lei Orgânica nº 21, de 11 de junho de 2004 (`33244`): cabecalho_nao_reconhecido, sem_artigos, sem_fecho
- Emenda à Lei Orgânica nº 17, de 14 de setembro de 2001 (`31419`): sem_artigos, sem_fecho, texto_fora_da_arvore, bloco_de_alteracao_sem_dono
- Emenda à Lei Orgânica nº 16, de 10 de outubro de 2000 (`30834`): data_diverge_do_catalogo
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
- Lei Complementar municipal nº 544, de 26 de janeiro de 2006 (`34142`): data_diverge_do_catalogo
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
- Lei Complementar municipal nº 465, de 23 de agosto de 2001 (`31373`): texto_fora_da_arvore, trecho_nao_localizado_na_origem
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
- Lei Complementar municipal nº 437, de 29 de dezembro de 1999 (`30298`): rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 434, de 01 de dezembro de 1999 (`30209`): texto_fora_da_arvore, trecho_nao_localizado_na_origem, rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 433, de 22 de novembro de 1999 (`30183`): sem_fecho
- Lei Complementar municipal nº 426, de 29 de dezembro de 1998 (`29705`): bloco_sem_fechamento_de_aspas
- Lei Complementar municipal nº 425, de 13 de outubro de 1998 (`29581`): bloco_sem_fechamento_de_aspas
- Lei Complementar municipal nº 424, de 18 de setembro de 1998 (`29544`): cabecalho_nao_reconhecido, sem_fecho
- Lei Complementar municipal nº 422, de 09 de setembro de 1998 (`29528`): bloco_sem_fechamento_de_aspas
- Lei Complementar municipal nº 418, de 16 de junho de 1998 (`29418`): rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 417, de 10 de junho de 1998 (`29409`): bloco_sem_fechamento_de_aspas
- Lei Complementar municipal nº 415, de 07 de abril de 1998 (`29327`): cabecalho_nao_reconhecido, sem_fecho, rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 410, de 02 de abril de 1998 (`29316`): promulgacao_parcial, sem_artigos, sem_fecho, texto_fora_da_arvore, trecho_nao_localizado_na_origem, bloco_de_alteracao_sem_dono
- Lei Complementar municipal nº 412, de 24 de março de 1998 (`29309`): sem_fecho
- Lei Complementar municipal nº 410, de 20 de janeiro de 1998 (`29259`): rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 404, de 14 de novembro de 1997 (`29125`): rotulo_nao_confere_com_a_origem
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
- Lei Complementar municipal nº 342, de 09 de março de 1995 (`28014`): cabecalho_nao_reconhecido
- Lei Complementar municipal nº 340, de 12 de janeiro de 1995 (`27973`): cabecalho_nao_reconhecido, sem_fecho, rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 339, de 12 de janeiro de 1995 (`27972`): cabecalho_nao_reconhecido, sem_fecho
- Lei Complementar municipal nº 338, de 12 de janeiro de 1995 (`27971`): cabecalho_nao_reconhecido, sem_fecho, texto_fora_da_arvore, trecho_nao_localizado_na_origem
- Lei Complementar municipal nº 337, de 10 de janeiro de 1995 (`27968`): cabecalho_nao_reconhecido, sem_fecho, rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 336, de 06 de janeiro de 1995 (`27966`): cabecalho_nao_reconhecido, rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 334, de 27 de dezembro de 1994 (`27924`): cabecalho_nao_reconhecido, rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 332, de 02 de dezembro de 1994 (`27882`): sem_fecho
- Lei Complementar municipal nº 331, de 25 de novembro de 1994 (`27875`): rotulo_nao_confere_com_a_origem, bloco_de_alteracao_sem_dono
- Lei Complementar municipal nº 329, de 06 de setembro de 1994 (`27750`): bloco_sem_fechamento_de_aspas
- Lei Complementar municipal nº 328, de 27 de julho de 1994 (`27707`): cabecalho_nao_reconhecido, rotulo_nao_confere_com_a_origem, bloco_de_alteracao_sem_dono
- Lei Complementar municipal nº 326, de 11 de julho de 1994 (`27684`): cabecalho_nao_reconhecido, sem_fecho, bloco_sem_fechamento_de_aspas
- Lei Complementar municipal nº 325, de 07 de julho de 1994 (`27682`): cabecalho_nao_reconhecido, rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 323, de 25 de maio de 1994 (`27604`): cabecalho_nao_reconhecido, sem_fecho, rotulo_nao_confere_com_a_origem
- Lei Complementar municipal nº 321, de 19 de maio de 1994 (`27599`): sem_fecho
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
- Lei Complementar municipal nº 275, de 06 de abril de 1992 (`26412`): sem_fecho, rotulo_nao_confere_com_a_origem
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
- Lei Complementar municipal nº 256, de 06 de novembro de 1991 (`26156`): cabecalho_nao_reconhecido, sem_fecho
