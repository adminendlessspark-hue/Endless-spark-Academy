import React from 'react';
import { ShieldCheck, Mail, Key, UserCheck, AlertCircle, Info, CheckCircle2, Settings2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SecurityGuidelines() {
  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-8 text-white relative">
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <ShieldCheck className="w-8 h-8" />
                <h1 className="text-3xl font-bold">Password & Security Guidelines</h1>
              </div>
              <p className="text-indigo-100 max-w-2xl">
                Important procedures for managing student passwords, account security, and troubleshooting login issues.
              </p>
            </div>
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <ShieldCheck className="w-32 h-32" />
            </div>
          </div>

          <div className="p-8 space-y-12">
            {/* Section 1: Default Credentials */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <span className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 text-sm font-bold">1</span>
                Default Student Credentials
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-orange-50 p-6 rounded-2xl border border-orange-100">
                  <h3 className="font-bold text-orange-800 mb-2">Default Password</h3>
                  <code className="bg-white px-3 py-1 rounded-md text-lg font-mono text-orange-600 block mb-3 border border-orange-200 w-fit">
                    Welcome@123
                  </code>
                  <p className="text-sm text-orange-700/80 italic">
                    Note: Case-sensitive. 'W' must be capital.
                  </p>
                </div>
                <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 text-sm">
                  <h3 className="font-bold text-blue-800 mb-2">Mandatory Update</h3>
                  <p className="text-blue-700 leading-relaxed">
                    Upon first login, students are <strong>automatically forced</strong> to set a new personal password. Access to the dashboard is restricted until this update is completed.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 2: Reset Procedure for Admins */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <span className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 text-sm font-bold">2</span>
                Admin Reset Procedures
              </h2>
              <div className="space-y-4">
                <div className="flex gap-4 p-5 rounded-2xl border border-gray-100 hover:border-indigo-200 transition-colors bg-white">
                  <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 shrink-0">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1 text-md">Option A: Email Reset (Recommended)</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">
                      Triggers an official Firebase password reset email. This is the most secure method as it verifies ownership of the email account.
                    </p>
                    <ul className="mt-3 space-y-1 text-xs text-indigo-600 font-medium">
                      <li>• Valid for 1 hour</li>
                      <li>• Checks Spam folder if not received</li>
                      <li>• Link expires after single use</li>
                    </ul>
                  </div>
                </div>

                <div className="flex gap-4 p-5 rounded-2xl border border-gray-100 hover:border-violet-200 transition-colors bg-white shadow-sm shadow-violet-50">
                  <div className="w-12 h-12 bg-violet-50 rounded-xl flex items-center justify-center text-violet-600 shrink-0">
                    <Key className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1 text-md">Option B: Force Manual Reset</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">
                      Admins can manually set a temporary password (e.g., <code className="text-xs bg-gray-100 px-1 rounded">Reset@2024</code>) through the backend.
                    </p>
                    <p className="mt-2 text-xs font-medium text-amber-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> Use this only if the student cannot receive emails.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 3: Troubleshooting Email Issues */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <span className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 text-sm font-bold">3</span>
                Troubleshooting "Email Not Received"
              </h2>
              <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200 overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
                   <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                        <div>
                          <p className="font-bold text-gray-800 text-sm">Check Email Accuracy</p>
                          <p className="text-xs text-gray-500">Ensure there are no typos in the student's email address in their profile.</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                        <div>
                          <p className="font-bold text-gray-800 text-sm">Spam/Junk Folders</p>
                          <p className="text-xs text-gray-500">Ask the student to search for "Endless Spark" or "noreply" in all folders.</p>
                        </div>
                      </div>
                   </div>
                   <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                        <div>
                          <p className="font-bold text-gray-800 text-sm">Email Verification</p>
                          <p className="text-xs text-gray-500">Unverified accounts may have restricted delivery in some email providers.</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                        <div>
                          <p className="font-bold text-gray-800 text-sm">Storage Full</p>
                          <p className="text-xs text-gray-500">If the student's mailbox is full (common with Gmail), emails will bounce.</p>
                        </div>
                      </div>
                   </div>
                </div>
              </div>
            </section>

            {/* Section 4: Firebase Admin Configuration */}
            <section className="bg-indigo-900 rounded-3xl p-8 text-white">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
                <Settings2 className="w-6 h-6 text-indigo-400" />
                Firebase Console Configuration (Admins)
              </h2>
              <div className="space-y-6">
                <p className="text-sm text-indigo-200">
                  If students are still not receiving reset emails, please verify the following settings in your <a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer" className="text-white underline font-bold">Firebase Console</a>:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="bg-indigo-800/50 p-4 rounded-xl border border-indigo-700">
                      <p className="font-bold text-sm mb-1">Check Action URL</p>
                      <p className="text-xs text-indigo-300">Authentication &gt; Settings &gt; User Actions. Ensure the "Action handlers" URL is correctly pointing to your app domain.</p>
                    </div>
                    <div className="bg-indigo-800/50 p-4 rounded-xl border border-indigo-700">
                      <p className="font-bold text-sm mb-1">Email Domain Verification</p>
                      <p className="text-xs text-indigo-300">Authentication &gt; Templates. Configure your support email correctly and enable "Custom Domains" to avoid spam filters.</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-indigo-800/50 p-4 rounded-xl border border-indigo-700">
                      <p className="font-bold text-sm mb-1">CORS for Storage Uploads</p>
                      <p className="text-xs text-indigo-300">If file uploads fail, use Cloud Shell to run:<br/><code className="text-[10px] bg-black/30 p-1 rounded block mt-1">gsutil cors set cors.json gs://bucket-name</code></p>
                    </div>
                    <div className="bg-indigo-800/50 p-4 rounded-xl border border-indigo-700">
                      <p className="font-bold text-sm mb-1">Quota Monitoring</p>
                      <p className="text-xs text-indigo-300">Check "Usage and billing" to ensure your daily email/storage quotas have not been exceeded.</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

             {/* Section 5: Security Best Practices */}
             <section>
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <span className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 text-sm font-bold">5</span>
                Best Practices & Requirements
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm text-center">
                  <UserCheck className="w-6 h-6 text-indigo-400 mx-auto mb-2" />
                  <p className="text-xs font-bold text-gray-800">Unique Emails</p>
                  <p className="text-[10px] text-gray-400 mt-1">Never share email accounts between students.</p>
                </div>
                <div className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm text-center">
                  <AlertCircle className="w-6 h-6 text-amber-400 mx-auto mb-2" />
                  <p className="text-xs font-bold text-gray-800">Recent Login</p>
                  <p className="text-[10px] text-gray-400 mt-1">Frequent updates require a fresh login for security verification.</p>
                </div>
                <div className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm text-center">
                  <Info className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                  <p className="text-xs font-bold text-gray-800">Session Timeout</p>
                  <p className="text-[10px] text-gray-400 mt-1">Inactive sessions will expire. Log out and in if issues persist.</p>
                </div>
              </div>
            </section>
          </div>

          {/* Footer Card */}
          <div className="p-8 bg-gray-50 border-t border-gray-100">
            <div className="flex flex-col items-center text-center">
              <p className="text-sm font-bold text-gray-700">Need Technical Support?</p>
              <p className="text-xs text-gray-500 mt-1 mb-4">If issues persist after following these guidelines, please contact the development team.</p>
              <div className="flex gap-4">
                <a 
                  href="mailto:support@endlesssparkcreativehub.in"
                  className="px-6 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Contact Support
                </a>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
