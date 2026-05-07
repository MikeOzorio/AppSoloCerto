const fs = require('fs');

async function extract() {
  const pdfjsLib = await import('pdfjs-dist/build/pdf.mjs');
  const data = new Uint8Array(fs.readFileSync('./imprimirlaudo_2022.PDF'));
  const pdf = await pdfjsLib.getDocument({ data }).promise;
  
  let fullText = '';
  for(let i=1; i<=pdf.numPages; i++){
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    
    // Group by Y coordinate
    const rows = {};
    content.items.forEach(item => {
      // transform[5] is the Y coordinate. Rounding to handle slight variations
      const y = Math.round(item.transform[5]); 
      if (!rows[y]) rows[y] = [];
      rows[y].push(item);
    });
    
    // Sort Y descending (top to bottom)
    const sortedY = Object.keys(rows).sort((a, b) => b - a);
    
    for (const y of sortedY) {
      // Sort X ascending (left to right)
      const rowItems = rows[y].sort((a, b) => a.transform[4] - b.transform[4]);
      const lineText = rowItems.map(it => it.str).join('   ');
      fullText += lineText + '\n';
    }
  }
  
  fs.writeFileSync('pdf2_spatial.txt', fullText);
  console.log('Done!');
}

extract();
