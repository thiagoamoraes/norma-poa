# Situação do acervo

Gerado em 2026-11-20T09:25:06.434Z por `ingestao/situacao.mjs`. Não editar à mão.

**Estado: EM CARGA**

## O que fazer agora

- 308 norma(s) aguardam revisão da leitura automática (motivo mais frequente: `rotulo_nao_confere_com_a_origem`, 174): ROTEIRO.md, tarefa 1.
- 117 histórico(s) incompleto(s) e 0 com erro: ROTEIRO.md, tarefa 4.
- 10 arquivo(s) baixado(s) sem extração de texto (formato não suportado ou falha): conferir `dados/textos/sapl/_indice.jsonl`.

## Critérios de "em dia"

| | Critério | Situação |
|---|---|---|
| ✓ | Catálogo completo (todos os tipos do escopo) | tipo 1: completo · tipo 2: completo · tipo 5: completo · tipo 6: completo |
| ✗ | Vínculos completos | página 241 de 263 |
| ✗ | Fila de textos vazia | 7568 arquivo(s) a baixar |
| ✓ | Últimas 3 execuções sem erro | 0 com erro entre as últimas 3 |
| ✓ | Normas do Diário Oficial já presentes no catálogo (publicadas há mais de 7 dias) | nenhuma pendente |

Ritmo: 834 arquivo(s) baixados nos últimos 7 dias (cerca de 209 por dia ativo); previsão de esvaziar a fila: **cerca de 37 dia(s)**, se o ritmo se mantiver.

## Números

- Fila de textos: 7568 · situações dos arquivos já tratados: ok 818 · formato_sem_extracao 10 · texto_curto 5 · erro_definitivo 1 · baixado 1
- Estruturação: 515 aceita(s), 308 em revisão (62.6% de aceitação)
- Histórico: 1177 lei(s) com alteradoras conhecidas; 35 completa(s), 117 incompleta(s), 1025 aguardando o texto da lei-base
- Diário Oficial: 0 ausente(s) do catálogo há mais de 7 dias; 1 ato(s) que só o Diário traz
- Tamanho de `dados/` + `docs/`: 98 MB

## Últimas execuções da rotina

| Quando (UTC) | Disparo | Duração | Erros | Etapas |
|---|---|---|---|---|
| 2026-11-20T09:25:06Z | workflow_dispatch | 318 min | 0 | novidades: ok, dopa: ok, catalogo: ok, vinculos: ok, textos: ok |
| 2026-11-19T09:26:05Z | workflow_dispatch | 319 min | 0 | novidades: ok, dopa: ok, catalogo: ok, vinculos: ok, textos: ok |
| 2026-11-18T09:25:55Z | workflow_dispatch | 318 min | 0 | novidades: ok, dopa: ok, catalogo: ok, vinculos: ok, textos: ok |
| 2026-11-17T17:22:09Z | schedule | 238 min | 1 | novidades: ok, dopa: ok, catalogo: ok, vinculos: ok, textos: erro |

Relatórios de detalhe: `dados/catalogo/COBERTURA.md` · `dados/estruturado/RELATORIO.md` · `dados/historico/RELATORIO.md` · `dados/dopa/CONFERENCIA.md`.
