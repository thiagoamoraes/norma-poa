# PLANO-SEM-FECHO — por que 28 normas recentes saem com `sem_fecho`

Pesquisa somente leitura (nenhum arquivo do repositório foi alterado, exceto este relatório). Protótipos e medições em
`/tmp/claude-0/-home-user-norma-poa/6f77e18e-f055-5f0b-99c2-42f683ae1059/scratchpad/agente-fecho/`
(`fix.mjs` = protótipo; `run.mjs` = roda `estruturarNorma` nas 823 normas; `cmp.mjs` = compara antes × depois; `neg.mjs`, `neg2.mjs` = casos negativos).
Este relatório é insumo, não autoridade: as afirmações que sustentam uma decisão foram reconferidas por script independente (seção 6).

Convenção: assinaturas e nomes de pessoas foram omitidos das linhas citadas (repositório público); aparecem como `[assinatura]`.

## 1. Resultado em uma tabela

Onde nasce: `ingestao/estrutura.mjs:245` (`if (!doc.fecho) motivos.push('sem_fecho')`); `doc.fecho` só é preenchido em `norma-core.js:772`, a partir de `fechoBuf`, que só enche quando `reFecho` (`norma-core.js:615`) casa uma linha com `stage === "corpo"` (`norma-core.js:646`, ou seja, depois do 1º "Art.").

| Causa | Qtde | Ids | O que é |
|---|---|---|---|
| **A1** Preparo/extração: forma de fecho JÁ conhecida, mas o PDF estragou o espaçamento ou quebrou a linha | 14 | 36824, 37172, 39220, 39563, 39708 (palavras coladas); 37358, 37379, 37403, 37422, 37491, 37517, 37562 (letras espaçadas + ano partido "201 1."); 38117 (fecho em 2 linhas); 44307 ("A L E G R E") | `reFecho` estrita não casa; `juntarFechoQuebrado` só une "…de" + ano exato `^\d{4}\.?$` |
| **A2** Preparo (DOCX): fecho colado ao fim da linha do último artigo | 1 | 48855 | uma linha só: `Art. 12. … publicação. PREFEITURA MUNICIPAL DE PORTO ALEGRE, 8 de julho de 2024.` |
| **B1** Defeito de fonte: arquivo sem corpo de lei (capa de índice, vazio, só anexo/mapa/tabela, aviso) | 8 | 44158, 40514, 36914, 36188, 40318, 40303, 36372, 39395 | todos também com `sem_artigos` |
| **B2** Defeito de fonte: a lei publicada não traz linha de fecho (local/data) | 1 | 39600 | termina em "Art. 3º …" + "Presidente." + "Registre-se e publique-se:" |
| **B3** Defeito de fonte: fecho ilegível por OCR/camada de texto ruim | 3 | 41347, 41179, 44305 | "PREFEITURA M ALEGRE", "MUNIÇIPAL", "25 DE MAJO DE 2017" |
| **D'** Bug do detector de bloco (não do `reFecho`): bloco de alteração falso engole o fecho | 1 | 36190 | OCR de 35 páginas; fecho está dentro de um bloco inferido linhas 35–320 |
| **C** Forma legítima nova de fecho | **0** | — | nenhuma das 28 traz um padrão de fecho novo |
| **E** Promulgação parcial / veto / ato sem fecho próprio | **0** | — | 39600 é promulgação da Câmara, mas o motivo real é B2 |

Soma: 14 + 1 + 8 + 1 + 3 + 1 = 28. As **10 normas que só têm `sem_fecho`** (36824, 37172, 37358, 37379, 37403, 37562, 38117, 39220, 39563, 39708) estão todas em A1: o conserto de A1 as tira da fila.

## 2. Evidência por causa

### A1 — espaçamento estragado pelo PDF (14)
Todas `pdftotext`, não OCR (`extracao.metodo` em `dados/textos/sapl/_indice.jsonl`). Linhas exatas do fecho (índice da linha após `prepararTextoExtraido`):

- 39220 (L29), 39708 (L68): `PREFEITURA MUNICIPALDE PORTO ALEGRE, 7 de janeiro de 2014.` — "MUNICIPALDE" colado.
- 39563 (L34), 36824 (L122): `PREFEITURAMUNICIPAL DE PORTO ALEGRE, 5 de agosto de 2014.` — "PREFEITURAMUNICIPAL" colado.
- 37172 (L177): `PREFEITURA MUNICIPAL DE PORTOALEGRE, 1º de fevereiro de 2011.`
- 37562 (L66-67): `PREFEITURA M UN ICIPA L DE PORTO ALEGRE, 8 de set embro de` / `201 1.`
- 37403 (L52-53): `PREFEITURA M UN ICIPA L DE PORTO ALEGRE, 6 d e ju lho de` / `201 1.`
- 37379 (L31-32): `PREFEITURA M UNICIPAL DE PORTO ALEGRE, 2 2 d e junho de` / `201 1.`
- 37358 (L42-43): `PREFEITURA M UNICIPAL DE PORTO ALEGRE, 1 6 d e junho de` / `201 1.`
- 37422 (L267-268), 37491 (L736-737), 37517 (L982-983): mesma família ("M UNICIP AL", "P ORTO", "201 1.").
- 38117 (L38-41): `GABINETE DA PRESIDÊNCIA DA CÂMARAMUNICIPAL DE PORTO` / (2 linhas em branco) / `ALEGRE, 29 DE MARÇO DE 2012.` — "CÂMARAMUNICIPAL" colado e fecho em duas linhas.
- 44307 (L47): `CÂMARA MUNICIPAL DE PORTO A L E G R E , 3 DE AGOSTO DE 2016.`

Últimas linhas (exemplos), 39563:
```
   Art. 2oEsta Lei Complementar entra em vigor nadata de sua publicação.
   PREFEITURAMUNICIPAL DE PORTO ALEGRE, 5 de agosto de 2014.
              [assinatura] Prefeito.
              [assinatura] Secretário Municipal de Urbanismo.
   Registre-se e publique-se.
   [assinatura] Secretário Municipal de Gestão.
```
O motor produziu: `fecho` vazio; o fecho e as assinaturas **grudaram no texto do último artigo** (ex. 39563: o texto do art. 2º termina em "…Municipal de Urbanismo. Registre-se e publique-se. … Secretário Municipal de Gestão."), efeito que o comentário do próprio `norma-core.js` (linhas 590-594) descreve como a razão de existir o estágio `fecho`.

Por que `reFecho` falha: ramo PREFEITURA exige `PREFEITURA\s+MUNIC\s?IPAL\s+DE\s+PORTO\s+ALEGRE` (espaços obrigatórios entre palavras, no máximo um espaço dentro de "MUNICIPAL"); ramo CÂMARA/Porto Alegre exige `\s+` entre as palavras e a data na mesma linha.

Precedente no projeto: a grafia "MUNIC IPAL" (1 espaço) já foi aceita pelo mantenedor com o mesmo argumento ("os dois leitores de PDF dão o mesmo resultado, logo o defeito é do arquivo", comentário em `norma-core.js:607-611`). A1 é a mesma família, só que mais ampla.

### A2 — DOCX com fecho colado ao último artigo (1: 48855)
Texto guardado (`dados/textos/sapl/48855.txt`, `extracao.metodo: docx`):
```
Art. 2º VETADO Art. 3º VETADO Art. 4º VETADO … Art. 9º VETADO Art. 10. VETADO
Art. 11. VETADO
Art. 12. Esta Lei Complementar entra em vigor na data de sua publicação. PREFEITURA MUNICIPAL DE PORTO ALEGRE, 8 de julho de 2024.
[assinatura], Prefeito de Porto Alegre.
Registre-se e publique-se.
[assinatura], Procurador-Geral do Município.
```
O `docxParaTexto` (`ingestao/extracao-texto.mjs:107`) quebra linha por `</w:p>` e `<w:br/>`; aqui o próprio DOCX trouxe vários dispositivos num mesmo parágrafo (não consegui abrir o DOCX original: `dados/_bruto/` não está neste ambiente; a afirmação é inferida do texto). Efeito: a linha começa com "Art. 12." e `reFecho` (ancorada no início) nunca vê o fecho. Motivos produzidos: `sem_fecho` + `rotulo_nao_confere_com_a_origem` (este segundo vem do "Art. 2º VETADO Art. 3º VETADO …" colado, **problema à parte, não tratado aqui**).

### B1 — arquivo sem corpo de lei (8)
- 44158 (LC 951/2022, `pdftotext`, 509 caracteres): só a capa do caderno do Diário (`Órgão de Divulgação do Município … Gabinete do Prefeito … Protocolo: …` + ementa + repetição do cabeçalho). Sem artigos.
- 40514 (LC 790/2016, `html_sirel`, 20 alfanuméricos): conteúdo literal `LC 790` ×4 e `<`.
- 36914 (LC 652/2010) e 36188 (LC 623/2009), `html_sirel`: conteúdo literal `<`, 0 alfanuméricos. (o índice de textos já os marca `texto_curto`.)
- 40318 (LC 779/2015): aviso da redação oficial "TORNA SEM EFEITO a publicação da Lei Complementar nº 779 … por inserção indevida", 418 caracteres; não é o texto da lei.
- 40303 (LC 775/2015, OCR 1 página): mapa ("Mapa do Município…"); 36372 (LC 630/2009, OCR 1 página): mapa (palavras soltas, "RESTINGA", "VIAMÃO"); 39395 (LC 738/2014): tabela numérica de anexo, 202 alfanuméricos.
Não há fecho para reconhecer: o texto da lei não está no arquivo.

### B2 — a lei publicada não traz linha de fecho (1: 39600)
LC 743/2014, promulgada pelo Presidente da Câmara ("aprovou e eu promulgo a Lei Complementar nº 743"). O arquivo traz o documento 3 vezes (decisão 24 do CLAUDE.md: repetição com diferença de espaçamento não é removida). Em **cada** cópia o fim é:
```
Art. 3º Esta Lei Complementar entra em vigor na data de sua publicação,retroagindo seus efeitos a 1º de
agosto de 2013.
            [assinatura], Presidente.
Registre-se epublique-se:
[assinatura], 1º Secretário.
```
Não há "CÂMARA MUNICIPAL DE PORTO ALEGRE, <data>." nem "GABINETE DA PRESIDÊNCIA…" em nenhuma das 3 cópias (busca por "porto alegre" e por data no arquivo inteiro: só cabeçalho e preâmbulo). Sem o PDF original não dá para dizer se a linha existe e foi perdida na extração; pelo texto guardado, é defeito de fonte. Não é um fecho "de forma nova" (não há local/data nenhum).

### B3 — OCR/camada de texto ruim (3)
- 41347 (LC 818/2017, OCR): `PREFEITURA M ALEGRE, 11 de setembro de 2017.` (OCR comeu "UNICIPAL DE PORTO").
- 41179 (LC 813/2017, OCR): `PREFEITURA MUNIÇIPAL DE PORTO ALEGRE, 20 de março de 2017.` ("MUNIÇIPAL" com cedilha).
- 44305 (EC 43/2017, `pdftotext` sobre camada ruim): `CÂMARA MUNICIPAL DE PORTO A L E G R E , 25 DE MAJO DE 2017` ("MAJO" no lugar de "MAIO"; sem ponto final). A parte do espaçamento seria coberta pelo conserto de A1; o mês estragado não.
Regra do projeto: texto de OCR nunca é corrigido por regra. Aceitar esses fechos exigiria afrouxar o reconhecimento, o que é decisão do mantenedor (ver 4).

### D' — bloco de alteração falso engole o fecho (1: 36190)
LC 624/2009, OCR de 35 páginas (anexos de mapas). `detectNRCandidates` abre um bloco na L35 (`“Art. 4º Na UEU 22 da MZ 08, …`, uma aspa de abertura de verdade da OCR em linha de artigo) e o fecha na L320, linha de anexo que termina em `…AEIS Il,“` (aspa de **abertura** lida como fechamento por `reFechaDup`, `norma-core.js:~896`). O bloco 35-320 contém a linha 205 `PREFEITURA MUNICIPAL DE PORTO ALEGRE, 25 de junho de` (que **casaria** em `reFecho`), mas o laço pula tudo até `endIdx` (`skipUntil`, `norma-core.js:~632/640`). Resultado: `artigos=3`, `texto_fora_da_arvore`, `trecho_nao_localizado_na_origem` e `sem_fecho`. Além disso o texto OCR perdeu o ano do fecho. Não é bug do fecho; é fronteira de bloco inferida em OCR ruidoso. Não proponho conserto (fora do escopo e mexe em `detectNRCandidates`).

## 3. Menor conserto por causa e onde

### A1 + A2: um passo de preparo, fora do core (proposta de código, só preparo)
Novo passo em `ingestao/extracao-texto.mjs`, encadeado em `prepararTextoExtraido` (linha 205), ao lado de `juntarFechoQuebrado` (linha 241) e `separarArtigoDoPreambulo` (linha 312, precedente direto de A2: "Art. 1º colado ao fim do preâmbulo"). Não toca `norma-core.js`, logo não há cópia embutida em `norma-simulacao.html` para espelhar.

Protótipo medido (`fix.mjs`), regras:
1. Só age **depois do 1º "Art."** e **só enquanto nenhuma linha já casa `reFecho`** (a regex atual do core, copiada). Onde o leitor atual já acha o fecho, o passo não faz nada.
2. Compacta a linha (remove todo espaço em branco) e exige a estrutura completa: `<CABEÇA>,<dia>[º°]de<mês>de<aaaa>[.]` com cabeça ∈ {`PREFEITURAMUNICIPALDEPORTOALEGRE`, `GABINETEDAPRESIDÊNCIADACÂMARAMUNICIPALDEPORTOALEGRE`, `CÂMARAMUNICIPALDEPORTOALEGRE`, `PORTOALEGRE`}, **mês ∈ os 12 nomes**, ano de 4 dígitos.
3. Se faltar a data, junta até 3 pedaços não vazios seguintes (cobre "…de" + "201 1." e "…DE PORTO" + "ALEGRE, 29 DE MARÇO…"), parando se o acumulado já tem ano e não termina em "de".
4. Reescreve o(s) pedaço(s) como a linha canônica (`PREFEITURA MUNICIPAL DE PORTO ALEGRE, 8 de setembro de 2011.`). Detalhe a corrigir antes de commit: o protótipo descartou o "º" do dia em 37172 ("1º" → "1"); a versão final deve preservar o ordinal e o ano como na fonte (só remover espaço), porque `alnum` conta "º" como letra na conferência de conservação.
5. A2 (48855): separar `<texto> <CABEÇA MAIÚSCULA>, <data>.` em duas linhas quando o fim da linha é um fecho completo, só para as 3 cabeças institucionais em MAIÚSCULAS (nunca "Porto Alegre, d de m de a" no meio de frase). Medido: **1 ocorrência em 823**; negativos reais: 86 linhas com a cabeça no meio ("A MESA DA CÂMARA MUNICIPAL DE PORTO ALEGRE, nos …" etc.) — nenhuma termina em data, nenhuma é tocada.

Requisitos do projeto para o código real: teste novo `.mjs` com texto real (os ids acima estão em `dados/textos/sapl/`), que **falha contra o código antigo** (hoje: `sem_fecho` + fecho colado ao último artigo); bateria inteira antes e depois; entrada no `CHANGELOG.md`; subir `VERSAO_ESTRUTURADOR` (hoje 16) para reprocessar. Aviso: o `.txt` guardado não muda (como em `removerRuidoDePagina`), só o texto lido.

### B1, B2: nenhum conserto de código
Defeito de fonte. Caminho do projeto: o revisor marca "defeito de fonte" no dashboard. Opcional, **decisão do mantenedor**: o motivo `sem_fecho` é redundante quando já há `sem_artigos` (as 8 de B1); ocultá-lo mudaria a contagem do relatório.

### B3: só por decisão (ver 4)

### D': sem conserto proposto (ver riscos)

## 4. O que é decisão do mantenedor (não código)

1. **Aceitar o espaçamento corrompido como variante dos 4 fechos já reconhecidos** (A1/A2). Evidência: 14 normas das 28 (19 no acervo todo) + os 5 antigos 26412, 27599, 27882, 30183, 35930. Todas as linhas medidas são o fecho real, no fim do documento. Isto amplia a regra "regex estrita: a linha inteira" do CLAUDE.md (Textos de normas, Fechos reconhecidos) — por isso é decisão dele, embora não crie padrão novo.
2. **Mês ilegível (44305, "MAJO")**: aceitar qualquer palavra de 3–9 letras como mês, em vez dos 12 nomes, recupera só essa norma (20 em vez de 19 no acervo), ao custo de aceitar mês inexistente num texto de lei. Recomendação: **não** (a norma fica "a revisar" com `sem_fecho`, que é o sinal correto).
3. **Fechos de OCR** (41347 "PREFEITURA M ALEGRE", 41179 "MUNIÇIPAL"): um padrão frouxo `PREFEITURA … ALEGRE, <data>.` os pegaria (medido: nenhum falso positivo extra no acervo além de fechos reais), mas o projeto não corrige OCR por regra. Recomendação: deixar para o revisor.
4. **39600 (Câmara promulgou sem linha de local/data)**: confirmar com o PDF original se é de fato assim; se for, é caso de revisão manual, não de regra.

Não há decisão de "novo padrão de fecho" (C = 0): nenhuma das 28 exige reconhecer um local/data com forma diferente das 4 já decididas.

## 5. Prova do conserto A1+A2 nas 823 normas (cópia em scratchpad)

Linha de base reproduzida: `estruturarNorma` sobre as 823 normas dá os mesmos `motivos` já gravados em `dados/estruturado/sapl/*.json` (0 divergências). `sem_fecho` no acervo inteiro: **93**.

| Medida | Com meses válidos | Com mês qualquer |
|---|---|---|
| Normas que perdem `sem_fecho` | **19** (14 das 28 + 5 antigas) | 20 (+44305) |
| Normas que ganham motivo novo | **0** | 0 |
| Normas que já tinham fecho e mudaram (fecho ou texto) | **0** | 0 |
| Normas cujos dispositivos mudam | 19 (todas as recuperadas: o fecho e as assinaturas saem do texto do último artigo) | 20 |
| `revisar` → `aceita` | 14 (10 das 28 + 4 antigas: 27599, 27882, 30183, 35930) | 14 |
| `sem_fecho` restante no acervo | 74 | 73 |

(A 1ª versão do protótipo reescrevia fechos já reconhecidos e mexia em 66-129 normas; foi corrigida para só agir quando o leitor atual não acha fecho e para parar no 1º fecho — essa trava é parte do desenho, não opcional. Caso que a revelou: 16471, compilação de várias Emendas à LO no mesmo arquivo, com um 2º fecho "dejunho".)

Falsos positivos / casos negativos reais do acervo (`neg.mjs`): linhas que casam a estrutura tolerante mas não casam o `reFecho` atual = **14**, todas verdadeiras (13 no último quarto do documento + 16471 acima, neutralizada pela trava); nenhuma linha de texto comum. Linhas com a cabeça institucional mas sem data (ex. "A MESA DA CÂMARA MUNICIPAL DE PORTO ALEGRE, nos", 16471/19330/26346/26405…) não casam. "Porto Alegre, <data>" no meio de frase só importa para a cabeça `PORTOALEGRE`; o passo só a considera numa linha inteira, depois do 1º artigo e antes de qualquer fecho já visto.

## 6. Verificação independente

- Linha de base conferida contra o JSON gravado (0 divergências), e as 28 listas reconferidas com `prepararTextoExtraido` + `parseLeiPublicada` (`d.mjs`): `fecho` vazio nas amostras 36190, 48855, 39563.
- Contagem das linhas "tolerantes mas não atuais" por regex **diferente** da do protótipo (`neg.mjs`, regex própria sobre `\s+` removido): 14, os mesmos ids.
- 48855 com a separação de fecho colado (script avulso): `fecho` = "PREFEITURA MUNICIPAL DE PORTO ALEGRE, 8 de julho de 2024.\n…Procurador-Geral do Município."; resta só `rotulo_nao_confere_com_a_origem` (artigos "VETADO" colados).
- 36190: confirmado pelo `detectNRCandidates` que o bloco `[35, 320]` cobre a L205.

## 7. Riscos

- A1 reescreve (a linha lida, não o arquivo) o fecho: manter caracteres da fonte (ordinal, ano) para não perturbar `conferirConservacao`; o protótipo não gerou motivo novo, mas só rodou com o "º" perdido em 1 caso.
- Trava "só antes do 1º fecho": em arquivo com várias leis (16471) só o primeiro fecho conta — igual ao comportamento atual do core; não piora.
- Há uma 2ª `reFecho` em `norma-core.js:547` (`extrairProvenienciaPromulgacao`, só lê a data da linha). Com o conserto no preparo ela já recebe a linha canônica; se o mantenedor preferir o conserto dentro do core, as duas regexes e `reInicio` de `juntarFechoQuebrado` (`extracao-texto.mjs:242`) precisam ser mantidas juntas, e a cópia embutida em `norma-simulacao.html` espelhada.
- D' (36190): mexer na janela de 300 linhas ou em `reFechaDup` afeta `detectNRCandidates` em todo o acervo; não medi; fora do escopo.
- Aceitar 14-19 normas como `aceita` melhora a taxa das recentes, mas 4 delas (37422, 37491, 37517, 44307) continuam `revisar` por outros motivos.

## 8. Ordem de ataque

1. Levar ao mantenedor a decisão 4.1 (variante com espaçamento corrompido) e 4.2/4.3 (recomendação: não).
2. Se aprovado: passo de preparo A1+A2 com teste de texto real que falha no código antigo (ids 39563, 37562, 38117, 44307, 48855; mais um negativo: 16471 e uma linha "A MESA DA CÂMARA MUNICIPAL DE PORTO ALEGRE, nos"), bateria antes/depois, CHANGELOG, `VERSAO_ESTRUTURADOR` 17.
3. Marcar B1/B2/B3 como "defeito de fonte" no dashboard (nenhum código).
4. Tratar à parte (próxima rodada): "Art. N. VETADO Art. N+1 …" colado em 48855 (`rotulo_nao_confere`) e o bloco falso de OCR em 36190.

## 9. O que não consegui verificar

- Os PDFs/DOCX originais (`dados/_bruto/` ausente): afirmei "defeito do arquivo" a partir do texto extraído; para 39600 e 48855 só o original diria se a linha/quebra existe na fonte.
- As outras 65 normas antigas com `sem_fecho` (93 − 28): só medi o efeito do conserto sobre elas (5 recuperadas), não classifiquei as 60 restantes.
- Efeito do conserto sobre `docs/` (revisão/compara), `norma-simulacao.html` e a bateria de testes do core: não rodei a bateria (o conserto proposto não toca o core).
- 36190: se o ano do fecho existia na fonte (OCR o perdeu).
