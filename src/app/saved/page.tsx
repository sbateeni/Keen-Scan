"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Home, Trash2, Clipboard, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from '@/hooks/use-toast';

interface SavedText {
  id: string;
  text: string;
  date: string;
}

export default function SavedTextsPage() {
  const [savedTexts, setSavedTexts] = useState<SavedText[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { toast } = useToast();
  
  useEffect(() => {
    const textsFromStorage = localStorage.getItem('savedOcrTexts');
    if (textsFromStorage) {
      setSavedTexts(JSON.parse(textsFromStorage));
    }
  }, []);

  const deleteText = (id: string) => {
    const updatedTexts = savedTexts.filter(text => text.id !== id);
    setSavedTexts(updatedTexts);
    localStorage.setItem('savedOcrTexts', JSON.stringify(updatedTexts));
    toast({
        title: "تم الحذف",
        description: "تم حذف النص المحفوظ بنجاح.",
    })
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast({
      title: "تم النسخ إلى الحافظة!",
    });
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background p-4 sm:p-8 md:p-12">
      <div className="w-full max-w-5xl mx-auto">
        <header className="flex justify-between items-center mb-8 md:mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-primary tracking-tight">النصوص المحفوظة</h1>
          <Button asChild variant="outline">
            <Link href="/">
              <Home className="ml-2 h-4 w-4" />
              العودة للرئيسية
            </Link>
          </Button>
        </header>
        
        {savedTexts.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {savedTexts.map(item => (
              <Card key={item.id} className="flex flex-col">
                <CardHeader>
                  <CardTitle className="text-lg">نص محفوظ</CardTitle>
                  <CardDescription>
                    {new Date(item.date).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' })}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-sm text-muted-foreground line-clamp-6" dir="rtl">{item.text}</p>
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                   <Button variant="ghost" size="sm" onClick={() => handleCopy(item.text, item.id)}>
                    {copiedId === item.id ? <Check className="h-4 w-4 text-primary" /> : <Clipboard className="h-4 w-4" />}
                    <span className="mr-2">{copiedId === item.id ? 'تم النسخ' : 'نسخ'}</span>
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                       <Button variant="destructive" size="sm">
                         <Trash2 className="h-4 w-4" />
                         <span className="mr-2">حذف</span>
                       </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>هل أنت متأكد تمامًا؟</AlertDialogTitle>
                        <AlertDialogDescription>
                          سيؤدي هذا الإجراء إلى حذف النص بشكل دائم. لا يمكن التراجع عن هذا الإجراء.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteText(item.id)}>
                          متابعة
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 border-2 border-dashed border-muted-foreground/30 rounded-lg">
            <p className="text-lg text-muted-foreground">لا توجد نصوص محفوظة حتى الآن.</p>
            <p className="text-sm text-muted-foreground mt-2">
                انتقل إلى الصفحة الرئيسية لاستخراج النصوص وحفظها.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
