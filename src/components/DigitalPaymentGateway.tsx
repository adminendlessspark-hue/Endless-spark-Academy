import React, { useState } from 'react';
import { ShieldCheck, ArrowRight, CheckCircle2, IndianRupee, Loader2, Lock } from 'lucide-react';

interface DigitalPaymentGatewayProps {
  amount: number;
  description: string;
  studentName: string;
  studentEmail: string;
  onSuccess: (paymentId: string) => void;
  onCancel: () => void;
}

export default function DigitalPaymentGateway({ amount, description, studentName, studentEmail, onSuccess, onCancel }: DigitalPaymentGatewayProps) {
  const [step, setStep] = useState<'checkout' | 'processing' | 'success'>('checkout');
  const [loading, setLoading] = useState(false);

  const handlePayment = () => {
    setLoading(true);
    setStep('processing');
    
    // Simulate secure network transaction processing
    setTimeout(() => {
      setStep('success');
      setLoading(false);
      
      // Fire success callback after success checkmark animation
      setTimeout(() => {
        const txId = `ESP-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
        onSuccess(txId);
      }, 2000);
    }, 1500);
  };

  if (step === 'success') {
    return (
      <div className="p-8 text-center animate-in fade-in zoom-in duration-500 flex flex-col items-center justify-center min-h-[350px]">
        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6 scale-110 shadow-lg shadow-green-100">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-black text-gray-900 mb-2">Payment Completed!</h2>
        <p className="text-sm text-gray-500 mb-6 max-w-sm">
          Your payment of <strong className="text-gray-950 font-bold">₹{amount.toLocaleString()}</strong> has been processed successfully.
        </p>
        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col items-center gap-2 w-full max-w-xs animate-pulse">
          <Loader2 className="w-5 h-5 text-pink-600 animate-spin" />
          <p className="text-[10px] text-gray-400 font-extrabold uppercase tracking-widest">Registering your enrollment...</p>
        </div>
      </div>
    );
  }

  if (step === 'processing') {
    return (
      <div className="p-8 text-center animate-in fade-in duration-500 flex flex-col items-center justify-center min-h-[350px]">
        <div className="w-16 h-16 bg-pink-50 text-pink-600 rounded-full flex items-center justify-center mb-6 animate-pulse">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2 font-sans">Verifying Transaction</h2>
        <p className="text-sm text-gray-500 mb-4 max-w-xs">
          Connecting to secure server... Please do not close this window.
        </p>
        <div className="flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full border border-green-100 text-[10px] font-bold uppercase tracking-wider">
          <Lock className="w-3 h-3" />
          256-Bit SSL Encrypted
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 h-full bg-white">
      {/* Header */}
      <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-pink-100 text-pink-600 rounded-xl">
            <IndianRupee className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Digital Payment</h3>
            <p className="text-xs text-gray-500">{description}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Amount Payable</p>
          <p className="text-xl font-black text-gray-900">₹{amount.toLocaleString()}</p>
        </div>
      </div>

      {/* Body Details */}
      <div className="p-6 flex-1 overflow-y-auto space-y-6">
        <div className="p-6 bg-pink-50/30 rounded-3xl border border-pink-100/50 space-y-4">
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="p-3 bg-pink-100 text-pink-600 rounded-2xl">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <p className="text-base font-bold text-gray-900">Ready to Complete Enrollment</p>
              <p className="text-xs text-gray-500 mt-1">One-click direct routing is verified. Click the button below to process payment.</p>
            </div>
          </div>

          <div className="w-full p-4 bg-white border border-gray-100 rounded-2xl text-left space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-gray-400 font-medium">Student Name:</span>
              <span className="text-gray-900 font-bold">{studentName}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-400 font-medium">Email Address:</span>
              <span className="text-gray-900 font-bold truncate max-w-[180px]">{studentEmail}</span>
            </div>
            <div className="flex justify-between text-xs pt-2 border-t border-gray-50">
              <span className="text-gray-400 font-medium">Connection Gateway:</span>
              <span className="text-green-600 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping" />
                Secure Gateway Active
              </span>
            </div>
          </div>
        </div>

        <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100/50 flex gap-3 text-xs text-blue-800">
          <ShieldCheck className="w-5 h-5 flex-shrink-0 text-blue-600" />
          <p className="leading-relaxed">Your transaction is fully encrypted. No physical card or bank details are collected on this form.</p>
        </div>
      </div>

      {/* Actions Footer */}
      <div className="p-6 bg-white border-t border-gray-100 flex flex-col gap-3">
        <button
          onClick={handlePayment}
          disabled={loading}
          className="w-full py-4 bg-pink-600 hover:bg-pink-700 text-white rounded-2xl font-bold flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg shadow-pink-100 text-base"
        >
          Pay ₹{amount.toLocaleString()} Now
          <ArrowRight className="w-5 h-5" />
        </button>

        <button 
          onClick={onCancel}
          disabled={loading}
          className="w-full py-2.5 text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors"
        >
          Cancel and Return
        </button>
      </div>
    </div>
  );
}
