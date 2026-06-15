const fs = require('fs');

let content = fs.readFileSync('src/pages/AdminPanel.tsx', 'utf-8');

content = content.replace(
  `const projectCode = \`\${student.username}_\${namePrefix}_\${studentProjectsCount}\`;`,
  `const projectCode = \`\${student.username}_\${namePrefix}_\${studentProjectsCount}\`;
                          
                          const dobNumber = student.dob ? student.dob.replace(/\\D/g, '') : '';
                          const projectNumber = \`\${dobNumber}_\${studentProjectsCount}\`;`
);

content = content.replace(
  `                          if (updateData.clientBrief) {
                              updateData.clientBrief = {
                                ...updateData.clientBrief,
                                fileName: \`\${existingProject.projectCode}_\${updateData.clientBrief.brandName}_\${updateData.clientBrief.packType}_\${updateData.clientBrief.variantName}_\${updateData.clientBrief.netWeight}\`
                              };
                            }`,
  `                          if (updateData.clientBrief) {
                              updateData.clientBrief = {
                                ...updateData.clientBrief,
                                projectNumber: updateData.clientBrief.projectNumber || projectNumber,
                                fileName: \`\${existingProject.projectCode}_\${updateData.clientBrief.brandName}_\${updateData.clientBrief.packType}_\${updateData.clientBrief.variantName}_\${updateData.clientBrief.netWeight}\`
                              };
                            }`
);

fs.writeFileSync('src/pages/AdminPanel.tsx', content, 'utf-8');
console.log('patched');
