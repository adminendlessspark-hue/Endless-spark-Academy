const fs = require('fs');
let code = fs.readFileSync('src/pages/CourseOverview.tsx', 'utf8');

const s1 = `            {(!marketingSettings || !marketingSettings.courseOverview || `;
const s2 = `      )}
      
      {/* Call to Action */}`;

const start = code.indexOf(s1);
const end = code.indexOf(s2);
const toReplace = code.substring(start, end);

code = code.replace(toReplace, `<CourseMarketingContent />\n      `);

fs.writeFileSync('src/pages/CourseOverview.tsx', code);
