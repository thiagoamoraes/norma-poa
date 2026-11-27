<!-- Relatório de agente de pesquisa (somente leitura), 27/11/2026. INSUMO, não autoridade: afirmações que sustentam decisão são reconferidas (regra 12c). Ver PLANO-REVISOES.md. -->
# E — Normas ANTIGAS (antes de 03/02/2009) em revisão

Levantamento somente leitura, 27/11/2026. Fontes: `dados/estruturado/sapl/*.json` (`verificacao`), `dados/textos/sapl/*.txt` e `_indice.jsonl`, catálogo `dados/catalogo/sapl/tipo-*.jsonl` (última ocorrência), `vinculos.jsonl`, `dados/historico/sapl/*.json`. Época por `epocaDaNorma` (importada de `ingestao/estrutura.mjs`; nenhuma norma "indefinida"). Scripts temporários em `scratchpad/levantamento/e/`.

## 0. Números conferidos

- Estruturadas: 3.307. **Antigas: 498; em revisão: 295** (bate com o PLANO-REVISOES); aceitas: 203.
- **Tipos no recorte:** 269 LCs, 18 Emendas à LO, 8 Leis Orgânicas. **Não há nenhuma lei ordinária antiga estruturada** (o catálogo tem 11.086 leis ordinárias antigas, nenhuma com texto estruturado). Portanto **"denominação de logradouro / utilidade pública" praticamente não existe neste recorte**: o efeito concreto aqui é outro (regime urbanístico de uma UTP do PDDU de 1979, autorização de venda, reajuste de URP; ver §2.3).
- **LC 7/1973 (id 17478, Código Tributário) não está no recorte nem no acervo estruturado:** o arquivo da fonte é `.doc` (`extracao.situacao: formato_sem_extracao`); 119 vínculos "Altera" apontam para ela. Já registrado no ROTEIRO (linha 88).

### 0.1 Por motivo × década (normas; uma norma tem vários motivos)

| motivo | 1890 | 1920 | 1930 | 1940 | 1950 | 1960 | 1970 | 1980 | 1990 | 2000 | total |
|---|---|---|---|---|---|---|---|---|---|---|---|
| cabecalho_nao_reconhecido | 1 | 1 | 1 | 1 | 1 | 1 | 14 | 83 | 104 | 5 | 212 |
| rotulo_nao_confere_com_a_origem | 1 | 1 | 1 | 1 | 1 | 1 | 4 | 70 | 99 | 17 | 196 |
| sem_fecho | 1 | 1 | 1 | 1 | 1 | 1 | 14 | 46 | 59 | 6 | 131 |
| trecho_nao_localizado_na_origem | 1 | 1 | 1 | 1 | 1 | 1 | 3 | 14 | 26 | 5 | 54 |
| texto_fora_da_arvore | 0 | 0 | 1 | 1 | 1 | 1 | 2 | 11 | 23 | 5 | 45 |
| bloco_de_alteracao_sem_dono | 0 | 0 | 1 | 0 | 0 | 1 | 1 | 12 | 26 | 4 | 45 |
| fecho_com_texto_demais | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 18 | 19 | 2 | 40 |
| tabela_no_corpo | 1 | 1 | 1 | 1 | 1 | 1 | 0 | 13 | 15 | 0 | 34 |
| sem_artigos | 0 | 0 | 0 | 0 | 0 | 0 | 11 | 10 | 5 | 4 | 30 |
| bloco_sem_fechamento_de_aspas | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 12 | 5 | 17 |
| promulgacao_parcial | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 8 | 4 | 13 |
| tipo_sem_suporte | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 0 | 1 | 0 | 8 |
| alteracao_sem_aspas_nao_delimitada | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 2 | 0 | 1 | 3 |
| data_diverge_do_catalogo | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 3 | 3 |
| endereco_repetido | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 1 | 0 | 2 |
| **normas em revisão** | 1 | 1 | 1 | 1 | 1 | 1 | 16 | 91 | 151 | 31 | **295** |
| (aceitas, para comparação) | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 7 | 54 | 141 | 203 |

Nº de motivos por norma: 1 → 60 · 2 → 70 · 3 → 100 · 4+ → 65. A taxa de aceitação antes de 1990 é de 8/115 (7%); nos anos 2000, 141/172 (82%). **A década decide mais do que o motivo.**

### 0.2 Forma do texto (extração)

| método | normas | observação |
|---|---|---|
| `pdftotext` | 173 | 145 delas são **digitalizações com camada de texto feita pela própria fonte** (autógrafo datilografado da Câmara ou da Prefeitura) — o coletor NÃO as marca `texto_de_ocr`, mas a qualidade é de OCR antigo (ver §1, família 7) |
| `ocr` (OCR do coletor; aviso `texto_de_ocr`) | 47 | decisão 32 |
| `html_sirel` | 40 | **23 com `extracao.situacao: texto_curto`**: o HTML da fonte (1.038 a 5.485 bytes) só tem o título repetido, ex. id 17547 (LC 10/1974): texto lido inteiro = `lc10` ×5 |
| `docx` | 35 | texto limpo |

Anexos: `tem_anexo` 8 (6 `anexo_preservado_nao_interpretado`, 2 `anexo_grafico_nao_lido`). **Arquivo só de anexo/imagem: nenhum caso no recorte** (não confundir com os 23 HTML vazios, que são defeito da fonte).

### 0.3 Quantas afetam texto vigente

| relação (vínculos da fonte + históricos gerados) | normas |
|---|---|
| é **lei-base** com alteradoras (histórico em `dados/historico/sapl/` ou vínculo "Altera" passivo) | 93 (90 com arquivo de histórico) |
| é **alteradora** de alguma lei (aparece em `versoes`/`naoAplicadas` de algum histórico, ou vínculo ativo Altera/Revoga parcialmente) | 181 (157 aparecem em histórico: 51 como aplicadas, 119 como não aplicadas — 89 `comando_nao_reconhecido`, 34 `comando_recusado`, 11 `aplicada_em_parte`) |
| as duas coisas | 44 |
| **nenhuma relação** (não é base nem alteradora) | **65** (61 LCs/ELOs + 4 LOs históricas) |
| revogadas por inteiro (vínculo R/T) | 69 |

No acervo antigo inteiro (498): 124 com arquivo de histórico (34 delas aceitas), 116 com vínculo "Altera" passivo.

## 1. Famílias de causa (somam 295)

Atribuição: as famílias 1–3 e 4–5 são listas fechadas conferidas uma a uma; 6–8 por critério mecânico (`extracao.metodo`; para a 7, `pdftotext` com timbre/carimbo "PROC./PLCL/CÂMARA MUNICIPAL" nos primeiros 1.500 caracteres ou ≥ 1 caractere-lixo `~\{}|<>` por mil), com amostra conferida no texto (coluna "conf." da tabela final: 79 normas abertas e lidas).

| # | família | normas | classe | causa real (evidência) |
|---|---|---|---|---|
| 1 | **Fonte sem texto** (HTML do SIREL vazio) | 23 | 4 | 17547 LC 10/1974: texto inteiro `lc10\nlc10…` (25 bytes); 18490 LC 24/1976: `LC\nPrefeitura Municipal de Porto Alegre` ×4 + `<p class="MsoTitle" style="text-align: justi` (208 bytes; HTML bruto 4.605 bytes). 21 de 1974–1983 + 31822 e 33244 (2 bytes). O motor está certo: `cab + s/art + s/fecho` em todas. |
| 2 | **Texto-base é compilação feita pela fonte**, não o texto sancionado | 4 | 3 | 25277 LO 1/1990: l. 10 "Atualizada até Emenda n.º 48, de 05.05.2022"; 17878 LC 12/1975: l. 3 "(ALTERAÇÕESINSERIDAS NO TEXTO ATÉ A LC 702/12)" e l. 244 "Art. 31 … (acrescidopela LC 395/97, renumerando-se os demais)"; 30209 LC 434/1999: 595 anotações "(Incluído pela L.C. n° 646, de 22 de julho de 2010)"; 24099 LC 170/1987: "Redação alterada pela Lei Complementar nº 622/09". Os "-A" do compilado (Art. 19-A, 20-A, 37-A) desalinham a numeração por posição (decisão 27) e o histórico reaplica, por cima, alteradoras já incorporadas (achado A1). |
| 3 | **Lei Orgânica histórica** (Intendência 1892, 1928; PMPA 1936; LO 1948 e consolidações 1956, 1962, 1970; ELO 11/1970) | 8 | 4 | `tipo_sem_suporte` + digitalização. Superadas pela LO de 1990 (a fonte não tem vínculo de revogação delas — 8079, 9133, 16471 têm "histórico" gerado com 1, 10 e 6 alteradoras, todas não aplicadas ou quase). Valor só histórico. |
| 4 | **Registro sem a lei sancionada: só a promulgação parcial** | 5 | 4 | 32105 LC 478/2002 (DMPS/previdência, 17 alteradoras): o arquivo inteiro (22 linhas) é "…eu promulgo dispositivos da Lei Complementar n° 478…: IV - a filha solteira…"; por isso as 16 alteradoras são `comando_recusado`. Idem 31066 (LC 463/2001), 26315 (LC 268/1992), 32299 e 32300 (LC 482/2002, dois registros com o MESMO arquivo, sha igual). Não há outro registro com o número no catálogo. |
| 5 | **Registro próprio da promulgação parcial** (a sancionada está noutro registro) | 6 | 3 | 25305 (LC 203, parcial de 02/05/1990; sancionada = 25133, aceita), 27049 (LC 282, parcial de 22/06/1993: "eu promulgo dispositivos da Lei Complementar nº282, de 16 de outubro de 1992"; sancionada = 26729), 26402 (→ 26309), 29316 (→ 29259), 25208 (→ 25290) e 25553 (→ 25665). Nas duas últimas, o registro com a data da lei tem o arquivo da parcial e o "irmão" não tem texto estruturado: **conferir se os arquivos estão trocados**. É o caso que a CLAUDE.md já prevê (Visão; `veto_derrubado` sem modelagem decidida). |
| 6 | **Arquivo com dois documentos** (promulgação parcial seguida do autógrafo sancionado) | 6 | 3 | 28117 LC 350/1995: l. 14 "eu promulgo os seguintes dispositivos…", fecho da Presidência em 11/09/1995, e a partir da l. ~60 o texto sancionado ("Regula o art. 150 da Lei Orgânica…"). Idem 25132, 27406, 28080, 26196 e 26363 (estas duas: LC 258, mesmo arquivo, sha igual). |
| 7 | **Digitalização com camada de texto antiga da fonte** (autógrafo datilografado) | 136 | 4 (9 delas valem cotejo, §3) | O arquivo é o **autógrafo**, não a publicação: no topo vem timbre e carimbo ("PROC.N9 1893/84", "PLCL N90008/80"), **sem epígrafe numerada** (o número da LC era carimbado/manuscrito depois) → `cabecalho_nao_reconhecido` em 139 de 145 da família. O ordinal datilografado sai trocado: "Art. 19"/"Art. 12"/"Art. 10"/"Art. 3Q" no lugar de "Art. 1º" (21359: "Art19, Art29, Art39, Art49, Art59"; 26874: "Art. 12 - Fica modificada…", "Art. 22 - O Regime…"), e "Art. lº" com a letra l (22932, l. 17 "Art. lº - Fica instituida a Taxa de Coleta de Lixo"), que o leitor não reconhece como artigo e desloca a numeração ("Art. 1º" ↔ "Art2º"). Data do fecho manuscrita ilegível ("PORTO ALEGRE, 2 ~ de dezem"). Medido (todas as 196 com motivo de rótulo): em 36 normas a única divergência de rótulo é o ordinal lido como 9/2/0/Q (ou repetido, "Art. 111"); em 10, "Art. lº". **Não é técnica legislativa: é qualidade de OCR da fonte** (decisão 32 por analogia). |
| 8 | **OCR do coletor** (`texto_de_ocr`) | 44 | 4 | Mesmos sintomas da 7 ("Art19", "SECRETARIA DO GOVERNO MUNICIPAL PLCL. 0008/81" como epígrafe; fecho "PREFEITURA MUNICIPAL DE PORTO ALEGRE, OU de janeiro de 1982."). Inclui 15 Emendas à LO de 1977–2004. 25306 (LC 206/1990) é página do Diário Oficial com um Decreto colado ("Art. 3º - Este Decreto entrara"): arquivo misto. |
| 9 | **Texto limpo (DOCX/HTML/PDF digital): técnica antiga, erro de digitação da fonte ou leitura** | 63 | 3 | Técnica antiga confirmada: aspas abertas e nunca fechadas em cada bloco (28637 LC 385/1996: `"Art.98 - ...` … `"Art. 180 - …` sem ”; 12 normas da família com `bloco_sem_fechamento_de_aspas`); `§ 1º` sozinho (aviso `paragrafo_numerado_sem_irmao` em 10 do recorte); comando de alteração dentro de inciso da alteradora (32958 LC 501/2003, l. 301 "III – Acrescenta parágrafo único com a seguinte redação:"). Erro da fonte: 30950 epígrafe "LEI COMPLEMENTAR Nº 489, dt 07 de dexembro da 2000." (catálogo: 459); 35931 epígrafe "de 29 de dezembro de 2009" (catálogo: 2008); 34142 epígrafe e fecho "25 de janeiro de 2006" (catálogo: 26) — decisão 2. Duplicado: 23346 e 23347 ("LC 133" e "LC 133b") têm o MESMO texto (sha igual) — decisão 27, selo. Símbolo "®" no lugar de "º" em DOCX (30483 LC 445/2000: "® - O art. 7° da Lei Complementar n® 242"; 69 arquivos do acervo têm "®"). |
| | **total** | **295** | | classe 1: 0 · classe 2: 0 (ver §2) · classe 3: 79 · classe 4: 216 |

**Classe 1 e 2: nenhuma família inteira qualifica.** O que se aproxima está no §2, como proposta condicionada a decisão do mantenedor.

### 1.1 Leis de peso × efeito concreto

- **De peso (15 no recorte):** LO 1/1990 (25277); LC 12/1975 Código de Posturas (17878); LC 133/1985 Estatuto dos Funcionários (23346, + cópia 23347); LC 434/1999 PDDUA (30209; revogada pela LC 1.075/2026); LC 284/1992 Código de Edificações (26743); LC 170/1987 instalações hidrossanitárias (24099); LC 395/1996 Código Municipal de Saúde (28813); LC 478/2002 Previdência (32105, só parcial); LC 420/1998 Código de Proteção contra Incêndio (29512); LC 113/1984 Taxa de Coleta de Lixo (22932); LC 320/1994 denominação de logradouros (27569; é a do piloto); LC 352/1995 Assistência Social (28148); LC 534/2005 TART (34065, revogada); e duas revogadas: LC 43/1979 1º PDDU (20255) e LC 10/1974 Estatuto anterior (17547, sem texto).
- **Efeito concreto/esgotado:** 76 normas tratam de regime urbanístico de UTP/área funcional do 1º PDDU (LC 43/1979, revogado) — 58 delas sem relação com texto vigente (P5/P6); 13 são autorizações (venda, concessão, office boy na LC 101/1984); reajuste de URP/UFM etc.

## 2. Regras propostas (nenhuma é classe 1 sem decisão do mantenedor)

### R1. Base declarada compilada pela fonte ⇒ não reconstruir linha do tempo anterior ao marco
- **Gatilho:** no TEXTO lido (não na ementa do catálogo — a ementa da LC 133 diz "Texto atualizado até a LC 677/2011", mas o arquivo é o autógrafo de 1985), `/(atualizad[ao]|altera[çc][õo]es\s*inseridas\s*no\s*texto)\s+at[ée]\s+(a\s+)?(Emenda|L\.?\s*C\.?|Lei Complementar)\s*n?\.?[º°o]?\s*([\d.]+)/i` nas primeiras 30 linhas, ou ≥ 20 anotações `\((Inclu[íi]d|Reda[çc][ãa]o dada|Revogad|Acrescid)[oa]?\s+pel[ao]`.
- **Efeito:** o histórico marca a versão 0 como "texto compilado pela fonte até X", não como "promulgação original"; alteradoras com data ≤ marco não são reaplicadas (vão para uma lista "já incorporadas segundo a fonte", a conferir); a norma continua "a revisar".
- **Trava:** marco ilegível ou sem data resolvida no catálogo ⇒ nada muda; nunca promove a "aceita".
- **Risco de falso aceite:** nenhum (não aceita nada); o risco é o inverso — a compilação da fonte omitir uma alteradora e o motor não a aplicar. Por isso a lista "já incorporadas" fica a conferir.
- **Teste real:** prova 25277, 17878, 30209 (anotações até 2010), 24099; desmente 23346 (ementa diz atualizado, texto é original) e 16471 ("consolidada" = consolidação formal de 1970, ato legislativo — não é compilação).
- **Impacto:** 0 normas saem da fila; muda a confiabilidade dos históricos das 4 leis mais alteradas (52 + 62 + 44 + 18 alteradoras).
- **Medir:** contar, antes/depois, nos 4 históricos, dispositivos com `insert_node` sobre dispositivo já existente na versão 0 (hoje: LC 12: 1; LO: 0, mas ver A1; LC 434: 3; LC 170: 3) e `replace_text` que regride texto.

### R2. Conferência de rótulo tolerante ao ordinal datilografado (só antigas, só artigo)
- **Gatilho:** norma antiga; divergência só em rótulos de artigo; para TODO artigo k em sequência, o texto de origem tem `Art. k` seguido de `9|2|0|Q|o` (ou `l` no lugar de `1` em "Art. lº"), e a sequência k = 1, 2, 3… é contínua.
- **Trava:** qualquer divergência de inciso/parágrafo/alínea, sequência quebrada, ou "Art. 19" quando a norma tem ≥ 19 artigos (ambíguo) ⇒ não se aplica.
- **Risco:** aceitar um "Art. 12" verdadeiro como "Art. 1º" — barrado pela continuidade da sequência; mas **contraria a regra "texto de OCR nunca é corrigido por regra" e a decisão 25 ("só restringe")**, por isso é pergunta, não proposta pronta.
- **Impacto medido:** 36 normas têm só esse tipo de divergência, mas **só 2 delas (22675, LC 103/1984; 28092, LC 349/1995) têm `rótulo` como único motivo**; as outras continuam a revisar por cabeçalho/fecho. Saem da fila ≤ 1–3 normas. **Não compensa sozinha.**

### R3. "Autógrafo sem epígrafe": aceitar identidade do catálogo
- O cabeçalho falha em 139 autógrafos porque o documento não tem epígrafe numerada. Proposta: aviso `epigrafe_ausente_no_autografo` (identidade pelo catálogo, já é o que acontece: `cabecalho.fonte: 'catalogo'`), sem reprovar, só para antigas. **Decisão do mantenedor** (envolve a 2 e a regra "nada some em silêncio"). Impacto: sozinha tira poucas da fila (quase todas têm também `sem_fecho`, porque a data do fecho é manuscrita).

### R4. Marcar "não revisar" (classe 4 registrada, sem humano)
- Gatilho: família 1 (`extracao.situacao == 'texto_curto'`), família 3 (tipo LO anterior a 1990-04-03), e P6 "sem relação" com OCR ruim. É só classificação no dashboard/relatório; nenhum aceite. Retira **~100** da fila humana (23 + 8 + as P6 de classe 4). Decisão do mantenedor (P1 abaixo).

## 3. Cotejo com a compilação do leis.org × nenhuma revisão

**Onde o cotejo é o instrumento natural** (o motor depende de histórico, e o histórico depende de um texto-base antigo que não é confiável):

1. **Bases compiladas pela fonte (família 2)**: o texto-base já É uma compilação; o histórico do Norma, para versões anteriores, é estruturalmente falso (A1). Só uma compilação com notas de origem por dispositivo (o que o leis.org faz) ou os textos originais permitem conferir.
2. **Leis de peso cuja base é autógrafo digitalizado ou OCR** (família 7/8 entre as P1): LC 113/1984, LC 352/1995, LC 320/1994 (já há `lc320_compilado_leisorg.txt` no repositório).
3. **Leis de peso com base limpa mas histórico incompleto**: LC 133/1985 (30 não aplicadas, 11 delas antigas), LC 284/1992, LC 395/1996, LC 420/1998.
4. **LC 478/2002** e **LC 7/1973**: sem texto sancionado no acervo — a compilação seria, por ora, a única referência para a lei inteira (mas, pela decisão de 17/11/2026, "vale a lei": a compilação não substitui o texto que falta; só serve de conferência quando ele chegar).

**Onde NÃO vale revisão alguma:** as 61 normas "sem relação" (não são base nem alteradoras) + as 8 LOs históricas + as 23 sem texto (nada a revisar) — e, das 83 "P5" (só ligadas a leis revogadas, sobretudo o 1º PDDU), a revisão só serviria a uma linha do tempo de lei revogada. Total sem interesse para texto vigente: **~150–175** das 295.

**Alteradoras antigas em revisão que alimentam lei de peso (P2): 69.** Destas, 15 são Emendas à LO 2–24 (inúteis enquanto a base da LO for a compilação até a Emenda 48: R1), 22 alteram a LC 133, 20 a LC 12. Para elas o cotejo não é com a alteradora, é com a compilação da lei-base.

## 4. Prioridade (o que rever primeiro) e lista para o mantenedor trazer

Critério: (a) a lei é base vigente de peso com histórico; (b) quantas alteradoras dependem dela; (c) o texto-base é compilado ou ilegível (mais urgente, porque o erro é silencioso); (d) revogadas por inteiro e sem relação ficam por último ou fora.

**Compilações a trazer (ordem):**
1. 25277 — Lei Orgânica nº 1/1990 (52 alteradoras; base compilada até a ELO 48; achado A1)
2. 17878 — LC 12/1975, Código de Posturas (62; base compilada até a LC 702/2012, renumerada)
3. 23346 — LC 133/1985, Estatuto dos Funcionários (73; base original digitalizada; 30 não aplicadas)
4. 30209 — LC 434/1999, PDDUA (44; base compilada até 2010; revogada em 2026 pela LC 1.075 — vale para a linha do tempo até 2026)
5. 26743 — LC 284/1992, Código de Edificações (10)
6. 24099 — LC 170/1987, instalações hidrossanitárias (18; base compilada)
7. 32105 — LC 478/2002, Previdência (17; o acervo só tem a parcial)
8. 28813 — LC 395/1996, Código Municipal de Saúde (8; 68 dispositivos "a conferir")
9. 22932 — LC 113/1984, Taxa de Coleta de Lixo (6; autógrafo com "Art. lº")
10. 29512 — LC 420/1998, Código de Proteção contra Incêndio (3)
11. 28148 — LC 352/1995, Assistência Social (6; OCR)
12. 27569 — LC 320/1994 (7; já tem cópia no repositório)
- Fora do recorte, mas do mesmo nível: **17478 — LC 7/1973** (119 alteradoras; sem extração).
- Depois: as P3 restantes (bases vigentes com 2–3 alteradoras: 27441, 27682, 28320, 28368, 25142, 25748, 27973, 30519, 31404…; ver tabela).
- Não trazer: LC 43/1979, LC 10/1974, LC 534/2005 (revogadas) e as LOs históricas, salvo pedido para linha do tempo histórica.

## 5. Perguntas ao mantenedor

1. **Base que já é compilação (LO 1990, LC 12, LC 434, LC 170).** Evidência: A1. (a) Manter como está (linha do tempo falsa antes do marco, numeração desalinhada); (b) R1: marcar a versão 0 como "compilada pela fonte até X" e não reaplicar alteradoras anteriores ao marco; (c) não gerar histórico para elas até haver o texto original ou a compilação de cotejo. **Recomendo (b)+(c) na consulta pública: não mostrar linha do tempo anterior ao marco.**
2. **Classe "não revisar" para antigas.** 23 sem texto, 8 LOs históricas, 61 sem relação com texto vigente. (a) Continuam na fila "a revisar"; (b) ganham estado próprio ("fora da revisão: sem texto / histórica / sem efeito no texto vigente") no relatório e no dashboard, sem nunca virar "aceita". **Recomendo (b).**
3. **Autógrafo sem epígrafe numerada** (139 normas): reprovar por cabeçalho é útil ou só ruído? (a) segue reprovando; (b) aviso, identidade pelo catálogo, só para antigas. Consequência de (b): quase nenhuma sai da fila (têm também fecho manuscrito), mas o motivo deixa de mascarar os outros. **Recomendo (b) só se a 2 for (b).**
4. **Ordinal datilografado** ("Art. 19", "Art. lº"): aceitar na conferência de rótulo (R2)? Contraria "OCR nunca é corrigido por regra" e a decisão 25. Impacto medido ≤ 3 normas. **Recomendo não fazer.**
5. **Registro que só traz a promulgação parcial** (LC 478/2002, 463/2001, 268/1992, 482/2002 ×2) e **arquivos possivelmente trocados** (25208 × 25290; 25553 × 25665): registrar como defeito de fonte e pedir à fonte? Para a LC 478 (17 alteradoras recusadas), suspender o histórico até haver o texto sancionado? **Recomendo suspender e registrar.**
6. **Antigas como alteradoras:** priorizar a revisão das 69 alteradoras de leis de peso, ou primeiro a base (via compilação) e só depois as alteradoras que a compilação mostrar como divergentes? **Recomendo a segunda** (a compilação diz quais alteradoras importam).

## 6. Achados inesperados

- **A1. Histórico da LO 1/1990 com endereços deslocados.** O texto-base (compilado até a ELO 48) tem "Art. 19-A"; o motor numera por posição: o `art-20` do histórico tem o texto do 19-A ("Ficam proibidas a nomeação ou a designação…") e o `art-21` tem o texto do Art. 20 da fonte ("Integram a administração indireta…", l. 294 do .txt); depois a ELO correspondente (versão 25) insere de novo `art-19-A` com o mesmo texto. Resultado: o 19-A aparece duas vezes e há artigos com o número errado (o deslocamento volta ao normal adiante: `art-100` confere com o Art. 100). Além disso, a "versão original de 1990" mostra o texto de emendas posteriores (`art-19/par-unico` v0 = redação da ELO 27/2008). Existe `docs/dados/revisao/historico/25277.json` (não conferi se a consulta pública mostra este histórico).
- **A2. Histórico da LC 12/1975:** base compilada e renumerada ("renumerando-se os demais"); o histórico aplica 275 comandos de 41 versões desde 1983; `art-31/par-1` alterna `promulgacao_original`/`insert_node` em todas as versões de 10 a 41 (dois estados por versão), e a v0 do `art-48` ("Junto aos aparelhos…") é substituída pela redação de 1983 (LC 88) — retrocesso de texto.
- **A3. LC 133/1985 em dois registros** (23346 "nº 133" e 23347 "nº 133b"): mesmo arquivo (sha igual). Idem LC 482/2002 (32299/32300) e LC 258 (26196/26363).
- **A4. A ementa do catálogo diz "texto atualizado até…" (LC 133: "até a LC 677/2011") mas o arquivo é o autógrafo original de 1985.** Não usar a ementa como gatilho de "base compilada".
- **A5. "®" no lugar de "º" em DOCX** (69 arquivos no acervo; ex. 30483: "Art. 3® - ..."): pode impedir o reconhecimento de rótulos e citações. Não medi o efeito.
- **A6. Nenhuma lei ordinária antiga tem texto estruturado** (11.086 no catálogo): o "acervo antigo" medido é só LO/ELO/LC. As conclusões deste relatório não valem para leis ordinárias antigas.
- **A7.** 25306 (LC 206/1990): o arquivo é página do Diário Oficial com um Decreto no meio.

**Confiança do levantamento:** contagens (motivos, décadas, métodos, vínculos, históricos) recalculadas por script sobre todas as 295; famílias 1–6 conferidas norma a norma (23 + 4 + 8 + 5 + 6 + 6); famílias 7–9 atribuídas por critério mecânico e conferidas numa amostra de 79 normas abertas (todas as de peso; ≥ 3 por motivo nas famílias 7–9 e em todas as décadas); as causas finas por norma das famílias 7–9 fora da amostra são presumidas pela família ("fam." na tabela). A1 e A2 conferidos nos arquivos de histórico e no .txt.

## 7. Tabela por norma (295; ordem cronológica)

Classe: 1 regra · 2 IA propõe · 3 humano ponto a ponto · 4 defeito de fonte/nada a fazer. Relevância: P1 lei de peso · P2 alteradora de lei de peso · P3 base vigente com alteradoras · P4 alteradora de base vigente · P5 só ligada a lei revogada ou sem alvo apurado · P6 sem relação / LO histórica. "conf." = sim (aberta e lida) · fam. (causa pela família).

| id | rótulo | motivos | causa | classe | relevância | conf. |
|---|---|---|---|---|---|---|
| 44328 | Lei Orgânica-Intendência nº 1, de 14 de outubro de 1892 | cab, tipo, s/fecho, tab, trecho, rót | Lei Orgânica histórica (consolidação/LO anterior a 1990), tipo sem suporte, digitalização | 4 | P6 histórica (LO anterior à de 1990) | fam. |
| 44366 | Lei Orgânica-Intendência nº 1, de 09 de abril de 1928 | cab, tipo, s/fecho, tab, trecho, rót | Lei Orgânica histórica (consolidação/LO anterior a 1990), tipo sem suporte, digitalização | 4 | P6 histórica (LO anterior à de 1990) | fam. |
| 8079 | Lei Orgânica-PMPA nº 1, de 05 de março de 1936 | cab, tipo, s/fecho, tab, fora, trecho, rót, s/dono | Lei Orgânica histórica (consolidação/LO anterior a 1990), tipo sem suporte, digitalização | 4 | P6 histórica (LO anterior à de 1990) | fam. |
| 9133 | Lei Orgânica nº 1, de 03 de abril de 1948 | cab, tipo, s/fecho, tab, fora, trecho, rót | Lei Orgânica histórica (consolidação/LO anterior a 1990), tipo sem suporte, digitalização | 4 | P6 histórica (LO anterior à de 1990) | sim |
| 11440 | Lei Orgânica nº 1, de 21 de setembro de 1956 | cab, tipo, s/fecho, tab, fora, trecho, rót | Lei Orgânica histórica (consolidação/LO anterior a 1990), tipo sem suporte, digitalização | 4 | P6 histórica (LO anterior à de 1990) | fam. |
| 13529 | Lei Orgânica nº 1, de 24 de setembro de 1962 | cab, tipo, s/fecho, tab, fora, trecho, rót, s/dono | Lei Orgânica histórica (consolidação/LO anterior a 1990), tipo sem suporte, digitalização | 4 | P6 histórica (LO anterior à de 1990) | fam. |
| 16471 | Lei Orgânica nº 1, de 15 de dezembro de 1970 | cab, tipo, fecho+, trecho, rót, s/dono | Lei Orgânica histórica (consolidação/LO anterior a 1990), tipo sem suporte, digitalização | 4 | P6 histórica (LO anterior à de 1990) | sim |
| 16472 | ELO nº 11, de 15 de dezembro de 1970 | cab, s/fecho, fora, trecho, rót | Lei Orgânica histórica (consolidação/LO anterior a 1990), tipo sem suporte, digitalização | 4 | P6 histórica (LO anterior à de 1990) | fam. |
| 17547 | LC nº 10, de 22 de março de 1974 | cab, s/art, s/fecho | fonte sem texto (HTML do SIREL só com título; extração "texto_curto") | 4 | P1 peso (revogada) | sim |
| 17878 | LC nº 12, de 07 de janeiro de 1975 | rót | texto-base é COMPILAÇÃO da fonte (não o texto sancionado); rótulos "-A" desalinham a numeração por posição | 3 | P1 peso | sim |
| 18218 | LC nº 17, de 02 de dezembro de 1975 | cab, s/art, s/fecho | fonte sem texto (HTML do SIREL só com título; extração "texto_curto") | 4 | P3 base vigente c/ alteradoras | fam. |
| 18469 | LC nº 23, de 09 de julho de 1976 | cab, s/art, s/fecho | fonte sem texto (HTML do SIREL só com título; extração "texto_curto") | 4 | P5 só lei revogada/sem alvo apurado (revogada) | fam. |
| 18490 | LC nº 24, de 16 de julho de 1976 | cab, s/art, s/fecho | fonte sem texto (HTML do SIREL só com título; extração "texto_curto") | 4 | P2 alteradora de lei de peso | sim |
| 18502 | LC nº 26, de 21 de julho de 1976 | cab, s/art, s/fecho | fonte sem texto (HTML do SIREL só com título; extração "texto_curto") | 4 | P2 alteradora de lei de peso | fam. |
| 19021 | LC nº 34, de 31 de maio de 1977 | cab, s/art, s/fecho | fonte sem texto (HTML do SIREL só com título; extração "texto_curto") | 4 | P2 alteradora de lei de peso | fam. |
| 19330 | ELO nº 13, de 25 de novembro de 1977 | cab, s/fecho | digitalização re-OCR pelo coletor (texto_de_ocr) | 4 | P4 alteradora de base vigente | sim |
| 19519 | LC nº 36, de 19 de abril de 1978 | cab, s/art, s/fecho | fonte sem texto (HTML do SIREL só com título; extração "texto_curto") | 4 | P3 base vigente c/ alteradoras | fam. |
| 19667 | LC nº 37, de 13 de setembro de 1978 | cab, s/art, s/fecho | fonte sem texto (HTML do SIREL só com título; extração "texto_curto") | 4 | P4 alteradora de base vigente | fam. |
| 19746 | LC nº 39, de 17 de novembro de 1978 | cab, s/art, s/fecho | fonte sem texto (HTML do SIREL só com título; extração "texto_curto") | 4 | P4 alteradora de base vigente | fam. |
| 19808 | LC nº 41, de 11 de dezembro de 1978 | cab, s/art, s/fecho | fonte sem texto (HTML do SIREL só com título; extração "texto_curto") | 4 | P2 alteradora de lei de peso | fam. |
| 20255 | LC nº 43, de 21 de julho de 1979 | s/fecho, fora, trecho, rót | digitalização com camada de texto antiga da fonte (autógrafo datilografado: carimbo PROC/PLCL no topo, sem epígrafe numerada; º lido como 9/2/0, "lº") | 4 | P1 peso (revogada) | sim |
| 20533 | LC nº 44, de 27 de novembro de 1979 | cab, s/art, s/fecho | fonte sem texto (HTML do SIREL só com título; extração "texto_curto") | 4 | P5 só lei revogada/sem alvo apurado (revogada) | fam. |
| 21280 | LC nº 49, de 02 de dezembro de 1980 | cab, fecho+, fora, trecho, rót | digitalização re-OCR pelo coletor (texto_de_ocr) | 4 | P5 só lei revogada/sem alvo apurado | sim |
| 21317 | LC nº 51, de 15 de dezembro de 1980 | rót | digitalização re-OCR pelo coletor (texto_de_ocr) | 4 | P5 só lei revogada/sem alvo apurado (revogada) | sim |
| 21358 | LC nº 53, de 29 de dezembro de 1980 | cab, s/fecho, tab, rót | digitalização com camada de texto antiga da fonte (autógrafo datilografado: carimbo PROC/PLCL no topo, sem epígrafe numerada; º lido como 9/2/0, "lº") | 4 | P6 sem relação | sim |
| 21359 | LC nº 54, de 29 de dezembro de 1980 | cab, rót | digitalização com camada de texto antiga da fonte (autógrafo datilografado: carimbo PROC/PLCL no topo, sem epígrafe numerada; º lido como 9/2/0, "lº"); rótulos: só ordinal mal lido | 4 | P5 só lei revogada/sem alvo apurado (revogada) | sim |
| 21375 | LC nº 55, de 31 de dezembro de 1980 | cab, trecho, rót | digitalização com camada de texto antiga da fonte (autógrafo datilografado: carimbo PROC/PLCL no topo, sem epígrafe numerada; º lido como 9/2/0, "lº") | 4 | P5 só lei revogada/sem alvo apurado (revogada) | sim |
| 21396 | LC nº 57, de 27 de janeiro de 1981 | cab, rót | digitalização com camada de texto antiga da fonte (autógrafo datilografado: carimbo PROC/PLCL no topo, sem epígrafe numerada; º lido como 9/2/0, "lº") | 4 | P5 só lei revogada/sem alvo apurado | fam. |
| 21462 | LC nº 60, de 25 de maio de 1981 | cab, s/fecho, rót | digitalização com camada de texto antiga da fonte (autógrafo datilografado: carimbo PROC/PLCL no topo, sem epígrafe numerada; º lido como 9/2/0, "lº"); rótulos: só ordinal mal lido | 4 | P5 só lei revogada/sem alvo apurado | sim |
| 21758 | LC nº 63, de 11 de dezembro de 1981 | cab, s/art, s/fecho | fonte sem texto (HTML do SIREL só com título; extração "texto_curto") | 4 | P5 só lei revogada/sem alvo apurado (revogada) | fam. |
| 21812 | LC nº 65, de 22 de dezembro de 1981 | cab, s/fecho, rót | digitalização com camada de texto antiga da fonte (autógrafo datilografado: carimbo PROC/PLCL no topo, sem epígrafe numerada; º lido como 9/2/0, "lº") | 4 | P3 base vigente c/ alteradoras | fam. |
| 21849 | LC nº 67, de 04 de janeiro de 1982 | cab, fecho+, trecho, rót | digitalização re-OCR pelo coletor (texto_de_ocr) | 4 | P5 só lei revogada/sem alvo apurado | sim |
| 21856 | LC nº 70, de 06 de janeiro de 1982 | cab, s/art, s/fecho | fonte sem texto (HTML do SIREL só com título; extração "texto_curto") | 4 | P5 só lei revogada/sem alvo apurado | sim |
| 21857 | LC nº 71, de 06 de janeiro de 1982 | cab, s/art, s/fecho | fonte sem texto (HTML do SIREL só com título; extração "texto_curto") | 4 | P2 alteradora de lei de peso | fam. |
| 21858 | LC nº 72, de 06 de janeiro de 1982 | cab, rót | digitalização com camada de texto antiga da fonte (autógrafo datilografado: carimbo PROC/PLCL no topo, sem epígrafe numerada; º lido como 9/2/0, "lº") | 4 | P5 só lei revogada/sem alvo apurado (revogada) | fam. |
| 21968 | LC nº 73, de 30 de junho de 1982 | cab, s/art, s/fecho | fonte sem texto (HTML do SIREL só com título; extração "texto_curto") | 4 | P6 sem relação | fam. |
| 22159 | LC nº 75, de 23 de novembro de 1982 | cab, s/art, s/fecho | fonte sem texto (HTML do SIREL só com título; extração "texto_curto") | 4 | P6 sem relação | fam. |
| 22196 | LC nº 76, de 15 de dezembro de 1982 | cab, s/art, s/fecho | fonte sem texto (HTML do SIREL só com título; extração "texto_curto") | 4 | P5 só lei revogada/sem alvo apurado (revogada) | fam. |
| 22291 | LC nº 79, de 10 de janeiro de 1983 | cab, s/art, s/fecho | fonte sem texto (HTML do SIREL só com título; extração "texto_curto") | 4 | P5 só lei revogada/sem alvo apurado (revogada) | fam. |
| 22296 | LC nº 80, de 11 de janeiro de 1983 | cab, s/art, s/fecho | fonte sem texto (HTML do SIREL só com título; extração "texto_curto") | 4 | P5 só lei revogada/sem alvo apurado | fam. |
| 22304 | LC nº 82, de 17 de janeiro de 1983 | cab, s/art, s/fecho | fonte sem texto (HTML do SIREL só com título; extração "texto_curto") | 4 | P5 só lei revogada/sem alvo apurado (revogada) | fam. |
| 22306 | LC nº 83, de 20 de janeiro de 1983 | cab, s/art, s/fecho | fonte sem texto (HTML do SIREL só com título; extração "texto_curto") | 4 | P5 só lei revogada/sem alvo apurado | fam. |
| 22307 | LC nº 84, de 20 de janeiro de 1983 | cab, s/fecho, rót | digitalização com camada de texto antiga da fonte (autógrafo datilografado: carimbo PROC/PLCL no topo, sem epígrafe numerada; º lido como 9/2/0, "lº") | 4 | P5 só lei revogada/sem alvo apurado | fam. |
| 22311 | LC nº 85, de 27 de janeiro de 1983 | cab, s/fecho, tab, fora, trecho, rót | digitalização com camada de texto antiga da fonte (autógrafo datilografado: carimbo PROC/PLCL no topo, sem epígrafe numerada; º lido como 9/2/0, "lº") | 4 | P3 base vigente c/ alteradoras | sim |
| 22312 | LC nº 86, de 27 de janeiro de 1983 | cab, s/fecho, tab, rót | digitalização com camada de texto antiga da fonte (autógrafo datilografado: carimbo PROC/PLCL no topo, sem epígrafe numerada; º lido como 9/2/0, "lº") | 4 | P5 só lei revogada/sem alvo apurado | fam. |
| 22535 | LC nº 87, de 08 de novembro de 1983 | cab, fecho+ | digitalização re-OCR pelo coletor (texto_de_ocr) | 4 | P5 só lei revogada/sem alvo apurado | fam. |
| 22537 | LC nº 88, de 10 de novembro de 1983 | cab, s/fecho, rót | digitalização com camada de texto antiga da fonte (autógrafo datilografado: carimbo PROC/PLCL no topo, sem epígrafe numerada; º lido como 9/2/0, "lº"); rótulos: só ordinal mal lido | 4 | P2 alteradora de lei de peso | fam. |
| 22552 | LC nº 89, de 25 de novembro de 1983 | cab, rót | digitalização com camada de texto antiga da fonte (autógrafo datilografado: carimbo PROC/PLCL no topo, sem epígrafe numerada; º lido como 9/2/0, "lº"); rótulos: só ordinal mal lido | 4 | P5 só lei revogada/sem alvo apurado (revogada) | fam. |
| 22566 | LC nº 91, de 13 de dezembro de 1983 | cab, s/fecho, rót | digitalização com camada de texto antiga da fonte (autógrafo datilografado: carimbo PROC/PLCL no topo, sem epígrafe numerada; º lido como 9/2/0, "lº"); rótulos: só ordinal mal lido | 4 | P5 só lei revogada/sem alvo apurado | fam. |
| 22600 | LC nº 92, de 21 de dezembro de 1983 | cab, s/fecho, tab, rót | digitalização com camada de texto antiga da fonte (autógrafo datilografado: carimbo PROC/PLCL no topo, sem epígrafe numerada; º lido como 9/2/0, "lº") | 4 | P2 alteradora de lei de peso | fam. |
| 22650 | LC nº 98, de 04 de janeiro de 1984 | cab, fecho+, rót | digitalização re-OCR pelo coletor (texto_de_ocr) | 4 | P5 só lei revogada/sem alvo apurado | fam. |
| 22651 | LC nº 99, de 04 de janeiro de 1984 | cab, fecho+, rót | digitalização re-OCR pelo coletor (texto_de_ocr); rótulos: só ordinal mal lido | 4 | P5 só lei revogada/sem alvo apurado | fam. |
| 22652 | LC nº 100, de 05 de janeiro de 1984 | cab, s/fecho, rót | digitalização com camada de texto antiga da fonte (autógrafo datilografado: carimbo PROC/PLCL no topo, sem epígrafe numerada; º lido como 9/2/0, "lº"); rótulos: só ordinal mal lido | 4 | P6 sem relação | fam. |
| 22669 | LC nº 101, de 11 de janeiro de 1984 | cab, s/fecho | digitalização com camada de texto antiga da fonte (autógrafo datilografado: carimbo PROC/PLCL no topo, sem epígrafe numerada; º lido como 9/2/0, "lº") | 4 | P6 sem relação | fam. |
| 22673 | LC nº 102, de 13 de janeiro de 1984 | cab, tab, rót | digitalização com camada de texto antiga da fonte (autógrafo datilografado: carimbo PROC/PLCL no topo, sem epígrafe numerada; º lido como 9/2/0, "lº") | 4 | P6 sem relação (revogada) | fam. |
| 22675 | LC nº 103, de 16 de janeiro de 1984 | rót | digitalização re-OCR pelo coletor (texto_de_ocr); rótulos: só ordinal mal lido | 4 | P5 só lei revogada/sem alvo apurado (revogada) | fam. |
| 22700 | LC nº 104, de 16 de abril de 1984 | cab, tab, rót | digitalização com camada de texto antiga da fonte (autógrafo datilografado: carimbo PROC/PLCL no topo, sem epígrafe numerada; º lido como 9/2/0, "lº"); rótulos: só ordinal mal lido | 4 | P5 só lei revogada/sem alvo apurado | fam. |
| 22701 | LC nº 105, de 17 de abril de 1984 | cab, tab, rót | digitalização com camada de texto antiga da fonte (autógrafo datilografado: carimbo PROC/PLCL no topo, sem epígrafe numerada; º lido como 9/2/0, "lº") | 4 | P6 sem relação | fam. |
| 22711 | LC nº 106, de 27 de abril de 1984 | cab, tab, rót | digitalização com camada de texto antiga da fonte (autógrafo datilografado: carimbo PROC/PLCL no topo, sem epígrafe numerada; º lido como 9/2/0, "lº") | 4 | P6 sem relação (revogada) | fam. |
| 22769 | LC nº 107, de 27 de julho de 1984 | cab, rót | digitalização com camada de texto antiga da fonte (autógrafo datilografado: carimbo PROC/PLCL no topo, sem epígrafe numerada; º lido como 9/2/0, "lº"); rótulos: só ordinal mal lido | 4 | P5 só lei revogada/sem alvo apurado (revogada) | fam. |
| 22802 | LC nº 108, de 28 de setembro de 1984 | cab, s/fecho, fora, rót, s/dono | digitalização com camada de texto antiga da fonte (autógrafo datilografado: carimbo PROC/PLCL no topo, sem epígrafe numerada; º lido como 9/2/0, "lº") | 4 | P2 alteradora de lei de peso | sim |
| 22821 | LC nº 109, de 22 de outubro de 1984 | cab, rót | digitalização com camada de texto antiga da fonte (autógrafo datilografado: carimbo PROC/PLCL no topo, sem epígrafe numerada; º lido como 9/2/0, "lº"); rótulos: só ordinal mal lido | 4 | P6 sem relação | fam. |
| 22858 | LC nº 110, de 23 de novembro de 1984 | cab, s/fecho, fora, trecho, rót | digitalização com camada de texto antiga da fonte (autógrafo datilografado: carimbo PROC/PLCL no topo, sem epígrafe numerada; º lido como 9/2/0, "lº") | 4 | P2 alteradora de lei de peso (revogada) | fam. |
| 22911 | LC nº 111, de 18 de dezembro de 1984 | cab, rót | digitalização re-OCR pelo coletor (texto_de_ocr); rótulos: só ordinal mal lido | 4 | P5 só lei revogada/sem alvo apurado (revogada) | fam. |
| 22932 | LC nº 113, de 21 de dezembro de 1984 | cab, fecho+, rót | digitalização com camada de texto antiga da fonte (autógrafo datilografado: carimbo PROC/PLCL no topo, sem epígrafe numerada; º lido como 9/2/0, "lº"); "Art. lº" (letra l) não reconhecido, artigos deslocados | 4 | P1 peso | sim |
| 22961 | LC nº 114, de 28 de dezembro de 1984 | cab, fecho+, rót, s/dono | digitalização re-OCR pelo coletor (texto_de_ocr) | 4 | P6 sem relação (revogada) | sim |
| 22979 | LC nº 117, de 09 de janeiro de 1985 | cab, rót, s/dono | digitalização com camada de texto antiga da fonte (autógrafo datilografado: carimbo PROC/PLCL no topo, sem epígrafe numerada; º lido como 9/2/0, "lº"); "Art. lº" (letra l) não reconhecido, artigos deslocados | 4 | P5 só lei revogada/sem alvo apurado (revogada) | sim |
| 23172 | LC nº 123, de 09 de outubro de 1985 | cab, rót, s/dono | digitalização com camada de texto antiga da fonte (autógrafo datilografado: carimbo PROC/PLCL no topo, sem epígrafe numerada; º lido como 9/2/0, "lº") | 4 | P5 só lei revogada/sem alvo apurado | fam. |
| 23188 | LC nº 124, de 22 de outubro de 1985 | cab, s/fecho, rót | digitalização com camada de texto antiga da fonte (autógrafo datilografado: carimbo PROC/PLCL no topo, sem epígrafe numerada; º lido como 9/2/0, "lº") | 4 | P3 base vigente c/ alteradoras | fam. |
| 23208 | LC nº 126, de 05 de novembro de 1985 | cab, s/fecho, rót, alt s/aspas | digitalização com camada de texto antiga da fonte (autógrafo datilografado: carimbo PROC/PLCL no topo, sem epígrafe numerada; º lido como 9/2/0, "lº") | 4 | P5 só lei revogada/sem alvo apurado | sim |
| 23237 | LC nº 128, de 27 de novembro de 1985 | cab, tab, rót | digitalização com camada de texto antiga da fonte (autógrafo datilografado: carimbo PROC/PLCL no topo, sem epígrafe numerada; º lido como 9/2/0, "lº") | 4 | P5 só lei revogada/sem alvo apurado (revogada) | fam. |
| 23247 | LC nº 129, de 05 de dezembro de 1985 | cab, s/fecho, rót | digitalização com camada de texto antiga da fonte (autógrafo datilografado: carimbo PROC/PLCL no topo, sem epígrafe numerada; º lido como 9/2/0, "lº") | 4 | P5 só lei revogada/sem alvo apurado | fam. |
| 23254 | LC nº 131, de 10 de dezembro de 1985 | cab | digitalização com camada de texto antiga da fonte (autógrafo datilografado: carimbo PROC/PLCL no topo, sem epígrafe numerada; º lido como 9/2/0, "lº") | 4 | P2 alteradora de lei de peso | fam. |
| 23346 | LC nº 133, de 31 de dezembro de 1985 | fecho+, trecho, rót | texto limpo (DOCX/HTML/PDF digital): técnica antiga ou leitura | 3 | P1 peso | sim |
| 23347 | LC nº 133b, de 31 de dezembro de 1985 | fecho+, trecho, rót | texto limpo (DOCX/HTML/PDF digital): técnica antiga ou leitura; mesmo texto de 23346 (sha igual) | 3 | P6 sem relação | sim |
| 23364 | LC nº 134, de 13 de janeiro de 1986 | cab, s/fecho | digitalização com camada de texto antiga da fonte (autógrafo datilografado: carimbo PROC/PLCL no topo, sem epígrafe numerada; º lido como 9/2/0, "lº") | 4 | P5 só lei revogada/sem alvo apurado (revogada) | fam. |
| 23449 | LC nº 135, de 22 de julho de 1986 | cab, s/fecho, rót | digitalização com camada de texto antiga da fonte (autógrafo datilografado: carimbo PROC/PLCL no topo, sem epígrafe numerada; º lido como 9/2/0, "lº") | 4 | P3 base vigente c/ alteradoras | fam. |
| 23450 | LC nº 136, de 22 de julho de 1986 | cab, s/fecho | digitalização com camada de texto antiga da fonte (autógrafo datilografado: carimbo PROC/PLCL no topo, sem epígrafe numerada; º lido como 9/2/0, "lº") | 4 | P5 só lei revogada/sem alvo apurado (revogada) | fam. |
| 23453 | LC nº 139, de 22 de julho de 1986 | cab, s/fecho, rót | digitalização com camada de texto antiga da fonte (autógrafo datilografado: carimbo PROC/PLCL no topo, sem epígrafe numerada; º lido como 9/2/0, "lº") | 4 | P6 sem relação (revogada) | fam. |
| 23454 | LC nº 140, de 22 de julho de 1986 | cab, fecho+ | digitalização re-OCR pelo coletor (texto_de_ocr) | 4 | P4 alteradora de base vigente | fam. |
| 23540 | LC nº 144, de 14 de novembro de 1986 | cab, s/fecho, rót | digitalização com camada de texto antiga da fonte (autógrafo datilografado: carimbo PROC/PLCL no topo, sem epígrafe numerada; º lido como 9/2/0, "lº"); rótulos: só ordinal mal lido | 4 | P3 base vigente c/ alteradoras | fam. |
| 23576 | LC nº 147, de 16 de dezembro de 1986 | cab, fora, trecho, s/dono | digitalização com camada de texto antiga da fonte (autógrafo datilografado: carimbo PROC/PLCL no topo, sem epígrafe numerada; º lido como 9/2/0, "lº") | 4 | P2 alteradora de lei de peso | fam. |
| 23623 | LC nº 148, de 30 de dezembro de 1986 | cab, s/fecho, rót | digitalização com camada de texto antiga da fonte (autógrafo datilografado: carimbo PROC/PLCL no topo, sem epígrafe numerada; º lido como 9/2/0, "lº"); rótulos: só ordinal mal lido | 4 | P2 alteradora de lei de peso | fam. |
| 23645 | LC nº 149, de 08 de janeiro de 1987 | cab, s/fecho, rót | digitalização com camada de texto antiga da fonte (autógrafo datilografado: carimbo PROC/PLCL no topo, sem epígrafe numerada; º lido como 9/2/0, "lº"); "Art. lº" (letra l) não reconhecido, artigos deslocados | 4 | P2 alteradora de lei de peso | fam. |
| 23646 | LC nº 173, de 08 de janeiro de 1987 | cab, s/fecho, fora, trecho, rót, s/dono | digitalização com camada de texto antiga da fonte (autógrafo datilografado: carimbo PROC/PLCL no topo, sem epígrafe numerada; º lido como 9/2/0, "lº") | 4 | P2 alteradora de lei de peso | fam. |
| 23652 | LC nº 150, de 12 de janeiro de 1987 | cab, fecho+, rót, s/dono | digitalização com camada de texto antiga da fonte (autógrafo datilografado: carimbo PROC/PLCL no topo, sem epígrafe numerada; º lido como 9/2/0, "lº"); "Art. lº" (letra l) não reconhecido, artigos deslocados | 4 | P2 alteradora de lei de peso | sim |
| 23686 | LC nº 153, de 04 de fevereiro de 1987 | cab, s/fecho, rót | digitalização com camada de texto antiga da fonte (autógrafo datilografado: carimbo PROC/PLCL no topo, sem epígrafe numerada; º lido como 9/2/0, "lº") | 4 | P6 sem relação | fam. |
| 23829 | LC nº 158, de 22 de julho de 1987 | cab, end.rep, fora, trecho, rót, s/dono | digitalização com camada de texto antiga da fonte (autógrafo datilografado: carimbo PROC/PLCL no topo, sem epígrafe numerada; º lido como 9/2/0, "lº") | 4 | P3 base vigente c/ alteradoras | sim |
| 23830 | LC nº 159, de 22 de julho de 1987 | cab, s/fecho, rót | digitalização com camada de texto antiga da fonte (autógrafo datilografado: carimbo PROC/PLCL no topo, sem epígrafe numerada; º lido como 9/2/0, "lº") | 4 | P6 sem relação | fam. |
| 23877 | LC nº 160, de 19 de setembro de 1987 | cab, s/fecho | digitalização com camada de texto antiga da fonte (autógrafo datilografado: carimbo PROC/PLCL no topo, sem epígrafe numerada; º lido como 9/2/0, "lº") | 4 | P5 só lei revogada/sem alvo apurado | fam. |
| 24028 | LC nº 162, de 17 de dezembro de 1987 | cab, s/fecho, rót, s/dono | digitalização com camada de texto antiga da fonte (autógrafo datilografado: carimbo PROC/PLCL no topo, sem epígrafe numerada; º lido como 9/2/0, "lº") | 4 | P2 alteradora de lei de peso | fam. |
| 24086 | LC nº 169, de 29 de dezembro de 1987 | cab, s/fecho, fora, trecho, rót | digitalização com camada de texto antiga da fonte (autógrafo datilografado: carimbo PROC/PLCL no topo, sem epígrafe numerada; º lido como 9/2/0, "lº") | 4 | P3 base vigente c/ alteradoras | fam. |
| 24099 | LC nº 170, de 31 de dezembro de 1987 | rót | texto-base é COMPILAÇÃO da fonte (não o texto sancionado); rótulos "-A" desalinham a numeração por posição | 3 | P1 peso | sim |
| 24128 | LC nº 174, de 13 de janeiro de 1988 | cab, s/fecho, rót | digitalização com camada de texto antiga da fonte (autógrafo datilografado: carimbo PROC/PLCL no topo, sem epígrafe numerada; º lido como 9/2/0, "lº"); rótulos: só ordinal mal lido | 4 | P2 alteradora de lei de peso | fam. |
| 24140 | LC nº 175, de 20 de janeiro de 1988 | cab, tab, rót | digitalização com camada de texto antiga da fonte (autógrafo datilografado: carimbo PROC/PLCL no topo, sem epígrafe numerada; º lido como 9/2/0, "lº") | 4 | P2 alteradora de lei de peso | fam. |
| 24152 | LC nº 176, de 29 de janeiro de 1988 | cab, fecho+ | digitalização re-OCR pelo coletor (texto_de_ocr) | 4 | P6 sem relação (revogada) | fam. |
| 24154 | LC nº 177, de 03 de fevereiro de 1988 | cab, s/fecho, tab, rót | digitalização com camada de texto antiga da fonte (autógrafo datilografado: carimbo PROC/PLCL no topo, sem epígrafe numerada; º lido como 9/2/0, "lº") | 4 | P6 sem relação | fam. |
| 24368 | LC nº 180, de 18 de agosto de 1988 | cab, fora, trecho, rót, s/dono, alt s/aspas | digitalização com camada de texto antiga da fonte (autógrafo datilografado: carimbo PROC/PLCL no topo, sem epígrafe numerada; º lido como 9/2/0, "lº") | 4 | P2 alteradora de lei de peso | sim |
| 24430 | LC nº 182, de 28 de setembro de 1988 | cab, fecho+, rót | digitalização com camada de texto antiga da fonte (autógrafo datilografado: carimbo PROC/PLCL no topo, sem epígrafe numerada; º lido como 9/2/0, "lº"); rótulos: só ordinal mal lido | 4 | P3 base vigente c/ alteradoras | fam. |
| 24598 | LC nº 189, de 27 de dezembro de 1988 | cab, fecho+ | digitalização re-OCR pelo coletor (texto_de_ocr) | 4 | P6 sem relação | fam. |
| 24600 | LC nº 191, de 27 de dezembro de 1988 | cab, rót | digitalização com camada de texto antiga da fonte (autógrafo datilografado: carimbo PROC/PLCL no topo, sem epígrafe numerada; º lido como 9/2/0, "lº") | 4 | P2 alteradora de lei de peso | fam. |
| 24601 | LC nº 192, de 27 de dezembro de 1988 | cab, s/fecho | digitalização re-OCR pelo coletor (texto_de_ocr) | 4 | P5 só lei revogada/sem alvo apurado | sim |
| 24616 | LC nº 193, de 28 de dezembro de 1988 | cab, s/fecho, rót | digitalização com camada de texto antiga da fonte (autógrafo datilografado: carimbo PROC/PLCL no topo, sem epígrafe numerada; º lido como 9/2/0, "lº") | 4 | P6 sem relação | fam. |
| 24667 | LC nº 195, de 30 de dezembro de 1988 | cab, fecho+, rót | digitalização com camada de texto antiga da fonte (autógrafo datilografado: carimbo PROC/PLCL no topo, sem epígrafe numerada; º lido como 9/2/0, "lº") | 4 | P5 só lei revogada/sem alvo apurado (revogada) | fam. |
| 24795 | LC nº 199, de 15 de maio de 1989 | cab, rót | digitalização com camada de texto antiga da fonte (autógrafo datilografado: carimbo PROC/PLCL no topo, sem epígrafe numerada; º lido como 9/2/0, "lº"); rótulos: só ordinal mal lido | 4 | P4 alteradora de base vigente (revogada) | fam. |
| 24811 | LC nº 200, de 30 de maio de 1989 | cab, rót | digitalização com camada de texto antiga da fonte (autógrafo datilografado: carimbo PROC/PLCL no topo, sem epígrafe numerada; º lido como 9/2/0, "lº"); rótulos: só ordinal mal lido | 4 | P5 só lei revogada/sem alvo apurado (revogada) | fam. |
| 25081 | LC nº 201, de 18 de dezembro de 1989 | cab, fecho+, rót | digitalização re-OCR pelo coletor (texto_de_ocr) | 4 | P6 sem relação | fam. |
| 25132 | LC nº 202, de 28 de dezembro de 1989 | parcial, fora, trecho, rót, s/dono | arquivo com 2 documentos: promulgação parcial seguida do autógrafo sancionado | 3 | P3 base vigente c/ alteradoras | sim |
| 25134 | LC nº 204, de 28 de dezembro de 1989 | cab, s/fecho, tab, rót | digitalização com camada de texto antiga da fonte (autógrafo datilografado: carimbo PROC/PLCL no topo, sem epígrafe numerada; º lido como 9/2/0, "lº") | 4 | P2 alteradora de lei de peso | fam. |
| 25139 | LC nº 209, de 28 de dezembro de 1989 | fecho+, fora, trecho, rót, s/dono | digitalização re-OCR pelo coletor (texto_de_ocr) | 4 | P3 base vigente c/ alteradoras | sim |
| 25141 | LC nº 211, de 28 de dezembro de 1989 | cab, s/fecho, tab, rót | digitalização com camada de texto antiga da fonte (autógrafo datilografado: carimbo PROC/PLCL no topo, sem epígrafe numerada; º lido como 9/2/0, "lº") | 4 | P6 sem relação | fam. |
| 25142 | LC nº 212, de 28 de dezembro de 1989 | cab, s/fecho, rót | digitalização com camada de texto antiga da fonte (autógrafo datilografado: carimbo PROC/PLCL no topo, sem epígrafe numerada; º lido como 9/2/0, "lº") | 4 | P3 base vigente c/ alteradoras | fam. |
| 25143 | LC nº 213, de 28 de dezembro de 1989 | fecho+, rót | digitalização re-OCR pelo coletor (texto_de_ocr) | 4 | P6 sem relação | fam. |
| 25159 | LC nº 214, de 04 de janeiro de 1990 | cab, s/fecho, fora, trecho, rót | digitalização com camada de texto antiga da fonte (autógrafo datilografado: carimbo PROC/PLCL no topo, sem epígrafe numerada; º lido como 9/2/0, "lº") | 4 | P4 alteradora de base vigente (revogada) | sim |
| 25191 | LC nº 215, de 12 de janeiro de 1990 | cab, rót, s/dono | digitalização com camada de texto antiga da fonte (autógrafo datilografado: carimbo PROC/PLCL no topo, sem epígrafe numerada; º lido como 9/2/0, "lº"); "Art. lº" (letra l) não reconhecido, artigos deslocados | 4 | P2 alteradora de lei de peso | sim |
| 25192 | LC nº 216, de 12 de janeiro de 1990 | cab, rót | digitalização com camada de texto antiga da fonte (autógrafo datilografado: carimbo PROC/PLCL no topo, sem epígrafe numerada; º lido como 9/2/0, "lº") | 4 | P5 só lei revogada/sem alvo apurado | fam. |
| 25193 | LC nº 217, de 12 de janeiro de 1990 | cab | digitalização com camada de texto antiga da fonte (autógrafo datilografado: carimbo PROC/PLCL no topo, sem epígrafe numerada; º lido como 9/2/0, "lº") | 4 | P2 alteradora de lei de peso | fam. |
| 25202 | LC nº 218, de 16 de janeiro de 1990 | cab, rót | digitalização com camada de texto antiga da fonte (autógrafo datilografado: carimbo PROC/PLCL no topo, sem epígrafe numerada; º lido como 9/2/0, "lº") | 4 | P6 sem relação | fam. |
| 25207 | LC nº 219, de 19 de janeiro de 1990 | cab, rót | digitalização com camada de texto antiga da fonte (autógrafo datilografado: carimbo PROC/PLCL no topo, sem epígrafe numerada; º lido como 9/2/0, "lº"); rótulos: só ordinal mal lido | 4 | P3 base vigente c/ alteradoras | fam. |
| 25208 | LC nº 220, de 19 de janeiro de 1990 | parcial, fecho+, fora, trecho, s/dono | registro próprio da PROMULGAÇÃO PARCIAL; a lei sancionada está no registro 25290 (LC 220, 19/04/1990, sem texto estruturado; conferir se os arquivos estão trocados) (OCR) | 3 | P6 sem relação | sim |
| 25226 | LC nº 221, de 31 de janeiro de 1990 | cab, rót | digitalização com camada de texto antiga da fonte (autógrafo datilografado: carimbo PROC/PLCL no topo, sem epígrafe numerada; º lido como 9/2/0, "lº"); rótulos: só ordinal mal lido | 4 | P2 alteradora de lei de peso | fam. |
| 25277 | Lei Orgânica nº 1, de 03 de abril de 1990 | cab, tipo, s/fecho, rót | texto-base é COMPILAÇÃO da fonte (não o texto sancionado); rótulos "-A" desalinham a numeração por posição | 3 | P1 peso | sim |
| 25291 | LC nº 222, de 19 de abril de 1990 | cab, s/fecho, rót | digitalização com camada de texto antiga da fonte (autógrafo datilografado: carimbo PROC/PLCL no topo, sem epígrafe numerada; º lido como 9/2/0, "lº") | 4 | P6 sem relação (revogada) | fam. |
| 25294 | LC nº 223, de 23 de abril de 1990 | cab, s/fecho, tab, rót | digitalização com camada de texto antiga da fonte (autógrafo datilografado: carimbo PROC/PLCL no topo, sem epígrafe numerada; º lido como 9/2/0, "lº") | 4 | P5 só lei revogada/sem alvo apurado (revogada) | sim |
| 25305 | LC nº 203, de 02 de maio de 1990 | parcial, s/art, s/fecho, fora, trecho, s/dono | registro próprio da PROMULGAÇÃO PARCIAL; a lei sancionada está no registro 25133 (LC 203/1989, aceita) | 3 | P6 sem relação | sim |
| 25306 | LC nº 206, de 02 de maio de 1990 | cab, fecho+, rót | digitalização re-OCR pelo coletor (texto_de_ocr) | 4 | P6 sem relação | sim |
| 25324 | LC nº 224, de 25 de maio de 1990 | cab, s/fecho | digitalização com camada de texto antiga da fonte (autógrafo datilografado: carimbo PROC/PLCL no topo, sem epígrafe numerada; º lido como 9/2/0, "lº") | 4 | P2 alteradora de lei de peso | fam. |
| 25339 | LC nº 225, de 05 de junho de 1990 | cab | digitalização com camada de texto antiga da fonte (autógrafo datilografado: carimbo PROC/PLCL no topo, sem epígrafe numerada; º lido como 9/2/0, "lº") | 4 | P5 só lei revogada/sem alvo apurado (revogada) | fam. |
| 25350 | LC nº 226, de 07 de junho de 1990 | cab | digitalização com camada de texto antiga da fonte (autógrafo datilografado: carimbo PROC/PLCL no topo, sem epígrafe numerada; º lido como 9/2/0, "lº") | 4 | P2 alteradora de lei de peso | fam. |
| 25378 | LC nº 227, de 19 de junho de 1990 | cab, s/fecho, rót | digitalização com camada de texto antiga da fonte (autógrafo datilografado: carimbo PROC/PLCL no topo, sem epígrafe numerada; º lido como 9/2/0, "lº"); rótulos: só ordinal mal lido | 4 | P2 alteradora de lei de peso | fam. |
| 25391 | LC nº 228, de 27 de junho de 1990 | cab | digitalização com camada de texto antiga da fonte (autógrafo datilografado: carimbo PROC/PLCL no topo, sem epígrafe numerada; º lido como 9/2/0, "lº") | 4 | P4 alteradora de base vigente | fam. |
| 25426 | LC nº 229, de 18 de julho de 1990 | cab | digitalização com camada de texto antiga da fonte (autógrafo datilografado: carimbo PROC/PLCL no topo, sem epígrafe numerada; º lido como 9/2/0, "lº") | 4 | P6 sem relação | fam. |
| 25446 | LC nº 230, de 24 de julho de 1990 | cab, s/fecho | digitalização com camada de texto antiga da fonte (autógrafo datilografado: carimbo PROC/PLCL no topo, sem epígrafe numerada; º lido como 9/2/0, "lº") | 4 | P4 alteradora de base vigente | fam. |
| 25504 | LC nº 231, de 05 de setembro de 1990 | cab, rót | digitalização com camada de texto antiga da fonte (autógrafo datilografado: carimbo PROC/PLCL no topo, sem epígrafe numerada; º lido como 9/2/0, "lº"); rótulos: só ordinal mal lido | 4 | P5 só lei revogada/sem alvo apurado | fam. |
| 25522 | LC nº 232, de 21 de setembro de 1990 | cab, rót | digitalização com camada de texto antiga da fonte (autógrafo datilografado: carimbo PROC/PLCL no topo, sem epígrafe numerada; º lido como 9/2/0, "lº") | 4 | P4 alteradora de base vigente | fam. |
| 25553 | LC nº 233, de 05 de outubro de 1990 | parcial, cab, fora, trecho, rót, s/dono | registro próprio da PROMULGAÇÃO PARCIAL; a lei sancionada está no registro 25665 (LC 233, 05/12/1990, sem texto estruturado) | 3 | P2 alteradora de lei de peso | sim |
| 25573 | LC nº 235, de 19 de outubro de 1990 | cab, s/fecho | digitalização com camada de texto antiga da fonte (autógrafo datilografado: carimbo PROC/PLCL no topo, sem epígrafe numerada; º lido como 9/2/0, "lº") | 4 | P6 sem relação | fam. |
| 25679 | LC nº 236, de 10 de dezembro de 1990 | trecho | digitalização re-OCR pelo coletor (texto_de_ocr) | 4 | P4 alteradora de base vigente | fam. |
| 25687 | LC nº 237, de 17 de dezembro de 1990 | cab | digitalização com camada de texto antiga da fonte (autógrafo datilografado: carimbo PROC/PLCL no topo, sem epígrafe numerada; º lido como 9/2/0, "lº") | 4 | P2 alteradora de lei de peso | fam. |
| 25709 | LC nº 238, de 26 de dezembro de 1990 | cab, s/fecho, fora, trecho, rót, s/dono | digitalização com camada de texto antiga da fonte (autógrafo datilografado: carimbo PROC/PLCL no topo, sem epígrafe numerada; º lido como 9/2/0, "lº") | 4 | P3 base vigente c/ alteradoras | fam. |
| 25723 | LC nº 239, de 28 de dezembro de 1990 | cab, fecho+, rót | digitalização com camada de texto antiga da fonte (autógrafo datilografado: carimbo PROC/PLCL no topo, sem epígrafe numerada; º lido como 9/2/0, "lº") | 4 | P2 alteradora de lei de peso | sim |
| 25739 | LC nº 241, de 04 de janeiro de 1991 | rót | digitalização re-OCR pelo coletor (texto_de_ocr) | 4 | P5 só lei revogada/sem alvo apurado (revogada) | fam. |
| 25748 | LC nº 242, de 09 de janeiro de 1991 | cab, fecho+, rót | digitalização com camada de texto antiga da fonte (autógrafo datilografado: carimbo PROC/PLCL no topo, sem epígrafe numerada; º lido como 9/2/0, "lº") | 4 | P3 base vigente c/ alteradoras | fam. |
| 25757 | LC nº 243, de 11 de janeiro de 1991 | cab, rót | digitalização com camada de texto antiga da fonte (autógrafo datilografado: carimbo PROC/PLCL no topo, sem epígrafe numerada; º lido como 9/2/0, "lº") | 4 | P2 alteradora de lei de peso (revogada) | fam. |
| 25770 | LC nº 244, de 14 de janeiro de 1991 | cab, fora, rót, s/dono | digitalização com camada de texto antiga da fonte (autógrafo datilografado: carimbo PROC/PLCL no topo, sem epígrafe numerada; º lido como 9/2/0, "lº") | 4 | P5 só lei revogada/sem alvo apurado | fam. |
| 25781 | LC nº 245, de 18 de janeiro de 1991 | cab, rót | digitalização com camada de texto antiga da fonte (autógrafo datilografado: carimbo PROC/PLCL no topo, sem epígrafe numerada; º lido como 9/2/0, "lº") | 4 | P2 alteradora de lei de peso | fam. |
| 25788 | LC nº 247, de 22 de janeiro de 1991 | cab, rót | digitalização com camada de texto antiga da fonte (autógrafo datilografado: carimbo PROC/PLCL no topo, sem epígrafe numerada; º lido como 9/2/0, "lº") | 4 | P5 só lei revogada/sem alvo apurado (revogada) | fam. |
| 25789 | LC nº 248, de 23 de janeiro de 1991 | cab, s/fecho, rót | digitalização com camada de texto antiga da fonte (autógrafo datilografado: carimbo PROC/PLCL no topo, sem epígrafe numerada; º lido como 9/2/0, "lº") | 4 | P5 só lei revogada/sem alvo apurado (revogada) | fam. |
| 25946 | LC nº 250, de 11 de julho de 1991 | s/fecho | digitalização re-OCR pelo coletor (texto_de_ocr) | 4 | P2 alteradora de lei de peso | sim |
| 25978 | LC nº 251, de 25 de julho de 1991 | cab, s/fecho, fora, trecho, rót, s/dono | digitalização com camada de texto antiga da fonte (autógrafo datilografado: carimbo PROC/PLCL no topo, sem epígrafe numerada; º lido como 9/2/0, "lº") | 4 | P4 alteradora de base vigente | fam. |
| 26076 | LC nº 252, de 08 de outubro de 1991 | cab | digitalização com camada de texto antiga da fonte (autógrafo datilografado: carimbo PROC/PLCL no topo, sem epígrafe numerada; º lido como 9/2/0, "lº") | 4 | P5 só lei revogada/sem alvo apurado | fam. |
| 26118 | LC nº 254, de 22 de outubro de 1991 | cab, s/fecho, rót | digitalização com camada de texto antiga da fonte (autógrafo datilografado: carimbo PROC/PLCL no topo, sem epígrafe numerada; º lido como 9/2/0, "lº") | 4 | P2 alteradora de lei de peso (revogada) | fam. |
| 26156 | LC nº 256, de 06 de novembro de 1991 | cab, s/fecho, rót | digitalização com camada de texto antiga da fonte (autógrafo datilografado: carimbo PROC/PLCL no topo, sem epígrafe numerada; º lido como 9/2/0, "lº") | 4 | P3 base vigente c/ alteradoras | fam. |
| 26189 | LC nº 257, de 27 de novembro de 1991 | rót | texto limpo (DOCX/HTML/PDF digital): técnica antiga ou leitura | 3 | P6 sem relação | sim |
| 26196 | LC nº 258, de 29 de novembro de 1991 | parcial, cab, tab, fora, trecho, s/dono | arquivo com 2 documentos: promulgação parcial seguida do autógrafo sancionado | 3 | P6 sem relação | sim |
| 26224 | LC nº 260, de 11 de dezembro de 1991 | cab, s/fecho, rót | digitalização com camada de texto antiga da fonte (autógrafo datilografado: carimbo PROC/PLCL no topo, sem epígrafe numerada; º lido como 9/2/0, "lº") | 4 | P5 só lei revogada/sem alvo apurado (revogada) | fam. |
| 26276 | LC nº 263, de 28 de dezembro de 1991 | cab, s/fecho, rót | digitalização com camada de texto antiga da fonte (autógrafo datilografado: carimbo PROC/PLCL no topo, sem epígrafe numerada; º lido como 9/2/0, "lº") | 4 | P5 só lei revogada/sem alvo apurado | fam. |
| 26307 | LC nº 266, de 15 de janeiro de 1992 | cab, tab, rót | digitalização com camada de texto antiga da fonte (autógrafo datilografado: carimbo PROC/PLCL no topo, sem epígrafe numerada; º lido como 9/2/0, "lº") | 4 | P6 sem relação | fam. |
| 26309 | LC nº 267, de 16 de janeiro de 1992 | fecho+ | texto limpo (DOCX/HTML/PDF digital): técnica antiga ou leitura | 3 | P5 só lei revogada/sem alvo apurado (revogada) | sim |
| 26315 | LC nº 268, de 21 de janeiro de 1992 | fecho+, rót | registro traz só a PROMULGAÇÃO PARCIAL (veto derrubado), não a lei inteira | 4 | P6 sem relação | sim |
| 26317 | LC nº 269, de 22 de janeiro de 1992 | cab, rót | digitalização com camada de texto antiga da fonte (autógrafo datilografado: carimbo PROC/PLCL no topo, sem epígrafe numerada; º lido como 9/2/0, "lº") | 4 | P6 sem relação | fam. |
| 26353 | LC nº 270, de 20 de fevereiro de 1992 | cab, tab, rót | digitalização com camada de texto antiga da fonte (autógrafo datilografado: carimbo PROC/PLCL no topo, sem epígrafe numerada; º lido como 9/2/0, "lº") | 4 | P6 sem relação (revogada) | fam. |
| 26363 | LC nº 258, de 28 de fevereiro de 1992 | parcial, cab, tab, fora, trecho, s/dono | arquivo com 2 documentos: promulgação parcial seguida do autógrafo sancionado; mesmo texto de 26196 (sha igual) | 3 | P6 sem relação | sim |
| 26393 | LC nº 274, de 25 de março de 1992 | cab, s/fecho, trecho, rót | digitalização com camada de texto antiga da fonte (autógrafo datilografado: carimbo PROC/PLCL no topo, sem epígrafe numerada; º lido como 9/2/0, "lº") | 4 | P5 só lei revogada/sem alvo apurado (revogada) | fam. |
| 26402 | LC nº 267, de 30 de março de 1992 | s/art, s/fecho, fora, trecho, s/dono | registro próprio da PROMULGAÇÃO PARCIAL; a lei sancionada está no registro 26309 (LC 267/1992) | 3 | P3 base vigente c/ alteradoras | sim |
| 26405 | ELO nº 2, de 31 de março de 1992 | rót, s/dono | digitalização re-OCR pelo coletor (texto_de_ocr) | 4 | P2 alteradora de lei de peso | fam. |
| 26412 | LC nº 275, de 06 de abril de 1992 | rót | texto limpo (DOCX/HTML/PDF digital): técnica antiga ou leitura | 3 | P6 sem relação | fam. |
| 26424 | LC nº 276, de 23 de abril de 1992 | cab, rót | digitalização com camada de texto antiga da fonte (autógrafo datilografado: carimbo PROC/PLCL no topo, sem epígrafe numerada; º lido como 9/2/0, "lº") | 4 | P5 só lei revogada/sem alvo apurado | fam. |
| 26465 | LC nº 277, de 20 de maio de 1992 | fecho+, rót | digitalização re-OCR pelo coletor (texto_de_ocr) | 4 | P5 só lei revogada/sem alvo apurado (revogada) | fam. |
| 26547 | LC nº 278, de 24 de junho de 1992 | cab, s/fecho, fora, trecho, rót, s/dono | texto limpo (DOCX/HTML/PDF digital): técnica antiga ou leitura | 3 | P2 alteradora de lei de peso (revogada) | sim |
| 26639 | LC nº 279, de 17 de agosto de 1992 | cab | digitalização re-OCR pelo coletor (texto_de_ocr) | 4 | P6 sem relação | fam. |
| 26729 | LC nº 282, de 16 de outubro de 1992 | cab, s/fecho, rót | digitalização com camada de texto antiga da fonte (autógrafo datilografado: carimbo PROC/PLCL no topo, sem epígrafe numerada; º lido como 9/2/0, "lº") | 4 | P3 base vigente c/ alteradoras | fam. |
| 26739 | LC nº 283, de 23 de outubro de 1992 | cab, s/fecho, rót | digitalização com camada de texto antiga da fonte (autógrafo datilografado: carimbo PROC/PLCL no topo, sem epígrafe numerada; º lido como 9/2/0, "lº") | 4 | P5 só lei revogada/sem alvo apurado (revogada) | fam. |
| 26743 | LC nº 284, de 27 de outubro de 1992 | fecho+, tab, end.rep, rót, s/dono | texto limpo (DOCX/HTML/PDF digital): técnica antiga ou leitura | 3 | P1 peso | sim |
| 26754 | ELO nº 3, de 04 de novembro de 1992 | cab, s/fecho | digitalização re-OCR pelo coletor (texto_de_ocr) | 4 | P2 alteradora de lei de peso | fam. |
| 26843 | LC nº 285, de 29 de dezembro de 1992 | cab, tab, fora, trecho, rót, s/dono | digitalização com camada de texto antiga da fonte (autógrafo datilografado: carimbo PROC/PLCL no topo, sem epígrafe numerada; º lido como 9/2/0, "lº") | 4 | P3 base vigente c/ alteradoras | fam. |
| 26844 | LC nº 286, de 29 de dezembro de 1992 | cab, s/fecho | digitalização com camada de texto antiga da fonte (autógrafo datilografado: carimbo PROC/PLCL no topo, sem epígrafe numerada; º lido como 9/2/0, "lº") | 4 | P6 sem relação (revogada) | fam. |
| 26874 | LC nº 289, de 13 de janeiro de 1993 | cab, rót | digitalização com camada de texto antiga da fonte (autógrafo datilografado: carimbo PROC/PLCL no topo, sem epígrafe numerada; º lido como 9/2/0, "lº"); rótulos: só ordinal mal lido | 4 | P5 só lei revogada/sem alvo apurado | sim |
| 26884 | LC nº 291, de 15 de janeiro de 1993 | cab, fecho+, tab, rót | digitalização com camada de texto antiga da fonte (autógrafo datilografado: carimbo PROC/PLCL no topo, sem epígrafe numerada; º lido como 9/2/0, "lº") | 4 | P6 sem relação (revogada) | fam. |
| 26885 | LC nº 292, de 15 de janeiro de 1993 | s/fecho, rót | texto limpo (DOCX/HTML/PDF digital): técnica antiga ou leitura | 3 | P6 sem relação | sim |
| 27049 | LC nº 282, de 22 de junho de 1993 | parcial, s/art, s/fecho, fora, trecho, s/dono | registro próprio da PROMULGAÇÃO PARCIAL; a lei sancionada está no registro 26729 (LC 282/1992) | 3 | P6 sem relação | sim |
| 27111 | LC nº 297, de 27 de julho de 1993 | cab, rót | digitalização com camada de texto antiga da fonte (autógrafo datilografado: carimbo PROC/PLCL no topo, sem epígrafe numerada; º lido como 9/2/0, "lº"); "Art. lº" (letra l) não reconhecido, artigos deslocados | 4 | P6 sem relação | fam. |
| 27249 | LC nº 299, de 06 de outubro de 1993 | s/fecho | digitalização re-OCR pelo coletor (texto_de_ocr) | 4 | P2 alteradora de lei de peso | fam. |
| 27350 | ELO nº 4, de 22 de novembro de 1993 | s/fecho, rót, s/dono | digitalização re-OCR pelo coletor (texto_de_ocr) | 4 | P2 alteradora de lei de peso (revogada) | fam. |
| 27386 | ELO nº 5, de 08 de dezembro de 1993 | cab, s/fecho | digitalização re-OCR pelo coletor (texto_de_ocr) | 4 | P2 alteradora de lei de peso | fam. |
| 27395 | ELO nº 6, de 15 de dezembro de 1993 | trecho, rót | digitalização re-OCR pelo coletor (texto_de_ocr) | 4 | P2 alteradora de lei de peso | fam. |
| 27404 | LC nº 303, de 20 de dezembro de 1993 | fora, trecho, rót | texto limpo (DOCX/HTML/PDF digital): técnica antiga ou leitura | 3 | P3 base vigente c/ alteradoras | fam. |
| 27406 | LC nº 305, de 21 de dezembro de 1993 | parcial, cab, trecho, rót | arquivo com 2 documentos: promulgação parcial seguida do autógrafo sancionado | 3 | P5 só lei revogada/sem alvo apurado | sim |
| 27441 | LC nº 308, de 28 de dezembro de 1993 | rót | texto limpo (DOCX/HTML/PDF digital): técnica antiga ou leitura | 3 | P3 base vigente c/ alteradoras | sim |
| 27443 | LC nº 311, de 28 de dezembro de 1993 | cab, s/aspa | digitalização com camada de texto antiga da fonte (autógrafo datilografado: carimbo PROC/PLCL no topo, sem epígrafe numerada; º lido como 9/2/0, "lº") | 4 | P4 alteradora de base vigente | sim |
| 27449 | LC nº 312, de 29 de dezembro de 1993 | fecho+, rót | digitalização re-OCR pelo coletor (texto_de_ocr) | 4 | P3 base vigente c/ alteradoras | fam. |
| 27453 | LC nº 314, de 04 de janeiro de 1994 | cab, s/fecho, trecho | texto limpo (DOCX/HTML/PDF digital): técnica antiga ou leitura | 3 | P2 alteradora de lei de peso | fam. |
| 27459 | LC nº 315, de 06 de janeiro de 1994 | fecho+, rót | digitalização re-OCR pelo coletor (texto_de_ocr) | 4 | P6 sem relação (revogada) | fam. |
| 27475 | LC nº 316, de 20 de janeiro de 1994 | cab, fecho+, tab, fora, trecho, rót, s/dono | digitalização com camada de texto antiga da fonte (autógrafo datilografado: carimbo PROC/PLCL no topo, sem epígrafe numerada; º lido como 9/2/0, "lº") | 4 | P5 só lei revogada/sem alvo apurado (revogada) | fam. |
| 27526 | LC nº 317, de 22 de março de 1994 | rót | digitalização com camada de texto antiga da fonte (autógrafo datilografado: carimbo PROC/PLCL no topo, sem epígrafe numerada; º lido como 9/2/0, "lº") | 4 | P3 base vigente c/ alteradoras | fam. |
| 27569 | LC nº 320, de 02 de maio de 1994 | cab, rót | digitalização com camada de texto antiga da fonte (autógrafo datilografado: carimbo PROC/PLCL no topo, sem epígrafe numerada; º lido como 9/2/0, "lº") | 4 | P1 peso | fam. |
| 27604 | LC nº 323, de 25 de maio de 1994 | cab, s/fecho, rót | texto limpo (DOCX/HTML/PDF digital): técnica antiga ou leitura; rótulos: só ordinal mal lido | 3 | P4 alteradora de base vigente | fam. |
| 27682 | LC nº 325, de 07 de julho de 1994 | cab, fecho+, rót | digitalização re-OCR pelo coletor (texto_de_ocr) | 4 | P5 só lei revogada/sem alvo apurado (revogada) | fam. |
| 27684 | LC nº 326, de 11 de julho de 1994 | cab, s/fecho, s/aspa | digitalização com camada de texto antiga da fonte (autógrafo datilografado: carimbo PROC/PLCL no topo, sem epígrafe numerada; º lido como 9/2/0, "lº") | 4 | P5 só lei revogada/sem alvo apurado (revogada) | sim |
| 27707 | LC nº 328, de 27 de julho de 1994 | cab, fecho+, rót, s/dono | digitalização com camada de texto antiga da fonte (autógrafo datilografado: carimbo PROC/PLCL no topo, sem epígrafe numerada; º lido como 9/2/0, "lº") | 4 | P5 só lei revogada/sem alvo apurado | fam. |
| 27750 | LC nº 329, de 06 de setembro de 1994 | s/aspa | digitalização re-OCR pelo coletor (texto_de_ocr) | 4 | P4 alteradora de base vigente | sim |
| 27784 | ELO nº 7, de 26 de setembro de 1994 | cab, rót, s/aspa | digitalização re-OCR pelo coletor (texto_de_ocr); rótulos: só ordinal mal lido | 4 | P2 alteradora de lei de peso | sim |
| 27875 | LC nº 331, de 25 de novembro de 1994 | rót, s/dono | digitalização com camada de texto antiga da fonte (autógrafo datilografado: carimbo PROC/PLCL no topo, sem epígrafe numerada; º lido como 9/2/0, "lº"); "Art. lº" (letra l) não reconhecido, artigos deslocados | 4 | P2 alteradora de lei de peso | fam. |
| 27924 | LC nº 334, de 27 de dezembro de 1994 | cab, tab, rót | digitalização com camada de texto antiga da fonte (autógrafo datilografado: carimbo PROC/PLCL no topo, sem epígrafe numerada; º lido como 9/2/0, "lº") | 4 | P5 só lei revogada/sem alvo apurado | fam. |
| 27966 | LC nº 336, de 06 de janeiro de 1995 | cab, rót | texto limpo (DOCX/HTML/PDF digital): técnica antiga ou leitura | 3 | P5 só lei revogada/sem alvo apurado (revogada) | fam. |
| 27968 | LC nº 337, de 10 de janeiro de 1995 | cab, s/fecho, rót | digitalização com camada de texto antiga da fonte (autógrafo datilografado: carimbo PROC/PLCL no topo, sem epígrafe numerada; º lido como 9/2/0, "lº") | 4 | P6 sem relação | fam. |
| 27971 | LC nº 338, de 12 de janeiro de 1995 | cab, s/fecho, fora, trecho | texto limpo (DOCX/HTML/PDF digital): técnica antiga ou leitura | 3 | P5 só lei revogada/sem alvo apurado (revogada) | fam. |
| 27972 | LC nº 339, de 12 de janeiro de 1995 | cab, s/fecho | digitalização com camada de texto antiga da fonte (autógrafo datilografado: carimbo PROC/PLCL no topo, sem epígrafe numerada; º lido como 9/2/0, "lº") | 4 | P5 só lei revogada/sem alvo apurado (revogada) | fam. |
| 27973 | LC nº 340, de 12 de janeiro de 1995 | cab, s/fecho, tab, rót | texto limpo (DOCX/HTML/PDF digital): técnica antiga ou leitura | 3 | P3 base vigente c/ alteradoras | fam. |
| 28014 | LC nº 342, de 09 de março de 1995 | cab, rót | digitalização com camada de texto antiga da fonte (autógrafo datilografado: carimbo PROC/PLCL no topo, sem epígrafe numerada; º lido como 9/2/0, "lº"); rótulos: só ordinal mal lido | 4 | P2 alteradora de lei de peso | fam. |
| 28021 | LC nº 344, de 20 de março de 1995 | cab, s/fecho, rót | digitalização com camada de texto antiga da fonte (autógrafo datilografado: carimbo PROC/PLCL no topo, sem epígrafe numerada; º lido como 9/2/0, "lº") | 4 | P2 alteradora de lei de peso | fam. |
| 28032 | ELO nº 9, de 04 de abril de 1995 | cab | digitalização re-OCR pelo coletor (texto_de_ocr) | 4 | P2 alteradora de lei de peso | fam. |
| 28047 | LC nº 346, de 17 de abril de 1995 | cab, rót | digitalização com camada de texto antiga da fonte (autógrafo datilografado: carimbo PROC/PLCL no topo, sem epígrafe numerada; º lido como 9/2/0, "lº") | 4 | P6 sem relação | fam. |
| 28080 | LC nº 347, de 30 de maio de 1995 | cab, s/fecho, rót | arquivo com 2 documentos: promulgação parcial seguida do autógrafo sancionado | 3 | P3 base vigente c/ alteradoras | sim |
| 28092 | LC nº 349, de 13 de junho de 1995 | rót | texto limpo (DOCX/HTML/PDF digital): técnica antiga ou leitura; rótulos: só ordinal mal lido | 3 | P5 só lei revogada/sem alvo apurado (revogada) | fam. |
| 28117 | LC nº 350, de 10 de julho de 1995 | cab, fora, trecho, rót, s/dono | arquivo com 2 documentos: promulgação parcial seguida do autógrafo sancionado | 3 | P3 base vigente c/ alteradoras | sim |
| 28118 | LC nº 351, de 10 de julho de 1995 | cab, s/fecho, fora, trecho, rót, s/dono | digitalização com camada de texto antiga da fonte (autógrafo datilografado: carimbo PROC/PLCL no topo, sem epígrafe numerada; º lido como 9/2/0, "lº"); "Art. lº" (letra l) não reconhecido, artigos deslocados | 4 | P5 só lei revogada/sem alvo apurado (revogada) | fam. |
| 28148 | LC nº 352, de 08 de agosto de 1995 | cab, fecho+, rót | digitalização re-OCR pelo coletor (texto_de_ocr) | 4 | P1 peso | fam. |
| 28156 | LC nº 354, de 23 de agosto de 1995 | cab, tab, rót | texto limpo (DOCX/HTML/PDF digital): técnica antiga ou leitura | 3 | P5 só lei revogada/sem alvo apurado | fam. |
| 28190 | LC nº 356, de 15 de setembro de 1995 | cab | digitalização com camada de texto antiga da fonte (autógrafo datilografado: carimbo PROC/PLCL no topo, sem epígrafe numerada; º lido como 9/2/0, "lº") | 4 | P2 alteradora de lei de peso | fam. |
| 28203 | LC nº 357, de 02 de outubro de 1995 | cab | texto limpo (DOCX/HTML/PDF digital): técnica antiga ou leitura | 3 | P5 só lei revogada/sem alvo apurado | fam. |
| 28289 | LC nº 359, de 29 de novembro de 1995 | cab, s/fecho, rót | digitalização com camada de texto antiga da fonte (autógrafo datilografado: carimbo PROC/PLCL no topo, sem epígrafe numerada; º lido como 9/2/0, "lº") | 4 | P6 sem relação | fam. |
| 28300 | LC nº 360, de 06 de dezembro de 1995 | cab, s/fecho, rót | digitalização com camada de texto antiga da fonte (autógrafo datilografado: carimbo PROC/PLCL no topo, sem epígrafe numerada; º lido como 9/2/0, "lº") | 4 | P5 só lei revogada/sem alvo apurado (revogada) | fam. |
| 28320 | LC nº 361, de 19 de dezembro de 1995 | cab, fecho+, rót | digitalização com camada de texto antiga da fonte (autógrafo datilografado: carimbo PROC/PLCL no topo, sem epígrafe numerada; º lido como 9/2/0, "lº"); "Art. lº" (letra l) não reconhecido, artigos deslocados | 4 | P2 alteradora de lei de peso | fam. |
| 28339 | LC nº 363, de 28 de dezembro de 1995 | cab, rót | texto limpo (DOCX/HTML/PDF digital): técnica antiga ou leitura | 3 | P6 sem relação | fam. |
| 28340 | LC nº 364, de 28 de dezembro de 1995 | cab, fora, trecho, rót, s/dono | texto limpo (DOCX/HTML/PDF digital): técnica antiga ou leitura | 3 | P3 base vigente c/ alteradoras | fam. |
| 28368 | LC nº 367, de 08 de janeiro de 1996 | cab, rót | texto limpo (DOCX/HTML/PDF digital): técnica antiga ou leitura | 3 | P3 base vigente c/ alteradoras | fam. |
| 28369 | LC nº 368, de 08 de janeiro de 1996 | cab, s/fecho, fora, trecho, rót, s/dono | digitalização com camada de texto antiga da fonte (autógrafo datilografado: carimbo PROC/PLCL no topo, sem epígrafe numerada; º lido como 9/2/0, "lº") | 4 | P6 sem relação | fam. |
| 28386 | LC nº 369, de 16 de janeiro de 1996 | cab, rót | texto limpo (DOCX/HTML/PDF digital): técnica antiga ou leitura | 3 | P3 base vigente c/ alteradoras | fam. |
| 28387 | LC nº 370, de 16 de janeiro de 1996 | cab, s/fecho, tab, rót | digitalização com camada de texto antiga da fonte (autógrafo datilografado: carimbo PROC/PLCL no topo, sem epígrafe numerada; º lido como 9/2/0, "lº") | 4 | P6 sem relação | fam. |
| 28392 | LC nº 371, de 18 de janeiro de 1996 | cab, s/fecho, rót | digitalização com camada de texto antiga da fonte (autógrafo datilografado: carimbo PROC/PLCL no topo, sem epígrafe numerada; º lido como 9/2/0, "lº"); "Art. lº" (letra l) não reconhecido, artigos deslocados | 4 | P6 sem relação | fam. |
| 28399 | LC nº 372, de 22 de janeiro de 1996 | cab, s/fecho | texto limpo (DOCX/HTML/PDF digital): técnica antiga ou leitura | 3 | P5 só lei revogada/sem alvo apurado (revogada) | fam. |
| 28404 | LC nº 373, de 25 de janeiro de 1996 | rót | texto limpo (DOCX/HTML/PDF digital): técnica antiga ou leitura | 3 | P6 sem relação | fam. |
| 28496 | LC nº 375, de 24 de maio de 1996 | cab, s/fecho | digitalização com camada de texto antiga da fonte (autógrafo datilografado: carimbo PROC/PLCL no topo, sem epígrafe numerada; º lido como 9/2/0, "lº") | 4 | P6 sem relação | fam. |
| 28539 | LC nº 379, de 24 de junho de 1996 | cab, s/fecho, rót | digitalização com camada de texto antiga da fonte (autógrafo datilografado: carimbo PROC/PLCL no topo, sem epígrafe numerada; º lido como 9/2/0, "lº") | 4 | P5 só lei revogada/sem alvo apurado (revogada) | fam. |
| 28547 | LC nº 380, de 01 de julho de 1996 | cab, s/fecho, rót | texto limpo (DOCX/HTML/PDF digital): técnica antiga ou leitura | 3 | P5 só lei revogada/sem alvo apurado (revogada) | fam. |
| 28637 | LC nº 385, de 18 de setembro de 1996 | fora, s/dono, s/aspa | alteradora de 1996 com aspas de abertura sem fecho em cada bloco ("Art.98 - ..." … sem ”): técnica antiga | 3 | P2 alteradora de lei de peso | sim |
| 28716 | LC nº 388, de 07 de novembro de 1996 | cab, s/fecho | digitalização com camada de texto antiga da fonte (autógrafo datilografado: carimbo PROC/PLCL no topo, sem epígrafe numerada; º lido como 9/2/0, "lº") | 4 | P2 alteradora de lei de peso | fam. |
| 28766 | LC nº 390, de 05 de dezembro de 1996 | s/fecho | texto limpo (DOCX/HTML/PDF digital): técnica antiga ou leitura | 3 | P6 sem relação | fam. |
| 28780 | ELO nº 10, de 13 de dezembro de 1996 | s/fecho | digitalização re-OCR pelo coletor (texto_de_ocr) | 4 | P2 alteradora de lei de peso | fam. |
| 28813 | LC nº 395, de 26 de dezembro de 1996 | s/fecho, rót | texto limpo (DOCX/HTML/PDF digital): técnica antiga ou leitura | 3 | P1 peso | fam. |
| 28858 | LC nº 397, de 13 de janeiro de 1997 | cab, fecho+, rót | digitalização com camada de texto antiga da fonte (autógrafo datilografado: carimbo PROC/PLCL no topo, sem epígrafe numerada; º lido como 9/2/0, "lº") | 4 | P6 sem relação | fam. |
| 28859 | LC nº 398, de 13 de janeiro de 1997 | s/aspa | texto limpo (DOCX/HTML/PDF digital): técnica antiga ou leitura | 3 | P2 alteradora de lei de peso | sim |
| 28863 | LC nº 399, de 14 de janeiro de 1997 | fecho+, rót | digitalização re-OCR pelo coletor (texto_de_ocr) | 4 | P3 base vigente c/ alteradoras | fam. |
| 28977 | LC nº 400, de 27 de junho de 1997 | rót | texto limpo (DOCX/HTML/PDF digital): técnica antiga ou leitura | 3 | P6 sem relação | fam. |
| 29061 | LC nº 402, de 25 de setembro de 1997 | rót | texto limpo (DOCX/HTML/PDF digital): técnica antiga ou leitura | 3 | P5 só lei revogada/sem alvo apurado (revogada) | fam. |
| 29125 | LC nº 404, de 14 de novembro de 1997 | rót | texto limpo (DOCX/HTML/PDF digital): técnica antiga ou leitura | 3 | P5 só lei revogada/sem alvo apurado (revogada) | fam. |
| 29169 | ELO nº 12, de 12 de dezembro de 1997 | cab, rót | digitalização re-OCR pelo coletor (texto_de_ocr) | 4 | P2 alteradora de lei de peso | fam. |
| 29170 | ELO nº 13, de 12 de dezembro de 1997 | cab, s/fecho | digitalização re-OCR pelo coletor (texto_de_ocr) | 4 | P2 alteradora de lei de peso | fam. |
| 29259 | LC nº 410, de 20 de janeiro de 1998 | s/aspa | texto limpo (DOCX/HTML/PDF digital): técnica antiga ou leitura | 3 | P4 alteradora de base vigente | fam. |
| 29309 | LC nº 412, de 24 de março de 1998 | s/fecho | texto limpo (DOCX/HTML/PDF digital): técnica antiga ou leitura | 3 | P2 alteradora de lei de peso | fam. |
| 29316 | LC nº 410, de 02 de abril de 1998 | parcial, s/art, s/fecho, fora, trecho, s/dono | registro próprio da PROMULGAÇÃO PARCIAL; a lei sancionada está no registro 29259 (LC 410/1998) | 3 | P4 alteradora de base vigente | sim |
| 29327 | LC nº 415, de 07 de abril de 1998 | cab, s/fecho, rót | digitalização com camada de texto antiga da fonte (autógrafo datilografado: carimbo PROC/PLCL no topo, sem epígrafe numerada; º lido como 9/2/0, "lº") | 4 | P5 só lei revogada/sem alvo apurado (revogada) | fam. |
| 29409 | LC nº 417, de 10 de junho de 1998 | s/aspa | texto limpo (DOCX/HTML/PDF digital): técnica antiga ou leitura | 3 | P2 alteradora de lei de peso | fam. |
| 29418 | LC nº 418, de 16 de junho de 1998 | rót | texto limpo (DOCX/HTML/PDF digital): técnica antiga ou leitura | 3 | P6 sem relação | fam. |
| 29490 | ELO nº 14, de 10 de agosto de 1998 | cab, s/fecho, s/dono | digitalização re-OCR pelo coletor (texto_de_ocr) | 4 | P2 alteradora de lei de peso | fam. |
| 29512 | LC nº 420, de 25 de agosto de 1998 | tab | texto limpo (DOCX/HTML/PDF digital): técnica antiga ou leitura | 3 | P1 peso | sim |
| 29528 | LC nº 422, de 09 de setembro de 1998 | s/aspa | texto limpo (DOCX/HTML/PDF digital): técnica antiga ou leitura | 3 | P2 alteradora de lei de peso | fam. |
| 29544 | LC nº 424, de 18 de setembro de 1998 | cab, s/fecho | digitalização com camada de texto antiga da fonte (autógrafo datilografado: carimbo PROC/PLCL no topo, sem epígrafe numerada; º lido como 9/2/0, "lº") | 4 | P2 alteradora de lei de peso | fam. |
| 29581 | LC nº 425, de 13 de outubro de 1998 | s/aspa | texto limpo (DOCX/HTML/PDF digital): técnica antiga ou leitura | 3 | P2 alteradora de lei de peso | fam. |
| 29705 | LC nº 426, de 29 de dezembro de 1998 | s/aspa | texto limpo (DOCX/HTML/PDF digital): técnica antiga ou leitura | 3 | P2 alteradora de lei de peso | fam. |
| 30198 | ELO nº 15, de 26 de novembro de 1999 | cab, s/art, s/fecho | digitalização re-OCR pelo coletor (texto_de_ocr) | 4 | P2 alteradora de lei de peso | sim |
| 30209 | LC nº 434, de 01 de dezembro de 1999 | fecho+, tab, fora, trecho, rót | texto-base é COMPILAÇÃO da fonte (não o texto sancionado); rótulos "-A" desalinham a numeração por posição | 3 | P1 peso (revogada) | sim |
| 30298 | LC nº 437, de 29 de dezembro de 1999 | rót, s/aspa | texto limpo (DOCX/HTML/PDF digital): técnica antiga ou leitura | 3 | P5 só lei revogada/sem alvo apurado | fam. |
| 30483 | LC nº 445, de 19 de abril de 2000 | fora, trecho, rót, s/dono | texto limpo (DOCX/HTML/PDF digital): técnica antiga ou leitura | 3 | P4 alteradora de base vigente | sim |
| 30519 | LC nº 447, de 10 de maio de 2000 | rót | texto limpo (DOCX/HTML/PDF digital): técnica antiga ou leitura | 3 | P3 base vigente c/ alteradoras | fam. |
| 30641 | LC nº 450, de 06 de julho de 2000 | s/aspa | texto limpo (DOCX/HTML/PDF digital): técnica antiga ou leitura | 3 | P6 sem relação | sim |
| 30698 | LC nº 451, de 28 de julho de 2000 | rót | texto limpo (DOCX/HTML/PDF digital): técnica antiga ou leitura | 3 | P5 só lei revogada/sem alvo apurado | fam. |
| 30711 | LC nº 453, de 02 de agosto de 2000 | s/aspa | texto limpo (DOCX/HTML/PDF digital): técnica antiga ou leitura | 3 | P5 só lei revogada/sem alvo apurado | fam. |
| 30749 | LC nº 455, de 01 de setembro de 2000 | rót | texto limpo (DOCX/HTML/PDF digital): técnica antiga ou leitura | 3 | P3 base vigente c/ alteradoras | fam. |
| 30834 | ELO nº 16, de 10 de outubro de 2000 | data, s/aspa | digitalização re-OCR pelo coletor (texto_de_ocr) | 4 | P2 alteradora de lei de peso | sim |
| 30950 | LC nº 459, de 07 de dezembro de 2000 | cab, s/fecho | epígrafe da fonte "Nº 489, dt 07 de dexembro da 2000" (catálogo: 459): erro de digitação na fonte | 3 | P5 só lei revogada/sem alvo apurado | sim |
| 31004 | LC nº 460, de 22 de dezembro de 2000 | rót | texto limpo (DOCX/HTML/PDF digital): técnica antiga ou leitura | 3 | P5 só lei revogada/sem alvo apurado (revogada) | fam. |
| 31027 | LC nº 461, de 28 de dezembro de 2000 | rót | texto limpo (DOCX/HTML/PDF digital): técnica antiga ou leitura | 3 | P3 base vigente c/ alteradoras | fam. |
| 31066 | LC nº 463, de 23 de janeiro de 2001 | parcial, cab, s/fecho, fora, trecho, rót, s/dono | registro traz só a PROMULGAÇÃO PARCIAL (veto derrubado), não a lei inteira | 4 | P6 sem relação | sim |
| 31373 | LC nº 465, de 23 de agosto de 2001 | fora, trecho, s/aspa | texto limpo (DOCX/HTML/PDF digital): técnica antiga ou leitura | 3 | P4 alteradora de base vigente | fam. |
| 31404 | LC nº 466, de 06 de setembro de 2001 | rót | texto limpo (DOCX/HTML/PDF digital): técnica antiga ou leitura | 3 | P3 base vigente c/ alteradoras | fam. |
| 31419 | ELO nº 17, de 14 de setembro de 2001 | s/art, s/fecho, fora, s/dono | digitalização re-OCR pelo coletor (texto_de_ocr) | 4 | P2 alteradora de lei de peso | sim |
| 31725 | LC nº 471, de 02 de janeiro de 2002 | rót | texto limpo (DOCX/HTML/PDF digital): técnica antiga ou leitura | 3 | P2 alteradora de lei de peso | fam. |
| 31736 | LC nº 472, de 07 de janeiro de 2002 | rót | texto limpo (DOCX/HTML/PDF digital): técnica antiga ou leitura | 3 | P5 só lei revogada/sem alvo apurado | fam. |
| 31822 | LC nº 473, de 02 de abril de 2002 | cab, s/art, s/fecho | fonte sem texto (HTML do SIREL só com título; extração "texto_curto") | 4 | P6 sem relação (revogada) | fam. |
| 32105 | LC nº 478, de 26 de setembro de 2002 | parcial, s/art, s/fecho | registro traz só a PROMULGAÇÃO PARCIAL (veto derrubado), não a lei inteira | 4 | P1 peso | sim |
| 32299 | LC nº 482, de 26 de dezembro de 2002 | parcial, rót | registro traz só a PROMULGAÇÃO PARCIAL (veto derrubado), não a lei inteira (OCR) | 4 | P3 base vigente c/ alteradoras | sim |
| 32300 | LC nº 482, de 26 de dezembro de 2002 | parcial, rót | registro traz só a PROMULGAÇÃO PARCIAL (veto derrubado), não a lei inteira (OCR); mesmo texto de 32299 (sha igual) | 4 | P3 base vigente c/ alteradoras | sim |
| 32661 | LC nº 493, de 19 de agosto de 2003 | rót | texto limpo (DOCX/HTML/PDF digital): técnica antiga ou leitura | 3 | P6 sem relação | fam. |
| 32958 | LC nº 501, de 30 de dezembro de 2003 | fecho+, fora, trecho, rót, s/dono | texto limpo (DOCX/HTML/PDF digital): técnica antiga ou leitura | 3 | P3 base vigente c/ alteradoras | sim |
| 33244 | ELO nº 21, de 11 de junho de 2004 | cab, s/art, s/fecho | fonte sem texto (HTML do SIREL só com título; extração "texto_curto") | 4 | P2 alteradora de lei de peso | fam. |
| 33620 | LC nº 519, de 29 de dezembro de 2004 | fecho+, trecho, rót | digitalização com camada de texto antiga da fonte (autógrafo datilografado: carimbo PROC/PLCL no topo, sem epígrafe numerada; º lido como 9/2/0, "lº"); rótulos: só ordinal mal lido | 4 | P3 base vigente c/ alteradoras | sim |
| 34065 | LC nº 534, de 28 de dezembro de 2005 | rót | texto limpo (DOCX/HTML/PDF digital): técnica antiga ou leitura | 3 | P1 peso (revogada) | fam. |
| 34079 | LC nº 540, de 29 de dezembro de 2005 | s/aspa | texto limpo (DOCX/HTML/PDF digital): técnica antiga ou leitura | 3 | P4 alteradora de base vigente | fam. |
| 34142 | LC nº 544, de 26 de janeiro de 2006 | data | epígrafe e fecho dizem 25/01/2006, catálogo 26/01 (decisão 2: revisor) | 3 | P2 alteradora de lei de peso | sim |
| 34476 | ELO nº 24, de 31 de agosto de 2006 | cab | texto limpo (DOCX/HTML/PDF digital): técnica antiga ou leitura | 3 | P2 alteradora de lei de peso | fam. |
| 35288 | LC nº 584, de 27 de dezembro de 2007 | rót | texto limpo (DOCX/HTML/PDF digital): técnica antiga ou leitura | 3 | P3 base vigente c/ alteradoras | fam. |
| 35931 | LC nº 604, de 29 de dezembro de 2008 | data | epígrafe diz "2009" (erro de digitação da fonte), catálogo 2008 | 3 | P6 sem relação (revogada) | sim |
| 35933 | LC nº 606, de 29 de dezembro de 2008 | alt s/aspas | texto limpo (DOCX/HTML/PDF digital): técnica antiga ou leitura | 3 | P5 só lei revogada/sem alvo apurado | sim |