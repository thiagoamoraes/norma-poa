# PLANO-UX-2 — rodada 60 (21/11/2026)

Insumo: `PLANO-UX-CONSULTA/REVISAO/ACESSIBILIDADE.md` (já feitas: rodadas 32–34 e 56) + capturas de 21/11 (Playwright, dados reais: ids 17878, 49145, 37042). Decisões 53–56 (CLAUDE.md).

Achados nas capturas: (1) LC 12: o aviso de 28 alteradoras ocupa >1 tela antes do texto; (2) sem sumário nem link por dispositivo; (3) revisão a 1280x720: cabeçalho ~300 px, botões de decisão abaixo da dobra; "data 2010-12-07" em ISO; "leitor"/"motor"; (4) comparação: lista de leis com 6 linhas e corte, botão desabilitado ilegível; (5) faixa verde "Leitura automática conferida".

Ordem: A vocabulário e ajustes comuns (HTML/CSS) → B aviso resumido, sumário, link por dispositivo → C alteradora ↔ lei-base → D revisão (cabeçalho compacto, barra fixa, N/P).
Teste: `teste_paginas.mjs` (Playwright, serve do disco; pula sem Playwright) que falha no código antigo. Sem mudar core, dados de decisão nem estruturador.
