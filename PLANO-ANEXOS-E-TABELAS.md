# PLANO — Anexos e tabelas (decisão 33)

Relatório de pesquisa e planejamento, somente leitura. Nenhum código de produção foi escrito; nada foi commitado.
Medições feitas sobre `dados/textos/sapl/*.txt` (823 normas) e `dados/estruturado/sapl/*.json`, com scripts temporários no scratchpad.
Tudo aqui é **insumo, não decisão** (regra 12). Perguntas ao mantenedor estão na seção 7.

## 0. Limites da medição (ler primeiro)

1. **O acervo de texto medido tem só 823 normas: 8 Lei Orgânica/pré-1990 (tipo 1), 52 Emendas à LO (tipo 2) e 763 Leis Complementares (tipo 6).** Nenhuma lei ordinária (tipo 5, 15.160 registros no catálogo) tem texto extraído neste checkout. As leis orçamentárias (LOA, LDO, PPA) são leis ordinárias; **não há texto de nenhuma delas** (só 10 leis ordinárias em `fixtures/leis-ordinarias/`, nenhuma orçamentária, nenhuma com tabela). Portanto o problema mais pesado (orçamento) é **medido só pelo catálogo**, não pelo texto.
2. Os arquivos brutos (`dados/_bruto/`) não estão no checkout. A forma como a extração trata DOCX/HTML foi lida no código (`docxParaTexto`, `htmlSirelParaTexto`) e confirmada no texto já extraído; a demonstração do HTML foi feita com uma entrada sintética de 1 tabela (comportamento do código, não dado real).
3. Classificação de "tipo de anexo" é por heurística (regex de cabeçalho estrito + métricas de colunas) com inspeção manual de amostras; dois falsos positivos foram retirados à mão (ids 51485, prosa; 32356, bloco de alteração dentro de artigo). Há margem de erro de poucas normas.
4. Verificação independente parcial: `grep -E` de linha só com "ANEXO [N]" acha 47 arquivos; o detector estrito acha 52 (inclui títulos com texto). Ver 1.1.
5. Datas: "recente" = data do catálogo ≥ 03/02/2009 (corte do projeto).

## 1. Anexos no acervo

### 1.1 Contagem

| Medida | Total | Recentes | Antigas |
|---|---|---|---|
| Normas com linha de cabeçalho de anexo (regex estrita, sem 2 falsos positivos) | 52 | 48 | 4 |
| Anexos (segmentos "ANEXO …" até o próximo) nessas normas | 177 | — | — |
| Normas com aviso `tem_anexo` hoje | 50 | — | — |
| `tem_anexo` que o estrito não confirma (prosa/índice) | 3 (30209, 32356, 43471) | | |
| Anexo real **sem** aviso `tem_anexo` (cabeçalho "Anexo 1", "Anexo I", `“ANEXO`) | 5 (36255, 39008, 39395, 40084, 40148) | | |
| Situação das 52: aceita / revisar | 39 / 13 | rec: 37 / 11 | ant: 2 / 2 |

(O aviso `tem_anexo` usa `/^\s*ANEXO\b/m` sensível a maiúsculas: perde "Anexo 1" e `“ANEXO`, e dispara em índice de anexos e linha de prosa.)

Menções de anexo/tabela/quadro/mapa/planta na **ementa do catálogo inteiro** (16.328 registros): 994 (925 leis ordinárias, 69 LC; 778 recentes), das quais só 45 têm texto aqui. "Anexo" sozinho na ementa: 774 (729 ordinárias). Ementa orçamentária (LOA/LDO/PPA e alterações): **191** registros (182 ordinárias, 63 recentes), 6 com texto (EC/LC, não as leis orçamentárias).

### 1.2 Tipo de cada anexo (por anexo; um mesmo ato pode ter vários tipos)

| Tipo | Anexos | Normas (rec) | Ids |
|---|---|---|---|
| V. Só título, sem texto extraído (mapa, planta, figura, croqui em imagem) | 62 | 19 (18) | 29512, 37491, 38673, 38982, 39008, 39694, 40791 (33 anexos), 41114, 41557, 41578, 41740, 42122, 46756, 47888, 48003, 48329, 48437, 49096, 51735 |
| Q. Anexo da alteradora que traz **o anexo/tabela novo da lei-alvo entre aspas** (pontilhado + `(NR)`) | 21 | 15 (15) | 39694, 40111, 41019, 41577, 42994, 43346, 46293, 46756, 47758, 47805, 47888, 48003, 48329, 49638, 51735 |
| T. Tabela de colunas (valores, cargos, UFM, regime urbanístico, relação de imóveis) | 50 | 17 (16) | 33620, 36255, 37090, 37422, 37945, 38217, 39395, 39825, 39862, 40426, 42407, 42987, 43595, 47674, 49707, 50385, 51150 |
| X. Texto corrido/lista (glossário, documentação exigida, especificação de cargo) | 44 | 18 (16) | 26743 (ANEXO III, 219 linhas), 26970, 36190 (CROQUI 1, ruído de legenda), 37422, 40084, 40148, 40830, 42401 (glossário, 185 linhas), 50385, 51150 … |

Subtipos observados: quadro de cargos/valores (49707 Anexos I–VIII com `R$`; 50385; 51150); tabela de taxas por UFM (37945, 38217, 39825 "Tabela II/III"); alíquotas de ISS por item de serviço (47758, 47805, 49638 "Tabela XII"); regime urbanístico por subunidade (42122, 38309, 37109, 40350); relação de imóveis (33620); planilha de custos (39694 "Anexo 6"); lista de empreendimentos com endereço (47674, DOCX, 394 linhas); glossário (42401); formulário: **não achado**. **Anexo vetado: 2 casos reais** (41114 "ANEXO II / VETADO."; 40791 "ANEXO XXXII / VETADO").

Q é o achado de modelagem mais importante: **15 das 48 normas recentes com anexo (31%) têm o anexo como bloco de alteração** de outra lei (ex.: 46293, "Art. 2º … na Tabela IV … conforme o Anexo desta Lei" e, depois do fecho, `ANEXO` / `“Tabela IV` / pontilhado / `V-A – Licenças …` / `” (NR)`).

### 1.3 Parte do arquivo × arquivo próprio

- **Anexo como parte do mesmo arquivo** (depois do fecho e das assinaturas, ou antes dele): todas as 52 acima.
- **Registro cujo arquivo principal É o anexo**: 124 registros do catálogo (115 ordinárias, 9 LC; 28 recentes) têm "anexo" no nome do arquivo principal; 5 têm texto aqui: 40303 (LC 775, `R LC 775 Anexo.pdf`, mapa), 39395 (LC 738, `LC 738 Anexo.pdf`), 36372 (LC 630, `LC630_Anexo III.pdf`), 37090 (LC 663, `Lc 663 com anexos.pdf`, junta lei e anexos), 48987 (LC 1.018). 44158 (LC 951) **não** é anexo: o arquivo é uma página do DOPA só com cabeçalho (25 linhas), outro defeito de fonte.
  Nos três casos puros (40303, 39395, 36372) a `observacao` do catálogo aponta o texto da lei em outro arquivo (`sirel/Norma_N_AAAAMMDD_1.html`); o registro tem, portanto, **dois arquivos** (lei e anexo) e o leitor só pega um. Mais 186 registros (todos ordinários, 75 recentes) têm "mapa/planta/croqui/figura" no nome do arquivo; nenhum com texto aqui.
- **Ementa cita anexo e o texto não o traz**: das 30 normas com "anexo" na ementa e texto extraído, **13** não têm nenhuma linha de cabeçalho de anexo/tabela/quadro: 48987, 47547, 45238, 40641, 40514, 40370, 39857, 38309, 36841, 36060, 33619, 32289, 31066. Em vários o "anexo" da ementa é o anexo da **lei-alvo** (ex.: 36060 altera célula do Anexo 1.2 da LC 434), não anexo da norma; **não conferi um a um** quais são anexo próprio não extraído.

## 2. Tabelas no meio do ato

### 2.1 Como a extração representa

- **PDF (`pdftotext -layout`)**: colunas separadas por 3+ espaços na mesma linha; linha por linha de tabela. Boa para colunas simples. Piora quando a célula quebra em várias linhas (43346: as linhas "maior que 14.946 e menor / ou igual a 24.910" ficam entrelaçadas com a coluna da esquerda: ordem de leitura vertical misturada com a horizontal), em cabeçalho de duas linhas (50385, 39825 "UFM 2015 / 2016 / a partir de / 2017") e em espaçamento estragado por OCR/justificação ("DI VI S ÃO T E RR I T ORI A L", 38309; "R$ 1.79 5,80", 37422).
- **DOCX (`docxParaTexto`)**: um parágrafo por linha; **a célula vira linha, a linha da tabela some** (não há marca de fim de linha) e **célula vazia some** (linhas vazias são descartadas). Real: 47674 ("EMPREENDIMENTO / ENDEREÇO / Alameda das Laranjeiras / Estrada Cristiano Kraemer, 1829 / Albion 27 / …"); 47758 "Tabela XII" ("15.01 / Administração de fundos … / 3% em 2024, / 2,5% de 1º de janeiro a 31 de dezembro de 2025 e / 2% a partir de 1º de janeiro de 2026"): três colunas viraram uma sequência; só o código do item (15.01) e o pontilhado marcam onde a linha começa. Número de colunas não é recuperável do texto.
- **HTML SIREL (`htmlSirelParaTexto`)**: `<tr>` vira quebra de linha, `<td>` é apenas removido. Pelo código (teste sintético, não dado real): `<td>Cargo</td><td>Valor</td>` → `CargoValor`; `A`/`10` → `A10`. **Células de uma linha são coladas sem separador.** Não achei tabela em HTML real nas 68 normas HTML da amostra com o detector usado; fica por medir.
- Os `.txt` guardados são derivados e refazíveis; a perda no DOCX/HTML é de extração, não do arquivo bruto.

### 2.2 Padrões e exemplos reais

Detector de linhas com 3+ colunas (≥3 linhas seguidas, só PDF `pdftotext`): 38 normas com bloco tabular **antes** do fecho (sete recentes: 36255, 37109, 37422, 38309, 38364, 40350, 42122; as demais são antigas/OCR), 17 depois do fecho. Em DOCX, sequências de ≥10 linhas-célula com ≥30% de dígitos: 3 (29512 não; 29259, 35764, 47674).

| id | Fmt | Onde | Linhas exatas (início) |
|---|---|---|---|
| 42122 | pdf | entre art. 3º e art. 4º (aceita) | `MZ   UEU   SUBUNIDADE   BRUTAS   ATIVIDADES APROVEITAMENTO   VOLUMÉTRICO` / `3      92          05             09             05                09                 15` |
| 38309 | pdf | entre art. 1º e art. 2º, com letras espaçadas (aceita) | `DI VI S ÃO T E RR I T ORI A L   RE GI ME U RB ANÍ ST I C O` / `5         030         10             01 …` |
| 40350 | pdf | dentro do inc. III do art. 2º (aceita) | `ÍNDICE DE APROVEITAMENTO` / `Área de Ocupação   Índice de Aproveitamento   Quota ideal` / `1,0      Não         Sim           1,5             250m²/econ.` |
| 37109 | pdf | dentro de bloco de alteração do art. 1º, "conforme tabela abaixo:" (aceita) | `AlturaMáxima do Anexo   Limitede Altura   Limitede Altura …` / `18,00m   21,00m   24,00m   27,00m` |
| 38364 | pdf | 4 blocos (aceita) | `DENOMINAÇÃO DAS CLASSES   IDENTIFICAÇÃO   Número de cargos` / `Assessor para Assuntos Jurídicos   ES-1.05.NS   A, B, C, D   46` |
| 37422 | pdf | tabela de vencimentos com `R$` (revisar) | `Médico Clí nico Geral   EXMed   R$ 1.79 5,80   R$ 1.873,70 …` |
| 42994 | pdf | "§ 9º Os CCs obedecerão ao quadro abaixo:" (aceita) | `CC 5 – Assessor   16` |
| 47758 | docx | anexo pós-fecho, linhas de pontos | `........` (≈140 pontos) / `15.01` / `Administração de fundos quaisquer …` / `3% em 2024,` |
| 41876 | pdf | bloco com pontilhado e valores | `a) Estudo de Viabilidade Urbanística (EVU) de edificações para Estações Rádio` / `Base   2.500` |
| 46293 | docx? | anexo pós-fecho, pontilhado + `(NR)` | `“Tabela IV` / `....` / `V-A – Licenças e obras de simples natureza, no valor de 30 (trinta) UFMs.` |

Marcadores textuais de tabela no corpo: "conforme tabela abaixo" / "quadro seguinte" num dispositivo: só 5 normas (26884, 29512, 30209, 37109, 42994). Linhas de pontilhado (`.....`) indicam parte omitida, não tabela, mas aparecem **dentro** das tabelas citadas (Tabela XII). `R$`: 49707 (Anexo VII), 37422.

## 3. Impacto no motor hoje

### 3.1 Mecanismo (lido no código e confirmado)

1. `parseLeiPublicada` (`norma-core.js`, laço de estágios, `if (stage === "fecho") { fechoBuf.push(line) }`): **depois da linha de fecho, todas as linhas vão para `doc.fecho`**, sem exceção. Assinaturas **e anexos** viram "fecho".
2. `estruturarNorma` põe `doc.fecho` entre os `trechos` da conferência de conservação. A conferência só pergunta se o texto do trecho existe na origem, em ordem; como o fecho gigante existe, **o anexo conta como coberto**: `texto_fora_da_arvore` não dispara e a cobertura fica em 0,95–0,98.
3. Anexo **antes** do fecho, ou tabela no corpo: as linhas sem rótulo são concatenadas (`t.texto = (t.texto + " " + line)`) ao **último dispositivo aberto**. Em dispositivo normal, as quebras de linha da tabela viram espaço (linha única); em bloco de alteração (`blocoDeAlteracao`) mantêm `\n`.
4. Comandos sobre anexo/tabela viram `nao_classificado` ou `indeterminado` (falha explícita, bom): medido com `extrairComandosLei` em 46293, 40791, 39825, 38791, 31066, 40426, 35933, 40641, 36060, 34244; exceção a olhar: 39825 gera `insert_node` contra a LC 7 e `replace_text` (art. 2º) a partir de artigos que mexem em "Tabela II/III … conforme Anexo I/II"; não verifiquei se a leitura está certa.

### 3.2 Números

| Medida | Valor |
|---|---|
| Normas com cabeçalho de anexo **dentro de `doc.fecho`** | 50 (46 rec, 4 ant) |
| ... dessas **"aceita"** | **38** (36 rec) |
| ... aceitas com texto de anexo >50 letras/algarismos | 28 (ex.: 50385, 36255, 38217, 37945, 49707, 51150, 47674) |
| ... aceitas só com o título do anexo (imagem sem texto) | 10 (38673, 38982, 39008, 41114, 41557, 41578, 41740, 42122, 47888, 49096) |
| Letras e algarismos de anexo contados como "fecho conservado" nas aceitas | ≈ 119.500 |
| Cobertura das aceitas com anexo no fecho | média 0,974, mínimo 0,95 |
| Anexo no fecho e "revisar" | 12 (por outros motivos; o anexo não é a causa) |
| Aceitas com tabela colada ao dispositivo (corpo, PDF, detector ≥3 linhas) | 6 recentes: 36255, 37109, 38309, 38364, 40350, 42122 |
| Fechos "aceita" com mais de 600 caracteres | 41 (38 rec); parte é carimbo de assinatura digital (42659, 43304 …), não anexo |

**Conclusão:** o aviso `tem_anexo` existe, mas **a norma continua "aceita"**; o falso aceite silencioso (anexo substantivo conservado como "fecho") atinge 36 normas recentes, 28 com texto real. Não é a mesma classe do "falso aceite" da decisão 10, mas é análoga. Também fica errado na tela: o painel mostra um "fecho" de 44.610 caracteres (50385).

### 3.3 Casos de colagem (arquivo → onde parou)

1. **49707 (LC 1.033/2025, aceita)**: último artigo termina em "Esta Lei Complementar entra em vigor na data de sua publicação, produzindo efeitos a partir de 1º de fevereiro de 2025." Depois: fecho, assinaturas, e `ANEXO I` / `CARGOS EM COMISSÃO CRIADOS NO QUADRO DA ADMINISTRAÇÃO DIRETA` … até `ANEXO VIII` / `EQUIVALÊNCIA HIERÁRQUICA …` (23.351 caracteres) — **tudo em `doc.fecho`**, cobertura 0,982, avisos só `tem_anexo`. Contém `R$ 2.192,18 … R$ 18.988,13` (Anexo VII).
2. **50385 (LC 1.049/2025, aceita)**: fecho de 798 linhas / 44.610 caracteres; `ANEXO I` "Cargos criados da carreira de Guarda Civil Metropolitano" … "Tabela I: Critérios e valores da hora de trabalho de Diária Operacional".
3. **47674 (DOCX, aceita)**: fim do artigo, assinatura, `ANEXO` / `EMPREENDIMENTO` / `ENDEREÇO` / `Alameda das Laranjeiras` … (394 linhas, 10.548 caracteres no "fecho").
4. **42122 (aceita)**: tabela de regime urbanístico entre o art. 3º e o art. 4º vira texto do **art. 3º** (627 caracteres, uma linha só, linhas de tabela fundidas: "… conforme segue: REGIME URBANÍSTICO DIVISÃO TERRITORIAL … 3 92 05 09 05 09 15 3 92 06 09 05 09 11").
5. **40350 (aceita)**: a tabela "ÍNDICE DE APROVEITAMENTO" vira texto do **inciso III do art. 2º**: "Índice de Aproveitamento: ÍNDICE DE APROVEITAMENTO Área de Ocupação … 1,0 Não Sim 1,5 250m²/econ."
6. **Sem fecho (36190, revisar)**: o croqui e a legenda ficam no último artigo (`art-3`, 5.459 caracteres) e `texto_fora_da_arvore`.

## 4. Modelo proposto (o menor que dá conta)

Princípio: **o leitor não interpreta tabela; só guarda, na ordem, o texto bruto de um bloco com identidade e fronteira.** Nada de células, colunas ou linhas.

### 4.1 Nós novos (aditivos; nenhum campo existente muda de significado)

- `tipo: 'anexo'`: filho da **raiz do ato**, não de artigo. Campos: `rotulo` ("ANEXO I", "ANEXO 1.2", "ANEXO" quando único, texto escrito), `titulo` (linhas seguintes até a primeira linha em branco ou tabela, só se curtas), `bruto` (linhas exatas do arquivo, com `\n` e espaços preservados), `desFixo` = rótulo escrito normalizado (`anexo-i`, `anexo-1-2`, `anexo-unico`), `semTexto: true` quando o corpo tem ≤5 letras/algarismos (imagem), `origem: { linhaIni, linhaFim }`, `entreAspas: true` + `leiAlvo` quando o anexo é bloco de alteração (tipo Q).
- `tipo: 'tabela'`: nó **filho do dispositivo** que a introduz ("conforme tabela abaixo:", "quadro seguinte") ou irmão dele; mesmos campos (`bruto`, `titulo` se houver, `rotulo` se a lei der: "Tabela IV"). Só nasce quando há marcador explícito ou rótulo "Tabela/Quadro N" em linha própria; **sem marcador, o texto continua onde está** (aviso, não nó).
- Endereço: `anexo-i`, `anexo-i/tab-iv`; dentro de tabela de lei-alvo, o item citado pela alteradora só como **texto de comando**, não como endereço (ver 4.5).

### 4.2 Fronteira (a)

Onde termina o articulado: na linha de fecho (como hoje). O que vem depois do fecho **e** após o bloco de assinatura passa a ser lido como lista de anexos, em vez de entrar em `doc.fecho`. Regra: depois de `reFecho`, as linhas ainda são fecho até a primeira linha de cabeçalho estrito de anexo (`ANEXO`, `ANEXO N`, `ANEXO À LEI …`, `“ANEXO`); dali em diante, anexos. Isso é diff pequeno e aditivo no estágio `fecho` (nenhum teste real de fecho muda, pois fecho sem anexo fica igual). Para anexo **antes** do fecho (rótulo em linha própria no meio do corpo), tratar só se for o cabeçalho estrito; "Anexo 1.2 desta Lei" no meio de frase nunca.

### 4.3 Conferência de conservação (d) sem afrouxar

- Os nós `anexo`/`tabela` entram em `trechos` na ordem, com o `bruto` como texto: **o anexo só conta como coberto se estiver no nó**, e `doc.fecho` volta a ter só fecho + assinatura. O tamanho típico do fecho (p50 215 caracteres, p90 344) vira **conferência nova**: fecho >600 caracteres sem anexo reconhecido reprova (`fecho_com_texto_demais`, candidato; decisão do mantenedor).
- `tem_anexo` deixa de ser aviso e passa a ser medida (`anexos: n`, `anexosSemTexto: n`). A norma com anexo **sem texto** (imagem) é **aceitável** mas sai com motivo próprio ou selo "anexo gráfico, não lido" (decisão do mantenedor, 7.1).
- Teste de falha contra o código antigo: as 36 aceitas hoje com anexo no fecho passam a ter nó de anexo; o teste prova que o fecho dessas normas deixa de conter `ANEXO`.

### 4.4 Invariantes (f)

- **`desFixo` único, no nascimento**: o rótulo escrito do anexo ("ANEXO II"), nunca a posição. Anexo escrito duas vezes no mesmo arquivo (índice no topo + corpo, 30209, 26743) → `endereco_repetido` já existente reprova; tratar o índice como não-anexo.
- **Nunca renumerar**: "Anexo 7.1", "Anexo 1.2" são rótulos com ponto, escritos; sufixo de letra em anexo novo ("Anexo III-C", 42994) segue a mesma regra do artigo.
- **Vetado/revogado nunca sai**: o anexo vetado fica no nó com `vetado: true` e `desFixo` (casos reais 41114 "ANEXO II / VETADO."; 40791 "ANEXO XXXII / VETADO"). Isso exige que o leitor reconheça "VETADO." no corpo do anexo. "Revogado o Anexo" de lei-alvo: sem exemplo real no acervo medido (ver 7).
- **Terminologia**: um anexo é parte da lei apurada; "texto vigente" com anexo só quando o anexo foi apurado; o rótulo de confiança da consulta (decisão 15) ganha ressalva "anexos não apurados" (decisão do mantenedor).

### 4.5 Versionamento (e)

Exemplos reais de comando que atinge anexo/tabela de outra lei, com o que o motor faz hoje (tudo `nao_classificado`, bom):

| Forma | id | Trecho exato |
|---|---|---|
| Substitui tabela inteira por anexo da alteradora | 39825 art. 12 | "Fica alterada a Tabela II da Lei Complementar nº 7, de 1973, e alterações posteriores, conforme Anexo I desta Lei Complementar." |
| Inclui tabela inteira | 40426 art. 2º | "Fica incluída Tabela VIII na Lei Complementar nº 7, de 1973, e alterações posteriores, conforme Anexo desta Lei Complementar." |
| Inclui anexo novo | 39694 art. 10 | "Fica incluído Anexo 6 – Planilha de Custos Referenciais para a Construção de Ciclovias – na Lei Complementar nº 626, de 2009 … conforme Anexo desta Lei Complementar." |
| Altera/inclui item **dentro** de tabela (inciso da tabela, `(NR)`, pontilhado) | 46293 art. 2º | "Ficam alterados os incs. VI e VII e fica incluído inc. V-A na Tabela IV da Lei Complementar nº 7, de 1973 … conforme o Anexo desta Lei" (+ anexo pós-fecho `“Tabela IV` … `” (NR)`) |
| Revoga tabela inteira | 46293 art. 4º IV | "IV – a Tabela V." |
| Revoga alíneas dentro de tabela | 46293 art. 4º II | "as als. a a i do inc. VI da Tabela IV" |
| Altera "linha" (célula) de anexo do PDDUA | 36060 art. 1º | "No Anexo 1.2 da Lei Complementar nº 434 … fica alterado para 03 o código referente ao Regime de Atividades …" |
| Altera conceito/grupamento de uma zona | 40641 art. 1º | "Ficam alterados, no Anexo V da Lei Complementar nº 630 … relativamente à Zona de Uso Residencial 1: I – o Conceito …" |
| Inclui via em folha de anexo | 34244 art. 5º | "Fica incluída na fl. 3 do Anexo 9.1 da Lei Complementar nº 434, de 1999, a via local do Tipo V.7 …" |
| Inclui item em figura/tabela de mapa | 38791 art. 1º e 2º | "Fica incluído o logradouro Avenida Ecoville na Figura 2 do Anexo 1 da Lei Complementar nº 626 …" |
| Altera por mapa | 40791 art. 1º–33 | "… ficam alterados os limites da Subunidade 01, … conforme o Anexo II desta Lei Complementar" (anexo é imagem) |
| Planta | 33619 art. 1º | "Ficam alterados os Anexos 1.1, 1.2 e 7.2 da Lei Complementar nº 434 … conforme configurações na planta em anexo" |
| Inclui item em lista de anexo de lei de cargos | 40111 art. 30 | "Ficam alteradas, no Quadro dos Cargos de Provimento Efetivo, constante da letra a do Anexo I da Lei nº 6.309 …" |

Contagem (regex por verbo+objeto no artigo/§): **46 normas** (34 recentes, 37 aceitas), 96 dispositivos mandam alterar/incluir/revogar/substituir Anexo/Tabela/Quadro; 18 desses dispositivos têm a LC 434 (PDDUA) como alvo. O regex é largo e pode contar remissão; é limite superior.

Proposta de comportamento, em ordem de risco crescente (a ser decidido, ver 7):

1. **Hoje e mínimo**: manter `nao_classificado`; a alteradora ganha o nó `anexo` com o bloco preservado; a lei-alvo recebe só **registro** "alterado por X no anexo/tabela Y" (anotação `aConferir`, como `naoAplicadas` no histórico) — sem alterar texto de tabela.
2. **Substituição/inclusão/revogação de anexo ou tabela inteira** (`replace_node`/`insert_node`/`revoke_node` com alvo `anexo-X`/`anexo-X/tab-Y`): o motor troca o `bruto` do nó inteiro pelo bloco da alteradora. Sem interpretar células. Só quando a lei-alvo já tem o nó e o rótulo bate.
3. **Alteração de linha/célula**: **fora do motor** (humano), por decisão. Os casos de pontilhado `…… ” (NR)` já chegam como bloco; o motor guardaria o bloco como "alteração parcial de tabela, não aplicada".

Com `revoke_node`/`veto_derrubado` o princípio é o do CLAUDE.md: **sem exemplo real, falha explícita**. Exemplos reais de "revogado o Anexo X" inteiro não foram achados (só "a Tabela V" em 46293).

### 4.6 Dashboard (f)

- Painel da norma: lista de anexos (rótulo, título, tamanho, selo "sem texto (imagem)", selo "bloco de alteração para LC 7/1973") e o `bruto` em fonte monoespaçada, para preservar colunas do PDF. Nada de renderizar tabela: o revisor compara com o arquivo.
- Âncoras da conferência (`revisao-ancoras.mjs`): o trecho do anexo aparece como faixa própria em vez de sumir dentro do "fecho".
- Motivos novos precisam de título em português (`tituloDoMotivo`, decisão 17).
- Roteiro de conferência (decisão 13): "anexo gráfico: abrir o arquivo e conferir se o mapa corresponde ao citado no artigo".
- A decisão 12 (revisor só aceita ou marca defeito de fonte) vale para a fronteira de anexo.

## 5. Consequências e riscos

- **Mudar o estágio `fecho` altera `norma-core.js`**: bateria inteira antes e depois (153 asserções do core + as demais); `normateste.mjs` byte a byte. Cópia embutida em `norma-simulacao.html` precisa espelhar (regra 10).
- **Muda a fila**: 38 aceitas passam a ter nó de anexo; parte pode passar a "revisar" se o mantenedor decidir que anexo sem texto ou fecho grande reprova. Medir antes (relatório de estruturação recentes × antigas).
- **OCR/extração ruim em anexo**: tabela de 37090 (OCR, "Anexo -10 desta Lei CoMplementar … - -   --") não é recuperável; decisão 32 vale.
- **DOCX perde linhas e células vazias**: o `bruto` do anexo DOCX é ordem de leitura, não tabela. Só um novo extrator (marcar fim de `<w:tc>` e `<w:tr>`) mudaria isso, e **é mudança da ingestão, não do core**, e exigiria baixar de novo os DOCX (279 aqui).
- **HTML**: `<td>` sem separador cola células; a correção é de uma linha na ingestão, mas só vale com exemplo real de tabela em HTML (não achei).
- **LOA/LDO/PPA**: sem texto; o dimensionamento real do problema (milhares de linhas, colunas de valores, anexos de dezenas de páginas, "Anexo de Metas Fiscais") só sai depois de baixar as 191 normas de ementa orçamentária (ou ao menos 3 por tipo). Esse download usa a coleta (rede) e fica fora desta pesquisa.

## 6. Fases propostas (cada uma pequena, com critério de término e fixture real)

**Fase 0 — Medição do que falta (sem código de produção)**
Baixar/ler (pela rotina normal, não por agente) 6–9 normas orçamentárias reais: LOA 14.429/2025 (id 50787), LOA 14.155/2024 (49635), LDO 14.343/2025 (50559), LDO 14.094/2024 (49391, DOCX), PPA 14.315/2025 (50442), uma alteradora de LOA (51809). Término: relatório do tamanho/forma dos anexos e tabelas. Sem isso, a Fase 5 não começa.

**Fase 1 — Reconhecer a fronteira e parar de engolir anexo no fecho**
Estágio `fecho`: fecho vai até o primeiro cabeçalho estrito de anexo; o resto vira `doc.anexos[]` (bruto + rótulo + título), sem nós de árvore ainda. `estruturarNorma` põe cada anexo em `trechos` e emite `anexos`/`anexosSemTexto` nas métricas; `tem_anexo` passa a usar o mesmo detector (inclui "Anexo 1", `“ANEXO`).
Fixtures reais: 49707 (8 anexos, valores), 50385, 47674 (DOCX), 42122 (só título), 46293 (bloco `(NR)`), 41114 (vetado), 29512 (7 anexos só título). Controle sem anexo: LC 320/384/412/611.
Término: testes novos falham no código antigo (o fecho dessas normas contém "ANEXO"); fecho das normas sem anexo idêntico byte a byte; bateria do core igual.

**Fase 2 — Nó `anexo` na árvore + `desFixo` por rótulo escrito + vetado/revogado**
`tipo: 'anexo'` com endereço `anexo-i`. Anexo vetado (41114 ANEXO II; 40791 ANEXO XXXII) marcado e mantido.
Término: anexos de 49707 com endereços `anexo-i` … `anexo-viii`; repetição (índice + corpo, 30209/26743) tratada; dashboard mostra a lista.

**Fase 3 — Tabela no corpo como bloco preso ao dispositivo**
Só com marcador textual ("conforme tabela abaixo", "quadro seguinte", rótulo "Tabela N" em linha própria) ou bloco ≥3 linhas com 3+ colunas depois de um dispositivo que termina em ":". Fixtures: 37109, 42122, 38309, 40350, 42994 (todas aceitas hoje com a tabela colada).
Término: o texto do dispositivo não contém mais as linhas da tabela; conferência de conservação continua cobrindo-as pelo nó `tabela`; `possivel_tabela_no_corpo` como aviso onde não houver marcador.

**Fase 4 — Anexo de alteradora (tipo Q) ligado ao comando**
Ligar "conforme o Anexo desta Lei" ao anexo da própria alteradora (rótulo ou "Anexo" único) e esse anexo ao dispositivo-alvo; `extrairComandosLei` produz comando com `anexoBloco` e a lei-alvo, **ainda sem aplicar** (registra e manda para `aConferir`). Fixtures: 46293, 47758, 47805, 49638, 48329, 40426, 39825, 41876.
Término: cada um dos 15 casos Q tem o bloco ligado ao artigo que o cita; nenhum `replace_text` sobre texto errado.

**Fase 5 — Aplicação mínima (só se o mantenedor decidir)**
Substituir/incluir/revogar anexo ou tabela **inteira** (4.5, nível 2). Fixtures: 39825 (Tabela II → Anexo I) e 40426 (Tabela VIII) contra a LC 7/1973 (`lc7`: há fixtures LC 7? não verifiquei; seria preciso a lei-alvo em `fixtures/` ou no acervo, ids a buscar).
Término: `apurarTextoVigente` troca o `bruto` do nó e registra a versão; nada de célula.

**Fase 6 — Leis orçamentárias e Plano Diretor** (planejar com os textos da Fase 0)
Fora de qualquer fase anterior. Decisão própria.

## 7. Perguntas ao mantenedor (entrevista, regra 11; não decidi nada)

1. **O anexo faz parte do ato como dispositivo (tem posição, `desFixo`, pode ser vetado/revogado/alterado) ou é "peça acessória" do texto?** Evidência: 2 anexos vetados reais (41114, 40791); 15 alteradoras recentes (31%) usam anexo como bloco de alteração.
2. **Anexo só de imagem (mapa/planta/croqui; 19 normas, 62 anexos, 40791 tem 33):** aceita "limpa" com selo "anexo gráfico, não lido", ou sempre "a revisar"? (Alternativas: aceita; aceita com aviso; revisar.)
3. **Fecho com texto demais:** reprovar fecho >600 caracteres sem anexo reconhecido? (Carimbo de assinatura digital passa dos 1.000: 42659, 43304, 49144.)
4. **"Revogado o Anexo II" / "Fica revogada a Tabela V" (46293):** é `revoke_node` do anexo/tabela inteiro (nó fica, marcado) como no artigo? Aceita-se aplicar quando o rótulo bate?
5. **Substituição de anexo ou tabela inteira** (39825 art. 12, 40426 art. 2º): o motor troca o bloco bruto (sem olhar células) ou fica para humano?
6. **Alteração de linha/célula/inciso dentro de tabela** (46293 `V-A`, `VI`, `VII` da Tabela IV; 36060; 40641; 34244): sempre humano, ou o inciso da tabela tem endereço (`anexo/tab-iv/inc-v-a`) e entra no motor? (Tabelas de LC 7 já usam incisos e alíneas.)
7. **Valores de tabela de lei orçamentária** entram no motor? Versionar a linha, o anexo ou só a lei?
8. **Anexos do Plano Diretor (LC 434, 1.1 a 13.2, regime urbanístico por subunidade):** o texto vigente da LC 434 deve mostrar o anexo apurado após cada alteração (18 dispositivos recentes alteram o Anexo 1.2/5/6 etc.) ou só avisar "anexo alterado por X, conferir"?
9. **Registro com dois arquivos (lei + anexo em arquivo próprio: 40303, 39395, 36372; 124 no catálogo):** o motor deve ler os dois e ligá-los ao mesmo ato, ou o revisor marca defeito de fonte?
10. **Consulta pública:** lei com anexo não apurado leva o rótulo "texto vigente apurado" com ressalva, ou o rótulo de nível inferior?
11. **Tabela no corpo sem marcador textual:** só aviso, ou nó `tabela` também?
12. **Quem é o "anexo" de bloco de alteração (tipo Q):** o anexo da alteradora é anexo da alteradora (permanece nela) além de gerar alteração na lei-alvo? (Proposto: sim, ambos.)

## 8. O que não consegui verificar

- Nenhum texto de lei ordinária (tipo 5) nem de lei orçamentária; todos os números de 1 a 3 valem para LC/EC/LO.
- Tabelas em HTML real (nenhum caso achado nas 68 normas HTML; demonstração só sintética).
- Arquivos DOCX brutos (ausentes): o comportamento por célula/linha foi lido no código e nas linhas extraídas.
- Se as 13 normas com "anexo" na ementa sem cabeçalho de anexo no texto perderam o anexo na extração ou se o anexo é da lei-alvo.
- Se a leitura dos comandos de 39825 (`insert_node` e `replace_text` contra a LC 7/1973) está correta.
- Classificação de tipo V/Q/T/X é heurística (limite em ±poucas normas); a lista de falsos positivos do cabeçalho estrito foi inspecionada só nas normas com cabeçalho dentro do fecho.
- Contagem de "comandos sobre anexo" (46 normas) é limite superior por regex.
- Não rodei a bateria de testes (não alterei nada).
