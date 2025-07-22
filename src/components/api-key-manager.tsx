'use client';

import {useEffect, useState} from 'react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {useToast} from '@/hooks/use-toast';
import {getApiKey, setApiKey} from '@/lib/keys';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {KeyRound, Save} from 'lucide-react';

export default function ApiKeyManager() {
  const [apiKey, setApiKeyValue] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const {toast} = useToast();

  useEffect(() => {
    setIsMounted(true);
    const storedKey = getApiKey();
    if (storedKey) {
      setApiKeyValue(storedKey);
    }
  }, []);

  const handleSave = () => {
    setApiKey(apiKey);
    toast({
      title: 'تم حفظ مفتاح API',
      description: 'سيتم استخدام مفتاحك لجميع طلبات الذكاء الاصطناعي.',
    });
  };

  if (!isMounted) {
    return null;
  }

  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="api-key">
        <AccordionTrigger>
          <div className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-primary" />
            <span className="font-semibold">إدارة مفتاح API</span>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="api-key-input">مفتاح Google AI API</Label>
                <p className="text-sm text-muted-foreground">
                  مفتاحك يُخزن فقط في متصفحك ولا يتم إرساله إلى أي مكان آخر غير
                  Google AI.
                </p>
                <Input
                  id="api-key-input"
                  type="password"
                  placeholder="أدخل مفتاح API الخاص بك هنا"
                  value={apiKey}
                  onChange={e => setApiKeyValue(e.target.value)}
                  className="bg-background"
                />
              </div>
              <Button onClick={handleSave} disabled={!apiKey}>
                <Save className="ml-2 h-4 w-4" />
                حفظ المفتاح
              </Button>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
