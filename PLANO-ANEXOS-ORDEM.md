# PLANO — Frente de anexos e tabelas: ordem de execução (consolida F0, F1, F2 e F3)

Consolidação da sessão principal (21/11/2026) dos quatro planos de planejamento: `PLANO-ANEXOS-F0-ORCAMENTO.md`, `PLANO-ANEXOS-F1-TABELA-COM-MARCADOR.md`, `PLANO-ANEXOS-F2-ANEXO-NA-ARVORE.md`, `PLANO-ANEXOS-F3-COMANDOS.md` (mais `PLANO-ANEXOS-E-TABELAS.md`). Os planos são **insumo, não decisão** (regra 12): nada daqui vira código sem as decisões do mantenedor (regra 11) e sem exemplo real (regra 1).

## 1. O que os quatro planos juntos mostram
1. **O que há de valor imediato é correção de erro silencioso, não funcionalidade nova:** (a) falso `replace_text` de "art. 18" em lista anexa (31027, 32301; F3); (b) o detector de anexo alterado da decisão 37 acha só 106 de 174 artigos e perde "Anexo 1.2", Tabela, Lista, Quadro e revogação por incisos (F2, F3); (c) revogação no plural ("Ficam revogados/revogadas") nunca é lida: 95 artigos em 91 normas, 84 recentes, todos `nao_classificado` e **sem aviso** (F2, F3); (d) leis orçamentárias e outras citam "Anexo … desta Lei" e o arquivo não traz o anexo, aceitas sem aviso (3 de 3 orçamentárias de 2026; F0); (e) falso aceite que o nó `tabela` criaria na LC 420/1998 se vier sem o detector de 2+ colunas (F1).
2. **Faltam dados para aplicar qualquer coisa:** não existe par real (alteradora com anexo legível × lei-alvo com nó de anexo e rótulo igual); a LC 7/1973 é `.doc` sem extração (21 normas citam anexo/tabela dela); leis orçamentárias e a maioria das ordinárias não têm texto; os anexos orçamentários talvez nem estejam no arquivo que a fonte entrega (H1/H3). Pela regra 1, **substituição e revogação de anexo inteiro ficam bloqueadas**.
3. **O nó `tabela` com marcador não muda o veredito de nenhuma norma recente hoje** (0 recentes; 15 tabelas em 4 antigas; 2 recentes só dentro de bloco). É estrutural, para antigas e futuras ordinárias/orçamentárias.
4. **Prazo duro:** a lista de prioridade de download (F0, opção B) precisa de commit antes das 04:00 UTC de 22/11 para valer na coleta dessa noite; sem ela, as 5 orçamentárias chegam sozinhas em 22–23/11, mas uma falha as empurra ~30 noites.

## 2. Ordem proposta (dependências)
**Bloco 0 — prazo (decisão P1):** lista de prioridade de download (`prioridade-download.txt`, 4º argumento de `filaDeDownload`, ~8 linhas em `baixar-textos.mjs`, 3 asserções em `teste_textos_sapl.mjs`, CHANGELOG). Mudança de ingestão, não de motor.

**Bloco A — correções de erro silencioso, sem mexer no modelo de dados (decisões curtas):**
- A1 detector de anexo alterado correto (`extrairAlvosDeAnexo`/regex: "Anexo 1.2", Tabela, Lista, Quadro, incisos de "Ficam revogados") — F3.1 e F2.A1.
- A2 guarda contra o falso `replace_text` de lista anexa (31027, 32301) — F3.2.
- A3 **rodada própria de revogação plural e em lista** ("Ficam revogados/revogadas", incisos filhos) — F3.3; é lacuna geral do motor, maior que anexos.
- A4 anexo citado e ausente do arquivo (3 orçamentárias aceitas sem aviso): motivo ou aviso (decisão P5).
- A5 consulta: anexo do ramo estruturado como `<details><pre>` e fora da busca — F2.A2.
- A6 detector de 2+ colunas em `tabela_no_corpo` (F1.F2b; custo medido +1 antiga, 0 recentes).

**Bloco B — anexo na árvore e no histórico (core + espelho; decisões 1, 2, 3, 7, 8, 9 do F2):** F2.B (`versao.anexos[]`, `slugDoRotulo('anexo')`, laço de anexos no histórico, rótulo repetido `~N`), F2.C (consulta: bloco colapsável, selos, ressalva do rótulo), F2.D (`aConferir` por nó).

**Bloco C — comandos:** F3.2 `altera_anexo` (operação nova, detectada e não aplicada) e F3.4 ligação ao anexo da alteradora; **F2.E inclusão de anexo inteiro** (só 40830→39422 e 48437→43937 são testáveis de ponta a ponta). Substituição (F2.F), revogação (F2.G, F3.6), alteração de linha/célula/item: **bloqueadas** (regra 1 e decisões 1–7 do F3).

**Bloco D — nó `tabela` com marcador (F1.F0–F1):** só depois de A6 (2+ colunas) e das guardas nos consumidores (F1.F3); o core é o último interruptor. Entrevista D1–D11 do F1.

**Bloco E — dados para destravar a aplicação:** Fase 0 de orçamento (esperar 22–23/11), extração `.doc` da LC 7/1973 (id 17478), cabeçalho "Anexo N à Lei Complementar nº N" da LC 626, flag `anexosDaBase`.

## 3. Entrevista (regra 11), em rodadas de até 4 perguntas
- **Rodada 1 (agora):** P1 prioridade de download; F1 D1/D3 (fazer o nó `tabela` agora, com 2+ colunas antes); A3 abrir a rodada de revogação plural; P5 anexo citado e ausente (reprovar ou avisar).
- **Rodada 2 (anexo na árvore, F2):** substituição troca o bruto do nó? o que prova "inteiro"? anexo incluído gráfico/ausente? posição do anexo novo? rótulo de confiança e consulta (colapsado, busca)?
- **Rodada 3 (comandos, F3):** forma "alterada a Tabela II … conforme Anexo I" (verbo × conteúdo); item/linha dentro de tabela; revogação de anexo/tabela; ligação ao anexo da alteradora; listas repetitivas (efemérides: 30 normas).
- **Rodada 4 (depois da Fase 0):** valores e unidade de versão das leis orçamentárias (P2, P3), anexo em outro arquivo (P6), armazenamento (P7), DOCX (P8), vigência por exercício (P9), escopo (P10), `.doc` da LC 7.
