const fs = require('fs');

let content = fs.readFileSync('src/pages/CourseOverview.tsx', 'utf-8');

// modify useSettings
content = content.replace(`const { logoUrl } = useSettings();`, `const { logoUrl, marketingSettings } = useSettings();`);

const adminNotesHTML = `{/* Information to Add Next (Admin / Staff Notes) */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-yellow-800 mb-4 flex items-center gap-2">
            <AlertCircle className="w-6 h-6" /> Information Needed to Complete this Page
          </h2>
          <p className="text-yellow-700 mb-6">
            To make this marketing overview fully effective, please gather and send us the following details so we can add them to this page:
          </p>
          <ul className="space-y-4">
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 bg-yellow-200 text-yellow-800 rounded-full flex items-center justify-center flex-shrink-0 font-bold mt-0.5">1</span>
              <div>
                <strong className="text-gray-900 block">Detailed Course Syllabi</strong>
                <span className="text-gray-700 text-sm">What specific topics, tools (like Adobe Illustrator, Esko), and techniques are covered in each of the 7 courses?</span>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 bg-yellow-200 text-yellow-800 rounded-full flex items-center justify-center flex-shrink-0 font-bold mt-0.5">2</span>
              <div>
                <strong className="text-gray-900 block">Course Duration & Fees</strong>
                <span className="text-gray-700 text-sm">How long is each course (e.g., 3 months, 6 weeks)? What is the pricing structure or any available EMI options?</span>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 bg-yellow-200 text-yellow-800 rounded-full flex items-center justify-center flex-shrink-0 font-bold mt-0.5">3</span>
              <div>
                <strong className="text-gray-900 block">Student Testimonials & Success Stories</strong>
                <span className="text-gray-700 text-sm">Real reviews, quotes, or video links from past students who are now working in the industry.</span>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 bg-yellow-200 text-yellow-800 rounded-full flex items-center justify-center flex-shrink-0 font-bold mt-0.5">4</span>
              <div>
                <strong className="text-gray-900 block">Instructor Profiles</strong>
                <span className="text-gray-700 text-sm">Names, photos, and brief bios of the expert mentors teaching these courses.</span>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 bg-yellow-200 text-yellow-800 rounded-full flex items-center justify-center flex-shrink-0 font-bold mt-0.5">5</span>
              <div>
                <strong className="text-gray-900 block">Hiring Partners</strong>
                <span className="text-gray-700 text-sm">Logos or names of the companies where your students get placed (for the "100% Placement" section).</span>
              </div>
            </li>
          </ul>
        </div>
      </div>`;

const newInfoHTML = `      {/* Dynamic Marketing Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-gray-100">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {marketingSettings?.courseOverview?.detailedCourseSyllabi && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-indigo-500" /> Detailed Course Syllabi
              </h2>
              <div className="prose text-gray-600 whitespace-pre-wrap">
                {marketingSettings.courseOverview.detailedCourseSyllabi}
              </div>
            </div>
          )}
          
          {marketingSettings?.courseOverview?.courseDurationFees && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Clock className="w-6 h-6 text-pink-500" /> Course Duration & Fees
              </h2>
              <div className="prose text-gray-600 whitespace-pre-wrap">
                {marketingSettings.courseOverview.courseDurationFees}
              </div>
            </div>
          )}

          {marketingSettings?.courseOverview?.studentTestimonials && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Users className="w-6 h-6 text-green-500" /> Student Testimonials
              </h2>
              <div className="prose text-gray-600 whitespace-pre-wrap italic border-l-4 border-green-500 pl-4">
                "{marketingSettings.courseOverview.studentTestimonials}"
              </div>
            </div>
          )}

          {marketingSettings?.courseOverview?.instructorProfiles && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Layout className="w-6 h-6 text-orange-500" /> Instructor Profiles
              </h2>
              <div className="prose text-gray-600 whitespace-pre-wrap">
                {marketingSettings.courseOverview.instructorProfiles}
              </div>
            </div>
          )}

          {marketingSettings?.courseOverview?.hiringPartners && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 lg:col-span-2">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Briefcase className="w-6 h-6 text-blue-500" /> Hiring Partners
              </h2>
              <div className="prose text-gray-600 whitespace-pre-wrap">
                {marketingSettings.courseOverview.hiringPartners}
              </div>
            </div>
          )}
        </div>
      </div>`;

// We replace the adminNotesHTML with a condition that shows it if there's no data
const dynamicHTML = `      {(!marketingSettings || !marketingSettings.courseOverview || 
        (!marketingSettings.courseOverview.detailedCourseSyllabi && 
         !marketingSettings.courseOverview.courseDurationFees && 
         !marketingSettings.courseOverview.studentTestimonials && 
         !marketingSettings.courseOverview.instructorProfiles && 
         !marketingSettings.courseOverview.hiringPartners)) ? (
        <>
          ${adminNotesHTML}
        </>
      ) : (
        <>
          ${newInfoHTML}
        </>
      )}`;

content = content.replace(adminNotesHTML, dynamicHTML);

fs.writeFileSync('src/pages/CourseOverview.tsx', content, 'utf-8');
console.log("Updated CourseOverview.tsx");
