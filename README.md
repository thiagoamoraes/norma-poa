# parserleispoa — Norma

**Experimento pessoal** de leitura estruturada da legislação municipal de Porto
Alegre: catalogar as normas, guardar o texto, reconhecer a estrutura
(artigos, parágrafos, incisos…) e, a partir das leis alteradoras, apurar o
texto vigente de cada lei.

## Aviso

- Este repositório é um **estudo em andamento**, feito por iniciativa
  individual. **Não é produto, serviço nem posição oficial** da Câmara
  Municipal de Porto Alegre, da Prefeitura de Porto Alegre ou de qualquer outro
  órgão, e não tem vínculo com eles.
- **Nada aqui substitui a publicação oficial.** O texto que vale é o publicado
  no Diário Oficial de Porto Alegre (DOPA). Os dados e os textos deste
  repositório podem conter erros, lacunas e atrasos — inclusive erros
  introduzidos pelo próprio processamento.
- Para consultar legislação, use as fontes mantidas pelos órgãos competentes e
  os portais de referência que eles indicam.

## Fontes e agradecimento

- **Catálogo e arquivos de texto:** base "Legislação Municipal" mantida pela
  Procuradoria-Geral do Município de Porto Alegre
  (<https://legislacao.portoalegre.rs.gov.br>), construída sobre o SAPL
  (software livre do Interlegis/Senado Federal), que publica seu conteúdo sob
  licença Creative Commons Atribuição–CompartilhaIgual 4.0.
- **Publicações recentes:** índice das edições do Diário Oficial de Porto
  Alegre (<https://dopa.portoalegre.rs.gov.br>).

Este experimento só existe porque essas bases são públicas e bem mantidas. O
trabalho de quem as alimenta é a parte difícil; aqui há apenas uma leitura
automatizada dele.

Portais privados de legislação **não são fonte de coleta automática** deste
projeto.

## Cuidado com os servidores das fontes

A coleta é deliberadamente lenta: uma requisição por minuto, uma de cada vez,
fora do horário de expediente, como pede o `robots.txt` da fonte. Nenhuma
proteção de acesso é contornada. Se você mantém uma das fontes e prefere outro
ritmo, outro horário ou que a coleta pare, abra uma *issue* neste repositório.

## O que há aqui

| Caminho | Conteúdo |
|---|---|
| `norma-core.js` | Motor de leitura e de apuração de texto vigente (sem dependências, sem rede) |
| `ingestao/` | Coleta do catálogo, download de textos, conferência com o DOPA |
| `dados/catalogo/` | Catálogo das normas (metadados) e relatório de cobertura |
| `dados/textos/` | Texto extraído de cada norma e índice com o hash do arquivo original |
| `dados/dopa/` | Cabeçalho e link das normas vistas nas edições recentes do DOPA |
| `dados/estruturado/` | Cada norma em dispositivos endereçáveis, com o resultado da verificação automática |
| `docs/` | Página de consulta (busca por número e por palavras da ementa; texto estruturado quando houver) |
| `teste_*.mjs` | Testes (sem framework: `node teste_….mjs`) |
| `PLANO.md` | Fases do experimento e o que falta |

Escopo atual: Lei Orgânica e emendas, leis complementares e leis ordinárias.

## Licença

- **Dados** em `dados/`: derivados da base da Procuradoria-Geral do Município,
  seguem a licença da fonte — CC BY-SA 4.0, com atribuição à fonte.
- **Textos de normas** são atos oficiais.
- **Código:** licença ainda não definida.
