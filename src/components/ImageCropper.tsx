import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { X, RotateCw, Check, Maximize } from 'lucide-react';
import { cn } from '../utils';

interface ImageCropperProps {
  imageSrc: string;
  onCropComplete: (croppedImage: string) => void;
  onCancel: () => void;
  aspect?: number;
  shape?: 'rect' | 'round';
  lockAspect?: boolean;
}

export default function ImageCropper({ 
  imageSrc, 
  onCropComplete, 
  onCancel, 
  aspect = 1, 
  shape = 'rect',
  lockAspect = true
}: ImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const onCropCompleteCallback = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.setAttribute('crossOrigin', 'anonymous');
      image.src = url;
    });

  const getRadianAngle = (degreeValue: number) => {
    return (degreeValue * Math.PI) / 180;
  };

  const rotateSize = (width: number, height: number, rotation: number) => {
    const rotRad = getRadianAngle(rotation);
    return {
      width: Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
      height: Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
    };
  };

  const getCroppedImg = async (
    imageSrc: string,
    pixelCrop: any,
    rotation = 0,
    flip = { horizontal: false, vertical: false }
  ): Promise<string> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      return '';
    }

    const rotRad = getRadianAngle(rotation);
    const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
      image.width,
      image.height,
      rotation
    );

    canvas.width = bBoxWidth;
    canvas.height = bBoxHeight;

    ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
    ctx.rotate(rotRad);
    ctx.scale(flip.horizontal ? -1 : 1, flip.vertical ? -1 : 1);
    ctx.translate(-image.width / 2, -image.height / 2);

    ctx.drawImage(image, 0, 0);

    const data = ctx.getImageData(
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height
    );

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.putImageData(data, 0, 0);

    // Limit output size to max 1200px dimension
    const maxDim = 1200;
    if (canvas.width > maxDim || canvas.height > maxDim) {
      const scale = maxDim / Math.max(canvas.width, canvas.height);
      const scaledCanvas = document.createElement('canvas');
      scaledCanvas.width = canvas.width * scale;
      scaledCanvas.height = canvas.height * scale;
      const scaledCtx = scaledCanvas.getContext('2d');
      if (scaledCtx) {
        scaledCtx.drawImage(canvas, 0, 0, scaledCanvas.width, scaledCanvas.height);
        return scaledCanvas.toDataURL('image/jpeg', 0.8);
      }
    }

    return canvas.toDataURL('image/jpeg', 0.8);
  };

  const handleSave = async () => {
    try {
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels, rotation);
      onCropComplete(croppedImage);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl overflow-hidden flex flex-col h-[80vh]">
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-semibold">Crop & Rotate Image</h3>
          <button onClick={onCancel} className="p-1 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="relative flex-1 bg-gray-900">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={aspect}
            cropShape={shape}
            onCropChange={setCrop}
            onCropComplete={onCropCompleteCallback}
            onZoomChange={setZoom}
            onRotationChange={setRotation}
            showGrid={true}
          />
        </div>
        
        <div className="p-4 border-t bg-gray-50 flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium w-24">Rotation</span>
            <div className="flex gap-2">
              <button 
                onClick={() => setRotation((prev) => (prev - 90) % 360)}
                className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                title="Rotate Left"
              >
                <RotateCw className="w-5 h-5 transform -scale-x-100" />
              </button>
              <button 
                onClick={() => setRotation((prev) => (prev + 90) % 360)}
                className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                title="Rotate Right"
              >
                <RotateCw className="w-5 h-5" />
              </button>
              <input
                type="range"
                value={rotation}
                min={0}
                max={360}
                step={1}
                aria-labelledby="Rotation"
                onChange={(e) => setRotation(Number(e.target.value))}
                className="flex-1 accent-pink-600 ml-4"
              />
              <span className="text-xs font-mono w-8">{rotation}°</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm font-medium w-24">Zoom</span>
            <div className="flex-1 flex gap-4 items-center">
              <input
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                aria-labelledby="Zoom"
                onChange={(e) => setZoom(Number(e.target.value))}
                className="flex-1 accent-pink-600"
              />
              <button 
                onClick={() => setZoom(1)} 
                className="flex items-center gap-1.5 px-3 py-1 bg-white border border-gray-200 rounded-lg text-xs font-bold hover:bg-gray-50 transition-colors flex-shrink-0"
              >
                <Maximize className="w-3 h-3" />
                Fit Screen
              </button>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              Save Image
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
