# PLANO — Revogação no plural e em lista (21/11/2026)

Relatório do agente de planejamento (somente leitura), condensado pela sessão principal. **Insumo, não decisão** (regras 11 e 12). Scripts de medição do agente ficaram só no scratchpad. Verificado de forma independente pela sessão principal: o achado A (abaixo) e o dano no histórico de 17878.

## A. Achado grave (verificado): falso `revoke_node` JÁ existe hoje, em normas recentes
`extrairCitacoesExternas` não entende `al.`, `als.`, `incs.`, `§§`, `arts.`, `caput`, `item`, "Capítulo/Seção/Título" e descarta o nível que não entende, devolvendo o artigo/inciso inteiro; a `incompleta` só pega `§`, `inc.` e "parágrafo único" logo antes do "do". Resultado real no código atual:
| id | Texto | Sai hoje | Leitura correta |
|---|---|---|---|
| 44276 | "revogado o inc. XXVII do caput do art. 18 da LC 12" | `revoke_node[art. 18]` | só o inciso XXVII |
| 38944 | "inc. IV do caput do art. 21 da LC 7" | `revoke_node[art. 21]` | só o inciso IV |
| 51556 | "al. i do inc. V do art. 13 da LC 1.037" | `revoke_node[inc. V do art. 13]` | só a alínea i |
| 50842 | "item 2 da al. b do inc. III do art. 1º" | `revoke_node[inc. III …]` | só o item 2 |
| 38695 | OCR "al. j dodo art. 20" | `revoke_node[art. 20]` | só a alínea j |
| 46833 | "Capítulo V, com seus arts. 29 a 34, da LC 12" | `revoke_lei` | só o Capítulo V |
Sintético: "Revogam-se os incs. II e III do art. 4º" → `revoke_node[art. 4º]` (confirmado); "os arts. 3º e 5º da LC 7" → `revoke_lei` da LC 7 inteira.
**Dano gravado em `dados/historico/sapl/`:** 17878 (LC 12): `art-18` e seus 36 dispositivos aparecem "revogado" desde a versão 35 (LC 952/2022), que só revoga o inc. XXVII; 49739: `art-13/inc-V` e alíneas a–j (alteradora 51556 só revoga a alínea i).

## B. Alargar só o gatilho para o plural é pior que o silêncio
Medido pelo agente (cópia do core): 115 comandos deixam de ser `nao_classificado`; quase todos `revoke_*` seriam falsos (43501 art. 3º e 46293 art. 4º → `revoke_lei` da LC 7 inteira; 42631 → LC 721 inteira; 50015 → art. 165 inteiro). Trava: o gatilho só vale como verbo no início da oração ("Ficam/Fica revogad…", "Revogam-se"), nunca palavra solta.

## C. Medição (agente; recentes = pós 03/02/2009)
Universo plural/lista: 160 artigos em 149 normas; recentes 123 em 118. Famílias (recentes): F3 lei inteira singular 28 (correto); F4 leis inteiras no plural 2; F5 lista de leis em incisos 9; F6 dispositivo simples 30; F7 plural na frase ("arts. 3º e 5º", "§§ 1º e 2º") 26; F8 intervalo ("arts. 43 a 61") 4; F9 lista em incisos filhos 54; "disposições em contrário": 0 em recentes. Protótipo (só estimativa): 95 dos 123 artigos recentes lidos limpos; 15 de 63 listas têm ≥1 item que não se lê (48 itens; 169 bons).
Efeito hoje: `nao_classificado` e genérica são filtrados e não geram `naoAplicadas`/`aConferir`/aviso (silêncio); `revoke_lei` não altera a árvore; `revoke_node` é aplicado e recursivo.

## D. Desenho mínimo (a decidir)
1. **Trava em `extrairCitacoesExternas`** (primeiro, independente do plural): qualquer nível/palavra de endereço não consumido antes do "art." → `incompleta` → `indeterminado`; "do caput do art. N" transparente. Corrige os 6 casos; exige regenerar `dados/historico` 17878 e 49739; teste com os 6 ids reais.
2. **Gramática** `interpretarObjetosRevogados` (função pura): cadeia item<alínea<inciso<(caput)<§<art, lista só no nível mais interno, âncora herdada do item seguinte, lei-alvo por item (não a 1ª do artigo), consumo total dentro do item; gatilho ancorado.
3. **Comandos:** um `revoke_node` por endereço (formato atual + campos opcionais `itemDaLista`, `origemFormaPlural`); `revoke_lei` por lei; dedupe ancestral/filho.
4. **Aviso em vez de silêncio:** `indeterminado` com `motivo` e `dispositivosCitados[]`; `apurarHistorico` usa `dispositivosCitados` em `enderecos`/`aConferir`; aviso (não motivo) `revogacao_nao_interpretada` no estruturador; títulos em português.
5. Espelho em `norma-simulacao.html` (trecho de `extrairComandosLei` idêntico ao do core hoje; edição pontual). `aplicarComandoLei`/`revoke_node` não mudam.
6. Testes reais propostos: 6 ids da trava; 47888 art. 7º (4 nós), 50015 art. 4º, 42635 art. 15, 37039 art. 8º, 44114 art. 17; 50308 art. 7º, 41098 art. 13 (lei por item), 43501 art. 3º, 46293 art. 4º, 50200 art. 9º; 42031 art. 20, 42387 art. 31 (`revoke_lei`); negativos 45422 art. 14 e 30209 art. 111.

## E. Perguntas ao mantenedor (regra 11)
Q0 corrigir a trava (A) já, com regeneração do histórico dos dois casos. Q1 lista com item ilegível: por item ou tudo-ou-nada. Q2 intervalo: expandir contra a lei-alvo ou `indeterminado`. Q3 plural não lido: aviso ou reprovar. Q4 o que fica humano (caput isolado, agrupador, anexo/tabela, condição, ato fora do acervo).
