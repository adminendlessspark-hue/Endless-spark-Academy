const fs = require('fs');

let content = fs.readFileSync('src/pages/TelecallerPanel.tsx', 'utf-8');

const targetStrDiv = `*Hello!* 👋\\n\\nWelcome to *Endless Spark School of Printing and Packaging*!\\n\\nWe are excited to share an amazing opportunity to transform your career! 🚀\\n\\nJoin our industry-leading courses and get:\\n✅ Interactive Learning \\n✅ 100% Placement Assistance \\n✅ Expert Mentorship\\n\\nReady to get started or learn more? \\n👉 Fill out this quick inquiry form and we'll get right back to you:\\n{window.location.origin}/inquiry\\n\\nLet’s build your future together! 🌟\\n\\nBest,\\nThe Admissions Team\\n[Your Contact Output]`;

const replacementDiv = `*Hello!* 👋\\n\\nWelcome to *Endless Spark School of Printing and Packaging*!\\n\\nWe are excited to share an amazing opportunity to transform your career! 🚀\\n\\nExplore our industry-leading courses:\\n🎓 Packaging Engineer\\n🎓 Production Art Engineer\\n🎓 Print Ready Engineer\\n🎓 Plate Ready Engineer\\n🎓 Colour Retouching Engineer\\n🎓 Quality Control Engineer\\n🎓 Printing & Packaging Cross Courses\\n\\nJoin us to get:\\n✅ Interactive Learning \\n✅ 100% Placement Assistance \\n✅ Expert Mentorship\\n\\nReady to get started or learn more? \\n👉 Fill out this quick inquiry form and we'll get right back to you:\\n{window.location.origin}/inquiry\\n\\nLet’s build your future together! 🌟\\n\\nBest,\\nThe Admissions Team\\n[Your Contact Output]`;

const targetStrJs = "`*Hello!* 👋\\n\\nWelcome to *Endless Spark School of Printing and Packaging*!\\n\\nWe are excited to share an amazing opportunity to transform your career! 🚀\\n\\nJoin our industry-leading courses and get:\\n✅ Interactive Learning \\n✅ 100% Placement Assistance \\n✅ Expert Mentorship\\n\\nReady to get started or learn more? \\n👉 Fill out this quick inquiry form and we'll get right back to you:\\n${window.location.origin}/inquiry\\n\\nLet’s build your future together! 🌟\\n\\nBest,\\nThe Admissions Team\\n`";

const replacementJs = "`*Hello!* 👋\\n\\nWelcome to *Endless Spark School of Printing and Packaging*!\\n\\nWe are excited to share an amazing opportunity to transform your career! 🚀\\n\\nExplore our industry-leading courses:\\n🎓 Packaging Engineer\\n🎓 Production Art Engineer\\n🎓 Print Ready Engineer\\n🎓 Plate Ready Engineer\\n🎓 Colour Retouching Engineer\\n🎓 Quality Control Engineer\\n🎓 Printing & Packaging Cross Courses\\n\\nJoin us to get:\\n✅ Interactive Learning \\n✅ 100% Placement Assistance \\n✅ Expert Mentorship\\n\\nReady to get started or learn more? \\n👉 Fill out this quick inquiry form and we'll get right back to you:\\n${window.location.origin}/inquiry\\n\\nLet’s build your future together! 🌟\\n\\nBest,\\nThe Admissions Team\\n`";

content = content.replace(targetStrDiv, replacementDiv).replace(targetStrJs, replacementJs);

fs.writeFileSync('src/pages/TelecallerPanel.tsx', content, 'utf-8');
console.log("Updated TelecallerPanel");
