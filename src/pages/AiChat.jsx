import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Send, Loader2 } from 'lucide-react';
import TargetIcon from '../components/TargetIcon';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { useLanguage } from '../context/LanguageContext';
import SkeletonLoader from '../components/SkeletonLoader';

const AiChat = () => {
  const navigate = useNavigate();
  const { t, lang } = useLanguage();
  const [messages, setMessages] = useState([
    { role: 'model', text: t('ai_welcome') }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();

    if (!input.trim() || loading) return;

    const userMessage = input;
    setInput('');
    setLoading(true);

    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

      if (!apiKey) {
        throw new Error("مفتاح API مفقود! تأكد من ملف .env");
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const result = await model.generateContent(userMessage);
      const response = await result.response;
      const text = response.text();

      setMessages(prev => [...prev, { role: 'model', text: text }]);

    } catch (error) {
      console.error("Gemini Error:", error);

      // 🟢 دي الرسالة الجديدة اللي هتكشف لنا المشكلة الحقيقية
      let errorMessage = `عفواً، فشل الاتصال. تفاصيل الخطأ: \n${error.message}`;

      setMessages(prev => [...prev, { role: 'model', text: errorMessage }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-['Cairo'] flex flex-col" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-[#103B66] transition font-bold"
            >
              <ArrowRight className={`w-5 h-5 ${lang === 'ar' ? '' : 'rotate-180'}`} />
              {t('back_to_dashboard')}
            </button>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="bg-[#103B66] p-2 rounded-lg">
                  <TargetIcon className="w-5 h-5 shrink-0" />
                </div>
                <h1 className="text-xl font-bold text-[#103B66] dark:text-blue-400">{t('ai_chat_title')}</h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Chat area */}
      <main className="flex-1 flex flex-col max-w-4xl w-full mx-auto px-4 py-6">
        <div className="flex-1 overflow-y-auto space-y-4 pb-4 min-h-0">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  msg.role === 'user'
                  ? 'bg-[#103B66] text-white'
                  : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 shadow-sm'
                  }`}
              >
                <p className="text-sm font-medium whitespace-pre-wrap">{msg.text}</p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-end">
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-3 shadow-sm flex flex-col gap-2 w-48">
                <div className="flex items-center gap-2 mb-1">
                  <Loader2 className="w-4 h-4 animate-spin text-[#103B66]" />
                  <span className="text-gray-500 dark:text-gray-400 text-xs font-semibold">{t('generating')}</span>
                </div>
                <SkeletonLoader type="text" height="12px" className="w-[80%]" />
                <SkeletonLoader type="text" height="12px" className="w-[60%]" />
                <SkeletonLoader type="text" height="12px" className="w-[90%]" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <form onSubmit={handleSend} className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('type_here')}
            disabled={loading}
            className="flex-1 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#103B66] disabled:opacity-60 dark:text-white dark:placeholder:text-gray-400"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="bg-[#103B66] hover:bg-[#0c2d4d] disabled:opacity-70 disabled:cursor-not-allowed text-white p-3 rounded-xl transition shadow-lg"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </main>
    </div>
  );
};

export default AiChat;