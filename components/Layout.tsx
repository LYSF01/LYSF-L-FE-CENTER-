import React, { useState, useEffect } from 'react';
import { useSalon } from '../store/SalonContext';
import { UserRole } from '../types';
import { GuidedTour } from './GuidedTour';
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  UserCircle,
  ShoppingBag,
  Zap,
  CalendarDays,
  Download,
  Sliders,
  RefreshCw,
  Maximize,
  Minimize,
  Wifi,
  WifiOff,
  Share,
  PlusSquare,
  Smartphone,
  Monitor,
  X,
  LogOut,
  ShieldCheck,
  Apple,
  Tablet,
  HelpCircle
} from 'lucide-react';

export const Layout: React.FC<{ children: React.ReactNode; currentTab: string; setTab: (t: string) => void }> = ({ children, currentTab, setTab }) => {
  const { currentRole, exportData, logout, isOnline } = useSalon();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showInstallHelp, setShowInstallHelp] = useState(false);
  const [showTour, setShowTour] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Check for first time user
  useEffect(() => {
    const hasSeenTour = localStorage.getItem('hasSeenOnboardingTour');
    if (!hasSeenTour) {
        setShowTour(true);
    }
  }, []);

  const handleTourComplete = () => {
      localStorage.setItem('hasSeenOnboardingTour', 'true');
      setShowTour(false);
  };

  const tourSteps = [
      {
          targetId: 'center',
          title: "L'YSF Life Center'a Hoş Geldiniz",
          content: "Yeni nesil wellness yönetim sisteminiz hazır. Size kısa bir tur attıralım mı?",
          position: 'center' as const
      },
      {
          targetId: 'nav-dashboard',
          title: "Yönetim Üssü",
          content: "İşletmenizin finansal durumu, randevu özetleri ve kritik metrikleri buradan takip edin. Yeni 'Alman Disiplini' finansal denetim modülü de burada!",
          position: 'right' as const
      },
      {
          targetId: 'nav-appointments',
          title: "Randevu Takvimi",
          content: "Yapay zeka destekli akıllı takvim ile randevuları yönetin, personel programlarını optimize edin.",
          position: 'right' as const
      },
      {
          targetId: 'nav-customers',
          title: "VIP CRM",
          content: "Müşterilerinizin tüm geçmişini, sadakat durumunu ve yapay zeka destekli önerileri buradan görüntüleyin.",
          position: 'right' as const
      },
      {
          targetId: 'nav-ai-advice',
          title: "Büyüme Merkezi",
          content: "Gemini AI motoru ile işletmeniz için büyüme stratejileri ve pazar analizleri alın.",
          position: 'right' as const
      },
      {
          targetId: 'nav-customer-portal',
          title: "Tablet Modu",
          content: "Müşterileriniz için özel tablet arayüzü. Randevu alma, sadakat takibi ve wellness planları burada.",
          position: 'right' as const
      }
  ];

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Tam ekran hatası: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Yönetim Üssü', icon: LayoutDashboard, roles: [UserRole.MANAGER] },
    { id: 'appointments', label: 'Randevu Takvimi', icon: CalendarDays, roles: [UserRole.MANAGER, UserRole.RECEPTIONIST, UserRole.EXPERT] },
    { id: 'customers', label: 'VIP Müşteri CRM', icon: Users, roles: [UserRole.MANAGER, UserRole.RECEPTIONIST, UserRole.EXPERT] },
    { id: 'inventory', label: 'Stok & Envanter', icon: Package, roles: [UserRole.MANAGER, UserRole.RECEPTIONIST] },
    { id: 'sales', label: 'Hizmet Girişi', icon: ShoppingBag, roles: [UserRole.RECEPTIONIST, UserRole.MANAGER, UserRole.EXPERT] },
    { id: 'dietitian-cockpit', label: 'Diyet Kokpiti', icon: Apple, roles: [UserRole.MANAGER, UserRole.EXPERT, UserRole.RECEPTIONIST] }, 
    { id: 'ai-advice', label: 'Büyüme Merkezi', icon: Zap, roles: [UserRole.MANAGER] },
    { id: 'system-management', label: 'Sistem Ayarları', icon: Sliders, roles: [UserRole.MANAGER] },
    { id: 'customer-portal', label: "L'YSF Tablet", icon: Tablet, roles: [UserRole.MANAGER, UserRole.RECEPTIONIST, UserRole.EXPERT] },
  ];

  // --- KIOSK / TABLET MODE ---
  // Eğer Tablet Modu aktifse, Sidebar ve Header'ı gizle, tam ekran içerik göster.
  if (currentTab === 'customer-portal') {
    return (
      <div className="h-screen w-screen bg-[#fcfdfe] overflow-hidden relative">
        {/* Güvenli Çıkış Butonu (Görünür) - Personel/Yönetici Dönüşü */}
        <button 
          onClick={() => setTab('dashboard')} 
          className="fixed bottom-6 right-6 z-[100] px-6 py-4 bg-slate-900/10 backdrop-blur-md text-slate-400 rounded-full hover:bg-rose-500 hover:text-white transition-all flex items-center gap-3 shadow-lg border border-white/20 group"
          title="Yönetim Paneline Dön"
        >
          <ShieldCheck size={18} className="group-hover:scale-110 transition-transform"/>
          <span className="text-[10px] font-black uppercase tracking-widest">Yönetici Paneli</span>
        </button>
        
        <div className="h-full w-full overflow-y-auto no-scrollbar">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#fcfdfe] overflow-hidden">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-slate-100 flex flex-col z-20 shadow-2xl shadow-slate-200/50">
        <div className="p-10 border-b border-slate-50">
          <h1 className="text-3xl font-black tracking-tighter text-slate-900 flex items-center gap-2">
            L'YSF <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
          </h1>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.4em] mt-1">Life Center Elite</p>
        </div>

        <nav className="flex-1 p-6 space-y-2 overflow-y-auto no-scrollbar">
          {navItems.filter(item => item.roles.includes(currentRole)).map(item => (
            <button
              key={item.id}
              id={`nav-${item.id}`}
              onClick={() => setTab(item.id)}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-[1.5rem] text-sm font-black transition-all duration-300 ${
                currentTab === item.id 
                  ? 'bg-slate-900 text-white shadow-xl translate-x-1' 
                  : 'text-slate-400 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <item.icon size={20} strokeWidth={2.5} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-slate-50 space-y-4">
           <div className="flex gap-2">
            <button onClick={exportData} title="Yedekle" className="flex-1 flex items-center justify-center p-4 bg-slate-50 text-slate-400 hover:text-indigo-600 rounded-2xl transition-all"><Download size={20} /></button>
            <button onClick={() => setShowTour(true)} title="Tur Başlat" className="flex-1 flex items-center justify-center p-4 bg-amber-50 text-amber-500 hover:bg-amber-500 hover:text-white rounded-2xl transition-all"><HelpCircle size={20} /></button>
            <button onClick={() => setShowInstallHelp(true)} title="Uygulamayı Kur" className="flex-1 flex items-center justify-center p-4 bg-emerald-50 text-emerald-500 hover:bg-emerald-500 hover:text-white rounded-2xl transition-all"><Smartphone size={20} /></button>
            <button onClick={logout} title="Sistem Değiştir / Çıkış" className="flex-1 flex items-center justify-center p-4 bg-rose-50 text-rose-400 hover:bg-rose-500 hover:text-white rounded-2xl transition-all"><LogOut size={20} /></button>
          </div>
          
          <div className="bg-slate-900 p-5 rounded-[2rem] border border-white/10 shadow-xl">
            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-black mb-2">Aktif Yetki</p>
            <div className="text-sm font-black text-white uppercase italic">
              {currentRole === UserRole.MANAGER ? 'Master Admin' : currentRole === UserRole.RECEPTIONIST ? 'Receptionist' : 'Expert'}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative bg-[#fcfdfe] no-scrollbar">
        <header className="sticky top-0 z-10 bg-[#fcfdfe]/60 backdrop-blur-3xl px-12 py-8 flex justify-between items-center">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight capitalize">
            {navItems.find(i => i.id === currentTab)?.label || (currentTab === 'customer-portal' ? 'Tablet Modu' : 'Elite Yönetim')}
          </h2>
          <div className="flex items-center gap-6">
            <button 
              onClick={toggleFullscreen}
              className="p-4 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-slate-900 hover:shadow-lg transition-all flex items-center gap-2"
              title={isFullscreen ? 'Tam Ekrandan Çık' : 'Tam Ekran Modu'}
            >
              {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
              <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">
                {isFullscreen ? 'KÜÇÜLT' : 'TAM EKRAN'}
              </span>
            </button>
            <div className="flex items-center gap-4 pl-6 border-l border-slate-100">
              <div className="text-right">
                <p className="text-sm font-black text-slate-900">Elite OS</p>
                <div className={`text-[10px] font-bold uppercase tracking-widest flex items-center justify-end gap-1 ${isOnline ? 'text-emerald-500' : 'text-rose-500'}`}>
                   {isOnline ? 'Online' : 'Offline Mode'}
                   {isOnline ? <Wifi size={12}/> : <WifiOff size={12}/>}
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-200 to-slate-300 border-2 border-white shadow-md"></div>
            </div>
          </div>
        </header>
        <div className="px-12 pb-20">
          {children}
        </div>
      </main>

      {/* Yükleme Rehberi Modalı (İçeriden Erişim İçin) */}
      {showInstallHelp && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-6 animate-in fade-in">
           <div className="bg-slate-900 border border-white/10 w-full max-w-2xl rounded-[3rem] p-10 relative overflow-hidden">
              <button onClick={() => setShowInstallHelp(false)} className="absolute top-6 right-6 p-4 bg-white/10 rounded-full text-white hover:bg-rose-500 transition-all"><X size={24}/></button>
              
              <h3 className="text-3xl font-black text-white italic tracking-tighter mb-8 text-center">Kurulum Rehberi</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 {/* iPad / iPhone */}
                 <div className="bg-white/5 p-8 rounded-[2rem] border border-white/5 text-center group hover:bg-white/10 transition-all">
                    <div className="w-16 h-16 bg-white text-black rounded-2xl flex items-center justify-center mx-auto mb-6"><Smartphone size={32}/></div>
                    <h4 className="text-white font-black text-xl mb-4">iPad / iPhone</h4>
                    <ol className="text-slate-400 text-sm font-medium space-y-4 text-left list-decimal list-inside">
                       <li>Tarayıcının üst veya alt kısmındaki <Share className="inline mx-1 text-rose-500" size={16}/> <strong>Paylaş</strong> butonuna basın.</li>
                       <li>Açılan menüden aşağı inip <PlusSquare className="inline mx-1 text-white" size={16}/> <strong>Ana Ekrana Ekle</strong> seçeneğine dokunun.</li>
                       <li>Sağ üstteki <strong>Ekle</strong> butonuna basın.</li>
                    </ol>
                 </div>

                 {/* PC / Android */}
                 <div className="bg-white/5 p-8 rounded-[2rem] border border-white/5 text-center group hover:bg-white/10 transition-all">
                    <div className="w-16 h-16 bg-slate-800 text-white rounded-2xl flex items-center justify-center mx-auto mb-6"><Monitor size={32}/></div>
                    <h4 className="text-white font-black text-xl mb-4">PC / Android</h4>
                    <ol className="text-slate-400 text-sm font-medium space-y-4 text-left list-decimal list-inside">
                       <li>Tarayıcının sağ üst köşesindeki <strong>Üç Nokta</strong> veya adres çubuğundaki <Download className="inline mx-1 text-emerald-500" size={16}/> <strong>Yükle</strong> ikonuna basın.</li>
                       <li><strong>"L'YSF Life Center Yükle"</strong> seçeneğini onaylayın.</li>
                       <li>Masaüstünüze uygulama ikonu gelecektir.</li>
                    </ol>
                 </div>
              </div>
              
              <div className="mt-8 text-center">
                 <p className="text-rose-500 text-xs font-black uppercase tracking-widest animate-pulse">Kurulum yapıldığında adres çubuğu gizlenir ve tam ekran çalışır.</p>
              </div>
           </div>
        </div>
      )}

      <GuidedTour 
        isOpen={showTour} 
        onClose={() => setShowTour(false)} 
        steps={tourSteps}
        onComplete={handleTourComplete}
      />
    </div>
  );
};
