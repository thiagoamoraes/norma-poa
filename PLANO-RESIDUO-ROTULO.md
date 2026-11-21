# PLANO-RESIDUO-ROTULO — o que resta de `rotulo_nao_confere_com_a_origem` nas 39 normas recentes

Relatório de pesquisa (somente leitura do repositório; só este arquivo foi criado aqui). Tudo o que é código foi provado numa **cópia** em
`/tmp/claude-0/-home-user-norma-poa/6f77e18e-f055-5f0b-99c2-42f683ae1059/scratchpad/agente-res-rot/` (a pasta citada abaixo como `$S`).

Estado medido: 823 normas; lista-alvo = 39 recentes que ainda têm o motivo. Durante o trabalho o repositório avançou da rodada 40 (estruturador 17) para a **rodada 41 (estruturador 18)**; refiz a linha de base e todas as provas sobre o código da rodada 41 (as 39 continuam com o motivo; `estruturarNorma` sobre as 823, com o texto passado por `prepararTextoExtraido`, reproduz os motivos gravados: 0 diferenças nas 39).
Por norma, o motivo guarda só as 5 primeiras divergências (`slice(0, 5)` em `estrutura.mjs:297`); para o diagnóstico usei uma cópia com a lista completa.

## 1. Resposta curta

Das 39: **18 têm bug do leitor/preparo com conserto pequeno e provado (D)**, **10 são defeito de fonte (B)** (8 com rótulo pulado/repetido/trocado e 2 com aspa de fecho antes de dispositivos incluídos), **6 são extração/OCR sem conserto seguro (A)** e **5 são forma legítima já decidida (C)** (decisões 11 e 27): 18 + 10 + 6 + 5 = 39. A 36316 conta em A (o conserto D2 tira 43 das 46 divergências dela, sobram 2). A 41723 conta em B (o conserto D5 só tira a primeira divergência).

Com os 5 consertos juntos, medido nas 823 e na ordem de aplicação do item 4:

- **21 normas perdem o motivo** (18 da lista-alvo + 3 antigas: 28021, 29259, 34079);
- **0 normas ganham `rotulo_nao_confere_com_a_origem`**; **0 normas passam de "aceita" para "revisar"**;
- aceitas no acervo: **614 → 624** (10 normas da lista-alvo viram "aceita");
- as 8 restantes da D deixam o motivo mas continuam "a revisar", pelo motivo `bloco_sem_fechamento_de_aspas` (decisão 9: fronteira inferida nunca fica "aceita limpa"); esse motivo aparece em 15 normas ao todo (as 9 acima, 3 antigas e 3 que já eram "a revisar" por outras causas: 30834, 31373, 41179);
- nenhum motivo novo além de `bloco_sem_fechamento_de_aspas`; `normateste.mjs` igual **byte a byte**; todas as baterias do core e do acervo iguais, **exceto uma asserção de `teste_revisao.mjs` que usava justamente a LC 859/2019 (id 42216) como exemplo real de "rótulo não confere"** (ver item 5).

## 2. Tabela causa × contagem × ids

| Classe | Causa | N | Ids | Conserto |
|---|---|---|---|---|
| **D1** | Bloco de alteração sem fecho **engole o artigo seguinte da alteradora**: (a) o procurador do `Art. (n+1)` exige separador (`.`/`-`) e **nunca casa "Art. 2º Esta…"** (artigo ≤ 9 com "º" e sem ponto); (b) há um fecho mais adiante (do bloco seguinte), então a regra do bloco sem fecho nem roda | 8 | 37352, 38051, 39258 (a); 38297, 39825, 40134, 42216, 51463 (b) | patch 1 (`detectNRCandidates`) |
| **D2** | **Dispositivo embutido no meio da linha** (DOCX junta o fim de um dispositivo com o marcador do seguinte; "VETADO" digitado na mesma linha): `Art. 2º VETADO Art. 3º VETADO …`, `… Educação. § 1º VETADO.`, `” (NR) Art. 23. Fica …`, `… Eleitoral. Art. 101. A Junta …`, `Ficam revogados: I – …` | 5 (+ 36316, que melhora mas fica em A3) | 48855, 37043, 36647, 37042, 37041 | patch 2a (`extracao-texto.mjs`) |
| **D3** | **Espaço espúrio dentro do número** do rótulo (camada de texto do PDF): `Art. 2 6.`, `Art. 1 5.`, `X VII –`, `X VIII –` | 3 | 37422, 37491, 37517 | patch 2b (`extracao-texto.mjs`) |
| **D4** | **Aspa de fecho fora do lugar** dentro de bloco: (a) `“contact centers”` no fim de uma linha de inciso fecha o bloco; (b) `…menor.”` no fim do art. 133-B, com os arts. 133-C a 133-F logo abaixo sem aspas | 2 | 36400 (a); 44376 (b) | patch 3 (`detectNRCandidates`) |
| **D5** | `§ 17. VETADO.` sozinho no artigo: a regra "§ N sozinho segue o rótulo escrito" (decisão 5) só aceita o rótulo **sem ponto final** | 0 (tira a 1ª divergência da 41723, que continua em B1) | 41723 | patch 4 (`atribuirDesFixoOriginal`) |
| **E** | Falso positivo da conferência: trecho sem letra nem algarismo (corpo só de pontos de omissão) é conferido com o que vem ANTES do cursor, que é o fim do trecho anterior | 0 da lista-alvo (componente em 39138, 38041, 36400, 42401, 51485, 43376); resolve a 28021 (antiga) | — | patch 5 (opcional; `conferirConservacao`) |
| **B1** | Defeito de fonte: **inciso ou artigo pulado, repetido ou com rótulo errado** na própria lei | 8 | 41723 (art. 9º → 11), 41098 (inc. III → V), 40311 (II → IV), 38249 (VIII → XI), 42356 (V repetido no lugar de VII), 43595 e 42987 (III; e V), 39138 (XVIII → IX) | nenhum; roteiro no painel (item 6) |
| **B2** | Defeito de fonte: **aspa de fecho (ou "(NR)") antes de dispositivos que a introdução manda incluir** | 2 | 43543 (inc. XXXI depois do `” (NR)`), 38041 (parágrafo único e inc. III depois do `” (NR)`) | nenhum seguro (item 3, B2) |
| **A1** | Camada de texto de **digitalização ruim** (acentos e símbolos trocados, "Art. I" no lugar de "Art. 1", "º" numa linha à parte) | 3 | 44305, 44307, 37090 | nenhum por regra; OCR próprio é caminho (não verificado) |
| **A2** | **PDF em colunas**: colunas e margens intercaladas pela extração | 1 | 36841 | nenhum |
| **A3** | **DOCX**: texto deslocado dentro da linha / rótulo automático de lista ausente; não distingo de defeito da lei sem o `.docx` bruto | 2 | 36634 (`… de 1 III – Índice` e `999, e alteraç…` aparece 35 linhas depois); 36316 (resto: `a)` ausente) | nenhum |
| **C** | Forma legítima já decidida | 5 | 49739 (Art. 31-A, 32-A…; decisão 27), 39862 (Art. 8º duplicado com "(Republicação)"; decisão 27), 42401 e 51485 (promulgação parcial; decisão 27), 43376 (cabeçalho sem pontos e sem aspas; decisão 11) | nenhum |

Contagem por id (cada norma na sua causa principal): D1 8 + D2 5 + D3 3 + D4 2 = 18; B1 8 + B2 2 = 10; A1 3 + A2 1 + A3 2 = 6; C 5; total 39. A coluna "E" não conta norma da lista (é componente de 6 delas).

## 3. Evidências por causa

Linhas são do texto lido (`prepararTextoExtraido`).

### D1. Bloco sem fecho engole o artigo seguinte (8)

Procurador atual (`norma-core.js`, ramo `end < 0 && introCue`): `'^Art…' + (n+1) + '\\s*[º°®o2]?\\s*[-–—.]'`. Exige um separador depois do número. "Art. 2º Esta Lei Complementar entra em vigor" tem "º" e depois espaço e letra: **não casa**. Resultado: bloco sem fecho não é detectado, o `“Art. 15……` vira artigo da alteradora e tudo se desloca. É a lacuna de maior alcance desta rodada: afeta **qualquer** artigo de 2 a 9 que comece sem ponto (a forma mais comum).

- **37352** (EC 31/2011): `"Art. 68` / `......` / `IV - em licença-gestante…` / `Art. 2° Esta Emenda…`. Sem fecho nenhum.
- **38051** (LC 690/2012): `“Art. 29-A …` e `Art. 29-B …` sem fecho; `Art. 2º As despesas…`.
- **39258** (LC 733/2014): `“Art. 15.....` / `§1º A interrupção…` / `§5º VETADO.` / `Art. 2º Esta Lei Complementar…`.
- **42216** (LC 859/2019): o art. 2º termina em `§ 18. VETADO.` … `§ 19. VETADO.` e o `” (NR)` foi junto com o texto vetado; o bloco `“Art. 5º ……` só fecha na linha 163, **depois** de `Art. 3º Fica alterado o inc. I … conforme segue:` (linha 152) e de `“Art. 7º ……` (155). O fecho achado é o do bloco seguinte.
- **39825** (LC 755/2014): bloco do art. 10 (`“TÍTULO III`, arts. 52-O a 52-R) sem fecho; fecha em `” (NR)` da linha 375, depois de `Art. 11. Fica alterado o art. 56 …` (351) e de `“Art. 56` — o art. 11 é engolido.
- **40134** (LC 766/2015): `§ 2º A parcela Δ` (texto truncado pelo glifo Δ) e a linha seguinte já é `Art. 4º Fica alterado o art. 11 …`.
- **38297** (EC 35/2012): o `” (NR)` do art. 1º virou ruído de OCR (`CO COL CL LOL LDO LOCO…`) e `Art. 2º Fica alterado o art. 64 …` é engolido.
- **51463** (LC 1.074/2026): o bloco sem aspas de abertura do art. 89-A (`Art. 89-A. ……` linhas 699-712) termina em `da segunda reincidência.` sem `” (NR)`; o fecho achado (737) é o do bloco do art. 91, e os arts. 21 e 22 da lei ficam dentro dele.

Segundo indício independente: em cada caso o artigo "engolido" aparece no texto como `Art. (n+1) … conforme segue:` seguido de linha que abre aspas — a introdução de alteração do próximo artigo da alteradora. Nos 4 que têm texto vetado/truncado/ruído a causa está no próprio arquivo; o leitor só precisa **parar** antes e marcar a fronteira como inferida, que é o que a decisão 9 já manda.

### D2. Dispositivo embutido no meio da linha (6)

- **48855** (LC 1.017/2024): `Art. 2º VETADO Art. 3º VETADO Art. 4º VETADO … Art. 10. VETADO` numa linha só; a árvore tem 4 artigos, a lei 12.
- **37043** (LC 662/2010): `… Municipais de Saúde, da Fazenda e de Educação. § 1º VETADO.` e `… desta Lei Complementar. Art. 21. Esta Lei …`.
- **36647** (LC 640/2010): `……” (NR) Art. 23. Fica incluído art. 63-A …` — o art. 23 inteiro some do início de linha.
- **37042** (LC 661/2010): `…Município de Porto Alegre. Art. 2º Os Conselhos Municipais são …`, `… Municipais Art. 13. …`, `… Cidade § 1º O Executivo …`, `… Cidade. Art. 14. …` (o arquivo é DOCX; o parágrafo traz vários dispositivos).
- **37041** (LC 660/2010): `Art. 32. Ficam revogados: I – o inc. II do art. 4º …`.
- **36316** (LC 628/2009): `… à Comissão Eleitoral. Art. 101. A Junta Eleitoral …` — **43 das 46 divergências** são cascata desse ponto (cada artigo de 101 a 143 desloca de 1). Sobram 2, em D2→A3.

Dez das 39 vêm de DOCX (37352, 48855, 44376, 37043, 37042, 37041, 36647, 36634, 36400, 36316); **9 delas** são resolvidas ou melhoradas por D1/D2/D4. `docxParaTexto` está correta (um `\n` por `<w:p>`/`<w:br/>`): o parágrafo do documento já traz vários dispositivos. Segundo indício: o "VETADO" digitado na linha (`Art. 3º VETADO Art. 4º VETADO`) só pode ser edição manual do documento.

### D3. Espaço dentro do número (3)

`Art. 2 6. A GIM será concedida…` (37422), `Art. 1 5.`, `Art. 1 6.`, `Art. 2 0.`, … (37491), `X VII –`, `X VIII –` (37517). A camada de texto do PDF espalhou espaços (comum nessas leis: "ser á co ncedida"). É texto de PDF, não OCR (`extracao.metodo: pdftotext`), logo a regra "OCR nunca é corrigido" não se aplica; e a junção só mexe em espaço, **não muda letras nem algarismos** (a conferência de conservação compara só `alnum`, igual antes e depois).

### D4. Aspa de fecho fora do lugar (2)

- **36400** (LC 632/2009): `XIX – serviços realizados pelos centros de contato – “contact centers”` (fim de linha). `reFechaDup` toma esse `”` como fecho do bloco; o inc. XX e o § 2º ficam fora (rótulo `I –` para o que na lei é `XX –`). O `”` fecha a citação **da própria linha** (a linha tem `“` e `”`).
- **44376** (LC 957/2022): `Art. 4º Fica incluída Subseção III-A, contendo arts. 133-A a 133-F` (a **introdução diz que são seis artigos**); o bloco `“Subseção III-A` fecha em `…o sustento do menor.”` (fim do art. 133-B, linha 25) e os arts. 133-C a 133-F vêm em seguida, sem aspas, com o `”` verdadeiro só no fim do 133-F (linha 29). Os 4 viram "Art. 5º a 8º" da alteradora.

### D5. `§ 17. VETADO.`

41723 (LC 835/2018): `§ 17. VETADO.` fica fora do bloco como único parágrafo do art. 1º. A regra da decisão 5 compara `rawL` com `^§\s*(\d+)\s*[º°o]?\s*$`; a partir do `§ 10` o rótulo leva ponto (`§ 17.`, a mesma grafia que o motor usa em `desFixo`), então não casa e o nó vira "Parágrafo único.". O patch aceita o ponto **só de 10 em diante**. Tirar a primeira divergência da 41723; ela continua acusada por B1 (art. 10 pulado).

### B1. Rótulo pulado, repetido ou trocado na própria lei (8)

Pergunta: é a lei ou é a extração? Para as 8, a origem é `pdftotext` (camada de texto do PDF, que reproduz o impresso) e o contexto vizinho está intacto; **não consigo provar a ausência de perda na extração sem o PDF**, mas há dois tipos de indício:

| id | Lei | O que está escrito | Indício independente |
|---|---|---|---|
| 43595 / 42987 | LC 932/2022 / LC 896/2021 (o mesmo texto; decisão 27) | `III – idade, …; e` / `V – sorteio.` | o `; e` no fim do III marca o **penúltimo**: o último é o IV, escrito "V". Erro de digitação. |
| 38249 | LC 694/2012 | `VIII – inscrição regular … ; e` / `XI – acompanhamento médico-veterinário…` | idem: `; e` no VIII; o último deveria ser IX. |
| 39138 | LC 721/2013 | `XVIII – tecnologias sociais …; e` / `IX –um conjunto de conhecimentos` | idem; deveria ser XIX. (As outras 2 divergências desta norma são componente E: trecho de omissão sem texto.) |
| 42356 | LC 868/2019 | `V – o art. 42; VI – o art. 113; e V – o art. 114.` | a **ementa** lista 7 itens revogados (incs. XIII e XIV do art. 33 · art. 36 · art. 40 · art. 37 · art. 42 · art. 113 · art. 114): o último é o VII. O "V" final é erro de digitação. |
| 40311 | LC 777/2015 | art. 7º: `I`, `II`, `IV – … ; e`, `V –` | o inciso III não existe no arquivo; o `; e` já está no IV (não no V). Salto simples. |
| 41098 | LC 810/2017 | art. 8º: `I`, `II`, `III – Smams`, `V – SMIM`, `VI`, `VII` (5 divergências, todas +1) | salto simples (provável retirada do IV durante a tramitação, sem renumerar). Não achei indício adicional; **não distingo de perda na extração**. |
| 41723 | LC 835/2018 | `Art. 9º` (vigência) com parágrafo único, depois `Art. 11. Ficam revogados:` | a mesma lei escreve `Art. 4º VETADO.` e `Art. 5º VETADO.` quando veta; um art. 10 vetado apareceria como `Art. 10. VETADO.`. Nenhuma outra norma do acervo cita a LC 835, então não há citação para conferir. |

Nenhum deslocamento aqui deve ser "corrigido" pelo motor: o detector está certo em acusar.

### B2. Aspa/"(NR)" antes dos dispositivos incluídos (2)

- **43543** (LC 925/2021): a introdução diz `alterado o inc. XIX e incluído inc. XXXI no art. 21`; o bloco fecha em `…dois por cento).”` + `(NR)` (linhas 32-33) e **depois** vêm `……` e `XXXI – serviços previstos no subitem 14.14 …` e uma linha final que termina em `�` (o glifo de aspa estragado). A inclusão (que não leva "(NR)") ficou fora do bloco.
- **38041** (LC 688/2012): a introdução cita `alterados os incs. I, V e IX do caput, e fica incluído inc. III no parágrafo único`; o bloco fecha com `” (NR)` no inc. IX (linha 88) e `Parágrafo único ……` / `III – sejam classificados …` / `(NR)` vêm depois.

Não há conserto seguro: "reabrir" o bloco exigiria ler a introdução (quais dispositivos foram incluídos) e a 43543 nem tem fecho legível. Segue como defeito de fonte; o painel deve apontar o que a introdução manda incluir (item 6).

### A (6) e C (5)

- **A1** (44305, 44307, 37090): `Art. I Fica alterado …`, `§ I`, `o` solto numa linha, `"Art. 58` etc. (EC 43 e EC 42), e na 37090 acentos e símbolos trocados em milhares de linhas. A extração já classifica como `pdftotext`; a heurística de "camada ruim" não disparou e o OCR próprio não rodou. **Não verifiquei** se `ingestao/ocr.mjs` melhoraria (não tenho o PDF nem rodei tesseract).
- **A2** 36841 (LC 646/2010): duas colunas intercaladas (`REPUBLICAÇÃO`, `Art. 2º Fica` à direita no meio do texto da esquerda). Já era "texto defeituoso de fonte" nas rodadas anteriores.
- **A3** 36634: `Complementar nº 434, de 1 III – Índice de Aproveitamento: IA = 0,5 + IAA;` (o "999, e alteraç" sobra 35 linhas depois); 36316: `multa de 500 (quinhentas) UFMs, na primeira autuação;` seguida de `b)` e `c)` — falta o `a)`, que no grupo seguinte do mesmo artigo está digitado. Hipótese (não verificada): numeração automática de lista no DOCX, cujo rótulo não está no texto; ou erro de digitação.
- **C** conforme decisões 27 e 11; nada a fazer. **39862** é o exemplo da própria decisão: `Art. 8º … art. 4º, § 2º …` e logo abaixo `Art. 8º … art. 4º, § 3º … (Republicação)`; 56 divergências, todas deslocamento −1 por causa disso.

## 4. Consertos (patches em `$S/patches/`, aplicados nesta ordem sobre o HEAD da rodada 41)

Cada patch foi gerado como diff do código real; aplicados em sequência reproduzem exatamente a cópia provada (`$S/aplic/`, 0 diferenças de motivo nas 823).

| # | Arquivo do patch | Onde | O que faz | Resolve |
|---|---|---|---|---|
| 1 | `$S/patches/patch-1-blocos-sem-fecho-engolem-artigo.diff` | `norma-core.js`, `detectNRCandidates` | (a) o `Art. (n+1)` passa a casar também `Art. 2º ` seguido de maiúscula (só com "º"/"°", nunca sem ordinal); (b) novo `introDoProximoArtigo(j, n)`: dentro de qualquer busca de fecho (com ou sem aspa de abertura), se aparece `Art. (n+1)` + sinal `conforme segue`/`passa a vigorar`/… **e** uma linha de abertura de aspas logo depois, o bloco **termina antes** e sai `sem_fecho` (`confianca: baixa`) | D1 (8): 37352, 38051, 39258, 38297, 39825, 40134, 42216, 51463; + 29259, 34079 (antigas) |
| 2 | `$S/patches/patch-2-dispositivos-embutidos-e-numero-partido.diff` | `ingestao/extracao-texto.mjs`: `separarDispositivosEmbutidos` e `juntarNumeroPartidoNoRotulo`, ambas na cadeia de `prepararTextoExtraido` | D2: quebra a linha ANTES do marcador só se ele é exatamente o **sucessor** (Art N+1 depois do N; § N+1 depois do § N do mesmo artigo; "I –" só depois de `:`); D3: junta o número partido só se o resultado é o sucessor e a forma romana é canônica | D2 (5): 48855, 37043, 36647, 37042, 37041; D3 (3): 37422, 37491, 37517 |
| 3 | `$S/patches/patch-3-aspas-fora-do-lugar.diff` | `norma-core.js`, `detectNRCandidates` | (a) `”` no fim da linha **com `“` e `”` equilibrados na própria linha** não fecha o bloco; (b) depois de um fecho fraco (sem "(NR)"), `Art. M-X` da letra seguinte do **mesmo número** do último artigo do bloco continua o bloco | D4: 36400, 44376 |
| 4 | `$S/patches/patch-4-paragrafo-sozinho-com-ponto.diff` | `norma-core.js`, `atribuirDesFixoOriginal` | `\s*$` → `\s*\.?\s*$` no teste "§ N sozinho" | D5: 41723 (1ª divergência) |
| 5 | `$S/patches/patch-5-trecho-vazio.diff` | `ingestao/estrutura.mjs`, `conferirConservacao` | trecho sem letra/algarismo: confere o rótulo **logo depois** do cursor, não antes | E: 28021 (antiga); nenhum da lista-alvo; **opcional** |

Efeito de cada um **sobre as 823** (medido na ordem acima): patch 1 mexe na leitura de blocos de 15 normas (9 blocos cortados e 6 detecções novas, todas conferidas); patch 2 muda **16 textos** (letras e algarismos idênticos em todos; as 9 da lista mais 13529, 16471, 26739 — junção de `XVII I`, `V I`, `VII I`, correta —, 35934 e 37040 — separação correta de `§ 3º`/`Art. 4º` — e 36190 e 37090, onde a separação ocorre depois de lixo de digitalização, `| Art. 22.`); patch 3 em 2 normas (as duas da lista; nenhuma outra); patch 4 em 1 (41723; sem a restrição a § 10+ mudava o endereço de 7 normas antigas, de `par-unico` para `par-2`, porque o texto ruidoso escreve `§ 2.`); patch 5 em 1 (28021).

### Riscos

- **Patch 1b (cortar o bloco no `Art. (n+1)` interno)** é o de maior alcance e o único que cria o motivo `bloco_sem_fechamento_de_aspas` em normas novas (15). Não faz nenhuma norma sair de "aceita". Risco: um bloco que legitimamente cite, sem aspas, uma linha `Art. (n+1) … conforme segue:` seguida de aspas; mitigado pela exigência dos dois sinais (cue + abertura de aspas nas 4 linhas seguintes). Nas 823 não houve falso corte. **Isto é uma decisão do mantenedor** (item 7), porque estende a decisão 9 a blocos que têm um fecho mais adiante.
- **Patch 2a (embutidos)**: a primeira versão separava também incisos romanos no meio da linha e **errou** (50200: `I – a Tabela II - Distribuição dos Cargos` virou dois incisos e a norma passou de "aceita" a "revisar"; 26465 ganhou 4 motivos novos e mais 5 normas antigas ganharam divergências). Por isso o patch final **só** separa `Art.` e `§` (sucessor exato) e `I –` depois de `:` com minúscula em seguida. Fica de fora de propósito o caso da 36634 (`de 1 III –`), que exigiria separar inciso sem pontuação anterior.
- **Patch 2b**: numa versão intermediária a norma antiga 27475 ganhou uma divergência por junção errada (`I     VI` → `IVI`, que valia como "V"); com a exigência de forma romana canônica e de **um** só espaço, não ocorre. Resta uma norma antiga (16471, Lei Orgânica de 1970, que já tem 208 divergências) que passa a 209 por `V I -` → `VI -` (a junção é correta; a norma já estava reprovada).
- **Patch 3b**: cobre só séries com sufixo de letra consecutivo (133-B → 133-C); nas 823, só o caso 44376.
- **Patch 5**: só dispensa conferência para trecho **vazio**; um rótulo errado continua acusado (o teste olha o rótulo adiante).

Todos mudam o texto lido ou o leitor ⇒ **subir `VERSAO_ESTRUTURADOR` para 19** (decisão 7: decisão humana só reabre se o texto lido ou o veredito mudou; as normas já aceitas/revisadas pelo humano ficam como estão se o veredito não mudou).

### Teste proposto (falha contra o código antigo)

`$S/teste_residuo_rotulo_proposto.mjs` (`node teste_residuo_rotulo_proposto.mjs <raiz>`): 8 normas reais de D1 (sem divergência de rótulo **e** com `bloco_sem_fechamento_de_aspas`), 10 de D2/D3/D4, 8 de B1/C (**continuam acusadas**) e 5 sintéticos (marcados `(sintético)`: "Art. 3º" no meio da linha depois do art. 1º **não** é separado; citação com `I –` no meio da linha **não** é separada; dois blocos bem fechados não são cortados; bloco sem fecho que invade o art. 2º é cortado). Contra o código antigo: **28 falhas**; contra o novo: 0. No repositório os textos reais entram como `fixtures/textos/*.txt` (ids 37352, 38051, 39258, 38297, 39825, 40134, 42216, 51463, 48855, 37043, 36647, 37042, 37041, 37422, 37491, 37517, 36400, 44376, 41723, 41098, 40311, 38249, 42356, 43595, 39138, 39862).

## 5. Efeito colateral nos testes existentes

`teste_revisao.mjs` (linhas 27-39) usa a **LC 859/2019 (id 42216, `fixtures/textos/lc859_2019.txt`)** como o exemplo real de "âncora com rótulo que não confere" (o artigo 3º engolido). Com o patch 1 essa norma deixa de ter rótulo divergente (o artigo 3º passa a ser lido) e a asserção quebra (`div[0]` indefinido). Não é regressão do motor: o exemplo precisa trocar. Candidatos reais que continuam com divergência e têm cada um um ponto só: **43595/42987** (`IV –` lido onde está escrito `V`) ou **41098** (cadeia de 5, todas +1). Nas demais baterias (47 + 13 + 30 + 11 + 29 + 7 + 16 de regressão, 72 promulgação parcial, 62 estrutura, 27 referências, 26 blocos sem aspas, etc.) 0 falhas; `normateste.mjs` igual byte a byte.

## 6. Para o painel: o que mostrar ao revisor nos casos B (e como achar o que importa)

O ganho maior não é código no leitor, é **não obrigar o revisor a olhar 56 divergências para decidir uma**. Das 21 que sobram, 14 têm um padrão de **deslocamento constante** (cada divergência está +k do esperado): 39862 (56 × −1), 41098 (5 × +1), 40311 (2 × +1), 37090… Proposta:

1. **Agrupar a cascata** (`roteiroDeConferencia`/`ancorarConferencia`): mostrar só a **primeira** divergência e dizer "as outras N têm o mesmo deslocamento de ±k: são consequência". Sem inventar redação — é aritmética sobre rótulos já extraídos.
2. **Frase pelo tipo**, usando só o que está no texto:
   - artigo: "A lei passa do art. {a} para o art. {b}. Confira se existe art. {a+1} no original; se não existe, marque *defeito de fonte*."
   - inciso/parágrafo: "O texto escreve `{escrito}` onde o motor leu `{lido}`. O dispositivo anterior termina em `{; e}`" (quando o anterior termina em `; e`/`e`/`ou`, dizer "**o anterior termina com «e»: este seria o último**, o rótulo escrito provavelmente está errado" — é o indício que sustentou 43595, 42987, 38249 e 39138).
   - repetido (`Art. 8º` duas vezes): "O rótulo `{x}` aparece duas vezes (linhas {l1} e {l2}). Se uma delas traz «(Republicação)», é a forma já decidida; confira."
   - bloco (B2): "O bloco fecha (`”`/`(NR)`) na linha {l}, mas a introdução manda **incluir** {dispositivo citado}, que aparece depois do fecho (linha {m}). Confira se faltou a aspa de fecho no fim."
3. **Mostrar o trecho de origem com 3 linhas antes e 3 depois** do ponto, com o rótulo escrito destacado (a âncora já existe: `ancorarConferencia`).
4. Para D1 (o que o patch 1 passa a reportar como `bloco_sem_fechamento_de_aspas`, confiança baixa): "Fronteira do bloco adivinhada: o bloco termina antes de `Art. {n+1}`. Confira se o fecho `”` está mesmo ausente".

## 7. O que é decisão do mantenedor

1. **Estender a decisão 9 ao caso "tem fecho, mas é o do bloco seguinte"** (patch 1b): hoje só vale quando não há fecho nenhum. Evidência: 8 normas da lista (42216, 39825, 40134, 38297, 51463 + 3 de D1a), 6 antigas. Recomendação: aceitar; sai "a revisar" com confiança baixa, nunca "aceita limpa". Alternativa: manter só o patch 1a (consertar o separador), que resolve 3 (37352, 38051, 39258) sem decisão nova.
2. **Separar dispositivo embutido no preparo** (patch 2a) muda o texto lido (só quebras de linha; `alnum` idêntico). Recomendação: aceitar com a guarda do sucessor exato; **não** estender a incisos soltos.
3. **Trocar o exemplo real de `teste_revisao.mjs`** (item 5).
4. B2 (fecho no lugar errado antes de inclusões): manter como defeito de fonte, ou decidir uma regra "inclusão depois do `(NR)`" (não recomendo: exigiria ler a introdução).
5. Para A1 (digitalização ruim): decidir se vale rodar OCR próprio nos 3 (44305, 44307, 37090), ou o revisor marca "defeito de fonte".

## 8. Ordem de ataque

1. Patch 4 e patch 5 (menores, sem decisão): 1 linha cada. (Patch 5 é opcional; não ajuda nenhuma da lista-alvo.)
2. Patch 2 (D2 + D3): 8 normas viram "aceita", nenhuma decisão nova, alnum preservado.
3. Patch 3 (D4): 2 normas "aceita"; precisa trocar nada nos testes.
4. Patch 1a (separador do `Art. (n+1)`), depois patch 1b se o mantenedor autorizar (item 7.1).
5. Trocar o exemplo de `teste_revisao.mjs`; subir `VERSAO_ESTRUTURADOR` para 19; CHANGELOG; baterias antes/depois.
6. Painel (item 6): agrupar cascata e frases por tipo — vale mais que qualquer outro conserto para as 11 normas B.

## 9. O que não consegui verificar

- **Defeito da lei × perda na extração** para B1: tenho só o texto extraído. Em 43595, 42987, 38249, 39138 e 42356 há indício forte de erro de digitação da lei (`; e` no penúltimo, ementa com 7 itens). Em **41098, 40311 e 41723** (salto simples) não há indício adicional; a camada de texto do PDF costuma ser fiel ao impresso, mas só o PDF confirma. Nenhuma outra norma do acervo cita os dispositivos que faltam (LC 835 e LC 777 não são citadas em nenhum texto; da LC 810 e LC 694 só há citações a outros artigos).
- **DOCX (36634, 36316, 37042…)**: sem o `.docx` bruto (a Release `textos-brutos` não está acessível daqui; `dados/_bruto/` está fora do git e ausente). Não sei se o rótulo `a)` da 36316 é numeração automática de lista ou erro, nem se o deslocamento de `999, e alteraç` da 36634 está no documento ou vem da conversão.
- **OCR** das 3 de A1: não rodei.
- **Efeito do patch 2a no painel**: o painel mostra o texto lido; a quebra de linha adicional deve aparecer lá. Não abri o `docs/revisao.html`.
- Executei apenas código puro em cópia (nenhum coletor, nenhum `estruturar.mjs`, nenhuma rede). O repositório não foi alterado além deste arquivo.
