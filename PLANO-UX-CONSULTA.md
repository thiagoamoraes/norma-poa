# PLANO-UX-CONSULTA — avaliação exploratória da página de consulta (`docs/index.html`)

Avaliação de 20/11/2026, sem implementação. Servida localmente (porta própria); Chromium/Playwright em 1440x900 e 390x844, claro e escuro. Os JSON de histórico/estruturado, que a página busca em `raw.githubusercontent.com` quando publicada, foram atendidos por interceptação local a partir de `dados/` (a rede externa não foi usada). Persona: revisor técnico, desconfiado, de teclado, não desenvolvedor. Capturas e scripts: `scratchpad/ux-consulta/`.

## 1. Resultado das tarefas típicas

| # | Tarefa | Resultado | Passos | Onde travou |
|---|---|---|---|---|
| 1a | Achar por número/ano | **Sim.** "lc 320", "611", "lei complementar 611/2009", "lei 9113/2003" acham a norma certa em 1 digitação. | 1 | "lei 12/1975" e "lei 611" dão **0 resultado** sem explicação: o prefixo "lei" restringe a tipo 5 e exclui a LC 12/1975 e a LC 611/2009 (a LC 12/1975 é citada nos próprios textos como "Lei nº 12, de 1975"). "320" sozinho devolve LC 320, Lei 320/1949 e Lei 320/1936 na ordem do catálogo, sem priorizar a LC. |
| 1b | Achar por assunto | **Parcial.** "denominar logradouro" → 2.943 resultados, ordenados por BM25 sobre a ementa (muitas leis de denominação de rua com "só ementa"); a LC 320 aparece só na 4ª pesquisa mais específica. "Lei Orgânica" traz primeiro a LC 375/1996 e leis de 1928/1997; a LO vigente (1990) fica fora do topo. | 2-4 | Sem filtro "vigente / em vigor", sem ordenação por data ou tipo; 8 normas "Lei Orgânica nº 1" (1892-1990) com o mesmo número parecem iguais na lista. |
| 2 | Texto vigente de um dispositivo, desde quando vale e por qual lei | **Em parte.** A LC 320 mostra cada dispositivo com "(Redação dada pela Lei Complementar nº 384/1996)". Mas a data é só a da lei alteradora, na lista de versões; o dispositivo não diz "em vigor desde". | 3 | A página não distingue data da lei, publicação e vigência (vacatio). A "Versão 04/10/2022" é a data da LC 958, não necessariamente o início de vigência. |
| 3 | Ver como era numa data passada | **Sim, mas por versão, não por data.** O seletor lista as datas das alteradoras; "Mostrar redações anteriores" mostra o riscado. Não há campo "ver em DD/MM/AAAA". | 2 | Escolher "04/09/1996" não deixa claro que vale "de 04/09/1996 até 23/03/1998"; só há data inicial. |
| 4 | Poder confiar no texto | **Parcial, com contradições** (ver 2.1 e seção 3). Há avisos honestos (histórico incompleto, "não conferido", OCR, revogada), mas o rótulo "texto vigente apurado" aparece inclusive quando o histórico é só o texto original. | — | Ver P1-P4. |
| 5 | Citar/copiar o dispositivo | **Funciona, só com mouse.** Clicar no rótulo copia "§ 1º do art. 2º da Lei Complementar nº 320, de 02/05/1994" (correto, ordem do menor para o maior). | 1 | Rótulo é `<span>` sem foco: **por teclado não dá para copiar**. Sem dica visível de que é clicável (só `title`). O texto copiado não traz a versão ("vigente em…") nem a fonte. |
| 6 | Lei-base ↔ alteradora | **Fraco.** A alteradora cita a lei-base só na ementa (texto livre); não há link "altera: Lei X". Na lei-base, a alteradora aparece como nota de rodapé de dispositivo, sem link, e como link só dentro do aviso "Histórico incompleto". Revogada por inteiro tem link para a revogadora (bom). | 3-5 | Para ir de LC 1.081/2026 à Lei 5.994/1987 é preciso copiar o número da ementa e buscar de novo. |
| 7 | Painel de minuta | **Funciona e é claro.** "alterar" em cada dispositivo leva ao painel; gerou minuta com forma da LC 611 e mensagem "Conferida". | 5 | Só aparece depois de abrir uma lei com histórico (152 de 16.328); fechado por padrão; nome "piloto". "Conferida" é a ida-e-volta do motor, não revisão jurídica; o texto do painel diz isso, o selo verde não. |

Medidas: primeiro resultado 0,96 s localmente (HTML 39 KB + catálogo 5,5 MB sem compressão; 1,1 MB com gzip, que o GitHub Pages aplica). Busca no texto: +4,4 MB (4 fatias), 0,6 s depois de baixar. Conexão lenta (400 kbps, 400 ms): tela ficou em "Carregando o catálogo…" por **110 s**, sem barra de progresso nem uso da página nesse tempo (estimativa com gzip: ~25 s). Largura 390 px: sem rolagem horizontal; mas o painel de detalhe abre abaixo da lista, o aviso e os filtros ocupam a 1ª tela inteira.

## 2. Problemas por severidade

### 2.1 Críticos (induzem a erro sobre o texto de lei)

**P1. "(texto vigente apurado)" sobre histórico que não foi apurado.** LC 611/2009: a lista de versões tem uma só linha, "03/02/2009 — texto original (texto vigente apurado)", e o corpo mostra o texto original como se fosse o vigente; a única pista é o aviso "Lei municipal nº 11.270… o texto desta norma ainda não foi obtido". As alterações que a base não conhece não aparecem em nenhum aviso. LC 895/2020: a página diz "revogada por inteiro pela LC 971/2023" e, logo abaixo, "texto vigente apurado" com o texto completo. Dados: 111 de 152 históricos estão "incompletos" e 1.025 leis têm vínculos sem texto na base (`dados/historico/_resumo.json`). Recomendação: trocar o rótulo por "texto original (nenhuma alteração aplicada)" quando `versoes.length==1` e houver pendência; mostrar "vigente até onde a base alcança" só com histórico completo; em lei revogada, faixa "Revogada — o texto abaixo é o último texto da lei, não está em vigor" e esconder "texto vigente". Esforço: P.

**P2. Aviso de incompletude está no topo, mas o texto não leva marca.** Na LC 320, só alguns dispositivos têm o selo "não conferido" (art. 5, incs. e parágrafo único); o aviso "O texto ORIGINAL desta lei não passou em todas as conferências" (`baseConferida:false`) não diz **quais** dispositivos. Na **busca dentro do texto**, os resultados vêm só do texto vigente "aceito" e **não mostram** o selo "não conferido" (as 4 linhas de `aConferir` da LC 320 entram na busca como certas). Recomendação: levar o selo também à lista de busca e à cópia de referência; no aviso, listar os dispositivos afetados com link âncora. Esforço: M.

**P3. "Conferido" tem três sentidos.** Na página: "texto conferido" (caixa de busca; significa aceito pelas conferências automáticas), "Leitura automática conferida" (faixa verde), "Conferida" (minuta), "não conferido" (selo). Para o revisor, "conferido" significa que **uma pessoa** comparou. Na `revisao.html` existe "aceita por humano", separada da aceitação do motor, mas **a consulta não mostra essa decisão humana**, nem sequer link para a revisão: `index.html` não aponta para `revisao.html` nem `compara.html` (o contrário existe). Recomendação: ver seção 3; nunca usar "conferido" para verificação automática. Esforço: P (texto) + M (mostrar decisão humana).

**P4. Alteradora aparece como "texto estruturado" com faixa verde.** LC 1.081/2026 mostra "Leitura automática conferida…" e o texto da lei alteradora (o pedido de alteração, "Fica incluído inc. X…"), sem dizer que **não é o texto vigente da Lei 5.994/1987** e sem link para a lei-base. Quem busca a Lei 5.994 não encontra o texto vigente (não tem histórico). Recomendação: faixa "Esta é uma lei alteradora: ela altera a Lei nº 5.994/1987 e a LC 942/2022. O texto vigente dessas leis [ainda não está nesta base / está aqui →]". Esforço: M (usar `alteradorasPelaEmenta`/vínculos já existentes).

### 2.2 Altos

**P5. Busca numérica surpreende.** "lei 12/1975", "lei 611", "lei 320" excluem a LC (ver 1a); resultado 0 sem pista. Recomendação: se o tipo falado deu 0, mostrar "Nenhuma Lei nº 12/1975. Existe Lei Complementar nº 12/1975 → abrir"; quando só há número, priorizar tipo LC/Lei Orgânica vigentes e normas com texto sobre "só ementa". Esforço: P.

**P6. Teclado.** O rótulo de dispositivo (copiar referência) não é focável; Enter em item da lista abre a norma, mas o foco fica na lista (o detalhe não recebe foco nem anúncio, apenas `aria-live` sobre o artigo inteiro, que pode ler a lei toda); Tab sai da lista e volta ao corpo da página, nunca ao texto. Não há atalho (`/` para buscar, `j/k`, `c` para copiar). Recomendação: `<button>` no rótulo (ou `tabindex=0` + Enter), foco no `<h2>` ao abrir, `aria-live` só num aviso curto ("Lei Complementar nº 320 aberta"), atalho `/`. Esforço: P-M.

**P7. Datas de versão ambíguas.** O seletor mostra a data da lei alteradora e "após a LC 384"; não há "vigente de… a…", nem aviso de que a vigência pode ser posterior (vacatio, art. de vigência). Recomendação: rótulo "Redação de 04/09/1996 (data da LC 384; confira a vigência na lei)" e, quando o motor extrair a vigência, mostrar as duas datas. Esforço: P (texto) / G (extração de vigência — decisão do mantenedor).

**P8. Carga inicial pesada e opaca.** 5,5 MB (1,1 MB gz) antes de qualquer interação; sem indicador além de "Carregando o catálogo…"; falha vira mensagem seca. A busca no texto baixa 4,4 MB ao marcar a caixa, avisando "cerca de 6 MB" (medido: 4,4 MB sem gzip). Recomendação: `<progress>` com bytes lidos; dividir o catálogo (campos pesados `n[8]` palavras-chave podem sair do primeiro pacote); `Cache-Control` não é configurável no Pages, então guardar em IndexedDB com a data de geração. Esforço: M.

### 2.3 Médios

- **P9. Dependência de `raw.githubusercontent.com/…/main/…`** para histórico e estruturado: se o ramo `main` mudar (a coleta grava toda madrugada) o catálogo e o histórico carregados podem divergir (catálogo "gerado em 20/11" × histórico de outra hora). A página não mostra a data do histórico (existe `geradoEm` no JSON). Mostrar "Histórico gerado em…" e comparar com o do catálogo. Esforço: P.
- **P10. Lista sem contexto de confiança.** Os selos misturam fonte de texto ("texto na fonte", "texto baixado") com estado do motor ("estruturado, a revisar") e do histórico. "texto na fonte" = PDF/arquivo na fonte, mas a página só leva ao arquivo; "texto baixado" idem. Recomendação: legenda curta (ícone "i" ao lado do contador) e filtros por estado, não só "texto estruturado ou histórico". Esforço: P.
- **P11. Lei Orgânica: 8 normas com o mesmo número.** "Lei Orgânica nº 1, de 03/04/1948 / 15/12/1970 / 03/04/1990…" sem sinalizar qual está em vigor. Selo "em vigor segundo a fonte"/"substituída". Esforço: M (precisa decisão).
- **P12. Plano Diretor (LC 1.075/2026)**: texto é promulgação parcial, aparece "não conferida (promulgacao_parcial, rotulo_nao_confere_com_a_origem, bloco_de_alteracao_sem_dono)": códigos internos crus na faixa; ementa com "[Com derrubada de Veto…]" copiada da fonte. Traduzir os motivos (`MOTIVO` só cobre os do histórico). Esforço: P.
- **P13. Cópia do dispositivo** não inclui a versão. Para citar "redação vigente em 2022" o revisor precisa anotar à parte. Opção "Copiar com versão e fonte" (ver seção 5). Esforço: P.

### 2.4 Baixos

- Aviso permanente ocupa ~90 px antes de buscar; no celular empurra a busca para o 2º ecrã (recolher depois da 1ª leitura, guardar em `localStorage`).
- Selo `.75rem` (≈11,5 px) e notas `.78em` abaixo do confortável; contraste ok em claro e escuro.
- No celular, a caixa "Buscar dentro do texto das leis" quebra em duas colunas estreitas.
- Seletor de versão muito longo; sem "anterior/seguinte".
- Texto "só ementa" para leis de 2026 recém-publicadas não explica que a fonte ainda não anexou o arquivo e que o DOPA pode ter o texto.
- Sem URL estável por dispositivo e versão (só `#n=ID`): impossível mandar "art. 4º, versão 1996".

## 3. CONFIANÇA — o que a página deve dizer (texto sugerido)

Por texto exibido, uma linha de proveniência no topo do painel ("De onde vem este texto"), sempre nos mesmos quatro campos: **origem**, **como foi lido**, **o que falta**, **o que vale**.

1. Origem comum: "Texto lido do arquivo publicado na base da Procuradoria-Geral do Município (clique para abrir), baixado em DD/MM/AAAA. O texto que vale é o do Diário Oficial."
2. Lido por programa, sem revisão de pessoa: "Leitura automática aprovada nas verificações do programa (número, data, tipo e sequência de artigos). Nenhuma pessoa leu este texto." (substitui "Leitura automática conferida").
3. Lido e revisado por pessoa (quando houver decisão em `dados/revisao`): "Revisado por pessoa em DD/MM/AAAA. Decisão: aceito como está / com correção de rótulo."
4. Leitura com problemas: "Este texto NÃO passou nas verificações (motivos em linguagem simples). Pode estar incompleto ou mal dividido. Use o arquivo original."
5. Texto de OCR: "Texto reconhecido de documento digitalizado; pode haver letras e sinais trocados. Compare com o arquivo."
6. Histórico completo: "Texto vigente apurado com as N leis alteradoras conhecidas na base: [lista]. Podem existir alterações que a base não conhece; confira no Diário Oficial."
7. Histórico incompleto: "Atenção: o texto abaixo pode não estar em vigor. A base não conseguiu aplicar [LC 449/2000] (motivo). Os dispositivos X, Y, Z podem estar desatualizados."
8. Só texto original: "Esta lei teve alterações que a base não conseguiu obter ou aplicar. O texto abaixo é o ORIGINAL de DD/MM/AAAA, não o vigente."
9. Lei revogada: "Revogada por inteiro pela LC 971/2023, segundo o cadastro da fonte. O texto abaixo é o último texto conhecido; não está em vigor."
10. Alteradora: "Esta lei altera outras leis. O texto vigente das leis alteradas está em: [links]. Não use este texto como redação vigente."
11. Lei sem texto na base: "A base só tem a ementa. Não conseguimos obter o texto; ele existe no Diário Oficial e [no arquivo na fonte, quando houver]."
12. Data da versão: "Redação desta data: dada pela [Lei] de DD/MM/AAAA. Vigência: confira a própria lei (a base não calcula vacatio)."
13. Compilação externa: "A compilação colada em 'Conferir com compilação' é só auxílio. Onde diverge da lei, vale a lei (LC 611/2009, art. 19)."
14. Ao copiar: incluir "Fonte: Norma (experimental), texto apurado em DD/MM/AAAA, versão de DD/MM/AAAA; confira no DOPA."

Regra geral: o verde só para "revisado por pessoa" ou "histórico completo + leitura aprovada"; âmbar para tudo que exige conferência; nunca verde para "aceito pelo motor" isolado.

## 4. Terminologia

| Onde | Problema | Sugestão |
|---|---|---|
| Faixa verde "Leitura automática conferida" / caixa "texto conferido" / minuta "Conferida" | "conferido" sugere revisão humana | "Aprovada nas verificações automáticas" / "texto com leitura aprovada" / "Minuta verificada pelo programa (ida e volta)" |
| Selo "estruturado, a revisar" | jargão; "estruturado" significa "dividido em artigos…" | "texto dividido em artigos — com problemas" |
| Selo "texto na fonte" / "texto baixado" | pouco intuitivo | "arquivo na fonte (não lido)" / "texto obtido, não dividido em artigos" |
| `compara.html`: "só no motor", "diferente", "texto vigente apurado pelo motor" | "motor" é jargão interno (CLAUDE.md usa, o usuário não) | "só no texto apurado pelo Norma" |
| Motivos crus: `promulgacao_parcial`, `rotulo_nao_confere_com_a_origem`, `bloco_de_alteracao_sem_dono`, `comando_recusado` | códigos internos na faixa âmbar | tabela de tradução para todos os códigos de `verificacao.motivos` |
| "(texto vigente apurado)" | correto no termo (não usa "consolidado"), mas "apurado" é pouco familiar | manter e definir em ajuda: "apurado = obtido aplicando, uma a uma, as alterações conhecidas" |
| "Histórico" | vale para "linha do tempo de redações" | "Histórico de redações" |
| "alterar" (botão) | ambíguo ("altera o texto aqui?") | "Propor alteração" |
| "Redigir lei alteradora (piloto)" | confunde com Redação Final (fora de escopo, CLAUDE.md) | "Minuta de projeto de lei alteradora (experimental)" |
| Busca "por palavras… busca por sentido ainda não existe" | linguagem de desenvolvedor | "A busca encontra palavras (e variações); não entende o sentido da frase." |

Verificação: `grep -i 'consolidad|retifica'` em `index.html`, `compara.html`, `revisao.html` não encontra uso indevido no texto da página; as ocorrências ("consolidação" em ementas) são dados da fonte. "Compilação" aparece corretamente só em `compara.html`. Não aparece nome de pessoa nem juízo sobre órgão.

## 5. Três melhorias de maior retorno

**M1. Selo de confiança único por texto + cabeçalho "De onde vem este texto".** (resolve P1-P4, P10, P12; esforço M.) Esboço do painel:
```
Lei Complementar nº 611, de 03/02/2009
[ÂMBAR] Texto ORIGINAL — alterações não aplicadas
  Origem: arquivo da Procuradoria-Geral do Município (baixado 19/11/2026)
  Leitura: aprovada nas verificações automáticas; nenhuma pessoa leu.
  Falta: Lei nº 11.270/2012 (texto não obtido). Pode haver outras.
  Vale: o Diário Oficial.      [Ver como ler este aviso]
```
Estados mutuamente exclusivos calculados num só lugar a partir de `n[5..10]`, `baseConferida`, `naoAplicadas`, `aConferir`, `revogada`, decisões humanas.

**M2. Dispositivo: linha "desde/até" + citação completa + teclado.** (P6, P7, P13; esforço M.) Em cada dispositivo, ao focar/clicar: "Redação dada pela LC 384/1996 · lei de 04/09/1996 · substituída por LC 958/2022". Botão "Copiar citação" (Enter) com a variante "com versão": `art. 4º da Lei Complementar nº 320, de 02/05/1994, na redação da LC 384/1996 (Norma, apurado em 20/11/2026; confira no DOPA)`. Atalho `/` para a busca, `c` copia o dispositivo focado, `[`/`]` troca de versão; campo "Ver em [data]" que escolhe a versão.

**M3. Navegação lei-base ↔ alteradora e busca que explica.** (P4, P5, 1a, 1b, tarefa 6; esforço M.) (a) Na alteradora: "Altera: Lei 5.994/1987 (art. 2º, art. 3º), LC 942/2022 [abrir]"; na lei-base: seção "Leis que a alteraram" com links e data. (b) Busca: "Nenhum resultado para 'lei 12/1975'. Você quis dizer Lei Complementar nº 12/1975?"; filtro "em vigor segundo a fonte" e "com texto lido"; ordem por data em empate. (c) Link no cabeçalho para "Revisão humana" e "Conferir com compilação" e, por norma, "Ver decisão da revisão".

## 6. Perguntas só do mantenedor

1. **Vigência:** a página deve mostrar "data da lei" ou calcular vigência (artigo de vigência/vacatio)? Hoje a versão usa a data da lei alteradora.
2. **Texto "vigente" com histórico incompleto:** aceita rotular como "texto original" (não vigente) quando só há o original? Ou prefere bloquear a exibição de `Art.` sem passar pelo aviso?
3. **Decisão humana (`dados/revisao`)** deve aparecer na consulta pública (ex.: "revisado em…")? Isso mexe na política de dados (nome do revisor não deve aparecer).
4. **Alteradora × lei-base:** ligar pelas ementas (`alteradorasPelaEmenta`) é aceitável como "provável", ou só vínculos da fonte?
5. **Lei revogada por inteiro:** esconder o texto estruturado atrás de "mostrar mesmo assim", ou manter aberto com faixa?
6. **Lei Orgânica (8 registros "nº 1"):** qual é a vigente para destaque? A de 1990 "atualizada até EC 48/2022" é a compilação da fonte ou o texto da LO? Precisa de decisão de terminologia.
7. **Link entre as páginas:** `revisao.html` e `compara.html` são ferramentas do mantenedor ou públicas? Hoje só a revisão aponta para a consulta.
8. **Cópia de referência:** o formato "art. 4º da Lei Complementar nº 320, de 02/05/1994" é o padrão desejado (LC 611, art. 12?) ou prefere "Lei Complementar nº 320/1994"?
9. **Peso da página:** aceitar IndexedDB/cache local de 5,5 MB (1,1 MB gz) ou dividir o catálogo e perder a busca instantânea em 16 mil normas?
10. **"Redigir lei alteradora"** deve permanecer na consulta ou passar a página própria, dado que a Redação Final é fluxo separado?
