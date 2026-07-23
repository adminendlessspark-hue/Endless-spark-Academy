import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Database, RefreshCw, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import firebaseConfig from '../../firebase-applet-config.json';

export default function GlobalNotification() {
  const [error, setError] = useState<string | null>(null);
  const [showDbSettings, setShowDbSettings] = useState(false);
  const [customDbId, setCustomDbId] = useState('');

  const defaultDbId = firebaseConfig.firestoreDatabaseId;
  const currentDbId = localStorage.getItem('firestore_db_id') || defaultDbId;

  const handleSwitchDb = (newId: string) => {
    localStorage.setItem('firestore_db_id', newId);
    window.location.reload();
  };

  useEffect(() => {
    const handleGlobalError = (event: ErrorEvent) => {
      let message = event.message || 'An unexpected error occurred';
      
      // Ignore benign WebSocket/HMR errors and firestore internal assertion stream failures
      if (message.includes('WebSocket') || 
          message.includes('closed without opened') || 
          message.includes('CLOSING state') ||
          message.includes('INTERNAL ASSERTION FAILED') ||
          message.includes('FIRESTORE') ||
          (event.error && (event.error.message || '').includes('INTERNAL ASSERTION FAILED'))) {
        event.preventDefault();
        event.stopImmediatePropagation();
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
      const reasonStr = event.reason?.toString() || '';
      const reasonStack = event.reason?.stack?.toString() || '';
      
      // Ignore benign WebSocket/HMR/Internal errors
      if (message.includes('WebSocket') || 
          message.includes('closed without opened') || 
          message.includes('CLOSING state') ||
          message.includes('INTERNAL ASSERTION FAILED') ||
          message.includes('FIRESTORE') ||
          reasonStr.includes('INTERNAL ASSERTION FAILED') ||
          reasonStack.includes('INTERNAL ASSERTION FAILED')) {
        event.preventDefault();
        event.stopImmediatePropagation();
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
      setError("Database Daily Quota Exceeded: The Google Cloud Firebase free-tier daily database read units are consumed for today. The application is running in standard Offline Sandbox Mode with local fallback data. Quotas reset daily.");
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
        <div className="bg-white border-2 border-red-100 rounded-2xl shadow-2xl p-4 flex flex-col gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-red-50 rounded-xl">
              <AlertCircle className="w-5 h-5 text-red-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900 mb-1">Connection Alert</p>
              <div className="text-xs text-gray-600 max-h-36 overflow-y-auto break-words whitespace-pre-wrap">
                {error}
              </div>
              {error.includes("Quota") && (
                <a
                  href={`https://console.firebase.google.com/project/${firebaseConfig.projectId}/firestore/databases/${firebaseConfig.firestoreDatabaseId}/data?openUpgradeDialog=true`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block text-xs font-semibold text-indigo-600 hover:text-indigo-800 underline"
                >
                  Manage/Upgrade Database Quota in Firebase Console &rarr;
                </a>
              )}
            </div>
            <button 
              onClick={() => setError(null)}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors shrink-0"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          <div className="border-t border-gray-100 pt-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-gray-500 flex items-center gap-1 min-w-0">
                <Database className="w-3 h-3 text-indigo-500 shrink-0" />
                <span className="truncate">Active DB: <code className="font-mono text-gray-700 bg-gray-50 px-1 py-0.5 rounded text-[10px]">{currentDbId}</code></span>
              </span>
              <button
                onClick={() => setShowDbSettings(!showDbSettings)}
                className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5 transition-colors shrink-0"
              >
                <Settings className="w-3 h-3" />
                Configure
              </button>
            </div>

            {currentDbId !== '(default)' && (
              <button
                onClick={() => handleSwitchDb('(default)')}
                className="mt-2.5 w-full py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-all"
              >
                <RefreshCw className="w-3 h-3" />
                Switch to standard '(default)' database
              </button>
            )}

            {currentDbId === '(default)' && currentDbId !== defaultDbId && (
              <button
                onClick={() => handleSwitchDb(defaultDbId)}
                className="mt-2.5 w-full py-1.5 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
              >
                <RefreshCw className="w-3 h-3" />
                Reset to Sandbox database
              </button>
            )}

            {showDbSettings && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-3 bg-gray-50 p-2.5 rounded-xl border border-gray-100"
              >
                <p className="text-[11px] font-semibold text-gray-700 mb-1.5">Set Custom Database ID</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. (default) or custom-id"
                    value={customDbId}
                    onChange={(e) => setCustomDbId(e.target.value)}
                    className="flex-1 bg-white border border-gray-200 rounded-lg px-2 py-1 text-xs font-mono focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    onClick={() => handleSwitchDb(customDbId.trim())}
                    disabled={!customDbId.trim()}
                    className="px-2.5 py-1 bg-gray-900 hover:bg-black text-white rounded-lg text-xs font-semibold disabled:opacity-50 transition-colors"
                  >
                    Save
                  </button>
                </div>
                <p className="text-[10px] text-gray-500 mt-1.5 leading-relaxed">
                  If you upgraded your Firebase project to the Blaze plan, your real imported data is likely saved in the default database. Enter <code className="font-mono bg-gray-200 px-0.5 rounded text-gray-800">(default)</code> above.
                </p>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
