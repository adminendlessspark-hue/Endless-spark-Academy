import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, onSnapshot, doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { Invoice, User, FinancialSettings } from '../types';
import { IndianRupee, Settings, FileText, Users, CheckCircle, XCircle, Edit2, Plus, Trash2, Download, BarChart, Landmark, Smartphone, ShieldCheck, ChevronDown, ChevronUp, CreditCard } from 'lucide-react';
import { cn, formatCourseName } from '../utils';

export default function AccountsPanel() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'invoices' | 'referrals' | 'settings' | 'reports'>('invoices');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [settings, setSettings] = useState<FinancialSettings | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [collapsedWaivers, setCollapsedWaivers] = useState<Record<string, boolean>>({});
  const [collapsedEmis, setCollapsedEmis] = useState<Record<string, boolean>>({});

  const isWithinDateRange = (dateStr: string) => {
    if (!startDate && !endDate) return true;
    const date = new Date(dateStr);
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    
    if (start) start.setHours(0, 0, 0, 0);
    if (end) end.setHours(23, 59, 59, 999);
    
    if (start && date < start) return false;
    if (end && date > end) return false;
    return true;
  };

  useEffect(() => {
    const unsubInvoices = onSnapshot(collection(db, 'invoices'), (snapshot) => {
      setInvoices(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Invoice)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'invoices'));

    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      setStudents(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as User)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'users'));

    const unsubSettings = onSnapshot(doc(db, 'settings', 'financial'), (docSnap) => {
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

        setSettings({ 
          ...data, 
          id: docSnap.id,
          coursesConfig: currentCoursesConfig
        } as FinancialSettings);
      } else {
        // Default settings
        setSettings({
          id: 'financial',
          coursesConfig: defaultCoursesConfig as any,
          emiRules: [
            { durationMonths: 3, emiCount: 2 },
            { durationMonths: 6, emiCount: 6 }
          ],
          interestRatePercentage: 7,
          penaltyPercentage: 0,
          internalReferralPercentage: 2,
          externalReferralPercentage: 5,
          razorpayDetails: {
            enabled: true,
            keyId: '',
            keySecret: ''
          },
          updatedAt: new Date().toISOString(),
          updatedBy: 'system'
        });
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, 'settings/financial'));

    return () => {
      unsubInvoices();
      unsubUsers();
      unsubSettings();
    };
  }, []);

  const [waiverModal, setWaiverModal] = useState<{ 
    invoiceId: string, 
    emiNumber: number | '', 
    type: 'fee' | 'interest' | 'penalty' | '', 
    percentage: number | '', 
    amount: number, 
    reason: string, 
    editIndex?: number 
  } | null>(null);
  const [emiModal, setEmiModal] = useState<{
    invoiceId: string;
    emiNumber: number;
    dueDate: string;
    baseAmount: number;
    interestAmount: number;
    penaltyAmount: number;
    status: 'paid' | 'pending';
  } | null>(null);
  const [restructureModal, setRestructureModal] = useState<{
    invoiceId: string;
    currentCount: number;
    finalAmount: number;
    createdAt: string;
    preservePaid: boolean;
  } | null>(null);
  const [newEmiCount, setNewEmiCount] = useState<number>(1);
  const [restructureInterestRate, setRestructureInterestRate] = useState<number>(7);
  const [payoutModal, setPayoutModal] = useState<{ invoiceId: string, amount: number } | null>(null);
  const [deleteConfirmIndex, setDeleteConfirmIndex] = useState<number | null>(null);
  const [invoiceModal, setInvoiceModal] = useState<{
    studentId: string;
    courseId: string;
    emiCount: number;
    interestRate: number;
    concessionType: 'none' | 'single-parent' | 'transgender';
    customFeeDiscount: number;
  } | null>(null);

  const is6MonthCourseStudent = (student: User | undefined) => {
    if (!student) return false;
    const courses: string[] = [];
    if (student.assignedCourse) courses.push(student.assignedCourse);
    if (student.assignedCourses && Array.isArray(student.assignedCourses)) {
      student.assignedCourses.forEach((c: any) => {
        if (typeof c === 'string') courses.push(c);
        else if (c && c.id) courses.push(c.id);
      });
    }
    if (student.requestedCourse) courses.push(student.requestedCourse);
    if (student.requestedCourses && Array.isArray(student.requestedCourses)) {
      student.requestedCourses.forEach((c: any) => {
        if (typeof c === 'string') courses.push(c);
        else if (c && c.id) courses.push(c.id);
      });
    }

    const coursesConfig = settings?.coursesConfig || [];
    return courses.some(courseId => {
      const matched = coursesConfig.find((c: any) => c.courseId === courseId);
      if (matched) {
        return matched.durationMonths === 6;
      }
      // Check fallback for known 6-month courses if not customized:
      const known6MonthCourses = [
        'packaging-engineer',
        'production-art-engineer',
        'print-ready-engineer',
        'plate-ready-engineer',
        'colour-retouching-engineer',
        'quality-control-engineer'
      ];
      return known6MonthCourses.includes(courseId);
    });
  };

  const handleApplyInvoice = async () => {
    if (checkPreview()) return;
    if (!invoiceModal || !invoiceModal.studentId || !invoiceModal.courseId) {
      alert('Please select both a student and a course.');
      return;
    }

    const selectedCourse = settings?.coursesConfig.find(c => c.courseId === invoiceModal.courseId);
    if (!selectedCourse) {
      alert('Selected course config not found.');
      return;
    }

    // Double check if invoice already exists
    const duplicate = invoices.find(inv => inv.studentId === invoiceModal.studentId);
    if (duplicate) {
      alert('An invoice already exists for this student.');
      return;
    }

    try {
      const totalFee = selectedCourse.fees;
      let concessionPercent = 0;
      if (invoiceModal.concessionType === 'single-parent') concessionPercent = 20;
      else if (invoiceModal.concessionType === 'transgender') concessionPercent = 30;

      const concessionDiscount = totalFee * (concessionPercent / 100);
      const discount = concessionDiscount + (invoiceModal.customFeeDiscount || 0);
      const finalAmount = Math.max(0, totalFee - discount);

      const emisCount = invoiceModal.emiCount || 1;
      const baseEmiAmount = Math.round(finalAmount / emisCount);
      const emis: any[] = [];
      
      const now = new Date();
      for (let i = 1; i <= emisCount; i++) {
        const dueDate = new Date();
        dueDate.setDate(now.getDate() + (i - 1) * 30);
        emis.push({
          emiNumber: i,
          baseAmount: i === emisCount ? (finalAmount - baseEmiAmount * (emisCount - 1)) : baseEmiAmount,
          interestAmount: 0,
          penaltyAmount: 0,
          dueDate: dueDate.toISOString(),
          status: 'pending'
        });
      }

      const invoiceData = {
        studentId: invoiceModal.studentId,
        totalFee,
        concessionApplied: invoiceModal.concessionType,
        finalAmount,
        emis,
        waivers: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        rulesSnapshot: {
          interestRatePercentage: invoiceModal.interestRate || settings?.interestRatePercentage || 7,
          penaltyPercentage: settings?.penaltyPercentage || 0,
          internalReferralPercentage: settings?.internalReferralPercentage || 2,
          externalReferralPercentage: settings?.externalReferralPercentage || 5
        }
      };

      const invoicesColl = collection(db, 'invoices');
      await setDoc(doc(invoicesColl, `INV-${invoiceModal.studentId.substring(0, 5).toUpperCase()}-${Math.random().toString(36).substring(2,6).toUpperCase()}`), invoiceData);
      
      alert('Invoice created & applied successfully!');
      setInvoiceModal(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'invoices');
    }
  };

  const handleRecordPayout = async () => {
    if (!payoutModal || payoutModal.amount <= 0) {
      alert('Please enter a valid amount.');
      return;
    }

    const invoice = invoices.find(i => i.id === payoutModal.invoiceId);
    if (!invoice || !invoice.referral) return;

    try {
      await updateDoc(doc(db, 'invoices', payoutModal.invoiceId), {
        'referral.bonusPaidSoFar': (invoice.referral.bonusPaidSoFar || 0) + payoutModal.amount,
        updatedAt: new Date().toISOString()
      });
      setPayoutModal(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `invoices/${payoutModal.invoiceId}`);
    }
  };

  const isPreviewMode = false;
  const checkPreview = () => {
    if (isPreviewMode) {
      alert('This action is disabled in Preview Mode.');
      return true;
    }
    return false;
  };

  const handleSaveWaiver = async () => {
    if (checkPreview()) return;
    if (!waiverModal || !waiverModal.emiNumber || !waiverModal.type || waiverModal.amount <= 0 || !waiverModal.reason.trim()) {
      alert('Please fill all fields and ensure amount is greater than 0.');
      return;
    }

    const invoice = invoices.find(i => i.id === waiverModal.invoiceId);
    if (!invoice) return;

    let updatedWaivers = [...(invoice.waivers || [])];
    
    if (waiverModal.editIndex !== undefined) {
      updatedWaivers[waiverModal.editIndex] = {
        ...updatedWaivers[waiverModal.editIndex],
        emiNumber: waiverModal.emiNumber,
        type: waiverModal.type,
        percentage: waiverModal.percentage,
        amount: waiverModal.amount,
        reason: waiverModal.reason,
        date: new Date().toISOString()
      };
    } else {
      updatedWaivers.push({
        emiNumber: waiverModal.emiNumber,
        type: waiverModal.type,
        percentage: waiverModal.percentage,
        amount: waiverModal.amount,
        reason: waiverModal.reason,
        approvedBy: user?.id || 'accounts',
        date: new Date().toISOString()
      });
    }

    try {
      await updateDoc(doc(db, 'invoices', waiverModal.invoiceId), {
        waivers: updatedWaivers,
        updatedAt: new Date().toISOString()
      });
      setWaiverModal(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `invoices/${waiverModal.invoiceId}`);
    }
  };

  const handleDeleteWaiver = async (invoiceId: string, waiverIndex: number) => {
    const invoice = invoices.find(i => i.id === invoiceId);
    if (!invoice) return;

    const updatedWaivers = [...(invoice.waivers || [])];
    updatedWaivers.splice(waiverIndex, 1);

    try {
      await updateDoc(doc(db, 'invoices', invoiceId), {
        waivers: updatedWaivers,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `invoices/${invoiceId}`);
    }
  };

  const handleMarkEmiPaid = async (invoiceId: string, emiNumber: number) => {
    const invoice = invoices.find(i => i.id === invoiceId);
    if (!invoice) return;

    const updatedEmis = invoice.emis.map((emi: any) => {
      if (emi.emiNumber === emiNumber) {
        return {
          ...emi,
          status: 'paid',
          paidDate: new Date().toISOString()
        };
      }
      return emi;
    });

    try {
      await updateDoc(doc(db, 'invoices', invoiceId), {
        emis: updatedEmis,
        updatedAt: new Date().toISOString()
      });

      // If there's a referral, update bonusEarnedSoFar
      if (invoice.referral) {
        const paidEmi = updatedEmis.find((e: any) => e.emiNumber === emiNumber);
        const amountPaid = paidEmi.baseAmount + paidEmi.interestAmount + paidEmi.penaltyAmount;
        const bonusEarned = amountPaid * (invoice.referral.bonusPercentage / 100);
        
        await updateDoc(doc(db, 'invoices', invoiceId), {
          'referral.bonusEarnedSoFar': (invoice.referral.bonusEarnedSoFar || 0) + bonusEarned
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `invoices/${invoiceId}`);
    }
  };

  const handleSaveEmi = async () => {
    if (checkPreview()) return;
    if (!emiModal) return;

    const invoice = invoices.find(i => i.id === emiModal.invoiceId);
    if (!invoice) {
      alert('Invoice not found.');
      return;
    }

    const updatedEmis = invoice.emis.map((emi: any) => {
      if (emi.emiNumber === emiModal.emiNumber) {
        let dateObj = new Date(emiModal.dueDate);
        if (isNaN(dateObj.getTime())) {
          dateObj = new Date();
        }
        return {
          ...emi,
          dueDate: dateObj.toISOString(),
          baseAmount: emiModal.baseAmount,
          interestAmount: emiModal.interestAmount,
          penaltyAmount: emiModal.penaltyAmount,
          status: emiModal.status,
          paidDate: emiModal.status === 'paid' ? (emi.paidDate || new Date().toISOString()) : null
        };
      }
      return emi;
    });

    const newFinalAmount = updatedEmis.reduce((sum: number, e: any) => sum + e.baseAmount, 0);

    try {
      await updateDoc(doc(db, 'invoices', emiModal.invoiceId), {
        emis: updatedEmis,
        finalAmount: newFinalAmount,
        updatedAt: new Date().toISOString()
      });
      setEmiModal(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `invoices/${emiModal.invoiceId}`);
    }
  };

  const handleRestructureEmis = async () => {
    if (checkPreview()) return;
    if (!restructureModal) return;

    if (newEmiCount < 1 || newEmiCount > 24) {
      alert('Please enter an EMI count between 1 and 24.');
      return;
    }

    const invoice = invoices.find(i => i.id === restructureModal.invoiceId);
    if (!invoice) {
      alert('Invoice not found.');
      return;
    }

    const student = students.find(s => s.id === invoice.studentId);
    const is6Month = is6MonthCourseStudent(student);
    const isInterestEligible = is6Month && newEmiCount > 2;

    let updatedEmis: any[] = [];

    if (restructureModal.preservePaid) {
      const paidEmis = (invoice.emis || []).filter((e: any) => e.status === 'paid');
      const paidCount = paidEmis.length;

      if (newEmiCount <= paidCount) {
        alert(`The invoice has ${paidCount} paid EMIs. You cannot set the total EMI count to be less than or equal to ${paidCount} while preserving paid EMIs.`);
        return;
      }

      // Preserve paid EMIs but make sure they keep their exact fields
      updatedEmis = [...paidEmis].map((e, idx) => ({
        ...e,
        emiNumber: idx + 1
      }));

      const totalPaidBase = paidEmis.reduce((sum: number, e: any) => sum + (e.baseAmount || 0), 0);
      const remainingAmount = Math.max(0, invoice.finalAmount - totalPaidBase);
      const remainingCount = newEmiCount - paidCount;

      const remainingBaseEmiAmount = Math.round(remainingAmount / remainingCount);
      
      const totalInterestForRemaining = isInterestEligible ? Math.round(remainingAmount * (restructureInterestRate / 100)) : 0;
      const interestPerRemainingEmi = isInterestEligible ? Math.round(totalInterestForRemaining / remainingCount) : 0;

      const now = new Date();

      for (let i = 1; i <= remainingCount; i++) {
        const dueDate = new Date();
        dueDate.setDate(now.getDate() + (i - 1) * 30);
        
        const isLast = (i === remainingCount);
        const emiInterest = isLast 
          ? (totalInterestForRemaining - interestPerRemainingEmi * (remainingCount - 1))
          : interestPerRemainingEmi;

        updatedEmis.push({
          emiNumber: paidCount + i,
          baseAmount: isLast ? (remainingAmount - remainingBaseEmiAmount * (remainingCount - 1)) : remainingBaseEmiAmount,
          interestAmount: emiInterest,
          penaltyAmount: 0,
          dueDate: dueDate.toISOString(),
          status: 'pending'
        });
      }
    } else {
      // Complete redistribution
      const baseEmiAmount = Math.round(invoice.finalAmount / newEmiCount);
      const totalInterest = isInterestEligible ? Math.round(invoice.finalAmount * (restructureInterestRate / 100)) : 0;
      const interestPerEmi = isInterestEligible ? Math.round(totalInterest / newEmiCount) : 0;

      const startDay = new Date(invoice.createdAt || new Date().toISOString());

      for (let i = 1; i <= newEmiCount; i++) {
        const dueDate = new Date(startDay);
        dueDate.setDate(startDay.getDate() + (i - 1) * 30);

        const isLast = (i === newEmiCount);
        const emiInterest = isLast
          ? (totalInterest - interestPerEmi * (newEmiCount - 1))
          : interestPerEmi;

        updatedEmis.push({
          emiNumber: i,
          baseAmount: isLast ? (invoice.finalAmount - baseEmiAmount * (newEmiCount - 1)) : baseEmiAmount,
          interestAmount: emiInterest,
          penaltyAmount: 0,
          dueDate: dueDate.toISOString(),
          status: 'pending'
        });
      }
    }

    try {
      const updateData: any = {
        emis: updatedEmis,
        updatedAt: new Date().toISOString()
      };
      if (isInterestEligible) {
        updateData['rulesSnapshot.interestRatePercentage'] = restructureInterestRate;
      }
      await updateDoc(doc(db, 'invoices', restructureModal.invoiceId), updateData);
      alert('EMI schedule restructured successfully with 6-month dynamic interest!');
      setRestructureModal(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `invoices/${restructureModal.invoiceId}`);
    }
  };

  const handleRunPenaltyChecks = async () => {
    const now = new Date();
    const currentDay = now.getDate();
    
    if (currentDay <= 7) {
      alert('Penalties are only applied after the 7th of the month.');
      return;
    }

    let updatedCount = 0;

    for (const invoice of invoices) {
      let hasUpdates = false;
      const rules = invoice.rulesSnapshot || {
        interestRatePercentage: 7,
        penaltyPercentage: 0
      };

      // Calculate total outstanding amount for interest calculation
      const outstandingAmount = invoice.emis
        .filter((e: any) => e.status !== 'paid')
        .reduce((sum: number, e: any) => sum + e.baseAmount, 0);

      const updatedEmis = invoice.emis.map((emi: any) => {
        if (emi.status === 'paid') return emi;

        const dueDate = new Date(emi.dueDate);
        if (now > dueDate && now.getMonth() >= dueDate.getMonth()) {
          let newPenalty = emi.penaltyAmount;

          if (currentDay > 7 && newPenalty === 0) {
            newPenalty = rules.penaltyPercentage > 0 
              ? emi.baseAmount * (rules.penaltyPercentage / 100)
              : 500;
            hasUpdates = true;
          }

          return {
            ...emi,
            penaltyAmount: newPenalty,
            status: 'overdue'
          };
        }
        return emi;
      });

      if (hasUpdates) {
        try {
          await updateDoc(doc(db, 'invoices', invoice.id), {
            emis: updatedEmis,
            updatedAt: new Date().toISOString()
          });
          updatedCount++;
        } catch (err) {
          console.error("Error updating invoice penalties:", err);
        }
      }
    }

    alert(`Penalty checks completed. Updated ${updatedCount} invoices.`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 hidden md:block">
        <h1 className="text-3xl font-bold text-gray-900">Accounts Panel</h1>
        <p className="text-gray-500 mt-2">Manage invoices, waivers, EMIs, and financial settings.</p>
      </div>
      
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex overflow-x-auto border-b border-gray-200 bg-gray-50/50">
          <button
            onClick={() => setActiveTab('invoices')}
            className={cn("btn-tab", activeTab === 'invoices' ? "btn-tab-active bg-white" : "btn-tab-inactive")}
          >
            <FileText className="w-4 h-4" />
            Invoices & Waivers
          </button>
          <button
            onClick={() => setActiveTab('referrals')}
            className={cn("btn-tab", activeTab === 'referrals' ? "btn-tab-active bg-white" : "btn-tab-inactive")}
          >
            <Users className="w-4 h-4" />
            Referrals
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={cn("btn-tab", activeTab === 'settings' ? "btn-tab-active bg-white" : "btn-tab-inactive")}
          >
            <Settings className="w-4 h-4" />
            Financial Settings
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={cn("btn-tab", activeTab === 'reports' ? "btn-tab-active bg-white" : "btn-tab-inactive")}
          >
            <BarChart className="w-4 h-4" />
            Reports
          </button>
        </div>
        
        <div className="p-6">
          {activeTab === 'invoices' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 mb-6 bg-gray-50 p-4 rounded-xl border border-gray-200">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mr-1">Views:</span>
                  <button
                    onClick={() => {
                      const expandedState: Record<string, boolean> = {};
                      invoices.forEach(inv => {
                        expandedState[inv.id] = false;
                      });
                      setCollapsedWaivers(expandedState);
                      setCollapsedEmis(expandedState);
                    }}
                    className="bg-white hover:bg-gray-50 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-bold border border-gray-200 shadow-sm transition-all"
                  >
                    Expand All
                  </button>
                  <button
                    onClick={() => {
                      const collapsedState: Record<string, boolean> = {};
                      invoices.forEach(inv => {
                        collapsedState[inv.id] = true;
                      });
                      setCollapsedWaivers(collapsedState);
                      setCollapsedEmis(collapsedState);
                    }}
                    className="bg-white hover:bg-gray-50 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-bold border border-gray-200 shadow-sm transition-all"
                  >
                    Collapse/Shrink All
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setInvoiceModal({
                      studentId: '',
                      courseId: '',
                      emiCount: 3,
                      interestRate: settings?.interestRatePercentage || 7,
                      concessionType: 'none',
                      customFeeDiscount: 0
                    })}
                    className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all hover:scale-[1.01]"
                  >
                    <Plus className="w-3.5 h-3.5" /> Apply Invoice
                  </button>
                  <button
                    onClick={handleRunPenaltyChecks}
                    className="bg-orange-100 text-orange-700 px-3 py-2 rounded-xl text-xs font-bold hover:bg-orange-200 transition-colors"
                  >
                    Run Penalty Checks
                  </button>
                </div>
              </div>
              {invoices.length === 0 ? (
                <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                  <IndianRupee className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No invoices found.</p>
                </div>
              ) : (
                <div className="grid gap-6">
                  {invoices.map((invoice) => {
                    const student = students.find(s => s.id === invoice.studentId);
                    
                    // Calculate total waiver amount
                    const totalInterest = invoice.emis.reduce((sum: number, emi: any) => sum + (emi.interestAmount || 0), 0);
                    const totalPenalty = invoice.emis.reduce((sum: number, emi: any) => sum + (emi.penaltyAmount || 0), 0);
                    const totalWaiver = (invoice.waivers || []).reduce((sum: number, w: any) => sum + w.amount, 0);
                    const finalPayable = invoice.finalAmount + totalInterest + totalPenalty - totalWaiver;

                    return (
                      <div key={invoice.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="font-bold text-gray-900">{student?.name || 'Unknown Student'}</h4>
                            <p className="text-xs text-gray-400 mt-1">Invoice ID: {invoice.id}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-gray-900">₹{finalPayable.toLocaleString()}</p>
                            <p className="text-sm text-gray-500">Final Payable</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                          <div className="p-3 bg-gray-50 rounded-xl">
                            <p className="text-xs text-gray-500 mb-1">Base Fee</p>
                            <p className="font-bold text-gray-900">₹{invoice.totalFee.toLocaleString()}</p>
                          </div>
                          <div className="p-3 bg-gray-50 rounded-xl">
                            <p className="text-xs text-gray-500 mb-1">Concession</p>
                            <p className="font-bold text-gray-900 capitalize">{invoice.concessionApplied.replace('-', ' ')}</p>
                          </div>
                          <div className="p-3 bg-gray-50 rounded-xl">
                            <p className="text-xs text-gray-500 mb-1">Total Waivers</p>
                            <p className="font-bold text-green-600">-₹{totalWaiver.toLocaleString()}</p>
                          </div>
                          <div className="p-3 bg-gray-50 rounded-xl">
                            <p className="text-xs text-gray-500 mb-1">Status</p>
                            <span className={cn(
                              "px-2 py-1 rounded-full text-xs font-bold",
                              invoice.emis.every((e: any) => e.status === 'paid') ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                            )}>
                              {invoice.emis.every((e: any) => e.status === 'paid') ? 'Paid' : 'Pending'}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-4">
                          {/* Waivers Collapsible Header */}
                          {(() => {
                            const isWaiversCollapsed = collapsedWaivers[invoice.id] !== false;
                            const isEmisCollapsed = collapsedEmis[invoice.id] !== false;

                            return (
                              <>
                                <div>
                                  <div 
                                    onClick={() => setCollapsedWaivers(prev => ({ ...prev, [invoice.id]: !isWaiversCollapsed }))}
                                    className={cn(
                                      "flex justify-between items-center cursor-pointer select-none py-2.5 px-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all border border-gray-100 shadow-sm",
                                      !isWaiversCollapsed && "bg-pink-50/20 border-pink-100"
                                    )}
                                  >
                                    <div className="flex items-center gap-2">
                                      {isWaiversCollapsed ? (
                                        <ChevronDown className="w-4 h-4 text-pink-600 transition-transform" />
                                      ) : (
                                        <ChevronUp className="w-4 h-4 text-pink-600 transition-transform" />
                                      )}
                                      <h5 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                                        <span>Waivers & Concessions</span>
                                        <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full font-medium">
                                          {(invoice.waivers || []).length} Applied
                                        </span>
                                      </h5>
                                    </div>
                                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                      <button
                                        onClick={() => setWaiverModal({ invoiceId: invoice.id, emiNumber: '', type: '', percentage: '', amount: 0, reason: '' })}
                                        className="text-[11px] font-bold text-pink-600 hover:text-pink-700 flex items-center gap-1 bg-white px-2.5 py-1.5 rounded-lg border border-pink-100 shadow-sm transition-all hover:scale-[1.02]"
                                      >
                                        <Plus className="w-3" /> Add Waiver
                                      </button>
                                    </div>
                                  </div>
                                  
                                  {!isWaiversCollapsed && (
                                    <div className="mt-3 bg-gray-50/30 p-4 rounded-xl border border-gray-100 space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
                                      {invoice.waivers && invoice.waivers.length > 0 ? (
                                        <div className="space-y-2">
                                          {invoice.waivers.map((waiver: any, index: number) => (
                                            <div key={index} className="flex justify-between items-center p-3 bg-green-50 rounded-xl border border-green-100 shadow-sm">
                                              <div className="min-w-0 flex-1 pr-2">
                                                <p className="text-sm font-bold text-green-800 break-words">
                                                  {waiver.percentage ? `${waiver.percentage}% ` : ''}{waiver.type === 'fee' ? 'Base Fee' : waiver.type === 'interest' ? 'Interest' : 'Penalty'} Waiver (EMI {waiver.emiNumber})
                                                </p>
                                                <p className="text-xs text-green-600 mt-1 break-words"><span className="font-semibold">Reason:</span> {waiver.reason}</p>
                                                <p className="text-xs text-green-600 mt-0.5"><span className="font-semibold">Approved by:</span> {waiver.approvedBy}</p>
                                              </div>
                                              <div className="flex items-center gap-3 shrink-0">
                                                <p className="text-sm font-bold text-green-700">₹{waiver.amount.toLocaleString()}</p>
                                                <div className="flex items-center gap-1">
                                                  <button
                                                    onClick={() => setWaiverModal({ 
                                                      invoiceId: invoice.id, 
                                                      emiNumber: waiver.emiNumber,
                                                      type: waiver.type,
                                                      percentage: waiver.percentage,
                                                      amount: waiver.amount, 
                                                      reason: waiver.reason, 
                                                      editIndex: index 
                                                    })}
                                                    className="p-1.5 bg-white text-green-600 hover:bg-green-100 border border-green-200 rounded-lg transition-colors shadow-sm"
                                                    title="Edit Waiver"
                                                  >
                                                    <Edit2 className="w-3.5 h-3.5" />
                                                  </button>
                                                  <button
                                                    onClick={() => handleDeleteWaiver(invoice.id, index)}
                                                    className="p-1.5 bg-white text-red-600 hover:bg-red-105 border border-red-200 rounded-lg transition-colors shadow-sm"
                                                    title="Delete Waiver"
                                                  >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                  </button>
                                                </div>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <p className="text-xs text-gray-500 italic text-center py-2">No waivers applied yet for this invoice.</p>
                                      )}
                                    </div>
                                  )}
                                </div>

                                {/* EMI Schedule Collapsible Header */}
                                <div>
                                  <div 
                                    onClick={() => setCollapsedEmis(prev => ({ ...prev, [invoice.id]: !isEmisCollapsed }))}
                                    className={cn(
                                      "flex justify-between items-center cursor-pointer select-none py-2.5 px-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all border border-gray-100 shadow-sm",
                                      !isEmisCollapsed && "bg-pink-50/20 border-pink-100"
                                    )}
                                  >
                                    <div className="flex items-center gap-2">
                                      {isEmisCollapsed ? (
                                        <ChevronDown className="w-4 h-4 text-pink-600 transition-transform" />
                                      ) : (
                                        <ChevronUp className="w-4 h-4 text-pink-600 transition-transform" />
                                      )}
                                      <h5 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                                        <span>EMI Payment Schedule</span>
                                        <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full font-medium">
                                          {invoice.emis.filter((e: any) => e.status === 'paid').length}/{invoice.emis.length} Paid
                                        </span>
                                      </h5>
                                    </div>
                                    <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                                      <button
                                        onClick={() => {
                                          setRestructureModal({
                                            invoiceId: invoice.id,
                                            currentCount: invoice.emis.length,
                                            finalAmount: invoice.finalAmount,
                                            createdAt: invoice.createdAt || new Date().toISOString(),
                                            preservePaid: true
                                          });
                                          setNewEmiCount(invoice.emis.length);
                                          setRestructureInterestRate(invoice.rulesSnapshot?.interestRatePercentage ?? (settings?.interestRatePercentage ?? 7));
                                        }}
                                        className="text-[11px] font-bold text-pink-600 hover:text-pink-700 flex items-center gap-1 bg-white px-2.5 py-1.5 rounded-lg border border-pink-100 shadow-sm transition-all hover:scale-[1.02]"
                                        title="Change the number of EMIs for this student"
                                      >
                                        <Edit2 className="w-3 h-3" /> Change EMI Count
                                      </button>
                                      <span 
                                        onClick={() => setCollapsedEmis(prev => ({ ...prev, [invoice.id]: !isEmisCollapsed }))}
                                        className="text-[11px] font-bold text-pink-600 hover:text-pink-700 tracking-wide uppercase cursor-pointer select-none"
                                      >
                                        {isEmisCollapsed ? "View Schedule" : "Hide Schedule"}
                                      </span>
                                    </div>
                                  </div>

                                  {!isEmisCollapsed && (
                                    <div className="overflow-x-auto mt-3 bg-white border border-gray-150 rounded-xl shadow-sm animate-in fade-in slide-in-from-top-1 duration-200">
                                      <table className="w-full text-sm text-left">
                                        <thead className="bg-gray-50 text-gray-500 border-b border-gray-150">
                                          <tr>
                                            <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider">EMI No.</th>
                                            <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider">Due Date</th>
                                            <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider">Base Fee</th>
                                            <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider">Interest</th>
                                            <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider">Penalty</th>
                                            <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider">Waiver</th>
                                            <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider">Net Payable</th>
                                            <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider rounded-tr-xl">Action</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                          {invoice.emis.map((emi: any, index: number) => {
                                            const emiWaivers = (invoice.waivers || []).filter((w: any) => w.emiNumber === emi.emiNumber);
                                            const emiWaiverAmount = emiWaivers.reduce((sum: number, w: any) => sum + w.amount, 0);
                                            const emiPayable = emi.baseAmount + (emi.interestAmount || 0) + (emi.penaltyAmount || 0) - emiWaiverAmount;
                                            const interestRate = invoice.rulesSnapshot?.interestRatePercentage || 7;
                                            const interestDisplay = emi.interestAmount > 0 ? `${interestRate}% (₹${emi.interestAmount.toLocaleString()})` : '₹0';

                                            return (
                                              <tr key={index} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-4 py-3.5 font-bold text-gray-900">EMI {emi.emiNumber}</td>
                                                <td className="px-4 py-3.5 text-gray-500 font-medium">{new Date(emi.dueDate).toLocaleDateString()}</td>
                                                <td className="px-4 py-3.5 text-gray-900 font-semibold">₹{emi.baseAmount.toLocaleString()}</td>
                                                <td className="px-4 py-3.5 text-orange-600 font-medium">{interestDisplay}</td>
                                                <td className="px-4 py-3.5 text-red-600 font-medium">₹{(emi.penaltyAmount || 0).toLocaleString()}</td>
                                                <td className="px-4 py-3.5 text-green-600 font-semibold">-₹{emiWaiverAmount.toLocaleString()}</td>
                                                <td className="px-4 py-3.5 font-bold text-gray-900 text-base">₹{emiPayable.toLocaleString()}</td>
                                                <td className="px-4 py-3.5">
                                                  <div className="flex items-center gap-2">
                                                    {emi.status === 'paid' ? (
                                                      <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2.5 py-1.5 rounded-full w-fit border border-green-100 shadow-sm">
                                                        <CheckCircle className="w-3.5 h-3.5" /> Paid
                                                      </span>
                                                    ) : (
                                                      <button
                                                        onClick={() => handleMarkEmiPaid(invoice.id, emi.emiNumber)}
                                                        className="bg-pink-50 text-pink-600 hover:bg-pink-100 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm hover:scale-[1.02]"
                                                      >
                                                        Mark Paid
                                                      </button>
                                                    )}
                                                    <button
                                                      onClick={() => setEmiModal({
                                                        invoiceId: invoice.id,
                                                        emiNumber: emi.emiNumber,
                                                        dueDate: emi.dueDate ? emi.dueDate.substring(0, 10) : new Date().toISOString().substring(0, 10),
                                                        baseAmount: emi.baseAmount || 0,
                                                        interestAmount: emi.interestAmount || 0,
                                                        penaltyAmount: emi.penaltyAmount || 0,
                                                        status: emi.status || 'pending'
                                                      })}
                                                      className="p-1.5 bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-200 rounded-lg transition-colors shadow-sm"
                                                      title="Edit EMI Details"
                                                    >
                                                      <Edit2 className="w-3.5 h-3.5" />
                                                    </button>
                                                  </div>
                                                </td>
                                              </tr>
                                            );
                                          })}
                                        </tbody>
                                      </table>
                                    </div>
                                  )}
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
          {activeTab === 'referrals' && (
            <div className="space-y-6">
              {invoices.filter(i => i.referral).length === 0 ? (
                <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                  <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No referrals found.</p>
                </div>
              ) : (
                <div className="grid gap-6">
                  {invoices.filter(i => i.referral).map((invoice) => {
                    const student = students.find(s => s.id === invoice.studentId);
                    return (
                      <div key={invoice.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="font-bold text-gray-900">{student?.name || 'Unknown Student'}</h4>
                            <p className="text-sm text-gray-500">Invoice ID: {invoice.id}</p>
                          </div>
                          <div className="text-right">
                            <span className={cn(
                              "px-3 py-1 rounded-full text-xs font-bold",
                              invoice.referral?.referrerType === 'internal' ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"
                            )}>
                              {invoice.referral?.referrerType === 'internal' ? 'Internal (Telecaller)' : 'External Partner'}
                            </span>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
                          <div className="p-3 bg-gray-50 rounded-xl">
                            <p className="text-xs text-gray-500 mb-1">Referred By</p>
                            <p className="font-bold text-gray-900">{invoice.referral?.referredBy}</p>
                          </div>
                          <div className="p-3 bg-gray-50 rounded-xl">
                            <p className="text-xs text-gray-500 mb-1">Contact</p>
                            <p className="font-bold text-gray-900">{invoice.referral?.referrerContact || 'N/A'}</p>
                          </div>
                          <div className="p-3 bg-gray-50 rounded-xl">
                            <p className="text-xs text-gray-500 mb-1">Bonus Percentage</p>
                            <p className="font-bold text-gray-900">{invoice.referral?.bonusPercentage}%</p>
                          </div>
                          <div className="p-3 bg-gray-50 rounded-xl">
                            <p className="text-xs text-gray-500 mb-1">Total Fee Paid</p>
                            <p className="font-bold text-gray-900">
                              ₹{invoice.emis.filter((e: any) => e.status === 'paid').reduce((sum: number, e: any) => sum + e.baseAmount, 0).toLocaleString()}
                            </p>
                          </div>
                          <div className="p-3 bg-green-50 rounded-xl border border-green-100">
                            <p className="text-xs text-green-700 mb-1">Bonus Earned</p>
                            <p className="font-bold text-green-800 text-lg">₹{(invoice.referral?.bonusEarnedSoFar || 0).toLocaleString()}</p>
                          </div>
                          <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                            <p className="text-xs text-blue-700 mb-1">Bonus Paid</p>
                            <p className="font-bold text-blue-800 text-lg">₹{(invoice.referral?.bonusPaidSoFar || 0).toLocaleString()}</p>
                          </div>
                        </div>
                        
                        <div className="flex justify-end">
                          <button
                            onClick={() => setPayoutModal({ invoiceId: invoice.id, amount: (invoice.referral?.bonusEarnedSoFar || 0) - (invoice.referral?.bonusPaidSoFar || 0) })}
                            disabled={(invoice.referral?.bonusEarnedSoFar || 0) <= (invoice.referral?.bonusPaidSoFar || 0)}
                            className="btn-primary flex items-center gap-2 py-2"
                          >
                            <IndianRupee className="w-4 h-4" />
                            Record Payout
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
          {activeTab === 'settings' && settings && (
            <div className="space-y-8 max-w-2xl">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Course Fees & Durations</h3>
                <div className="space-y-4">
                  {(settings.coursesConfig || []).map((course, index) => (
                    <div key={course.courseId || index} className="flex flex-col md:flex-row md:items-end gap-3 bg-gray-50 p-4 rounded-xl border border-gray-100 relative group">
                      <div className="flex-[2] min-w-[200px]">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Course Title</label>
                        <input
                          type="text"
                          value={course.title}
                          onChange={(e) => {
                            const newConfig = [...(settings.coursesConfig || [])];
                            newConfig[index].title = e.target.value;
                            if (course.courseId.startsWith('new-course-id-')) {
                              newConfig[index].courseId = e.target.value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
                            }
                            setSettings({ ...settings, coursesConfig: newConfig });
                          }}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 text-sm font-medium bg-white"
                          placeholder="e.g. Diploma in Print Ready Engineer"
                        />
                      </div>
                      <div className="w-full md:w-36 shrink-0">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Course Level</label>
                        <select
                          value={course.level || ''}
                          onChange={(e) => {
                            const newConfig = [...(settings.coursesConfig || [])];
                            newConfig[index].level = e.target.value as any;
                            setSettings({ ...settings, coursesConfig: newConfig });
                          }}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 text-sm font-medium bg-white"
                        >
                          <option value="">No Level</option>
                          <option value="basic">Basic</option>
                          <option value="intermediate">Intermediate</option>
                          <option value="advanced">Advanced</option>
                        </select>
                      </div>
                      <div className="flex-[1.2] min-w-[120px]">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Course ID</label>
                        <input
                          type="text"
                          value={course.courseId}
                          onChange={(e) => {
                            const newConfig = [...(settings.coursesConfig || [])];
                            newConfig[index].courseId = e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '');
                            setSettings({ ...settings, coursesConfig: newConfig });
                          }}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 text-xs font-mono bg-white text-gray-600"
                          placeholder="e.g. print-ready-engineer"
                        />
                      </div>
                      <div className="w-full md:w-24 shrink-0">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Fee (₹)</label>
                        <input
                          type="number"
                          value={course.fees}
                          onChange={(e) => {
                            const newConfig = [...(settings.coursesConfig || [])];
                            newConfig[index].fees = parseInt(e.target.value) || 0;
                            setSettings({ ...settings, coursesConfig: newConfig });
                          }}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 text-sm font-medium bg-white"
                        />
                      </div>
                      <div className="w-full md:w-24 shrink-0">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Duration (M)</label>
                        <input
                          type="number"
                          value={course.durationMonths}
                          onChange={(e) => {
                            const newConfig = [...(settings.coursesConfig || [])];
                            newConfig[index].durationMonths = parseInt(e.target.value) || 0;
                            setSettings({ ...settings, coursesConfig: newConfig });
                          }}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 text-sm font-medium bg-white"
                        />
                      </div>
                      {deleteConfirmIndex === index ? (
                        <div className="flex items-center gap-1.5 md:pb-1 shrink-0">
                          <span className="text-[10px] font-bold text-rose-600 uppercase tracking-tight animate-pulse shrink-0">Confirm?</span>
                          <button
                            type="button"
                            onClick={() => {
                              const newConfig = settings.coursesConfig.filter((_, i) => i !== index);
                              setSettings({ ...settings, coursesConfig: newConfig });
                              setDeleteConfirmIndex(null);
                            }}
                            className="px-2 py-1 bg-rose-600 text-white hover:bg-rose-700 text-[11px] font-bold rounded shadow-sm cursor-pointer transition-all shrink-0"
                            title="Confirm Deletion"
                          >
                            Delete
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmIndex(null)}
                            className="px-2 py-1 bg-gray-200 text-gray-700 hover:bg-gray-300 text-[11px] font-bold rounded cursor-pointer transition-all shrink-0"
                            title="Cancel Deletion"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end md:pb-1 md:pr-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setDeleteConfirmIndex(index);
                            }}
                            className="p-2 text-rose-500 hover:bg-rose-50 hover:text-rose-700 rounded-lg border border-transparent hover:border-rose-100 transition-all cursor-pointer"
                            title="Delete Course"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      const tempId = 'new-course-id-' + Date.now();
                      setSettings({
                        ...settings,
                        coursesConfig: [
                          ...(settings.coursesConfig || []),
                          { courseId: tempId, title: 'New Course', fees: 0, durationMonths: 0, level: '' }
                        ]
                      });
                    }}
                    className="flex items-center gap-2 text-sm font-bold text-pink-600 hover:text-pink-700 mt-2 transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Add Course
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">EMI Rules</h3>
                <div className="space-y-4">
                  {settings.emiRules.map((rule, index) => (
                    <div key={index} className="flex items-center gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                      <div className="flex-1">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Course Duration (Months)</label>
                        <input
                          type="number"
                          value={rule.durationMonths}
                          onChange={(e) => {
                            const newRules = [...settings.emiRules];
                            newRules[index].durationMonths = parseInt(e.target.value) || 0;
                            setSettings({ ...settings, emiRules: newRules });
                          }}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Number of EMIs</label>
                        <input
                          type="number"
                          value={rule.emiCount}
                          onChange={(e) => {
                            const newRules = [...settings.emiRules];
                            newRules[index].emiCount = parseInt(e.target.value) || 0;
                            setSettings({ ...settings, emiRules: newRules });
                          }}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500"
                        />
                      </div>
                      <button
                        onClick={() => {
                          const newRules = settings.emiRules.filter((_, i) => i !== index);
                          setSettings({ ...settings, emiRules: newRules });
                        }}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg mt-5"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      setSettings({
                        ...settings,
                        emiRules: [...settings.emiRules, { durationMonths: 0, emiCount: 0 }]
                      });
                    }}
                    className="flex items-center gap-2 text-sm font-bold text-pink-600 hover:text-pink-700"
                  >
                    <Plus className="w-4 h-4" /> Add EMI Rule
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Interest & Penalty</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Interest Rate (%)</label>
                      <input
                        type="number"
                        value={settings.interestRatePercentage}
                        onChange={(e) => setSettings({ ...settings, interestRatePercentage: parseFloat(e.target.value) || 0 })}
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">If a student takes 2+ courses (fees &gt; ₹69,000) and pays in 2 or 5 EMIs, 0% interest is applied. Otherwise, if EMI count &gt; 1, this interest rate is applied to the overall course fees.</p>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Penalty Percentage (%)</label>
                      <input
                        type="number"
                        value={settings.penaltyPercentage}
                        onChange={(e) => setSettings({ ...settings, penaltyPercentage: parseFloat(e.target.value) || 0 })}
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Referral Payouts</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Internal Telecaller (%)</label>
                      <input
                        type="number"
                        value={settings.internalReferralPercentage}
                        onChange={(e) => setSettings({ ...settings, internalReferralPercentage: parseFloat(e.target.value) || 0 })}
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">External Partner (%)</label>
                      <input
                        type="number"
                        value={settings.externalReferralPercentage}
                        onChange={(e) => setSettings({ ...settings, externalReferralPercentage: parseFloat(e.target.value) || 0 })}
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Concession Rules</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Single Parent Concession (%)</label>
                      <input
                        type="number"
                        value={settings.singleParentConcessionPercentage ?? 10}
                        onChange={(e) => setSettings({ ...settings, singleParentConcessionPercentage: parseFloat(e.target.value) || 0 })}
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Transgender Concession (%)</label>
                      <input
                        type="number"
                        value={settings.transgenderConcessionPercentage ?? 75}
                        onChange={(e) => setSettings({ ...settings, transgenderConcessionPercentage: parseFloat(e.target.value) || 0 })}
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-gray-100 pt-8">
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Landmark className="w-5 h-5 text-pink-600" />
                    Bank Account Details
                  </h3>
                  <div className="space-y-3 p-6 bg-pink-50/30 rounded-3xl border border-pink-100">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Account Holder Name</label>
                      <input
                        type="text"
                        value={settings.bankDetails?.accountHolderName || ''}
                        onChange={(e) => setSettings({ 
                          ...settings, 
                          bankDetails: { ...(settings.bankDetails || { accountHolderName: '', accountNumber: '', ifscCode: '', bankName: '', branchName: '' }), accountHolderName: e.target.value } 
                        })}
                        className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 text-sm"
                        placeholder="Organization Name"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Account Number</label>
                      <input
                        type="text"
                        value={settings.bankDetails?.accountNumber || ''}
                        onChange={(e) => setSettings({ 
                          ...settings, 
                          bankDetails: { ...(settings.bankDetails || { accountHolderName: '', accountNumber: '', ifscCode: '', bankName: '', branchName: '' }), accountNumber: e.target.value } 
                        })}
                        className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 text-sm"
                        placeholder="XXXX XXXX XXXX XXXX"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">IFSC Code</label>
                        <input
                          type="text"
                          value={settings.bankDetails?.ifscCode || ''}
                          onChange={(e) => setSettings({ 
                            ...settings, 
                            bankDetails: { ...(settings.bankDetails || { accountHolderName: '', accountNumber: '', ifscCode: '', bankName: '', branchName: '' }), ifscCode: e.target.value } 
                          })}
                          className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 text-sm"
                          placeholder="HDFC000XXXX"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Bank Name</label>
                        <input
                          type="text"
                          value={settings.bankDetails?.bankName || ''}
                          onChange={(e) => setSettings({ 
                            ...settings, 
                            bankDetails: { ...(settings.bankDetails || { accountHolderName: '', accountNumber: '', ifscCode: '', bankName: '', branchName: '' }), bankName: e.target.value } 
                          })}
                          className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 text-sm"
                          placeholder="HDFC Bank"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Smartphone className="w-5 h-5 text-pink-600" />
                    UPI & QR Settings
                  </h3>
                  <div className="space-y-3 p-6 bg-pink-50/30 rounded-3xl border border-pink-100">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">UPI ID</label>
                      <input
                        type="text"
                        value={settings.upiDetails?.upiId || ''}
                        onChange={(e) => setSettings({ 
                          ...settings, 
                          upiDetails: { ...(settings.upiDetails || { upiId: '', merchantName: '' }), upiId: e.target.value } 
                        })}
                        className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 text-sm"
                        placeholder="org@upi"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Merchant Name (Display)</label>
                      <input
                        type="text"
                        value={settings.upiDetails?.merchantName || ''}
                        onChange={(e) => setSettings({ 
                          ...settings, 
                          upiDetails: { ...(settings.upiDetails || { upiId: '', merchantName: '' }), merchantName: e.target.value } 
                        })}
                        className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 text-sm"
                        placeholder="Organization Name"
                      />
                    </div>
                    <div className="p-3 bg-blue-50 text-blue-700 rounded-xl text-[10px] leading-relaxed">
                      <p className="font-bold flex items-center gap-1 mb-1">
                        <ShieldCheck className="w-3 h-3" />
                        Dynamic QR Generation Enabled
                      </p>
                      A unique payment QR code will be automatically generated for each student's specific invoice amount using this UPI ID.
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-8 mt-8">
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-pink-600" />
                    Razorpay Online Payment API Connection
                  </h3>
                  <p className="text-xs text-gray-500 max-w-3xl leading-relaxed">
                    Connect your Razorpay payment gateway credentials. Customers will be able to make instant payments using Debit/Credit cards, Net banking, and direct UPI transfers, syncing instantly with your ledger.
                  </p>
                  
                  <div className="p-6 bg-pink-50/20 rounded-3xl border border-pink-100 space-y-4">
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        id="razorpay_enabled"
                        checked={settings.razorpayDetails?.enabled || false}
                        onChange={(e) => setSettings({
                          ...settings,
                          razorpayDetails: {
                            ...(settings.razorpayDetails || { enabled: false, keyId: '', keySecret: '' }),
                            enabled: e.target.checked
                          }
                        })}
                        className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                      />
                      <label htmlFor="razorpay_enabled" className="text-sm font-bold text-gray-800 cursor-pointer uppercase tracking-wider">
                        Enable Razorpay Checkout Gateway
                      </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Razorpay API Key ID</label>
                        <input
                          type="text"
                          value={settings.razorpayDetails?.keyId || ''}
                          onChange={(e) => setSettings({
                            ...settings,
                            razorpayDetails: {
                              ...(settings.razorpayDetails || { enabled: false, keyId: '', keySecret: '' }),
                              keyId: e.target.value.trim()
                            }
                          })}
                          disabled={!settings.razorpayDetails?.enabled}
                          className="w-full px-4 py-2 bg-white disabled:bg-gray-150 disabled:text-gray-400 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 text-sm font-mono"
                          placeholder="rzp_live_xxxxxxxxxxxx or rzp_test_xxxxxxxxxx"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Razorpay API Key Secret</label>
                        <input
                          type="password"
                          value={settings.razorpayDetails?.keySecret || ''}
                          onChange={(e) => setSettings({
                            ...settings,
                            razorpayDetails: {
                              ...(settings.razorpayDetails || { enabled: false, keyId: '', keySecret: '' }),
                              keySecret: e.target.value.trim()
                            }
                          })}
                          disabled={!settings.razorpayDetails?.enabled}
                          className="w-full px-4 py-2 bg-white disabled:bg-gray-150 disabled:text-gray-400 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 text-sm font-mono"
                          placeholder="••••••••••••••••••••••••"
                        />
                      </div>
                    </div>

                    <div className="p-4 bg-white/80 rounded-2xl border border-pink-100/50 text-xs text-slate-600 space-y-2 leading-relaxed">
                      <p className="font-bold text-slate-700">How to get Razorpay API Credentials:</p>
                      <ol className="list-decimal pl-4 space-y-1">
                        <li>Log in to your continuous <a href="https://dashboard.razorpay.com" target="_blank" rel="noopener noreferrer" className="text-pink-600 hover:underline font-semibold">Razorpay Dashboard</a>.</li>
                        <li>Navigate to <strong>Account & Settings</strong> &gt; <strong>API Keys</strong> page from left menu bar.</li>
                        <li>Click on <strong>"Generate Key"</strong> to produce your dynamic live or test sandbox credentials.</li>
                        <li>Paste the Key ID and Key Secret into the fields above, turn on "Enable", and click "Save Financial Settings".</li>
                      </ol>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-100 flex justify-end">
                <button
                  onClick={async () => {
                    try {
                      await setDoc(doc(db, 'settings', 'financial'), {
                        ...settings,
                        updatedAt: new Date().toISOString(),
                        updatedBy: user?.id || 'unknown'
                      });
                      alert('Financial settings saved successfully.');
                    } catch (err) {
                      handleFirestoreError(err, OperationType.WRITE, 'settings/financial');
                    }
                  }}
                  className="btn-primary px-8 py-2.5 shadow-lg"
                >
                  Save Financial Settings
                </button>
              </div>
            </div>
          )}
          {activeTab === 'reports' && (
            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-bold text-gray-700">From:</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-pink-500"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-bold text-gray-700">To:</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-pink-500"
                    />
                  </div>
                  {(startDate || endDate) && (
                    <button
                      onClick={() => {
                        setStartDate('');
                        setEndDate('');
                      }}
                      className="text-sm text-pink-600 hover:text-pink-700 font-bold"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">All-in-One Account Report</h2>
                <button
                  onClick={() => {
                    const headers = [
                      'Student Name', 'Student ID', 'Courses', 'Base Fee', 'Concession', 
                      'Final Amount', 'Total Interest', 'Total Penalty', 'Total Waivers', 
                      'Total Payable', 'Total Paid', 'Total Outstanding', 'Referral Earned', 'Referral Paid', 'Created At'
                    ];
                    
                    const filteredInvoices = invoices.filter(inv => isWithinDateRange(inv.createdAt));
                    
                    const rows = filteredInvoices.map(invoice => {
                      const student = students.find(s => s.id === invoice.studentId);
                      const totalInterest = invoice.emis.reduce((sum, emi) => sum + (emi.interestAmount || 0), 0);
                      const totalPenalty = invoice.emis.reduce((sum, emi) => sum + (emi.penaltyAmount || 0), 0);
                      const totalWaivers = (invoice.waivers || []).reduce((sum, w) => sum + w.amount, 0);
                      const totalPayable = invoice.finalAmount + totalInterest + totalPenalty - totalWaivers;
                      
                      const totalPaid = invoice.emis
                        .filter(e => e.status === 'paid')
                        .reduce((sum, e) => {
                          const emiWaivers = (invoice.waivers || []).filter(w => w.emiNumber === e.emiNumber);
                          const emiWaiverAmount = emiWaivers.reduce((wSum, w) => wSum + w.amount, 0);
                          return sum + e.baseAmount + (e.interestAmount || 0) + (e.penaltyAmount || 0) - emiWaiverAmount;
                        }, 0);
                        
                      const totalOutstanding = totalPayable - totalPaid;

                      return [
                        student?.name || 'Unknown',
                        student?.studentId || 'N/A',
                        student?.assignedCourses?.map(formatCourseName).join(', ') || 'N/A',
                        invoice.totalFee,
                        invoice.concessionApplied,
                        invoice.finalAmount,
                        totalInterest,
                        totalPenalty,
                        totalWaivers,
                        totalPayable,
                        totalPaid,
                        totalOutstanding,
                        invoice.referral?.bonusEarnedSoFar || 0,
                        invoice.referral?.bonusPaidSoFar || 0,
                        new Date(invoice.createdAt).toLocaleDateString()
                      ];
                    });

                    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
                    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                    const link = document.createElement("a");
                    const url = URL.createObjectURL(blob);
                    link.setAttribute("href", url);
                    link.setAttribute("download", `accounts_report_${new Date().toISOString().split('T')[0]}.csv`);
                    link.style.visibility = 'hidden';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-xl font-bold hover:bg-pink-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Export to CSV
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="p-4 text-sm font-bold text-gray-700">Student</th>
                      <th className="p-4 text-sm font-bold text-gray-700">Courses</th>
                      <th className="p-4 text-sm font-bold text-gray-700">Base Fee</th>
                      <th className="p-4 text-sm font-bold text-gray-700">Final Amount</th>
                      <th className="p-4 text-sm font-bold text-gray-700">Interest</th>
                      <th className="p-4 text-sm font-bold text-gray-700">Penalty</th>
                      <th className="p-4 text-sm font-bold text-gray-700">Waivers</th>
                      <th className="p-4 text-sm font-bold text-gray-700">Total Payable</th>
                      <th className="p-4 text-sm font-bold text-gray-700">Paid</th>
                      <th className="p-4 text-sm font-bold text-gray-700">Outstanding</th>
                      <th className="p-4 text-sm font-bold text-gray-700">Ref. Earned</th>
                      <th className="p-4 text-sm font-bold text-gray-700">Ref. Paid</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.filter(inv => isWithinDateRange(inv.createdAt)).map(invoice => {
                      const student = students.find(s => s.id === invoice.studentId);
                      const totalInterest = invoice.emis.reduce((sum, emi) => sum + (emi.interestAmount || 0), 0);
                      const totalPenalty = invoice.emis.reduce((sum, emi) => sum + (emi.penaltyAmount || 0), 0);
                      const totalWaivers = (invoice.waivers || []).reduce((sum, w) => sum + w.amount, 0);
                      const totalPayable = invoice.finalAmount + totalInterest + totalPenalty - totalWaivers;
                      
                      const totalPaid = invoice.emis
                        .filter(e => e.status === 'paid')
                        .reduce((sum, e) => {
                          const emiWaivers = (invoice.waivers || []).filter(w => w.emiNumber === e.emiNumber);
                          const emiWaiverAmount = emiWaivers.reduce((wSum, w) => wSum + w.amount, 0);
                          return sum + e.baseAmount + (e.interestAmount || 0) + (e.penaltyAmount || 0) - emiWaiverAmount;
                        }, 0);
                        
                      const totalOutstanding = totalPayable - totalPaid;

                      return (
                        <tr key={invoice.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="p-4">
                            <p className="font-bold text-gray-900">{student?.name || 'Unknown'}</p>
                            <p className="text-xs text-gray-500">{student?.studentId}</p>
                          </td>
                          <td className="p-4 text-sm text-gray-600">{student?.assignedCourses?.map(formatCourseName).join(', ') || 'N/A'}</td>
                          <td className="p-4 text-sm">₹{invoice.totalFee.toLocaleString()}</td>
                          <td className="p-4 text-sm">₹{invoice.finalAmount.toLocaleString()}</td>
                          <td className="p-4 text-sm text-orange-600">₹{totalInterest.toLocaleString()}</td>
                          <td className="p-4 text-sm text-red-600">₹{totalPenalty.toLocaleString()}</td>
                          <td className="p-4 text-sm text-green-600">₹{totalWaivers.toLocaleString()}</td>
                          <td className="p-4 text-sm font-bold">₹{totalPayable.toLocaleString()}</td>
                          <td className="p-4 text-sm text-green-600 font-bold">₹{totalPaid.toLocaleString()}</td>
                          <td className="p-4 text-sm text-red-600 font-bold">₹{totalOutstanding.toLocaleString()}</td>
                          <td className="p-4 text-sm text-purple-600 font-bold">₹{(invoice.referral?.bonusEarnedSoFar || 0).toLocaleString()}</td>
                          <td className="p-4 text-sm text-blue-600 font-bold">₹{(invoice.referral?.bonusPaidSoFar || 0).toLocaleString()}</td>
                        </tr>
                      );
                    })}
                    {invoices.length === 0 && (
                      <tr>
                        <td colSpan={12} className="p-8 text-center text-gray-500">
                          No invoices found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Waiver Modal */}
      {waiverModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              {waiverModal.editIndex !== undefined ? 'Edit Waiver' : 'Add Waiver'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Select EMI</label>
                <select
                  value={waiverModal.emiNumber}
                  onChange={(e) => {
                    const emiNumber = parseInt(e.target.value);
                    const invoice = invoices.find(i => i.id === waiverModal.invoiceId);
                    const emi = invoice?.emis.find((e: any) => e.emiNumber === emiNumber);
                    let amount = 0;
                    if (emi && waiverModal.type && waiverModal.percentage) {
                      const base = waiverModal.type === 'fee' ? (emi.baseAmount || 0) : waiverModal.type === 'interest' ? (emi.interestAmount || 0) : (emi.penaltyAmount || 0);
                      amount = base * (waiverModal.percentage / 100);
                    }
                    setWaiverModal({ ...waiverModal, emiNumber, amount });
                  }}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 font-medium text-gray-800"
                >
                  <option value="">Select EMI</option>
                  {invoices.find(i => i.id === waiverModal.invoiceId)?.emis.map((emi: any) => (
                    <option key={emi.emiNumber} value={emi.emiNumber}>
                      EMI {emi.emiNumber} (Base Fee: ₹{emi.baseAmount || 0}, Interest: ₹{emi.interestAmount || 0}, Penalty: ₹{emi.penaltyAmount || 0})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Waiver Type</label>
                <select
                  value={waiverModal.type}
                  onChange={(e) => {
                    const type = e.target.value as 'fee' | 'interest' | 'penalty';
                    const invoice = invoices.find(i => i.id === waiverModal.invoiceId);
                    const emi = invoice?.emis.find((e: any) => e.emiNumber === waiverModal.emiNumber);
                    let amount = 0;
                    if (emi && type && waiverModal.percentage) {
                      const base = type === 'fee' ? (emi.baseAmount || 0) : type === 'interest' ? (emi.interestAmount || 0) : (emi.penaltyAmount || 0);
                      amount = base * (waiverModal.percentage / 100);
                    }
                    setWaiverModal({ ...waiverModal, type, amount });
                  }}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 font-medium text-gray-800"
                >
                  <option value="">Select Type</option>
                  <option value="fee">Base Fee Waiver</option>
                  <option value="interest">Interest Waiver</option>
                  <option value="penalty">Penalty Waiver</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Percentage (%)</label>
                <select
                  value={waiverModal.percentage}
                  onChange={(e) => {
                    const percentage = parseInt(e.target.value);
                    const invoice = invoices.find(i => i.id === waiverModal.invoiceId);
                    const emi = invoice?.emis.find((e: any) => e.emiNumber === waiverModal.emiNumber);
                    let amount = 0;
                    if (emi && waiverModal.type && percentage) {
                      const base = waiverModal.type === 'fee' ? (emi.baseAmount || 0) : waiverModal.type === 'interest' ? (emi.interestAmount || 0) : (emi.penaltyAmount || 0);
                      amount = base * (percentage / 100);
                    }
                    setWaiverModal({ ...waiverModal, percentage, amount });
                  }}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 font-medium text-gray-800"
                >
                  <option value="">Select Percentage</option>
                  <option value="100">100%</option>
                  <option value="50">50%</option>
                  <option value="25">25%</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Calculated / Custom Amount (₹)</label>
                <input
                  type="number"
                  min={0}
                  value={waiverModal.amount || 0}
                  onChange={(e) => {
                    const amount = Math.max(0, parseFloat(e.target.value) || 0);
                    setWaiverModal({ ...waiverModal, amount });
                  }}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 font-medium text-gray-800"
                />
                <p className="text-[10px] text-gray-400 mt-1 italic">
                  You can modify the amount directly or select a percentage option above.
                </p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Reason</label>
                <textarea
                  value={waiverModal.reason}
                  onChange={(e) => setWaiverModal({ ...waiverModal, reason: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 font-medium text-gray-800"
                  placeholder="Enter reason for waiver (e.g., Good attitude)"
                  rows={3}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setWaiverModal(null)}
                  className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveWaiver}
                  className="flex-1 px-4 py-2 bg-pink-600 text-white rounded-xl font-bold hover:bg-pink-700 transition-colors"
                >
                  Save Waiver
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit EMI Modal */}
      {emiModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Edit EMI {emiModal.emiNumber} Details
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Due Date</label>
                <input
                  type="date"
                  value={emiModal.dueDate}
                  onChange={(e) => setEmiModal({ ...emiModal, dueDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 font-medium text-gray-800"
                />
                <p className="text-[10px] text-gray-400 mt-1 italic">
                  Change the EMI due date (supports setting old/past or future dates).
                </p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Base Amount (₹)</label>
                <input
                  type="number"
                  min={0}
                  value={emiModal.baseAmount}
                  onChange={(e) => setEmiModal({ ...emiModal, baseAmount: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 font-medium text-gray-800"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Interest Amount (₹)</label>
                <input
                  type="number"
                  min={0}
                  value={emiModal.interestAmount}
                  onChange={(e) => setEmiModal({ ...emiModal, interestAmount: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 font-medium text-gray-800"
                />
                {(() => {
                  const invoice = invoices.find(i => i.id === emiModal.invoiceId);
                  const student = invoice ? students.find(s => s.id === invoice.studentId) : undefined;
                  const is6Month = is6MonthCourseStudent(student);
                  const hasMoreThan2Emis = invoice ? invoice.emis.length > 2 : false;
                  
                  if (is6Month && hasMoreThan2Emis) {
                    const rate = invoice?.rulesSnapshot?.interestRatePercentage ?? (settings?.interestRatePercentage ?? 7);
                    const suggestedInterest = Math.round(emiModal.baseAmount * (rate / 100));
                    return (
                      <div className="mt-2 p-2 bg-pink-50 border border-pink-100 rounded-lg text-[11px] text-pink-850">
                        <p className="font-bold mb-0.5">6-Month Course Interest Match:</p>
                        <p className="mb-1.5">This student has a 6-month course with more than 2 EMIs. Standard dynamic rate is {rate}%.</p>
                        {emiModal.status === 'pending' && (
                          <button
                            type="button"
                            onClick={() => setEmiModal({ ...emiModal, interestAmount: suggestedInterest })}
                            className="px-2 py-0.5 bg-pink-600 text-white rounded font-bold hover:bg-pink-700 transition-colors"
                          >
                            Apply Suggested: ₹{suggestedInterest.toLocaleString()}
                          </button>
                        )}
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Penalty Amount (₹)</label>
                <input
                  type="number"
                  min={0}
                  value={emiModal.penaltyAmount}
                  onChange={(e) => setEmiModal({ ...emiModal, penaltyAmount: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 font-medium text-gray-800"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Status</label>
                <select
                  value={emiModal.status}
                  onChange={(e) => setEmiModal({ ...emiModal, status: e.target.value as 'paid' | 'pending' })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 font-medium text-gray-800"
                >
                  <option value="pending">Pending / Unpaid</option>
                  <option value="paid">Paid</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setEmiModal(null)}
                  className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEmi}
                  className="flex-1 px-4 py-2 bg-pink-600 text-white rounded-xl font-bold hover:bg-pink-700 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Restructure EMI Modal */}
      {restructureModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Change EMI Count
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Redistribute the total final payable amount (₹{restructureModal.finalAmount.toLocaleString()}) into a new number of installments.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">New Number of EMIs</label>
                <input
                  type="number"
                  min={1}
                  max={24}
                  value={newEmiCount}
                  onChange={(e) => setNewEmiCount(parseInt(e.target.value) || 1)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 font-medium text-gray-800"
                />
                <p className="text-[10px] text-gray-400 mt-1 italic">
                  Enter a value between 1 and 24.
                </p>
              </div>

              {(() => {
                const invoice = invoices.find(i => i.id === restructureModal.invoiceId);
                const student = invoice ? students.find(s => s.id === invoice.studentId) : undefined;
                const is6Month = is6MonthCourseStudent(student);
                if (!is6Month) return null;
                
                return (
                  <div className="space-y-3">
                    <div className="bg-pink-50 border border-pink-100 rounded-xl p-3 text-xs text-pink-850">
                      <span className="font-bold block mb-1">6-Month Course Interest Rule:</span>
                      This student is enrolled in a 6-month course. Selecting more than 2 EMIs requires dynamic interest charges (default 7%).
                    </div>
                    {newEmiCount > 2 && (
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Dynamic Interest Rate (%)</label>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          step={0.1}
                          value={restructureInterestRate}
                          onChange={(e) => setRestructureInterestRate(parseFloat(e.target.value) || 0)}
                          className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 font-medium text-gray-800"
                        />
                        <p className="text-[10px] text-gray-400 mt-1 italic">
                          This interest is applied only to unpaid/new EMIs.
                        </p>
                      </div>
                    )}
                  </div>
                );
              })()}

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Restructuring Options</label>
                <div className="space-y-2 mt-2">
                  <label className="flex items-start gap-3 p-3 border rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                    <input
                      type="radio"
                      name="preservePaid"
                      checked={restructureModal.preservePaid === true}
                      onChange={() => setRestructureModal({ ...restructureModal, preservePaid: true })}
                      className="mt-1 accent-pink-600"
                    />
                    <div>
                      <span className="text-sm font-bold text-gray-900">Preserve Paid EMIs (Recommended)</span>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Keep any already-paid EMIs exactly as they are. Redistribute only the remaining unpaid balance among new pending EMIs starting from today.
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-3 border rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                    <input
                      type="radio"
                      name="preservePaid"
                      checked={restructureModal.preservePaid === false}
                      onChange={() => setRestructureModal({ ...restructureModal, preservePaid: false })}
                      className="mt-1 accent-pink-600"
                    />
                    <div>
                      <span className="text-sm font-bold text-gray-900">Complete Reset</span>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Discard all current EMI payment statuses (including any paid EMIs) and completely regenerate all EMIs from the invoice creation date.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setRestructureModal(null)}
                  className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRestructureEmis}
                  className="flex-1 px-4 py-2 bg-pink-600 text-white rounded-xl font-bold hover:bg-pink-700 transition-colors"
                >
                  Restructure
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payout Modal */}
      {payoutModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Record Payout</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Amount (₹)</label>
                <input
                  type="number"
                  value={payoutModal.amount}
                  onChange={(e) => setPayoutModal({ ...payoutModal, amount: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setPayoutModal(null)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRecordPayout}
                className="px-6 py-2 bg-pink-600 text-white rounded-xl font-bold hover:bg-pink-700 transition-colors"
              >
                Record Payout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Apply Student Invoice Modal */}
      {invoiceModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Apply Student Invoice
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Select Student</label>
                <select
                  value={invoiceModal.studentId}
                  onChange={(e) => setInvoiceModal({ ...invoiceModal, studentId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 font-medium text-gray-800"
                >
                  <option value="">-- Choose Student --</option>
                  {students.filter(std => std.role === 'student' || std.applicationStatus === 'approved' || std.applicationStatus === 'submitted').map(std => {
                    const alreadyHasInvoice = invoices.some(inv => inv.studentId === std.id);
                    return (
                      <option key={std.id} value={std.id}>
                        {std.name} ({std.email}) {alreadyHasInvoice ? ' - Invoice Applied' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Select Course Profile</label>
                <select
                  value={invoiceModal.courseId}
                  onChange={(e) => setInvoiceModal({ ...invoiceModal, courseId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 font-medium text-gray-800"
                >
                  <option value="">-- Choose Course --</option>
                  {(settings?.coursesConfig || []).map(course => (
                    <option key={course.courseId} value={course.courseId}>
                      {course.title} (₹{course.fees.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">No. of EMIs</label>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={invoiceModal.emiCount}
                    onChange={(e) => setInvoiceModal({ ...invoiceModal, emiCount: Math.max(1, parseInt(e.target.value) || 1) })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Interest Rate (%)</label>
                  <input
                    type="number"
                    min={0}
                    value={invoiceModal.interestRate}
                    onChange={(e) => setInvoiceModal({ ...invoiceModal, interestRate: Math.max(0, parseFloat(e.target.value) || 0) })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Concession Type</label>
                  <select
                    value={invoiceModal.concessionType}
                    onChange={(e: any) => setInvoiceModal({ ...invoiceModal, concessionType: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 font-medium"
                  >
                    <option value="none">None (0%)</option>
                    <option value="single-parent">Single Parent (20%)</option>
                    <option value="transgender">Transgender (30%)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Additional Discount (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={invoiceModal.customFeeDiscount}
                    onChange={(e) => setInvoiceModal({ ...invoiceModal, customFeeDiscount: Math.max(0, parseInt(e.target.value) || 0) })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 font-medium"
                    placeholder="e.g. 5000"
                  />
                </div>
              </div>

              {/* Estimate Preview */}
              {invoiceModal.courseId && (() => {
                const selectedCourse = settings?.coursesConfig.find(c => c.courseId === invoiceModal.courseId);
                if (!selectedCourse) return null;
                const total = selectedCourse.fees;
                let concessionPercent = 0;
                if (invoiceModal.concessionType === 'single-parent') concessionPercent = 20;
                else if (invoiceModal.concessionType === 'transgender') concessionPercent = 30;
                
                const concessionAmount = total * (concessionPercent / 100);
                const final = Math.max(0, total - concessionAmount - invoiceModal.customFeeDiscount);
                const emiShare = Math.round(final / (invoiceModal.emiCount || 1));

                return (
                  <div className="p-3 bg-pink-50/50 rounded-xl border border-pink-100/40 text-xs text-gray-700 space-y-1">
                    <div className="flex justify-between">
                      <span>Standard Course Fee:</span>
                      <span className="font-semibold text-gray-950">₹{total.toLocaleString()}</span>
                    </div>
                    {concessionAmount > 0 && (
                      <div className="flex justify-between text-green-700">
                        <span>Concession applied:</span>
                        <span className="font-semibold">-₹{concessionAmount.toLocaleString()}</span>
                      </div>
                    )}
                    {invoiceModal.customFeeDiscount > 0 && (
                      <div className="flex justify-between text-green-700">
                        <span>Additional discount:</span>
                        <span className="font-semibold">-₹{invoiceModal.customFeeDiscount.toLocaleString()}</span>
                      </div>
                    )}
                    <hr className="my-1 border-pink-100" />
                    <div className="flex justify-between text-sm font-bold text-gray-900">
                      <span>Final Payable Amount:</span>
                      <span className="text-pink-600 font-bold">₹{final.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between pt-0.5 text-gray-500">
                      <span>EMI payment portion:</span>
                      <span className="font-medium">₹{emiShare.toLocaleString()} x {invoiceModal.emiCount} EMIs</span>
                    </div>
                  </div>
                );
              })()}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setInvoiceModal(null)}
                  className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApplyInvoice}
                  disabled={!invoiceModal.studentId || !invoiceModal.courseId}
                  className="flex-1 px-4 py-2 bg-pink-600 disabled:opacity-50 text-white rounded-xl font-bold hover:bg-pink-700 transition-colors"
                >
                  Create & Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
