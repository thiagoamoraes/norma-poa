# PLANO — Fase 0 dos anexos: leis orçamentárias e leis de denominação (medição, sem código de leitura)

Relatório de planejamento (agente de planejamento, somente leitura; 21/11/2026), salvo pela sessão principal. Complementa `PLANO-ANEXOS-E-TABELAS.md` (seções 0, 1.1, 6 Fase 0 e 7). **Insumo, não decisão** (regras 11 e 12). Nada de produção foi escrito; nada foi baixado.
Base: checkout em `81fc201`, `dados/catalogo/sapl/*.jsonl`, `dados/textos/sapl/_indice.jsonl`, `dados/estruturado/sapl/*.json`, `dados/catalogo/sem-texto.tsv`, e as funções puras `filaDeDownload` (`ingestao/sapl-comum.mjs`) e `estruturarNorma`.

## 0. Achados que mudam o desenho da Fase 0

1. **A fila já entrega 5 das 6 normas em até 2 noites, sem mudança.** A fila tem 7.281 arquivos, todos de lei ordinária, ordenados por data decrescente. Posições simuladas com `filaDeDownload`: LOA 14.429 = 134; LDO 14.343 = 221; PPA 14.315 = 249; LOA 14.155 = 408; LDO 14.094 (DOCX) = 470. Ritmo medido: ~251 arquivos por noite (18 a 21/11). Previsão: noite de 22/11 traz até ~250; a de 23/11, até ~500.
2. **Risco da ordem atual: quem falha vai para o FIM da fila** (`filaDeDownload` ordena primeiro por número de falhas). Uma falha temporária na LOA a empurra ~30 noites. Só isso justifica o diff pequeno da seção 2.
3. **Os anexos das leis orçamentárias NÃO estão no arquivo que o SAPL entrega** (evidência forte). LDO 14.687/2026 (id 51911: 22 páginas, 49.460 caracteres, 75 artigos, "aceita", sem aviso), alteradoras 14.670/2026 (id 51809) e 14.564/2026 (id 51387): todas citam "Anexo(s) … desta Lei" e nenhuma tem uma linha de cabeçalho de anexo no texto. O registro cru da API só tem um campo de arquivo (`texto_integral`). Hipóteses: (H1) os anexos existem em outro recurso do SAPL que o catálogo não captura; (H2) são páginas-imagem no PDF (descartada para as 3); (H3) o SAPL não os tem. Distinguir H1 de H3 exige olhar o SAPL (rede).
4. **Classe nova de falso aceite silencioso (verificada pela sessão principal):** das ordinárias de 2026 baixadas, 42 citam "Anexo … desta Lei"; só 3 não têm nó de anexo (ids 51387, 51809, 51911: as 3 orçamentárias), todas "aceita" e sem aviso. Análogo à decisão 10. Candidato a motivo/aviso "anexo citado e ausente do arquivo".
5. **`artigosQueMexemEmAnexo` (decisão 37) acha só 1 de 3 artigos da Lei 14.670** que mexem em anexo: detecta o art. 3º ("Ficam incluídos no Anexo II da Lei nº 14.429…"); não detecta o art. 1º (provavelmente mais de 80 caracteres entre "Anexo" e "da Lei") nem o art. 4º (renumera emenda de anexo sem citar "Anexo").

## 1. Estado real das normas

| id | Lei | Data | Ementa | Formato | Fila |
|---|---|---|---|---|---|
| 50787 | 14.429 | 22/12/2025 | LOA 2026 | pdf | 134 |
| 49635 | 14.155 | 30/12/2024 | LOA 2025 | pdf | 408 |
| 50559 | 14.343 | 17/10/2025 | LDO 2026 | pdf | 221 |
| 49391 | 14.094 | 30/10/2024 | LDO 2025 | **docx** | 470 |
| 50442 | 14.315 | 01/09/2025 | PPA 2026-2029 | pdf | 249 |
| 51809 | 14.670 | 29/09/2026 | altera a LOA 14.429 | pdf | **já baixada** (2 páginas) |

Universo: 191 registros de ementa orçamentária, 63 recentes; dos recentes: pdf 46, docx 8, doc 2, html 4. **`doc`/`ppt`/`odt`/`jpg` são baixados mas NÃO extraídos** (ex.: LOA 2024, id 47799, é `doc`). Só 13 das 191 têm texto.
Das 133 ordinárias de 2026 já baixadas, 31 têm ementa "Denomina…"; 26 dessas têm anexo (25 gráfico, 1 preservado). Lei de denominação típica: 1.000 a 1.800 caracteres, 2 a 3 páginas; PDF de 7 KB a 466 KB.

**Lista final proposta (9):** 50787, 49635, 50559, 49391, 50442, 51809; denominação 51873 (anexo-imagem), 51967 (denominação em DOCX; carimbo duplicado linha a linha), 51833 (altera o anexo de lei de denominação; decisão 37). As 4 últimas já estão baixadas. Opcionais: 51911 (LDO 2027, linha de base), 51387, 50246 (altera a LOA 2025, fila 304).

## 2. Como priorizar na rotina noturna com mínima mudança

A rotina (`ingestao/rotina.sh`): 1 requisição por minuto, 3 tentativas, janela 01:05–06:50 de Brasília; OCR de PDF até 60 páginas (`ocr_adiado_arquivo_grande` acima disso); DOCX sem marca de célula/linha; HTML com células coladas; `estruturar.mjs` roda no fim da mesma noite.

- **Opção A — nada a mudar:** esperar 22 e 23/11. Fragilidade: uma falha empurra o arquivo ~30 noites.
- **Opção B (recomendada pelo agente) — lista de prioridade lida pela fila, diff pequeno e aditivo:** (1) `filaDeDownload(registros, resolvidos, falhasPorId, prioridade = [])` com chave de ordenação antes das falhas (~5 linhas; sem lista a ordem de hoje é preservada; id com 3 falhas volta ao lugar normal); (2) `baixar-textos.mjs` lê `dados/catalogo/prioridade-download.txt` (um idSapl por linha, `#` comentário; id inexistente = aviso, não erro); (3) 3 asserções em `teste_textos_sapl.mjs` (o workflow roda esse teste ANTES da coleta: teste quebrado cancela a noite); (4) o arquivo de dados com 50787, 50559, 50442, 49635, 49391, 50246; (5) CHANGELOG. Não aumenta requisições nem altera a etiqueta. **Commit e push antes das 04:00 UTC de 22/11.**
- **Rejeitadas:** alterar a data do catálogo; `workflow_dispatch` manual no expediente; mexer na ordem por tipo.

## 3. Roteiro de medição (depois que os textos chegarem)

1. Hoje, offline, nas já baixadas (51809, 51873, 51967, 51833, 51911, 51387): linha de base.
2. Depois das noites de 22 e 23/11: conferir `_indice.jsonl` (`situacao`, `extracao.situacao`, `bytes`); anotar falhas.
3. Métricas por norma: formato, bytes, método de extração, páginas (contagem de `\f`; páginas com < 50 caracteres = provável imagem), caracteres, linhas, nº de anexos citados no corpo × achados; por anexo: rótulo, linhas, caracteres, tipo V/Q/T/X, linhas com 3+ colunas, linhas com `R$`, proporção de dígitos, pontilhado; falhas de extração (palavras espaçadas, linhas duplicadas, células vazias perdidas); alteradora de orçamento: artigos que mexem em anexo × detectados; custo (tempo e tamanho de JSON).
4. Perguntas que o `.txt` não responde (páginas-imagem, células do DOCX) exigem o bruto da Release `textos-brutos` (GitHub, não o SAPL).
5. Scripts reaproveitáveis: `agente-anexos/{base,c2,d1,a8,b4,c8}.mjs` (scratchpad).
6. **Término:** as 9 medidas (ou cada ausência explicada), tabela conferida por contagem independente, respondidas por escrito as 3 perguntas (onde estão os anexos, qual o volume, qual a forma), perguntas ao mantenedor levadas com evidência, nenhuma linha de código de leitura alterada. Se H3 se confirmar: "os anexos orçamentários não estão no acervo da fonte" e a fonte alternativa vira decisão do mantenedor.

## 4. Riscos

1. **Volume:** com texto sintético sobre a LDO real, `estruturarNorma` é linear (60 mil linhas = 5,4 MB, 1,5 s); o problema é tamanho no git (`dados/` já tem 170 MB; GitHub avisa em 50 MB, recusa acima de 100 MB por arquivo). Regra sugerida: se um `.txt` passar de ~20 MB ou o conjunto das 191 de ~200 MB, não versionar o texto de anexo (hash, tamanho e rótulo; o bruto fica na Release).
2. **Anexo ausente do arquivo:** o motor aceita sem aviso lei que cita anexos que o arquivo não traz (achado 4).
3. **DOCX perde estrutura:** célula vazia some, fim de célula/linha não é marcado; em 51967 há duplicação do carimbo (caixa de texto).
4. **HTML:** `<td>` removido sem separador (células coladas); só 4 recentes são HTML.
5. **Download:** limite de 180 s por tentativa; falha vai ao fim da fila; `doc` gera requisição sem texto.
6. **OCR:** PDF de anexo digitalizado com mais de 60 páginas fica sem texto; decisão 32 vale (não corrigir OCR).
7. **Rotina:** LOAs enormes aumentam commit, Release e artefato.
8. **Valores e vigência:** o texto vigente de uma LOA ao longo do ano também depende de créditos adicionais por decreto (fora do escopo, CLAUDE.md); "texto vigente" de LOA seria sempre parcial.
9. **Selos em tensão:** a decisão 36 prevê "anexo gráfico não apurado" na consulta ("a fazer"); a decisão 37 diz que não há selo em toda lei com anexo gráfico. Ver P4.

## 5. Decisões do mantenedor (entrevista; até 4 por rodada)

Rodada 1 (antes de baixar): **P1** autoriza a lista de prioridade (B) ou espera 2 noites (A)? Recomendação: B. **P2** os valores das leis orçamentárias entram no motor? (a) não, só articulado + anexo preservado; (b) versionar o ANEXO inteiro; (c) versionar a LINHA/ação. **P3** a unidade de versão da LOA/LDO/PPA é a lei, o anexo ou a linha? **P4** leis de denominação com anexo-imagem (31 de 133 em 2026): manter a decisão 37 (sem selo; só aviso quando o anexo for alterado) e retificar a 36?
Rodada 2 (depois da Fase 0): **P5** anexo citado e ausente do arquivo: reprovar (como a decisão 10) ou só avisar? **P6** se os anexos estiverem em outro recurso do SAPL (H1): ler e ligar ao ato? **P7** armazenamento: versionar o texto de anexo no git ou só hash/tamanho? **P8** DOCX: trocar o extrator para marcar célula/linha e deduplicar caixa de texto? **P9** vigência por exercício (LOA/LDO) e PPA quadrienal no rótulo "texto vigente apurado". **P10** escopo: as 63 recentes entram na fila normal ou só as 6?

## 6. O que não foi verificado

Tamanho, páginas e forma dos anexos de LOA, PPA e do DOCX da LDO (sem texto nem bruto); H1 × H3 (exige rede ou o bruto da Release); se o PDF bruto das 3 orçamentárias já baixadas tem páginas-imagem de anexo; se o proxy permite baixar da Release; a causa exata de o art. 1º da Lei 14.670 escapar do detector da decisão 37; o ritmo de ~250 arquivos por noite assume nenhuma falha em massa.
