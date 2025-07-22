'use client';

import {extractTextFromImage} from '@/ai/flows/extract-text-from-image';
import {Button} from '@/components/ui/button';
import {Card, CardContent} from '@/components/ui/card';
import {Progress} from '@/components/ui/progress';
import {Textarea} from '@/components/ui/textarea';
import {useToast} from '@/hooks/use-toast';
import {
  Check,
  Clipboard,
  Loader2,
  Trash2,
  Upload,
  Wand2,
  XCircle,
} from 'lucide-react';
import Image from 'next/image';
import {ChangeEvent, useRef, useState} from 'react';

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
  const [combinedText, setCombinedText] = useState('');
  const [isExtractingAll, setIsExtractingAll] = useState(false);
  const [
    extractionProgress,
    setExtractionProgress,
  ] = useState<ExtractionProgress | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const {toast} = useToast();

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newImages: ImageData[] = Array.from(files).map(file => ({
        url: URL.createObjectURL(file),
        file: file,
      }));
      setImages(prev => [...prev, ...newImages]);
    }
  };

  const toBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });

  const handleExtractAll = async () => {
    if (images.length === 0) return;

    setIsExtractingAll(true);
    setError(null);
    setCombinedText('');
    setExtractionProgress({current: 0, total: images.length});

    let allTexts: string[] = [];

    try {
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        setExtractionProgress({current: i + 1, total: images.length});
        const photoDataUri = await toBase64(image.file);
        const result = await extractTextFromImage({photoDataUri});
        allTexts.push(result.extractedText);
      }
      setCombinedText(allTexts.join('\n\n'));
    } catch (e) {
      const errorMessage =
        e instanceof Error ? e.message : 'An unknown error occurred.';
      setError(errorMessage);
      setCombinedText('');
      toast({
        variant: 'destructive',
        title: 'فشل الاستخراج',
        description: 'يرجى المحاولة مرة أخرى بصورة مختلفة أو التأكد من مفتاح API.',
      });
    } finally {
      setIsExtractingAll(false);
      setExtractionProgress(null);
    }
  };

  const handleCopy = () => {
    if (!combinedText) return;
    navigator.clipboard.writeText(combinedText);
    setIsCopied(true);
    toast({
      title: 'تم النسخ إلى الحافظة!',
      description: 'تم نسخ النص المستخرج.',
    });
    setTimeout(() => {
      setIsCopied(false);
    }, 2000);
  };

  const removeImage = (imageUrl: string) => {
    setImages(prev => prev.filter(img => img.url !== imageUrl));
    URL.revokeObjectURL(imageUrl); // Clean up memory
  };

  const clearAll = () => {
    images.forEach(img => URL.revokeObjectURL(img.url));
    setImages([]);
    setCombinedText('');
    setError(null);
    setIsExtractingAll(false);
    setExtractionProgress(null);
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
              <p className="mt-4 text-lg font-semibold text-foreground">
                انقر لتحميل الصور
              </p>
              <p className="text-sm text-muted-foreground">
                PNG, JPG, WEBP, etc.
              </p>
            </div>
            {images.length > 0 && (
              <div className="flex flex-col md:flex-row gap-2 w-full">
                <Button
                  onClick={handleExtractAll}
                  disabled={isExtractingAll}
                  className="w-full"
                >
                  {isExtractingAll ? (
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Wand2 className="ml-2 h-4 w-4" />
                  )}
                  {isExtractingAll
                    ? '...جاري الاستخراج'
                    : `استخراج الكل (${images.length})`}
                </Button>
                <Button
                  onClick={clearAll}
                  variant="destructive"
                  className="w-full md:w-auto"
                >
                  <Trash2 className="ml-2 h-4 w-4" />
                  مسح الكل
                </Button>
              </div>
            )}
          </div>

          {images.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {images.map(({url}) => (
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
                      className="h-9 w-9"
                      onClick={() => removeImage(url)}
                    >
                      <XCircle className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {(isExtractingAll || combinedText || error) && (
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center min-h-[32px]">
                <h3 className="font-semibold">النتائج</h3>
                {combinedText && !isExtractingAll && (
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={handleCopy}>
                      {isCopied ? (
                        <Check className="h-4 w-4 text-primary" />
                      ) : (
                        <Clipboard className="h-4 w-4" />
                      )}
                      <span className="mr-2">{isCopied ? 'تم النسخ' : 'نسخ'}</span>
                    </Button>
                  </div>
                )}
              </div>

              {isExtractingAll && extractionProgress && (
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

              <div className="relative w-full h-full min-h-[200px]">
                {isExtractingAll && !combinedText ? (
                  <div className="flex h-full items-center justify-center rounded-md border border-input bg-background">
                    {!extractionProgress && (
                      <p className="text-muted-foreground">
                        ...البدء في الاستخراج
                      </p>
                    )}
                  </div>
                ) : error ? (
                  <div className="flex h-full items-center justify-center rounded-md border border-destructive/50 bg-destructive/10 p-4">
                    <div className="text-center text-destructive">
                      <XCircle className="h-8 w-8 mx-auto mb-2" />
                      <p className="font-semibold">فشل الاستخراج</p>
                    </div>
                  </div>
                ) : (
                  <Textarea
                    placeholder="سيظهر النص المستخرج هنا."
                    value={combinedText}
                    readOnly={isExtractingAll}
                    onChange={e => setCombinedText(e.target.value)}
                    className="w-full h-full resize-y text-base min-h-[200px] leading-relaxed"
                    dir="rtl"
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
