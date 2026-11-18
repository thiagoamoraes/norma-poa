# Em andamento: sem_fecho (tarefa 1)

Iniciada em 18/11/2026. Só análise por enquanto; nada alterado. Não commitar na main durante a coleta (até ~07:00 BRT).

## Achado (18/11/2026) — 23 `sem_fecho`
- Nenhum é falha de regex que se corrija sem afrouxar a conferência:
  - ~16 digitalizações dos anos 1930–1990 (OCR ruim: "TO de agosto", "MAJO", "L E G R E", "[4 /)DE"): defeito de fonte, ficam em revisão;
  - 35930 (EC 27/2008): "GABINETE DAPRESIDÊNCIA…" — palavra colada pela extração; pertence à tarefa pdftotext × pdfjs (ROTEIRO, tarefa 1, tabela), não ao fecho;
  - 36064 (EC 28/2009): fecho "Porto Alegre, 20 de março de 2009." (sem instituição, assinaturas na mesma linha) — UMA ocorrência real, forma nova: decisão do mantenedor;
  - 27784: o fecho é reconhecido pelo core; o motivo no relatório vinha de ordem de estágio (verificar depois da coleta).
