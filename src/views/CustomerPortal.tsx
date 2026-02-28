
import React, { useState, useRef, useEffect } from 'react';
import { useSalon } from '../store/SalonContext';
import { Customer } from '../types';
import { 
  Lock, ArrowRight, Apple, Droplets, Image as ImageIcon, Send, 
  Search, User, LogOut, ChevronLeft, CreditCard, History, Star,
  CalendarDays, ShoppingBag
} from 'lucide-react';

export const CustomerPortal: React.FC = () => {
  const { customers, updateCustomer, sendDietMessage, transactions } = useSalon();
  
  // Login / Selection State
  const [activeCustomer, setActiveCustomer] = useState<Customer | null>(null);
  const [searchPhone, setSearchPhone] = useState('');
  
  // Portal Navigation
  const [currentTab, setCurrentTab] = useState<'HOME' | 'DIET' | 'APPOINTMENTS' | 'WALLET'>('HOME');
  
  // Diet Specific States
  const [dietUnlocked, setDietUnlocked] = useState(false);
  const [dietPasswordInput, setDietPasswordInput] = useState('');
  const [dietChatInput, setDietChatInput] = useState('');
  const dietChatScrollRef = useRef<HTMLDivElement>(null);

  // Theme Helpers
  const getTierTheme = (tier: string) => {
    switch (tier) {
      case 'BLACK_VIP': return { bg: 'bg-slate-900', text: 'text-slate-900', subText: 'text-slate-500', border: 'border-slate-900', gradient: 'from-slate-800 to-black' };
      case 'PLATINUM': return { bg: 'bg-indigo-600', text: 'text-indigo-600', subText: 'text-indigo-400', border: 'border-indigo-600', gradient: 'from-indigo-500 to-indigo-900' };
      case 'GOLD': return { bg: 'bg-amber-500', text: 'text-amber-600', subText: 'text-amber-500', border: 'border-amber-500', gradient: 'from-amber-400 to-amber-600' };
      default: return { bg: 'bg-emerald-500', text: 'text-emerald-600', subText: 'text-emerald-500', border: 'border-emerald-500', gradient: 'from-emerald-400 to-emerald-600' };
    }
  };

  const tierTheme = activeCustomer ? getTierTheme(activeCustomer.tier) : getTierTheme('BRONZE');

  useEffect(() => {
    if (dietChatScrollRef.current) {
      dietChatScrollRef.current.scrollTop = dietChatScrollRef.current.scrollHeight;
    }
  }, [currentTab, activeCustomer?.dietChatHistory]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const found = customers.find(c => c.phone.includes(searchPhone) || c.fullName.toLowerCase().includes(searchPhone.toLowerCase()));
    if (found) {
      setActiveCustomer(found);
      setDietUnlocked(false);
    } else {
      alert('Müşteri bulunamadı.');
    }
  };

  const handleDietUnlock = () => {
    if (activeCustomer && activeCustomer.dietPassword === dietPasswordInput) {
      setDietUnlocked(true);
      setDietPasswordInput('');
    } else {
      alert('Hatalı şifre!');
    }
  };

  const handleSendDietChat = () => {
    if (!activeCustomer || !dietChatInput.trim()) return;
    
    sendDietMessage(activeCustomer.id, {
        sender: 'CUSTOMER',
        content: dietChatInput,
        type: 'TEXT'
    });
    setDietChatInput('');
  };

  const handleDietImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0] && activeCustomer) {
          const file = e.target.files[0];
          const reader = new FileReader();
          reader.onloadend = () => {
            sendDietMessage(activeCustomer.id, {
                sender: 'CUSTOMER',
                content: reader.result as string,
                type: 'IMAGE'
            });
          };
          reader.readAsDataURL(file);
      }
  };

  if (!activeCustomer) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-10 bg-slate-50">
        <div className="max-w-md w-full text-center space-y-8">
           <div className="w-24 h-24 bg-slate-900 rounded-[2.5rem] flex items-center justify-center mx-auto text-white shadow-2xl">
              <User size={48} />
           </div>
           <div>
             <h1 className="text-3xl font-black text-slate-900 italic">Müşteri Girişi</h1>
             <p className="text-slate-400 font-bold">Lütfen telefon numaranızı girin.</p>
           </div>
           <form onSubmit={handleLogin} className="relative">
             <input 
               type="text" 
               value={searchPhone}
               onChange={e => setSearchPhone(e.target.value)}
               placeholder="5XX..."
               className="w-full p-6 rounded-[2rem] border-2 border-slate-200 outline-none text-2xl font-black text-center focus:border-slate-900 transition-all"
             />
             <button type="submit" className="absolute right-3 top-3 bottom-3 aspect-square bg-slate-900 text-white rounded-[1.5rem] flex items-center justify-center hover:bg-black transition-all">
                <ArrowRight size={24} />
             </button>
           </form>
        </div>
      </div>
    );
  }

  const lastVisit = transactions
    .filter(t => t.customerId === activeCustomer.id)
    .sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

  return (
    <div className="flex h-screen bg-[#fcfdfe]">
      {/* Sidebar Navigation */}
      <div className="w-24 m-4 bg-slate-900 rounded-[3rem] flex flex-col items-center py-10 gap-8 shadow-2xl z-20">
         <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white font-black text-lg">
            {activeCustomer.fullName.charAt(0)}
         </div>
         <nav className="flex-1 flex flex-col gap-6 w-full px-2">
            {[
              { id: 'HOME', icon: User },
              { id: 'DIET', icon: Apple },
              { id: 'APPOINTMENTS', icon: CalendarDays },
              { id: 'WALLET', icon: CreditCard },
            ].map(item => (
              <button 
                key={item.id}
                onClick={() => setCurrentTab(item.id as any)}
                className={`w-full aspect-square rounded-2xl flex items-center justify-center transition-all ${currentTab === item.id ? 'bg-white text-slate-900 shadow-lg' : 'text-white/40 hover:text-white hover:bg-white/10'}`}
              >
                <item.icon size={24} />
              </button>
            ))}
         </nav>
         <button onClick={() => setActiveCustomer(null)} className="w-12 h-12 bg-rose-500 rounded-full flex items-center justify-center text-white hover:bg-rose-600 transition-all">
            <LogOut size={20} />
         </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-y-auto no-scrollbar relative">
        <div className="max-w-5xl mx-auto h-full flex flex-col">
          {/* Header */}
          <header className="flex justify-between items-center mb-10">
             <div>
                <h2 className="text-3xl font-black italic text-slate-900">Merhaba, {activeCustomer.fullName}</h2>
                <p className={`text-sm font-bold uppercase tracking-widest ${tierTheme.text}`}>{activeCustomer.tier} Member</p>
             </div>
             <div className="bg-white p-4 rounded-[2rem] shadow-sm border border-slate-100 flex items-center gap-4">
                <div className="text-right">
                   <p className="text-[10px] font-black uppercase text-slate-400">Puan Bakiyesi</p>
                   <p className="text-xl font-black text-slate-900">{activeCustomer.dna.loyaltyPuan}</p>
                </div>
                <div className="w-10 h-10 bg-amber-400 rounded-full flex items-center justify-center text-white shadow-md">
                   <Star size={20} fill="currentColor" />
                </div>
             </div>
          </header>

          {/* HOME TAB */}
          {currentTab === 'HOME' && (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className={`col-span-full bg-gradient-to-r ${tierTheme.gradient} p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden`}>
                   <div className="relative z-10">
                      <p className="text-sm font-bold opacity-80 uppercase tracking-widest mb-2">Dijital Üyelik Kartı</p>
                      <h3 className="text-4xl font-black italic tracking-tighter mb-8">{activeCustomer.tier} PASS</h3>
                      <div className="flex justify-between items-end">
                         <div>
                            <p className="text-xs opacity-60 uppercase mb-1">Müşteri No</p>
                            <p className="font-mono text-lg">{activeCustomer.id}</p>
                         </div>
                         <CreditCard size={48} className="opacity-50" />
                      </div>
                   </div>
                   <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                </div>
                
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                   <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mb-4"><History size={24}/></div>
                   <h4 className="font-black text-slate-900 text-lg italic">Son Ziyaret</h4>
                   <p className="text-sm font-medium text-slate-500 mt-2">
                      {lastVisit ? new Date(lastVisit.timestamp).toLocaleDateString('tr-TR') : 'Henüz ziyaret yok'}
                   </p>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                   <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center mb-4"><ShoppingBag size={24}/></div>
                   <h4 className="font-black text-slate-900 text-lg italic">Favori İçecek</h4>
                   <p className="text-sm font-medium text-slate-500 mt-2">
                      {activeCustomer.preferences.drink || 'Belirtilmemiş'}
                   </p>
                </div>
             </div>
          )}

          {/* DIET TAB */}
          {currentTab === 'DIET' && (
            <div className="h-full flex flex-col animate-in fade-in duration-700">
               {!dietUnlocked ? (
                   <div className="flex-1 flex flex-col items-center justify-center space-y-8 p-10">
                       <div className="w-32 h-32 bg-slate-900 text-rose-500 rounded-[3rem] flex items-center justify-center shadow-2xl mb-4 border-4 border-white">
                           <Lock size={64} />
                       </div>
                       <div className="text-center">
                           <h2 className={`text-4xl font-black italic ${tierTheme.text} mb-2`}>Nutri-Check Koruması</h2>
                           <p className={`text-slate-500 font-bold text-lg`}>Kişisel diyet programınıza erişmek için şifrenizi girin.</p>
                       </div>
                       <div className="relative w-full max-w-xs">
                           <input 
                              type="password" 
                              placeholder="Şifreniz" 
                              value={dietPasswordInput}
                              onChange={(e) => setDietPasswordInput(e.target.value)}
                              className="w-full py-5 px-8 rounded-full bg-white border-2 border-slate-200 outline-none font-black text-center text-2xl tracking-widest focus:border-rose-500 transition-all shadow-inner"
                           />
                           <button 
                              onClick={handleDietUnlock}
                              className="absolute right-2 top-2 bottom-2 aspect-square bg-rose-500 text-white rounded-full flex items-center justify-center hover:bg-rose-600 transition-all shadow-lg"
                           >
                               <ArrowRight size={24}/>
                           </button>
                       </div>
                       <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Şifrenizi diyetisyeninizden alabilirsiniz.</p>
                   </div>
               ) : (
                   <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 p-4 overflow-hidden h-full">
                       {/* PLAN COLUMN */}
                       <div className="lg:col-span-8 flex flex-col h-full overflow-hidden space-y-6">
                           <div className="flex justify-between items-center shrink-0">
                               <h2 className={`text-4xl font-black italic ${tierTheme.text} flex items-center gap-3`}>
                                   <Apple className="text-emerald-500"/> Haftalık Program
                               </h2>
                               <div className="flex gap-2 bg-white p-1 rounded-xl shadow-sm border border-slate-100 overflow-x-auto no-scrollbar">
                                   {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map((day, i) => (
                                       <div key={i} className="w-10 h-10 rounded-lg flex items-center justify-center text-[10px] font-black text-slate-400 bg-slate-50 uppercase">
                                           {day}
                                       </div>
                                   ))}
                               </div>
                           </div>
                           
                           <div className="flex-1 overflow-y-auto no-scrollbar space-y-6 pr-2">
                               {(activeCustomer.dietPlan || []).map((day, idx) => (
                                   <div key={idx} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                                       <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-bl-[100%] z-0 group-hover:bg-emerald-50 transition-colors"></div>
                                       <div className="relative z-10">
                                           <div className="flex justify-between items-center mb-6">
                                               <h3 className="text-2xl font-black italic text-slate-800">{day.dayName}</h3>
                                               <div className="flex items-center gap-2 bg-white/50 px-3 py-1 rounded-full border border-slate-100 backdrop-blur-sm">
                                                   <Droplets size={14} className="text-indigo-500"/>
                                                   <span className="text-sm font-black text-indigo-900">{day.waterTarget} LT Su</span>
                                               </div>
                                           </div>
                                           
                                           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                               {['breakfast', 'lunch', 'dinner'].map((mealKey) => {
                                                   const meal = (day.meals as any)[mealKey];
                                                   return (
                                                       <div key={mealKey} className={`p-5 rounded-3xl border transition-all ${meal.isCheat ? 'bg-rose-50 border-rose-100' : 'bg-slate-50 border-slate-100'}`}>
                                                           <div className="flex justify-between items-center mb-2">
                                                               <p className={`text-[10px] font-black uppercase tracking-widest ${meal.isCheat ? 'text-rose-500' : 'text-slate-400'}`}>
                                                                   {meal.title} {meal.isCheat && '🔥'}
                                                               </p>
                                                               <span className="text-[10px] font-bold text-slate-400">{meal.calories || 0} kcal</span>
                                                           </div>
                                                           <p className="text-sm font-medium text-slate-700 leading-snug">{meal.content || '-'}</p>
                                                       </div>
                                                   );
                                               })}
                                           </div>
                                           {day.meals.snacks.length > 0 && (
                                               <div className="mt-4 pt-4 border-t border-dashed border-slate-100">
                                                   <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Ara Öğünler</p>
                                                   <div className="flex flex-wrap gap-2">
                                                       {day.meals.snacks.map((s, si) => (
                                                           <span key={si} className="px-3 py-1 bg-amber-50 text-amber-800 rounded-lg text-xs font-bold border border-amber-100">
                                                               {s.content}
                                                           </span>
                                                       ))}
                                                   </div>
                                               </div>
                                           )}
                                       </div>
                                   </div>
                               ))}
                           </div>
                       </div>

                       {/* CHAT COLUMN */}
                       <div className="lg:col-span-4 bg-[#e5ddd5] rounded-[3rem] shadow-xl overflow-hidden flex flex-col relative border border-slate-200 h-full max-h-[800px]">
                           <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/subtle-white-feathers.png')] opacity-50 pointer-events-none"></div>
                           
                           <div className="bg-[#f0f2f5] p-6 border-b border-slate-200 flex items-center gap-4 relative z-10 shrink-0">
                               <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm">
                                   <Apple size={24} className="text-emerald-500"/>
                               </div>
                               <div>
                                   <h4 className="font-black text-slate-800">Diyetisyen Hattı</h4>
                                   <p className="text-xs text-emerald-600 font-bold flex items-center gap-1"><span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span> Çevrimiçi</p>
                               </div>
                           </div>

                           <div className="flex-1 overflow-y-auto p-4 space-y-3 relative z-10 no-scrollbar" ref={dietChatScrollRef}>
                               {(activeCustomer.dietChatHistory || []).map(msg => (
                                   <div key={msg.id} className={`flex ${msg.sender === 'CUSTOMER' ? 'justify-end' : 'justify-start'}`}>
                                       <div className={`max-w-[80%] p-3 rounded-2xl shadow-sm text-sm ${msg.sender === 'CUSTOMER' ? 'bg-[#d9fdd3] text-slate-900 rounded-tr-none' : 'bg-white text-slate-800 rounded-tl-none'}`}>
                                           {msg.type === 'IMAGE' ? (
                                               <img src={msg.content} className="rounded-lg max-w-full" alt="Chat attachment" />
                                           ) : (
                                               <p>{msg.content}</p>
                                           )}
                                           <span className="text-[9px] text-slate-400 block text-right mt-1 font-bold">
                                              {new Date(msg.timestamp).toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'})}
                                           </span>
                                       </div>
                                   </div>
                               ))}
                           </div>

                           <div className="p-4 bg-[#f0f2f5] relative z-10 flex items-center gap-2 shrink-0">
                               <label className="p-3 hover:bg-slate-200 rounded-full cursor-pointer text-slate-500 transition-colors">
                                   <ImageIcon size={20}/>
                                   <input type="file" accept="image/*" className="hidden" onChange={handleDietImageUpload} />
                               </label>
                               <input 
                                  value={dietChatInput}
                                  onChange={(e) => setDietChatInput(e.target.value)}
                                  onKeyDown={(e) => e.key === 'Enter' && handleSendDietChat()}
                                  placeholder="Mesaj..."
                                  className="flex-1 py-3 px-4 rounded-full border-none outline-none text-sm font-medium"
                               />
                               <button onClick={handleSendDietChat} className="p-3 bg-emerald-500 text-white rounded-full hover:bg-emerald-600 shadow-md transition-all active:scale-95">
                                   <Send size={18}/>
                               </button>
                           </div>
                       </div>
                   </div>
               )}
            </div>
          )}

          {currentTab === 'APPOINTMENTS' && (
             <div className="flex-1 flex flex-col items-center justify-center text-slate-400 opacity-50 space-y-4">
                 <CalendarDays size={80} />
                 <p className="text-2xl font-black italic">Randevu Modülü</p>
                 <p className="font-medium">Yakında aktif olacak.</p>
             </div>
          )}
          
          {currentTab === 'WALLET' && (
             <div className="flex-1 flex flex-col items-center justify-center text-slate-400 opacity-50 space-y-4">
                 <CreditCard size={80} />
                 <p className="text-2xl font-black italic">Cüzdan & Paketler</p>
                 <p className="font-medium">Yakında aktif olacak.</p>
             </div>
          )}

        </div>
      </div>
    </div>
  );
};
