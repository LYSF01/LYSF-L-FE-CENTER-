
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useSalon } from '../store/SalonContext';
import { MembershipTier, Customer, UserRole, Transaction } from '../types';
import { 
  User, Phone, Trash2, Edit, Plus, X, 
  Zap, Filter, FileText, Scale, 
  Upload, FileSpreadsheet, Printer, AlertCircle, CreditCard, Star, QrCode,
  CalendarClock, Coffee, MessageCircle, CheckCircle2, History, Banknote, Image, Camera, Stamp, CalendarPlus, MoreHorizontal, Trophy, Minus, RefreshCw, Gift, Sparkles, PenTool, Lock, Eye, TrendingUp, Activity, Receipt,
  Loader2, ArrowDown, Copy, CheckSquare, Square, Send, Video, UserCheck, Clock, Sun, Apple
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { isDemoMode } from '../firebaseConfig';

export const CustomerCRM: React.FC = () => {
  const { customers, staff, deleteData, currentRole, addCustomer, updateCustomer, transactions, appointments, loyaltyRules, services, searchCustomers, loadMoreCustomers, hasMoreCustomers, isLoadingCustomers, initiateCall } = useSalon();
  const [filter, setFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showCardModal, setShowCardModal] = useState<Customer | null>(null);
  const [showDietModal, setShowDietModal] = useState<Customer | null>(null);
  const [showGalleryModal, setShowGalleryModal] = useState<Customer | null>(null);
  const [showLoyaltyStampModal, setShowLoyaltyStampModal] = useState<Customer | null>(null);
  const [crmActiveTab, setCrmActiveTab] = useState<'OVERVIEW' | 'HISTORY' | 'APPOINTMENTS' | 'ANALYSIS' | 'WELLNESS' | 'NOTES'>('OVERVIEW');
  const [editItem, setEditItem] = useState<Customer | null>(null);
  const [filterMode, setFilterMode] = useState<'ALL' | 'INACTIVE' | 'NO_PACKAGE' | 'DUE_FOR_VISIT'>('ALL');
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [tempCustomPrices, setTempCustomPrices] = useState<Record<string, number>>({});
  const [contextMenu, setContextMenu] = useState<{ visible: boolean; x: number; y: number; customer: Customer | null }>({
    visible: false, x: 0, y: 0, customer: null
  });

  const isManager = currentRole === 'MANAGER';
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<any>(null);

  useEffect(() => {
    const handleClick = () => setContextMenu({ ...contextMenu, visible: false });
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [contextMenu]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setFilter(val);
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = setTimeout(() => {
          if (!isDemoMode) searchCustomers(val);
      }, 500);
  };

  const handleContextMenu = (e: React.MouseEvent, customer: Customer) => {
    e.preventDefault();
    setContextMenu({ visible: true, x: e.pageX, y: e.pageY, customer });
  };

  const enrichedCustomers = useMemo(() => {
    return customers.map(c => {
      const customerTx = transactions
        .filter(t => t.customerId === c.id)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      const lastVisitDate = customerTx.length > 0 ? new Date(customerTx[0].timestamp) : null;
      const daysSinceLastVisit = lastVisitDate ? Math.floor((new Date().getTime() - lastVisitDate.getTime()) / (1000 * 3600 * 24)) : -1;
      const hasActivePackage = c.packages && c.packages.some(p => p.remainingSessions > 0);
      return { ...c, lastVisitDate, daysSinceLastVisit, isDue: daysSinceLastVisit >= 21, isInactive: daysSinceLastVisit > 30 || daysSinceLastVisit === -1, hasActivePackage };
    });
  }, [customers, transactions]);

  // Use this memo to get the live data for the modal, ensuring updates (like new transactions) reflect immediately
  const displayCustomer = useMemo(() => {
      if (!showCardModal) return null;
      return enrichedCustomers.find(c => c.id === showCardModal.id) || showCardModal;
  }, [showCardModal, enrichedCustomers]);

  const filtered = enrichedCustomers.filter(c => {
    const matchesSearch = isDemoMode ? (c.fullName.toLowerCase().includes(filter.toLowerCase()) || c.phone.includes(filter)) : true;
    let matchesMode = true;
    if (filterMode === 'DUE_FOR_VISIT') matchesMode = c.isDue;
    if (filterMode === 'INACTIVE') matchesMode = c.isInactive;
    if (filterMode === 'NO_PACKAGE') matchesMode = !c.hasActivePackage;
    return matchesSearch && matchesMode;
  });

  const dueCount = enrichedCustomers.filter(c => c.isDue).length;

  const sendWhatsApp = (customer: typeof enrichedCustomers[0], type: 'REMINDER' | 'PROMO' | 'BIRTHDAY') => {
    const phone = customer.phone.replace(/\D/g, '');
    let message = type === 'REMINDER' ? `Merhaba ${customer.fullName}, L'YSF Life Center ailesi olarak sizi özledik! 🌸` : `Merhaba ${customer.fullName}, VIP üyelerimize özel yeni sezon bakımlarımız başladı! 💖`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const toggleSelection = (id: string) => {
      const newSet = new Set(selectedCustomerIds);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      setSelectedCustomerIds(newSet);
  };

  const selectAll = () => {
      if (selectedCustomerIds.size === filtered.length) setSelectedCustomerIds(new Set());
      else setSelectedCustomerIds(new Set(filtered.map(c => c.id)));
  };

  const handleBulkCopyNumbers = () => {
      const selected = filtered.filter(c => selectedCustomerIds.has(c.id));
      const numbers = selected.map(c => c.phone).join('\n');
      navigator.clipboard.writeText(numbers);
      alert(`${selected.length} kişinin telefon numarası kopyalandı!`);
  };

  const exportToCSV = () => {
    const headers = ["ID", "Ad Soyad", "Telefon", "Tier", "Son Ziyaret (Gün)", "Puan"];
    const rows = enrichedCustomers.map(c => [c.id, c.fullName, c.phone, c.tier, c.daysSinceLastVisit, c.dna.loyaltyPuan]);
    // Added \uFEFF for BOM to support UTF-8 characters properly in Excel
    const csvContent = "\uFEFF" + "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `LYSF_Musteri_Listesi.csv`);
    document.body.appendChild(link);
    link.click();
  };

  const handlePrint = () => window.print();

  const handleOpenEdit = (c: Customer | null) => {
      setEditItem(c);
      setTempCustomPrices(c?.specialPriceList || {});
      setShowModal(true);
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && showGalleryModal) {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64 = reader.result as string;
            const updatedGallery = [...(showGalleryModal.gallery || []), base64];
            const updatedCustomer = { ...showGalleryModal, gallery: updatedGallery };
            updateCustomer(updatedCustomer);
            setShowGalleryModal(updatedCustomer);
        };
        reader.readAsDataURL(file);
    }
  };

  const handleDeletePhoto = (index: number) => {
      if (showGalleryModal) {
          const updatedGallery = showGalleryModal.gallery.filter((_, i) => i !== index);
          const updatedCustomer = { ...showGalleryModal, gallery: updatedGallery };
          updateCustomer(updatedCustomer);
          setShowGalleryModal(updatedCustomer);
      }
  };

  const updateStampCount = (customerId: string, type: 'skinCare' | 'nail', change: number) => {
      const customer = customers.find(c => c.id === customerId);
      if (!customer) return;
      const currentStamps = customer.loyaltyStamps || { skinCare: 0, nail: 0 };
      const currentVal = currentStamps[type] || 0;
      let newVal = currentVal + change;
      if (newVal < 0) newVal = 0;
      if (newVal > 6) newVal = 6;
      const updatedStamps = { ...currentStamps, [type]: newVal };
      const updatedCustomer = { ...customer, loyaltyStamps: updatedStamps };
      updateCustomer(updatedCustomer);
      setShowLoyaltyStampModal(updatedCustomer);
  };

  const resetStampCard = (customerId: string, type: 'skinCare' | 'nail') => {
      const customer = customers.find(c => c.id === customerId);
      if (!customer) return;
      const currentStamps = customer.loyaltyStamps || { skinCare: 0, nail: 0 };
      const updatedStamps = { ...currentStamps, [type]: 0 };
      const updatedCustomer = { ...customer, loyaltyStamps: updatedStamps };
      updateCustomer(updatedCustomer);
      setShowLoyaltyStampModal(updatedCustomer);
  };

  const handleStartCall = (customer: Customer) => {
      if(confirm(`${customer.fullName} ile görüntülü görüşme başlatılsın mı? (Müşteri online olmalıdır)`)) {
          initiateCall(customer.id, 'VIDEO');
          alert("Arama başlatıldı. Karşı tarafın yanıtlaması bekleniyor...");
      }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20 print:p-0 relative">
      {/* HEADER & FILTERS */}
      <div className="flex flex-col xl:flex-row gap-6 items-center print:hidden justify-between">
        <div className="flex flex-col md:flex-row gap-4 w-full xl:w-auto">
             <div className="relative flex-1 xl:w-80 group">
                <Filter className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-hover:text-slate-900 transition-colors" size={24} />
                <input placeholder={isDemoMode ? "Müşteri Ara..." : "Bulut Arama (İsim Giriniz)..."} value={filter} onChange={handleSearchChange} className="w-full pl-16 p-6 bg-white border border-slate-100 rounded-[2.5rem] outline-none font-black shadow-sm focus:ring-4 focus:ring-slate-100 transition-all text-xl" />
                {isLoadingCustomers && <Loader2 className="absolute right-6 top-1/2 -translate-y-1/2 animate-spin text-slate-400" size={24} />}
            </div>
            <div className="flex gap-2 bg-white p-2 rounded-[2.5rem] border border-slate-100 shadow-sm overflow-x-auto no-scrollbar max-w-full">
                <FilterButton label="Tümü" active={filterMode === 'ALL'} onClick={() => setFilterMode('ALL')} icon={User} />
                <FilterButton label={`Bakım Alarmı (${dueCount})`} active={filterMode === 'DUE_FOR_VISIT'} onClick={() => setFilterMode('DUE_FOR_VISIT')} icon={CalendarClock} alert />
                <FilterButton label="Uyuyanlar (30+ Gün)" active={filterMode === 'INACTIVE'} onClick={() => setFilterMode('INACTIVE')} icon={History} />
                <FilterButton label="Paketsizler" active={filterMode === 'NO_PACKAGE'} onClick={() => setFilterMode('NO_PACKAGE')} icon={AlertCircle} />
            </div>
        </div>
        <div className="flex gap-4">
            <button onClick={() => setIsSelectionMode(!isSelectionMode)} className={`p-6 rounded-[2.5rem] transition-all shadow-xl font-black text-sm uppercase flex items-center gap-2 ${isSelectionMode ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border border-slate-100 hover:border-indigo-200'}`}>{isSelectionMode ? <CheckSquare size={24}/> : <Square size={24}/>} Seç</button>
            <button onClick={exportToCSV} className="p-6 bg-emerald-50 text-emerald-600 rounded-[2.5rem] hover:bg-emerald-600 hover:text-white transition-all shadow-xl"><FileSpreadsheet size={28} /></button>
            <button onClick={handlePrint} className="p-6 bg-slate-100 text-slate-600 rounded-[2.5rem] hover:bg-slate-900 hover:text-white transition-all shadow-xl"><Printer size={28} /></button>
            {isManager && <button onClick={() => handleOpenEdit(null)} className="bg-slate-900 text-white px-12 py-7 rounded-[2.5rem] font-black flex items-center gap-3 shadow-2xl hover:scale-105 transition-all text-lg"><Plus size={28} /> Yeni Kayıt</button>}
        </div>
      </div>

      {isSelectionMode && (
          <div className="sticky top-2 z-20 flex justify-between items-center bg-slate-900 text-white p-4 rounded-[2rem] shadow-2xl animate-in slide-in-from-top-5 mx-4">
              <div className="flex items-center gap-4">
                  <button onClick={selectAll} className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-xl hover:bg-white/20 transition-all text-sm font-bold"><CheckCircle2 size={16}/> {selectedCustomerIds.size === filtered.length ? 'Hepsini Bırak' : 'Hepsini Seç'}</button>
                  <span className="font-black text-lg">{selectedCustomerIds.size} Kişi Seçildi</span>
              </div>
              <div className="flex items-center gap-2">
                  <button onClick={handleBulkCopyNumbers} className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-xl font-black uppercase text-xs tracking-widest hover:bg-emerald-600 transition-all shadow-lg"><Copy size={16}/> Numaraları Kopyala</button>
                  <button onClick={() => { if(selectedCustomerIds.size > 0) alert('Toplu mesaj özelliği için WhatsApp Business API entegrasyonu gerekmektedir.'); }} className="flex items-center gap-2 px-6 py-3 bg-indigo-500 text-white rounded-xl font-black uppercase text-xs tracking-widest hover:bg-indigo-600 transition-all shadow-lg"><Send size={16}/> Toplu Mesaj</button>
                  <button onClick={() => setIsSelectionMode(false)} className="p-3 bg-white/10 rounded-full hover:bg-rose-500 transition-all ml-4"><X size={20}/></button>
              </div>
          </div>
      )}

      {/* CUSTOMER CARDS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-10">
        {filtered.map(customer => (
          <div 
             key={customer.id} 
             onContextMenu={(e) => handleContextMenu(e, customer)}
             onClick={() => isSelectionMode && toggleSelection(customer.id)}
             className={`bg-white rounded-[4rem] border shadow-xl overflow-hidden group transition-all duration-500 flex flex-col relative cursor-context-menu hover:-translate-y-3 hover:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] ${isSelectionMode && selectedCustomerIds.has(customer.id) ? 'ring-4 ring-indigo-500 border-indigo-500 scale-[0.98]' : customer.isDue ? 'border-rose-200 ring-4 ring-rose-500/5' : 'border-slate-100 hover:border-indigo-200'}`}
          >
            {/* Hover Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 via-transparent to-rose-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

            {isSelectionMode && <div className="absolute top-4 right-4 z-20"><div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${selectedCustomerIds.has(customer.id) ? 'bg-indigo-500 border-indigo-500 text-white' : 'bg-white border-slate-300 text-transparent'}`}><CheckCircle2 size={20} /></div></div>}
            
            {customer.isDue ? (
               <div className="absolute top-0 left-0 w-full bg-rose-500 text-white py-2 text-center text-[10px] font-black uppercase tracking-[0.3em] animate-pulse z-20">⚠️ Bakım Zamanı Geçti ({customer.daysSinceLastVisit} Gün)</div>
            ) : (
               customer.daysSinceLastVisit !== -1 && <div className="absolute top-8 right-8 bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1 z-10"><CheckCircle2 size={10} /> Düzenli ({customer.daysSinceLastVisit} Gün)</div>
            )}
            
            <div className="p-10 space-y-8 flex-1 mt-4 relative z-10">
              <div className="flex justify-between items-start">
                <button 
                    onClick={(e) => { e.stopPropagation(); setShowCardModal(customer); setCrmActiveTab('OVERVIEW'); }} 
                    className="w-20 h-20 bg-slate-900 rounded-[2rem] flex items-center justify-center text-white shadow-xl group-hover:scale-110 group-hover:rotate-6 group-hover:bg-indigo-600 transition-all duration-500"
                >
                    <CreditCard size={32} />
                </button>
                <div className="text-right">
                    <span className="px-4 py-2 rounded-full text-[8px] font-black bg-slate-900 text-white uppercase tracking-widest group-hover:bg-indigo-600 transition-colors duration-500">{customer.tier}</span>
                    <p className="mt-2 text-xs font-black text-rose-500 uppercase tracking-widest flex items-center justify-end gap-1"><Trophy size={12} /> {customer.dna.loyaltyPuan} PUAN</p>
                </div>
              </div>

              <div>
                <h3 className="text-3xl font-black text-slate-900 tracking-tighter italic group-hover:text-indigo-900 transition-colors duration-300">{customer.fullName}</h3>
                <div className="flex items-center gap-4 mt-2">
                    <p className="text-slate-400 font-bold tracking-widest flex items-center gap-2 text-xs"><Phone size={12} /> {customer.phone}</p>
                    {customer.preferences.drink && <div className="flex items-center gap-2 px-3 py-1 bg-amber-50 rounded-full border border-amber-100 group-hover:bg-amber-100 transition-colors"><Coffee size={12} className="text-amber-600"/><span className="text-[9px] font-black text-amber-700 uppercase tracking-tight truncate max-w-[100px]">{customer.preferences.drink}</span></div>}
                </div>
              </div>
              
              <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 flex justify-between items-center group-hover:bg-white/80 group-hover:border-slate-200 transition-all">
                  <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Son İşlem</p><p className="text-sm font-bold text-slate-700">{customer.lastVisitDate ? customer.lastVisitDate.toLocaleDateString('tr-TR') : 'Henüz Yok'}</p></div>
                  <div className="text-right"><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Toplam Harcama</p><p className="text-sm font-black text-slate-900">{(customer.dna.totalSpent || 0).toLocaleString()} TL</p></div>
              </div>
            </div>
            
            <div className="px-10 py-8 bg-slate-900 flex justify-between items-center print:hidden relative z-10">
              <div className="flex gap-2">
                 <button onClick={(e) => { e.stopPropagation(); sendWhatsApp(customer, 'REMINDER'); }} title="Otomatik Hatırlatma" className={`p-4 rounded-2xl transition-all shadow-lg flex items-center gap-3 hover:scale-110 active:scale-95 duration-300 ${customer.isDue ? 'bg-rose-500 text-white hover:bg-rose-600 animate-pulse-subtle' : 'bg-emerald-500 text-white hover:bg-emerald-600'}`}><MessageCircle size={20}/>{customer.isDue && <span className="text-[9px] font-black uppercase">ÇAĞIR</span>}</button>
                 <button onClick={(e) => { e.stopPropagation(); setShowLoyaltyStampModal(customer); }} title="Sadakat Kartı" className="p-4 bg-amber-500 text-white rounded-2xl hover:bg-amber-600 transition-all shadow-lg hover:scale-110 active:scale-95 duration-300"><Stamp size={20}/></button>
                 <button onClick={(e) => { e.stopPropagation(); handleStartCall(customer); }} title="Görüntülü Ara" className="p-4 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all shadow-lg hover:scale-110 active:scale-95 duration-300"><Video size={20}/></button>
              </div>
              <div className="flex gap-2">
                 <button onClick={(e) => { e.stopPropagation(); setShowGalleryModal(customer); }} className="p-4 bg-white/10 text-rose-400 rounded-2xl hover:bg-white/20 hover:text-rose-300 hover:-translate-y-1 transition-all" title="Galeri"><Image size={18}/></button>
                 <button onClick={(e) => { e.stopPropagation(); setShowDietModal(customer); }} className="p-4 bg-white/10 text-emerald-400 rounded-2xl hover:bg-white/20 hover:text-emerald-300 hover:-translate-y-1 transition-all" title="Vücut Analizi"><Scale size={18}/></button>
                 <button onClick={(e) => { e.stopPropagation(); handleOpenEdit(customer); }} className="p-4 text-white/40 hover:text-white hover:-translate-y-1 transition-all" title="Düzenle"><Edit size={18}/></button>
                 {isManager && <button onClick={(e) => { e.stopPropagation(); deleteData(customer.id, 'CUSTOMER'); }} className="p-4 text-rose-500/60 hover:text-rose-500 hover:-translate-y-1 transition-all" title="Sil"><Trash2 size={18}/></button>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {contextMenu.visible && contextMenu.customer && (
        <div className="fixed z-[999] bg-slate-900 text-white p-2 rounded-2xl shadow-3xl min-w-[200px] animate-in zoom-in-95" style={{ top: contextMenu.y, left: contextMenu.x }}>
           <div className="px-4 py-3 border-b border-white/10 mb-2"><p className="font-black italic truncate">{contextMenu.customer.fullName}</p><p className="text-[9px] text-slate-400 uppercase tracking-widest">Hızlı İşlemler</p></div>
           <button onClick={() => sendWhatsApp(contextMenu.customer as any, 'REMINDER')} className="w-full text-left px-4 py-3 hover:bg-white/10 rounded-xl flex items-center gap-3 text-sm font-bold transition-all text-emerald-400"><MessageCircle size={16} /> WhatsApp</button>
           <button onClick={() => handleStartCall(contextMenu.customer as any)} className="w-full text-left px-4 py-3 hover:bg-white/10 rounded-xl flex items-center gap-3 text-sm font-bold transition-all text-indigo-400"><Video size={16} /> Görüntülü Ara</button>
           <button onClick={() => { setShowCardModal(contextMenu.customer); setCrmActiveTab('OVERVIEW'); }} className="w-full text-left px-4 py-3 hover:bg-white/10 rounded-xl flex items-center gap-3 text-sm font-bold transition-all"><CreditCard size={16} /> Dijital Kart</button>
           <button onClick={() => { setShowLoyaltyStampModal(contextMenu.customer); }} className="w-full text-left px-4 py-3 hover:bg-white/10 rounded-xl flex items-center gap-3 text-sm font-bold transition-all text-amber-400"><Stamp size={16} /> Damga Bas</button>
           <div className="h-px bg-white/10 my-2"></div>
           <button onClick={() => { handleOpenEdit(contextMenu.customer); }} className="w-full text-left px-4 py-3 hover:bg-white/10 rounded-xl flex items-center gap-3 text-sm font-bold transition-all"><Edit size={16} /> Düzenle</button>
           {isManager && <button onClick={(e) => { e.stopPropagation(); deleteData(contextMenu.customer!.id, 'CUSTOMER'); setContextMenu({...contextMenu, visible: false}); }} className="w-full text-left px-4 py-3 hover:bg-rose-500/20 text-rose-500 rounded-xl flex items-center gap-3 text-sm font-bold transition-all"><Trash2 size={16} /> Sil</button>}
        </div>
      )}

      {showGalleryModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 animate-in fade-in">
            <div className="bg-slate-900 w-full max-w-5xl h-[80vh] rounded-[3rem] border border-white/10 shadow-3xl flex flex-col relative overflow-hidden">
                <div className="p-8 border-b border-white/10 flex justify-between items-center bg-slate-900/50 backdrop-blur-md z-10">
                    <div><h3 className="text-3xl font-black text-white italic tracking-tighter flex items-center gap-3"><Image className="text-rose-500"/> Gelişim Galerisi</h3><p className="text-slate-400 font-bold uppercase tracking-widest text-xs mt-1">{showGalleryModal.fullName} - Öncesi & Sonrası</p></div>
                    <div className="flex gap-4"><label className="px-6 py-3 bg-emerald-500 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-emerald-600 transition-all cursor-pointer flex items-center gap-2 shadow-lg hover:scale-105 active:scale-95"><Camera size={16}/> Fotoğraf Ekle<input type="file" accept="image/*" className="hidden" onChange={handleGalleryUpload}/></label><button onClick={() => setShowGalleryModal(null)} className="p-3 bg-white/10 text-white rounded-full hover:bg-rose-500 transition-all"><X size={20}/></button></div>
                </div>
                <div className="flex-1 overflow-y-auto p-8 bg-[#0b1120] no-scrollbar">
                    {(!showGalleryModal.gallery || showGalleryModal.gallery.length === 0) ? <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-4 opacity-50"><Image size={64} /><p className="font-black text-xl italic">Henüz fotoğraf yüklenmemiş.</p></div> : 
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">{showGalleryModal.gallery.map((img, idx) => (<div key={idx} className="aspect-square rounded-[2rem] overflow-hidden relative group border border-white/5 bg-slate-800 shadow-xl"><img src={img} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" /><div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 backdrop-blur-sm"><button onClick={() => window.open(img, '_blank')} className="p-3 bg-white/20 text-white rounded-full hover:bg-emerald-500 transition-all" title="Büyüt"><Eye size={20}/></button><button onClick={(e) => { e.stopPropagation(); handleDeletePhoto(idx); }} className="p-3 bg-white/20 text-white rounded-full hover:bg-rose-500 transition-all" title="Sil"><Trash2 size={20}/></button></div><div className="absolute bottom-4 left-4 bg-black/60 px-3 py-1 rounded-lg text-[9px] font-black text-white uppercase tracking-widest backdrop-blur-md border border-white/10">Foto #{idx + 1}</div></div>))}</div>
                    }
                </div>
            </div>
        </div>
      )}

      {showLoyaltyStampModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4">
              <div className="bg-slate-900 border border-white/10 w-full max-w-2xl rounded-[4rem] p-12 shadow-3xl animate-in zoom-in-95 relative overflow-hidden">
                  <button onClick={() => setShowLoyaltyStampModal(null)} className="absolute top-10 right-10 p-4 bg-white/10 text-white rounded-full hover:bg-rose-500 transition-all z-20"><X /></button>
                  <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-400 via-rose-500 to-indigo-600"></div>
                  <div className="text-center mb-12"><div className="w-24 h-24 mx-auto bg-amber-500/20 text-amber-500 rounded-[2.5rem] flex items-center justify-center mb-6 shadow-xl border border-amber-500/20"><Stamp size={48} /></div><h3 className="text-4xl font-black italic tracking-tighter text-white">Damga Terminali</h3><p className="text-slate-400 font-bold uppercase tracking-widest mt-2">{showLoyaltyStampModal.fullName}</p></div>
                  <div className="space-y-8">
                      {['skinCare', 'nail'].map((cat: 'skinCare' | 'nail') => {
                          const current = showLoyaltyStampModal.loyaltyStamps?.[cat] || 0;
                          const isRewardAvailable = current === 6; 
                          return (
                              <div key={cat} className="bg-white/5 border border-white/10 p-8 rounded-[3rem] relative overflow-hidden group hover:border-white/20 transition-all">
                                  {isRewardAvailable && <div className="absolute inset-0 bg-emerald-500/10 z-0 pointer-events-none animate-pulse"></div>}
                                  <div className="relative z-10">
                                      <div className="flex justify-between items-center mb-6"><h4 className="text-xl font-black uppercase text-white italic flex items-center gap-2">{cat === 'skinCare' ? <Sparkles className="text-amber-400" /> : <PenTool className="text-rose-400" />}{cat === 'skinCare' ? 'Cilt Bakımı' : 'Nail Art'}</h4><div className="flex items-center gap-4 bg-black/30 p-2 rounded-full border border-white/10"><button onClick={() => updateStampCount(showLoyaltyStampModal.id, cat, -1)} className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-rose-500 text-white transition-all"><Minus size={16}/></button><span className="text-xl font-black text-white min-w-[30px] text-center">{current}</span><button onClick={() => updateStampCount(showLoyaltyStampModal.id, cat, 1)} className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-emerald-500 text-white transition-all"><Plus size={16}/></button></div></div>
                                      <div className="flex justify-between gap-3 mb-6">{[1, 2, 3, 4, 5, 6].map(idx => { const filled = idx <= current; const isGiftSlot = idx === 6; return (<div key={idx} className={`w-10 h-10 lg:w-12 lg:h-12 rounded-full flex items-center justify-center border transition-all duration-500 ${filled ? (isGiftSlot ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/50' : 'bg-white text-black border-white') : (isGiftSlot ? 'border-dashed border-amber-500/50 text-amber-500' : 'border-white/20 bg-transparent text-white/20')}`}>{isGiftSlot ? <GiftIcon filled={filled} /> : (filled ? <CheckCircle2 size={20} /> : <div className="w-2 h-2 bg-current rounded-full"></div>)}</div>)})}</div>
                                      {isRewardAvailable ? <button onClick={() => resetStampCard(showLoyaltyStampModal.id, cat)} className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-400 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"><Gift size={16}/> Ödülü Ver & Sıfırla</button> : <p className="text-center text-[10px] font-bold text-slate-500 uppercase tracking-widest">Hediye için {6 - current} işlem kaldı.</p>}
                                  </div>
                              </div>
                          );
                      })}
                  </div>
              </div>
          </div>
      )}

      {showCardModal && displayCustomer && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/80 backdrop-blur-xl p-4 animate-in fade-in">
           <div className="bg-white w-full max-w-6xl h-[85vh] rounded-[4rem] shadow-3xl overflow-hidden flex flex-col relative border border-white/20">
              <button onClick={() => setShowCardModal(null)} className="absolute top-8 right-8 p-4 bg-slate-100 rounded-full hover:bg-slate-900 hover:text-white transition-all z-20"><X size={20}/></button>
              <div className="grid grid-cols-12 h-full">
                 <div className="col-span-3 bg-slate-50 border-r border-slate-100 p-8 flex flex-col">
                    <div className="text-center mb-10"><div className="w-24 h-24 mx-auto bg-slate-900 text-white rounded-[2.5rem] flex items-center justify-center text-3xl font-black shadow-xl mb-4">{displayCustomer.fullName.charAt(0)}</div><h3 className="text-xl font-black text-slate-900 italic leading-tight">{displayCustomer.fullName}</h3><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{displayCustomer.tier} Member</p></div>
                    <div className="space-y-2 mb-10">{['OVERVIEW', 'HISTORY', 'APPOINTMENTS', 'ANALYSIS', 'WELLNESS', 'NOTES'].map(tab => (<button key={tab} onClick={() => setCrmActiveTab(tab as any)} className={`w-full text-left px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-between ${crmActiveTab === tab ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:bg-white hover:text-slate-900'}`}>{tab === 'OVERVIEW' ? 'Genel Bakış' : tab === 'HISTORY' ? 'İşlem Geçmişi' : tab === 'APPOINTMENTS' ? 'Randevular' : tab === 'ANALYSIS' ? 'Vücut Analizi' : tab === 'WELLNESS' ? 'Wellness Planı' : 'Notlar'}{crmActiveTab === tab && <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>}</button>))}</div>
                    <div className="mt-auto bg-white p-6 rounded-3xl border border-slate-100 shadow-sm text-center"><QrCode className="mx-auto text-slate-900 mb-4" size={64} /><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Dijital Kimlik</p></div>
                 </div>
                 <div className="col-span-9 p-12 overflow-y-auto no-scrollbar bg-white">
                    {crmActiveTab === 'OVERVIEW' && (
                        <div className="space-y-10 animate-in slide-in-from-right-8">
                            <div className="flex items-center gap-4 mb-8"><h2 className="text-4xl font-black italic tracking-tighter text-slate-900">Müşteri Profili</h2><span className="bg-emerald-50 text-emerald-600 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100">Aktif</span></div>
                            <div className="grid grid-cols-3 gap-6"><div className="bg-indigo-50 p-8 rounded-[3rem] border border-indigo-100"><p className="text-[10px] font-black uppercase text-indigo-400 tracking-widest mb-2">Toplam Harcama</p><p className="text-4xl font-black text-indigo-900 tracking-tighter">{(displayCustomer.dna.totalSpent || 0).toLocaleString()} TL</p></div><div className="bg-amber-50 p-8 rounded-[3rem] border border-amber-100"><p className="text-[10px] font-black uppercase text-amber-400 tracking-widest mb-2">Sadakat Puanı</p><p className="text-4xl font-black text-amber-900 tracking-tighter">{displayCustomer.dna.loyaltyPuan}</p></div><div className="bg-rose-50 p-8 rounded-[3rem] border border-rose-100"><p className="text-[10px] font-black uppercase text-rose-400 tracking-widest mb-2">Son Ziyaret</p>{enrichedCustomers.find(c=>c.id===displayCustomer.id)?.daysSinceLastVisit !== -1 ? (<p className="text-4xl font-black text-rose-900 tracking-tighter">{enrichedCustomers.find(c=>c.id===displayCustomer.id)?.daysSinceLastVisit} <span className="text-lg">Gün Önce</span></p>) : (<p className="text-2xl font-black text-rose-900 italic">Ziyaret Yok</p>)}</div></div>
                            <div className="grid grid-cols-2 gap-10">
                                <div className="space-y-6"><h4 className="text-xl font-black italic border-b border-slate-100 pb-4">İletişim Bilgileri</h4><div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl"><div className="bg-white p-3 rounded-xl shadow-sm"><Phone size={20} className="text-slate-400"/></div><div><p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Telefon</p><p className="font-bold text-slate-900">{displayCustomer.phone}</p></div></div><div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl"><div className="bg-white p-3 rounded-xl shadow-sm"><Coffee size={20} className="text-slate-400"/></div><div><p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Favori İçecek</p><p className="font-bold text-slate-900">{displayCustomer.preferences.drink || 'Belirtilmemiş'}</p></div></div></div>
                                <div className="bg-slate-900 rounded-[3rem] p-8 text-white relative overflow-hidden"><Sparkles className="absolute top-0 right-0 p-8 text-white opacity-10" size={120} /><h4 className="text-xl font-black italic mb-6 relative z-10">Üyelik Avantajları</h4><ul className="space-y-4 relative z-10"><li className="flex items-center gap-3 text-sm font-medium opacity-80"><CheckCircle2 size={16} className="text-emerald-400"/> %{displayCustomer.tier === 'BLACK_VIP' ? '20' : displayCustomer.tier === 'PLATINUM' ? '15' : '5'} Daimi İndirim</li><li className="flex items-center gap-3 text-sm font-medium opacity-80"><CheckCircle2 size={16} className="text-emerald-400"/> Ücretsiz İkramlar</li><li className="flex items-center gap-3 text-sm font-medium opacity-80"><CheckCircle2 size={16} className="text-emerald-400"/> Öncelikli Randevu</li></ul></div>
                            </div>
                        </div>
                    )}
                    {crmActiveTab === 'HISTORY' && (
                        <div className="space-y-8 animate-in slide-in-from-right-8 h-full flex flex-col">
                            {/* Summary Cards */}
                            <div className="grid grid-cols-3 gap-6 shrink-0">
                                 <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 flex flex-col justify-center">
                                     <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Toplam Harcama</p>
                                     <p className="text-3xl font-black text-slate-900 tracking-tighter">
                                         {(displayCustomer.dna.totalSpent || 0).toLocaleString()} <span className="text-sm text-slate-400 font-bold">TL</span>
                                     </p>
                                 </div>
                                 <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 flex flex-col justify-center">
                                     <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Toplam Ziyaret</p>
                                     <p className="text-3xl font-black text-indigo-900 tracking-tighter">
                                         {transactions.filter(t => t.customerId === displayCustomer.id).length} <span className="text-sm text-slate-400 font-bold">Adet</span>
                                     </p>
                                 </div>
                                 <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 flex flex-col justify-center">
                                     <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Ortalama Sepet</p>
                                     <p className="text-3xl font-black text-emerald-600 tracking-tighter">
                                         {transactions.filter(t => t.customerId === displayCustomer.id).length > 0 
                                            ? Math.round((displayCustomer.dna.totalSpent || 0) / transactions.filter(t => t.customerId === displayCustomer.id).length).toLocaleString() 
                                            : 0} <span className="text-sm text-slate-400 font-bold">TL</span>
                                     </p>
                                 </div>
                            </div>

                            <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
                                <History className="text-slate-900" size={24}/>
                                <h2 className="text-2xl font-black italic tracking-tighter text-slate-900">İşlem Dökümü</h2>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto pr-2 space-y-4 no-scrollbar">
                                {transactions.filter(t => t.customerId === displayCustomer.id).length === 0 ? (
                                    <div className="text-center py-20 text-slate-400 opacity-50 font-bold italic">
                                        Henüz kayıtlı işlem bulunmuyor.
                                    </div>
                                ) : (
                                    transactions.filter(t => t.customerId === displayCustomer.id).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map(tx => {
                                        const staffMember = staff.find(s => s.id === tx.staffId);
                                        return (
                                            <div key={tx.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 flex items-center justify-between hover:shadow-lg transition-all group relative overflow-hidden">
                                                <div className="flex items-center gap-6 relative z-10">
                                                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex flex-col items-center justify-center text-slate-900 border border-slate-100 shadow-sm group-hover:bg-slate-900 group-hover:text-white transition-colors shrink-0">
                                                        <span className="text-xs font-black uppercase">{new Date(tx.timestamp).toLocaleString('tr-TR', {month:'short'})}</span>
                                                        <span className="text-xl font-black">{new Date(tx.timestamp).getDate()}</span>
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-slate-900 italic text-lg leading-tight mb-1">{tx.items.map((i:any) => i.name || 'Hizmet').join(', ')}</p>
                                                        <div className="flex flex-wrap items-center gap-3">
                                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg">
                                                                <Receipt size={10}/> {tx.paymentType === 'CASH' ? 'Nakit' : tx.paymentType === 'CARD' ? 'Kredi Kartı' : 'Havale'}
                                                            </span>
                                                            {staffMember && (
                                                                <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest flex items-center gap-1 bg-indigo-50 px-2 py-1 rounded-lg">
                                                                    <UserCheck size={10}/> {staffMember.name}
                                                                </span>
                                                            )}
                                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                                {new Date(tx.timestamp).toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'})}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right relative z-10 shrink-0">
                                                    <p className="text-2xl font-black text-slate-900">{tx.grossRevenue.toLocaleString()} <span className="text-sm font-bold text-slate-400">TL</span></p>
                                                    {tx.rating && (
                                                        <div className="flex justify-end gap-1 mt-1">
                                                            {[...Array(tx.rating)].map((_, i) => <Star key={i} size={10} className="text-amber-400" fill="currentColor" />)}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    )}
                    {crmActiveTab === 'APPOINTMENTS' && (
                        <div className="space-y-8 animate-in slide-in-from-right-8 h-full flex flex-col">
                            <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
                                <CalendarClock className="text-slate-900" size={24}/>
                                <h2 className="text-2xl font-black italic tracking-tighter text-slate-900">Randevu Geçmişi</h2>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto pr-2 space-y-4 no-scrollbar">
                                {appointments.filter(a => a.customerId === displayCustomer.id).length === 0 ? (
                                    <div className="text-center py-20 text-slate-400 opacity-50 font-bold italic">
                                        Henüz randevu kaydı bulunmuyor.
                                    </div>
                                ) : (
                                    appointments.filter(a => a.customerId === displayCustomer.id).sort((a,b) => new Date(`${b.date}T${b.time}`).getTime() - new Date(`${a.date}T${a.time}`).getTime()).map(app => {
                                        const service = services.find(s => s.id === app.serviceId);
                                        const staffMember = staff.find(s => s.id === app.staffId);
                                        const isPast = new Date(`${app.date}T${app.time}`) < new Date();
                                        
                                        return (
                                            <div key={app.id} className={`p-6 rounded-[2rem] border flex items-center justify-between hover:shadow-lg transition-all group relative overflow-hidden ${isPast ? 'bg-slate-50 border-slate-100 opacity-80' : 'bg-white border-indigo-100 shadow-sm'}`}>
                                                <div className="flex items-center gap-6 relative z-10">
                                                    <div className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center border shadow-sm shrink-0 ${isPast ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-indigo-50 text-indigo-600 border-indigo-100'}`}>
                                                        <span className="text-xs font-black uppercase">{new Date(app.date).toLocaleString('tr-TR', {month:'short'})}</span>
                                                        <span className="text-xl font-black">{new Date(app.date).getDate()}</span>
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-slate-900 italic text-lg leading-tight mb-1">{service?.name || 'Bilinmeyen Hizmet'}</p>
                                                        <div className="flex flex-wrap items-center gap-3">
                                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg">
                                                                <Clock size={10}/> {app.time}
                                                            </span>
                                                            {staffMember && (
                                                                <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest flex items-center gap-1 bg-indigo-50 px-2 py-1 rounded-lg">
                                                                    <UserCheck size={10}/> {staffMember.name}
                                                                </span>
                                                            )}
                                                            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${
                                                                app.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-600' :
                                                                app.status === 'CANCELLED' ? 'bg-rose-100 text-rose-600' :
                                                                app.status === 'CONFIRMED' ? 'bg-indigo-100 text-indigo-600' :
                                                                'bg-amber-100 text-amber-600'
                                                            }`}>
                                                                {app.status === 'COMPLETED' ? 'Tamamlandı' : app.status === 'CANCELLED' ? 'İptal' : app.status === 'CONFIRMED' ? 'Onaylı' : 'Bekliyor'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    )}
                    {crmActiveTab === 'ANALYSIS' && (
                        <div className="space-y-8 animate-in slide-in-from-right-8 h-full flex flex-col"><h2 className="text-3xl font-black italic tracking-tighter text-slate-900">Vücut Analizi</h2>{!displayCustomer.bodyAnalysis || displayCustomer.bodyAnalysis.length === 0 ? (<div className="flex-1 flex flex-col items-center justify-center text-slate-400 opacity-50 space-y-4"><Activity size={64} /><p className="font-black text-xl italic">Analiz verisi bulunamadı.</p><button onClick={() => { setShowCardModal(null); setShowDietModal(displayCustomer); }} className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold uppercase text-xs tracking-widest hover:scale-105 transition-transform">Analiz Ekle</button></div>) : (<div className="flex-1 flex flex-col"><div className="h-[300px] w-full bg-slate-50 rounded-[2rem] p-6 border border-slate-100 mb-8"><ResponsiveContainer width="100%" height="100%"><AreaChart data={[...displayCustomer.bodyAnalysis]}><defs><linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" /><XAxis dataKey="date" tickFormatter={(t) => new Date(t).toLocaleDateString('tr-TR', {day:'numeric', month:'short'})} axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} /><YAxis hide domain={['dataMin - 2', 'dataMax + 2']} /><Tooltip contentStyle={{borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontWeight: 'bold'}} /><Area type="monotone" dataKey="weight" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorWeight)" name="Kilo" /><Area type="monotone" dataKey="fatPercentage" stroke="#f59e0b" strokeWidth={3} fill="none" name="Yağ %" /></AreaChart></ResponsiveContainer></div><div className="bg-slate-900 text-white p-8 rounded-[2rem] flex justify-between items-center"><div><p className="text-[10px] font-black uppercase opacity-60 tracking-widest mb-1">Son Ölçüm</p><p className="text-3xl font-black italic">{new Date(displayCustomer.bodyAnalysis[displayCustomer.bodyAnalysis.length-1].date).toLocaleDateString()}</p></div><div className="text-right"><p className="text-[10px] font-black uppercase opacity-60 tracking-widest mb-1">Mevcut Kilo</p><p className="text-4xl font-black text-emerald-400">{displayCustomer.bodyAnalysis[displayCustomer.bodyAnalysis.length-1].weight} kg</p></div></div></div>)}</div>
                    )}
                    {crmActiveTab === 'WELLNESS' && (
                        <div className="space-y-8 animate-in slide-in-from-right-8 h-full flex flex-col">
                            <h2 className="text-3xl font-black italic tracking-tighter text-slate-900">Wellness Planı</h2>
                            {displayCustomer.wellnessPlan ? (
                                <div className="space-y-6 overflow-y-auto pr-2 no-scrollbar">
                                    <div className="bg-indigo-50 p-8 rounded-[2rem] border border-indigo-100">
                                        <h3 className="text-xl font-black text-indigo-900 italic mb-4">{displayCustomer.wellnessPlan.wellnessPlanTitle}</h3>
                                        <p className="text-slate-700 font-medium leading-relaxed">{displayCustomer.wellnessPlan.introMessage}</p>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="bg-emerald-50 p-6 rounded-[2rem] border border-emerald-100">
                                            <h4 className="text-sm font-black uppercase text-emerald-600 tracking-widest mb-3 flex items-center gap-2"><Sun size={16}/> Günlük Rutin</h4>
                                            <p className="text-slate-700 font-medium text-sm">{displayCustomer.wellnessPlan.dailyRoutineSuggestion}</p>
                                        </div>
                                        <div className="bg-rose-50 p-6 rounded-[2rem] border border-rose-100">
                                            <h4 className="text-sm font-black uppercase text-rose-600 tracking-widest mb-3 flex items-center gap-2"><Apple size={16}/> Beslenme İpucu</h4>
                                            <p className="text-slate-700 font-medium text-sm">{displayCustomer.wellnessPlan.nutritionTip}</p>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-lg font-black italic text-slate-900 mb-4">Önerilen Protokoller</h4>
                                        <div className="space-y-3">
                                            {displayCustomer.wellnessPlan.recommendedServices.map((rec: any, idx: number) => {
                                                const service = services.find(s => s.id === rec.serviceId);
                                                return (
                                                    <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between shadow-sm">
                                                        <div>
                                                            <p className="font-bold text-slate-900">{service?.name || 'Özel Hizmet'}</p>
                                                            <p className="text-xs text-slate-500 mt-1">{rec.reason}</p>
                                                        </div>
                                                        <button className="p-2 bg-slate-900 text-white rounded-xl hover:bg-emerald-500 transition-colors"><Plus size={16}/></button>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 opacity-50 space-y-4">
                                    <Sparkles size={64} />
                                    <p className="font-black text-xl italic">Henüz wellness planı oluşturulmamış.</p>
                                    <p className="text-sm font-medium">Müşteri tabletinden AI analizi başlatılabilir.</p>
                                </div>
                            )}
                        </div>
                    )}
                    {crmActiveTab === 'NOTES' && (
                        <div className="space-y-8 animate-in slide-in-from-right-8 h-full flex flex-col"><h2 className="text-3xl font-black italic tracking-tighter text-slate-900">Özel Notlar</h2><textarea className="flex-1 w-full bg-slate-50 border border-slate-100 rounded-[2rem] p-8 text-slate-700 font-medium outline-none resize-none focus:ring-4 focus:ring-slate-100 transition-all text-lg leading-relaxed" placeholder="Müşteri hakkında özel notlar, alerjiler veya tercihler..." defaultValue={displayCustomer.preferences.notes} onChange={(e) => {}}></textarea><button onClick={() => { alert("Notlar kaydedildi (Demo)"); }} className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black text-xl hover:bg-black transition-all">KAYDET</button></div>
                    )}
                 </div>
              </div>
           </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/95 p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-xl rounded-[5rem] p-16 animate-in zoom-in-95 shadow-3xl my-10">
            <div className="flex justify-between items-center mb-12"><h3 className="text-4xl font-black italic tracking-tighter">Müşteri Kaydı</h3><button onClick={() => setShowModal(false)} className="p-4 bg-slate-100 rounded-full"><X size={32}/></button></div>
            <form onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.target as HTMLFormElement);
              const c: any = { id: editItem?.id || Math.random().toString(36).substr(2, 9), fullName: fd.get('name'), phone: fd.get('phone'), tcNo: '123', tier: MembershipTier.BRONZE, branchId: 'b1', dna: { spendingPattern: 50, churnRisk: 10, packagePropensity: 50, luxuryTrendScore: 50, nextVisitPrediction: '', loyaltyPuan: Number(fd.get('loyaltyPuan')) || editItem?.dna?.loyaltyPuan || 0, totalSpent: editItem?.dna?.totalSpent || 0 }, packages: [], history: editItem?.history || [], consentSigned: editItem?.consentSigned || false, signedDocuments: editItem?.signedDocuments || [], preferences: { music: 'Relax', drink: fd.get('drink') as string, notes: '' }, bodyAnalysis: editItem?.bodyAnalysis || [], gallery: editItem?.gallery || [], specialPriceList: tempCustomPrices, loyaltyStamps: editItem?.loyaltyStamps || { skinCare: 0, nail: 0 }, dietPassword: fd.get('dietPassword') as string };
              editItem ? updateCustomer(c) : addCustomer(c);
              setShowModal(false);
            }} className="space-y-8">
              <InputLarge label="DANIŞAN AD SOYAD" name="name" defaultValue={editItem?.fullName} />
              <div className="grid grid-cols-3 gap-6"><div className="col-span-2"><InputLarge label="İLETİŞİM NUMARASI" name="phone" defaultValue={editItem?.phone} /></div><div className="space-y-4"><label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.4em] mb-2 block">PUAN</label><input name="loyaltyPuan" type="number" defaultValue={editItem?.dna?.loyaltyPuan || 0} className="w-full h-[108px] p-6 bg-slate-50 border-2 border-transparent rounded-[3rem] font-black text-3xl outline-none focus:border-slate-900 focus:bg-white transition-all shadow-inner text-center text-rose-500" /></div></div>
              <div className="grid grid-cols-2 gap-6"><div className="space-y-4"><label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.4em] mb-2 block">FAVORİ İÇECEK</label><input name="drink" defaultValue={editItem?.preferences?.drink} placeholder="Örn: Kahve" className="w-full p-6 bg-slate-50 border-2 border-transparent rounded-[2rem] font-bold text-lg outline-none focus:border-slate-900 focus:bg-white transition-all shadow-inner" /></div><div className="space-y-4"><label className="text-[10px] font-black uppercase text-rose-500 tracking-[0.4em] mb-2 block flex items-center gap-2"><Lock size={12}/> DİYET ŞİFRESİ</label><input name="dietPassword" defaultValue={editItem?.dietPassword || '123456'} placeholder="Şifre Belirle" className="w-full p-6 bg-rose-50 border-2 border-transparent rounded-[2rem] font-black text-lg outline-none focus:border-rose-500 focus:bg-white transition-all shadow-inner text-rose-900" /></div></div>
              <div className="pt-8 border-t border-slate-100 space-y-6"><div className="flex items-center gap-3"><div className="bg-indigo-50 p-3 rounded-xl text-indigo-600"><Banknote size={24} /></div><div><h4 className="text-lg font-black italic">Kişiye Özel Fiyatlandırma</h4><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Sadece bu müşteriye özel fiyatlar</p></div></div><div className="bg-slate-50 rounded-[2rem] p-6 space-y-4 max-h-60 overflow-y-auto border border-slate-100">{services.map(service => (<div key={service.id} className="flex items-center justify-between"><div><p className="font-bold text-sm text-slate-700">{service.name}</p><p className="text-[10px] text-slate-400">Liste: {service.price} TL</p></div><input type="number" placeholder="Özel Fiyat" className="w-24 p-2 rounded-xl border border-slate-200 text-right font-black outline-none focus:border-indigo-500" value={tempCustomPrices[service.id] || ''} onChange={(e) => { const val = e.target.value ? Number(e.target.value) : undefined; const newPrices = { ...tempCustomPrices }; if (val !== undefined) newPrices[service.id] = val; else delete newPrices[service.id]; setTempCustomPrices(newPrices); }} /></div>))}</div></div>
              <button className="w-full py-10 bg-slate-900 text-white rounded-[3rem] font-black text-3xl shadow-3xl hover:bg-rose-500 transition-all">SİSTEME KAYDET</button>
            </form>
          </div>
        </div>
      )}
      <style>{`@keyframes pulse-subtle { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: .9; transform: scale(1.02); } } .animate-pulse-subtle { animation: pulse-subtle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; } @media print { body { background: white !important; } .print\\:hidden { display: none !important; } #root { height: auto !important; overflow: visible !important; } aside { display: none !important; } main { padding: 0 !important; width: 100% !important; margin: 0 !important; } .grid { display: block !important; } .bg-white { border: none !important; shadow: none !important; margin-bottom: 2rem; page-break-inside: avoid; } }`}</style>
    </div>
  );
};

const InputLarge = ({ label, name, defaultValue }: any) => (
    <div className="space-y-4">
        <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.4em] mb-2 block">{label}</label>
        <input name={name} defaultValue={defaultValue} className="w-full p-8 bg-slate-50 border-2 border-transparent rounded-[3rem] font-black text-3xl outline-none focus:border-slate-900 focus:bg-white transition-all shadow-inner" required />
    </div>
);

const FilterButton = ({ label, active, onClick, icon: Icon, alert }: any) => (
    <button 
        onClick={onClick}
        className={`px-6 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest flex items-center gap-2 whitespace-nowrap transition-all ${active ? 'bg-slate-900 text-white shadow-lg scale-105' : 'bg-white text-slate-500 hover:text-slate-900'}`}
    >
        {Icon && <Icon size={14} className={alert ? 'text-rose-500 animate-pulse' : ''} />}
        {label}
    </button>
);

const GiftIcon = ({ filled }: { filled: boolean }) => (
    <Gift size={20} className={filled ? "animate-bounce" : ""} />
);
