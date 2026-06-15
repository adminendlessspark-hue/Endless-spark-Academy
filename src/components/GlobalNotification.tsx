import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function GlobalNotification() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleGlobalError = (event: ErrorEvent) => {
      let message = event.message || 'An unexpected error occurred';
      
      // Ignore benign WebSocket/HMR errors
      if (message.includes('WebSocket') || 
          message.includes('closed without opened') || 
          message.includes('CLOSING state')) {
        return;
      }
      
      try {
        if (message.includes('{"error"')) {
          const rawJson = message.substring(message.indexOf('{'));
          const parsed = JSON.parse(rawJson);
          if (parsed.error) {
            if (parsed.error.includes('Quota limit exceeded') || parsed.error.includes('Quota exceeded')) {
              setError("Database Daily Quota Exceeded. The application is running in standard Offline Sandbox Mode.");
              return;
            }
            message = parsed.error;
          }
        }
      } catch (e) {}

      if (message.includes('Quota limit exceeded') || message.includes('Quota exceeded')) {
        setError("Database Daily Quota Exceeded. The application is running in standard Offline Sandbox Mode.");
        return;
      }
      
      setError(message);
    };

    const handlePromiseRejection = (event: PromiseRejectionEvent) => {
      let message = (event.reason?.message || event.reason || 'Unhandled Promise Rejection').toString();
      
      // Ignore benign WebSocket/HMR/Internal errors
      if (message.includes('WebSocket') || 
          message.includes('closed without opened') || 
          message.includes('CLOSING state') ||
          message.includes('INTERNAL ASSERTION FAILED')) {
        return;
      }
      
      try {
        if (message.includes('{"error"')) {
          const rawJson = message.substring(message.indexOf('{'));
          const parsed = JSON.parse(rawJson);
          if (parsed.error) {
            if (parsed.error.includes('Quota limit exceeded') || parsed.error.includes('Quota exceeded')) {
              setError("Database Daily Quota Exceeded. The application is running in standard Offline Sandbox Mode.");
              return;
            }
            message = parsed.error;
          }
        }
      } catch (e) {}

      if (message.includes('Quota limit exceeded') || message.includes('Quota exceeded')) {
        setError("Database Daily Quota Exceeded. The application is running in standard Offline Sandbox Mode.");
        return;
      }
      
      setError(message);
    };

    const handleQuotaExceededEvent = () => {
      setError("Database Daily Quota Exceeded: The Google Cloud Firebase free-tier daily database units are consumed. The application is now fully running in Offline Sandbox Mode with cached structures.");
    };

    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handlePromiseRejection);
    window.addEventListener('firestore_quota_exceeded', handleQuotaExceededEvent);

    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handlePromiseRejection);
      window.removeEventListener('firestore_quota_exceeded', handleQuotaExceededEvent);
    };
  }, []);

  if (!error) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.95 }}
        className="fixed bottom-6 left-6 right-6 md:left-auto md:right-6 md:w-96 z-[9999]"
      >
        <div className="bg-white border-2 border-red-100 rounded-2xl shadow-2xl p-4 flex items-start gap-3">
          <div className="p-2 bg-red-50 rounded-xl">
            <AlertCircle className="w-5 h-5 text-red-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900 mb-1">Connection Alert</p>
            <p className="text-xs text-gray-600 truncate break-words">
              {error}
            </p>
          </div>
          <button 
            onClick={() => setError(null)}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
