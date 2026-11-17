# Em andamento: tarefa 1 (cabecalho_nao_reconhecido)

Iniciada em 17/11/2026. Investigando 60 normas em revisao. Nada alterado ainda.

## Achado (17/11/2026)
- Dos 60 `cabecalho_nao_reconhecido`, ~35 são Emenda à Lei Orgânica (tipoSapl 2): o core só devolve `tipoNaoSuportado` e `TIPO_ATO_ESPERADO` (ingestao/estrutura.mjs) não tem o tipo. Há exemplos reais agora (EC 17–51).
- Outros: varreduras antigas de baixa qualidade (PROC./timbre da Câmara, texto de OCR ruim) → defeito de fonte, ficam em revisão.
- Baseline antes: ver bateria no scratchpad (core 153, estrutura 28, etc.).
- Plano: (1) extrair número/data da Emenda no core (aditivo, após o bloco de Resolução); (2) mapear tipoSapl 2 em estrutura.mjs; (3) fixtures reais + testes que falham antes; (4) VERSAO_ESTRUTURADOR 4; (5) bateria, CHANGELOG, merge na main fora da janela da coleta.
