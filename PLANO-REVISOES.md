# PLANO-REVISOES — o que precisa de revisão e o que a IA pode fazer sem humano (27/11/2026)

Pedido do mantenedor: levantar **todas as revisões necessárias**, começando pelas **recentes** (sancionadas a partir da LC 611, 03/02/2009), separar o que pode ser resolvido por IA **sem intervenção humana** do que exige revisão **ponto a ponto**, e decidir com ele por entrevista (regra 11). Antigas: problemas de interpretação, cotejo com a compilação.

## Fila medida em 27/11/2026 (docs/dados/revisao/fila.json; estruturador v30)
Recentes a revisar: **132** (2.677 aceitas). Pontos a conferir: 0 → 78 normas · 1–3 → 33 · 4–20 → 16 · >20 → 5. Antigas a revisar: **295**.
Motivos nas recentes: rótulo não confere 49 · data diverge do catálogo 28 · promulgação parcial 19 · sem fecho 15 · cabeçalho não reconhecido 12 · bloco sem fechamento de aspas 11 · fecho com texto demais 10 · sem artigos 10 · trecho não localizado 8 · número diverge 7 · bloco sem dono 6 · texto fora da árvore 6 · aspa de abertura ausente 5 · tabela no corpo 5 · alteração sem aspas não delimitada 4 · endereço repetido 3.
Outra frente de revisão: **histórico incompleto** (207 leis; alteradoras não aplicadas, comandos recusados) e 914 leis aguardando o texto da lei-base.

## Agentes (somente leitura; relatório em scratchpad/levantamento/)
A rótulo_nao_confere (recentes) · B data/número divergem do catálogo · C promulgação parcial, sem fecho, cabeçalho, sem artigos · D blocos de alteração, tabela, fecho com texto demais, trecho não localizado, fora da árvore, endereço repetido · E antigas (295) · F histórico incompleto (recentes).
Cada um classifica cada norma em: **1** resolvível por regra determinística sem humano · **2** IA propõe e humano só amostra · **3** humano ponto a ponto · **4** defeito da fonte (nada a fazer). Entrega: causa real verificada por norma, famílias com contagem, regra proposta (gatilho, trava, risco de falso aceite, teste real, impacto), e perguntas prontas para a entrevista.
Regras: o relatório é insumo, não autoridade (regra 12c): as afirmações que sustentam decisão são reconferidas pela sessão principal.

## Pontos para a entrevista (regra 11), já identificados
1. **IA no pipeline:** "IA só escreve código, nunca roda no pipeline" (CLAUDE.md). Uma "IA que confere e propõe decisão" ficaria **fora** do pipeline, como camada de proposta à parte, marcada como proposta de IA. Ela pode contar como "aceita"? (a decisão 19 grava só data e hora.)
2. **Cotejo com o leis.org × "vale o texto da lei"** (decisão de 17/11/2026; LC 611, art. 19: compilação não tem processo legislativo): o mantenedor agora diz que o leis.org é o instrumento oficial contratado para compilações. Isso muda a decisão? Mostrar as duas versões em paralelo onde divergem.
3. Limites do que é automatizável em cada família (decisões 2, 9–12, 27, 33, 38, 44 seguem valendo até nova decisão).

## Cotejo com o leis.org — o que dá e o que não dá para fazer
**Não será feito:** coleta automatizada que **simule uso humano para contornar o robots.txt** ou bloqueio de robôs do portal. Contornar um bloqueio declarado pelo site (e talvez cláusula do contrato/termos) não é coisa que eu construa; além disso, o portal é pago pelo poder público e a regra do projeto já diz que portais privados não são fonte de coleta automática.
**O que dá, dentro do permitido:**
- (a) **Pedir ao provedor, pelo canal institucional** (a Câmara/Prefeitura são as contratantes), uma exportação em lote ou API para as leis do acervo; é o caminho com cobertura completa e sem risco;
- (b) **coleta manual assistida pelo mantenedor** (ele abre e salva as compilações no navegador dele, no ritmo humano e conforme os termos do contrato), e o sistema **só ingere os arquivos que ele coloca numa pasta**;
- (c) lado do sistema (construível agora): ingestão em lote de compilações fornecidas, leitura por dispositivo, **análise independente do histórico** do Norma × compilação e **lista de divergências com as duas versões lado a lado** (estende `compara.html`/`revisao-compilacao.mjs`).
- **Os textos compilados não vão para o git** (repositório público; direitos do provedor): ficam em pasta local ignorada; só o relatório de divergências (ids, dispositivos, trechos curtos) pode ser versionado.
