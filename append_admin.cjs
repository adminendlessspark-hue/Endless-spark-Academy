const fs = require('fs');

let content = fs.readFileSync('src/pages/AdminPanel.tsx', 'utf-8');

if (!content.includes('import AdminMarketingSettings')) {
  // insert import at the top
  const importStatement = `import AdminMarketingSettings from '../components/AdminMarketingSettings';\n`;
  content = importStatement + content;
}

const targetStr = '<h3 className="text-lg font-bold text-gray-900">Global Settings</h3>';

if (!content.includes('<AdminMarketingSettings />')) {
  const compStr = '<AdminMarketingSettings />\n              ';
  
  // Look for the end of the first max-w-md div inside settings
  // It's probably easier to insert it into that list of settings correctly.
  const regex = /<div className="max-w-md space-y-6">/;
  content = content.replace(regex, `<div className="max-w-md space-y-6">\n              <AdminMarketingSettings />`);
}

fs.writeFileSync('src/pages/AdminPanel.tsx', content, 'utf-8');
console.log("Updated AdminPanel");
