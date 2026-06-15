import React, { useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Camera, RefreshCw, Check, X, Upload } from 'lucide-react';

interface PhotoCaptureProps {
  onCapture: (image: string) => void;
  onCancel: () => void;
}

export default function PhotoCapture({ onCapture, onCancel }: PhotoCaptureProps) {
  const webcamRef = useRef<Webcam>(null);
  const [captured, setCaptured] = useState<string | null>(null);

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setCaptured(imageSrc);
    }
  }, [webcamRef]);

  const retake = () => {
    setCaptured(null);
  };

  const confirm = () => {
    if (captured) {
      onCapture(captured);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl overflow-hidden max-w-xl w-full">
        <div className="p-6 border-b flex justify-between items-center">
          <h3 className="text-xl font-bold">Capture Photo</h3>
          <button onClick={onCancel} className="p-2 hover:bg-gray-100 rounded-full">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="relative aspect-square flex items-center justify-center bg-gray-100">
          {!captured ? (
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              className="w-full h-full object-cover"
              videoConstraints={{
                aspectRatio: 1,
                facingMode: "user"
              }}
            />
          ) : (
            <img src={captured} alt="Captured" className="w-full h-full object-cover" />
          )}
        </div>

        <div className="p-8 flex justify-center gap-4">
          {!captured ? (
            <button
              type="button"
              onClick={capture}
              className="bg-pink-600 text-white px-8 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-pink-700 transition-colors"
            >
              <Camera className="w-5 h-5" />
              Take Photo
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={retake}
                className="bg-gray-100 text-gray-700 px-8 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-gray-200 transition-colors"
              >
                <RefreshCw className="w-5 h-5" />
                Retake
              </button>
              <button
                type="button"
                onClick={confirm}
                className="bg-pink-600 text-white px-8 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-pink-700 transition-colors"
              >
                <Check className="w-5 h-5" />
                Confirm
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
