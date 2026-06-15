import React, { useState } from 'react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';
import { Upload, X, CheckCircle2, Loader2 } from 'lucide-react';
import { cn } from '../utils';

interface FileUploaderProps {
  onUploadComplete: (url: string) => void;
  onBeforeUpload?: (file: File) => Promise<boolean> | boolean;
  path: string;
  label?: string;
  accept?: string;
  className?: string;
}

export function FileUploader({ onUploadComplete, onBeforeUpload, path, label, accept = "*", className }: FileUploaderProps) {
  const [progress, setProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (onBeforeUpload) {
      const canUpload = await onBeforeUpload(file);
      if (!canUpload) return;
    }

    setIsUploading(true);
    setIsFinalizing(false);
    setProgress(0);
    setError(null);
    setFileName(file.name);

    let serverError: any = null;
    // Try server-side upload first to bypass potential CORS/iframe issues
    try {
      console.log('Attempting server-side upload for:', file.name);
      const formData = new FormData();
      formData.append('file', file);
      
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const p = Math.round((event.loaded / event.total) * 100);
          setProgress(p);
          if (p === 100) setIsFinalizing(true);
        }
      });

      const uploadPromise = new Promise((resolve, reject) => {
        xhr.timeout = 600000; // Increase to 10 min for large templates
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              if (!response.url) throw new Error("Server returned success but no URL.");
              resolve(response);
            } catch (e: any) {
              console.error("Parse error:", e, xhr.responseText);
              reject(new Error(`Server Error: Invalid response format. ${e.message}`));
            }
          } else {
            let errorMsg = `Server upload failed (Status ${xhr.status})`;
            try {
              const res = JSON.parse(xhr.responseText);
              if (res.error) errorMsg = res.error;
              console.error("Server upload error response:", res);
            } catch (e) {
              if (xhr.responseText && xhr.responseText.length < 500) {
                console.error("Server upload error raw response:", xhr.responseText);
                errorMsg = `Server error: ${xhr.responseText}`;
              }
            }
            reject(new Error(errorMsg));
          }
        };
        xhr.onerror = () => reject(new Error('Network error during server upload.'));
        xhr.ontimeout = () => {
          reject(new Error('Upload timed out. The file might be too large for the current connection.'));
        };
      });

      xhr.open('POST', `/api/upload-template?path=${encodeURIComponent(path)}`);
      xhr.send(formData);

      const data: any = await uploadPromise;
      onUploadComplete(data.url);
      setIsUploading(false);
      setIsFinalizing(false);
      setProgress(100);
      return;
    } catch (err: any) {
      console.warn('Server upload failed, falling back to direct client upload:', err);
      serverError = err;
    }

    // Client-side fallback
    console.log('Falling back to client-side Firebase Storage upload...');
    const storageRef = ref(storage, `${path}/${Date.now()}_${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const p = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        setProgress(p);
        if (p === 100) setIsFinalizing(true);
      },
      (err) => {
        console.error("Firebase Storage Upload Error:", err);
        // More descriptive error message based on common Firebase Storage errors
        let msg = serverError?.message || "Upload failed. Please check your internet and try again.";
        
        if (err.message.includes('permission-denied') || err.message.includes('unauthorized')) {
          msg = "Upload failed: Permission denied. Storage rules may be blocking this path or you are not signed in as an admin.";
        } else if (err.message.includes('quota-exceeded')) {
          msg = "Upload failed: Storage quota exceeded.";
        } else if (err.message.includes('retry-limit-exceeded')) {
          msg = "Upload failed: Timeout. The file might be too large or your connection is slow.";
        }
        
        setError(msg);
        setIsUploading(false);
        setIsFinalizing(false);
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        onUploadComplete(downloadURL);
        setIsUploading(false);
        setIsFinalizing(false);
      }
    );
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      
      <div className="relative">
        {!isUploading && !fileName && (
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors bg-white">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <Upload className="w-8 h-8 text-gray-400 mb-2" />
              <p className="text-sm text-gray-500">Click or drag to upload file</p>
              <p className="text-xs text-gray-400 mt-1">Maximum 5GB supported</p>
            </div>
            <input type="file" className="hidden" onChange={handleUpload} accept={accept} />
          </label>
        )}

        {isUploading && (
          <div className="w-full h-32 border-2 border-indigo-100 bg-indigo-50/30 rounded-xl flex flex-col items-center justify-center p-6">
            <div className="w-full flex justify-between mb-2">
              <span className="text-sm font-bold text-indigo-600 truncate max-w-[200px]">{fileName}</span>
              <span className="text-sm font-bold text-indigo-600">{isFinalizing ? '100' : Math.round(progress)}%</span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-indigo-600 transition-all duration-300 ease-out"
                style={{ width: `${isFinalizing ? 100 : progress}%` }}
              />
            </div>
            <p className="text-xs text-indigo-400 mt-3 flex items-center gap-2">
              <Loader2 className="w-3 h-3 animate-spin" />
              {isFinalizing ? 'Finalizing with Cloud Storage...' : 'Uploading to server... Do not close window.'}
            </p>
          </div>
        )}

        {!isUploading && fileName && !error && (
          <div className="w-full h-32 border-2 border-green-100 bg-green-50/30 rounded-xl flex flex-col items-center justify-center p-6">
            <CheckCircle2 className="w-8 h-8 text-green-600 mb-2" />
            <p className="text-sm font-bold text-green-700">Upload Successful!</p>
            <p className="text-xs text-green-600 truncate max-w-full px-4 mt-1">{fileName}</p>
            <button 
              onClick={() => { setFileName(null); setProgress(0); }}
              className="text-xs text-gray-400 underline mt-2 hover:text-gray-600"
            >
              Upload another file
            </button>
          </div>
        )}

        {error && (
          <div className="w-full min-h-32 border-2 border-red-100 bg-red-50/30 rounded-xl flex flex-col items-center justify-center p-4 text-center">
            <X className="w-8 h-8 text-red-500 mb-2 shrink-0" />
            <p className="text-xs font-semibold text-red-700 max-w-full break-words whitespace-pre-line leading-relaxed px-2">{error}</p>
            <button 
              onClick={() => { setError(null); setFileName(null); }}
              className="text-xs text-indigo-600 font-bold mt-3 shrink-0 hover:underline hover:text-indigo-800 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
