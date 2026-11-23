# Situação do acervo

Gerado em 2026-11-23T09:26:53.148Z por `ingestao/situacao.mjs`. Não editar à mão.

**Estado: EM CARGA**

## O que fazer agora

- 380 norma(s) aguardam revisão da leitura automática (motivo mais frequente: `rotulo_nao_confere_com_a_origem`, 227): ROTEIRO.md, tarefa 1.
- 171 histórico(s) incompleto(s) e 0 com erro: ROTEIRO.md, tarefa 4.
- 13 arquivo(s) baixado(s) sem extração de texto (formato não suportado ou falha): conferir `dados/textos/sapl/_indice.jsonl`.

## Critérios de "em dia"

| | Critério | Situação |
|---|---|---|
| ✓ | Catálogo completo (todos os tipos do escopo) | tipo 1: completo · tipo 2: completo · tipo 5: completo · tipo 6: completo |
| ✓ | Vínculos completos | completos |
| ✗ | Fila de textos vazia | 6662 arquivo(s) a baixar |
| ✓ | Últimas 3 execuções sem erro | 0 com erro entre as últimas 3 |
| ✓ | Normas do Diário Oficial já presentes no catálogo (publicadas há mais de 7 dias) | nenhuma pendente |

Ritmo: 1740 arquivo(s) baixados nos últimos 7 dias (cerca de 249 por dia ativo); previsão de esvaziar a fila: **cerca de 27 dia(s)**, se o ritmo se mantiver.

## Números

- Fila de textos: 6662 · situações dos arquivos já tratados: ok 1700 · texto_curto 26 · formato_sem_extracao 13 · erro_definitivo 1 · baixado 1
- Estruturação: 1346 aceita(s), 380 em revisão (78% de aceitação)
- Histórico: 1192 lei(s) com alteradoras conhecidas; 43 completa(s), 171 incompleta(s), 978 aguardando o texto da lei-base
- Diário Oficial: 0 ausente(s) do catálogo há mais de 7 dias; 1 ato(s) que só o Diário traz
- Tamanho de `dados/` + `docs/`: 121 MB

## Últimas execuções da rotina

| Quando (UTC) | Disparo | Duração | Erros | Etapas |
|---|---|---|---|---|
| 2026-11-23T09:26:52Z | workflow_dispatch | 319 min | 0 | novidades: ok, dopa: ok, catalogo: ok, vinculos: ok, textos: ok |
| 2026-11-22T15:52:20Z | workflow_dispatch | 319 min | 0 | novidades: ok, dopa: ok, catalogo: ok, vinculos: ok, textos: ok |
| 2026-11-21T09:25:33Z | workflow_dispatch | 319 min | 0 | novidades: ok, dopa: ok, catalogo: ok, vinculos: ok, textos: ok |
| 2026-11-20T09:25:06Z | workflow_dispatch | 318 min | 0 | novidades: ok, dopa: ok, catalogo: ok, vinculos: ok, textos: ok |
| 2026-11-19T09:26:05Z | workflow_dispatch | 319 min | 0 | novidades: ok, dopa: ok, catalogo: ok, vinculos: ok, textos: ok |
| 2026-11-18T09:25:55Z | workflow_dispatch | 318 min | 0 | novidades: ok, dopa: ok, catalogo: ok, vinculos: ok, textos: ok |
| 2026-11-17T17:22:09Z | schedule | 238 min | 1 | novidades: ok, dopa: ok, catalogo: ok, vinculos: ok, textos: erro |

Relatórios de detalhe: `dados/catalogo/COBERTURA.md` · `dados/estruturado/RELATORIO.md` · `dados/historico/RELATORIO.md` · `dados/dopa/CONFERENCIA.md`.
