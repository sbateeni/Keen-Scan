'use client';

import { extractTextFromImage } from '@/ai/flows/extract-text-from-image';
import { db, type Extraction } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  Check,
  Clipboard,
  CopyPlus,
  FilePlus2,
  Loader2,
  Trash2,
  Upload,
  XCircle,
} from 'lucide-react';
import Image from 'next/image';
import { ChangeEvent, useEffect, useRef, useState } from 'react';

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

  const [activeExtractionId, setActiveExtractionId] = useState<number | null>(
    null
  );
  const [currentText, setCurrentText] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const savedExtractions = useLiveQuery(() =>
    db.extractions.orderBy('createdAt').reverse().toArray()
  );

  useEffect(() => {
    if (activeExtractionId) {
      const activeExtraction = savedExtractions?.find(
        (ext) => ext.id === activeExtractionId
      );
      if (activeExtraction) {
        setCurrentText(activeExtraction.combinedText);
      }
    } else {
      setCurrentText('');
    }
  }, [activeExtractionId, savedExtractions]);

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

  const extractTextFromImages = async () => {
    if (images.length === 0) return '';
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
      return allTexts.join('\n\n');
    } catch (e) {
      const errorMessage =
        e instanceof Error ? e.message : 'An unknown error occurred.';
      setError(errorMessage);
      toast({
        variant: 'destructive',
        title: 'فشل الاستخراج',
        description:
          'حدث خطأ غير متوقع. يرجى التأكد من صحة مفتاح API والمحاولة مرة أخرى.',
      });
      return '';
    } finally {
      setIsExtracting(false);
      setExtractionProgress(null);
      setImages([]); // Clear images after extraction
    }
  };

  const handleNewExtraction = async () => {
    const extractedText = await extractTextFromImages();
    if (extractedText) {
      const newId = await db.extractions.add({
        title: `استخراج ${new Date().toLocaleString()}`,
        combinedText: extractedText,
        createdAt: new Date(),
      });
      setActiveExtractionId(newId);
    }
  };

  const handleContinueExtraction = async () => {
    if (!activeExtractionId) {
      toast({
        variant: 'destructive',
        title: 'لم يتم تحديد جلسة',
        description: 'يرجى تحديد جلسة استخراج من القائمة للمتابعة.',
      });
      return;
    }

    const newText = await extractTextFromImages();
    if (newText) {
      const existingExtraction = await db.extractions.get(activeExtractionId);
      if (existingExtraction) {
        const updatedText =
          existingExtraction.combinedText + '\n\n' + newText;
        await db.extractions.update(activeExtractionId, {
          combinedText: updatedText,
        });
        setCurrentText(updatedText); // Keep UI in sync
      }
    }
  };

  const handleDeleteExtraction = async () => {
    if (!activeExtractionId) return;
    await db.extractions.delete(activeExtractionId);
    setActiveExtractionId(null);
    setCurrentText('');
    toast({
      title: 'تم حذف الجلسة',
      description: 'تم حذف جلسة الاستخراج المحددة بنجاح.',
    });
  };

  const handleCopy = () => {
    if (!currentText) return;
    navigator.clipboard.writeText(currentText);
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

  const clearAllImages = () => {
    images.forEach((img) => URL.revokeObjectURL(img.url));
    setImages([]);
    setError(null);
    setIsExtracting(false);
    setExtractionProgress(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

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
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    onClick={handleNewExtraction}
                    disabled={isExtracting}
                    className="flex-1"
                  >
                    {isExtracting ? (
                      <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    ) : (
                      <FilePlus2 className="ml-2 h-4 w-4" />
                    )}
                    بدء استخراج جديد
                  </Button>
                  <Button
                    onClick={handleContinueExtraction}
                    disabled={isExtracting || !activeExtractionId}
                    className="flex-1"
                    variant="secondary"
                  >
                    {isExtracting ? (
                      <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    ) : (
                      <CopyPlus className="ml-2 h-4 w-4" />
                    )}
                    استكمال الاستخراج
                  </Button>
                </div>

                <Button
                  onClick={clearAllImages}
                  variant="destructive"
                  className="w-full"
                >
                  <Trash2 className="ml-2 h-4 w-4" />
                  مسح الصور ({images.length})
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
                        onClick={() => removeImage(url)}
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
              <h3 className="font-semibold text-lg">النصوص المستخرجة</h3>
              {savedExtractions && savedExtractions.length > 0 && (
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Select
                    onValueChange={(value) => setActiveExtractionId(Number(value))}
                    value={activeExtractionId?.toString()}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="اختر جلسة سابقة" />
                    </SelectTrigger>
                    <SelectContent>
                      {savedExtractions.map((ext) => (
                        <SelectItem key={ext.id} value={ext.id!.toString()}>
                          {ext.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={handleDeleteExtraction}
                    disabled={!activeExtractionId || isExtracting}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 h-full">
               <div className="flex justify-end items-center min-h-[40px]">
                {currentText && !isExtracting && (
                  <Button variant="ghost" size="sm" onClick={handleCopy}>
                    {isCopied ? (
                      <Check className="h-4 w-4 text-primary" />
                    ) : (
                      <Clipboard className="h-4 w-4" />
                    )}
                    <span className="mr-2">{isCopied ? 'تم النسخ' : 'نسخ'}</span>
                  </Button>
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
                    placeholder="سيظهر النص المستخرج هنا بعد اختيار أو بدء جلسة جديدة."
                    value={currentText}
                    readOnly={isExtracting}
                    onChange={(e) => setCurrentText(e.target.value)}
                    onBlur={() => {
                      if (activeExtractionId) {
                        db.extractions.update(activeExtractionId, { combinedText: currentText });
                      }
                    }}
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
