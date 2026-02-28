
import React, { useState, useRef } from 'react';
import { useSalon } from '../store/SalonContext';
import { predictBusinessGrowth, generateMarketingVisual } from '../geminiService';
import { 
  Globe, Zap, Loader2, Rocket, UploadCloud, RefreshCw, 
  ArrowDownCircle, CheckCircle2, AlertTriangle, Database, 
  FileJson, ShieldCheck, Info, WifiOff, Image as ImageIcon, Download, LayoutTemplate
} from 'lucide-react';

export const AIAdvice: React.FC = () => {
  const { services, products, customers, transactions, importData, exportData, resetToDefaults, isOnline } = useSalon();
  const [intel, setIntel] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Image Gen States
  const [imgPrompt, setImgPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [generatedImg, setGeneratedImg] = useState<string | null>(null);
  const [imgLoading, setImgLoading] = useState(false);

  // Data States
  const [isExporting, setIsExporting] = useState(false);
  const [importStatus, setImportStatus] = useState<{ type: 'idle' | 'loading' | 'success' | 'error', message: string }>({ type: 'idle', message: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchGrowthPlan = async () => {
    if (!isOnline) return;
    setLoading(true);
    try {
      const intelligence = await predictBusinessGrowth(transactions, customers);
      setIntel(intelligence);
    } catch (e) {
      alert("AI Analizi şu an yapılamıyor, lütfen internet bağlantınızı kontrol edin.");
    }
    setLoading(false);
  };

  const handleGenerateImage = async () => {
    if(!imgPrompt) return;
    setImgLoading(true);
    setGeneratedImg(null);
    try {
      const url = await generateMarketingVisual(imgPrompt, aspectRatio);
      if(url) setGeneratedImg(url);
    } catch (e) {
      alert("Görsel oluşturulamadı.");
    }
    setImgLoading(false);
  };

  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      exportData();
      setIsExporting(false);
    }, 800);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImportStatus({ type: 'loading', message: "Veri paketi çözümleniyor..." });
      await new Promise(resolve => setTimeout(resolve, 1500));
      const result = await importData(file);
      if (result.success) {
         setImportStatus({ type: 'success', message: "Sistem Başarıyla Geri Yüklendi!" });
         setTimeout(() => window.location.reload(), 2000);
      } else {
         setImportStatus({ type: 'error', message: "Hata: " + result.message });
      }
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-20">
      {/* İSTATİSTİK ÖZETİ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={Database} label="Kayıtlı Müşteri" value={customers.length} color="indigo" />
        <StatCard icon={Zap} label="Aktif Hizmet" value={services.length} color="rose" />
        <StatCard icon={ArrowDownCircle} label="Toplam İşlem" value={transactions.length} color="emerald" />
        <StatCard icon={RefreshCw} label="Ürün Çeşidi" value={products.length} color="amber" />
      </div>

      {/* AI MARKETING STUDIO */}
      <div className="bg-slate-900 rounded-[4rem] p-12 text-white shadow-2xl relative overflow-hidden">
         <div className="absolute top-0 right-0 p-12 opacity-10"><ImageIcon size={180}/></div>
         <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
               <div className="flex items-center gap-4 mb-6">
                  <div className="p-4 bg-white/10 rounded-2xl"><ImageIcon size={32} className="text-amber-400"/></div>
                  <h3 className="text-3xl font-black italic tracking-tighter">AI Marketing Studio</h3>
               </div>
               <p className="text-slate-400 font-medium mb-8">Sosyal medya ve kampanya görsellerinizi saniyeler içinde oluşturun. Gemini 3 Pro Vision teknolojisi ile ultra gerçekçi sonuçlar.</p>
               
               <div className="space-y-6">
                  <textarea 
                    value={imgPrompt}
                    onChange={(e) => setImgPrompt(e.target.value)}
                    placeholder="Örn: Modern bir güzellik salonunda cilt bakımı yaptıran mutlu bir kadın, soft aydınlatma, 4k..."
                    className="w-full h-32 bg-white/5 border border-white/10 rounded-3xl p-6 text-white outline-none focus:border-amber-400 transition-all resize-none"
                  />
                  
                  <div className="flex gap-4">
                     <div className="flex-1 bg-white/5 rounded-2xl border border-white/10 px-4 flex items-center gap-2">
                        <LayoutTemplate size={20} className="text-slate-400"/>
                        <select 
                          value={aspectRatio}
                          onChange={(e) => setAspectRatio(e.target.value)}
                          className="w-full bg-transparent py-4 outline-none text-white font-bold cursor-pointer [&>option]:text-black"
                        >
                           <option value="1:1">1:1 (Kare - Instagram)</option>
                           <option value="3:4">3:4 (Dikey - Post)</option>
                           <option value="4:3">4:3 (Yatay)</option>
                           <option value="9:16">9:16 (Story/Reels)</option>
                           <option value="16:9">16:9 (Youtube/Web)</option>
                           <option value="2:3">2:3 (Dikey)</option>
                           <option value="3:2">3:2 (Yatay)</option>
                           <option value="21:9">21:9 (Sinematik)</option>
                        </select>
                     </div>
                     <button 
                       onClick={handleGenerateImage}
                       disabled={imgLoading || !imgPrompt}
                       className="px-8 bg-amber-500 text-white rounded-2xl font-black hover:bg-amber-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                     >
                        {imgLoading ? <Loader2 className="animate-spin"/> : <Zap/>}
                        OLUŞTUR
                     </button>
                  </div>
               </div>
            </div>

            <div className="bg-black/40 rounded-[3rem] border border-white/10 flex items-center justify-center min-h-[300px] relative overflow-hidden group">
               {imgLoading ? (
                  <div className="text-center">
                     <Loader2 size={48} className="animate-spin text-amber-500 mx-auto mb-4"/>
                     <p className="text-xs font-black uppercase tracking-widest text-slate-500">Pikseller İşleniyor...</p>
                  </div>
               ) : generatedImg ? (
                  <>
                     <img src={generatedImg} className="w-full h-full object-contain" />
                     <a href={generatedImg} download="lysf-ai-art.png" className="absolute bottom-6 right-6 p-4 bg-white text-black rounded-full opacity-0 group-hover:opacity-100 transition-all hover:scale-110 shadow-xl">
                        <Download size={24}/>
                     </a>
                  </>
               ) : (
                  <div className="text-center opacity-30">
                     <ImageIcon size={64} className="mx-auto mb-4"/>
                     <p className="font-black text-xl italic">Görsel Önizleme</p>
                  </div>
               )}
            </div>
         </div>
      </div>

      {/* AI STRATEGY & REPORTING */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className={`lg:col-span-8 p-12 lg:p-16 rounded-[4rem] text-white shadow-3xl relative overflow-hidden flex flex-col justify-between group transition-colors ${isOnline ? 'bg-gradient-to-br from-indigo-700 to-indigo-900' : 'bg-slate-800'}`}>
           <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-125 transition-transform duration-1000">
               {isOnline ? <Rocket size={180} /> : <WifiOff size={180} />}
           </div>
           <div className="relative z-10 max-w-2xl">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-4 bg-white/10 rounded-3xl backdrop-blur-md">
                <Globe className={isOnline ? "text-emerald-400" : "text-slate-400"} size={32} />
              </div>
              <h3 className="text-4xl font-black text-white tracking-tighter">L'YSF Market Intelligence</h3>
            </div>
            <p className="text-indigo-100 text-xl font-medium leading-relaxed mb-10">
              {isOnline 
                ? "İşletmenizi küresel standartlara taşımak için verilerinizi Alman disiplini ve Thinking Mode ile analiz eden yapay zeka motorunu başlatın." 
                : "Yapay zeka motoruna bağlanılamıyor. Lütfen internet bağlantınızı kontrol edin."}
            </p>
            <button 
              onClick={fetchGrowthPlan}
              disabled={loading || !isOnline}
              className={`w-full sm:w-fit px-12 py-6 font-black rounded-[2rem] flex items-center justify-center gap-4 shadow-2xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${isOnline ? 'bg-white text-indigo-900 hover:bg-emerald-50' : 'bg-slate-600 text-slate-300'}`}
            >
              {loading ? <Loader2 className="animate-spin" /> : (isOnline ? <Zap size={24} /> : <WifiOff size={24}/>)}
              {isOnline ? "Derin Analiz Başlat (Thinking)" : "Çevrimdışı Mod"}
            </button>
          </div>
        </div>

        <div className="lg:col-span-4 flex flex-col gap-8">
           <div className="bg-white rounded-[3.5rem] p-10 border border-slate-200 shadow-xl flex flex-col items-center justify-center text-center flex-1">
              <div className="w-16 h-16 bg-slate-900 text-white rounded-2xl flex items-center justify-center mb-6"><Database size={28}/></div>
              <h4 className="text-xl font-black text-slate-900 mb-2">Veri Yedekleme</h4>
              <p className="text-slate-500 text-sm mb-6">Verileri JSON formatında cihazlar arası taşıyın.</p>
              <div className="flex gap-2 w-full">
                 <button onClick={handleExport} disabled={isExporting} className="flex-1 py-4 bg-slate-100 rounded-xl font-black text-xs uppercase hover:bg-slate-200 transition-all">{isExporting ? <Loader2 className="animate-spin mx-auto"/> : 'İndir'}</button>
                 <button onClick={() => fileInputRef.current?.click()} className="flex-1 py-4 bg-indigo-500 text-white rounded-xl font-black text-xs uppercase hover:bg-indigo-600 transition-all">Yükle</button>
                 <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".json" />
              </div>
              {importStatus.message && <p className={`text-[10px] font-black uppercase mt-4 ${importStatus.type === 'success' ? 'text-emerald-500' : 'text-rose-500'}`}>{importStatus.message}</p>}
           </div>

           <div className="bg-rose-50 p-10 rounded-[3.5rem] border border-rose-100 flex flex-col justify-center items-center text-center flex-1 shadow-sm">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-rose-500 mb-6 shadow-sm">
                <AlertTriangle size={32} className="animate-pulse" />
              </div>
              <p className="text-rose-900 text-lg font-black uppercase tracking-widest mb-2">Fabrika Ayarları</p>
              <button 
               onClick={resetToDefaults}
               className="w-full py-4 bg-rose-500 text-white rounded-xl font-black text-xs uppercase tracking-[0.2em] hover:bg-rose-600 transition-all shadow-lg active:scale-95"
              >
                Sistemi Sıfırla
              </button>
           </div>
        </div>
      </div>

      {/* AI RAPOR ÇIKTISI */}
      {intel && (
        <div className="bg-white p-12 lg:p-20 rounded-[5rem] text-slate-900 shadow-3xl animate-in slide-in-from-bottom-12 border border-slate-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-12 opacity-5 text-indigo-600">
              <Info size={200} />
            </div>
            <div className="flex items-center gap-6 mb-12">
                <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center">
                   <Globe size={32} /> 
                </div>
                <h3 className="text-4xl font-black tracking-tighter">AI Strateji Raporu</h3>
            </div>
            <div className="prose prose-slate prose-xl max-w-none text-slate-600 font-medium whitespace-pre-wrap leading-relaxed italic border-l-8 border-indigo-500 pl-10 py-4">
                {intel}
            </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, color }: any) => {
  const colors: any = {
    indigo: 'bg-indigo-50 text-indigo-600',
    rose: 'bg-rose-50 text-rose-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600'
  };
  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-6 hover:shadow-md transition-shadow">
      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${colors[color]}`}>
        <Icon size={28} />
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-3xl font-black text-slate-900">{value}</p>
      </div>
    </div>
  );
};
