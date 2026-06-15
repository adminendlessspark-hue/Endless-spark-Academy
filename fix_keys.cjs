const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

const replacements = [
  { regex: /productionArtPrinting and packaging cross-courses/g, newVal: "productionArtEngineer" },
  { regex: /printReadyPrinting and packaging cross-courses/g, newVal: "printReadyEngineer" },
  { regex: /qualityControlPrinting and packaging cross-courses/g, newVal: "qualityControlEngineer" },
  { regex: /plateReadyPrinting and packaging cross-courses/g, newVal: "plateReadyEngineer" },
  { regex: /colourRetouchingPrinting and packaging cross-courses/g, newVal: "colourRetouchingEngineer" },
  { regex: /packagingPrinting and packaging cross-courses/g, newVal: "packagingEngineer" }
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
        console.log(`Updated Keys in: ${fullPath}`);
      }
    }
  });
}

processDirectory(srcDir);
