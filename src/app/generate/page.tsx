'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

interface ImageToProcess {
  id: string;
  name: string;
  path: string;
  keywords?: string[];
  isProcessing?: boolean;
  error?: string;
}

export default function GeneratePage() {
  const [apiKey, setApiKey] = useState('');
  const [images, setImages] = useState<ImageToProcess[]>([]);
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);

  useEffect(() => {
    // Get images from localStorage
    const storedImages = localStorage.getItem('imagesForKeywords');
    if (storedImages) {
      setImages(JSON.parse(storedImages));
      // Clear localStorage after getting the images
      localStorage.removeItem('imagesForKeywords');
    }
  }, []);

  const handleGenerateKeywords = async (imageIndex: number) => {
    if (!apiKey) {
      alert('Please enter your OpenAI API key');
      return;
    }

    setImages(prev => prev.map((img, idx) => 
      idx === imageIndex ? { ...img, isProcessing: true, error: undefined } : img
    ));

    try {
      // Generate keywords
      const response = await fetch('/api/generate-keywords-single', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imagePath: images[imageIndex].path,
          imageId: images[imageIndex].id,
          apiKey,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate keywords');
      }

      // Update local state
      setImages(prev => prev.map((img, idx) => 
        idx === imageIndex ? { ...img, keywords: data.keywords, isProcessing: false } : img
      ));
    } catch (err) {
      const error = err instanceof Error ? err.message : 'An error occurred';
      setImages(prev => prev.map((img, idx) => 
        idx === imageIndex ? { ...img, error, isProcessing: false } : img
      ));
    }
  };

  const handleGenerateAll = async () => {
    if (!apiKey) {
      alert('Please enter your OpenAI API key');
      return;
    }

    setIsGeneratingAll(true);

    try {
      // Process images sequentially to avoid rate limits
      for (let i = 0; i < images.length; i++) {
        if (!images[i].keywords) {
          await handleGenerateKeywords(i);
        }
      }
    } finally {
      setIsGeneratingAll(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="mb-6">
        <label htmlFor="apiKey" className="block text-sm font-medium mb-2">
          OpenAI API Key
        </label>
        <input
          type="input"
          id="apiKey"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          className="w-full p-2 border rounded-md"
          placeholder="Enter your OpenAI API key"
        />
      </div>

      {images.length > 0 && (
        <>
          <div className="mb-4">
            <Button
              onClick={handleGenerateAll}
              disabled={isGeneratingAll || !apiKey}
              className="w-full"
            >
              {isGeneratingAll ? 'Generating...' : 'Generate All Keywords'}
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Preview</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Keywords</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {images.map((image, index) => (
                <TableRow key={image.id}>
                  <TableCell>
                    <div className="relative w-32 h-32">
                      <Image
                        src={image.path}
                        alt={image.name}
                        fill
                        className="object-cover rounded"
                      />
                    </div>
                  </TableCell>
                  <TableCell>{image.name}</TableCell>
                  <TableCell>
                    {image.keywords ? (
                      <div className="flex flex-wrap gap-1">
                        {image.keywords.map((keyword, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-gray-100 rounded-full text-sm"
                          >
                            {keyword}
                          </span>
                        ))}
                      </div>
                    ) : image.error ? (
                      <div className="text-red-500">{image.error}</div>
                    ) : (
                      <div className="text-gray-500">No keywords generated yet</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      onClick={() => handleGenerateKeywords(index)}
                      disabled={image.isProcessing || !apiKey}
                    >
                      {image.isProcessing ? 'Generating...' : 'Generate Keywords'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      )}

      {images.length === 0 && (
        <div className="text-center text-gray-500 mt-8">
          No images selected. Please select images from the gallery to generate keywords.
        </div>
      )}
    </div>
  );
}
