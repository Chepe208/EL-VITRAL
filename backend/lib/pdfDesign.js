const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { createRequire } = require('module');

const requireFromModule = createRequire(__filename);

let pdfkitDir = path.join(__dirname, '..', 'node_modules', 'pdfkit', 'js');
let fontPath = path.join(pdfkitDir, 'data');

try {
  const pdfkitMain = requireFromModule.resolve('pdfkit');
  const resolvedDir = path.dirname(pdfkitMain);
  const candidatePath = path.join(resolvedDir, 'data');
  if (fs.existsSync(candidatePath)) {
    pdfkitDir = resolvedDir;
    fontPath = candidatePath;
  }
} catch {
  // Fallback to the project-relative node_modules location
}

if (!fs.existsSync(fontPath)) {
  const fallback = path.join(process.cwd(), 'node_modules', 'pdfkit', 'js', 'data');
  if (fs.existsSync(fallback)) {
    fontPath = fallback;
  }
}

const standardFontFiles = [
  'Courier.afm',
  'Courier-Bold.afm',
  'Courier-Oblique.afm',
  'Courier-BoldOblique.afm',
  'Helvetica.afm',
  'Helvetica-Bold.afm',
  'Helvetica-Oblique.afm',
  'Helvetica-BoldOblique.afm',
  'Times-Roman.afm',
  'Times-Bold.afm',
  'Times-Italic.afm',
  'Times-BoldItalic.afm',
  'Symbol.afm',
  'ZapfDingbats.afm',
];

const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function (...args) {
  const filePath = args[0];
  if (typeof filePath === 'string' && filePath.toLowerCase().endsWith('.afm')) {
    const fileName = path.basename(filePath);
    const fixedPath = path.join(fontPath, fileName);
    if (standardFontFiles.includes(fileName) && fs.existsSync(fixedPath)) {
      return originalReadFileSync.apply(this, [fixedPath, ...args.slice(1)]);
    }
    const altPath = path.join(pdfkitDir, 'data', fileName);
    if (standardFontFiles.includes(fileName) && fs.existsSync(altPath)) {
      return originalReadFileSync.apply(this, [altPath, ...args.slice(1)]);
    }
  }
  return originalReadFileSync.apply(this, args);
};

PDFDocument.prototype.fonts = standardFontFiles.reduce((fonts, fontFile) => {
  const fontName = path.basename(fontFile, '.afm');
  const fontFilePath = path.join(fontPath, fontFile);
  if (fs.existsSync(fontFilePath)) {
    fonts[fontName] = fontFilePath;
  }
  return fonts;
}, {});

function createPDFDocument() {
  return new PDFDocument({ size: 'A4', margin: 40 });
}

function formatCurrency(value) {
  return new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function drawHeader(doc, title, reference, date, status) {
  const pageWidth = doc.page.width;
  const margin = doc.page.margins.left;
  const headerWidth = pageWidth - margin * 2;

  doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(22).text('EL VITRAL', margin, 40);
  doc.font('Helvetica').fontSize(10).fillColor('#475569').text('Vidrios, espejos y herrajes', { lineGap: 4 });
  doc.text('Calle 30 # 73-26, Medellín', { lineGap: 4 });
  doc.text('Tel: 3137928483 | simonuwusierra@gmail.com', { lineGap: 4 });

  const blockX = margin;
  const blockY = doc.y + 20;
  const blockHeight = 90;

  doc.roundedRect(blockX, blockY, headerWidth, blockHeight, 8).fill('#eff6ff');
  doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(14).text(title, blockX + 14, blockY + 14);
  doc.font('Helvetica').fontSize(10).fillColor('#475569').text(`Referencia: ${reference}`, blockX + 14, blockY + 36);
  doc.text(`Fecha: ${date}`, blockX + 14, blockY + 52);

  const statusX = blockX + headerWidth - 160;
  const statusY = blockY + 14;
  doc.font('Helvetica-Bold').fontSize(10).fillColor('#1d4ed8').text('ESTADO', statusX, statusY);
  doc.font('Helvetica').fontSize(12).fillColor('#0f172a').text(status || 'N/A', statusX, statusY + 16);

  doc.moveDown(6);
}

function drawClientDetails(doc, client, extraDetails) {
  const margin = doc.page.margins.left;
  const leftWidth = 280;
  const startY = doc.y;

  doc.font('Helvetica-Bold').fontSize(11).fillColor('#0f172a').text('Información del cliente', margin, startY);
  doc.font('Helvetica').fontSize(10).fillColor('#475569').text(`Nombre: ${client.nombre_cliente}`, margin, doc.y + 6);
  doc.text(`Email: ${client.email_cliente}`);
  doc.text(`Teléfono: ${client.telefono_cliente || 'No especificado'}`);
  doc.text(`Dirección: ${client.direccion_cliente || 'No especificado'}`);

  const boxX = margin + leftWidth + 10;
  const boxY = startY;
  doc.font('Helvetica-Bold').fontSize(11).fillColor('#0f172a').text('Resumen', boxX, boxY);
  extraDetails.forEach((item, index) => {
    const y = boxY + 18 + index * 14;
    doc.font('Helvetica-Bold').fontSize(10).fillColor('#0f172a').text(`${item.label}:`, boxX, y, { continued: true });
    doc.font('Helvetica').fillColor('#475569').text(` ${item.value}`);
  });

  doc.moveDown(3);
}

function drawItemsTable(doc, items) {
  const margin = doc.page.margins.left;
  const tableTop = doc.y;
  const tableWidth = doc.page.width - margin * 2;

  const colWidths = [
    tableWidth * 0.44,
    tableWidth * 0.18,
    tableWidth * 0.10,
    tableWidth * 0.14,
    tableWidth * 0.14,
  ];

  const colPositions = [margin];
  for (let i = 1; i < colWidths.length; i++) {
    colPositions.push(colPositions[i - 1] + colWidths[i - 1]);
  }

  const rowHeight = 24;
  const headerHeight = 24;

  doc.rect(margin, tableTop, tableWidth, headerHeight).fill('#e0f2fe');
  doc.font('Helvetica-Bold').fontSize(10).fillColor('#0f172a');

  const headerTexts = ['Descripción', 'Medidas', 'Cant.', 'Precio', 'Total'];
  const headerAligns = ['left', 'left', 'center', 'right', 'right'];

  headerTexts.forEach((txt, i) => {
    const x = colPositions[i] + 6;
    const y = tableTop + 7;
    const width = colWidths[i] - 12;
    doc.text(txt, x, y, { width, align: headerAligns[i] });
  });

  let rowY = tableTop + headerHeight;
  items.forEach((item, index) => {
    if (index % 2 === 0) {
      doc.rect(margin, rowY, tableWidth, rowHeight).fill('#f8fafc');
    }

    const medidas =
      item.medida_largo && item.medida_ancho
        ? `${item.medida_largo} × ${item.medida_ancho} cm`
        : 'No aplica';

    const lineY = rowY + 6;
    doc.fillColor('#0f172a').font('Helvetica').fontSize(10);

    doc.text(item.descripcion, colPositions[0] + 6, lineY, {
      width: colWidths[0] - 12,
      align: 'left',
    });
    doc.text(medidas, colPositions[1] + 6, lineY, {
      width: colWidths[1] - 12,
      align: 'left',
    });
    doc.text(String(item.cantidad), colPositions[2] + 6, lineY, {
      width: colWidths[2] - 12,
      align: 'center',
    });
    doc.text(
      `$${formatCurrency(Number(item.precio_unitario) || 0)}`,
      colPositions[3] + 6,
      lineY,
      { width: colWidths[3] - 12, align: 'right' }
    );
    doc.text(
      `$${formatCurrency(Number(item.subtotal) || 0)}`,
      colPositions[4] + 6,
      lineY,
      { width: colWidths[4] - 12, align: 'right' }
    );

    doc
      .moveTo(margin, rowY + rowHeight)
      .lineTo(margin + tableWidth, rowY + rowHeight)
      .strokeColor('#cbd5e1')
      .lineWidth(0.5)
      .stroke();

    rowY += rowHeight;
  });

  doc.y = rowY + 10;
}

function drawTotals(doc, subtotal, total) {
  const boxWidth = 240;
  const boxX = doc.page.margins.left;
  const boxY = doc.y;
  const leftPad = 14;

  doc.roundedRect(boxX, boxY, boxWidth, 70, 8).fill('#eef2ff');

  doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(10)
    .text('Resumen de precios', boxX + leftPad, boxY + 12);

  const labelY = boxY + 32;
  doc.font('Helvetica').fontSize(10).fillColor('#475569')
    .text('Subtotal: ', boxX + leftPad, labelY, { continued: true });
  doc.font('Helvetica').fontSize(10).fillColor('#0f172a')
    .text(`$${formatCurrency(subtotal)}`);

  const totalLineY = doc.y + 6;
  doc.font('Helvetica-Bold').fontSize(12).fillColor('#0f172a')
    .text('Total: ', boxX + leftPad, totalLineY, { continued: true });
  doc.font('Helvetica-Bold').fontSize(12).fillColor('#0f172a')
    .text(`$${formatCurrency(total)}`);

  doc.y = boxY + 90;
}

function drawFooter(doc) {
  const margin = doc.page.margins.left;
  const footerY = doc.page.height - doc.page.margins.bottom - 50;

  doc
    .moveTo(margin, footerY - 10)
    .lineTo(doc.page.width - margin, footerY - 10)
    .strokeColor('#cbd5e1')
    .lineWidth(0.5)
    .stroke();

  doc
    .font('Helvetica-Bold')
    .fontSize(8)
    .fillColor('#b45309')
    .text(
      'Nota: Los precios cotizados NO tienen incluido el transporte. Para servicio de transporte llamar al 3137928483.',
      margin,
      footerY - 8,
      {
        width: doc.page.width - margin * 2,
        align: 'center',
      }
    );

  doc
    .font('Helvetica')
    .fontSize(8.5)
    .fillColor('#94a3b8')
    .text(
      'Gracias por preferir El Vitral. Para preguntas o asesoría, contáctanos al 3137928483.',
      margin,
      footerY + 8,
      {
        width: doc.page.width - margin * 2,
        align: 'center',
      }
    );
}

module.exports = {
  createPDFDocument,
  formatCurrency,
  drawHeader,
  drawClientDetails,
  drawItemsTable,
  drawTotals,
  drawFooter,
};
