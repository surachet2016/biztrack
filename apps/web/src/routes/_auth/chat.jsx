import { createFileRoute } from '@tanstack/react-router';
import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth.js';
import { api } from '@/lib/api.js';
import { getAccessToken } from '@/lib/supabase.js';
import { Send, Mic, MicOff, ImagePlus, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils.js';

export const Route = createFileRoute('/_auth/chat')({
  component: ChatPage,
});

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787';

function ChatPage() {
  const { subscription } = useAuth();
  const qc = useQueryClient();
  const canUploadImage = subscription && ['pro', 'annual'].includes(subscription.plan);
  const hasSubscription = !!subscription;

  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [pendingImage, setPendingImage] = useState(null);
  const bottomRef = useRef(null);
  const fileRef = useRef();
  const recognitionRef = useRef(null);

  const { data, isLoading } = useQuery({
    queryKey: ['chat-history'],
    queryFn: () => api.get('/api/chat/history'),
    enabled: hasSubscription,
  });

  const messages = data?.messages || [];

  const sendMutation = useMutation({
    mutationFn: async ({ content, type, attachment_url }) => {
      // Get slow moving alerts to inject into chat
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
  }, [messages]);

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

  if (!hasSubscription) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center bg-white rounded-2xl p-8 shadow-sm max-w-sm">
          <div className="text-4xl mb-3">🔒</div>
          <h2 className="font-bold text-gray-800 mb-2">ต้องมีแพ็กเกจ</h2>
          <p className="text-gray-500 text-sm mb-4">สมัครแพ็กเกจเพื่อใช้ AI Chat</p>
          <a href="/subscription" className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium">ดูแพ็กเกจ</a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)] bg-white rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
        <div className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center">
          <span className="text-lg">🤖</span>
        </div>
        <div>
          <p className="font-semibold text-gray-800 text-sm">BizAI</p>
          <p className="text-xs text-green-500">ผู้ช่วยธุรกิจ AI</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {isLoading && <div className="flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-green-500" /></div>}

        {messages.length === 0 && !isLoading && (
          <div className="text-center text-gray-400 py-10">
            <p className="text-4xl mb-3">👋</p>
            <p className="font-medium text-gray-600">สวัสดี! ฉันคือ BizAI</p>
            <p className="text-sm mt-1">ส่งข้อความ เสียง หรือรูปใบเสร็จเพื่อเริ่มต้น</p>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
            <div className={cn(
              'max-w-xs md:max-w-md lg:max-w-lg px-4 py-3 rounded-2xl text-sm',
              msg.role === 'user'
                ? 'bg-green-600 text-white rounded-br-sm'
                : 'bg-gray-100 text-gray-800 rounded-bl-sm'
            )}>
              {msg.attachment_url && <img src={msg.attachment_url} alt="" className="rounded-lg mb-2 max-w-full" />}
              <p className="whitespace-pre-wrap">{msg.content}</p>
              <p className={cn('text-xs mt-1', msg.role === 'user' ? 'text-green-200' : 'text-gray-400')}>
                {new Date(msg.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}

        {sendMutation.isPending && (
          <div className="flex justify-start">
            <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-bl-sm">
              <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input Area */}
      <div className="px-4 py-3 border-t border-gray-100">
        {pendingImage && (
          <div className="mb-2 relative inline-block">
            <img src={pendingImage} alt="" className="h-20 rounded-lg border border-gray-200" />
            <button onClick={() => setPendingImage(null)} className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center">×</button>
          </div>
        )}
        <div className="flex gap-2 items-end">
          {canUploadImage && (
            <>
              <button onClick={() => fileRef.current.click()} className="p-2.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-xl transition">
                <ImagePlus className="w-5 h-5" />
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </>
          )}
          <button
            onClick={toggleVoice}
            className={cn('p-2.5 rounded-xl transition', isRecording ? 'bg-red-100 text-red-500 animate-pulse' : 'text-gray-400 hover:text-green-600 hover:bg-green-50')}
          >
            {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder={isRecording ? '🎤 กำลังฟัง...' : 'พิมพ์ข้อความ หรือกด 🎤 พูด...'}
            rows={1}
            className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <button
            onClick={handleSend}
            disabled={sendMutation.isPending || (!input.trim() && !pendingImage)}
            className="p-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition disabled:opacity-40"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
