import React, { useRef } from 'react';
import imageCompression from 'browser-image-compression';
import { Camera } from 'lucide-react';
import toast from 'react-hot-toast';

interface ImageUploadProps {
  currentImage?: string;
  onImageSelected: (file: File, previewUrl: string) => void;
  shape?: 'circle' | 'square';
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

const sizeMap = {
  sm: 'w-20 h-20',
  md: 'w-32 h-32',
  lg: 'w-40 h-40',
};

const ImageUpload: React.FC<ImageUploadProps> = ({
  currentImage,
  onImageSelected,
  shape = 'circle',
  size = 'md',
  label = 'Upload Photo',
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 800,
        useWebWorker: true,
      });
      const url = URL.createObjectURL(compressed);
      onImageSelected(compressed as File, url);
    } catch {
      toast.error('Failed to process image');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const shapeClass = shape === 'circle' ? 'rounded-full' : 'rounded-2xl';

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={`relative ${sizeMap[size]} ${shapeClass} overflow-hidden cursor-pointer group bg-amber-100 dark:bg-slate-700 border-2 border-dashed border-amber-300 dark:border-slate-500`}
        onClick={() => inputRef.current?.click()}
      >
        {currentImage ? (
          <img src={currentImage} alt="Upload" className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center justify-center w-full h-full text-amber-400 dark:text-slate-400">
            <Camera size={24} />
          </div>
        )}
        <div className={`absolute inset-0 ${shapeClass} bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity`}>
          <Camera size={20} className="text-white" />
        </div>
      </div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="text-sm text-amber-600 dark:text-amber-400 hover:underline"
      >
        {label}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
};

export default ImageUpload;
