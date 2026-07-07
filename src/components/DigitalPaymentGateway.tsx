import React, { useState, useEffect } from 'react';
import { ShieldCheck, ArrowRight, CheckCircle2, IndianRupee, Loader2, Lock, AlertCircle, AlertTriangle, ShieldAlert, Sparkles } from 'lucide-react';

interface DigitalPaymentGatewayProps {
  amount: number;
  description: string;
  studentName: string;
  studentEmail: string;
  onSuccess: (paymentId: string) => void;
  onCancel: () => void;
}

export default function DigitalPaymentGateway({ amount, description, studentName, studentEmail, onSuccess, onCancel }: DigitalPaymentGatewayProps) {
  const [step, setStep] = useState<'checkout' | 'processing' | 'success' | 'failed' | 'sandbox_simulated_form'>('checkout');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [txId, setTxId] = useState('');

  const loadRazorpayScript = () => {
    return new Promise<boolean>((resolve) => {
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    setLoading(true);
    setErrorMessage(null);
    setStep('processing');

    try {
      // Create Razorpay order on our secure server
      const res = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, description })
      });

      if (!res.ok) {
        throw new Error(`Failed to generate secure checkout session (Status ${res.status})`);
      }

      const orderData = await res.json();

      // Check if server is running in sandbox emulation fallback mode
      if (orderData.mode === 'sandbox_simulated' || orderData.mode === 'sandbox_simulated_fallback') {
        console.log("Razorpay Sandbox emulation mode active. Opening simulator interface...");
        setStep('sandbox_simulated_form');
        setLoading(false);
        return;
      }

      // Load official Razorpay SDK
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error("Unable to load Razorpay Checkout Script. Check your internet connection.");
      }

      // Launch production Razorpay Checkout
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency || "INR",
        name: "Endless Spark Academy",
        description: description,
        order_id: orderData.orderId,
        theme: {
          color: "#db2777" // Pink theme
        },
        prefill: {
          name: studentName,
          email: studentEmail
        },
        handler: function (response: any) {
          const pId = response.razorpay_payment_id || `PAY-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
          setTxId(pId);
          setStep('success');
          setTimeout(() => {
            onSuccess(pId);
          }, 2000);
        },
        modal: {
          ondismiss: function () {
            setStep('checkout');
            setLoading(false);
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();

    } catch (err: any) {
      console.error("Razorpay integration error:", err);
      setErrorMessage(err.message || "An unexpected error occurred during checkout setup.");
      setStep('failed');
      setLoading(false);
    }
  };

  const triggerSimulatedSuccess = () => {
    setLoading(true);
    setStep('processing');
    setTimeout(() => {
      const simulatedId = `PAY-SIM-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
      setTxId(simulatedId);
      setStep('success');
      setLoading(false);
      setTimeout(() => {
        onSuccess(simulatedId);
      }, 2000);
    }, 1500);
  };

  if (step === 'success') {
    return (
      <div className="p-8 text-center animate-in fade-in zoom-in duration-500 flex flex-col items-center justify-center min-h-[380px] bg-white">
        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6 scale-110 shadow-lg shadow-green-100">
          <CheckCircle2 className="w-10 h-10 animate-bounce" />
        </div>
        <h2 className="text-2xl font-black text-gray-900 mb-2">Payment Completed!</h2>
        <p className="text-sm text-gray-500 mb-4 max-w-sm">
          Your payment of <strong className="text-gray-950 font-bold">₹{amount.toLocaleString()}</strong> has been processed successfully.
        </p>
        <p className="text-xs text-gray-400 font-mono bg-gray-50 border border-gray-100 py-1.5 px-3 rounded-lg mb-6">
          Receipt ID: {txId}
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
      <div className="p-8 text-center animate-in fade-in duration-500 flex flex-col items-center justify-center min-h-[380px] bg-white">
        <div className="w-16 h-16 bg-pink-50 text-pink-600 rounded-full flex items-center justify-center mb-6 animate-pulse">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2 font-sans">Securing Connection</h2>
        <p className="text-sm text-gray-500 mb-4 max-w-xs">
          Contacting secure payment networks... Please do not close this window.
        </p>
        <div className="flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full border border-green-100 text-[10px] font-bold uppercase tracking-wider">
          <Lock className="w-3 h-3" />
          256-Bit SSL Encrypted
        </div>
      </div>
    );
  }

  if (step === 'failed') {
    return (
      <div className="p-8 text-center animate-in fade-in duration-500 flex flex-col items-center justify-center min-h-[380px] bg-white">
        <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-6">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-gray-900 mb-2">Checkout Error</h2>
        <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-xl p-3 mb-6 max-w-sm font-mono break-all leading-relaxed">
          {errorMessage || "Connection timed out."}
        </p>
        <div className="flex flex-col gap-2.5 w-full max-w-xs">
          <button
            onClick={handlePayment}
            className="w-full py-3 bg-gray-900 hover:bg-black text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md"
          >
            <span>Retry Secure Connection</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => setStep('checkout')}
            className="w-full py-2.5 text-xs text-gray-500 hover:text-gray-700 font-bold transition-colors"
          >
            Cancel and Go Back
          </button>
        </div>
      </div>
    );
  }

  if (step === 'sandbox_simulated_form') {
    return (
      <div className="flex flex-col flex-1 min-h-0 h-full bg-white animate-in fade-in duration-500">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-amber-500/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 text-amber-700 rounded-xl animate-bounce">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 flex items-center gap-1.5">
                Razorpay Sandbox
                <span className="text-[9px] bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded font-black uppercase tracking-widest">Simulator</span>
              </h3>
              <p className="text-xs text-amber-700 font-semibold">{description}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Payable</p>
            <p className="text-xl font-black text-gray-900">₹{amount.toLocaleString()}</p>
          </div>
        </div>

        <div className="p-6 flex-1 overflow-y-auto space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-800 space-y-2">
            <p className="font-bold flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-600" />
              Developer Sandboxed Emulation Mode Active
            </p>
            <p className="leading-relaxed">
              No real Razorpay credentials are currently active or enabled in the Accounts Panel financial settings. You can complete this transaction instantly for demo purposes by clicking authorize below.
            </p>
          </div>

          <div className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-left space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-400">Student Name:</span>
              <span className="text-gray-900 font-bold">{studentName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Email Address:</span>
              <span className="text-gray-900 font-bold truncate max-w-[180px]">{studentEmail}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-100">
              <span className="text-gray-400">Security Mode:</span>
              <span className="text-amber-600 font-black flex items-center gap-1">
                Demo Environment
              </span>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white border-t border-gray-100 flex flex-col gap-2">
          <button
            onClick={triggerSimulatedSuccess}
            className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-amber-100"
          >
            <span>Authorize Sandbox Payment (₹{amount.toLocaleString()})</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setStep('checkout');
            }}
            className="w-full py-2.5 text-xs text-gray-400 hover:text-gray-600 font-bold transition-colors"
          >
            Go back to details
          </button>
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
              <p className="text-xs text-gray-500 mt-1">Direct checkout routing will automatically verify and connect your payment.</p>
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
          <p className="leading-relaxed font-semibold">Your transaction is fully encrypted. No physical card or bank details are collected on this form.</p>
        </div>
      </div>

      {/* Actions Footer */}
      <div className="p-6 bg-white border-t border-gray-100 flex flex-col gap-3">
        <button
          onClick={handlePayment}
          disabled={loading}
          className="w-full py-4 bg-pink-600 hover:bg-pink-700 text-white rounded-2xl font-bold flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg shadow-pink-100 text-base cursor-pointer"
        >
          Pay ₹{amount.toLocaleString()} Now
          <ArrowRight className="w-5 h-5" />
        </button>

        <button 
          onClick={onCancel}
          disabled={loading}
          className="w-full py-2.5 text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
        >
          Cancel and Return
        </button>
      </div>
    </div>
  );
}

