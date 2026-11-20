# PLANO — Dashboard de revisão humana

Decidido com o mantenedor em 20/11/2026. Plano vivo: atualizar ao fim de cada fase.

## Por quê

A fila de revisão do estruturador (`dados/estruturado/RELATORIO.md`) é longa para ler em texto. A revisão humana é esperada, mas **não pode ser tão grande que impeça a automação**: o dashboard existe para tornar cada conferência rápida, registrar o resultado de forma auditável e devolver ao motor o que for forma legítima ainda desconhecida.

## Decisões (entrevista de 20/11/2026)

| Tema | Decisão |
|---|---|
| Onde vive | Página **estática** em `docs/revisao.html` (GitHub Pages, sem servidor, sem dependências), junto da página de consulta. |
| Onde ficam as decisões | Arquivo no repositório: `dados/revisao/decisoes.jsonl` (uma linha por decisão, a ÚLTIMA de cada norma vale). A página guarda no navegador e **exporta**; o mantenedor entrega o arquivo e o commit é feito pela sessão. Sem token, sem servidor. |
| Ações por norma | (1) **Aceitar como está** · (2) **Marcar defeito de fonte** (com motivo e trecho) · (3) **Corrigir rótulo/estrutura por sobreposição** · (4) **Encaminhar ao motor** (forma legítima desconhecida → caso de estudo). |
| Visões | (a) texto de origem × árvore lado a lado, com o trecho reprovado destacado · (b) link do arquivo original na fonte · (c) para alteradoras: comando × resultado no texto vigente · (d) referência do leis.org lado a lado, para normas de peso. |
| Escopo da 1ª versão | **Só as recentes em revisão** (sanção da LC 611 em diante; 135 em 20/11/2026). Antigas e amostragem das aceitas ficam para depois. |
| Corte de época | 03/02/2009 (`epocaDaNorma`). |

## Princípios (não negociáveis)

1. **O motor nunca é alterado por uma decisão humana.** `dados/estruturado/` continua sendo a saída pura do leitor. As decisões são uma **camada à parte** (`dados/revisao/`), sempre auditável: quem decidiu o quê, sobre qual versão do texto.
2. **Decisão amarrada à versão.** Cada decisão guarda `sha256Origem` e `versaoEstruturador` da norma revisada. Se o texto ou o leitor mudar, a decisão aparece como **desatualizada** e a norma volta à fila — nunca vale em silêncio.
3. **Texto de origem intocado.** Correção por sobreposição registra `{endereço, campo, de, para, nota}`; não reescreve texto de lei.
4. **Nada de juízo sobre pessoas ou órgãos** nos dados e na interface (o repositório é público). A decisão não leva nome de quem revisou.
5. **`aceita por humano` ≠ `aceita pelo motor`.** Nos relatórios as duas contagens são sempre separadas; só a taxa do motor mede o leitor.
6. **Nenhum código sem exemplo real:** os testes usam normas reais da fila (fixtures), com a descrição `(sintético)` onde o texto for inventado.

## Modelo de dados

**`dados/revisao/decisoes.jsonl`** (acréscimo; a última linha de cada `idSapl` vale):

```
{ "idSapl": 44376, "decisao": "aceitar" | "defeito_de_fonte" | "corrigir" | "encaminhar_ao_motor",
  "sha256Origem": "...", "versaoEstruturador": 7, "em": "2026-11-20T...Z",
  "nota": "texto livre curto",
  "defeito": { "tipo": "aspas_faltando|aspas_fechando_cedo|nr_truncado|numeracao_errada|ocr|outro", "trecho": "..." },   // só em defeito_de_fonte
  "correcoes": [ { "endereco": "art-5/par-unico", "campo": "rotulo", "de": "Parágrafo único.", "para": "§ 1º" } ],   // só em corrigir
  "motivosNaHora": ["rotulo_nao_confere_com_a_origem"] }
```

**`docs/dados/revisao/fila.json`** — índice leve (uma linha por norma recente em revisão): id, rótulo, tipo, número, data, motivos, contagem de pontos a olhar, link da fonte, `sha256Origem`, `versaoEstruturador`.

**`docs/dados/revisao/n/<id>.json`** — uma norma: texto de origem (já preparado), dispositivos com **âncora** (início/fim no texto de origem) e **situação da conferência** de cada um (`ok` | `rotulo_diverge` | `nao_localizado`), lacunas (texto fora da árvore) com posição. Gerado por `ingestao/gerar-revisao.mjs` a partir de `ingestao/revisao.mjs` (puro, testado).

## Fases

| Fase | Entrega | Pronto quando |
|---|---|---|
| **F1 — FEITA em 20/11/2026** | Fila das recentes + conferência lado a lado com destaque + 4 ações + exportar/importar decisões + link da fonte. Gerador puro `revisao.mjs` (âncoras) com testes cruzados contra o próprio estruturador. | Abrir uma norma da fila mostra o ponto reprovado nos dois lados; exportar produz um `decisoes.jsonl` que o validador aceita; o teste prova que as âncoras concordam com o veredito do estruturador. |
| **F2 — FEITA em 20/11/2026** | Alteradoras: comando × resultado (o que o extrator de comando entendeu e como ficou o dispositivo alterado). Depende de a lei-alvo estar na base. | Para a alteradora aberta, a tela mostra comando, alvo resolvido (ou "alvo ausente na base") e antes/depois. |
| **F3 — FEITA em 20/11/2026** (página `docs/compara.html`) | Leis.org: o mantenedor cola a compilação de uma norma de peso; a tela mostra as diferenças contra o texto vigente apurado. Só auxílio de conferência; vale o texto da lei. | Colar a compilação da LC 320 reproduz as divergências já nomeadas em `teste_versionamento.mjs`. |
| **F4 — FEITA em 20/11/2026** (menos a sobreposição na página de consulta) | Efeito das decisões: o relatório passa a separar *aceita pelo motor* / *aceita por humano* / *defeito de fonte* / *encaminhada*; `encaminhar_ao_motor` gera a lista de casos de estudo para o ROTEIRO; sobreposições valem na página de consulta com aviso. | Relatório mostra as 4 contagens; decisão desatualizada reabre a norma. |
| F5 | Antigas (fila própria) e amostragem das aceitas pelo motor, para medir erro silencioso. | A taxa de acerto das aceitas é medida em amostra sorteada. |

## Interface (F1)

- Cabeçalho: contagem — total, revisadas, pendentes, desatualizadas; filtro por motivo e por situação da decisão.
- Esquerda: lista agrupada por motivo, com marca de revisada. Atalhos de teclado: J/K navegam, A aceita, D defeito de fonte, E encaminha.
- Centro: **texto de origem** (esq.) × **árvore de dispositivos** (dir.); clicar num dispositivo rola o texto de origem até a âncora e vice-versa; destaques: vermelho = rótulo não confere, amarelo = trecho não localizado, cinza = texto fora da árvore.
- Rodapé de ação: botões das 4 ações, campo de nota curta; "Corrigir" abre o rótulo do dispositivo selecionado para sobreposição.
- Canto: **Exportar decisões** (baixa `decisoes.jsonl` completo, mesclando o que já veio do repositório) e **Importar**.
- Acessível (teclado, contraste, não depende só de cor), funciona em tela estreita (a lista vira gaveta), claro/escuro.

## Riscos e armadilhas

- A conferência do estruturador guarda só 5 exemplos por métrica; o gerador recomputa **todos** com a mesma lógica e o teste confere que o veredito é o mesmo.
- Texto de OCR: a página mostra o aviso e o link da fonte; nunca corrige OCR.
- Tamanho: ~135 normas × poucas dezenas de KB. Se passar de ~10 MB, fatiar como a página de consulta.
- Perda de decisões: o navegador pode limpar o armazenamento — por isso exportar com frequência (a página lembra e avisa depois de N decisões não exportadas).
