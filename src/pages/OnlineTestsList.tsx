import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { FileQuestion, ShieldAlert, CheckCircle } from 'lucide-react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';

export default function OnlineTestsList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [assignedTests, setAssignedTests] = useState<{courseId: string, courseName: string, topic: string, completed: boolean, score: number}[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTests = async () => {
      if (user?.role === 'student' && user.assignedCourses) {
        try {
          const tests: any[] = [];
          const scores = user.scores || {};
          
          const scoreKeyMap: Record<string, string> = {
            'production-art-engineer': 'productionArtEngineer',
            'print-ready-engineer': 'printReadyEngineer',
            'quality-control-engineer': 'qualityControlEngineer',
            'packaging-engineer': 'packagingEngineer',
            'plate-ready-engineer': 'plateReadyEngineer',
            'colour-retouching-engineer': 'colourRetouchingEngineer',
            'printing-and-packaging-cross-courses': 'printingAndPackagingCrossCourses',
          };

          const formatCourseName = (course: string) => {
            return course.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
          };

          for (const courseId of user.assignedCourses) {
            const courseScoreData = (scores as any)[scoreKeyMap[courseId]] || {};
            
            // fetch topics for this course
            const q = query(collection(db, 'course_modules'), where('category', '==', courseId));
            const snapshot = await getDocs(q);
            const topics = snapshot.docs.map(doc => doc.data().title);

            topics.forEach(topicName => {
              const topicScore = courseScoreData[topicName];
              
              if (topicScore?.onlineTestAssigned || topicScore?.onlineTestAttempted) {
                tests.push({
                  courseId,
                  courseName: formatCourseName(courseId),
                  topic: topicName,
                  completed: !!topicScore.onlineTestAttempted,
                  score: topicScore.onlineTestAttempted ? (topicScore.onlineTest || 0) : 0,
                });
              }
            });
          }
          
          setAssignedTests(tests);
        } catch (error) {
          console.error("Error fetching available tests", error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    fetchTests();
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <FileQuestion className="w-8 h-8 text-pink-600" />
          Online Tests
        </h1>
        <p className="text-gray-500 mt-2">Manage and take your assigned online tests.</p>
      </div>

      <div className="space-y-4">
        {assignedTests.length > 0 ? (
          assignedTests.map((test, idx) => (
            <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:shadow-md">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl shrink-0 ${test.completed ? 'bg-green-50 text-green-600' : 'bg-pink-50 text-pink-600'}`}>
                  {test.completed ? <CheckCircle className="w-6 h-6" /> : <FileQuestion className="w-6 h-6" />}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg mb-1">{test.topic}</h3>
                  <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
                    <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-md">{test.courseName}</span>
                    {test.completed ? (
                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded-md">Score: {test.score}/20</span>
                    ) : (
                      <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-md">Pending</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                {test.completed ? (
                  <button 
                    disabled 
                    className="w-full sm:w-auto px-6 py-2.5 bg-gray-100 text-gray-400 rounded-xl font-bold cursor-not-allowed text-sm"
                  >
                    Completed
                  </button>
                ) : (
                  <button 
                    onClick={() => navigate(`/quiz?category=${test.courseId}&topic=${encodeURIComponent(test.topic)}`)}
                    className="w-full sm:w-auto px-6 py-2.5 bg-pink-600 text-white rounded-xl font-bold hover:bg-pink-700 transition-colors flex items-center justify-center gap-2 text-sm shadow-md shadow-pink-500/20"
                  >
                    <ShieldAlert className="w-4 h-4"/> Take Test
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white p-12 rounded-3xl shadow-sm border border-gray-100 text-center">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileQuestion className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="font-bold text-gray-900 text-lg mb-2">No Tests Available</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              You haven't been assigned any online tests yet. When your faculty assigns a test, it will appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
