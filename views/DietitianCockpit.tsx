import React, { useState, useEffect, useRef } from 'react';
import { useSalon } from '../store/SalonContext';
import { UserRole, Customer, DietDay, ChatMessage, DietMeal } from '../types';
import { 
  Apple, Search, MessageCircle, Edit, Save, 
  Send, Image as ImageIcon, Phone, Eye, EyeOff, 
  UserCheck, ShieldCheck, ChevronRight, Lock, Unlock, FileText, Activity, Scale,
  Video, Mic, MicOff, VideoOff, PhoneOff, Clock, Calendar, X, Settings, TrendingUp,
  Trash2, Copy, RefreshCw, Droplets, Plus, Minus, User, Flame, Utensils, Zap, Camera,
  FilePlus, ClipboardList
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';

interface DietitianCockpitProps {
  setTab: (tab: string) => void;
}

const TEMPLATES = {
  BLANK: {
    name: 'Boş Şablon',
    days: ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'].map(d => ({
      dayName: d,
      meals: { 
        breakfast: { title: 'Kahvaltı', content: '', calories: 0, isCheat: false }, 
        lunch: { title: 'Öğle', content: '', calories: 0, isCheat: false }, 
        dinner: { title: 'Akşam', content: '', calories: 0, isCheat: false }, 
        snacks: [] 
      },
      waterTarget: 2.5,
      notes: ''
    }))
  },
  DETOX: {
    name: 'Hızlı Ödem Atıcı (Detoks)',
    days: ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'].map(d => ({
      dayName: d,
      meals: { 
        breakfast: { title: 'Kahvaltı', content: 'Yeşil Smoothie (Ispanak, Elma, Salatalık, Limon)', calories: 250, isCheat: false }, 
        lunch: { title: 'Öğle', content: 'Mevsim Salatası + 100gr Lor Peyniri', calories: 350, isCheat: false }, 
        dinner: { title: 'Akşam', content: 'Kabak Detoksu (Yoğurtlu, Cevizli)', calories: 300, isCheat: false }, 
        snacks: [{ title: 'Ara Öğün', content: '1 fincan Yeşil Çay + 2 Kuru Kayısı', calories: 80, isCheat: false }] 
      },
      waterTarget: 3.0,
      notes: 'Sabah uyanınca 1 bardak ılık suya yarım limon sıkıp içiniz.'
    }))
  },
  BALANCED: {
    name: 'Dengeli Yaşam (Standart)',
    days: ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'].map(d => ({
      dayName: d,
      meals: { 
        breakfast: { title: 'Kahvaltı', content: '1 Haşlanmış Yumurta, 1 Dilim Peynir, Yeşillik, 1 Dilim Tam Buğday Ekmeği', calories: 350, isCheat: false }, 
        lunch: { title: 'Öğle', content: '6 YK Sebze Yemeği + 1 Kase Yoğurt', calories: 450, isCheat: false }, 
        dinner: { title: 'Akşam', content: 'Izgara Tavuk/Köfte + Bol Salata', calories: 500, isCheat: false }, 
        snacks: [{ title: 'Ara Öğün', content: '1 Porsiyon Meyve + 10 Çiğ Badem', calories: 150, isCheat: false }] 
      },
      waterTarget: 2.5,
      notes: 'Yemeklerden hemen sonra su içmeyiniz, 30 dk bekleyiniz.'
    }))
  }
};

export const DietitianCockpit: React.FC<DietitianCockpitProps> = ({ setTab }) => {
  const { customers, currentRole, updateDietPlan, sendDietMessage, updateCustomer, initiateCall, endCall, activeCall } = useSalon();
  
  // State
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'PLAN' | 'CHAT' | 'ANALYSIS' | 'GALLERY'>('PLAN');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Chat States
  const [chatInput, setChatInput] = useState('');
  const chatScrollRef = useRef<HTMLDivElement>(null);
  
  // Call & Schedule States
  const [showCallMenu, setShowCallMenu] = useState(false);
  const [scheduleTime, setScheduleTime] = useState('');
  
  // Diet Plan Editor State
  const [dietPlan, setDietPlan] = useState<DietDay[]>([]);
  const [showTemplateMenu, setShowTemplateMenu] = useState(false);

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);
  
  const isManager = currentRole === UserRole.MANAGER;
  const canAccess = [UserRole.MANAGER, UserRole.EXPERT, UserRole.RECEPTIONIST].includes(currentRole);

  useEffect(() => {
    if (selectedCustomer) {
      if (selectedCustomer.dietPlan && selectedCustomer.dietPlan.length > 0) {
        setDietPlan(selectedCustomer.dietPlan);
      } else {
        loadTemplate('BLANK');
      }
    }
  }, [selectedCustomer]);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [selectedCustomer?.dietChatHistory, activeTab]);

  const loadTemplate = (type: 'BLANK' | 'DETOX' | 'BALANCED') => {
    // Deep copy to prevent reference issues
    setDietPlan(JSON.parse(JSON.stringify(TEMPLATES[type].days)));
    setShowTemplateMenu(false);
  };

  if (!canAccess) {
    return <div className="p-20 text-center text-slate-400 font-black">Erişim Yetkiniz Yok.</div>;
  }

  const handleSavePlan = () => {
    if (selectedCustomerId) {
      updateDietPlan(selectedCustomerId, dietPlan);
      alert("Diyet programı müşteriye iletildi!");
    }
  };

  const handleCopyPreviousDay = (currentIndex: number) => {
      if (currentIndex === 0) return;
      const prevDay = dietPlan[currentIndex - 1];
      const newPlan = [...dietPlan];
      
      // Deep copy meals to avoid reference issues
      newPlan[currentIndex] = {
          ...newPlan[currentIndex],
          meals: JSON.parse(JSON.stringify(prevDay.meals)),
          waterTarget: prevDay.waterTarget,
          notes: prevDay.notes
      };
      setDietPlan(newPlan);
  };

  // Helper to update specific meal details
  const updateMealDetail = (dayIndex: number, mealType: 'breakfast' | 'lunch' | 'dinner', field: keyof DietMeal, value: any) => {
      const newPlan = [...dietPlan];
      const meal = newPlan[dayIndex].meals[mealType];
      newPlan[dayIndex].meals[mealType] = { ...meal, [field]: value };
      setDietPlan(newPlan);
  };

  const updateDayDetail = (dayIndex: number, field: keyof DietDay, value: any) => {
      const newPlan = [...dietPlan];
      newPlan[dayIndex] = { ...newPlan[dayIndex], [field]: value };
      setDietPlan(newPlan);
  };

  const addSnack = (dayIndex: number) => {
      const newPlan = [...dietPlan];
      newPlan[dayIndex].meals.snacks.push({ title: 'Ara Öğün', content: '', calories: 0, isCheat: false });
      setDietPlan(newPlan);
  };

  const updateSnack = (dayIndex: number, snackIndex: number, field: keyof DietMeal, value: any) => {
      const newPlan = [...dietPlan];
      newPlan[dayIndex].meals.snacks[snackIndex] = { ...newPlan[dayIndex].meals.snacks[snackIndex], [field]: value };
      setDietPlan(newPlan);
  };

  const removeSnack = (dayIndex: number, snackIndex: number) => {
      const newPlan = [...dietPlan];
      newPlan[dayIndex].meals.snacks.splice(snackIndex, 1);
      setDietPlan(newPlan);
  };

  const handleSendMessage = () => {
    if (!selectedCustomerId || !chatInput.trim()) return;
    sendDietMessage(selectedCustomerId, {
      sender: isManager ? 'MANAGER' : 'DIETITIAN',
      content: chatInput,
      type: 'TEXT'
    });
    setChatInput('');
  };

  const handleChatImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && selectedCustomerId) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        sendDietMessage(selectedCustomerId, {
          sender: isManager ? 'MANAGER' : 'DIETITIAN',
          content: reader.result as string,
          type: 'IMAGE'
        });
      };
      reader.readAsDataURL(file);
      e.target.value = ''; 
    }
  };

  const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0] && selectedCustomer) {
          const file = e.target.files[0];
          const reader = new FileReader();
          reader.onloadend = () => {
              const base64 = reader.result as string;
              const updatedGallery = [...(selectedCustomer.gallery || []), base64];
              updateCustomer({ ...selectedCustomer, gallery: updatedGallery });
          };
          reader.readAsDataURL(file);
          e.target.value = ''; // Reset input
      }
  };

  const handleDeleteGalleryImage = (index: number) => {
      if (selectedCustomer && confirm("Bu fotoğrafı silmek istediğinize emin misiniz?")) {
          const updatedGallery = selectedCustomer.gallery.filter((_, i) => i !== index);
          updateCustomer({ ...selectedCustomer, gallery: updatedGallery });
      }
  };

  // --- CALL LOGIC (NOW CONNECTED TO GLOBAL SYSTEM) ---
  const startCall = (type: 'VIDEO' | 'AUDIO') => {
      if (!selectedCustomerId) return;
      setShowCallMenu(false);
      
      // 1. Sisteme çağrıyı başlat (Müşteri ekranına düşer)
      initiateCall(selectedCustomerId, type);
      
      // 2. Chat'e bilgi düş
      sendDietMessage(selectedCustomerId, {
          sender: isManager ? 'MANAGER' : 'DIETITIAN',
          content: `${type === 'VIDEO' ? 'Görüntülü' : 'Sesli'} görüşme başlatıldı.`,
          type: 'CALL_REQUEST'
      });
  };

  const handleEndCall = () => {
      // Global çağrıyı sonlandır
      endCall();
      
      if (selectedCustomerId) {
        sendDietMessage(selectedCustomerId, {
            sender: isManager ? 'MANAGER' : 'DIETITIAN',
            content: `Görüşme sonlandı. (${new Date().toLocaleTimeString()})`,
            type: 'TEXT'
        });
      }
  };

  const sendAppointmentRequest = () => {
      if (!selectedCustomerId || !scheduleTime) return;
      sendDietMessage(selectedCustomerId, {
          sender: isManager ? 'MANAGER' : 'DIETITIAN',
          content: `📅 Online Görüşme Randevusu\n⏰ Saat: ${scheduleTime}\n\nLütfen belirtilen saatte uygulama üzerinden çevrimiçi olunuz.`,
          type: 'TEXT'
      });
      setScheduleTime('');
      setShowCallMenu(false);
  };

  const filteredCustomers = customers.filter(c => 
    c.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-200px)] flex gap-6 animate-in fade-in duration-500 relative">
      
      {/* ACTIVE CALL OVERLAY (DIETITIAN SIDE) */}
      {activeCall && selectedCustomer && activeCall.customerId === selectedCustomer.id && (
          <div className="fixed inset-0 z-[999] bg-slate-900 flex flex-col items-center justify-center text-white animate-in zoom-in-95 duration-500">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
              {activeCall.type === 'VIDEO' && (
                  <div className="absolute inset-0 bg-gradient-to-b from-slate-800 to-black opacity-50">
                      <div className="w-full h-full flex items-center justify-center">
                          <UserCheck size={120} className="opacity-20"/>
                      </div>
                  </div>
              )}
              
              <div className="relative z-10 flex flex-col items-center gap-8">
                  <div className="w-32 h-32 rounded-full bg-slate-800 border-4 border-slate-700 flex items-center justify-center shadow-2xl overflow-hidden relative">
                      <span className="text-4xl font-black">{selectedCustomer.fullName.charAt(0)}</span>
                      {activeCall.status === 'RINGING' && <div className="absolute inset-0 border-4 border-emerald-500 rounded-full animate-ping"></div>}
                  </div>
                  
                  <div className="text-center space-y-2">
                      <h2 className="text-4xl font-black tracking-tighter">{selectedCustomer.fullName}</h2>
                      <p className="text-emerald-400 font-bold uppercase tracking-widest animate-pulse">
                          {activeCall.status === 'RINGING' ? 'Aranıyor...' : 'Canlı Bağlantı'}
                      </p>
                  </div>

                  <div className="flex items-center gap-6 mt-10">
                      <button className="p-6 rounded-full bg-white/10 hover:bg-white/20 transition-all backdrop-blur-md"><MicOff size={24}/></button>
                      {activeCall.type === 'VIDEO' && <button className="p-6 rounded-full bg-white/10 hover:bg-white/20 transition-all backdrop-blur-md"><VideoOff size={24}/></button>}
                      <button onClick={handleEndCall} className="p-8 rounded-full bg-rose-500 hover:bg-rose-600 transition-all shadow-xl hover:scale-110 active:scale-95">
                          <PhoneOff size={32} fill="white" />
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* LEFT SIDEBAR: Patient List */}
      <div className="w-80 bg-white rounded-[2.5rem] border border-slate-100 shadow-xl flex flex-col overflow-hidden">
        <div className="p-6 bg-slate-50 border-b border-slate-100">
           <div className="flex justify-between items-center mb-4">
               <h3 className="text-xl font-black italic text-slate-900 flex items-center gap-2">
                 <Apple className="text-emerald-500" /> Danışanlar
               </h3>
               <button 
                  onClick={() => setTab('system-management')} 
                  className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
               >
                  <Settings size={14} /> Rehber
               </button>
           </div>
           <div className="relative">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
             <input 
               value={searchTerm} 
               onChange={e => setSearchTerm(e.target.value)} 
               placeholder="İsim Ara..." 
               className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-slate-200 text-sm font-bold outline-none focus:border-emerald-500 transition-all"
             />
           </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar">
           {filteredCustomers.map(c => (
             <button 
               key={c.id} 
               onClick={() => setSelectedCustomerId(c.id)}
               className={`w-full p-4 rounded-2xl flex items-center justify-between transition-all group ${selectedCustomerId === c.id ? 'bg-emerald-500 text-white shadow-lg' : 'bg-white hover:bg-slate-50 border border-transparent hover:border-slate-100'}`}
             >
               <div className="text-left">
                 <p className="font-black text-sm">{c.fullName}</p>
                 <p className={`text-[10px] font-bold uppercase tracking-widest ${selectedCustomerId === c.id ? 'text-emerald-100' : 'text-slate-400'}`}>{c.tier}</p>
               </div>
               {c.dietChatHistory && c.dietChatHistory.some(m => !m.isRead && m.sender === 'CUSTOMER') && (
                 <div className="w-3 h-3 bg-rose-500 rounded-full animate-pulse border-2 border-white"></div>
               )}
             </button>
           ))}
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 bg-white rounded-[2.5rem] border border-slate-100 shadow-xl flex flex-col overflow-hidden relative">
        {!selectedCustomer ? (
          <div className="flex-1 flex flex-col items-center justify-center opacity-30">
             <Apple size={80} className="mb-4" />
             <p className="text-2xl font-black italic">Bir Danışan Seçin</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 backdrop-blur-md">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center font-black text-lg">
                    {selectedCustomer.fullName.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 italic">{selectedCustomer.fullName}</h2>
                    <p className="text-xs font-bold text-slate-50 flex items-center gap-2">
                       {selectedCustomer.phone} 
                       {isManager && <span className="px-2 py-0.5 bg-slate-200 rounded text-[9px]">MANAGER VIEW</span>}
                    </p>
                  </div>
               </div>
               
               <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-100 items-center">
                  <button 
                    onClick={() => setActiveTab('PLAN')} 
                    className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'PLAN' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}
                  >
                    <FileText size={14}/> Program
                  </button>
                  <button 
                    onClick={() => setActiveTab('ANALYSIS')} 
                    className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'ANALYSIS' ? 'bg-amber-500 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}
                  >
                    <Scale size={14}/> Analiz
                  </button>
                  <button 
                    onClick={() => setActiveTab('GALLERY')} 
                    className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'GALLERY' ? 'bg-rose-500 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}
                  >
                    <ImageIcon size={14}/> Galeri
                  </button>
                  <button 
                    onClick={() => setActiveTab('CHAT')} 
                    className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'CHAT' ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}
                  >
                    <MessageCircle size={14}/> İletişim
                  </button>
                  <div className="w-px h-6 bg-slate-200 mx-2"></div>
                  <button 
                    onClick={() => setTab('customers')} 
                    className="px-4 py-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                    title="Detaylı CRM Profili"
                  >
                    <User size={18}/>
                  </button>
               </div>
            </div>

            {/* TAB CONTENT: PLAN EDITOR */}
            {activeTab === 'PLAN' && (
              <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
                 <div className="max-w-7xl mx-auto space-y-8">
                    <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                       <h3 className="text-2xl font-black italic text-slate-700 flex items-center gap-3">
                           <Apple className="text-emerald-500"/> Haftalık Beslenme Programı
                       </h3>
                       <div className="flex gap-2 relative">
                           <button onClick={() => setShowTemplateMenu(!showTemplateMenu)} className="px-6 py-4 bg-indigo-50 text-indigo-600 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-indigo-100 transition-all flex items-center gap-2 border border-indigo-100">
                              <ClipboardList size={16} /> Şablon Yükle
                           </button>
                           
                           {showTemplateMenu && (
                               <div className="absolute top-16 right-0 bg-white border border-slate-100 shadow-2xl rounded-2xl p-2 w-64 z-20 animate-in fade-in zoom-in-95">
                                   <p className="px-4 py-2 text-[10px] font-black uppercase text-slate-400 tracking-widest">Hazır Programlar</p>
                                   <button onClick={() => loadTemplate('BLANK')} className="w-full text-left px-4 py-3 hover:bg-slate-50 rounded-xl text-sm font-bold text-slate-600 flex items-center gap-2"><FilePlus size={14}/> Boş Şablon</button>
                                   <button onClick={() => loadTemplate('DETOX')} className="w-full text-left px-4 py-3 hover:bg-emerald-50 rounded-xl text-sm font-bold text-emerald-600 flex items-center gap-2"><LeafIcon/> Hızlı Ödem Atıcı</button>
                                   <button onClick={() => loadTemplate('BALANCED')} className="w-full text-left px-4 py-3 hover:bg-amber-50 rounded-xl text-sm font-bold text-amber-600 flex items-center gap-2"><Scale size={14}/> Dengeli Yaşam</button>
                               </div>
                           )}

                           <button onClick={() => loadTemplate('BLANK')} className="px-6 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-rose-50 hover:text-rose-500 transition-all flex items-center gap-2">
                              <Trash2 size={16} /> Temizle
                           </button>
                           <button onClick={handleSavePlan} className="px-8 py-4 bg-emerald-500 text-white rounded-2xl font-black shadow-xl hover:bg-emerald-600 transition-all flex items-center gap-2 active:scale-95">
                              <Save size={18} /> KAYDET VE GÖNDER
                           </button>
                       </div>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6 pb-20">
                       {dietPlan.map((day, dayIdx) => (
                         <div key={dayIdx} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-all relative group">
                            
                            {/* Copy Previous Day Button */}
                            {dayIdx > 0 && (
                                <button 
                                    onClick={() => handleCopyPreviousDay(dayIdx)}
                                    className="absolute top-6 right-16 p-2 bg-slate-50 text-slate-400 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 transition-all"
                                    title="Önceki günü kopyala"
                                >
                                    <Copy size={14}/>
                                </button>
                            )}

                            <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-50">
                               <span className="font-black text-xl text-slate-800 italic">{day.dayName}</span>
                               <div className="flex items-center gap-2 bg-indigo-50 px-2 py-1 rounded-xl">
                                   <Droplets size={12} className="text-indigo-500"/>
                                   <input 
                                     type="number" 
                                     step="0.5"
                                     value={day.waterTarget} 
                                     onChange={(e) => updateDayDetail(dayIdx, 'waterTarget', Number(e.target.value))}
                                     className="w-10 bg-transparent text-center text-xs font-black text-indigo-700 outline-none"
                                   />
                                   <span className="text-[10px] font-bold text-indigo-400">LT</span>
                               </div>
                            </div>
                            
                            <div className="space-y-4">
                               {/* Main Meals */}
                               {[
                                 { type: 'breakfast' as const, label: 'Kahvaltı', color: 'amber' },
                                 { type: 'lunch' as const, label: 'Öğle', color: 'emerald' },
                                 { type: 'dinner' as const, label: 'Akşam', color: 'indigo' }
                               ].map((meal, mIdx) => (
                                 <div key={mIdx} className="relative group/input bg-slate-50 rounded-2xl p-3 border border-slate-100 focus-within:bg-white focus-within:shadow-md transition-all">
                                     <div className="flex justify-between items-center mb-2">
                                        <span className={`text-[10px] font-black uppercase text-${meal.color}-500 tracking-widest flex items-center gap-1`}>
                                            <Utensils size={10}/> {meal.label}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <label className="flex items-center gap-1 cursor-pointer" title="Kaçamak Öğün">
                                                <input 
                                                    type="checkbox" 
                                                    checked={day.meals[meal.type].isCheat} 
                                                    onChange={(e) => updateMealDetail(dayIdx, meal.type, 'isCheat', e.target.checked)}
                                                    className="hidden"
                                                />
                                                <Flame size={12} className={day.meals[meal.type].isCheat ? "text-rose-500 fill-rose-500" : "text-slate-300 hover:text-rose-400"} />
                                            </label>
                                            <div className="flex items-center bg-white rounded-lg px-2 border border-slate-100">
                                                <input 
                                                    type="number" 
                                                    placeholder="kcal"
                                                    value={day.meals[meal.type].calories || ''}
                                                    onChange={(e) => updateMealDetail(dayIdx, meal.type, 'calories', Number(e.target.value))}
                                                    className="w-10 text-[9px] font-bold text-right outline-none"
                                                />
                                                <span className="text-[8px] text-slate-400 ml-1">cal</span>
                                            </div>
                                        </div>
                                     </div>
                                     <textarea 
                                       value={day.meals[meal.type].content}
                                       onChange={(e) => updateMealDetail(dayIdx, meal.type, 'content', e.target.value)}
                                       className="w-full bg-transparent text-sm font-medium resize-none h-16 outline-none text-slate-700 placeholder:text-slate-300"
                                       placeholder={`${meal.label} içeriği...`}
                                     />
                                 </div>
                               ))}

                               {/* Snacks Section */}
                               <div className="space-y-2">
                                   <div className="flex justify-between items-center">
                                       <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Ara Öğünler</span>
                                       <button onClick={() => addSnack(dayIdx)} className="w-5 h-5 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 hover:bg-emerald-500 hover:text-white transition-all"><Plus size={12}/></button>
                                   </div>
                                   {day.meals.snacks.map((snack, sIdx) => (
                                       <div key={sIdx} className="flex gap-2 items-start bg-slate-50 p-2 rounded-xl border border-slate-100">
                                           <div className="flex-1">
                                               <input 
                                                   value={snack.content}
                                                   onChange={(e) => updateSnack(dayIdx, sIdx, 'content', e.target.value)}
                                                   placeholder="Ara öğün..."
                                                   className="w-full bg-transparent text-xs font-bold outline-none text-slate-700"
                                               />
                                               <div className="flex items-center gap-2 mt-1">
                                                   <input 
                                                       type="number" 
                                                       placeholder="kcal"
                                                       value={snack.calories || ''}
                                                       onChange={(e) => updateSnack(dayIdx, sIdx, 'calories', Number(e.target.value))}
                                                       className="w-10 text-[9px] bg-white px-1 rounded border border-slate-100 outline-none"
                                                   />
                                               </div>
                                           </div>
                                           <button onClick={() => removeSnack(dayIdx, sIdx)} className="text-slate-300 hover:text-rose-500"><X size={12}/></button>
                                       </div>
                                   ))}
                               </div>

                               {/* Daily Notes */}
                               <div className="pt-4 border-t border-slate-100">
                                   <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 flex items-center gap-1"><FileText size={10}/> Günlük Not</p>
                                   <textarea 
                                       value={day.notes}
                                       onChange={(e) => updateDayDetail(dayIdx, 'notes', e.target.value)}
                                       className="w-full bg-amber-50 rounded-xl p-3 text-xs font-medium text-amber-900 placeholder:text-amber-300 outline-none resize-none h-16 border border-amber-100"
                                       placeholder="Örn: Sabah aç karnına limonlu su içiniz..."
                                   />
                               </div>
                            </div>
                         </div>
                       ))}
                    </div>
                 </div>
              </div>
            )}

            {/* TAB CONTENT: ANALYSIS */}
            {activeTab === 'ANALYSIS' && (
              <div className="flex-1 overflow-y-auto p-12 bg-slate-50">
                 <div className="flex justify-between items-center mb-8">
                    <h3 className="text-3xl font-black italic text-slate-800 flex items-center gap-3">
                        <TrendingUp className="text-emerald-500"/> Vücut Analiz Geçmişi
                    </h3>
                    <button 
                        onClick={() => setTab('customers')} 
                        className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold uppercase text-xs tracking-widest shadow-xl flex items-center gap-2"
                    >
                        <Plus size={16}/> Yeni Ölçüm Ekle
                    </button>
                 </div>
                 
                 {(!selectedCustomer.bodyAnalysis || selectedCustomer.bodyAnalysis.length === 0) ? (
                    <div className="text-center py-20 bg-white rounded-[3rem] border border-slate-100">
                        <Activity size={48} className="mx-auto text-slate-300 mb-4"/>
                        <p className="text-slate-400 font-bold italic">Kayıtlı analiz verisi bulunamadı.</p>
                    </div>
                 ) : (
                    <div className="space-y-8">
                        {/* CHART SECTION: WEIGHT & MUSCLE */}
                        <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 relative h-[400px]">
                            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 ml-2 flex items-center gap-2"><Scale size={14}/> Kilo & Kas Değişimi</h4>
                            <ResponsiveContainer width="100%" height="85%">
                                <LineChart data={[...selectedCustomer.bodyAnalysis]}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis 
                                        dataKey="date" 
                                        tickFormatter={(t) => new Date(t).toLocaleDateString('tr-TR', {day:'numeric', month:'short'})} 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 700}} 
                                    />
                                    <YAxis hide domain={['dataMin - 2', 'dataMax + 2']} />
                                    <Tooltip 
                                        contentStyle={{borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontWeight: 'bold'}}
                                    />
                                    <Legend />
                                    <Line type="monotone" dataKey="weight" name="Kilo (kg)" stroke="#334155" strokeWidth={4} dot={{r:4}} activeDot={{r:6}} />
                                    <Line type="monotone" dataKey="muscleMass" name="Kas Kütlesi (kg)" stroke="#10b981" strokeWidth={4} dot={{r:4}} activeDot={{r:6}} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Son Ölçüm Kartı */}
                        <div className="bg-slate-900 text-white p-10 rounded-[3rem] shadow-xl grid grid-cols-2 md:grid-cols-4 gap-8">
                            {[
                                { label: 'GÜNCEL KİLO', val: selectedCustomer.bodyAnalysis[selectedCustomer.bodyAnalysis.length-1].weight, unit: 'kg', color: 'text-white' },
                                { label: 'YAĞ ORANI', val: selectedCustomer.bodyAnalysis[selectedCustomer.bodyAnalysis.length-1].fatPercentage, unit: '%', color: 'text-amber-400' },
                                { label: 'KAS KÜTLESİ', val: selectedCustomer.bodyAnalysis[selectedCustomer.bodyAnalysis.length-1].muscleMass, unit: 'kg', color: 'text-emerald-400' },
                                { label: 'VÜCUT KİTLE İNDEKSİ', val: selectedCustomer.bodyAnalysis[selectedCustomer.bodyAnalysis.length-1].bmi, unit: 'BMI', color: 'text-indigo-400' },
                            ].map((stat, i) => (
                                <div key={i} className="text-center">
                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">{stat.label}</p>
                                    <p className={`text-5xl font-black italic ${stat.color}`}>{stat.val} <span className="text-sm opacity-50">{stat.unit}</span></p>
                                </div>
                            ))}
                        </div>

                        {/* Geçmiş Liste */}
                        <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 border-b border-slate-100">
                                    <tr>
                                        <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Tarih</th>
                                        <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Kilo</th>
                                        <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Yağ %</th>
                                        <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Kas</th>
                                        <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">BMI</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {[...selectedCustomer.bodyAnalysis].reverse().map((rec, i) => (
                                        <tr key={i} className="hover:bg-slate-50 transition-colors">
                                            <td className="p-6 font-bold text-slate-700">{new Date(rec.date).toLocaleDateString('tr-TR')}</td>
                                            <td className="p-6 font-black text-slate-900">{rec.weight}</td>
                                            <td className="p-6 font-bold text-slate-600">{rec.fatPercentage}</td>
                                            <td className="p-6 font-bold text-slate-600">{rec.muscleMass}</td>
                                            <td className="p-6 font-bold text-slate-600">{rec.bmi}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                 )}
              </div>
            )}

            {/* TAB CONTENT: GALLERY */}
            {activeTab === 'GALLERY' && (
              <div className="flex-1 overflow-y-auto p-12 bg-slate-50">
                 <div className="flex justify-between items-center mb-8">
                    <h3 className="text-3xl font-black italic text-slate-800 flex items-center gap-3">
                        <ImageIcon className="text-emerald-500"/> Gelişim Galerisi
                    </h3>
                    <label className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold uppercase text-xs tracking-widest shadow-xl flex items-center gap-2 cursor-pointer hover:bg-black transition-all">
                        <Camera size={16}/> Fotoğraf Ekle
                        <input type="file" accept="image/*" className="hidden" onChange={handleGalleryUpload} />
                    </label>
                 </div>

                 {(!selectedCustomer.gallery || selectedCustomer.gallery.length === 0) ? (
                    <div className="text-center py-20 bg-white rounded-[3rem] border border-slate-100">
                        <ImageIcon size={48} className="mx-auto text-slate-300 mb-4"/>
                        <p className="text-slate-400 font-bold italic">Henüz fotoğraf yüklenmedi.</p>
                    </div>
                 ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {selectedCustomer.gallery.map((img, idx) => (
                            <div key={idx} className="aspect-square rounded-[2rem] overflow-hidden relative group border border-slate-200 bg-white shadow-md">
                                <img src={img} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 backdrop-blur-sm">
                                    <button onClick={() => window.open(img, '_blank')} className="p-3 bg-white/20 text-white rounded-full hover:bg-emerald-500 transition-all" title="Büyüt"><Eye size={20}/></button>
                                    <button onClick={() => handleDeleteGalleryImage(idx)} className="p-3 bg-white/20 text-white rounded-full hover:bg-rose-500 transition-all" title="Sil"><Trash2 size={20}/></button>
                                </div>
                                <div className="absolute bottom-4 left-4 bg-black/60 px-3 py-1 rounded-lg text-[9px] font-black text-white uppercase tracking-widest backdrop-blur-md">
                                    #{idx + 1}
                                </div>
                            </div>
                        ))}
                    </div>
                 )}
              </div>
            )}

            {/* TAB CONTENT: CHAT */}
            {activeTab === 'CHAT' && (
              <div className="flex-1 flex flex-col bg-[#e5ddd5] relative overflow-hidden">
                 {/* Chat Area */}
                 <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/subtle-white-feathers.png')] opacity-50 pointer-events-none"></div>
                 
                 <div className="flex-1 overflow-y-auto p-6 space-y-4 relative z-10 min-h-0" ref={chatScrollRef}>
                    {!selectedCustomer.dietChatHistory || selectedCustomer.dietChatHistory.length === 0 ? (
                       <div className="text-center py-20 text-slate-500 opacity-60 font-bold italic">
                          Henüz mesajlaşma başlamadı.
                       </div>
                    ) : (
                       selectedCustomer.dietChatHistory.map(msg => {
                          const isMe = msg.sender !== 'CUSTOMER';
                          // Manager, Personelin mesajlarını görür ve kimin attığını bilir.
                          const displayName = msg.sender === 'MANAGER' ? 'Yönetici' : (msg.sender === 'DIETITIAN' ? 'Diyetisyen' : selectedCustomer.fullName);
                          
                          return (
                             <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[70%] p-4 rounded-2xl shadow-sm relative ${isMe ? 'bg-[#d9fdd3] rounded-tr-none' : 'bg-white rounded-tl-none'}`}>
                                   {isManager && <p className="text-[9px] font-black text-slate-400 mb-1 uppercase tracking-widest">{displayName}</p>}
                                   
                                   {msg.type === 'IMAGE' ? (
                                      <img src={msg.content} className="rounded-lg max-w-full h-auto cursor-pointer hover:scale-105 transition-transform" onClick={() => window.open(msg.content, '_blank')} />
                                   ) : msg.type === 'CALL_REQUEST' ? (
                                      <div className="flex items-center gap-3 bg-slate-100 p-3 rounded-xl border border-slate-200">
                                         <Phone size={20} className="text-emerald-500 animate-pulse"/> 
                                         <span className="font-bold text-sm italic">{msg.content}</span>
                                      </div>
                                   ) : (
                                      <p className="text-sm font-medium text-slate-800 leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                   )}
                                   <span className="text-[9px] text-slate-400 block text-right mt-1 font-bold">
                                      {new Date(msg.timestamp).toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'})}
                                   </span>
                                </div>
                             </div>
                          );
                       })
                    )}
                 </div>

                 {/* Input Area */}
                 <div className="p-4 bg-white border-t border-slate-200 relative z-30 flex items-center gap-4 pr-32 shadow-[0_-5px_20px_rgba(0,0,0,0.05)]"> 
                    {/* Added pr-32 to avoid overlap with floating AI button */}
                    <div className="relative">
                        <button onClick={() => setShowCallMenu(!showCallMenu)} className={`p-3 rounded-full transition-all shadow-sm shrink-0 ${showCallMenu ? 'bg-slate-900 text-white' : 'bg-white text-slate-500 hover:bg-emerald-500 hover:text-white'}`} title="İletişim Seçenekleri">
                           {showCallMenu ? <X size={20} /> : <Phone size={20}/>}
                        </button>
                        
                        {/* Call Menu Popover */}
                        {showCallMenu && (
                            <div className="absolute bottom-16 left-0 bg-white border border-slate-200 shadow-2xl rounded-2xl p-2 w-64 animate-in slide-in-from-bottom-4 zoom-in-95 z-[100]">
                                <p className="text-[9px] font-black uppercase text-slate-400 mb-2 px-2 tracking-widest">İletişim Yöntemi</p>
                                <button onClick={() => startCall('AUDIO')} className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl text-left transition-colors">
                                    <div className="bg-emerald-100 text-emerald-600 p-2 rounded-lg"><Phone size={16}/></div>
                                    <span className="text-sm font-bold text-slate-700">Sesli Arama Başlat</span>
                                </button>
                                <button onClick={() => startCall('VIDEO')} className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl text-left transition-colors">
                                    <div className="bg-indigo-100 text-indigo-600 p-2 rounded-lg"><Video size={16}/></div>
                                    <span className="text-sm font-bold text-slate-700">Görüntülü Ara</span>
                                </button>
                                <div className="h-px bg-slate-100 my-1"></div>
                                <div className="p-2 bg-amber-50 rounded-xl border border-amber-100 mt-1">
                                    <p className="text-[9px] font-black uppercase text-amber-600 mb-2 flex items-center gap-1"><Calendar size={10}/> İleri Tarihli Randevu</p>
                                    <div className="flex gap-2">
                                        <input 
                                            type="time" 
                                            value={scheduleTime}
                                            onChange={(e) => setScheduleTime(e.target.value)}
                                            className="w-full bg-white border border-amber-200 rounded-lg px-2 py-1 text-xs font-bold outline-none"
                                        />
                                        <button onClick={sendAppointmentRequest} className="bg-amber-500 text-white rounded-lg px-3 py-1 hover:bg-amber-600"><Send size={12}/></button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <label className="p-3 bg-white text-slate-500 rounded-full hover:bg-emerald-500 hover:text-white transition-all shadow-sm cursor-pointer shrink-0" title="Resim Gönder">
                       <ImageIcon size={20}/>
                       <input type="file" accept="image/*" className="hidden" onChange={handleChatImageUpload} />
                    </label>
                    <input 
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Mesaj yazın..." 
                      className="flex-1 p-4 rounded-full border border-slate-300 outline-none focus:border-emerald-500 transition-all font-medium text-slate-700 bg-slate-50" 
                    />
                    <button onClick={handleSendMessage} className="p-4 bg-emerald-500 text-white rounded-full hover:bg-emerald-600 transition-all shadow-lg active:scale-95 shrink-0">
                       <Send size={20} />
                    </button>
                 </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

const LeafIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>
);