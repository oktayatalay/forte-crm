'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

interface UserPhotoUploadProps {
  currentImage?: string | null;
  onImageUpdate: (imageData: string) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showUploadButton?: boolean;
  userId?: number;
  isAdmin?: boolean;
}

export default function UserPhotoUpload({
  currentImage,
  onImageUpdate,
  className = '',
  size = 'md',
  showUploadButton = true,
  userId,
  isAdmin = false
}: UserPhotoUploadProps) {
  const [showCropModal, setShowCropModal] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<Crop>();
  const [isUploading, setIsUploading] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-16 h-16',
    lg: 'w-24 h-24'
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Lütfen bir resim dosyası seçin');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setUploadedImage(reader.result as string);
      setShowCropModal(true);
    };
    reader.readAsDataURL(file);
  };

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    
    // Create a square crop in the center
    const crop = centerCrop(
      makeAspectCrop(
        {
          unit: '%',
          width: 80,
        },
        1, // 1:1 aspect ratio for square
        width,
        height,
      ),
      width,
      height,
    );

    setCrop(crop);
  };

  const applyCropAndUpload = async () => {
    if (!completedCrop || !uploadedImage || !imgRef.current) {
      toast.error('Kırpma ayarları eksik');
      return;
    }

    setIsUploading(true);

    try {
      // Create canvas to crop image
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const img = imgRef.current;
      
      // Set canvas size to 600x600
      canvas.width = 600;
      canvas.height = 600;

      // Calculate crop area - ReactCrop provides pixel coordinates relative to displayed image
      // We need to scale these to natural image size
      const scaleX = img.naturalWidth / img.width;
      const scaleY = img.naturalHeight / img.height;
      
      const pixelCrop = {
        x: completedCrop.x,
        y: completedCrop.y,
        width: completedCrop.width,
        height: completedCrop.height
      };

      // Scale to natural image dimensions
      const sourceX = pixelCrop.x * scaleX;
      const sourceY = pixelCrop.y * scaleY;
      const sourceWidth = pixelCrop.width * scaleX;
      const sourceHeight = pixelCrop.height * scaleY;

      // Draw cropped image to canvas at 600x600
      ctx.drawImage(
        img,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        600,
        600
      );

      // Convert to base64
      const croppedImageBase64 = canvas.toDataURL('image/jpeg', 0.9);

      // If userId and isAdmin are provided, update via API
      if (userId && isAdmin) {
        const token = localStorage.getItem('admin_token');
        const response = await fetch('/api/admin/update-user-photo.php', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: userId,
            image_data: croppedImageBase64
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          toast.error(data.message || 'Fotoğraf güncellenemedi');
          return;
        }
      }

      // Call the callback with the image data
      onImageUpdate(croppedImageBase64);
      
      setShowCropModal(false);
      setUploadedImage(null);
      toast.success('Fotoğraf başarıyla güncellendi');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Fotoğraf yüklenirken hata oluştu');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <div className={`relative ${className}`}>
        <div 
          className={`${sizeClasses[size]} rounded-full cursor-pointer group relative overflow-hidden`}
          onClick={() => fileInputRef.current?.click()}
        >
          {currentImage ? (
            <img
              src={currentImage}
              alt="Profile"
              className="w-full h-full object-cover border-2 border-gray-200 group-hover:border-purple-400 transition-colors"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center border-2 border-gray-200 group-hover:border-purple-400 transition-colors">
              <span className="text-white font-medium text-sm">
                📷
              </span>
            </div>
          )}
          
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <span className="text-white text-xs">
              {currentImage ? 'Değiştir' : 'Ekle'}
            </span>
          </div>
        </div>

        {showUploadButton && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="mt-2"
          >
            📷 {currentImage ? 'Değiştir' : 'Fotoğraf Ekle'}
          </Button>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />

      {/* Crop Modal */}
      {showCropModal && uploadedImage && (
        <Dialog open={showCropModal} onOpenChange={setShowCropModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Fotoğrafı Kırp (600x600px)</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="max-h-96 overflow-auto">
                <ReactCrop
                  crop={crop}
                  onChange={(c) => setCrop(c)}
                  onComplete={(c) => setCompletedCrop(c)}
                  aspect={1}
                  circularCrop={false}
                  ruleOfThirds={true}
                >
                  <img
                    ref={imgRef}
                    src={uploadedImage}
                    alt="Crop"
                    onLoad={onImageLoad}
                    className="max-w-full max-h-[400px]"
                  />
                </ReactCrop>
              </div>
              
              <div className="flex justify-end space-x-3">
                <Button 
                  variant="outline" 
                  onClick={() => setShowCropModal(false)}
                  disabled={isUploading}
                >
                  İptal
                </Button>
                <Button 
                  onClick={applyCropAndUpload} 
                  disabled={!completedCrop || isUploading}
                >
                  {isUploading ? 'Kaydediliyor...' : 'Kaydet'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}