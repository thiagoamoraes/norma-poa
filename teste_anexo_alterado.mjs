// teste_anexo_alterado.mjs — decisão 37 (alteração posterior de anexo só é DETECTADA e avisada), com o recall corrigido: o detector antigo só
// via "anexo … da Lei" sem ponto e perdia "Anexo 1.2" / "Anexo 9.1" (Plano Diretor), "Tabela IV/XII", "Lista de Serviços anexa" (LC 7). Agora vale
// também o objeto de anexo + VERBO de alteração ("e alterações posteriores" não conta). Remissão ("de acordo com o Anexo 5.3 da LC 434") e
// "Quadro de Funções" NÃO são alteração de anexo. Textos REAIS do SAPL da PGM (dados/textos/sapl/<id>.txt). Sem rede.
import fs from 'node:fs';
import * as c from './norma-core.js';
import { artigosQueMexemEmAnexo } from './ingestao/historico.mjs';
import { prepararTextoExtraido } from './ingestao/extracao-texto.mjs';

let passou = 0, falhou = 0;
const ok = (d, t) => { if (t) { passou++; console.log('✓ ' + d); } else { falhou++; console.log('✗ ' + d); } };
const arts = (id, chave) => artigosQueMexemEmAnexo(c.parseMinuta(c.limparMarkdownLinks(prepararTextoExtraido(fs.readFileSync(`./dados/textos/sapl/${id}.txt`, 'utf8')))).artigos, chave).map((x) => x.artigo);

ok('id 35933 (real): "Fica alterado, no Anexo 1.2 da LC 434/1999" é anexo alterado do Plano Diretor (o ponto de "1.2" não corta a frase)', arts(35933, 'lc 434/1999').includes(2));
ok('id 34244 (real): "Fica incluída na fl. 3 do Anexo 9.1 da LC 434/1999 a via local do Tipo V.7"', arts(34244, 'lc 434/1999').includes(5));
ok('id 38309 (real): "Ficam alterados, no Anexo 1.2 da LC 434" e "Ficam criadas, no Anexo 1.2…" (arts. 1º e 2º)', arts(38309, 'lc 434/1999').includes(1) && arts(38309, 'lc 434/1999').includes(2));
ok('id 39825 (real): "Fica alterada a Tabela II da LC 7/1973" é anexo alterado da LC 7', arts(39825, 'lc 7/1973').includes(29));
ok('id 41019 (real): "Na Lista de Serviços anexa da LC 7/1973, ficam alterados os subitens…"', arts(41019, 'lc 7/1973').includes(3));
ok('id 47758 (real): "Ficam alterados os subitens … da Tabela XII da LC 7/1973"', arts(47758, 'lc 7/1973').includes(1));
ok('negativo (real, id 34142 art. 4º): "de acordo com o Anexo 5.3 da LC 434" é remissão, não alteração de anexo', !arts(34142, 'lc 434/1999').includes(4));
ok('negativo (real, id 51451 art. 3º): "Quadro de Funções Gratificadas constante no art. 20 da Lei 5.811" não é anexo', !arts(51451, 'l 5811/1986').includes(3));
ok('regressão (real, id 47547): a forma antiga ("item 4 do Anexo I da LC 942/2022") segue detectada', arts(47547, 'lc 942/2022').length > 0);
console.log(`\n${passou} ok, ${falhou} falha(s)`);
process.exit(falhou ? 1 : 0);
