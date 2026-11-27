<!-- Relatório de agente de pesquisa (somente leitura), 27/11/2026. INSUMO, não autoridade: afirmações que sustentam decisão são reconferidas (regra 12c). Ver PLANO-REVISOES.md. -->
# A — `rotulo_nao_confere_com_a_origem` nas normas recentes (levantamento de 27/11/2026)

Fonte: `docs/dados/revisao/fila.json` (132 recentes a revisar; estruturador v30). **49 normas** têm o motivo (recontado). Em **32** delas é o único motivo; nas outras 17 a norma continua na fila por outro motivo, mesmo que o rótulo se resolva. No total são 366 rótulos divergentes. Scripts usados (só leitura): `scratchpad/levantamento/a/{dump,ctx,engolidos,emb}.mjs`.

Como a conferência funciona (`ingestao/estrutura.mjs:194-249`, `conferirConservacao`): o texto que vem logo antes de cada trecho na origem tem de terminar com o rótulo que o motor deu. O motor (`parseMinuta`) numera **por posição**. Então qualquer diferença entre o número escrito e a posição gera o ponto, seja um defeito da lei, seja um erro do leitor.

## 1. Tabela por norma

Códigos de causa: a = a lei pula, repete ou troca um número · b = dispositivo engolido ou embutido · c = sufixo "-A" · e = glifo, espaçamento ou OCR · f = promulgação parcial · g = cascata (aparece junto com outra causa) · h = outra.
Classes: 1 = regra · 2 = IA propõe e o humano confere por amostra · 3 = humano · 4 = fonte.

| id | rótulo | outros motivos | causa real (verificada no texto) | fam. | cl. |
|---|---|---|---|---|---|
| 51804 | Lei 14.667/2026 | — | A lei **pula o Art. 2º**: "Art. 1º … § 2º …" e logo "Art. 3º O Protocolo…" (linhas 20→32 do .txt; não há "Art. 2" em todo o arquivo). Os 5 artigos seguintes ficam deslocados em +1. | a-pula | 2 |
| 51485 | LC 1.075/2026 | parcial, fecho, bloco sem dono | Promulgação parcial: "Art. 185. ……". O ponto é um **artefato**: o texto do dispositivo é só pontos, ou seja, vazio. | f + artefato | 3 |
| 51122 | Lei 14.504/2026 | parcial | Parcial: "promulgo dispositivo … Art. 4º Fica alterado…", que o motor numerou como Art. 1º. | f | 3 |
| 50214 | Lei 14.211/2025 | — (aviso OCR) | OCR: "\| — proteger…" (I) e "Il — promover…" (II). O inciso I não foi lido e ficou colado ao caput, deslocando os seguintes em +1 em dois artigos. | e-OCR | 4 |
| 49739 | LC 1.037/2025 | — | A lei **nasceu com artigos "-A"**: "Art. 31-A.", "Art. 32-A" a "32-E", "Art. 33-A" (linhas 944-1041; é o texto original, sem nota de compilação). O motor numera Art. 32, 33… | c | 3 (pergunta) |
| 48774 | Lei 13.956/2024 | — | A lei **repete o III**: "III – multa diária…" e "III – apreensão do veículo…", depois "IV – descadastramento". | a-repete | 2 |
| 48213 | Lei 13.868/2024 | — | Erro de digitação na fonte, **"Art, 4º A coleta…"** (vírgula). O leitor não reconhece o artigo e o engole no inc. III do art. 3º; "Art. 5º" vira art-4. | b-Art, | 1 |
| 47934 | Lei 13.829/2024 | — | **Bug do leitor**: a quebra de linha deixa "§ 1°, da Constituição Federal de 1988;" no início da linha (dentro do inc. II do art. 3º), e isso vira um parágrafo § 1º. Os incisos III e IV passam a ser filhos desse § falso. | b-§cit | 1 |
| 46770 | Lei 13.574/2023 | alteração sem aspas | Bloco **sem aspa de abertura**: "Art. 10. Fica incluído art. 13-A … conforme segue:" e depois "Art. 13-A. O Executivo…" (sem “), fechando em "semestralmente.”". O art. 13-A vira artigo da alteradora. | h-sem-abertura | 3 |
| 46547 | Lei 13.517/2023 | — | A lei **repete "Art. 2º"** (linhas 6 e 7: "Art. 2º Serão incentivadas…", "Art. 2º Esta Lei entra em vigor…"). | a-repete | 2 |
| 46403 | Lei 13.501/2023 | fora da árvore, não localizado, aspa de abertura | **Aspa de fechamento fora do lugar** na fonte: "…anteriores à aposentadoria.”" depois do § 6º, mas o bloco continua até o § 9º ("…posteriores.”"). Os §§ 7º a 9º viram §§ 1º a 3º do art. 12 da alteradora. | h-aspa-meio | 3 |
| 46229 | Lei 13.473/2023 | — | **Incisos embutidos** na mesma linha: "I – residir…; II – estar…" e "III – possuir…; IV – não possuir…". | b-embutido | 3 (pergunta) |
| 44376 | LC 957/2022 | — | **Aspa de fechamento intermediária**: "…sustento do menor.”" no fim do art. 133-B. Os arts. 133-C a 133-F viram arts. 5º a 8º da alteradora, e há uma cascata de −4 nos arts. 9 a 27 (19 artigos). | h-aspa-meio + g | 3 |
| 44038 | Lei 13.162/2022 | parcial | Parcial ("Art. 2º ……", "Art. 3º ……", "Art. 7º"). Dois dos 3 pontos são o artefato de texto vazio. | f + artefato | 3 |
| 43595 | LC 932/2022 | — | A lei **pula o IV**: "III – idade…; e" e logo "V – sorteio." | a-pula | 2 |
| 43565 | Lei 12.939/2021 | — | A lei **repete o II** ("II – 6 (seis) de Assessor I", "II – 3 (três) de Responsável…"). | a-repete | 2 |
| 43543 | LC 925/2021 | — | **Aspa + "(NR)" no meio do bloco**: "…2% (dois por cento).” (NR)" depois do XIX. O "XXXI – serviços previstos no subitem 14.14…" sai do bloco e vira o inc. I do art. 1º da alteradora (é o caso citado na decisão 25). | h-aspa-meio | 3 |
| 43376 | LC 915/2021 | alteração sem aspas | **Sem aspa de abertura** antes de "Art. 37-A. Para o cálculo…" (linha 239), fechando em "…na forma desta Lei Complementar.” (NR)". Cascata de −1 nos arts. 13 a 28 (é o R5 de `PLANO-ALTERADORA-SEM-ASPAS.md`). | h-sem-abertura + g | 3 |
| 42987 | LC 896/2021 | número e data divergem | Mesmo texto da 43595 (decisão 27): a lei pula o IV. | a-pula | 2 |
| 42590 | Lei 12.708/2020 | parcial | Parcial: "Art. 2º", "Art. 4º". | f | 3 |
| 42524 | Lei 12.704/2020 | — | **Glifo "l" no lugar de "I"** na camada de texto (pdftotext, não é OCR): "l - a afirmação…", "Vll -", "Vlll --" e "l - campanhas…" no art. 4º. | e-glifo | 1 (pergunta) |
| 42523 | Lei 12.703/2020 | — | Mesmo glifo: **"Art. Iº Ficam as entidades…"**. O Art. 1º não é reconhecido e os arts. 2 e 3 recuam. | e-glifo | 1 (pergunta) |
| 42401 | LC 872/2020 | parcial | Parcial (escritos: "Art. 8º", "11", "14", "21"…). Três pontos são o artefato de texto vazio. | f + artefato | 3 |
| 42382 | Lei 12.656/2019 | parcial | Parcial ("Art. 18. ……", "§ 2º ……", "II – ……"). **Os 3 pontos são todos o artefato de texto vazio.** | f + artefato | 3 |
| 42356 | LC 868/2019 | — | **Número trocado** no último inciso: "VI – o art. 113; e" e logo "V – o art. 114." (deveria ser VII). | a-trocado | 2 |
| 42068 | Lei 12.545/2019 | — | **Subtítulos sem rótulo** na descrição dos empregos ("CONDIÇÕES DE TRABALHO:", "RECRUTAMENTO:"): as alíneas recomeçam em a), b) sob cada um, e o motor faz a…d (30 pontos, 16 grupos). | h-subtitulo | 3 |
| 41955 | Lei 12.501/2019 | — | Bloco de anexo **sem aspa de fechamento**: "Art. 5º Fica incluída letra d no Anexo I…" e depois "“Anexo I" (linha 131). Não há nenhum ” no arquivo. A descrição dos cargos, com incisos que recomeçam em I, vira incisos do art. 5º (68 pontos). | h-anexo-aberto | 3 |
| 41862 | Lei 12.482/2018 | parcial | Parcial ("Art. 2º ……", "III –"). Um ponto é o artefato. | f + artefato | 3 |
| 41723 | LC 835/2018 | — | "§ 17. VETADO." aparece **depois** de "” (NR)", e vira o parágrafo único do art. 1º da alteradora. Além disso a lei **pula o Art. 10** ("Art. 9º …" e logo "Art. 11. Ficam revogados"). | h-vetado-fora + a-pula | 3 |
| 41718 | Lei 12.440/2018 | — | Os **dispositivos vetados do bloco vêm depois de "” (NR)"**: "…distância mínima de:” (NR)", seguido de "I – VETADO." a "III – VETADO." e de "§ 2º VETADO." a "§ 5º VETADO.". Viram dispositivos do art. 1º da alteradora. | h-vetado-fora | 3 (pergunta) |
| 41680 | Lei 12.423/2018 | — | **Aspas de fechamento intermediárias** no bloco do art. 4º: "…por veículo cadastrado.”" e "…mês de referência.”" antes do § 6º. Os §§ 4º, 6º a 8º viram §§ 1º a 4º do art. 6º da alteradora. | h-aspa-meio | 3 |
| 41676 | Lei 12.420/2018 | parcial | Parcial ("Art. 2º", "Art. 25", "Art. 27"…). Três pontos são o artefato. | f + artefato | 3 |
| 44305 | EC 43/2017 | cabeçalho, sem fecho, bloco sem dono | Digitalização ruim ("Art. 2\" Esta Emenda", "Art. 3   Fica revogado", "§2" solto). Está na decisão 32. | e-OCR | 4 |
| 41098 | LC 810/2017 | — | A lei **pula o IV** no art. 8º ("III – Smams…" e logo "V – SMIM…"; conferido em todos os incisos do artigo). | a-pula | 2 |
| 44307 | EC 42/2016 | cabeçalho, fora da árvore, não localizado, bloco sem dono | Digitalização ruim (decisão 32). | e-OCR | 4 |
| 40311 | LC 777/2015 | — | A lei **pula o III** no art. 7º ("II – estiver sobre o passeio…" e logo "IV – estiver sobre coletores…"). | a-pula | 2 |
| 39862 | LC 757/2015 | — | A lei **repete o "Art. 8º"** com duas redações (linhas 193 e 195: "§ 2º" × "§ 3º") e repete o § 8º do art. 21. Cascata de −1 até o art. 63 (56 pontos, 3 grupos). | a-repete + g | 3 |
| 39138 | LC 721/2013 | — | **Número trocado**: "IX –um conjunto…" no lugar de XIX (o último do art. 2º). Além disso há dois "IV –" sem texto, nos arts. 6 e 16, que são o artefato. | a-trocado + artefato | 2 |
| 38249 | LC 694/2012 | — | **Número trocado**: "XI – acompanhamento médico-veterinário" logo depois de VIII (é o último antes do § 1º). | a-trocado | 2 |
| 38041 | LC 688/2012 | — | **Aspa + "(NR)" intermediária**: "…das testadas.” (NR)", depois "Parágrafo único……" e "III – sejam classificados…”" do mesmo art. 4º. Há também um ponto de artefato. | h-aspa-meio | 3 |
| 37517 | LC 679/2011 | — | **Espaçamento estragado no rótulo** (pdftotext): "X V –", "X VI –", "X VII –", "X VIII –" (linhas 90-104) e "Art. 1 5.", "Art. 2 0.", "Art. 3 8.", "Art. 5 9.", "Art. 6 5". | e-espaço | 1 (pergunta) |
| 37491 | LC 678/2011 | — | Mesmo defeito: "Art. 1 5.", "Art. 1 6.", "Art. 2 1.", "Art. 3 5.", "Art. 3 8." e "X V –". O texto dos artigos chega a ficar como **"5. Os elementos…"**. | e-espaço | 1 (pergunta) |
| 37422 | LC 677/2011 | tabela no corpo | Mesmo defeito: "Art. 2 6. A GIM…". | e-espaço | 1 (pergunta) |
| 37090 | LC 663/2010 | fecho com texto demais, endereço repetido | Digitalização ruim ("Art. 30/ NaUEU", "Art. 3-9.") (decisão 32). | e-OCR | 4 |
| 37042 | LC 661/2010 | — | **Inciso I embutido** na linha do caput: "Art. 15. Compete ao Fórum…: I – encaminhar…". | b-embutido | 3 (pergunta) |
| 37041 | LC 660/2010 | — | Mesmo caso: "Art. 32. Ficam revogados: I – o inc. II do art. 4º…". | b-embutido | 3 (pergunta) |
| 36841 | LC 646/2010 | 6 motivos | Extração com **duas colunas misturadas** ("REPUBLICAÇÃO … Art. 2º Fica incluído…" na mesma linha; "Art. 4º" aparece antes de "Art. 1º"). | h-colunas | 4 |
| 36634 | LC 638/2010 | — | **Inciso embutido com texto truncado**: "…Lei Complementar nº 434, de 1 III – Índice de Aproveitamento" (o "999;" se perdeu). | b-embutido + fonte | 3 |
| 36316 | LC 628/2009 | — | No arquivo a alínea a) **não tem rótulo**: "I – nos casos de exposição…: multa de 500 (quinhentas) UFMs…" e logo "b) suspensão…". Não conferi no PDF (sem rede). | a-rótulo ausente | 4 |

## 2. Famílias de causa (soma = 49)

| família | n | ids | classe |
|---|---|---|---|
| a-pula: a lei pula um número | 5 | 51804, 43595, 42987, 41098, 40311 | 2 (regra possível, ver R6) |
| a-repete: a lei repete um número | 4 | 48774, 46547, 43565, 39862 | 2 (39862: 3) |
| a-trocado: número isolado errado, sempre no último item | 3 | 42356, 39138, 38249 | 2 |
| a-ausente: rótulo ausente no arquivo | 1 | 36316 | 4 |
| f: promulgação parcial | 8 | 51485, 51122, 44038, 42590, 42401, 42382, 41862, 41676 | 3 (continuam na fila por `promulgacao_parcial`) |
| c: lei nascida com artigo "-A" | 1 | 49739 | 3 (pergunta P3) |
| b-Art,: "Art," com vírgula | 1 | 48213 | 1 (R1) |
| b-§cit: citação "§ N°," no início de linha lida como parágrafo | 1 | 47934 | 1 (R2, bug) |
| b-embutido: inciso embutido na linha | 4 | 46229, 37042, 37041, 36634 | 3 (pergunta P4) |
| e-glifo: "l" no lugar de "I" (pdftotext) | 2 | 42524, 42523 | 1 (R4, pergunta) |
| e-espaço: espaçamento estragado no rótulo | 3 | 37517, 37491, 37422 | 1 (R3, pergunta) |
| e-OCR: digitalização ruim (decisão 32) | 4 | 50214, 44305, 44307, 37090 | 4 |
| h-aspa-meio: aspa de fechamento intermediária ou fora do lugar | 5 | 46403, 44376, 43543, 41680, 38041 | 3 |
| h-sem-abertura: bloco sem “, cabeçalho sem pontos (decisão 11) | 2 | 46770, 43376 | 3 (já decidido: só sinaliza) |
| h-vetado-fora: vetados do bloco impressos depois do "” (NR)" | 2 | 41718, 41723 | 3 (pergunta P5) |
| h-anexo-aberto: bloco “Anexo sem fechamento | 1 | 41955 | 3 |
| h-subtitulo: alíneas que recomeçam sob subtítulos | 1 | 42068 | 3 |
| h-colunas: duas colunas misturadas na extração | 1 | 36841 | 4 |
| **total** | **49** | | |

A cascata (g) não é uma causa à parte. Ela aparece como efeito em 44376, 43376, 39862 e 41955, onde um único defeito desloca 16 a 56 rótulos. O `agruparDeslocamentos` já a reduz a um ponto.

**Artefato transversal (bug da conferência):** 17 dos 366 pontos, em 9 normas (51485, 44038, 43376, 42401, 42382, 41862, 41676, 39138, 38041), vêm de **dispositivos cujo texto não tem letras nem algarismos** (só pontos, ou "IV –" vazio). Nesses casos `alnum('')` dá `pos = cursor`, então `antes` sai vazio e a divergência é sempre acusada, com `naOrigem` indefinido. O rótulo não está *antes* do cursor, está *depois* dele. Nenhuma norma sai da fila só com isso, mas os pontos falsos somem (ver R5).

## 3. Regras propostas (classes 1 e 2)

**R1 — "Art," com vírgula = artigo (48213).**
- Gatilho: linha que começa com `^\s*Art,\s*(\d+)\s*[º°o]?\s+\p{Lu}`, quando N é o sucessor do artigo anterior.
- Trava: fora de bloco de alteração; depois do preâmbulo; N = anterior + 1. Se não for, não mexe.
- Risco de falso aceite: muito baixo. O "A" maiúsculo, o número sucessor e a letra maiúscula em seguida não ocorrem em citação.
- Teste real: 48213 confirma. Medido no acervo: todas as 9 ocorrências de "Art," são de fato artigos (8 antigas, com OCR). **30360 (LC 442/2000) é falso aceite hoje**, porque "Art, 2® - Esta Lei…" está dentro do art. 1º. Ainda não encontrei caso que desminta a regra.
- Impacto: 48213 sai da fila e a 30360 é corrigida.
- Atenção: isto mexe em `parseMinuta` (core), contra a regra "Art. só com A maiúsculo". Por isso é pergunta (P1).

**R2 — "§ N°," seguido de vírgula nunca é rótulo (47934).** Tratar como bug.
- Gatilho: `^\s*§\s*\d+[º°o]?\s*,` no início de linha. A linha volta a ser continuação da anterior.
- Trava: só com a vírgula logo depois do número. Rótulo real é seguido de espaço e maiúscula.
- Risco: nenhum caso real de parágrafo verdadeiro com vírgula foi achado.
- Medido no corpo: 47934 e 25709 (antiga, "§22, do artigo 12"). As demais ocorrências estão em preâmbulos (21359, 22566, 22700, 22701, 26307), antes do Art. 1º.
- Impacto: 47934 sai da fila (é o único motivo dela).

**R3 — rótulo com espaçamento estragado (37517, 37491, 37422).** É análoga à decisão 29, que tratou o fecho; aqui a extração é pdftotext, não OCR.
- Gatilho: `^\s*Art\.\s*(\d)\s(\d)\s*([º°o.])?\s+\p{Lu}` e `^\s*(X{1,3})\s([IVX]{1,4})\s*[–-]\s`, quando o valor juntado é **exatamente o sucessor** do irmão anterior.
- Lugar: no preparo do texto lido; o .txt guardado não muda.
- Trava: só com o sucessor; nunca em texto de OCR.
- Risco: quase nulo, porque "X V –" e "Art. 1 5." no início de linha não têm outra leitura.
- Medido no acervo: os mesmos 3 arquivos para "Art. D D", mais 37491 e 37517 para "X V". Há 16472, 20255, 28148, 28404 e 44366 (antigas) com artigo cujo texto começa por algarismo solto, mas por OCR; ficam de fora.
- Impacto: 37517 e 37491 saem da fila (único motivo); 37422 continua por `tabela_no_corpo`. Também corrige o texto dos artigos, que hoje começa com "5. Os elementos…".

**R4 — glifo "l" por "I" em rótulo romano (42524, 42523).** Arquivos de 2020 do tipo `3317_cl_…`, pdftotext.
- Gatilho: rótulo no início de linha `^\s*(?:Art\.\s*)?([IVXl]*l[IVXl]*)\s*[º°]?\s*[–-]+\s`, quando trocar l→I dá o sucessor do irmão anterior (ou "I" logo depois de um caput terminado em ":"). "Art. Iº" no 1º artigo vira 1º.
- Trava: só com o sucessor; nunca em OCR (a regra do projeto diz que texto de OCR não se corrige).
- Risco: baixo. Mesmo assim muda texto lido, por isso é pergunta (P2).
- Impacto: 42524 e 42523 saem da fila. Corrige também o **falso aceite da 42533** (Lei 12.707/2020, achado 1). No acervo há 14 arquivos com o padrão; os outros são antigos com OCR (11440, 20255, 23346, 23347, 28148, 9133, …), que ficam de fora.

**R5 — conferência de dispositivo de texto vazio (bug, 17 pontos).** Em `conferirConservacao`, quando `a === ''`, conferir se `origem.slice(cursor)` *começa* pela ficha do rótulo, em vez de olhar o que vem antes.
- Trava: só para texto sem letras nem algarismos.
- Risco: nenhum aceite novo por si só, pois as 9 normas têm outros motivos. Teste: 42382, que tem 3 pontos, todos de artefato.

**R6 — "a lei pula" (classe 2 hoje, regra possível): 51804, 43595, 42987, 41098, 40311.**
- Gatilho: um grupo do `agruparDeslocamentos` com deslocamento +k constante **até o último irmão**, todos os rótulos escritos legíveis, nenhuma lacuna e nenhum trecho não localizado.
- Trava (é o ponto crítico):
  - o número que falta não aparece em lugar nenhum do texto como rótulo de início de linha;
  - o texto do irmão anterior não contém nenhum rótulo mal formado ("Art,", "l"/"Vll", "Art. D D", "X V", "; II –");
  - a norma não é de OCR;
  - não há outro motivo.
- Falso aceite que a trava tem de barrar: **48213** ("Art, 4º" engolido também dá +1 até o fim) e **42524** ("l -"). Ambos provam que a trava é indispensável.
- Impacto: 4 normas saem da fila (51804, 43595, 41098, 40311; a 42987 continua por número e data). As famílias "repete" e "trocado" (7 normas) devem continuar com o humano: no "repete", qual dos dois é o dispositivo real é ambíguo (39862 tem dois "Art. 8º" com redações diferentes); no "trocado", o número escrito está errado e a posição é provavelmente o que se quis.
- Medir: rodar o estruturador num diretório temporário sobre todo o acervo, antes e depois, e conferir que nenhuma norma `aceita` hoje mude de endereço e que só essas 4 saiam da fila.

## 4. Perguntas ao mantenedor

- **P1 (R1): "Art," com vírgula conta como início de artigo?** É um caso real recente (48213) e um falso aceite antigo (30360).
  - Alternativas: (a) sim, só com sucessor e "A" maiúsculo; (b) não, segue para o revisor.
  - Recomendação: (a). Mexe no core, então vai com o teste da 48213 e a bateria inteira.
- **P2 (R3 e R4): corrigir no preparo, sem tocar o .txt, o rótulo com espaço no meio ("Art. 1 5.", "X V –") e o glifo "l" por "I" ("Vll", "Art. Iº"), quando o resultado é exatamente o sucessor?**
  - Evidência: 5 recentes saem da fila (37517, 37491, 42524, 42523, e 37422 só no rótulo) e um falso aceite (42533) é corrigido.
  - Alternativas: (a) as duas, fora de OCR; (b) só o espaçamento, por analogia direta com a decisão 29; (c) nenhuma.
  - Recomendação: (a).
- **P3 (decisão 27, sufixo "-A"): na lei que *nasce* com "Art. 31-A" (49739, LC 1.037/2025: 31-A, 32-A a 32-E, 33-A), o endereço deve seguir o escrito (`art-31-A`)?**
  - Evidência: hoje o art. 31-A tem o endereço `art-32`, e o histórico gravado (`dados/historico/sapl/49739.json`, 323 dispositivos) usa esses endereços por posição. Uma alteradora futura que cite "art. 32-A da LC 1.037" vai cair no dispositivo errado ou ser recusada.
  - Trava possível: sufixo de letra escrito, o número base igual ao do artigo anterior já escrito, e a letra em sequência (A, B, …).
  - Impacto: só 1 recente no recorte. O risco de falso aceite é baixo, porque o rótulo escrito é inequívoco.
  - Alternativas: (a) seguir o escrito só nesse padrão; (b) manter "nada por ora".
  - Recomendação: (a), por causa do erro de endereço no histórico.
- **P4 (decisão 31, incisos embutidos): reabrir numa forma mais estreita?**
  - Evidência nova: 4 recentes na fila (46229, 37042, 37041, 36634) e **dois falsos aceites silenciosos**, 45738 (Lei 13.396/2023, art. 3º com os incisos dentro do caput) e 35123 (antiga, "…; e XII – mensurar" dentro do inc. XI). Os dois estão no achado 1.
  - Alternativas: (a) só **detectar**: um motivo novo (ou estender o `possivel_dispositivo_embutido`, que hoje não procura romanos) para "; [e] <ROMANO> – minúscula" e ": I – " dentro do texto, seguindo a lógica da decisão 10; (b) separar só quando é exatamente o sucessor do irmão anterior, ou "I –" logo depois de ":" do caput; (c) nada.
  - Recomendação: (a) já. Para a (b), primeiro reler o erro da id 50200 que motivou a decisão 31; não li esse caso.
- **P5: dispositivos VETADOS impressos depois do "” (NR)" (41718, 41723) pertencem ao bloco?**
  - Em 41718 o bloco termina em "distância mínima de:” (NR)", e os dois-pontos mostram que os incisos "I – VETADO." pertencem ao § 1º da lei-alvo.
  - Alternativas: (a) estender o bloco quando, entre o "” (NR)" e o próximo "Art. N+1" da alteradora, só há linhas "<rótulo> VETADO."; a norma sai "a revisar" com fronteira inferida (como as decisões 9 e 30); (b) deixar com o revisor.
  - Recomendação: (a), com confiança média. São só 2 casos; perguntar se a prática de publicar o veto fora das aspas é regular na Câmara.

Fica fora das perguntas, porque já está decidido: aspas intermediárias e cabeçalho sem pontos (decisões 11 e 12). A família h-sem-abertura ganha mais um caso verdadeiro (46770, além da 43376), contra 1 falso positivo medido (37945). Se o mantenedor quiser reabrir a decisão 11, a evidência é essa: 2 casos certos para 1 errado.

## 5. Achados inesperados

1. **Falsos aceites com dispositivo engolido no fim da sequência.** Sem cascata, a conferência de rótulo não vê nada.
   - **42533** (Lei 12.707/2020, aceita): o inc. VI do art. 3º termina com "…; e Vll - a atualização permanente…", ou seja, o inciso VII não está na árvore.
   - **45738** (Lei 13.396/2023, aceita): art. 3º "…Lei: I – campanhas educativas…; – formação de gestores…; e – desenvolvimento…". Os incisos estão dentro do caput, e os rótulos II e III se perderam na fonte.
   - Antigas: **30360** ("Art, 2®" dentro do art. 1º) e **35123** ("; e XII – mensurar" dentro do inc. XI).
   - Busca feita: padrões `[;:]\s+(e\s+)?<ROMANO> –\s+minúscula` e `Art,\s*\d` em todos os `dados/estruturado/sapl/*.json` aceitos; foram os únicos 4 achados.
2. **O `possivel_dispositivo_embutido`** (`estrutura.mjs:410`) só procura "Art. N", "§ N" e "Parágrafo único". Não cobre romanos, "l"/"Vll" nem "Art,".
3. **Bloco aberto com “Anexo e nunca fechado** (41955: nenhum ” no arquivo) **não recebe** `bloco_sem_fechamento_de_aspas` nem `alteracao_sem_aspas_nao_delimitada`. Só a cascata de rótulos o denuncia (68 pontos).
4. **Aspas intermediárias na fonte** (44376, 43543, 41680, 38041, 46403) fazem o motor **perder comandos** sem nenhum motivo de bloco: em 43543 a inclusão do inc. XXXI no art. 21 da LC 7/1973 não vira comando. A única pista é o rótulo. Isso pesa no histórico da LC 7 e da LC 133, não só na revisão.
5. **Artefato da conferência para texto vazio** (R5): 17 pontos falsos, com `naOrigem` indefinido no painel.
6. **51804 e 41723** pulam o Art. 2º e o Art. 10 sem "VETADO." no arquivo. Pode ser defeito da lei ou um artigo vetado que a fonte omitiu. Não dá para distinguir sem o DOPA; o revisor decide.

## Confiança do levantamento

Conferi **as 49 normas uma a uma** no texto de origem (`docs/dados/revisao/n/<id>.json` e `dados/textos/sapl/<id>.txt`), sempre no primeiro grupo de deslocamento e, quando havia mais de um tipo de causa, em cada grupo diferente. Nas normas com muitos grupos (42068: 16; 41955: 9; 42401: 10; 37090: 8; 41676: 8), conferi os 2 ou 3 primeiros e assumi para os demais o mesmo padrão, o que é coerente com os deslocamentos. As contagens de acervo para R1 a R4 e para os falsos aceites vêm dos meus scripts (grep e JSON) e não foram medidas rodando o estruturador. A 36316 (alínea sem rótulo) não foi conferida no PDF.
