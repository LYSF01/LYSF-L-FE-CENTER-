
import React, { useState } from 'react';
import { useSalon } from '../store/SalonContext';
import { ShieldCheck, Lock, ArrowRight, Download, Share, PlusSquare, Monitor, Smartphone, X } from 'lucide-react';

export const LoginView: React.FC = () => {
  const { login, adminKey, receptionistKey, staffKey } = useSalon();
  const [pass, setPass] = useState('');
  const [error, setError] = useState(false);
  const [showInstallHelp, setShowInstallHelp] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (login(pass)) {
      setError(false);
    } else {
      setError(true);
      setPass('');
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-6 font-['Plus_Jakarta_Sans'] relative overflow-hidden">
      {/* Arka Plan Efektleri */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
         <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-rose-500/20 rounded-full blur-[120px]"></div>
         <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[100px]"></div>
      </div>

      <div className="max-w-md w-full relative z-10">
        <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom-10 duration-1000">
          <div className="w-24 h-24 bg-rose-500 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-2xl rotate-3 border-4 border-white/10">
            <ShieldCheck size={48} className="text-white" />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter mb-2">L'YSF LIFE CENTER</h1>
          <p className="text-slate-400 text-sm font-bold uppercase tracking-[0.3em]">Master Access Portal</p>
        </div>

        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 p-10 rounded-[3rem] shadow-3xl">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Lock size={12} /> Master Access Key
              </label>
              <input 
                type="password"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                placeholder="Şifre Giriniz"
                className={`w-full bg-white/5 border-2 ${error ? 'border-rose-500' : 'border-white/10'} rounded-2xl py-5 px-6 text-white text-xl font-black outline-none focus:border-rose-500 transition-all text-center placeholder:text-slate-600`}
              />
            </div>

            <button type="submit" className="w-full bg-rose-500 text-white font-black py-5 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3 active:scale-95 hover:bg-rose-600">
              Sisteme Giriş <ArrowRight size={20} />
            </button>
          </form>
        </div>

        {/* Uygulama Yükleme Yardım Butonu */}
        <button 
          onClick={() => setShowInstallHelp(true)}
          className="w-full mt-8 py-5 rounded-[2rem] bg-emerald-500 text-white shadow-2xl hover:bg-emerald-400 transition-all flex items-center justify-center gap-3 group animate-pulse"
        >
          <div className="bg-white/20 p-2 rounded-xl group-hover:rotate-12 transition-transform"><Download size={20} /></div>
          <span className="text-sm font-black uppercase tracking-widest">UYGULAMAYI CİHAZA YÜKLE</span>
        </button>
      </div>

      {/* Yükleme Rehberi Modalı */}
      {showInstallHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-6 animate-in fade-in">
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
    </div>
  );
};
