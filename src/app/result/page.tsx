'use client'

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

function ResultContent() {
  const [stagedImageUrl, setStagedImageUrl] = useState<string | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const staged = searchParams.get('staged');
    const original = searchParams.get('original');
    if (staged && original) {
      setStagedImageUrl(decodeURIComponent(staged));
      setOriginalImageUrl(decodeURIComponent(original));
    } else {
      router.push('/');
    }
    setIsLoading(false);
  }, [searchParams, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">Loading your staged room...</p>
        </div>
      </div>
    );
  }

  if (!stagedImageUrl) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">No image found</h1>
          <Link href="/" className="text-indigo-600 hover:text-indigo-800 font-medium">
            Return to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Your <span className="text-indigo-600">Staged</span> Room
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Here&apos;s your room transformed with AI-powered staging
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
              <div className="p-6">
                <h2 className="font-semibold text-gray-900 dark:text-white mb-3">Before</h2>
                <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={originalImageUrl || ''}
                    alt="Original room"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
              <div className="p-6">
                <h2 className="font-semibold text-gray-900 dark:text-white mb-3">After</h2>
                <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={stagedImageUrl}
                    alt="Staged room"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="text-center space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/"
                className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
              >
                Stage Another Room
              </Link>
              <button
                type="button"
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = stagedImageUrl;
                  link.download = 'staged-room.jpg';
                  link.click();
                }}
                className="bg-white dark:bg-gray-800 text-indigo-600 border border-indigo-600 px-8 py-3 rounded-xl font-semibold hover:bg-indigo-50 dark:hover:bg-gray-700 transition-colors"
              >
                Download Image
              </button>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Powered by Google&apos;s nano-banana model via fal.ai
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResultPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    }>
      <ResultContent />
    </Suspense>
  );
}