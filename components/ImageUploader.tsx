
import React, { useRef, useState } from 'react';
import { Upload, X, Image as ImageIcon, Camera } from 'lucide-react';
import { Button } from './Button';

interface ImageUploaderProps {
  onImageSelected: (base64: string) => void;
  currentImage?: string;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageSelected, currentImage }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const processFile = (file: File) => {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        onImageSelected(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  if (currentImage) {
    return (
      <div className="relative group rounded-lg overflow-hidden border border-white/20 bg-black aspect-video flex items-center justify-center">
        <img src={currentImage} alt="Uploaded" className="max-w-full max-h-full object-contain opacity-80" />
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>Change</Button>
            <Button variant="ghost" onClick={() => onImageSelected('')} className="text-red-400 hover:text-red-300 hover:bg-red-900/20"><X size={18}/></Button>
        </div>
        <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            className="hidden" 
        />
      </div>
    );
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
        isDragging ? 'border-cyan-500 bg-cyan-900/20' : 'border-white/10 hover:border-white/30 bg-black/20'
      }`}
    >
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="image/*" 
        className="hidden" 
      />
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-gray-400">
             <Upload size={20} />
        </div>
        <div>
            <p className="text-sm font-medium text-gray-300">Drag & Drop or Click to Upload</p>
            <p className="text-xs text-gray-500 mt-1">Supports JPG, PNG</p>
        </div>
        <div className="flex gap-2 w-full mt-2">
            <Button variant="secondary" onClick={() => fileInputRef.current?.click()} className="flex-1 text-xs h-8">
                <ImageIcon size={14} className="mr-2"/> Upload Photo
            </Button>
            {/* Camera functionality would typically require more setup, keeping it visual for MVP */}
            <Button variant="outline" className="flex-1 text-xs h-8" disabled>
                <Camera size={14} className="mr-2"/> Camera
            </Button>
        </div>
      </div>
    </div>
  );
};
