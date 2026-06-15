import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ClipboardList, GraduationCap, Briefcase, FileCheck, BookOpen, AlertCircle, Camera, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '../AuthContext';
import { CourseType } from '../types';
import { cn, formatCourseName } from '../utils';
import { useSettings } from '../hooks/useSettings';
import ImageCropper from '../components/ImageCropper';
import PhotoCapture from '../components/PhotoCapture';

const steps = [
  { id: 1, title: 'Personal Details', icon: ClipboardList },
  { id: 2, title: 'Education', icon: GraduationCap },
  { id: 3, title: 'Experience', icon: Briefcase },
  { id: 4, title: 'Course Choice', icon: BookOpen },
  { id: 5, title: 'Review', icon: FileCheck },
];

const applicationSchema = z.object({
  fullName: z.string().min(3, 'Full name must be at least 3 characters'),
  dob: z.string().min(1, 'Date of birth is required'),
  placeOfBirth: z.string().min(1, 'Place of birth is required'),
  nationality: z.string().min(1, 'Nationality is required'),
  gender: z.enum(['Male', 'Female', 'Other']),
  mobileCountryCode: z.string().min(1, 'Country code is required'),
  mobileNumber: z.string().min(10, 'Valid mobile number is required'),
  emergencyCountryCode: z.string().min(1, 'Country code is required'),
  emergencyContact: z.string().min(10, 'Valid emergency contact is required'),
  bloodGroup: z.string().min(1, 'Blood group is required'),
  photo: z.string().min(1, 'Passport size photo is required'),
  qualification: z.string().min(2, 'Qualification is required'),
  university: z.string().min(2, 'University/College is required'),
  graduationYear: z.string().regex(/^\d{4}$/, 'Must be a valid 4-digit year'),
  educationProof: z.string().min(1, 'Education proof is required'),
  currentRole: z.string().min(1, 'Current role is required'),
  company: z.string().min(1, 'Company is required'),
  experienceYears: z.string().min(1, 'Experience years is required'),
  homeAddress: z.string().min(5, 'Home address is required'),
  temporaryAddress: z.string().min(5, 'Temporary address is required'),
  sameAsHomeAddress: z.boolean().optional(),
  addressProof: z.string().min(1, 'Address proof is required'),
  requestedCourses: z.array(z.string()).min(1, 'Select at least one course'),
  modeOfStudy: z.enum(['physical', 'online']),
  branch: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.modeOfStudy === 'physical' && !data.branch) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Branch is required for physical study mode',
      path: ['branch'],
    });
  }
});

type ApplicationFormData = z.infer<typeof applicationSchema>;

export default function Application() {
  const [currentStep, setCurrentStep] = useState(1);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [currentCropField, setCurrentCropField] = useState<keyof ApplicationFormData | null>(null);
  const [isCapturingPhoto, setIsCapturingPhoto] = useState(false);
  const [cropperAspect, setCropperAspect] = useState(1);
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const { logoUrl, branches, financialSettings } = useSettings();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors },
  } = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      fullName: user?.applicationData?.fullName || user?.name || '',
      dob: user?.applicationData?.dob || '',
      placeOfBirth: user?.applicationData?.placeOfBirth || '',
      nationality: user?.applicationData?.nationality || '',
      gender: user?.applicationData?.gender || 'Male',
      mobileCountryCode: user?.applicationData?.mobileCountryCode || '+91',
      mobileNumber: user?.applicationData?.mobileNumber || user?.phone || '',
      emergencyCountryCode: user?.applicationData?.emergencyCountryCode || '+91',
      emergencyContact: user?.applicationData?.emergencyContact || '',
      bloodGroup: user?.applicationData?.bloodGroup || '',
      photo: user?.applicationData?.photo || '',
      qualification: user?.applicationData?.qualification || user?.demoData?.qualification || '',
      university: user?.applicationData?.university || '',
      graduationYear: user?.applicationData?.graduationYear || '',
      currentRole: user?.applicationData?.currentRole || user?.demoData?.currentRole || '',
      company: user?.applicationData?.company || user?.demoData?.company || '',
      experienceYears: user?.applicationData?.experienceYears || user?.demoData?.experienceYears || '',
      homeAddress: user?.applicationData?.homeAddress || '',
      temporaryAddress: user?.applicationData?.temporaryAddress || '',
      sameAsHomeAddress: user?.applicationData?.sameAsHomeAddress || false,
      addressProof: user?.applicationData?.addressProof || '',
      educationProof: user?.applicationData?.educationProof || '',
      requestedCourses: (user?.applicationData?.requestedCourses as any) || [],
      modeOfStudy: user?.applicationData?.modeOfStudy || user?.demoData?.mode || 'physical',
      branch: user?.applicationData?.branch || ''
    },
  });

  const requestedCourses = watch('requestedCourses');
  const formData = watch();
  const sameAsHomeAddress = watch('sameAsHomeAddress');
  const homeAddress = watch('homeAddress');

  useEffect(() => {
    if (sameAsHomeAddress) {
      setValue('temporaryAddress', homeAddress || '', { shouldValidate: true });
    }
  }, [sameAsHomeAddress, homeAddress, setValue]);

  // Auto-save draft every 5 seconds if data changed
  useEffect(() => {
    const timer = setTimeout(() => {
      if (Object.keys(formData).length > 0) {
        updateUser({ applicationData: formData });
      }
    }, 5000);
    return () => clearTimeout(timer);
  }, [formData, updateUser]);

  const toggleCourse = (courseId: string) => {
    const current = requestedCourses ? [...requestedCourses] : [];
    if (current.includes(courseId)) {
      if (current.length > 1) {
        setValue('requestedCourses', current.filter(c => c !== courseId) as any);
      }
    } else {
      setValue('requestedCourses', [...current, courseId] as any);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: keyof ApplicationFormData) => {
    const file = e.target.files?.[0];
    if (file) {
      // Determine aspect based on field
      if (field === 'photo') {
        setCropperAspect(3.5/4.5);
      } else if (field === 'educationProof' || field === 'addressProof') {
        setCropperAspect(1/1.414); // Default to A4 Portrait, they can rotate in cropper
      } else {
        setCropperAspect(1);
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setCropImageSrc(reader.result as string);
        setCurrentCropField(field);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = (croppedImage: string) => {
    if (currentCropField) {
      setValue(currentCropField, croppedImage, { shouldValidate: true });
    }
    setCropImageSrc(null);
    setCurrentCropField(null);
  };

  const handleCropCancel = () => {
    setCropImageSrc(null);
    setCurrentCropField(null);
  };

  const validateStep = async () => {
    let fieldsToValidate: (keyof ApplicationFormData)[] = [];
    if (currentStep === 1) fieldsToValidate = ['fullName', 'dob', 'placeOfBirth', 'nationality', 'gender', 'mobileNumber', 'emergencyContact', 'bloodGroup', 'photo', 'homeAddress', 'temporaryAddress'];
    else if (currentStep === 2) fieldsToValidate = ['qualification', 'university', 'graduationYear', 'educationProof'];
    else if (currentStep === 3) fieldsToValidate = ['currentRole', 'company', 'experienceYears', 'addressProof'];
    else if (currentStep === 4) fieldsToValidate = ['requestedCourses', 'modeOfStudy', 'branch'];

    const isValid = await trigger(fieldsToValidate);
    return isValid;
  };

  const saveDraft = async () => {
    const currentData = watch();
    await updateUser({ applicationData: currentData });
  };

  const onNext = async () => {
    const isValid = await validateStep();
    if (isValid) {
      await saveDraft();
      setCurrentStep(prev => prev + 1);
    }
  };

  const onPrev = async () => {
    await saveDraft();
    setCurrentStep(Math.max(1, currentStep - 1));
  };

  const onSubmit = async (data: ApplicationFormData) => {
    try {
      await updateUser({ 
        applicationStatus: 'submitted',
        requestedCourses: data.requestedCourses as any,
        requestedCourse: data.requestedCourses[0] as any,
        applicationData: data,
        photo: data.photo
      });
      navigate('/entrance-test');
    } catch (err) {
      console.error("Failed to submit application:", err);
      alert("Failed to submit application. Please try again.");
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-12 flex items-center gap-6">
        {logoUrl && (
          <div className="bg-white p-3 rounded-2xl shadow-md border border-gray-100 flex-shrink-0">
            <img src={logoUrl} alt="Endless Spark Logo" className="h-20 object-contain" />
          </div>
        )}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Training Application</h1>
          <p className="text-gray-500 mt-2">Complete the multi-step application to enroll in the full course.</p>
        </div>
      </div>

      {/* Stepper */}
      <div className="flex justify-between mb-12 relative">
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-200 -translate-y-1/2 z-0" />
        {steps.map((step) => {
          const Icon = step.icon;
          const isActive = currentStep === step.id;
          const isCompleted = currentStep > step.id;

          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center">
              <div 
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-300 ${
                  isActive ? 'bg-pink-500 text-white' : 
                  isCompleted ? 'bg-orange-500 text-white' : 'bg-white border-2 border-gray-200 text-gray-400'
                }`}
              >
                {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
              </div>
              <span className={`text-xs mt-2 font-medium ${isActive ? 'text-pink-600' : 'text-gray-400'}`}>
                {step.title}
              </span>
            </div>
          );
        })}
      </div>

      {/* Form Content */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 min-h-[400px] flex flex-col">
        {cropImageSrc && (
          <ImageCropper
            imageSrc={cropImageSrc}
            aspect={cropperAspect}
            onCropComplete={handleCropComplete}
            onCancel={handleCropCancel}
          />
        )}
        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1"
            >
              {currentStep === 1 && (
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold mb-4">Personal Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="col-span-1 md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                      <input 
                        {...register('fullName')}
                        className={cn(
                          "w-full px-4 py-2 rounded-lg border",
                          errors.fullName ? "border-red-500" : "border-gray-200"
                        )}
                      />
                      {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName.message}</p>}
                    </div>
                    <div className="col-span-1 md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Passport Size Photo</label>
                      <div className="space-y-4">
                        <div className="flex items-center gap-6">
                          <div className="w-24 h-24 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                            {formData.photo ? (
                              <img src={formData.photo} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                              <Camera className="w-8 h-8 text-gray-300" />
                            )}
                          </div>
                          
                          <div className="flex-1 space-y-3">
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setCropperAspect(3.5/4.5);
                                  setIsCapturingPhoto(true);
                                }}
                                className="flex items-center gap-2 px-4 py-2 bg-pink-50 text-pink-700 rounded-xl text-sm font-bold hover:bg-pink-100 transition-colors"
                              >
                                <Camera className="w-4 h-4" />
                                Capture Live
                              </button>
                              
                              <label className="flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-100 transition-colors cursor-pointer">
                                <Upload className="w-4 h-4" />
                                Upload Photo
                                <input 
                                  type="file" 
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => handleFileChange(e, 'photo')}
                                />
                              </label>
                            </div>
                            <p className="text-[10px] text-gray-400">Clear face visible, neutral background recommended.</p>
                          </div>
                        </div>
                        
                        {isCapturingPhoto && (
                          <PhotoCapture 
                            onCapture={(image) => {
                              setCropImageSrc(image);
                              setCurrentCropField('photo');
                              setIsCapturingPhoto(false);
                            }}
                            onCancel={() => setIsCapturingPhoto(false)}
                          />
                        )}
                      </div>
                      {errors.photo && <p className="text-red-500 text-xs mt-1">{errors.photo.message}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                      <input 
                        type="date" 
                        {...register('dob')}
                        className={cn(
                          "w-full px-4 py-2 rounded-lg border",
                          errors.dob ? "border-red-500" : "border-gray-200"
                        )}
                      />
                      {errors.dob && <p className="text-red-500 text-xs mt-1">{errors.dob.message}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                      <select 
                        {...register('gender')}
                        className="w-full px-4 py-2 rounded-lg border border-gray-200"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Place of Birth</label>
                      <input 
                        {...register('placeOfBirth')}
                        placeholder="City, Country"
                        className={cn(
                          "w-full px-4 py-2 rounded-lg border",
                          errors.placeOfBirth ? "border-red-500" : "border-gray-200"
                        )}
                      />
                      {errors.placeOfBirth && <p className="text-red-500 text-xs mt-1">{errors.placeOfBirth.message}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nationality</label>
                      <input 
                        {...register('nationality')}
                        placeholder="e.g. Indian"
                        className={cn(
                          "w-full px-4 py-2 rounded-lg border",
                          errors.nationality ? "border-red-500" : "border-gray-200"
                        )}
                      />
                      {errors.nationality && <p className="text-red-500 text-xs mt-1">{errors.nationality.message}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
                      <div className="flex gap-2">
                        <select
                          {...register('mobileCountryCode')}
                          className="w-24 px-2 py-2 rounded-lg border border-gray-200 bg-gray-50"
                        >
                          <option value="+91">+91 (IN)</option>
                          <option value="+1">+1 (US/CA)</option>
                          <option value="+44">+44 (UK)</option>
                          <option value="+971">+971 (UAE)</option>
                          <option value="+61">+61 (AU)</option>
                          <option value="+65">+65 (SG)</option>
                          <option value="+60">+60 (MY)</option>
                        </select>
                        <input 
                          {...register('mobileNumber')}
                          placeholder="e.g. 9876543210"
                          className={cn(
                            "flex-1 px-4 py-2 rounded-lg border",
                            errors.mobileNumber ? "border-red-500" : "border-gray-200"
                          )}
                        />
                      </div>
                      {errors.mobileNumber && <p className="text-red-500 text-xs mt-1">{errors.mobileNumber.message}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact</label>
                      <div className="flex gap-2">
                        <select
                          {...register('emergencyCountryCode')}
                          className="w-24 px-2 py-2 rounded-lg border border-gray-200 bg-gray-50"
                        >
                          <option value="+91">+91 (IN)</option>
                          <option value="+1">+1 (US/CA)</option>
                          <option value="+44">+44 (UK)</option>
                          <option value="+971">+971 (UAE)</option>
                          <option value="+61">+61 (AU)</option>
                          <option value="+65">+65 (SG)</option>
                          <option value="+60">+60 (MY)</option>
                        </select>
                        <input 
                          {...register('emergencyContact')}
                          placeholder="e.g. 9876543210"
                          className={cn(
                            "flex-1 px-4 py-2 rounded-lg border",
                            errors.emergencyContact ? "border-red-500" : "border-gray-200"
                          )}
                        />
                      </div>
                      {errors.emergencyContact && <p className="text-red-500 text-xs mt-1">{errors.emergencyContact.message}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Blood Group</label>
                      <select 
                        {...register('bloodGroup')}
                        className={cn(
                          "w-full px-4 py-2 rounded-lg border",
                          errors.bloodGroup ? "border-red-500" : "border-gray-200"
                        )}
                      >
                        <option value="">Select Blood Group</option>
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                      </select>
                      {errors.bloodGroup && <p className="text-red-500 text-xs mt-1">{errors.bloodGroup.message}</p>}
                    </div>
                    <div className="col-span-1 md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Home Address</label>
                      <textarea 
                        {...register('homeAddress')}
                        rows={2}
                        className={cn(
                          "w-full px-4 py-2 rounded-lg border",
                          errors.homeAddress ? "border-red-500" : "border-gray-200"
                        )}
                        placeholder="Enter your permanent home address"
                      />
                      {errors.homeAddress && <p className="text-red-500 text-xs mt-1">{errors.homeAddress.message}</p>}
                    </div>
                    <div className="col-span-1 md:col-span-2 flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        id="sameAsHomeAddress" 
                        {...register('sameAsHomeAddress')} 
                        className="w-4 h-4 text-pink-600 rounded border-gray-300 focus:ring-pink-500"
                      />
                      <label htmlFor="sameAsHomeAddress" className="text-sm text-gray-700">Temporary address is same as Home address</label>
                    </div>
                    <div className="col-span-1 md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Temporary Address</label>
                      <textarea 
                        {...register('temporaryAddress')}
                        rows={2}
                        disabled={sameAsHomeAddress}
                        className={cn(
                          "w-full px-4 py-2 rounded-lg border disabled:bg-gray-50 disabled:text-gray-500",
                          errors.temporaryAddress ? "border-red-500" : "border-gray-200"
                        )}
                        placeholder="Enter your current/temporary address"
                      />
                      {errors.temporaryAddress && <p className="text-red-500 text-xs mt-1">{errors.temporaryAddress.message}</p>}
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold mb-4">Educational Background</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Highest Qualification</label>
                    <input 
                      {...register('qualification')}
                      className={cn(
                        "w-full px-4 py-2 rounded-lg border",
                        errors.qualification ? "border-red-500" : "border-gray-200"
                      )}
                      placeholder="e.g. Bachelor of Technology" 
                    />
                    {errors.qualification && <p className="text-red-500 text-xs mt-1">{errors.qualification.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">University/College</label>
                    <input 
                      {...register('university')}
                      className={cn(
                        "w-full px-4 py-2 rounded-lg border",
                        errors.university ? "border-red-500" : "border-gray-200"
                      )}
                      placeholder="e.g. Stanford University" 
                    />
                    {errors.university && <p className="text-red-500 text-xs mt-1">{errors.university.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Year of Graduation</label>
                    <input 
                      type="number" 
                      {...register('graduationYear')}
                      className={cn(
                        "w-full px-4 py-2 rounded-lg border",
                        errors.graduationYear ? "border-red-500" : "border-gray-200"
                      )}
                      placeholder="2023" 
                    />
                    {errors.graduationYear && <p className="text-red-500 text-xs mt-1">{errors.graduationYear.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Education Proof (Certificate/Marklist)</label>
                    <input 
                      type="file" 
                      accept="image/*"
                      className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-pink-50 file:text-pink-700 hover:file:bg-pink-100"
                      onChange={(e) => handleFileChange(e, 'educationProof')}
                    />
                    {errors.educationProof && <p className="text-red-500 text-xs mt-1">{errors.educationProof.message}</p>}
                    {formData.educationProof && (
                      <div className="mt-2">
                        <img src={formData.educationProof} alt="Education Proof Preview" className="h-20 object-contain border rounded" />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold mb-4">Work Experience & Identity</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Current Role</label>
                    <input 
                      {...register('currentRole')}
                      className={cn(
                        "w-full px-4 py-2 rounded-lg border",
                        errors.currentRole ? "border-red-500" : "border-gray-200"
                      )}
                      placeholder="e.g. Software Printing and Packaging Cross Courses" 
                    />
                    {errors.currentRole && <p className="text-red-500 text-xs mt-1">{errors.currentRole.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                    <input 
                      {...register('company')}
                      className={cn(
                        "w-full px-4 py-2 rounded-lg border",
                        errors.company ? "border-red-500" : "border-gray-200"
                      )}
                      placeholder="e.g. Google" 
                    />
                    {errors.company && <p className="text-red-500 text-xs mt-1">{errors.company.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Years of Experience</label>
                    <input 
                      type="number" 
                      {...register('experienceYears')}
                      className={cn(
                        "w-full px-4 py-2 rounded-lg border",
                        errors.experienceYears ? "border-red-500" : "border-gray-200"
                      )}
                      placeholder="2" 
                    />
                    {errors.experienceYears && <p className="text-red-500 text-xs mt-1">{errors.experienceYears.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address Proof (Aadhar/Voter ID)</label>
                    <input 
                      type="file" 
                      accept="image/*"
                      className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-pink-50 file:text-pink-700 hover:file:bg-pink-100"
                      onChange={(e) => handleFileChange(e, 'addressProof')}
                    />
                    {errors.addressProof && <p className="text-red-500 text-xs mt-1">{errors.addressProof.message}</p>}
                    {formData.addressProof && (
                      <div className="mt-2">
                        <img src={formData.addressProof} alt="Address Proof Preview" className="h-20 object-contain border rounded" />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {currentStep === 4 && (
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold mb-4">Choose Your Course</h3>
                  <p className="text-gray-500 text-sm">Select one or more courses. Our admin will review your application and assign the final course.</p>
                  
                  <div className="grid grid-cols-1 gap-4">
                    {financialSettings?.coursesConfig && Array.isArray(financialSettings.coursesConfig) && financialSettings.coursesConfig.map((config: any) => {
                      const courseId = config.courseId;
                      return (
                        <button
                          key={courseId}
                          type="button"
                          onClick={() => toggleCourse(courseId)}
                          className={cn(
                            "p-6 rounded-2xl border-2 text-left transition-all",
                            (requestedCourses || []).includes(courseId)
                              ? "border-pink-500 bg-pink-50"
                              : "border-gray-100 hover:border-pink-200"
                          )}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-bold text-gray-900">{config.title || config.name || formatCourseName(courseId as any)}</h4>
                            <div className="flex gap-2">
                              {(requestedCourses || []).includes(courseId) && <Check className="w-4 h-4 text-pink-600" />}
                              {config.level && (
                                <span className={cn(
                                  "px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider",
                                  config.level === 'Advanced' ? "bg-purple-100 text-purple-700" :
                                  config.level === 'Intermediate' ? "bg-orange-100 text-orange-700" : "bg-pink-100 text-pink-700"
                                )}>
                                  {config.level}
                                </span>
                              )}
                            </div>
                          </div>
                          <p className="text-sm text-gray-600">{config.description || `Master the principles and practices of ${config.title || config.name || formatCourseName(courseId as any)}.`}</p>
                          <div className="mt-3 flex gap-4 text-xs font-medium text-gray-500">
                            {config.durationMonths ? <span>Duration: {config.durationMonths} Months</span> : config.duration ? <span>Duration: {config.duration}</span> : null}
                            {config.fees && <span>Fees: ₹{config.fees.toLocaleString()}</span>}
                          </div>
                        </button>
                      );
                    })}

                    {(!financialSettings?.coursesConfig || (Array.isArray(financialSettings.coursesConfig) && financialSettings.coursesConfig.length === 0)) && (
                      <p className="text-center py-8 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        No courses available at the moment. Please contact the administrator.
                      </p>
                    )}
                  </div>
                  {errors.requestedCourses && <p className="text-red-500 text-xs mt-1">{errors.requestedCourses.message}</p>}

                  <div className="mt-8">
                    <h4 className="font-bold text-gray-900 mb-4">Mode of Study</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <label className="flex items-center p-4 border rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                        <input
                          type="radio"
                          value="physical"
                          {...register('modeOfStudy')}
                          className="w-4 h-4 text-pink-600 border-gray-300 focus:ring-pink-500"
                        />
                        <span className="ml-3 font-medium text-gray-900">Physical (In-person)</span>
                      </label>
                      <label className="flex items-center p-4 border rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                        <input
                          type="radio"
                          value="online"
                          {...register('modeOfStudy')}
                          className="w-4 h-4 text-pink-600 border-gray-300 focus:ring-pink-500"
                        />
                        <span className="ml-3 font-medium text-gray-900">Online</span>
                      </label>
                    </div>
                    {errors.modeOfStudy && <p className="text-red-500 text-xs mt-1">{errors.modeOfStudy.message}</p>}
                  </div>

                  {watch('modeOfStudy') === 'physical' && branches && branches.length > 0 && (
                    <div className="mt-8">
                      <h4 className="font-bold text-gray-900 mb-4">Select Study Center (Branch)</h4>
                      <select
                        {...register('branch')}
                        className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500 text-sm"
                      >
                        <option value="">Select a branch</option>
                        {branches.map((branch, idx) => (
                          <option key={idx} value={branch}>{branch}</option>
                        ))}
                      </select>
                      {errors.branch && <p className="text-red-500 text-xs mt-1">{errors.branch.message}</p>}
                    </div>
                  )}
                </div>
              )}

              {currentStep === 5 && (
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold mb-4">Review & Submit</h3>
                  <div className="bg-gray-50 p-6 rounded-xl space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Name</span>
                      <span className="font-medium">{formData.fullName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Emergency Contact</span>
                      <span className="font-medium">{formData.emergencyContact}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Blood Group</span>
                      <span className="font-medium">{formData.bloodGroup}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Home Address</span>
                      <span className="font-medium text-right max-w-[50%]">{formData.homeAddress}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Temporary Address</span>
                      <span className="font-medium text-right max-w-[50%]">{formData.temporaryAddress}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Qualification</span>
                      <span className="font-medium">{formData.qualification}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Experience</span>
                      <span className="font-medium">{formData.experienceYears} Years</span>
                    </div>
                    <div className="flex justify-between border-t border-gray-200 pt-3 mt-3">
                      <span className="text-gray-500">Mode of Study</span>
                      <span className="font-bold text-pink-600 capitalize">{formData.modeOfStudy}</span>
                    </div>
                    {formData.modeOfStudy === 'physical' && formData.branch && (
                      <div className="flex justify-between border-t border-gray-200 pt-3 mt-3">
                        <span className="text-gray-500">Study Center (Branch)</span>
                        <span className="font-bold text-pink-600">{formData.branch}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t border-gray-200 pt-3 mt-3">
                      <span className="text-gray-500">Requested Courses</span>
                      <div className="text-right">
                        {(requestedCourses || []).map(course => (
                          <p key={course} className="font-bold text-pink-600">
                            {formatCourseName(course)}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 italic">
                    By clicking submit, you agree to our terms and conditions for the training program.
                  </p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="mt-8 flex justify-between pt-8 border-t border-gray-100">
            <button
              type="button"
              onClick={onPrev}
              disabled={currentStep === 1}
              className="px-6 py-2 rounded-lg text-gray-600 font-medium hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            {currentStep === steps.length ? (
              <button
                type="submit"
                className="px-8 py-2 bg-pink-500 text-white rounded-lg font-bold hover:bg-pink-600 transition-colors"
              >
                Submit Application
              </button>
            ) : (
              <button
                type="button"
                onClick={onNext}
                className="px-8 py-2 bg-pink-500 text-white rounded-lg font-bold hover:bg-pink-600 transition-colors"
              >
                Next Step
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
