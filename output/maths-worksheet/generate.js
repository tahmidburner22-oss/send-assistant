const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function main() {
  // Create output directory
  const outputDir = path.join(__dirname, 'output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Read source images and convert to base64 data URIs
  const img1Path = path.join(__dirname, 'source_images', 'p1_full.png');
  const img2Path = path.join(__dirname, 'source_images', 'p2_full.png');

  const img1Base64 = fs.readFileSync(img1Path).toString('base64');
  const img2Base64 = fs.readFileSync(img2Path).toString('base64');

  const img1DataUri = `data:image/png;base64,${img1Base64}`;
  const img2DataUri = `data:image/png;base64,${img2Base64}`;

  // Read the HTML template
  let html = fs.readFileSync(path.join(__dirname, 'template.html'), 'utf-8');

  // Inject base64 images into the template
  html = html.replace('<img id="img1" src=""', `<img id="img1" src="${img1DataUri}"`);
  html = html.replace('<img id="img2" src=""', `<img id="img2" src="${img2DataUri}"`);

  // Launch browser and generate PDF
  const browser = await chromium.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  // Set content with the embedded images
  await page.setContent(html, { waitUntil: 'networkidle' });

  // Generate landscape A4 PDF with no margins
  const pdfPath = path.join(outputDir, 'worksheet.pdf');
  await page.pdf({
    path: pdfPath,
    format: 'A4',
    landscape: true,
    printBackground: true,
    margin: {
      top: '0',
      right: '0',
      bottom: '0',
      left: '0'
    }
  });

  console.log(`PDF generated: ${pdfPath}`);

  await browser.close();

  // Write metadata JSON
  const metadata = {
    type: 'maths_worksheet',
    title: 'Maths Worksheet',
    pages: 2,
    orientation: 'landscape',
    format: 'A4',
    margins: 'none',
    source_images: [
      {
        filename: 'p1_full.png',
        path: 'source_images/p1_full.png',
        width_px: 1054,
        height_px: 709,
        page: 1
      },
      {
        filename: 'p2_full.png',
        path: 'source_images/p2_full.png',
        width_px: 1054,
        height_px: 781,
        page: 2
      }
    ],
    output: {
      filename: 'worksheet.pdf',
      path: 'output/worksheet.pdf'
    },
    generated_with: 'playwright',
    image_encoding: 'base64_data_uri'
  };

  const metadataPath = path.join(outputDir, 'worksheet.json');
  fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2), 'utf-8');
  console.log(`Metadata written: ${metadataPath}`);
}

main().catch((err) => {
  console.error('Error generating PDF:', err);
  process.exit(1);
});
