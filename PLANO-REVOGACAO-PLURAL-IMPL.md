# PLANO DE IMPLEMENTAÇÃO — revogação no plural, em lista e em intervalo (21/11/2026)

Continua `PLANO-REVOGACAO-PLURAL.md` (medição do agente) e as decisões 43, 45–48 do `CLAUDE.md`. A trava da decisão 45 já está em `main` (rodada 50). Este plano cobre o que falta; **nada aqui muda `aplicarComandoLei`/`revoke_node`**, que já marcam o nó e os filhos como revogados sem removê-los.

## 1. Princípio
O motor só gera `revoke_node` quando **toda** a frase de objetos de um item foi consumida por uma gramática fechada e a lei-alvo do item é conhecida. Qualquer sobra → `indeterminado` com motivo, lei-alvo e `dispositivosCitados` (melhor esforço), que aparece como ponto a conferir no histórico (decisão 48). Falso `revoke_node` é o erro grave; `indeterminado` é sempre aceitável.

## 2. Fatos verificados no código (21/11/2026)
- `RE_GATILHO_REVOGACAO` casa "Fica/Revogam-se/revogado/revogada" mas **não** "revogados/revogadas" (o "s" depois do "o/a" quebra o lookahead). É o silêncio de "Ficam revogados/revogadas".
- `visText(art)` devolve só o caput; os itens de "Ficam revogados:" estão em `art.children` (tipo `inciso`, sem `desFixo`; texto tipo "o parágrafo único do art. 52-L;"). Cada item pode ter a sua própria lei ("o art. 4º da Lei nº 9.782, de 2005;" no 41098 art. 13).
- `leiBaseIndex` é objeto `chave → texto` em ordem de documento; chaves no formato do motor ("art. 59", "§ 1º do art. 165", "inc. viii do art. 1º", "al. i) do inc. v do art. 13").
- `apurarHistorico` já monta `naoAplicadas`/`aConferir` a partir de comandos recusados (inclusive `indeterminado`), mas só usa `l.comando.dispositivoAlvo`; e compara a lei-alvo do comando com a base só para `descartadas`.

## 3. Gramática (função pura nova, exportada, `interpretarObjetosRevogados(frase)`)
Entrada: o trecho entre o verbo e a primeira citação de lei (sem a lei). Saída: `{ ok, objetos: [{ niveis:[{tipo, rotulos[]|intervalo}] }], motivo }`.
1. Separação de objetos: ", o/a/os/as …" e " e o/a/os/as …" (conjunção **com artigo**) abre objeto novo; "e" sem artigo e vírgula ficam dentro do grupo de rótulos ("os arts. 59, 60, 61 e 62").
2. Cada objeto é uma cadeia `nível [do|da nível]*` na ordem item < alínea < inciso < (caput transparente) < § / parágrafo único < art. Só o nível mais interno pode ser plural (lista de rótulos ou intervalo); os externos têm um rótulo.
3. Objeto sem "art." herda a âncora do objeto seguinte ("o inc. VIII e o § 8º do art. 1º" → inc. VIII do art. 1º; § 8º do art. 1º). Sem âncora em lugar nenhum → falha.
4. "caput" só como transparente depois de inciso/alínea ("inc. IV do caput do art. 21"); "o caput …" como objeto, "com seus …", "e seguintes", "todos", "inteiro teor", "na parte relativa", "naquilo que", Capítulo/Seção/Título, Anexo/Tabela/Quadro, "item N" sem nível pai reconhecido → falha com motivo próprio (humano decide).
5. Consumo total: sobrou palavra de endereço em qualquer objeto → o objeto inteiro falha (e, na frase única, tudo ou nada: decisão 46).
6. Expansão: um endereço por rótulo, no formato de chave do motor. Dedupe de ancestral/filho na mesma lista (o ancestral basta; o filho daria "já revogado").
7. Intervalo ("arts. 43 a 61", "incs. I a VIII", "§§ 1º a 3º"): só com `opts.leiBaseIndex` **e** `opts.leiBaseConfere(leiAlvo)` verdadeiro (a lei-alvo é a da base; senão o índice é de outra lei). Expande para as chaves da base, mesmo pai e mesmo nível, entre os extremos em ordem de documento (inclui "-A"); extremo que não existe na base → `indeterminado` (decisão 47).

## 4. Onde entra no extrator (`extrairComandosLei`)
- Novo ramo **antes** do ramo de revogação atual, ativado por `RE_REVOGACAO_PLURAL` ancorado no início do artigo: `^\s*Fica(?:m)?\s+(?:ainda\s+|expressamente\s+)?revogad(?:os|as)(?![A-Za-zÀ-ÿ])`. O gatilho antigo (`revoga(m|da|do|-se)?`) **não é alargado** (alargá-lo sem gramática produziu 115 comandos mudados, quase todos falsos; ver relatório). "Ficam revogadas as disposições em contrário" continua `clausula_generica_sem_efeito`.
- Fluxo: (a) frase única: separa objetos, usa a 1ª lei do texto (decisão 4); (b) lista em filhos (caput termina em ":" ou o caput não tem objeto): cada filho é uma frase independente, lei do filho se houver, senão a do caput (decisão 46: por item); filho com filhos próprios → `indeterminado` do item; (c) item que é só referência a lei(s) ("a Lei nº X, de …", "as Leis …") → `revoke_lei` por lei (não toca a árvore); item com Decreto/ato fora do acervo → `indeterminado` com `revogacao_de_ato_fora_do_acervo`.
- Comandos: `revoke_node` (formato atual) + campos opcionais `origemFormaPlural: true`, `itemDaLista: {k, n}`. Falhas: `indeterminado` com `motivo` em português, `codigoMotivo` (`revogacao_lista_nao_interpretada`, `revogacao_intervalo_sem_lei_base`, `revogacao_caput_ou_agrupador`, `revogacao_de_anexo_ou_tabela`, `revogacao_de_ato_fora_do_acervo`, `revogacao_citacao_ilegivel`), `leiAlvo`/`leiAlvoResolvida` do item e `dispositivosCitados[]`.
- O ramo singular já existente (decisão 45) não muda de comportamento; o plural passa pela mesma trava de sobra de endereço.

## 5. Histórico, avisos e consulta
- `historico.mjs`: `enderecos` de `aplicada_em_parte`/`comando_recusado` passam a incluir `dispositivosCitados` **só quando a lei-alvo do comando é a da base** (mesma regra de `miraEstaLei`; evita marcar "a conferir" dispositivo de outra lei). Passa `leiBaseConfere` para o extrator.
- Aviso `revogacao_nao_interpretada` no estruturador (não reprova; decisão 48): a norma tem artigo que o motor reconhece como revogação plural/lista e emitiu `indeterminado`. Título em português em `tituloDoMotivo`/descrição no painel; `VERSAO_ESTRUTURADOR` sobe (o aviso muda o JSON; não muda veredito, então não reabre decisão humana: decisão 7).
- `revisao-comandos.mjs` já conta `indeterminado`; conferir que o painel mostra o novo `motivo`.

## 6. Fatias (cada uma: bateria antes/depois, medição dos 1.110 textos com diff de comandos, teste novo que falha no código antigo, espelho em `norma-simulacao.html`, CHANGELOG, commit)
- **R51** gramática + frase única plural (F4, F7) + mistos com âncora herdada + `indeterminado` com `dispositivosCitados` + ajuste do histórico.
- **R52** lista em filhos (F5, F9): por item, lei por item, `revoke_lei` por item de lei inteira.
- **R53** intervalo com `leiBaseConfere`.
- **R54** aviso no estruturador + título + painel.

## 7. Testes com texto real (ids; recortes do artigo em `fixtures/textos/revoga_plural_<id>.txt`)
Frase única: 47888 art. 7º (4 × `revoke_node` art. 59–62 em lc 765/2015); 50015 art. 4º (§ 1º e § 2º do art. 165); 42635 art. 15 (§ 4º do art. 45 e art. 47); 37039 art. 8º (inc. VIII e § 8º do art. 1º); 44114 art. 17 (art. 6º, art. 11, incisos do parágrafo único); 42031 art. 20 e 42387 art. 31 (`revoke_lei` por lei). Listas: 50308 art. 7º; 41098 art. 13 (lei por item); 43501 art. 3º e 46293 art. 4º (itens limpos aplicados; "caput e seus §§" e "Tabela" `indeterminado`); 50200 art. 9º (4 × `indeterminado`, nenhum `revoke_node`); 39862 art. 63 (decretos). Intervalo: 45807 art. 5º, 43376, 43503. Negativos: 45422 art. 14 e 30209 art. 111 (sem `revoke_*`); 43501 art. 1º e 2º; Plano Diretor 30209 (`revoke_lei`); `teste_revogacao_parcial`, `teste_revogacao_endereco`, LC 958/2022 art. 6º. Sintéticos marcados.

## 8. Critérios de término de cada fatia
Bateria igual (nenhum teste antigo muda de contagem); `normateste.mjs` byte a byte; diff de comandos nos 1.110 textos só com mudanças previstas e todas conferidas à mão (amostra mínima: todas as mudanças de `revoke_node`; ≥ 20% das de `indeterminado`/`revoke_lei`); testes novos falham no código antigo; espelho conferido por `diff` do trecho; histórico regenerado e `git diff` inspecionado.

## 9. Riscos e travas
Lei-alvo errada em lista multi-lei (usar a lei do item, nunca a 1ª do artigo); "e alterações posteriores" e "na redação dada pela Lei Y" (a lei-alvo continua a 1ª na ordem do texto do item, decisão 4); ordem entre alteradoras (revogar o já revogado vai para `naoAplicadas`, correto); vetado em lista ("VETADO.") pula sem aviso — registrar no CHANGELOG; revogação condicionada a data (35288) fica `indeterminado`.
