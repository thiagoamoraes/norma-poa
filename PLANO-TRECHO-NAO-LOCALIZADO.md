# PLANO: `trecho_nao_localizado_na_origem` nas normas recentes

Pesquisa somente leitura de 20/11/2026. Universo: as 55 normas RECENTES (pós 03/02/2009) com o motivo, listadas em `scratchpad/alvo.json`. Todas as 55 foram analisadas (não houve amostra). 35 delas também têm `texto_fora_da_arvore`; 20 têm o motivo de trecho sem `texto_fora_da_arvore`. (A contagem "14 só trecho" do pedido não bate com o arquivo: são 20.)

Método, para não depender da saída do próprio script:

1. Reexecutei `estruturarNorma` (puro) sobre o `.txt` preparado de **todas as 823 normas** e confirmei que reproduz, para as 55, exatamente os motivos gravados em `dados/estruturado/sapl/`.
2. Para cada trecho não localizado, achei o maior prefixo do texto da árvore que existe na origem, e li o que a árvore tem a mais e o que a origem tem naquele ponto.
3. Li o texto cru de origem de cada família de causa.
4. **Prova de causa:** copiei `norma-core.js` e `ingestao/{estrutura,extracao-texto}.mjs` para o scratchpad, apliquei consertos mínimos um a um e medi sobre as 823 normas: quantas das 55 perdem o motivo e se algum motivo NOVO aparece em qualquer norma.

Nada foi alterado no repositório (`git status` limpo). Os protótipos estão em `scratchpad/proto-core.diff` e `scratchpad/proto-preparo.diff` (só referência; não são patch pronto).

## 1. Resultado em uma linha

**Nenhuma das 55 é "texto da lei que o motor deixou cair".** Em todas, a árvore tem o texto certo, mas em ordem diferente da origem (porque o leitor colou uma linha estranha ao dispositivo anterior) ou com um pedaço a mais. A conferência está acusando corretamente; o defeito é do leitor ou do preparo. Em 50 das 55, um conserto pequeno e verificável resolve. Cinco ficam: defeito de fonte, ou extração que não se conserta por regra.

## 2. Tabela de causas × contagem

Uma norma pode ter mais de uma causa (a união das causas é as 55; sobreposição: 8).

| Id | Causa | Letra | Normas | Onde nasce |
|---|---|---|---|---|
| G1 | **Título de agrupador colado ao dispositivo anterior**: título em 2 ou 3 linhas, título separado do "Seção N" por linha em branco ou quebra de página, "CAPÍTULO ÚNICO" | D (forma legítima de redação que o leitor não entende) | 25 | `norma-core.js:627` (`reGrupo`) e `:673-690`, em especial `:682-683` |
| G2 | **Falso agrupador**: linha de frase que começa por "Título III da Lei…", "Seção IV do Capítulo II; e revoga…", "Capítulo IV – Da Taxa…" (ementa), "Seção VII deste Capítulo." vira agrupador | D (bug) | 6 | `norma-core.js:627`/`:673`; o teste do `reGrupo` vem ANTES do teste de estágio (`:692`) |
| G3 | **Continuação de item** (`1.`, `2.` dentro de alínea) colada à alínea | D (bug) | 5 | `norma-core.js:733-734` (`last` não guarda o item) |
| G4 | **Ruído de página colado ao dispositivo anterior**: número de página e carimbo de processo (`PLCE Nº 006/26`, `PROC. Nº 1254/18`, `PLCL Nº 019/18`) | A (preparo) | 20 (15 logo após bloco de alteração, 5 entre o título de agrupador e o artigo) | `ingestao/extracao-texto.mjs:205` (`prepararTextoExtraido` não tira) + `norma-core.js:734` (fallthrough anexa ao `last`) |
| G5 | Aspa de **fechamento interna** (`“contact centers”`) fecha o bloco de alteração cedo | D (bug) | 1 (36400) | `norma-core.js:860-864` (`reFechaDup`) |
| G6 | "…seguinte Lei Complementar: Art. 1º …" **na mesma linha** (DOCX junta o parágrafo): o 1º artigo não é reconhecido | A (preparo) | 1 (37041) | `ingestao/extracao-texto.mjs:205`; `norma-core.js:614` (`reArt` exige início de linha) |
| G7 | **Documento repetido no arquivo** (3 e 5 cópias), com pequenas diferenças de espaçamento ou prefixo | B (fonte) + A | 2 (37136, 38364) | `ingestao/extracao-texto.mjs:30-40` e `:128-136` (só igualdade exata, divisor exato) |
| G8 | Extração de PDF com **coluna lateral e margem intercaladas** no meio das linhas | A (extração) | 1 (36841) | `pdftotext` (fora do core); sem regra segura |
| G9 | **OCR** com aspa solta `“` antes de "Art. 4º" (abre bloco falso) e quadro/croqui do anexo | A/B | 1 (36190) | OCR; sem regra segura |
| G10 | Emenda à Lei Orgânica com **camada de texto ruim** (`Art. I`, `§ I`, `N°`, ordinal `o` solto em linha própria, carimbo `P E L O N`) | B (fonte) | 1 (44307) | arquivo de origem |

Resumo por letra (normas com pelo menos uma causa da letra; há sobreposição): D 33 (G1, G2, G3, G5) · A 23 (G4, G6, G8, G9) · B 3 (G7, G10; G9 em parte). Nenhuma é (C) nem (E).

Nenhuma causa é (C) "anexo/tabela/quadro que o estruturador descarta": ao contrário do que o pedido sugeria, não achei caso de forma legítima descartada. Os anexos (`tem_anexo`) não aparecem como causa; só no 36190 há quadro, e a causa real ali é o OCR.

## 3. Evidência por causa

Convenção: "árvore" = o `texto` do dispositivo gravado; "origem" = o `.txt` de `dados/textos/sapl/`.

### G1. Título de agrupador colado (25 normas)

Mecanismo em `norma-core.js:673-690`: quando o título não está na mesma linha do "CAPÍTULO N", o leitor pega **só** `lines[li+1]` (`:682`) e só se não for vazia. Três falhas:

- **Título em mais de uma linha** (17 normas). Exemplo **51486**, origem linhas 266-268:
  ```
  CAPÍTULO III
  DAS DISPOSIÇÕES GERAIS SOBRE PARCELAMENTO DO SOLO,
  EDIFICAÇÕES E REGIME URBANÍSTICO
  ```
  O agrupador fica com o título `DAS DISPOSIÇÕES GERAIS SOBRE PARCELAMENTO DO SOLO,` e a 3ª linha cai no `t.texto = ...` (`:734`): `art-22/par-unico` termina em `…restrições ambientais de ocupação para essas áreas. EDIFICAÇÕES E REGIME URBANÍSTICO`. Mesmo padrão em 50385, 50340, 47599, 44398, 42542, 42518, 41908, 41009, 39694, 39138, 38274, 37517, 36316 e outras.
- **Linha em branco ou quebra de página entre o número e o título** (4 normas: 49739, 38364, 39422, 37172). Exemplo **49739**: origem `Seção III` + `\f` + `Das Competências`. `prepararTextoExtraido` troca `\f` por `\n`, então `lines[li+1]` é vazia, o título fica `""` (`agrupadores:[{secao,III,titulo:""}]` em `art-13`) e `art-12` termina com `… desta Lei Complementar. Das Competências`. No **38364** são 235 cabeçalhos assim (`Seção II` / linha em branco / `Dos Órgãos de Execução`); o preâmbulo do **39422** engole `DISPOSIÇÕES PRELIMINARES` pelo mesmo motivo.
- **"CAPÍTULO ÚNICO"**: `reGrupo` só aceita algarismo romano. **47599**, origem 269-272: `CAPÍTULO ÚNICO` / `DISPOSIÇÕES ESPECIAIS PARA CONSTITUIÇÃO DE` / `CRÉDITO NÃO TRIBUTÁRIO`; a árvore de `art-73/par-2` termina em `… CAPÍTULO ÚNICO DISPOSIÇÕES ESPECIAIS…`.

### G2. Falso agrupador (6 normas: 50386, 43542, 43376, 39862, 40426, 39825)

`reGrupo` casa qualquer linha que COMECE por "Título/Capítulo/Seção/Parte + romano", inclusive linha de frase quebrada ao meio.

- **50386**, ementa linha 6: `Seção IV do Capítulo II; e revoga os incs. I e II do` vira agrupador (`titulo:"do Capítulo II; e revoga os incs. I e II do"` em `art-1`), e a ementa sai sem essa linha: `trecho_nao_localizado` na ementa.
- **43376**, `art-10`: a frase da introdução quebra em `…Seção I do Capítulo III do` / `Título II da Lei Complementar nº 478, de 2002, …conforme segue:`. A 2ª linha vira `titulo:"da Lei Complementar nº 478, de 2002, e alterações posteriores, conforme segue:"`; o dispositivo perde essa metade da frase.
- **39862**, `art-44`: `Seção VII deste Capítulo.` (fim de frase) vira agrupador `titulo:"deste Capítulo."`.
- **39825 e 40426**, ementas com `Capítulo IV – Da Taxa de Fiscalização de…` e `Título III da Lei Complementar nº 7…` no começo de linha.

### G3. Continuação de item colada à alínea (5 normas: 43471, 40791, 36892, 37491, 40311)

`norma-core.js:733` cria o item (`last.al.children.push(n)`) mas não o guarda em `last`; a linha seguinte (continuação do item) cai em `:734` (`last.al||last.i||…`) e é anexada à **alínea**. Exemplo **40791**, origem 251-256:
```
c) para volumetria:
1. taxa de ocupação de 75% (setenta e cinco por cento); e
2. altura de 52m (cinquenta e dois metros) até a profundidade de 60m (sessenta
metros) do alinhamento da Av. Bento Gonçalves e, no interior, de 18m (dezoito metros);
```
Árvore: `art-39/inc-I/ali-c` = `para volumetria: metros) do alinhamento da Av. Bento Gonçalves e, no interior, de 18m (dezoito metros);` e `item-2` = `altura de 52m (cinquenta e dois metros) até a profundidade de 60m (sessenta` (cortado). Em **43471**: `ali-b` = `comércio: forno a lenha; e`, com a 2ª linha do item 2 grudada na alínea.

### G4. Ruído de página (20 normas)

Linhas que só existem por causa da impressão: número da página sozinho na linha (sequência 2, 3, 4… uma por página, em recuo largo) e carimbo de processo repetido em cada página. Dentro de um dispositivo comum elas são inofensivas (aparecem na árvore e na origem na mesma ordem). O problema nasce quando a linha vem **depois de um bloco de alteração** ou **entre o título de agrupador e o artigo**: o fallthrough `:734` a anexa ao dispositivo-introdutor / ao dispositivo anterior, mas na origem ela está DEPOIS do bloco (que a conferência procura depois do dispositivo). Resultado: texto fora de ordem.

- **42994**, `art-3`: árvore `…alterada pela Lei Complementar nº 817, de 2017, conforme segue: 8`; origem linhas 363-365: `…regional.”` / `8` / `Art. 4º Fica criado…` (o `8` é o número da página 8; a árvore o põe antes do bloco).
- **51463** (carimbo): árvore `art-4` termina em `…conforme segue: PLCE Nº 006/26`; o carimbo está no topo de cada uma das 16 páginas, e a ocorrência colada é a que vem após o bloco. **42236**: `… conforme segue: PROC. Nº 1254/18 PLCL Nº 019/18`; **40699**: `PROC. Nº 0580/15 PELO Nº 004/15`; **51214**: `PLCL Nº 08/24`.
- **42355**, `art-14`: árvore `…conforme segue: 6 (NR)`; origem: `…segurado.”` / `6` / `(NR)`. O número da página separa o `”` do `(NR)`. Sem o número, `detectNRCandidates` já trata o `(NR)` sozinho na linha seguinte (`norma-core.js:866-871`, teste `teste_nr_linha_seguinte.mjs`).
- Entre título e artigo (5 normas: 40111, 41876, 42387, 42407, 42460): origem `Seção IV` / `Das Carreiras da Administração Tributária` / `16` / `Art. …`; o `16` vai para o dispositivo anterior.

Confirmação de que o número é MESMO de página: nas 55, o valor da linha é sempre o número da página (contando `\f`), uma por página (sequência 2,3,4…). A norma 30209 (plano diretor) tem 722 linhas assim em recuo largo porque é um quadro numérico: por isso a regra NÃO pode ser "linha com só algarismos".

### G5. Aspa interna fecha o bloco (36400)

Origem, intro do `art-2` seguida do bloco `“Art. 21. ……` … `XIX – serviços realizados pelos centros de contato – “contact centers”` (linha 19) … `(NR)` bem depois. `detectNRCandidates` (`:864`) fecha o bloco na linha 19, porque ela termina em `”` (que fecha o `“contact centers”` aberto NA MESMA linha). O resto do bloco vira "dispositivos" da alteradora (`art-2/inc-I`, `art-2/par-1`, `art-2/par-2`) e a linha seguinte (`, com a interveniência…`) cola no `art-2`.

### G6. Artigo 1º na mesma linha do preâmbulo (37041, DOCX)

Linha 5-6: `Faço saber que … sanciono a` / `seguinte Lei Complementar: Art. 1º Fica incluído art. 7º-A …`. Como `reArt` (`:614`) exige início de linha, o `Art. 1º` não existe: o 1º artigo vira texto do preâmbulo e todos os blocos ficam deslocados em 1 (`bloco_de_alteracao_sem_dono`, 26 lacunas, 29 blocos "não localizados"). Procurei o padrão em todo o acervo (`grep`): só 37041 e 37042.

### G7. Documento repetido (37136, 38364)

37136 tem a lei 3 vezes (cabeçalhos nas linhas 4, 197 e 389 do arquivo; 240 linhas não vazias = 3 + 3×79 aproximadamente, com prefixo e última cópia incompletos). 38364 tem 5 cópias de 1.192 linhas, que diferem **só no espaçamento interno** (ex.: `c)   aproveitamento    em    cursos` × `c)   aproveitamento    em     cursos`). `removerRepeticaoIntegral` (`:30-40`) exige divisor exato e igualdade exata de linha cortada nas pontas. `removerRepeticaoDeTexto` devolve `repeticoes: 1` nos dois.

### G8, G9, G10 (não conserto por regra)

- **36841**: `pdftotext` intercalou texto de margem e de coluna no meio das linhas (`…conforme                  preexistente, ou a renovar, níveis de polarização…`). Também aparece na ementa.
- **36190**: OCR (`extracao.metodo:'ocr'`); tem aspa solta `“Art. 4º` que abre bloco falso, artigos com "Art." ilegível (4, 6, 13, 15, 22, 24, 25 não reconhecidos) e quadro de croquis no anexo. A árvore do `art-3` chega a 4.051 caracteres de lixo de OCR. Aviso `texto_de_ocr` já existe; a regra do projeto é não corrigir OCR.
- **44307** (EC 42/2016): a camada de texto do PDF é de baixa qualidade (`EMENDA À L E I ORGÂNICA N° 42`, `Art. I`, `§ I`, ordinal `o` solto numa linha acima, `P E L O N 001/13`, `"(NR)` com aspa reta). Motivos de `cabecalho_nao_reconhecido`, `sem_fecho` etc. acompanham: defeito de fonte.

## 4. Menor conserto por causa, risco, e de quem é

Nenhum conserto abaixo afrouxa a conferência: todos fazem o leitor **ler melhor** (o `conferirConservacao` não é tocado). Para G4 e G6 a conferência passa a rodar sobre o texto já preparado, que é o texto que o leitor lê (mesmo caminho de `prepararTextoExtraido` que hoje já é usado por `estruturar.mjs`, `gerar-revisao.mjs` e `ancorarConferencia`, então as âncoras do dashboard continuam consistentes).

### G1 e G2: agrupadores (core, `parseMinuta`) — 25 + 6 normas
- **G1:** depois de "CAPÍTULO N" (ou título inline), juntar as linhas **seguintes até o próximo `Art.` ou outro agrupador**, pulando linhas em branco. Limites do protótipo: no máximo 3 linhas extras, total ≤ 200 caracteres, nenhuma linha com `Art. N`/`Ar. N`/`§ N`, e só vale se o bloco termina em `Art.` ou agrupador (senão fica como hoje). Aceitar `ÚNICO` (`numero:'ÚNICO'`).
- **G2:** só reconhecer agrupador **depois do preâmbulo** (`stage === 'corpo' || doc.preambulo`) e rejeitar quando o resto da linha começa por minúscula ou pontuação (`do Capítulo II`, `da Lei`, `, o caput`, `deste Capítulo.`). Título real começa por maiúscula.
- **Risco:** (1) sem a guarda de 200 caracteres/`Art.`, o título engole texto de artigo em normas antigas com OCR ruim (medi: 124 → 13 títulos "suspeitos" no acervo sem a guarda mais forte, e 6 com ela; os 6 restantes são normas antigas e um plano diretor, pré-existentes ou fora do alvo). Com a guarda, nenhuma norma recente nova apareceu. (2) G1 sozinho, SEM G2, piora a 50386 (motivos novos) porque a ementa é lida como agrupador: **G1 e G2 vão juntos**. (3) `parseMinuta` também alimenta minuta e `norma-simulacao.html` (cópia embutida do parser): precisa espelhar e validar no navegador. (4) A regra "agrupador só depois do preâmbulo" muda o comportamento para texto sem preâmbulo reconhecido; rodar `teste_minuta`/`teste_regressao` (passaram no protótipo).
- **Do mantenedor?** Parte: "CAPÍTULO ÚNICO" e título de várias linhas são forma de redação; vale confirmar que o título do agrupador é tudo o que vem entre o número e o primeiro artigo.

### G3: continuação de item (core) — 5 normas
- Guardar o item em `last.it` e anexar a continuação a ele; zerar `last.it` quando nasce parágrafo, inciso ou alínea. 6 linhas de diff em `norma-core.js:582,690,729-734`.
- **Risco:** baixo; é o comportamento já usado para inciso e alínea. Mudou 4 normas nos testes e **0 motivos novos** em qualquer das 823. `extrairRedacaoAlterada` (`:896`) tem o mesmo padrão para blocos (`last3` não guarda item): vale verificar à parte, não toquei.
- Espelhar em `norma-simulacao.html`.

### G4: ruído de página (preparo) — 20 normas
- Nova etapa em `prepararTextoExtraido` (antes de trocar `\f` por `\n`): remover (a) a linha só de algarismos cujo valor é **o número da própria página** (contagem de `\f`), uma por página; (b) linha de carimbo de processo `PROC. Nº …` / `PLCL|PLCE|PLL|PLE|PELO|PR Nº …` **que se repita ao menos 2 vezes no documento**. Apagar a linha, não deixar em branco (deixar em branco produz um motivo novo em 51463).
- **Risco:** é a única mudança que tira linha do texto lido. Por isso a regra é estrita: um filtro mais frouxo ("linha só de algarismos com recuo ≥ 10") também resolve os 55, mas apagaria 722 linhas do plano diretor (30209), que é quadro numérico real. Número que não é igual ao da página, ou carimbo que aparece uma vez, fica. A conferência continua exigindo que todo o resto do texto esteja na árvore. Quando o número de página é removido de dentro de um dispositivo, a árvore e a origem preparada continuam iguais (as duas são lidas já preparadas).
- **É decisão do mantenedor (política de dados):** "número de página e carimbo de processo repetido são ruído de impressão e saem do texto lido; o `.txt` guardado não muda." Deve virar item em "Decisões do mantenedor", com a definição acima.
- Consequência: sobe `VERSAO_ESTRUTURADOR` e o dashboard mostra o texto já sem esse ruído.

### G6: "Art. 1º" na linha do preâmbulo (preparo) — 1 norma
- Em `prepararTextoExtraido`: quebrar a linha em `…seguinte (Lei|Lei Complementar|Emenda…):` + `Art. 1º`. Padrão ancorado no preâmbulo; só 2 arquivos do acervo o têm (37041, 37042). Risco muito baixo. Do preparo.

### G5: aspa interna fecha o bloco (core, `detectNRCandidates`) — 1 norma
- Em `norma-core.js:864`, não aceitar como fechamento a linha em que o `”` fecha um `“` aberto na mesma linha (contagem de `“` ≥ contagem de `”` na linha). Não usar para aspa reta (ambígua).
- **Risco:** pode atrasar o fechamento de um bloco legítimo que traga `“…”` dentro e termine com `”` sem `(NR)` (nesses casos o bloco passaria a ser fechado pelo `(NR)` ou pelo `”` seguinte). `teste_blocos_sem_aspas` e `teste_nr_linha_seguinte` passaram; precisa de um teste real próprio (36400) que falhe no código antigo.

### G7: documento repetido (preparo) — 2 normas
- Estender `removerRepeticaoIntegral` para comparar linhas com espaços colapsados (igualdade de conteúdo, não de espaçamento) e tolerar prefixo antes da 1ª cópia / última cópia truncada. **Não afrouxa a conferência:** só descarta a 2ª..Nª cópia de um texto idêntico. Hoje só roda no download (`baixar-textos.mjs:62`); os `.txt` já baixados exigiriam a mesma regra na leitura (`prepararTextoExtraido`).
- **Decisão do mantenedor?** A regra atual (só igualdade exata, decidida na LC 692/2012) é política de dados: relaxar a comparação de espaçamento precisa de OK. Não implementei nem testei no protótipo; é a menos amadurecida. Alternativa sem código: marcar 37136 e 38364 como "defeito de fonte" no dashboard.

### G8, G9, G10
- **Sem conserto de código.** São defeito de fonte/extração: marcar "defeito de fonte" no dashboard (a decisão 12 já diz que o revisor só aceita ou marca defeito de fonte). 36190 e 44307 são os candidatos naturais; 36841 também (coluna lateral). Não propor regra para "limpar" margem ou OCR.

## 5. Efeito medido do conjunto de consertos (protótipo, 823 normas)

Cada passo aplicado sobre o anterior (alvo = as 55):

| Passo | Alvo com o motivo | Todo o acervo com o motivo | Normas "aceita" |
|---|---|---|---|
| antes | 55 | 97 | 537 |
| + G4 (ruído de página) + G6 | 35 | 77 | 551 |
| + G1 + G2 (agrupadores) | 11 | 44 | 567 |
| + G3 (item) | 6 | 38 | 570 |
| + G5 (aspa interna) = protótipo final | **5** (44307, 38364, 37136, 36841, 36190) | **37** | **571** |

- **Motivos novos em qualquer norma: 0.**
- `texto_fora_da_arvore` nas 55: 35 → 4.
- Das 55, 32 passariam a ficar sem nenhum motivo; as demais ainda têm outros motivos já existentes (por exemplo `rotulo_nao_confere_com_a_origem` em 20, que é outro problema: inciso "26 –" lido como arábico onde a origem tem "XXVI", e `sem_fecho`; fora do escopo desta pesquisa).
- Bateria no clone do scratchpad (core + preparo do protótipo): `teste_regressao` 47, `vetado_provenencia` 13, `pecas_2_3` 30, `lei_publicada` 11, `peca4` 29, `urn` 7, `gruposAntes` 16, `promulgacao_parcial` 72, `blocos_sem_aspas` 26, `referencias_alvo` 27, `nr_linha_seguinte` 9, `emenda_lo` 12, `minuta` 33, `estrutura` 62, `textos_sapl` 36, `leis_ordinarias` 20, `versionamento` 34, `historico` 24, todos sem falha; **`normateste.mjs` byte a byte igual**.
- `teste_revisao`: 71 ok e **2 falhas esperadas**: (1) "EC 39/2016: o trecho não localizado vem marcado" usa uma norma cujo trecho deixa de ficar não localizado (precisa de um novo exemplo real, por exemplo 44307 ou 37136); (2) "âncoras concordam com o veredito gravado em 823 normas" falha enquanto `dados/estruturado/` não for reprocessado com `VERSAO_ESTRUTURADOR` maior.

## 6. O que deve virar decisão do mantenedor (e não só código)

1. **Ruído de página** (G4): número de página e carimbo de processo repetido saem do texto lido. É política de dados; propor a redação da seção 4.
2. **Título de agrupador** (G1): tudo entre o número e o primeiro artigo (até 3 linhas) é título; "CAPÍTULO ÚNICO" tem `numero 'ÚNICO'`. É prática de redação; confirmar.
3. **Repetição do documento no arquivo** (G7): relaxar "igualdade exata" para "igualdade de conteúdo" (espaços colapsados, prefixo, última cópia truncada), ou marcar como defeito de fonte.
4. **G8/G9/G10**: confirmar que se resolvem só com "defeito de fonte" no dashboard, sem regra nova. 44307 (EC) tem ainda o problema de camada de texto inteira ruim.

G2, G3, G5 e G6 são bugs do leitor/preparo; não pedem decisão.

## 7. Ordem de ataque recomendada

Seguindo a regra 4 do CLAUDE.md (bateria antes e depois; `normateste.mjs` byte a byte; teste novo que falha no código antigo; CHANGELOG; subir `VERSAO_ESTRUTURADOR`; espelhar no `norma-simulacao.html` o que mexer em `parseMinuta`):

1. **G3 (item)**: menor, só core, 3 normas só dela (43471, 40791, 36892; 37491 e 40311 dependem também de G1). Teste real: 40791 e 43471 (`ali-c` não pode conter o fim do item 2).
2. **G4 + G6 (preparo)**, depois de ter a decisão do mantenedor sobre o ruído. Maior ganho (21 normas) e zero mexida no core. Testes reais: 42994 (número), 51463 e 42236 (carimbo), 42355 (número entre `”` e `(NR)`), 41876 (número entre título e artigo), 37041 (linha do preâmbulo). Incluir caso negativo: o quadro numérico de 30209 não perde linha.
3. **G1 + G2 juntos (core)**: 29 normas. Testes reais: 51486 (3 linhas), 49739 (quebra de página), 38364 (linha em branco), 47599 (ÚNICO), 50386, 43376 e 39862 (falso agrupador). Incluir teste negativo (título que engoliria `Art.`).
4. **G5 (aspa interna)**: 1 norma, teste real 36400.
5. **G7**: depois da decisão.
6. Marcar 36841, 36190 e 44307 como defeito de fonte no dashboard (decisão 12) e escolher um exemplo real novo para a âncora "trecho não localizado" de `teste_revisao`.

## 8. O que não consegui verificar

- Não reprocessei `dados/estruturado/` nem rodei o dashboard (proibido); as contagens vêm de reexecutar `estruturarNorma` em memória, que reproduz as 55 gravadas exatamente.
- O protótipo foi checado contra os testes que rodam sem rede e com o `dados/` atual; `teste_pdf_normas` e `teste_dopa_discovery` não dependem dos trechos mexidos e passaram/pularam, mas não os conferi um a um.
- As 32 normas que ficariam sem motivo não foram conferidas uma a uma contra o texto legal (conferi por amostra: 42994, 51486, 49739, 40791, 43471, 36400 e 37041). A conferência de conservação passa, o que prova que a árvore cobre o texto, não que cada rótulo está certo.
- A causa exata de 36190 (por que a árvore do `art-3` junta o anexo) é plausível (aspa solta + "Art." ilegível), mas não esgotei a reconstituição; em OCR não vale a pena.
- Em 37136 e 38364 não testei a relaxação de G7 (só descrevi a diferença).
- `extrairRedacaoAlterada` (`norma-core.js:896`) repete o padrão de `last3` sem item; não medi se há norma afetada dentro de bloco.
- Não verifiquei o efeito dos consertos nas normas anteriores a 03/02/2009 além de "0 motivos novos" e da queda global de 97 para 37.
