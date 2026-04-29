const puppeteer = require('puppeteer');
const path = require('path');

async function gerarPDF() {
  console.log('🚀 Iniciando geração do PDF...');

  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();

  await page.setViewport({ width: 1920, height: 1080 });

  const arquivo = path.resolve(__dirname, 'MaisAlunos-Apresentacao.html');
  await page.goto('file:///' + arquivo.replace(/\\/g, '/'), { waitUntil: 'networkidle0' });

  const totalSlides = await page.evaluate(() => document.querySelectorAll('.slide').length);
  console.log(`📊 Total de slides encontrados: ${totalSlides}`);

  const { PDFDocument } = require('pdf-lib');
  const pdfDoc = await PDFDocument.create();

  for (let i = 0; i < totalSlides; i++) {
    console.log(`  📄 Gerando slide ${i + 1}/${totalSlides}...`);

    await page.evaluate((index) => {
      const slides = document.querySelectorAll('.slide');
      slides.forEach(s => s.classList.remove('active'));
      slides[index].classList.add('active');
      document.querySelector('.nav').style.display = 'none';
    }, i);

    await new Promise(r => setTimeout(r, 300));

    const screenshot = await page.screenshot({ type: 'png', fullPage: false });

    const pngImage = await pdfDoc.embedPng(screenshot);
    const pdfPage = pdfDoc.addPage([1920, 1080]);
    pdfPage.drawImage(pngImage, { x: 0, y: 0, width: 1920, height: 1080 });
  }

  const pdfBytes = await pdfDoc.save();
  const fs = require('fs');
  const outputPath = path.resolve(__dirname, 'MaisAlunos-Proposta-Final.pdf');
  fs.writeFileSync(outputPath, pdfBytes);

  await browser.close();
  console.log('\n✅ PDF gerado com sucesso!');
  console.log('📁 Arquivo: MaisAlunos-Proposta-Final.pdf');
}

gerarPDF().catch(err => {
  console.error('❌ Erro:', err.message);
  process.exit(1);
});
