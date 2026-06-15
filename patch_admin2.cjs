const fs = require('fs');

let content = fs.readFileSync('src/pages/AdminPanel.tsx', 'utf-8');

// Replace all projectCode assignments inside assignments logic
content = content.replace(
  /const projectCode = `\${student\.username}_\${namePrefix}_\${studentProjectsCount}`;/g,
  `const projectCode = \`\${student.username}_\${namePrefix}_\${studentProjectsCount}\`;
                          const dobNumber = student.dob ? student.dob.replace(/\\D/g, '') : '';
                          const projectNumber = \`\${dobNumber}_\${studentProjectsCount}\`;`
);

// We also need to add projectNumber to the new project creation
content = content.replace(
  /if \(newProjectData\.clientBrief\) \{\s*newProjectData\.clientBrief = \{\s*\.\.\.newProjectData\.clientBrief,\s*fileName: `\${projectCode}_\${newProjectData\.clientBrief\.brandName}_\${newProjectData\.clientBrief\.packType}_\${newProjectData\.clientBrief\.variantName}_\${newProjectData\.clientBrief\.netWeight}`\s*\};\s*\}/g,
  `if (newProjectData.clientBrief) {
                            newProjectData.clientBrief = {
                              ...newProjectData.clientBrief,
                              projectNumber: projectNumber,
                              fileName: \`\${projectCode}_\${newProjectData.clientBrief.brandName}_\${newProjectData.clientBrief.packType}_\${newProjectData.clientBrief.variantName}_\${newProjectData.clientBrief.netWeight}\`
                            };
                          }`
);

// We need to fix the updateData in batch.update (at line ~7620)
// For update, the dobNumber and projectNumber isn't calculated because it's an update, but we could calculate it.
// Let's check exactly what to replace.

fs.writeFileSync('src/pages/AdminPanel.tsx', content, 'utf-8');
console.log('patched');
