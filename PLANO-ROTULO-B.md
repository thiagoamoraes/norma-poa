# PLANO-ROTULO-B: causa do motivo `rotulo_nao_confere_com_a_origem` (26 normas recentes, metade B)

Pesquisa somente leitura (20/11/2026). Nada do repositório foi alterado além deste arquivo. Os consertos foram provados em cópia
no scratchpad e estão no patch
`/tmp/claude-0/-home-user-norma-poa/6f77e18e-f055-5f0b-99c2-42f683ae1059/scratchpad/agente-b/conserto.patch` (190 linhas, 9 trechos, 4 arquivos).
A resposta de agente é insumo, não autoridade (regra 12): tudo abaixo foi reproduzido chamando `estruturarNorma` e
`ancorarConferencia` sobre `prepararTextoExtraido(dados/textos/sapl/<id>.txt)`, nas 823 normas com registro.

## 0. O que o motivo realmente mede

`atribuirDesFixoOriginal` (`norma-core.js:1165`) dá a **cada dispositivo o rótulo da POSIÇÃO** (`Art. ${ai+1}`, `§ N`, `roman(i+1)`,
`alphaLabel(i)`), ignorando o rótulo escrito. `conferirConservacao` (`ingestao/estrutura.mjs:93-128`, comparação na linha 119) confere se o
que está escrito logo antes do trecho termina com esse rótulo posicional. Logo o motivo é, na prática, o **detector de deslocamento**: dispara
quando o leitor perdeu, fundiu ou inventou um dispositivo, ou quando a lei numera fora da sequência. Um rótulo errado vira cascata (um artigo
engolido desloca todos os seguintes: ids 39862 = 56 divergências, 36316 = 46, 36641 = 38). Por isso a maior parte das causas abaixo é erro
real de leitura ou de fonte, e o motivo **não deve ser afrouxado**.

Reprodução: as 26 normas da lista (`rot_b.json`) reproduzem o motivo; o acervo inteiro tem 151 normas com ele, 53 delas recentes.

## 1. Tabela causa × contagem × ids (26 normas, causa PRIMÁRIA da 1ª divergência)

| Classe | Causa | N | Ids | Resolve por código? |
|---|---|---|---|---|
| A1 | Marcador de dispositivo colado ao fim da linha anterior (extração/DOCX perdeu a quebra) | 3 | 48855, 37042, 36316 | Sim, 48855 inteiro; 36316 e 37042 só em parte (sobra causa B) |
| A2 | Bloco de alteração engole o artigo seguinte porque o FECHO do bloco está estragado no texto (`( NR)`/`(N R)` com espaço; glifo `Δ` truncando; ruído de OCR no lugar de `” (NR)`) | 3 | 37358, 40134, 38297 | Só 37358 (espaço em `(N R)`); 40134 e 38297 são defeito de fonte/OCR |
| A3 | Documento repetido 3x no mesmo arquivo, com espaçamento diferente (decisão 24) | 1 | 39600 | Não (regra existente: revisor marca "defeito de fonte") |
| A4 | Camada de texto do PDF estragada (espaços dentro de número/palavra, lixo de OCR embutido) | 2 | 37491, 37090 | Não (OCR/extração nunca é corrigido por regra) |
| B | Defeito de fonte: rótulo escrito errado, duplicado ou com salto | 7 | 39862, 43595, 42987, 41098, 40311, 39138, 41723 | Não (e não deve) |
| C1 | Artigo PRÓPRIO da lei com sufixo de letra ("Art. 31-A") lido por posição | 1 | 49739 | Não sem decisão (ver 4) |
| C2 | Alteradora sem aspas / bloco não delimitado, com artigos inseridos lidos como da própria alteradora | 4 | 38051, 37629, 36841, 36400 | Não (decisões 6, 9, 10, 12) |
| C3 | Bloco de alteração sem fecha-aspas/`(NR)` porque o veto removeu o fim; o bloco invade o artigo seguinte | 1 | 42216 | Não (decisão 9: fronteira inferida) |
| C4 | Promulgação parcial: rótulo escrito é o do dispositivo promulgado ("Art. 185"), o motor numera o fragmento como "Art. 1º" | 2 | 51485, 42401 | Não sem decisão (ver 4) |
| D | Bug do leitor com causa identificada | 2 | 44398, 36641 | **Sim** |
| E | Falso positivo puro da conferência | 0 | (contribui em 39138, 36400, e em 26189, 28021 da outra metade) | Sim |

Total 26 (3+3+1+2+7+1+4+1+2+2+0). Nenhuma das 26 é só falso positivo, mas E aparece como causa SECUNDÁRIA em 39138 e 36400.

### Evidências (trecho exato da origem x rótulo do motor)

**A1, 48855** (DOCX da LC 1.017/2024, sem fecho). Origem, tudo numa linha:
`Art. 2º VETADO Art. 3º VETADO Art. 4º VETADO ... Art. 10. VETADO` e depois `Art. 11. VETADO`. O leitor só vê "Art. 2º" e dá a `Art. 11.`
o rótulo `Art. 3º` (`Art. 3º <= Art11`). **A1, 37042** (DOCX da LC 661/2010): `…cada setor da Administração Pública.` e, na mesma
linha, `Art. 3º Os Conselhos…`, e `…norma instituidora da organização. § 4º O Legislativo…`; o motor numera `Art. 2º` o que está escrito
`Art. 3º` (`Art. 2º <= Art3º`). **A1, 36316** (DOCX da LC 628/2009): `…à Comissão Eleitoral. Art. 101. A Junta Eleitoral expedirá…`; cascata
do `Art. 101.` até o 143 (`Art. 101. <= Art102`).
Nasce em `prepararTextoExtraido` (`ingestao/extracao-texto.mjs:205`), que não separa marcador colado no meio da linha (só trata o
"Art. 1º" do preâmbulo, `separarArtigoDoPreambulo`, linha 312). O parser (`parseMinuta`, `norma-core.js` ~709) só reconhece `Art.` no início da linha.

**A2, 37358** (PDF da LC 674/2011, espaçamento ruim): bloco do Art. 1º termina em `reestimativa fiscal.” (N R)`. `reFechaNR`
(`norma-core.js:880`) só aceita `(NR)`; o bloco não fecha e engole o `Art. 2º` inteiro (`Art. 2º <= Art3º`, `Art. 3º <= Art4º`).
**A2, 40134** (LC 766/2015): `§ 2º A parcela Δ` e o texto do bloco do Art. 3º simplesmente termina (glifo `Δ`), sem `” (NR)`; o bloco invade
o `Art. 4º` (`Art. 4º <= Art5º` ...). **A2, 38297** (Emenda 35/2012, OCR): depois do `Art. 61` aparece a linha de lixo
`CO COL CL LOL LDO LOCO DLLONL ...` no lugar de `” (NR)`; o bloco engole o `Art. 2º` (`Art. 2º <= Art3º`).

**A3, 39600**: o arquivo traz o texto da lei 3 vezes (`Faço saber` em 3 pontos); as duas primeiras cópias são iguais só em letras e algarismos
(2098 = 2098), a 3ª é truncada (1673). `removerRepeticaoDeTexto` exige igualdade exata, então não remove (`Art. 4º <= Art1º`, `Art. 7º <= Art1º`).
É o mesmo grupo da decisão 24 (ids 38364, 37136), sem regra nova.

**A4, 37491**: `Art. 1 5. Os elementos de urbanização e xiste nt es...`; o parser lê `Art. 1` e deixa `5. Os elementos` como texto
(`Art. 15. <= Art1`). **A4, 37090**: `Art 2° Na UEU 10...`, `Art. 30/ NaUEU 50 ‘da,M’ 08, fi’c’ani alteràdos` (texto de OCR embutido no PDF);
o `Art 1` sumiu (`Art. 1º <= Art2`, `Art. 2º <= Art30`).

**B (rótulo escrito errado ou com salto na própria lei)**
- 39862 (LC 757/2015): dois artigos "Art. 8º" (`...firmada por meio de TCV.` / `Art. 8º A compensação vegetal ... § 3º`), `Art. 9º <= Art8º`, 56 divergências em cascata.
- 43595 e 42987 (os dois apontam para o MESMO arquivo `lei_complementar_no__932.pdf`; vale checar no catálogo se são a mesma norma): `III – idade...; e` seguido de `V – sorteio.`, sem IV (`IV – <= V`). 42987 ainda tem `numero_diverge_do_catalogo` e `data_diverge_do_catalogo`.
- 41098 (LC 810/2017): `III – Smams...: a) b) c);` depois `V – SMIM`; `IV – <= V`, `V – <= VI` ...
- 40311 (LC 777/2015): `II – ...; IV – estiver sobre coletores...` (`III – <= IV`, `IV – <= V`).
- 39138 (LC 721/2013): depois de `XVIII –` o texto escreve `IX – um conjunto de conhecimentos...` onde deveria ser XIX (`XIX – <= IX`). Sobra 1 divergência (as outras 2 eram E, ver abaixo).
- 41723 (LC 835/2018): Art. 9º seguido de `Art. 11. Ficam revogados:`, sem Art. 10 (`Art. 10. <= Art11`); e `§ 17. VETADO.` depois do fecha-aspas do bloco do Art. 1º (`Parágrafo único. <= 17`).
  Pode ser veto de artigo inteiro omitido no texto publicado; não dá para provar só com este arquivo.

**C1, 49739** (LC 1.037/2025): `Art. 31.` seguido de `Art. 31-A. Fica alterada a ementa da Lei nº 11.405...` e `Art. 32.`; o motor
dá `Art. 32.` ao 31-A (`Art. 32. <= Art31A`, 11 divergências).

**C2** (alteradora sem aspas): 38051 (LC 690/2012): `Art. 29-B Observadas as peculiaridades...` é texto inserido (não aspado) lido como
Art. 2º da alteradora (`Art. 2º <= Art29B`); 37629 (LC 681/2011): `Art. 51-A ... Art. 51-K` lidos como Arts. 2º a 12 (`Art. 2º <= Art51A`);
36841 (LC 646/2010, republicação): artigos e incisos da lei alterada sem aspas, com `alteracao_sem_aspas_nao_delimitada`; 36400 (LC 632/2009):
bloco `“Art. 21. ....` sem fecho (o `I –` lido é na verdade `XX –`).

**C3, 42216** (LC 859/2019): o bloco do Art. 2º termina em `§ 18. VETADO. I – VETADO. ... § 19. VETADO.`, sem `” (NR)`; o bloco de 5118 caracteres vai até o `(NR)` do
Art. 3º e engole a introdução do Art. 3º (`Art. 3º <= Art4º`, 18 divergências). Confirmado pelo registro estruturado: `art-2/par-12` guarda o bloco de 5118 chars.

**C4, 51485** (LC 1.075/2026, art. 185 § 3º) e **42401** (LC 872, "com e sem veto"): fragmento com `Art. 185.` / `Art. 8º`, `Art. 9º`... numerados 1º, 2º...
Ambos já têm `promulgacao_parcial`.

**D, 44398 e 36641**: `ROM` em `norma-core.js:79-81` para em XXV e `roman = n => ROM[n] || String(n)` (linha 82) devolve `"26"`; do 26º inciso em diante o rótulo
vira `26 –` (`dispositivo_sem_rotulo`, `endereco_repetido`, e o motivo de rótulo: `26 – <= XXVI`). Em 36641 há uma 2ª causa: `reInc = /^([IVXLCDM]{1,6}…/`
(`norma-core.js:620`, 943 e 1583) não reconhece incisos com 7 ou 8 letras (XXXVII, XXXVIII), que viram continuação do anterior e deslocam todos os seguintes.

**E (falso positivo da conferência)**: quando o texto do dispositivo é vazio (`……` omitido, ou inciso sem conteúdo), `pos = cursor` e a conferência olha o que está
ANTES do cursor, mas o rótulo desse nó está logo DEPOIS. Casos: 39138 (`IV –` sem texto, seguido de `V –isenção...`; `IV – <= ''`), 36400 (`§ 1º ......`; `§ 1º <= ''`),
e 26189 e 28021 da outra metade. Em 39138 e 36400 o rótulo estava certo.

### Falso negativo achado de passagem (E2): `endsWith(marca)` aceita sufixo

`antes.endsWith(marca)` aceita "I –" onde está escrito `XXXI –`, "5" onde está "15", "V" onde está "IV". Medido nas 823: 6 normas
(26156, 28014, 29061, 34079, 35288, 43543) têm rótulo posicional "ok" que na verdade é outro. Caso grave: **43543** (recente, hoje `aceita`):
`” (NR)` fecha o bloco do XIX, vêm `......` e `XXXI – serviços previstos no subitem 14.14...` SEM aspas de abertura; o leitor guarda como `art-1/inc-I` da alteradora e a
conferência diz "ok" porque "xxxi" termina em "i". É um falso aceite real.

## 2. Menor conserto por causa e onde (todos provados em cópia nas 823 normas)

Resultado combinado (D + E + A1 + NR espaço), sem E2: **normas que perdem o motivo: 11**
(26189, 28021, 36641, 37043, 37358, 38364, 44398, 48003, 48855, 49557, 51486), **normas que ganham motivo: 0**,
outros motivos que mudam: só desaparecem `dispositivo_sem_rotulo`/`endereco_repetido` (28813, 36641, 38364, 40111, 44398, 49557, 51486),
nenhum aparece. Situação `revisar` → `aceita`: 26189, 36641, 37043, 44398, 48003, 49557, 51486. Acervo: 151 → 140 normas com o motivo
(recentes 53 → 44; recentes `aceita` 378 → 384). Das 26 da lista: perdem o motivo 48855, 44398, 36641, 37358; reduzem 39138 (3→1), 36400 (2→1), 37042 (13→5), 36316 (46→2).

1. **D1: estender `ROM`/`roman` além de XXV** (`norma-core.js:79-82`). `roman` passa a calcular o numeral para 1..3999 (tabela de 1..200 + gerador). `romanToInt`/`romVal` só usam `ROM.indexOf` e não são chamadas em nenhum outro lugar do repositório (grep). Muda endereços (`inciso-sem-rotulo` → `inc-XXVI`): correção de bug, mas afeta ids de norma já estruturada (ver riscos).
   Perde o motivo: 44398, 36641 (junto com D2), 49557, 51486, 38364, 28813, 40111 (estes 4 últimos só perdem `dispositivo_sem_rotulo`/`endereco_repetido` ou o de rótulo).
2. **D2: `reInc` com `{1,12}` em vez de `{1,6}`** (`norma-core.js:620` e `:1583`; a `:943` `reIncX` não foi tocada). Prova: só 7 normas mudam de dispositivos nas 823 (28813, 36641, 38364, 40111, 44398, 49557, 51486 — todas por D1/D2, sem texto mudado fora dos incisos). Um glossário em maiúsculas poderia casar ("CIVIL – ...", já casava com 5 letras); se o mantenedor preferir, trocar por validação de numeral romano bem-formado.
3. **E1: omitido/sem texto conferido de forma EXATA** (`conferirConservacao`, `estrutura.mjs` ~93-128). Trechos vazios consecutivos ficam pendentes; ao localizar o próximo trecho com texto, o que sobra entre o cursor e ele tem de ser, na ordem, os rótulos dos vazios (e o do próprio trecho), com `Art`/`Artigo`/`Parágrafo` opcional antes. Comparação exata (`^…$`), não prefixo. Prova: perdem o motivo só 26189 e 28021; 39138 e 36400 reduzem. Casos negativos (sintéticos, rotulados): `§ 1º` omitido com `§ 2º` escrito continua DIVERGE; omitido `II` com `III` escrito continua DIVERGE (script `sint.mjs`).
4. **A1: `separarDispositivoColado` no preparo** (`extracao-texto.mjs`, encadeada em `prepararTextoExtraido`, linha 205). Quebra a linha antes de `Art. N` ou `§ N` só se: vem após `.` `;` `:` ou `VETADO`; é o SUCESSOR exato (`Art.` = último artigo visto + 1; `§` = último parágrafo + 1); é seguido de maiúscula (ou VETADO); só `Art.` com A maiúsculo; "Parágrafo único" não entra. Efeito medido: 24 linhas novas em 7 arquivos (35934, 36316, 36841, 37042, 37043, 37090, 48855), todas conferidas à mão como quebras corretas. Perdem o motivo 37043 e 48855. Negativos: `Art. 74` fora de sequência, `art. 5º` minúsculo e `§ 2º` sem `§ 1º` antes não quebram. Residual conhecido: citação que por acaso seja o próximo número, depois de ponto, em maiúscula (não ocorreu no acervo).
5. **A2 (parte): tolerar espaço em `(NR)`** (`norma-core.js:880`, `reFechaNR`: `\(\s*N\s*R\s*\)`). Perdem o motivo 37358 e 48003 (esta passa a `aceita`); 37422 passa a ler 44 dispositivos em vez de 29 (ainda `revisar`, por `sem_fecho`). **Efeito colateral nos testes:** `teste_revisao.mjs` (4 asserções sobre `fixtures/textos/lc1005_2024.txt`, que tem `” ( NR)` com espaço) deixa de reproduzir o "artigo 10 engolido" que a fixture documenta: com o conserto a LC 1.005/2024 é lida certa e perde o motivo. É melhoria real, mas exige trocar a fixture desse teste por um caso que ainda diverge (42216 ou 39862, por exemplo), com `(sintético)` onde couber.
6. **E2 (reforço, NÃO é afrouxamento; ganha motivo)**: exigir, no texto original, que o caractere antes do rótulo não seja letra/algarismo (salvo `Art`/`Artigo`/`Parágrafo` colado). Só restringe: nunca aceita o que antes recusava. Ganham motivo 6 normas, todas com rótulo realmente errado (29061, 34079, 35288, 43543, 26156, 28014); 4 deixam de ser `aceita` falsa (29061, 34079, 35288, 43543). Positivos sintéticos: `I` onde está `XXXI` e `Art. 5º` onde está `Art. 15` passam a DIVERGE; `Art.5º` e `Art5º` colados seguem aceitos. Como ele AUMENTA o número de motivos, é decisão do mantenedor (seção 4), fora do pedido "não pode ganhar motivo".

Bateria no código copiado (sem `dados/`): `teste_regressao` 47, `teste_vetado_provenencia` 13, `teste_pecas_2_3` 30, `teste_lei_publicada` 11, `teste_peca4` 29, `teste_urn` 7,
`teste_gruposAntes` 16, `teste_promulgacao_parcial` 72, `teste_estrutura` 62, `teste_referencias_alvo` 27, `teste_blocos_sem_aspas` 26, `teste_emenda_lo` 12,
`teste_nr_linha_seguinte` 9, `teste_item_continuacao` 4, `teste_agrupadores` 12, `teste_versionamento` 34, `teste_historico` 24, `teste_minuta` 33,
`teste_leis_ordinarias` 20, `teste_textos_sapl` 36: contagens idênticas antes e depois; `normateste.mjs` byte a byte idêntico.
Única diferença: `teste_revisao` (ver item 5). `teste_ruido_de_pagina` só imprimiu no meu ambiente sem `dados/` e não foi comparável (falha igual na cópia original).
Ainda falta, na integração: teste novo por conserto que **falhe no código antigo** (os sintéticos de `sint.mjs` falham 10 de 16 no antigo, ver abaixo) e teste de texto real (44398, 36641, 48855, 37358).

Teste sintético (`scratchpad/agente-b/sint.mjs`): no código original, falham D (2), A1 (2), NR (2), E+ (2), E2 (2) = 10; os 6 negativos (E-, A1-) passam nos dois. No conserto, 16/16.

## 3. Riscos

- **Mudança de ids de dispositivo** em normas já estruturadas (`inciso-sem-rotulo` → `inc-XXVI`, `endereco_repetido` some). `VERSAO_ESTRUTURADOR` tem de subir; decisões humanas (`decisoes.jsonl`) amarradas a `versaoEstruturador` reabrem só se o veredito mudar (decisão 7): as 7 que passam a `aceita` são o caso. Verificar que nenhuma tinha decisão por endereço antigo.
- D1/D2 tocam o **core** (`norma-core.js`): bateria antes/depois obrigatória (feita em cópia; refazer no repositório) e espelho em `norma-simulacao.html` (cópia embutida do parser) se `reInc`/`roman` forem usados lá.
- A1 é heurística de texto: sucessor exato + pontuação + maiúscula é estrito, mas nunca é à prova de citação em maiúscula. Limitada a 24 quebras no acervo, todas conferidas.
- E1 e E2 mexem na própria conferência: ambos foram escritos para só restringir ou só validar de forma exata, com casos negativos; revisão de código humana recomendada antes de integrar.
- Até aqui nenhum conserto afrouxa a conferência; os 6 casos de E2 mostram que a heurística atual já deixava passar rótulo errado.

## 4. O que deve ser decisão do mantenedor, não código

1. **Rótulo posicional x rótulo escrito (C1, C4 e a raiz de B).** A decisão 5 já fez o motor seguir o rótulo escrito para "§ 1º sozinho". Estender a ARTIGOS (`Art. 31-A`, `Art. 185` em promulgação parcial, `Art. 8º` duplicado) e a incisos/alíneas seria uma decisão de política: o endereço passaria a ser o escrito. Alerta: se o rótulo posicional for substituído pelo escrito sem mais nada, a conferência de rótulo vira tautológica e **perde a função de detectar artigo engolido** (42216, 40134, 38297, 37358 passariam em silêncio, pois o Art. 3º/4º/2º sumiu da árvore e ninguém diria). Se a decisão for adotar o escrito, o motor precisa de uma conferência nova de sequência ("faltou N", "N repetido", "N fora de ordem") com motivo próprio e título em português (decisão 17). Não implementei.
2. **E2** (reforço do sufixo): aumenta a fila de revisão em 6 normas (1 recente `aceita` → `revisar`: 43543). Tecnicamente só corrige falso aceite.
3. **C3 e C2** seguem as decisões 6, 9, 10 e 12 (fronteira de bloco inferida só marca para revisão, o revisor só aceita ou marca defeito de fonte). Nada novo no motor.
4. **B**: o revisor marca "defeito de fonte"; sugiro que o roteiro de conferência do dashboard (decisão 13) para este motivo mostre o recorte "o que está escrito" x "o que o motor esperava" (já existe em `naOrigem`). Sem mudança de motor.
5. **A3** (39600, e 38364/37136 da decisão 24): nenhuma regra nova; só registrar 39600 como mais um caso.
6. **43595 e 42987 apontam para o mesmo arquivo** (`lei_complementar_no__932.pdf`): o mantenedor decide se são a mesma norma ou erro de vínculo do catálogo.

## 5. Ordem de ataque

1. D1 + D2 (bug claro, sem ambiguidade, 7 normas, nenhum motivo novo).
2. E1 (falso positivo; 2 normas; reduz ruído em 39138 e 36400).
3. NR com espaço (`reFechaNR`): ganho real de leitura (3 normas + 37422); trocar a fixture de `teste_revisao`.
4. A1 `separarDispositivoColado` (2 normas, depende de leitura humana das 24 quebras, já feita).
5. Decisão 4.1 (rótulo escrito x posicional) e E2, junto com a sequência de conferência de artigos.
6. Só depois, qualquer coisa em C2/C3.

## 6. Não consegui verificar

- Se 43595 e 42987 são a mesma norma, ou se o PDF de origem traz mesmo o salto "III → V" (só tenho a camada de texto extraída; para B não distingo defeito da lei de perda na extração em 41098, 40311, 41723, 37042).
- Se `37042` perde de fato os Arts. 13 e 14 na fonte (a sequência escrita salta de Art. 12 para Art. 15): não abri o DOCX original.
- `teste_ruido_de_pagina.mjs`, `teste_revisao.mjs` e demais testes que dependem de `dados/` rodaram em cópia sem `dados/`; `teste_revisao` só roda no repositório real (o que apareceu foi só a quebra por causa da fixture da LC 1.005/2024, confirmada com `t1005.mjs`).
- Efeito dos consertos em `norma-simulacao.html` (parser embutido) e em `estruturar.mjs` ponta a ponta (não rodei, por regra).
- Não rodei o dashboard (`gerar-revisao.mjs`); `ancorarConferencia` reaproveita `conferirConservacao`, mas a ordem de `rotulosDivergentes` (usada para casar `naOrigem` com os itens) foi preservada no E1 (os pendentes são empurrados antes do trecho seguinte); não testado contra o HTML gerado.
