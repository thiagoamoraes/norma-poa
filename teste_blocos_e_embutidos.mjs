// teste_blocos_e_embutidos.mjs — decisões 30 e 31 (21/11/2026), textos REAIS do SAPL da PGM (fixtures/textos/bloco_*):
//  (30) bloco de alteração que PERDEU o fecho (veto, glifo truncado, ruído de OCR) não engole o artigo seguinte da
//       alteradora: a fronteira é inferida (decisão 9), a norma sai "a revisar" com bloco_sem_fechamento_de_aspas e NUNCA
//       "aceita limpa". Inclui o procurador do "Art. N+1" que não casava "Art. 2º Esta Lei…" (bug).
//  (30) a aspa de fecho de um termo entre aspas no fim da linha de um inciso (“contact centers”) não fecha o bloco.
//  (31) dispositivo embutido no meio da linha (DOCX): só "Art. N+1" e "§ N+1" são separados em linha própria.
// Sem rede. Uso: node teste_blocos_e_embutidos.mjs
import fs from 'node:fs';
import { estruturarNorma } from './ingestao/estrutura.mjs';
import { prepararTextoExtraido, separarDispositivosEmbutidos } from './ingestao/extracao-texto.mjs';

let passou = 0, falhou = 0;
const ok = (d, c) => { if (c) { passou++; console.log('✓ ' + d); } else { falhou++; console.log('✗ ' + d); } };
const regs = JSON.parse(fs.readFileSync('./fixtures/textos/bloco_registros.json', 'utf8'));
const roda = (id) => estruturarNorma(prepararTextoExtraido(fs.readFileSync(`./fixtures/textos/bloco_${id}.txt`, 'utf8')), regs.find((r) => r.idSapl === id));

for (const [id, nome] of [[37352, 'EC 31/2011'], [38051, 'LC 690/2012'], [39258, 'LC 733/2014'], [42216, 'LC 859/2019 (fecho do bloco seguinte adiante)'], [38297, 'EC 35/2012 (ruído de OCR no “(NR)”)'], [40134, 'LC 766/2015 (glifo truncando)']]) {
  const e = roda(id), v = e.verificacao;
  ok(`${nome}: o bloco sem fecho não engole o artigo seguinte (sem rótulo deslocado) e sai "a revisar" por bloco_sem_fechamento_de_aspas, nunca aceita limpa`, !v.motivos.includes('rotulo_nao_confere_com_a_origem') && v.motivos.includes('bloco_sem_fechamento_de_aspas') && v.situacao === 'revisar');
}
const v36400 = roda(36400).verificacao;
ok('id 36400 (real): “contact centers” no fim da linha de um inciso não fecha o bloco; a norma é aceita', !v36400.motivos.includes('rotulo_nao_confere_com_a_origem') && v36400.situacao === 'aceita');
for (const id of [48855, 37043]) ok(`id ${id} (real, DOCX): "Art. N" / "§ N" embutidos no meio da linha são separados (sem rótulo deslocado)`, !roda(id).verificacao.motivos.includes('rotulo_nao_confere_com_a_origem'));
// negativos (sintéticos)
ok('(sintético) negativo: "Art. 5" citado no meio da frase (não é o sucessor) NÃO é separado', separarDispositivosEmbutidos('Art. 1º Aplica-se o disposto no Art. 5 desta Lei.') === 'Art. 1º Aplica-se o disposto no Art. 5 desta Lei.');
ok('(sintético) "Art. 2º VETADO Art. 3º VETADO" vira 2 linhas; "§ 2º" depois do "§ 1º" também', separarDispositivosEmbutidos('Art. 2º VETADO Art. 3º VETADO').split('\n').length === 2 && separarDispositivosEmbutidos('Art. 1º Texto.\n§ 1º Frase. § 2º Outra frase.').split('\n').length === 3);
ok('(sintético) incisos embutidos NÃO são separados (decisão 31: só Art. e §)', separarDispositivosEmbutidos('Art. 1º Fica:\nI – a; II – b;') === 'Art. 1º Fica:\nI – a; II – b;');
console.log(`\n${passou} ok, ${falhou} falha(s)`);
process.exit(falhou ? 1 : 0);
