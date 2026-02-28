
import React, { useState, useMemo } from 'react';
import { useSalon } from '../store/SalonContext';
import { UserRole, Product } from '../types';
import { Package, Plus, Search, Trash2, Edit, X, Check, ShieldAlert, Droplets, Info, History, BarChart3, AlertCircle, ShoppingBag, Banknote, TrendingUp, AlertTriangle, Layers } from 'lucide-react';

export const Inventory: React.FC = () => {
  const { products, currentRole, deleteData, addProduct, updateProduct } = useSalon();
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<Product | null>(null);
  const [viewMode, setViewMode] = useState<'ALL' | 'PROFESSIONAL' | 'RETAIL' | 'LOW_STOCK'>('ALL');
  
  const [formData, setFormData] = useState<Partial<Product>>({ 
    name: '', costPrice: 0, salePrice: 0, stock: 0, volumePerUnit: 500, usagePerSession: 5, unit: 'ML', isProfessional: true, lowStockThreshold: 2 
  });

  const isManager = currentRole === UserRole.MANAGER;

  // ANALYTICS & FILTERING
  const filteredProducts = useMemo(() => {
      return products.filter(p => {
          const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
          const isLow = p.stock <= p.lowStockThreshold;
          
          let matchesView = true;
          if (viewMode === 'PROFESSIONAL') matchesView = p.isProfessional;
          if (viewMode === 'RETAIL') matchesView = !p.isProfessional;
          if (viewMode === 'LOW_STOCK') matchesView = isLow;

          return matchesSearch && matchesView;
      });
  }, [products, searchTerm, viewMode]);

  const stats = useMemo(() => {
      let totalCostValue = 0;
      let totalRetailValue = 0;
      let lowStockCount = 0;

      products.forEach(p => {
          totalCostValue += p.stock * p.costPrice;
          if (!p.isProfessional) {
              totalRetailValue += p.stock * p.salePrice;
          }
          if (p.stock <= p.lowStockThreshold) lowStockCount++;
      });

      return { totalCostValue, totalRetailValue, lowStockCount };
  }, [products]);

  const handleOpenForm = (prod?: Product) => {
    if (prod) {
      setEditItem(prod);
      setFormData(prod);
    } else {
      setEditItem(null);
      setFormData({ name: '', costPrice: 0, salePrice: 0, stock: 1, volumePerUnit: 500, usagePerSession: 5, unit: 'ML', isProfessional: true, lowStockThreshold: 2 });
    }
    setShowForm(true);
  };

  const handleSave = () => {
    if(!formData.name || (formData.costPrice || 0) < 0) return;
    const pData: Product = {
      id: editItem?.id || Math.random().toString(36).substr(2, 9),
      name: formData.name || '',
      category: formData.category || 'GENERAL',
      stock: Number(formData.stock) || 0,
      costPrice: Number(formData.costPrice) || 0,
      salePrice: Number(formData.salePrice) || 0,
      unit: formData.unit || 'ML',
      volumePerUnit: Number(formData.volumePerUnit) || 500,
      currentUnitRemaining: editItem ? editItem.currentUnitRemaining : (Number(formData.volumePerUnit) || 500),
      usagePerSession: Number(formData.usagePerSession) || 5,
      isProfessional: formData.isProfessional ?? true,
      wasteThreshold: 1,
      lowStockThreshold: Number(formData.lowStockThreshold) || 2,
      lastAuditDate: new Date().toISOString()
    };
    editItem ? updateProduct(pData) : addProduct(pData);
    setShowForm(false);
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      {/* HEADER STATISTICS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard 
             label="Toplam Envanter Değeri" 
             value={`${stats.totalCostValue.toLocaleString()} TL`} 
             icon={Banknote} 
             color="indigo" 
             sub="Maliyet Bazlı"
          />
          <StatCard 
             label="Potansiyel Satış Geliri" 
             value={`${stats.totalRetailValue.toLocaleString()} TL`} 
             icon={TrendingUp} 
             color="emerald" 
             sub="Sadece Perakende Ürünler"
          />
          <StatCard 
             label="Kritik Stok Uyarısı" 
             value={`${stats.lowStockCount} Ürün`} 
             icon={AlertTriangle} 
             color="rose" 
             sub="Sipariş Verilmeli"
             alert={stats.lowStockCount > 0}
          />
      </div>

      <div className="flex flex-col xl:flex-row justify-between items-start gap-8">
        <div className="flex flex-col gap-4 w-full xl:w-auto">
            <div className="relative w-full xl:w-[500px]">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={24} />
              <input type="text" placeholder="Stoklarda ara..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-16 pr-8 py-6 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm focus:ring-4 focus:ring-rose-500/10 outline-none transition-all font-black" />
            </div>
            
            {/* TABS */}
            <div className="flex gap-2 bg-white p-2 rounded-[2rem] border border-slate-100 w-fit">
                <TabButton label="Tümü" active={viewMode === 'ALL'} onClick={() => setViewMode('ALL')} icon={Layers} />
                <TabButton label="Kabine (Sarf)" active={viewMode === 'PROFESSIONAL'} onClick={() => setViewMode('PROFESSIONAL')} icon={Droplets} />
                <TabButton label="Satış Ürünleri" active={viewMode === 'RETAIL'} onClick={() => setViewMode('RETAIL')} icon={ShoppingBag} />
                <TabButton label="Kritik Stok" active={viewMode === 'LOW_STOCK'} onClick={() => setViewMode('LOW_STOCK')} icon={AlertCircle} alert />
            </div>
        </div>

        {isManager && (
          <button onClick={() => handleOpenForm()} className="w-full xl:w-auto bg-slate-900 text-white px-12 py-6 rounded-[2.5rem] font-black shadow-2xl hover:scale-105 transition-all flex items-center justify-center gap-3">
            <Plus size={24} /> Yeni Ürün/Sarf Ekle
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
         {filteredProducts.map(p => {
            const totalRemainingML = (p.stock > 0 ? (p.stock - 1) * p.volumePerUnit : 0) + p.currentUnitRemaining;
            const sessionsLeft = p.usagePerSession > 0 ? Math.floor(totalRemainingML / p.usagePerSession) : 0;
            const fillPercent = (p.currentUnitRemaining / p.volumePerUnit) * 100;
            const isLowStock = p.stock <= p.lowStockThreshold;

            return (
              <div key={p.id} className={`bg-white rounded-[3rem] p-8 border shadow-xl group transition-all flex flex-col justify-between ${isLowStock ? 'border-rose-300 ring-4 ring-rose-500/5 animate-pulse-subtle' : 'border-slate-100 hover:border-rose-200'}`}>
                 <div>
                    <div className="flex justify-between items-start mb-6">
                        <div className={`p-4 rounded-2xl ${isLowStock ? 'bg-rose-500 text-white shadow-lg' : p.isProfessional ? 'bg-indigo-50 text-indigo-500' : 'bg-emerald-50 text-emerald-500'}`}>
                           {isLowStock ? <AlertCircle size={32}/> : p.isProfessional ? <Droplets size={32}/> : <ShoppingBag size={32}/>}
                        </div>
                        <div className="text-right">
                           <h4 className="font-black text-xl italic">{p.name}</h4>
                           <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{p.isProfessional ? 'Salon Sarf Malzemesi' : 'Perakende Ürün'}</p>
                           {isLowStock && <span className="inline-block mt-2 px-3 py-1 bg-rose-500 text-white text-[8px] font-black rounded-full uppercase tracking-widest animate-bounce">KRİTİK STOK</span>}
                        </div>
                    </div>

                    {p.isProfessional ? (
                       <div className="space-y-6 mb-8">
                          <div className="flex justify-between items-end mb-2">
                             <p className="text-[10px] font-black uppercase text-slate-400">Şişe Doluluk Oranı</p>
                             <p className="font-black text-slate-900 text-sm">{p.currentUnitRemaining} / {p.volumePerUnit} {p.unit}</p>
                          </div>
                          <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-50">
                             <div 
                               className={`h-full transition-all duration-1000 ${fillPercent < 20 ? 'bg-rose-500' : 'bg-emerald-500'}`} 
                               style={{ width: `${fillPercent}%` }}
                             ></div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                             <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Eldeki Kapalı Şişe</p>
                                <p className={`text-2xl font-black ${isLowStock ? 'text-rose-600' : 'text-slate-900'}`}>{p.stock > 0 ? p.stock - 1 : 0} <span className="text-xs">Adet</span></p>
                             </div>
                             <div className={`p-4 rounded-2xl border ${sessionsLeft < 10 ? 'bg-rose-50 border-rose-100' : 'bg-emerald-50 border-emerald-100'}`}>
                                <p className={`text-[9px] font-black uppercase mb-1 ${sessionsLeft < 10 ? 'text-rose-500' : 'text-emerald-500'}`}>Kalan Seans Sayısı</p>
                                <p className={`text-2xl font-black ${sessionsLeft < 10 ? 'text-rose-600' : 'text-emerald-600'}`}>{sessionsLeft} <span className="text-xs text-slate-400">Kişi</span></p>
                             </div>
                          </div>
                       </div>
                    ) : (
                        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 mb-8 text-center">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Mevcut Stok Adedi</p>
                            <p className={`text-5xl font-black ${isLowStock ? 'text-rose-500' : 'text-slate-900'}`}>{p.stock}</p>
                        </div>
                    )}
                 </div>

                 <div className="pt-6 border-t border-slate-50 flex justify-between items-center">
                    <div>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Maliyet / Satış</p>
                       <p className="font-black text-slate-900">{p.costPrice} TL <span className="text-slate-300 mx-1">/</span> {p.salePrice} TL</p>
                    </div>
                    {isManager && (
                       <div className="flex gap-2">
                          <button onClick={() => handleOpenForm(p)} className="p-3 bg-slate-50 text-slate-300 hover:text-indigo-600 rounded-xl transition-all"><Edit size={18}/></button>
                          <button onClick={(e) => { e.stopPropagation(); deleteData(p.id, 'PRODUCT'); }} className="p-3 bg-slate-50 text-slate-300 hover:text-rose-500 rounded-xl transition-all"><Trash2 size={18}/></button>
                       </div>
                    )}
                 </div>
              </div>
            );
         })}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-6">
          <div className="bg-white w-full max-w-2xl rounded-[4rem] p-16 shadow-3xl animate-in zoom-in-95 space-y-8 max-h-[90vh] overflow-y-auto no-scrollbar">
            <div className="flex justify-between items-center">
               <h3 className="text-4xl font-black tracking-tighter italic">Ürün & Dozaj Kaydı</h3>
               <button onClick={() => setShowForm(false)} className="p-4 bg-slate-100 rounded-full hover:bg-rose-500 hover:text-white transition-all"><X /></button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Input label="Ürün Adı" value={formData.name} onChange={v => setFormData({...formData, name: v})} />
              <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Kullanım Amacı</label>
                  <select 
                    value={formData.isProfessional ? 'true' : 'false'} 
                    onChange={e => setFormData({...formData, isProfessional: e.target.value === 'true'})}
                    className="w-full p-5 bg-slate-50 rounded-2xl font-black outline-none border border-transparent focus:border-slate-900"
                  >
                     <option value="true">Salon Sarf (Profesyonel)</option>
                     <option value="false">Satışlık Ürün (Retail)</option>
                  </select>
              </div>
              
              <Input label="Birim Hacim (ML/GR)" type="number" value={formData.volumePerUnit} onChange={v => setFormData({...formData, volumePerUnit: Number(v)})} />
              <Input label="Seans Başı Kullanım (ML/GR)" type="number" value={formData.usagePerSession} onChange={v => setFormData({...formData, usagePerSession: Number(v)})} />
              
              <Input label="Eldeki Toplam Stok (Adet)" type="number" value={formData.stock} onChange={v => setFormData({...formData, stock: Number(v)})} />
              <Input label="Kritik Stok Uyarı Eşiği" type="number" value={formData.lowStockThreshold} onChange={v => setFormData({...formData, lowStockThreshold: Number(v)})} />
              
              <Input label="Birim Maliyet (TL)" type="number" value={formData.costPrice} onChange={v => setFormData({...formData, costPrice: Number(v)})} />
              <Input label="Satış Fiyatı (TL)" type="number" value={formData.salePrice} onChange={v => setFormData({...formData, salePrice: Number(v)})} />
            </div>

            <button onClick={handleSave} className="w-full py-8 bg-slate-900 text-white rounded-[2.5rem] font-black text-2xl shadow-3xl hover:bg-rose-500 transition-all flex items-center justify-center gap-4">
               <Check size={28}/> Kaydı Tamamla
            </button>
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes pulse-subtle {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: .9; transform: scale(1.02); }
        }
        .animate-pulse-subtle {
          animation: pulse-subtle 2s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
};

const StatCard = ({ label, value, icon: Icon, color, sub, alert }: any) => {
    const colors: any = { indigo: 'bg-indigo-50 text-indigo-600', emerald: 'bg-emerald-50 text-emerald-600', rose: 'bg-rose-50 text-rose-600' };
    return (
        <div className={`p-8 rounded-[3rem] border shadow-sm transition-all ${alert ? 'bg-rose-500 text-white border-rose-500 shadow-xl animate-pulse-subtle' : 'bg-white border-slate-100 hover:border-slate-200'}`}>
            <div className="flex justify-between items-start mb-4">
                <div className={`p-4 rounded-2xl ${alert ? 'bg-white/20 text-white' : colors[color]}`}>
                    <Icon size={32} />
                </div>
                {alert && <AlertTriangle className="text-white animate-bounce" />}
            </div>
            <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${alert ? 'text-white/80' : 'text-slate-400'}`}>{label}</p>
            <p className={`text-4xl font-black italic tracking-tighter ${alert ? 'text-white' : 'text-slate-900'}`}>{value}</p>
            <p className={`text-xs font-bold mt-2 ${alert ? 'text-white/60' : 'text-slate-400'}`}>{sub}</p>
        </div>
    );
};

const TabButton = ({ label, active, onClick, icon: Icon, alert }: any) => (
    <button 
        onClick={onClick}
        className={`px-6 py-3 rounded-[1.5rem] text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all ${active ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}
    >
        {Icon && <Icon size={14} className={alert ? 'text-rose-500' : ''} />}
        {label}
    </button>
);

const Input = ({ label, value, onChange, type = 'text' }: any) => (
  <div>
    <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest">{label}</label>
    <input type={type} value={value} onChange={e => onChange(e.target.value)} className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black focus:border-slate-900 transition-all" />
  </div>
);
