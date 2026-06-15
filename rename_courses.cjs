const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

const replacements = [
  // Display Names (Titles)
  { regex: /Production Art \(Basic\)/g, newVal: "Product Art Engineer" },
  { regex: /Production Art/g, newVal: "Product Art Engineer" },
  { regex: /Print Ready \(Intermediate\)/g, newVal: "Print Ready Engineer" },
  { regex: /Print Ready/g, newVal: "Print Ready Engineer" },
  { regex: /Quality Control \(Advanced\)/g, newVal: "Quality Control Engineer" },
  { regex: /Quality Control/g, newVal: "Quality Control Engineer" },

  // IDs
  { regex: /'production-art'/g, newVal: "'product-art-engineer'" },
  { regex: /"production-art"/g, newVal: '"product-art-engineer"' },
  { regex: /`production-art`/g, newVal: '`product-art-engineer`' },
  
  { regex: /'print-ready'/g, newVal: "'print-ready-engineer'" },
  { regex: /"print-ready"/g, newVal: '"print-ready-engineer"' },
  { regex: /`print-ready`/g, newVal: '`print-ready-engineer`' },

  { regex: /'quality-control'/g, newVal: "'quality-control-engineer'" },
  { regex: /"quality-control"/g, newVal: '"quality-control-engineer"' },
  { regex: /`quality-control`/g, newVal: '`quality-control-engineer`' },

  // Keys
  { regex: /productionArt/g, newVal: "productArtEngineer" },
  { regex: /printReady/g, newVal: "printReadyEngineer" },
  { regex: /qualityControl/g, newVal: "qualityControlEngineer" },
];

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let original = content;
      
      replacements.forEach(rep => {
        content = content.replace(rep.regex, rep.newVal);
      });
      
      if (content !== original) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated: ${fullPath}`);
      }
    }
  });
}

processDirectory(srcDir);
