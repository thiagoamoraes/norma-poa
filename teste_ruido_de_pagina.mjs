// teste_ruido_de_pagina.mjs — ruído de impressão (número da página, carimbo de processo repetido) sai do
// texto LIDO e o "Art. 1º" colado ao preâmbulo é separado (decisão do mantenedor, 20/11/2026).
// Textos REAIS do SAPL da PGM (fixtures/textos/ruido_*.txt); o quadro numérico do plano diretor (id 30209,
// dados/textos/sapl) é o caso NEGATIVO. Sem rede. Uso: node teste_ruido_de_pagina.mjs
import fs from 'node:fs';
import { estruturarNorma } from './ingestao/estrutura.mjs';
import { prepararTextoExtraido, removerRuidoDePagina, separarArtigoDoPreambulo } from './ingestao/extracao-texto.mjs';

let passou = 0, falhou = 0;
const ok = (d, c) => { if (c) { passou++; console.log('✓ ' + d); } else { falhou++; console.log('✗ ' + d); } };
const regs = JSON.parse(fs.readFileSync('./fixtures/textos/ruido_registros.json', 'utf8'));
const bruto = (id) => fs.readFileSync(`./fixtures/textos/ruido_${id}.txt`, 'utf8');
const reg = (id) => regs.find((r) => r.idSapl === id);
const motivos = (id) => estruturarNorma(prepararTextoExtraido(bruto(id)), reg(id)).verificacao.motivos;

ok('LC 897/2021 (real): número da página entre o bloco e o artigo seguinte deixa de causar "trecho_nao_localizado"', !motivos(42994).includes('trecho_nao_localizado_na_origem'));
ok('LC 1.074/2026 (real): carimbo "PLCE Nº 006/26" (repetido em todas as páginas) não cola no artigo 4º', !motivos(51463).includes('trecho_nao_localizado_na_origem') && !motivos(51463).includes('texto_fora_da_arvore'));
ok('LC 867/2019 (real): número da página entre o ” e o "(NR)" não separa o "(NR)"', !motivos(42355).includes('trecho_nao_localizado_na_origem'));
ok('LC 838/2018 (real): número da página entre o título do agrupador e o artigo não vai para o dispositivo anterior', !motivos(41876).includes('trecho_nao_localizado_na_origem'));
ok('LC 660/2010 (real): "Art. 1º" na mesma linha do preâmbulo é reconhecido (a norma tem artigos)', !motivos(37041).includes('sem_artigos') && !motivos(37041).includes('trecho_nao_localizado_na_origem'));

// unidades, com texto real recortado ao redor da página
const t = bruto(51463);
const lido = prepararTextoExtraido(t);
ok('carimbo repetido some do texto lido, mas continua no arquivo guardado', /PLCE N[ºo] 006\/26/.test(t) && !/PLCE N[ºo] 006\/26/.test(lido));

// negativo: o quadro numérico do plano diretor não perde linha de algarismos além de, no máximo, uma por página
const pd = fs.readFileSync('./dados/textos/sapl/30209.txt', 'utf8');
const soNum = (s) => s.split('\n').filter((l) => /^ *\d{1,3} *$/.test(l.replace(/\f/g, ''))).length;
const paginas = (pd.match(/\f/g) || []).length + 1;
const antes = soNum(pd), depois = soNum(removerRuidoDePagina(pd));
ok(`plano diretor (real, id 30209): ${antes} linhas só de algarismos; sai no máximo uma por página (${paginas}) e o resto fica (${depois})`, antes - depois <= paginas && depois >= antes - paginas && depois > 500);

// carimbo que aparece uma vez fica; número que não é o da página fica (sintético)
ok('(sintético) carimbo que aparece UMA vez fica no texto', removerRuidoDePagina('Art. 1º A.\nPLCL Nº 019/18\nArt. 2º B.').includes('PLCL Nº 019/18'));
ok('(sintético) número que NÃO é o da página fica', removerRuidoDePagina('Art. 1º A.\n7\nArt. 2º B.').includes('\n7\n'));
ok('(sintético) número igual ao da página (2ª) sai, uma vez só', removerRuidoDePagina('Art. 1º A.\n\f2\nArt. 2º B.\n2\n').split('\n').filter((l) => l.trim() === '2').length === 1);
ok('(sintético) separarArtigoDoPreambulo só mexe no 1º artigo depois de "seguinte Lei"', separarArtigoDoPreambulo('Promulgo a seguinte Lei Complementar: Art. 1º Fica.') === 'Promulgo a seguinte Lei Complementar:\nArt. 1º Fica.' && separarArtigoDoPreambulo('Texto: Art. 2º Fica.') === 'Texto: Art. 2º Fica.');
console.log(`\n${passou} ok, ${falhou} falha(s)`);
process.exit(falhou ? 1 : 0);
