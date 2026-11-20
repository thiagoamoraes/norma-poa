# PLANO UX — Dashboard de revisão humana (`docs/revisao.html`)

Avaliação exploratória de 20/11/2026 (não é implementação). Método: página servida em localhost, navegador automatizado (Chromium) em 1440x900, 1280x720 e 390x844, tema claro e escuro; cinco jornadas (primeira visita; 5 decisões em sequência; norma enorme e pequena; erro e recuperação; exportar/importar). Capturas e scripts ficam fora do repositório (scratchpad da sessão). Persona: revisor técnico, não desenvolvedor, valoriza teclado, previsibilidade e rastreabilidade.

Nota de dados: a norma de 521 dispositivos é a **LC 1.076/2026 (id 51486)**, primeira da fila. O id 51463 (LC 1.074) tem 29 dispositivos e 128 comandos. Maiores da fila: 51486 (521), 38364 (490), 49557 (405 dispositivos, 293 pontos). Fila: 131 normas; 44 com 0 pontos; mediana de 1 ponto por norma.

## 1. O que funciona bem

- **Abre rápido e sem erro.** Fila carregada em 78-88 ms localmente; zero erros de console nas quatro configurações; sem rolagem horizontal a 390 px (largura do documento = 390).
- **O primeiro ponto reprovado já vem selecionado** (`abrir` → `selecionar`), com o dispositivo destacado e a frase "✗ rótulo não confere: no arquivo está escrito «XXVII»". Isso diz o que está errado em texto, não só em cor (captura `b-panels.png`).
- **Aceitar pelo teclado custa 4 teclas medidas** (J, A, Tab, Enter) e o foco volta ao corpo da página, então J funciona de novo sem clicar.
- **Rastreabilidade da decisão:** cada linha exportada leva `sha256Origem`, `versaoEstruturador`, data/hora e `motivosNaHora`; decisão desatualizada reabre sozinha. Isso responde bem à necessidade de auditoria.
- **Importar é tolerante:** linha inválida é ignorada e a mensagem cita a linha (teste com arquivo com lixo: "0 importada(s); 3 linha(s) inválida(s) ignorada(s) (primeira: linha 1)").
- **Exportar** zera o aviso amarelo de "decisões só neste navegador"; o aviso volta quando há decisão nova.
- **Tema escuro coerente** (contraste legível nas capturas `h-dark.png`); layout estreito vira coluna única e a gaveta da fila fecha ao abrir uma norma.
- **Casos de borda não quebram:** norma com texto de origem vazio (36188: "<") e com 0 dispositivos abre sem erro; 128 comandos renderizam com filtro e limite de 400.

## 2. Problemas por severidade

### Bloqueador

**B1. Ao clicar num dispositivo, o texto de origem rola para o lugar errado.**
- Onde: `selecionar()` usa `marca.offsetTop` como posição dentro de `#rol-origem`, mas o `offsetParent` do trecho é o `BODY` (medido), então o deslocamento inclui a posição da página.
- O que o revisor sente: clica no dispositivo vermelho «27 –» e o painel da esquerda mostra o Art. 31, longe do inciso XXVII. A promessa central da tela (lado a lado) falha justamente no ponto reprovado.
- Evidência: LC 1.076, quatro pontos: os três com marca ficaram 105 a 433 px **acima** da área visível do painel; LC 1.025 (id 49557): 6 de 6 cliques a 357-358 px acima. Captura `k-click-bad.png` (linha 27 selecionada, origem em "Art. 31").
- Recomendação: dar `position: relative` a `#rol-origem` (ou calcular com `getBoundingClientRect` relativo ao contêiner) e testar com uma norma real que o trecho selecionado fica dentro da área visível. Esforço **P**.

### Alto

**A1. O trabalho começa abaixo da dobra.** O cabeçalho (título, parágrafo longo, contadores, motivos, caixa de decisão) ocupa 537 px a 1440x900 e 691 px a 1280x720 (viewport de 720): em notebook os painéis texto × árvore **não aparecem** ao abrir uma norma. O revisor sente que "abri e não vi nada". Recomendação: cabeçalho compacto e fixo (título numa linha, contadores pequenos, motivos recolhidos em uma linha), painéis logo abaixo, barra de decisão presa ao rodapé. Esforço **M**.

**A2. O ponto reprovado nem sempre aparece no texto de origem.**
- `trecho_nao_localizado` não tem marca no texto (por definição): em 51486 o ponto auto-selecionado (art. 22, parágrafo único) deixa o painel da esquerda no início do arquivo (`scrollTop` 0). O revisor precisa adivinhar onde procurar.
- 36 das 131 normas têm só motivos sem pista visual alguma (sem fecho 28, bloco de alteração sem dono 25, cabeçalho 11, sem artigos 8, sobreposições), e 38 normas têm 0 pontos fora as de data. Para elas a tela mostra a lista de motivos e nada para conferir.
- Recomendação: (a) para "não localizado", rolar a origem até o vizinho localizado anterior e mostrar "procure daqui para baixo"; (b) caixa de busca no painel de origem, preenchida com o começo do trecho; (c) para cada motivo sem marca, uma instrução objetiva ("conferir o final do arquivo: há fecho com local, data e assinatura?") e rolar até o fim/começo conforme o caso. Esforço **M**.

**A3. A decisão é por norma, mas o trabalho é por ponto.**
- Uma norma com 17 pontos (51463) ou 293 (49557) recebe um único "Aceitar", registrado com 3 toques sem nenhum sinal de que cada ponto foi visto. Um clique descuidado vira "aceita por humano" no relatório.
- Divergência de data (6 normas) pede decidir qual data vale (caixa amarela), mas os quatro botões não expressam a resposta; fica só em nota livre, difícil de agregar.
- Recomendação: contador "pontos conferidos 2/4" que o revisor avança (J/K de ponto, não de norma) e "Aceitar" só habilitado quando todos foram vistos (ou pede confirmação com a contagem); para data, dois botões: "Vale a data do arquivo" / "Vale a data do catálogo". Esforço **M** (UI) + decisão do mantenedor (ver §6).

**A4. Decisões podem se perder sem aviso claro.**
- Duas abas do mesmo navegador: cada aba grava o seu mapa inteiro em `localStorage`; a última a gravar apaga as decisões da outra. Teste: aba A aceitou a 51486, aba B aceitou a 51485; ao recarregar A, só 51485 sobreviveu. Perda silenciosa.
- Sem armazenamento (janela privada/bloqueio): o aviso diz "só neste navegador", como se estivesse salvo; ao recarregar, 0 decisões (medido).
- O destino do arquivo é vago: "Entregue o arquivo" (a quem? por qual canal?) e o nome é sempre `decisoes.jsonl`.
- Mensagens (toast) somem em 2,2 s, inclusive a de erro de importação.
- Recomendação: mesclar do `localStorage` antes de gravar (e ouvir o evento `storage`); aviso explícito quando o armazenamento falha ("esta decisão NÃO está sendo guardada; exporte agora"); nome `decisoes-AAAA-MM-DD-HHMM.jsonl`; faixa fixa "N decisões ainda não exportadas · Exportar" que acompanha a rolagem; mensagens de erro que ficam até fechar. Esforço **P-M**.

**A5. A interface fala em códigos.** O filtro "Todos os motivos", a lista de normas, o Guia e a caixa amarela exibem `rotulo_nao_confere_com_a_origem`, `bloco_de_alteracao_sem_dono` etc. (15 códigos em uso). Propostas de texto no §4. Esforço **P**.

### Médio

**M1. J/K não é previsível depois de decidir.** Com o filtro "Pendentes", a norma decidida some da lista e J vai para a **primeira pendente da lista**, não para a seguinte à atual. Teste: pulei duas normas (J J), decidi a terceira, J voltou à primeira pulada (1.071), não foi para a 1.049. Ao recarregar a página perde-se o lugar (a URL não ganha `#id` ao abrir norma; só lê o `#id` na carga). Recomendação: após registrar, avançar sozinho para a próxima norma da lista; gravar `#id` na URL; lembrar a última norma aberta. **P**.

**M2. O formulário de decisão é lento no teclado e sem escape.**
- Esc não fecha o formulário (medido: continua aberto); Enter na caixa de nota insere quebra de linha; para enviar é preciso Tab até o botão (não há Ctrl+Enter).
- "Defeito de fonte": D, seta, Tab, Tab, Tab, Enter = **6 teclas sem contar o texto** (medido 18 teclas com "trecho x" e "nota"); o tipo de defeito vem pré-marcado como "aspas faltando", então esquecer de mudar grava um tipo errado sem aviso; o trecho é obrigatório mas não vem preenchido a partir do dispositivo selecionado.
- "Encaminhar": 13 teclas medidas com nota de 10 letras (E + texto + Tab + Enter).
- Erros de validação saem em linguagem técnica no toast ("defeito_de_fonte exige defeito.trecho (o trecho do arquivo que está errado)", "corrigir exige ao menos uma correção") e somem em 2,2 s (medido: opacidade 0 aos 2,7 s).
- Recomendação: Esc cancela, Ctrl+Enter registra, tipo de defeito sem valor padrão (obrigar a escolher), trecho pré-preenchido, erros ao lado do campo com texto claro. **P**.

**M3. "Limpar decisão" não confirma nem permite desfazer.** Apaga ao clique; o toast diz "(Se já está no repositório, volta na próxima carga.)", frase que o revisor não consegue interpretar. Para decisão errada o caminho é decidir de novo por cima, mas isso não está dito. Recomendação: renomear para "Desfazer decisão desta norma", oferecer "Desfazer" no toast por 10 s, e dizer "decisão anterior (de arquivo) volta a valer". **P**.

**M4. "Corrigir rótulo" tem dois passos que escondem trabalho.** Digitar o rótulo e clicar "Registrar" sem antes "Adicionar à lista" dá o erro técnico "corrigir exige ao menos uma correção" e o digitado não é aproveitado. Trocar de dispositivo na árvore refaz o formulário e limpa o campo. O formulário aparece mesmo quando o dispositivo selecionado não tem problema de rótulo (ex.: "trecho não localizado"). Além disso empurra os painéis para baixo. Recomendação: "Registrar" inclui o campo preenchido; abrir ao lado dos painéis, não acima; só habilitar para dispositivo com rótulo divergente. **M**.

**M5. Mensagens contraditórias e ruído.** Nota azul (fronteira inferida): "Aqui o revisor só ACEITA ou marca defeito de fonte", mas os quatro botões continuam ativos. Em 51463 os 128 comandos são todos "lei-alvo fora da base" (A ver = 0): uma lista longa sem ação possível, ocupando a parte de baixo. Recomendação: resumir ("128 comandos; nenhum verificável: a lei alterada não está na base") e recolher. **P**.

**M6. Guia e primeira visita.** O Guia vem recolhido, na coluna da fila (no celular, dentro de "Fila de revisão"); os atalhos de teclado ficam no **fim** da lista de 131 itens, fora da tela. Os botões do guia ("614 · 1p", "633 · 0p") não dizem que é o número da lei nem o que é "p". A tela vazia diz só "Escolha uma norma na fila (ou tecle J)". O revisor não aprende: o que é uma norma "em revisão", o que cada decisão significa, quantos minutos leva. Recomendação no §5 (melhoria 3). **M**.

**M7. Acessibilidade e foco.** `#norma` tem `aria-live="polite"` e é reconstruída inteira a cada norma: leitor de tela tende a ler tudo (521 dispositivos). Há 335 elementos focáveis só na norma 51463 (131 itens da fila com `tabindex=0` + dispositivos), mais de 650 na 51486; a árvore declara `role=listbox` mas não responde a setas. Cores do texto de origem (vermelho/amarelo/azul) são a única pista nesse painel. Recomendação: `aria-live` só em um aviso curto ("Norma aberta: LC 1.076, 4 pontos"); setas na lista/árvore com foco único (roving tabindex); acrescentar sublinhado/ícone distinto nas marcas. **M**.

### Baixo

- Item da árvore truncado em 3 linhas até ser selecionado: o revisor não consegue comparar o texto sem clicar em cada um. **P**.
- Data do cabeçalho em ISO (`data 2026-07-14`) enquanto o resto usa dd/mm/aaaa. **P**.
- "confiança media" sem acento; legenda e selos em 11-12 px (`.leg`, `.selo`). **P**.
- Texto de origem em fonte monoespaçada com quebras duras e espaços grandes ("como extraído"): correto como evidência, mas cansativo; oferecer alternar "texto corrido". **P**.
- Painel de origem e árvore com altura máxima de 68 vh e rolagem própria, além da rolagem da página: rolagem aninhada confunde com roda do mouse. **M**.
- Cabeçalho do mobile (390 px) ocupa ~430 px antes de qualquer norma; aceitável, mas a fila em gaveta aberta por padrão empurra o conteúdo. **P**.

## 3. Medidas

| Ação | Teclado | Mouse |
|---|---|---|
| Abrir próxima norma | 1 (J) | 1 clique |
| Aceitar | 3 teclas (A, Tab, Enter) = **4 por norma** com J (medido) | 3 cliques (norma, Aceitar, Registrar) |
| Defeito de fonte | D + seta + Tab ×3 + Enter = 6 sem digitar; 18 com texto mínimo (medido) | ≥ 4 cliques + digitação |
| Encaminhar ao motor | E + nota + Tab + Enter (13 com 10 letras, medido) | 3 cliques + digitação |
| Corrigir rótulo | ≥ 8 (estimado, não medido: C, rótulo, Tab, Enter, Tab ×2, Enter) | ≥ 5 cliques + digitação |

- **Tempo até entender "o que está errado nesta norma"** (estimativa por contagem de passos, não cronometrada com pessoas): norma de 1 ponto, 20-40 s lendo a lista de motivos, rolando 537 px (1440x900) ou 691 px (1280x720) até os painéis e localizando o trecho; norma de 4+ pontos como a 51486, 1-3 min, porque o primeiro ponto não tem marca no texto, os outros três saem da vista (B1) e não há "próximo ponto". Para 36 normas sem pista visual, o tempo depende de procurar à mão.
- **Risco de perda de decisões:** alto. Cenários medidos: (1) duas abas → perda silenciosa da decisão da primeira; (2) janela privada/armazenamento bloqueado → perda total ao recarregar, com aviso enganoso; (3) limpar dados do navegador → perda total (avisado em texto longo e discreto). Mitigação existente: botão Exportar e faixa amarela. Não há exportação automática nem nome de arquivo que diferencie versões.
- **Volume:** 131 normas × ~1,3 min cada em leitura mínima ≈ 3 h só de navegação, sem contar o tempo de conferência; a mediana de 1 ponto por norma indica que o ganho está em levar o revisor direto ao ponto (B1, A1, A2).

## 4. Vocabulário (termos técnicos → linguagem do revisor)

| Hoje | Proposta |
|---|---|
| `rotulo_nao_confere_com_a_origem` | "Numeração diferente do arquivo: o motor numerou o dispositivo de um jeito e o arquivo escreve outro." |
| `trecho_nao_localizado_na_origem` | "Trecho que o motor leu mas não achou no arquivo, na ordem esperada." |
| `texto_fora_da_arvore` | "Texto do arquivo que o motor não colocou em nenhum dispositivo." |
| `bloco_de_alteracao_sem_dono` | "Redação nova entre aspas sem artigo que a introduza." |
| `bloco_sem_fechamento_de_aspas` | "Falta a aspa que fecha a redação nova: o motor deduziu onde ela termina." |
| `aspa_de_abertura_ausente` | "Falta a aspa que abre a redação nova (começa por reticências)." |
| `alteracao_sem_aspas_nao_delimitada` | "A lei diz que altera outra, mas nenhum texto novo foi reconhecido." |
| `sem_fecho` | "Sem fecho reconhecido (local, data e assinatura)." |
| `cabecalho_nao_reconhecido` | "Cabeçalho não reconhecido (tipo, número e data)." |
| `sem_artigos` / `dispositivo_sem_rotulo` / `endereco_repetido` | "Nenhum artigo reconhecido" / "Dispositivo sem número ou letra" / "Dois dispositivos com a mesma numeração" |
| `data_/numero_/tipo_diverge_do_catalogo` | "Data/Número/Tipo do arquivo diferente do cadastro" |
| `promulgacao_parcial` | "Só alguns dispositivos foram promulgados (veto derrubado)." |
| Botão "Aceitar como está" | "Está certo: a leitura confere com o texto" |
| "Defeito de fonte" | "Erro no arquivo original (não é do motor)" |
| "Corrigir rótulo" | "Corrigir a numeração de um dispositivo" |
| "Encaminhar ao motor" | "Forma de redação que o motor não conhece (virar caso de estudo)" |
| "Limpar decisão" | "Desfazer decisão desta norma" |
| "Árvore do leitor" / "leitor" / "motor" | "Como o motor leu" (usar só "motor") |
| "Fronteira inferida" | "Limite do bloco deduzido pelo motor" |
| "Pendentes / desatualizadas" | "A revisar / a rever (o texto ou o motor mudou)" |
| "N p" / "N ponto(s)" | "N pontos a conferir" |
| `replace_text` / `insert_node` / `revoke_node` | "substitui texto" / "inclui dispositivo" / "revoga dispositivo" |
| "lei-alvo fora da base" | "A lei alterada ainda não está na base: não há antes/depois" |
| "Datas divergentes … o motor não escolhe" | manter a ideia, mas com os dois botões de §2-A3 |

Manter o código num `title`/tooltip pequeno ("código: …") para quem precisa citar ao mantenedor.

## 5. As 3 melhorias de maior retorno

**1. Levar o revisor ao ponto: barra "Pontos a conferir" + origem sincronizada.** Corrige B1, A1 e A2.
```
LC 1.076/2026 · 4 pontos a conferir          [ ◀ 2/4 ▶ ]  (teclas N / P)
┌ Ponto 2: Numeração diferente do arquivo ─────────────────────────────┐
│ Motor: «27 –»      Arquivo: «XXVII»        [buscar no texto: ____ ]  │
└──────────────────────────────────────────────────────────────────────┘
┌ Texto do arquivo ───────────────┐ ┌ Como o motor leu ───────────────┐
│ …  XXVII – a infraestrutura …   │ │   27 –  a Infraestrutura …      │  (as duas rolam juntas)
└─────────────────────────────────┘ └──────────────────────────────────┘
[ A Está certo ] [ D Erro no arquivo ] [ C Corrigir numeração ] [ E Caso novo ]   2 de 4 conferidos
```
N/P pulam entre pontos dentro da norma; J/K continuam entre normas. "Está certo" só ativa com todos os pontos vistos. Painéis sobem para o começo da tela (cabeçalho compacto).

**2. Decisão com teclado de verdade.** Corrige M1, M2, M3.
```
[ A ] → abre mini-formulário no rodapé:   Nota: [____________]   Ctrl+Enter registra · Esc cancela
registrou → toast "Aceita · LC 1.076 · Desfazer (Z)" por 10 s → abre sozinho a próxima norma
Defeito (D): tipo [escolha...]  trecho [já preenchido com a seleção]  nota   · Ctrl+Enter
```
Meta: aceitar = J (só na primeira) + A + Ctrl+Enter = 2-3 teclas por norma depois da primeira; defeito sem digitar o trecho.

**3. Proteção das decisões + primeira visita.** Corrige A4, M6, A5.
```
┌ Primeira vez? Três passos ──────────────────────────────  [não mostrar de novo] ┐
│ 1 Escolha uma norma (J).  2 Confira cada ponto marcado: esquerda = arquivo, direita = motor.  │
│ 3 Decida (A/D/C/E). Suas decisões ficam NESTE navegador até você exportar.        │
└─────────────────────────────────────────────────────────────────────────────────┘
Faixa fixa:  ⚠ 7 decisões só neste navegador · última exportação: nunca   [Exportar agora]
```
Mesclar abas, nome de arquivo datado, aviso claro quando não há armazenamento, atalhos visíveis no topo (`?` abre a lista), vocabulário do §4.

## 6. Perguntas que só o mantenedor pode responder

1. **Granularidade:** a decisão deve ser por norma (hoje) ou por ponto? Se por ponto, `decisoes.jsonl` e o relatório passam a ter o ponto (`endereco`) em cada linha; o que significa "norma aceita" quando 3 de 4 pontos foram aceitos e 1 é defeito de fonte?
2. **Quem decidiu:** o princípio 4 proíbe nome. Para rastreabilidade o revisor aceita um identificador anônimo estável (ex.: código da sessão/máquina) ou data/hora basta?
3. **Data divergente:** a resposta ("vale a do arquivo" / "vale a do catálogo") entra como campo estruturado em `decisoes.jsonl`? Quem aplica a correção depois?
4. **"Aceitar" de norma com muitos pontos:** deve exigir confirmação ou conferência de todos os pontos? Há limite (ex.: acima de 20 pontos) em que aceitar é suspeito?
5. **Entrega do arquivo:** qual é o canal oficial do `decisoes.jsonl`? Se for sempre o mesmo, a página pode gerar nome e instrução exatos (ou usar a API de arquivos do navegador para salvar sempre no mesmo arquivo).
6. **Normas sem pista visual (36 de 131) e com 0 pontos (38):** o que se espera que o revisor confira e como deve decidir? Essas normas deveriam ter fluxo próprio (ex.: "conferir fecho/cabeçalho") ou vão para fila de "encaminhar"?
7. **Meta de tempo:** qual ritmo se espera (normas por hora)? Isso define se vale investir em N/P e avanço automático antes do vocabulário.
8. **Corrigir rótulo:** deve valer para qualquer motivo ou só para `rotulo_nao_confere`? Hoje o formulário abre sempre.
9. **Quanto o texto técnico pode aparecer?** Manter o código do motivo em tooltip (útil ao citar ao mantenedor) ou esconder de vez?
10. **Escopo da página de comparação (`compara.html`) e do guia:** o revisor deve chegar a elas a partir da norma (ex.: "comparar com a compilação") ou o fluxo fica separado?
