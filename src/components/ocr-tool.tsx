"use client";

import { useState, useRef, ChangeEvent } from 'react';
import Image from 'next/image';
import { Upload, Clipboard, Check, Loader2, XCircle, Trash2 } from 'lucide-react';
import { extractTextFromImage } from '@/ai/flows/extract-text-from-image';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

interface ImageData {
  url: string;
  file: File;
}

interface ExtractionResult {
  text: string;
  isLoading: boolean;
  error: string | null;
  isCopied: boolean;
}

export default function OcrTool() {
  const [images, setImages] = useState<ImageData[]>([]);
  const [results, setResults] = useState<Record<string, ExtractionResult>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newImages: ImageData[] = Array.from(files).map(file => ({
        url: URL.createObjectURL(file),
        file: file,
      }));
      setImages(prev => [...prev, ...newImages]);

      const newResults: Record<string, ExtractionResult> = {};
      newImages.forEach(image => {
        newResults[image.url] = { text: '', isLoading: false, error: null, isCopied: false };
      });
      setResults(prev => ({ ...prev, ...newResults }));
    }
  };

  const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });

  const handleExtract = async (imageUrl: string, file: File) => {
    setResults(prev => ({
      ...prev,
      [imageUrl]: { ...prev[imageUrl], isLoading: true, error: null },
    }));

    try {
      const photoDataUri = await toBase64(file);
      const result = await extractTextFromImage({ photoDataUri });
      setResults(prev => ({
        ...prev,
        [imageUrl]: { ...prev[imageUrl], text: result.extractedText, isLoading: false },
      }));
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      setResults(prev => ({
        ...prev,
        [imageUrl]: { ...prev[imageUrl], error: errorMessage, isLoading: false },
      }));
      toast({
        variant: "destructive",
        title: "Extraction Failed",
        description: "Please try again with a different image.",
      });
    }
  };

  const handleCopy = (imageUrl: string) => {
    const textToCopy = results[imageUrl]?.text;
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy);
    setResults(prev => ({
      ...prev,
      [imageUrl]: { ...prev[imageUrl], isCopied: true },
    }));
    toast({
      title: "Copied to clipboard!",
      description: "The extracted text has been copied.",
    });
    setTimeout(() => {
      setResults(prev => ({
        ...prev,
        [imageUrl]: { ...prev[imageUrl], isCopied: false },
      }));
    }, 2000);
  };

  const removeImage = (imageUrl: string) => {
    setImages(prev => prev.filter(img => img.url !== imageUrl));
    const newResults = { ...results };
    delete newResults[imageUrl];
    setResults(newResults);
    URL.revokeObjectURL(imageUrl); // Clean up memory
  };

  const clearAll = () => {
    images.forEach(img => URL.revokeObjectURL(img.url));
    setImages([]);
    setResults({});
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  return (
    <Card className="w-full shadow-lg overflow-hidden border-border/50">
      <CardContent className="p-6 md:p-8">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-4 items-center justify-center">
            <div
              className="relative w-full aspect-video rounded-lg border-2 border-dashed border-muted-foreground/30 flex flex-col justify-center items-center text-center p-4 cursor-pointer hover:border-primary hover:bg-accent/20 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/*"
                className="hidden"
                multiple
              />
              <Upload className="h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-lg font-semibold text-foreground">Click to upload images</p>
              <p className="text-sm text-muted-foreground">PNG, JPG, WEBP, etc.</p>
            </div>
            {images.length > 0 && (
                <Button onClick={clearAll} variant="destructive" className="w-full md:w-auto">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Clear All ({images.length})
                </Button>
            )}
          </div>

          {images.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {images.map(({url, file}) => {
                const result = results[url] || { text: '', isLoading: false, error: null, isCopied: false };
                const { text, isLoading, error, isCopied } = result;
                
                return (
                  <Card key={url} className="overflow-hidden shadow-md">
                    <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-2">
                        <div className="relative aspect-video w-full">
                           <Image
                              src={url}
                              alt="Uploaded preview"
                              fill
                              className="object-contain rounded-md"
                              data-ai-hint="document photo"
                           />
                           <Button 
                              size="icon" 
                              variant="destructive" 
                              className="absolute top-2 right-2 h-7 w-7"
                              onClick={() => removeImage(url)}
                            >
                                <XCircle className="h-4 w-4" />
                            </Button>
                        </div>
                        <Button onClick={() => handleExtract(url, file)} disabled={isLoading} className="w-full">
                          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                          {isLoading ? 'Extracting...' : 'Extract Text'}
                        </Button>
                      </div>

                      <div className="flex flex-col gap-2">
                         <div className="flex justify-between items-center min-h-[32px]">
                            <h3 className="font-semibold">Extracted Text</h3>
                            {text && !isLoading && (
                                <Button variant="ghost" size="sm" onClick={() => handleCopy(url)}>
                                {isCopied ? <Check className="h-4 w-4 text-primary" /> : <Clipboard className="h-4 w-4" />}
                                <span className="ml-2">{isCopied ? 'Copied' : 'Copy'}</span>
                                </Button>
                            )}
                        </div>
                        <div className="relative w-full h-full min-h-[150px]">
                          {isLoading ? (
                            <Skeleton className="h-full w-full rounded-md" />
                          ) : error ? (
                             <div className="flex h-full items-center justify-center rounded-md border border-destructive/50 bg-destructive/10 p-2">
                                  <div className="text-center text-destructive">
                                      <XCircle className="h-6 w-6 mx-auto mb-1" />
                                      <p className="font-semibold text-sm">Extraction Failed</p>
                                  </div>
                              </div>
                          ) : (
                            <Textarea
                              placeholder="Extracted text will appear here."
                              value={text}
                              onChange={(e) => setResults(prev => ({...prev, [url]: {...prev[url], text: e.target.value}}))}
                              className="w-full h-full resize-none text-sm"
                            />
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
