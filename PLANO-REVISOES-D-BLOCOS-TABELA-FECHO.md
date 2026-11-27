<!-- Relatório de agente de pesquisa (somente leitura), 27/11/2026. INSUMO, não autoridade: afirmações que sustentam decisão são reconferidas (regra 12c). Ver PLANO-REVISOES.md. -->
# Levantamento D — blocos de alteração, tabela no corpo, fecho com texto demais, trecho não localizado, fora da árvore, endereço repetido (recentes)

Agente de pesquisa, somente leitura. 27/11/2026. Fonte: `docs/dados/revisao/fila.json` (estruturador v30), `docs/dados/revisao/n/<id>.json` e `.cmd.json`, `dados/estruturado/sapl/`, `dados/textos/sapl/`, `dados/historico/sapl/`. Scripts temporários em `scratchpad/levantamento/d/` (`dump.mjs`, `front.mjs`, `cmds.mjs`, `hist.mjs`, `split.mjs`).

**Recorte recalculado:** 42 normas recentes da fila têm pelo menos um dos 9 motivos (contagens por motivo: bloco_sem_fechamento_de_aspas 11 · fecho_com_texto_demais 10 · trecho_nao_localizado_na_origem 8 · bloco_de_alteracao_sem_dono 6 · texto_fora_da_arvore 6 · aspa_de_abertura_ausente 5 · tabela_no_corpo 5 · alteracao_sem_aspas_nao_delimitada 4 · endereco_repetido 3; batem com o PLANO). Várias normas têm mais de um motivo; abaixo cada norma entra em **uma** família (a causa principal).

**Resumo em 5 linhas**
1. Nas 12 fronteiras inferidas (R2/R4) que conferi, **a fronteira do motor está certa em todas**; e em todas os dispositivos citados na introdução batem 1 a 1 com os do bloco. Esse segundo sinal pode ser conferido por regra (proposta R-D1).
2. Duas alteradoras (46770, 43376) têm bloco **não lido** por um padrão (R5) que hoje está proibido de delimitar (decisão 11). Uma regra mais estrita evitaria o falso positivo conhecido (37945). Na 46770 **o histórico da lei-alvo omite o art. 13-A sem aviso**.
3. Três falsos alarmes de `fecho_com_texto_demais` vêm de regras mecânicas: o carimbo eletrônico com sujeira de OCR antes dele (4 normas) e o cabeçalho de anexo em caixa mista, "Anexo 2" (2 normas). Correção determinística, medida no acervo inteiro sem efeito colateral.
4. **Achados graves fora da fila:** (a) 35 normas *aceitas* têm o cabeçalho ou rodapé de impressão do SEI **dentro do texto de um dispositivo**; (b) um bug do core (`reArtX` com `/i`) parte o bloco de alteração na linha que começa por "art. N" minúsculo (quebra de linha), e já **truncou o texto vigente** em 4 históricos (um deles a Lei Orgânica, art. 116-A § 2º); (c) o histórico aplica alteradoras que estão "a revisar" sem marcar nada, e assim gravou lixo de OCR e colunas embaralhadas como texto vigente (LO art. 61, LC 332 art. 5º, LC 434 art. 1º).
5. 10 das 42 são defeito de fonte (OCR, extração, página de 3 colunas do DOPA). 5 são tabelas legítimas no articulado. 3 são arquivos com **dois documentos** (promulgação parcial + lei sancionada), e um deles já causou erro silencioso no histórico (50876).

---

## 1. Tabela por norma (as 42 conferidas, norma a norma)

Classe: **1** regra determinística · **2** IA propõe, humano amostra · **3** humano ponto a ponto · **4** defeito da fonte.

| id | rótulo | motivos do motor (deste recorte em **negrito**) | causa real verificada | família | classe |
|---|---|---|---|---|---|
| 51463 | LC 1.074/2026 | **bloco_sem_fechamento**, **aspa_de_abertura_ausente** | Dois blocos inferidos, **ambos certos**. Art. 10 (R4): `Art. 29-D. ......` … `....” (NR)`, termina antes de "Art. 11. Fica alterado o caput do art. 37". Art. 20 (R2): `Art. 89-A. ....` … "IV – multa de 3.000 (trez mil) UFMs … reincidência." sem aspas, termina antes de "Art. 21. Ficam alterados os incs. I a III do art. 91". Efeito (hist. 17878): 89-A § 4º II a IV aplicados certo. Os comandos de 29-D § 1º foram recusados, porque a versão-base não tem o § 1º; o histórico registra isso em `naoAplicadas` (não é silencioso). | F1 | 2 |
| 50149 | Lei 14.239/2025 | **bloco_sem_fechamento** | Certo. O bloco "Art. 3º-B …" termina em "Parágrafo único. VETADO." sem aspa; o próximo é "Art. 5º Esta Lei entra em vigor". Lei-alvo fora da base. | F1 (VETADO no fim) | 2 |
| 42216 | LC 859/2019 | **bloco_sem_fechamento** | Fronteira certa: o bloco do art. 5º da LC 7 termina em "§ 19. VETADO." e o próximo é "Art. 3º Fica alterado o inc. I…". **Porém o art. 2º (o do bloco) e o art. 1º saem `nao_classificado`**: introdução mista ("Ficam alterados o caput do § 1º … e ficam incluídos incs. V e VI no § 17 e §§ 18 e 19, todos no art. 5º"), e nenhum comando sai dela. É limitação do extrator, não da fronteira. | F1 (VETADO) | 2 |
| 39258 | LC 733/2014 | **bloco_sem_fechamento** | Certo: o bloco termina em "§5º VETADO." antes de "Art. 2º Esta Lei Complementar entra em vigor". Hist. 24099: § 1º e § 5º do art. 15 aplicados. | F1 (VETADO) | 2 |
| 38051 | LC 690/2012 | **bloco_sem_fechamento** | Certo: arts. 29-A e 29-B, até antes de "Art. 2º As despesas decorrentes…". O comando sai `indeterminado`; o hist. 37422 registra a não aplicação. | F1 | 2 |
| 37352 | EC 31/2011 | **bloco_sem_fechamento** | Certo: "Art. 68 / ...... ...... / IV - em licença-gestante, por 180 …;" antes de "Art. 2° Esta Emenda…". Hist. LO: inc. IV = 180 dias, certo. (Detalhe: uma linha de reticências com espaço no meio, "...... .....", vira um 1º comando espúrio de inserção do inc. IV; o resultado final fica certo.) | F1 | 2 |
| 39825 | LC 755/2014 | **bloco_sem_fechamento** | Certo: Capítulo VIII com as Seções I a III e os arts. 52-O a 52-R, até antes de "Art. 11. Ficam incluídos item 6…". Lei-alvo (LC 7) fora da base. | F1 | 2 |
| 48437 | LC 1.011/2024 | **aspa_de_abertura_ausente** | Certo (R4): art. 10, `Art. 3º ....` com os incs. I, III, V e VII e `....” (NR)`. Lei-alvo (Lei 5.994) fora da base. | F2 | 2 |
| 46278 | Lei 13.486/2023 | **aspa_de_abertura_ausente** | Certo (R4): `Art. 15. ....`, § 2º, I, II, `....” (NR)`, antes de "Art. 3º No art. 39…". Fora da base. | F2 | 2 |
| 48226 | LC 964/2022 | **aspa_de_abertura_ausente** | Certo (R4): `Art. 4º ....`, § 1º, `....” (NR)`. Hist. 42460: art. 4º § 1º aplicado com o texto completo. | F2 | 2 |
| 46770 | Lei 13.574/2023 | **alteracao_sem_aspas_nao_delimitada**, rótulo | O art. 10 diz "Fica incluído art. 13-A na Lei nº 13.219, de 2022, conforme segue:" e a linha seguinte é "Art. 13-A. O Executivo Municipal disponibilizará…", **sem aspa de abertura e sem reticências**; o bloco fecha em "…semestralmente.”". O motor não delimita (decisão 11), e o art. 13-A com seus incisos virou **art-11 da alteradora**. **Efeito: o hist. 44210 (Lei 13.219) não tem o art. 13-A, e `naoAplicadas` está vazio (incompleto sem aviso).** | F3 | 2 (regra R-D3) |
| 43376 | LC 915/2021 | **alteracao_sem_aspas_nao_delimitada**, rótulo (27 pontos) | Mesmo padrão: "…§§ 6º … 12 no art. 37-A da LC 478 … conforme segue:" seguido de "Art. 37-A. Para o cálculo…" sem aspa, até "§ 12. … desta Lei Complementar.” (NR)", antes de "Art. 12. Fica alterado o caput e o § 1º…". Os 27 pontos vêm de o 37-A ter virado dispositivo da alteradora. | F3 | 2 (R-D3) |
| 42887 | Lei 12.777/2020 | **texto_fora**, **trecho_nao_localizado** | O bloco está certo. O cabeçalho/rodapé de impressão do SEI ("https://sei.camarapoa.rs.gov.br/sei/controlador.php?acao=documento_imprimir_web… 1/2" e "17/11/2020 SEI/CMPA - 0179885 - Lei (CMPA)"), que vem depois do bloco, foi colado ao texto do art. 1º. | F4 | 1 (R-D4) |
| 51452 | Lei 14.578/2026 | **trecho_nao_localizado** | O rodapé de página do SEI "Lei (CMPA) 1109744  SEI 085.00002/2026-71 / pg. 1", depois do bloco do art. 46-C, foi colado ao art. 1º. Os blocos estão certos. | F4 | 1 (R-D4) |
| 46403 | Lei 13.501/2023 | **texto_fora**, **trecho_nao_localizado**, **aspa_de_abertura_ausente**, rótulo | (a) O R4 do art. 20-A está certo. (b) **Aspa extraviada na fonte:** no bloco do art. 50-P, "§ 6º … aposentadoria.”" fecha cedo e os §§ 7º, 8º e 9º (que continuam o 50-P e fecham em "posteriores.”") viraram par-1..3 do art. 12 da alteradora; o motor acusou isso como rótulo divergente. (c) Há 6 páginas de ruído de impressão do SEI, uma delas dentro do art. 19. (d) Há 6 linhas "art. 43 desta Lei" em minúscula, por quebra de linha, dentro dos blocos (ver o achado A2). | F5 | 3 |
| 43581 | Lei 12.943/2021 | **trecho_nao_localizado** | Aspa extraviada na fonte: "V – … 15 (quinze) anos.”" e, na linha seguinte, "......” (NR)". O bloco fecha na 1ª aspa e a linha de reticências sobra, colada à introdução do art. 3º. Hist. 42648: inc. V aplicado certo. | F5 | 1/2 (R-D5) |
| 50186 | Lei 14.248/2025 | promulgação parcial, **fecho_com_texto_demais** | O fecho é só o carimbo de assinatura eletrônica, mas o OCR põe sujeira antes ("\| , “4 Documento assinado eletronicamente…", "sell o 06/06/2025…"), e a regex do carimbo exige o início da linha. | F6 | 1 (R-D6) |
| 50178 | Lei 14.240/2025 | promulgação parcial, **fecho_com_texto_demais** | Idem ("ss \| \| Documento assinado…"). | F6 | 1 |
| 50124 | Lei 14.221/2025 | **fecho_com_texto_demais** | Idem ("' n “4 Documento assinado…"). | F6 | 1 |
| 50213 | Lei 14.197/2025 | **fecho_com_texto_demais** | Idem ("é "4 Documento assinado…"). | F6 | 1 |
| 40148 | LC 767/2015 | **fecho_com_texto_demais** | Anexo legítimo com cabeçalho em caixa mista: a linha "Anexo 2" e o regime urbanístico (densidades, atividades, índices). O corpo cita: "conforme o Anexo 2 desta Lei Complementar". A regex de anexo só aceita "ANEXO". | F7 | 1 (R-D7) |
| 36255 | LC 626/2009 | **fecho_com_texto_demais** | Anexos legítimos: "Anexo 1 à Lei Complementar nº 626." (figuras), "Anexo 2 à Lei…" (tabela de vias da rede cicloviária), Anexos 3 a 5. O corpo cita os Anexos 1, 2 e 4. **Contradiz a decisão 40**, que descreve a 36255 como "quadro … sem cabeçalho de anexo": o cabeçalho existe, só não está em maiúsculas. | F7 | 1 (R-D7) |
| 51485 | LC 1.075/2026 | promulgação parcial, **fecho_com_texto_demais**, rótulo, **bloco_sem_dono** | O arquivo "…atualizada_ate_24.09.2026.pdf" traz a promulgação parcial (art. 185, § 3º, de 23/09/2026) e, depois do fecho dela, **a LC 1.075 inteira** (213 mil caracteres no fecho). Os 2 blocos "sem dono" são alteradoras dentro do Plano Diretor. O fragmento sai com o rótulo "Art. 1º" por posição, onde está escrito "Art. 185." (decisão 27; o rótulo é acusado). | F8 | 3 |
| 50876 | Lei 14.481/2026 | promulgação parcial, **bloco_sem_dono** | Dois documentos no arquivo "…original__derrubada_de_veto.pdf": (1) a promulgação pela Câmara, em 17/06/2026, do art. 1º (veto derrubado: incs. III e IV do art. 3º da Lei 13.396); (2) a lei sancionada em 14/01/2026 (art. 1º VETADO, **art. 2º altera o art. 4º da Lei 13.396**, art. 3º vigência). **Efeito: o hist. 45738 grava os incs. III e IV do art. 3º com a data de 14/01/2026 (entraram em 17/06/2026) e não tem a alteração do art. 4º, com `naoAplicadas` vazio. É erro silencioso.** | F8 | 3 |
| 50841 | Lei 14.456/2026 | **fecho_com_texto_demais** | Arquivo "merged…": a lei sancionada (arts. 5º e 6º VETADO) e, depois do fecho, a promulgação parcial da Câmara (jun/2026) dos arts. 5º e 6º, com veto derrubado. Sem o 2º documento, a consulta mostraria VETADO num texto que vigora. A reprovação está correta. | F8 | 3 |
| 42122 | LC 853/2019 | **tabela_no_corpo** | Tabela legítima: o art. 3º "Ficam definidos os Regimes Urbanísticos … que passam a constar no Anexo 1.2 da LC 434 … conforme segue:" e depois o quadro MZ/UEU/Subunidade/densidade… (2 linhas de dados). **Altera o anexo de outra lei.** | F9 | 3 |
| 40350 | LC 780/2015 | **tabela_no_corpo** | Tabela legítima: o art. 2º "Fica definido … o regime seguinte urbanístico: I – Densidade Bruta:" e depois o quadro de densidades. Regime de subunidades da LC 434 (Anexo 1.2), sem citar o anexo. | F9 | 3 |
| 38364 | LC 701/2012 | **tabela_no_corpo** | Tabela legítima: o art. 122 "ficam extintos todos os cargos … assim descritos:" e depois o quadro de classe, código, referências e nº de cargos. É conteúdo próprio da lei (não altera anexo). | F9 | 3 |
| 38309 | LC 698/2012 | **tabela_no_corpo** | Tabela legítima: o art. 2º "Ficam criadas, no Anexo 1.2 da LC 434 … as seguintes Subunidades … regimes urbanísticos:" e 2 quadros. Altera o anexo de outra lei. | F9 | 3 |
| 37422 | LC 677/2011 | **tabela_no_corpo**, rótulo | Tabela legítima: o art. 2º "Fica criada, na letra a do Anexo I da Lei nº 6.309 … a seguinte classe de cargos:" e o quadro ESM-1.01.ESM. Altera o anexo de outra lei. O rótulo divergente é outro ponto (art. 26: "6. A GIM…"). | F9 | 3 |
| 42298 | Lei 12.627/2019 (LDO 2020) | **endereco_repetido** | O cabeçalho "ANEXO II – DE METAS FISCAIS" se repete em cada demonstrativo (I a X) e vira 10 anexos "ANEXO II". É um anexo só, com 10 seções. | F10 | 1/3 (orçamentária, decisão 41) |
| 41789 | Lei 12.457/2018 (LDO 2019) | **endereco_repetido** | Idem. | F10 | 1/3 |
| 40134 | LC 766/2015 | **bloco_sem_fechamento** | Defeito de extração: o bloco do art. 10 termina em "§ 2º A parcela Δ" e o texto depois do "Δ" não está no `.txt` (não conferi o PDF: `dados/_bruto` não está no contêiner). **E há um bug do core no art. 4º:** a linha "art. 5º desta Lei Complementar,respeitados…", que é quebra de linha, abre um falso "Art. 5º" no bloco, e o art. 11 da LC 703 **é substituído só pela 2ª metade**. Hist. 38523, estado final do art-11: "desta Lei Complementar,respeitados o critério…". Erro silencioso. | F11 | 4 (+ bug A2) |
| 41179 | LC 813/2017 | cabeçalho, sem fecho, **bloco_sem_fechamento** | OCR: a fronteira está certa, mas o bloco engole a linha-lixo "CRMCL CRECI PLC UNE SL LESSONS…" (onde estaria o ” (NR)). **O hist. 27882 (LC 332) grava esse lixo no texto vigente do art. 5º.** | F11 | 4 |
| 38297 | EC 35/2012 | **bloco_sem_fechamento** | OCR: idem, linha "CO COL CL LOL LDO LOCO…" no bloco. **O hist. 25277 (Lei Orgânica) grava o lixo no texto vigente do art. 61.** | F11 | 4 |
| 36841 | LC 646/2010 | 7 motivos (todos do recorte) | O arquivo é a página de republicação do DOPA, em 3 colunas, e a extração intercala as colunas ("…na formula-Lei Complementar, integrado à Região…"). **O hist. 30209 (LC 434, PDDUA) aplica 6 comandos com o texto intercalado nos incs. I, IV, VII a X do art. 1º, com `naoAplicadas` vazio.** | F11 | 4 |
| 41347 | LC 818/2017 | sem fecho, **alteracao_sem_aspas_nao_delimitada** | OCR perdeu o bloco inteiro: "…conforme segue:" e, em seguida, "Art. 2º Esta Lei Complementar entra em vigor…". A al. d não está no texto. A decisão 10 funcionou. | F11 | 4 |
| 42380 | Lei 12.655/2019 (LOA 2020) | 6 motivos | Digitalização com OCR: a promulgação parcial (veto derrubado) traz tabelas giradas, que viram centenas de linhas-lixo. É orçamentária (decisão 41). | F11 | 4 |
| 44305 | EC 43/2017 | cabeçalho, sem fecho, rótulo, **bloco_sem_dono** | Camada de texto ruim ("o" do "º" numa linha própria, "MAJO"). Já é a decisão 32. | F11 | 4 |
| 44307 | EC 42/2016 | cabeçalho, **texto_fora**, **trecho_nao_localizado**, rótulo, **bloco_sem_dono** | Idem ("Art. I", "§ I"). Decisão 32. | F11 | 4 |
| 37090 | LC 663/2010 | **fecho_com_texto_demais**, **endereco_repetido**, rótulo | OCR ruim. Decisão 32. | F11 | 4 |
| 36190 | LC 624/2009 | sem fecho, **texto_fora**, **trecho_nao_localizado** | OCR: a lista de croquis do anexo vem intercalada com o art. 3º; páginas fora de ordem. | F11 | 4 |

## 2. Famílias de causa (soma = 42)

| Família | Normas | n | Classe |
|---|---|---|---|
| F1 — bloco sem aspa de fechamento, fronteira inferida **certa** (R2); 3 terminam em dispositivo "VETADO." | 51463, 50149, 42216, 39258, 38051, 37352, 39825 | 7 | 2 (1 com R-D1, se o mantenedor aceitar) |
| F2 — cabeçalho com reticências sem aspa de abertura (R4, decisão 11), **certo** | 48437, 46278, 48226 | 3 | 2 (idem) |
| F3 — cabeçalho "Art. N-L." sem reticências e sem aspa de abertura, **não delimitado** (R5) | 46770, 43376 | 2 | 2 (R-D3) |
| F4 — ruído de impressão do SEI colado ao texto | 42887, 51452 | 2 | 1 (R-D4) |
| F5 — aspa extraviada na fonte | 46403, 43581 | 2 | 3 / 1-2 |
| F6 — carimbo eletrônico com sujeira de OCR antes | 50186, 50178, 50124, 50213 | 4 | 1 (R-D6) |
| F7 — cabeçalho de anexo em caixa mista | 40148, 36255 | 2 | 1 (R-D7) |
| F8 — dois documentos no mesmo arquivo (promulgação parcial + lei sancionada) | 51485, 50876, 50841 | 3 | 3 |
| F9 — tabela legítima no articulado (3 alteram anexo de outra lei) | 42122, 40350, 38364, 38309, 37422 | 5 | 3 (decisões 39/42) |
| F10 — cabeçalho de anexo de LDO repetido por demonstrativo | 42298, 41789 | 2 | 1 ou 3 (decisão 41) |
| F11 — defeito de fonte: OCR, extração, DOPA em colunas | 40134, 41179, 38297, 36841, 41347, 42380, 44305, 44307, 37090, 36190 | 10 | 4 |
| **Total** | | **42** | |

Por classe: **1** = 8 (F4 2, F6 4, F7 2) + F10 2 (se a decisão for regra) + 43581 · **2** = 12 (F1, F2, F3) · **3** = 9 (F5 46403, F8 3, F9 5) · **4** = 10.

## 3. Regras propostas (famílias de classe 1 e 2)

### R-D1 — segundo sinal da fronteira inferida: "o que a introdução cita × o que está no bloco" (F1, F2; serve também a F3)
- **Gatilho:** bloco com `sem_fecho` ou `sem_abertura`. Liste os dispositivos citados na introdução ("incs. II, III e IV do § 4º do art. 89-A"; "o caput do § 1º … §§ 18 e 19, todos no art. 5º"; "arts. 29-A e 29-B"; "Capítulo VIII … arts. 52-O a 52-R"). Compare com os rótulos de 1º nível do bloco, descontadas as linhas de reticências e o cabeçalho do artigo.
- **Conta como 2º sinal** quando: (a) todo dispositivo citado aparece no bloco; (b) o bloco não tem dispositivo **não citado**, salvo filhos de um dispositivo incluído por inteiro ("Fica incluído art. 3º-B" cobre os incisos e o parágrafo único dele); (c) a linha seguinte ao bloco é "Art. n+1" da alteradora, em sequência, e é introdução nova, vigência, revogação ou despesa.
- **Trava:** citação com intervalo que o motor não expande, "e alterações", ou citação incompleta = sem 2º sinal (continua "a revisar"). Bloco com linha-lixo de OCR (proporção baixa de letras ou palavras do dicionário; ex. 41179, 38297) = sem 2º sinal.
- **Risco de falso aceite:** a introdução cita exatamente o que está no bloco, mas o bloco engoliu um parágrafo da alteradora com o mesmo rótulo (ex.: a alteradora tem "Parágrafo único" logo depois do bloco que inclui um parágrafo único). A condição (c) só olha "Art."; é preciso exigir também que a linha **logo após** o último dispositivo do bloco seja "Art. n+1" (e não "Parágrafo único"/"§").
- **Teste real:** positivos 51463 (2 blocos), 50149, 42216, 39258, 38051, 37352, 39825, 48437, 46278, 48226, 46770, 43376 (conferi a olho: todos batem). Negativos: 41179 e 38297 (lixo de OCR no bloco), 40134 (bloco truncado: o "§ 2º" está lá, mas o texto não).
- **Impacto:** 10 normas saem da fila **se** o mantenedor aceitar que fronteira inferida + 2º sinal deixa de ser "adivinhada" (decisão 9 hoje proíbe: pergunta P1). Sem isso, a regra serve de proposta para o revisor (classe 2).
- **Medir:** rodar sobre todos os blocos `sem_fecho/sem_abertura` do acervo (recentes e antigas), contar 2º sinal sim/não e conferir a olho uma amostra dos "sim" e todos os "não".

### R-D3 — cabeçalho "Art. N-L." sem reticências e sem aspa (F3), versão estrita do R5
- **Gatilho (todas as condições):** (1) a introdução forte cita "art. N-L" (com **letra de sufixo**) ou "art. N" de outra lei; (2) a **1ª linha não vazia** depois da introdução é "Art. N-L." com o mesmo rótulo; (3) **nenhuma aspa** entre a introdução e o cabeçalho; (4) fecha com `”`/`" (NR)` antes do "Art. n+1" da alteradora, e n+1 é o próximo número da própria alteradora (não pode ser N-L).
- **Trava:** sem letra de sufixo, só quando N ≠ n+1 e N > n+1 + 5 (evita a ambiguidade do sintético do teste). Cabeçalho com aspa ou reticências antes ("“......" e depois "Art. 49.", caso 37945) **não** entra (condição 3).
- **Efeito:** delimita com confiança média, sai "a revisar" com `aspa_de_abertura_ausente` (igual ao R4/decisão 11). Ganho: a lei-alvo deixa de virar dispositivo da alteradora, e o histórico passa a receber o comando.
- **Risco:** artigo da alteradora com número igual ao citado (só sem sufixo; a trava cobre).
- **Teste real:** positivos 46770 (art. 13-A) e 43376 (art. 37-A); negativo 37945 (LC 685/2011, que já está em `teste_blocos_sem_aspas.mjs`).
- **Impacto:** 2 normas recentes ganham a estrutura certa. Corrige o histórico 44210 (13-A ausente sem aviso) e o 32105.
- **É mudança de decisão** (a decisão 11 diz "cabeçalho sem pontos só sinaliza"): pergunta P2.

### R-D4 — ruído de impressão do SEI sai do texto LIDO (F4; extensão da decisão 22)
- **Gatilho (linha inteira, depois do `trim`):**
  - `^https://sei\.camarapoa\.rs\.gov\.br/sei/controlador\.php\?acao=documento_imprimir_web\S*\s+\d+/\d+$` (169 de 169 ocorrências no acervo casam);
  - `^\d{2}/\d{2}/\d{4}(?:,?\s*\d{2}:\d{2})?\s+SEI/CMPA - \d+ - .{1,40}$` (169 de 169 com a vírgula opcional);
  - `^(?:Lei|Lei Complementar|Emenda|Resolução|Decreto Legislativo)[^()]{0,20}\(CMPA\)\s+\d{6,8}\s+SEI\s+[\d./-]+\s*/\s*pg\.\s*\d+$` (33 de 33).
- **Trava:** só a linha inteira; o `.txt` guardado não muda (como na decisão 22); nada dentro de linha com outro texto. O carimbo do fecho ("Documento assinado…") continua como está (decisão 40).
- **Risco de falso aceite:** praticamente nenhum. São linhas de máquina, sem texto de lei. O risco é o contrário: hoje esse ruído está **dentro do texto de dispositivos de normas aceitas** (achado A1).
- **Teste real:** 42887 e 51452 (saem `trecho_nao_localizado`/`texto_fora`); 42757 (aceita, art. 3º limpo); 49760 (aceita, art. 3º, inc. V, rodapé "Lei (CMPA) 0840140 SEI … / pg. 1").
- **Impacto:** 2 normas da fila, 35 aceitas com texto corrigido (29 com a URL ou a data e 6 com o rodapé "pg."), mais 46403 (parcial).
- **Medir:** contar antes e depois os dispositivos de aceitas que contêm `sei.camarapoa`/`SEI/CMPA`/`(CMPA) N SEI` (hoje 35), e comparar a fila.

### R-D5 — linha "......” (NR)" logo depois de um bloco já fechado (43581)
- **Gatilho:** bloco fechado numa linha com aspa; a próxima linha não vazia é **só** reticências + `”` + `(NR)` opcional; a seguinte é "Art. n+1" da alteradora. Então essa linha pertence ao bloco (omissão final).
- **Trava:** só reticências (nenhuma letra) e só imediatamente após o bloco.
- **Risco:** nenhum para o texto da lei-alvo: a linha só tem pontos.
- **Teste:** 43581 (sai `trecho_nao_localizado`; o inc. V já estava certo no hist. 42648). Medir no acervo quantas introduções terminam com "…” (NR)".

### R-D6 — carimbo eletrônico com sujeira de OCR antes (F6; ajuste da decisão 40)
- **Gatilho:** em `tamanhoDoFechoSemCarimbo`, aceitar "Documento assinado eletronicamente por" e "A autenticidade deste documento" **em qualquer ponto da linha** (hoje: só no início).
- **Trava:** o corte continua no 1º carimbo, e o que vem antes dele continua contando para os 600 caracteres.
- **Risco:** um texto de lei com essa frase no meio do fecho. Não achei nenhum no acervo.
- **Medido no acervo inteiro (50 normas com `fecho_com_texto_demais`):** muda exatamente 4 (50124, 50213, 50178, 50186; o carimbo aparece aos 53–54 caracteres do fecho). 50841 continua reprovada (2.699 caracteres antes do carimbo: é o 2º documento). 50124 e 50213 ficam sem nenhum motivo; 50178 e 50186 continuam com `promulgacao_parcial`.

### R-D7 — cabeçalho de anexo em caixa mista (F7; ajuste de `dividirFechoEAnexos`)
- **Gatilho:** além de `^\s*ANEXO\b…`, aceitar `^\s*Anexo\s+(?:[IVXLCDM]+|\d+(?:\.\d+)*|[ÚU]nico)\b(?:\s+(?:à|a|da)\s+Lei\b.*)?\.?$`, linha ≤ 140 caracteres, **no fecho**.
- **Trava:** (1) o fecho antes do 1º cabeçalho tem ≤ 600 caracteres (senão continua `fecho_com_texto_demais`); (2) o articulado cita "Anexo N" com o mesmo N pelo menos uma vez.
- **Risco:** uma linha de quadro começando por "Anexo 3 …" no meio de um anexo vira um novo anexo. É só divisão do texto preservado: não perde texto e não cria dispositivo de lei.
- **Medido no acervo:** 5 normas com `fecho_com_texto_demais` têm essa linha; só 2 passam na trava (1): 36255 (257 caracteres antes) e 40148 (159). Ficam de fora 21280 (754), 22961 (8.494) e 51485 (33.943). Ambas ficariam aceitas com `anexo_preservado_nao_interpretado` (decisão 38).

### R-D8 — cabeçalho de anexo repetido (F10; LDO)
- **Gatilho:** dois ou mais cabeçalhos **seguidos**, com o mesmo rótulo e o mesmo título (traço normalizado, ex.: "ANEXO II – DE METAS FISCAIS"), sem outro anexo no meio. Fica um nó só, com o texto bruto inteiro.
- **Trava:** títulos diferentes, ou outro anexo no meio, continuam como `endereco_repetido`.
- **Teste:** 42298 e 41789. Impacto: 2 recentes, ambas LDO. Como orçamentária é exceção (decisão 41), vai como pergunta (P6).

### F1/F2/F3 sem R-D1: o que a IA fora do pipeline confere
Para cada bloco inferido, a IA recebe a introdução, o bloco e as 3 linhas seguintes, e responde: (i) início e fim certos? (ii) os dispositivos citados batem com os do bloco? (iii) há lixo de OCR ou texto truncado ("Δ", palavra cortada)? (iv) nas alteradoras com lei-alvo na base, o "depois" do histórico é o texto do bloco? Nas 12 que conferi, as respostas seriam "certo" em todas. **Mas a IA erraria pelo menos na 40134, se não fosse instruída a desconfiar de fim de bloco no meio de frase ("A parcela Δ")**: inclua essa checagem. Amostragem humana sugerida: todos os blocos com confiança "baixa" sem glifo, mais 1 em cada 5 dos "média".

## 4. Perguntas ao mantenedor

**P1 — Fronteira inferida com segundo sinal pode ser aceita? (decisão 9)**
Evidência: 12 fronteiras inferidas (10 normas: F1 + F2), todas certas e todas com o "citado na introdução = dispositivos no bloco". Exemplo: 42216, art. 2º, cita "§§ 1º, 3º, 8º, 10, 12, 16, 17 (I, II, III, V, VI), 18 e 19" e o bloco tem exatamente esses, terminando em "§ 19. VETADO.".
- (a) Manter a decisão 9: continuam "a revisar". O revisor confere 10 normas, com a IA propondo. Custo: 10 decisões humanas.
- (b) Com o 2º sinal (R-D1), aceitar **com aviso** `fronteira_inferida_conferida` e selo no painel. Risco: o caso de "parágrafo único" logo depois do bloco (trava prevista).
- (c) Aceitar só quando o bloco termina em "VETADO." (3 normas): o veto derrubou a aspa, e isso é previsível.
- Recomendação: **(b)**, com amostragem humana das primeiras 20 aceitas por R-D1.

**P2 — Abrir exceção estrita à decisão 11 para "Art. N-L." sem reticências (R-D3)?**
Evidência: 46770 (art. 13-A) e 43376 (art. 37-A). Hoje a lei-alvo vira dispositivo da alteradora e **o histórico da lei-alvo fica sem o 13-A, sem aviso**. O falso positivo que motivou a decisão 11 (37945) tem aspa e reticências antes do cabeçalho e não seria tocado.
- (a) Manter: "só sinaliza". O histórico continua sem o comando, então é preciso ao menos marcar `aConferir` (ver P5).
- (b) Delimitar com R-D3 (média, "a revisar").
- Recomendação: (b).

**P3 — Ruído de impressão do SEI: ampliar a decisão 22? (R-D4)**
Evidência: 72 textos têm a URL de impressão do SEI; 35 normas **aceitas** carregam esse ruído dentro do texto de um dispositivo (ex.: 42757, art. 3º: "…desaparecimento de uma pessoa idosa. https://sei.camarapoa.rs.gov.br/… 1/2 29/09/2020 SEI/CMPA - 0167193 - Lei (CMPA)"). As 3 regexes casam 100% das ocorrências.
- (a) Ampliar a decisão 22 com as 3 regexes estritas (linha inteira). O texto lido muda em 37 normas e o `.txt` não muda.
- (b) Só sinalizar (novo motivo): as 35 aceitas iriam para a fila.
- Recomendação: (a). É ruído de máquina, como o número de página. Pela decisão 7, a mudança reabre só as normas cujo veredito mudar.

**P4 — Arquivo com dois documentos (promulgação parcial + lei sancionada), F8**
Evidência: 50876 (a promulgação primeiro, a lei depois: o hist. 45738 perdeu a alteração do art. 4º e datou os incs. III e IV do art. 3º em 14/01, quando são de 17/06/2026), 50841 (a lei primeiro: a consulta mostraria arts. 5º e 6º VETADO, mas vigoram desde jun/2026), 51485 (o fragmento e depois a LC 1.075 inteira). Hoje nenhuma das três está aceita, porque o fecho de 600 caracteres segura. Medido: nenhuma aceita tem um 2º "Faço saber/sanciono/promulgo" no fecho.
- (a) Defeito de fonte: só registrar, e o histórico **não** aplica a alteradora (ver P5).
- (b) Dividir o arquivo em dois documentos quando, depois do fecho, vier uma 2ª epígrafe do **mesmo** número + "Faço saber". Cada um vira uma Visão/Versão com a sua data (a promulgação parcial tem a data do fecho). Isso esbarra na modelagem `veto_derrubado`/`visoes[]`, que não foi decidida.
- Recomendação: (a) já; (b) numa rodada própria com estes 3 exemplos reais.

**P5 — O histórico pode aplicar uma alteradora que está "a revisar"?**
Evidência (todas com `naoAplicadas` vazio, ou seja, sem aviso): LO art. 61 com lixo de OCR (EC 35, id 38297); LC 332, art. 5º, com lixo (41179); LC 434, art. 1º, com colunas intercaladas (LC 646, id 36841); Lei 13.219 sem o art. 13-A (46770); Lei 13.396 sem a alteração do art. 4º e com data errada (50876). Em `gerar-historico.mjs`, a situação da estruturação só entra em `baseConferida` da **lei-base**.
- (a) Aplicar só alteradoras aceitas; as demais vão para `naoAplicadas` com o motivo `alteradora_a_revisar` e os dispositivos citados para `aConferir`.
- (b) Aplicar todas, mas marcar `aConferir` em todo dispositivo tocado por alteradora "a revisar".
- (c) Manter como está.
- Recomendação: **(b)** (não perde o que está certo, como 51463, e avisa). (a) se o mantenedor preferir o mais conservador.

**P6 — Tabela no articulado que altera anexo de outra lei (F9; decisões 39, 42)**
Evidência: 42122, 38309 e 37422 alteram o "Anexo 1.2 da LC 434" ou o "Anexo I da Lei 6.309"; 40350 e 38364 trazem tabela própria. Hoje a tabela fica, sem perda, dentro do texto do dispositivo que a introduz (a conservação passa).
- (a) Manter "a revisar" até o nó `tabela` (depois da Fase 0).
- (b) Tratar como a decisão 38 trata o anexo: "tabela preservada no texto, não interpretada", aceita com aviso; a que cita "Anexo X da Lei Y" ganha também o aviso de anexo alterado (decisão 37).
- Recomendação: (a) para as 2 de conteúdo próprio e (b) para as 3 que alteram anexo alheio (a tabela é comando sobre o anexo, que o motor já não aplica, decisão 37). **A decisão é sua**, porque mexe na 39.
- Junto: o cabeçalho de anexo repetido da LDO (R-D8) entra como regra, ou fica para o tratamento especial das orçamentárias (decisão 41)?

## 5. Achados inesperados

**A1 — Ruído de impressão do SEI dentro de dispositivos de normas ACEITAS (35 normas).** Lista (URL ou data): 42643, 42757, 42803, 42830, 42832, 42888, 42889, 42932, 43086, 43089, 43122, 43767, 44857, 45585, 45746, 45997, 46115, 46116, 46146, 46147, 46963, 47025, 47227, 47614, 47979, 48206, 50729, 50930, 51395. Rodapé "pg.": 49760, 49762, 49763, 49765, 51450, 51451. Também nesses PDFs: ligaduras perdidas na extração ("educa vas", "a vidades", "ﬁnalidade" em 42757), outro defeito silencioso das impressões do SEI.

**A2 — Bug do core: `reArtX` (norma-core.js, linha ~1014) tem a flag `/i`.** Uma linha de bloco que começa por "art. N" minúsculo (quebra de linha do PDF: "…conforme disposto no / art. 121 da LC 133") abre um falso artigo e parte o texto. O `reArt` do corpo já foi corrigido para "A" maiúsculo (CLAUDE.md), mas o do bloco não. Medido: 15 normas com essa linha em bloco, **10 delas aceitas** (29717, 36373, 37562, 40426, 40683, 41956, 41958, 43567, 44301, 45422). Efeitos já gravados no histórico:
- **Lei Orgânica, art. 116-A, § 2º** (EC 46/2019, id 44301, aceita): o texto vigente termina em "…para os fins do inc. III do § 2º do" (falta "art. 198 da Constituição Federal…");
- LC 703/2012, art. 11 (pela LC 766, id 40134): substituído só pela 2ª metade ("desta Lei Complementar,respeitados…");
- hist. 36316, art. 24-A: termina em "…não cumprirem o d ispo sto no";
- hist. 38249, art. 69-A, par. único, inc. I: termina em "(caput do".
Os três últimos aparecem em `naoAplicadas` como "aplicada_em_parte", com uma explicação enganosa ("já existe artigo…"), e o texto truncado fica como vigente. Correção de uma linha (tirar o `/i` do "Art", mantendo `Artigo`/`ARTIGO` explícitos). Pela regra 5, o teste novo usa 44301 e 40134.

**A3 — O histórico aplica alteradoras "a revisar" sem aviso** (P5): 38297, 41179, 36841, 46770, 50876.

**A4 — A decisão 40 cita a 36255 como "quadro sem cabeçalho de anexo"**, mas o arquivo tem "Anexo 1 à Lei Complementar nº 626." … "Anexo 5 …" (em caixa mista). A causa real é a regex só em maiúsculas (R-D7).

**A5 — 42216 (LC 859/2019):** os arts. 1º e 2º saem `nao_classificado`. A introdução mista com "todos no art. 5º" não gera comando nenhum. Fica `semEfeito`, sem aviso por artigo. É lacuna do extrator, que o agente F deve ver.

**A6 — 51463:** a classificação dá `insert_node` onde o texto diz "Ficam alterados os incs. II, III e IV do § 1º do art. 29-D" (sem `leiBaseIndex` útil, porque a base original não tem o 29-D). O histórico recusa e avisa; não é silencioso.

**A7 — 37352:** a linha de reticências com espaço interno ("...... .......") não é reconhecida como omissão e gera um comando de inserção espúrio, com texto de pontos. O resultado final fica certo porque o 2º comando sobrescreve. Vale endurecer `reOmissao` para aceitar espaço entre os pontos.

**A8 — `fronteiras[].linhaIni/linhaFim`** nos `n/<id>.json` estão em coordenadas do texto preparado antes do corte do início (51463: gravado 485, a linha real em `texto` é 481). Os `ini/fim` em caracteres estão certos, e `docs/revisao.html` não usa as linhas. Só confunde quem lê o JSON.

## Confiança do levantamento
Conferi **todas as 42 normas, uma a uma**: a fronteira de cada bloco inferido no texto de origem, o conteúdo do fecho e da tabela, e o ruído. O efeito no histórico eu conferi em todas as que têm lei-alvo com histórico (51463, 40134, 41179, 39258, 38297, 38051, 37352, 48437, 48226, 46770, 43376, 50876, 43581, 36841, 44305, 44307). Nas demais, a lei-alvo está fora da base. As medições no acervo inteiro (A1, A2, R-D4, R-D6, R-D7, nenhuma aceita com 2º documento) são contagens por script sobre `dados/estruturado` e `dados/textos`. Os efeitos de A2 no histórico conferi em 4 leis (25277, 38523, 36316, 38249). Não conferi os PDFs originais (`dados/_bruto` não está no contêiner), então a truncagem "Δ" da 40134 fica como suspeita de extração, não confirmada no PDF.
