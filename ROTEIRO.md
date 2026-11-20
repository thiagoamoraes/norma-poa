# ROTEIRO — como continuar este projeto

Escrito em 17/11/2026 para quem pegar o trabalho depois (pessoa ou assistente),
sem acesso à conversa em que tudo foi construído. Leia nesta ordem:
`README.md` → `CLAUDE.md` (regras, que valem sempre) → `PLANO.md` (fases e
estado) → este arquivo (o que fazer em seguida, tarefa a tarefa).

Cada tarefa abaixo diz: **por quê**, **o que já existe**, **passos**, **como
saber que terminou** e **armadilhas**. Faça uma por vez, na ordem, salvo
indicação em contrário. Não pule a seção 0.

---

## 0. Antes de qualquer tarefa

### 0.1 Ver em que pé as coisas estão (5 minutos, sem rede)

**Primeiro de tudo: `cat dados/SITUACAO.md`.** É gerado toda noite pela própria rotina (sem IA): diz se o acervo está "em carga" ou "em dia", se há alerta, o que fazer primeiro e como foram as últimas execuções. Se o arquivo não existir ou estiver velho (mais de 2 dias), já é o primeiro problema: ver a seção 10-A.

```
git pull
node -e "const e=require('./dados/catalogo/sapl/_estado.json').tipos;for(const k in e)console.log(k,e[k].proximaPagina+'/'+e[k].totalPaginas,e[k].concluido)"
wc -l dados/textos/sapl/_indice.jsonl dados/catalogo/sapl/vinculos.jsonl
sed -n 1,30p dados/estruturado/RELATORIO.md
sed -n 1,20p dados/historico/RELATORIO.md
sed -n 1,12p dados/dopa/CONFERENCIA.md
```

No GitHub, aba Actions: a "Coleta diária" tem de estar verde nas últimas
noites. Vermelha → seção 10.

### 0.2 Bateria completa (rodar ANTES e DEPOIS de mexer em qualquer coisa)

```
node normateste.mjs > /tmp/antes.txt          # só imprime: comparar byte a byte depois
for t in teste_regressao teste_vetado_provenencia teste_pecas_2_3 teste_lei_publicada \
         teste_peca4 teste_urn teste_gruposAntes teste_promulgacao_parcial teste_pdf_normas \
         teste_catalogo_sapl teste_textos_sapl teste_estrutura teste_versionamento \
         teste_historico teste_minuta teste_leis_ordinarias teste_emenda_lo teste_nr_linha_seguinte teste_situacao teste_rede_local; do node $t.mjs | tail -1; done; bash teste_parar_em.sh | tail -1; bash teste_guarda_horario.sh | tail -1
```

Contagens de referência em 17/11/2026: 47 · 13 · 30 · 11 · 29 · 7 · 16 · 72 ·
24 · 26 · 36 · 28 (42 desde a rodada 25) · 34 · 24 · 33 · 20 · 18 · 8 (`teste_rede_local`), todas sem falha; mais `teste_ocr.mjs` (7; pula se não houver tesseract). (`teste_pdf_normas` precisa
de `npm ci`.)

### 0.3 Regras que mais custam caro quando esquecidas

1. **Nunca rode dois coletores ao mesmo tempo** e nunca mais de 1 requisição
   por minuto à base da PGM. Toda rede passa por `ingestao/sapl-io.mjs`. Se a
   "Coleta diária" estiver rodando no GitHub, não rode coletor local.
2. **`import()` de `catalogo-sapl.mjs`, `baixar-textos.mjs`, `estruturar.mjs`,
   `gerar-*.mjs` EXECUTA o script.** Para checar sintaxe: `node --check arquivo`.
3. **Mexeu no `norma-core.js`? Espelhe em `norma-simulacao.html`** (a mesma
   edição de texto; há uma cópia do motor lá dentro) e compare `normateste.mjs`
   byte a byte.
4. **Teste novo tem de falhar contra o código antigo.** Confira com
   `git stash -- norma-core.js && node teste_x.mjs; git stash pop`.
5. **Nenhum código sem exemplo real.** Achou um defeito? Guarde o arquivo real
   que o mostra em `fixtures/` e escreva o teste com ele. Texto inventado leva
   `(sintético)` na descrição.
6. **Mexeu na lógica da estruturação?** Suba `VERSAO_ESTRUTURADOR` em
   `ingestao/estrutura.mjs`, senão nada é reprocessado.
7. **Onde o texto da lei e uma cópia compilada divergem, vale a lei.** Não
   "conserte" o motor para imitar a cópia; registre a divergência no teste.
8. **O motor segue o que a lei fez** (renumerou? pôs texto em rótulo de
   vetado? então aplica e registra), mas **nunca renumera por conta própria** —
   e a minuta nunca propõe renumerar, salvo o caso do parágrafo único.
9. **Repositório público:** sem nomes de pessoas, cargos, planos de órgãos ou
   juízo sobre terceiros em código, documentos e commits.
10. **Trabalho interrompido não pode se perder.** Antes de começar uma tarefa, crie o ramo `wip/<tarefa>` e o arquivo `EM_ANDAMENTO.md` (tarefa, passo em que está, o que falta, o que já foi decidido); faça commit e push desse ramo a cada passo concluído; só leve para a `main` o que passa na bateria inteira. Ao terminar, apague o arquivo e feche o ramo. Quem retomar encontra o ponto exato (`git branch -r | grep wip/`) — o contêiner da sessão pode sumir a qualquer momento, e o que não foi enviado some junto.
11. **Na dúvida sobre prática legislativa, pare e pergunte ao mantenedor**,
    mostrando o documento real. Não escolha em silêncio.

---

## 1. Afinar o leitor pelo relatório de estruturação  ← comece aqui

**Estado em 20/11/2026 (leia antes de começar).** Feitas as rodadas 22 (Emenda à Lei Orgânica: cabeçalho) e 23 (`(NR)` na linha seguinte ao fecha-aspas); tudo na `main`. Acervo estruturado: 823 textos, 515 aceitos (62,6%) e 308 em revisão. A taxa **caiu** de 74% (18/11) porque chegaram textos mais difíceis — não é regressão (as rodadas 22 e 23 comparadas norma a norma: nenhuma deixou de ser aceita). Motivos hoje: `rotulo_nao_confere_com_a_origem` 174 · `cabecalho_nao_reconhecido` 119 · `trecho_nao_localizado_na_origem` 98 · `sem_fecho` 97 · `texto_fora_da_arvore` 71 · `bloco_de_alteracao_sem_dono` 50. **Orientação de 20/11/2026 (CLAUDE.md, "Época da norma"): normas de antes da LC 611 (03/02/2009) têm técnica diferente e revisão humana esperada; a LC 611 vale da sanção em diante (corte fixo em 03/02/2009; fila e taxa do relatório já separadas por época); para normas de peso (LC 7) a conferência é a compilação do leis.org.** Ao analisar um motivo, separar sempre "antigo (≤ ~2005)" de "recente": só o recente é defeito do leitor a perseguir.

**Rodada 24 (20/11/2026): `rotulo_nao_confere_com_a_origem` analisado** (famílias e contagens no CHANGELOG, rodada 24); 1ª correção: `“Art.` partido em duas linhas pela extração (`juntarAberturaDeBlocoPartida`, `VERSAO_ESTRUTURADOR` 6; a coleta noturna reprocessa). O resto desse motivo é defeito de fonte/OCR, ou depende de decisão (seção 9: "§ 1º" sozinho; alteradora sem aspas). **Rodada 25: `cabecalho_nao_reconhecido` analisado** (119 → ~95; o resto é OCR/digitalização antiga, Lei Orgânica e erros na própria lei) e corrigido o espaçamento colado/partido de 2011–2014 (`VERSAO_ESTRUTURADOR` 7; esperado ~527 aceitas de 823 depois da coleta noturna). **Próximo alvo: `trecho_nao_localizado_na_origem` (98), depois `sem_fecho`/`texto_fora_da_arvore` (71) e `bloco_de_alteracao_sem_dono` (50).** Procedimento de sempre (abaixo); amostrar por décadas.

**O que já se sabe do `sem_fecho` (analisado em 18/11, 23 casos de então — nenhum se corrige afrouxando a regex):** ~16 são digitalizações de 1930–1990 com OCR ruim ("TO de agosto", "MAJO", "L E G R E"): defeito de fonte, ficam em revisão. EC 27/2008 tem "GABINETE DAPRESIDÊNCIA" (palavra colada pela extração): pertence à comparação `pdftotext` × `pdfjs` (tabela abaixo). EC 28/2009 fecha com "Porto Alegre, 20 de março de 2009." (sem instituição): **forma nova com UM só exemplo real — decisão do mantenedor pendente** (recomendação: esperar um 2º exemplo; a linha curta é fácil de aparecer no corpo). Não aceitar esse 4º padrão sem OK.

**Defeito de fonte já identificado:** LC 809/2017 (`41019`) tem "(NR" truncado e número de página solto ("conforme segue: 3") — fica em revisão; não corrigir à mão.

**Por quê.** Até 17/11/2026 o leitor só tinha visto ~25 normas reais. A coleta
noturna traz centenas por noite; `dados/estruturado/RELATORIO.md` mostra
quantas foram aceitas e por que as outras não. É a lista de trabalho do motor.

**O que já existe.** `ingestao/estrutura.mjs` (conferências),
`ingestao/estruturar.mjs` (roda toda noite), `teste_estrutura.mjs`.

**Passos (um ciclo por motivo, do mais frequente para o mais raro):**

1. Abra o relatório e pegue o motivo com mais normas.
2. Na "Fila de revisão", escolha 5 normas com esse motivo, de décadas
   diferentes. Para cada uma, leia `dados/estruturado/sapl/<id>.json`
   (campo `verificacao.metricas`: `lacunas`, `naoLocalizados`,
   `rotulosDivergentes` mostram o trecho exato) ao lado de
   `dados/textos/sapl/<id>.txt`.
3. Classifique a causa: (a) defeito do arquivo na fonte → nada a fazer no
   motor, é para ficar em revisão; (b) ruído de extração (cabeçalho/rodapé de
   página, timbre, número de página) → tratar na EXTRAÇÃO
   (`ingestao/extracao-texto.mjs` ou um filtro em `estruturar.mjs`), nunca no
   motor; (c) forma legítima que o leitor não conhece → motor.
4. Copie UM arquivo real representativo para `fixtures/` (texto extraído, sem
   retoque) e o registro dele do catálogo para um fixture JSON.
5. Escreva o teste em `teste_estrutura.mjs` (tem de falhar agora).
6. Faça a menor correção possível. Bateria completa. Suba
   `VERSAO_ESTRUTURADOR`. Entrada no `CHANGELOG.md` (rodada N+1).
7. Rode `node ingestao/estruturar.mjs` localmente e veja o relatório mudar.

**Defeitos que já sabemos que vão aparecer** (vistos numa amostra de 15
arquivos e nas alteradoras da LC 320):

| Sintoma no relatório | Causa provável | Onde tratar |
|---|---|---|
| `cabecalho_nao_reconhecido` | "LEI COMPLEMENTAR Nº 449" (sem data), "LEI COMPLEMENTAR 474, de…" (sem "Nº"), "N°" com sinal de grau, linha de timbre antes ("brasao.g…", "Prefeitura Municipal de Porto Alegre") | Ver tarefa 2 |
| `texto_fora_da_arvore` com amostra de número de página ou "Diário Oficial" | cabeçalho/rodapé de página do PDF | extração: filtro de linhas repetidas em todas as páginas (medir antes: a mesma linha em ≥ 3 páginas) |
| `rotulo_nao_confere_com_a_origem` em massa numa norma | um artigo não foi reconhecido e os seguintes "andaram" (rótulo dado por posição) | motor: `reArt`/`rePar` — veja a linha do artigo perdido no `.txt` |
| palavras coladas ou com espaços no meio ("Dec lara de utilidad e", "Ex cetuam-se") | PDFs de ~2011–2014: `pdftotext` erra o espaçamento | **medido em 17/11/2026:** na Lei nº 11.575/2014 (`fixtures/leis-ordinarias/`), `extrairTextoNorma` (pdfjs) lê "Excetuam-se" onde o `pdftotext` dá "Ex cetuam-se". Próximo passo: comparar os dois leitores em ~30 PDFs dessa época e, se o pdfjs ganhar, usá-lo como leitor desses anos (ou quando houver muitas "palavras" de 1–2 letras) |
| `sem_fecho` | fecho fora dos 3 padrões conhecidos (ver CLAUDE.md) | motor, com exemplo real; a regex de fecho é estrita de propósito |
| aviso `tem_anexo` / `dispositivo_muito_longo` | anexo ou tabela colados no último artigo | ver tarefa 4 |
| documento inteiro repetido 2–3 vezes | arquivos do antigo SIREL e PDFs impressos dele | já tratado no HTML (`removerRepeticaoIntegral`); falta o mesmo para PDF (texto extraído que é k cópias idênticas) |

**Terminou quando:** a taxa de aceitação parar de subir com correções simples
e o que sobrar na fila for (a) defeito de fonte ou (b) casos raros. Anote a
taxa final no `PLANO.md`. Não persiga 100%.

**Armadilha.** Não afrouxe uma conferência para "passar" mais normas. A
conferência existe para a norma duvidosa NÃO ser dada como certa.

---

## 2. Cabeçalho fora do padrão: identidade vem do catálogo — FEITO em 17/11/2026

> Implementado em `ingestao/estrutura.mjs` (aviso `cabecalho_fora_do_padrao`,
> `cabecalho.fonte: 'catalogo'`) e testado em `teste_estrutura.mjs` com os três
> arquivos reais. O texto abaixo fica como registro do porquê.

**Por quê.** 3 de 8 arquivos reais das alteradoras da LC 320 têm cabeçalho que
`extrairCabecalhoLeiPublicada` não reconhece. Mas número, data e tipo já estão
no catálogo, vindos da fonte.

**O que já existe.** `ingestao/historico.mjs` já usa a identidade do catálogo
(`fonteDoRegistro`). `ingestao/estrutura.mjs` ainda reprova por
`cabecalho_nao_reconhecido`.

**Passos.**
1. Em `estruturarNorma`, quando o cabeçalho não for reconhecido E houver
   `registro`: procurar no início do texto (até o 1º "Art.") o NÚMERO do
   registro (`soDigitos`) numa linha que comece pelo tipo do ato. Achou →
   motivo vira AVISO `cabecalho_fora_do_padrao` e `cabecalho` é preenchido com
   os dados do catálogo, marcado `fonte: 'catalogo'`. Não achou → continua
   `cabecalho_nao_reconhecido` (pode ser o arquivo errado anexado à norma).
2. Fixtures reais: `fixtures/lc320/lc449.txt`, `lc474.txt`, `lc692.txt` já
   estão no repositório. Testes em `teste_estrutura.mjs`.
3. `VERSAO_ESTRUTURADOR` + bateria + CHANGELOG.

**Terminou quando:** as três passam a ter cabeçalho (a LC 692 e a LC 449
seguem em revisão por outros motivos, o que está certo: o arquivo é ruim).

**Armadilha.** Não alargue a regex do cabeçalho no motor para aceitar tudo: um
cabeçalho largo demais passa a casar com citações no corpo do texto.

---

## 3. Texto dos PDFs digitalizados (OCR) — FEITO em 17/11/2026 (falta o que está no fim desta nota)

> Implementado de forma mais simples que o plano abaixo: o OCR roda **na hora do
> download**, dentro de `baixar-textos.mjs` (`ingestao/ocr.mjs`), enquanto o
> arquivo está na máquina — por isso não há passivo a recuperar da Release.
> Entra em dois casos: PDF sem camada de texto, e PDF **digitalizado que já traz
> camada de texto ruim** (`pdfDigitalizado`: imagem de página em ≥ 80% das
> páginas) — aí fica a leitura que trouxer mais texto (folga de 30%). O índice
> registra `extracao.metodo: 'ocr'`; a estruturação põe o aviso `texto_de_ocr` e
> a página avisa o leitor. Teste: `teste_ocr.mjs`, com a LC 51/1980 real.
> **Falta:** (1) arquivos com mais de 60 páginas ficam com
> `ocr_adiado_arquivo_grande` — fazer um passe próprio para eles (baixar de novo
> ou da Release, um por execução); (2) conferir à mão, contra a imagem, umas 10
> leis lidas por OCR e anotar a taxa de aceitação delas no relatório; (3) o
> texto de OCR tem defeitos típicos ("NO 51" por "Nº 51", "ae" por "de") — NÃO
> corrigir no texto; se a taxa de aceitação for baixa demais, estudar
> pré-processamento da IMAGEM (contraste, endireitar), não do texto.
> O plano original segue abaixo, como registro.

**Por quê.** Quase tudo anterior a 1990 é imagem. Sem OCR, o histórico das
leis antigas fica cortado e a busca não as alcança.

**O que já existe.** `baixar-textos.mjs` marca esses arquivos com
`extracao.situacao: 'sem_camada_de_texto'` em `dados/textos/sapl/_indice.jsonl`.
O arquivo bruto só existe na máquina durante a execução que o baixou; depois
fica na Release `textos-brutos` (pacotes `bruto-<data>-<run>.tar.gz`).

**Passos.**
1. No workflow, instalar `tesseract-ocr tesseract-ocr-por` (apt) junto do
   `poppler-utils`.
2. Novo `ingestao/ocr-textos.mjs` (sem rede): para cada arquivo em
   `dados/_bruto/sapl/` cujo índice diga `sem_camada_de_texto`:
   `pdftoppm -r 300 -gray` → `tesseract <png> - -l por --psm 4` por página →
   juntar → gravar `dados/textos/sapl/<id>.txt` e ACRESCENTAR linha ao índice
   com `extracao: { metodo: 'ocr', situacao: 'ok', ... }` (a última linha de
   um id vale). Limite de tempo por execução (variável `MINUTOS_OCR`, padrão
   30) e por arquivo (pular e marcar `ocr_demorado` acima de 50 páginas).
3. Chamar na `rotina.sh` DEPOIS de `textos` e ANTES de `estruturar`.
4. `estrutura.mjs`: receber a origem do texto e, se for OCR, acrescentar o
   aviso `texto_de_ocr`. A página deve mostrar "texto obtido por
   reconhecimento óptico; pode ter erros de leitura".
5. Passivo (o que já foi baixado antes de o OCR existir): script
   `ingestao/ocr-passivo.sh` que, por execução, baixa UM pacote da Release
   (`gh release download textos-brutos -p 'bruto-…'`), extrai, roda o OCR nos
   pendentes e apaga. Registrar os pacotes já processados em
   `dados/textos/sapl/_ocr-pacotes.json`.
6. Validar com exemplo real antes de ligar: os ids 11928 (1957), 13879 (1963),
   15872 (1969) são digitalizações; a Lei Orgânica de 1970 (id 16471, 20 MB)
   também. Conferir à mão uma página de cada contra a imagem.

**Terminou quando:** `sem_camada_de_texto` deixa de crescer e o relatório de
estruturação mostra essas normas (aceitas ou em revisão com motivo).

**Armadilhas.** OCR troca "º" por "o"/"0", "§" por "S"/"5", "1" por "l". Não
"corrija" o texto: deixe a verificação reprovar. Tempo: ~5–10 s por página no
GitHub; uma noite não dá conta do passivo — por isso o limite e o registro.

---

## 4. Histórico em escala — acompanhar e tratar o que sobrar

**Por quê.** É o objetivo do projeto: o texto de cada lei em cada momento.

**O que já existe (pronto, roda toda noite).** `ingestao/historico.mjs`,
`ingestao/gerar-historico.mjs`: a lista de leis sai dos vínculos da fonte
(`vinculos.jsonl`, coleta em andamento, 60 páginas/noite) **mais** as ementas
do catálogo (`alteradorasPelaEmenta` — a fonte não liga 3 das 10 alteradoras da
LC 320) **mais** `dados/historico/_piloto.json` (manual). Provas:
`teste_versionamento.mjs`, `teste_historico.mjs`. Página: seletor de versão,
anotações, destaque, redações anteriores, selo "não conferido".

**Passos.**
1. Quando houver dezenas de leis apuradas, abrir `dados/historico/RELATORIO.md`
   e uns 10 arquivos `dados/historico/sapl/<id>.json` com `naoAplicadas`.
   Agrupar os `motivo`/`detalhe` por causa, como na tarefa 1.
2. Causas esperadas e o que fazer:
   - `comando_nao_reconhecido` com frase de comando nova (ex.: "passa a
     vigorar acrescido de", "suprime-se", "onde se lê… leia-se") → motor
     (`extrairComandosLei`), sempre com o arquivo real como fixture e um teste
     no molde de `teste_versionamento.mjs`.
   - alteração em **Anexo** (a Lei nº 10.904/2010, calendário de datas, tem
     centenas de "inclui a efeméride… no Anexo") → o motor não modela anexo.
     NÃO improvisar: marcar essas leis com um motivo próprio
     (`alteracao_em_anexo`, detectado por `/\bAnexo\b/` na frase de introdução)
     e deixar fora. Modelar anexo é decisão do mantenedor.
   - `texto_indisponivel` → some sozinho com a coleta e o OCR.
   - lei-base com `baseConferida: false` → resolve-se na tarefa 1.
3. Conferir à mão 5 leis com histórico "completo" contra a fonte, de épocas
   diferentes. Anotar no `PLANO.md` quais foram conferidas.

**Terminou quando:** o relatório estabiliza e as causas restantes estão
nomeadas. O histórico de uma lei só deve ser tratado como confiável se
`naoAplicadas` estiver vazio E `baseConferida` for `true`.

**Armadilhas.** A data usada como "desde quando vale" é a DATA DA LEI
alteradora, não a da entrada em vigor (o campo `data_vigencia` da fonte vem
vazio). Não apresentar como "vigente em tal dia" sem essa ressalva. Vínculo da
fonte com datas invertidas não é aplicado (vai para `datasInvertidas`).

---

## 5. Atos internos da Câmara (Resolução de Mesa, Ordem de Serviço…)

**Por quê.** A base da PGM não os traz; o Diário Oficial traz.

**O que já existe.** `ingestao/conferencia-dopa.mjs` registra, toda noite,
cabeçalho e link de cada norma do índice do DOPA em `dados/dopa/edicoes.jsonl`
e lista os "atos que só o DOPA traz" em `dados/dopa/CONFERENCIA.md`. O leitor
de PDF de norma individual (`ingestao/pdf-normas.mjs`) já foi validado com
Resolução e Ordem de Serviço. `extrairCabecalhoLeiPublicada` reconhece
Resolução e Ordem de Serviço; para Resolução de Mesa, Decreto Legislativo e
Emenda à Lei Orgânica só sinaliza `tipoNaoSuportado`.

**Passos.**
1. `ingestao/baixar-dopa.mjs`: para cada entrada de `edicoes.jsonl` cujo tipo
   não esteja em `TIPO_DOPA_PARA_SAPL`, baixar o `linkNorma` (host
   `dopaonlineupload.procempa.com.br`; etiqueta: sequencial, ≥ 400 ms, mesmo
   User-Agent), extrair com `extrairTextoNorma`, gravar em
   `dados/textos/dopa/<idEdicao>_<docId>.txt` + índice com hash. A API do DOPA
   só lista 5 dias: o que não for baixado nessa janela se perde — por isso
   esta etapa roda TODA noite, logo depois da conferência.
2. Catálogo próprio `dados/catalogo/dopa/atos.jsonl` (tipo, número, ano, data
   por extenso do cabeçalho, link, edição, `isRepublicacao`).
3. Guardar o PDF de UM exemplar real de cada tipo novo em `fixtures/pdf/`
   (ato público, pequeno) e só então estender o cabeçalho para ele.
4. Página: incluir esses atos no catálogo de busca, com o selo "Diário
   Oficial" e link para o PDF.

**Terminou quando:** uma Resolução de Mesa publicada numa noite aparece na
página na manhã seguinte.

**Armadilha.** O "contexto" dos links sem cabeçalho traz linhas corridas do
caderno, que podem ter dados pessoais: nunca gravar no repositório.

---

## 6. Busca dentro do texto dos dispositivos — FEITO em 17/11/2026 (falta medir em escala)

> Implementado como descrito abaixo (fatias `docs/dados/texto-NNN.json`, opção
> "Buscar dentro do texto das leis"). Só entra texto CONFERIDO: histórico, ou
> estruturação aceita. **Falta:** o passo 3 (medir no celular com o acervo real
> e, se as fatias passarem de ~40 MB, montar o índice na rotina).

**Por quê.** Hoje a busca olha número, ementa e palavras-chave.

**O que já existe.** `docs/index.html`: índice invertido montado no navegador
(radicais + BM25). `dados/estruturado/sapl/<id>.json` e
`dados/historico/sapl/<id>.json` têm o texto por dispositivo.

**Passos.**
1. Em `ingestao/gerar-site.mjs`, gerar fatias `docs/dados/texto-NN.json`
   (≈ 2 MB cada): `[idSapl, idDispositivo, texto]`, só do texto vigente
   (histórico, última versão) ou, na falta, da estruturação ACEITA.
2. Na página: caixa "buscar também no texto" (desligada por padrão); ao ligar,
   baixar as fatias em sequência, indexar com a mesma função `tokens`, e
   mostrar o resultado por dispositivo ("art. 8º, § 2º — Lei…"), abrindo a
   norma já rolada até ele (`#n=<id>&d=<idDispositivo>`).
3. Medir no celular: tempo de carga e memória com o acervo real. Se passar de
   ~40 MB de fatias, indexar na rotina (índice pronto por fatia) em vez de no
   navegador.

**Terminou quando:** buscar uma expressão que só existe no corpo de uma lei
leva ao dispositivo certo, no celular, em menos de 10 s na primeira vez.

---

## 7. Busca por sentido (semântica) — opcional, só depois da 6

**Decisão de desenho recomendada** (não implementada; exige teste de
viabilidade antes):
- Vetores gerados NA ROTINA, sem serviço pago: modelo multilíngue pequeno
  rodando em Node (biblioteca `@huggingface/transformers`, modelo do tipo
  `multilingual-e5-small`, ~120 MB, baixado de `huggingface.co` — precisa
  estar acessível ao GitHub Actions).
- Unidade: dispositivo vigente + contexto ("Lei X, art. N: caput… § …").
- Armazenar quantizado (int8, 384 dimensões) em fatias binárias em `docs/dados/`.
- No navegador, o MESMO modelo roda via a mesma biblioteca (WebAssembly) para
  vetorizar a pergunta; baixa-se o modelo só quando a pessoa liga a opção
  (avisar o tamanho). Sem servidor.
- Combinar com a busca por palavras (as duas listas, pontuação somada).

**Antes de construir:** montar 30 perguntas reais com a resposta esperada
(dispositivo) e medir se a busca por palavras da tarefa 6 já não resolve. Só
vale o custo se a semântica acertar perguntas que a outra erra.

---

## 8. Minuta de lei alteradora — sair do piloto

**O que já existe.** `ingestao/minuta.mjs` (gerador puro),
`ingestao/minuta-conferencia.mjs` (ida e volta pelo motor),
`ingestao/minuta-cli.mjs`, painel na página, `teste_minuta.mjs` (33), exemplo
em `exemplos/pedido-minuta-lc320.json`. Cobre: nova redação, inclusão
(parágrafo, inciso, alínea; no fim ou "depois de"), artigo novo (número do
anterior + letra), revogação, artigo com parágrafo único (renumera para § 1º),
ementa, cláusula de vigência, cláusula de revogação. Molde: LC 958/2022,
LC 761/2015, LC 514/2004.

**O que falta (cada item com exemplo real antes de codificar):**
1. ~~Testar com uma lei ordinária real~~ — FEITO: `teste_leis_ordinarias.mjs`
   (Leis nº 11.213/2012 e 11.229/2012). Falta só afinar a frase da ementa e da
   introdução quando o dispositivo novo fica dentro de parágrafo: hoje sai
   "inclui inc. V do § 2º no art. 1º"; a Lei nº 13.967/2024 escreve "inclui
   inc. IV no § 2º … do art. 1º". As duas formas são lidas pelo motor.
2. Revogação de vários dispositivos na mesma cláusula: hoje sai "Ficam
   revogados os art. 6º e § 4º do art. 8º" — conferir a forma usada em leis
   reais (buscar no catálogo ementas com "revoga os arts.") e ajustar o plural.
3. Alteração de **agrupador** (título de Capítulo/Seção) e de **anexo**: não
   suportado; a minuta deve recusar com mensagem, não gerar.
4. Vigência diferente de "na data de sua publicação" (parâmetro).
5. Mais de uma lei alterada no mesmo projeto: fora do piloto; decidir com o
   mantenedor se interessa.
6. Na página: permitir clicar no dispositivo do texto para preencher o
   formulário; baixar o pedido em JSON; guardar o rascunho no navegador.

**Regra de ouro da minuta:** só mostrar como "conferida" o que passou na ida e
volta (`conferirMinuta(...).confere === true`). Se uma forma nova não passa,
ou o gerador está errado ou o motor não conhece a forma — descobrir qual dos
dois com um exemplo de lei real, nunca forçando o resultado.

**Fora de escopo (CLAUDE.md):** Redação Final com emendas de plenário.

---

## 9. Pendências que dependem de decisão do mantenedor — NÃO implementar sem ela

| Assunto | O que há | O que falta decidir |
|---|---|---|
| Veto derrubado / promulgação parcial | Exemplos reais: `lc1075_promulgacao_parcial.txt`, `lei14504_parcial.txt`; detecção pronta (`detectarPromulgacaoParcial`) | O modelo de dados ("Visão" × "Versão", ver `PECA4-MODELO-DE-DADOS.md`, seção 4) |
| Republicação | A marca viaja com o registro do DOPA (`isRepublicacao`) | Versão ou Visão (depende da vacatio legis) |
| Declaração de inconstitucionalidade, execução suspensa | Tipos de vínculo 10 a 13 da fonte | Como exibir; sem exemplo estudado |
| Anexos | Não modelados | Se e como entram na árvore |
| Forma de exibir o revogado | "(Revogado)" + nota da lei | Confirmar |
| Redação do art. 5º da LC 320 entre 2000 e 2005 | O arquivo da LC 449/2000 na fonte está mal transcrito | Texto correto, trazido pelo mantenedor (pôr em `fixtures/lc320/lc449.txt` e apontar em `_piloto.json`) |
| "§ 1º" sozinho na lei (sem "§ 2º") | ~26 textos (ex. LC 521/2005 art. 1º): o estruturador dá "Parágrafo único." por posição e a conferência reprova, corretamente | Endereço segue o rótulo escrito ("o motor segue o que a lei fez") ou fica em revisão? Hoje fica em revisão |
| Alteradora sem aspas (1990–2003) | ~29 textos (ex. LC 267/1992, LC 349/1995): redação nova em texto corrido | Aceitar desenhar regra própria? Exige regra segura com mais de um exemplo |
| Licença do código | "ainda não definida" no README | Qual |
| Decretos e demais tipos | Catálogo da fonte tem 51 mil normas; o escopo são ~16 mil | Quando ampliar |

---

## 10. Manutenção da rotina

- **Commit durante a coleta:** evite enviar commits entre 01:17 e ~07:00 (hora de Porto Alegre). Se acontecer, a rotina resolve o conflito a favor do que ela coletou (arquivos gerados se refazem na noite seguinte); mas um conflito em arquivo de CÓDIGO não é resolvido assim — confira o Actions na manhã seguinte.
- **Horário da coleta:** o mantenedor quer coletas só de madrugada em Brasília; o agendamento (04:17 UTC = 01:17, 320 minutos) termina antes das 07:00. Disparo manual no expediente só a pedido dele. Para parar mais cedo num dia específico: entrada `parar_em_utc` do disparo manual (`10:00` = 07:00 de Brasília), que vale só para aquela execução (`ingestao/parar-em.sh`, `bash teste_parar_em.sh`).
- **Falha de download isolada não derruba a rotina** (desde 17/11/2026): o arquivo vira `falha_temporaria` no índice, vai para o fim da fila e é tentado de novo nas noites seguintes. A etapa só para, e a execução fica vermelha, depois de 5 falhas SEGUIDAS em arquivos diferentes (fonte fora do ar). Cada tentativa tem prazo (3 min para arquivo, 1 para JSON); espera entre tentativas: 1 e 5 minutos.
- **O agendamento do GitHub atrasa muito** (visto em 17/11/2026: disparou às 13:23 UTC em vez de 04:17, ou seja, no meio do expediente em Brasília). A rotina não percebe o atraso sozinha para execução agendada: ver a decisão pendente sobre limitar a execução agendada à madrugada.
- **Execução vermelha no Actions:** abrir o log da etapa "Rotina de coleta".
  A rotina grava o que coletou mesmo com erro. Erro de rede passageiro: nada a
  fazer, a noite seguinte retoma. Erro repetido na mesma página/arquivo:
  olhar `sapl-io.mjs` (ele desiste depois de 3 tentativas, de propósito).
- **A fonte pediu para parar ou reduzir:** desligar o agendamento (Actions →
  Coleta diária → ⋯ → Disable workflow) na hora; depois ajustar `INTERVALO_MS`.
- **Recarga mensal do catálogo:** automática no dia 1º (`--marcar-recarga`).
  Enquanto recarrega, as "novidades" daquele tipo ficam adiadas — normal.
- **Tamanho do repositório:** `dados/estruturado/` e `dados/historico/`
  crescem com o acervo (dezenas de MB). Se passar de ~500 MB, mover os JSON
  por norma para a Release e manter no git só os relatórios e o que a página usa.
- **Rodar numa máquina própria:** `MINUTOS=600 bash ingestao/rotina.sh`
  (Node 22+, `poppler-utils`, `npm ci`) e fazer commit de `dados/` e `docs/`.
  Nunca ao mesmo tempo que o agendamento do GitHub.
- **Página:** GitHub Pages, pasta `/docs` da `main`. `gerar-site.mjs` copia
  `norma-core.js`, `minuta.mjs` e `minuta-conferencia.mjs` para `docs/js/` —
  não edite as cópias.

---

## 10-A. Se ficar um tempo sem análise por IA (e como retomar)

**Princípio:** a coleta, a extração, a estruturação, o histórico, o relatório, a página e o painel de situação rodam toda noite **sem IA**, são retomáveis e não dependem de ninguém acordado. Ficar semanas sem análise **não perde dados**: só deixa acumular trabalho de análise. Por construção, o que a análise produz (correção do leitor, novos comandos) se aplica depois a tudo, porque o texto bruto e o extraído ficam guardados (`Release textos-brutos` e `dados/textos/`) e basta subir `VERSAO_ESTRUTURADOR` para reprocessar.

**O que continua sozinho:** catálogo, vínculos, textos (PDF, HTML, DOCX, OCR), conferência com o Diário Oficial, estruturação com verificação, históricos, página de consulta, `dados/SITUACAO.md`.

**O que se acumula, e por que está seguro:**

| Acúmulo | Por que não se perde | Quando vira problema |
|---|---|---|
| Normas em revisão (estruturação e histórico) | É a lista de trabalho; o relatório se refaz sozinho | Nunca com prazo: é só fila |
| Execução vermelha | A noite seguinte retoma de onde parou; o GitHub manda e-mail a cada falha; **se a falha for ao gravar, os dados ficam 30 dias como artefato** (Actions → a execução → Artifacts → `dados-nao-gravados-…`) | Se o mesmo erro se repetir por várias noites sem ninguém ver: o painel acusa ("duas últimas execuções com erro") |
| Índice do Diário Oficial | Cada noite grava cabeçalho e link das normas em `dados/dopa/edicoes.jsonl`; o link do PDF da norma é o mesmo que a base da PGM usa, então deve valer depois (confirmar na tarefa 5) | A API só mostra 5 dias: **a rotina nunca pode ficar mais de 5 dias sem rodar** |
| Tamanho dos dados | O painel mede e avisa a partir de 800 MB | Só se subir `VERSAO_ESTRUTURADOR` sem cuidado (reescreve tudo): ver seção 10 |

**O que NÃO se resolve sozinho e tem prazo (é o que o painel vigia):**
1. **Agendamento parado.** O GitHub pode atrasar ou descartar execuções agendadas (visto em 17/11/2026: a primeira não disparou). Sem execução há mais de 2 dias, o painel acusa — mas só quem abre o painel vê. **Conferência semanal de 1 minuto, por quem for:** aba Actions do repositório, ver se há execução nas últimas noites. Se não houver: disparar manualmente (`workflow_dispatch`) e ver a seção 10 (alternativas: disparo externo, máquina própria).
2. **Agendamento desativado por inatividade.** O GitHub desativa agendamentos de repositórios públicos sem atividade por 60 dias. Os commits noturnos da própria rotina devem contar como atividade (**não confirmado**); se a coleta parar de rodar, a aba Actions mostra um aviso com botão para reativar.
3. **A fonte pedir para parar ou mudar o ritmo:** quem mantém a fonte pode abrir uma *issue* no repositório. Atender é decisão do mantenedor.

**Retomada — checklist (use também depois de qualquer interrupção):**
1. `git pull`; `git branch -r | grep wip/` — há trabalho interrompido? Se houver, comece por ele (`EM_ANDAMENTO.md` no ramo).
2. `cat dados/SITUACAO.md` — estado, alertas, "o que fazer agora".
3. Aba Actions: execuções vermelhas desde a última sessão; **artefatos `dados-nao-gravados-*`** (se existirem, restaurar antes de tudo: baixar, descompactar na raiz, commit).
4. Bateria completa (seção 0.2) — tem de estar toda verde antes de mexer.
5. Seguir o "O que fazer agora" do painel; depois, as tarefas do roteiro em ordem.

**Quem opera sem IA (o mantenedor sozinho):** abrir `dados/SITUACAO.md` no GitHub e olhar três coisas — "Estado", "Alertas" e a tabela das últimas execuções. Nada mais é necessário para saber se a coleta está viva.

---

## 10-B. Quando o acervo estiver em dia (regime permanente)

**Quando está "em dia":** o painel mostra **EM DIA** quando (1) o catálogo dos quatro tipos está completo, (2) os vínculos estão completos, (3) a fila de textos está vazia, (4) as últimas 3 execuções não tiveram erro e (5) nenhuma norma do Diário Oficial publicada há mais de 7 dias falta no catálogo da fonte. A decisão é de `avaliarSituacao()` em `ingestao/situacao.mjs`, testada em `teste_situacao.mjs`. Ficam de fora do critério, de propósito, e aparecem em "o que fazer agora": normas em revisão, históricos incompletos, OCR adiado, formatos sem extração — são trabalho de análise, não de coleta.

**O que a rotina faz em regime (sozinha):** cada noite lê o topo do catálogo de cada tipo (4 requisições) para achar norma nova ou alterada, confere o Diário Oficial, baixa os poucos textos novos, estrutura, refaz os históricos das leis alteradas, regenera a página e o painel. Termina em minutos, não em horas: cada etapa sai quando a fila acaba. No dia 1º de cada mês refaz o catálogo inteiro (para pegar alteração de cadastro em norma antiga), o que leva umas 3 horas.

**Rotina humana de acompanhamento (10 minutos):**

| Quando | O que olhar | O que fazer se estiver ruim |
|---|---|---|
| Toda semana | `dados/SITUACAO.md` (estado, alertas, últimas execuções) e a aba Actions | Alerta → seção 10-A e seção 10 |
| Depois de cada dia 1º | O total de registros de cada tipo no catálogo **não pode ter caído** (norma retirada da fonte) e a taxa de aceitação da estruturação não pode ter piorado | Queda: não apagar nada; abrir tarefa 1/4 com o caso |
| A cada trimestre | Conferir à mão 10 normas novas "aceitas" contra a fonte, de tipos e épocas diferentes; anotar no `PLANO.md` | Divergência: tarefa 1, com a norma como fixture |
| Quando surgir tipo novo de comando, anexo ou forma de cabeçalho | O relatório de estruturação ou o histórico mostram motivo novo | Seção 1 ou 4 do roteiro |

**Cuidados em regime:**
- Nunca deixar passar mais de **5 dias sem execução** (a conferência com o Diário Oficial só vê 5 dias).
- Norma nova já entra com a estruturação e o histórico completos, mas a lei que ela altera só tem histórico correto se a lei-alvo estiver "aceita" (`baseConferida`): o painel mostra quantas faltam.
- Ampliar o escopo (decretos, portarias, resoluções de conselhos) é decisão do mantenedor e se faz acrescentando tipos em `ESCOPO_INICIAL` e `TIPOS_PADRAO`; o catálogo da fonte já tem 51 mil normas, o escopo atual cobre ~16 mil.
- Se o painel disser EM DIA e a página de consulta não tiver a norma que o Diário publicou ontem, é normal: a fonte cadastra com atraso (mediana medida: no mesmo dia; algumas levam dias). O painel só reclama após 7 dias.

---

## 10-C. Disparo externo da coleta (decidido em 17/11/2026)

O agendamento do GitHub atrasa horas (em 17/11 disparou 9 h depois). Por isso:

1. **Guarda de horário (pronta, no workflow):** job `guarda` + `ingestao/guarda-horario.sh`. Execução `schedule` fora de 03:00–10:00 UTC é pulada (job cinza, sem e-mail); dentro da janela, para às 09:50 UTC; se o disparo externo já rodou nas últimas 6 h, o agendamento pula. Disparo manual/externo (`workflow_dispatch`) é livre.
2. **Disparo externo AUTOMÁTICO (feito em 17/11/2026; funcionando em 18, 19 e 20/11):** tarefa agendada da plataforma do Claude (**20/11/2026: recriada na sessão atual, `trig_01DvYEzZ4wxZ8edrynoopTTn`**; a antiga `trig_0121FUcNuPcshAgwJA4rPidN`, ligada à sessão anterior, só é apagada depois de confirmada a execução das 04:05 de 21/11; 04:05 UTC todo dia) acorda a sessão de trabalho, que dispara `workflow_dispatch` (`parar_em_utc=09:50`) pelo conector do GitHub, sem token guardado. Custo: um turno curto de IA por noite; **se o crédito de IA acabar, o disparo não ocorre** e o `schedule` (com guarda) fica como reserva. **A tarefa acorda a SESSÃO em que foi criada (`persistent_session_id`)**: se essa sessão for arquivada ou encerrada, o disparo das 04:05 deixa de ocorrer. Em sessão nova, recrie a tarefa ligada à nova sessão (`create_trigger` com `cron_expression: "5 4 * * *"`, mesmo prompt: listar execuções recentes, não disparar se houver uma em andamento ou nas últimas 6 h, disparar `coleta-diaria.yml` na `main` com `parar_em_utc=09:50`) e apague a antiga com `delete_trigger`. Para desligar/alterar: `update_trigger`/`delete_trigger` com esse id. Verificação de 18–20/11: a guarda pulou o agendamento atrasado (13:01 UTC) em 9–10 segundos, sem coletar. A alternativa sem IA (abaixo) continua válida e é a que recomendo quando o crédito for um risco:
3. **Alternativa sem IA — cron externo (depende do mantenedor; a IA não cria credenciais):**
   - Criar um token *fine-grained* no GitHub (Settings → Developer settings → Personal access tokens), **só neste repositório**, permissão **Actions: Read and write**, validade de até 1 ano. Nunca colar o token em chat, código ou commit.
   - Num serviço de cron gratuito (por exemplo cron-job.org), criar uma tarefa diária **04:05 UTC (01:05 em Brasília)**, fuso UTC, método POST em
     `https://api.github.com/repos/thiagoamoraes/norma-poa/actions/workflows/coleta-diaria.yml/dispatches`
     com cabeçalhos `Authorization: Bearer <token>`, `Accept: application/vnd.github+json`, `X-GitHub-Api-Version: 2022-11-28`, `User-Agent: norma-experimento`, e corpo `{"ref":"main","inputs":{"parar_em_utc":"09:50"}}`. Resposta esperada: 204.
   - Conferir no dia seguinte: Actions → a execução deve ser `workflow_dispatch` começando por volta de 04:05 UTC. O `schedule` fica de reserva.
4. **Se o token expirar** o disparo externo para de funcionar em silêncio; o `schedule` volta a ser o único (com a guarda). `dados/SITUACAO.md` mostra "sem coleta há N dias" — nesse caso renovar o token.

## 11. Mapa rápido do código

| Arquivo | Papel | Rede? |
|---|---|---|
| `norma-core.js` | Motor: leitura da norma, comandos de alteração, versões | não |
| `ingestao/sapl-io.mjs` | Única porta de rede para a base da PGM (1 req/min) | sim |
| `ingestao/catalogo-sapl.mjs` | Catálogo, `--novidades`, `--vinculos`, `--marcar-recarga` | sim |
| `ingestao/baixar-textos.mjs` | Download + extração (PDF, HTML, DOCX) | sim |
| `ingestao/conferencia-dopa.mjs` + `dopa-discovery.mjs` | Índice do Diário Oficial × catálogo | sim (DOPA) |
| `ingestao/extracao-texto.mjs` | Extração pura (HTML do SIREL, DOCX) | não |
| `ingestao/estrutura.mjs` → `estruturar.mjs` | Dispositivos com endereço + verificação | não |
| `ingestao/historico.mjs` → `gerar-historico.mjs` | Versões, linha do tempo, lista de alteradoras | não |
| `ingestao/minuta.mjs`, `minuta-conferencia.mjs`, `minuta-cli.mjs` | Minuta de alteradora + ida e volta | não |
| `ingestao/relatorio-cobertura.mjs`, `gerar-site.mjs` | Relatórios e dados da página | não |
| `ingestao/situacao.mjs` | Painel `dados/SITUACAO.md`: em carga × em dia, alertas, o que fazer | não |
| `ingestao/rotina.sh`, `.github/workflows/coleta-diaria.yml` | Ordem das etapas; agendamento | — |
| `docs/index.html` | Página de consulta (busca, histórico, minuta) | lê `dados/` |

Endereço de dispositivo, em todo lugar: `art-5-A/par-2/inc-III/ali-b`
(`par-unico` para parágrafo único). Chave equivalente no motor:
`al. b) do inc. iii do § 2º do art. 5º-a` — conversão em
`historico.mjs` (`chaveParaId`) e `minuta.mjs` (`idParaChave`).
