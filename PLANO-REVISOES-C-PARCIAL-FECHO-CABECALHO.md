<!-- Relatório de agente de pesquisa (somente leitura), 27/11/2026. INSUMO, não autoridade: afirmações que sustentam decisão são reconferidas (regra 12c). Ver PLANO-REVISOES.md. -->
# Recorte C — promulgação parcial, sem fecho, cabeçalho não reconhecido, sem artigos (recentes, 27/11/2026)

Escopo recalculado de `docs/dados/revisao/fila.json`: 35 normas distintas (promulgacao_parcial 19, sem_fecho 15, cabecalho_nao_reconhecido 12, sem_artigos 10; a união fecha em 35). Todas as 35 foram abertas uma a uma (texto em `dados/textos/sapl/<id>.txt`, estruturado, JSON de revisão, catálogo). Scripts temporários em `scratchpad/levantamento/c_*.mjs`.

## 1. Tabela por norma

Classes: 1 regra determinística sem humano · 2 IA propõe, humano amostra · 3 humano ponto a ponto · 4 defeito da fonte.

### 1.1 "o dispositivo da Lei nº N" com a lei INTEIRA no texto (9 normas; família A)
Todas: Câmara, "manteve e eu promulgo o dispositivo da Lei nº N, como segue:", Art. 1º ao último sem salto, último artigo é a vigência, zero linha de pontos, uma só lei no arquivo, fecho de Câmara presente. Motivo único do motor: `promulgacao_parcial` (a regex acha "o dispositivo da Lei nº").

| id | rótulo | motivos | causa real | classe |
|---|---|---|---|---|
| 50525 | Lei 14.337/2025 | promulgacao_parcial | Art. 1º–6º; "Art. 6º Esta Lei entra em vigor … retroagindo"; fecho `CÂMARA MUNICIPAL DE PORTO ALEGRE, 03 DE OUTUBRO DE 2025.` = cabeçalho | 1 (se Q1=sim) |
| 50526 | Lei 14.325/2025 | promulgacao_parcial | Art. 1º–4º, vigência no 4º; datas iguais | 1 |
| 50521 | Lei 14.321/2025 | promulgacao_parcial | Art. 1º–2º (utilidade pública); datas iguais; arquivo no catálogo chama-se `lei_14321_-_promulgada.docx` | 1 |
| 50477 | Lei 14.310/2025 | promulgacao_parcial | Art. 1º–2º; fecho 14/08 × cabeçalho 13/08 (+1 dia) | 1 |
| 50476 | Lei 14.309/2025 | promulgacao_parcial | Art. 1º–6º; fecho 25/09 × cabeçalho 13/08 (+43 dias) | 1 |
| 50408 | Lei 14.272/2025 | promulgacao_parcial | Art. 1º–6º; datas iguais | 1 |
| 50359 | Lei 14.271/2025 | promulgacao_parcial | Art. 1º–6º (art. 3º está indentado; ok); datas iguais | 1 |
| 50186 | Lei 14.248/2025 | promulgacao_parcial + fecho_com_texto_demais | Art. 1º–5º; o fecho (939 car.) é só o selo de assinatura com ruído da camada de texto ("sell", "assinatura", "eletrônica", "88 52" no lugar de "§§ 5º") que o carimbo não reconhece | 1 (A) + 1 (fecho: recorte D) |
| 50178 | Lei 14.240/2025 | promulgacao_parcial + fecho_com_texto_demais | idem (956 car. de selo) | 1 + 1 |

### 1.2 Fragmento real (promulgação parcial legítima), arquivo só com o fragmento (5; família B)
Texto lido = só os dispositivos promulgados + linhas de pontos no lugar do resto; data do fecho posterior à do cabeçalho em todos (esperado: o fecho é a data da promulgação pela Câmara).

| id | rótulo | motivos | causa real | classe |
|---|---|---|---|---|
| 41862 | Lei 12.482/2018 | parcial + rotulo_nao_confere | "promulgo dispositivo da Lei nº 12.482"; `Art. 2º ......` + inc. III. Motor numera por posição: `art-1`, `art-1/inc-I` onde o texto escreve "Art. 2º"/"III". Datas 11/12/2018 → 06/03/2019 | 3 (Q2) |
| 42382 | Lei 12.656/2019 | idem | `Art. 18. ....`, `§ 2º ....`: viram `art-1`, `art-1/par-unico` (um "§ 2º" sozinho vira parágrafo único: 3 dispositivos divergentes). 27/12/2019 → 13/07/2020 | 3 |
| 42590 | Lei 12.708/2020 | idem | `Art. 2º`, `Art. 4º` viram art-1/art-2 (naOrigem "Art2º"/"Art4º"). A lei sancionada inteira está noutro registro (42591, aceita). 28/05 → 13/07/2020 | 3 |
| 51122 | Lei 14.504/2026 | idem | só o `Art. 4º` (altera § 3º do art. 38-A da Lei 10.605) vira `art-1`; bloco de alteração lido "ok". 11/03 → 26/06/2026 | 3 |
| 41676 | Lei 12.420/2018 | idem | "conforme segue": Arts. 2º, 6º, 8º, 12, 17, 24, 25, 27… com pontos; 9 de 14 dispositivos com rótulo divergente (art-5 ↔ "Art25", art-6 ↔ "Art27"…); carimbos "PROC./PLL" soltos no meio. 08/06 → 25/07/2018 | 3 |

### 1.3 Arquivo composto: fragmento + a lei sancionada inteira no mesmo PDF (4; família C)
Duas epígrafes e dois "Faço saber" (fragmento da Câmara primeiro; depois a lei do Prefeito com os "VETADO"). O motor lê só a 1ª e **engole a 2ª lei dentro do `fecho`** (o carimbo "Documento assinado…" corta a medição do tamanho, por isso `fecho_com_texto_demais` não dispara em 3 dos 4).

| id | rótulo | motivos | causa real | classe |
|---|---|---|---|---|
| 44038 | Lei 13.162/2022 | parcial + rotulo_nao_confere | fragmento (Arts. 2º, 3º, 7º com "…") + lei sancionada de 01/07/2022 (Arts. 1º–10, com "I – VETADO", "§ 1º VETADO", "Art. 7º VETADO", "Art. 9º VETADO"); fecho lido = 6.305 car. | 3 (Q3) |
| 42401 | LC 872/2020 | idem | fragmento (Arts. 8º, 9º, 10, 14, 21, 22, 25–29) + LC sancionada de 10/01/2020 (Cap. I…); fecho lido = 39.462 car.; arquivo `lc_872_com_e_sem_veto.pdf` | 3 |
| 50876 | Lei 14.481/2026 | parcial + bloco_de_alteracao_sem_dono | fragmento = Art. 1º (altera inc. III/IV do art. 3º da Lei 13.396) que na lei sancionada aparece como `Art. 1º VETADO.`; a lei sancionada (Art. 2º altera o art. 4º da Lei 13.396; Art. 3º vigência) está no fecho de 2.546 car. e **o comando do Art. 2º não é lido**; arquivo `ll14481_original__derrubada_de_veto.pdf` | 3 |
| 51485 | LC 1.075/2026 | parcial + fecho_com_texto_demais + rotulo + bloco_sem_dono | fragmento (art. 185 § 3º, Prefeito, 23/09/2026) + o Plano Diretor inteiro (4.490 linhas, 228 "Art.") dentro do fecho de 213.853 car.; arquivo `lc1075_atualizada_ate_24.09.2026.pdf` | 3 |

### 1.4 LOA com fragmento OCR (1)
| 42380 | Lei 12.655/2019 (LOA 2020) | parcial + sem_artigos + sem_fecho + texto_fora_da_arvore + trecho_nao_localizado + bloco_sem_dono | digitalização ruim (cobertura 0,017, página de lixo "o 5 55 5…", "8$ 5º", "dispo- sitivos"); formato próprio "I — Alteração produzida no art. 3º … Emendas nº 134…" com quadros de despesa. A lei sancionada está em 42381 (aceita). Orçamentária (decisão 41) | 4 (OCR) + 3 |

### 1.5 Não parcial: sem fecho / cabeçalho / sem artigos (16)
| id | rótulo | motivos | causa real | classe |
|---|---|---|---|---|
| 47747 | Lei 13.761/2023 | cabeçalho+sem_artigos+sem_fecho | arquivo (342 car.) é o aviso da Redação Oficial: "TORNA SEM EFEITO a publicação da Lei nº 13.761, de 8 de dezembro de 2023, … Edição 6687"; ementa do catálogo "TORNADA SEM EFEITO EM 13/12/2023." Não é a lei | 4 (com marcação automática possível, Q4) |
| 40318 | LC 779/2015 | idem | mesmo aviso: "TORNA SEM EFEITO a publicação da Lei Complementar nº 779 … por inserção indevida"; a observação do catálogo liga a `Norma_779_20151103_1.html` (não baixado; não sei o que contém) | 4 |
| 44158 | LC 951/2022 | sem_artigos+sem_fecho (aviso cabecalho_fora_do_padrao) | só a capa do Diário (509 car.): "Edição 6826… Protocolo: 373730… LEI COMPLEMENTAR Nº 951, DE 17 DE AGOSTO DE 2022, que "dispõe sobre a mobilidade urbana…"". PDF de 86 KB, pdftotext devolveu 393 alfanuméricos; o corpo da lei não tem texto | 4 (talvez OCR; não verificável aqui) |
| 41842 | Lei 12.475/2018 | cabeçalho_nao_reconhecido | **arquivo de outra lei**: o texto é a Lei 12.476, de 7/12/2018 (cabeçalho `LEI Nº 12.476, DE 7 DE DEZEMBRO 2018.`, sem "DE" antes do ano). O catálogo manda 41842 (12.475, Rua de Pedestre Maestro Eliézer…) e 41853 (12.476) para o MESMO arquivo `2718_ce_241951_1.pdf`; 41853 está aceita; `textoIgualA:[41853]`. O link certo da 12.475 aparece em `outrosLinks`: `2708_ce_240912_1.pdf` | 4 |
| 40514 | LC 790/2016 | cabeçalho+sem_artigos+sem_fecho | HTML do SIREL de 1.748 bytes; extraído "LC 790" ×4 (29 car., `texto_curto`). Observação liga também `Norma_790_20160210_2.html` | 4 |
| 36914 | LC 652/2010 | idem | HTML de 1.038 bytes, 0 alfanuméricos; texto lido = "<" | 4 |
| 36188 | LC 623/2009 | idem | HTML de 1.038 bytes, 0 alfanuméricos; texto lido = "<" | 4 |
| 40303 | LC 775/2015 | idem | arquivo `R LC 775 Anexo.pdf`: mapa "Zona Rural" lido por OCR (lixo); a lei está em `Norma_775_20151023_1.html` (decisão 36: dois arquivos) | 4 |
| 36372 | LC 630/2009 | idem | `LC630_Anexo III.pdf`: mapa "Lomba do Pinheiro" por OCR; lei noutro link | 4 |
| 39395 | LC 738/2014 | idem | `LC 738 Anexo.pdf`: tabela de números soltos ("Área 2 32 …"); lei em `Norma_738_20140502_1.html` | 4 |
| 41179 | LC 813/2017 | cabeçalho+sem_fecho+bloco_sem_fechamento_de_aspas | OCR: `E LEI COMPLEMENTAR Nº 813, DE 20 DE MARÇO DE 2017. ST`; fecho `PREFEITURA MUNIÇIPAL DE PORTO ALEGRE, 20 de março de 2017.` (Ç no lugar de C); bloco do art. 5º sem aspas de fecho + linha de lixo ("CRMCL CRECI PLC UNE…") | 4 (OCR; regra do projeto: OCR não se corrige) |
| 41347 | LC 818/2017 | sem_fecho + alteracao_sem_aspas_nao_delimitada | OCR: fecho `PREFEITURA M ALEGRE, 11 de setembro de 2017.` ("UNICIPAL DE PORTO" perdido); Art. 1º termina em "…conforme segue:" e **o texto da al. d não está no arquivo** (nada entre o Art. 1º e o Art. 2º) | 4 |
| 36190 | LC 624/2009 | sem_fecho + texto_fora_da_arvore + trecho_nao_localizado | OCR (aviso `texto_de_ocr`, `tem_anexo`): só 3 dos 29 artigos entram (cobertura 0,669); fecho `PREFEITURA MUNICIPAL DE PORTO ALEGRE, 25 de junho de` sem o ano ("2009" perdido); "Art. 29: Esta Lei … pu-" | 4 |
| 44305 | EC 43/2017 | cabeçalho+sem_fecho+rotulo+bloco_sem_dono | digitalização com letras espaçadas ("E M E N D A À L E I O R G Â N I C A N° 43"; "Art. I"; fecho "A L E G R E, 25 DE MAJO DE 2017"); já coberta pelas decisões 29 e 32 | 4 (decisão 32) |
| 44307 | EC 42/2016 | cabeçalho+texto_fora_da_arvore+trecho+rotulo+bloco_sem_dono | idem ("EMENDA À L E I ORGÂNICA N° 42", "Art. 3 Esta Emenda", "§ I"); o fecho letra-espaçado "CÂMARA MUNICIPAL DE PORTO A L E G R E , 3 DE AGOSTO DE 2016." foi lido | 4 (decisão 32) |
| 39600 | LC 743/2014 | sem_fecho | texto limpo (Câmara, promulgação integral, Arts. 1º–3º). O arquivo não tem linha de local e data: termina em `Art. 3º … retroagindo seus efeitos a 1º de agosto de 2013.` + `Ver. Professor Garcia, Presidente. Registre-se epublique-se: Ver. Guilherme SociasVillela, 1º Secretário.`. Documento repetido 3× (decisão 28 já trata) | 2 (Q5) |

## 2. Famílias de causa (soma = 35)

| Família | ids | n | classe |
|---|---|---|---|
| A. "promulgo o dispositivo" com lei inteira (veto total derrubado, provável) | 50525 50526 50521 50477 50476 50408 50359 50186 50178 | 9 | 1 (condicionada a Q1) |
| B. Fragmento parcial legítimo, só o fragmento no arquivo | 41862 42382 42590 51122 41676 | 5 | 3 (Q2) |
| C. Arquivo composto (fragmento + lei sancionada inteira) | 44038 42401 50876 51485 | 4 | 3 (Q3) |
| D. LOA parcial em digitalização ruim | 42380 | 1 | 4 + 3 |
| E. Arquivo é aviso "torna sem efeito" | 47747 40318 | 2 | 4 |
| F. Arquivo é só anexo/mapa/tabela (registro com dois arquivos) | 40303 36372 39395 | 3 | 4 (decisão 36) |
| G. Fonte vazia/stub (HTML sem texto) ou capa do diário | 36914 36188 40514 44158 | 4 | 4 |
| H. Arquivo de outra lei | 41842 | 1 | 4 |
| I. OCR/digitalização ruim (fecho/cabeçalho/bloco estragados) | 41179 41347 36190 44305 44307 | 5 | 4 |
| J. Texto limpo, fecho sem local/data | 39600 | 1 | 2 |
| Total | | 35 | |

Respostas diretas ao pedido: das 19 parciais, **9 não são parciais** (família A: lei inteira); **5 são parciais legítimas** com o texto correto (B); **4 são arquivos compostos** (C); **1 é LOA em OCR ruim** (D). As datas do cabeçalho × fecho das 10 parciais reais divergem todas, sempre com o fecho POSTERIOR (esperado, a promulgação vem depois); nenhuma tem fecho anterior ao cabeçalho. Nas 9 da família A, 6 têm datas iguais, 2 diferem em +1 dia e 1 em +43 dias (50476).

## 3. Regras propostas

### R1 (família A) — "promulgação integral após veto" (não parcial)
- Gatilho: `detectarPromulgacaoParcial` acha objeto, e TODAS as condições: (a) zero linhas de pontos (`/(?:\.|…){6,}/`); (b) 1ª sequência de "Art. N" no início de linha vai de 1 a N sem salto; (c) o texto traz "Art. N … Esta Lei … entra em vigor"; (d) um só "Faço saber" e uma só epígrafe no arquivo; (e) fecho de Câmara presente com data ≥ data do cabeçalho; (f) número do "Lei nº N" do promulgo = número do cabeçalho.
- Resultado: não gerar `promulgacao_parcial`; marcar `promulgada_apos_veto_total` como aviso (e `veto_derrubado` já vem da proveniência).
- Trava: qualquer linha de pontos, salto de numeração, ausência de vigência, 2ª lei no arquivo, ou "dispositivos" no plural → continua parcial.
- Risco de falso aceite: um fragmento parcial que por acaso traga todos os artigos 1..N com a vigência. Isso é a lei inteira, logo não há texto faltando. Resta o risco de o modelo errar o estado (a lei ter sido sancionada em parte e o arquivo só trazer o fragmento sem pontos): o conjunto dos 21 casos não-A nas 30 normas com "promulgo" (acervo inteiro) tem pontos ou salto ou 2 leis em todos (medido, ver `c_integral.mjs`).
- Teste real: prova 50525 50526 50521 50477 50476 50408 50359 50186 50178; desmente 41862 42382 42590 51122 41676 44038 42401 50876 51485 42380 (e as 11 antigas). Teste do código antigo: as 9 hoje saem `promulgacao_parcial`.
- Impacto: 7 saem da fila (50525 50526 50521 50477 50476 50408 50359); 50186 e 50178 continuam por `fecho_com_texto_demais` até a regra do carimbo com ruído (recorte D: reconhecer o selo "Documento assinado eletronicamente … / A autenticidade deste documento…" mesmo com linhas de ruído do selo; hoje só a primeira linha do carimbo conta como corte e as linhas "sell/assinatura" antes dela entram na conta).
- Medir: rodar `detectarPromulgacaoParcial` + R1 nos 30 textos do acervo com "promulgo" e conferir que só os 9 mudam; bateria + `node teste_promulgacao_parcial.mjs` (72) inalterada em tudo que é fixture parcial.
- **Depende de decisão do mantenedor (Q1)**: a regra do CLAUDE.md diz que o objeto do "promulgo" decide; "o dispositivo da Lei nº N" é objeto singular com lei inteira, caso não previsto.

### R2 (família B) — "parcial confirmada" como estado, não como defeito
- Gatilho: parcial (objeto "dispositivo(s)", incluindo as grafias de ligatura "disposi vos", "dispo- sitivos") E ≥1 linha de pontos E uma só lei no arquivo E fecho com data ≥ cabeçalho E sem outros motivos além de `rotulo_nao_confere_com_a_origem` cujo divergente seja explicável pelo fragmento (rótulo escrito existe no texto de origem, em ordem crescente).
- Resultado proposto: situação própria `parcial_confirmada` (não `aceita` limpa): texto é Visão incompleta, serve de fonte de comando (51122 art. 4º altera a Lei 10.605 art. 38-A § 3º) e não de base. Só vale se Q2 mudar a decisão 27 (endereço pelo rótulo ESCRITO nos fragmentos, `art-4`, `art-18/par-2`); sem isso o endereço `art-1` para "Art. 4º" é errado e não se confirma.
- Trava: arquivo composto (C), OCR, 2+ epígrafes, `bloco_de_alteracao_sem_dono`, `texto_fora_da_arvore`.
- Risco de falso aceite: fragmento mal lido que perca um dispositivo promulgado; a conferência de conservação já cobre (cobertura 0,95–1,0 nas 5).
- Teste real: 41862 42382 42590 51122 41676 provam; desmentem 44038/42401/50876/51485 (compostos) e 42380 (OCR).
- Impacto: 5 saem da fila (se Q2 = seguir o rótulo escrito) — 42382 exige também corrigir o `par-unico` inventado para "§ 2º" sozinho.

### R3 (família C) — dividir o arquivo composto
- Gatilho: 2ª epígrafe com o MESMO tipo e número da 1ª, precedida de fecho + carimbo, e 2º "Faço saber … sanciono a seguinte Lei" (Prefeito) com "VETADO" ou lacunas na 1ª parte; tratar documento 1 = promulgação parcial, documento 2 = lei sancionada.
- É a decisão 28 estendida a cópias NÃO idênticas (aqui são documentos diferentes por natureza). **Não propor sem Q3**: depende da modelagem de `veto_derrubado`/`visoes[]` (CLAUDE.md: não decidida). Até lá, regra mínima segura e determinística: **nunca remover `promulgacao_parcial` de arquivo com 2 epígrafes** (trava de R1/R2).

### R4 (família J) — fecho só de assinaturas
- Gatilho: sem fecho de data, mas o final do texto (últimas ~6 linhas) é `Ver. <nome>, Presidente.` / `Registre-se e publique-se:` / `Ver. <nome>, 1º Secretário.` depois do último artigo; data tomada do cabeçalho.
- Trava: só Câmara-promulga (preâmbulo "promulgo"); só se o último artigo for vigência; aviso `fecho_sem_data`; nunca com aviso de OCR.
- Risco: arquivo truncado antes do último artigo (travado pelo "último artigo é vigência").
- Impacto: 1 recente (39600). No acervo todo: sem_fecho com "Registre-se" no fim = 33, mas só 4 têm sem_fecho como único motivo (28766 28780 29309 39600); o resto é antigo com outros defeitos. Ganho pequeno; só vale se Q5.

### Regras de rotulagem (classe 4, sem aceitar nada)
- R5 `arquivo_e_aviso_sem_efeito`: texto começa por `TORNA SEM EFEITO a publicação da Lei(Complementar)? nº N` e ementa do catálogo `TORNAD[AO] SEM EFEITO`; 2 casos (47747, 40318), único par em todo o acervo. Só muda o título do motivo/roteiro; não aceita.
- R6 `arquivo_de_outra_norma`: número do cabeçalho ≠ catálogo E `textoIgualA` aponta outra norma com o número igual ao do cabeçalho (41842 → 41853). Hoje só aparece por acaso (o cabeçalho sem "DE" não foi lido, então nem `numero_diverge_do_catalogo` disparou). Tolerar "DE <MÊS> <ano>" sem o "DE" do ano na extração do cabeçalho faria o motivo certo (`numero_diverge`) disparar; ganho de clareza, não de aceite.
- R7 `fonte_vazia`: HTML/PDF com < 200 alfanuméricos e tamanho de arquivo > 1 KB (36914 36188 40514): título claro "arquivo da fonte vazio".

## 4. Perguntas ao mantenedor (regra 11)

**Q1 — "promulgo o dispositivo da Lei nº N" com a lei inteira.** Evidência: 9 normas de 2025 (50525, 50526, 50521, 50477, 50476, 50408, 50359, 50186, 50178), todas com Art. 1º ao último, vigência, sem nenhuma linha de pontos, uma lei só, e (nas 8 em que o catálogo informa) arquivo "promulgada". O motor chama de parcial pelo substantivo "dispositivo". Pergunta: nesse modelo da Câmara ("manteve e eu promulgo o dispositivo da Lei nº N, como segue:" seguido da lei completa) é veto TOTAL derrubado, ou pode haver parcial que traga o texto completo? Alternativas: (a) é total: criar `promulgada_apos_veto_total` e a norma segue como lei integral (7 saem da fila agora, 2 após a regra do selo); (b) sempre parcial até haver o texto sancionado: nada muda e as 9 ficam na fila. Recomendação: (a), com a trava de pontos/salto/2ª lei. Também: a data do cabeçalho nessas leis é a data da derrubada/promulgação? (6 com data igual ao fecho, 50476 com 43 dias de diferença.)

**Q2 — Endereço de dispositivo em fragmento parcial (reabrir a decisão 27).** Evidência: 41862 (`art-1` para "Art. 2º", inc. "III" → `inc-I`), 42590 (`art-1/art-2` para "Art. 2º/Art. 4º"), 51122 (`art-1` para "Art. 4º"), 42382 (`Art. 18` → `art-1`, "§ 2º" sozinho → `par-unico`), 41676 (9 de 14 divergentes). Um fragmento legítimo nunca consegue ser "aceito" enquanto a posição valer. Alternativas: (a) seguir o rótulo ESCRITO só quando o preâmbulo é promulgação parcial (como as decisões 5 e 26): `art-4`, `art-18/par-2`; sai o falso `rotulo_nao_confere` e o endereço passa a bater com o que a lei cita; (b) manter posição e o revisor aceita (decisão 27 hoje), 5 normas sempre na fila. Recomendação: (a) apenas para fragmento confirmado (R2), com estado `parcial_confirmada` e texto como Visão incompleta.

**Q3 — Arquivos compostos (fragmento + lei sancionada no mesmo PDF).** Evidência: 44038, 42401, 50876, 51485 (a lei sancionada com "VETADO" vem depois do fragmento; ex. 50876: "Art. 1º VETADO." na sancionada e "Art. 1º Fica alterado o inc. III…" no fragmento). O motor engole a 2ª lei no `fecho` e perde comando (50876: o Art. 2º altera o art. 4º da Lei 13.396). Pergunta: como se modela? Alternativas: (a) ler a lei sancionada como Versão original e o fragmento como a "derrubada" que preenche os dispositivos vetados (é a modelagem `visoes[]` ainda sem decisão); (b) por ora só sinalizar `arquivo_composto` com motivo próprio e título em português, sem aplicar; (c) tratar como erro de fonte. Recomendação: (b) já, (a) quando houver decisão sobre `veto_derrubado`.

**Q4 — Aviso "torna sem efeito".** Evidência: 47747 (Lei 13.761/2023) e 40318 (LC 779/2015): arquivo é o aviso da Redação Oficial, a ementa do catálogo diz "TORNADA SEM EFEITO". A publicação foi tornada sem efeito (não necessariamente a lei). Pergunta: esses registros entram no corpo normativo, saem, ou ficam com marca "publicação tornada sem efeito" e sem texto? Recomendação: marca própria, fora da fila e fora da contagem de "a revisar", sem apuração (o texto não existe no arquivo).

**Q5 — Fecho de Câmara sem local e data.** Evidência: LC 743/2014 (39600), único recente; as 4 normas antigas com o mesmo formato têm só `sem_fecho`. Em 21 de 23 recentes com "Ver. …, Presidente." a linha de data existe. Alternativas: (a) aceitar com aviso `fecho_sem_data` quando o bloco de assinaturas fecha o texto depois da vigência (R4); (b) deixar na fila. Recomendação: (a), ganho de 1 norma, só se quiser (baixo valor).

**Q6 — Segundo arquivo da fonte (outrosLinks).** Evidência: o catálogo guarda em `observacao` o link da lei verdadeira para 40303, 36372, 39395, 40318 (`Norma_N_AAAAMMDD_1.html`), 40514 (`_2.html`) e o certo da 12.475 (`2708_ce_240912_1.pdf`). A decisão 36 deixou isso como defeito de fonte por ora. Pergunta: quando a fase de anexos começar, autoriza baixar o link alternativo (mesma etiqueta, 1 req/min) quando o principal é anexo, vazio ou de outra norma? Recomendação: sim, como pesquisa à parte (não sei o que há nesses links; não pude baixar).

## 5. Achados inesperados

1. **A lei engolida no `fecho`.** Em 44038, 42401, 50876, 51485 a 2ª lei inteira vira texto do fecho; `tamanhoDoFechoSemCarimbo` corta no primeiro "Documento assinado eletronicamente", que vem logo depois da data do fragmento. Hoje nenhuma norma ACEITA tem 2ª "Faço saber"/epígrafe no fecho (medido: 17 normas no acervo com isso, 0 aceitas), mas só porque `promulgacao_parcial` as segura. Qualquer regra que tire `promulgacao_parcial` (R1/R2) precisa da trava "uma só epígrafe". Sugestão: motivo próprio `segunda_lei_no_fecho`.
2. **`detectarPromulgacaoParcial` classifica pelo substantivo.** `(.{1,140}?) d[aoe]s? Lei nº` aceita "o dispositivo da Lei nº N" como parcial mesmo com lei inteira (9 casos reais). O CLAUDE.md afirma que "o objeto decide" mas não prevê "o dispositivo" com lei inteira.
3. **Parágrafo sozinho em fragmento vira `par-unico`.** 42382: "§ 2º ....." no meio do Art. 18 gera `art-1/par-unico`; contraria a decisão 5 (endereço segue o rótulo escrito).
4. **41842: motivo errado por pouco.** O cabeçalho "DE 7 DE DEZEMBRO 2018" (sem "DE" antes do ano) impede ler o número 12.476; a divergência real (arquivo de outra lei) só foi pega porque o cabeçalho falhou. Se o cabeçalho fosse perfeito, o motivo seria `numero_diverge_do_catalogo` (também revisar). Não há falso aceite.
5. **Fecho "com texto demais" nas 2 da família A** (50186, 50178): é o selo gráfico de assinatura com ruído na camada de texto, não texto da lei; 50359 (mesmo modelo, selo limpo) passa. Recorte D.
6. **44158 (LC 951)**: PDF de 86 KB com camada de texto só na capa; o OCR (`pdfDigitalizado`) aparentemente não rodou ou não ajudou. Não verifiquei (sem o PDF bruto no repositório); vale checar se a rotina noturna tem tesseract.
7. **36188 e 36914 aparecem em `_textos_iguais.json`** junto com 31822 e 33244 (todos vazios): o selo "texto idêntico" os liga por serem iguais a "<", não por serem a mesma lei. Ruído do selo.
8. **Sem contradição com o CLAUDE.md** quanto a datas: em toda promulgação parcial real o fecho é posterior ao cabeçalho; `suspeita` só se aplica a não-parcial, e nenhum caso dispara.

## 6. Confiança do levantamento
Conferido norma a norma (abri texto, estruturado, JSON de revisão e catálogo das 35). Medido no acervo inteiro por script: parciais detectadas (30), arquivos com 2ª lei no fecho (17), sem_fecho com "Registre-se" (146 sem_fecho; 33 com assinatura), cabeçalhos de Câmara sem data de fecho (23 recentes). **Não verificado:** o conteúdo dos HTML/PDF alternativos de `outrosLinks` (sem rede), se a Lei 13.761 e a LC 779 existem noutro registro, se o OCR da rotina noturna rodou em 44158, e a natureza jurídica real de "o dispositivo" (veto total × parcial), que é a Q1 e depende da prática da Câmara.
