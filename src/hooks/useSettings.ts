import { useState, useEffect } from 'react';
import { doc, onSnapshot, collection } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';

export interface Banner {
  id: string;
  imageUrl: string;
  title?: string;
  level?: string;
  levelPercentage?: number;
  overview?: string[];
}

import { useAuth } from '../AuthContext';

export function useSettings() {
  const [logoUrl, setLogoUrl] = useState<string>(() => localStorage.getItem('cached_logoUrl') || '/logo.png');
  const [landingPageTitleImageUrl, setLandingPageTitleImageUrl] = useState<string>(() => localStorage.getItem('cached_titleImageUrl') || '');
  const [branches, setBranches] = useState<string[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [landingPageStats, setLandingPageStats] = useState<{
    modules: string;
    students: string;
    placement: string;
    access: string;
  }>({
    modules: '12+',
    students: '500+',
    placement: '100%',
    access: '24/7'
  });
  const [enableDocumentDownloads, setEnableDocumentDownloads] = useState<boolean>(false);
  const [wellnessEnabled, setWellnessEnabled] = useState<boolean>(false);
  const [wellnessVideoUrl, setWellnessVideoUrl] = useState<string>('');
  const [brandGuidelineUrl, setBrandGuidelineUrl] = useState<string>('');
  const [legalMandateUrl, setLegalMandateUrl] = useState<string>('');
  const [founderVideoUrl, setFounderVideoUrl] = useState<string>('https://www.youtube.com/embed/dQw4w9WgXcQ');
  const [founderVideoUrlTamil, setFounderVideoUrlTamil] = useState<string>('');
  const [overviewVideoUrl, setOverviewVideoUrl] = useState<string>('https://www.youtube.com/embed/dQw4w9WgXcQ');
  const [overviewVideoUrlTamil, setOverviewVideoUrlTamil] = useState<string>('');
  const [founderVideoEnabled, setFounderVideoEnabled] = useState<boolean>(true);
  const [overviewVideoEnabled, setOverviewVideoEnabled] = useState<boolean>(true);
  const [financialSettings, setFinancialSettings] = useState<any>(null);
  const [marketingSettings, setMarketingSettings] = useState<any>(null);
  const [placementSettings, setPlacementSettings] = useState<any>(null);
  const [whatsappSettings, setWhatsappSettings] = useState<any>(null);
  const [jitsiServer, setJitsiServer] = useState<string>(() => localStorage.getItem('cached_jitsiServer') || 'jitsi.belnet.be');
  const [adobeCloudUrl, setAdobeCloudUrl] = useState<string>('https://creativecloud.adobe.com/apps/all/desktop');
  const [pantoneBooksUrl, setPantoneBooksUrl] = useState<string>('https://www.pantone.com/connect');
  const [teamViewerUrl, setTeamViewerUrl] = useState<string>('https://www.teamviewer.com/download');
  const [adobeScriptToolkitUrl, setAdobeScriptToolkitUrl] = useState<string>('https://github.com/Adobe-CEP/CEP-Resources');
  const [printMethods, setPrintMethods] = useState<string[]>(['Offset', 'Flexo', 'Gravure', 'Dry offset', 'Digital']);
  const [printingSubstrates, setPrintingSubstrates] = useState<string[]>(['Carton board', 'Foil', 'White Poly', 'Paper', 'Metal', 'Poly clear']);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let adminLoaded = false;
    let bannersLoaded = false;

    const checkLoaded = () => {
      if (adminLoaded && bannersLoaded) {
        setLoading(false);
      }
    };

    const unsubAdmin = onSnapshot(doc(db, 'settings', 'admin'), (docSnap) => {
      adminLoaded = true;
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.logoUrl) {
          setLogoUrl(data.logoUrl);
          localStorage.setItem('cached_logoUrl', data.logoUrl);
        } else {
          setLogoUrl('/logo.png');
          localStorage.setItem('cached_logoUrl', '/logo.png');
        }
        if (data.landingPageTitleImageUrl) {
          setLandingPageTitleImageUrl(data.landingPageTitleImageUrl);
          localStorage.setItem('cached_titleImageUrl', data.landingPageTitleImageUrl);
        } else {
          setLandingPageTitleImageUrl('');
          localStorage.removeItem('cached_titleImageUrl');
        }
        if (data.branches) {
          setBranches(data.branches);
        } else {
          setBranches([]);
        }
        if (data.landingPageStats) {
          setLandingPageStats(data.landingPageStats);
        }
        if (data.enableDocumentDownloads !== undefined) {
          setEnableDocumentDownloads(data.enableDocumentDownloads);
        }
        if (data.wellnessEnabled !== undefined) {
          setWellnessEnabled(data.wellnessEnabled);
        }
        if (data.wellnessVideoUrl) {
          setWellnessVideoUrl(data.wellnessVideoUrl);
        } else {
          // Default to the provided video
          setWellnessVideoUrl('https://www.youtube.com/embed/-GHd77C4brk?si=lnvBe-_P2fXxAeaW');
        }
        if (data.brandGuidelineUrl) {
          setBrandGuidelineUrl(data.brandGuidelineUrl);
        } else {
          setBrandGuidelineUrl('');
        }
        if (data.legalMandateUrl) {
          setLegalMandateUrl(data.legalMandateUrl);
        } else {
          setLegalMandateUrl('');
        }
        if (data.founderVideoUrl) {
          setFounderVideoUrl(data.founderVideoUrl);
        } else {
          setFounderVideoUrl('https://www.youtube.com/embed/dQw4w9WgXcQ');
        }
        if (data.founderVideoUrlTamil) {
          setFounderVideoUrlTamil(data.founderVideoUrlTamil);
        } else {
          setFounderVideoUrlTamil('');
        }
        if (data.overviewVideoUrl) {
          setOverviewVideoUrl(data.overviewVideoUrl);
        } else {
          setOverviewVideoUrl('https://www.youtube.com/embed/dQw4w9WgXcQ');
        }
        if (data.overviewVideoUrlTamil) {
          setOverviewVideoUrlTamil(data.overviewVideoUrlTamil);
        } else {
          setOverviewVideoUrlTamil('');
        }
        if (data.founderVideoEnabled !== undefined) {
          setFounderVideoEnabled(data.founderVideoEnabled);
        } else {
          setFounderVideoEnabled(true);
        }
        if (data.overviewVideoEnabled !== undefined) {
          setOverviewVideoEnabled(data.overviewVideoEnabled);
        } else {
          setOverviewVideoEnabled(true);
        }
        if (data.banners) {
          setBanners(prev => {
            const existingIds = new Set(prev.map(b => b.id));
            const newBanners = data.banners.filter((b: Banner) => !existingIds.has(b.id));
            return [...prev, ...newBanners];
          });
        }
        if (data.jitsiServer) {
          setJitsiServer(data.jitsiServer);
          localStorage.setItem('cached_jitsiServer', data.jitsiServer);
        } else {
          setJitsiServer('jitsi.belnet.be');
          localStorage.removeItem('cached_jitsiServer');
        }
        if (data.adobeCloudUrl) setAdobeCloudUrl(data.adobeCloudUrl);
        if (data.pantoneBooksUrl) setPantoneBooksUrl(data.pantoneBooksUrl);
        if (data.teamViewerUrl) setTeamViewerUrl(data.teamViewerUrl);
        if (data.adobeScriptToolkitUrl) setAdobeScriptToolkitUrl(data.adobeScriptToolkitUrl);
        if (data.printMethods && Array.isArray(data.printMethods)) {
          setPrintMethods(data.printMethods);
        } else {
          setPrintMethods(['Offset', 'Flexo', 'Gravure', 'Dry offset', 'Digital']);
        }
        if (data.printingSubstrates && Array.isArray(data.printingSubstrates)) {
          setPrintingSubstrates(data.printingSubstrates);
        } else {
          setPrintingSubstrates(['Carton board', 'Foil', 'White Poly', 'Paper', 'Metal', 'Poly clear']);
        }
      }
      checkLoaded();
    }, (err) => {
      adminLoaded = true;
      checkLoaded();
      handleFirestoreError(err, OperationType.GET, 'settings/admin');
    });

    const unsubFinancial = onSnapshot(doc(db, 'settings', 'financial'), (docSnap) => {
      const defaultCoursesConfig = [
        { courseId: 'packaging-engineer', title: 'Diploma in Packaging Engineer', fees: 35000, durationMonths: 3 },
        { courseId: 'production-art-engineer', title: 'Diploma in Production Art Engineer', fees: 35000, durationMonths: 3 },
        { courseId: 'print-ready-engineer', title: 'Diploma in Print Ready Engineer', fees: 35000, durationMonths: 3 },
        { courseId: 'plate-ready-engineer', title: 'Diploma in Plate Ready Engineer', fees: 35000, durationMonths: 3 },
        { courseId: 'colour-retouching-engineer', title: 'Diploma in Colour Retouching Engineer', fees: 35000, durationMonths: 3 },
        { courseId: 'quality-control-engineer', title: 'Diploma in Quality Control Engineer', fees: 35000, durationMonths: 3 },
        { courseId: 'printing-and-packaging-cross-courses', title: 'Diploma in Printing and Packaging Cross Courses', fees: 35000, durationMonths: 3 }
      ];

      if (docSnap.exists()) {
        const data = docSnap.data();
        let currentCoursesConfig = data.coursesConfig;
        
        // Use defaults only if coursesConfig is entirely missing or empty
        if (!currentCoursesConfig || !Array.isArray(currentCoursesConfig) || currentCoursesConfig.length === 0) {
          currentCoursesConfig = defaultCoursesConfig;
        }

        setFinancialSettings({ 
          ...data, 
          coursesConfig: currentCoursesConfig
        });
      } else {
        setFinancialSettings({
          coursesConfig: defaultCoursesConfig,
          interestRatePercentage: 7,
          penaltyPercentage: 0,
          internalReferralPercentage: 2,
          externalReferralPercentage: 5,
          emiRules: [
            { durationMonths: 3, emiCount: 2 },
            { durationMonths: 6, emiCount: 6 }
          ],
          razorpayDetails: {
            enabled: true,
            keyId: '',
            keySecret: ''
          }
        });
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, 'settings/financial'));

    const unsubPlacement = onSnapshot(doc(db, 'settings', 'placements'), (docSnap) => {
      if (docSnap.exists()) {
        setPlacementSettings(docSnap.data());
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, 'settings/placements'));

    const unsubWhatsapp = onSnapshot(doc(db, 'settings', 'whatsapp'), (docSnap) => {
      if (docSnap.exists()) {
        setWhatsappSettings(docSnap.data());
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, 'settings/whatsapp'));

    const unsubBanners = onSnapshot(collection(db, 'banners'), (snapshot) => {
      bannersLoaded = true;
      const fetchedBanners = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Banner));
      setBanners(prev => {
        const adminBanners = prev.filter(b => !fetchedBanners.some(fb => fb.id === b.id));
        return [...adminBanners, ...fetchedBanners];
      });
      checkLoaded();
    }, (err) => {
      bannersLoaded = true;
      checkLoaded();
      handleFirestoreError(err, OperationType.LIST, 'banners');
    });

    const unsubMarketing = onSnapshot(doc(db, 'settings', 'marketing'), (docSnap) => {
      if (docSnap.exists()) {
        setMarketingSettings(docSnap.data());
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, 'settings/marketing'));

    return () => {
      unsubAdmin();
      unsubFinancial();
      unsubPlacement();
      unsubWhatsapp();
      unsubBanners();
      unsubMarketing();
    };
  }, []);

  return { 
    logoUrl, 
    landingPageTitleImageUrl, 
    branches, 
    banners, 
    landingPageStats,
    enableDocumentDownloads, 
    wellnessEnabled,
    wellnessVideoUrl,
    brandGuidelineUrl,
    legalMandateUrl,
    founderVideoUrl,
    founderVideoUrlTamil,
    overviewVideoUrl,
    overviewVideoUrlTamil,
    founderVideoEnabled,
    overviewVideoEnabled,
    financialSettings, 
    marketingSettings,
    placementSettings,
    whatsappSettings,
    jitsiServer,
    adobeCloudUrl,
    pantoneBooksUrl,
    teamViewerUrl,
    adobeScriptToolkitUrl,
    printMethods,
    printingSubstrates,
    loading 
  };
}
