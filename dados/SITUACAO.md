# Situação do acervo

Gerado em 2026-11-18T09:25:56.153Z por `ingestao/situacao.mjs`. Não editar à mão.

**Estado: EM CARGA**

## O que fazer agora

- 94 norma(s) aguardam revisão da leitura automática (motivo mais frequente: `trecho_nao_localizado_na_origem`, 52): ROTEIRO.md, tarefa 1.
- 22 histórico(s) incompleto(s) e 0 com erro: ROTEIRO.md, tarefa 4.
- 3 arquivo(s) baixado(s) sem extração de texto (formato não suportado ou falha): conferir `dados/textos/sapl/_indice.jsonl`.

## Critérios de "em dia"

| | Critério | Situação |
|---|---|---|
| ✓ | Catálogo completo (todos os tipos do escopo) | tipo 1: completo · tipo 2: completo · tipo 5: completo · tipo 6: completo |
| ✗ | Vínculos completos | página 121 de 263 |
| ✗ | Fila de textos vazia | 8072 arquivo(s) a baixar |
| ✗ | Últimas 3 execuções sem erro | 1 com erro entre as últimas 2 |
| ✓ | Normas do Diário Oficial já presentes no catálogo (publicadas há mais de 7 dias) | nenhuma pendente |

Ritmo: 331 arquivo(s) baixados nos últimos 7 dias (cerca de 166 por dia ativo); previsão de esvaziar a fila: **cerca de 49 dia(s)**, se o ritmo se mantiver.

## Números

- Fila de textos: 8072 · situações dos arquivos já tratados: ok 327 · formato_sem_extracao 3 · texto_curto 1
- Estruturação: 234 aceita(s), 94 em revisão (71.3% de aceitação)
- Histórico: 1134 lei(s) com alteradoras conhecidas; 9 completa(s), 22 incompleta(s), 1103 aguardando o texto da lei-base
- Diário Oficial: 0 ausente(s) do catálogo há mais de 7 dias; 0 ato(s) que só o Diário traz
- Tamanho de `dados/` + `docs/`: 62 MB

## Últimas execuções da rotina

| Quando (UTC) | Disparo | Duração | Erros | Etapas |
|---|---|---|---|---|
| 2026-11-18T09:25:55Z | workflow_dispatch | 318 min | 0 | novidades: ok, dopa: ok, catalogo: ok, vinculos: ok, textos: ok |
| 2026-11-17T17:22:09Z | schedule | 238 min | 1 | novidades: ok, dopa: ok, catalogo: ok, vinculos: ok, textos: erro |

Relatórios de detalhe: `dados/catalogo/COBERTURA.md` · `dados/estruturado/RELATORIO.md` · `dados/historico/RELATORIO.md` · `dados/dopa/CONFERENCIA.md`.
