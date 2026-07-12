import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { onSnapshot, doc } from 'firebase/firestore';
import { db } from './firebase';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getDirectDownloadUrl = (url: string) => {
  if (!url) return '';
  
  try {
    let absoluteUrl = url.trim();
    if (absoluteUrl.startsWith('/')) {
      return absoluteUrl;
    }
    if (!/^(f|ht)tps?:\/\//i.test(absoluteUrl)) {
      if (absoluteUrl.startsWith('//')) {
        absoluteUrl = 'https:' + absoluteUrl;
      } else {
        absoluteUrl = 'https://' + absoluteUrl;
      }
    }

    // Handle Google Drive links
    if (absoluteUrl.includes('drive.google.com')) {
      const driveMatch = absoluteUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || absoluteUrl.match(/id=([a-zA-Z0-9_-]+)/);
      if (driveMatch && driveMatch[1]) {
        return `https://drive.google.com/uc?export=download&id=${driveMatch[1]}`;
      }
    }
    
    // Handle Dropbox links
    if (absoluteUrl.includes('dropbox.com')) {
      return absoluteUrl.replace('dl=0', 'dl=1');
    }
    
    return absoluteUrl;
  } catch (e) {
    return url;
  }
};

export const compressImage = (file: File, maxWidth = 1200, maxHeight = 1200, quality = 0.7): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Use webp for png to preserve transparency while allowing compression
        const outputType = (file.type === 'image/png' || file.type === 'image/webp') ? 'image/webp' : 'image/jpeg';
        let currentQuality = quality;
        let dataUrl = canvas.toDataURL(outputType, currentQuality);
        
        // Firestore document limit is 1MB. 
        // We keep the base64 string under 1,000,000 characters (~750KB) to be safe.
        while (dataUrl.length > 1000000) {
          if (currentQuality > 0.3 && !dataUrl.startsWith('data:image/png')) {
            currentQuality -= 0.1;
          } else {
            // If quality is already low or browser fell back to PNG, reduce dimensions
            width = Math.round(width * 0.8);
            height = Math.round(height * 0.8);
            canvas.width = width;
            canvas.height = height;
            ctx?.clearRect(0, 0, width, height);
            ctx?.drawImage(img, 0, 0, width, height);
          }
          dataUrl = canvas.toDataURL(outputType, currentQuality);
      }

      resolve(dataUrl);
    };
    img.onerror = (error) => reject(error);
  };
  reader.onerror = (error) => reject(error);
});
};

export function calculateSLADate(startDate: Date, holidays: { date: string }[]): string {
  let daysToAdd = 2;
  let currentDate = new Date(startDate);
  
  while (daysToAdd > 0) {
    currentDate.setDate(currentDate.getDate() + 1);
    const dayOfWeek = currentDate.getDay();
    const dateString = currentDate.toISOString().split('T')[0];
    const isHoliday = holidays.some(h => h.date === dateString);
    
    // 0 is Sunday, 6 is Saturday
    if (dayOfWeek !== 0 && dayOfWeek !== 6 && !isHoliday) {
      daysToAdd--;
    }
  }
  
  return currentDate.toISOString();
}

const courseTitlesMap: Record<string, string> = {
  'packaging-engineer': 'Diploma in Packaging Engineer',
  'production-art-engineer': 'Diploma in Production Art Engineer',
  'print-ready-engineer': 'Diploma in Print Ready Engineer',
  'plate-ready-engineer': 'Diploma in Plate Ready Engineer',
  'colour-retouching-engineer': 'Diploma in Colour Retouching Engineer',
  'quality-control-engineer': 'Diploma in Quality Control Engineer',
  'printing-and-packaging-cross-courses': 'Diploma in Printing and Packaging Cross Courses'
};

// Initialize active real-time subscription to always capture dynamic course fees titles
try {
  onSnapshot(doc(db, 'settings', 'financial'), (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.data();
      if (data && Array.isArray(data.coursesConfig)) {
        data.coursesConfig.forEach((config: any) => {
          if (config.courseId && config.title) {
            let title = config.title;
            if (!title.startsWith('Diploma in')) {
              title = `Diploma in ${title}`;
            }
            courseTitlesMap[config.courseId] = title;
          }
        });
      }
    }
  }, (err) => {
    console.warn("Failed to subscribe to settings/financial for course mapping:", err);
  });
} catch (e) {
  console.error("Initialization of financial settings stream failed:", e);
}

export const formatCourseName = (course: string) => {
  const title = courseTitlesMap[course] || course.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  if (title && !title.startsWith('Diploma in')) {
    return `Diploma in ${title}`;
  }
  return title;
};

export const getScoreKey = (course: string): string => {
  if (course === 'printing-and-packaging-cross-courses') return 'printingAndPackagingCrossCourses';
  return course.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
};

export function getOrdinalSuffix(num: number | string): string {
  const n = Number(num);
  if (isNaN(n) || n <= 0) return String(num);
  const j = n % 10;
  const k = n % 100;
  if (j === 1 && k !== 11) {
    return n + "st";
  }
  if (j === 2 && k !== 12) {
    return n + "nd";
  }
  if (j === 3 && k !== 13) {
    return n + "rd";
  }
  return n + "th";
}
