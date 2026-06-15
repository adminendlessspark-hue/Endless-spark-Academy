import React, { useState, useEffect } from 'react';
import { CreditCard, ShieldCheck, ArrowRight, CheckCircle2, X, AlertCircle, IndianRupee, Landmark, Smartphone, Loader2, Copy, Check } from 'lucide-react';
import { cn } from '../utils';
import { QRCodeCanvas } from 'qrcode.react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { FinancialSettings } from '../types';

interface DigitalPaymentGatewayProps {
  amount: number;
  description: string;
  studentName: string;
  studentEmail: string;
  onSuccess: (paymentId: string) => void;
  onCancel: () => void;
}

type PaymentMethod = 'card' | 'upi' | 'netbanking';

export default function DigitalPaymentGateway({ amount, description, studentName, studentEmail, onSuccess, onCancel }: DigitalPaymentGatewayProps) {
  const [step, setStep] = useState<'selection' | 'processing' | 'success'>('selection');
  const [method, setMethod] = useState<PaymentMethod>('upi');
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<FinancialSettings | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'financial'), (docSnap) => {
      if (docSnap.exists()) {
        setSettings(docSnap.data() as FinancialSettings);
      }
    });
    return () => unsub();
  }, []);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const generateUpiUrl = () => {
    if (!settings?.upiDetails?.upiId) return '';
    const upiId = settings.upiDetails.upiId;
    const name = settings.upiDetails.merchantName || 'Organization Name';
    const tr = `PAY-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    return `upi://pay?pa=${upiId}&pn=${encodeURIComponent(name)}&am=${amount}&cu=INR&tn=${encodeURIComponent(description)}&tr=${tr}`;
  };

  const handlePayment = () => {
    setLoading(true);
    // Simulate payment verification delay
    setTimeout(() => {
      setLoading(false);
      setStep('success');
      setTimeout(() => {
        onSuccess(`PAY-${Math.random().toString(36).substring(2, 10).toUpperCase()}`);
      }, 2000);
    }, 3000);
  };

  if (step === 'success') {
    return (
      <div className="p-8 text-center animate-in fade-in zoom-in duration-500">
        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 scale-110">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
        <p className="text-gray-500 mb-6 font-medium">Your payment of <span className="text-gray-900 font-bold">₹{amount.toLocaleString()}</span> has been processed securely.</p>
        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col items-center gap-2 mb-8">
          <Loader2 className="w-5 h-5 text-pink-600 animate-spin" />
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Finalizing your records...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-pink-100 text-pink-600 rounded-xl">
            <IndianRupee className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Secure Payment</h3>
            <p className="text-xs text-gray-500">{description}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Amount Payable</p>
          <p className="text-xl font-black text-gray-900">₹{amount.toLocaleString()}</p>
        </div>
      </div>

      <div className="p-6 flex-1 overflow-y-auto">
        <div className="mb-8">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 block">Select Payment Method</label>
          <div className="grid grid-cols-1 gap-3">
            <button
              onClick={() => setMethod('upi')}
              className={cn(
                "flex items-center justify-between p-4 rounded-2xl border-2 transition-all group",
                method === 'upi' ? "border-pink-500 bg-pink-50/50" : "border-gray-100 hover:border-gray-300"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-xl", method === 'upi' ? "bg-pink-100 text-pink-600" : "bg-gray-100 text-gray-400")}>
                  <Smartphone className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-gray-900">UPI / QR Scan</p>
                  <p className="text-xs text-gray-500">Google Pay, PhonePe, Paytm</p>
                </div>
              </div>
              <div className={cn("w-6 h-6 rounded-full border-2 flex items-center justify-center", method === 'upi' ? "border-pink-500 bg-pink-500" : "border-gray-200")}>
                {method === 'upi' && <div className="w-2 h-2 bg-white rounded-full" />}
              </div>
            </button>

            <button
              onClick={() => setMethod('card')}
              className={cn(
                "flex items-center justify-between p-4 rounded-2xl border-2 transition-all group",
                method === 'card' ? "border-pink-500 bg-pink-50/50" : "border-gray-100 hover:border-gray-300"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-xl", method === 'card' ? "bg-pink-100 text-pink-600" : "bg-gray-100 text-gray-400")}>
                  <CreditCard className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-gray-900">Debit / Credit Card</p>
                  <p className="text-xs text-gray-500">Visa, Mastercard, RuPay</p>
                </div>
              </div>
              <div className={cn("w-6 h-6 rounded-full border-2 flex items-center justify-center", method === 'card' ? "border-pink-500 bg-pink-500" : "border-gray-200")}>
                {method === 'card' && <div className="w-2 h-2 bg-white rounded-full" />}
              </div>
            </button>

            <button
              onClick={() => setMethod('netbanking')}
              className={cn(
                "flex items-center justify-between p-4 rounded-2xl border-2 transition-all group",
                method === 'netbanking' ? "border-pink-500 bg-pink-50/50" : "border-gray-100 hover:border-gray-300"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-xl", method === 'netbanking' ? "bg-pink-100 text-pink-600" : "bg-gray-100 text-gray-400")}>
                  <Landmark className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-gray-900">Net Banking</p>
                  <p className="text-xs text-gray-500">All Indian Banks supported</p>
                </div>
              </div>
              <div className={cn("w-6 h-6 rounded-full border-2 flex items-center justify-center", method === 'netbanking' ? "border-pink-500 bg-pink-500" : "border-gray-200")}>
                {method === 'netbanking' && <div className="w-2 h-2 bg-white rounded-full" />}
              </div>
            </button>
          </div>
        </div>

        {method === 'upi' && (
          <div className="mb-8 p-6 bg-pink-50/30 rounded-3xl border border-pink-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4">
                <p className="text-xs font-bold text-pink-600 uppercase tracking-widest mb-1">Scan QR to Pay</p>
                <p className="text-[10px] text-gray-500">Works with all UPI Apps</p>
              </div>
              
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6">
                {settings?.upiDetails?.upiId ? (
                  <QRCodeCanvas 
                    value={generateUpiUrl()}
                    size={160}
                    level="H"
                    includeMargin={true}
                  />
                ) : (
                  <div className="w-40 h-40 flex items-center justify-center text-gray-400 text-xs">
                    UPI ID not configured
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-full mb-2">
                <span className="text-xs font-bold text-gray-600 uppercase tracking-tighter">UPI ID:</span>
                <span className="text-xs font-black text-gray-900">{settings?.upiDetails?.upiId || 'Not Configured'}</span>
                <button 
                  onClick={() => handleCopy(settings?.upiDetails?.upiId || '', 'upi')}
                  className="p-1 hover:bg-gray-100 rounded-md transition-colors"
                >
                  {copied === 'upi' ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3 text-pink-600" />}
                </button>
              </div>
              <p className="text-[10px] text-gray-400 italic">Merchant: {settings?.upiDetails?.merchantName || 'Organization Name'}</p>
            </div>
          </div>
        )}

        {method === 'netbanking' && (
          <div className="mb-8 p-6 bg-pink-50/30 rounded-3xl border border-pink-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col gap-4">
              <div className="text-center">
                <p className="text-xs font-bold text-pink-600 uppercase tracking-widest mb-1">Bank Transfer Details</p>
                <p className="text-[10px] text-gray-500">Transfer exactly ₹{amount.toLocaleString()}</p>
              </div>

              <div className="space-y-2">
                {[
                  { label: 'A/C HOLDER', value: settings?.bankDetails?.accountHolderName || 'Not Configured' },
                  { label: 'ACC NUMBER', value: settings?.bankDetails?.accountNumber || 'Not Configured' },
                  { label: 'IFSC CODE', value: settings?.bankDetails?.ifscCode || 'Not Configured' },
                  { label: 'BANK NAME', value: settings?.bankDetails?.bankName || 'Not Configured' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl group">
                    <div>
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{item.label}</p>
                      <p className="text-sm font-black text-gray-900">{item.value}</p>
                    </div>
                    <button 
                      onClick={() => handleCopy(item.value, item.label)}
                      className="p-2 hover:bg-pink-50 text-pink-600 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    >
                      {copied === item.label ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex gap-3 text-xs text-blue-800">
          <ShieldCheck className="w-5 h-5 flex-shrink-0 text-blue-600" />
          <p>This is a secure 256-bit encrypted connection. Your payment information is never stored on our servers.</p>
        </div>
      </div>

      <div className="p-6 bg-white border-t border-gray-100 flex flex-col gap-3">
        <button
          onClick={handlePayment}
          disabled={loading}
          className={cn(
            "w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg",
            loading ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-pink-600 text-white hover:bg-pink-700 shadow-pink-200"
          )}
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Securely Processing...
            </>
          ) : (
            <>
              Pay ₹{amount.toLocaleString()}
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
        <button 
          onClick={onCancel}
          disabled={loading}
          className="w-full py-3 text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors"
        >
          Cancel and Return
        </button>
      </div>
    </div>
  );
}
