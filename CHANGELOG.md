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

## Rodada 24 — `rotulo_nao_confere_com_a_origem`: análise e 1ª correção (tarefa 1, 20/11/2026)

Análise dos 174 textos com esse motivo (por épocas: 91 até 1999 · 28 de 2000–2009 · 55 de 2010 em diante; 61 só com ele).
O motivo cumpre o papel: o estruturador dá o rótulo por posição e a conferência o compara com o que está escrito.
Quando diverge, é porque a árvore perdeu ou ganhou dispositivo, ou porque a lei escreveu diferente do posicional.
Famílias (contagens por regra mecânica; algumas heurísticas, marcadas ~):

- **Defeito de fonte — bloco engole artigo da própria lei** (~11): fecha-aspas ausente (Lei Compl. 766/2015, art. 10 sem fecho), fecha-aspas cedo demais (LC 957/2022, arts. 133-C a 133-F fora das aspas) ou "(NR)" truncado em `” (` (LC 1005/2024, engole os arts. 10 e 11). Ficam em revisão; não se corrige à mão.
- **Defeito de fonte — numeração errada na própria lei** (LC 868/2019: "V – o art. 114" no lugar de "VII"). Fica em revisão.
- **Texto de OCR / digitalização antiga** (~12 marcados `texto_de_ocr` e ~16 em que "Art. 1º" saiu "Art. 12"/"Art. 1®": 14 deles até 1999). Defeito de fonte.
- **"§ 1º" escrito sozinho × "Parágrafo único." posicional** (~22, mais 4 no sentido inverso): a lei escreveu "§ 1º" sem "§ 2º" (ex. LC 521/2005 art. 1º; Lei Compl. 773/2015). A conferência está certa em reprovar. **Decisão do mantenedor pendente** (ver ROTEIRO, seção 9): o endereço passa a seguir o rótulo escrito ("o motor segue o que a lei fez") ou fica em revisão?
- **Alteradora sem aspas** (~29, 1990–2003, ex. LC 267/1992 e LC 349/1995): a redação nova vem em texto corrido, sem aspas; o leitor a toma por dispositivo da própria alteradora. Forma legítima antiga que o motor não conhece; exige desenho próprio (sem exemplo suficiente de regra segura ainda).
- **Forma legítima que o preparo não tratava — corrigida nesta rodada** (9 textos, 2013–2014): a extração do PDF parte a abertura do bloco em duas linhas (`“Art.` / `25......`). Sem juntar, `detectNRCandidates` não reconhece o bloco e o inciso citado vira dispositivo da alteradora.

Correção (menor possível, na extração e não no core): `juntarAberturaDeBlocoPartida` em `ingestao/extracao-texto.mjs`,
chamada por `prepararTextoExtraido` (o `.txt` guardado não muda). Só junta com aspa de abertura e número na linha seguinte.
`norma-core.js` não foi tocado; `normateste.mjs` idêntico byte a byte.

- `teste_estrutura.mjs` 28 → 35 (LC 689/2012 real em `fixtures/textos/lc689_2012.txt` + registro do catálogo; 4 asserções falham contra o código antigo; 3 são de fronteira: sem aspa, seguido de texto, `Art.` sozinho).
- `VERSAO_ESTRUTURADOR` 6 (a coleta noturna reprocessa tudo).
- Efeito medido nas 823 estruturações, norma a norma (sem gravar em `dados/`): 2 mudam de resultado, nenhuma piora. LC 689/2012 passa de revisar a **aceita**; a de 39249 perde o motivo de rótulo (segue em revisão por outros); 39563 passa de 5 para 3 dispositivos (bloco reconhecido). Demais bateria sem mudança.

## Rodada 25 — `cabecalho_nao_reconhecido`: análise e correção do espaçamento (tarefa 1, 20/11/2026)

Análise dos 119 textos (por tipo: 97 LC · 14 Emenda à LO · 8 Lei Orgânica; por época: 74 dos anos 1990, 29 de 2010–2019, 7 de 2000–2009, 9 anteriores a 1980; 14 são texto de OCR).
O motivo só aparece quando o leitor não acha número no cabeçalho **e** o reconhecimento pelo catálogo (aviso `cabecalho_fora_do_padrao`) também não casa.
Famílias:

- **Palavras coladas ou partidas pela extração, em LCs de 2011–2014 (~24)**: `LEICOMPLEMENTAR Nº 719`, `LEI COMPLEMENTAR723`, `LEI COMPLEMENTARNº 741`, `Nº 67 4`. O cabeçalho está lá; o reconhecimento pelo catálogo era estrito demais no espaço. **Corrigido.**
- **Digitalização/OCR antigo (a maioria dos ~65 de LC até 1999 e das 14 EC)**: capa de protocolo da Câmara no lugar do cabeçalho, "NP 268", linhas de lixo. Defeito de fonte; seguem em revisão.
- **Lei Orgânica (8, 1892–1990)**: tipo fora do suporte do leitor e texto digitalizado. Seguem em revisão.
- **Erro na própria lei ou ruído de timbre (poucos, 2015–2019)**: "LEI Nº COMPLEMENTAR Nº 848", "E LEI COMPLEMENTAR Nº 813 … ST", "LC 790" repetido, ato de "TORNA SEM EFEITO" publicado (LC 779/2015). Não se afrouxa para eles.

Correção (em `ingestao/estrutura.mjs`, só no reconhecimento por catálogo; o core não foi tocado, `normateste.mjs` idêntico):
`LEI\s*COMPLEMENTAR` com lookahead (espaço, algarismo, "Nº", pontuação ou fim — "LEI COMPLEMENTARES" continua não casando) e **duas leituras** do número (1º bloco de algarismos, ou com espaço no meio); vale se qualquer uma for o número do registro. Continua amarrado ao catálogo: arquivo de outra norma não herda a identidade.

- Achado no caminho: a leitura só com espaço faria o OCR "Nº: 358 072" (LC 358/1995) virar 358072 e **piorar** uma norma já aceita; a comparação norma a norma pegou, e por isso as duas leituras. Esse caso entrou no teste.
- `teste_estrutura.mjs` 35 → 42 (LCs 719/2013, 723/2013, 674/2011, 741/2014 e 358/1995 reais em `fixtures/textos/`; 4 falham contra o código antigo; o da LC 358 e os dois negativos são de guarda). `VERSAO_ESTRUTURADOR` 7.
- Efeito medido nas 823, norma a norma (sem gravar em `dados/`): 24 perdem o motivo de cabeçalho, 11 passam a **aceitas** por esta rodada (mais a LC 689 da rodada 24), nenhuma piora. Esperado após a coleta noturna: ~527 aceitas de 823 (64,0%).

## Rodada 26 — fila de revisão separada por época (tarefa 1, 20/11/2026)

Orientação do mantenedor: a LC 611/2009 vale da sanção (03/02/2009) em diante; antes dela a técnica legislativa era outra e falhas de compilação são esperadas. O corte é fixo nessa data.

- `ingestao/estrutura.mjs`: `DATA_CORTE_EPOCA` e `epocaDaNorma(registro)` → `antiga` | `recente` | `indefinida` (sem data, só o ano 2009 não decide; sem nada, `indefinida` — nunca palpite). Pura.
- `ingestao/estruturar.mjs`: `RELATORIO.md` ganha a tabela "Por época" (aceitas, a revisar, taxa), os motivos só das recentes e duas filas — recentes (prioridade) e antigas. `_resumo.json` ganha `porEpoca` (aditivo).
- `teste_estrutura.mjs` 42 → 48 (6 falham contra o código antigo). `normateste.mjs` idêntico; core intocado.
- Medido com a versão 7 do estruturador: **527 aceitas de 823 (64,0%)**; recentes 343 de 478 (**71,8%**); antigas 184 de 345 (53,3%). Motivos das recentes: `rotulo_nao_confere_com_a_origem` 58 · `trecho_nao_localizado_na_origem` 55 · `texto_fora_da_arvore` 35 · `sem_fecho` 31 · `bloco_de_alteracao_sem_dono` 25.
- `dados/estruturado/` regravado localmente com a versão 7 (o mesmo que a coleta noturna faria).

## Rodada 27 — dashboard de revisão humana, fase 1 (tarefa 1, 20/11/2026)

Plano e decisões da entrevista com o mantenedor em `PLANO-REVISAO.md`. Fase 1 entregue: página estática `docs/revisao.html` (fila das normas **recentes** em revisão; texto de origem × árvore lado a lado, com o ponto reprovado destacado nos dois lados; quatro ações — aceitar, defeito de fonte, corrigir rótulo por sobreposição, encaminhar ao motor; exportar/importar `decisoes.jsonl`; link do arquivo original; teclado; celular; claro/escuro).

- `ingestao/estrutura.mjs` (aditivo): `conferirConservacao` devolve também `ancoras` e `posLacunas` (posições); `alnum` exportada. Nenhum veredito muda; o JSON gravado em `dados/estruturado/` não muda.
- `ingestao/revisao-ancoras.mjs` (puro): `ancorarConferencia` converte as posições em deslocamentos no texto de origem e dá a situação de cada trecho (ok · rótulo não confere · não localizado), mais as lacunas. Não reimplementa a conferência.
- `ingestao/revisao.mjs` (puro, roda no navegador): validação de decisões, leitura/escrita do `decisoes.jsonl` (a última de cada norma vale), situação pendente/revisada/**desatualizada** (decisão amarrada a `sha256Origem` + `versaoEstruturador`: se o texto ou o leitor mudar, a norma volta à fila).
- `ingestao/gerar-revisao.mjs`: gera `docs/dados/revisao/` (`fila.json`, `n/<id>.json`, cópia das decisões) e copia o módulo para `docs/js/ingestao/`; entra na `rotina.sh` depois do `gerar-site`. 135 normas, 6,1 MB, carregadas uma a uma.
- `teste_revisao.mjs` (28, novo; falha contra o código sem as âncoras): casos reais (LC 1.005/2024, LC 957/2022, EC 39/2016, LC 689/2012 em `fixtures/textos/`) e, sobre as **823 normas** do acervo, as âncoras concordam com o veredito gravado pelo estruturador (0 divergências).
- Conferido no Chromium (Playwright): fila, filtros, destaque, clique nos dois sentidos, as quatro ações, recusa de "encaminhar" sem nota, exportação, persistência após recarregar, celular sem rolagem horizontal, sem erro de console.
- `normateste.mjs` idêntico; demais testes sem mudança. Core intocado.
- Limites desta fase: decisões ainda não alteram os relatórios (F4); alteradoras sem "comando × resultado" (F2); sem comparação com o leis.org (F3).

## Rodada 28 — dashboard de revisão, fase 4: efeito das decisões (20/11/2026)

- `ingestao/revisao.mjs`: `situacaoHumana`, `resumoHumano`, `listaParaOMotor`, `CATEGORIAS_HUMANAS`. Categorias: aceita pelo motor · aceita por humano · corrigida · defeito de fonte · encaminhada · pendente · desatualizada. "Aceitar" sobre norma que o motor já aceitou só a confirma.
- `ingestao/estruturar.mjs`: o `RELATORIO.md` ganha a seção "Revisão humana" (recentes × antigas × total) e as filas passam a listar só **pendentes e desatualizadas**; `_resumo.json` ganha `humano`; grava `dados/revisao/PARA-O-MOTOR.md` (casos encaminhados ao motor, com a nota do revisor). Decisões não alteram a leitura nem `dados/estruturado/sapl/`.
- `teste_revisao.mjs` 28 → 35 (normas reais das fixtures + decisões `(sintético)`; falha contra o código antigo). Verificado também de ponta a ponta com decisões temporárias sobre normas reais (cada categoria contou certo; arquivo de decisões restaurado vazio).
- **Atenção:** como a decisão amarra `versaoEstruturador`, **todo `VERSAO_ESTRUTURADOR` novo reabre todas as decisões** (viram "desatualizadas"). É o desenho (princípio 2 do `PLANO-REVISAO.md`); por isso não subir a versão sem necessidade depois que houver revisão feita.
- Fica para depois: sobreposições de rótulo valerem na página de consulta (com aviso).

## Rodada 29 — dashboard de revisão, fases 2 e 3 (20/11/2026)

**F2, comando × resultado nas alteradoras.** `ingestao/revisao-comandos.mjs` (puro): `descreverComandos` mostra, para cada comando que o extrator entendeu, a operação, a lei-alvo, o dispositivo-alvo e o texto novo; com a lei-alvo na base, o antes e o depois (cada comando aplicado sozinho sobre o texto ORIGINAL da lei-alvo, aviso na tela). Com uma só lei-alvo na base, refaz a extração com `leiBaseIndex` (única forma confiável de separar substituir × incluir). `gerar-revisao.mjs` grava `n/<id>.cmd.json`; a página ganhou a seção "Comandos da alteradora" (filtro, expandir, ir ao artigo). Das 135 recentes em revisão, 82 são alteradoras (1.414 comandos).
- **Achado do extrator (não corrigido nesta rodada):** 1.154 dos 1.414 comandos saem **sem lei-alvo identificada**. Causa verificada: `extrairReferenciasLei` não reconhece "Lei Complementar nº 12, **de 1975**" (só o ano, sem dia e mês — forma comum nas leis recentes), e também não resolve alteração da Lei Orgânica ("na Lei Orgânica do Município"). Com a data por extenso ("nº 12, de 7 de janeiro de 1975") reconhece. Candidato nº 1 para a próxima rodada de core.

**F3, comparação com a compilação do leis.org.** `ingestao/revisao-compilacao.mjs` (puro): `compararComCompilacao` compara o estado final de cada dispositivo do histórico apurado com uma compilação colada. A compilação é só auxílio (vale o texto da lei); a comparação lista, não corrige. Página nova `docs/compara.html` (escolher a lei entre as 99 com alteração aplicada, colar, comparar, destaque por palavras, baixar as divergências em `.md`); o texto colado não sai do navegador. `gerar-revisao.mjs` publica os históricos em `docs/dados/revisao/historico/` (8 MB).
- Critério de aceite da F3 cumprido: a LC 320 contra `lc320_compilado_leisorg.txt` reproduz exatamente as 6 divergências já nomeadas em `teste_versionamento` (72 iguais; art. 7º e §§ 1º e 2º, art. 9º-A, parágrafo único do art. 10 e inc. I do art. 12-B diferentes) e acusa 1 dispositivo só no motor (parágrafo único do art. 2º, renumerado pela LC 514).

`teste_revisao.mjs` 35 → 53 (casos reais: LC 412 e LC 514 sobre a LC 320, LC 1.005/2024; histórico real da LC 320 em `fixtures/historico/`; um teste que eu havia escrito vácuo foi detectado e refeito). Conferido no Chromium nas duas páginas. `normateste.mjs` idêntico; core intocado; demais testes sem mudança.

## Rodada 30 — core: lei-alvo, Lei Orgânica, 4º fecho, "§ 1º" sozinho; entrevista do mantenedor como regras (20/11/2026)

Regras decididas em entrevista (CLAUDE.md, "Decisões do mantenedor"). Mudanças, todas com texto real e testes que falham contra o código antigo (`teste_referencias_alvo.mjs`, 27; 16 dos 22 iniciais e 3 dos 5 do § falham no core antigo):

- **`extrairReferenciasLei` reconhece a citação só com o ano** ("Lei Complementar nº 12, de 1975"; ~1.100 ocorrências no acervo, a forma mais comum nas leis recentes) e passa a devolver as referências **na ordem do texto** (antes: por forma de escrita), para a 1ª citada ser de fato a lei-alvo. `extrairReferenciaLeiOrganica` (nova, à parte): "Lei Orgânica do Município" = LO nº 1/1990, presumida; `chaveLei` ganha `lo`.
- **4º padrão de fecho** `Porto Alegre, DD de mês de AAAA.` em `parseMinuta`; `juntarFechoQuebrado` (extração) junta o fecho com a data partida em duas linhas.
- **"§ 1º" escrito sozinho** segue o rótulo escrito (`atribuirDesFixoOriginal`), com o aviso `paragrafo_numerado_sem_irmao` no estruturador.
- **Travas da revogação**, expostas pelo reconhecimento de mais leis-alvo: `RE_GATILHO_REVOGACAO` só casa o verbo (o `\b` casava "revogação"); revogação com citação de dispositivo incompleta vira `indeterminado`. Corrigiu também 4 `revoke_node` que já existiam e estavam errados (art. 71 e art. 1º inteiros por OCR, uma "repristinação").
- **Extração:** aspas e travessão gravados como controles cp1252 (U+0093/94/96) em 16 textos do SIREL (achado do agente de pesquisa, confirmado de forma independente): `cp1252ParaUnicode` na leitura do HTML e no preparo.
- **Dashboard:** o guia de normas a revisar (famílias de motivos, menores primeiro) passa a morar em `revisao.html`; datas divergentes lado a lado; regra de desatualização "só texto ou veredito" (`situacaoDaDecisao`); F2 trata a LO presumida (`DATA_LEI_ORGANICA_VIGENTE`).
- Espelho em `norma-simulacao.html` (texto das funções alteradas conferido idêntico ao do core; página carrega sem erro). `normateste.mjs` idêntico byte a byte; core 153 intacto; `teste_promulgacao_parcial` ganhou uma expectativa atualizada de propósito (o § 3º sozinho agora mantém "§ 3º" em vez de virar "Parágrafo único.").

**Medido em todo o acervo, não só nos testes:**
- Históricos (152 leis): 901 comandos de OUTRA lei que eram aplicados à base errada passaram a ser recusados; 0 regressões (nenhum comando que mira a própria base deixou de ser aplicado; 1 ganho). Antes, 14 alteradoras tinham comandos aplicados a mais leis do que o total que possuem (602 aplicações indevidas); depois, 0. Leis com alteração aplicada: 99 → 85 (14 só tinham alterações aplicadas por engano). Completas 35 → 40.
- Estruturação (`VERSAO_ESTRUTURADOR` 9): aceitas **527 → 541** de 823 (65,7%); recentes 347/478 (72,6%), antigas 194/345 (56,2%); 0 normas que eram aceitas deixaram de ser. `revoke_node` novos no acervo: 8, todos revogações explícitas corretas.
- `PLANO-ALTERADORA-SEM-ASPAS.md` (pesquisa por agente; não implementado além da correção cp1252): das 28 candidatas só 5 são realmente sem aspas; 8 normas `aceita` hoje têm a lei-alvo lida como dispositivo da alteradora (falso aceite silencioso) — próximas rodadas (aspa pareada, bloco sem fechamento, cue no plural).

## Rodada 31 — blocos de alteração mal delimitados e falso aceite (plano das alteradoras, 20/11/2026)

Entrevista com o mantenedor (decisões 9 a 12 no CLAUDE.md) e implementação das rodadas 3, 4 e 5 do `PLANO-ALTERADORA-SEM-ASPAS.md`. `detectNRCandidates` (core, espelhado em `norma-simulacao.html`, cuja cópia da função estava defasada — sem a rodada 23 — e agora é idêntica à do core):
- **R1 fechamento pareado:** abertura dupla só fecha com aspas duplas (ou o par de simples que a extração faz); abertura simples só com simples; fechar na própria linha de abertura exige mais de 25 caracteres. A aspa de `'jetton'.` não corta mais o bloco (LC 293/1993).
- **R2 bloco sem fechamento:** com introdução de alteração, termina antes do `Art. (n+1)`. Fronteira INFERIDA: `sem_fecho`, `confianca` (média se há glifo de aspas no fim; baixa se não há). O estruturador reprova com `bloco_sem_fechamento_de_aspas` (nunca aceita limpa) e grava `metricas.fronteirasInferidas`.
- **R3** cue no plural ("seguintes redações"), `$` no lugar de `§`, aberturas `‘ ’ „ ‚`.
- **R4 cabeçalho com reticências** sem aspa de abertura (`Art. 4º ......`): 3 sinais juntos (3+ pontos; introdução que cita esse artigo e não é o próximo da alteradora; fecha em `(NR)`/aspa) → `aspa_de_abertura_ausente`, confiança média. Cabeçalho sem pontos nunca delimita.
- **Detector de falso aceite** (`introsDeAlteracaoSemBloco`, estruturador): introdução forte sem bloco lido → motivo `alteracao_sem_aspas_nao_delimitada`.
- `VERSAO_ESTRUTURADOR` 10. Dashboard: motivos novos descritos, guia com orientação para eles, fronteira inferida em azul no texto de origem (o revisor só aceita ou marca defeito de fonte; decisão 12).
- `teste_blocos_sem_aspas.mjs` (26, textos reais em `fixtures/alteradoras-sem-aspas/`): 15 falham contra o core antigo; guardas reais (LC 615/2009, LC 575/2007, LC 611, LC 685/2011) provam que o pareamento e a regra de cabeçalho não regridem.

**Medido em todo o acervo:** aceitas 541 → **537** de 823. Cinco normas que eram "aceitas" por erro silencioso agora estão a revisar (4 com fronteira inferida: LC 398/1997, 422, 425 e 426/1998; e a LC 606/2008, que altera um anexo em tabela sem bloco lido); 1 passa a aceita (LC 293/1993); nenhuma outra aceita virou revisar. Antigas 194 → 190; recentes inalteradas (347/478, 72,6%). Históricos: 6 mudaram, todos para melhor (a EC 7/1994 deixou de aplicar à LO dois comandos-lixo — "Esta Emenda… entra em vigor" lido como redação do art. 31 —; a EC 11/1997 passou a ter seu comando lido; a LC 1.011/2024 passou a registrar a pendência). Completos 40 → 41.

## Rodada 32 — avaliação exploratória de design e experiência de uso (20/11/2026)

Três agentes de pesquisa (somente leitura, com Playwright e capturas de tela; regra 12) avaliaram as páginas e deixaram relatórios: `PLANO-UX-REVISAO.md` (dashboard de revisão), `PLANO-UX-CONSULTA.md` (página de consulta, confiança e terminologia) e `PLANO-UX-ACESSIBILIDADE.md` (design visual e WCAG 2.1 AA; axe-core: 0 violações em 10 execuções, o que ele não pega foi medido à mão). Os relatórios são insumo: as afirmações que sustentam correção foram conferidas de forma independente antes de agir.

Corrigido já (defeitos objetivos do `docs/revisao.html`, confirmados por medida própria):
- **Rolagem errada ao clicar num dispositivo:** 4 de 5 marcas ficavam fora da área visível (`offsetTop` relativo ao `BODY`, não ao contêiner de rolagem). Agora a posição é relativa ao contêiner e a rolagem do texto de origem é instantânea (a suave levava ~2,5 s em textos longos).
- **Perda de decisões com duas abas:** cada aba regravava só a sua memória e apagava as da outra. `gravarLocal` agora mescla com o que está gravado (mais recente por `em`) e aceita remoção explícita.
- **Aviso desonesto sem armazenamento:** com o armazenamento do navegador bloqueado a página dizia "registrada". Agora avisa "NÃO deixou guardar… EXPORTE agora" e mantém a faixa de alerta.
- Conferido no Chromium: rolagem (5 de 5 visíveis), duas abas (2 decisões preservadas), armazenamento negado (aviso correto), sem erro de console.

Confirmado por medida e pendente de decisão do mantenedor (entrevista, regra 11): borda dos controles 1,42:1 (exige 3:1); destaques do comparador 1,13 a 1,25:1 e só por cor; 44 de 131 normas sem nenhum ponto a conferir; busca "lei 12/1975" não acha LCs; rótulo "(texto vigente apurado)" sobre histórico não apurado; atalhos de uma letra sem como desligar (WCAG 2.1.4); foco perdido após J/K; `listbox` com 521 `tabindex=0`.

## Rodada 33 — experiência de uso: decisões 13 a 16 e correções de acessibilidade (20/11/2026)

Entrevista com o mantenedor sobre os relatórios `PLANO-UX-*.md` (decisões 13 a 16 no CLAUDE.md) e implementação:
- **Roteiro de conferência** (`roteiroDeConferencia`, puro, `ingestao/revisao.mjs`; 4 asserções com textos reais no `teste_revisao.mjs`, 62 → 66): a página mostra "O que conferir nesta norma" com o recorte do arquivo; norma sem ponto e sem roteiro específico recebe o roteiro genérico.
- **Atalhos:** interruptor "Atalhos de teclado" (ligado por padrão, lembrado no navegador). **Consulta:** rótulo de três níveis e faixa de revogação com a data; **ferramentas:** aviso "ferramenta de trabalho, experimental e sem caráter oficial", `compara.html#ID`, link "Comparar com o leis.org" na revisão.
- **Acessibilidade (defeitos objetivos medidos):** borda dos controles com `--borda-ctl` (de 1,42:1 para ≥ 3,4:1 no claro e 4,2:1 no escuro; WCAG 1.4.11) nas três páginas; destaques do comparador também por sublinhado sólido × tracejado/negrito (não só cor); `aria-live` saiu da norma inteira (18 mil caracteres) para uma região de anúncio curta; o foco volta ao item da fila depois de abrir uma norma; `prefers-reduced-motion`.
- Conferido no Chromium: roteiro, foco, anúncio, interruptor (desligado: J não navega; lembrado ao recarregar), link e pré-seleção da comparação, rótulos da consulta (LC 320 "texto vigente apurado" com 10 versões; LC 611 "nenhuma alteração apurada"), sem erro de console.
- Fica para próximas rodadas (relatórios): `listbox` com 521 `tabindex=0`, itens clicáveis sem papel, busca "lei 12/1975" que exclui LCs, tradução dos códigos de motivo, decisão por ponto, tempo de primeira carga em conexão lenta.

## Rodada 34 — pendências de experiência de uso (decisões 17 a 20, 20/11/2026)

Entrevista com o mantenedor (CLAUDE.md, decisões 17 a 20) e implementação, a partir dos relatórios `PLANO-UX-*.md`:
- **Motivos em português** (`tituloDoMotivo`, `TITULOS_DE_MOTIVO`): fila, filtro, guia e lista de motivos mostram o título; o código técnico fica em dica (tooltip).
- **Aceitar com mais de 20 pontos** exige confirmação; a decisão grava `pontosNaHora`/`confirmouPontos` e `validarDecisao` recusa sem ela (`LIMITE_PONTOS_CONFIRMACAO`, `pontosDaNorma`).
- **Salvar sempre no mesmo arquivo** (File System Access, quando o navegador permitir): botão "Salvar em arquivo…", regravação a cada decisão (inclusive remoção), aviso de que o arquivo deixou de responder; sem suporte, lembrete a cada 5 decisões.
- **Teclado e semântica:** lista de dispositivos com uma só parada de Tab e setas/Home/End/Enter/Espaço (antes, 521 paradas); fila com papel de botão e Espaço; **J/K continuam de onde estavam** depois de decidir (antes voltava à 1ª pendente); Esc fecha o formulário; "Limpar decisão" pede confirmação.
- **Consulta:** "lei 12/1975" e "lei 611" agora acham também as leis complementares (a lista diz o tipo); "lc" continua só LC; aviso de conexão lenta durante o carregamento do catálogo.
- `teste_revisao.mjs` 66 → 73 (inclui: todo motivo que o motor já produziu no acervo tem título). Conferido no Chromium, com o File System Access simulado: motivos traduzidos, confirmação (293 pontos exigem; 4 não), Esc, 1 parada de Tab entre 405 itens, setas, Espaço, J após decidir (abre a seguinte), gravação no arquivo (2 gravações; faixa de alerta some), busca; sem erro de console.
- Fica: tempo de primeira carga em conexão lenta (cache local do catálogo — decisão), tradução dos códigos também no arquivo exportado (não: o código fica), decisão por ponto (não, decidido: por norma).

## Passagem de sessão (20/11/2026)

Sem mudança de código. Registrado: estado da tarefa 1 (62,6% aceitas em 823 textos),
achados do `sem_fecho`, decisão pendente do 4º padrão de fecho, vínculo do disparo
externo com a sessão e a forma de trabalhar direto na `main`.

## Decisão 21 — banco de dados (20/11/2026)
Só decisão, sem código: Supabase fica adiado; git segue como fonte da verdade. Gatilhos para reabrir e o contrato `decisoes.jsonl` ↔ tabela estão em `CLAUDE.md` (decisão 21). Testes não afetados.

## Rodada 35 — continuação de item (causa G3 de `trecho_nao_localizado_na_origem`, 20/11/2026)
Pesquisa em `PLANO-TRECHO-NAO-LOCALIZADO.md` (55 normas recentes; em nenhuma o motor perdeu texto — a árvore guarda o texto, mas um pedaço fica no dispositivo errado). Causas: G1 título de agrupador em várias linhas (25), G2 frase tomada por agrupador (6), G3 continuação de item colada na alínea (5), G4 número de página/carimbo de processo (20), isoladas (6). A afirmação de G3 foi conferida à mão no texto real da LC 799/2016 (art. 39, inc. I, al. c, item 2: a linha "metros) do alinhamento…" colava na alínea).
- **Core (`parseMinuta`, espelhado em `norma-simulacao.html`):** `last.it` guarda o último item; a linha de continuação vai para o item, não para a alínea. Diff pontual de 7 linhas.
- **Teste novo:** `teste_item_continuacao.mjs` (4; texto real, `fixtures/textos/lc799_2016.*`). Contra o código antigo: 1 ok / 3 falhas.
- **Bateria antes/depois idêntica** (core 153, promulgação parcial 72, estrutura 62, revisão 73, blocos sem aspas 26 etc.); `normateste.mjs` byte a byte igual.
- `VERSAO_ESTRUTURADOR` 10 → 11. Acervo: aceitas 537 → 540 (36892, 40791, 43471), 0 perdas; recentes em revisão 131 → 128.
- **Não feito (aguarda decisão do mantenedor):** G4 (número de página e carimbo saem do texto lido), G1/G2 (título de agrupador: até 3 linhas, `CAPÍTULO ÚNICO`), repetição de documento no arquivo. Ver o plano.

## Rodada 36 — ruído de impressão fora do texto lido (causa G4/G6, decisões 22 a 24, 20/11/2026)
- **Preparo (`ingestao/extracao-texto.mjs`):** `removerRuidoDePagina` (número da própria página, uma por página; carimbo de processo repetido 2+ vezes) e `separarArtigoDoPreambulo` ("Art. 1º" na linha do preâmbulo), ambos ligados em `prepararTextoExtraido` (por isso valem para estruturador, revisão e histórico). O core não mudou.
- **Prova independente:** o negativo é o plano diretor (id 30209): 789 linhas só de algarismos antes, 787 depois (saem só 2, as que são o número da página). Sem a trava "valor = número da página" o filtro apagaria ~722 linhas.
- **Teste novo:** `teste_ruido_de_pagina.mjs` (11; reais: LC 897/2021, 1.074/2026, 867/2019, 838/2018, 660/2010 + negativo 30209). Contra o código antigo: 3 ok / 8 falhas.
- `teste_revisao.mjs`: a EC 39/2016 deixou de ter trecho não localizado (curada pelo preparo); o caso real do teste passou a ser a LC 646/2010 (colunas e margens intercaladas), `fixtures/textos/coluna_36841.*`.
- `VERSAO_ESTRUTURADOR` 11 → 12. Acervo: aceitas 540 → 554, 0 perdas; recentes em revisão 128 → 114. Bateria idêntica; `normateste.mjs` byte a byte igual.
- **Falta (decisão 23, já dada):** G1+G2 no core (título de agrupador), com espelho no `norma-simulacao.html`.

## Rodada 37 — título de agrupador (causas G1 e G2, decisão 23, 20/11/2026)
- **Core (`parseMinuta`, espelhado em `norma-simulacao.html`; trecho espelhado conferido idêntico):** (a) agrupador só depois do preâmbulo e com título que não começa por minúscula/pontuação (frase "Seção IV do Capítulo II; e revoga…" deixa de virar agrupador); (b) título de até 3 linhas extras, pulando linha em branco e quebra de página, até o próximo Art. ou agrupador, ≤ 200 caracteres, sem "Art. N"/"§ N" dentro; (c) `CAPÍTULO ÚNICO` (`numero: 'ÚNICO'`).
- **Teste novo:** `teste_agrupadores.mjs` (12; reais: LC 1.076/2026, 1.037/2025, 992/2023, 1.050/2025, 915/2021, 757/2015, mais 3 negativos sintéticos). Contra o código antigo: 2 ok / 10 falhas.
- Bateria idêntica antes/depois; `normateste.mjs` byte a byte igual. `VERSAO_ESTRUTURADOR` 12 → 13. Acervo: aceitas 554 → 570, **0 perdas e 0 motivos novos** em qualquer das 823; recentes em revisão 114 → 100.
- Soma das rodadas 35–37: aceitas 537 → 570; recentes em revisão 131 → 100. Restam das causas do plano: aspa interna que fecha bloco cedo (id 36400, precisa decisão/teste próprio), repetição de documento (decisão 24: defeito de fonte), colunas/OCR (36841, 36190, 44307: defeito de fonte).

## Rodada 38 — causas do leitor em `rotulo_nao_confere_com_a_origem` (20/11/2026)
Pesquisa por dois agentes de leitura (`PLANO-ROTULO-A.md`, `PLANO-ROTULO-B.md`; 53 normas recentes): o rótulo das leis publicadas é POSICIONAL (`atribuirDesFixoOriginal`), então o motivo funciona como detector de deslocamento (artigo engolido, fundido ou salto de numeração) e **não foi afrouxado**. Dos 53 casos: defeito de fonte (rótulo errado/duplicado/pulado na própria lei) e forma legítima ficam para o revisor; as causas do LEITOR corrigidas aqui, cada uma conferida à mão no texto real:
- **Romanos além de XXV** (`ROM` parava em XXV: o 26º inciso virava o rótulo "26 –") e `reInc` aceita até 9 letras (XXXVIII): ids 51486, 49557, 38364. `teste_romanos.mjs` (7).
- **"( NR)" com espaço** (`reFechaNR` e três outras regexes): LC 1.005/2024 (id 48003) passa a ser lida certa. **"§ N" no início de linha que é só citação** (linha anterior termina em artigo/preposição/conjunção e o texto depois do número começa em minúscula): ids 36114, 40278. **"conforme" / "segue:" partidos em duas linhas** (cue de alteração): ids 36373, 41876. **Hifenização "milési-" / "mo)"** que não pode ser tomada por marcador de alínea (`desfazerHifenizacao`): id 40111. `teste_rotulos_reais.mjs` (7; contra o código antigo, 0 ok / 7 falhas; caso negativo: sem o artigo 11 o deslocamento continua acusado).
- Core espelhado em `norma-simulacao.html`. `teste_revisao.mjs`: a LC 1.005/2024 deixou de ser exemplo de rótulo divergente; os exemplos reais passaram a ser a LC 859/2019 (id 42216, veto tirou o fecha-aspas do bloco do art. 2º; `fixtures/textos/lc859_2019.*`).
- `VERSAO_ESTRUTURADOR` 13 → 14. Acervo: aceitas 570 → 582, **0 perdas, 0 motivos novos**; bateria idêntica; `normateste.mjs` byte a byte igual.
- **Não aplicado (precisa de decisão do mantenedor ou é invasivo):** (E1) rótulo de dispositivo sem texto conferido do lado errado do cursor (reescreve parte de `conferirConservacao`); (E2) `endsWith` aceita sufixo ("I" onde está "XXXI"): 6 normas com rótulo realmente errado, uma recente hoje `aceita` por engano (43543); rótulo escrito × posicional (artigo com sufixo, promulgação parcial); alíneas depois de "z" ("aa, ab" × "aa, bb").

## Rodada 39 — decisões 25 a 27 (fronteira do rótulo, alíneas além de z, textos idênticos), 21/11/2026
- **Decisão 25 (conferência, `conferirConservacao`):** fronteira do rótulo — o texto de origem que termina com o rótulo não basta ("I" onde está "XXXI"). Só restringe. Medido: 6 normas ganham `rotulo_nao_confere_com_a_origem`, 4 deixam de ser "aceita" falsa; **0 outras mudanças**. Conferido à mão na LC 925/2021 (id 43543): inciso "XXXI" lido como "I". Teste: `teste_rotulos_reais.mjs` (8; o novo falha contra o código antigo).
- **Decisão 26 (core, `atribuirDesFixoOriginal` e `parseMinuta`, espelhados em `norma-simulacao.html`):** alíneas depois do "z" seguem o rótulo escrito (`rawL`). `teste_alineas_alem_z.mjs` (4; real: LC 875/2020; a forma dobrada "aa, bb, cc" não aparece em nenhuma norma estruturada do acervo — a conferência dela é sintética). Contra o código antigo: 1 ok / 3 falhas.
- **Decisão 27:** nada para artigo com sufixo, promulgação parcial e "Art. 8º" duplicado. Textos idênticos: `estruturar.mjs` grava `dados/estruturado/_textos_iguais.json` (hash do texto lido, só letras e algarismos; 12 registros em 5 grupos hoje) e o relatório lista; `gerar-revisao.mjs` leva `textoIgualA` à fila e à norma; `docs/revisao.html` mostra o selo (conferido no navegador na id 42987). Os ids 43595 e 42987 têm o mesmo texto (LC 932/2022); o registro 42987 é o da LC 896/2021 com o arquivo errado ligado pela fonte — já aparecia como número e data divergentes. `teste_revisao.mjs` 75.
- `VERSAO_ESTRUTURADOR` 14 → 16. Acervo: aceitas 582 → 579 (−4 falsos aceites, +1 pelas alíneas); recentes em revisão 89. Bateria idêntica; `normateste.mjs` byte a byte igual.

## Rodada 40 — cópias da mesma lei no arquivo e fecho com espaçamento estragado (decisões 28 e 29), 21/11/2026
Pesquisa por dois agentes de leitura (`PLANO-BLOCO-SEM-DONO.md`, `PLANO-SEM-FECHO.md`; 24 e 28 normas recentes). `bloco_de_alteracao_sem_dono`: nenhuma falha do leitor — 20 das 24 são a lei repetida 3 vezes no mesmo arquivo (as cópias 2 e 3 caem depois do 1º fecho; conferido à mão: "Art. 1º" × 3 e 3 timbres em 39259, 38800, 36907, 39600; contagem de "Art." = 3 × os da árvore). `sem_fecho`: nenhum 5º padrão; 14 são o fecho conhecido com o espaçamento estragado pelo PDF e 1 é DOCX com o fecho colado à linha do artigo.
- **Preparo (`ingestao/extracao-texto.mjs`, o core não mudou):** `removerCopiasDoDocumento` (decisão 28, substitui a 24) e `restaurarFechoComEspacamentoEstragado` (decisão 29), ligados em `prepararTextoExtraido`. O protótipo do agente perdia o "º" do dia (id 37172); a versão final preserva o que a fonte escreveu.
- **Teste novo:** `teste_copias_e_fecho.mjs` (13; reais: ids 39259, 38800, 39600, 37172, 36824, 37562, 37403, 48855, 44305, 41347 em `fixtures/textos/copia_fecho_*`; negativos: cópia com palavra acrescentada não é removida; fecho de OCR com mês ilegível continua `sem_fecho`). Contra o código antigo: 2 ok / 11 falhas.
- `VERSAO_ESTRUTURADOR` 16 → 17. Acervo: aceitas 579 → 611, **0 perdas, 0 motivos novos**; recentes em revisão 89 → 61. Bateria idêntica; `normateste.mjs` byte a byte igual.
- **Fica para o revisor (defeito de fonte, sem regra):** 44305 e 44307 (OCR com "Art. I"), 36841 (2 colunas), 51485 (promulgação parcial + LC 1.075 no mesmo arquivo), fechos ilegíveis por OCR (41347, 41179, 44305), normas sem corpo de lei (8) e 39600 (sem linha de local/data em nenhuma das cópias; confirmar no PDF original, que não está no repositório). Resíduos citados pelos agentes e não tratados: artigos "Art. N. VETADO" colados em 48855 e bloco falso de OCR em 36190.

## Rodada 41 — resíduo dos demais motivos: três bugs pequenos (21/11/2026)
Relatório `PLANO-RESIDUO-GERAL.md` (22 normas recentes que não têm `rotulo_nao_confere`): 3 bugs (D), 9 defeitos de fonte (B), 3 OCR sem conserto (A), 7 já decididos. Os três bugs, cada um conferido à mão no texto real:
- **Título de agrupador com muitas linhas em branco** (id 38364): a varredura de títulos (decisão 23) limitava-se a 8 linhas BRUTAS e estourava; agora conta 3 linhas de texto dentro de uma janela de 40 brutas (core + espelho no `norma-simulacao.html`).
- **"Art .10."** (espaço antes do ponto, número colado; id 37136): `colarPontoDoArtigo` no preparo, só com o número colado ("Art . 59 -" não muda).
- **Epígrafe "LEI Nº COMPLEMENTAR Nº 848"** (id 42014): `reCab` aceita o "Nº" a mais (core + espelho).
- **Teste novo:** `teste_residuo_geral.mjs` (5; contra o código antigo 0 ok / 5 falhas). `VERSAO_ESTRUTURADOR` 17 → 18. Acervo: aceitas 611 → 614, **0 perdas, 0 motivos novos**; recentes em revisão 61 → 58. Bateria idêntica; `normateste.mjs` byte a byte igual. Único efeito colateral: a árvore da Lei 30209 (Plano Diretor, norma antiga) passa a ter "FIG. 11- A" no título de uma PARTE em vez de colado ao parágrafo anterior; sem mudança de motivo.
- **Defeito de fonte (9)**, para o painel do revisor: 44158 (capa de caderno), 40514 (placeholder "LC 790"), 36914 e 36188 (placeholder), 40318 (aviso), 40303, 36372 e 39395 (mapa/tabela de anexo), 39600 (sem linha de local/data nas 3 cópias). **Achado:** em 40318, 40303, 39395 e 36372 o catálogo aponta o anexo como `arquivo`, mas a `observacao` traz o HTML do SIREL, que o coletor nunca baixou; troca de fonte exige decisão sua e rede (1 req/min).

## Rodada 42 — resíduo de `rotulo_nao_confere_com_a_origem`: blocos sem fecho e dispositivos embutidos (decisões 30 a 32), 21/11/2026
Relatório `PLANO-RESIDUO-ROTULO.md` (39 normas recentes): 18 bug do leitor/preparo (D), 10 defeito de fonte (B), 6 OCR/coluna/DOCX sem conserto (A), 5 já decidido (C). A causa comum que as rodadas anteriores não tinham visto: o procurador do "Art. (n+1)" em `detectNRCandidates` exigia separador depois do número e nunca casava "Art. 2º Esta Lei…" (artigos 2 a 9 sem ponto), e, havendo um fecho adiante (do bloco seguinte), o bloco engolia o artigo seguinte da alteradora.
- **Core (+ espelho em `norma-simulacao.html`, aplicado pelo mesmo patch nos dois):** `introDoProximoArtigo` (decisão 30) e aspas equilibradas na própria linha (id 36400).
- **Preparo:** `separarDispositivosEmbutidos` (decisão 31; sem incisos).
- **Teste novo:** `teste_blocos_e_embutidos.mjs` (12; reais 37352, 38051, 39258, 42216, 38297, 40134, 36400, 48855, 37043 + 3 sintéticos). `teste_revisao.mjs` 75: o exemplo real de rótulo deslocado passou a ser a LC 810/2017 (id 41098, a lei pula do inciso III para o V — defeito de fonte; `fixtures/textos/lc810_2017.*`).
- `VERSAO_ESTRUTURADOR` 18 → 19. Acervo: aceitas 614 → 618, 0 perdas; motivo novo só `bloco_sem_fechamento_de_aspas` em 15 normas (esperado: fronteira inferida, decisão 9); recentes em revisão 58 → 54. Bateria idêntica; `normateste.mjs` byte a byte igual.
- **Não aplicados:** juntar número partido no rótulo ("Art. 2 6.", "X VII –": ids 37422, 37491, 37517 — não foi perguntado) e a série "Art. 133-B…133-F" com aspa fora do lugar (id 44376); `§ 17.` sozinho com ponto (id 41723); incisos embutidos (37042, 37041).
- **Defeito de fonte (B1), para o painel:** 41723 (art. 9º → 11), 41098 (inc. III → V), 40311 (II → IV), 38249 (VIII → XI), 42356, 43595/42987, 39138; e `” (NR)` antes de dispositivos incluídos (43543, 38041). Sugestão do relatório: agrupar a cascata de deslocamento constante (a 39862 tem 56 divergências, todas −1).

## Rodada 43 — dashboard: a cascata de rótulos deslocados vira uma frase (21/11/2026)
Sugestão do relatório `PLANO-RESIDUO-ROTULO.md` para os defeitos de fonte: um inciso que a lei pulou desloca todos os seguintes pelo mesmo valor, e o revisor via uma lista de N pontos. Agora (`ingestao/revisao.mjs`, puro, roda no navegador): `valorDoRotulo`, `agruparDeslocamentos` (rótulos divergentes consecutivos, mesmo pai e mesmo deslocamento = UM ponto) e `fraseDoDeslocamento` (diz o que o motor numerou, o que está escrito, se a lei parece PULAR ou REPETIR um número e quantos seguem deslocados; sem inventar redação da lei); `roteiroDeConferencia` ganhou o 3º argumento `dispositivos` e devolve "Confira a numeração da lei" com o trecho do original ao redor do salto. `docs/revisao.html` passa `n.dispositivos`. Conferido no navegador na LC 810/2017 (id 41098: "a lei parece PULAR um número… os outros 4 dispositivos seguintes ficam deslocados"; o trecho mostra "III – … V – SMIM").
- `teste_revisao.mjs` 80 (+5; reais: LC 810/2017). Motor e estruturador não mudaram (`VERSAO_ESTRUTURADOR` segue 19); bateria idêntica; `normateste.mjs` byte a byte igual.

## Rodada 44 — dashboard: datas lado a lado e ficha do arquivo (decisão 33), 21/11/2026
- **Datas divergentes (decisão 2: decide o revisor):** `dataDoFecho`, `quadroDeDatas` em `ingestao/revisao.mjs`; `gerar-revisao.mjs` leva `contexto.datas` (catálogo, cabeçalho, fecho, publicação) à norma. Cartão "Confira as datas" com o quadro e a frase de que lado está a divergência (cabeçalho e fecho concordam e só o catálogo difere; ou divergem entre si; alerta quando a data da norma no catálogo é POSTERIOR à publicação — id 49654: cabeçalho e fecho 30/12/2024, catálogo 30/01/2025, publicação 03/01/2025). O motor nunca escolhe.
- **Normas sem corpo de lei:** `fichaDoArquivo` e `contexto.arquivo` (nome, tamanho, extração, ementa do catálogo, outros links da observação). Cartão "O que o arquivo parece ser", com frase de "arquivo muito curto" (< 800 caracteres) e o selo de anexo pelo nome (anexo, mapa, tabela, quadro, planta).
- **Decisão 33 (diretriz do mantenedor):** anexos complexos (mapas, tabelas e quadros, como nas leis orçamentárias e, em menor grau, no Plano Diretor) ficam para tratamento próprio depois, com exemplos reais e plano; hoje saem "a revisar" com a ficha.
- `teste_revisao.mjs` 86 (+6). Conferido no navegador (ids 49654 e 40318). Motor e estruturador não mudaram; bateria idêntica; `normateste.mjs` byte a byte igual.

## Rodada 45 — anexo que o motor não leu deixa de ser aceito em silêncio (decisões 34 a 36), 21/11/2026
Relatório `PLANO-ANEXOS-E-TABELAS.md` (levantamento no acervo, 12 perguntas ao mantenedor). Achado verificado à mão (id 49707: "aceita" com fecho de 436 linhas com tabelas): o leitor guarda tudo depois do fecho em `doc.fecho` e a conferência de conservação o conta como coberto — 38 normas aceitas traziam anexo de texto/tabela inteiro sem leitura.
- **Estruturador (`ingestao/estrutura.mjs`):** `classificarAnexosNoFecho`; motivo `anexo_nao_lido` (anexo com texto ou tabela) e aviso `anexo_grafico_nao_lido` (só título/gráfico/carimbo); `metricas.anexos` e `totalDeAnexos`. Painel: título do motivo, descrição, cartão "Anexo que o motor não leu" (lista dos anexos e trecho), selo "anexo gráfico, não lido". O core não mudou.
- **Teste novo:** `teste_anexos_no_fecho.mjs` (9; reais: LC 1.033/2025, LC 994/2023, LC 799/2016, LC 811/2017, Lei 14.584/2026 + 4 sintéticos). Três testes antigos ajustados: normas reais com anexo (LC 293/1993, LC 685/2011, LC 1.005/2024 e as 9 leis ordinárias) deixaram de ser "aceitas" e passaram a ter só o motivo `anexo_nao_lido`.
- `VERSAO_ESTRUTURADOR` 19 → 20. Acervo (1.109 normas): **38 aceitas → "a revisar" só por anexo**, 0 outras mudanças; motivo novo `anexo_nao_lido` em 51 normas (as outras 13 já eram "a revisar"). Taxa das recentes: 90,5% → 84,5%. Bateria idêntica; `normateste.mjs` byte a byte igual.
- **A fazer (frente de anexos, decisão 33):** selo na consulta pública; nó `anexo` (decisão 35); tabela no meio do ato (6 normas aceitas com a tabela colada ao dispositivo anterior: 42122, 38309, 40350, 37109, 38364, 36255); comandos que alteram/revogam anexo (hoje `nao_classificado`, falha explícita); 8 perguntas ainda abertas (revogação/substituição de anexo ou tabela, célula × anexo inteiro, valores orçamentários, anexos do Plano Diretor, rótulo na consulta, tabela sem marcador, anexo de alteradora).

## Rodada 46 — anexo alterado por norma posterior é avisado (decisão 37) e duas revogações que não eram "lei inteira", 21/11/2026
- **Aviso de anexo alterado:** `artigosQueMexemEmAnexo` e `anexosAlterados` no histórico (`ingestao/historico.mjs`); a consulta (`docs/index.html`) mostra "Anexo alterado" com a norma, o artigo e a data, e diz que o texto vigente apurado não traz o anexo. Sem selo em toda lei com anexo gráfico. Medido: 8 de 203 leis com histórico (LC 942/2022: 3 alteradoras de anexo; LC 434 do Plano Diretor, entre outras); conferido no navegador em LC 942/2022. `teste_historico.mjs` 28 (+4: real 47547, negativos reais, sintético).
- **Bug achado na medição (core + espelho):** "Fica revogado o item 4 do Anexo I da Lei Complementar nº 942/2022" (id 47547) saía `revoke_lei` — revogação da LEI INTEIRA; agora `indeterminado` (revogação de parte da lei sem endereço de dispositivo). E "Revogam-se as disposições em contrário, mantidas as condições … na Lei nº 6.309/1988" (id 27976) saía `revoke_lei` da lei da ressalva; agora `clausula_generica_sem_efeito`. `revoke_lei` no acervo: 53 → 51. Teste novo `teste_revogacao_parcial.mjs` (4; reais 47547, 27976 e o Plano Diretor 30209 como negativo); contra o código antigo 2 ok / 2 falhas. Nada consumia `revoke_lei` no pipeline, mas apareceria na descrição de comandos do painel e em qualquer aplicação futura.
- Bateria idêntica; `normateste.mjs` byte a byte igual. `VERSAO_ESTRUTURADOR` segue 20.
- **Medição que falta:** no acervo de texto só há 2 comandos que citam anexo com lei-alvo; as leis de denominação (ordinárias) quase não têm texto aqui. Os números do aviso valem para LC/EC e para as ordinárias já baixadas.

## Rodada 47 — anexo como nó, fecho com texto demais e tabela no corpo (decisões 35, 38, 39 e 40), 21/11/2026
Entrevista (3 perguntas) sobre o relatório `PLANO-ANEXOS-E-TABELAS.md`; tudo no estruturador (`ingestao/estrutura.mjs`) e no painel — o **core não mudou** (nem o espelho do simulador).
- **Nó anexo (35, 38):** `dividirFechoEAnexos` divide `doc.fecho` no 1º cabeçalho estrito de ANEXO; cada anexo vira dispositivo da raiz (`tipo: 'anexo'`, `id` pelo rótulo escrito: `anexo-i`, `anexo-1-2`, `anexo`; texto bruto preservado; `titulo`, `vetado`, `semTexto`). A conferência cobre o anexo pelo nó (as âncoras do painel põem os anexos depois do fecho). As 38 normas que a rodada 45 mandou "a revisar" só por anexo voltam a **aceita**, com o aviso `anexo_preservado_nao_interpretado` (selo no painel). `anexo_nao_lido` deixou de existir.
- **Fecho com texto demais (40):** `fecho_com_texto_demais` (> 600 caracteres fora do carimbo de assinatura eletrônica). 45 normas ganham o motivo (a maioria antigas); recentes aceitas que caem: 36255 (quadro de 24 mil caracteres depois da assinatura) e 40148.
- **Tabela no corpo (39):** `tabela_no_corpo` (3+ linhas de colunas de PDF no articulado, fora de bloco). 42 normas (a maioria antigas); recentes aceitas que caem: 38309, 38364, 40350, 42122. Negativo real: 37109 (tabela dentro de bloco de alteração) não é marcada. **Falta o nó `tabela` com marcador (precisa do `parseMinuta`).**
- **Painel:** cartões "Confira o que vem depois da assinatura" e "Tabela no meio do ato"; selo "anexo preservado, não interpretado"; títulos e descrições dos motivos novos.
- `teste_anexos_no_fecho.mjs` reescrito (20; reais: LC 1.033/2025, 994/2023, 799/2016, 811/2017, Lei 14.584/2026, ids 36255, 40148, 42659, 38309, 42122, 40350, 37109). Três testes ajustados (`teste_blocos_sem_aspas`, `teste_residuo_geral`: a id 38364 só tem agora `tabela_no_corpo`; as 9 leis ordinárias seguem aceitas).
- `VERSAO_ESTRUTURADOR` 20 → 21. Acervo (1.109 normas): 38 normas voltam a aceita, 8 aceitas passam a "a revisar" (6 recentes + 2 antigas: eram falsos aceites com tabela ou texto depois da assinatura); taxa das recentes **89,5%** (547 aceitas, 64 em revisão; 95 antes). Bateria idêntica; `normateste.mjs` byte a byte igual.
- **Falta (frente de anexos):** nó `tabela` com marcador; anexo na árvore de versões e no histórico; comandos que alteram/revogam anexo; Fase 0 (6–9 normas orçamentárias reais); 8 perguntas abertas do plano.

## Rodada 48 — lista de prioridade de download (21/11/2026)

Ingestão, não motor. `filaDeDownload` ganhou o 4º parâmetro `prioridade` (lista de `idSapl` que furam a fila, na ordem dada; quem falhou 3+ vezes volta ao lugar normal; id repetido ou não numérico é ignorado). `baixar-textos.mjs` lê `dados/catalogo/prioridade-download.txt` (um id por linha, `#` comenta; linha inválida ou id fora do catálogo = aviso, nunca erro; sem o arquivo, a ordem de sempre). Primeira lista: as 5 leis orçamentárias (LOA 2026/2025, LDO 2026/2025, PPA) e a que altera a LOA 2025, para a Fase 0 de `PLANO-ANEXOS-F0-ORCAMENTO.md` (sem a lista, uma falha empurraria o arquivo ~30 noites). Testes: `teste_textos_sapl.mjs` 36 → 39 (2 dos 3 novos falham no código antigo; o 3º só garante o que a ordem de sempre já fazia). Sem mudança de requisições nem de etiqueta.

## Rodada 49 — `tabela_no_corpo` com 2 colunas (decisão 42), 21/11/2026

`ingestao/estrutura.mjs` (`VERSAO_ESTRUTURADOR` 21 → 22): `colunasDaLinha` substitui `linhaTabular`. Linha de 2 colunas (as duas células curtas, ≥ 2 caracteres, sem ruído de OCR) também conta, mas **só se a 2ª célula começar no mesmo lugar da linha anterior (±2)**: tabela alinha, texto justificado não. Linha que abre com rótulo de dispositivo ("XI -", "Art. 5º", "a)") nunca é tabela, em 2 ou 3+ colunas. Medido nos 1.109 textos: **0 mudança nas recentes** (aceitas 547 → 547); entre as antigas, 6 passam a ter o motivo (reais: ids 26743, 27924, 26884, 37422, 22673; 1 falso por carimbo, 26843) e 7 o perdem (todos texto justificado de digitalização, falsos); aceitas no total 750 → 750. O plano previa que a id 26970 virasse "a revisar"; **o que a regra larga via ali era ruído de carimbo de página (linhas 47-52), não tabela**, e a norma segue aceita. Testes: `teste_anexos_no_fecho.mjs` 20 → 26 (4 dos 6 novos falham no código antigo; os outros 2 são negativos que o código antigo já cumpria). Core intocado.

## Rodada 50 — trava da revogação com endereço não entendido (decisão 45), 21/11/2026

Corrige erro silencioso real do extrator (`extrairComandosLei`, ramo de revogação; edição pontual no core e no espelho de `norma-simulacao.html`). Antes, "Fica revogado o inc. XXVII do caput do art. 18 da LC 12" (id 44276) virava `revoke_node[art. 18]` e o histórico gravado marcou o art. 18 e seus 36 dispositivos como revogados; "al. i do inc. V do art. 13" (id 51556) revogava o inciso V inteiro; "o Capítulo V, com seus arts. 29 a 34, da LC 12" (id 46833) virava `revoke_lei` da LC 12 inteira. Agora, se do verbo até a primeira lei citada sobrar palavra de endereço que as citações reconhecidas não consumiram (`arts`, `incs`, `al.`, `caput`, `item(ns)`, `§§`, Capítulo/Seção/Título), a citação é `incompleta` e o comando `indeterminado` (nunca revoga o artigo/inciso/lei inteiros). Medido nos 1.109 textos: 11 comandos mudam (ids 44276, 38944, 51556, 50842, 38695, 46833 + 34079, 39221, 29259, 25133, 35288 ×2), todos de revogação falsa ou de cláusula genérica indevida para `indeterminado`; nenhum outro comando muda. Histórico regenerado: 17878 e 49739 deixam de ter o artigo/inciso inteiro revogado (8 históricos mudam pelo core; os outros 12 regravados vêm das rodadas 44–49). Testes: `teste_revogacao_endereco.mjs` (15; 9 falham no código antigo). Bateria (core e acervo) igual, `normateste.mjs` byte a byte igual. **Ainda não feito (decisões 46–48):** gramática do plural/lista/intervalo, `dispositivosCitados` e aviso `revogacao_nao_interpretada`.

## Rodada 51 — revogação no plural na mesma frase (decisões 43 e 45–48), 21/11/2026

Plano em `PLANO-REVOGACAO-PLURAL-IMPL.md` (fatia R51 de R51–R54). Core (`norma-core.js` + espelho em `norma-simulacao.html`, edição pontual): função nova exportada `interpretarObjetosRevogados(frase)` (gramática fechada, tudo ou nada: cadeia alínea < inciso < § < artigo, só o nível mais interno plural, "caput" só como passagem, objeto sem artigo herda o do seguinte, "todos da Lei X" aceito; item, Capítulo/Seção/Título, Anexo/Tabela/Quadro, decreto, "com seus…", caput isolado falham com `codigoMotivo`; ancestral e filho na mesma lista ficam só com o ancestral) e ramo novo em `extrairComandosLei`, ativado só por verbo NO INÍCIO do artigo (`RE_REVOGACAO_ANCORADA`: "Ficam/Fica revogad(os|as|o|a)…", "Revogam-se…") com sinal de plural. O gatilho antigo **não** foi alargado. Saídas: um `revoke_node` por endereço (campo `origemFormaPlural`), `revoke_lei` por lei ("Ficam revogadas a LC X e a LC Y"), ou `indeterminado` com `motivo`, `codigoMotivo`, `leiAlvoDaCitacao` e `dispositivosCitados`; lei mista ("o art. 3º da Lei A e o art. 5º da Lei B"), lista em incisos (fatia R52) e intervalo (R53) saem `indeterminado`. `ingestao/historico.mjs`: `dispositivosCitados` entram em `enderecos`/`aConferir` só quando a lei citada é a da base.
Medido nos 1.110 textos (diff de comandos contra a rodada 50): 18 artigos viram `revoke_node` (todos conferidos à mão contra o texto: ids 37039, 40497, 41522, 41909, 42014, 42355, 42631, 42635, 42663, 43860, 44070, 44114, 47674, 47888, 48281, 50015, 50386, 50481), 1 artigo vira 2 `revoke_lei` (42031) e ~35 artigos que eram silenciosos viram `indeterminado` (visíveis). Histórico regenerado: 41 arquivos; 3 leis (28386, 50808, 39862) passam de "completa" a "incompleta" porque uma alteradora tem lista de revogação que o motor não lê (antes, em silêncio) e 17878 ganha pontos a conferir. Testes: `teste_revogacao_plural.mjs` (21; falha contra o código anterior); `teste_revogacao_endereco.mjs` ajustado (dois sintéticos agora leem os incisos/§§ certos em vez de `indeterminado`). Bateria igual; `normateste.mjs` byte a byte igual.

## Rodada 52 — revogação em lista de incisos (decisão 46), 21/11/2026

Fatia R52 de `PLANO-REVOGACAO-PLURAL-IMPL.md`. Core (`extrairComandosLei`, ramo da revogação plural; espelho em `norma-simulacao.html`): quando o caput só diz ONDE revoga ("Ficam revogados:", "Ficam revogados, na Lei X:", "…os seguintes dispositivos da Lei X:") e termina em dois-pontos, **cada inciso é lido sozinho**, com a lei do item (senão a do caput): item limpo vira `revoke_node`/`revoke_lei`; item que o motor não lê (Tabela/Anexo, "caput e seus §§", capítulo, decreto, intervalo sem lei-base, subitens) vira `indeterminado` só naquele item, com `codigoMotivo`, e os demais continuam aplicáveis. Trava nova, de frase única e de lista: **revogação condicionada ou parcial** ("na parte relativa a…", "a partir de…", "exceto…", "até…", "permanecendo…") é `indeterminado` (`revogacao_condicionada`): o motor não modela eficácia parcial ou diferida. Se o caput já traz o objeto ("Fica revogada, a partir de 1º de julho de 2007, a LC 207/1989 … que:"), os incisos são condições e nada muda (id 35288, art. 15). Item "VETADO." é pulado sem comando. `ingestao/revisao-comandos.mjs`: o painel F2 usa `leiAlvoDaCitacao` quando o comando é `indeterminado` (antes o item caía em "alvo não identificado").
Medido nos 1.110 textos: auditoria de todos os `revoke_*` vindos de lista (nenhum texto depois da lei citada além de "e alterações posteriores"); um falso positivo achado e fechado na hora (id 41342: "o art. 1º da Lei 1.516/1955, na parte relativa a…" virava revoke_node do art. 1º). Histórico regenerado (44 arquivos; "completas" 42 → 38: leis cujas alteradoras têm lista de revogação que o motor lê em parte passam a mostrar os pontos a conferir que antes ficavam em silêncio). Testes: `teste_revogacao_lista.mjs` (13; 10 falham no código anterior); `teste_revogacao_plural` 21 e `teste_revogacao_endereco` 15 inalterados; bateria igual; `normateste.mjs` byte a byte igual.

## Rodada 53 — intervalo de dispositivos revogados, expandido contra a lei-alvo (decisão 47), 21/11/2026

Fatia R53 de `PLANO-REVOGACAO-PLURAL-IMPL.md`. Core (+ espelho): função nova exportada `expandirIntervaloNaBase(intervalo, leiBaseIndex)` (todos os dispositivos da base, mesmo nível e mesmo pai, entre os extremos, na ordem do texto, inclusive "-A"; extremo ausente ou invertido → `null`) e `extrairComandosLei` ganha a opção aditiva `leiBaseConfere(ref)` (a lei citada é a da base?): o intervalo só é expandido quando há `leiBaseIndex` e a lei citada é a dessa base; senão, e quando algum extremo não existe, `indeterminado` com `revogacao_intervalo_sem_lei_base` (frase única: tudo ou nada; lista: só o item). `ingestao/historico.mjs` e `ingestao/revisao-comandos.mjs` passam `leiBaseConfere`. Medido: dos 6 artigos recentes com intervalo, 2 têm base com texto e os extremos existem (45807: incs. I a VIII; 34067: incs. IV a XII), 1 tem a base mas o extremo não existe na versão original (49894, LC 369), os outros sem base no acervo (a LC 7 é `.doc`) ficam `indeterminado`. Testes: `teste_revogacao_intervalo.mjs` (9; falha no código anterior). Bateria igual; `normateste.mjs` byte a byte igual. **Falta (R54):** aviso `revogacao_nao_interpretada` no estruturador, título em português e selo no painel.

## Rodada 54 — aviso `revogacao_nao_interpretada` (decisão 48), 21/11/2026

Fatia R54 (última) de `PLANO-REVOGACAO-PLURAL-IMPL.md`. `ingestao/estrutura.mjs` (`VERSAO_ESTRUTURADOR` 22 → 23): a estruturação roda `extrairComandosLei` e, se há comando `indeterminado` de revogação (`codigoMotivo` `revogacao_*`: lista com item de Tabela/anexo, caput isolado, intervalo sem lei-base, condicionada, ato fora do acervo), grava o aviso `revogacao_nao_interpretada` e `metricas.revogacoesNaoLidas`. **Não é motivo de revisão**: a norma segue aceita (decisão 48; reavaliar com a contagem real). Medido: 44 normas ganham o aviso; veredito e motivos de todas as 1.109 inalteradas (aceitas 750), então nenhuma decisão humana reabre (decisão 7). Painel (`docs/revisao.html`): selo "revogação não interpretada". Testes: `teste_revogacao_aviso.mjs` (5). Fecha a frente de revogação plural (R51–R54); o resíduo "não lido" fica visível em vez de silencioso.

## Rodada 55 — recall do detector de anexo alterado (decisão 37), 21/11/2026

`artigosQueMexemEmAnexo` (`ingestao/historico.mjs`, fora do core) só via "anexo … da Lei" sem ponto na frase; perdia "Anexo 1.2"/"Anexo 9.1" (Plano Diretor), "Tabela IV/XII", "Lista de Serviços anexa" (LC 7). Agora vale também objeto de anexo (anexo, tabela, "lista de serviços", "quadro IV/1/anexo", planilha) até a citação da lei-base **com verbo de alteração** na frase ("e alterações posteriores" não conta como verbo): remissão ("de acordo com o Anexo 5.3 da LC 434") e "Quadro de Funções Gratificadas" não entram. A forma antiga segue valendo. Medido nos 1.110 textos: artigos detectados 111 → 130 (os 19 novos conferidos à mão: todos são alteração de anexo; 7 falsos candidatos fechados pela exigência de verbo e pelo objeto). Histórico regenerado: leis com anexo alterado 8 → 10 (31 alterações; só valem para leis com texto da base). Nada é aplicado: a consulta só avisa "anexo alterado" (decisão 37). Testes: `teste_anexo_alterado.mjs` (9; 6 falham no código anterior). **Não feito:** falso `replace_text` em lista anexa (ids 31027 e 32301) — hoje esses artigos saem `nao_classificado` (a LC 7 é `.doc` sem texto), então não há erro ativo; a guarda fica para quando a LC 7 tiver texto (regra 1).

## Rodada 56 — consulta: avisos de anexo (decisões 49–51), 21/11/2026

Decisões do mantenedor (21/11/2026), com a medição que as embasou: 18 leis têm histórico ("texto vigente apurado") e anexo no arquivo original, e em nenhuma o histórico carrega o anexo (só 1 avisava, por anexo alterado depois); 36 leis aceitas sem histórico têm anexo gráfico (25 de denominação) e 30 têm anexo preservado, mostrados no fim sem dizer o que são; o texto bruto dos anexos é 10,5% do índice de busca (111 blocos). **49:** aviso no topo só nas leis com histórico e anexo no original. **50:** nota dentro do próprio bloco do anexo nas leis sem histórico (gráfico: "não lido aqui; veja no original"; preservado: "preservado, não interpretado; pode estar fora de formato") — **retifica a decisão 36** (sem selo na lista). **51:** busca continua indexando anexos, e o resultado vindo de anexo leva "(anexo)". Código: `ingestao/gerar-historico.mjs` grava `anexosNoOriginal` (rótulo e se é gráfico, a partir da estruturação) em 18 históricos; `docs/index.html` mostra o aviso, a nota e a marca. Conferido no navegador (Playwright, página servida do disco por rota virtual, dados reais): ids 42407 (aviso "Anexo no original"), 41114 (nota "Anexo gráfico") e 48329 (nota "Anexo preservado"), busca por texto de anexo com "(anexo)", 0 erros de página. `gerar-site.mjs` rodado (o índice de busca no repositório estava anterior à rodada 47 e não tinha anexos). Sem teste `.mjs` novo: a mudança é de apresentação e foi conferida no navegador; bateria de histórico/revisão/situação igual.

## Rodada 57 — preâmbulo de ato promulgado pela Câmara/Mesa nunca é ementa, 21/11/2026

Observação do mantenedor: em Emenda à Lei Orgânica, promulgada pela Câmara, o preâmbulo ficava grudado na ementa. Confirmado: 47 das 52 Emendas à LO do acervo tinham "A MESA DIRETORA DA CÂMARA MUNICIPAL DE PORTO ALEGRE, no uso das atribuições…, promulga a seguinte Emenda à Lei Orgânica:" no fim da EMENTA e o preâmbulo vazio (`rePre` só conhecia "A CÂMARA MUNICIPAL … DECRETA" e "O PREFEITO MUNICIPAL"). Core (`parseMinuta`, edição pontual + espelho em `norma-simulacao.html`): `rePre` passa a aceitar "… PROMULGA" (além de DECRETA) e nasce `rePreMesa` (`A MESA [DIRETORA] DA CÂMARA…`, `A MESA [DIRETORA] DECRETA/PROMULGA`, só em MAIÚSCULAS, para a ementa em caixa mista nunca ser confundida). Medido: as 47 Emendas passam a ter preâmbulo e ementa limpos; **nenhum veredito ou motivo muda nas 1.109 normas** (aceitas 750); `VERSAO_ESTRUTURADOR` 23 → 24 (ementa e preâmbulo mudam no JSON). Testes: `teste_preambulo_mesa.mjs` (9; 7 falham no código anterior); bateria do core igual e `normateste.mjs` byte a byte igual. **Fora do pedido, achado e não alterado:** 213 normas (54 LC recentes aceitas, 22 antigas aceitas, 8 LC recentes e 122 antigas em revisão, mais 3 leis e outros) ainda têm "Faço saber…", "sanciono a seguinte…" ou "promulgo a seguinte…" no fim da ementa (variantes de OCR como "saberque", "san ciono", "aseguinte", e a linha de preâmbulo que não começa por "O PREFEITO MUNICIPAL"); proposta de rodada própria. Ementa também carrega o carimbo do processo e a epígrafe em todas as normas (convenção antiga do campo), não só nas Emendas.

## Rodada 58 — "Faço saber", cabeça de preâmbulo com OCR e Resolução: nunca ementa, 21/11/2026

Continuação da rodada 57 (pedido do mantenedor: aplicar o princípio a todo o acervo; Resolução incluída). Medição: 213 normas (204 leis complementares, 4 leis, 1 lei orgânica; 54 LC recentes aceitas) levavam "Faço saber que a Câmara Municipal aprovou e eu sanciono/promulgo a seguinte…" para o fim da ementa, porque `parseMinuta` só reconhecia a cabeça "O PREFEITO MUNICIPAL" **com espaço** (OCR: "O PREFEITOMUNICIPAL", "O PREFEITO DE PORTO ALEGRE") e a própria frase "Faço saber" não ancorava nada; a **Resolução 3.006/2026** (DOPA/SEI, "O PRESIDENTE DA CÂMARA MUNICIPAL DE PORTO ALEGRE / Faço saber… eu promulgo a seguinte Resolução:") caía na ementa pelo mesmo motivo. Core (+ espelho): `rePreCabeca` (cabeça em MAIÚSCULAS no início da linha ou após ponto final: "O PREFEITO[ ]MUNICIPAL", "O PREFEITO DE PORTO…", "O PRESIDENTE DA CÂMARA[ ]MUNICIPAL"; sem `/i`, o "o" inicial e o "f" do OCR podem ser minúsculos) e `rePreFacoSaber` ("Faço saber" no início da linha, com até 4 caracteres de lixo antes). **Bug antigo achado e corrigido no caminho:** a alternativa `O\s+PREFEITO\s+MUNICIPAL` de `rePre` era case-insensitive e sem âncora, então a ementa da EC 28/2009 ("…determinando que o Prefeito Municipal, nos 60 dias…") inteira virava preâmbulo (ementa vazia, norma aceita); saiu de `rePre`. `DECRETA`/`PROMULGA` ganharam fronteira de palavra ("promulgação"/"decretada" não casam mais). Medido: sem preâmbulo 262 → 64; ementas com marcador 218 → 9 (OCR ilegível e a Lei Orgânica de 1970: decisão 32); **0 mudanças de veredito ou motivo nas 1.109** (aceitas 750); 209 normas com ementa/preâmbulo alterados, conservação de letras conferida (5 diferem só porque os agrupadores "TÍTULO I / CAPÍTULO I", antes engolidos pela ementa, agora viram agrupadores, decisão 23). `VERSAO_ESTRUTURADOR` 24 → 27. Testes: `teste_preambulo_faco_saber.mjs` (8; 7 falham no código anterior); `teste_preambulo_mesa.mjs` 9; bateria do core igual; `normateste.mjs` byte a byte igual. **Não feito:** Resolução de Mesa (sem texto real; escopo futuro) e Ordem de Serviço ("RESOLVE:"/"DETERMINA:" não são âncora, regra do CLAUDE.md).

## Rodada 59 — carimbo, timbre e epígrafe fora da ementa (decisão 52), 21/11/2026

Decisão do mantenedor (21/11/2026): o carimbo de processo ("PROC. Nº …", "PELO/PLCL/PLCE/PLL/PLE/PR Nº …"), o timbre e a epígrafe ("EMENDA À LEI ORGÂNICA Nº 51, DE 28 DE AGOSTO DE 2024.") **não fazem parte da ementa**. Antes, o campo ementa de toda norma começava por eles ("PELO Nº 004/24 EMENDA À LEI ORGÂNICA Nº 51, DE 28… Inclui inc. III…"). Core (`parseLeiPublicada`; função nova exportada `separarCabecalhoDaEmenta`): corta, na 1ª epígrafe em MAIÚSCULAS dos 300 primeiros caracteres da ementa (data tolerante a OCR, "DEFEVEREIRO"), tudo até o fim dela para `doc.cabecalhoTexto` — só quando o que vem antes é carimbo, timbre ou resíduo de página do SIREL ("(2807 bytes)", "Prefeitura Municipal de Porto Alegre", "Divulgação: … Publicação: …"); sem epígrafe reconhecível, ou com texto de verdade antes dela, nada é cortado e a ementa nunca fica vazia. Estruturador (`VERSAO_ESTRUTURADOR` 27 → 30): grava `cabecalhoTexto` e o inclui nos trechos da conferência de conservação; `revisao-ancoras.mjs`/`gerar-revisao.mjs` ganham o item `cabecalho`. Medido: 268 das 1.109 normas passam a ter o cabeçalho separado (as demais têm a ementa já limpa ou o OCR não deixa reconhecer a epígrafe: 15 casos ficam como estavam); **0 mudanças de veredito ou motivo** (aceitas 750). Testes: `teste_cabecalho_ementa.mjs` (11; falha no código anterior); bateria do core igual; `normateste.mjs` byte a byte igual; `teste_revisao` 86. **Espelho:** `norma-simulacao.html` tem uma `parseLeiPublicada` antiga (já divergia do core: sem `promulgacaoParcial`) e a simulação não mostra ementa de lei publicada; não espelhado.

## Rodada 60 — UX das três páginas: decisões 53 a 56 (21/11/2026)

Plano em `PLANO-UX-2.md`; entrevista com o mantenedor (4 perguntas, regra 11) a partir de capturas reais (Playwright, ids 17878, 49145, 37042). Sem mudança de motor, estruturador nem decisões gravadas; `normateste.mjs` e a bateria idênticos (a única diferença é o teste novo).
- **Consulta (`docs/index.html`):** aviso de histórico incompleto em uma linha com "Ver quais" (LC 12: de mais de uma tela para ~60 px; decisão 53); sumário recolhível de artigos, campo "Ir para o art. N" e link permanente por dispositivo `#n=ID&d=art-5`, que também abre a lei já no dispositivo e atualiza o endereço ao clicar no rótulo (decisão 54); "Esta norma altera" / "Leis que a alteraram" com "provável" quando só a ementa liga (novo `docs/dados/vinculos.json`, gerado por `gerar-site.mjs` a partir dos vínculos da fonte e de `alteradorasPelaEmenta`; decisão 56c); vocabulário: "leitura aprovada nas verificações automáticas… nenhuma pessoa leu", "a conferir" no selo, faixa verde só com histórico completo e leitura aprovada (decisão 56a). Decisões 15, 49, 50 e 51 intactas.
- **Revisão (`docs/revisao.html`):** cabeçalho compacto (o aviso "sem caráter oficial" continua visível; o resto em "Como funciona"); barra de decisão colada no rodapé da tela (A/D/C/E sempre à vista a 1280x720 e no celular, com rótulos sem a letra do atalho em tela estreita); contador "Ponto N de M" com ◀ ▶ e teclas N/P, também para trechos fora da árvore e fronteiras inferidas; data em dd/mm/aaaa; "motor" no lugar de "leitor" (decisões 55 e 56b). Atalhos continuam com interruptor (decisão 14); nada muda no que é gravado.
- **Comuns às três:** link "pular", ícone, alvos de 44 px em toque, lista de leis da comparação com 8 linhas e botão desabilitado legível (decisão 56d).
- `teste_paginas.mjs` (29; Playwright, dados reais servidos do disco; pula sem Playwright) falha no código antigo (rc=1).
- Pendente (fora desta rodada): tempo de primeira carga em conexão lenta; aviso por dispositivo na busca no texto; navegação por setas na fila; as orçamentárias (50787, 50559, 50442, 49635, 49391, 50246) ainda não chegaram: as coletas de 22 e 23/11 não rodaram.
