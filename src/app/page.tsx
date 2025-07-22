'use client';

import {useEffect, useState} from 'react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {useToast} from '@/hooks/use-toast';
import {getApiKey, setApiKey} from '@/lib/keys';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {KeyRound, Save} from 'lucide-react';
import OcrTool from '@/components/ocr-tool';

export default function Home() {
  const [apiKey, setApiKeyValue] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const {toast} = useToast();

  useEffect(() => {
    setIsMounted(true);
    const storedKey = getApiKey();
    if (storedKey) {
      setApiKeyValue(storedKey);
    }
  }, []);

  const handleSaveApiKey = () => {
    setApiKey(apiKey);
    toast({
      title: 'تم حفظ مفتاح API',
      description: 'سيتم استخدام مفتاحك لجميع طلبات الذكاء الاصطناعي.',
    });
    setIsDialogOpen(false);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 md:p-12 bg-background">
      <div className="w-full max-w-5xl mx-auto">
        <header className="text-center mb-8 md:mb-12 relative">
          <h1 className="text-4xl md:text-5xl font-bold text-primary tracking-tight">
            Keen Scan
          </h1>
          <p className="mt-3 text-lg text-muted-foreground max-w-2xl mx-auto">
            Upload an image to instantly extract, edit, and copy text with our
            AI-powered OCR tool.
          </p>
          <div className="absolute top-0 right-0">
            {isMounted && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <KeyRound />
                    <span>مفتاح API</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>إدارة مفتاح API</DialogTitle>
                    <DialogDescription>
                      أدخل مفتاح Google AI API الخاص بك أدناه. يتم تخزين مفتاحك
                      فقط في متصفحك.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="api-key-input" className="text-right">
                        المفتاح
                      </Label>
                      <Input
                        id="api-key-input"
                        type="password"
                        placeholder="أدخل مفتاح API الخاص بك هنا"
                        value={apiKey}
                        onChange={e => setApiKeyValue(e.target.value)}
                        className="col-span-3 bg-background"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleSaveApiKey} disabled={!apiKey}>
                      <Save className="ml-2 h-4 w-4" />
                      حفظ المفتاح
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </header>
        <div className="space-y-8">
          <OcrTool />
        </div>
      </div>
    </main>
  );
}
