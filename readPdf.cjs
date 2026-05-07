const fs = require('fs');
const pdf = require('pdf-parse');

async function parsePDFs() {
    let dataBuffer1 = fs.readFileSync('./Resultado De Analise de Solo.pdf');
    let data1 = await pdf(dataBuffer1);
    fs.writeFileSync('pdf1.txt', data1.text);
    console.log("PDF 1 parsed and saved to pdf1.txt");

    let dataBuffer2 = fs.readFileSync('./imprimirlaudo_2022.PDF');
    let data2 = await pdf(dataBuffer2);
    fs.writeFileSync('pdf2.txt', data2.text);
    console.log("PDF 2 parsed and saved to pdf2.txt");
}

parsePDFs();
