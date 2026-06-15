const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

const replacements = [
  // IDs
  { regex: /'product-art-engineer'/g, newVal: "'production-art-engineer'" },
  { regex: /"product-art-engineer"/g, newVal: '"production-art-engineer"' },
  { regex: /`product-art-engineer`/g, newVal: '`production-art-engineer`' },

  { regex: /'engineer'/g, newVal: "'printing-and-packaging-cross-courses'" },
  { regex: /"engineer"/g, newVal: '"printing-and-packaging-cross-courses"' },
  { regex: /`engineer`/g, newVal: '`printing-and-packaging-cross-courses`' },

  // Keys
  { regex: /productArtEngineer/g, newVal: "productionArtEngineer" },
  
  // The 'engineer' key in User.scores is specific to types.ts and potentially elsewhere. 
  // Lookahead/behind might cause issues, let's just do a targeted replace for it.
  { regex: /engineer\?: Record<string, TopicScore>/g, newVal: "printingAndPackagingCrossCourses?: Record<string, TopicScore>" }
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
      
      // Specifically replace "Product Art Engineer" -> "Production Art Engineer"
      content = content.replace(/Product Art Engineer/g, "Production Art Engineer");

      // Specifically replace "Engineer" -> "Printing and packaging cross-courses"
      // but NOT when preceded by Packaging, Art, Ready, Retouching, Control.
      content = content.replace(/(?<!Packaging |Art |Ready |Retouching |Control |Product |Production )Engineer\b/g, "Printing and packaging cross-courses");
      
      if (content !== original) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated: ${fullPath}`);
      }
    }
  });
}

processDirectory(srcDir);
