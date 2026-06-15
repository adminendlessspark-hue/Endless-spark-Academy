import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export default function AdminMarketingSettings() {
  const [courseOverviewParams, setCourseOverviewParams] = useState({
    detailedCourseSyllabi: '',
    courseDurationFees: '',
    studentTestimonials: '',
    instructorProfiles: '',
    hiringPartners: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, 'settings', 'marketing');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().courseOverview) {
          setCourseOverviewParams(docSnap.data().courseOverview);
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, 'settings/marketing');
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'marketing'), {
        courseOverview: courseOverviewParams
      }, { merge: true });
      alert('Marketing Settings Saved Successfully!');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'settings/marketing');
    } finally {
      setIsSaving(false);
    }
  };

  return null;
}
