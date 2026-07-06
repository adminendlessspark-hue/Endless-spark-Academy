import React from 'react';
import { FileText, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../hooks/useSettings';

export default function TermsOfService() {
  const navigate = useNavigate();
  const { logoUrl } = useSettings();

  return (
    <div className="min-h-screen bg-[#f5f5f5] p-4 md:p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden">
        <div className="bg-orange-600 p-8 text-white flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center p-2">
              <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Terms of Service</h1>
              <p className="text-orange-100 text-sm">Endless Spark School of Printing and Packaging</p>
              <p className="text-orange-100 text-xs">Last updated: March 16, 2026</p>
            </div>
          </div>
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        </div>

        <div className="p-8 md:p-12 space-y-12 text-gray-600 leading-relaxed">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b pb-2">ENDLESS SPARK REGULATORY GUIDELINES FOR STUDENT ADMISSION</h2>
            <div className="space-y-6">
              <div>
                <h3 className="font-bold text-gray-900 uppercase text-sm tracking-wider mb-2">Introduction</h3>
                <p>Welcome to Endless Spark, where innovation meets education! We are excited to guide you through our comprehensive regulatory guidelines designed to ensure a fulfilling and enriching learning experience for every student. At Endless Spark, we believe in fostering a culture of dedication, creativity, and excellence.</p>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 uppercase text-sm tracking-wider mb-2">Attendance Mandate</h3>
                <p>To maximize your learning potential, a minimum of 90% attendance in all training sessions is mandatory. Regular attendance ensures active participation and engagement with course content.</p>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 uppercase text-sm tracking-wider mb-2">Internship Training Certification</h3>
                <p>Upon successful course completion, receive both a course certificate and an internship training certificate. An additional fee of 1000 rupees is applicable, enhancing the value of your certification.</p>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 uppercase text-sm tracking-wider mb-2">Grading System</h3>
                <p>Evaluation is based on project performance, a comprehensive scorecard, and consistent attendance. Grades: A+ (90% and above), A (85% to 90%), B (80% to 85%).</p>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 uppercase text-sm tracking-wider mb-2">Course Extension Policy</h3>
                <p>Below 80% overall, extend your course duration by an additional month. A fee of 5000 rupees is applicable for course extension.</p>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 uppercase text-sm tracking-wider mb-2">Non-Refundable, Transferable Fees</h3>
                <p>Fees are non-refundable but may be transferred to future courses. This policy encourages commitment and dedication from both the student and Endless Spark. However, if our service does not meet your needs, a full refund will be provided within seven days.</p>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 uppercase text-sm tracking-wider mb-2">Termination Policy</h3>
                <p>Maintain an attendance rate above 60% to remain in the program. Failure to meet this requirement may result in termination from the program, with fees deemed non-refundable.</p>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 uppercase text-sm tracking-wider mb-2">EMI Option</h3>
                <p>Signed cheque(s) covering EMI amounts and dates.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b pb-2 uppercase">Endless Spark Virtual Class Regulatory Guidelines</h2>
            <div className="space-y-6">
              <div>
                <h3 className="font-bold text-gray-900 uppercase text-sm tracking-wider mb-2">Introduction</h3>
                <p>Welcome to Endless Spark’s Virtual Class Program, a cutting-edge initiative that brings quality education to your fingertips. In our commitment to excellence, we’ve established regulatory guidelines to ensure a seamless and secure virtual learning experience for all students. Let’s embark on this digital journey together!</p>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 uppercase text-sm tracking-wider mb-2">Equipment Requirement</h3>
                <p>For a successful virtual learning experience, students are required to attend classes using a laptop.</p>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 uppercase text-sm tracking-wider mb-2">Camera Usage Protocol</h3>
                <p>Always keep your camera switched on during virtual classes. This ensures active participation, engagement, and a sense of community in the digital classroom.</p>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 uppercase text-sm tracking-wider mb-2">Virtual Candidate Laptop Access</h3>
                <p>In cases where the virtual candidate’s company does not provide a laptop, students can access the virtual class system using Team Viewer. This flexibility ensures that every student can participate, regardless of their access to personal laptops.</p>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 uppercase text-sm tracking-wider mb-2">Private Room Setting</h3>
                <p>Attend virtual classes in a private room to minimize distractions. Create an environment conducive to focused learning and active participation.</p>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 uppercase text-sm tracking-wider mb-2">Team Viewer Usage Guidelines</h3>
                <p>For students utilizing Team Viewer, adhere to the provided guidelines for secure and effective system access. Team Viewer facilitates remote access, enabling a smooth learning experience even without a personal laptop.</p>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 uppercase text-sm tracking-wider mb-2">Security Measures</h3>
                <p>Prioritize the security of your virtual learning environment. Follow best practices to protect your personal information and maintain a safe Online space.</p>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 uppercase text-sm tracking-wider mb-2">Technical Support</h3>
                <p>If you encounter technical issues, reach out to our dedicated technical support team for prompt assistance. We are committed to ensuring that technical challenges do not hinder your learning progress.</p>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 uppercase text-sm tracking-wider mb-2">Interactive Learning Opportunities</h3>
                <p>Actively participate in virtual discussions, group activities, and collaborative projects. Embrace the digital platform to engage with your peers and instructors effectively.</p>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 uppercase text-sm tracking-wider mb-2">Feedback and Improvement</h3>
                <p>Provide constructive feedback on the virtual learning experience to help us enhance and tailor our approach. Continuous improvement is a collaborative effort between students and educators.</p>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 uppercase text-sm tracking-wider mb-2">Adherence to Virtual Etiquette</h3>
                <p>Respect virtual class etiquette, including muting your microphone when not speaking. Foster a positive and inclusive Online learning community.</p>
              </div>
            </div>
          </section>

          <section className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Admission Checklist</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 bg-white p-3 rounded-xl shadow-sm">
                <span className="w-8 h-8 bg-orange-100 text-orange-700 rounded-lg flex items-center justify-center font-bold text-sm">1</span>
                <span className="text-sm font-medium">10th, 12th or Degree Mark sheet</span>
              </div>
              <div className="flex items-center gap-3 bg-white p-3 rounded-xl shadow-sm">
                <span className="w-8 h-8 bg-orange-100 text-orange-700 rounded-lg flex items-center justify-center font-bold text-sm">2</span>
                <span className="text-sm font-medium">Aadhar card</span>
              </div>
              <div className="flex items-center gap-3 bg-white p-3 rounded-xl shadow-sm">
                <span className="w-8 h-8 bg-orange-100 text-orange-700 rounded-lg flex items-center justify-center font-bold text-sm">3</span>
                <span className="text-sm font-medium">Emergency Contact Number</span>
              </div>
              <div className="flex items-center gap-3 bg-white p-3 rounded-xl shadow-sm">
                <span className="w-8 h-8 bg-orange-100 text-orange-700 rounded-lg flex items-center justify-center font-bold text-sm">4</span>
                <span className="text-sm font-medium">Type Writing Practice</span>
              </div>
              <div className="flex items-center gap-3 bg-white p-3 rounded-xl shadow-sm">
                <span className="w-8 h-8 bg-orange-100 text-orange-700 rounded-lg flex items-center justify-center font-bold text-sm">5</span>
                <span className="text-sm font-medium">Eye Testing</span>
              </div>
            </div>
          </section>

          <section className="text-center pt-8 border-t">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Conclusion</h2>
            <p className="italic text-gray-500 mb-8">
              Endless Spark is dedicated to providing an innovative and inclusive virtual learning environment. By adhering to these regulatory guidelines, you contribute to the success of the virtual class program. Let’s embrace the opportunities that digital learning offers and make this journey together a truly enriching one!
            </p>
          </section>

          <section className="pt-8 border-t">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Contact Us</h2>
            <p className="text-gray-600">
              If you have any questions about these Terms of Service, please contact us at:
              <br /><br />
              <span className="font-bold text-pink-600">info@endlesssparkcreativehub.in</span>
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
