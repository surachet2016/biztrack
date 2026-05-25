import { createFileRoute } from '@tanstack/react-router';
import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth.js';
import { api } from '@/lib/api.js';
import { getAccessToken } from '@/lib/supabase.js';
import { Send, Mic, MicOff, ImagePlus, Loader2, Sparkles, Lock } from 'lucide-react';
import { cn } from '@/lib/utils.js';

export const Route = createFileRoute('/_auth/chat')({
  component: ChatPage,
});

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787';

const SUGGESTIONS = [
  'วันนี้ขายสินค้าได้ 2,500 บาท',
  'จ่ายค่าไฟ 800 บาท',
  'วิเคราะห์ยอดขายเดือนนี้ให้หน่อย',
];

function ChatPage() {
  const { subscription } = useAuth();
  const qc = useQueryClient();

  const plan = subscription?.plan || 'free';
  const canVoice = ['basic', 'pro', 'annual'].includes(plan);
  const canUploadImage = ['pro', 'annual'].includes(plan);

  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [pendingImage, setPendingImage] = useState(null);
  const bottomRef = useRef(null);
  const fileRef = useRef();
  const recognitionRef = useRef(null);
  const textareaRef = useRef(null);

  const { data, isLoading } = useQuery({
    queryKey: ['chat-history'],
    queryFn: () => api.get('/api/chat/history'),
  });

  const messages = data?.messages || [];

  const sendMutation = useMutation({
    mutationFn: async ({ content, type, attachment_url }) => {
      let slow_moving_products = [];
      try {
        const alerts = await api.get('/api/products/alerts');
        slow_moving_products = alerts.alerts?.slice(0, 5) || [];
      } catch {}

      const token = await getAccessToken();
      const res = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content, type, attachment_url, slow_moving_products }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error');
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['chat-history'] });
      setInput('');
      setPendingImage(null);
    },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sendMutation.isPending]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [input]);

  const handleSend = () => {
    if (!input.trim() && !pendingImage) return;
    if (pendingImage) {
      sendMutation.mutate({ content: input || 'วิเคราะห์ใบเสร็จนี้ให้หน่อย', type: 'image', attachment_url: pendingImage });
    } else {
      sendMutation.mutate({ content: input.trim(), type: 'text' });
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPendingImage(ev.target.result);
    reader.readAsDataURL(file);
  };

  const toggleVoice = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('เบราว์เซอร์ของคุณไม่รองรับ Voice Input');
      return;
    }
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SR();
    recognition.lang = 'th-TH';
    recognition.continuous = false;
    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setInput(transcript);
      setIsRecording(false);
    };
    recognition.onerror = () => setIsRecording(false);
    recognition.onend = () => setIsRecording(false);
    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  };

  const planLabel = {
    free: { text: 'Free', color: 'text-gray-500 bg-gray-100' },
    basic: { text: 'Basic 🌱', color: 'text-green-700 bg-green-100' },
    pro: { text: 'Pro ⚡', color: 'text-green-700 bg-green-100' },
    annual: { text: 'Annual 🌟', color: 'text-green-700 bg-green-100' },
  };
  const badge = planLabel[plan] || planLabel.free;

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-500 px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white/20 backdrop-blur rounded-full flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-semibold text-white text-sm">BizAI</p>
            <p className="text-xs text-green-100">ผู้ช่วยธุรกิจอัจฉริยะ</p>
          </div>
        </div>
        <span className={cn('text-xs font-medium px-3 py-1 rounded-full', badge.color)}>
          {badge.text}
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4 bg-gray-50/30">
        {isLoading && (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-green-500" />
          </div>
        )}

        {messages.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full py-10 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-green-200">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h3 className="font-bold text-gray-700 text-lg mb-1">สวัสดี! ฉันคือ BizAI</h3>
            <p className="text-gray-400 text-sm mb-6 max-w-xs">
              บอกฉันเรื่องรายรับ รายจ่าย หรือถามเรื่องธุรกิจได้เลย
            </p>
            {/* Suggestion chips */}
            <div className="flex flex-col gap-2 w-full max-w-sm">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => setInput(s)}
                  className="text-left px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-600 hover:border-green-400 hover:text-green-700 hover:bg-green-50 transition"
                >
                  {s}
                </button>
              ))}
            </div>
            {plan === 'free' && (
              <div className="mt-6 flex items-center gap-2 text-xs text-gray-400 bg-white border border-gray-100 rounded-xl px-4 py-2.5">
                <Lock className="w-3.5 h-3.5" />
                <span>แพ็กเกจฟรี: พิมพ์ข้อความเท่านั้น • <a href="/subscription" className="text-green-600 hover:underline">อัปเกรด</a> เพื่อใช้เสียง & รูปภาพ</span>
              </div>
            )}
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={cn('flex gap-2', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
            )}
            <div className={cn(
              'max-w-xs md:max-w-md lg:max-w-lg px-4 py-3 rounded-2xl text-sm shadow-sm',
              msg.role === 'user'
                ? 'bg-gradient-to-br from-green-600 to-emerald-500 text-white rounded-br-sm'
                : 'bg-white text-gray-800 rounded-bl-sm border border-gray-100'
            )}>
              {msg.attachment_url && (
                <img src={msg.attachment_url} alt="" className="rounded-lg mb-2 max-w-full" />
              )}
              <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
              <p className={cn('text-xs mt-1.5', msg.role === 'user' ? 'text-green-100' : 'text-gray-300')}>
                {new Date(msg.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}

        {sendMutation.isPending && (
          <div className="flex gap-2 justify-start">
            <div className="w-7 h-7 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="bg-white border border-gray-100 px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm">
              <div className="flex gap-1 items-center">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        {sendMutation.isError && (
          <div className="flex justify-center">
            <div className="bg-red-50 border border-red-100 text-red-500 text-xs px-4 py-2 rounded-xl">
              {sendMutation.error?.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่'}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input Area */}
      <div className="px-4 py-3 bg-white border-t border-gray-100">
        {pendingImage && (
          <div className="mb-2 relative inline-block">
            <img src={pendingImage} alt="" className="h-20 rounded-xl border border-gray-200 shadow-sm" />
            <button
              onClick={() => setPendingImage(null)}
              className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center shadow"
            >
              ×
            </button>
          </div>
        )}
        <div className="flex gap-2 items-end">
          {/* Image upload (Pro+) */}
          {canUploadImage ? (
            <>
              <button
                onClick={() => fileRef.current.click()}
                className="p-2.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-xl transition flex-shrink-0"
                title="อัปโหลดรูปใบเสร็จ"
              >
                <ImagePlus className="w-5 h-5" />
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </>
          ) : (
            <button
              onClick={() => window.location.href = '/subscription'}
              className="p-2.5 text-gray-300 rounded-xl transition flex-shrink-0 relative group"
              title="อัปเกรดเป็น Pro เพื่ออัปโหลดรูปภาพ"
            >
              <ImagePlus className="w-5 h-5" />
              <Lock className="w-2.5 h-2.5 text-gray-400 absolute bottom-1.5 right-1.5" />
            </button>
          )}

          {/* Voice button (Basic+) */}
          {canVoice ? (
            <button
              onClick={toggleVoice}
              className={cn(
                'p-2.5 rounded-xl transition flex-shrink-0',
                isRecording
                  ? 'bg-red-100 text-red-500 animate-pulse'
                  : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
              )}
              title={isRecording ? 'หยุดบันทึก' : 'บันทึกเสียง'}
            >
              {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
          ) : (
            <button
              onClick={() => window.location.href = '/subscription'}
              className="p-2.5 text-gray-300 rounded-xl transition flex-shrink-0 relative group"
              title="อัปเกรดเป็น Basic เพื่อใช้เสียง"
            >
              <Mic className="w-5 h-5" />
              <Lock className="w-2.5 h-2.5 text-gray-400 absolute bottom-1.5 right-1.5" />
            </button>
          )}

          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={
              isRecording
                ? '🎤 กำลังฟัง...'
                : plan === 'free'
                ? 'พิมพ์ข้อความ... (Enter ส่ง)'
                : 'พิมพ์ข้อความ หรือกด 🎤 เพื่อพูด...'
            }
            rows={1}
            className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 resize-none focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition min-h-[42px]"
            style={{ maxHeight: '120px' }}
          />
          <button
            onClick={handleSend}
            disabled={sendMutation.isPending || (!input.trim() && !pendingImage)}
            className="p-2.5 bg-gradient-to-r from-green-600 to-emerald-500 text-white rounded-xl hover:from-green-700 hover:to-emerald-600 transition disabled:opacity-40 flex-shrink-0 shadow-sm shadow-green-200"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        {plan === 'free' && messages.length > 0 && (
          <p className="text-xs text-center text-gray-300 mt-2">
            <a href="/subscription" className="hover:text-green-500 transition">อัปเกรดแพ็กเกจ</a>
            {' '}เพื่อใช้เสียงและรูปภาพ
          </p>
        )}
      </div>
    </div>
  );
}
