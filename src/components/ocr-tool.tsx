"use client";

import { useState, useRef, ChangeEvent } from 'react';
import Image from 'next/image';
import { Upload, Clipboard, Check, Loader2, XCircle } from 'lucide-react';
import { extractTextFromImage } from '@/ai/flows/extract-text-from-image';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function OcrTool() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setError(null);
      setExtractedText('');
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleExtract = async () => {
    if (!imageUrl) return;
    setIsLoading(true);
    setError(null);
    setExtractedText('');
    try {
      const result = await extractTextFromImage({ photoDataUri: imageUrl });
      setExtractedText(result.extractedText);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Extraction Failed",
        description: "Please try again with a different image.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!extractedText) return;
    navigator.clipboard.writeText(extractedText);
    setIsCopied(true);
    toast({
      title: "Copied to clipboard!",
      description: "The extracted text has been copied.",
    })
    setTimeout(() => setIsCopied(false), 2000);
  };
  
  const clearState = () => {
    setImageUrl(null);
    setExtractedText('');
    setError(null);
    if(fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  return (
    <Card className="w-full shadow-lg overflow-hidden border-border/50">
      <CardContent className="p-6 md:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          <div className="flex flex-col gap-4 items-center justify-center h-full">
            <div
              className="relative w-full aspect-[4/3] rounded-lg border-2 border-dashed border-muted-foreground/30 flex flex-col justify-center items-center text-center p-4 cursor-pointer hover:border-primary hover:bg-accent/20 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/*"
                className="hidden"
              />
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt="Uploaded preview"
                  fill
                  className="object-contain rounded-md p-1"
                  data-ai-hint="document receipt"
                />
              ) : (
                <>
                  <Upload className="h-12 w-12 text-muted-foreground" />
                  <p className="mt-4 text-lg font-semibold text-foreground">Click to upload an image</p>
                  <p className="text-sm text-muted-foreground">PNG, JPG, or WEBP</p>
                </>
              )}
            </div>
            {imageUrl && (
              <div className="flex gap-4 w-full">
                <Button onClick={handleExtract} disabled={isLoading} className="w-full">
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {isLoading ? 'Extracting...' : 'Extract Text'}
                </Button>
                 <Button onClick={clearState} variant="outline" className="shrink-0" aria-label="Clear image">
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4 h-full">
            <div className="flex justify-between items-center min-h-[40px]">
                <h2 className="text-xl font-semibold text-foreground">Extracted Text</h2>
                {extractedText && !isLoading && (
                    <Button variant="ghost" size="sm" onClick={handleCopy}>
                    {isCopied ? <Check className="h-4 w-4 text-primary" /> : <Clipboard className="h-4 w-4" />}
                    <span className="ml-2">{isCopied ? 'Copied!' : 'Copy'}</span>
                    </Button>
                )}
            </div>
            <div className="relative w-full h-[250px] md:h-full min-h-[250px]">
              {isLoading ? (
                <Skeleton className="h-full w-full rounded-md" />
              ) : error ? (
                <div className="flex h-full items-center justify-center rounded-md border border-destructive/50 bg-destructive/10">
                  <div className="text-center text-destructive p-4">
                      <XCircle className="h-8 w-8 mx-auto mb-2" />
                      <p className="font-semibold">Extraction Failed</p>
                      <p className="text-sm">{error}</p>
                  </div>
                </div>
              ) : (
                <Textarea
                  placeholder={
                    imageUrl 
                    ? "Click 'Extract Text' to see the result here."
                    : "Upload an image and the extracted text will appear here."
                  }
                  value={extractedText}
                  onChange={(e) => setExtractedText(e.target.value)}
                  className="w-full h-full resize-none text-base"
                  aria-label="Extracted Text"
                />
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
