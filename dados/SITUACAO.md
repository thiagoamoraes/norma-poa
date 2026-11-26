# Situação do acervo

Gerado em 2026-11-26T06:29:43.870Z por `ingestao/situacao.mjs`. Não editar à mão.

**Estado: EM CARGA**

## O que fazer agora

- 402 norma(s) aguardam revisão da leitura automática (motivo mais frequente: `rotulo_nao_confere_com_a_origem`, 234): ROTEIRO.md, tarefa 1.
- 182 histórico(s) incompleto(s) e 0 com erro: ROTEIRO.md, tarefa 4.
- 17 arquivo(s) baixado(s) sem extração de texto (formato não suportado ou falha): conferir `dados/textos/sapl/_indice.jsonl`.

## Critérios de "em dia"

| | Critério | Situação |
|---|---|---|
| ✓ | Catálogo completo (todos os tipos do escopo) | tipo 1: completo · tipo 2: completo · tipo 5: completo · tipo 6: completo |
| ✓ | Vínculos completos | completos |
| ✗ | Fila de textos vazia | 5720 arquivo(s) a baixar |
| ✓ | Últimas 3 execuções sem erro | 0 com erro entre as últimas 3 |
| ✓ | Normas do Diário Oficial já presentes no catálogo (publicadas há mais de 7 dias) | nenhuma pendente |

Ritmo: 2100 arquivo(s) baixados nos últimos 7 dias (cerca de 300 por dia ativo); previsão de esvaziar a fila: **cerca de 20 dia(s)**, se o ritmo se mantiver.

## Números

- Fila de textos: 5720 · situações dos arquivos já tratados: ok 2638 · texto_curto 26 · formato_sem_extracao 17 · erro_definitivo 1 · baixado 1
- Estruturação: 2262 aceita(s), 402 em revisão (84.9% de aceitação)
- Histórico: 1192 lei(s) com alteradoras conhecidas; 56 completa(s), 182 incompleta(s), 954 aguardando o texto da lei-base
- Diário Oficial: 0 ausente(s) do catálogo há mais de 7 dias; 2 ato(s) que só o Diário traz
- Tamanho de `dados/` + `docs/`: 144 MB

## Últimas execuções da rotina

| Quando (UTC) | Disparo | Duração | Erros | Etapas |
|---|---|---|---|---|
| 2026-11-26T06:29:43Z | workflow_dispatch | 326 min | 0 | novidades: ok, dopa: ok, catalogo: ok, vinculos: ok, textos: ok |
| 2026-11-25T09:26:30Z | workflow_dispatch | 319 min | 0 | novidades: ok, dopa: ok, catalogo: ok, vinculos: ok, textos: ok |
| 2026-11-24T09:30:06Z | workflow_dispatch | 319 min | 0 | novidades: ok, dopa: ok, catalogo: ok, vinculos: ok, textos: ok |
| 2026-11-23T09:26:52Z | workflow_dispatch | 319 min | 0 | novidades: ok, dopa: ok, catalogo: ok, vinculos: ok, textos: ok |
| 2026-11-22T15:52:20Z | workflow_dispatch | 319 min | 0 | novidades: ok, dopa: ok, catalogo: ok, vinculos: ok, textos: ok |
| 2026-11-21T09:25:33Z | workflow_dispatch | 319 min | 0 | novidades: ok, dopa: ok, catalogo: ok, vinculos: ok, textos: ok |
| 2026-11-20T09:25:06Z | workflow_dispatch | 318 min | 0 | novidades: ok, dopa: ok, catalogo: ok, vinculos: ok, textos: ok |

Relatórios de detalhe: `dados/catalogo/COBERTURA.md` · `dados/estruturado/RELATORIO.md` · `dados/historico/RELATORIO.md` · `dados/dopa/CONFERENCIA.md`.
