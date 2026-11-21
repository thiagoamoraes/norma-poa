# Situação do acervo

Gerado em 2026-11-21T09:25:33.494Z por `ingestao/situacao.mjs`. Não editar à mão.

**Estado: EM CARGA**

## O que fazer agora

- 351 norma(s) aguardam revisão da leitura automática (motivo mais frequente: `rotulo_nao_confere_com_a_origem`, 224): ROTEIRO.md, tarefa 1.
- 161 histórico(s) incompleto(s) e 0 com erro: ROTEIRO.md, tarefa 4.
- 11 arquivo(s) baixado(s) sem extração de texto (formato não suportado ou falha): conferir `dados/textos/sapl/_indice.jsonl`.

## Critérios de "em dia"

| | Critério | Situação |
|---|---|---|
| ✓ | Catálogo completo (todos os tipos do escopo) | tipo 1: completo · tipo 2: completo · tipo 5: completo · tipo 6: completo |
| ✓ | Vínculos completos | completos |
| ✗ | Fila de textos vazia | 7281 arquivo(s) a baixar |
| ✓ | Últimas 3 execuções sem erro | 0 com erro entre as últimas 3 |
| ✓ | Normas do Diário Oficial já presentes no catálogo (publicadas há mais de 7 dias) | nenhuma pendente |

Ritmo: 1121 arquivo(s) baixados nos últimos 7 dias (cerca de 224 por dia ativo); previsão de esvaziar a fila: **cerca de 33 dia(s)**, se o ritmo se mantiver.

## Números

- Fila de textos: 7281 · situações dos arquivos já tratados: ok 1083 · texto_curto 26 · formato_sem_extracao 11 · erro_definitivo 1 · baixado 1
- Estruturação: 758 aceita(s), 351 em revisão (68.3% de aceitação)
- Histórico: 1192 lei(s) com alteradoras conhecidas; 42 completa(s), 161 incompleta(s), 989 aguardando o texto da lei-base
- Diário Oficial: 0 ausente(s) do catálogo há mais de 7 dias; 1 ato(s) que só o Diário traz
- Tamanho de `dados/` + `docs/`: 170 MB

## Últimas execuções da rotina

| Quando (UTC) | Disparo | Duração | Erros | Etapas |
|---|---|---|---|---|
| 2026-11-21T09:25:33Z | workflow_dispatch | 319 min | 0 | novidades: ok, dopa: ok, catalogo: ok, vinculos: ok, textos: ok |
| 2026-11-20T09:25:06Z | workflow_dispatch | 318 min | 0 | novidades: ok, dopa: ok, catalogo: ok, vinculos: ok, textos: ok |
| 2026-11-19T09:26:05Z | workflow_dispatch | 319 min | 0 | novidades: ok, dopa: ok, catalogo: ok, vinculos: ok, textos: ok |
| 2026-11-18T09:25:55Z | workflow_dispatch | 318 min | 0 | novidades: ok, dopa: ok, catalogo: ok, vinculos: ok, textos: ok |
| 2026-11-17T17:22:09Z | schedule | 238 min | 1 | novidades: ok, dopa: ok, catalogo: ok, vinculos: ok, textos: erro |

Relatórios de detalhe: `dados/catalogo/COBERTURA.md` · `dados/estruturado/RELATORIO.md` · `dados/historico/RELATORIO.md` · `dados/dopa/CONFERENCIA.md`.
