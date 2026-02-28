import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSalon } from '../store/SalonContext';
import { analyzeSkinDetailedJSON, getAICustomerSuggestions, getPersonalizedRecommendations } from '../geminiService';
import { SignedDocument, Customer, Drink, MembershipTier, DietDay } from '../types';
import { 
  ShieldCheck, ArrowRight, Sparkles, PenTool, Fingerprint, 
  Loader2, Scan, Heart, ChevronRight, X, CheckCircle, 
  Coffee, BookOpen, Award, LogOut, FileText, BadgeCheck, Clock, 
  AlertCircle, Apple, Utensils, Scale, Eye, FileDown, Printer, 
  Phone, UserX, Soup, Truck, Check, Camera, RefreshCw, Droplets, Zap, Shield, Info, AlertTriangle,
  Star, Flame, Wind, Moon, ChefHat, BellRing, Package, List, Plus, Minus, Send, ShoppingBag, Database, Trophy, Stamp, Diamond, Crown, UserCheck, Lightbulb, UserPlus, Lock, Unlock, Image as ImageIcon, MessageCircle, Filter, Video, MicOff, VideoOff, PhoneOff, Receipt, Activity, CalendarDays, CreditCard, Ticket
} from 'lucide-react';

interface SkinRegion {
  id: string;
  name: string;
  score: number;
  status: string;
  description: string;
  suggestion: string;
  x: number;
  y: number;
  metrics: {
    moisture: number;
    oiliness: number;
    elasticity: number;
  };
}

interface DetailedAnalysis {
  summary: string;
  overallScore: number;
  regions: SkinRegion[];
}

interface AIRecommendation {
  stylistNote: string;
  recommendedServices: { serviceId: string; reason: string }[];
  recommendedStaff: { staffId: string; reason: string };
}

const TIER_LEVELS = {
  [MembershipTier.BRONZE]: 1,
  [MembershipTier.SILVER]: 2,
  [MembershipTier.GOLD]: 3,
  [MembershipTier.PLATINUM]: 4,
  [MembershipTier.BLACK_VIP]: 5
};

export const CustomerPortal: React.FC = () => {
  const { customers, updateCustomer, addCustomer, kvkkText, addNotification, drinks, servicePackages, services, staff, importData, drinkOrders, addDrinkOrder, loyaltyRules, sendDietMessage, activeCall, answerCall, endCall } = useSalon();
  
  const [loggedIn, setLoggedIn] = useState(false);
  const [activeCustomer, setActiveCustomer] = useState<Customer | null>(null);
  
  // Login & Register States
  const [phoneInput, setPhoneInput] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [registerName, setRegisterName] = useState('');
  const [registerSuccess, setRegisterSuccess] = useState(false);
  
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const [showConsentModal, setShowConsentModal] = useState<{show: boolean, type: 'KVKK' | 'CONSENT' | 'DIET_CONTRACT', title: string}>({show: false, type: 'KVKK', title: 'KVKK & Genel Onam'});
  const [scanning, setScanning] = useState(false);
  const [detailedAnalysis, setDetailedAnalysis] = useState<DetailedAnalysis | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<SkinRegion | null>(null);
  const [activeLayer, setActiveLayer] = useState(0); 
  const [currentTab, setCurrentTab] = useState<'WELCOME' | 'SCAN' | 'DRINKS' | 'PACKAGES' | 'MENU' | 'DIET' | 'DOCS' | 'STAMPS' | 'SUGGESTIONS' | 'WALLET'>('WELCOME');
  const [apiError, setApiError] = useState<string | null>(null);
  
  // Service Menu Filtering State
  const [activeMenuCategory, setActiveMenuCategory] = useState<string>('ALL');

  // DIET SECTION STATES
  const [dietUnlocked, setDietUnlocked] = useState(false);
  const [dietPasswordInput, setDietPasswordInput] = useState('');
  const [dietChatInput, setDietChatInput] = useState('');
  const dietChatScrollRef = useRef<HTMLDivElement>(null);
  
  // AI Recommendations State
  const [aiRecommendations, setAiRecommendations] = useState<AIRecommendation | null>(null);
  const [wellnessPlan, setWellnessPlan] = useState<any>(null);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);

  // Sync activeCustomer with context updates to reflect messages immediately
  useEffect(() => {
    if (activeCustomer) {
      const freshData = customers.find(c => c.id === activeCustomer.id);
      if (freshData) {
        setActiveCustomer(freshData);
      }
    }
  }, [customers]);

  // Real-time Order Tracking
  const activeOrder = useMemo(() => {
    if (!activeCustomer) return null;
    return drinkOrders.find(o => o.customerId === activeCustomer.id && o.status !== 'DELIVERED');
  }, [activeCustomer, drinkOrders]);

  const [showOrderToast, setShowOrderToast] = useState(false);
  
  useEffect(() => {
      if (activeOrder) {
          setShowOrderToast(true);
      } else {
          if (!activeOrder) setShowOrderToast(false);
      }
  }, [activeOrder]);

  // Scroll chat to bottom
  useEffect(() => {
    if (currentTab === 'DIET' && dietUnlocked && dietChatScrollRef.current) {
        dietChatScrollRef.current.scrollTop = dietChatScrollRef.current.scrollHeight;
    }
  }, [currentTab, dietUnlocked, activeCustomer?.dietChatHistory]);

  const [requestList, setRequestList] = useState<{id: string, name: string, type: 'SERVICE' | 'PACKAGE', price: number}[]>([]);

  // Camera States
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const signatureCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // --- ULTRA-PREMIUM THEME ENGINE ---
  const tierTheme = useMemo(() => {
    const tier = activeCustomer?.tier || MembershipTier.BRONZE;
    
    switch (tier) {
      case MembershipTier.BLACK_VIP:
        return {
          bg: 'bg-[#050505]',
          text: 'text-white',
          subText: 'text-slate-400',
          accent: 'text-[#E0AA3E]',
          border: 'border-white/10',
          cardBg: 'bg-[#111] bg-[url("https://www.transparenttextures.com/patterns/carbon-fibre.png")]',
          gradient: 'from-[#111] to-[#000]',
          button: 'bg-gradient-to-r from-[#E0AA3E] to-[#B88A44] text-black shadow-[0_0_20px_rgba(224,170,62,0.3)]',
          tabActive: 'bg-white/10 text-[#E0AA3E] border border-[#E0AA3E]/30',
          tabInactive: 'text-slate-500 hover:text-white',
          headerBg: 'bg-[#050505]/80',
          shadow: 'shadow-[0_20px_50px_rgba(0,0,0,0.5)]',
          icon: Crown,
          texture: 'opacity-20 bg-[url("https://www.transparenttextures.com/patterns/cubes.png")]'
        };
      case MembershipTier.PLATINUM:
        return {
          bg: 'bg-[#eef2f6]',
          text: 'text-slate-800',
          subText: 'text-slate-500',
          accent: 'text-indigo-600',
          border: 'border-white/50',
          cardBg: 'bg-white/80 backdrop-blur-xl',
          gradient: 'from-white to-indigo-50',
          button: 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/30',
          tabActive: 'bg-indigo-600 text-white',
          tabInactive: 'text-slate-400 hover:text-indigo-600',
          headerBg: 'bg-[#eef2f6]/80',
          shadow: 'shadow-2xl shadow-indigo-200/50',
          icon: Diamond,
          texture: 'opacity-50 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-200 via-transparent to-transparent'
        };
      case MembershipTier.GOLD:
        return {
          bg: 'bg-[#FFFDFA]',
          text: 'text-amber-950',
          subText: 'text-amber-700/60',
          accent: 'text-amber-600',
          border: 'border-amber-100',
          cardBg: 'bg-[#FFFBF2]',
          gradient: 'from-[#FFFBF2] to-[#FFF5E0]',
          button: 'bg-gradient-to-r from-amber-400 to-amber-600 text-white shadow-xl shadow-amber-500/30',
          tabActive: 'bg-amber-500 text-white',
          tabInactive: 'text-amber-800/40 hover:text-amber-600',
          headerBg: 'bg-[#FFFDFA]/80',
          shadow: 'shadow-2xl shadow-amber-200/50',
          icon: Star,
          texture: 'opacity-10 bg-[url("https://www.transparenttextures.com/patterns/gold-scale.png")]'
        };
      default: 
        return {
          bg: 'bg-[#f8fafc]',
          text: 'text-slate-900',
          subText: 'text-slate-400',
          accent: 'text-rose-500',
          border: 'border-slate-200',
          cardBg: 'bg-white',
          gradient: 'from-white to-slate-50',
          button: 'bg-slate-900 text-white shadow-xl',
          tabActive: 'bg-slate-900 text-white',
          tabInactive: 'text-slate-400 hover:text-slate-900',
          headerBg: 'bg-[#f8fafc]/80',
          shadow: 'shadow-xl shadow-slate-200/50',
          icon: Award,
          texture: ''
        };
    }
  }, [activeCustomer?.tier]);

  const handleFetchRecommendations = async () => {
    if (!activeCustomer) return;
    setLoadingRecommendations(true);
    setApiError(null);
    try {
      const [recs, plan] = await Promise.all([
          getAICustomerSuggestions(activeCustomer, services, staff),
          getPersonalizedRecommendations(activeCustomer, services)
      ]);
      setAiRecommendations(recs);
      setWellnessPlan(plan);
      
      // Save to customer record
      const updatedCustomer = { ...activeCustomer, wellnessPlan: plan };
      updateCustomer(updatedCustomer);
      setActiveCustomer(updatedCustomer);
      
    } catch (error) {
      console.error(error);
      setApiError("Yapay zeka asistanına şu an ulaşılamıyor.");
    }
    setLoadingRecommendations(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsAuthenticating(true);
    const cleanPhone = phoneInput.replace(/\D/g, '');
    const found = customers.find(c => c.phone.replace(/\D/g, '') === cleanPhone);
    await new Promise(r => setTimeout(r, 1200));
    if (found) {
      setActiveCustomer(found);
      setLoggedIn(true);
      addNotification({ type: 'SYSTEM', title: 'Tablet Girişi', message: `${found.fullName} giriş yaptı.` });
    } else {
      setLoginError("ERİŞİM REDDEDİLDİ: Kayıt bulunamadı. Lütfen kayıt olun.");
    }
    setIsAuthenticating(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!registerName || !phoneInput) return;
      setIsAuthenticating(true);

      await addNotification({
          type: 'REGISTRATION_REQUEST',
          title: 'Yeni Üyelik Talebi',
          message: `${registerName} (${phoneInput}) sisteme kayıt olmak istiyor.`,
          data: { name: registerName, phone: phoneInput } 
      });
      
      await new Promise(r => setTimeout(r, 1500));
      setRegisterSuccess(true);
      setIsAuthenticating(false);
  };

  const recommendedDrink = useMemo(() => {
    if (!activeCustomer || !drinks.length) return null;
    const pref = activeCustomer.preferences.drink?.toLowerCase();
    
    // AI LOGIC FOR DRINKS
    if (pref) {
      const matched = drinks.find(d => d.name.toLowerCase().includes(pref) || pref.includes(d.name.toLowerCase()));
      if (matched) return { ...matched, reason: 'FAVORİ TERCİHİNİZ', aiTag: 'HISTORY MATCH' };
    }
    if (activeCustomer.dna.luxuryTrendScore > 70) {
       const luxuriousOption = drinks.find(d => d.name.includes('Detoks') || d.name.includes('Gold') || d.id === 'dr3');
       if (luxuriousOption) return { ...luxuriousOption, reason: 'LÜKS PROFİLİNİZE UYGUN', aiTag: 'AI LIFESTYLE' };
    }
    return { ...drinks[0], reason: 'GÜNÜN POPÜLER SEÇİMİ', aiTag: 'TRENDING' };
  }, [activeCustomer, drinks]);

  const loyaltyProgress = useMemo(() => {
      if (!activeCustomer) return null;
      const currentPoints = activeCustomer.dna.loyaltyPuan || 0;
      const sortedRules = [...loyaltyRules].sort((a, b) => a.minPoints - b.minPoints);
      const nextReward = sortedRules.find(r => r.minPoints > currentPoints);
      if (nextReward) {
          return { nextRewardName: nextReward.reward, target: nextReward.minPoints, current: currentPoints, percent: Math.min(100, (currentPoints / nextReward.minPoints) * 100), remaining: nextReward.minPoints - currentPoints };
      } else {
          return { nextRewardName: "Maksimum Seviye - VIP Avantajları", target: currentPoints, current: currentPoints, percent: 100, remaining: 0 };
      }
  }, [activeCustomer, loyaltyRules]);

  const availablePackages = useMemo(() => {
      if (!activeCustomer) return [];
      const userLevel = TIER_LEVELS[activeCustomer.tier];
      return servicePackages.filter(pkg => { const pkgLevel = TIER_LEVELS[pkg.minTier]; return pkgLevel <= userLevel; });
  }, [activeCustomer, servicePackages]);

  const toggleRequestItem = (item: {id: string, name: string, type: 'SERVICE' | 'PACKAGE', price: number}) => {
      setRequestList(prev => { const exists = prev.find(i => i.id === item.id && i.type === item.type); if (exists) { return prev.filter(i => !(i.id === item.id && i.type === item.type)); } else { return [...prev, item]; } });
  };

  const submitRequests = () => {
      if (requestList.length === 0) return;
      const itemList = requestList.map(i => `${i.type === 'PACKAGE' ? '[PAKET]' : '[HİZMET]'} ${i.name}`).join(', ');
      addNotification({ type: 'ORDER', title: 'Tablet İstek Listesi', message: `${activeCustomer?.fullName} şu talepleri iletti: ${itemList}` });
      setRequestList([]);
      alert("Talepleriniz uzmanlarımıza iletildi. Birazdan yanınızdayız.");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setIsImporting(true); const result = await importData(file); if (result.success) { alert("Veriler Başarıyla Yüklendi! Sistem güncellendi."); window.location.reload(); } else { alert("Hata: " + result.message); } setIsImporting(false); }
  };

  const startCamera = async () => { setCameraActive(true); setCapturedImage(null); setDetailedAnalysis(null); setApiError(null); try { const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } }); if (videoRef.current) { videoRef.current.srcObject = stream; } } catch (err) { console.error("Kamera başlatılamadı:", err); setCameraActive(false); } };
  const stopCamera = () => { if (videoRef.current && videoRef.current.srcObject) { const stream = videoRef.current.srcObject as MediaStream; stream.getTracks().forEach(track => track.stop()); } setCameraActive(false); };
  const captureFrame = () => { if (videoRef.current && canvasRef.current) { const video = videoRef.current; const canvas = canvasRef.current; canvas.width = video.videoWidth; canvas.height = video.videoHeight; const ctx = canvas.getContext('2d'); ctx?.drawImage(video, 0, 0, canvas.width, canvas.height); const base64 = canvas.toDataURL('image/jpeg'); setCapturedImage(base64); stopCamera(); } };
  
  const handleDetailedScan = async () => { 
    if (!capturedImage) return; 
    setScanning(true); 
    setDetailedAnalysis(null); 
    setSelectedRegion(null); 
    setApiError(null); 
    
    try { 
        const base64Data = capturedImage.split(',')[1]; 
        
        // UX OPTIMIZATION: Run Animation and API Call concurrently
        const animationTask = async () => {
            for(let i=0; i<6; i++) { 
                setActiveLayer(i); 
                await new Promise(r => setTimeout(r, 400)); 
            }
        };

        const analysisTask = analyzeSkinDetailedJSON(base64Data, 'image/jpeg');

        // Wait for both to finish (provides consistent experience)
        const [_, result] = await Promise.all([animationTask(), analysisTask]);
        
        setDetailedAnalysis(result); 
    } catch (e: any) { 
        console.error(e); 
        if (e?.message?.includes('429')) { 
            setApiError("Sistem Yoğunluğu: Yapay zeka kotası doldu. Lütfen 60 saniye bekleyip tekrar deneyin."); 
        } else { 
            setApiError("Bir hata oluştu. Lütfen bağlantınızı kontrol edip tekrar deneyin."); 
        } 
    } 
    setScanning(false); 
  };

  const handleOrderDrink = (name: string) => { if (!activeCustomer || activeOrder) return; addDrinkOrder({ customerId: activeCustomer.id, customerName: activeCustomer.fullName, drinkName: name }); };

  const getCoordinates = (e: any) => { const canvas = signatureCanvasRef.current; if (!canvas) return { x: 0, y: 0 }; const rect = canvas.getBoundingClientRect(); const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left; const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top; return { x: x * (canvas.width / rect.width), y: y * (canvas.height / rect.height) }; };
  const startDrawing = (e: any) => { setIsDrawing(true); const canvas = signatureCanvasRef.current; if (!canvas) return; const ctx = canvas.getContext('2d'); if (!ctx) return; const { x, y } = getCoordinates(e); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.strokeStyle = '#0f172a'; if (e.cancelable) e.preventDefault(); };
  const draw = (e: any) => { if (!isDrawing || !signatureCanvasRef.current) return; const ctx = signatureCanvasRef.current.getContext('2d'); if (!ctx) return; const { x, y } = getCoordinates(e); ctx.lineTo(x, y); ctx.stroke(); if (e.cancelable) e.preventDefault(); };
  
  const saveSignature = () => {
    if (!activeCustomer || !signatureCanvasRef.current) return;
    const signatureBase64 = signatureCanvasRef.current.toDataURL('image/png');
    const newDoc: any = {
      id: Math.random().toString(36).substr(2, 9),
      title: showConsentModal.title,
      type: showConsentModal.type,
      content: kvkkText, 
      signature: signatureBase64,
      timestamp: new Date().toLocaleString('tr-TR'),
    };
    
    const updatedDocs = [...(activeCustomer.signedDocuments || []), newDoc];
    const updatePayload: Partial<Customer> = { signedDocuments: updatedDocs };
    
    if (showConsentModal.type === 'DIET_CONTRACT') {
        updatePayload.dietContractSigned = true;
        setDietUnlocked(true); 
    } else if (showConsentModal.type === 'KVKK') {
        updatePayload.consentSigned = true;
    }

    const updatedCustomer = { ...activeCustomer, ...updatePayload };
    updateCustomer(updatedCustomer);
    setActiveCustomer(updatedCustomer);
    setShowConsentModal({show: false, type: 'KVKK', title: ''});
  };

  const handleDietUnlock = async () => {
      if (!activeCustomer) return;
      if (dietPasswordInput === (activeCustomer.dietPassword || '123456')) {
          if (!activeCustomer.dietContractSigned) {
              setShowConsentModal({ show: true, type: 'DIET_CONTRACT', title: 'Diyet & Sağlıklı Yaşam Sözleşmesi' });
          } else {
              setDietUnlocked(true);
          }
      } else {
          alert("Hatalı Şifre! Lütfen diyetisyeninizden aldığınız şifreyi giriniz.");
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
          e.target.value = '';
      }
  };

  const filteredServices = useMemo(() => {
      return services.filter(s => activeMenuCategory === 'ALL' || s.category === activeMenuCategory);
  }, [services, activeMenuCategory]);

  const menuCategories = [
      { id: 'ALL', label: 'Tümü' },
      { id: 'SKIN_CARE', label: 'Cilt Bakımı' },
      { id: 'NAIL', label: 'Tırnak & El Ayak' },
      { id: 'DIET', label: 'Diyet & Zayıflama' },
      { id: 'GENERAL', label: 'Genel Hizmetler' }
  ];

  if (!loggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#0a0a0a] overflow-hidden relative">
        <div className="absolute inset-0 opacity-20 pointer-events-none bg-gradient-to-br from-rose-500/30 to-indigo-500/30 blur-[150px]"></div>
        <div className="max-w-xl w-full bg-white/5 backdrop-blur-3xl rounded-[5rem] p-16 text-center border border-white/10 shadow-3xl relative z-10 animate-in zoom-in-95 duration-700">
           <div className="w-24 h-24 bg-rose-500 rounded-[2.5rem] flex items-center justify-center text-white mx-auto mb-10 shadow-2xl rotate-6 animate-pulse">
              <ShieldCheck size={56} />
           </div>
           <h2 className="text-5xl font-black text-white mb-4 tracking-tighter uppercase italic">L'YSF ELITE</h2>
           <p className="text-slate-400 font-bold mb-12 uppercase tracking-[0.4em] text-[10px]">Güvenli Erişim Terminali</p>
           
           {!isRegistering ? (
             <form onSubmit={handleLogin} className="space-y-6">
                <div className="relative group">
                  <Phone className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-rose-500 transition-colors" size={24} />
                  <input type="tel" placeholder="Telefon Numaranız" value={phoneInput} onChange={(e) => setPhoneInput(e.target.value)} className="w-full pl-20 pr-8 py-10 bg-white/5 border-2 border-white/10 rounded-[3rem] text-white text-3xl font-black outline-none focus:border-rose-500 focus:bg-white/10 transition-all placeholder:text-slate-700" />
                </div>
                {loginError && <div className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-3xl text-rose-500 font-black text-sm italic animate-shake">{loginError}</div>}
                <button type="submit" disabled={isAuthenticating || !phoneInput} className="w-full py-10 bg-white text-black font-black rounded-[3rem] text-3xl flex items-center justify-center gap-4 shadow-3xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50">
                  {isAuthenticating ? <Loader2 className="animate-spin" size={32} /> : <>Sistemi Başlat <ArrowRight size={40} /></>}
                </button>
                <button type="button" onClick={() => { setIsRegistering(true); setLoginError(null); setRegisterSuccess(false); }} className="text-slate-400 text-sm font-bold uppercase tracking-widest hover:text-white transition-colors flex items-center justify-center gap-2">
                   <UserPlus size={16}/> İlk Kez Geliyorum (Kayıt Ol)
                </button>
             </form>
           ) : (
             <>
                {registerSuccess ? (
                    <div className="space-y-8 animate-in zoom-in-95">
                        <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto text-white shadow-xl animate-bounce">
                            <Check size={40} />
                        </div>
                        <h3 className="text-3xl font-black text-white italic">Talebiniz İletildi!</h3>
                        <p className="text-slate-300 font-medium leading-relaxed">
                            Kayıt isteğiniz salon yönetimine başarıyla gönderilmiştir. 
                            <br/><br/>
                            Lütfen danışmadaki personelimizden onay bekleyiniz. Onaylandıktan sonra telefon numaranız ile giriş yapabilirsiniz.
                        </p>
                        <div className="bg-white/5 border border-white/10 p-6 rounded-3xl">
                             <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Başvuru Bilgileri</p>
                             <p className="text-white font-bold text-lg">{registerName}</p>
                             <p className="text-emerald-400 font-mono">{phoneInput}</p>
                        </div>
                        <button onClick={() => { setIsRegistering(false); setRegisterSuccess(false); setPhoneInput(''); setRegisterName(''); }} className="w-full py-6 bg-white/10 text-white font-black rounded-[2rem] hover:bg-white/20 transition-all uppercase text-sm tracking-widest">
                            Ana Ekrana Dön
                        </button>
                    </div>
                ) : (
                     <form onSubmit={handleRegister} className="space-y-6 animate-in slide-in-from-right-10">
                        <div className="relative group">
                          <UserPlus className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-500 transition-colors" size={24} />
                          <input type="text" placeholder="Adınız Soyadınız" value={registerName} onChange={(e) => setRegisterName(e.target.value)} className="w-full pl-20 pr-8 py-8 bg-white/5 border-2 border-white/10 rounded-[3rem] text-white text-2xl font-black outline-none focus:border-emerald-500 focus:bg-white/10 transition-all placeholder:text-slate-700" />
                        </div>
                        <div className="relative group">
                          <Phone className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-500 transition-colors" size={24} />
                          <input type="tel" placeholder="Telefon Numaranız" value={phoneInput} onChange={(e) => setPhoneInput(e.target.value)} className="w-full pl-20 pr-8 py-8 bg-white/5 border-2 border-white/10 rounded-[3rem] text-white text-2xl font-black outline-none focus:border-emerald-500 focus:bg-white/10 transition-all placeholder:text-slate-700" />
                        </div>
                        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-3xl text-emerald-400 text-xs font-bold text-center">
                            Güvenlik nedeniyle kayıtlar yönetici onayı gerektirir.
                        </div>
                        <button type="submit" disabled={isAuthenticating || !phoneInput || !registerName} className="w-full py-10 bg-emerald-500 text-white font-black rounded-[3rem] text-2xl flex items-center justify-center gap-4 shadow-3xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50">
                          {isAuthenticating ? <Loader2 className="animate-spin" size={32} /> : <>Kaydı Gönder <CheckCircle size={32} /></>}
                        </button>
                        <button type="button" onClick={() => setIsRegistering(false)} className="text-slate-400 text-sm font-bold uppercase tracking-widest hover:text-white transition-colors">
                           Giriş Ekranına Dön
                        </button>
                     </form>
                )}
             </>
           )}

           <div className="mt-12 pt-8 border-t border-white/10">
              <button onClick={() => fileInputRef.current?.click()} disabled={isImporting} className="w-full py-4 bg-white/5 text-slate-400 rounded-[2rem] font-bold text-xs uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all flex items-center justify-center gap-3">
                {isImporting ? <Loader2 className="animate-spin" size={16}/> : <Database size={16} />}
                {isImporting ? 'Veriler Yükleniyor...' : 'Veri Yükle / Eşitle'}
              </button>
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".json" />
              <p className="text-[9px] text-slate-500 mt-3 font-medium uppercase tracking-widest">
                PC'den alınan yedek dosyasını seçerek tableti eşitleyin.
              </p>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${tierTheme.bg} transition-colors duration-1000 flex flex-col font-['Plus_Jakarta_Sans'] select-none animate-in fade-in overflow-hidden relative`}>
      <div className={`absolute inset-0 pointer-events-none z-0 ${tierTheme.texture}`}></div>

      {/* --- INCOMING CALL OVERLAY --- */}
      {activeCall && activeCustomer && activeCall.customerId === activeCustomer.id && (
          <div className="fixed inset-0 z-[300] bg-slate-900/95 flex flex-col items-center justify-center text-white animate-in zoom-in-95 duration-500">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
              
              <div className="relative z-10 flex flex-col items-center gap-8">
                  <div className="w-40 h-40 rounded-full bg-slate-800 border-8 border-slate-700 flex items-center justify-center shadow-3xl overflow-hidden relative">
                      <span className="text-5xl font-black">{activeCustomer.fullName.charAt(0)}</span>
                      {activeCall.status === 'RINGING' && <div className="absolute inset-0 border-8 border-emerald-500 rounded-full animate-ping"></div>}
                  </div>
                  
                  <div className="text-center space-y-2">
                      <h2 className="text-5xl font-black tracking-tighter">{activeCall.hostName} Arıyor...</h2>
                      <p className="text-emerald-400 font-bold uppercase tracking-widest text-xl animate-pulse">
                          {activeCall.type === 'VIDEO' ? 'Görüntülü Arama' : 'Sesli Arama'}
                      </p>
                  </div>

                  <div className="flex items-center gap-10 mt-10">
                      {activeCall.status === 'RINGING' && (
                          <button onClick={answerCall} className="p-8 rounded-full bg-emerald-500 hover:bg-emerald-600 transition-all shadow-2xl hover:scale-110 active:scale-95 animate-bounce">
                              <Video size={48} fill="white" />
                          </button>
                      )}
                      
                      <button onClick={endCall} className="p-8 rounded-full bg-rose-500 hover:bg-rose-600 transition-all shadow-2xl hover:scale-110 active:scale-95">
                          <PhoneOff size={48} fill="white" />
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* ... (Active Order Modal) ... */}
      {activeOrder && (
        <div className={`fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-xl transition-all duration-700 ${showOrderToast ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <div className="bg-white w-full max-w-3xl rounded-[5rem] p-16 text-center shadow-3xl relative overflow-hidden animate-in zoom-in-95 duration-500 border border-white/20">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-rose-500 via-indigo-500 to-emerald-500"></div>
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl pointer-events-none"></div>

            <button onClick={() => setShowOrderToast(false)} className="absolute top-10 right-10 p-4 hover:bg-slate-100 rounded-full transition-all text-slate-400"><X /></button>
            
            <div className="mb-12 relative">
               <div className="w-48 h-48 mx-auto bg-slate-50 rounded-full flex items-center justify-center text-slate-900 shadow-xl relative z-10 border-4 border-white">
                 {activeOrder.status === 'RECEIVED' && <BellRing className="animate-swing text-amber-500" size={64} />}
                 {activeOrder.status === 'PREPARING' && <div className="relative"><ChefHat className="text-rose-500 animate-bounce" size={64} /><Loader2 className="absolute -bottom-4 -right-4 animate-spin text-slate-400" size={32}/></div>}
                 {activeOrder.status === 'ON_THE_WAY' && <Truck className="animate-bounce text-indigo-500" size={64} />}
                 {activeOrder.status === 'DELIVERED' && <CheckCircle className="text-emerald-500 animate-in zoom-in duration-500" size={80} />}
               </div>
               
               <svg className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rotate-[-90deg] pointer-events-none">
                  <circle cx="128" cy="128" r="110" fill="none" stroke="#f1f5f9" strokeWidth="6" />
                  <circle 
                    cx="128" cy="128" r="110" fill="none" 
                    stroke={activeOrder.status === 'RECEIVED' ? '#f59e0b' : activeOrder.status === 'PREPARING' ? '#f43f5e' : activeOrder.status === 'ON_THE_WAY' ? '#6366f1' : '#10b981'} 
                    strokeWidth="6" 
                    strokeDasharray="691" 
                    strokeDashoffset={691 - (691 * (activeOrder.status === 'RECEIVED' ? 0.25 : activeOrder.status === 'PREPARING' ? 0.5 : activeOrder.status === 'ON_THE_WAY' ? 0.75 : 1))} 
                    className="transition-all duration-1000 ease-in-out" strokeLinecap="round" 
                  />
               </svg>
            </div>

            <h3 className="text-5xl font-black text-slate-900 mb-4 tracking-tighter italic uppercase">{activeOrder.drinkName}</h3>
            <p className="text-slate-400 font-bold text-xl mb-16 uppercase tracking-[0.2em] flex items-center justify-center gap-3">
              {activeOrder.status === 'RECEIVED' && <><span className="w-3 h-3 bg-amber-500 rounded-full animate-pulse"></span> Siparişiniz Alındı</>}
              {activeOrder.status === 'PREPARING' && <><span className="w-3 h-3 bg-rose-500 rounded-full animate-pulse"></span> Barista Hazırlıyor</>}
              {activeOrder.status === 'ON_THE_WAY' && <><span className="w-3 h-3 bg-indigo-500 rounded-full animate-pulse"></span> Servis Ediliyor</>}
              {activeOrder.status === 'DELIVERED' && <><span className="w-3 h-3 bg-emerald-500 rounded-full"></span> Afiyet Olsun</>}
            </p>

            <div className="max-w-md mx-auto relative flex justify-between items-center">
                <div className="absolute top-1/2 left-0 w-full h-2 bg-slate-100 -translate-y-1/2 -z-10 rounded-full"></div>
                <div className={`absolute top-1/2 left-0 h-2 -translate-y-1/2 -z-10 transition-all duration-1000 rounded-full ${activeOrder.status === 'DELIVERED' ? 'bg-emerald-500' : 'bg-slate-900'}`} style={{ width: activeOrder.status === 'RECEIVED' ? '15%' : activeOrder.status === 'PREPARING' ? '50%' : activeOrder.status === 'ON_THE_WAY' ? '85%' : '100%' }}></div>
                
                <StageDot label="Alındı" active={true} complete={activeOrder.status !== 'RECEIVED'} icon={BellRing} />
                <StageDot label="Hazırlık" active={['PREPARING','ON_THE_WAY','DELIVERED'].includes(activeOrder.status)} complete={['ON_THE_WAY','DELIVERED'].includes(activeOrder.status)} icon={ChefHat} />
                <StageDot label="Yolda" active={['ON_THE_WAY','DELIVERED'].includes(activeOrder.status)} complete={activeOrder.status === 'DELIVERED'} icon={Truck} />
                <StageDot label="Tamam" active={activeOrder.status === 'DELIVERED'} complete={activeOrder.status === 'DELIVERED'} icon={Check} />
            </div>
          </div>
        </div>
      )}

      {requestList.length > 0 && (
          <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[150] animate-in slide-in-from-bottom-20 zoom-in-95">
              <div className={`${tierTheme.button} text-white rounded-full p-4 pl-8 flex items-center gap-6 shadow-2xl shadow-indigo-500/30 border border-white/20`}>
                  <div className="flex items-center gap-3">
                      <ShoppingBag className="text-white" />
                      <span className="font-black text-sm uppercase tracking-widest">{requestList.length} Seçim</span>
                  </div>
                  <div className="h-8 w-px bg-white/20"></div>
                  <button onClick={submitRequests} className="flex items-center gap-3 bg-white text-slate-900 px-6 py-3 rounded-full font-black text-xs uppercase tracking-widest hover:scale-105 transition-transform">
                      Talebi İlet <Send size={16} />
                  </button>
              </div>
          </div>
      )}

      {activeOrder && !showOrderToast && (
          <div 
            onClick={() => setShowOrderToast(true)}
            className="fixed bottom-10 right-10 z-[140] animate-in slide-in-from-right-10 cursor-pointer"
          >
             <div className="bg-white/80 backdrop-blur-md border border-white/20 p-4 rounded-[2rem] shadow-2xl flex items-center gap-4 hover:scale-105 transition-transform">
                <div className="w-12 h-12 bg-rose-500 rounded-full flex items-center justify-center text-white animate-pulse">
                   <Coffee size={24} />
                </div>
                <div>
                   <p className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Sipariş Durumu</p>
                   <p className="font-black text-slate-900 italic">{activeOrder.status === 'RECEIVED' ? 'Alındı' : activeOrder.status === 'PREPARING' ? 'Hazırlanıyor' : activeOrder.status === 'ON_THE_WAY' ? 'Yolda' : 'Afiyet Olsun'}</p>
                </div>
             </div>
          </div>
      )}

      {/* HEADER */}
      <header className={`px-10 py-8 ${tierTheme.headerBg} backdrop-blur-xl border-b ${tierTheme.border} flex justify-between items-center sticky top-0 z-[60] transition-colors duration-700 relative`}>
        <div className="flex items-center gap-5">
          <div className={`w-14 h-14 ${tierTheme.button} rounded-2xl flex items-center justify-center text-white font-black text-3xl shadow-xl transition-colors`}>L</div>
          <div>
            <h1 className={`text-2xl font-black ${tierTheme.text} tracking-tighter uppercase italic`}>L'YSF Life Center</h1>
            <p className={`text-[10px] font-black uppercase ${tierTheme.accent} tracking-[0.4em]`}>{activeCustomer?.tier || 'Elite'} Member</p>
          </div>
        </div>
        <div className="flex bg-white/10 backdrop-blur-md p-2 rounded-[2.5rem] gap-1 overflow-x-auto no-scrollbar max-w-3xl border border-white/10">
            <NavTab active={currentTab === 'WELCOME'} onClick={() => setCurrentTab('WELCOME')} icon={Heart} label="Karşılama" theme={tierTheme} />
            <NavTab active={currentTab === 'SUGGESTIONS'} onClick={() => setCurrentTab('SUGGESTIONS')} icon={Sparkles} label="Önerilenler" theme={tierTheme} />
            <NavTab active={currentTab === 'STAMPS'} onClick={() => setCurrentTab('STAMPS')} icon={Stamp} label="Sadakat Kartı" theme={tierTheme} />
            <NavTab active={currentTab === 'SCAN'} onClick={() => setCurrentTab('SCAN')} icon={Scan} label="Hücre Analiz" theme={tierTheme} />
            <NavTab active={currentTab === 'WALLET'} onClick={() => setCurrentTab('WALLET')} icon={CreditCard} label="Cüzdanım" theme={tierTheme} />
            <NavTab active={currentTab === 'PACKAGES'} onClick={() => setCurrentTab('PACKAGES')} icon={Package} label="VIP Paketler" theme={tierTheme} />
            <NavTab active={currentTab === 'MENU'} onClick={() => setCurrentTab('MENU')} icon={List} label="Hizmet Menüsü" theme={tierTheme} />
            <NavTab active={currentTab === 'DRINKS'} onClick={() => setCurrentTab('DRINKS')} icon={Coffee} label="Wellness Bar" theme={tierTheme} />
            <NavTab active={currentTab === 'DIET'} onClick={() => setCurrentTab('DIET')} icon={Apple} label="Nutri-Check" theme={tierTheme} />
            <NavTab active={currentTab === 'DOCS'} onClick={() => setCurrentTab('DOCS')} icon={FileText} label="Arşivim" theme={tierTheme} />
        </div>
        <button onClick={() => setLoggedIn(false)} className={`p-5 ${tierTheme.cardBg} ${tierTheme.accent} rounded-2xl hover:bg-rose-500 hover:text-white transition-all shadow-sm`}><LogOut size={24} /></button>
      </header>

      <main className="flex-1 p-10 max-w-[1500px] mx-auto w-full pb-32 overflow-y-auto no-scrollbar relative z-10">
        
        {/* WELCOME TAB */}
        {currentTab === 'WELCOME' && activeCustomer && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-in fade-in duration-1000">
             <div className="lg:col-span-8 space-y-10">
                <div className={`bg-gradient-to-br ${tierTheme.gradient} ${tierTheme.cardBg} border ${tierTheme.border} p-20 rounded-[5rem] relative overflow-hidden group ${tierTheme.shadow}`}>
                   <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:rotate-12 transition-transform duration-1000"><tierTheme.icon size={250} className={tierTheme.text}/></div>
                   <h2 className={`text-7xl font-black tracking-tighter mb-10 italic ${tierTheme.text}`}>Hoş Geldiniz, {activeCustomer.fullName}</h2>
                   <div className="flex flex-wrap gap-10 mb-8">
                      <div className={`bg-white/5 border border-white/10 p-10 rounded-[2.5rem] backdrop-blur-md`}>
                         <p className={`text-[10px] font-black uppercase mb-2 tracking-widest ${tierTheme.subText}`}>LOYALTY SCORE</p>
                         <p className={`text-6xl font-black ${tierTheme.accent}`}>{activeCustomer.dna.loyaltyPuan}</p>
                      </div>
                      <div className={`${tierTheme.button} p-10 rounded-[2.5rem] flex items-center gap-6`}>
                         <tierTheme.icon size={64} className="text-white" />
                         <div>
                            <p className="text-[10px] font-black uppercase text-white/60 tracking-widest">Membership</p>
                            <p className="text-4xl font-black uppercase tracking-tighter italic text-white">{activeCustomer.tier}</p>
                         </div>
                      </div>
                   </div>

                   {/* LOYALTY PROGRESS BAR */}
                   {loyaltyProgress && (
                      <div className={`bg-white/5 border border-white/10 p-10 rounded-[3rem] backdrop-blur-md relative overflow-hidden`}>
                          <div className="flex justify-between items-end mb-6 relative z-10">
                              <div>
                                  <p className={`text-[10px] font-black uppercase tracking-widest mb-1 flex items-center gap-2 ${tierTheme.subText}`}>
                                      <Trophy size={12} className={tierTheme.accent} /> 
                                      {loyaltyProgress.remaining > 0 ? 'SIRADAKİ HEDEF' : 'ZİRVE'}
                                  </p>
                                  <p className={`text-2xl font-black italic tracking-tight ${tierTheme.text}`}>
                                      {loyaltyProgress.nextRewardName}
                                  </p>
                              </div>
                              <p className={`text-4xl font-black ${tierTheme.accent} italic`}>%{loyaltyProgress.percent.toFixed(0)}</p>
                          </div>
                          
                          <div className="h-6 w-full bg-black/10 rounded-full overflow-hidden border border-white/10 relative z-10">
                              <div 
                                className={`h-full ${tierTheme.button} transition-all duration-1000 relative`}
                                style={{ width: `${loyaltyProgress.percent}%` }}
                              >
                                  <div className="absolute inset-0 bg-white/20 animate-pulse-subtle"></div>
                              </div>
                          </div>
                          
                          {loyaltyProgress.remaining > 0 && (
                              <p className={`text-right text-[10px] font-bold ${tierTheme.subText} mt-3 uppercase tracking-widest relative z-10`}>
                                  Hedefe {loyaltyProgress.remaining.toLocaleString()} Puan Kaldı
                              </p>
                          )}
                      </div>
                   )}
                </div>
             </div>
             <div className="lg:col-span-4">
                <div className={`p-16 rounded-[5rem] border shadow-2xl text-center transition-all duration-700 ${activeCustomer.consentSigned ? `${tierTheme.cardBg} ${tierTheme.border}` : 'bg-rose-50 border-rose-200 ring-8 ring-rose-500/5'}`}>
                    <div className={`w-28 h-28 rounded-[3rem] flex items-center justify-center mx-auto mb-12 shadow-inner transition-all duration-500 ${activeCustomer.consentSigned ? 'bg-emerald-50 text-emerald-500' : 'bg-white text-rose-500'}`}>
                        {activeCustomer.consentSigned ? <BadgeCheck size={64} /> : <AlertCircle size={64} />}
                    </div>
                    <h4 className={`text-4xl font-black mb-6 italic uppercase tracking-tighter ${activeCustomer.consentSigned ? tierTheme.text : 'text-rose-900'}`}>Hukuki Durum</h4>
                    <p className={`${activeCustomer.consentSigned ? tierTheme.subText : 'text-rose-700'} font-bold text-lg mb-16 leading-relaxed italic`}>{activeCustomer.consentSigned ? 'Onaylarınız güncel.' : 'Hizmetlere erişim için KVKK metnini onaylayın.'}</p>
                    {!activeCustomer.consentSigned && (
                        <button onClick={() => setShowConsentModal({show: true, type: 'KVKK', title: 'KVKK Aydınlatma Metni'})} className={`w-full py-10 ${tierTheme.button} text-white rounded-[2.5rem] font-black uppercase text-sm tracking-[0.4em] shadow-3xl transition-all flex items-center justify-center gap-4 active:scale-95`}><Scale size={24} /> ŞİMDİ İMZALA</button>
                    )}
                </div>
             </div>
          </div>
        )}

        {/* WALLET TAB */}
        {currentTab === 'WALLET' && activeCustomer && (
            <div className="animate-in slide-in-from-bottom-10 space-y-10">
                <div>
                    <h2 className={`text-5xl font-black italic mb-4 ${tierTheme.text}`}>Cüzdanım</h2>
                    <p className={`text-lg font-medium ${tierTheme.subText}`}>Satın aldığınız paketler ve kalan haklarınız.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {!activeCustomer.packages || activeCustomer.packages.length === 0 ? (
                        <div className="col-span-full py-20 text-center opacity-40">
                            <Ticket size={64} className="mx-auto mb-4"/>
                            <p className="font-black text-xl italic">Henüz aktif paketiniz bulunmuyor.</p>
                        </div>
                    ) : (
                        activeCustomer.packages.map(pkg => (
                            <div key={pkg.id} className="bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden relative group">
                                <div className={`absolute top-0 left-0 w-full h-3 bg-gradient-to-r ${pkg.remainingSessions > 0 ? 'from-emerald-400 to-emerald-600' : 'from-slate-300 to-slate-400'}`}></div>
                                
                                <div className="p-10">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="w-16 h-16 bg-slate-50 text-slate-900 rounded-2xl flex items-center justify-center shadow-sm">
                                            <Ticket size={32} />
                                        </div>
                                        {pkg.remainingSessions > 0 ? (
                                            <span className="bg-emerald-100 text-emerald-700 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-emerald-200">Aktif</span>
                                        ) : (
                                            <span className="bg-slate-100 text-slate-500 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">Tamamlandı</span>
                                        )}
                                    </div>

                                    <h3 className="text-2xl font-black text-slate-900 italic mb-2">{pkg.name}</h3>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-8">Satın Alma: {new Date(pkg.purchaseDate).toLocaleDateString('tr-TR')}</p>

                                    <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                                        <div className="flex justify-between items-end mb-2">
                                            <p className="text-[10px] font-black uppercase text-slate-400">Kullanım Durumu</p>
                                            <p className="font-black text-slate-900 text-lg">{pkg.remainingSessions} / {pkg.totalSessions}</p>
                                        </div>
                                        <div className="h-4 w-full bg-slate-200 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full transition-all duration-1000 ${pkg.remainingSessions > 0 ? 'bg-emerald-500' : 'bg-slate-400'}`} 
                                                style={{ width: `${(pkg.remainingSessions / pkg.totalSessions) * 100}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        )}

        {/* ... (Other Tabs remains same) ... */}
        {/* DRINKS TAB */}
        {currentTab === 'DRINKS' && (
            <div className="animate-in slide-in-from-bottom-10 space-y-10">
                <div className="flex justify-between items-end">
                    <div>
                        <h2 className={`text-6xl font-black italic mb-4 ${tierTheme.text}`}>Wellness Bar</h2>
                        <p className={`text-lg font-medium ${tierTheme.subText}`}>Sizin için özel hazırlanan detoks ve tazeleme içecekleri.</p>
                    </div>
                    {recommendedDrink && (
                        <div className="bg-gradient-to-r from-amber-100 to-orange-100 p-6 rounded-[2rem] flex items-center gap-6 border border-amber-200 shadow-lg relative overflow-hidden group cursor-pointer hover:scale-105 transition-transform" onClick={() => handleOrderDrink(recommendedDrink.name)}>
                            <div className="absolute -right-4 -bottom-4 opacity-10"><Coffee size={100} /></div>
                            <div className="text-4xl">{recommendedDrink.icon}</div>
                            <div>
                                <p className="text-[9px] font-black uppercase text-amber-600 tracking-widest mb-1 flex items-center gap-1"><Sparkles size={10} /> {recommendedDrink.aiTag || 'ÖNERİLEN'}</p>
                                <p className="font-black text-slate-900 text-xl italic">{recommendedDrink.name}</p>
                            </div>
                            <div className="bg-white p-3 rounded-full shadow-md"><Plus size={20} className="text-amber-600" /></div>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {drinks.map(drink => (
                        <button 
                            key={drink.id}
                            onClick={() => handleOrderDrink(drink.name)}
                            className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-xl hover:scale-105 transition-all group relative overflow-hidden text-left"
                        >
                            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-slate-100 to-slate-200 group-hover:from-emerald-400 group-hover:to-emerald-600 transition-all"></div>
                            <div className="text-6xl mb-6 group-hover:scale-110 transition-transform duration-500 origin-left">{drink.icon}</div>
                            <h4 className="text-2xl font-black text-slate-900 italic mb-2">{drink.name}</h4>
                            <p className="text-sm font-medium text-slate-500 leading-snug">{drink.description}</p>
                            <div className="absolute bottom-6 right-6 w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all shadow-md">
                                <Plus size={24} />
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        )}

        {/* PACKAGES TAB (UPDATED VISUALS) */}
        {currentTab === 'PACKAGES' && (
            <div className="animate-in slide-in-from-bottom-10 space-y-10">
                <div>
                    <h2 className={`text-5xl font-black italic mb-4 ${tierTheme.text}`}>Abonelik Paketleri</h2>
                    <p className={`text-lg font-medium ${tierTheme.subText}`}>Sürekli bakım için size özel avantajlı yıllık ve dönemlik paketler.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {availablePackages.map(pkg => (
                        <div key={pkg.id} className="bg-white rounded-[3rem] border border-slate-100 shadow-lg overflow-hidden flex flex-col group hover:shadow-2xl hover:-translate-y-2 transition-all relative">
                            {/* Decorative Header */}
                            <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-rose-400 via-indigo-500 to-emerald-500"></div>
                            
                            <div className="absolute top-0 right-0 bg-slate-900 text-white px-6 py-4 rounded-bl-[2.5rem] font-black text-[10px] uppercase tracking-widest z-10 shadow-lg">
                                {pkg.minTier}+ Üyelere Özel
                            </div>

                            <div className="p-10 flex-1 flex flex-col">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                                        <Package size={32} />
                                    </div>
                                    <div className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-amber-200">
                                        Popüler Seçim
                                    </div>
                                </div>

                                <h3 className="text-3xl font-black text-slate-900 italic mb-3 leading-tight">{pkg.name}</h3>
                                <p className="text-slate-500 font-medium mb-8 leading-relaxed">{pkg.description}</p>
                                
                                <div className="space-y-4 mb-8 bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                                    {pkg.features.map((feat, i) => (
                                        <div key={i} className="flex items-start gap-3 text-sm font-bold text-slate-700">
                                            <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0 mt-0.5"><Check size={12} /></div>
                                            {feat}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="p-8 bg-slate-900 text-white flex items-center justify-between relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
                                <div>
                                    <p className="text-[10px] font-black uppercase text-white/60 tracking-widest mb-1">PAKET FİYATI</p>
                                    <p className="text-4xl font-black tracking-tighter">{pkg.price.toLocaleString()} <span className="text-lg font-bold opacity-50">TL</span></p>
                                </div>
                                <button 
                                    onClick={() => toggleRequestItem({id: pkg.id, name: pkg.name, type: 'PACKAGE', price: pkg.price})} 
                                    className={`px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-xl ${requestList.some(i => i.id === pkg.id) ? 'bg-emerald-500 text-white' : 'bg-white text-slate-900 hover:bg-indigo-50'}`}
                                >
                                    {requestList.some(i => i.id === pkg.id) ? <span className="flex items-center gap-2"><Check size={16}/> Eklendi</span> : 'Talep Et'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* MENU TAB */}
        {currentTab === 'MENU' && (
            <div className="animate-in slide-in-from-bottom-10 space-y-10">
                <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                    <div>
                        <h2 className={`text-5xl font-black italic mb-4 ${tierTheme.text}`}>Hizmet Menüsü</h2>
                        <p className={`text-lg font-medium ${tierTheme.subText}`}>L'YSF uzmanlığıyla sunulan premium bakım protokolleri.</p>
                    </div>
                    <div className="flex gap-2 bg-white p-2 rounded-[2rem] shadow-sm border border-slate-100 overflow-x-auto no-scrollbar max-w-full">
                        {menuCategories.map(cat => (
                            <button 
                                key={cat.id} 
                                onClick={() => setActiveMenuCategory(cat.id)}
                                className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeMenuCategory === cat.id ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
                            >
                                {cat.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredServices.map(service => (
                        <div key={service.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex justify-between items-center group hover:border-slate-300 transition-all cursor-pointer" onClick={() => toggleRequestItem({id: service.id, name: service.name, type: 'SERVICE', price: service.price})}>
                            <div>
                                <p className="text-[9px] font-black uppercase text-indigo-500 tracking-widest mb-1">{service.category}</p>
                                <h4 className="text-xl font-black text-slate-900 italic mb-1">{service.name}</h4>
                                <p className="text-sm font-bold text-slate-400 flex items-center gap-2"><Clock size={14}/> {service.duration} Dakika</p>
                            </div>
                            <div className="text-right">
                                <p className="text-2xl font-black text-slate-900 mb-3">{service.price} TL</p>
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${requestList.some(i => i.id === service.id) ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-900 group-hover:text-white'}`}>
                                    {requestList.some(i => i.id === service.id) ? <Check size={20} /> : <Plus size={20} />}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* DOCS TAB */}
        {currentTab === 'DOCS' && (
            <div className="animate-in slide-in-from-bottom-10 space-y-10">
                <h2 className={`text-5xl font-black italic mb-4 ${tierTheme.text}`}>Dijital Arşiv</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {(activeCustomer.signedDocuments || []).map(doc => (
                        <div key={doc.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-xl transition-all">
                            <div className="absolute top-0 right-0 p-6 opacity-5"><FileText size={100} /></div>
                            <div className="relative z-10">
                                <div className="w-12 h-12 bg-slate-100 text-slate-500 rounded-2xl flex items-center justify-center mb-6"><FileText size={24}/></div>
                                <h4 className="text-lg font-black text-slate-900 italic mb-2">{doc.title}</h4>
                                <p className="text-xs font-bold text-slate-400 mb-6">{doc.timestamp}</p>
                                <button className="w-full py-3 bg-slate-50 text-slate-600 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all">Görüntüle</button>
                            </div>
                        </div>
                    ))}
                    {(activeCustomer.signedDocuments || []).length === 0 && (
                        <div className="col-span-full py-20 text-center opacity-40">
                            <FileText size={64} className="mx-auto mb-4"/>
                            <p className="font-black text-xl italic">Henüz imzalanmış belge yok.</p>
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* STAMPS TAB */}
        {currentTab === 'STAMPS' && (
            <div className="animate-in slide-in-from-bottom-10 space-y-10">
                <h2 className={`text-5xl font-black italic mb-8 ${tierTheme.text}`}>Sadakat Kartları</h2>
                
                {/* REWARDS PATH VISUALIZATION */}
                <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl relative overflow-hidden mb-10">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-400 via-rose-500 to-indigo-600"></div>
                    <h3 className="text-2xl font-black italic text-slate-900 mb-8">Ödül Yolculuğunuz</h3>
                    <div className="relative">
                        <div className="absolute top-1/2 left-0 w-full h-2 bg-slate-100 -translate-y-1/2 rounded-full"></div>
                        <div className="flex justify-between relative z-10">
                            {[
                                { label: 'Başlangıç', icon: Star, active: true },
                                { label: 'Bronz', icon: Award, active: true },
                                { label: 'Silver', icon: Crown, active: [MembershipTier.SILVER, MembershipTier.GOLD, MembershipTier.PLATINUM, MembershipTier.BLACK_VIP].includes(activeCustomer.tier) },
                                { label: 'Gold', icon: Zap, active: [MembershipTier.GOLD, MembershipTier.PLATINUM, MembershipTier.BLACK_VIP].includes(activeCustomer.tier) },
                                { label: 'Platinum', icon: Diamond, active: [MembershipTier.PLATINUM, MembershipTier.BLACK_VIP].includes(activeCustomer.tier) }
                            ].map((step, i) => (
                                <div key={i} className="flex flex-col items-center gap-4">
                                    <div className={`w-16 h-16 rounded-full flex items-center justify-center border-4 transition-all ${step.active ? 'bg-slate-900 border-slate-900 text-white scale-110 shadow-lg' : 'bg-white border-slate-200 text-slate-300'}`}>
                                        <step.icon size={24} />
                                    </div>
                                    <span className={`text-xs font-black uppercase tracking-widest ${step.active ? 'text-slate-900' : 'text-slate-300'}`}>{step.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    {['skinCare', 'nail'].map((cat: any) => {
                        const current = activeCustomer.loyaltyStamps?.[cat] || 0;
                        return (
                            <div key={cat} className="bg-slate-900 text-white p-10 rounded-[3rem] shadow-2xl relative overflow-hidden group hover:scale-[1.02] transition-transform">
                                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-400 via-rose-500 to-indigo-600"></div>
                                <div className="absolute -right-10 -bottom-10 text-white/5 rotate-12 group-hover:rotate-0 transition-transform duration-700">
                                    <Stamp size={200} />
                                </div>
                                <div className="flex justify-between items-center mb-8 relative z-10">
                                    <div>
                                        <h3 className="text-2xl font-black italic uppercase">{cat === 'skinCare' ? 'Cilt Bakımı' : 'Nail Art'}</h3>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">6 İşlemde 1 Hediye</p>
                                    </div>
                                    <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center"><Stamp size={24} /></div>
                                </div>
                                <div className="grid grid-cols-3 gap-4 relative z-10">
                                    {[1, 2, 3, 4, 5, 6].map(idx => (
                                        <div key={idx} className={`aspect-square rounded-2xl flex items-center justify-center border-2 transition-all ${idx <= current ? 'bg-white text-slate-900 border-white shadow-lg scale-105' : 'border-white/20 text-white/20'}`}>
                                            {idx <= current ? <CheckCircle size={32} className="text-emerald-500" /> : <span className="font-black text-xl">{idx}</span>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        )}

        {/* ... (SUGGESTIONS, WELCOME, DIET tabs - Already implemented above) ... */}
        {currentTab === 'SUGGESTIONS' && activeCustomer && (
            <div className="animate-in slide-in-from-bottom-10 duration-700 space-y-12">
               <div>
                   <h2 className={`text-7xl font-black ${tierTheme.text} tracking-tighter italic`}>Yapay Zeka Stilistiniz</h2>
                   <p className={`${tierTheme.subText} font-bold text-xl italic mt-2`}>
                       Geçmiş tercihleriniz ve yaşam stilinize göre yapay zeka destekli size özel öneriler.
                   </p>
               </div>
               
               {!aiRecommendations && !loadingRecommendations ? (
                   <div className={`${tierTheme.cardBg} border ${tierTheme.border} p-20 rounded-[5rem] text-center shadow-2xl relative overflow-hidden group`}>
                       <div className="absolute top-0 right-0 p-12 opacity-10"><Sparkles size={200} /></div>
                       <div className="relative z-10 flex flex-col items-center gap-8">
                           <div className={`w-32 h-32 ${tierTheme.button} rounded-[3rem] flex items-center justify-center shadow-2xl animate-pulse-subtle`}>
                               <Lightbulb size={64} className="text-white" />
                           </div>
                           <div>
                               <h3 className={`text-4xl font-black italic ${tierTheme.text}`}>Analizi Başlat</h3>
                               <p className={`text-lg font-medium mt-4 max-w-xl mx-auto ${tierTheme.subText}`}>
                                   L'YSF AI motoru, cilt tipiniz, geçmiş işlemleriniz ve mevsimsel ihtiyaçlarınıza göre en uygun protokolleri belirlemek için hazır.
                               </p>
                           </div>
                           <button onClick={handleFetchRecommendations} className={`px-16 py-8 ${tierTheme.button} text-white rounded-[3rem] font-black text-2xl uppercase tracking-widest shadow-3xl hover:scale-105 transition-transform flex items-center gap-4`}>
                               <Sparkles /> Şimdi Keşfet
                           </button>
                       </div>
                   </div>
               ) : loadingRecommendations ? (
                   <div className="flex flex-col items-center justify-center py-40 gap-8 text-center">
                       <Loader2 size={80} className={`animate-spin ${tierTheme.accent}`} />
                       <div>
                           <h3 className={`text-3xl font-black italic ${tierTheme.text}`}>Neural Engine Çalışıyor...</h3>
                           <p className={`${tierTheme.subText} font-bold uppercase tracking-widest mt-2`}>Verileriniz analiz ediliyor</p>
                       </div>
                   </div>
               ) : (
                   <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8">
                       <div className={`${tierTheme.cardBg} border ${tierTheme.border} p-12 rounded-[4rem] shadow-xl relative overflow-hidden`}>
                           <div className="absolute -left-10 top-0 text-[200px] opacity-5 font-serif leading-none select-none">"</div>
                           <div className="relative z-10">
                               <p className="text-[10px] font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                                   <Sparkles size={14} className={tierTheme.accent} /> Stil Notunuz
                               </p>
                               <p className={`text-3xl font-medium italic leading-relaxed ${tierTheme.text}`}>
                                   {aiRecommendations?.stylistNote}
                               </p>
                           </div>
                       </div>
                       
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                            {aiRecommendations?.recommendedServices.map((rec, i) => (
                                <div key={i} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-lg flex items-center gap-6">
                                    <div className={`w-16 h-16 ${tierTheme.button} rounded-2xl flex items-center justify-center text-white shrink-0`}>
                                        <Star size={24} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{rec.reason}</p>
                                        <h4 className="text-xl font-black text-slate-900 italic">{services.find(s => s.id === rec.serviceId)?.name || 'Özel Bakım'}</h4>
                                    </div>
                                </div>
                            ))}
                        </div>
                   </div>
               )}
            </div>
        )}

        {/* DIET TAB FULL CONTENT (RESTORED) */}
        {currentTab === 'DIET' && activeCustomer && (
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
                                                                   {mealKey === 'breakfast' ? 'Kahvaltı' : mealKey === 'lunch' ? 'Öğle' : 'Akşam'} {meal.isCheat && '🔥'}
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
        
      </main>

      {/* SIGNATURE MODAL */}
      {showConsentModal.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/95 backdrop-blur-2xl p-8">
          <div className="bg-white w-full max-w-6xl max-h-[95vh] rounded-[5rem] shadow-3xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-500">
            <div className="p-16 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-5xl font-black italic tracking-tighter">
                  {showConsentModal.type === 'DIET_CONTRACT' ? 'Beslenme & Yaşam Sözleşmesi' : 'Onay Protokolü'}
              </h3>
              <button onClick={() => setShowConsentModal({...showConsentModal, show: false})} className="p-6 hover:bg-slate-200 rounded-full transition-all text-slate-400"><X size={40}/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-16 space-y-16 no-scrollbar">
              <div className="prose prose-slate prose-2xl max-w-none text-slate-700 bg-[#f9f9f9] p-16 rounded-[4rem] border border-slate-100 h-96 overflow-y-auto">
                  {showConsentModal.type === 'DIET_CONTRACT' ? 
                    "İşbu sözleşme, danışan ile diyetisyen arasında sağlıklı beslenme programının uygulanması..." 
                    : kvkkText}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-6">
                      <p className="text-xl font-medium text-slate-600 italic">Yukarıdaki metni okudum ve onaylıyorum.</p>
                  </div>
                  <div className="space-y-6">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.5em] flex items-center gap-3"><Fingerprint size={20} className="text-rose-500" /> ISLAK İMZA</p>
                    <div className="bg-white border-4 border-dashed border-slate-200 rounded-[4rem] h-80 relative overflow-hidden">
                      <canvas ref={signatureCanvasRef} width={1200} height={600} onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={() => setIsDrawing(false)} onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={() => setIsDrawing(false)} className="w-full h-full touch-none" />
                    </div>
                  </div>
              </div>
            </div>
            <div className="p-16 bg-slate-900 flex flex-col items-center">
              <button onClick={saveSignature} className="w-full max-w-2xl py-12 bg-white text-slate-900 rounded-[3.5rem] font-black text-4xl shadow-3xl hover:bg-rose-500 hover:text-white transition-all">ONAYLA VE KAYDET</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes scan-line {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        @keyframes scan-line-loop {
          0% { transform: translateY(-500px); }
          100% { transform: translateY(500px); }
        }
        @keyframes pulse-subtle {
          0% { transform: scale(1); }
          50% { transform: scale(1.02); }
          100% { transform: scale(1); }
        }
        @keyframes swing {
          0% { transform: rotate(0deg); }
          20% { transform: rotate(15deg); }
          40% { transform: rotate(-10deg); }
          60% { transform: rotate(5deg); }
          80% { transform: rotate(-5deg); }
          100% { transform: rotate(0deg); }
        }
        .perspective-1000 { perspective: 1000px; }
        .rotate-y-12 { transform: rotateY(12deg); }
        .rotate-x-12 { transform: rotateX(12deg); }
        .animate-swing {
           animation: swing 2s ease-in-out infinite;
        }
        .animate-scan-line {
          animation: scan-line 4s infinite linear;
        }
        .animate-scan-line-loop {
          animation: scan-line-loop 2s infinite ease-in-out;
        }
        .animate-pulse-subtle {
          animation: pulse-subtle 2s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
};

const StageDot = ({ label, active, complete, icon: Icon }: any) => (
  <div className={`relative z-10 flex flex-col items-center gap-3 transition-all duration-500 ${active ? 'opacity-100 scale-110' : 'opacity-50 scale-90'}`}>
     <div className={`w-12 h-12 rounded-full border-4 flex items-center justify-center transition-all duration-500 ${complete ? 'bg-emerald-500 border-emerald-500 text-white' : (active ? 'bg-white border-slate-900 text-slate-900' : 'bg-slate-100 border-slate-200 text-slate-300')}`}>
        {complete ? <CheckCircle size={20} /> : <Icon size={20} />}
     </div>
     <span className={`text-[10px] font-black uppercase tracking-widest ${active ? 'text-slate-900' : 'text-slate-300'}`}>{label}</span>
  </div>
);

const NavTab = ({ active, onClick, icon: Icon, label, theme }: any) => (
  <button 
    onClick={onClick}
    className={`px-6 py-3 rounded-[2rem] flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${active ? theme.tabActive : theme.tabInactive}`}
  >
    <Icon size={14} className={active ? '' : 'opacity-50'} />
    {label}
  </button>
);

const MetricHUD = ({ label, val, icon: Icon }: any) => (
  <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center gap-2">
     <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
        <Icon size={14} />
     </div>
     <p className="text-[9px] font-black uppercase text-slate-400">{label}</p>
     <div className="relative w-16 h-16 flex items-center justify-center">
        <svg className="absolute inset-0 w-full h-full -rotate-90">
           <circle cx="32" cy="32" r="28" stroke="#f1f5f9" strokeWidth="4" fill="none" />
           <circle cx="32" cy="32" r="28" stroke={val > 80 ? '#10b981' : val > 50 ? '#f59e0b' : '#f43f5e'} strokeWidth="4" fill="none" strokeDasharray="175" strokeDashoffset={175 - (175 * val) / 100} strokeLinecap="round" />
        </svg>
        <span className="text-xs font-black text-slate-700">{val}</span>
     </div>
  </div>
);

const Badge = ({ label, icon: Icon, color }: any) => {
  const colors: any = {
      indigo: 'bg-indigo-50 text-indigo-600',
      emerald: 'bg-emerald-50 text-emerald-600',
      rose: 'bg-rose-50 text-rose-600',
      amber: 'bg-amber-50 text-amber-600'
  };
  return (
      <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${colors[color] || colors.indigo}`}>
          <Icon size={12}/> {label}
      </span>
  );
};

const DietMealCard = ({ title, content, color }: any) => {
    const colors: any = {
        amber: 'bg-amber-50 border-amber-100 text-amber-900',
        emerald: 'bg-emerald-50 border-emerald-100 text-emerald-900',
        indigo: 'bg-indigo-50 border-indigo-100 text-indigo-900',
    };
    return (
        <div className={`p-4 rounded-3xl border ${colors[color]} h-full`}>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">{title}</p>
            <p className="text-sm font-medium leading-relaxed italic">{content || 'Belirtilmemiş'}</p>
        </div>
    );
};