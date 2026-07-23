import React, { useState, useEffect } from 'react';
import { MessageSquare, Save, Activity, ShieldCheck, HelpCircle, ExternalLink, CheckCircle2, AlertCircle, Smartphone, Video, Copy, Share2, Edit3, RotateCcw } from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useSettings } from '../hooks/useSettings';
import { 
  DEFAULT_GENERAL_TEMPLATE, 
  DEFAULT_COURSE_PROMO_TEMPLATE, 
  DEFAULT_WEBINAR_TEMPLATE, 
  DEFAULT_REMOTE_LEARNING_TEMPLATE,
  resolveTemplateText 
} from '../utils/whatsappTemplates';

export default function AdminWhatsAppSettings() {
  const { whatsappSettings: globalWhatsappSettings } = useSettings();
  const [enabled, setEnabled] = useState(false);
  const [targetNumber, setTargetNumber] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [coursePromotionVideoUrl, setCoursePromotionVideoUrl] = useState('https://youtu.be/vMl8FHK75HM');
  
  // Custom Editable WhatsApp Templates State
  const [customGeneralTemplate, setCustomGeneralTemplate] = useState('');
  const [customCoursePromoTemplate, setCustomCoursePromoTemplate] = useState('');
  const [customWebinarTemplate, setCustomWebinarTemplate] = useState('');
  const [customRemoteLearningTemplate, setCustomRemoteLearningTemplate] = useState('');

  const [activeTemplateTab, setActiveTemplateTab] = useState<'general' | 'coursePromo' | 'webinar' | 'remote'>('general');

  const [saving, setSaving] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedTemplate, setCopiedTemplate] = useState(false);

  useEffect(() => {
    if (globalWhatsappSettings) {
      setEnabled(globalWhatsappSettings.enabled || false);
      setTargetNumber(globalWhatsappSettings.targetNumber || '');
      setApiKey(globalWhatsappSettings.apiKey || '');
      if (globalWhatsappSettings.coursePromotionVideoUrl) {
        setCoursePromotionVideoUrl(globalWhatsappSettings.coursePromotionVideoUrl);
      }
      setCustomGeneralTemplate(globalWhatsappSettings.customGeneralTemplate || '');
      setCustomCoursePromoTemplate(globalWhatsappSettings.customCoursePromoTemplate || '');
      setCustomWebinarTemplate(globalWhatsappSettings.customWebinarTemplate || '');
      setCustomRemoteLearningTemplate(globalWhatsappSettings.customRemoteLearningTemplate || '');
    }
  }, [globalWhatsappSettings]);

  const handleSave = async () => {
    setSaving(true);
    setStatusMessage(null);
    const cleanedNumber = targetNumber.replace(/[^\d]/g, '');
    try {
      await setDoc(doc(db, 'settings', 'whatsapp'), {
        enabled,
        targetNumber: cleanedNumber,
        apiKey: apiKey.trim(),
        coursePromotionVideoUrl: coursePromotionVideoUrl.trim() || 'https://youtu.be/vMl8FHK75HM',
        customGeneralTemplate: customGeneralTemplate.trim(),
        customCoursePromoTemplate: customCoursePromoTemplate.trim(),
        customWebinarTemplate: customWebinarTemplate.trim(),
        customRemoteLearningTemplate: customRemoteLearningTemplate.trim(),
        updatedAt: new Date().toISOString()
      }, { merge: true });
      setStatusMessage({ type: 'success', text: 'WhatsApp API & Customizable Message Templates saved successfully!' });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'settings/whatsapp');
      setStatusMessage({ type: 'error', text: 'Failed to save settings.' });
    } finally {
      setSaving(false);
    }
  };

  const handleTestNotification = async () => {
    const cleanedNumber = targetNumber.replace(/[^\d]/g, '');
    if (!cleanedNumber || !apiKey) {
      setStatusMessage({ type: 'error', text: 'Please enter a target phone number and CallMeBot API key first.' });
      return;
    }
    setTestLoading(true);
    setStatusMessage(null);
    try {
      const response = await fetch('/api/notify-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName: 'Demo Lead / Student',
          studentEmail: 'student@demo.com',
          studentPhone: cleanedNumber
        })
      });
      const data = await response.json();
      if (data.success) {
        setStatusMessage({ type: 'success', text: 'Test WhatsApp message sent! Check your WhatsApp chat.' });
      } else {
        setStatusMessage({ type: 'error', text: 'Failed to send WhatsApp message: ' + (data.error || 'Unknown error. Check number format & API key.') });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: 'Error calling notification endpoint: ' + err.message });
    } finally {
      setTestLoading(false);
    }
  };

  const openCallmebotActivation = () => {
    const cleanedNumber = targetNumber.replace(/[^\d]/g, '');
    const waUrl = cleanedNumber 
      ? `https://api.whatsapp.com/send?phone=34644418720&text=${encodeURIComponent('I allow callmebot to send me messages')}`
      : `https://wa.me/34644418720?text=${encodeURIComponent('I allow callmebot to send me messages')}`;
    window.open(waUrl, '_blank', 'width=600,height=700');
  };

  return (
    <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-2xl">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-gray-900 text-base">
              WhatsApp Automated Alerts (CallMeBot API)
            </h4>
            <p className="text-xs text-gray-500">
              Receive instant automated notifications on your personal or business WhatsApp when new students register or request info.
            </p>
          </div>
        </div>
        <button
          onClick={() => setEnabled(!enabled)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            enabled ? 'bg-emerald-600' : 'bg-gray-200'
          }`}
          title={enabled ? 'Alerts Enabled' : 'Alerts Disabled'}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              enabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {statusMessage && (
        <div className={`p-3.5 rounded-xl text-xs font-medium flex items-center gap-2 ${
          statusMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
        }`}>
          {statusMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Step by Step Activation Guide */}
      <div className="p-4 bg-emerald-50/60 border border-emerald-100 rounded-2xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Quick 1-Minute Setup Instructions
          </div>
          <button
            onClick={openCallmebotActivation}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-colors"
          >
            <Smartphone className="w-3.5 h-3.5" />
            Open WhatsApp Activation <ExternalLink className="w-3 h-3" />
          </button>
        </div>
        
        <ol className="list-decimal ml-5 text-xs text-emerald-900/90 space-y-1.5 leading-relaxed">
          <li>
            Click the <strong>Open WhatsApp Activation</strong> button above to open WhatsApp on your phone or web.
          </li>
          <li>
            Send the pre-filled message: <code className="bg-emerald-100 text-emerald-900 px-1.5 py-0.5 rounded font-mono text-[11px]">I allow callmebot to send me messages</code> to <strong>+34 644 41 87 20</strong>.
          </li>
          <li>
            CallMeBot will immediately send back a reply containing your unique <strong>API Key</strong>.
          </li>
          <li>
            Paste your phone number and the API Key below, click <strong>Save Settings</strong>, and test it!
          </li>
        </ol>

        <div className="pt-2 border-t border-emerald-200/60 mt-2">
          <div className="text-[11px] font-bold text-amber-900 flex items-center gap-1.5 mb-1">
            <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
            Didn't receive a reply with your API key? Try these 3 quick fixes:
          </div>
          <ul className="list-disc ml-5 text-[11px] text-amber-900/90 space-y-1">
            <li>
              <strong>Add to Phone Contacts First:</strong> Save <code>+34 644 41 87 20</code> as a contact (e.g. "CallMeBot") on your phone. WhatsApp often blocks bot replies from unsaved contacts.
            </li>
            <li>
              <strong>Check Message Text:</strong> Make sure the message is sent exactly as: <code>I allow callmebot to send me messages</code>
            </li>
            <li>
              <strong>Get API Key via Official Web Page:</strong> If WhatsApp bot is delayed, visit <a href="https://www.callmebot.com/blog/free-api-whatsapp-messages/" target="_blank" rel="noopener noreferrer" className="underline font-semibold text-amber-900 hover:text-amber-700">callmebot.com official page</a> or try sending the activation message again after 2 minutes.
            </li>
          </ul>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
            Target WhatsApp Number
          </label>
          <input
            type="text"
            placeholder="e.g. 919876543210 (Country code + digits, no + or spaces)"
            className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-mono"
            value={targetNumber}
            onChange={(e) => setTargetNumber(e.target.value)}
          />
          <p className="text-[11px] text-gray-500 mt-1">
            The WhatsApp account where admin signup notifications will be delivered.
          </p>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
            CallMeBot API Key
          </label>
          <input
            type="password"
            placeholder="Enter the API Key received from CallMeBot"
            className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-mono"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
        </div>

        {/* Course Promotion Video URL & Custom Message Templates */}
        <div className="p-5 bg-white border border-gray-200 rounded-3xl space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2 text-emerald-900 font-extrabold text-sm uppercase tracking-wider">
              <Edit3 className="w-4 h-4 text-emerald-600" />
              Customize WhatsApp Marketing Message Templates
            </div>
            <span className="text-[11px] bg-emerald-50 text-emerald-700 font-bold px-2.5 py-1 rounded-full border border-emerald-200">
              Admin Access Enabled
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1.5">
              <Video className="w-3.5 h-3.5 text-emerald-600" />
              Global Course Promotion Video URL <span className="text-emerald-600">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. https://youtu.be/vMl8FHK75HM"
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-mono"
              value={coursePromotionVideoUrl}
              onChange={(e) => setCoursePromotionVideoUrl(e.target.value)}
            />
            <p className="text-[11px] text-gray-500 mt-1">
              Use <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-800">{`{promoVideoUrl}`}</code> inside templates to auto-insert this video link at the top.
            </p>
          </div>

          {/* Template Selector Tabs */}
          <div className="pt-2">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Select WhatsApp Template to Edit:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setActiveTemplateTab('general')}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border text-left flex flex-col justify-between ${
                  activeTemplateTab === 'general'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                }`}
              >
                <span>1. General Inquiry</span>
                <span className={`text-[10px] font-normal ${activeTemplateTab === 'general' ? 'text-emerald-100' : 'text-gray-400'}`}>Full App Features</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTemplateTab('coursePromo')}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border text-left flex flex-col justify-between ${
                  activeTemplateTab === 'coursePromo'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                }`}
              >
                <span>2. What You Will Master</span>
                <span className={`text-[10px] font-normal ${activeTemplateTab === 'coursePromo' ? 'text-emerald-100' : 'text-gray-400'}`}>Course Promo & Repro</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTemplateTab('webinar')}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border text-left flex flex-col justify-between ${
                  activeTemplateTab === 'webinar'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                }`}
              >
                <span>3. Masterclass Pass</span>
                <span className={`text-[10px] font-normal ${activeTemplateTab === 'webinar' ? 'text-emerald-100' : 'text-gray-400'}`}>Seat Invitation</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTemplateTab('remote')}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border text-left flex flex-col justify-between ${
                  activeTemplateTab === 'remote'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                }`}
              >
                <span>4. Remote Engineering</span>
                <span className={`text-[10px] font-normal ${activeTemplateTab === 'remote' ? 'text-emerald-100' : 'text-gray-400'}`}>Lab Walkthroughs</span>
              </button>
            </div>
          </div>

          {/* Active Template Textarea Editor */}
          <div className="bg-slate-50/70 border border-slate-200 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                <Edit3 className="w-3.5 h-3.5 text-emerald-600" />
                {activeTemplateTab === 'general' && 'Editing: General Inquiry & App Features Template'}
                {activeTemplateTab === 'coursePromo' && 'Editing: Course Promotion & "What You Will Master" Template'}
                {activeTemplateTab === 'webinar' && 'Editing: Masterclass Seat Pass Invitation Template'}
                {activeTemplateTab === 'remote' && 'Editing: Remote Engineering Learning Template'}
              </span>
              <button
                type="button"
                onClick={() => {
                  if (activeTemplateTab === 'general') setCustomGeneralTemplate(DEFAULT_GENERAL_TEMPLATE);
                  if (activeTemplateTab === 'coursePromo') setCustomCoursePromoTemplate(DEFAULT_COURSE_PROMO_TEMPLATE);
                  if (activeTemplateTab === 'webinar') setCustomWebinarTemplate(DEFAULT_WEBINAR_TEMPLATE);
                  if (activeTemplateTab === 'remote') setCustomRemoteLearningTemplate(DEFAULT_REMOTE_LEARNING_TEMPLATE);
                }}
                className="text-[11px] font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 px-2 py-1 rounded bg-rose-50 hover:bg-rose-100 transition"
              >
                <RotateCcw className="w-3 h-3" /> Restore Default Text
              </button>
            </div>

            {activeTemplateTab === 'general' && (
              <textarea
                rows={12}
                className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-800 leading-relaxed outline-none focus:ring-2 focus:ring-emerald-500 custom-scrollbar"
                placeholder="Type your custom WhatsApp General Inquiry template here..."
                value={customGeneralTemplate || DEFAULT_GENERAL_TEMPLATE}
                onChange={(e) => setCustomGeneralTemplate(e.target.value)}
              />
            )}

            {activeTemplateTab === 'coursePromo' && (
              <textarea
                rows={10}
                className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-800 leading-relaxed outline-none focus:ring-2 focus:ring-emerald-500 custom-scrollbar"
                placeholder="Type your custom Course Promotion template here..."
                value={customCoursePromoTemplate || DEFAULT_COURSE_PROMO_TEMPLATE}
                onChange={(e) => setCustomCoursePromoTemplate(e.target.value)}
              />
            )}

            {activeTemplateTab === 'webinar' && (
              <textarea
                rows={10}
                className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-800 leading-relaxed outline-none focus:ring-2 focus:ring-emerald-500 custom-scrollbar"
                placeholder="Type your custom Masterclass Pass invitation template here..."
                value={customWebinarTemplate || DEFAULT_WEBINAR_TEMPLATE}
                onChange={(e) => setCustomWebinarTemplate(e.target.value)}
              />
            )}

            {activeTemplateTab === 'remote' && (
              <textarea
                rows={10}
                className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-800 leading-relaxed outline-none focus:ring-2 focus:ring-emerald-500 custom-scrollbar"
                placeholder="Type your custom Remote Engineering template here..."
                value={customRemoteLearningTemplate || DEFAULT_REMOTE_LEARNING_TEMPLATE}
                onChange={(e) => setCustomRemoteLearningTemplate(e.target.value)}
              />
            )}

            <div className="p-2.5 bg-amber-50 border border-amber-200/60 rounded-xl text-[11px] text-amber-900 leading-normal flex items-start gap-2">
              <HelpCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>Dynamic Placeholders:</strong> Use <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">{`{promoVideoUrl}`}</code> for video URL, <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">{`{inquiryUrl}`}</code> for inquiry link, <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">{`{courseList}`}</code> for dynamic course catalog, and <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">{`[Name]`}</code> / <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">{`[WebinarTitle]`}</code> for lead names.
              </div>
            </div>

            {/* Resolved Preview Box */}
            <div className="pt-2 border-t border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                  <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                  Live WhatsApp Message Preview (as sent to student):
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      let raw = DEFAULT_GENERAL_TEMPLATE;
                      if (activeTemplateTab === 'general') raw = customGeneralTemplate || DEFAULT_GENERAL_TEMPLATE;
                      if (activeTemplateTab === 'coursePromo') raw = customCoursePromoTemplate || DEFAULT_COURSE_PROMO_TEMPLATE;
                      if (activeTemplateTab === 'webinar') raw = customWebinarTemplate || DEFAULT_WEBINAR_TEMPLATE;
                      if (activeTemplateTab === 'remote') raw = customRemoteLearningTemplate || DEFAULT_REMOTE_LEARNING_TEMPLATE;

                      const msg = resolveTemplateText(raw, raw, {
                        promoVideoUrl: coursePromotionVideoUrl || 'https://youtu.be/vMl8FHK75HM',
                        webinarTitle: 'Printing & Packaging Masterclass',
                        webinarDate: 'Upcoming Batch',
                        webinarTime: '10:00 AM IST',
                        name: 'Student Name',
                        ticketCode: 'ES-10293'
                      });
                      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, '_blank');
                    }}
                    className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-[11px] font-extrabold hover:bg-emerald-700 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <MessageSquare className="w-3 h-3" />
                    Test Share on WhatsApp
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      let raw = DEFAULT_GENERAL_TEMPLATE;
                      if (activeTemplateTab === 'general') raw = customGeneralTemplate || DEFAULT_GENERAL_TEMPLATE;
                      if (activeTemplateTab === 'coursePromo') raw = customCoursePromoTemplate || DEFAULT_COURSE_PROMO_TEMPLATE;
                      if (activeTemplateTab === 'webinar') raw = customWebinarTemplate || DEFAULT_WEBINAR_TEMPLATE;
                      if (activeTemplateTab === 'remote') raw = customRemoteLearningTemplate || DEFAULT_REMOTE_LEARNING_TEMPLATE;

                      const msg = resolveTemplateText(raw, raw, {
                        promoVideoUrl: coursePromotionVideoUrl || 'https://youtu.be/vMl8FHK75HM',
                        webinarTitle: 'Printing & Packaging Masterclass',
                        webinarDate: 'Upcoming Batch',
                        webinarTime: '10:00 AM IST',
                        name: 'Student Name',
                        ticketCode: 'ES-10293'
                      });
                      navigator.clipboard.writeText(msg);
                      setCopiedTemplate(true);
                      setTimeout(() => setCopiedTemplate(false), 2000);
                    }}
                    className="px-2.5 py-1 bg-gray-200 text-gray-800 rounded-lg text-[11px] font-bold hover:bg-gray-300 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    {copiedTemplate ? 'Copied!' : 'Copy Preview'}
                  </button>
                </div>
              </div>

              <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 font-mono text-[11px] text-slate-800 whitespace-pre-wrap leading-relaxed shadow-xs max-h-56 overflow-y-auto custom-scrollbar">
                {(() => {
                  let raw = DEFAULT_GENERAL_TEMPLATE;
                  if (activeTemplateTab === 'general') raw = customGeneralTemplate || DEFAULT_GENERAL_TEMPLATE;
                  if (activeTemplateTab === 'coursePromo') raw = customCoursePromoTemplate || DEFAULT_COURSE_PROMO_TEMPLATE;
                  if (activeTemplateTab === 'webinar') raw = customWebinarTemplate || DEFAULT_WEBINAR_TEMPLATE;
                  if (activeTemplateTab === 'remote') raw = customRemoteLearningTemplate || DEFAULT_REMOTE_LEARNING_TEMPLATE;

                  return resolveTemplateText(raw, raw, {
                    promoVideoUrl: coursePromotionVideoUrl || 'https://youtu.be/vMl8FHK75HM',
                    webinarTitle: 'Printing & Packaging Masterclass',
                    webinarDate: 'Upcoming Batch',
                    webinarTime: '10:00 AM IST',
                    name: 'Student Name',
                    ticketCode: 'ES-10293'
                  });
                })()}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center justify-center gap-2 py-3 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : <><Save className="w-4 h-4" /> Save Settings</>}
          </button>
          <button
            onClick={handleTestNotification}
            disabled={testLoading || !enabled}
            className="flex items-center justify-center gap-2 py-3 bg-white border border-gray-200 text-gray-800 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {testLoading ? 'Sending...' : <><Activity className="w-4 h-4 text-emerald-600" /> Send Test Alert</>}
          </button>
        </div>
      </div>
    </div>
  );
}

