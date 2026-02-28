
import React, { useState, useRef, useEffect } from 'react';
import { useSalon } from '../store/SalonContext';
import { GoogleGenAI } from '@google/genai';
import { MessageSquare, Send, X, Bot, Loader2, Sparkles, TrendingUp, WifiOff, Globe } from 'lucide-react';
import { getSearchBasedAdvice } from '../geminiService';

export const AIChatBot: React.FC = () => {
  const { services, staff, transactions, products, isOnline } = useSalon();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'bot'; text: string; sources?: any[] }[]>([
    { role: 'bot', text: "L'YSF Elite OS'e hoş geldiniz. Bugün salonunuzu nasıl büyütmemi istersiniz?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [useSearch, setUseSearch] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    if (!isOnline) {
       setMessages(prev => [...prev, { role: 'user', text: input }, { role: 'bot', text: "⚠️ İnternet bağlantısı yok. AI özellikleri şu an devre dışı." }]);
       setInput('');
       return;
    }

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      let botResponse = "";
      let sources = undefined;

      if (useSearch) {
        // Use Search Grounding (gemini-3-flash-preview with Google Search)
        const result = await getSearchBasedAdvice(userMsg);
        botResponse = result.text || "Arama sonucunda bilgi bulunamadı.";
        sources = result.sources;
      } else {
        // Use Standard Context-Aware Chat
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const prompt = `
          SEN: L'YSF LIFE CENTER FİNANSAL VE OPERASYONEL DANIŞMANISIN.
          SALON VERİLERİ:
          - Hizmetler: ${services.length} adet
          - Personel: ${staff.length} uzman
          - Ürünler: ${products.length} stok kalemi
          - Toplam İşlem: ${transactions.length} adet
          
          GÖREV: Kullanıcının sorularına salon verilerini analiz ederek profesyonel, lüks ve aksiyon odaklı yanıtlar ver.
          KRİTİK SORU: "${userMsg}"
        `;

        const response = await ai.models.generateContent({
          model: 'gemini-3-pro-preview',
          contents: prompt,
          config: { thinkingConfig: { thinkingBudget: 16000 } }
        });
        botResponse = response.text || "Üzgünüm, şu an yanıt veremiyorum.";
      }

      setMessages(prev => [...prev, { role: 'bot', text: botResponse, sources }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'bot', text: "Bir hata oluştu. Lütfen tekrar deneyin." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-8 right-8 w-20 h-20 rounded-[2rem] shadow-3xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50 group border border-white/10 ${isOnline ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-400'}`}
      >
        {isOnline && <div className="absolute -top-2 -right-2 bg-rose-500 w-6 h-6 rounded-full animate-ping opacity-75"></div>}
        {isOnline ? <Sparkles className="group-hover:rotate-12 transition-transform" size={32} /> : <WifiOff size={24} />}
      </button>

      {isOpen && (
        <div className="fixed inset-0 sm:inset-auto sm:bottom-32 sm:right-8 w-full sm:w-[450px] h-full sm:h-[650px] bg-white sm:rounded-[4rem] shadow-3xl z-[100] border border-slate-100 flex flex-col animate-in slide-in-from-bottom-10 overflow-hidden">
          <div className="p-8 bg-slate-900 text-white flex justify-between items-center">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center"><Bot size={24} className="text-rose-500" /></div>
               <div>
                  <h4 className="font-black italic text-lg">L'YSF AI Assistant</h4>
                  <p className={`text-[10px] font-bold uppercase tracking-widest ${isOnline ? 'text-emerald-400' : 'text-rose-400'}`}>{isOnline ? 'Neural Link Active' : 'Offline Mode'}</p>
               </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-3 hover:bg-white/10 rounded-full transition-all"><X size={24} /></button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-6 no-scrollbar bg-[#fcfdfe]">
            {!isOnline && (
              <div className="bg-rose-50 p-6 rounded-[2.5rem] text-center border border-rose-100">
                 <WifiOff className="mx-auto text-rose-500 mb-2" size={24} />
                 <p className="text-xs font-black text-rose-700 uppercase">İnternet Bağlantısı Yok</p>
                 <p className="text-[10px] text-rose-500">Yapay zeka asistanı şu an kullanılamıyor.</p>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[85%] p-6 rounded-[2.5rem] font-medium italic text-sm leading-relaxed ${m.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white border border-slate-100 text-slate-700 shadow-sm rounded-tl-none'}`}>
                  {m.text}
                </div>
                {m.sources && m.sources.length > 0 && (
                   <div className="mt-2 ml-4 flex flex-col gap-1">
                      <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Kaynaklar</p>
                      {m.sources.map((s, idx) => s.web?.uri && (
                         <a key={idx} href={s.web.uri} target="_blank" rel="noopener noreferrer" className="text-[10px] text-indigo-500 hover:underline flex items-center gap-1">
                            <Globe size={10} /> {s.web.title || s.web.uri}
                         </a>
                      ))}
                   </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                 <div className="bg-slate-50 p-6 rounded-[2.5rem] rounded-tl-none border border-slate-100 flex items-center gap-3">
                    <Loader2 className="animate-spin text-rose-500" size={16} />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Veriler İşleniyor...</span>
                 </div>
              </div>
            )}
          </div>

          <div className="p-6 border-t border-slate-100 bg-white">
             {/* Mode Toggle */}
             <div className="flex justify-center mb-4">
                <button 
                  onClick={() => setUseSearch(!useSearch)} 
                  className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${useSearch ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}
                >
                   <Globe size={12} /> {useSearch ? 'Web Arama Modu Açık' : 'Salon Veri Modu'}
                </button>
             </div>

             <div className="relative group">
                <input 
                  type="text" 
                  value={input} 
                  onChange={(e) => setInput(e.target.value)} 
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder={useSearch ? "Google'da ara..." : "Salon hakkında sor..."}
                  disabled={!isOnline}
                  className="w-full pl-6 pr-20 py-5 bg-slate-50 border-2 border-transparent rounded-[2rem] outline-none font-black text-sm focus:border-slate-900 focus:bg-white transition-all disabled:opacity-50"
                />
                <button 
                  onClick={handleSend}
                  disabled={isLoading || !input.trim() || !isOnline}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center hover:bg-rose-500 transition-all disabled:opacity-50 disabled:bg-slate-300"
                >
                   <Send size={20} />
                </button>
             </div>
          </div>
        </div>
      )}
    </>
  );
};
