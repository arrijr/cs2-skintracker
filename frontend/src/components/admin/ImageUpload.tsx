// frontend/src/components/admin/ImageUpload.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, X, Link as LinkIcon } from 'lucide-react';

interface ImageUploadProps {
  onUpload: (imageUrl: string) => void;
  onClose: () => void;
}

export default function ImageUpload({ onUpload, onClose }: ImageUploadProps) {
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleUrlSubmit = () => {
    if (imageUrl.trim()) {
      onUpload(imageUrl.trim());
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // For now, we'll just use a placeholder URL
    // In a real implementation, you'd upload to a service like Cloudinary, AWS S3, etc.
    const placeholderUrl = `https://via.placeholder.com/800x400?text=${encodeURIComponent(file.name)}`;
    
    setUploading(true);
    setTimeout(() => {
      onUpload(placeholderUrl);
      setUploading(false);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Add Image</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Image URL</label>
            <div className="flex space-x-2">
              <Input
                placeholder="https://example.com/image.jpg"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
              />
              <Button onClick={handleUrlSubmit} disabled={!imageUrl.trim()}>
                <LinkIcon className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="text-center text-sm text-gray-500">or</div>

          <div>
            <label className="text-sm font-medium mb-2 block">Upload File</label>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
              <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-500 mb-2">
                {uploading ? 'Uploading...' : 'Click to upload or drag and drop'}
              </p>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload">
                <Button 
                  variant="outline" 
                  disabled={uploading}
                  className="cursor-pointer"
                >
                  Choose File
                </Button>
              </label>
            </div>
          </div>

          <div className="text-xs text-gray-500">
            Note: File uploads are currently simulated. In production, implement proper image hosting.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
