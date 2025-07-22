import ApiKeyManager from '@/components/api-key-manager';
import OcrTool from '@/components/ocr-tool';
import { Button } from '@/components/ui/button';
import { MessageCircleQuestion, NotebookText } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
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
          <div className="absolute top-0 right-0 flex gap-2">
            <Button asChild variant="outline">
              <Link href="/saved">
                <NotebookText />
                النصوص المحفوظة
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/qa">
                <MessageCircleQuestion />
                اسأل المستند
              </Link>
            </Button>
          </div>
        </header>
        <div className="space-y-8">
          <ApiKeyManager />
          <OcrTool />
        </div>
      </div>
    </main>
  );
}
