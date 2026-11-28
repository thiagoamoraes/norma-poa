# Situação do acervo

Gerado em 2026-11-28T06:30:17.145Z por `ingestao/situacao.mjs`. Não editar à mão.

**Estado: EM CARGA**

## O que fazer agora

- 451 norma(s) aguardam revisão da leitura automática (motivo mais frequente: `rotulo_nao_confere_com_a_origem`, 258): ROTEIRO.md, tarefa 1.
- 212 histórico(s) incompleto(s) e 0 com erro: ROTEIRO.md, tarefa 4.
- 1 arquivo(s) tiveram o download adiado por falha da fonte (`falha_temporaria` em `dados/textos/sapl/_indice.jsonl`); são tentados de novo sozinhos. Só é preciso agir se o número crescer noite após noite.
- 17 arquivo(s) baixado(s) sem extração de texto (formato não suportado ou falha): conferir `dados/textos/sapl/_indice.jsonl`.

## Critérios de "em dia"

| | Critério | Situação |
|---|---|---|
| ✓ | Catálogo completo (todos os tipos do escopo) | tipo 1: completo · tipo 2: completo · tipo 5: completo · tipo 6: completo |
| ✓ | Vínculos completos | completos |
| ✗ | Fila de textos vazia | 4776 arquivo(s) a baixar |
| ✓ | Últimas 3 execuções sem erro | 0 com erro entre as últimas 3 |
| ✓ | Normas do Diário Oficial já presentes no catálogo (publicadas há mais de 7 dias) | nenhuma pendente |

Ritmo: 2507 arquivo(s) baixados nos últimos 7 dias (cerca de 358 por dia ativo); previsão de esvaziar a fila: **cerca de 14 dia(s)**, se o ritmo se mantiver.

## Números

- Fila de textos: 4776 · situações dos arquivos já tratados: ok 3584 · texto_curto 26 · formato_sem_extracao 17 · erro_definitivo 1 · baixado 1 · falha_temporaria 1
- Estruturação: 3159 aceita(s), 451 em revisão (87.5% de aceitação)
- Histórico: 1192 lei(s) com alteradoras conhecidas; 75 completa(s), 212 incompleta(s), 905 aguardando o texto da lei-base
- Diário Oficial: 0 ausente(s) do catálogo há mais de 7 dias; 2 ato(s) que só o Diário traz
- Tamanho de `dados/` + `docs/`: 172 MB

## Últimas execuções da rotina

| Quando (UTC) | Disparo | Duração | Erros | Etapas |
|---|---|---|---|---|
| 2026-11-28T06:30:16Z | workflow_dispatch | 326 min | 0 | novidades: ok, dopa: ok, catalogo: ok, vinculos: ok, textos: ok |
| 2026-11-27T09:19:01Z | workflow_dispatch | 161 min | 0 | textos: ok |
| 2026-11-27T06:29:50Z | workflow_dispatch | 326 min | 0 | novidades: ok, dopa: ok, catalogo: ok, vinculos: ok, textos: ok |
| 2026-11-26T09:19:53Z | workflow_dispatch | 161 min | 0 | textos: ok |
| 2026-11-26T06:29:43Z | workflow_dispatch | 326 min | 0 | novidades: ok, dopa: ok, catalogo: ok, vinculos: ok, textos: ok |
| 2026-11-25T09:26:30Z | workflow_dispatch | 319 min | 0 | novidades: ok, dopa: ok, catalogo: ok, vinculos: ok, textos: ok |
| 2026-11-24T09:30:06Z | workflow_dispatch | 319 min | 0 | novidades: ok, dopa: ok, catalogo: ok, vinculos: ok, textos: ok |

Relatórios de detalhe: `dados/catalogo/COBERTURA.md` · `dados/estruturado/RELATORIO.md` · `dados/historico/RELATORIO.md` · `dados/dopa/CONFERENCIA.md`.
