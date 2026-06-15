const fs = require('fs');

let content = fs.readFileSync('src/components/PrinterSpecForm.tsx', 'utf-8');

// Find the start of Print Method
const printMethodStart = content.indexOf('      {/* Print Method */}');

// Find Barcodes and extract
const barcodesStart = content.indexOf('      {/* Barcodes */}');
const barcodesEnd = content.indexOf('      {/* Color Rotation Details */}');
if (barcodesStart === -1 || barcodesEnd === -1) {
  console.error("Could not find Barcodes");
  process.exit(1);
}
const barcodesBlock = content.substring(barcodesStart, barcodesEnd);

// Find Color Rotation Details and extract
const colorRotationEnd = content.indexOf('      {/* Artwork Information Table */}');
if (colorRotationEnd === -1) {
  console.error("Could not find Color Rotation Details");
  process.exit(1);
}
const colorRotationBlock = content.substring(barcodesEnd, colorRotationEnd);

const restBeforeBarcodes = content.substring(0, printMethodStart);
const betweenPrintMethodAndBarcodes = content.substring(printMethodStart, barcodesStart);
const printMethodToEnd = betweenPrintMethodAndBarcodes + content.substring(colorRotationEnd);

const newContent = restBeforeBarcodes + barcodesBlock + colorRotationBlock + printMethodToEnd;

fs.writeFileSync('src/components/PrinterSpecForm.tsx', newContent, 'utf-8');
console.log("Updated PrinterSpecForm.tsx");
