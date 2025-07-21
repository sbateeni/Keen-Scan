"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Home, Bot, User, Loader2, Send, CornerDownLeft, Sparkles, Pilcrow, List, FileText, Binary, ListChecks, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { answerQuestion } from '@/ai/flows/answer-question';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { AnswerQuestionInput } from '@/ai/flows/answer-question';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface SavedText {
  id: string;
  text: string;
  date: string;
}

interface Message {
    role: 'user' | 'bot';
    content: string;
}

export default function QAPage() {
  const [savedTexts, setSavedTexts] = useState<SavedText[]>([]);
  const [selectedText, setSelectedText] = useState<SavedText | null>(null);
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [answerType, setAnswerType] = useState<AnswerQuestionInput['answerType']>('default');
  const [isAddTextDialogOpen, setIsAddTextDialogOpen] = useState(false);
  const [newTextContent, setNewTextContent] = useState('');

  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const fetchSavedTexts = () => {
    const textsFromStorage = localStorage.getItem('savedOcrTexts');
    if (textsFromStorage) {
      const parsedTexts: SavedText[] = JSON.parse(textsFromStorage);
      setSavedTexts(parsedTexts);
      return parsedTexts;
    }
    return [];
  };

  useEffect(() => {
    const texts = fetchSavedTexts();
    if (texts.length > 0) {
      if (!selectedText) {
          setSelectedText(texts[0]);
      }
    }
  }, []);

  useEffect(() => {
    if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('div');
        if (viewport) {
            viewport.scrollTop = viewport.scrollHeight;
        }
    }
  }, [messages]);

  const handleQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !selectedText || isLoading) return;

    const newMessages: Message[] = [...messages, { role: 'user', content: question }];
    setMessages(newMessages);
    setQuestion('');
    setIsLoading(true);

    try {
      const result = await answerQuestion({
        question: question,
        context: selectedText.text,
        answerType: answerType,
      });

      setMessages([...newMessages, { role: 'bot', content: result.answer }]);
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "حدث خطأ",
        description: "لم نتمكن من الحصول على إجابة. يرجى المحاولة مرة أخرى.",
      });
       setMessages(newMessages); 
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectChange = (id: string) => {
    const text = savedTexts.find(t => t.id === id);
    if(text) {
        setSelectedText(text);
        setMessages([]); 
    }
  }

  const handleSaveNewText = () => {
    if (!newTextContent.trim()) {
      toast({
        variant: 'destructive',
        title: 'لا يمكن حفظ نص فارغ',
        description: 'الرجاء إدخال بعض النصوص للمتابعة.',
      });
      return;
    }

    const newSavedText: SavedText = {
      id: new Date().toISOString(),
      text: newTextContent,
      date: new Date().toISOString(),
    };

    const updatedTexts = [newSavedText, ...savedTexts];
    localStorage.setItem('savedOcrTexts', JSON.stringify(updatedTexts));
    setSavedTexts(updatedTexts);
    setSelectedText(newSavedText); 
    setMessages([]);

    toast({
      title: 'تم حفظ النص بنجاح',
      description: 'يمكنك الآن طرح أسئلة حوله.',
    });

    setNewTextContent('');
    setIsAddTextDialogOpen(false);
  };

  return (
    <TooltipProvider>
      <div className="flex min-h-screen flex-col bg-background p-4 sm:p-8 md:p-12">
        <div className="w-full max-w-5xl mx-auto flex flex-col h-[calc(100vh-4rem)]">
          <header className="flex justify-between items-center mb-4 md:mb-6 border-b pb-4">
            <div className='flex items-center gap-4'>
              <Sparkles className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-primary tracking-tight">اسأل المستند</h1>
                <p className="text-muted-foreground text-sm">تحدث مع ملاحظاتك المحفوظة للحصول على إجابات فورية.</p>
              </div>
            </div>
            <Button asChild variant="outline">
              <Link href="/">
                <Home className="ml-2 h-4 w-4" />
                العودة للرئيسية
              </Link>
            </Button>
          </header>

          {savedTexts.length > 0 || isAddTextDialogOpen ? (
              <div className="flex-grow flex flex-col gap-4 overflow-hidden">
                  <div className="flex flex-col sm:flex-row gap-4 items-end">
                      <div className="flex-grow w-full">
                          <label className="text-sm font-medium mb-2 block" htmlFor="context-select">اختر النص الذي تريد طرح أسئلة عنه:</label>
                          <Select onValueChange={handleSelectChange} value={selectedText?.id || ''}>
                              <SelectTrigger id="context-select" className="w-full">
                                  <SelectValue placeholder="اختر نصًا محفوظًا..." />
                              </SelectTrigger>
                              <SelectContent>
                                  {savedTexts.map(text => (
                                      <SelectItem key={text.id} value={text.id}>
                                          نص محفوظ في {new Date(text.date).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' })}
                                      </SelectItem>
                                  ))}
                              </SelectContent>
                          </Select>
                      </div>
                      <Dialog open={isAddTextDialogOpen} onOpenChange={setIsAddTextDialogOpen}>
                          <DialogTrigger asChild>
                              <Button variant="outline" className="w-full sm:w-auto">
                                <PlusCircle className="ml-2 h-4 w-4"/>
                                إضافة نص جاهز
                              </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[425px]">
                              <DialogHeader>
                                  <DialogTitle>إضافة نص جديد</DialogTitle>
                                  <DialogDescription>
                                    ألصق النص الذي تريد الاستعلام عنه هنا. سيتم حفظه تلقائيًا في قائمة النصوص الخاصة بك.
                                  </DialogDescription>
                              </DialogHeader>
                              <div className="py-4">
                                  <Textarea 
                                      placeholder="ألصق النص هنا..."
                                      className="min-h-[200px]"
                                      value={newTextContent}
                                      onChange={(e) => setNewTextContent(e.target.value)}
                                      dir="rtl"
                                  />
                              </div>
                              <DialogFooter>
                                  <Button onClick={handleSaveNewText}>حفظ النص</Button>
                              </DialogFooter>
                          </DialogContent>
                      </Dialog>
                  </div>

                  <Card className="flex-grow flex flex-col overflow-hidden">
                      <div className="p-3 border-b flex flex-col sm:flex-row gap-2 items-center justify-between flex-wrap">
                          <label className="text-sm font-medium">نوع السؤال:</label>
                           <ToggleGroup 
                              type="single" 
                              value={answerType} 
                              onValueChange={(value) => {
                                  if (value) setAnswerType(value as AnswerQuestionInput['answerType']);
                              }}
                              className="justify-start flex-wrap"
                              aria-label="نوع السؤال"
                           >
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <ToggleGroupItem value="default" aria-label="إجابة مفصلة">
                                      <Pilcrow className="h-4 w-4" />
                                      <span className="mr-2 hidden sm:inline">سؤال عام</span>
                                  </ToggleGroupItem>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>اطرح سؤالاً عامًا واحصل على إجابة مفصلة</p>
                                </TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <ToggleGroupItem value="summary" aria-label="ملخص">
                                      <FileText className="h-4 w-4" />
                                      <span className="mr-2 hidden sm:inline">تلخيص</span>
                                  </ToggleGroupItem>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>اطلب تلخيص الإجابة في فقرة موجزة</p>
                                </TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <ToggleGroupItem value="bullet_points" aria-label="نقاط">
                                      <List className="h-4 w-4" />
                                      <span className="mr-2 hidden sm:inline">نقاط</span>
                                  </ToggleGroupItem>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>اطلب عرض الإجابة على شكل نقاط</p>
                                </TooltipContent>
                              </Tooltip>
                               <Tooltip>
                                <TooltipTrigger asChild>
                                  <ToggleGroupItem value="true_false" aria-label="صح/خطأ">
                                      <Binary className="h-4 w-4" />
                                      <span className="mr-2 hidden sm:inline">صح/خطأ</span>
                                  </ToggleGroupItem>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>أدخل عبارة لتقييمها كصحيحة أو خاطئة</p>
                                </TooltipContent>
                              </Tooltip>
                               <Tooltip>
                                <TooltipTrigger asChild>
                                  <ToggleGroupItem value="multiple_choice" aria-label="اختيار من متعدد">
                                      <ListChecks className="h-4 w-4" />
                                      <span className="mr-2 hidden sm:inline">اختيار من متعدد</span>
                                  </ToggleGroupItem>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>أدخل سؤال اختيار من متعدد لتحديد الإجابة الصحيحة</p>
                                </TooltipContent>
                              </Tooltip>
                          </ToggleGroup>
                      </div>
                      <CardContent ref={scrollAreaRef} className="flex-grow p-4 overflow-y-auto">
                          <ScrollArea className="h-full">
                               {messages.length === 0 ? (
                                  <div className="flex h-full items-center justify-center text-center text-muted-foreground">
                                      {selectedText ? 
                                        <p>ابدأ بطرح سؤال حول النص المحدد.</p> :
                                        <p>اختر نصًا أو أضف نصًا جديدًا للبدء.</p>
                                      }
                                  </div>
                              ) : (
                                  <div className="space-y-4">
                                      {messages.map((message, index) => (
                                          <div key={index} className={`flex items-start gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}>
                                              {message.role === 'bot' && <div className="p-2 rounded-full bg-primary/10"><Bot className="h-5 w-5 text-primary" /></div>}
                                              <div className={`rounded-lg p-3 max-w-[80%] ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`} dir="rtl">
                                                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                              </div>
                                              {message.role === 'user' && <div className="p-2 rounded-full bg-muted/80"><User className="h-5 w-5 text-foreground" /></div>}
                                          </div>
                                      ))}
                                      {isLoading && (
                                          <div className="flex items-start gap-3">
                                              <div className="p-2 rounded-full bg-primary/10"><Bot className="h-5 w-5 text-primary" /></div>
                                              <div className="rounded-lg p-3 bg-muted flex items-center">
                                                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                                              </div>
                                          </div>
                                      )}
                                  </div>
                              )}
                          </ScrollArea>
                      </CardContent>
                      <CardFooter className="p-4 border-t">
                          <form onSubmit={handleQuestionSubmit} className="flex w-full items-center gap-2">
                              <Textarea
                                  value={question}
                                  onChange={(e) => setQuestion(e.target.value)}
                                  placeholder="اكتب سؤالك هنا..."
                                  className="flex-grow resize-none"
                                  rows={1}
                                  onKeyDown={(e) => {
                                      if (e.key === 'Enter' && !e.shiftKey) {
                                          e.preventDefault();
                                          handleQuestionSubmit(e as any);
                                      }
                                  }}
                                  disabled={!selectedText}
                              />
                              <Button type="submit" disabled={isLoading || !question.trim() || !selectedText}>
                                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                  <span className="sr-only">إرسال</span>
                              </Button>
                          </form>
                      </CardFooter>
                  </Card>
              </div>
          ) : (
            <div className="text-center py-16 border-2 border-dashed border-muted-foreground/30 rounded-lg">
              <p className="text-lg text-muted-foreground">لا توجد نصوص محفوظة للبدء.</p>
              <p className="text-sm text-muted-foreground mt-2">
                  انتقل إلى <Link href="/" className="text-primary underline">الصفحة الرئيسية</Link> لاستخراج النصوص وحفظها أولاً، أو قم بإضافة نص جديد.
              </p>
              <Dialog open={isAddTextDialogOpen} onOpenChange={setIsAddTextDialogOpen}>
                  <DialogTrigger asChild>
                      <Button className="mt-4">
                          <PlusCircle className="ml-2 h-4 w-4"/>
                          إضافة نص جاهز
                      </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                          <DialogTitle>إضافة نص جديد</DialogTitle>
                          <DialogDescription>
                              ألصق النص الذي تريد الاستعلام عنه هنا. سيتم حفظه تلقائيًا في قائمة النصوص الخاصة بك.
                          </DialogDescription>
                      </DialogHeader>
                      <div className="py-4">
                          <Textarea 
                              placeholder="ألصق النص هنا..."
                              className="min-h-[200px]"
                              value={newTextContent}
                              onChange={(e) => setNewTextContent(e.target.value)}
                              dir="rtl"
                          />
                      </div>
                      <DialogFooter>
                          <Button onClick={handleSaveNewText}>حفظ النص</Button>
                      </DialogFooter>
                  </DialogContent>
              </Dialog>
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}

    