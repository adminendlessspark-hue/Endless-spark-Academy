export interface QuizDetail {
  questionId: string;
  question: string;
  answer: string;
  aiScore: number;
  aiFeedback: string;
  isDescriptive: boolean;
  correctAnswerStr?: string;
}

export interface TopicScore {
  assignment: number;
  assignmentStatus?: 'pending' | 'approved' | 'rejected';
  video: number;
  videoStatus?: 'pending' | 'approved' | 'rejected';
  worksheet: number;
  worksheetStatus?: 'pending' | 'approved' | 'rejected';
  project: number;
  projectStatus?: 'pending' | 'approved' | 'rejected';
  mindMap: number;
  mindMapStatus?: 'pending' | 'approved' | 'rejected';
  quiz: number;
  quizAttempted?: boolean;
  onlineTest?: number;
  onlineTestAttempted?: boolean;
  onlineTestAssigned?: boolean;
  onlineTestDetails?: QuizDetail[];
  attendance: number;
  attendanceStatus?: 'pending' | 'approved' | 'rejected';
  attendanceDates?: string[]; // Track individual dates approved
  assignmentFile?: string;
  worksheetFile?: string;
  projectFile?: string;
  mindMapFile?: string;
  videoData?: string;
  comments?: string;
}

export type CourseType = 
  | 'packaging-engineer' 
  | 'production-art-engineer' 
  | 'print-ready-engineer' 
  | 'plate-ready-engineer' 
  | 'colour-retouching-engineer' 
  | 'quality-control-engineer' 
  | 'printing-and-packaging-cross-courses';

export interface LeaveRequest {
  id: string;
  studentId: string;
  studentName: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
}

export interface Holiday {
  id: string;
  date: string;
  title: string;
}

export interface LiveSession {
  id: string;
  title: string;
  roomId: string;
  facultyId: string;
  facultyName: string;
  studentId?: string; // Legacy
  studentName?: string; // Legacy
  students?: { id: string, name: string }[]; // New
  scheduledFor: string;
  status: 'scheduled' | 'live' | 'ended' | 'completed';
  createdAt: string;
  recordingUrl?: string;
  type?: 'live' | 'demo' | 'interview' | 'hr_interview';
  interviewerEmail?: string;
  feedback?: string;
  skillsGap?: string;
  interviewStatus?: 'pass' | 'fail' | 'pending';
}

export interface ApplicationData {
  fullName: string;
  mobileCountryCode?: string;
  mobileNumber?: string;
  emergencyCountryCode?: string;
  emergencyContact?: string;
  bloodGroup?: string;
  phone?: string;
  dob: string;
  placeOfBirth?: string;
  nationality?: string;
  gender: 'Male' | 'Female' | 'Other';
  qualification: string;
  university: string;
  graduationYear: string;
  currentRole?: string;
  company?: string;
  experienceYears: string;
  homeAddress?: string;
  temporaryAddress?: string;
  sameAsHomeAddress?: boolean;
  photo?: string;
  addressProof?: string;
  educationProof?: string;
  preferredDate?: string;
  preferredTime?: string;
  requestedCourses?: string[];
  modeOfStudy?: 'online' | 'physical';
  branch?: string;
  workLocation?: string;
  currentCity?: string;
}

export interface DailyAttendance {
  date: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface ScheduleSlot {
  id: string;
  facultyId: string;
  studentId: string;
  studentName: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  type: 'live_class' | 'self_task' | 'demo';
  status: 'scheduled' | 'completed' | 'missed';
  clockInTime?: string;
  clockOutTime?: string;
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string;
  companyName?: string;
  workExperience?: string;
  currentRole?: string;
  source?: 'Advertisement' | 'Student referral' | 'External referral' | 'Cold Call' | string;
  place?: string;
  status: 'new' | 'contacted' | 'willing' | 'demo_scheduled' | 'demo_completed' | 'admission_started' | 'not_interested' | 'not_qualified';
  notes: { id: string; date: string; text: string; authorId: string; authorName: string }[];
  createdAt: string;
  updatedAt: string;
  assignedTo?: string;
  studentId?: string;
  nextFollowUpDate?: string;
  testScore?: number;
  testResults?: any;
}

export interface DemoData {
  preferredDate: string;
  preferredTime: string;
  qualification: string;
  experienceYears: string;
  currentRole?: string;
  company?: string;
  workLocation?: string;
  currentCity?: string;
  completed?: boolean;
  mode?: 'physical' | 'online';
}

export interface SoftwareToolVideo {
  id: string;
  toolName: string;
  title: string;
  videoUrl: string;
  duration: string;
  createdAt: string;
}

export interface StudentPlacementInfo {
  eligible: boolean;
  status: 'Course Ongoing' | 'Pending' | 'Interview Scheduled' | 'Placed' | 'Not Placed';
  interviewDate?: string;
  interviewCompany?: string;
  placedCompany?: string;
  packageAmount?: string;
  notes?: string;
}

export interface GlobalPlacementRecord {
  id: string;
  companyName: string;
  studentsPlaced: number;
  highestPackage: number;
  logoUrl?: string;
}

export interface GlobalPlacementYear {
  year: string;
  records: GlobalPlacementRecord[];
}

export interface PlacementSettings {
  id: string; // 'placements'
  yearlyRecords: GlobalPlacementYear[];
  updatedAt?: string;
  updatedBy?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio?: string;
  photoUrl?: string;
  isFounder?: boolean;
  order: number;
}

export interface User {
  id: string;
  studentId?: string;
  name: string;
  username: string;
  password?: string;
  email: string;
  phone?: string;
  whatsapp?: string;
  role: 'student' | 'admin' | 'faculty' | 'telecaller' | 'accounts_executive' | 'qc' | 'marketing';
  isApproved: boolean;
  isPhasedOut?: boolean;
  mustChangePassword?: boolean;
  lastPasswordUpdate?: string;
  registeredForDemo: boolean;
  demoData?: DemoData;
  applicationStatus: 'none' | 'pending' | 'submitted' | 'approved' | 'phased-out';
  applicationData?: ApplicationData;
  videoRecorded: boolean;
  nativeLanguage?: string;
  videoIntroStatus?: 'pending' | 'approved' | 'rejected';
  videoIntroData?: string;
  entranceTestStatus?: 'pending' | 'submitted' | 'evaluated' | 'assigned';
  entranceTestMarks?: number;
  entranceTestResults?: any;
  quizCompleted: boolean;
  completedModules: string[];
  requestedCourse?: CourseType;
  requestedCourses?: CourseType[];
  assignedCourse?: CourseType;
  assignedCourses?: CourseType[];
  photo?: string;
  idCardApproved?: boolean;
  adminSignature?: string;
  admissionDate?: string;
  expiryDate?: string;
  certificateApproved?: boolean;
  certificateIssuedDate?: string;
  assignedFacultyId?: string;
  dailyAttendance?: DailyAttendance[];
  createdAt?: string;
  updatedAt?: string;
  referredBy?: string;
  referrerContact?: string;
  wellnessAffirmationUrl?: string;
  batch?: string;
  lastWellnessDate?: string;
  placementInfo?: StudentPlacementInfo;
  scores: {
    packagingEngineer?: Record<string, TopicScore>;
    productionArtEngineer?: Record<string, TopicScore>;
    printReadyEngineer?: Record<string, TopicScore>;
    plateReadyEngineer?: Record<string, TopicScore>;
    colourRetouchingEngineer?: Record<string, TopicScore>;
    qualityControlEngineer?: Record<string, TopicScore>;
    printingAndPackagingCrossCourses?: Record<string, TopicScore>;
  };
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[]; // Still keep for compatibility, but might be empty for descriptive
  correctAnswer: number;
  type?: 'multiple-choice' | 'true-false' | 'descriptive';
  answerKey?: string; // Correct answer criteria for AI grading
}

export interface CourseModule {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  videoUrls?: Record<string, string>; // e.g., { english: 'url', tamil: 'url' }
  duration: string;
  category: CourseType;
  assignmentPaperUrl?: string;
  mindMapUrl?: string;
  worksheetUrl?: string;
  projectTemplateUrl?: string;
  referenceMaterialUrl?: string;
  slidesUrl?: string;
  thumbnailUrl?: string;
  additionalReferenceMaterials?: { title: string, url: string }[];
  quizQuestions?: QuizQuestion[];
  onlineTestQuestions?: QuizQuestion[];
  mindMapNotes?: string;
  mindMapExpectedCriteria?: string;
  order?: number;
}

export interface EMI {
  emiNumber: number;
  baseAmount: number;
  interestAmount: number;
  penaltyAmount: number;
  dueDate: string;
  status: 'pending' | 'paid';
  paidDate?: string;
}

export interface Waiver {
  emiNumber: number;
  type: 'interest' | 'penalty';
  percentage: number;
  amount: number;
  reason: string;
  approvedBy: string;
  date: string;
}

export interface Referral {
  referredBy: string;
  referrerContact?: string;
  referrerType: 'internal' | 'external';
  bonusPercentage: number;
  bonusEarnedSoFar: number;
  bonusPaidSoFar?: number;
}

export interface Invoice {
  id: string;
  studentId: string;
  totalFee: number;
  concessionApplied: 'none' | 'single-parent' | 'transgender';
  finalAmount: number;
  emis: EMI[];
  waivers: Waiver[];
  referral?: Referral;
  createdAt: string;
  updatedAt: string;
  rulesSnapshot?: {
    interestRatePercentage: number;
    penaltyPercentage: number;
    internalReferralPercentage: number;
    externalReferralPercentage: number;
  };
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  text: string;
  timestamp: string;
  recipientId?: string; // For 1-on-1 messages
}

export interface ProjectQCRejection {
  timestamp: string;
  errorCategory: string;
  notes: string;
}

export interface ClientBrief {
  projectNumber?: string;
  brandName: string;
  packType: string;
  variantName: string;
  fileName: string;
  netWeight: string;
  baseFileName: string;
  edName: string;
  referenceFileName: string;
  masterJob: string;
  annotationPdfName: string;
  jobBrief: string;
  preflightChecklist?: string[];
  productionChecklist?: string[];
}

export interface BarcodeSpec {
  codeType: string;
  codeNumber: string;
  codeColour: string;
  bwr: string;
  magnification: string;
  narrowBar: string;
}

export interface ColorRotationSpec {
  colorName: string;
  lineScreen: string;
  lpi: string;
  dotType: string;
  angle: string;
  new: string;
}

export interface PrinterSpec {
  printerName?: string;
  printMethod: string;
  printingSubstrate: string;
  faceReversePrint: string;
  maxColors: string;
  varnishIncluded: string;
  barcodes: BarcodeSpec[];
  colorRotation: ColorRotationSpec[];
  artworkInfo: {
    minLineThicknessPos: string;
    minLineThicknessRev: string;
    minTextSizePos: string;
    minTextSizeRev: string;
    minTypeMultiColorPos: string;
    minTypeMultiColorRev: string;
    minSymbolSizePos: string;
    minSymbolSizeNeg: string;
    xHeight: string;
    bleed: string;
    rollover: string;
    typeSafety: string;
    minDotSize: string;
    maxTonalValue: string;
    maxInkCoverage: string;
  };
  eyeMark: {
    size: string;
    colour: string;
    position: string;
    underColourPullback: string;
  };
  microdot: {
    location1: string;
    location2: string;
    size: string;
  };
  richBlack: {
    cyan: string;
    yellow: string;
    magenta: string;
    black: string;
  };
  trappingBleed: {
    minTrap: string;
    maxTrap: string;
    standardTrap: string;
    metalicTrap: string;
    ctStandardTrap: string;
    ctMinTrap: string;
    ctMaxTrap: string;
    varnishTrap: string;
  };
  pullbackHoldback: {
    generalPullback: string;
    whitePullback1: string;
    whitePullback2: string;
    varnishPullback: string;
    keyline: string;
  };
  proofingProfile: string;
  preferredFormat: string;
}

export interface StudentProject {
  id: string;
  projectCode?: string; // e.g., STU123_JOH_1
  studentId: string;
  studentName: string;
  courseId?: string;
  courseName?: string;
  adobeCloudLink?: string;
  cloudPath?: string;
  title: string;
  details: string;
  supportDocuments: string[];
  clientBrief?: ClientBrief;
  printerSpec?: PrinterSpec;
  estimatedTime: number; // total in minutes
  stageEstimates?: {
    client: number;
    preflight: number;
    production: number;
    pqc: number;
    qc: number;
  };
  actualTime: number; // in minutes
  lastStageActualTime?: number; // actualTime when last stage was completed
  status: 'client' | 'preflight' | 'production' | 'pqc' | 'qc' | 'approved';
  preflightChecklist?: string[];
  productionChecklist?: string[];
  preflightChecklistProgress?: string[];
  productionChecklistProgress?: string[];
  qcProduction?: any;
  digitalPreflight?: any;
  digitalProduction?: any;
  category?: string;
  reworkChecklist?: Record<string, 'pending' | 'completed'>;
  qcRejections: ProjectQCRejection[];
  points: number;
  efficiency: number;
  projectFileUrl?: string;
  googleDriveLink?: string;
  correctionPdfUrl?: string;
  isFilesCleanedUp?: boolean;
  slaDate: string;
  createdAt: string;
  updatedAt: string;
  isTimerRunning?: boolean;
  lastTimerStart?: string;
  workStatus?: 'Not Started' | 'In Progress' | 'Paused' | 'Completed';
  storyQuestions?: { question: string; correctAnswer: string }[];
  storyAnswers?: string[];
  storyFeedback?: string;
  storyMoral?: string;
  isStoryUnderstood?: boolean;
}

export interface TrainingFeedback {
  logistics: 'Satisfactory' | 'Good' | 'Excellent';
  presentation: 'Satisfactory' | 'Good' | 'Excellent';
  trainingMaterial: 'Satisfactory' | 'Good' | 'Excellent';
  qualityOfPresentation: 'Satisfactory' | 'Good' | 'Excellent';
  examplesCaseStudies: 'Satisfactory' | 'Good' | 'Excellent';
  usefulnessOfTopic: 'Satisfactory' | 'Good' | 'Excellent';
  fulfilmentOfObjective: 'Satisfactory' | 'Good' | 'Excellent';
  overallSatisfaction: 'Satisfactory' | 'Good' | 'Excellent';
}

export interface TrainingRecord {
  id: string;
  studentId: string;
  studentName: string;
  trainerName: string;
  courseModuleId?: string;
  courseModuleName?: string;
  duration: string;
  trainingDate: string;
  topics: string;
  feedback: TrainingFeedback;
  postTrainingImplementation: string;
  effectivenessVerification: {
    questionnaire: boolean;
    interview: boolean;
    onTheJob: boolean;
  };
  effectivenessDetails: string;
  evaluatedBy: string;
  evaluationDate: string;
  trainerSign?: string;
  traineeSign?: string;
  traineeSignImplementation?: string;
  evaluatorSign?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CourseFinancialConfig {
  courseId: CourseType | string;
  title: string;
  fees: number;
  durationMonths: number;
}

export interface FinancialSettings {
  id: string;
  coursesConfig?: CourseFinancialConfig[];
  emiRules: {
    durationMonths: number;
    emiCount: number;
  }[];
  interestRatePercentage: number;
  penaltyPercentage: number;
  internalReferralPercentage: number;
  externalReferralPercentage: number;
  singleParentConcessionPercentage?: number;
  transgenderConcessionPercentage?: number;
  bankDetails?: {
    accountHolderName: string;
    accountNumber: string;
    ifscCode: string;
    bankName: string;
    branchName: string;
  };
  upiDetails?: {
    upiId: string;
    qrCodeUrl?: string;
    merchantName?: string;
  };
  updatedAt: string;
  updatedBy: string;
}

export interface QueryItem {
  id: string;
  projectNumber: string;
  studentName: string;
  category: string;
  description: string;
  round?: string;
  createdAt: string;
  status: 'pending' | 'solved';
  solution?: string;
  solvedBy?: string;
  solvedByName?: string;
  solvedAt?: string;
  // File upload fields
  studentAttachmentName?: string;
  studentAttachmentUrl?: string;
  studentAttachmentType?: string;
  googleDriveUrl?: string;
  answerAttachmentName?: string;
  answerAttachmentUrl?: string;
  answerAttachmentType?: string;
}

export interface StudentQuery {
  id: string;
  studentId: string;
  studentName: string;
  title: string;
  description: string;
  round?: string;
  status: 'pending' | 'solved';
  solvedBy?: string;
  solvedByName?: string;
  solution?: string;
  createdAt: string;
  solvedAt?: string;
  projectNumber?: string;
  category?: string;
  queries?: QueryItem[];
  // File upload fields
  studentAttachmentName?: string;
  studentAttachmentUrl?: string;
  studentAttachmentType?: string;
  googleDriveUrl?: string;
  answerAttachmentName?: string;
  answerAttachmentUrl?: string;
  answerAttachmentType?: string;
}

export interface QueryNotification {
  id: string;
  userId: string;
  userRole: 'student' | 'faculty' | 'admin';
  title: string;
  message: string;
  queryId: string;
  read: boolean;
  createdAt: string;
  type: 'new_query' | 'query_answered';
}

export interface SavedResume {
  id: string;
  userId: string;
  studentName: string;
  data: any; // Contains ResumeData structure
  updatedAt: string;
  isSlot?: boolean; // True if it is one of the 5 admin save slots
  slotNumber?: number; // 1 to 5
}


