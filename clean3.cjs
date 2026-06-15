
const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminPanel.tsx', 'utf8');

const target = `                      const newProjectRef = doc(collection(db, 'student_projects'));
                      batch.set(newProjectRef, {
                        ...assigningMasterProject,
                        id: undefined, // Remove master project ID
                        masterProjectId: assigningMasterProject.id,
                        studentId: student.id,
                        studentName: student.name,
                        adobeCloudLink: assignment.adobeCloudLink,
                        projectCode,
                        slaDate: slaDateString,
                        actualTime: 0,
                        status: 'client',
                        qcRejections: [],
                        points: 100,
                        efficiency: 0,
                        createdAt: now.toISOString(),
                        updatedAt: now.toISOString()
                      });`;

const replacement = `                      const newProjectRef = doc(collection(db, 'student_projects'));
                      const newProjectData: any = {
                        ...assigningMasterProject,
                        id: undefined,
                        masterProjectId: assigningMasterProject.id,
                        studentId: student.id,
                        studentName: student.name,
                        adobeCloudLink: assignment.adobeCloudLink,
                        projectCode,
                        slaDate: slaDateString,
                        actualTime: 0,
                        status: 'client',
                        qcRejections: [],
                        points: 100,
                        efficiency: 0,
                        createdAt: now.toISOString(),
                        updatedAt: now.toISOString()
                      };
                      
                      if (newProjectData.clientBrief) {
                        newProjectData.clientBrief = {
                          ...newProjectData.clientBrief,
                          projectNumber,
                          fileName: \`\${projectCode}_\${newProjectData.clientBrief.brandName}_\${newProjectData.clientBrief.packType}_\${newProjectData.clientBrief.variantName}_\${newProjectData.clientBrief.netWeight}\`
                        };
                      }
                      
                      batch.set(newProjectRef, newProjectData);`;

code = code.replace(target, replacement);
fs.writeFileSync('src/pages/AdminPanel.tsx', code);
