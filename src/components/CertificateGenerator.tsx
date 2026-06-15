import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import { Award, Download, ShieldCheck, Star, Calendar, User as UserIcon } from 'lucide-react';
import { User, CourseType } from '../types';
import { cn, formatCourseName } from '../utils';

interface CertificateGeneratorProps {
  user: User;
  course: CourseType;
  logoUrl?: string;
  adminSignature?: string;
  grade?: string;
  durationMonths?: number;
}

export default function CertificateGenerator({ user, course, logoUrl, adminSignature, grade, durationMonths }: CertificateGeneratorProps) {
  const [generating, setGenerating] = useState(false);

  const courseName = formatCourseName(course);

  const startDateStr = user.admissionDate || user.createdAt;
  const startDate = startDateStr ? new Date(startDateStr) : new Date();
  const endDateStr = user.certificateIssuedDate || new Date().toISOString();
  const endDate = new Date(endDateStr);

  let calculatedMonthsDuration = (endDate.getFullYear() - startDate.getFullYear()) * 12 + (endDate.getMonth() - startDate.getMonth());
  if (calculatedMonthsDuration <= 0) calculatedMonthsDuration = 6;
  const displayDurationMonths = durationMonths || calculatedMonthsDuration;

  const formattedStartDate = startDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const formattedEndDate = endDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  
  let pronounSubject = 'They';
  const genderStr = user.applicationData?.gender?.toLowerCase() || '';
  if (genderStr === 'male' || genderStr === 'm') pronounSubject = 'He';
  if (genderStr === 'female' || genderStr === 'f') pronounSubject = 'She';

  const generateCertificate = async () => {
    setGenerating(true);
    try {
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      const width = doc.internal.pageSize.getWidth();
      const height = doc.internal.pageSize.getHeight();

      // Background - Light Cream
      doc.setFillColor(252, 250, 242);
      doc.rect(0, 0, width, height, 'F');

      // Ornate Border
      doc.setDrawColor(219, 39, 119); // Pink-600
      doc.setLineWidth(2);
      doc.rect(5, 5, width - 10, height - 10);
      
      doc.setDrawColor(244, 114, 182); // Pink-400
      doc.setLineWidth(0.5);
      doc.rect(7, 7, width - 14, height - 14);

      // Corner designs (simulated with circles/lines)
      const drawCorner = (x: number, y: number) => {
        doc.setFillColor(219, 39, 119);
        doc.circle(x, y, 3, 'F');
      };
      drawCorner(7, 7);
      drawCorner(width - 7, 7);
      drawCorner(7, height - 7);
      drawCorner(width - 7, height - 7);

      // Logo Placeholder (If URL provided)
      if (logoUrl) {
        try {
          doc.addImage(logoUrl, 'PNG', width / 2 - 30, 20, 60, 25);
        } catch (e) {
          console.error("Could not load logo for PDF", e);
          doc.setFontSize(24);
          doc.setTextColor(219, 39, 119);
          doc.text("ENDLESS SPARK", width / 2, 35, { align: 'center' });
        }
      } else {
        doc.setFontSize(24);
        doc.setTextColor(219, 39, 119);
        doc.text("ENDLESS SPARK", width / 2, 35, { align: 'center' });
      }

      doc.setFontSize(14);
      doc.setTextColor(107, 114, 128); // Gray-500
      doc.text("SCHOOL OF PRINTING AND PACKAGING", width / 2, 45, { align: 'center' });

      // Title
      doc.setFontSize(40);
      doc.setTextColor(17, 24, 39); // Gray-900
      doc.setFont('helvetica', 'bold');
      doc.text("CERTIFICATE", width / 2, 70, { align: 'center' });
      
      doc.setFontSize(20);
      doc.setFont('helvetica', 'normal');
      doc.text("OF COMPLETION", width / 2, 82, { align: 'center' });

      // Awarded To
      doc.setFontSize(16);
      doc.setTextColor(107, 114, 128);
      doc.text("This is to certify that", width / 2, 105, { align: 'center' });

      doc.setFontSize(32);
      doc.setTextColor(219, 39, 119);
      doc.setFont('times', 'bolditalic');
      doc.text(user.name.toUpperCase(), width / 2, 120, { align: 'center' });

      // Description
      doc.setFontSize(14);
      doc.setTextColor(107, 114, 128);
      doc.setFont('helvetica', 'normal');
      
      const line1 = `successfully completed the ${displayDurationMonths}-month Premedia Master Program training`;
      const line2 = `from ${formattedStartDate} to ${formattedEndDate}. ${pronounSubject} achieved an ${grade || 'A+'} grade`;
      const line3 = `and was awarded the certification title of`;

      doc.text(line1, width / 2, 135, { align: 'center' });
      doc.text(line2, width / 2, 143, { align: 'center' });
      doc.text(line3, width / 2, 151, { align: 'center' });

      // Course Name (Certification Title)
      doc.setFontSize(22);
      doc.setTextColor(31, 41, 55);
      doc.setFont('helvetica', 'bold');
      doc.text(courseName.toUpperCase(), width / 2, 165, { align: 'center' });

      // Date and Student ID (lower section)
      doc.setFontSize(12);
      doc.setTextColor(107, 114, 128);
      doc.setFont('helvetica', 'normal');
      doc.text(`Issued on: ${formattedEndDate}`, 40, 185);
      doc.text(`Student ID: ${user.studentId || user.id}`, 40, 192);

      // Signatures
      doc.setDrawColor(209, 213, 219);
      doc.line(width - 90, 185, width - 40, 185);
      doc.setFontSize(12);
      doc.text("Founder & CEO", width - 65, 192, { align: 'center' });

      if (adminSignature) {
        try {
          doc.addImage(adminSignature, 'PNG', width - 85, 165, 50, 20);
        } catch (e) {
          console.error("Signature loading failed", e);
        }
      }

      // Digital Verification Token (Mock)
      const token = `ES-${course.substring(0,2).toUpperCase()}-${Math.random().toString(36).substring(2,8).toUpperCase()}`;
      doc.setFontSize(8);
      doc.setTextColor(156, 163, 175);
      doc.text(`Verify at: endlessspark.edu/verify/${token}`, width / 2, height - 15, { align: 'center' });

      doc.save(`EndlessSpark_Certificate_${user.name.replace(/\s+/g, '_')}.pdf`);
    } catch (error) {
      console.error("Error generating certificate:", error);
      alert("Failed to generate certificate. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-pink-50 to-orange-50 p-8 rounded-3xl border border-pink-100 shadow-sm relative overflow-hidden group">
      <div className="absolute -right-4 -top-4 w-32 h-32 bg-pink-200/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
      <div className="absolute -left-4 -bottom-4 w-32 h-32 bg-orange-200/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700 pointer-events-none" />
      
      <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
        <div className="w-24 h-24 bg-white rounded-2xl shadow-lg flex items-center justify-center text-pink-600 flex-shrink-0 animate-in zoom-in duration-500">
          <Award className="w-12 h-12" />
        </div>
        
        <div className="flex-1 text-center md:text-left">
          <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center justify-center md:justify-start gap-2">
            Course Completion Certificate
            <ShieldCheck className="w-5 h-5 text-green-500" />
          </h2>
          <p className="text-gray-600 mb-4 max-w-xl text-sm leading-relaxed text-center md:text-left">
            This is to certify that <span className="font-bold text-gray-900">{user.name}</span> has successfully completed the <span className="font-bold text-gray-900">{displayDurationMonths}-month</span> Premedia Master Program training from <span className="font-bold text-gray-900">{formattedStartDate}</span> to <span className="font-bold text-gray-900">{formattedEndDate}</span>. {pronounSubject} achieved an <span className="font-bold text-pink-600">{grade || 'A+'}</span> grade and was awarded the certification title of <span className="font-bold text-pink-600">{courseName}</span>.
          </p>
          
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/60 rounded-lg border border-pink-100 text-xs font-bold text-pink-700">
              <Star className="w-3.5 h-3.5" />
              Graduated: {new Date().toLocaleDateString()}
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/60 rounded-lg border border-pink-100 text-xs font-bold text-gray-700">
              <UserIcon className="w-3.5 h-3.5" />
              ID: {user.studentId}
            </div>
            {grade && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-lg border border-green-100 text-xs font-bold text-green-700">
                <Award className="w-3.5 h-3.5" />
                Grade: {grade}
              </div>
            )}
          </div>
        </div>

        <button
          onClick={generateCertificate}
          disabled={generating}
          className={cn(
            "flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-lg transition-all shadow-xl active:scale-95 flex-shrink-0",
            generating 
              ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
              : "bg-pink-600 text-white hover:bg-pink-700 shadow-pink-200 hover:shadow-2xl hover:-translate-y-1"
          )}
        >
          {generating ? (
            <>
              <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Download className="w-6 h-6" />
              Download Certificate
            </>
          )}
        </button>
      </div>
    </div>
  );
}
