# Peça 4 — Modelo de dados do motor de consolidação
 
Este é um documento de design, não código. Objetivo: fechar as decisões de
modelagem antes de implementar, porque errar aqui custa retrabalho em tudo
que vier depois.
 
## 0. A decisão mais importante — endereçamento não pode ser posicional
 
Hoje, o endereçamento de um dispositivo é calculado de duas formas
diferentes, dependendo de onde o nó nasceu:
 
- Nó **original** (parseado por `parseMinuta` na promulgação): endereço vem
  da **posição no array** (`construirMapaNumeracaoOriginal`, e a checagem de
  grafia em `normalizar()`: `doc.artigos.indexOf(n)+1`).
- Nó **inserido por um bloco NR** (`extrairRedacaoAlterada`): endereço vem
  do `desFixo`, fixo, nunca recalculado.
Isso funciona hoje porque cada teste rodou contra UMA lei-base isolada, sem
acumular várias rodadas de alteração na mesma árvore. Mas a peça 4 existe
exatamente pra acumular — e aí a base posicional quebra: se eu insiro o
"Art. 5º-A" entre os índices 4 e 5 do array, todo artigo ORIGINAL a partir
dali desloca uma posição no array, e `array.indexOf(n)+1` para o antigo
"Art. 6º" passaria a calcular 7. O Art. 6º não foi renumerado — ele continua
sendo Art. 6º pra sempre (mesma regra do dispositivo revogado: mantém
posição) — só a lógica de cálculo que estava errada.
 
**Decisão:** todo nó do tipo `artigo`/`paragrafo`/`inciso`/`alinea`/`item`
passa a carregar um `desFixo` **atribuído uma única vez, no nascimento do
nó, e nunca mais recalculado por posição.**
 
- Nó nascido na promulgação original (v0): `desFixo` é atribuído num passo
  novo, no momento em que a v0 é criada — mesma lógica que já existe em
  `construirMapaNumeracaoOriginal`/`normalizar()`, só que gravada no nó em
  vez de recalculada toda vez.
- Nó nascido de um `insert_node` (peça 3): `desFixo` vem do bloco NR da lei
  alteradora (já é assim hoje) — o rótulo que o próprio legislador escolheu
  (ex. "Art. 9º-A") é a fonte da verdade, não algo que o sistema decide.
- `suggestDesFixo()` continua existindo pro caso em que **vocês** estão
  redigindo uma inserção nova e precisam de uma sugestão de letra — não se
  aplica a ingestão de lei já publicada, onde a letra já foi decidida por
  quem redigiu.
A posição no array deixa de ter qualquer papel semântico — vira só ordem de
exibição. `array.indexOf()` não aparece mais em nenhum lugar do cálculo de
endereço. Isso também resolve, de graça, o problema de que hoje `normalizar()`
precisa de uma guarda especial (`temSufixoLetra`) pra não confundir inserção
com erro de grafia — com `desFixo` fixo desde o nascimento, essa guarda vira
desnecessária (mas não vou removê-la agora — não custa nada mantê-la como
segunda camada de proteção).
 
## 1. Estrutura do nó — campo novo
 
```
{
  id, tipo, texto, children[], conj,
  desFixo,              // agora OBRIGATÓRIO em todo nó, não só nós de bloco NR
  gruposAntes?, omitido?, vetado?, revogado?, nrBloco?,
  origem?: {            // de onde veio o TEXTO ATUAL deste nó — ausente = nunca alterado desde a promulgação original
    tipo: "lei_alteradora" | "veto_derrubado",
    lei?: { tipoAto, numero, ano },   // ausente se veto_derrubado sem lei própria
    dataPublicacao,                   // ISO
    operacao: "promulgacao_original" | "replace_text" | "insert_node"
  }
}
```
 
`origem` é o que substitui a necessidade de "adivinhar" anotação a partir de
texto compilado (o problema documentado no CHANGELOG sobre bloco de
parágrafos que só carrega a tag no último item). Como agora **nós geramos**
a anotação a partir do comando estruturado que criou/alterou o nó, todo nó
tocado pela mesma operação carrega a mesma `origem` — não tem mais
ambiguidade de "esse parágrafo mudou junto mas não tem tag própria". Isso
só vale pra leis que passarem pela peça 4 daqui pra frente; bootstrapping de
histórico a partir de compilado do leis.org continua precisando de
`parseLeiAlvoAnotacoes` e da limitação documentada — são dois caminhos de
entrada de dado diferentes, não o mesmo problema resolvido duas vezes.
 
## 2. Versão — snapshot imutável
 
```
VersaoLei {
  id,                          // ex. "lc320@1998-03-24"
  leiBase: { tipoAto, numero, ano },   // identidade constante entre versões
  versaoAnterior: string | null,       // null só na v0 (promulgação original)
  fonte: {
    tipo: "promulgacao_original" | "lei_alteradora" | "veto_derrubado",
    lei?: { tipoAto, numero, ano },
    dataPublicacao,
    artigoOrigem?: number      // artigo da alteradora que gerou esta versão
  },
  dataVigencia,                // = fonte.dataPublicacao, no formato ISO
  artigos: [ árvore completa ]
}
```
 
Cada aplicação de comando (peça 3) sobre uma versão produz uma **versão
nova**, nunca muta a anterior. A anterior continua existindo, acessível por
`versaoAnterior` — é o que dá auditoria de "antes/depois" pra Redação Final
sem precisar reprocessar nada.
 
**Compartilhamento estrutural, não cópia profunda.** Uma lei com 50 artigos
sofrendo uma alteração em um parágrafo não precisa duplicar os outros 49.
Só o caminho da raiz até o nó alterado (e os arrays de `children` nesse
caminho) precisa de objetos novos; todo o resto da árvore é a MESMA
referência da versão anterior. Isso é o padrão comum de árvore persistente
(mesma ideia por trás de Immer/Redux, ou de como o Git versiona uma árvore
de commits) — não precisa de biblioteca nova, só disciplina de nunca mutar
um nó in-place, sempre construir um substituto e propagar a substituição
pra cima até a raiz.
 
## 3. De comando (peça 3) para nova versão — uma função por operação
 
```
aplicarComando(versaoAtual, comando) → VersaoLei | { erro: string }
```
 
- **`replace_text`** — resolve `comando.dispositivoAlvo` pra um nó existente
  (por `desFixo`, não mais por posição — ver seção 0). Se não achar, é erro
  de citação (a lei alteradora aponta pra um endereço que não existe nessa
  versão — vale registrar isso como achado de revisão técnica, não só
  descartar). Se achar: novo nó com mesmo `id`, `desFixo` preservado, `texto`
  novo, `origem` apontando pra esta operação.
- **`insert_node`** — dois casos, distinguidos pelo endereço:
  - **Filho novo de nó existente** (ex. "§ 1º do art. 8º" quando o art. 8º
    existe mas o § 1º não) — anexa como novo `child`, `desFixo` vem do bloco
    NR da alteradora.
  - **Irmão novo entre dois nós existentes** (ex. "Art. 9º-A" entre Art. 9º
    e Art. 10) — insere no array de `children` do pai na posição certa
    (entre os dois vizinhos, por ordem de `desFixo`), sem tocar no `desFixo`
    de nenhum vizinho.
- **`revoke_node`** *(pendente — depende da validação com dado real que
  você vai trazer)* — não remove o nó. Substitui `texto` pelo placeholder
  ("(Revogado)"), seta `revogado: true`, preserva `id` e `desFixo`,
  `origem` aponta pra esta operação. Efeito na árvore é o mesmo shape de
  `replace_text` — só o conteúdo final e a flag são diferentes.
- **`veto_derrubado`** *(pendente — evento sem lei própria, ver seção 4)* —
  mesmo shape de `replace_text`, mas só pode ter como alvo um nó que já
  esteja `vetado: true`; ao aplicar, remove a flag `vetado` e preenche o
  `texto` real. `origem.tipo = "veto_derrubado"`, `origem.lei` fica ausente
  (não tem lei própria) ou aponta pro ato de promulgação, dependendo do
  formato que a peça 3 vier a extrair desse tipo de fonte.
- **`revoke_lei`** — não gera versão nesta árvore. O alvo é uma LEI
  INTEIRA, não um dispositivo desta lei — se a lei revogada estiver na
  coleção em memória, é essa OUTRA lei que ganha uma marcação de "revogada
  integralmente" (provavelmente um campo no nível do documento, não da
  árvore de dispositivos — ainda não modelado, porque ainda não construímos
  o "documento" como entidade de primeira classe, só a árvore de artigos).
- **`clausula_generica_sem_efeito`, `indeterminado`, `nao_classificado`** —
  nunca geram versão. Ficam num log de "comandos não aplicados" que o
  motor devolve junto com a nova versão, pra revisão humana — nunca
  descartados silenciosamente.
## 4. Veto derrubado — refinamento a partir do LexML (rodadas 6 e 7)
 
Pesquisei o modelo oficial do LexML Brasil (especificação pública, Parte 2 —
URN, lida integralmente na rodada 7) buscando comparar com o que já tínhamos
desenhado. Achado relevante: o LexML distingue **"Versão"** de **"Visão"**,
e essa distinção resolve melhor o problema do veto derrubado do que a
modelagem original deste documento.
 
**Definição precisa, direto da especificação (não aproximada):**
 
> "A data da versão é originada a partir da data do evento: de entrada em
> vigor de um novo ato normativo; de entrada em vigor das modificações
> realizadas por outros atos; de republicação por erro, realizada **após**
> o vacatio legis; [...]
>
> A data da visão é originada a partir da data do evento: de publicação de
> um novo ato normativo; de publicação de correções devido a erros na
> publicação (republicações); de publicação de decisão judicial com
> reflexo na norma jurídica; [...] de republicação por erro realizada
> **antes** do vacatio legis; de publicação da derrubada de veto parcial;
> (qualquer) que gere alguma variante do texto de uma versão."
 
Correção terminológica do usuário: no DOPA de Porto Alegre usa-se
**"republicação"**, não "retificação" (termo do LexML) — mesmo evento,
nome local diferente.
 
**Duas coisas que a especificação deixa mais precisas do que eu tinha
registrado antes:**
 
1. Derrubada de veto parcial é **sempre** evento de Visão (nunca Versão) —
   confirma a modelagem já revisada.
2. **Republicação depende do momento**: se acontece DEPOIS do início de
   vigência, gera Versão nova; se acontece ANTES (lei ainda não estava em
   vigor), gera só Visão de uma versão que nem tinha entrado em vigor ainda.
   Isso é mais fino do que "toda republicação é visão" — precisa saber a
   data de vigência pra classificar corretamente.
**Estrutura de URN correspondente** (pra quando formos implementar,
referência exata da especificação — Tabela 3, exemplo do CDC):
 
```
<urn-base>@<data-versão>;<evento>;<data-visão>
```
 
Exemplo real da especificação (derrubada de veto seria análogo a
"retificacao"/"republicacao" nesse esqueleto):
```
lei:1990-09-11;8078@1991-03-11;retificacao;2007-01-10
```
 
**Implicação pro nosso modelo:** `VersaoLei` provavelmente precisa de um
campo `visoes[]` — cada visão com `{ evento, dataVisao, textoAlterado }` —
sem criar uma versão nova na cadeia principal `versaoAnterior`. Um evento de
republicação pode gerar visão em VÁRIAS versões ao mesmo tempo (a
especificação mostra isso explicitamente: uma correção na publicação
original se propaga como visão em toda versão subsequente construída sobre
o texto errado) — não necessariamente localizado a uma única versão.
 
Ainda não implementado — fica registrado pra quando os exemplos reais
(veto derrubado, e possivelmente republicação) chegarem.
 
## 4-A. Estados de "posição não reaproveitável" — 4, não 2 (correção, rodada 7)
 
A LC 611/2009 (lei de técnica legislativa do próprio município, lida por
inteiro na rodada 7) confirma, com texto primário — não inferência de
terceiros — que são **4 estados** que nunca podem ter sua posição
reaproveitada, não 2:
 
- **Art. 17, II**: revogado, vetado, **declarado inconstitucional**.
- **Art. 21, II** (regras de compilação): declarado inconstitucional,
  **execução suspensa**.
A suposição anterior (rodada 6) de que os dois últimos seriam "mecanismos
federais que provavelmente não se aplicam a nível municipal" estava
**errada** — são municipais, explícitos na própria lei de POA. Não
implementados ainda (sem exemplo real de nenhum dos dois), mas o modelo já
deve prever que, quando aparecerem, não são exceção — são tão esperados
quanto vetado/revogado.
 
## 5. Outros achados da pesquisa (informativos, sem ação imediata)
 
- **O parser oficial de referência do LexML (`lexml-parser-projeto-lei`,
  GitHub) tem a MESMA limitação estrutural do nosso: só processa "projeto de
  lei", não "norma em vigor".** Confirmado numa issue real (2018) onde uma
  equipe de pesquisa da FGV precisou fingir um cabeçalho de projeto de lei
  no texto da Constituição Federal pra conseguir rodar o parser nela. Isso
  não desculpa a contaminação que encontramos e corrigimos nesta rodada
  (ver `CHANGELOG.md`), mas contextualiza que "parser nascido pra minuta,
  esticado pra norma promulgada" é uma dificuldade real e reconhecida do
  domínio, não descuido nosso.
- **4 estados de "posição não reaproveitável", não 2.** O Glossário de
  Técnica Legislativa do Congresso Nacional (citando LC 95/1998, art. 12,
  III, "c") lista: revogado, vetado, declarado inconstitucional (STF,
  controle concentrado), execução suspensa (Senado, controle difuso). Os
  dois últimos são mecanismos federais específicos que provavelmente não se
  aplicam a lei municipal do mesmo jeito — registrado pra referência futura,
  sem necessidade de modelar agora.
- **Identificador URN do LexML usa data completa, não só ano** —
  `urn:lex:br:federal:lei.complementar:1998-02-26;95`. Nosso `chaveLei`
  ("lc 320/1994") é mais simples e resolve o uso interno atual; adotar
  formato URN faria sentido se um dia vocês quiserem interoperar com outros
  publicadores LexML. Não é uma necessidade atual.
## 5. Decisões fechadas nesta rodada
 
- **Seção 0 (desFixo atribuído uma vez, nunca posicional): confirmada.**
  É um ajuste fundamental — a mudança de módulo de editor de minutas pra
  consolidador de normas, que é o que este projeto é agora.
- **Granularidade de versão = por lei alteradora.** Minha pergunta anterior
  citava Redação Final incorretamente — este projeto não trata de Redação
  Final, é consolidação de normas. Confirmado: uma versão por lei
  alteradora, sem ambiguidade.
- **Alterações concorrentes (antiga seção 5): removida.** Não acontece na
  prática no acervo do usuário — era uma preocupação teórica minha, sem
  base em caso real. Modelo de versão permanece estritamente linear
  (`versaoAnterior` é sempre uma única versão), sem previsão de ramificação.