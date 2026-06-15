import React from 'react';
import { Shield, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../hooks/useSettings';

export default function PrivacyPolicy() {
  const navigate = useNavigate();
  const { logoUrl } = useSettings();

  return (
    <div className="min-h-screen bg-[#f5f5f5] p-4 md:p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden">
        <div className="bg-pink-600 p-8 text-white flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center p-2">
              <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Privacy Policy</h1>
              <p className="text-pink-100 text-sm">Endless Spark School of Printing and Packaging</p>
              <p className="text-pink-100 text-xs">Last updated: March 16, 2026</p>
            </div>
          </div>
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        </div>

        <div className="p-8 md:p-12 space-y-8 text-gray-600 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">1. Information We Collect</h2>
            <p className="mb-4">
              We collect information that you provide directly to us when you create an account, fill out an application, or communicate with us. This may include:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Name, email address, and contact information.</li>
              <li>Educational background and application details.</li>
              <li>Video introductions and quiz responses for training purposes.</li>
              <li>Profile photographs for student identification cards.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">2. How We Use Your Information</h2>
            <p className="mb-4">We use the information we collect to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide, maintain, and improve our training services.</li>
              <li>Process your application and verify your identity.</li>
              <li>Generate student ID cards and track academic progress.</li>
              <li>Communicate with you about updates, support, and administrative messages.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">3. Data Security</h2>
            <p>
              We use Firebase (a Google platform) to securely store your data. We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, or destruction.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">4. Third-Party Services</h2>
            <p>
              Our application uses Firebase for authentication and database services. Your data is handled in accordance with Google's privacy standards. We do not sell your personal information to third parties.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">5. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us at:
              <br />
              <span className="font-bold text-pink-600">adminendlessspark@gmail.com</span>
              <br />
              <span className="font-bold text-pink-600">+91 90428 21999</span>
              <br />
              <span className="font-bold text-pink-600">Head office: 189, Rathinam Complex 2nd floor, Pollachi Main road (opposite Balaji Hospital) Sundarapuram Coimbatore 641024</span>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
