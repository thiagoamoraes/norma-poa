# Norma — norma-core.js — changelog desta rodada
 
Testado contra 4 documentos reais: LC 320/1994 (original promulgada), LC 384/1996
e LC 412/1998 (alteradoras, com links markdown do leis.org), e a versão
COMPILADA da LC 320 (PDF do leis.org, "NORMA EM VIGOR", com histórico de
redações empilhado). Bateria de regressão: `teste_regressao.mjs`, 39/39.
 
## Terminologia nova, usada no código e nos comentários daqui pra frente
- **compilado**: formato leis.org — o mesmo endereço (ex. "art. 4º") repete
  várias vezes em sequência, uma por versão histórica, cada uma com anotação
  marginal. É o que dá pra copiar do site.
- **consolidado**: só o texto vigente, um dispositivo por endereço. É o que
  vocês usam no dia a dia. `parseLeiAlvoIndex`/`parseLeiAlvoAnotacoes` agora
  recebem compilado como entrada e devolvem consolidado como saída.
## Bugs corrigidos
 
### 1. Designador com sufixo de letra corrompia o corpo do texto (crítico)
`Art. 9º-A`, `Art. 12-A`, `Art. 12-B` etc — inserção intermediária padrão
(art. 17 da LC 611/2009). O parser principal (`parseMinuta`) não reconhecia
o sufixo `-[A-Z]`, só o parser de bloco NR (`extrairRedacaoAlterada`)
reconhecia. A letra vazava pro início do corpo do texto do dispositivo:
"Art. 9º-A O Executivo..." virava texto "A O Executivo...".
**Fix:** `reArt`, `rePar`, `reInc`, `reAli`, `reIte` em `parseMinuta` agora
aceitam o mesmo sufixo `(?:-[A-Z])?` que o parser de bloco NR já aceitava.
 
### 2. `normalizar()` geraria falso positivo de grafia para designador com sufixo
Consequência direta do fix acima: a canonização de grafia em `normalizar()`
deriva o designador "correto" pela posição no array (`doc.artigos.indexOf(n)+1`),
o que não se aplica a um `Art. 5º-A` inserido. **Fix:** designadores com
sufixo de letra (detectados via regex no `rawL`) pulam essa checagem
posicional.
 
### 3. Reticência de omissão de caput ("Art. 2º ...") virava "." em vez de omitido
Em `extrairRedacaoAlterada`, o regex do designador comia até 2 caracteres de
pontuação antes de capturar o resto da linha — para "Art. 2º ..." (reticência
de 3 pontos marcando "caput inalterado"), 2 pontos eram engolidos pela classe
de pontuação e sobrava só 1, que não batia mais com o teste de omissão
(`{3,}`). Achado com dado real (LC 384/1996, art. 1º). **Fix:** os regexes
(`reArtX`, `rePUnX`, `rePX`) não comem mais pontuação na própria expressão —
capturam o resto cru e uma função `limparSeparadorX()` decide, em código,
se o que sobrou é reticência de omissão (preserva) ou separador comum
(remove até 2 caracteres).
 
### 4. Links markdown do leis.org quebravam qualquer extração por regex
Texto copiado do leis.org traz número de lei como link colado —
"Lei Complementar nº[320](https://...)" — sem espaço antes do colchete.
**Fix:** novas funções `limparMarkdownLinks()`, `limparRuidoLeisOrg()` (tira
banner "NORMA EM VIGOR" e rodapé de proveniência) e `prepararTextoOrigem()`
(as duas combinadas). Recomendado rodar antes de qualquer outra função do
módulo quando o texto vier de cópia web.
 
### 5. `parseLeiAlvoIndex()` concatenava histórico + vigente no mesmo texto
Não foi desenhada pra formato compilado — quando o mesmo endereço reaparecia
(dispositivo com histórico), o texto de todas as versões era concatenado
numa string só, misturando conteúdo revogado com vigente. Confirmado com
`art. 4º`, `art. 5º`, `art. 8º`, `§ 3º do art. 2º` do compilado real.
**Fix:** `walkLeiAlvo` agora sinaliza quando uma linha é cabeçalho de um novo
endereço (`éCabecalho`); `parseLeiAlvoIndex` reinicia a acumulação nesse
ponto em vez de concatenar. Resultado: o índice reflete só o vigente — desde
que a ordem do documento coloque a versão mais recente por último (premissa
do formato leis.org, documentada no JSDoc, não é garantia universal).
 
### 6. `parseLeiAlvoAnotacoes()` não reconhecia "Redação acrescida" nem "Suprimido"
O regex `REANOT` só cobria "Redação **dada**" (substituição), não "Redação
**acrescida**" (inclusão) — que é a fórmula padrão pra quase metade das
anotações de um documento real (§§ 1º/2º/4º do art. 2º, §4º do art. 8º,
parágrafo único do art. 5º, todos os incisos do art. 9º...). Também não
reconhecia "Suprimido" (dispositivo vetado/removido). **Fix:** alternativas
`Reda[çc][ãa]o\s+acrescid[oa]` e `Suprimid[oa]` adicionadas. Mesma correção
de "última ocorrência vence" do item 5 aplicada aqui.
 
## O que ainda NÃO foi resolvido (documentado como limitação conhecida)
 
**Anotação em bloco não propaga pros dispositivos-irmãos sem tag própria.**
Quando uma lei dá nova redação a um artigo inteiro (caput + parágrafos), o
leis.org às vezes anota só o ÚLTIMO dispositivo do bloco. Ex.: LC 412/1998
deu nova redação ao art. 8º inteiro, mas a tag só aparece depois do § 3º —
caput, § 1º e § 2º ficam "sem anotação própria" mesmo tendo mudado junto.
Resolver isso exigiria inferir os limites do bloco alterado por heurística
de texto, o que é arriscado de acertar — documentado no JSDoc de
`parseLeiAlvoAnotacoes`, fica para quando a peça 4 (motor de consolidação)
tiver uma modelagem estrutural de "patch por bloco".
 
## Peças novas
 
### `extrairCabecalhoLeiPublicada(raw)` — peça 1 do roadmap
Extrai `{ tipoAto, numero, ano, dataPublicacao (ISO), dataExtenso }` do
cabeçalho de uma lei promulgada ("LEI COMPLEMENTAR Nº 320, DE 2 DE MAIO DE
1994."). Desacoplada de `parseMinuta` (que continua tratando só o formato
"PROJETO DE LEI Nº X/AAAA") — rodar em paralelo e mesclar o resultado em
`doc`, para não arriscar quebrar o reconhecimento de epígrafe de minuta que
já funciona. Testada contra os três cabeçalhos reais (LC 320, 384, 412),
incluindo mês com cedilha ("março") e dia com zero à esquerda.
 
### `vetado` — novo campo no nó da árvore
Mesmo espírito de `omitido`: um parágrafo cujo texto é só "VETADO." fica
marcado (`n.vetado = true`), mantendo a posição na árvore (tradição de
compilação legislativa) mas sinalizando que não é conteúdo normativo real —
pro resolvedor de citações e o motor de consolidação não tratarem "VETADO"
como texto de dispositivo. Detectado em `normalizar()`.
 
## Estrutura do nó — atualizada
```
{ id, tipo, texto, children[], conj, desFixo?, gruposAntes?, omitido?, vetado?, nrBloco? }
```
 
## Arquivos de teste
- `teste_regressao.mjs` — 39 asserções cobrindo os 6 fixes acima, contra os
  4 documentos reais.
- `teste_pecas_2_3.mjs` — 30 asserções cobrindo as peças 2 e 3 (abaixo).
- `diagnostico.mjs` / `diagnostico_compilado.mjs` — scripts exploratórios
  usados para achar os bugs (mantidos para referência, não são suite formal).
---
 
# Rodada 2 — Peças 2 e 3 (resolvedor + extrator de comando)
 
## Peça 2 — Resolvedor de referência interlegislativa
 
`extrairReferenciasLei(texto)` — encontra citações a OUTRAS leis em texto
corrido (não dispositivos — isso já existia via `extrairCitacoesExternas`).
Cobre forma extensa ("Lei Complementar nº 320, de 2 de maio de 1994") e
abreviada ("Lei Complementar nº 320/94"). Ano de 2 dígitos é ambíguo — em vez
de adivinhar o século, devolve `anosCandidatos: [1994, 2094]` e deixa o
resolvedor tentar os dois contra a coleção carregada.
 
`chaveLei(tipoAto, numero, ano)`, `construirIndiceColecao(colecao)`,
`resolverReferenciaLei(ref, indice)` — infraestrutura de indexação/resolução
contra uma coleção em memória. Testado resolvendo as citações reais da LC 384
e LC 412 de volta pra LC 320 (forma extensa e abreviada).
 
**Achado ao testar:** "Lei Orgânica do Município" (citada no preâmbulo da
LC 412) não gera falso positivo — o regex exige "Lei (Complementar)? Nº"
imediatamente seguido de número, e "Lei Orgânica" não tem "Nº" ali. Bom sinal,
não precisou de lista de exclusão.
 
## Peça 3 — Extrator de comando
 
`extrairComandosLei(docAlteradora, opts?)` — classifica cada artigo da
alteradora em um ou mais comandos: `replace_text`, `insert_node`,
`revoke_node`, `revoke_lei`, `clausula_generica_sem_efeito`,
`indeterminado`, `nao_classificado`.
 
**Decisão de design importante:** quando `opts.leiBaseIndex` (saída de
`parseLeiAlvoIndex` sobre o texto vigente da lei-alvo) está disponível,
`replace_text` vs. `insert_node` é decidido por **existência do endereço**
na lei-base, não por adivinhar o verbo da frase de introdução. Isso importa
de verdade: a LC 412/1998 tem um artigo que "dá nova redação e inclui §§ 1º,
2º e 3º" ao art. 8º num único comando — mistura substituição (caput) com
inserção (parágrafos novos) na mesma frase. Testado dos dois jeitos: com
`leiBaseIndex`, os 4 dispositivos do bloco (caput + 3 parágrafos) saem
corretamente classificados (`replace_text` só o caput, que já existia em
1994; `insert_node` os três parágrafos, que não existiam); sem
`leiBaseIndex`, o fallback por palavra-gatilho classifica os 4 igual —
confirma que o fallback é mesmo mais fraco nesse caso, documentado como tal.
 
**Revogação — três categorias, não duas** (por indicação do usuário: leis
antigas costumam ter "revogam-se as disposições em contrário" como cláusula
de estilo sem alvo real — letra morta):
- `revoke_node` — dispositivo específico citado ("fica revogado o § 2º do
  art. 6º da LC X") — testado com texto sintético (nenhum dos 3 documentos
  reais tem esse padrão).
- `revoke_lei` — lei inteira citada por número. A LC 320, art. 14, tem
  exatamente esse caso: "revogam-se as disposições em contrário,
  especialmente a Lei nº 172/1948; a LC nº 3/1973; ..." — 7 leis nomeadas.
  Gera 7 comandos `revoke_lei`, um por lei citada.
- `clausula_generica_sem_efeito` — gatilho de revogação presente, zero
  citação específica. Confirmado nos dois casos reais (LC 384 art. 4º e
  LC 412 art. 3º, ambos só "Revogam-se as disposições em contrário."). Fica
  registrado como não-acionável — sem `dispositivoAlvo` nem `leiAlvo` — pra
  que o motor de consolidação (peça 4) não tente aplicá-lo nem precise
  adivinhar um alvo que o texto não fornece.
`enderecarNrBloco(nrBloco, enderecoBase)` — função de apoio, nova, exportada
por ser útil isoladamente: converte a subárvore de um bloco NR (que só tem
`desFixo` relativo por nó) em endereços completos no mesmo formato de chave
de `parseLeiAlvoIndex`, combinando com o endereço-base extraído por citação
do texto de introdução do artigo alterador.
 
## Pendências
 
- **`revoke_node` sem validação com dado real.** Testado só com texto
  sintético — nenhuma das leis reais recebidas até agora (LC 320, 384, 412)
  tem revogação pontual de dispositivo (só cláusula genérica e revogação de
  lei inteira por número). Fica pendente validar contra um caso real assim
  que houver um exemplo — o usuário indicou que vai tratar isso em breve por
  ser o padrão de revogação mais importante de acertar.
- **Peça 4 precisa modelar "eventos de alteração" além de lei alteradora
  comum.** Dois casos reais, levantados pelo usuário:
  1. **Veto derrubado.** `VETADO` não é necessariamente definitivo — se a
     Câmara derrubar o veto do Executivo (raro, mas real), o texto correto
     passa a valer a partir da publicação da derrubada no DOPA Legislativo,
     que é POSTERIOR à publicação original com o veto. Isso não é uma lei
     alteradora comum (não tem necessariamente número de lei próprio — é ato
     de promulgação da Câmara). `extrairProvenienciaPromulgacao()` (nova
     função) já detecta QUANDO uma lei foi promulgada por esse mecanismo
     (Presidente da Câmara, "a Câmara Municipal manteve e eu promulgo",
     citando o artigo da Lei Orgânica) — confirmado com dado real: a LC
     412/1998 é promulgação por veto derrubado, diferente da sanção normal
     de LC 320/1994 e LC 384/1996. O que falta: reconstruir o texto
     ESPECÍFICO de um dispositivo cujo veto (não o projeto inteiro) foi
     derrubado — isso a função não resolve, é tarefa de modelagem da peça 4.
  2. **Revogado ocupa posição sem reaproveitamento.** Mesmo tratamento
     conceitual de VETADO — dispositivo revogado mantém a posição/numeração,
     nunca é removido nem reaproveitado por inserção futura no mesmo
     endereço. `revogado` (novo campo na árvore, mesmo espírito de `vetado`)
     já detecta o placeholder textual ("REVOGADO." ou "(Revogado)") quando
     presente no texto de origem. O que falta: o motor de consolidação
     (peça 4) precisa, ao aplicar um `revoke_node` (peça 3), **escrever**
     esse placeholder no lugar do texto real — não é só ler um placeholder
     que já existia, é produzi-lo como efeito da operação.
## Arquivos de teste (rodada 2)
- `teste_pecas_2_3.mjs` — 30 asserções, peças 2 e 3, contra LC 320/384/412
  reais + um texto sintético mínimo pra exercitar `revoke_node` (ver
  Pendências acima).
---
 
# Rodada 3 — VETADO vs. REVOGADO, e proveniência da promulgação
 
## `revogado` — novo campo, irmão de `vetado`
 
Mesma detecção que já existia pra `VETADO` (placeholder textual, sem
conteúdo normativo, mantém posição na árvore), agora também pra `REVOGADO`
(bare ou entre parênteses: "(Revogado)"). São estados com **proveniência
diferente** — `vetado` normalmente não tem lei alteradora nenhuma por trás
(é estado original de promulgação); `revogado` normalmente é resultado de um
`revoke_node` (peça 3) aplicado por uma lei identificável. Os testes
confirmam que as duas flags nunca saem juntas no mesmo nó.
 
## `extrairProvenienciaPromulgacao(raw)` — nova função
 
Detecta se uma lei foi promulgada por sanção normal do Prefeito ou por
promulgação do Presidente da Câmara após derrubada de veto (mecanismo do
art. 77 da Lei Orgânica) — os dois preâmbulos são textualmente bem
distintos. **Achado real, não hipotético:** a LC 412/1998 É um caso de
promulgação por veto derrubado — o preâmbulo mostra "O PRESIDENTE DA CÂMARA
MUNICIPAL... que a Câmara Municipal manteve e eu promulgo", contra "O
PREFEITO MUNICIPAL... eu sanciono" de LC 320/1994 e LC 384/1996. Só
descobri isso testando a função contra os documentos reais — não é uma
correção de bug, é uma classificação nova aplicada retroativamente aos
mesmos três textos que já tínhamos.
 
**Limitação clara, documentada no próprio JSDoc:** essa função sinaliza SE
uma lei foi promulgada por esse mecanismo, mas não resolve o caso mais raro
que motivou a pergunta original — reconstituir o texto de um dispositivo
específico cujo VETO (não o projeto inteiro) foi derrubado depois da
publicação original. Isso normalmente vem de um ato de promulgação próprio,
sem número de lei, publicado em data posterior — a peça 4 precisa modelar
esse tipo de evento separadamente de "lei alteradora comum" (ver Pendências).
 
## Arquivos de teste (rodada 3)
- `teste_vetado_provenencia.mjs` — 13 asserções: distinção vetado/revogado
  (com texto sintético, já que nenhum dos 3 documentos reais tem dispositivo
  revogado) e proveniência de promulgação (com os 3 documentos reais + 1
  sintético de emenda à Lei Orgânica).
---
 
# Rodada 4 — correção: emenda à Lei Orgânica ≠ veto derrubado
 
Usuário lembrou de um caso que a rodada 3 não cobria: Emenda à Lei Orgânica é
promulgada pela própria Câmara **sempre**, com ou sem veto envolvido — é o
procedimento normal desse tipo de instrumento (equivalente municipal de
emenda constitucional, promulgada pelas Mesas do Congresso, nunca sancionada
pelo Presidente da República). Sem essa distinção, `extrairProvenienciaPromulgacao`
classificaria toda emenda à Lei Orgânica como "veto_derrubado" por engano,
só por ter sido promulgada pela Câmara.
 
**Fix:** nova categoria `motivoProvavel: "emenda_lei_organica"`, priorizada
sobre `veto_derrubado` quando o título/ementa do documento contém "EMENDA
(Nº X) À LEI ORGÂNICA". Também precisei alargar `rePromulgo` de `\bpromulgo\b`
(1ª pessoa, "eu promulgo" — como no preâmbulo real da LC 412/1998) para
aceitar `promulg(o|a|amos|ou)`, já que uma Mesa promulgando ("a Mesa
promulga") fala em 3ª pessoa, diferente de "eu promulgo" do Presidente da
Câmara sozinho.
 
**IMPORTANTE — não testado com dado real.** Não temos nenhum texto real de
emenda à Lei Orgânica de Porto Alegre no acervo de teste ainda; a categoria
inteira (e o ajuste de `rePromulgo`) foi construída só a partir da regra que
o usuário descreveu, validada apenas com um texto sintético que eu mesmo
escrevi tentando imaginar a fórmula real. **Pendência:** validar contra o
texto de uma emenda à Lei Orgânica real assim que houver uma disponível —
a fórmula exata do preâmbulo (verbo, quem exatamente assina — "A Mesa" vs.
"O Presidente da Câmara" sozinho) pode não bater com o que assumi.
 
## Ideias para o trabalho legislativo (registradas, não implementadas)
 
Levantadas em conversa, fora do escopo imediato — guardadas aqui pra não se
perder, retomar quando fizer sentido no roadmap:
 
1. **Revisão técnica preventiva** — antes de uma minuta ir a plenário,
   conferir automaticamente que todo dispositivo citado existe, não foi
   revogado, não está vetado.
2. **Análise de impacto de projeto novo** — índice reverso de citações
   ("quem cita o art. X da LC Y") como consulta, não conhecimento tácito.
3. **Quadro comparativo automático pra Redação Final** — a árvore de
   antes/depois de cada emenda (peça 4) como subproduto direto do
   "redação atual / redação com a emenda" que hoje é montado manualmente.
   Da lista, a que mais japea com o trabalho descrito pelo usuário.
4. **Auditoria de consistência terminológica no acervo inteiro** —
   `normalizar()` já faz isso por documento; rodar contra o acervo completo
   pega deriva terminológica entre leis diferentes ao longo de décadas.
5. **Detecção de "link rot" legislativo** — lei que cita dispositivo de
   outra lei já revogado/renumerado, hoje invisível sem reler tudo.
6. **Estatística de "dispositivos quentes"** — frequência de alteração por
   artigo, sinaliza candidatos a codificação/consolidação formal.
7. **Apuração própria do texto vigente**, como exercício de método, para
   leis recém-publicadas.
8. **Base limpa pra RAG futuro** — já estava no roadmap original; citação
   resolvida com endereço preciso dá recuperação mais exata que texto corrido.
---
 
# Rodada 5 — Peça 4: motor de consolidação (núcleo)
 
Decisões fechadas com o usuário antes de codar (registradas no documento
`PECA4-MODELO-DE-DADOS.md`, entregue junto):
 
- **Endereçamento deixa de ser posicional.** `desFixo` passa a ser atribuído
  a TODO nó (não só nós de bloco NR) uma única vez, no nascimento — na v0,
  por `atribuirDesFixoOriginal()`; em inserções, vem do próprio bloco NR da
  alteradora. Isso não é ajuste cosmético: sem ele, um artigo nunca tocado
  por nenhuma alteração teria seu "endereço calculado" deslocado por uma
  inserção em QUALQUER outro lugar da lei — a árvore acumulada de várias
  versões é exatamente o cenário em que isso quebraria. Confirmado pelo
  usuário como ajuste fundamental da migração de "editor de minutas" pra
  "consolidador de normas".
- **Granularidade de versão = uma por lei alteradora.** Confirmado.
- **Sem modelagem de alterações concorrentes.** Não acontece no acervo do
  usuário — removido do modelo (era preocupação teórica minha, sem base em
  caso real).
- **Veto derrubado: publicação traz só a parte derrubada, pista no
  preâmbulo.** Usuário vai trazer exemplo real. `veto_derrubado` fica como
  stub que falha alto — nunca aplica suposição não validada.
## Implementado
 
- `atribuirDesFixoOriginal(doc)` — atribui desFixo a todo nó da árvore
  original, uma vez, no nascimento da v0.
- `localizarCaminho(versao, chave)` — acha o caminho raiz→nó por `desFixo`
  (nunca por posição), em qualquer versão.
- `indexarVersao(versao)` — equivalente a `parseLeiAlvoIndex()`, mas a
  partir de uma árvore já estruturada (peça 4) em vez de texto — mesmo
  formato de chave, intercambiável como `leiBaseIndex` na peça 3.
- `criarVersaoOriginal(doc, fonte)` — cria a v0 a partir de `parseMinuta` +
  `extrairCabecalhoLeiPublicada`.
- `aplicarComandoLei(versaoAtual, comando, fonteAlteradora)` — aplica UM
  comando (peça 3) sobre uma versão, devolvendo a PRÓXIMA versão (imutável,
  com **compartilhamento estrutural** — só o caminho até o nó alterado vira
  objeto novo, o resto da árvore é a mesma referência) ou um erro como
  valor de retorno (nunca lança exceção). Implementado: `replace_text`,
  `insert_node` (filho de nó existente E irmão novo no nível raiz, com
  sufixo de letra). Stub que falha alto: `revoke_node`, `veto_derrubado`.
  Sem efeito nesta árvore (registrado, nunca aplicado aqui): `revoke_lei`,
  `clausula_generica_sem_efeito`, `indeterminado`, `nao_classificado`.
- **Checagem de segurança nova, não estava no design original:** antes de
  aplicar `replace_text`/`insert_node`, confere se `comando.leiAlvo`
  realmente bate com a lei da versão recebendo o patch — rejeita com erro
  se não bater, em vez de aplicar silenciosamente um comando da lei errada.
- `consolidarLei(versaoInicial, lotesComandos)` — orquestra vários lotes
  (um por lei alteradora) em sequência, acumulando um log de comandos não
  aplicados (erro, stub, ou sem efeito) sem nunca interromper o
  processamento dos demais.
## Validado end-to-end com dado real
 
Pipeline completo: v0 (LC 320/1994) → aplica comandos da LC 384/1996 → v1 →
aplica comandos da LC 412/1998 (usando `indexarVersao(v1)`, não o texto cru,
como `leiBaseIndex` — é o que a LC 412 realmente viu em 1998) → v2. Validado
contra a verdade conhecida do compilado real (mesmo oráculo da rodada 1):
texto final do art. 4º, do art. 8º (caput + §§ 1-3 inseridos), preservação
de `vetado` nos dispositivos nunca tocados, e a prova mais forte de que o
compartilhamento estrutural funciona de verdade (não só por igualdade de
valor): `v1.artigos[0] === v2.artigos[0]` — mesma referência de objeto,
porque o Art. 1º nunca foi tocado por nenhuma das duas alterações.
 
Achado colateral que confirma uma promessa do modelo de dados: o caput do
art. 8º (`replace_text`) e o § 1º do art. 8º (`insert_node`), ambos
produzidos pelo MESMO artigo da LC 412/1998, saem com a mesma `origem.lei` —
resolvendo de graça, pra leis processadas pela peça 4 daqui pra frente, o
problema de "anotação em bloco" documentado como limitação de
`parseLeiAlvoAnotacoes` (que só existe pra bootstrapping a partir de texto
já compilado, onde não temos comando estruturado nenhum por trás).
 
## Pendências desta rodada
 
- **Inserção de artigo-irmão novo no nível raiz (`Art. 9º-A` entre
  artigos existentes) não tem validação com dado real.** Nenhum dos 3
  documentos reais insere um artigo novo — só filhos de artigo existente
  (parágrafos). Testado só com comando sintético (`teste_peca4.mjs`,
  seção final) — roda sem quebrar e posiciona corretamente, mas mesmo status
  de "não validado" que `revoke_node`.
- **`revoke_node` e `veto_derrubado`** seguem como stubs que falham alto —
  sem mudança desde a rodada anterior, aguardando os exemplos reais que o
  usuário vai trazer.
## Arquivos de teste (rodada 5)
- `teste_peca4.mjs` — 29 asserções: pipeline completo v0→v1→v2 com dado
  real, prova de compartilhamento estrutural, checagem de segurança de
  lei-alvo, e o caso sintético de inserção de artigo-irmão (não validado).
---
 
# Rodada 6 — auditoria de contaminação (editor de minutas → consolidador) + pesquisa LexML
 
Usuário levantou uma preocupação legítima: será que resquícios do projeto
original (STL Editor — editor de minutas/PL em revisão, com foco em Redação
Final) estão contaminando o design do Norma (consolidador de todo o acervo)?
Auditei o código procurando casos concretos, não só tranquilizei por
tranquilizar.
 
## Achado real nº 1 — vetado/revogado dependia de normalizar()
 
`marcarEstadosEspeciais(doc)` — a detecção de VETADO/REVOGADO estava
implementada DENTRO de `normalizar()`, misturada com a lógica de correção
de grafia/nomenclatura (que É uma preocupação de editor de minuta — faz
sentido corrigir "Art. 5°" pra "Art. 5º" ao revisar um projeto antes do
plenário; não faz sentido nenhum "corrigir a grafia" de uma lei já
promulgada e vigente). Isso criava uma dependência escondida: se a peça 4
algum dia decidisse não chamar `normalizar()` sobre uma lei já publicada
(decisão que faria sentido, já que normalizar() não deveria "corrigir" texto
legal vigente), a detecção de vetado/revogado sumiria junto, sem aviso
nenhum.
 
**Fix:** extraída pra função própria, `marcarEstadosEspeciais(doc)`,
completamente independente de `normalizar()`. `criarVersaoOriginal()` (peça
4) agora chama essa função diretamente — não depende mais de ninguém ter
lembrado de rodar `normalizar()` antes. `normalizar()` continua chamando-a
internamente também, por compatibilidade com quem já usava esse efeito
colateral — zero quebra, 111 testes anteriores continuam passando.
 
## Achado real nº 2 — "ideias futuras" item 3 misturava dois domínios
 
O item 3 da lista de ideias (rodada 4) sugeria o motor de consolidação como
base direta pra um "quadro comparativo pra Redação Final". Isso está errado
como está escrito: Redação Final trabalha com **emenda aprovada em
plenário** — sem lei-alteradora publicada, sem número, sem data de DOPA —
enquanto TODA a peça 3 (`extrairComandosLei`) foi construída em cima da
citação de **lei alteradora já publicada** ("Lei Complementar nº X, de
DATA"). São formatos de comando estruturalmente diferentes. O item fica
retratado: se um dia vocês quiserem essa ferramenta, ela reusaria pedaços
(a árvore, o motor de diff/versionamento), mas precisaria de um extrator de
comando PRÓPRIO a partir de emenda de plenário — não é um subproduto
automático da peça 4 como eu tinha sugerido. Eram meu enquadramento
pessoal do trabalho do usuário vazando pro roadmap do projeto, não uma
necessidade do Norma em si.
 
## O que NÃO é contaminação — reuso legítimo, mantido como está
 
- `parseMinuta` (árvore de artigo/parágrafo/inciso/alínea/item),
  `detectNRCandidates`/`extrairRedacaoAlterada` (bloco "(NR)") — a convenção
  de técnica legislativa (LC 611/2009) é a MESMA pra um projeto em trâmite e
  pra uma lei já publicada que o gerou; a estrutura textual não muda na
  promulgação. Reuso genuíno, não resíduo.
- `suggestDesFixo()` — já estava corretamente escopado desde a rodada 5
  como ferramenta de REDAÇÃO (sugerir letra pra inserção nova sendo
  escrita agora), não usado em nenhum lugar da ingestão de lei já publicada.
## Pesquisa: LexML Brasil (padrão nacional, parser de acesso livre)
 
Usuário pediu avaliação de aproveitamento do LexML. Pesquisei a
especificação oficial (projeto.lexml.gov.br) e o parser de referência
(`lexml-parser-projeto-lei`, GitHub). Achados:
 
1. **Validação, não vergonha:** o parser oficial do LexML tem A MESMA
   limitação que o nosso herdou — só processa "projeto de lei". Confirmado
   numa issue real do GitHub (2018) onde pesquisadores da FGV precisaram
   fingir um cabeçalho de PL na Constituição Federal pra conseguir rodar o
   parser nela. "Parser nascido pra minuta, esticado pra norma promulgada"
   é dificuldade reconhecida do domínio — não sintoma de descuido nosso
   (o que não desculpa o achado real nº 1 acima, que era evitável e corrigi).
2. **Refinamento real pro veto derrubado** — ver seção 4 atualizada de
   `PECA4-MODELO-DE-DADOS.md`: o LexML distingue "Versão" (alteração nova)
   de "Visão" (correção retroativa de uma versão já existente — cita
   textualmente "retificação, derrubada de veto parcial ou declaração de
   inconstitucionalidade" como exemplos). Isso é melhor do que modelar
   veto_derrubado como só mais um tipo de fonte na cadeia linear de versões,
   como eu tinha proposto — é conceitualmente uma correção de uma versão
   existente, não uma versão nova. Ainda não implementado — fica registrado
   pra quando o exemplo real chegar.
3. **4 estados de "posição não reaproveitável", não 2** — Glossário de
   Técnica Legislativa do Congresso Nacional (citando LC 95/1998, art. 12,
   III, "c"): revogado, vetado, declarado inconstitucional, execução
   suspensa (mecanismo federal via Senado). Os dois últimos provavelmente
   não se aplicam a lei municipal do mesmo jeito — registrado, sem ação.
4. **Identificador URN usa data completa** — `urn:lex:br:...:1998-02-26;95`
   em vez de ano+número como nosso `chaveLei`. Mais alinhado ao padrão
   nacional, útil se algum dia vocês quiserem interoperar com outros
   publicadores LexML. Não é necessidade atual — `chaveLei` resolve o uso
   interno de hoje.
---
 
# Rodada 7 — LC 611/2009 (lei de técnica legislativa de POA), URN, e correção "republicação"
 
## LC 611/2009 lida por inteiro pela primeira vez
 
O código já citava "LC 611/2009" em comentário desde o início do projeto,
mas sem nunca ter o texto completo — só padrões inferidos de exemplos reais.
O usuário colou o texto integral. Auditei artigo por artigo contra o que já
tínhamos implementado. Resultado: majoritariamente validação, com duas
correções reais.
 
### Validações diretas (nenhuma mudança de código necessária)
- **Art. 13, XXIV**: "REVOGADO" e "VETADO" em maiúsculas, ao lado do
  número/letra do dispositivo — é LEI, não convenção do leis.org que
  inferimos. `marcarEstadosEspeciais()` já implementa exatamente isso.
- **Art. 15**: "A alteração de Lei poderá ser feita mediante nova redação,
  acréscimo ou revogação de dispositivos." — é a base legal EXATA da
  taxonomia de três operações da peça 3 (`replace_text`/`insert_node`/
  `revoke_node`). Não inferimos do padrão dos documentos — está na lei.
- **Art. 15, Parágrafo Único**: anotação deve identificar a lei que alterou
  E o tipo de alteração — base legal do campo `origem.operacao` da peça 4.
- **Art. 16, IV**: omissão de trecho não-alterado por linha pontilhada —
  base legal de `omitido`/`reOmissao`.
- **Art. 17, I**: proibido modificar numeração de artigos alterados e
  unidades superiores — base legal EXATA da decisão de endereçamento por
  `desFixo` fixo (seção 0 do `PECA4-MODELO-DE-DADOS.md`). Não é só boa
  prática de engenharia — é vedação legal.
- **Art. 17, Parágrafo Único**: acréscimo de artigo novo usa o número do
  dispositivo imediatamente anterior + hífen + letra maiúscula — base legal
  exata de `suggestDesFixo()` e do posicionamento em `aplicarComandoLei()`.
- **Art. 19, §2º**: definição oficial de "Compilação" — "reunião, em um só
  texto, de leis e suas alterações... **sem** processo legislativo, **sem**
  substituição das leis compiladas, **sem** inovação no ordenamento
  jurídico" — confirma que nosso uso do termo "compilado" (formato leis.org,
  histórico empilhado) bate com a definição legal oficial.
### Correção real nº 1 — "consolidado" não significa o que a lei diz que significa
 
**Achado importante.** Art. 19, §3º define oficialmente: *"Consolidação é a
reunião de **todas as leis pertinentes a determinada matéria em um único
diploma legal**, com a **revogação formal** das leis incorporadas à
consolidação..."* — ou seja, "Consolidação" na LC 611/2009 é um **ato
legislativo formal e raro**: um projeto de lei específico (Art. 22-25, só
pode ser apresentado por Prefeito/Mesa/Comissões/Vereador) que funde VÁRIAS
leis relacionadas em UM diploma novo e revoga formalmente as antigas.
 
Isso **não é** o que "peça 4 — motor de consolidação" faz. O que construímos
produz o texto vigente de UMA lei a partir do histórico de alterações
dela mesma — mais próximo, na definição oficial, de uma leitura filtrada de
"Compilação" (Art. 19, §2º) do que de "Consolidação" propriamente dita.
 
**Não renomeei nada ainda** — "consolidação"/"consolidado" tem uso corrente
informal na prática de quem trabalha com técnica legislativa (bem provável
que o uso coloquial no dia a dia da Câmara não siga a distinção fina da
lei), e trocar terminologia em 6 rodadas de código/documentação é
disruptivo. Mas é uma decisão que caberia ao usuário, não a mim: manter o
nome "motor de consolidação" como uso informal (avisando a discrepância) ou
renomear pra algo tecnicamente mais preciso (ex. "motor de compilação" ou
"motor de texto vigente"). Registrado como pendência de decisão, não como
fix — evitar o mesmo erro de antes (deixar minha própria escolha de palavra
vazar sem checar com quem vai usar o termo no trabalho real).
 
### Correção real nº 2 — "inconstitucional"/"execução suspensa" NÃO são só federais
 
Na rodada 6, especulei que os estados "declarado inconstitucional" e
"execução suspensa" (achados no Glossário do Congresso Nacional) fossem
mecanismos federais que "provavelmente não se aplicam a nível municipal do
mesmo jeito". **Isso estava errado**, e a LC 611/2009 prova isso com dado
primário, não achado de terceiros:
 
- **Art. 17, II** (vedações na alteração): "aproveitar número de dispositivo
  revogado, vetado **ou declarado inconstitucional**" — municipal, explícito.
- **Art. 21, II** (regras de compilação): "o texto declarado
  inconstitucional ou **cuja execução tenha sido suspensa**, acompanhado das
  expressões 'declarado inconstitucional' ou 'execução suspensa'" —
  municipal, explícito, com convenção textual própria pra compilação.
Ou seja: são **4 estados oficiais de "posição não reaproveitável"** no
próprio ordenamento municipal de POA, não 2: `vetado`, `revogado`,
`inconstitucional`, `execucao_suspensa`. Não implementei os dois últimos
(sem exemplo real, sem urgência), mas a documentação anterior que dizia
"provavelmente não se aplica" está corrigida aqui — se aparecer um caso
real de qualquer um dos dois, o modelo já sabe que é esperado, não exceção.
 
### Achado extra — ementa de lei alteradora como fonte de extração (não implementado)
 
Art. 18 especifica que a ementa de uma lei alteradora deve conter a
numeração do dispositivo alterado + a lei alterada + breve explicação do
objeto. Testado contra a LC 384/1996: a ementa dela ("ACRESCENTA PARÁGRAFO
ÚNICO AO ARTIGO 2º DA LEI COMPLEMENTAR Nº 320...") já contém tudo que a
peça 3 hoje extrai do corpo do art. 1º — e em formato mais previsível/
formulaico, por ser peça obrigatória e padronizada. **Ideia registrada, não
implementada:** usar a ementa como fonte adicional (ou cruzada, pra
validação) de `extrairComandosLei`, em vez de só o texto de introdução de
cada artigo. Vale testar contra mais exemplos reais antes de decidir se
substitui ou só reforça a extração atual.
 
## Correção de terminologia: "republicação", não "retificação"
 
Usuário corrigiu: o DOPA usa **"republicação"**, não "retificação", pro
evento de correção de erro de publicação. Isso já estava desatualizado em
`PECA4-MODELO-DE-DADOS.md` (rodada 6, que usou o termo do LexML sem checar
contra a prática real de POA) — corrigido.
 
**Refinamento adicional, direto da especificação LexML (Parte 2 — URN, lida
por inteiro nesta rodada):** a classificação de uma republicação como
"Versão" nova ou "Visão" (variante) **depende do momento em relação à
vacância** (vacatio legis):
- Republicação feita **depois** do início de vigência → gera **Versão nova**.
- Republicação feita **antes** do início de vigência (lei ainda não estava
  em vigor) → gera só **Visão** (variante) da versão que nem tinha entrado
  em vigor ainda.
Isso é mais fino do que eu tinha registrado antes ("retificação sempre gera
visão"). Fica atualizado em `PECA4-MODELO-DE-DADOS.md`, ainda sem
implementação — nenhum exemplo real de republicação de POA foi trazido
ainda.
 
## URN — avaliação e implementação
 
Usuário achou que o custo é baixo e pode abrir portas; pedi pra avaliar
antes de só concordar. Avaliação:
 
**Custo real, não "baixo" de forma simplista:** URN exige DATA COMPLETA de
promulgação (não só ano) — o que já temos via `extrairCabecalhoLeiPublicada`,
então não é um bloqueador, mas significa que URN **não pode substituir**
`chaveLei()` como chave de resolução de citação: uma citação abreviada no
corpo de um texto ("Lei Complementar nº 320/94") só dá ano de 2 dígitos, às
vezes nem isso — não dá pra montar URN direto de uma citação parcial sem
antes resolver contra a coleção (que é exatamente o que `chaveLei` +
`resolverReferenciaLei` já fazem). Ou seja: os dois têm papéis diferentes,
não é uma troca de um pelo outro.
 
**Implementado:** `urnLei(tipoAto, numero, dataPublicacao)` — URN Canônica
no padrão LexML, construída lendo a especificação completa (Parte 2 — LexML
URN, projeto.lexml.gov.br), não aproximada de memória. Detalhes que só a
leitura completa revelou:
- `<autoridade>` pra lei/lei complementar é só `"municipal"` (nunca
  `"camara.municipal"` ou `"prefeitura"`) — regra 8.3.3, com exemplo literal
  da própria especificação confirmando.
- `<local>` usa nome do estado/município por extenso, minúsculo, SEM
  conectivos linguísticos — "Rio Grande **do** Sul" perde o "do":
  `rio.grande.sul` (aplicação da regra 4.3.3; não há exemplo literal desse
  estado específico na especificação, então marcado como aplicação de regra
  geral, não confirmação direta).
- Número do dispositivo/lei é mantido **exatamente como atribuído**, sem
  tirar zero à esquerda (regra 10.2.2) — diferente de `chaveLei()`, que
  normaliza pra facilitar casamento de citação. Corrigi isso numa versão
  anterior desta mesma função que já existia no arquivo (tinha copiado a
  lógica de tirar zero de `chaveLei()` por engano).
Testado contra os 4 documentos reais que já temos, incluindo a própria LC
611/2009: `urn:lex:br;rio.grande.sul;porto.alegre:municipal:lei.complementar:2009-02-03;611`.
 
**Adicionado como campo `urn` em `VersaoLei`** (`criarVersaoOriginal`),
aditivo — `id` continua no formato interno (`chaveLei`), não substituído.
 
**Não implementado, documentado como possível extensão futura:**
identificador de FRAGMENTO (dispositivo específico) no padrão LexML — a
especificação tem uma sintaxe própria e não-óbvia pra isso (letra de
sufixo vira número ordinal: "Art. 12-B" → `art12-2`, não `art12-b`; romano
vira arábico: inciso III → `inc3`) — diferente do formato de chave que
`enderecarNrBloco`/`parseLeiAlvoIndex` já usam internamente. Não implementei
porque não há necessidade concreta agora — geraria trabalho e risco de erro
de precisão (a conversão letra→número é fácil de errar) sem um caso de uso
puxando isso.
 
## Arquivos de teste (rodada 7)
- `teste_urn.mjs` — 7 asserções: `urnLei()` contra LC 320/384/412/611 reais,
  e integração com `criarVersaoOriginal()`.
---
 
# Rodada 8 — varredura de resíduo do projeto antigo (editor de minutas → Norma)
 
Usuário pediu uma varredura completa: tirar/alterar/aprimorar tudo que era
do projeto antigo (editor de minutas/PL) e não cabe mais no Norma. Exemplo
dado: "botão normalizar" não devia existir, porque normaliza MINUTA. Fiz a
varredura função por função. Achado principal foi mais sério do que o
exemplo — não é só "não faz sentido", é risco real de mutar texto oficial.
 
## Achado crítico: `normalizar()` mutava texto de lei já publicada, e isso já estava acontecendo
 
`normalizar()` corrige terminador, reescreve autorreferência ("desta lei" →
sigla correta) e força minúscula em início de inciso — **mutação real de
`n.texto`**, incondicional. Rodar isso sobre uma lei JÁ PUBLICADA reescreve
silenciosamente o registro oficial pra bater com uma convenção derivada,
mesmo que o texto realmente publicado tenha ficado diferente por qualquer
motivo. Isso é qualitativamente diferente de "resíduo inofensivo" — é uma
função que, usada no contexto errado, corrompe dado.
 
**E já estava acontecendo:** `teste_peca4.mjs` — o teste que demonstra "como
o Norma funciona de ponta a ponta" — chamava `normalizar(doc320)` sobre o
texto real da LC 320 antes de criar a v0. Exatamente o padrão perigoso,
dentro do próprio exemplo de referência do projeto.
 
**Fix:**
- Removida a chamada a `normalizar()` de `teste_peca4.mjs` — `criarVersaoOriginal()`
  já chama `marcarEstadosEspeciais()` internamente, não precisa de mais nada.
  Reteste: 29/29 continuam passando com o texto SEM mutação nenhuma — prova
  de que `normalizar()` nunca foi necessário ali.
- Aviso ⚠️ explícito no JSDoc de `normalizar()`: "NUNCA rode isto sobre o
  texto de uma lei JÁ PUBLICADA... O pipeline da peça 4 (Norma) NUNCA chama
  esta função."
- Confirmado: nenhuma função de peça 1-4 chama `normalizar()` internamente
  (só `criarVersaoOriginal` → `marcarEstadosEspeciais`, que não muta texto).
## Bug real encontrado de graça: agrupadores com título em duas linhas
 
Aproveitei a LC 611/2009 (documento real com Título/Capítulo/Seção —
nenhuma das 3 leis testadas antes tinha isso) pra validar `gruposAntes`,
que nunca tinha rodado contra dado real. Achado: quando o título do
agrupador vem na linha SEGUINTE ("TÍTULO I" numa linha, "DAS DISPOSIÇÕES
PRELIMINARES" na próxima — formatação comum em lei publicada), o parser
perdia o título inteiro, e a linha do título vazava pra dentro da ementa.
**Fix:** lookahead de uma linha quando o título capturado na própria linha
do agrupador vem vazio. Testado contra Título, Capítulo, Seção e Subseção
da LC 611 real — 16/16, incluindo o caso de acumular 3 agrupadores abertos
ao mesmo tempo (Título > Capítulo > Seção) na mesma citação de artigo.
 
## Outros resíduos identificados — documentados, não removidos (decisão do usuário)
 
Achados que são genuinamente do projeto antigo (editor de minuta/PL),
inertes no pipeline real de Norma (peça 1-4), mas que não removi porque
apagar código teria custo de reversibilidade maior que documentar — melhor
decisão consciente do usuário do que eu apagar unilateralmente:
 
- **`numeroPorExtenso()`** — converte número em texto por extenso
  ("catorze"). Base legal: Art. 14, §5º, IV/V da LC 611/2009 — "grafia de
  numerais... seguida de indicação por extenso, entre parênteses" — é
  ferramenta de **apoio à redação de minuta** (sugerir o "(catorze)" pro
  redator escrever). Não é chamada por nenhuma função de peça 1-4. Nunca
  testada, nunca exercida.
- **`suggestDesFixo()`** — já corretamente documentado desde a rodada 5 como
  ferramenta de redação (sugerir letra pra quem está ESCREVENDO uma inserção
  nova), não usado na ingestão de lei já publicada. Confirmado ainda
  correto — nenhuma mudança necessária, só reforçando o achado da varredura.
- **Ramo de detecção de "PROJETO DE LEI Nº X/AAAA" dentro de `parseMinuta`**
  (regex `reEpig`, atribuição de `sigla` PLCL/PLL/PLE/PR) — nunca exercido
  por nenhum dos 5 documentos reais testados até agora (todos são leis já
  publicadas, que caem no ramo alternativo de `parseMinuta`). Continua
  existindo dentro da mesma função que processa lei publicada. Não é
  incorreto, é só código morto pro caso de uso do Norma — só seria
  exercitado se algum dia o Norma precisasse processar uma MINUTA de
  verdade (por exemplo, se a ideia registrada de "revisão técnica
  preventiva de minuta antes do plenário" virar realidade). Fica como está;
  separar `parseMinuta` em duas funções (uma só-minuta, uma só-lei-publicada)
  seria uma refatoração maior, arriscada pra fazer sem necessidade concreta
  puxando — registrado como opção, não decisão tomada.
- **`visText()` com fallback pra `.toks`** — suporta um segundo formato de
  nó (`{toks: [...]}`, rich-text tokenizado) que é **exclusivo do editor
  original** — nenhum nó do Norma jamais usa `.toks`, só `.texto` (string).
  Caminho de código morto pro Norma, inofensivo (nunca é alcançado), não
  removido — mexer nisso quebraria a função pra quem ainda usa o editor
  original com esse formato de nó, se esse uso ainda existir em algum lugar.
## Correção de nome — decisão do usuário, não implementada
 
**"Consolidação" (peça 4) não bate com a definição oficial da LC 611/2009**
(achado da rodada 7, Art. 19, §3º) — "consolidação" formal é um ato
legislativo que funde várias leis e revoga as antigas; o que a peça 4 faz é
mais próximo de "compilação" filtrada pro vigente. Não renomeei nada —
fica registrado aqui de novo como pendência de decisão do usuário (nome do
projeto/peça envolve como ele mesmo fala sobre isso no trabalho, não é
decisão que eu deva tomar sozinho).
 
## Arquivos de teste (rodada 8)
- `lc611.txt` — texto completo da LC 611/2009, agora com os cabeçalhos de
  Título/Capítulo/Seção/Subseção preservados (uma versão anterior salva sem
  essa estrutura foi substituída).
- `teste_gruposAntes.mjs` — 16 asserções: `gruposAntes` contra a LC 611
  real, incluindo o fix do título em duas linhas.
- `teste_peca4.mjs` — atualizado para não chamar mais `normalizar()`.
---
 
# Rodada 9 — renomeação, parser dedicado a lei publicada, e levantamento de outros instrumentos
 
## Renomeação: "consolidação" → "texto vigente"
 
Decisão do usuário: usar os termos da LC 611/2009, que distingue
compilação de consolidação (ver rodada 7); o projeto passa a seguir essa
terminologia legal. Pra facilitar
o uso do dia a dia, "texto vigente" substitui "consolidado" como nome do
conceito (em vez de tentar forçar "compilação" pra tudo, que soaria
estranho fora do contexto formal).
 
**Renomeado:**
- `consolidarLei()` → `apurarTextoVigente()` — mesma assinatura, mesmo
  comportamento, só o nome mudou. Nenhuma lógica alterada.
- Cabeçalho do módulo, JSDoc de `parseLeiAlvoIndex()`, e todas as menções a
  "motor de consolidação" → "motor de texto vigente".
- Nova nota de terminologia no topo do arquivo, explicando a distinção
  Coletânea/Compilação/Consolidação da LC 611 art. 19 e por que "texto
  vigente" é o termo usado aqui em vez de "consolidado".
**Não renomeado, de propósito:** `VersaoLei`, `criarVersaoOriginal`,
`aplicarComandoLei` — "versão" já é termo alinhado tanto à LC 611 quanto ao
LexML (Parte 2 — URN), não precisa mudar. `chaveLei`/`urnLei` também
inalterados.
 
Testado: 147 asserções, zero regressão (renomeação é só nome, testado
função por função contra toda a suíte).
 
## `parseLeiPublicada()` — ponto de entrada dedicado, aditivo
 
Item 3, com a condição do usuário: só fazer se não houver risco de "usar o
parser errado". Decisão de design pra atender essa condição: **não separei
`parseMinuta` em duas funções** (isso seria mudança estrutural arriscada,
mexendo em código já testado). Em vez disso, **adicionei** `parseLeiPublicada(raw)`
— combina `parseMinuta()` + `extrairCabecalhoLeiPublicada()` +
`extrairProvenienciaPromulgacao()` + `marcarEstadosEspeciais()` numa chamada
só, e **sobrescreve** qualquer tipoAto/numero/ano que o ramo de PROJETO de
`parseMinuta()` porventura tenha inferido — elimina o risco de ficar com
metadado de projeto/minuta grudado num `doc` de lei publicada, sem tocar
em nada que já existia.
 
Também adicionado `criarVersaoOriginalDeLeiPublicada(raw)` — pipeline
completo (texto bruto → v0) numa chamada só, para o caso de uso mais comum
da peça 4. Testado: 11 novas asserções (`teste_lei_publicada.mjs`), mais as
147 anteriores continuam passando.
 
**Risco residual, documentado no JSDoc:** o ramo de detecção de "PROJETO DE
LEI" dentro de `parseMinuta()` continua existindo, sem uso no Norma —
registrado como resíduo aceito na rodada 8, não removido por não ter
necessidade concreta empurrando a separação.
 
## Levantamento: outros tipos de instrumento normativo do Legislativo de POA
 
Usuário lembrou que existem outros tipos além de Lei/Lei Complementar, cada
um com preâmbulo diferente: Resolução, Resolução de Mesa, Decreto
Legislativo, Ordens de Serviço. Pesquisei exemplos reais da Câmara de Porto
Alegre (legislacao.camarapoa.rs.gov.br, DOPA) pra caracterizar os padrões.
**Nível de confiança varia por tipo — marcado explicitamente abaixo.**
 
| Tipo | Quem promulga/emite | Passa pelo Executivo? | Confirmado com dado real de POA? |
|---|---|---|---|
| Lei / Lei Complementar | Prefeito (ou Presidente da Câmara, se veto derrubado sem promulgação no prazo) | Sim — sanção/veto | Sim (LC 320, 384, 412, 611) |
| Emenda à Lei Orgânica | Mesa Diretora da Câmara | Não, nunca | Confirmado por analogia (LOM de outro município com texto idêntico ao padrão nacional); não com exemplo de POA especificamente |
| Resolução (de Plenário) | Câmara Municipal (Presidente) | Não — "ato de competência e promulgação exclusiva do Poder Legislativo" | Confirmado o princípio (página oficial da Câmara); preâmbulo específico de POA não localizado |
| Resolução de Mesa | **Mesa Diretora** da Câmara Municipal | Não | **Sim** — preâmbulo real localizado: *"A Mesa Diretora da Câmara Municipal de Porto Alegre, no exercício de suas atribuições legais, em conformidade com os incs. XV e XVIII do art. 57 da Lei Orgânica..."* — assinatura/data no formato "CÂMARA MUNICIPAL DE PORTO ALEGRE, [data]." (não "PREFEITURA MUNICIPAL...") |
| Decreto Legislativo | Câmara Municipal | Não — mesma natureza da Resolução | Confirmado o princípio, preâmbulo específico não localizado |
| Ordem de Serviço | Autoridade administrativa da Câmara (nível abaixo de norma legislativa propriamente dita) | Não — ato interno/administrativo | Só títulos localizados, sem preâmbulo completo |
 
**Achado que já validou o modelo existente:** a página oficial da Câmara
("Leis aprovadas pelos vereadores geram normas para a cidade",
camarapoa.rs.gov.br) descreve o mecanismo de veto derrubado exatamente como
`extrairProvenienciaPromulgacao()` já modela: *"quando há derrubada do
veto, o prefeito terá prazo de 48 horas para promulgar a lei. Se... houver
omissão... a lei poderá ser promulgada pelo presidente da Câmara
Municipal."* — bate exatamente com o caso real da LC 412/1998 já usado
como fixture de teste.
 
**Não implementado ainda.** Isto é levantamento, não extração — nenhuma
função nova foi escrita pra reconhecer esses preâmbulos. Antes de estender
`extrairProvenienciaPromulgacao()`/`extrairCabecalhoLeiPublicada()` pra
cobrir Resolução/Resolução de Mesa/Decreto Legislativo/Ordem de Serviço,
seria bom ter pelo menos um documento real de cada tipo (do jeito que
temos feito até aqui) — a tabela acima já indica que "Resolução de Mesa"
tem confirmação forte o suficiente pra começar por ali primeiro, se/quando
isso entrar em escopo.
 
## Arquivos de teste (rodada 9)
- `teste_lei_publicada.mjs` — 11 asserções: `parseLeiPublicada()` e
  `criarVersaoOriginalDeLeiPublicada()`.
---
 
# Rodada 10 — bug do fecho de publicação, e ajustes de UX na simulação

## Bug corrigido: fecho de publicação grudava no último dispositivo tocado

**Achado real:** art. 14 da LC 320/1994, na simulação visual. O artigo (que
efetivamente revoga 7 leis nominalmente, além de abrir com a cláusula morta
"revogam-se as disposições em contrário") aparecia com "PREFEITURA MUNICIPAL
DE PORTO ALEGRE, 02 de maio de 1994. TARSO GENRO Prefeito Municipal..."
colado no final do seu próprio texto, como se fosse parte do dispositivo
normativo.

**Causa raiz:** `parseMinuta()` não tinha nenhuma detecção de fim de corpo.
Qualquer linha que não batesse com artigo/parágrafo/inciso/alínea/item caía
no fallback genérico (`t.texto = (t.texto+" "+line).trim()`), que sempre
aponta pro último nó tocado (`last.al||last.i||last.p||last.a`). Como o
bloco de local/data + assinaturas é sempre a última coisa no arquivo, ele
grudava inteiro no último artigo — não é problema de exibição, é o parser
devolvendo uma árvore com dado errado dentro do nó.

**Fix:** nova fase de parsing (`stage === "fecho"`), com um regex
(`reFecho`) que reconhece os dois padrões de fecho confirmados nos
documentos reais já usados como fixture:
- `PREFEITURA MUNICIPAL DE PORTO ALEGRE, <data>.` (sanção do Executivo —
  LC 320, LC 611)
- `GABINETE DA PRESIDÊNCIA DA CÂMARA MUNICIPAL...` (promulgação da
  Mesa/Presidência por veto derrubado — LC 412)

Uma vez detectado (só depois que `stage === "corpo"`, pra não disparar
durante epígrafe/ementa/preâmbulo), todo o resto do arquivo é coletado à
parte em `doc.fecho` (string, linhas separadas por `\n`) em vez de
continuar sendo anexado a qualquer nó. `doc.fecho` fica vazio (`""`) se o
documento não tiver esse padrão reconhecível — não quebra nada que já
funcionava.

**Risco residual, documentado no código:** só os dois padrões acima têm
confirmação com dado real. Resolução de Mesa (levantamento da rodada 9)
provavelmente fecha como "CÂMARA MUNICIPAL DE PORTO ALEGRE, [data]." — mas
sem exemplo real, não foi adicionado ao regex por suposição.

**Teste:** nova seção em `teste_regressao.mjs` ("Regressão: fecho de
publicação não gruda no último artigo"), 6 novas asserções, cobrindo os
dois padrões nos três documentos que os exibem (LC 320, LC 412, LC 611) —
inclusive confirmando que o art. 14 mantém a revogação nominal específica
no seu texto (não é diluído pra virar só a cláusula genérica). Total do
arquivo: 41 → 47 asserções. **147 → 153 no projeto inteiro, 0 falhas.**

De brinde, corrigido um bug pré-existente e não relacionado:
`teste_regressao.mjs` ainda lia `./lc320_consolidado.txt`, nome de arquivo
anterior à renomeação terminológica da rodada 9 (o arquivo real é
`lc320_compilado_leisorg.txt`). O teste estava quebrando antes mesmo de
chegar nas asserções — corrigida a referência.

## Confirmado, sem mudança de código: peça 3 já classifica revogação mista corretamente

Investigação do mesmo achado (art. 14) levantou a dúvida: será que
`extrairComandosLei()` estava diluindo a revogação nominal específica
(7 leis citadas por número) na cláusula genérica só porque o artigo *abre*
com "revogam-se as disposições em contrário"? Conferido: **não estava**. A
ordem de checagem em `extrairComandosLei()` já prioriza citação específica
sobre o gatilho genérico — `clausula_generica_sem_efeito` só é emitido
quando NÃO há nenhuma lei citada por número no artigo. O art. 14 gera
corretamente 7 comandos `revoke_lei` (um por lei revogada nominalmente),
comportamento já coberto por asserções existentes desde a rodada de peças
2/3 (`teste_pecas_2_3.mjs`, "LC 320 art.14 gera 7 comandos revoke_lei").
Nenhuma mudança necessária — só confirmação.

## Simulação visual (`norma-simulacao.html`) — ajustes de UX

Pesquisa de benchmark (Planalto, Légifrance, legislation.gov.uk,
leismunicipais.com.br) confirmou que a citação da lei alteradora logo após
o trecho alterado — não como badge separado — é o padrão real já usado na
tradição de compilação legislativa brasileira (formato Planalto:
"(Redação dada pela Lei nº X, de ano)"). Mudanças:

- **Cor única pro texto alterado** (`--gold-deep`), com a citação inline
  logo em seguida, no mesmo tom, com concordância de gênero
  ("Incluído"/"Incluída" conforme o tipo de dispositivo; "Redação dada"
  invariável). Os badges separados de `replace_text`/`insert_node` saíram.
- **Fecho renderizado separadamente**, com estilo visualmente distinto
  (borda tracejada, itálico, centralizado) — não mais dentro da caixa do
  último artigo.
- **Botões "detalhe" por dispositivo → toggle único "modo técnico"** no
  cabeçalho, desligado por padrão (padrão inspirado no "Show Timeline of
  Changes" do legislation.gov.uk, que também é opt-in). A ficha técnica
  (id, desFixo bruto, origem.tipo/data/operação) só aparece pra quem liga
  o toggle — leitura corrente fica limpa por padrão.

Fix do fecho replicado manualmente na cópia embutida de `parseMinuta()`
dentro do HTML (arquivo standalone, sem import de `norma-core.js`) —
mesma lógica, mesmo regex, testada separadamente rodando o script extraído
sob Node antes de aplicar no navegador.

## Arquivos de teste (rodada 10)
- `teste_regressao.mjs` — 6 novas asserções (seção de fecho), total 47 no
  arquivo. Também corrigido: nome de arquivo stale (`lc320_consolidado.txt`
  → `lc320_compilado_leisorg.txt`).
---
 
# Rodada 11 — integração do repositório + os 3 limites conhecidos

## Consolidação do repositório: histórico reconstruído do zero

Até esta rodada, só `README.md` estava versionado — `norma-core.js`, os
testes, as fixtures e `CLAUDE.md` viviam soltos, sem histórico git. Dois
commits reconstroem uma história honesta: o 1º ("base (até a rodada 10)")
é o core obtido revertendo `norma-core_rodada10.patch` sobre o core atual
(bate com o checksum esperado — 82.570 bytes, md5 `565a66932df5`), junto
das fixtures/testes antigos já existentes; o 2º ("rodada 11") traz de volta
o patch (`detectarPromulgacaoParcial`, `localizarPreambulo`, 3º padrão de
fecho) mais o coletor DOPA (`dopa-discovery.mjs`) e os testes/fixtures que
já validavam esse trabalho. Nenhuma lógica muda nessa reconstrução — só
organização de histórico.

Higiene: `.gitignore` (estava commitado sem o ponto, então inativo),
`package.json` com `"type": "module"`. `norma-simulacao.html`: a cópia
embutida do parser tinha só os 2 padrões de fecho da rodada 10
(Prefeitura/Gabinete da Presidência); espelhado o 3º padrão (Câmara
Municipal, regex estrita de linha inteira) e validado no navegador via
Playwright contra `res3006.txt` e `lei14504_parcial.txt` — nenhum dos dois
casos engole fecho ou assinaturas no último dispositivo.

## Tarefa A — proveniência da promulgação: parcial e ato próprio do Legislativo

`extrairProvenienciaPromulgacao()` ganha duas categorias novas, aditivas:

- **`promulgacao_parcial`**: LC 1.075/2026 (Prefeito, "promulgo
  dispositivo", sem "sanciono") e Lei 14.504/2026 (Câmara, "aprovou e eu
  promulgo dispositivo", sem "manteve") — antes caíam em `indeterminado`.
  `detectarPromulgacaoParcial()` continua sendo quem decide a guarda contra
  `criarVersaoOriginalDeLeiPublicada()`; isto é só metadado de quem
  promulgou.
- **`promulgacao_propria`**: Resolução 3.006/2026 (Câmara, "promulgo A
  SEGUINTE Resolução" — ato inteiro, sem veto envolvido).

`baseLegal` estendido pra dois formatos novos vistos nos fragmentos reais
(`"§ 5º do artigo 77"` na LC 1.075; `"§§ 3º e 7° do art. 77 da Lei
Orgânica"`, plural, na Lei 14.504) — só extrai se o formato bater exato,
senão `null`. O formato antigo (`"parágrafo N"`, LC 412/veto derrubado) não
regride.

Ordem de Serviço 12/2026 continua `indeterminado`: sem "Faço saber",
"promulgo" ou "sanciono" — 1 exemplo real não vira categoria nova.

## Tarefa B — cabeçalho de Resolução e Ordem de Serviço

`extrairCabecalhoLeiPublicada()` estendido pra Resolução (com data) e
Ordem de Serviço (achado real: `"ORDEM DE SERVIÇO Nº 12/2026"` não tem data
no cabeçalho). Datas — decisão do usuário: OS usa a data do FECHO como
`dataPublicacao`; Resolução mantém a convenção do cabeçalho, igual Lei/LC.

**Rede de proteção:** Resolução de Mesa, Decreto Legislativo, Emenda à Lei
Orgânica e "Precedente Legislativo" (tipos raros, sem PDF de norma real
ainda) agora devolvem `{ tipoAto: null, tipoNaoSuportado: "<TIPO>" }` em
vez de sumir como `null` puro — decisão do usuário: são raros mas
aparecem, então caem numa fila de revisão humana visível, não em silêncio.

`urnLei`/`chaveLei`: conferido o vocabulário controlado `tipoDocumento` do
LexML (repositório `lexml/lexml-vocabulary`, Parte 6) — `"resolucao"` é
termo oficial confirmado; `"ordem de serviço"` **não existe** nesse
vocabulário, então `urnLei()` devolve `null` pra ela em vez de inventar um
slug. De quebra, corrigido um fallback perigoso que já existia: tipo
desconhecido virava `"lei"` em silêncio; agora devolve `null` pra qualquer
tipo não mapeado. `chaveLei()` ganha sigla interna `"os"` (convenção deste
projeto, não do LexML).

Lei e LC continuam com o mesmo comportamento — regressão intacta.

## Tarefa C — módulo de ingestão PDF→texto de norma (Peça 5)

Módulo novo em `ingestao/`, fora do `norma-core.js` (regra dura: o core não
importa dele). `agruparPorLinha()` mudou de `dopa-discovery.mjs` pra
`ingestao/coletor-comum.mjs` (compartilhada, não duplicada — `dopa-
discovery.mjs` reexporta pra não quebrar quem já importa de lá).
`ingestao/pdf-normas.mjs` traz `extrairTextoNorma(caminhoPdf)`: lê o PDF
via `pdfjs-dist`, agrupa em linhas na ordem de leitura reaproveitando
`agruparPorLinha()`, e remove ruído de página com os padrões REAIS
confirmados nos fixtures desta rodada — rodapé do SEI (`"Lei/Resolução
(CMPA)? N SEI processo / pg. N"`, visto em Lei 14.504 e Resolução 3.006) e
cabeçalho/rodapé de impressão do navegador da Ordem de Serviço 12/2026.

Bug do `reArt` (case-insensitive, OS 12 conta 24 artigos em vez de 22): não
tocado — decisão do usuário, registrada no `CLAUDE.md`, aguardando OK
explícito fora desta tarefa.

A rede foi liberada durante a sessão e os 4 PDFs de `fixtures/pdf/`
(DOPA/SEI) foram baixados e validados. `extrairTextoNorma()` comparado
ponta a ponta (pdfjs × pdftotext) contra os 4 — mesmo nº de artigos,
tipoAto e `promulgacaoParcial.parcial` em todos; Ordem de Serviço 12 sem
nenhum resíduo de URL do SEI em nenhum dos 89 dispositivos da árvore. De
quebra, um bug real apareceu só ao testar contra PDF de verdade:
`agruparPorLinha()` não estava importada localmente em
`dopa-discovery.mjs` (só reexportada) — `extrairEntradasIndice()` quebrava
em runtime. Corrigido; `teste_dopa_discovery.mjs` com os 5 cadernos reais:
96/96.

**Validação contra LC 320/384/412/611 — fechada.** Você trouxe os 4 PDFs
reais do leis.org (`fixtures/pdf/*_leisorg.pdf`). Mesmo nº de artigos,
número e `dataPublicacao` que os `.txt` já usados como fixture desde a
rodada 1. Formato bem diferente do DOPA/SEI (banner "NORMA EM VIGOR" no
topo, rodapé de proveniência do leis.org) — nenhum dos dois vaza pra
dentro de nenhum dispositivo, sem precisar de padrão de ruído novo (o
pré-processamento já existente, `limparMarkdownLinks()`, cobre o resto).
**Não há mais pendência de validação registrada na Tarefa C.**

## Arquivos de teste (rodada 11)
- `teste_promulgacao_parcial.mjs` — 72 asserções (57 da integração + 6 da
  Tarefa A + 9 da Tarefa B).
- `teste_dopa_discovery.mjs` — 96 asserções, com os 5 cadernos reais
  (executivo 6179/6180, legislativo 6171/6112/6158).
- `teste_pdf_normas.mjs` — 38 asserções (15 de padrões de ruído + 14 de
  validação ponta a ponta contra os 4 PDFs reais do DOPA/SEI + 9 contra os
  4 PDFs reais do leis.org, LC 320/384/412/611).
- Regressão do core (`teste_regressao.mjs` + 6 outros): 153 asserções,
  inalterado. `normateste.mjs`: idêntico byte a byte ao início da rodada.
---

# Rodada 12 — Catálogo do acervo e rotina automática de coleta (16/11/2026)

Nenhuma mudança no `norma-core.js`. Tudo novo fica em `ingestao/`, `dados/` e
`.github/workflows/`.

- **Fonte nova:** API do SAPL da PGM — 51.729 normas desde 1886, 26.237
  vínculos, em dia para leis e LCs de 2026 (mediana de atraso de cadastro: 0 dia).
- **Catálogo** (`catalogo-sapl.mjs`): carga completa retomável, modo
  `--novidades` e modo `--vinculos`. Lei Orgânica (8), emendas (68) e LCs
  (1.092) completos, com total igual ao declarado pela API.
- **Textos** (`baixar-textos.mjs`): download com hash, extração de PDF
  (`pdftotext -layout`) e de HTML do SIREL; o resto fica marcado como pendente.
- **Achados em dado real:** o HTML do SIREL da Lei nº 9.113/2003 traz o
  documento repetido 3 vezes (tratado: fica uma cópia, a contagem vai para o
  índice) e palavras coladas ("logradouropúblico"; não corrigido, é da fonte);
  a Lei Orgânica de 1970 é um PDF digitalizado de 20 MB.
- **Rotina diária** no GitHub Actions (`coleta-diaria.yml` → `rotina.sh`).
- **Etiqueta:** 1 requisição por minuto, centralizada em `sapl-io.mjs`.
- **Testes novos:** `teste_catalogo_sapl.mjs` (20) e `teste_textos_sapl.mjs`
  (21), com registros e arquivo reais do SAPL.
- **Revisão do parser** sobre 15 arquivos reais (1990–2026): ver `PLANO.md`,
  seção 1-A — cabeçalho, ementa, fecho e extração precisam de reforço antes da
  estruturação em massa.

## Rodada 12, 2ª parte — rotina completa e preparo para repositório público (17/11/2026)

- **Conferência com o DOPA** (`conferencia-dopa.mjs`): reaproveita o
  `dopa-discovery.mjs`, acumula cabeçalho e link das normas em
  `dados/dopa/edicoes.jsonl` e escreve `dados/dopa/CONFERENCIA.md`. Primeira
  execução real: 14 edições, 10 leis publicadas em 16/11/2026 ainda fora do
  catálogo. O "contexto" dos links sem cabeçalho não é gravado (traz linhas do
  caderno).
- **Catálogo:** recarga completa marcada no dia 1º de cada mês; ao concluir uma
  carga, o JSONL é regravado sem repetições.
- **Rotina:** duração escolhida pela visibilidade do repositório (55 min se
  privado, 320 se público).
- **Repositório público:** README com aviso de experimento sem caráter oficial;
  documentos sem nomes, cargos ou planos institucionais; `User-Agent` neutro;
  os 4 PDFs obtidos de portal privado saíram do repositório (ficam em
  `fixtures-locais/`); histórico refeito em commit único.
- **Testes:** `teste_catalogo_sapl.mjs` 20 → 26 (conferência com o DOPA, com o
  índice real da Edição 7889).

# Rodada 13 — Estruturação com verificação e página de consulta (17/11/2026)

## Motor (`norma-core.js`) — duas mudanças pontuais, espelhadas em `norma-simulacao.html`

1. **Preâmbulo em mais de uma linha.** Achado com dado real (Lei nº 9.113/2003,
   arquivo do SIREL): "O PREFEITO MUNICIPAL DE PORTO ALEGRE." numa linha e
   "Faço saber que…" na seguinte — a segunda caía na ementa. Agora, depois que
   o preâmbulo começou, o que vier antes do 1º artigo é preâmbulo.
2. **`parseLeiPublicada(raw, nrRanges)`** — 2º parâmetro opcional, repassado a
   `parseMinuta`, para os blocos de redação alterada de uma lei alteradora
   ficarem em `nrBloco` em vez de virarem dispositivos da própria alteradora
   (caso real: LC 384/1996, cujo "Parágrafo Único" do bloco aparecia como
   parágrafo do art. 1º da alteradora).

Bateria antes e depois: 153 no core, 72 promulgação parcial, `normateste.mjs`
idêntico byte a byte.

## Ingestão

- `extracao-texto.mjs`: a 1ª linha "Prefeitura Municipal de Porto Alegre" do
  HTML do SIREL é timbre da página, não texto da norma — removida (era tomada
  por epígrafe).
- **`estrutura.mjs`** (puro): norma → lista de dispositivos com endereço
  estável por rótulo + verificação. Conferências: cabeçalho × catálogo (número,
  data, tipo), numeração de artigos, endereço repetido, rótulo dado × rótulo
  escrito na origem, conservação do texto (nada fora da árvore), fecho,
  promulgação parcial. Com dado real: LC 611, LC 320, LC 384 e Lei 9.113
  aceitas; Lei 14.504 (promulgação parcial) vai para revisão.
- **`estruturar.mjs`**: roda toda noite sobre os textos baixados; escreve
  `dados/estruturado/` e o relatório com a taxa de aceitação.
- **`gerar-site.mjs` + `docs/index.html`**: página de consulta estática.
- **Testes:** `teste_estrutura.mjs` (23). Os testes da Lei 9.113 falham contra
  o motor anterior (conferido).

# Rodada 14 — Versionamento posto à prova com uma lei real (17/11/2026)

Prova nova: `teste_versionamento.mjs` (28) — LC 320/1994 + as 10 LCs que a
alteraram (8 baixadas da base da PGM: fixtures/lc320/), comparadas com o
compilado de referência. Antes desta rodada o motor aplicava 2 das 10
alteradoras; agora, 70 de 79 dispositivos coincidem e as 9 diferenças estão
nomeadas no teste.

## Motor (`norma-core.js`, espelhado em `norma-simulacao.html`)

1. **Aspas curvas** (“ ”) nos blocos de redação alterada: `detectNRCandidates`
   e `extrairRedacaoAlterada` só conheciam aspas retas. Era a causa principal:
   7 das 8 alteradoras novas usam aspas curvas.
2. **`enderecarNrBloco`**: bloco que começa direto no dispositivo citado na
   introdução não aninha mais ("parágrafo único do parágrafo único do art. 10"
   — LC 474/2002; "§ 3º do § 3º do art. 2" — LC 525/2005).
3. **`extrairCitacoesExternas`**: "art. 2o" (letra o) e "art. 5°" (grau) valem
   "art. 2º"/"art. 5º" (LC 525/2005, LC 449/2000).
4. **`insert_node` de artigo na raiz**: não leva mais os filhos junto (cada um
   tem o seu comando; antes falhavam com "já existe" e ficavam sem `origem` —
   LC 958/2022, art. 12-B); e passa a recusar artigo com rótulo que já existe
   (LC 449/2000, cujo arquivo traz "art. 5®").
5. **`revoke_node` implementado** com o primeiro exemplo real (LC 958/2022,
   art. 6º): o nó fica na árvore, `revogado: true`, texto "(Revogado)", origem
   na alteradora; os subordinados acompanham.
6. **`apurarTextoVigente` devolve `versoes[]`**: uma versão por alteradora que
   mudou algo, com `id` próprio (`lc 320/1994@2022-10-04`), `versaoAnterior` e
   `fonte`. Antes só a árvore final voltava, com a identidade da v0.

Bateria: 153 no core, 72 promulgação parcial, 23 estrutura, `normateste.mjs`
idêntico byte a byte. O teste novo falha contra o motor anterior (conferido).

## Ingestão

- `docxParaTexto` validado com DOCX real (LC 514/2004) e ligado ao
  `baixar-textos.mjs` (DOCX era "formato sem extração").

## Fica para decisão

- Renumeração e reaproveitamento de posição vetada (LC 514/2004).
- Forma de exibir o dispositivo revogado e o tratamento dos subordinados.

# Rodada 15 — Histórico por dispositivo, piloto com a LC 320 (17/11/2026)

Nenhuma mudança no `norma-core.js`.

- **`ingestao/historico.mjs`** (puro): aplica as alteradoras em ordem de data
  (identidade vinda do catálogo) e devolve as versões e, por dispositivo, a
  linha do tempo de redações com a origem de cada uma. Alteradora não aplicada
  por inteiro é declarada (`naoAplicadas`) e os dispositivos que ela cita ficam
  em `aConferir`, com a data a partir da qual há dúvida. Repetição do documento
  dentro do arquivo (LC 692) não conta como pendência.
- **`gerar-historico.mjs`** + `dados/historico/_piloto.json`: roda na rotina.
- **Página:** seletor de versão, anotações "Redação dada pela / Incluído pela /
  Revogado pela", destaque do que a versão mudou, redações anteriores, selo
  "não conferido" e aviso de histórico incompleto com link para as alteradoras.
- **Rotina:** vínculos passam de 5 para 60 páginas por noite (cinco noites).
- **Teste:** `teste_historico.mjs` (13), com os mesmos textos reais.

# Rodada 16 — O motor segue o que a lei fez: renumeração e rótulo de vetado (17/11/2026)

Decisão do mantenedor: a regra de não renumerar está correta para o que o
projeto redige; mas quando a própria lei alteradora renumera, o motor segue a
lei. Exemplo real: LC 514/2004, art. 1º, sobre o art. 2º da LC 320/1994.

## Motor (`norma-core.js`, espelhado em `norma-simulacao.html`)

1. **`rePUn` só com P maiúsculo** (em `parseMinuta` e `walkLeiAlvo`): a linha
   "parágrafo único para § 3º, com o seguinte teor:" — continuação de frase
   quebrada — era lida como um parágrafo da alteradora, e o bloco de alteração
   ficava preso nele.
2. **`renumber_node`**: extraído de "renumerando o atual X para Y" na frase de
   introdução; aplicado antes dos comandos do bloco. O nó é o mesmo (id, texto,
   origem do texto); muda o rótulo, e a troca fica em `renumerado`.
3. **Texto novo em rótulo de dispositivo vetado**: `replace_text` sobre nó
   vetado deixa de ser erro quando vem de bloco de alteradora — entra um
   dispositivo NOVO (id novo), com `origem.ocupouPosicaoDeVetado`.
4. **Dispositivo de bloco sem texto é omissão** ('§ 3º ...”': as reticências
   saíam junto com as aspas de fechamento e nascia um "§ 3º" vazio).

Efeito: a LC 514 é aplicada; a LC 525/2005 passa a dar nova redação ao § 3º
(antes "incluía" um segundo); o art. 2º fica igual ao compilado de referência.
Comparação: 72 de 78 dispositivos iguais (era 70 de 79).

Bateria: 153 no core, 72 promulgação parcial, 23 estrutura, `normateste.mjs`
idêntico byte a byte; `teste_versionamento.mjs` 28 → 34.

## Histórico e página

- `historico.mjs`: endereço que deixa de existir por renumeração ganha o estado
  `renumerado`; o endereço novo traz `renumerado: { de, lei }`; a ordem de
  exibição junta todas as versões. `teste_historico.mjs` 13 → 17.
- Página: nota "(Parágrafo único renumerado para § 3º pela Lei Complementar nº
  514/2004)". A LC 320 passa a ter 10 versões e só 1 alteradora não aplicada
  (LC 449/2000, arquivo mal transcrito na fonte).

## Rodada 16, complemento — vale o texto da lei (17/11/2026)

Decisão do mantenedor, à vista da evidência (art. 6º e ementa da LC 958/2022,
sancionada sem veto): onde o texto da lei e a cópia compilada de referência
divergem, vale a lei. Das 6 diferenças restantes na comparação da LC 320, 4
são desse tipo (art. 7º e seus dois parágrafos, revogados; inc. I do art.
12-B) e o motor está certo nelas; as outras 2 são defeito do arquivo de origem
(LC 692 e LC 474). A cópia compilada passa a ser tratada como auxílio de
conferência, não como gabarito.

# Rodada 17 — Minuta de alteradora, histórico em escala e roteiro de continuidade (17/11/2026)

## Motor (`norma-core.js`, espelhado em `norma-simulacao.html`)

- **Ponto final do último dispositivo de um bloco**: `extrairRedacaoAlterada`
  tirava, junto com as aspas de fechamento, o ponto final que vem ANTES delas;
  todo último dispositivo de bloco ficava sem ponto. Achado pela ida e volta da
  minuta. Agora só saem as aspas (e o ponto que às vezes vem depois delas).
  Bateria igual; `normateste.mjs` idêntico byte a byte.

## Minuta de lei alteradora (piloto)

- `ingestao/minuta.mjs`: gera epígrafe, ementa (LC 611, art. 18), um artigo
  alterador por artigo alterado, bloco entre aspas com linha pontilhada para o
  que não muda, "(NR)" (ausente em artigo novo), vigência e revogação. Moldes
  reais: LC 958/2022, LC 761/2015, LC 514/2004. Numera o dispositivo novo sem
  reaproveitar número; inserção intermediária com letra; artigo com parágrafo
  único é renumerado para § 1º pela própria minuta. Recusa, com motivo, o que
  não sabe pôr em forma.
- `ingestao/minuta-conferencia.mjs`: ida e volta — o motor lê a minuta e os
  comandos têm de ser exatamente os pedidos.
- `ingestao/minuta-cli.mjs`, `exemplos/pedido-minuta-lc320.json`, painel na
  página (os módulos são copiados para `docs/js/`).
- `teste_minuta.mjs` (33): além da ida e volta, APLICA a minuta sobre a árvore
  real da LC 320 e confere o resultado. Falha contra o motor anterior.

## Histórico em escala

- `montarListaDeHistoricos` (vínculos da fonte; direção conferida com os
  vínculos reais da LC 320) e `alteradorasPelaEmenta` (a fonte não liga 3 das
  10 alteradoras da LC 320: LC 474, 761 e 849; pelas ementas, as 10 aparecem).
  Candidata pela ementa cujos comandos miram outra lei é descartada sem virar
  pendência. No catálogo de hoje: 1.500 pares, 469 leis-base.
- `gerar-historico.mjs` reescrito: três fontes de lista, regrava só o que
  muda, `dados/historico/RELATORIO.md` e `_situacao.json` (com as revogadas por
  inteiro, que a página passa a marcar).
- `teste_historico.mjs` 17 → 24.

## Continuidade

- `ROTEIRO.md`: tarefas seguintes passo a passo (afinar o leitor pelo
  relatório, cabeçalho pelo catálogo, OCR, atos da Câmara pelo DOPA, busca no
  texto, busca por sentido, extensões da minuta), pendências que dependem de
  decisão, manutenção da rotina e mapa do código.

# Rodada 18 — OCR e documento repetido em PDF (17/11/2026)

Nenhuma mudança no `norma-core.js`.

- **`ingestao/ocr.mjs`**: `pdftoppm` (300 dpi, cinza) + `tesseract` em
  português, página a página; limite de 60 páginas por arquivo. Roda dentro do
  `baixar-textos.mjs`, na hora do download.
- **Achado com dado real:** as digitalizações dos anos 1980 da fonte JÁ trazem
  camada de texto, mas ruim e incompleta — a LC 51/1980 tem 853 caracteres na
  camada do arquivo e 2.174 no OCR daqui. Por isso o critério não é só "sem
  texto": `pdfDigitalizado` reconhece a digitalização pela imagem de página
  (≥ 80% das páginas com imagem cobrindo mais de um terço da folha; brasão e
  selo de assinatura não contam) e fica a leitura que trouxer mais texto.
- Medido: ~3 s por página datilografada; LC 193/1988 (19 páginas), 108 s.
- **`removerRepeticaoDeTexto`**: PDF que traz o documento inteiro repetido
  (LC 692/2012, 3 cópias) fica com uma cópia; a contagem vai para o índice.
- Estruturação: aviso `texto_de_ocr`; a página avisa o leitor.
- Testes: `teste_ocr.mjs` (7, com a LC 51/1980 real; pula se não houver
  tesseract) e `teste_textos_sapl.mjs` 21 → 24.

# Rodada 19 — Busca no texto, acabamento da minuta, hifenização e rotina mais robusta (17/11/2026)

Nenhuma mudança no `norma-core.js`.

- **Hifenização de fim de linha** (`desfazerHifenizacao`, `prepararTextoExtraido`
  em `extracao-texto.mjs`): PDF justificado quebra palavras ("cultu-" / "rais");
  o texto ficava "cultu- rais" — Lei nº 11.213/2012, 18 casos em 66 linhas.
  Junta quando a palavra inteira aparece no mesmo texto ou, na falta de prova,
  por padrão; mantém o hífen se a forma com hífen aparece em outro ponto, se o
  que segue é pronome/desinência ou começa por maiúscula. Aplicado na leitura
  (estruturação e histórico); o `.txt` guardado não muda. `VERSAO_ESTRUTURADOR` 3.
- **Busca dentro do texto**: `gerar-site.mjs` produz fatias com o texto vigente
  por dispositivo (do histórico, ou da estruturação aceita); a página as baixa
  só quando a opção é ligada, mostra resultados por dispositivo com o trecho
  destacado e abre a norma no ponto.
- **Painel de minuta**: botão "alterar" em cada dispositivo do texto vigente e
  download do pedido em JSON (o mesmo que `minuta-cli.mjs` lê).
- **Rotina**: a execução de validação coletou e NÃO gravou, por conflito em
  arquivo gerado (houve commit durante a coleta). A gravação passa a resolver
  esse conflito a favor do que a coleta produziu, com três tentativas.
- Testes: `teste_textos_sapl.mjs` 24 → 33.

## Rodada 19, complemento — leis ordinárias de ponta a ponta

- **Motor (`norma-core.js`, espelhado):** o fecho aceita "PREFEITURA MUNIC IPAL
  DE PORTO ALEGRE", grafia com que ele vem nos PDFs do Diário Oficial de 2012
  a 2015 (Lei nº 11.229/2012, Lei nº 11.575/2014, LC 761/2015). Sem isso o
  fecho e as assinaturas grudavam no último artigo. Bateria igual;
  `normateste.mjs` idêntico byte a byte.
- **`teste_leis_ordinarias.mjs` (20):** Lei nº 11.213/2012 com 4 alteradoras e
  Lei nº 11.229/2012 com 3 (9 arquivos reais em `fixtures/leis-ordinarias/`):
  as 9 são aceitas pela verificação, os dois históricos saem completos e
  conferem com as ementas das alteradoras, e a minuta passa na ida e volta
  (inciso dentro de parágrafo único; artigo novo depois de artigo com letra).
- Observado e NÃO tratado: o `pdftotext` parte palavras em alguns PDFs de 2014
  ("Ex cetuam-se"); o leitor por pdfjs (`extrairTextoNorma`) lê certo nesse
  arquivo. Ver ROTEIRO.md, tarefa 1.

# Rodada 20 — Operação sem análise e regime permanente (17/11/2026)

Nenhuma mudança no `norma-core.js`.

- **Painel de situação** (`ingestao/situacao.mjs` → `dados/SITUACAO.md` e
  `situacao.json`), gerado no fim de toda execução, sem rede e sem IA. Decide
  "em carga" × "em dia" por cinco critérios, calcula ritmo e previsão de
  esvaziar a fila de textos e levanta alertas: execução parada há mais de 2
  dias, duas execuções seguidas com erro, fila que não anda em 7 dias, norma do
  Diário Oficial ausente há mais de 7 dias, dados acima de 800 MB. "O que
  fazer agora" sai de regras fixas apontando a tarefa do roteiro.
- **Registro de execuções**: a `rotina.sh` acrescenta uma linha por execução a
  `dados/_execucoes.jsonl` (quando, duração, erros, resultado de cada etapa).
- **Resumos em forma de dado**: `_resumo.json` da estruturação, do histórico e
  da conferência com o Diário Oficial.
- **Seguro de dados**: se a gravação no repositório falhar, `dados/` e
  `docs/dados` são guardados como artefato por 30 dias (a execução de
  validação de 17/11 perdeu o que coletou por um conflito de gravação).
- **Roteiro**: seções 10-A (ficar sem análise e retomar; ramo `wip/` com
  `EM_ANDAMENTO.md` para trabalho interrompido) e 10-B (regime permanente:
  definição de "em dia", rotina semanal/mensal/trimestral, cuidados).
- Testes: `teste_situacao.mjs` (16).

## Rodada 20, complemento — a primeira execução agendada falhou (17/11/2026)

A execução nº 5 (agendada) disparou às 13:23 UTC, 9 horas depois do horário
(04:17), e terminou vermelha depois de 3h59. Os dados foram gravados; o que
falhou foi a etapa de textos: depois de 3 tentativas no arquivo `lc_1061.pdf`
(`fetch failed`), `baixar-textos.mjs` abortava a etapa inteira, e antes disso
cada arquivo ruim gastava 13 minutos em esperas (4 de 5 casos reais passaram
na 2ª tentativa). Em 4 horas só 80 arquivos foram baixados.

- `sapl-io.mjs`: o log passa a mostrar a causa real do erro (o undici esconde
  em `cause`); cada tentativa tem prazo; esperas de 1 e 5 minutos (eram 3 e 10);
  falha persistente vira `ErroTemporario`.
- `baixar-textos.mjs`: `ErroTemporario` registra `falha_temporaria` no índice e
  segue com o próximo arquivo; só 5 falhas seguidas em arquivos diferentes
  param a etapa (fonte fora do ar).
- `filaDeDownload`: quem já falhou vai para o fim da fila.
- Painel de situação: mostra os adiados; 10 ou mais viram alerta.
- Testes: `teste_rede_local.mjs` (8, servidor local que derruba conexão,
  devolve 404/500 ou não responde), `teste_textos_sapl.mjs` 33 → 36,
  `teste_situacao.mjs` 16 → 18.

## Rodada 21 — guarda de horário e disparo externo (17/11/2026)

- `ingestao/guarda-horario.sh` + job `guarda` no workflow: execução agendada
  fora da madrugada de Brasília (03:00–10:00 UTC) é pulada; dentro dela para
  às 09:50 UTC; se o disparo externo já rodou, o agendamento pula.
  `teste_guarda_horario.sh` (8; inclui o caso real de 13:23 UTC).
- Disparo externo às 04:05 UTC via `workflow_dispatch` (ROTEIRO, 10-C): o
  mantenedor cria o token e a tarefa no serviço de cron; o `schedule` fica de reserva.

## Rodada 22 — Emenda à Lei Orgânica (tarefa 1 do ROTEIRO, 17/11/2026)

Achado: dos 60 `cabecalho_nao_reconhecido` do relatório de estruturação, ~35 eram
Emendas à Lei Orgânica — o core só as sinalizava como `tipoNaoSuportado`, e agora
há textos reais (EC 2–51). O resto são digitalizações antigas de baixa qualidade.

- `norma-core.js` (aditivo, após o bloco de Resolução): `extrairCabecalhoLeiPublicada`
  lê "EMENDA À LEI ORGÂNICA Nº N, DE D DE MÊS DE AAAA" nas variantes reais (N°, N.º,
  sem Nº, "DE2006", "Nº 22 ,"). Ano cortado na linha → número sim, data/ano nulos
  (não inventa); só "Nº 04" (anos 1990) → número sem zeros. `normateste.mjs` idêntico
  byte a byte; core 153, promulgação parcial 72 e demais testes sem mudança.
- `estrutura.mjs`: `TIPO_ATO_ESPERADO[2]`; `VERSAO_ESTRUTURADOR` 4.
- `teste_emenda_lo.mjs` (12, fixtures reais em `fixtures/emendas-lo/`; 10 falham
  contra o código antigo).
- Efeito local nos 79 textos: aceitas 15 → 41; `cabecalho_nao_reconhecido` 60 → 22;
  `tipo_sem_suporte` 60 → 8. A EC 16 passa a mostrar divergência real: o texto diz
  20/10/2000, o catálogo diz 10/10/2000 (`data_diverge_do_catalogo`).

## Rodada 23 — "(NR)" na linha seguinte ao fecha-aspas (tarefa 1, 18/11/2026)

Achado: 15 das 52 normas com `trecho_nao_localizado_na_origem` tinham o bloco de
redação alterada fechando com `”` numa linha e `(NR)` sozinho na seguinte (LCs
reais de 2017 em diante, ex. LC 804/2017). `detectNRCandidates` fechava o bloco
no fecha-aspas, e o "(NR)" sobrava e grudava no dispositivo que introduz o bloco
("…conforme segue: (NR)"), que então não existia assim na origem.

- `norma-core.js` (aditivo): depois do fecha-aspas, se a próxima linha não vazia
  (até 3 linhas à frente) é só "(NR)", o bloco termina nela. Blocos sem "(NR)"
  (artigo novo) continuam `semNR`. `normateste.mjs` idêntico byte a byte; core 153
  e demais testes sem mudança.
- `VERSAO_ESTRUTURADOR` 5. `teste_nr_linha_seguinte.mjs` (9, LC 804 e LC 834
  reais em `fixtures/lcs-nr/`; 7 falham contra o código antigo).
- Efeito nos 328 textos: aceitas 234 → 243, nenhuma deixou de ser aceita.
- Não resolvido (defeito de fonte): LC 809/2017 — "(NR" truncado e número de página
  solto ("conforme segue: 3") no arquivo de origem; fica em revisão.
