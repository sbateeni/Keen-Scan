'use client';

import { extractTextFromImage } from '@/ai/flows/extract-text-from-image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  Check,
  Clipboard,
  Loader2,
  Trash2,
  Upload,
  XCircle,
} from 'lucide-react';
import Image from 'next/image';
import { ChangeEvent, useRef, useState } from 'react';

interface ImageData {
  url: string;
  file: File;
}

interface ExtractionProgress {
  current: number;
  total: number;
}

export default function OcrTool() {
  const [images, setImages] = useState<ImageData[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionProgress, setExtractionProgress] =
    useState<ExtractionProgress | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newImages: ImageData[] = Array.from(files).map((file) => ({
        url: URL.createObjectURL(file),
        file: file,
      }));
      setImages((prev) => [...prev, ...newImages]);
    }
  };

  const toBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });

  const handleExtractText = async () => {
    if (images.length === 0) return;
    setIsExtracting(true);
    setError(null);
    setExtractionProgress({ current: 0, total: images.length });

    let allTexts: string[] = [];

    try {
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        setExtractionProgress({ current: i + 1, total: images.length });
        const photoDataUri = await toBase64(image.file);
        const result = await extractTextFromImage({ photoDataUri });
        allTexts.push(result.extractedText);
      }
      setExtractedText(allTexts.join('\n\n'));
    } catch (e) {
      const errorMessage =
        e instanceof Error ? e.message : 'An unknown error occurred.';
      setError(errorMessage);
      toast({
        variant: 'destructive',
        title: 'فشل الاستخراج',
        description: 'حدث خطأ ما أثناء استخراج النص.',
      });
    } finally {
      setIsExtracting(false);
      setExtractionProgress(null);
      setImages([]); // Clear images after extraction
    }
  };

  const handleCopy = () => {
    if (!extractedText) return;
    navigator.clipboard.writeText(extractedText);
    setIsCopied(true);
    toast({
      title: 'تم النسخ إلى الحافظة!',
      description: 'تم نسخ النص المستخرج بنجاح.',
    });
    setTimeout(() => {
      setIsCopied(false);
    }, 2000);
  };

  const removeImage = (imageUrl: string) => {
    setImages((prev) => prev.filter((img) => img.url !== imageUrl));
    URL.revokeObjectURL(imageUrl); // Clean up memory
  };

  const clearAll = () => {
    images.forEach((img) => URL.revokeObjectURL(img.url));
    setImages([]);
    setError(null);
    setIsExtracting(false);
    setExtractionProgress(null);
    setExtractedText('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const isBusy = isExtracting;

  return (
    <Card className="w-full shadow-lg overflow-hidden border-border/50">
      <CardContent className="p-6 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Uploader and Controls */}
          <div className="flex flex-col gap-6">
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
              <p className="mt-4 text-lg font-semibold text-foreground">
                انقر لتحميل الصور
              </p>
              <p className="text-sm text-muted-foreground">
                PNG, JPG, WEBP, etc.
              </p>
            </div>

            {images.length > 0 && (
              <div className="flex flex-col gap-2 w-full">
                <Button onClick={handleExtractText} disabled={isBusy}>
                  {isExtracting ? (
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="ml-2 h-4 w-4" />
                  )}
                  استخراج النص ({images.length})
                </Button>
              </div>
            )}

            {isExtracting && extractionProgress && (
              <div className="flex flex-col gap-2 items-center">
                <Progress
                  value={
                    (extractionProgress.current / extractionProgress.total) *
                    100
                  }
                  className="w-full h-2"
                />
                <p className="text-sm text-muted-foreground">
                  جاري معالجة الصورة {extractionProgress.current} من{' '}
                  {extractionProgress.total}
                </p>
              </div>
            )}

            {images.length > 0 && (
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                {images.map(({ url }) => (
                  <div key={url} className="relative aspect-square group">
                    <Image
                      src={url}
                      alt="Uploaded preview"
                      fill
                      className="object-cover rounded-md"
                      data-ai-hint="document photo"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button
                        size="icon"
                        variant="destructive"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeImage(url);
                        }}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Results */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-2 justify-between items-center">
              <h3 className="font-semibold text-lg">النص المستخرج</h3>
            </div>

            <div className="flex flex-col gap-2 h-full">
              <div className="flex justify-end items-center min-h-[40px] gap-2">
                {extractedText && !isBusy && (
                  <>
                    <Button variant="ghost" size="sm" onClick={handleCopy}>
                      {isCopied ? (
                        <Check className="h-4 w-4 text-primary" />
                      ) : (
                        <Clipboard className="h-4 w-4" />
                      )}
                      <span className="mr-2">
                        {isCopied ? 'تم النسخ' : 'نسخ'}
                      </span>
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={clearAll}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="mr-2">مسح الكل</span>
                    </Button>
                  </>
                )}
              </div>

              <div className="relative w-full h-full min-h-[300px]">
                {error ? (
                  <div className="flex h-full items-center justify-center rounded-md border border-destructive/50 bg-destructive/10 p-4">
                    <div className="text-center text-destructive">
                      <XCircle className="h-8 w-8 mx-auto mb-2" />
                      <p className="font-semibold">فشل الاستخراج</p>
                    </div>
                  </div>
                ) : (
                  <Textarea
                    placeholder="سيظهر النص المستخرج هنا."
                    value={extractedText}
                    readOnly={isBusy}
                    onChange={(e) => setExtractedText(e.target.value)}
                    className="w-full h-full resize-y text-base min-h-[300px] leading-relaxed"
                    dir="rtl"
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
