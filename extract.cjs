const fs = require('fs');

const fileContent = fs.readFileSync('src/pages/CourseOverview.tsx', 'utf8');

const updatedContent = fileContent.replace(
  'export default function CourseOverview() {',
  `export function CourseMarketingContent() {
  const { marketingSettings, financialSettings } = useSettings();
  
  if ((!marketingSettings || !marketingSettings.courseOverview || 
        (!marketingSettings.courseOverview.detailedCourseSyllabi && 
         !marketingSettings.courseOverview.courseDurationFees && 
         !marketingSettings.courseOverview.studentTestimonials && 
         !marketingSettings.courseOverview.instructorProfiles && 
         !marketingSettings.courseOverview.hiringPartners)) && (!financialSettings?.coursesConfig || financialSettings.coursesConfig.length === 0)) {
         return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center border-b pb-4">Detailed Syllabi & Course Details</h2>
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
        
        {(marketingSettings?.courseOverview?.courseDurationFees || (financialSettings?.coursesConfig && financialSettings.coursesConfig.length > 0)) && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Clock className="w-6 h-6 text-pink-500" /> Course Duration & Fees
            </h2>
            {financialSettings?.coursesConfig && financialSettings.coursesConfig.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="py-3 px-4 font-semibold text-gray-700">Course</th>
                      <th className="py-3 px-4 font-semibold text-gray-700">Duration</th>
                      <th className="py-3 px-4 font-semibold text-gray-700">Fees</th>
                    </tr>
                  </thead>
                  <tbody>
                    {financialSettings.coursesConfig.map((config) => (
                      <tr key={config.courseId} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4 font-medium text-gray-900">
                          {config.courseId.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                        </td>
                        <td className="py-3 px-4 text-gray-600">{config.durationMonths} Months</td>
                        <td className="py-3 px-4 text-gray-600">₹{config.fees?.toLocaleString('en-IN') || '0'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {marketingSettings?.courseOverview?.courseDurationFees && (
                   <div className="mt-6 prose text-gray-600 whitespace-pre-wrap pt-4 border-t border-gray-100">
                     {marketingSettings.courseOverview.courseDurationFees}
                   </div>
                )}
              </div>
            ) : (
              <div className="prose text-gray-600 whitespace-pre-wrap">
                {marketingSettings?.courseOverview?.courseDurationFees}
              </div>
            )}
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
    </div>
  );
}

export default function CourseOverview() {`
);

fs.writeFileSync('src/pages/CourseOverview.tsx', updatedContent);
