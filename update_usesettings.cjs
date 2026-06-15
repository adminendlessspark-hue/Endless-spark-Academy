const fs = require('fs');

let content = fs.readFileSync('src/hooks/useSettings.ts', 'utf-8');

// Add state
const stateLines = `  const [marketingSettings, setMarketingSettings] = useState<any>(null);\n  const [loading, setLoading] = useState<boolean>(true);`;
content = content.replace(`  const [loading, setLoading] = useState<boolean>(true);`, stateLines);

// Add listener
const listenerBlock = `    const unsubMarketing = onSnapshot(doc(db, 'settings', 'marketing'), (docSnap) => {
      if (docSnap.exists()) {
        setMarketingSettings(docSnap.data());
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, 'settings/marketing'));

    return () => {`;
content = content.replace(`    return () => {`, listenerBlock);

// Unsubscribe
const unsubBlock = `      unsubAdmin();
      unsubFinancial();
      unsubBanners();
      unsubMarketing();
    };`;
content = content.replace(`      unsubAdmin();\n      unsubFinancial();\n      unsubBanners();\n    };`, unsubBlock);

// Return
const returnBlock = `    defaultAffirmationUrl,
    financialSettings, 
    marketingSettings,
    loading 
  };`;
content = content.replace(`    defaultAffirmationUrl,
    financialSettings, 
    loading 
  };`, returnBlock);

fs.writeFileSync('src/hooks/useSettings.ts', content, 'utf-8');
console.log("Updated useSettings.ts");
