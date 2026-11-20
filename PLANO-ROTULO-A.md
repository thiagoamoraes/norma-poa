# PLANO-ROTULO-A — causas de `rotulo_nao_confere_com_a_origem` (metade A: 27 normas recentes)

Pesquisa somente leitura (regras 6 e 12 do CLAUDE.md). Nada do repositório foi alterado além deste arquivo. Todos os consertos abaixo foram provados em **cópia** no scratchpad, sobre as 823 normas de `dados/textos/sapl` que têm registro no catálogo. A resposta deste relatório é insumo, não autoridade: quem integra confere de novo e roda a bateria.

Artefatos de prova (scratchpad, fora do git):
- `.../scratchpad/patch-rotulo-core.diff` (132 linhas, `norma-core.js`) e `patch-rotulo-extracao.diff` (11 linhas, `ingestao/extracao-texto.mjs`).
- `.../scratchpad/w` (cópia com os consertos) e `.../scratchpad/w0` (cópia original) com `full.mjs` (compara dispositivos, texto preparado, motivos e avisos das 823).

## 1. O que o motivo realmente mede (achado central)

`atribuirDesFixoOriginal` (norma-core.js:1165) dá o rótulo de **toda** norma publicada **por posição** (o n-ésimo artigo vira "Art. n", o n-ésimo inciso vira o romano n, a n-ésima alínea vira a letra n). `conferirConservacao` (estrutura.mjs:93-128) compara esse rótulo posicional com o que está escrito antes do trecho. Logo, o motivo dispara sempre que **o leitor perdeu ou ganhou um dispositivo** no meio da lista, ou que **a lei pulou/repetiu número**. É um alarme legítimo de deslocamento, não uma comparação de grafia. Consequência: em 1 dispositivo perdido, **todos os seguintes** divergem (49557 chegou a 293 divergências por causa de **um** inciso perdido).

Nenhuma das 27 normas é falso positivo "puro" da heurística `antes.endsWith(marca)`. Há um componente E real e pequeno (seção 4, causa E).

## 2. Tabela causa × contagem × ids (27 normas, uma causa principal por norma)

| Causa | Qtde | Ids | Conserto |
|---|---|---|---|
| **D** bug do leitor (conserto provado) | 8 | 51486, 38364 (romano > XXV); 49557 (romano > XXV **e** XXXVIII com 7 letras); 36114, 40278 (citação "§ N ..." no início de linha lida como parágrafo); 41876, 36373 (introdução "conforme / segue:" partida em duas linhas); 48003 ("( NR)" com espaço) | D1-D4 abaixo |
| **A** extração/preparo | 5 | 40111 (hifenização "milési-/mo)"); 44305, 44307 (digitalização ruim: "Art. 2"", "o o", "Art. I"); 37422, 37517 (espaços espúrios dentro de palavra e de romano: "X VIII –") | só 40111 tem conserto seguro (A1); os outros 4, nenhum |
| **A ou B, indeterminável sem o .docx bruto** | 4 | 37043, 36634, 37041, 36647 (todas DOCX; dispositivo colado no fim da linha anterior: "... Educação. § 1º VETADO.", "de 1 III –", "Art. 32. Ficam revogados: I –", "(NR) Art. 23.") | nenhum (ver seção 6) |
| **B** defeito de fonte (lei malformada) | 8 | 42356 (inciso "V" no lugar de VII), 38249 ("XI" no lugar de IX); 44376 (aspa de fecho no lugar errado); 39825, 51463 (aspa de fecho ausente: fecho achado é o do bloco seguinte); 37352, 39258 (bloco sem fecho nenhum); 38041 (documento 3 vezes no mesmo arquivo + "Parágrafo único" fora das aspas) | nenhum seguro; 39825/37352/39258 têm conserto **opcional** que exige decisão (seção 3, F e G) |
| **C** forma legítima que o leitor não entende | 2 | 42407 (alíneas depois de "z" escritas "aa, ab, ac..."; o motor gera "aa, bb, cc"); 43376 (alteradora sem aspas, decisão 6; já tem `alteracao_sem_aspas_nao_delimitada`) | decisão do mantenedor (seção 5) |
| **E** falso positivo da conferência | 0 principal, 2 componentes (38041, 43376) | trecho de omissão só com pontos (alnum vazio) | sem conserto proposto (seção 4) |

Resultado dos consertos D1-D4 + A1 sobre as 27: **9 perdem o motivo** (51486, 49557, 48003, 41876, 40278, 40111, 38364, 36373, 36114). **8 viram "aceita"** (51486, 49557, 48003, 41876, 40278, 40111, 36373, 36114; 38364 continua `revisar` por outros motivos). Restam 18 com o motivo, todos com causa B, C, A-sem-conserto ou indeterminável.

## 3. Evidências e consertos, por causa

### D1. `ROM` só vai até XXV — norma-core.js:79-82
`roman(26)` devolve "26" (e `String(n)`), então o 26º inciso nasce com rótulo `26 –`, sem slug (`dispositivo_sem_rotulo`, `endereco_repetido`).
- 51486: `"26 –" <- "XXVI"`. 38364 e 40111: idem (`"26 –" <- "XXVI"`, `"27 –" <- "XXVII"`).
- Conserto (aditivo): completar `ROM` de forma algorítmica até 399 (patch no `.diff`). `romanToInt`/`romVal` passam a reconhecer > XXV (antes devolviam `null`).
- Efeito: some `dispositivo_sem_rotulo` + `endereco_repetido` em 28813, 36641, 38364, 40111, 44398, 49557, 51486 e o motivo de rótulo em 38364, 44398, 51486.

### D2. Regex de inciso limitada a 6 letras romanas — norma-core.js:620, 851, 943, 1583, 1668
`XXXVIII` (38) tem 7 letras e **não é lido como inciso**; o texto cai no inciso anterior e toda a lista seguinte desloca.
- 49557 (LC 1.025/2024, revogação de leis): origem `XXXVIII – Lei Complementar nº 125, de 4 de novembro de 1985;` some; `"XXXVIII –" <- "XXXIX"` e mais 244 divergências. Também afeta 78 (LXXVIII), 83, 88 etc.
- Conserto: `{1,6}` → `{1,9}` nos 5 pontos (sed simples). O resultado de D1 + D2 em 49557: zero divergências, `aceita`, 6 artigos e 434 incisos conferidos (434 = 434 linhas "I –..." fora de bloco, contagem independente por regex no texto).

### D3. "§ N ..." no início de linha que é só citação — norma-core.js:751 (`rePar`)
A quebra de linha da fonte deixa "§ 1º deste artigo." / "§ 5º do art. 2º." no começo da linha e o parser cria um parágrafo.
- 36114 (LC 614/2009): origem `... derrogação do art. 4º e do` / `§ 1º deste artigo.` → motor cria `§ 3º` com texto "deste artigo.". `"§ 3º" <- "1º"`.
- 40278 (LC 773/2013): `... conforme previsto no` / `§ 5º do art. 2º.` → `"§ 1º" <- "5º"` e depois `"§ 2º" <- "Parágrafoúnico"`.
- Conserto: tratar `rePar` como citação (continuação do dispositivo anterior) quando **as duas** condições valem: (a) o que vem depois do número começa em minúscula; (b) a linha anterior termina em artigo/preposição/conjunção (`o a os as do da dos das no na nos nas ao aos à às e ou pelo pela pelos pelas`). Rótulo real vem depois de frase completa e seguido de maiúscula/"VETADO".
- Efeito colateral bom: some o aviso espúrio `paragrafo_numerado_sem_irmao` em 28289, 30209, 34244, 38274 (eram "§ 1º" citados); o parágrafo-fantasma sai também da Lei Orgânica (25277, art. 46: `par-7` "deste artigo." — o resto do art. 46 deixava de ter rótulo correto).
- Negativos provados (seção 7): "§ 3º" real depois de "§ 1º" continua acusado.

### D4. Introdução "conforme segue:" partida ou colada — norma-core.js:844-850 (`detectNRCandidates`)
O bloco entre aspas só é delimitado se a linha de abertura vem depois de um cue (`CMD_CUE`). Quando o cue está partido, o bloco inteiro some e **os artigos inseridos viram artigos da alteradora**.
- 41876 (LC 838): `... e as als. a e b e fica incluída al. c, conforme` / `segue:` / `“TABELA IV`. O bloco `“TABELA IV` não é delimitado; "XV – Estudo de Viabilidade..." vira inciso "I" do art. 26. `"I –" <- "XV"`.
- 36373 (LC 631/2009): `conforme se` / `gue:` / `“Subseção IV-A`. Art. 37-A e 37-B viram "Art. 15/16", 19 divergências.
- 37629 (do outro lote; LC 681/2011): `conforme` / `segue:` / `“Seção IV-A`; o bloco engolia 55 dispositivos (de 57 para 2, **correto**: a alteradora só tem 2 artigos). Passou a `aceita`.
- 39221 e 39227 (cue colado "conformesegue:"): o bloco `“Define índices...”`/`“Institui...” (NR)` agora fica em `blocoDeAlteracao` em vez de grudar no texto do art. 1º.
- Conserto: acrescentar `prev2` (linha anterior à anterior) e testar `conforme\s*segue` sobre `prev2+" "+prev` e `prev2+prev`; e `conforme\s+segue` → `conforme\s*segue` em `CMD_CUE`. **Só `conforme segue`** na junção das duas linhas: ampliar o teste de junção a todo `CMD_CUE` fez 29169 (EC 12, de 1997, OCR) ganhar `texto_fora_da_arvore`+`trecho_nao_localizado_na_origem` (motivo novo; descartado).
- Observação: 36647 também tem "confor"/"me segue:", mas continua com o motivo por causa do "(NR) Art. 23." colado (causa A/B).

### D5. "( NR)" com espaço — norma-core.js:880, 892, 924, 868 (`\(NR\)`)
- 48003 (LC 1.005/2024) é o caso que `teste_revisao.mjs` usa como "rótulo divergente real" (linhas 29-36 e 98). Origem: `.” ( NR)`. Como o regex de fecho exige `(NR)` sem espaço, o bloco de `“Art. 6º ......` só fecha 18 linhas depois, e engole os Arts. 10 e 11 da alteradora: `"Art. 10." <- "Art12"`, `"Art. 11." <- "Art13"`, `"Art. 12." <- "Art14"`.
- Conserto: `\(NR\)` → `\(\s?NR\)` nos 4 lugares (`( NR)` ocorre em 3 arquivos do acervo: 37358, 37422, 48003; só 48003 muda de resultado).
- **Atenção:** `teste_revisao.mjs` quebra (TypeError em `div[0].naOrigem`, linha 33) porque o caso real que ele usa deixa de divergir. O teste precisa trocar de exemplo (opção: 44376 = LC 957/2022, `lc957_2022`, que continua divergindo por defeito de fonte, ou 51463 = LC 1.074/2026) ou passar a usar texto sintético com o `( NR)`. É exatamente a regra 5 ao contrário: o teste antigo deixa de falhar contra o código novo, e o teste novo tem de falhar contra o antigo.

### A1. Hifenização que deixa "mo)" como alínea — ingestao/extracao-texto.mjs:183 (`desfazerHifenizacao`)
- 40111 (LC 765/2013): `... (um mil, quatrocentos e trinta e um décimos de milési-` / `mo) vezes o valor ...` — `mIni[2] === ')'` aborta a junção, e "mo)" vira alínea `a)` do inciso. `"a)" <- "mo"`.
- A guarda `)` existe para não juntar rótulo de alínea ("a)") a uma linha que termina em hífen. Conserto: manter a guarda só se a continuação é **1 letra** ou **letra dobrada** (`aa)`, `bb)`): `(mIni[2] === ')' && (mIni[1].length === 1 || mIni[1][0] === mIni[1][1]))`.
- Efeito no acervo: 17 textos preparados mudam. Conferi **as 45 ocorrências** de "palavra-" + quebra + "xx)" em todo o acervo: todas são fechamento de palavra (`meta|de)`, `cen|tavos)`, `re|ais)`, `quilogra|mas)`, `mis|ta)` etc.; "Habite|se)" continua com hífen, pelo `ENCLITICOS`). Nenhum rótulo de alínea real foi juntado.

## 4. Causa E (falso positivo da conferência) — sem conserto

`conferirConservacao`, estrutura.mjs:112: `const pos = a ? origem.indexOf(a, cursor) : cursor;`. Quando o trecho tem alnum vazio (dispositivo só de pontos, `Parágrafo único ......`, `§ 1º ......`), `pos == cursor` e o rótulo é conferido contra o que vem **antes** do cursor, mas o rótulo ainda está **depois** dele. Dispara em 38041 (única divergência dela), 43376 (1 de 26), e em 36400, 39138, 42401, 51485 (outras metades/lote B) mais 6 antigas.
- Conserto "ingênuo" (checar o rótulo depois do cursor) **afrouxa** a conferência: "I" casaria com "II" (a comparação é por alnum, sem delimitador). Conserto sem afrouxar: guardar o item pendente e exigir, quando o próximo trecho com texto é localizado, que a lacuna entre os dois seja **exatamente** a concatenação dos rótulos pendentes (com prefixo opcional "Art/Artigo/Parágrafo"). Não implementei: rende pouco (nenhuma norma recente perde **todo** o motivo só por isso, além de 38041, que ainda tem `bloco_de_alteracao_sem_dono`) e mexe na conferência. Registro como opção de baixa prioridade.

## 5. O que é decisão do mantenedor (prática legislativa), não código

1. **Alíneas depois de "z"**: o motor gera "aa, bb, cc" (`alphaLabel`, norma-core.js:93). No acervo há as duas práticas: dobrada (35326, 37945, 38217, 44398) e sequencial "aa, ab, ac" (42407 com 12 divergências, 42215). Decidir: (a) o motor segue o que a lei fez (rótulo escrito, como no § sozinho e na renumeração, decisão de 17/11/2026) ou (b) fica a convenção e a divergência permanece como alarme. Hoje (b) obriga a revisão humana de toda norma que passe de 26 alíneas por uma escolha de redação. Não mexi.
2. **Bloco de alteração sem fecho de aspas e sem "(NR)"** (37352, 39258, 39825, 51463): a decisão 9 já permite inferir a fronteira e marcar `bloco_sem_fechamento_de_aspas`. Duas extensões testadas, **ambas adicionam o motivo `bloco_sem_fechamento_de_aspas` a normas que hoje não o têm, então não estão no pacote recomendado**:
   - **F (cerca do próximo artigo mais permissiva)**: `Art. 2º Esta ...` e `Art. 2° Esta` (sem ponto/traço depois do número) passam a servir de cerca (norma-core.js:897, `\s+[A-ZÀ-Ú]`). Cura 37352, 38051 (lote B) e 39258 do motivo de rótulo; mas adiciona `bloco_sem_fechamento_de_aspas` a 30834 e 41179 (antigas/já em revisão), **34079 (antiga, hoje `aceita`, passaria a `revisar`)**, 37352, 38051, 39258 (6 normas ganham motivo). Possível "descoberta" de falso aceite em 34079 (terceiro bloco sem fecho), mas é decisão sua.
   - **G (fecho achado atravessa o próximo artigo)**: quando entre a abertura e o fecho achado existe `Art. n+1` seguido de nova introdução e nova abertura de aspas, o fecho é do bloco seguinte. Cura 39825 e 29259 (antiga); adiciona o motivo a 30298 (antiga) e 36841 (recente, já muito quebrada). Na ramificação "sem abertura" (51463) **piora** (perde a delimitação e ganha `alteracao_sem_aspas_nao_delimitada`); então só vale para o ramo principal. Prova guardada em `norma-core.cruza-main.js`.
3. **Convenção de rótulo da alteradora com artigo suprimido da fonte** (51463: Art. 20 sem aspas de abertura e sem fecho, Art. 21 com bloco): não há como inferir a fronteira certa; fica para o revisor (decisão 12).
4. **DOCX com dispositivo colado** (37043, 36634, 37041, 36647): se o `.docx` bruto confirmar que é parágrafo único no Word, é defeito de fonte e fica para o revisor. Se o conversor perde quebra, é bug (A). Ver seção 6.

## 6. O que não consegui verificar

- Os `.docx` brutos não estão no repositório (`dados/_bruto` fora do git), então não distingo "texto colado no Word" de "perda de quebra no `docxParaTexto`" (extracao-texto.mjs:107-124 trata `</w:p>`, `<w:br/>`, `<w:cr/>`; não trata `w:txbxContent` aninhado, hipótese que não consegui descartar). Vale um olhar em 1 desses 4 arquivos abrindo o DOCX original.
- 44305 e 44307 (EC 43 e 42): camada de texto de digitalização ("Art. I", "º" solto na linha de cima); o PDF bruto também não está aqui. A regra do projeto (OCR nunca corrigido à mão nem por regra) vale; sugestão é passar por `ocr.mjs`, mas não testei (teste de OCR pula sem tesseract).
- 38041: confirmei só pelos 3 conjuntos de blocos idênticos (linhas 26-88, 183-288, 339-443). Não comparei as 3 cópias linha a linha; a 3ª parece ter pequenas diferenças de espaçamento (mesma família das ids 38364 e 37136 da decisão 24).
- Não rodei o dashboard (`gerar-revisao.mjs`) nem o `estruturar.mjs`. Os motivos vêm de `estruturarNorma` chamada direto sobre `prepararTextoExtraido`; reproduz os 27 do `rot_a.json` (e os 151 do acervo inteiro, 53 recentes), mas **não** regravei `dados/estruturado/`. Se o conserto entrar, subir `VERSAO_ESTRUTURADOR` (hoje 13).

## 7. Prova do conserto proposto (pacote D1-D5 + A1, sem F/G)

Bateria (cópia do repositório, `rep0` = original, `rep1` = com os patches): todos os testes do CLAUDE.md que rodam sem rede passam **iguais** nas duas: regressão 47, vetado 13, peças 2-3 30, lei publicada 11, peça 4 29, URN 7, gruposAntes 16, promulgação parcial 72, estrutura 62, referências alvo 27, blocos sem aspas 26, emenda LO 12, nr linha seguinte 9, item continuação 4, ruído de página 11, agrupadores 12, versionamento 34, histórico 24, minuta 33, leis ordinárias 20, textos SAPL 36, situação 18. `normateste.mjs`: saída **idêntica byte a byte**. **Única diferença: `teste_revisao.mjs` quebra** (seção 3, D5), pelo motivo acima.

Sobre as 823 normas (`full.mjs`), original × consertado:
- **Motivos novos: 0.** Avisos novos: 0 (4 avisos `paragrafo_numerado_sem_irmao` somem: 28289, 30209, 34244, 38274, eram citações lidas como parágrafo).
- Motivo `rotulo_nao_confere_com_a_origem`: **151 → 138** normas (recentes **53 → 41**; 12 recentes curadas: as 9 da metade A mais 44398, 37629 e 36641/outras da metade B, ver `rot_b.json`).
- Normas `aceita`: 570 → 582 (+12: 29512, 36114, 36373, 36641, 37629, 40111, 40278, 41876, 44398, 48003, 49557, 51486). Verificação independente de cada uma das 12: contagem de linhas `Art. N` e `romano –` fora de bloco no texto de origem = nº de artigos e incisos produzidos (ex. 49557: 6 artigos, 434 incisos; 48003: 14 artigos; 37629: 2 artigos e 1 bloco, correto).
- Dispositivos mudaram em 33 normas; auditei por amostra (25277, 39221, 39227, 43376, 28289, 30209, 34244, 38274, 37629): todas melhoram (parágrafos-citação saem, blocos de ementa passam para `blocoDeAlteracao`, 37629 de 57 para 2 dispositivos). Texto preparado muda em 17 (todas junções de hifenização, A1).

**Casos negativos (a conferência continua acusando erro real; script `neg.mjs`, cópia consertada):**
- Artigo pulado (Art. 1º → Art. 3º): `Art. 2º <- Art3º`, acusa.
- 27 incisos corretos + "XXIX" no lugar de XXVIII: `XXVIII – <- XXIX`, acusa. (O código antigo acusava com ruído: `dispositivo_sem_rotulo`, `endereco_repetido`.)
- Lista de 40 incisos corretos até XL: aceita (o código antigo reprovava com 14 divergências falsas).
- Parágrafo pulado (§ 1º → § 3º) e "§ 3º" depois de linha sem conectivo: `§ 2º <- 3º`, acusa.
- Citação "§ 1º deste artigo." depois de "e do": passa a ser continuação, não parágrafo.
- Reais que continuam acusando: 42356 (V no lugar de VII), 38249 (XI no lugar de IX), 44376 (aspa fora do lugar).

Cada conserto, sozinho, tem pelo menos um caso real que falha contra o código antigo (regra 5): D1 51486/38364; D2 49557; D3 36114/40278; D4 41876/36373/37629; D5 48003; A1 40111.

## 8. Riscos

- D1/D2 alteram `romanToInt`/`romVal` (agora > 25) e as regex de inciso. A bateria e as 823 normas não mostram efeito colateral; ainda assim é mudança no core, com `reInc` duplicado em 620 e 1583 (a de 1583 é de outra função: conferi que o conjunto de 5 trocas é coerente, não que 1583 tenha caso real que o exija).
- D3 é heurística de duas condições; falso positivo seria um parágrafo real começado em minúscula depois de linha terminada em "e/o/a/do...". Não achei nenhum no acervo (33 normas têm "§ N" + minúscula no início de linha; todas citações ou lixo de OCR antigo). Recomendo que o teste novo inclua um negativo com "§ 2º" legítimo depois de ponto.
- D4 só amplia o cue "conforme segue"; o risco é um bloco entre aspas passar a ser delimitado e mudar o resultado de uma norma antiga com texto livre (visto em 29169 quando ampliei demais; restringido).
- D5 e A1 são mínimos.
- Subir `VERSAO_ESTRUTURADOR` reabre decisões humanas só quando o veredito muda (decisão 7); as 12 que viram `aceita` são as que mais mudam.

## 9. Ordem de ataque recomendada

1. **D1+D2** (romanos): maior alcance (7 normas perdem `dispositivo_sem_rotulo`+`endereco_repetido`, 49557 perde 245 divergências), risco baixíssimo.
2. **D5** (`( NR)`): 1 linha, mas obriga a trocar o exemplo de `teste_revisao.mjs` antes (decisão sobre qual caso real fica como "rótulo diverge").
3. **A1** (hifenização) e **D3** (citação de §): pequenos, com caso real e negativo.
4. **D4** (cue partido): maior ganho estrutural (37629 de 57 dispositivos falsos para 2), mas muda a delimitação de bloco em 5 normas; conferir 39221/39227.
5. Decisões do mantenedor (seção 5): alíneas após "z"; extensões F/G; DOCX.
6. Por último, E (conferência de trecho vazio), se ainda valer.

Cada passo: bateria antes e depois, `normateste.mjs` byte a byte, teste novo que falha no código antigo (`teste_estrutura.mjs` ou novo `.mjs` com texto real), `CHANGELOG.md`, e `VERSAO_ESTRUTURADOR` +1 uma vez só ao final.
