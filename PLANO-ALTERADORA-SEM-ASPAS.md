# Plano — alteradoras "sem aspas"

Pesquisa e desenho (20/11/2026). **Nada foi implementado**: o repositório não foi alterado, exceto este arquivo. Medições feitas com cópias do `norma-core.js` e do `ingestao/estrutura.mjs` na pasta temporária da sessão (scripts em `/tmp/claude-0/-home-user-norma-poa/6f77e18e-f055-5f0b-99c2-42f683ae1059/scratchpad/pesquisa-sem-aspas/`; `core-e5.js` é o núcleo experimental, `det.mjs` o detector de introduções). Corpus: 823 textos estruturados (815 de LC/Lei/EC), `dados/textos/sapl/`.

## 0. Resumo honesto

1. **A premissa "sem aspas" está quase toda errada.** Das 28 normas com "introdução de alteração seguida de texto sem aspas" (o conjunto de ~29 do mantenedor), só **5 (18%)** são realmente sem aspas, todas de 1993–2001, todas com OCR ruim. A maior causa (7 normas) é **defeito de extração**: aspas gravadas como caracteres de controle `U+0093/U+0094` (ver 1.A).
2. **Achado mais grave: falso aceite silencioso.** Hoje há normas `aceita` cuja alteração é lida como dispositivo da própria alteradora (ex.: LC 504/2004 = 33217, LC 436/1999 = 30297, 28859, 29446, 29528, 29581, 29705). Passam em todas as conferências porque o texto está inteiro e os rótulos "batem".
3. Um conjunto de **5 correções pequenas** (1 na extração, 3 em `detectNRCandidates`, 1 regra de cabeçalho) leva `aceita` de 531 para 540 (re-medido) **com 0 regressões** e corrige a estrutura de pelo menos 8 normas já "aceitas". O que sobra de verdadeiramente sem aspas (≈5 antigas + ≈4 recentes) **fica para humano**.
4. Reconhecer "alteração sem aspas" por texto livre (sem nenhum marcador) **não é automatizável com segurança**: ver seção 2.

## 1. Taxonomia

Universo medido: **467 normas** têm ao menos uma sentença de alteração (verbo + ato-alvo + `:`); 164 antigas (<03/02/2009) e 303 recentes. As 28 "candidatas" (introdução, `:` e linha seguinte sem aspa) se repartem assim:

| Classe | Normas | Ids | Natureza |
|---|---|---|---|
| A. Aspas gravadas como `U+0093/U+0094` (e travessão `U+0096`) | 7 | 29870, 30297, 30315, 30317, 30641, 32926, 33217 | **Defeito de extração**, não da lei |
| B. Aspas presentes, causa é outra | 8 | 26346, 27395, 27441, 27604, 28032, 28716, 30298, 26393 | Ruído de OCR entre introdução e bloco; aspas internas; abertura truncada |
| C. Glifo de OCR no lugar da aspa de abertura (`•`, `■`) | 3 | 29125, 29233, 31027 | Aspa existe, lida como símbolo |
| D. Realmente sem abertura ou sem aspas | 5 | 26843 (1 item), 27966, 28021, 29544, 31066 | Genuíno, texto de OCR danificado |
| E. Nem é alteração de dispositivo | 5 | 30209, 30818, 36841, 49739, 51150 | Regime urbanístico, anexo/tabela, Plano Diretor (misto, 1.300+ linhas), "passam a integrar" |

### 1.A Aspas como caracteres de controle (a maior causa)
- 10 arquivos têm `U+0091–U+0094/U+0096` no texto; **todos** vêm de `html_sirel` (68 textos SIREL no acervo). Causa localizada: `htmlSirelParaTexto` converte entidade numérica com `String.fromCodePoint(147)` (`ingestao/extracao-texto.mjs` linha 55; `docxParaTexto` linha 110 tem o mesmo padrão). O HTML legado usa `&#147;`/`&#148;`/`&#150;` (windows-1252), e o correto é mapear 128–159 pela tabela cp1252, como o navegador faz.
- Trecho real (LC 499/2003, id 32926): `redação:\n\x93Art. 53. À servidora ...\x94. (NR)`; `I \x96 120 (cento e vinte) dias`. Sem tratar, `detectNRCandidates` não vê a abertura e o rótulo `I \x96` não é reconhecido.
- Efeito medido de **só** mapear cp1252 (R0): 29870, 30315, 30317, 32926 passam de `revisar` a `aceita` (estrutura correta); 30297 e 33217 já eram `aceita` **com estrutura errada**, agora com bloco; 30641 melhora e ainda fica `revisar` (2º bloco sem fechamento). 33222, 33385 (usam os caracteres fora de alteração) e 26402 (compilação da LC 267, não é alteradora) sem ganho.

### 1.B Aspas presentes que o leitor perdeu (hoje: `revisar` ou **aceita errada**)
- **B1. Aspa simples interna fecha o bloco cedo** — `'jetton'.` no fim de linha casa o fechamento `["“”']\s*\.?\s*$`. Real: LC 293/1993 (26970). O bloco termina no § 1º e o resto vira dispositivo da alteradora.
- **B2. Fechamento com glifo diferente da abertura**, ou sem fechamento: `“Art. 69 - ...` … `competência do imposto’.` (30711); `’` em 28859 e 29409; `*` em 29528; `."` com abertura `‘` em 29581; **nenhum** em 29705, 27750, 30641 (2º bloco). A busca por fechamento (300 linhas) falha e o bloco não existe. 11 normas (as acima + 27443, 27684, 28637).
- **B3. Abertura com glifo não coberto**: `‘` `’` `„` (30483, 29061) e `•`/`■`/`v` (29125, 29233, 31027, 27395 `vArt.`).
- **B4. Fechamento duplo OCR** `’’` (29446, aceita errada).
- **B5. Cue que o leitor não conhece**: plural "seguintes redações" (30698, 29061, 29024 com `"$ 5º` = `§`).
- **B6. Ordinal lido como dígito** (`Art. 1º` → `Art12`): 28092, 26307, 26547, 27569, 26874, 27604, 27784, 27924, 29327, 33620. **Não é sem aspas**, mas explica `rotulo_nao_confere` em 10 normas (nenhuma tem alteração sem aspas). Fora deste plano.

### 1.C Realmente sem abertura de aspas
- **C1. Cabeçalho do dispositivo-alvo com reticências, sem aspa de abertura** (técnica da LC 611, recente): `Art. 4º ......` … `.......” (NR)`. Reais: 48226 (2022), 48437 (2024, art. 10), 51463 (2026, 2 blocos), 43376 (2021, cabeçalho sem pontos, termina em `(NR)`). 4 normas, 5 blocos.
- **C2. Só fechamento**: `III - IV - na hipótese prevista no inciso III do arte 31."` (28021); `111- para assistir aulas ...função."` (29544). Início só conhecido pela introdução.
- **C3. Sem nenhuma aspa e sem cabeçalho**: LC 336/1995, art. 2º: `... conforme segue:\n§ 1º - Os limites da receita bruta ...` (27966). Fim só conhecido pelo próximo artigo.
- **C4. Abertura truncada pela OCR** (linhas perdidas): 26393 arts. 3º e 5º começam em `serviços de saúde deverão implantar...`, sem `Art. 23`.

### 1.D Falsos candidatos (não tratar como alteração sem aspas)
- Regime urbanístico / tabelas / anexos: 30209, 30818, 32356, 42122, 35933, 39329. Listas próprias ("I – ocupantes dos cargos", revogação em rol): 49557, 50385, 51150, 37037, 37119.
- Não-alteradora: 26315 (promulgação parcial com ordinais corrompidos), 11440 (Lei Orgânica de 1956, OCR ruim), 26402 (compilado), 26743 (vários atos num PDF).
- Aspas OK, mas página/cabeçalho de impressão entre introdução e bloco (`7`, `PLCE Nº`): 42031, 42356, 42994, 41098 — o leitor já lê.
- `27441`: aspas OK; `"e"` dentro da introdução desloca os incisos (V→VI). Causa: aspas internas, não ausência.

## 2. O que é automatizável com segurança

Princípio: **só reconhecer fronteira quando 2 ou mais sinais independentes concordam; qualquer coisa a menos vira motivo explícito, nunca silêncio.**

### Regras propostas e medidas (823 textos, `core-e5.js`; antes: 531 aceitas)

| Regra | O que faz | Normas afetadas | Certas | Duvidosas | Regressão |
|---|---|---|---|---|---|
| R0 | Mapear `U+0080–U+009F` por cp1252 (na extração; também reparar na leitura de `.txt` já gravados) | 10 arquivos | 6 melhoram (4 `revisar→aceita`, 2 aceitas com estrutura corrigida); 1 parcial | 0 | 0 |
| R1 | Fechamento **pareado** com a abertura (dupla fecha com `” " “`, ou par `'' ’’`; simples só com simples) + exigir ≥25 caracteres se fechar na própria linha de abertura | 26970 (+4 mudam de motivo) | 1 | 0 | 0 (sem a guarda de 25 caracteres: 36136 vira `revisar`; sem o pareamento, aspa simples de palavra quebra 35006 e 36136) |
| R2 | Abertura com cue + sem fechamento: bloco termina antes de `Art. (n+1)` da alteradora (n = artigo que contém a introdução) | 11 blocos | 11 (fronteira conferida a olho nas 11) | 6 sem glifo de fechamento (27750, 29705, 30641, 27443, 27684, 28637) | 0; sem exigir cue, falha na LC 611 (35980: `“§”` no meio do texto) |
| R3 | Cue plural ("seguintes redações") e `$` no lugar de `§` | 29024 | 1 | 0 | 0 |
| R4 | Cabeçalho `Art. N ....` (≥3 pontos) logo após introdução cujo alvo cita `art. N`, N ≠ próximo artigo da alteradora | 3 normas / 4 blocos | 4 (48226, 48437, 51463 x2) | — | 0 falso entre os ~30 não lidos |
| R5 | Cabeçalho `Art. N.` sem pontos, N citado, fecha em `(NR)`/aspa | 43376 (certo), 37945 (**falso**) | 1 | 1 | por isso **não** automatizar: só sinalizar |

**Efeito conjunto R0+R1+R2+R3: `aceita` 531 → 540, 9 `revisar→aceita` (26970, 27750, 29409, 29870, 30315, 30317, 30641, 30711, 32926), 0 `aceita→revisar`.** Estrutura corrigida em normas já `aceita`: 28859, 29446, 29528, 29581, 29705, 30297, 33217, 29024. Linhas de `rotina.sh` não rodadas; é medição sobre os textos, sem alterar `dados/`.

**Cuidado com o número 540:** os 9 de R2 têm fronteira *inferida*. Pelo princípio acima, eles não podem ficar "aceitos limpos". Política proposta: bloco achado por R2 ou R4 recebe `sem_fecho: true` no resultado de `detectNRCandidates`, o estruturador grava `confiancaDaFronteira` e a norma sai `revisar` com motivo novo `bloco_sem_fechamento_de_aspas` (fecho com glifo de aspas = `media_alta`; sem glifo = `baixa`). Ganho líquido "limpo": 29870, 30315, 30317, 32926, 26970 (+5); o resto passa de "estrutura errada" a "estrutura certa e sinalizada".

### Critérios de confiança
- **Alta (aplicar e aceitar):** abertura reconhecida (inclui R0, glifos `‘ ’ „ ‚`) + fechamento pareado ou `(NR)`.
- **Média (aplicar e `revisar`):** R2 (fecho com glifo de aspas, `*`, `''`) e R4 (cabeçalho com reticências + número citado + `(NR)` ou aspa final).
- **Baixa (aplicar e `revisar`, destaque forte):** R2 sem nenhum glifo; R4 sem `(NR)` nem aspa (48437, art. 10).
- **Não reconhecer (só motivo `alteracao_sem_aspas_nao_delimitada`):** C2, C3, C4 e qualquer introdução com ato-alvo cujo bloco seguinte não começa por aspa nem por cabeçalho `Art. N`.

### Regras de FALHAR ALTO
1. Introdução forte (verbo de redação + ato-alvo + dispositivo-alvo + `:`) sem bloco lido → motivo `alteracao_sem_aspas_nao_delimitada` (ver 3: detector de aviso, que já pegaria 30297 e 33217, hoje aceitas). Medido: o detector da pesquisa marca esses casos, com ruído (rol "I – …" próprio da lei).
2. Número do cabeçalho do bloco = próximo artigo da alteradora → ambíguo → nunca delimitar.
3. Fronteira inferida jamais reaproveita o texto como dispositivo da alteradora: sai da árvore (`blocoDeAlteracao`), como já é para blocos com aspas.
4. Não corrigir OCR, não completar aspas, não inferir texto ausente (26393 e 28021 ficam como estão).

### O que NÃO é automatizável
- **Texto livre sem marcadores** (C3, 27966): o fim é só "até o próximo artigo", e uma alteradora antiga também escreve `§ 1º - ...` como dispositivo próprio. Sem sinal independente (aspas, `(NR)`, cabeçalho com o número citado) a precisão não é defensável.
- **Só fechamento** (C2): conhecemos o fim, não o início. O rótulo do 1º dispositivo do bloco ("111" ≈ III) coincide com o inciso citado na introdução em 29544, mas OCR (`111`/`Ifl`) impede confiar. Tentar só seria seguro com conferência de rótulo OCR-tolerante. Não vale o custo para ≈4 normas.
- A cobertura de antigas é pequena: **≈5 normas de 164 antigas (3%)** têm alteração realmente sem aspas.

## 3. Plano de testes (fixtures reais)

Convenção do repositório: `.mjs` standalone, `ok(desc, cond)`, exit ≠ 0. Fixtures: copiar `dados/textos/sapl/<id>.txt` para `fixtures/alteradoras-sem-aspas/<id>.txt` + registro do catálogo em `registros.json` (como `fixtures/leis-ordinarias/`). **Sem exemplo real, não se escreve a regra.**

| Teste | Fixtures | Afirma | Falha no código antigo porque |
|---|---|---|---|
| `T1 cp1252` | 32926, 29870 (+ um HTML SIREL real com `&#147;`, **faltando**: só existe em `dados/_bruto`, fora do git; sem ele o teste da entidade é sintético e deve levar `(sintético)`) | `prepararTextoExtraido` não deixa `U+0080–9F`; 32926 vira 3 blocos, `aceita`; 29870 2 blocos | hoje 0 blocos e `rotulo_nao_confere` |
| `T2 estrutura certa em aceita` | 33217, 30297 | `art-1/par-unico` **não existe** na árvore; 1 bloco com 1 artigo `Art. 140` | hoje o parágrafo único do alvo aparece sob `art-1` |
| `T3 pareamento` | 26970 | bloco inteiro (§§ 1º–3º), `aceita` | hoje fecha em `'jetton'.` |
| `T4 guarda de 25 caracteres` | 36136 | continua `aceita`, bloco com § 5º e § 6º | quebra se o pareamento ignorar a guarda |
| `T5 aspas simples internas` | 35006 | `‘playgrounds’` não fecha o bloco | quebra ao só ampliar a classe de aspas |
| `T6 sem fechamento` | 28859, 29409, 29528, 29705, 30711, 30641 | bloco termina antes do `Art. 2º`; `sem_fecho: true`; motivo `bloco_sem_fechamento_de_aspas`; a lei-alvo não vira dispositivo da alteradora | hoje bloco ausente |
| `T7 nega LC 611` | `lc611.txt` | `“§”,` no meio do texto **não** vira bloco | falha se R2 não exigir cue |
| `T8 cabeçalho com pontos` | 48226, 51463, 48437 | R4 delimita 4 blocos; 48437/art. 10 com confiança baixa | hoje `rotulo_nao_confere` |
| `T9 negativa R5` | 37945 | **não** delimitar por cabeçalho sem pontos | evita falso positivo |
| `T10 não tentar` | 27966, 28021, 29544 | `alteracao_sem_aspas_nao_delimitada`; árvore inalterada | prova de que falha alto |
| `T11 sem regressão` | bateria inteira + `teste_estrutura.mjs` (42) + relatório | 0 `aceita→revisar`; contagens iguais, exceto os 9 ganhos nomeados | — |

Prova de falha: rodar cada teste novo contra o `norma-core.js` e `extracao-texto.mjs` atuais antes de aplicar o patch. Rodar `normateste.mjs` byte a byte antes/depois. `docs/js/norma-core.js` e a cópia embutida em `norma-simulacao.html` precisam ser espelhadas (detectNRCandidates); validar no navegador.

## 4. Revisão humana e dashboard

Fica para humano: C2, C3, C4 (≈5 antigas), blocos R2/R4 de confiança baixa, e as normas com OCR em que o início do bloco foi truncado (26393). Para a época antiga, a taxa é esperada abaixo das recentes (CLAUDE.md, "Época da norma"): a fila deve **separar** estes casos, não somar.

Apresentação em `docs/revisao.html`:
- Novos motivos com descrição: `alteracao_sem_aspas_nao_delimitada`, `bloco_sem_fechamento_de_aspas`, `aspa_de_abertura_ausente`.
- Painel lado a lado: **introdução** (destacada) → **candidato a bloco** com a linha inicial e a final marcadas, e a linha seguinte ao fim (o `Art. 2º` que o encerra) em cor diferente; caracteres `U+0080–9F` e glifos `• ■ ’ *` visíveis como tais (hoje invisíveis ao revisor).
- Mostrar a **confiança** e o **sinal** que decidiu ("fecha por glifo `’`", "fecha antes do Art. 2º", "cabeçalho com reticências, número citado na introdução"). Para o revisor, "o leitor leu isto como dispositivo da alteradora" e "o leitor leu como bloco da LC 7" lado a lado.
- Decisões continuam em `dados/revisao/decisoes.jsonl`, camada à parte, amarradas a `sha256Origem` + `versaoEstruturador`. **Pergunta ao mantenedor:** hoje só o rótulo é corrigível por sobreposição; confirmar/ajustar *fronteira de bloco* é um tipo novo de decisão (`{iniLinha, fimLinha}`) e exige OK explícito, pois muda o que o motor lê. Alternativa conservadora: só `aceita humano` / `defeito de fonte`, sem ajustar fronteira.
- Contar separado no relatório: "aceita com fronteira inferida" (não entra na taxa que mede o leitor).

## 5. Riscos frente aos invariantes e ordem sugerida

Riscos:
- **Nunca renumerar / `desFixo` uma vez:** nenhuma regra toca rótulo; blocos novos passam por `extrairRedacaoAlterada` (que atribui `desFixo` ao nascer). Risco: bloco R2 que engole dispositivo próprio da alteradora (se o próximo artigo estiver faltando). Mitigação: exige `Art. (n+1)` presente e cue forte; senão sem bloco + motivo.
- **Falso positivo na LC 611/2009** e em leis que *citam* trecho entre aspas (T7); ampliar a classe de aspas sem pareamento **regride** (medido).
- **Dispositivo vetado/revogado nunca sai da árvore:** blocos lidos continuam fora da árvore da alteradora; nada é removido.
- **Terminologia / texto de OCR nunca corrigido:** R0 troca caracteres de *codificação*, não de OCR; é a mesma natureza de `prepararTextoExtraido`. Registrar no CHANGELOG que o `.txt` bruto não é alterado (só a leitura).
- **Core puro:** R1–R3 são lógica de texto em `detectNRCandidates` (permitido). R0 e a conversão de entidades ficam fora do core (`ingestao/extracao-texto.mjs`).
- **Mudar a leitura reprocessa tudo:** subir `VERSAO_ESTRUTURADOR` (decisões de revisão antigas voltam "desatualizadas" — esperado).
- **Dados mudaram durante a pesquisa:** `dados/estruturado/` foi reprocessado por outra sessão às 13:54 UTC (aceitas 529 → 531, arquivos 36060 e 36064). Os deltas desta pesquisa valem nas duas bases.

Ordem em rodadas pequenas (cada uma: bateria antes/depois, teste que falha no antigo, CHANGELOG):
1. **Detector de aviso (só falhar alto):** motivo `alteracao_sem_aspas_nao_delimitada` quando introdução forte não tem bloco. Muda 33217/30297 (e outras aceitas erradas) para `revisar`. Zero risco para o core.
2. **R0** (cp1252 em `htmlSirelParaTexto` e em `prepararTextoExtraido`). Maior ganho por menor risco; depende de obter um HTML SIREL real para o teste da entidade.
3. **R1 + pareamento** (inclui T3, T4, T5) em `detectNRCandidates`.
4. **R2** com `sem_fecho` e motivo; **R3** (cue plural, `$`).
5. **R4** (cabeçalho com reticências) só como sinalização/delimitação de confiança média; **R5** apenas aviso.
6. Dashboard (painel de fronteira, motivos, contagem separada) e decisão sobre o tipo "fronteira".
7. Reavaliar com o PDF original (fora do repositório) os 4–5 casos recentes do tipo C1: se a aspa existe no PDF, o defeito é de extração do PDF e a correção é lá, não no leitor.

Fora deste plano e que apareceu: ordinais lidos como dígito (B6) em 10 normas; blocos com cue partido em duas linhas ("conforme" / "segue:"); 29061 (`‘Art. 12`, cue quebrada) permanece aceita com estrutura provavelmente errada.
