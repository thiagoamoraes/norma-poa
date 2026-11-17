# CLAUDE.md — Norma (repositório `parserleispoa`)

## O que é

Motor de apuração de **texto vigente** e versionamento legislativo do corpo normativo de Porto Alegre.
Projeto **experimental e pessoal** do mantenedor, sem caráter oficial (ver `README.md`). Não representa a Câmara Municipal nem a Prefeitura de Porto Alegre.

Mesmo sendo experimento, o assunto é texto legal: **precisão técnica é o critério de qualidade.**
Na dúvida, **falhe alto e pergunte**; nunca chute.

**Fora de escopo:** Redação Final (inclusão de emenda de plenário). É outro fluxo, com outro formato de comando — não tratar um como substituto do outro.

Idioma de tudo (código, comentários, testes, commits, docs): **português**.

## Como trabalhar aqui

1. **Nenhum código sem exemplo real.** Se falta um texto real para validar, diga o que falta e pare. Stubs (`revoke_node`, `veto_derrubado`) ficam com falha explícita até chegar exemplo.
2. **A palavra do mantenedor sobre prática legislativa prevalece sobre suposição do código.** Mas se um documento real contradisser o mantenedor *ou* o código, **mostre a evidência e decida com ele** — não escolha em silêncio. (Ex.: ele lembrava que "REPUBLICAÇÃO" aparece dentro do PDF da norma; no caso real só está no índice do caderno.)
3. **Diff mínimo e aditivo.** Nada de refatoração de carona. Mostre o diff antes de propor commit.
4. **Antes de mexer no core:** rode a bateria inteira e anote as contagens. Depois de mexer: compare. Testes que só imprimem texto (`normateste.mjs`) comparam-se **byte a byte** com a saída de antes.
5. **Todo teste novo tem que falhar contra o código antigo** (prova de que testa algo). Confira.
6. **Verifique de forma independente**, não só pela saída do próprio script (ex.: contar links direto no PDF com `pdftotext | grep`).
7. **Real × sintético:** texto inventado leva `(sintético)` na descrição do teste. Nunca apresentar sintético como se fosse o DOPA.
8. **Trabalho em rodadas** documentadas: código validado + testes com leis reais de POA + entrada no `CHANGELOG.md`.
9. **Não reorganize a estrutura de pastas sem pedir.** Os testes usam caminhos relativos à raiz (`./norma-core.js`, `./lc320.txt`…). A estrutura hoje é plana, de propósito.
10. **Nunca reescreva `norma-core.js` inteiro.** Existem cópias divergentes do parser (repositório, Project Knowledge do Claude.ai, e uma cópia embutida em `norma-simulacao.html`). **A fonte da verdade é este repositório.** Aplique edições pontuais ou `git apply`.

## Arquitetura

### Regra dura
`norma-core.js`: **ESM puro, zero dependências, sem I/O/rede/disco**, sem estado global (exceto o gerador de id `nid`/`resetIdCounter`). Função nova: exportada, testável isoladamente em `.mjs` standalone.
Ingestão (PDF, rede, disco, banco) é **módulo separado**; o core nunca importa dela e ela nunca coloca código dentro do core. Mudanças no core são só de lógica de texto puro.

### Peças (todas com núcleo implementado e testado)
| Peça | Faz | Funções principais |
|---|---|---|
| 1 | Metadados de lei publicada | `extrairCabecalhoLeiPublicada`, `extrairProvenienciaPromulgacao`, `parseLeiPublicada` (ponto de entrada), `criarVersaoOriginalDeLeiPublicada` |
| 2 | Referência entre leis | `extrairReferenciasLei`, `chaveLei` (chave de citação), `urnLei` (URN LexML, aditivo), `construirIndiceColecao`, `resolverReferenciaLei` |
| 3 | Extrator de comando | `extrairComandosLei`: `replace_text`, `insert_node` (validados); `revoke_node`, `veto_derrubado` (stubs que falham alto); `revoke_lei`, `clausula_generica_sem_efeito`, `indeterminado`, `nao_classificado` |
| 4 | Texto vigente | `criarVersaoOriginal`, `aplicarComandoLei`, `apurarTextoVigente`, `indexarVersao`, `localizarCaminho` (árvore imutável, compartilhamento estrutural real) |
| 5 | Ingestão DOPA/PDF (**fora do core**) | `dopa-discovery.mjs` (descoberta); `ingestao/pdf-normas.mjs` → `extrairTextoNorma` (PDF→texto de norma individual); `ingestao/coletor-comum.mjs` → `agruparPorLinha` (compartilhada pelas duas) |

Rodada 10 (sessão de 28/08): estágio `fecho` em `parseMinuta` (`doc.fecho`, 2 padrões: Prefeitura e Gabinete da Presidência), UX da `norma-simulacao.html`, plano da Peça 5, `teste_regressao.mjs` 41→47 (total 153).
Rodada 11 (core): `detectarPromulgacaoParcial`, `localizarPreambulo`, 3º padrão de fecho `CÂMARA MUNICIPAL DE PORTO ALEGRE, DD DE MÊS DE AAAA.`, correção da janela de preâmbulo em `extrairProvenienciaPromulgacao`. Mesma rodada, sessão seguinte: histórico git reconstruído (2 commits: base até a rodada 10 + rodada 11); os 3 limites conhecidos tratados — `promulgacao_parcial`/`promulgacao_propria` em `extrairProvenienciaPromulgacao`; `extrairCabecalhoLeiPublicada` estendido pra Resolução/Ordem de Serviço, com sinalização `tipoNaoSuportado` pros tipos raros sem PDF real; `extrairTextoNorma` (Peça 5) implementado e validado ponta a ponta contra os 8 PDFs reais disponíveis (4 DOPA/SEI + 4 leis.org). Bug do `reArt` (maiúsculo) também corrigido nesta sessão, com OK explícito do mantenedor.

Nó da árvore: `{ id, tipo, texto, children[], conj, desFixo, gruposAntes?, omitido?, vetado?, revogado?, nrBloco?, origem? }`
Tipos: `artigo | paragrafo | inciso | alinea | item | ementa | em | omissao | texto`.

### Arquivos (confirmar com `git ls-files`)
`norma-core.js` (motor) · `dopa-discovery.mjs` (coletor de cadernos) · `ingestao/pdf-normas.mjs` (extrator de texto de norma individual — junto com `dopa-discovery.mjs`, os únicos lugares com `pdfjs-dist`) · `ingestao/coletor-comum.mjs` (`agruparPorLinha`, compartilhada pelos dois) · `debug-pagina.mjs` (ferramenta: despeja os itens de texto brutos de uma página de PDF) · `cruzar-projeto.mjs` (ferramenta: cobertura de testes por função do core e deriva de identificadores nos `.md`; análise estática, não roda testes) · `teste_*.mjs`, `normateste.mjs` · fixtures `*.txt` · fixtures `fixtures/pdf/*.pdf` (3 PDFs reais do DOPA/SEI; o PDF da OS 12/2026 e os 4 `*_leisorg.pdf` não estão neste repositório — sem eles o teste pula os casos correspondentes; o `os12.txt` está sem as linhas de cabeçalho/rodapé de impressão) · `package.json` (`"type": "module"`) · `README.md` · `norma-simulacao.html` (simulação visual; **embute uma cópia do parser**, com os 3 padrões de fecho já espelhados — mudança em `parseMinuta`/fecho precisa ser espelhada lá; validar no navegador) · docs: `CHANGELOG.md`, `PECA4-MODELO-DE-DADOS.md`.

### Resíduo do projeto antigo (STL Editor) — não usar no pipeline
`normalizar()` (muta texto: só para minuta pré-plenário, **nunca** sobre lei publicada), `numeroPorExtenso()`, `suggestDesFixo()`, ramo "PROJETO DE LEI Nº" em `parseMinuta`, `visText()` com `.toks`.

## Invariantes de domínio (nunca violar)

- **`desFixo` é atribuído UMA vez, no nascimento do nó.** Nunca recalcular por posição (LC 611, art. 17, I).
- **Nunca renumerar.** Inserção intermediária usa sufixo de letra (Art. 5º-A) — art. 17, § único.
  **Exceção decidida pelo mantenedor (17/11/2026): o motor segue o que a lei fez.** A regra vale para o que o projeto redige ou sugere; quando a própria alteradora manda renumerar (LC 514/2004: "renumerando o atual parágrafo único para § 3º") ou põe texto novo no rótulo de dispositivo vetado, o motor aplica e registra (`renumber_node` → `renumerado` no nó; `origem.ocupouPosicaoDeVetado`). O motor nunca renumera por iniciativa própria.
- **Dispositivo vetado/revogado nunca sai da árvore:** fica marcado, mantém posição e `desFixo` (art. 13, XXIV; art. 17, II). Quatro estados de posição não reaproveitável: vetado e revogado (implementados); declarado inconstitucional e execução suspensa (aguardam exemplo).
- **Chaves de citação são normalizadas** (minúsculas, espaço único): compare sempre normalizado.
- **Terminologia (LC 611/2009, art. 19):** *texto vigente* (texto atual de UMA lei, o que o Norma produz) · *compilação* (sem processo legislativo — o que o leis.org faz) · *consolidação* (ato legislativo formal). **Nunca chamar o texto vigente de "consolidado".** Diga *republicação*, não "retificação".
- **Classificar `replace_text` × `insert_node` só é confiável com `leiBaseIndex`** (índice da lei-alvo no estado anterior). Sem ele cai num fallback por palavra-gatilho, que erra em comando misto (caso LC 412).

## Textos de normas — o que os documentos reais mostraram

- **Preâmbulo:** ancorar em "Faço saber" (ementas chegam a 27 linhas; janela fixa de 15 linhas falha). "Art." de início de artigo só com **A maiúsculo**.
- **Quem promulga:** Prefeito "sanciono" (`sancao_normal`). Câmara "promulgo": veto derrubado integral (LC 412: "manteve e eu promulgo **a seguinte** Lei", `veto_derrubado`), **promulgação parcial** ("promulgo **dispositivo da** Lei nº N", `promulgacao_parcial` — Prefeito ou Câmara), ato próprio íntegro (Resolução: "promulgo a seguinte Resolução", `promulgacao_propria`). Ordem de Serviço não usa "Faço saber"/"promulgo"/"sanciono" — o verbo final varia (**"DETERMINA:" é o mais comum, segundo o mantenedor, mais que "RESOLVE:"**; não usar nenhum dos dois como âncora em código, só a ausência do trio acima); continua `indeterminado`.
- **Promulgação parcial** = só o(s) dispositivo(s) de veto derrubado; corpo com pontos no lugar do resto. O **objeto do "promulgo" decide** (`a seguinte …` = ato inteiro; `dispositivo/art. X da Lei nº N` = parcial). **Linhas de pontos NÃO decidem** (alteradoras também as têm; artigo inteiro não tem). Data do cabeçalho ≠ data do fecho = `suspeita` (sinaliza, não bloqueia). `criarVersaoOriginalDeLeiPublicada` **lança erro** num fragmento (senão numera o trecho como "Art. 1º").
  Confirmados: Prefeito (LC 1.075/2026, art. 185 § 3º, `baseLegal` formato "§ N do artigo M") e Câmara (Lei 14.504/2026, art. 4º, `baseLegal` formato plural "§§ N e M do art. X"). O fragmento pode ser também alteradora (Lei 14.504 art. 4º altera Lei 10.605 art. 38-A § 3º) → **não descartar o texto**: é Visão da lei e fonte de comando para outra.
- **Fechos reconhecidos (3):** `PREFEITURA MUNICIPAL DE PORTO ALEGRE, <data>.` (também na grafia "MUNIC IPAL", que é como vem nos PDFs de 2012 a 2015) · `GABINETE DA PRESIDÊNCIA DA CÂMARA MUNICIPAL…, <data>.` · `CÂMARA MUNICIPAL DE PORTO ALEGRE, DD DE MÊS DE AAAA.` (regex estrita: a linha inteira).
- **Data do cabeçalho** (`dataPublicacao`) = data **da lei**, não da promulgação parcial (essa está no fecho).
- **REPUBLICAÇÃO** aparece no **índice** do caderno (fim da ementa, "(REPUBLICAÇÃO)"), não necessariamente no PDF da norma → a flag `isRepublicacao`/`sinalRepublicacao` nasce na descoberta e **tem de viajar com o registro**. Classificar como Versão ou Visão: pendente (LexML: depende de antes/depois da vacatio legis).

## DOPA — fatos confirmados

**API** (`BASE = https://apigateway.procempa.com.br/apiman-gateway/administracao-planejamento/dopa/1.1`, sem autenticação):
- `GET {BASE}/api/diarios/{legislativo|executivo}/ultimos` → últimos **5 dias**: `[{data, publicacoes:[{idEdicao, tituloPublicacao, numeroEdicao, isExtra, isAssinado, linkDownload, assinatura, tipo}]}]`
- `GET {BASE}/api/diarios/edicao/{idEdicao}/download?tipo={legislativo|executivo}` → PDF do **caderno completo** (nome no `Content-Disposition`, ex. `6182_cl_20260925_legislativo.pdf`; `cl`/`ce`).
- `dopa.portoalegre.rs.gov.br` é SPA: **não raspar HTML.**
- **Edição extra** existe nos dois poderes com o mesmo `idEdicao` (mesmo sem publicação num deles) e pode ser assinada no dia seguinte. Chave de controle = **(idEdicao, poder)**; rodar 1×/dia relendo a janela toda e deduplicando.
- **Etiqueta:** requisições sequenciais, ≥400 ms entre elas, `User-Agent` identificado.

**Caderno = índice.** Cada norma: ementa longa → (linha "Para visualizar, na íntegra…") → **cabeçalho curto** → **URL como texto visível** (não anotação) `http://dopaonlineupload.procempa.com.br/dopaonlineupload/{idEdicao}_{cl|ce}_{docId}_{seq}.pdf`. O texto da norma é **outro PDF**. PDFs sempre com camada de texto (sem OCR).
- Cabeçalhos curtos vistos: `LEI Nº 14.663, DE 21 DE SETEMBRO DE 2026` · `…DE 18 DE AGOSTO DE 2026.` (ponto final) · `ORDEM DE SERVIÇO Nº 13/2026` · `ORDEM DE SERVIÇO Nº 12 - 2026` (hífen) · `RESOLUÇÃO Nº 3.021 DE 25 DE …` (sem vírgula) · `RESOLUÇÃO Nº DE 3.025, DE …` (grafia variante) · `RESOLUÇÃO DE MESA Nº 674, …`. Cabeçalho e URL podem ficar em **páginas diferentes**.
- **Tipos em escopo:** Executivo → Lei, Lei Complementar (decretos fora, por ora). Legislativo → Lei, LC, Resolução, Resolução de Mesa, Decreto Legislativo, Emenda à Lei Orgânica, Ordem de Serviço.
- Todo link cai em 1 de 4 categorias — **nada some em silêncio:** `entradas` · `foraDeEscopo` (contagem) · `anexosEditais` (contagem) · `semCabecalho` (com contexto; é o alarme de formato novo).
- **`pdfjs-dist`:** itens vêm fora da ordem de leitura (ordenar por x dentro da linha, por y decrescente entre linhas); espaço às vezes é só vão entre itens (inserir se vão > 0,2× corpo — medido: mesma palavra ≤ 0,031, espaço real ≥ 0,278).
- A LC 1.075/2026 (Plano Diretor) no índice do Executivo é **só um dispositivo** (promulgação parcial), mas o índice a mostra como lei integral.

## Direção acordada para a ingestão (ainda não implementada)

- Agente diário = **script determinístico** (Node) em cron do GitHub Actions; **IA só escreve o código, nunca roda no pipeline.**
- Lógica em pacote importável, independente do runner. Persistência em banco: **adiada** (ver `PLANO.md`).
- Guardar **texto bruto** + metadados + comandos (com `classificacaoConfiavel:false` enquanto a lei-alvo não estiver na base) → reprocessar depois localmente, sem voltar ao DOPA.
- Lei-alvo ausente na base: backfill ou resolução sob demanda — adiado.

## Acervo completo (rodada 12) — ler `PLANO.md`

`PLANO.md` é o plano vivo (fases, critérios de aceite, decisões). **`ROTEIRO.md` diz o que fazer em seguida, tarefa a tarefa, com passos, critério de término e armadilhas — comece por ele (seção 0) em toda sessão nova, e por `dados/SITUACAO.md` (gerado toda noite: em carga × em dia, alertas, o que fazer). Ficou sem análise por um tempo, ou o acervo está em dia? Seções 10-A e 10-B. Trabalho em andamento vai num ramo `wip/<tarefa>` com `EM_ANDAMENTO.md` (seção 0.3, regra 10).** Resumo do que existe:
- **Fonte do catálogo:** API do SAPL da PGM (`legislacao.portoalegre.rs.gov.br/api/`). **Etiqueta dura: 1 requisição por minuto, sequencial** — toda rede passa por `ingestao/sapl-io.mjs`; nunca chamar `fetch` direto nem rodar dois coletores ao mesmo tempo. Portais privados de legislação (leis.org / Leis Municipais) **não são fonte de coleta automática**.
- `ingestao/sapl-comum.mjs` e `ingestao/extracao-texto.mjs`: funções puras. `ingestao/catalogo-sapl.mjs` (catálogo, `--novidades`, `--vinculos`), `ingestao/baixar-textos.mjs`, `ingestao/conferencia-dopa.mjs` (DOPA × catálogo → `dados/dopa/`), `ingestao/relatorio-cobertura.mjs`, `ingestao/rotina.sh`.
- **Cuidado:** os coletores executam ao serem importados (`import()` de `catalogo-sapl.mjs` dispara a coleta). Para checar sintaxe, `node --check`.
- Dados: `dados/catalogo/sapl/*.jsonl` (a ÚLTIMA ocorrência de um `idSapl` vale), `dados/catalogo/COBERTURA.md`, `dados/textos/sapl/` (texto extraído + `_indice.jsonl`). Brutos: `dados/_bruto/` (fora do git) → Release `textos-brutos`.
- Rotina diária: `.github/workflows/coleta-diaria.yml` (04:17 UTC, na `main`, sem IA). **Preferência do mantenedor (17/11/2026): coletar só de madrugada em Brasília** — o agendamento já faz isso (01:17 de Brasília, 320 minutos, termina antes das 07:00). **Guarda de horário** (`ingestao/guarda-horario.sh`, job `guarda` do workflow): execução AGENDADA fora de 03:00–10:00 UTC, ou depois de o disparo externo já ter rodado, é pulada; dentro da janela para às 09:50 UTC. Disparo manual/externo é livre. **Disparo externo** (decisão de 17/11/2026, por causa dos atrasos do agendamento): serviço de cron externo chama `workflow_dispatch` às 04:05 UTC (ROTEIRO, 10-C); o `schedule` fica de reserva. Não dispare coleta manual no expediente por conta própria. Para parar mais cedo num dia específico, preencha a entrada `parar_em_utc` do disparo manual (ex.: `10:00` = 07:00 de Brasília) ou `PARAR_EM_UTC` na `rotina.sh`; vale só para aquela execução (`ingestao/parar-em.sh`, testada em `teste_parar_em.sh`).
- **Estruturação com verificação:** `ingestao/estrutura.mjs` (puro) → `ingestao/estruturar.mjs` grava `dados/estruturado/sapl/<id>.json` e `dados/estruturado/RELATORIO.md` (taxa de aceitação e fila de revisão, por motivo). Endereço de dispositivo = caminho de rótulos (`art-5-A/par-2/inc-III`), nunca posição. Norma só é `aceita` se passar em todas as conferências; mexeu na lógica → suba `VERSAO_ESTRUTURADOR` para reprocessar.
- **Página de consulta:** `docs/index.html` (estática, sem dependências) + `docs/dados/catalogo.json` gerado por `ingestao/gerar-site.mjs`. Servida pelo GitHub Pages (pasta `/docs` da `main`).
- Testes: `node teste_catalogo_sapl.mjs` (26) · `node teste_textos_sapl.mjs` (36) · `node teste_estrutura.mjs` (28) · `node teste_versionamento.mjs` (34) · `node teste_historico.mjs` (24) · `node teste_minuta.mjs` (33) · `node teste_leis_ordinarias.mjs` (20) · `node teste_situacao.mjs` (18) · `node teste_rede_local.mjs` (8) · `bash teste_parar_em.sh` · `bash teste_guarda_horario.sh` (8) · `node teste_ocr.mjs` (7; pula sem tesseract).
- **OCR:** `ingestao/ocr.mjs`, chamado por `baixar-textos.mjs` na hora do download, para PDF sem camada de texto e para digitalização com camada ruim. Texto de OCR nunca é corrigido à mão nem por regra; sai marcado (`extracao.metodo: 'ocr'`, aviso `texto_de_ocr`). **Todo texto extraído passa por `prepararTextoExtraido` antes de ser lido** (quebra de página → linha; hifenização de fim de linha desfeita). Também em `baixar-textos.mjs`: DOCX (`docxParaTexto`) e documento repetido dentro do PDF (`removerRepeticaoDeTexto`).
- **Minuta de lei alteradora (piloto):** `ingestao/minuta.mjs` (gerador puro, na forma da LC 611/2009 e de leis reais usadas como molde), `ingestao/minuta-conferencia.mjs` (ida e volta: o motor lê a minuta e tem de entender exatamente o pedido), `ingestao/minuta-cli.mjs`, painel na página. Só se apresenta como conferida a minuta que passa na ida e volta.
- **Lista de leis com histórico:** vínculos da fonte (`montarListaDeHistoricos`) + ementas do catálogo (`alteradorasPelaEmenta`; a fonte não liga 3 das 10 alteradoras da LC 320) + `_piloto.json`. `dados/historico/RELATORIO.md` resume.
- **Histórico:** `ingestao/historico.mjs` (puro) → `ingestao/gerar-historico.mjs` grava `dados/historico/sapl/<id>.json` para as leis de `dados/historico/_piloto.json` (hoje só a LC 320; a lista passa a ser automática quando os vínculos chegarem). Cada dispositivo guarda a sua linha do tempo; alteradora não aplicada por inteiro vai para `naoAplicadas` e os dispositivos que ela cita para `aConferir` (com a data a partir da qual há dúvida). A página mostra seletor de versão, anotações ("Redação dada pela…", "Incluído pela…", "Revogado pela…") e o que mudou.
- **Versionamento medido com dado real** (`teste_versionamento.mjs`): LC 320/1994 + as 10 LCs que a alteraram → 72 de 78 dispositivos iguais ao compilado de referência; as 6 diferenças estão nomeadas no teste: 4 em que a cópia de referência diverge do texto da LC 958/2022 (art. 7º revogado; um travessão no inc. I do art. 12-B) e 2 de defeito do arquivo de origem. **Decisão do mantenedor (17/11/2026): onde o texto da lei e a cópia compilada de referência divergem, vale o texto da lei** — a cópia compilada é auxílio de conferência, não gabarito; divergência se registra no teste, sem "corrigir" o motor para imitá-la. `apurarTextoVigente` devolve também `versoes[]` (uma por alteradora que mudou algo, com `id` e `versaoAnterior`). **A identidade da alteradora (número, data) vem do catálogo**, não do cabeçalho do arquivo — 3 de 8 arquivos reais têm cabeçalho fora do padrão.
- `revoke_node` e `renumber_node` **implementados**, cada um com exemplo real (LC 958/2022, art. 6º; LC 514/2004, art. 1º).
- **Repositório pensado para ser público:** nada de nomes de pessoas, cargos, planos institucionais ou juízo sobre órgãos e terceiros em código, docs ou commits. `dados/dopa/` guarda só cabeçalho e link das normas — nunca texto corrido do caderno.
- Escopo da fase inicial: Lei Orgânica, emendas, LCs e leis ordinárias.

## Testes

Convenção: `.mjs` standalone, `ok(desc, cond)`, marcadores ✓/✗, **exit code ≠ 0 se falhar**, sem framework.

```
# core (rodar TODOS antes e depois de mexer)
node normateste.mjs                  # só imprime — comparar byte a byte
node teste_regressao.mjs   node teste_vetado_provenencia.mjs   node teste_pecas_2_3.mjs
node teste_lei_publicada.mjs   node teste_peca4.mjs   node teste_urn.mjs   node teste_gruposAntes.mjs
node teste_promulgacao_parcial.mjs   # fixtures reais; lê lc320/384/412/611.txt e as parciais/Resolução/OS da raiz
node teste_pdf_normas.mjs            # ehLinhaDeRuido + ponta a ponta contra os 8 PDFs de fixtures/pdf/
# coletor (pula seção cujo PDF faltar)
node teste_dopa_discovery.mjs <exe6179> <leg6171> <exe6180> <leg6112> <leg6158>
```
**Baseline:** re-meça no repositório antes de começar. Referência: **153 asserções** no core (47 regressão + 13 vetado/proveniência + 30 peças 2–3 + 11 lei publicada + 29 peça 4 + 7 URN + 16 gruposAntes; `normateste.mjs` só imprime) — não muda desde a rodada 10, é a régua de "não regredi nada". Além disso: `teste_promulgacao_parcial.mjs` 72, `teste_dopa_discovery.mjs` 96 (com os 5 cadernos), `teste_pdf_normas.mjs` 38 com os 8 PDFs (4 de `fixtures/pdf/` + 4 `*_leisorg.pdf` copiados de `fixtures-locais/`); sem os `*_leisorg.pdf`, a seção correspondente é pulada.

**Fixtures reais:** LC 320/384/412/611 (`.txt`, oráculo dos PDFs `*_leisorg.pdf`); `lc320_compilado_leisorg.txt` (cópia compilada usada como **auxílio de conferência** — não é gabarito; ver decisão na seção do acervo); fragmentos LC 1.075 e Lei 14.504; Resolução 3.006; OS 12/2026 — todos com `.txt` e PDF real em `fixtures/pdf/`.
**Git:** cadernos completos contêm dados de servidores → **fora do git**. Ignorar: `node_modules/`, `cadernos-baixados/`, `fixtures-locais/`, `dopa-state.json`, `descobertas.json`, `pagina1.txt`, `_referencia/`. Histórico: commit base (até a rodada 10) → rodada 11 (integração) → um commit por Tarefa (A, B, C) → correções pontuais (import de `agruparPorLinha`; patch do `reArt`). PDFs de **normas individuais** (atos públicos, pequenos) entram em `fixtures/pdf/`; cadernos completos ficam em `fixtures-locais/`. A API só lista 5 dias: guarde PDFs de gabarito **fora** de `cadernos-baixados/`.

## Estado atual e pendências

**Pendências que aguardam exemplo real:** `veto_derrubado` (modelagem `visoes[]`, primeiros exemplos reais agora existem — modelagem **não decidida**); republicação Versão×Visão; inconstitucional/execução suspensa; inserção de artigo-irmão na raiz (só sintético); comando para Resolução/OS/etc. (sem extração). Resolução de Mesa, Decreto Legislativo, Emenda à Lei Orgânica e Precedente Legislativo: sem PDF de norma real ainda — `extrairCabecalhoLeiPublicada` só sinaliza `tipoNaoSuportado`, sem extrair número/data; `urnLei`/`chaveLei` não implementados pra eles (LexML não tem termo confirmado pra "ordem de serviço" nem, até onde pesquisado, pros demais raros).

## Nunca

- Rodar `normalizar()` sobre lei publicada · renumerar · remover dispositivo · pôr dependência ou I/O no core.
- Implementar `revoke_node`/`veto_derrubado` sem exemplo real · inventar redação de norma · tratar sintético como real.
- Commitar cadernos, estado ou `descobertas.json` · reescrever arquivo inteiro para "aplicar patch".
