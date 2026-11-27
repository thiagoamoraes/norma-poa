<!-- Relatório de agente de pesquisa (somente leitura), 27/11/2026. INSUMO, não autoridade: afirmações que sustentam decisão são reconferidas (regra 12c). Ver PLANO-REVISOES.md. -->
# Recorte B: normas recentes em revisão por `data_diverge_do_catalogo` e `numero_diverge_do_catalogo` (27/11/2026)

Agente de pesquisa, somente leitura. Scripts temporários: `b.mjs` a `b8.mjs` nesta pasta (reexecutáveis).

## 0. Resumo

- O recorte tem **33 normas**, não 35: 28 com `data_diverge_do_catalogo` e 7 com `numero_diverge_do_catalogo`, com 2 nos dois conjuntos (49601 e 42987). Recontei em `docs/dados/revisao/fila.json`.
- **Em todas as 33 a data e o número do ARQUIVO são os que valem, ou o arquivo é de outra norma.** Em nenhuma o catálogo está certo e o arquivo, errado. Em 3 casos o arquivo é de outra norma, e aí o erro está no vínculo catálogo→arquivo, não na data.
- Quantas uma verificação automática resolve **com certeza** (classe 1): **15**.
  - 11 de data: catálogo impossível (data da lei depois da publicação) ou fora da janela dos vizinhos por 3 dias ou mais.
  - 4 de número: 1 transposição que cria colisão de número entre anos, e 3 registros duplicados com número digitado errado.
- **15 dependem de uma decisão de política do mantenedor** (classe 2): "quando o catálogo cabe tanto quanto o arquivo, vale a data impressa na lei". Hoje a decisão 2 reserva isso ao revisor. É a pergunta Q1.
- **3 são arquivo de outra norma** (classe 4). A regra diagnostica sozinha, mas não há o que corrigir além de registrar.
- Soma: 15 + 15 + 3 = 33.

## 1. Como verifiquei (evidências independentes)

Para cada norma cruzei, com script (`b.mjs`, `b3.mjs`, `b6.mjs`):

1. Data e número do cabeçalho do arquivo (`dados/estruturado/sapl/<id>.json`, `cabecalho`).
2. Data do fecho, extraída do próprio texto e relida no `.txt`.
3. Data da lei no preâmbulo ("promulgo a Lei nº N, de DD de mês", nas leis da Câmara).
4. Catálogo: `data`, `dataPublicacao`, `numero`, `ementa`.
5. Vizinhos de numeração (N-1 e N+1, depois o mais próximo com arquivo), usando só vizinhos cuja data do catálogo é igual à do arquivo. Assim o vizinho não depende de nenhum dos dois lados em disputa.
6. Colisão de (tipo, número) entre anos e hash do texto contra outros registros.
7. Ementa do catálogo contra ementa lida do arquivo.

**O DOPA não ajuda:** `dados/dopa/` cobre só as edições de novembro de 2026 (40 edições). Nenhuma das 33 normas está lá. A data de publicação no Diário Oficial dessas 33 não é verificável no repositório.

**Calibração no acervo** (por que a regra tem a trava que tem):

| Medida | Resultado |
|---|---|
| Leis e LCs recentes com data do arquivo, aceitas, em que catálogo = arquivo | 2.850 de 2.850. A data do cabeçalho é a convenção do catálogo. |
| Leis da Câmara aceitas com fecho ≠ cabeçalho | 89 de 173. O catálogo segue o cabeçalho, nunca o fecho. Isso vale para 47477 e 42532. |
| Leis do Prefeito aceitas com fecho ≠ cabeçalho | 8 de 2.477 (0,3%). É o teto do erro de data impressa na própria lei, e é detectável. |
| `data` do catálogo > `dataPublicacao`, nas 2.770 leis e LCs recentes com data de publicação | **3, exatamente 51819, 49654 e 49374** (todas do recorte). |
| Trincas de números consecutivos aceitos, com a data fora da janela dos vizinhos por 3 dias ou mais | 1 par em 2.350, ids 48227 e 45237 (ver 5.2). |
| Trincas aceitas fora da janela por 1 dia | 2 (ex.: Lei 14.492, id 50896, datada de 19/01 depois da 14.491 de 20/01, as duas confirmadas pelos arquivos). Inversão de 1 dia **existe de verdade**, daí a trava de 3 dias. |
| Colisão (tipo, número) em anos diferentes, leis e LCs recentes | 6 pares no catálogo todo. 2 são do recorte (50929 e 41864). |

## 2. Tabela por norma

Legenda dos vizinhos: "A" e "P" são a data do arquivo do vizinho anterior e do posterior (N-1 e N+1). "cat" é o catálogo. "arq" é o arquivo. Todas as datas são ISO.

### 2.1 Data diverge, arquivo certo, catálogo cai fora da janela dos vizinhos

| id | rótulo | motivo | causa real (evidência) | classe |
|---|---|---|---|---|
| 51819 | Lei 14.675 | data | cat 2026-10-30 > `dataPublicacao` 2026-10-02. Arquivo: "LEI Nº 14.675 DE 30 DE SETEMBRO DE 2026", fecho "30 de setembro de 2026". A=09-29, P=10-02. Mês +1, dia igual. | 1 |
| 49654 | LC 1.031 | data | cat 2025-01-30 > pub 2025-01-03. Arquivo 2024-12-30 (cabeçalho e fecho). A (LC 1.030) = 2024-12-30. Mês +1. | 1 |
| 49374 | Lei 14.086 | data | cat 2024-11-25 > pub 2024-10-29. Arquivo 2024-10-25. A=10-16, P=10-25. Mês +1. | 1 |
| 43865 | Lei 13.051 | data | cat 2022-04-29, arquivo 2022-03-29. A=03-29, P=03-30. Cat 30 dias depois do P. Mês +1. | 1 |
| 43710 | Lei 12.954 | data | cat 2022-02-07, arquivo 2022-01-07. A=P=01-07. Cat 31 dias depois do P. Mês +1. | 1 |
| 42947 | Lei 12.785 | data | cat 2020-12-19, arquivo 2020-11-19. A=11-13, P (12.788)=12-01. Cat 18 dias depois do P. Mês +1. | 1 |
| 42946 | Lei 12.784 | data | Idem 42947 (mesma data, mesmo erro, 1 número antes). | 1 |
| 50793 | LC 1.062 | data | cat 2025-12-15, arquivo 2025-12-22. A (LC 1.061)=12-22, P=12-29. Cat 7 dias antes do A. Alteradora com 1 comando `indeterminado`. | 1 |
| 48729 | Lei 13.953 | data | cat 2024-06-04, arquivo 2024-06-14. A=06-14, P=06-20. Cat 10 dias antes do A (dígito "1" perdido). | 1 |
| 47477 | Lei 13.657 | data | cat 2023-10-02, arquivo 2023-10-09 ("LEI Nº 13.657, DE 09 DE OUTUBRO DE 2023" e "promulgo a Lei nº 13.657, de 09 de outubro de 2023"). As leis 13.653 a 13.658 são todas 10-09. Fecho 10-10 (Câmara; normal, 89 de 173). | 1 |
| 42577 | LC 878 | data | cat 2020-05-15, arquivo 2020-03-12. A (LC 877)=03-06, P (LC 879)=03-27. Cat 49 dias depois do P. | 1 |

### 2.2 Data diverge, os dois lados cabem na janela (1 a 2 dias fora, ou ambos dentro)

Nestes 15, a ordem numérica não decide. O que sobra é: o arquivo é coerente nos 2 ou 3 lugares em que repete a data (cabeçalho, fecho e, na Câmara, o preâmbulo), e o catálogo é um registro secundário que copia a data de uma lei vizinha em 8 deles (coluna "copia").

| id | rótulo | cat | arq | janela A/P | fora por | copia | observação | classe |
|---|---|---|---|---|---|---|---|---|
| 47715 | Lei 13.745 | 12-01 | 11-30 | 11-27 / 11-30 | cat +1 dia | não | alteradora, 4 comandos | 2 |
| 47052 | Lei 13.604 | 08-29 | 08-28 | 08-15 / 08-28 | cat +1 dia | não | | 2 |
| 41812 | Lei 12.466 | 11-09 | 11-07 | 10-26 / 11-07 | cat +2 dias | não | | 2 |
| 51579 | Lei 14.619 | 07-31 | 08-03 | 07-31 / 08-06 | cabe | sim (14.615 a 14.618) | pub 08-04 | 2 |
| 50056 | Lei 14.222 | 04-30 | 05-02 | 04-30 / 05-05 | cabe | sim (A) | | 2 |
| 47766 | Lei 13.772 | 12-12 | 12-13 | 12-12 / 12-18 | cabe | sim (A) | | 2 |
| 47282 | Lei 13.644 | 10-04 | 10-03 | 10-03 / 10-04 | cabe | sim (P) | alteradora, 7 comandos (5 a ver) | 2 |
| 47057 | Lei 13.608 | 08-28 | 08-29 | 08-28 / 08-29 | cabe | sim (A) | | 2 |
| 46843 | Lei 13.580 | 07-24 | 07-21 | 07-21 / 07-25 | cabe | não | | 2 |
| 46079 | Lei 13.461 | 05-09 | 05-05 | 05-05 / 05-09 | cabe | sim (P e pub) | | 2 |
| 45810 | Lei 13.433 | 04-11 | 04-12 | 04-11 / 04-14 | cabe | sim (A) | | 2 |
| 43105 | Lei 12.824 | 03-29 | 03-17 | 03-12 / 04-14 | cabe | não | Câmara, veto derrubado. **cat = data de impressão do SEI** ("29/03/2021 SEI/CMPA" na linha 1). Preâmbulo "Lei nº 12.824, de 17 de março de 2021". Assinaturas eletrônicas 19/03 e 26/03. | 2 |
| 42586 | LC 882 | 05-21 | 05-20 | 04-20 / 06-24 | cabe | não | | 2 |
| 42532 | Lei 12.706 | 04-07 | 04-01 | 04-01 / 04-07 | cabe | sim (P) | Câmara. Cabeçalho e preâmbulo "1º de abril de 2020", fecho 16/04. Alteradora, 5 comandos. | 2 |
| 41463 | LC 822 | 12-12 | 12-13 | 11-21 / 12-26 | cabe | não | | 2 |

Nenhuma das 15 tem o arquivo fora da janela: **0 de 26** casos de data com arquivo certo têm o arquivo contrariando os vizinhos.

### 2.3 Número diverge

| id | rótulo | causa real (evidência) | classe |
|---|---|---|---|
| 50929 | Lei 14.433/2026 | O arquivo diz "LEI Nº 14.443 DE 05 DE JANEIRO DE 2026". O catálogo tem **14433 duas vezes**: 50803 (2025-12-23) e 50929 (2026-01-05). O número **14443 não existe no catálogo**. Os vizinhos 14442 (2025-12-29) e 14444 (2026-01-06) confirmam que 14443 cabe em 01-05. Transposição de dígitos no catálogo. A ementa do catálogo é igual à do arquivo. | 1 |
| 47858 | Lei 1.372/2024 | O arquivo diz "LEI Nº 13.792, DE 4 DE JANEIRO DE 2024". O registro 47859 é a Lei 13.792, mesma data e mesma ementa, e o texto tem o **mesmo sha256** (`f36b31b9fdba…`). O 47858 é duplicata de cadastro com o número digitado sem um algarismo. | 1 (diagnóstico) |
| 41864 | Lei 12.840/2018 | O arquivo diz "LEI Nº 12.480, DE 11 DE DEZEMBRO DE 2018". O 41860 é a Lei 12.480, mesma data e ementa, mesmo sha256. "12840" já é a lei de 2021-07-01 (43245): **colisão entre anos**. Transposição. | 1 (diagnóstico) |
| 41434 | Lei 12.234/2017 | O arquivo diz "LEI Nº 12.334, DE 20 DE NOVEMBRO DE 2017". O 41435 é a Lei 12.334, mesma data e ementa, mesmo sha256. "12234/2017" colide com a Lei 12.234 de 2017-03-28 (41185). Transposição. | 1 (diagnóstico) |
| 41771 | Lei 12.454/2018 | O arquivo diz "LEI Nº 12.453" e "Rua Santa Teresa D'Ávila". A ementa do catálogo diz "Rua Homero Ferrugem Martins". O texto é **idêntico ao do 41770** (sha256 `7c5c499d859f…`). Catálogo certo (12.454 entre 12.453 e 12.455, todas de 09-25), **arquivo trocado**. | 4 |
| 49601 | Lei 14.144/2024 | Arquivo "LEI Nº 14.134 … Cidadão Emérito … Alberto Jerônimo Guerra Neto". A ementa do catálogo diz "Cidadão … Oscar Santiago Uribe Rocha". Texto idêntico ao do 49602 (Lei 14.134, sha256 `88d86254fd26…`). O motivo `data_diverge` aqui é só consequência (arquivo 12-19, catálogo 12-23, cabendo entre as vizinhas 14.143 e 14.145). **Arquivo trocado.** | 4 |
| 42987 | LC 896/2021 | Arquivo "LEI COMPLEMENTAR Nº 932, DE 6 DE JANEIRO DE 2022", ementa "Autoriza o Município a manter 351 … empregos públicos de Agente Comunitário de Saúde". A ementa do catálogo diz "Altera o § 2º do art. 71 da Lei Complementar nº 7". Texto idêntico ao do 43595 (LC 932/2022). O motivo `data_diverge`, `numero_diverge` e `rotulo_nao_confere` são consequência da troca. **Arquivo trocado.** | 4 |

## 3. Famílias de causa (soma = 33)

| # | Família | ids | n | Classe |
|---|---|---|---|---|
| F1 | Catálogo com data **posterior à publicação** (mês digitado +1). Arquivo cabe nos vizinhos. | 51819, 49654, 49374 | 3 | 1 |
| F2 | Catálogo **fora da janela dos vizinhos por 3 dias ou mais** (mês +1: 43865, 43710, 42947, 42946; outros: 50793, 48729, 47477, 42577). Arquivo cabe. | 8 ids | 8 | 1 |
| F3 | Catálogo fora da janela por 1 a 2 dias. Arquivo cabe. | 47715, 47052, 41812 | 3 | 2 |
| F4 | Os dois cabem na janela. Arquivo coerente em 2 ou 3 lugares da própria lei. | 12 ids (seção 2.2) | 12 | 2 |
| F5 | Número do catálogo errado (transposição) e **sem outro registro** com o número certo: 14443 não existe. | 50929 | 1 | 1 |
| F6 | **Registro duplicado** do catálogo com número digitado errado: o número do arquivo é o de outro registro com mesma ementa, data e hash. | 47858, 41864, 41434 | 3 | 1 (diagnóstico) |
| F7 | **Arquivo trocado**: a ementa do catálogo é outra e o texto é idêntico ao de outro registro. | 41771, 49601, 42987 | 3 | 4 |
| | **Total** | | **33** | |

Por classe: 3 + 8 + 1 + 3 = **15** na classe 1; 3 + 12 = **15** na classe 2; 3 na classe 4.

## 4. Regras propostas

### R1. Data: "o catálogo é impossível" (F1, classe 1)

- **Gatilho:** `data_diverge_do_catalogo` **e** `catalogo.data > catalogo.dataPublicacao` **e** a data do arquivo cabe na janela [A, P] dos vizinhos N-1 e N+1 (vizinhos com arquivo e catálogo iguais, sem a data placeholder `AAAA-01-01`).
- **Trava (não aplicar):** `dataPublicacao` vazia ou também divergente de um vizinho; cabeçalho ≠ fecho no Prefeito (norma com inconsistência interna); arquivo vindo de OCR; arquivo fora da janela; sem vizinho com arquivo de nenhum lado.
- **Risco de falso aceite:** catálogo certo e arquivo errado, com a data do arquivo cabendo na janela e a publicação do catálogo também errada. Exige 2 erros independentes. O erro de data impressa na lei chega a 0,3% no Prefeito, e ainda precisaria acertar a janela.
- **Teste real:** 51819, 49654 e 49374 provam. O sinal tem precisão perfeita medida (3 acionamentos em 2.770 leis, todos do recorte). Desmentem (nunca deve acionar): qualquer lei aceita das 2.850 em que catálogo = arquivo.
- **Impacto:** 3 normas saem da fila.
- **Medir:** `node` com leitura de `dados/catalogo/sapl/tipo-5.jsonl` e `tipo-6.jsonl`: contar `data > dataPublicacao` no acervo todo. Antes: 3 de 2.770. Depois: 0 acionamentos fora do conjunto e 3 normas a menos em `revisar`.

### R2. Data: "o catálogo contraria a ordem numérica" (F2, classe 1)

- **Gatilho:** `data_diverge` e `catalogo.data` fora de [A, P] por **3 dias ou mais** e a data do arquivo dentro de [A, P]. Para leis da Câmara, o arquivo vale pelo **cabeçalho**, nunca pelo fecho.
- **Trava:** a de R1, mais tolerância de 2 dias (ver calibração: 2 inversões de 1 dia reais em 2.350 trincas aceitas). O gatilho não vale com os dois vizinhos ausentes. Se um vizinho for ele próprio uma norma `revisar` por data, não usar.
- **Risco:** lei impressa com data errada que ainda caiba na janela e catálogo certo. Pior caso observado de lei com data impressa fora de ordem: 48227 e 48228 (ver 5.2), e nesses o **arquivo** é que sai da janela, então R2 não aciona.
- **Teste real:** 8 ids (F2). Desmentem: 50896 (inversão de 1 dia legítima, catálogo = arquivo, fora do gatilho de qualquer forma); 48227 (arquivo = catálogo, fora da janela por 30 dias, deve continuar fora de R2 porque é o arquivo que sai da janela).
- **Impacto:** 8 normas saem da fila. Dessas, só **50793** é alteradora (1 comando `indeterminado`). Mas veja 5.1: o histórico ordena alteradoras pela data do catálogo.
- **Medir:** contar acionamentos no acervo inteiro (todas as `data_diverge` que a rotina gerar daqui para frente) e reconferir a lista dos 11.

### R3. Número: "colisão e lacuna" (F5, classe 1)

- **Gatilho:** `numero_diverge_do_catalogo` e (a) `(tipoSapl, número do catálogo)` já pertence a outro registro de ano diferente (a numeração de leis e LCs no município é contínua entre anos) **e** (b) o número do arquivo não existe no catálogo para o tipo **e** (c) a data do arquivo cabe entre os vizinhos do número do arquivo.
- **Trava:** o número do arquivo existe em outro registro (cai em R4 ou R5); a ementa do catálogo ≠ ementa do arquivo (cai em R5).
- **Risco:** baixo. Precisaria de colisão de ano + lacuna no número do arquivo + encaixe cronológico por coincidência.
- **Teste real:** 50929 (14433 colide com 50803/2025; 14443 não existe; 14442 e 14444 cercam). Desmentem: nenhuma lei aceita aciona (por construção o número é igual).
- **Impacto:** 1 norma.
- **Medir:** a varredura de colisões acha 6 pares no catálogo todo, só 2 deles no recorte (ver 5.3).

### R4. Número: "duplicata de cadastro" (F6, diagnóstico classe 1)

- **Gatilho:** `numero_diverge` e existe outro registro `Y` do mesmo tipo com número = número do arquivo, **mesma ementa normalizada, mesma data e mesmo sha256 do texto**.
- **O que o motor faria:** não aceitar a norma como lei nova. Marcar `duplicata_de_cadastro` apontando `Y`, reaproveitando o selo "texto idêntico ao da norma N" (decisão 27) e o arquivo `_textos_iguais.json`.
- **Risco:** zero de falso aceite na lei (o texto já é lido, e aceito, em `Y`). O risco é de apresentação: o catálogo continua listando "Lei nº 1.372/2024", que não existe.
- **Teste real:** 47858/47859, 41864/41860, 41434/41435. Desmentem: 41771/41770 e 49601/49602 têm texto idêntico mas **ementa diferente** (R5).
- **Impacto:** 3 normas.

### R5. Arquivo trocado (F7, classe 4)

- **Gatilho:** `numero_diverge` e ementa do catálogo ≠ ementa lida do arquivo (comparação normalizada) e o sha256 do texto é igual ao de outro registro cujo número é o do arquivo.
- **Ação:** classificar `defeito_de_fonte_arquivo_trocado`, sem aceitar. Não há texto da lei certa no acervo. Este é o tratamento já previsto na decisão 32 para defeito de fonte.
- **Teste real:** 41771, 49601, 42987. Desmentem: R4 (ementa igual).
- **Impacto:** 3 normas deixam de ser "revisar" aberto e passam a "defeito de fonte" confirmado. Nenhuma passa a texto aceito.

### R6. Data: política "o texto da lei vale" (F3 + F4, classe 2, depende de Q1)

- **Gatilho proposto:** `data_diverge` e arquivo dentro da janela [A, P] e **a data se repete** no cabeçalho e no fecho (Prefeito) ou no cabeçalho e no preâmbulo ("promulgo a Lei nº N, de …", Câmara) e `dataPublicacao` do catálogo ≥ data do arquivo e arquivo não vindo de OCR.
- **Trava:** qualquer item acima falhar; ou a norma ser alteradora de lei cuja ordem de aplicação mude com a troca (ver 5.1).
- **Risco de falso aceite:** catálogo certo e a lei impressa com a data errada em 2 lugares, coerentes entre si. Medido: no Prefeito, 8 de 2.477 leis aceitas têm cabeçalho ≠ fecho, o que mostra que erro de data impressa existe, mas é raro (0,3%) e, quando existe, em geral é visível. **Os 2 ou 3 lugares iguais não provam que a data está certa, só que o arquivo é coerente.** Não achei fonte independente para provar nenhuma das 15.
- **Teste real:** as 15 do quadro 2.2. Desmentem a regra, se existirem: qualquer lei do acervo com cabeçalho = preâmbulo = fecho e catálogo certo. Ainda não medi (as 2.850 aceitas têm catálogo = arquivo, logo não desmentem nem provam).
- **Impacto:** 15 normas.

## 5. Achados inesperados

### 5.1 A data do catálogo ordena as alteradoras no histórico

`ingestao/historico.mjs`, linha 90: `alteradoras.sort(... registro.data ...)`. Linhas 227 e 285: um vínculo é descartado se a data da alteradora for anterior à da lei-base (`datasInvertidas`; `String(base.data) > String(alt.data)`). Logo uma data de catálogo errada pode **reordenar** ou **descartar** alteradora. Dentro do recorte há 5 alteradoras: 50793, 49654, 47715, 47282, 42532. Não medi se alguma tem outra alteradora da mesma lei-base dentro da janela do erro. Vale uma medição antes de qualquer decisão que mande usar a data do arquivo (pergunta Q3).

### 5.2 Leis 13.320 e 13.321 (ids 48227 e 48228), aceitas, com data impressa estranha

Câmara. O arquivo diz "LEI Nº 13.320, DE 05 DE NOVEMBRO DE 2022" e "promulgo a Lei nº 13.320, de 05 de novembro de 2022". O catálogo concorda. Mas 13.316 a 13.319 são de 02 e 05/12/2022, e 13.322 é de 05/12/2022; `dataPublicacao` de 13.320 é 2023-03-01. É uma lei aceita cuja data impressa pode ser erro de mês na própria lei ("novembro" por "dezembro"), ou promulgação tardia. Este é o único exemplo no acervo em que o arquivo sai da janela por 3 dias ou mais. Sugestão: aviso `data_fora_da_ordem_dos_vizinhos` (não reprova), só para o revisor ver. O motor não decide.

### 5.3 Colisões de número no catálogo que não aparecem como divergência

A varredura de (tipo, número) em anos diferentes acha 6 casos. Dois são do recorte (50929/50803 e 41864/43245). Os outros 4 não têm texto baixado, então nenhuma conferência de arquivo os alcança:
- 13313: 45142 (2022-11-29, aceita) e 41384 (2017-10-05, sem texto).
- 11201 e 11200: 40492/40491 (2016-01-19) e 37975/37974 (2012-01-06 e 2012-01-09). O catálogo traz as datas 2016 e 2012 para o mesmo número, e as inversões de data que apareceram na varredura (ex.: 11200 em 2016-01-19, 11201 em 2012-01-06) sugerem erro de ano no catálogo.
- 11765: 40476/2016 e 39836/2015.

### 5.4 O motivo `data_diverge_do_catalogo` esconde a consequência de arquivo trocado

Em 49601 e 42987 o motor emite `data_diverge`, `numero_diverge` e (em 42987) `rotulo_nao_confere`, tudo consequência da troca de arquivo. O roteiro de conferência do painel pede ao revisor "Confira as datas", quando o problema é outro. Uma checagem de ementa (R5) emitiria um único motivo claro.

### 5.5 Contagem do prompt

O prompt falava de "cerca de 28 + cerca de 7 = 35". O recorte tem **33**, porque 49601 e 42987 estão nos dois grupos.

### 5.6 `dados/revisao/decisoes.jsonl` está vazio

0 linhas. Nenhuma das 33 normas foi decidida por humano. Nenhum decisão a invalidar.

## 6. Perguntas ao mantenedor

**Q1. Para data, "o texto da lei vale" no lugar de "decide o revisor, caso a caso"? (muda a decisão 2)**
Evidência: das 26 normas com data divergente e arquivo certo, em **0** o arquivo contraria a ordem dos vizinhos, e em **14** o catálogo contraria (3 delas com data posterior à publicação). Em 12 o catálogo e o arquivo cabem ambos (diferença de 1 a 12 dias) e em 8 desses o catálogo copia a data de uma lei vizinha. Na convenção do próprio acervo, catálogo = cabeçalho em 2.850 de 2.850 leis aceitas. A analogia é a sua decisão de 17/11/2026 (onde o texto da lei e a cópia compilada divergem, vale a lei).
Alternativas:
- (a) Manter a decisão 2: as 30 vão para o revisor, uma a uma. Custo: 30 conferências sem fonte para consultar (o DOPA só cobre os últimos 5 dias).
- (b) **Regras R1 e R2 só** (certeza pela ordem numérica e pela publicação): 11 saem, 15 ficam. Recomendação mínima.
- (c) **R1, R2 e R6**: as 15 restantes saem, com aviso `data_do_catalogo_difere` visível e amostra pelo revisor. Recomendo (c) com amostra de 3 das 15 (por exemplo 43105, 42532, 47057).
O motor nunca mudaria o catálogo. A decisão grava apenas qual data o motor usa.

**Q2. O que o motor faz com a data certa: corrige só o rótulo ou também a ordem do histórico?**
Evidência: 5.1 (o histórico ordena e descarta vínculo pela data do catálogo). Alternativas:
- (a) Só avisar e mostrar as duas datas (como hoje). O histórico continua pela data do catálogo e pode errar a ordem.
- (b) **Sobreposição por norma**, em arquivo à parte (como as decisões de revisão): `{idSapl, dataCorreta, motivo}`, aplicada pelo histórico e pela página de consulta. Recomendação (b), com medição prévia dos 5 casos de alteradora.
- (c) Corrigir o catálogo local. Contradiz a decisão 27 ("o catálogo da fonte não é corrigido").

**Q3. Número: aceitar "duplicata de cadastro" como situação nova?**
Evidência: 47858, 41864 e 41434 são o mesmo texto de outro registro já aceito (sha256 igual, ementa e data iguais), com número digitado errado. A decisão 27 já diz que textos idênticos mostram o selo "texto idêntico ao da norma N" e o catálogo não se corrige. Alternativas:
- (a) Manter em "revisar" até um humano marcar defeito de fonte (como hoje).
- (b) **Situação própria `duplicata_de_cadastro`** com o selo, fora da fila e fora da consulta (a consulta hoje pode listar "Lei nº 1.372/2024", que não existe). Recomendação (b).
- (c) Tratar como "aceita".

**Q4. Arquivo trocado (41771, 49601, 42987): o motor deve aceitar o texto como sendo da lei do arquivo?**
Evidência: o texto é de uma lei legítima e já aceita (41770, 49602, 43595), logo o conteúdo não se perde. O que falta é o texto verdadeiro de 12.454, 14.144 e LC 896. Alternativas:
- (a) Defeito de fonte confirmado, sem texto (como a decisão 32 faz com OCR ruim). Recomendação.
- (b) Deixar na fila como hoje.
- (c) Tentar achar o arquivo certo: há `outrosLinks` no catálogo? Não verifiquei (exige rede, proibida neste levantamento).

**Q5. Avisar as normas aceitas com data fora da ordem dos vizinhos (48227 e 48228)?**
Evidência: 5.2. Um aviso `data_fora_da_ordem_dos_vizinhos` custa pouco: acionou em 2 de 2.350 trincas no acervo e só em casos que um humano gostaria de ver. Alternativa: não fazer nada. Recomendação: aviso, sem reprovar.

## 7. Confiança do levantamento

- **Conferi norma a norma (33 de 33):** data e número do catálogo, do cabeçalho, do fecho, da publicação, vizinhos com arquivo, hash e ementa, e li o início do texto de 42532, 47477, 43105 (Câmara) e os cabeçalhos de várias outras. As contagens (1, 2 e 4 por classe) saem de scripts que reexecutei e batem entre si (soma 33).
- **Calibração por amostra do acervo inteiro (leis e LCs recentes):** colisões de número em 6 pares e `data > pub` em 2.770 leis foram medidas por varredura completa (não é amostra). A tolerância de 1 dia vem de 2.350 trincas aceitas.
- **Não consegui verificar:** a data real de publicação no Diário Oficial de nenhuma das 33 (o DOPA do repositório cobre só novembro de 2026; o `dataPublicacao` do catálogo é ele próprio dado de cadastro). A classificação de F3 e F4 (15 normas) é, portanto, probabilística: a regra R6 é uma proposta de política (Q1), não uma prova. Também não medi se alguma das 5 alteradoras tem a ordem de aplicação afetada pela data errada (5.1).
