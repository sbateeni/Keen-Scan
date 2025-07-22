'use client';

import { extractTextFromDocument } from '@/ai/flows/extract-text-from-image';
import { proofreadText } from '@/ai/flows/proofread-text';
import { correctSpelling } from '@/ai/flows/correct-spelling';
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
import { db, type Extraction } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  Check,
  Clipboard,
  FilePlus,
  Loader2,
  Sparkles,
  SpellCheck,
  Trash2,
  Upload,
  XCircle,
  FileText,
} from 'lucide-react';
import Image from 'next/image';
import { ChangeEvent, useEffect, useRef, useState } from 'react';

interface FileData {
  url: string;
  file: File;
  type: 'image' | 'pdf';
}

interface ExtractionProgress {
  current: number;
  total: number;
}

export default function OcrTool() {
  const [files, setFiles] = useState<FileData[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isProofreading, setIsProofreading] = useState(false);
  const [isCorrectingSpelling, setIsCorrectingSpelling] = useState(false);
  const [extractionProgress, setExtractionProgress] =
    useState<ExtractionProgress | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState('');
  const [activeExtractionId, setActiveExtractionId] = useState<number | null>(
    null
  );

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const extractions = useLiveQuery(() => db.extractions.toArray(), []);

  useEffect(() => {
    if (activeExtractionId) {
      const activeExtraction = extractions?.find(
        (e) => e.id === activeExtractionId
      );
      if (activeExtraction) {
        setExtractedText(activeExtraction.text);
      }
    } else {
      setExtractedText('');
    }
  }, [activeExtractionId, extractions]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (selectedFiles) {
      const newFiles: FileData[] = Array.from(selectedFiles).map((file) => ({
        url: URL.createObjectURL(file),
        file: file,
        type: file.type.startsWith('image/') ? 'image' : 'pdf',
      }));
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const toBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });

  const handleExtraction = async (mode: 'new' | 'continue') => {
    if (files.length === 0) return;
    setIsExtracting(true);
    setError(null);
    setExtractionProgress({ current: 0, total: files.length });

    let allTexts: string[] = [];
    let newExtractionId: number | null = null;

    try {
      for (let i = 0; i < files.length; i++) {
        const fileData = files[i];
        setExtractionProgress({ current: i + 1, total: files.length });
        const documentDataUri = await toBase64(fileData.file);
        const isPdf = fileData.type === 'pdf';
        const result = await extractTextFromDocument({ documentDataUri, isPdf });
        allTexts.push(result.extractedText);
      }
      const newText = allTexts.join('\n\n');

      if (mode === 'new') {
        const id = await db.extractions.add({
          title: `استخراج ${new Date().toLocaleString()}`,
          text: newText,
          createdAt: new Date(),
        });
        setExtractedText(newText);
        setActiveExtractionId(id);
        newExtractionId = id;
      } else if (mode === 'continue' && activeExtractionId) {
        const existingExtraction = await db.extractions.get(activeExtractionId);
        if (existingExtraction) {
          const updatedText = existingExtraction.text + '\n\n' + newText;
          await db.extractions.update(activeExtractionId, { text: updatedText });
          setExtractedText(updatedText);
        }
      }

      toast({
        title: 'نجح الاستخراج',
        description: 'تم استخراج النص وحفظه بنجاح.',
      });
    } catch (e) {
      const errorMessage =
        e instanceof Error ? e.message : 'An unknown error occurred.';
      setError(errorMessage);
      toast({
        variant: 'destructive',
        title: 'فشل الاستخراج',
        description: 'ما المشكلة؟',
      });
    } finally {
      setIsExtracting(false);
      setExtractionProgress(null);
      setFiles([]);
    }
  };

  const handleProofreadText = async () => {
    if (!extractedText) return;
    setIsProofreading(true);
    setError(null);

    try {
      const { proofreadText: improvedText } = await proofreadText({
        text: extractedText,
      });
      setExtractedText(improvedText);
      if (activeExtractionId) {
        await db.extractions.update(activeExtractionId, { text: improvedText });
      }
      toast({
        title: 'تم التدقيق بنجاح',
        description: 'تم تحسين النص وحفظ التغييرات.',
      });
    } catch (e) {
      const errorMessage =
        e instanceof Error ? e.message : 'An unknown error occurred.';
      setError(errorMessage);
      toast({
        variant: 'destructive',
        title: 'فشل التدقيق',
        description: 'حدث خطأ ما أثناء تدقيق النص.',
      });
    } finally {
      setIsProofreading(false);
    }
  };
  
  const handleCorrectSpelling = async () => {
    if (!extractedText) return;
    setIsCorrectingSpelling(true);
    setError(null);

    try {
      const { correctedText } = await correctSpelling({
        text: extractedText,
      });
      setExtractedText(correctedText);
      if (activeExtractionId) {
        await db.extractions.update(activeExtractionId, { text: correctedText });
      }
      toast({
        title: 'تم التصحيح الإملائي بنجاح',
        description: 'تم تصحيح الأخطاء الإملائية وحفظ التغييرات.',
      });
    } catch (e) {
      const errorMessage =
        e instanceof Error ? e.message : 'An unknown error occurred.';
      setError(errorMessage);
      toast({
        variant: 'destructive',
        title: 'فشل التصحيح الإملائي',
        description: 'حدث خطأ ما أثناء تصحيح النص.',
      });
    } finally {
      setIsCorrectingSpelling(false);
    }
  };

  const handleCopy = () => {
    if (!extractedText) return;
    navigator.clipboard.writeText(extractedText);
    setIsCopied(true);
    toast({
      title: 'تم النسخ إلى الحافظة!',
      description: 'تم نسخ النص المحدد بنجاح.',
    });
    setTimeout(() => {
      setIsCopied(false);
    }, 2000);
  };

  const removeFile = (fileUrl: string) => {
    setFiles((prev) => prev.filter((f) => f.url !== fileUrl));
    URL.revokeObjectURL(fileUrl);
  };

  const handleDeleteExtraction = async () => {
    if (!activeExtractionId) return;
    await db.extractions.delete(activeExtractionId);
    setActiveExtractionId(null);
    setExtractedText('');
    toast({
      variant: 'destructive',
      title: 'تم الحذف',
      description: 'تم حذف جلسة الاستخراج المحددة.',
    });
  };

  const isBusy = isExtracting || isProofreading || isCorrectingSpelling;

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
                onChange={handleFileChange}
                accept="image/*,application/pdf"
                className="hidden"
                multiple
              />
              <Upload className="h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-lg font-semibold text-foreground">
                انقر لتحميل الصور أو ملفات PDF
              </p>
              <p className="text-sm text-muted-foreground">
                PNG, JPG, PDF, etc.
              </p>
            </div>

            {files.length > 0 && (
              <div className="flex flex-col sm:flex-row gap-2 w-full">
                <Button
                  onClick={() => handleExtraction('new')}
                  disabled={isBusy}
                  className="flex-1"
                >
                  {isExtracting && !activeExtractionId ? (
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  ) : (
                    <FilePlus className="ml-2 h-4 w-4" />
                  )}
                  بدء استخراج جديد
                </Button>
                <Button
                  onClick={() => handleExtraction('continue')}
                  disabled={isBusy || !activeExtractionId}
                  className="flex-1"
                  variant="secondary"
                >
                  {isExtracting && activeExtractionId ? (
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="ml-2 h-4 w-4" />
                  )}
                  استكمال الاستخراج ({files.length})
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
                  جاري معالجة الملف {extractionProgress.current} من{' '}
                  {extractionProgress.total}
                </p>
              </div>
            )}

            {files.length > 0 && (
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                {files.map(({ url, type }) => (
                  <div key={url} className="relative aspect-square group">
                    {type === 'image' ? (
                      <Image
                        src={url}
                        alt="Uploaded preview"
                        fill
                        className="object-cover rounded-md"
                        data-ai-hint="document photo"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full bg-muted rounded-md p-2">
                        <FileText className="h-8 w-8 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground mt-2 text-center break-all">
                          PDF
                        </span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button
                        size="icon"
                        variant="destructive"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(url);
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
            <div className="flex flex-col sm:flex-row gap-2 justify-between items-start">
              <h3 className="font-semibold text-lg">النص المستخرج</h3>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Select
                  value={activeExtractionId?.toString() ?? ''}
                  onValueChange={(value) =>
                    setActiveExtractionId(value ? parseInt(value) : null)
                  }
                  dir="rtl"
                >
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="اختر جلسة..." />
                  </SelectTrigger>
                  <SelectContent>
                    {extractions?.map((ext) => (
                      <SelectItem key={ext.id} value={ext.id!.toString()}>
                        {ext.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {activeExtractionId && (
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={handleDeleteExtraction}
                    disabled={isBusy}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2 h-full">
              <div className="flex justify-end items-center min-h-[40px] gap-2 flex-wrap">
                {extractedText && !isBusy && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCorrectSpelling}
                      disabled={isCorrectingSpelling}
                    >
                      {isCorrectingSpelling ? (
                        <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                      ) : (
                        <SpellCheck className="h-4 w-4" />
                      )}
                      <span className="mr-2">تصحيح إملائي</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleProofreadText}
                      disabled={isProofreading}
                    >
                      {isProofreading ? (
                        <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4" />
                      )}
                      <span className="mr-2">تدقيق وتحسين</span>
                    </Button>
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
                  </>
                )}
              </div>

              <div className="relative w-full h-full min-h-[300px]">
                {error && !isBusy ? (
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
                    onChange={(e) => {
                      setExtractedText(e.target.value);
                      if (activeExtractionId) {
                        db.extractions.update(activeExtractionId, {
                          text: e.target.value,
                        });
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
