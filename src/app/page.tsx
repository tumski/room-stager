'use client'

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target?.files?.[0];
    if (file?.type?.startsWith('image/')) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('roomImage', selectedFile);

    try {
      const response = await fetch('/api/stage-room', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        const params = new URLSearchParams({
          original: data.originalImageUrl,
          staged: data.stagedImageUrl,
        });
        router.push(`/result?${params.toString()}`);
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Error uploading image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Room <span className="text-indigo-600">Stager</span>
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-12">
            Transform your room photos with AI-powered staging using Google&apos;s nano-banana model
          </p>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8">
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-12 text-center">
              {selectedFile ? (
                <div className="space-y-4">
                  <div className="w-32 h-32 mx-auto bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                    <span className="text-4xl">📷</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{selectedFile.name}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                  >
                    Choose different image
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="w-32 h-32 mx-auto bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                    <span className="text-4xl">🏠</span>
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
                    >
                      Upload Room Photo
                    </button>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                      Supports JPG, PNG files
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {selectedFile && (
            <button
              type="button"
              onClick={handleUpload}
              disabled={isUploading}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-12 py-4 rounded-xl font-semibold text-lg hover:from-indigo-700 hover:to-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? (
                <span className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Staging Room...
                </span>
              ) : (
                'Stage My Room'
              )}
            </button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          <div className="mt-16 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Powered by Google&apos;s nano-banana model via fal.ai
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
