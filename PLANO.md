# PLANO — acervo normativo de Porto Alegre em dados estruturados

Documento vivo. Cada fase tem entrega, critério de aceite e estado. Atualizar o
estado ao fim de cada sessão de trabalho; decisões novas entram na seção 5.

## 1. Objetivo e escopo

Ter todas as normas do escopo catalogadas, com texto bruto guardado, árvore de
dispositivos estruturada e, por fim, texto vigente apurado — com rastro de
proveniência em cada etapa e nenhuma norma sumindo em silêncio.

**Escopo da fase inicial** (decidido em 16/11/2026): Lei Orgânica e suas
emendas, leis complementares e leis ordinárias (≈ 16,3 mil normas).
**Depois, se não atrapalhar:** Resolução de Mesa e Ordem de Serviço do
Legislativo. **Fora por ora:** decretos e demais tipos.

## 1-A. Usos-alvo (definidos em 16/11/2026)

1. **Busca semântica** sobre os textos legislativos.
2. **Minuta de projeto alterador** a partir do texto vigente.
3. **Captura automática** da legislação recente, sem intervenção manual.

O que esses usos exigem e o código ainda não tem (revisão de 16/11/2026, com o
parser rodado sobre 15 arquivos reais do SAPL, de 1990 a 2026):

| Requisito | Situação hoje | Fase |
|---|---|---|
| Identificador estável por dispositivo (norma + caminho `desFixo`) | `id` é contador de sessão (`n1`, `n2`…); `serializarArvore` renumera por posição | 5 |
| Extração de texto por formato com nota de qualidade | Só PDF nativo do DOPA/SEI; PDFs de 2011 saem com espaços quebrados, os de 1990 com OCR ruim, os anteriores são imagem | 3 |
| Cabeçalho, ementa e fecho robustos | Em 15 arquivos reais: cabeçalho reconhecido em 4 de 6 leis; a linha da epígrafe vaza para a ementa; fecho perdido em parte | 5 |
| Verificação de ida e volta | Não existe; texto não reconhecido é colado no último dispositivo, sem alarme | 5 |
| Anexos e tabelas | Não tratados | 5 |
| Vigência por dispositivo (início/fim) | Só `origem` da última alteração | 6 |
| Índice de busca (texto + vetores) por dispositivo vigente | Não existe | 10 |
| Gerador de comando alterador (inverso do extrator) | Não existe; `suggestDesFixo` é o embrião | 11 |

## 2. Fontes (verificadas em 16/11/2026)

| Fonte | O que dá | Limite |
|---|---|---|
| SAPL da PGM (`legislacao.portoalegre.rs.gov.br/api/`) | Catálogo de 51.729 normas desde 1886, metadados, 26.237 vínculos (altera/revoga), arquivos de texto. API JSON aberta; conteúdo sob CC BY-SA 4.0. Em dia para leis e LCs de 2026. | ~47% dos registros sem texto (concentrado antes de 2000); não compila; `data_vigencia` vazio; `robots.txt` pede 60 s entre requisições. |
| DOPA (API Procempa) | Texto oficial do que é publicado; inclui atos internos da Câmara. | Só lista os últimos 5 dias → serve para a rotina diária, não para o histórico. |
| leis.org / Leis Municipais | Portal privado de referência, com texto compilado. | **Não é fonte de coleta automática** deste projeto. Serve apenas de leitura humana para conferência pontual. |

Texto oficial é o do DOPA. As demais fontes são informativas.

## 3. Etiqueta de coleta (regra dura)

- Requisições sequenciais, nunca em paralelo; `User-Agent` identificado.
- SAPL: no mínimo 60 s entre requisições (o coletor recusa menos); 100 registros por página.
- Em erro: até 2 novas tentativas espaçadas; persistindo, parar com estado salvo.
- Blocos longos fora do horário de expediente.
- Nunca contornar proteção de acesso de nenhum site (desafio de navegador, captcha, login).

## 4. Fases

| # | Fase | Entrega | Critério de aceite | Estado |
|---|---|---|---|---|
| 0 | Base | `rodada-11` no branch de trabalho; este plano | Bateria do core sem regressão | feito |
| 1 | Catálogo do escopo | `dados/catalogo/sapl/tipo-{1,2,6,5}.jsonl`; `COBERTURA.md`; `sem-texto.tsv` | Registros únicos = total declarado pela API, por tipo | LOM, emendas e LCs concluídos; leis em andamento |
| 2 | Vínculos | `dados/catalogo/sapl/vinculos.jsonl` (≈ 265 páginas) | Total = declarado; toda ponta resolvida para um `idSapl` ou listada como fora do escopo | a fazer |
| 3 | Texto bruto | Arquivo original imutável por norma + hash; texto extraído por formato (PDF nativo, OCR local, HTML SIREL, DOCX) | Toda norma com `texto.situacao ≠ sem_texto` tem arquivo e texto extraído, ou motivo registrado | a fazer |
| 4 | Fila de lacunas | Normas sem texto ordenadas por relevância (normativa × efeito concreto; com vínculos primeiro) para busca manual do texto, um a um | Lista revisada pelo mantenedor | a fazer |
| 5 | Estruturação | `dados/estruturado/sapl/<id>.json`: dispositivos com endereço estável + verificação (`ingestao/estrutura.mjs`); `RELATORIO.md` com taxa de aceitação e fila de revisão | Só é aceita a norma cujo cabeçalho bate com o catálogo, sem salto de artigo, com rótulos iguais aos da origem e sem texto fora da árvore | no ar, roda toda noite sobre os textos baixados; próximo passo: atacar os motivos de revisão mais frequentes do relatório |
| 6 | Comandos e texto vigente | Comandos das alteradoras aplicados em ordem cronológica, uma versão por alteradora | Toda aresta "altera" do SAPL tem ≥ 1 comando e vice-versa; divergências viram lista de revisão | motor medido numa lei real (seção 4-B); falta rodar no acervo, o que depende dos vínculos e dos textos |
| 7 | Captura automática diária | GitHub Actions agendado: SAPL como gatilho (1ª página de cada tipo do escopo, 4 requisições/dia) → baixa o arquivo → estrutura → commit. DOPA como conferência e como fonte dos atos internos da Câmara. Sem IA. | Norma nova aparece no repositório em até 1 dia; divergência SAPL × DOPA vira alerta | no ar (seção 4-A) |
| 8 | Gabarito | ≈ 200 normas estratificadas por época e tipo, conferidas manualmente | Régua permanente de qualidade | a fazer |
| 6-A | Histórico por lei | `dados/historico/sapl/<id>.json`: versões e linha do tempo de cada dispositivo; na página, seletor de versão, anotação de origem, destaque do que mudou, redações anteriores | Alteradora não aplicada por inteiro é declarada, e os dispositivos que ela cita aparecem como "não conferido" a partir da data dela | piloto no ar com a LC 320 (9 versões); em escala quando vínculos e textos chegarem |
| 10-A | Página de consulta | `docs/` (GitHub Pages): busca por número e palavras da ementa, filtros, texto estruturado, cópia de referência a dispositivo | Abre no celular e no computador; aponta sempre para a fonte | no ar (busca textual) |
| 10 | Busca semântica | Um registro por dispositivo vigente, com contexto (norma, ementa, agrupadores, caput); busca textual + vetorial; filtros por tipo, assunto e vigência | Conjunto de perguntas de teste com resposta esperada | a fazer |
| 11 | Minuta de alteradora | Dado o dispositivo-alvo e a nova redação, gerar o artigo alterador na forma da LC 611/2009 (citação completa da lei, bloco entre aspas, "(NR)", sufixo de letra em inserção) | Reaplicar o comando gerado pelo próprio extrator reproduz a redação pedida | a fazer |
| 9 | Atos internos da Câmara | Resolução de Mesa e OS do Legislativo: DOPA daqui para frente; histórico por pedido | — | estacionado |

Ordem de execução: 1 → 2 → 3 → (4 em paralelo) → 5 → 6 → 10 e 11. A fase 7 pode
começar logo depois da 1 (só depende do catálogo); a 8, assim que a 3 estiver de pé.

Medido no catálogo: em 2026 o SAPL cadastra leis e LCs no mesmo dia da
publicação (mediana de atraso: 0 dia; 12 de 262 com 3 dias ou mais).

## 4-A. Rotina automática (fase 7) — como funciona

Arquivo: `.github/workflows/coleta-diaria.yml` → `ingestao/rotina.sh`. Roda
todo dia às 04:17 UTC (01:17 em Porto Alegre), a partir da `main`, sem IA.

Uma única fila de requisições ao SAPL, 1 por minuto, nesta ordem:

1. **Novidades** (`catalogo-sapl.mjs --novidades`): lê o topo da listagem de
   cada tipo do escopo (4 requisições) e grava o que é novo ou foi alterado.
2. **Conferência com o DOPA** (`conferencia-dopa.mjs`): lê o índice dos
   cadernos dos últimos 5 dias e escreve `dados/dopa/CONFERENCIA.md` — normas
   publicadas e ainda ausentes do catálogo, e atos que só o DOPA traz
   (Resolução de Mesa, Ordem de Serviço do Legislativo…). Os cadernos não são
   guardados; só cabeçalho e link de cada norma.
3. **Catálogo**: retoma a carga completa, se ainda não terminou. No dia 1º de
   cada mês marca nova carga completa (pega alteração de cadastro em norma
   antiga); ao concluir, o arquivo é regravado sem repetições.
4. **Vínculos**: 60 páginas por execução, até completar (≈ 265 páginas).
5. **Textos** (`baixar-textos.mjs`): com o tempo que sobrar, baixa arquivos na
   ordem Lei Orgânica → emendas → LCs → leis, da mais recente para a mais antiga.

Ao fim: relatório de cobertura, commit em `dados/` e envio dos arquivos brutos
para a Release `textos-brutos` (um pacote por execução; o hash de cada arquivo
fica em `dados/textos/sapl/_indice.jsonl`). Se alguma etapa falhar, o que foi
coletado é gravado mesmo assim e a execução termina em erro (o GitHub avisa por
e-mail).

**Orçamento.** Repositório privado tem cota mensal de minutos no GitHub Actions
(2.000 no plano gratuito); público, não. A rotina escolhe sozinha: 55 min/noite
se privado, 320 se público (a variável de repositório `MINUTOS_POR_NOITE`, se
existir, prevalece):

| Opção | Ritmo | Prazo para ≈ 8 mil arquivos |
|---|---|---|
| Privado, cota gratuita (55 min/noite) | ≈ 45 arquivos/noite | ≈ 6 meses |
| Repositório público (sem cota; 320 min/noite) | ≈ 310 arquivos/noite | ≈ 4 semanas |
| Máquina própria ligada à noite (`MINUTOS=600 bash ingestao/rotina.sh`) | ≈ 590 arquivos/noite | ≈ 2 semanas |

**Limites conhecidos da rotina:**
- Alteração de cadastro em norma antiga (fora do topo da listagem) só é vista
  na recarga mensal do catálogo.
- Os atos que só o DOPA traz ficam registrados com link, mas o arquivo deles
  ainda não é baixado nem estruturado (fase 9).
- DOC/DOCX/ODT/PPT e PDFs sem camada de texto são baixados e guardados, mas a
  extração fica marcada como pendente (`formato_sem_extracao`,
  `sem_camada_de_texto`) para a fase 3.

## 4-B. Versionamento — situação medida (17/11/2026)

Prova: `teste_versionamento.mjs` — LC 320/1994 e as dez leis complementares
que a alteraram, em ordem, contra o texto compilado de referência.

**Resultado: 70 de 79 dispositivos iguais.** As 9 diferenças:

| Causa | Dispositivos | O que fazer |
|---|---|---|
| Pendência do motor: a LC 514/2004 renumera o parágrafo único do art. 2º para § 3º e inclui os §§ 1º e 2º onde havia dispositivos vetados | § 1º, § 2º e parágrafo único do art. 2º | Decidir o modelo: hoje o projeto tem por regra "nunca renumerar" e "posição de vetado não se reaproveita", e a lei real fez as duas coisas |
| Divergência da referência: a LC 958/2022, art. 6º, revoga o art. 7º; o compilado de referência (cópia de trabalho) ainda traz o texto | art. 7º e seus dois parágrafos | Conferir na fonte; o motor segue o texto da lei |
| Defeito do arquivo de origem | art. 9º-A (LC 692: faltam palavras no PDF), parágrafo único do art. 10 (LC 474: "n-" por "nº"), inc. I do art. 12-B (um travessão) | Nada no motor; a verificação da estruturação manda esses arquivos para revisão |

O que foi corrigido no motor para chegar aqui (antes, só 2 das 10 alteradoras
eram aplicadas): aspas curvas nos blocos de alteração; endereço duplicado
("parágrafo único do parágrafo único…"); "2o"/"5°" como ordinal; filhos de
artigo novo sem origem; revogação de dispositivo; guarda contra artigo
duplicado; e a cadeia de versões, que não existia (só a árvore final era
devolvida, com a identidade da versão original).

Ainda fora do alcance: comando de renumeração; veto derrubado; cabeçalhos fora
do padrão (resolvido por fora, com a identidade vinda do catálogo); alteradoras
cujo arquivo é imagem ou tem defeito de transcrição (caso da LC 449/2000).

## 5. Decisões

- **IA no pipeline:** por ora, fora. O Claude lê amostras da fila de exceções em
  sessão e corrige o parser; nada de leitura por norma. Reavaliar com a taxa de
  rejeição medida na fase 5 (estimativa prévia, grosseira: 8–10 milhões de
  tokens de entrada e 1–2 milhões de saída se lesse só os rejeitados).
- **Persistência:** JSONL versionado no repositório (metadados públicos). Banco
  só quando houver consulta que o exija.
- **Arquivos de texto bruto:** fora do git (há PDF digitalizado de 20 MB); vão
  para a Release `textos-brutos`. No git ficam o texto extraído e o índice com hash.
- **Core:** nenhuma mudança no `norma-core.js` nas fases 1 a 4.

## 6. Perguntas abertas

- Como obter o texto das normas que a fonte pública só traz em ementa.
- Licença do código (os dados seguem a licença da fonte: CC BY-SA 4.0).
