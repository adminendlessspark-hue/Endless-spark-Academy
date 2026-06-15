import React, { useState, useEffect } from 'react';
import { MessageSquare, Save, Activity, ShieldCheck, HelpCircle } from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useSettings } from '../hooks/useSettings';

export default function AdminWhatsAppSettings() {
  const { whatsappSettings: globalWhatsappSettings } = useSettings();
  const [enabled, setEnabled] = useState(false);
  const [targetNumber, setTargetNumber] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [testLoading, setTestLoading] = useState(false);

  useEffect(() => {
    if (globalWhatsappSettings) {
      setEnabled(globalWhatsappSettings.enabled || false);
      setTargetNumber(globalWhatsappSettings.targetNumber || '');
      setApiKey(globalWhatsappSettings.apiKey || '');
    }
  }, [globalWhatsappSettings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'whatsapp'), {
        enabled,
        targetNumber,
        apiKey,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      alert('WhatsApp settings saved successfully!');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'settings/whatsapp');
    } finally {
      setSaving(false);
    }
  };

  const handleTestNotification = async () => {
    if (!targetNumber || !apiKey) {
      alert('Please enter a target number and API key first.');
      return;
    }
    setTestLoading(true);
    try {
      const response = await fetch('/api/notify-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName: 'Test Student',
          studentEmail: 'test@example.com',
          studentPhone: targetNumber
        })
      });
      const data = await response.json();
      if (data.success) {
        alert('Test notification sent successfully!');
      } else {
        alert('Failed to send test notification: ' + (data.error || 'Unknown error'));
      }
    } catch (err: any) {
      alert('Error sending test notification: ' + err.message);
    } finally {
      setTestLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h4 className="font-bold text-gray-900 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-indigo-600" />
          WhatsApp Signup Notifications
        </h4>
        <button
          onClick={() => setEnabled(!enabled)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            enabled ? 'bg-indigo-600' : 'bg-gray-200'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              enabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      <div className="space-y-4">
        <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-start gap-3">
          <HelpCircle className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
          <div className="text-xs text-indigo-800 leading-relaxed">
            <p className="font-bold mb-1">How to set up for free:</p>
            <ol className="list-decimal ml-4 space-y-2">
              <li>
                <a 
                  href="https://wa.me/34644105023?text=I%20allow%20callmebot%20to%20send%20me%20messages" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-indigo-600 font-bold hover:underline"
                >
                  Click here to message +34 644 10 50 23 on WhatsApp
                </a>
              </li>
              <li>Send the pre-filled text: <code>I allow callmebot to send me messages</code></li>
              <li>You will receive your <strong>API Key</strong> instantly from the bot.</li>
              <li>Enter your phone number (with country code) and the API key below.</li>
            </ol>
            <p className="mt-2 text-[10px] text-indigo-600 italic">
              Note: If you don't receive a reply, try adding the number to your contacts first, or visit <a href="https://www.callmebot.com/blog/free-api-whatsapp-messages/" target="_blank" rel="noopener noreferrer" className="underline">callmebot.com</a> for help.
            </p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
            Target WhatsApp Number
          </label>
          <input
            type="text"
            placeholder="e.g., 919876543210 (Country code + number)"
            className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            value={targetNumber}
            onChange={(e) => setTargetNumber(e.target.value)}
          />
          <p className="text-[10px] text-gray-400 mt-1">The number that will receive student signup alerts.</p>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
            CallMeBot API Key
          </label>
          <input
            type="password"
            placeholder="Enter your API Key"
            className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center justify-center gap-2 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : <><Save className="w-4 h-4" /> Save Settings</>}
          </button>
          <button
            onClick={handleTestNotification}
            disabled={testLoading || !enabled}
            className="flex items-center justify-center gap-2 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {testLoading ? 'Testing...' : <><Activity className="w-4 h-4" /> Send Test</>}
          </button>
        </div>
      </div>
    </div>
  );
}
