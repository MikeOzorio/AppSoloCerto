const fs = require('fs');
const pdf = require('pdf-parse');

(async function() {
    let d = await pdf(fs.readFileSync('./Resultado De Analise de Solo.pdf'));
    fs.writeFileSync('pdf1.txt', d.text);
    console.log("Saved pdf1.txt");

    d = await pdf(fs.readFileSync('./imprimirlaudo_2022.PDF'));
    fs.writeFileSync('pdf2.txt', d.text);
    console.log("Saved pdf2.txt");
})();
