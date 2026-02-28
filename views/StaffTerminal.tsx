import React, { useState, useMemo } from 'react';
import { useSalon } from '../store/SalonContext';
import { 
  Sparkles, ShoppingBag, Loader2, Send, Star, 
  CreditCard, Banknote, Landmark, Search, 
  Plus, Trash2, Minus, ReceiptText, User, 
  UserCheck, ChevronRight, X, CheckCircle2,
  History, Flame, Zap, BrainCircuit, Crown, TrendingUp,
  Package, Scissors, Box
} from 'lucide-react';

interface BasketItem {
  id: string;
  type: 'SERVICE' | 'PRODUCT' | 'PACKAGE';
  name: string;
  price: number;
  quantity: number;
}

export const StaffTerminal: React.FC = () => {
  const { customers, services, servicePackages, completeSale, staff, addNotification, transactions } = useSalon();
  
  // States
  const [selectedCustomer, setSelectedCustomer] = useState(customers[0]?.id || '');
  const [selectedStaff, setSelectedStaff] = useState(staff[0]?.id || '');
  const [paymentType, setPaymentType] = useState<'CASH' | 'CARD' | 'TRANSFER'>('CASH');
  const [rating, setRating] = useState(5);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Item Selection State
  const [activeTab, setActiveTab] = useState<'SERVICES' | 'PACKAGES'>('SERVICES');
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  
  const [basket, setBasket] = useState<BasketItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Filters
  const serviceCategories = ['ALL', 'SKIN_CARE', 'NAIL', 'DIET', 'GENERAL'];
  
  const filteredItems = useMemo(() => {
    if (activeTab === 'SERVICES') {
        return services.filter(s => {
            const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCat = activeCategory === 'ALL' || s.category === activeCategory;
            return matchesSearch && matchesCat;
        }).map(s => ({ ...s, type: 'SERVICE' as const }));
    } else {
        // Packages
        return servicePackages.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
            .map(p => ({ ...p, type: 'PACKAGE' as const, category: 'PACKAGE' }));
    }
  }, [services, servicePackages, searchTerm, activeCategory, activeTab]);

  // --- AI INSIGHT ENGINE ---
  const aiInsights = useMemo(() => {
    if (!selectedCustomer) return null;

    const customer = customers.find(c => c.id === selectedCustomer);
    if (!customer) return null;

    // Geçmiş İşlemler
    const history = transactions.filter(t => t.customerId === customer.id);
    
    // 1. Favori Personel
    const staffCounts: Record<string, number> = {};
    history.forEach(t => {
        staffCounts[t.staffId] = (staffCounts[t.staffId] || 0) + 1;
    });
    const favStaffId = Object.keys(staffCounts).sort((a, b) => staffCounts[b] - staffCounts[a])[0];
    const preferredStaff = staff.find(s => s.id === favStaffId);

    // 2. Öneriler
    const suggestions: { title: string, reason: string, item: any, icon: any, color: string }[] = [];

    // A) Son İşlem Tekrarı
    if (history.length > 0) {
        const lastTx = history.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
        if (lastTx && lastTx.items.length > 0) {
            const lastItem = lastTx.items[0];
            const originalService = services.find(s => s.id === lastItem.id);
            if (originalService) {
                suggestions.push({
                    title: originalService.name,
                    reason: 'Tekrarla',
                    item: { ...originalService, type: 'SERVICE' },
                    icon: History,
                    color: 'text-indigo-600 bg-indigo-50'
                });
            }
        }
    }

    // B) Paket Önerisi
    if (customer.dna.packagePropensity > 60) {
        const promoPackage = servicePackages[0];
        if (promoPackage) {
            suggestions.push({
                title: promoPackage.name,
                reason: 'Avantajlı Paket',
                item: { ...promoPackage, type: 'PACKAGE' },
                icon: Package,
                color: 'text-rose-600 bg-rose-50'
            });
        }
    }

    return { preferredStaff, suggestions, customer };
  }, [selectedCustomer, transactions, services, servicePackages, customers, staff]);

  const addToBasket = (item: any) => {
    setBasket(prev => {
      const exists = prev.find(i => i.id === item.id && i.type === item.type);
      if (exists) {
        return prev.map(i => 
          i.id === item.id && i.type === item.type ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { id: item.id, type: item.type, name: item.name, price: item.price, quantity: 1 }];
    });
  };

  const removeFromBasket = (id: string, type: string) => {
    setBasket(prev => prev.filter(item => !(item.id === id && item.type === type)));
  };

  const updateQuantity = (id: string, type: string, delta: number) => {
    setBasket(prev => prev.map(item => {
      if (item.id === id && item.type === type) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const totalPrice = basket.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleCompleteSale = async () => {
    if (basket.length === 0) return alert("Lütfen en az bir kalem ekleyin.");
    if (!selectedCustomer || !selectedStaff) return alert("Müşteri ve Uzman seçimi zorunludur.");

    setIsProcessing(true);
    try {
      const itemsForSale = basket.map(item => ({
        type: item.type,
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity
      }));

      completeSale(selectedCustomer, selectedStaff, itemsForSale, paymentType, rating);
      
      const customerName = customers.find(c => c.id === selectedCustomer)?.fullName;
      addNotification({
        type: 'SYSTEM',
        title: 'Satış Tamamlandı',
        message: `${customerName} için ${totalPrice.toLocaleString()} TL değerinde işlem yapıldı.`
      });

      setBasket([]);
      alert("İşlem başarıyla kaydedildi!");
    } catch (e) {
      console.error(e);
    }
    setIsProcessing(false);
  };

  return (
    <div className="flex flex-col xl:flex-row gap-10 animate-in fade-in duration-700 pb-20">
      {/* Sol Taraf: Hizmet/Paket Seçimi */}
      <div className="flex-1 space-y-8">
        {/* Personel ve Müşteri Seçimi */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4 relative group">
              <div className="absolute top-4 right-4 text-slate-300 group-hover:text-rose-500 transition-colors"><Search size={20}/></div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <User size={14} className="text-rose-500" /> Müşteri Profili
              </label>
              <select 
                value={selectedCustomer} 
                onChange={e => setSelectedCustomer(e.target.value)} 
                className="w-full p-4 bg-slate-50 rounded-2xl font-black text-slate-900 border-none outline-none focus:ring-2 focus:ring-rose-500/20 transition-all appearance-none cursor-pointer hover:bg-slate-100"
              >
                {customers.map(c => <option key={c.id} value={c.id}>{c.fullName}</option>)}
              </select>
           </div>
           <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <UserCheck size={14} className="text-indigo-500" /> Hizmeti Veren Uzman
              </label>
              <select 
                value={selectedStaff} 
                onChange={e => setSelectedStaff(e.target.value)} 
                className="w-full p-4 bg-slate-50 rounded-2xl font-black text-slate-900 border-none outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all appearance-none cursor-pointer hover:bg-slate-100"
              >
                {staff.map(s => <option key={s.id} value={s.id}>{s.name} ({s.role})</option>)}
              </select>
           </div>
        </div>

        {/* AI SMART INSIGHTS PANEL */}
        {aiInsights && (
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden animate-in slide-in-from-top-6">
             <div className="absolute top-0 right-0 p-8 opacity-10"><BrainCircuit size={150} /></div>
             
             <div className="flex items-center gap-3 mb-6 relative z-10">
                <Sparkles className="text-amber-400 animate-pulse" size={24} />
                <h3 className="text-xl font-black italic tracking-tighter">L'YSF AI Insight</h3>
                <span className="bg-white/10 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border border-white/10">
                    {aiInsights.customer.tier} Analizi
                </span>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
                {/* 1. Preferred Staff Suggestion */}
                {aiInsights.preferredStaff && (
                    <div 
                        onClick={() => setSelectedStaff(aiInsights.preferredStaff!.id)}
                        className={`p-4 rounded-[2rem] border border-white/10 bg-white/5 hover:bg-white/20 cursor-pointer transition-all flex flex-col justify-between group ${selectedStaff === aiInsights.preferredStaff.id ? 'ring-2 ring-emerald-500 bg-emerald-500/10' : ''}`}
                    >
                        <div className="flex justify-between items-start mb-2">
                            <div className="p-2 bg-indigo-500 rounded-xl"><UserCheck size={16} /></div>
                            {selectedStaff === aiInsights.preferredStaff.id && <CheckCircle2 size={16} className="text-emerald-400" />}
                        </div>
                        <div>
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-1">Favori Uzman</p>
                            <p className="font-black italic text-lg leading-tight">{aiInsights.preferredStaff.name}</p>
                        </div>
                    </div>
                )}

                {/* 2. Item Suggestions */}
                {aiInsights.suggestions.map((rec, idx) => (
                   <div 
                     key={idx}
                     onClick={() => addToBasket(rec.item)}
                     className="p-4 rounded-[2rem] bg-white text-slate-900 flex flex-col justify-between cursor-pointer hover:scale-105 transition-all shadow-lg group relative overflow-hidden"
                   >
                      <div className={`absolute top-0 right-0 w-16 h-16 rounded-bl-full opacity-10 transition-colors ${rec.color.split(' ')[0].replace('text', 'bg')}`}></div>
                      <div className="flex justify-between items-start mb-2 relative z-10">
                         <div className={`p-2 rounded-xl ${rec.color}`}>
                            <rec.icon size={16} />
                         </div>
                         <Plus size={16} className="text-slate-300 group-hover:text-slate-900 transition-colors" />
                      </div>
                      <div className="relative z-10">
                         <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">{rec.reason}</p>
                         <p className="font-black italic text-sm leading-tight mb-1">{rec.title}</p>
                         <p className="text-xs font-bold text-emerald-600">{rec.item.price} TL</p>
                      </div>
                   </div>
                ))}
             </div>
          </div>
        )}

        {/* Ana Seçim Alanı */}
        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm space-y-8">
           <div className="flex flex-col xl:flex-row justify-between gap-6 items-center">
              {/* Tabs */}
              <div className="flex p-1.5 bg-slate-100 rounded-2xl">
                  <button onClick={() => setActiveTab('SERVICES')} className={`px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'SERVICES' ? 'bg-white shadow-lg text-slate-900' : 'text-slate-400'}`}>
                      <Scissors size={14}/> Hizmetler
                  </button>
                  <button onClick={() => setActiveTab('PACKAGES')} className={`px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'PACKAGES' ? 'bg-white shadow-lg text-slate-900' : 'text-slate-400'}`}>
                      <Package size={14}/> Paketler
                  </button>
              </div>

              {/* Category Filter (Only for Services) */}
              {activeTab === 'SERVICES' && (
                  <div className="flex bg-slate-50 p-1.5 rounded-2xl gap-1 overflow-x-auto no-scrollbar max-w-full">
                     {serviceCategories.map(cat => (
                       <button 
                        key={cat} 
                        onClick={() => setActiveCategory(cat)}
                        className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeCategory === cat ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-900'}`}
                       >
                         {cat === 'ALL' ? 'HEPSİ' : cat.replace('_', ' ')}
                       </button>
                     ))}
                  </div>
              )}
           </div>

           {/* Search Input */}
           <div className="relative group">
                 <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-hover:text-slate-900 transition-colors" size={20} />
                 <input 
                    type="text" 
                    placeholder={activeTab === 'SERVICES' ? "Hizmet ara..." : "Paket ara..."}
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-14 pr-6 py-4 bg-slate-50 border-none rounded-2xl font-black outline-none focus:ring-2 focus:ring-slate-200"
                 />
           </div>

           {/* Grid List */}
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredItems.map(item => (
                <button 
                  key={item.id} 
                  onClick={() => addToBasket(item)}
                  className="p-6 bg-white border border-slate-100 rounded-[2rem] text-left transition-all hover:border-rose-200 hover:shadow-xl hover:-translate-y-1 group relative overflow-hidden flex flex-col justify-between min-h-[140px]"
                >
                   <div className="absolute -right-4 -top-4 w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 opacity-0 group-hover:opacity-100 transition-all group-hover:-translate-x-6 group-hover:translate-y-6">
                      <Plus size={20} />
                   </div>
                   
                   <div>
                       <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${item.type === 'PACKAGE' ? 'text-indigo-500' : 'text-rose-500'}`}>
                           {item.type === 'PACKAGE' ? 'AVANTAJ PAKETİ' : (item as any).category.replace('_', ' ')}
                       </p>
                       <p className="font-black text-slate-900 text-lg mb-2 leading-tight">{item.name}</p>
                   </div>
                   
                   <p className="text-2xl font-black text-slate-900 tracking-tighter">
                       {item.price.toLocaleString()} <span className="text-sm font-bold text-slate-400">TL</span>
                   </p>
                </button>
              ))}
           </div>
        </div>
      </div>

      {/* Sağ Taraf: Adisyon ve Ödeme Paneli */}
      <div className="w-full xl:w-[450px] space-y-8">
         <div className="bg-white rounded-[4rem] shadow-2xl border border-slate-100 flex flex-col min-h-[700px] overflow-hidden sticky top-32">
            <div className="p-10 bg-slate-900 text-white">
               <div className="flex justify-between items-center mb-6">
                  <h3 className="text-3xl font-black tracking-tighter italic flex items-center gap-3">
                    <ReceiptText className="text-rose-500" /> ADİSYON
                  </h3>
                  <div className="bg-white/10 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">NO: #{Date.now().toString().slice(-6)}</div>
               </div>
               <div className="flex items-center gap-3 text-slate-400 text-xs font-bold">
                  <User size={14}/> {customers.find(c => c.id === selectedCustomer)?.fullName || 'Müşteri Seçilmedi'}
               </div>
            </div>

            <div className="flex-1 p-10 overflow-y-auto max-h-[400px] no-scrollbar space-y-6">
               {basket.length === 0 ? (
                 <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-30 py-20">
                    <ShoppingBag size={64} className="text-slate-200" />
                    <p className="font-black text-slate-400 uppercase tracking-widest text-xs">Sepetiniz Boş</p>
                 </div>
               ) : (
                 basket.map(item => (
                   <div key={item.id + item.type} className="flex justify-between items-center animate-in slide-in-from-right-4">
                      <div className="flex-1">
                         <div className="flex items-center gap-2">
                             {item.type === 'PACKAGE' && <Package size={12} className="text-indigo-500"/>}
                             <h5 className="font-black text-slate-900 italic">{item.name}</h5>
                         </div>
                         <p className="text-xs font-bold text-slate-400">{item.price.toLocaleString()} TL / adet</p>
                      </div>
                      <div className="flex items-center gap-4">
                         <div className="flex items-center bg-slate-100 rounded-xl overflow-hidden">
                            <button onClick={() => updateQuantity(item.id, item.type, -1)} className="p-2 hover:bg-slate-200 text-slate-500 transition-colors"><Minus size={14}/></button>
                            <span className="w-8 text-center font-black text-sm">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, item.type, 1)} className="p-2 hover:bg-slate-200 text-slate-500 transition-colors"><Plus size={14}/></button>
                         </div>
                         <button onClick={() => removeFromBasket(item.id, item.type)} className="p-2 text-slate-300 hover:text-rose-500 transition-colors"><Trash2 size={18}/></button>
                      </div>
                   </div>
                 ))
               )}
            </div>

            <div className="p-10 bg-slate-50 space-y-8">
               <div className="space-y-4">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Ödeme Yöntemi</p>
                  <div className="flex gap-3">
                     <PaymentMethodBtn active={paymentType==='CASH'} onClick={()=>setPaymentType('CASH')} icon={Banknote} label="Nakit" />
                     <PaymentMethodBtn active={paymentType==='CARD'} onClick={()=>setPaymentType('CARD')} icon={CreditCard} label="Kart" />
                     <PaymentMethodBtn active={paymentType==='TRANSFER'} onClick={()=>setPaymentType('TRANSFER')} icon={Landmark} label="Havale" />
                  </div>
               </div>

               <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Müşteri Puanı</p>
                    <div className="flex gap-1">
                      {[1,2,3,4,5].map(s => (
                        <button key={s} onClick={()=>setRating(s)} className={`transition-all ${rating >= s ? 'text-amber-400 scale-110' : 'text-slate-200 hover:text-slate-300'}`}>
                          <Star size={16} fill={rating >= s ? "currentColor" : "none"} />
                        </button>
                      ))}
                    </div>
                  </div>
               </div>

               <div className="pt-8 border-t border-slate-200 space-y-6">
                  <div className="flex justify-between items-end">
                     <p className="text-sm font-black text-slate-400 uppercase tracking-widest">TOPLAM TUTAR</p>
                     <p className="text-5xl font-black text-slate-900 tracking-tighter">{totalPrice.toLocaleString()} <span className="text-lg">TL</span></p>
                  </div>
                  <button 
                    onClick={handleCompleteSale}
                    disabled={isProcessing || basket.length === 0}
                    className="w-full py-8 bg-slate-900 text-white rounded-[2.5rem] font-black text-2xl shadow-3xl flex items-center justify-center gap-4 transition-all hover:bg-black active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                  >
                     {isProcessing ? <Loader2 className="animate-spin" size={32} /> : <CheckCircle2 size={32} />}
                     {isProcessing ? 'İŞLENİYOR...' : 'SATIŞI TAMAMLA'}
                  </button>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

const PaymentMethodBtn = ({ active, onClick, icon: Icon, label }: any) => (
  <button 
    onClick={onClick} 
    className={`flex-1 flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all ${active ? 'border-slate-900 bg-slate-900 text-white shadow-xl scale-105' : 'border-slate-200 text-slate-400 hover:border-slate-300'}`}
  >
    <Icon size={20}/>
    <span className="text-[9px] font-black uppercase tracking-tighter">{label}</span>
  </button>
);