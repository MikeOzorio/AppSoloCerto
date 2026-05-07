import fs from 'fs';
import * as pdfjsLib from 'pdfjs-dist/build/pdf.mjs';

async function extract(file) {
  try {
    const data = new Uint8Array(fs.readFileSync(file));
    const pdf = await pdfjsLib.getDocument({ data }).promise;
    let text = '';
    for(let i=1; i<=pdf.numPages; i++){
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map(it => it.str).join(' ') + '\n';
    }
    console.log(`--- TEXT FROM ${file} ---`);
    fs.writeFileSync(file + '.txt', text);
    console.log(`Saved text to ${file}.txt`);
  } catch(e) {
    console.error(`Error processing ${file}:`, e.message);
  }
}

async function run() {
  await extract('./Resultado De Analise de Solo.pdf');
  await extract('./imprimirlaudo_2022.PDF');
}

run();
