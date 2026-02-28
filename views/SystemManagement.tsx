
import React, { useState } from 'react';
import { useSalon } from '../store/SalonContext';
import { Plus, Trash2, Edit, Scissors, Users, Monitor, X, Check, Key, FileText, ShieldCheck, Coffee, Clock, Banknote, Percent, Zap, Link, Heart, Star, Award, Gift, CreditCard, Package } from 'lucide-react';
import { Service, Staff, Drink, UserRole, LoyaltyRule, MembershipTier, ServicePackage } from '../types';

export const SystemManagement: React.FC = () => {
  const { 
    services, staff, products, devices, updateDevice, addDevice, deleteData, 
    adminKey, receptionistKey, staffKey, updateSystemKeys, kvkkText, updateKvkkText, 
    currentRole, addService, updateService, addStaff, updateStaff,
    drinks, addDrink, updateDrink, loyaltyRate, loyaltyRules, tierLimits, updateLoyaltySettings,
    servicePackages, addPackage, updatePackage
  } = useSalon();
  
  const [activeTab, setActiveTab] = useState<'SERVICES' | 'STAFF' | 'BAR' | 'LOYALTY' | 'CONTRACT' | 'SECURITY' | 'PACKAGES'>('SERVICES');
  
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [showDrinkModal, setShowDrinkModal] = useState(false);
  const [showLoyaltyModal, setShowLoyaltyModal] = useState(false);
  const [showPackageModal, setShowPackageModal] = useState(false);

  const [editingService, setEditingService] = useState<Service | null>(null);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [editingDrink, setEditingDrink] = useState<Drink | null>(null);
  const [editingLoyalty, setEditingLoyalty] = useState<LoyaltyRule | null>(null);
  const [editingPackage, setEditingPackage] = useState<ServicePackage | null>(null);

  const [securityForm, setSecurityForm] = useState({ admin: adminKey, receptionist: receptionistKey, staff: staffKey });
  const [localKvkk, setLocalKvkk] = useState(kvkkText);
  const [localLoyaltyRate, setLocalLoyaltyRate] = useState(loyaltyRate);
  const [localTierLimits, setLocalTierLimits] = useState(tierLimits);
  const [saved, setSaved] = useState(false);

  const isManager = currentRole === UserRole.MANAGER;

  const handleSecuritySave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSystemKeys(securityForm.admin, securityForm.receptionist, securityForm.staff);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleLoyaltySettingsUpdate = () => {
     updateLoyaltySettings(localLoyaltyRate, loyaltyRules, localTierLimits);
     setSaved(true);
     setTimeout(() => setSaved(false), 2000);
  };

  const handleLoyaltySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData(e.target as HTMLFormElement);
    const newRule: LoyaltyRule = {
      id: editingLoyalty?.id || Math.random().toString(36).substr(2, 9),
      type: fd.get('type') as 'POINTS' | 'STAMPS',
      category: fd.get('category') as any,
      minPoints: Number(fd.get('minPoints')) || 0,
      minStamps: Number(fd.get('minStamps')) || 0,
      reward: fd.get('reward') as string
    };
    
    let newRules = [...loyaltyRules];
    if (editingLoyalty) {
      newRules = newRules.map(r => r.id === editingLoyalty.id ? newRule : r);
    } else {
      newRules.push(newRule);
    }
    
    updateLoyaltySettings(localLoyaltyRate, newRules, localTierLimits);
    setShowLoyaltyModal(false);
    setEditingLoyalty(null);
  };

  const handleServiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData(e.target as HTMLFormElement);
    const serviceData: Service = {
      id: editingService?.id || Math.random().toString(36).substr(2, 9),
      name: fd.get('name') as string,
      category: fd.get('category') as any,
      duration: Number(fd.get('duration')),
      price: Number(fd.get('price')),
      commissionRate: Number(fd.get('commissionRate')),
      productCostPerSession: Number(fd.get('productCost')),
      energyAndOverheadPerMinute: Number(fd.get('energyOverhead')) || 5,
      linkedProductId: (fd.get('linkedProductId') as string) || undefined
    };
    editingService ? updateService(serviceData) : addService(serviceData);
    setShowServiceModal(false);
    setEditingService(null);
  };

  const handleStaffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData(e.target as HTMLFormElement);
    const staffData: Staff = {
      id: editingStaff?.id || Math.random().toString(36).substr(2, 9),
      name: fd.get('name') as string,
      role: fd.get('role') as string,
      performanceScore: Number(fd.get('performance')) || 100,
      totalSales: editingStaff?.totalSales || 0,
      totalCommissions: editingStaff?.totalCommissions || 0,
      totalPrim: editingStaff?.totalPrim || 0,
      riskScore: 0
    };
    editingStaff ? updateStaff(staffData) : addStaff(staffData);
    setShowStaffModal(false);
    setEditingStaff(null);
  };

  const handleDrinkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData(e.target as HTMLFormElement);
    const drinkData: Drink = {
      id: editingDrink?.id || Math.random().toString(36).substr(2, 9),
      name: fd.get('name') as string,
      icon: fd.get('icon') as string,
      description: fd.get('description') as string,
    };
    editingDrink ? updateDrink(drinkData) : addDrink(drinkData);
    setShowDrinkModal(false);
    setEditingDrink(null);
  };

  const handlePackageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData(e.target as HTMLFormElement);
    const featuresStr = fd.get('features') as string;
    const pkgData: ServicePackage = {
      id: editingPackage?.id || Math.random().toString(36).substr(2, 9),
      name: fd.get('name') as string,
      description: fd.get('description') as string,
      price: Number(fd.get('price')),
      minTier: fd.get('minTier') as MembershipTier,
      features: featuresStr.split(',').map(f => f.trim()).filter(f => f),
      active: true
    };
    editingPackage ? updatePackage(pkgData) : addPackage(pkgData);
    setShowPackageModal(false);
    setEditingPackage(null);
  };

  if (!isManager) return <div className="py-20 text-center opacity-30 italic font-black text-2xl uppercase tracking-widest">Sadece yönetici yetkisi ile erişilebilir.</div>;

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-wrap bg-white p-3 rounded-[2rem] shadow-sm border border-slate-100 w-fit gap-2 overflow-x-auto no-scrollbar">
        <TabBtn active={activeTab === 'SERVICES'} onClick={() => setActiveTab('SERVICES')} icon={Scissors} label="Hizmetler" />
        <TabBtn active={activeTab === 'STAFF'} onClick={() => setActiveTab('STAFF')} icon={Users} label="Personel" />
        <TabBtn active={activeTab === 'BAR'} onClick={() => setActiveTab('BAR')} icon={Coffee} label="Wellness Bar" />
        <TabBtn active={activeTab === 'PACKAGES'} onClick={() => setActiveTab('PACKAGES')} icon={Package} label="VIP Paketler" />
        <TabBtn active={activeTab === 'LOYALTY'} onClick={() => setActiveTab('LOYALTY')} icon={Award} label="Sadakat & Kart" />
        <TabBtn active={activeTab === 'CONTRACT'} onClick={() => setActiveTab('CONTRACT')} icon={FileText} label="Sözleşme" />
        <TabBtn active={activeTab === 'SECURITY'} onClick={() => setActiveTab('SECURITY')} icon={ShieldCheck} label="Güvenlik" />
      </div>

      <div className="bg-white rounded-[3.5rem] p-10 shadow-xl border border-slate-100 min-h-[600px]">
        {activeTab === 'SERVICES' && (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-5">
              {services.map(s => <ManagementCard key={s.id} title={s.name} sub={s.category} price={`${s.price} TL`} onDelete={() => deleteData(s.id, 'SERVICE')} onEdit={() => { setEditingService(s); setShowServiceModal(true); }} />)}
              <AddCard onClick={() => { setEditingService(null); setShowServiceModal(true); }} label="Yeni Hizmet" icon={Plus} color="rose" />
           </div>
        )}

        {activeTab === 'STAFF' && (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-5">
              {staff.map(s => <ManagementCard key={s.id} title={s.name} sub={s.role} price={`Perf: %${s.performanceScore}`} onDelete={() => deleteData(s.id, 'STAFF')} onEdit={() => { setEditingStaff(s); setShowStaffModal(true); }} />)}
              <AddCard onClick={() => { setEditingStaff(null); setShowStaffModal(true); }} label="Yeni Personel" icon={Plus} color="indigo" />
           </div>
        )}

        {activeTab === 'BAR' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-5">
            {drinks.map(d => <ManagementCard key={d.id} title={`${d.icon} ${d.name}`} sub={d.description} onDelete={() => deleteData(d.id, 'DRINK')} onEdit={() => { setEditingDrink(d); setShowDrinkModal(true); }} />)}
            <AddCard onClick={() => { setEditingDrink(null); setShowDrinkModal(true); }} label="Yeni İçecek" icon={Plus} color="amber" />
          </div>
        )}

        {activeTab === 'PACKAGES' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-5">
            {servicePackages.map(p => <ManagementCard key={p.id} title={p.name} sub={`${p.minTier}+ Üyeler İçin`} price={`${p.price} TL`} onDelete={() => deleteData(p.id, 'PACKAGE')} onEdit={() => { setEditingPackage(p); setShowPackageModal(true); }} />)}
            <AddCard onClick={() => { setEditingPackage(null); setShowPackageModal(true); }} label="Yeni Paket" icon={Plus} color="indigo" />
          </div>
        )}

        {activeTab === 'LOYALTY' && (
          <div className="space-y-12 animate-in slide-in-from-bottom-5">
             <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                 {/* PUAN ORANI */}
                 <div className="bg-slate-50 p-10 rounded-[3rem] border border-slate-200">
                    <h3 className="text-xl font-black italic mb-6">Genel Puan Oranı</h3>
                    <div className="flex items-center gap-6">
                       <div className="flex-1">
                          <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Cirodan % Kaç Puan?</label>
                          <input type="number" value={localLoyaltyRate} onChange={(e) => setLocalLoyaltyRate(Number(e.target.value))} className="w-full p-5 bg-white rounded-2xl font-black text-3xl outline-none focus:ring-2 focus:ring-slate-900" />
                       </div>
                    </div>
                    <p className="mt-4 text-xs text-slate-400 italic">Örn: %5 ise, 1000 TL işlemde 50 Puan kazanılır.</p>
                 </div>

                 {/* KART LİMİTLERİ (YENİ) */}
                 <div className="bg-slate-900 text-white p-10 rounded-[3rem] shadow-2xl relative overflow-hidden">
                    <CreditCard className="absolute top-10 right-10 opacity-10" size={120} />
                    <h3 className="text-xl font-black italic mb-6 relative z-10 flex items-center gap-3"><Award className="text-amber-400"/> VIP Kart Limitleri</h3>
                    <div className="grid grid-cols-2 gap-6 relative z-10">
                        <div>
                            <label className="text-[9px] font-black uppercase text-slate-400 mb-1 block">SILVER EŞİĞİ</label>
                            <input type="number" value={localTierLimits.SILVER} onChange={e => setLocalTierLimits({...localTierLimits, SILVER: Number(e.target.value)})} className="w-full p-3 bg-white/10 rounded-xl font-bold text-white outline-none border border-white/20" />
                        </div>
                        <div>
                            <label className="text-[9px] font-black uppercase text-amber-400 mb-1 block">GOLD EŞİĞİ</label>
                            <input type="number" value={localTierLimits.GOLD} onChange={e => setLocalTierLimits({...localTierLimits, GOLD: Number(e.target.value)})} className="w-full p-3 bg-white/10 rounded-xl font-bold text-white outline-none border border-amber-500/50" />
                        </div>
                        <div>
                            <label className="text-[9px] font-black uppercase text-indigo-300 mb-1 block">PLATINUM EŞİĞİ</label>
                            <input type="number" value={localTierLimits.PLATINUM} onChange={e => setLocalTierLimits({...localTierLimits, PLATINUM: Number(e.target.value)})} className="w-full p-3 bg-white/10 rounded-xl font-bold text-white outline-none border border-indigo-400/50" />
                        </div>
                        <div>
                            <label className="text-[9px] font-black uppercase text-rose-500 mb-1 block">BLACK VIP EŞİĞİ</label>
                            <input type="number" value={localTierLimits.BLACK_VIP} onChange={e => setLocalTierLimits({...localTierLimits, BLACK_VIP: Number(e.target.value)})} className="w-full p-3 bg-white/10 rounded-xl font-bold text-white outline-none border border-rose-500/50" />
                        </div>
                    </div>
                 </div>
             </div>

             {/* KAYDET BUTONU */}
             <button onClick={handleLoyaltySettingsUpdate} className="w-full py-6 bg-emerald-500 text-white rounded-[2rem] font-black text-xl hover:bg-emerald-600 transition-all shadow-xl">
                 {saved ? <span className="flex items-center justify-center gap-2"><Check /> AYARLAR KAYDEDİLDİ</span> : 'AYARLARI VE LİMİTLERİ GÜNCELLE'}
             </button>

             {/* ÖDÜL KURALLARI LİSTESİ */}
             <div className="space-y-6 pt-8 border-t border-slate-100">
                <div className="flex justify-between items-center">
                   <h3 className="text-3xl font-black italic">Hediye & Ödül Kuralları</h3>
                   <button onClick={() => { setEditingLoyalty(null); setShowLoyaltyModal(true); }} className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase flex items-center gap-2"><Plus size={16}/> KURAL EKLE</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   {loyaltyRules.map(rule => (
                     <div key={rule.id} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex justify-between items-center group hover:border-amber-400 transition-all">
                        <div>
                           <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">
                             {rule.type === 'POINTS' ? `Baraj: ${rule.minPoints} Puan` : `Baraj: ${rule.minStamps || 0} Hizmet (${rule.category || 'GENEL'})`}
                           </p>
                           <h4 className="text-xl font-black italic text-slate-900 mt-1">{rule.reward}</h4>
                        </div>
                        <div className="flex gap-2">
                           <button onClick={() => { setEditingLoyalty(rule); setShowLoyaltyModal(true); }} className="p-3 bg-slate-50 text-slate-300 hover:text-indigo-600 rounded-xl"><Edit size={16}/></button>
                           <button onClick={(e) => { e.stopPropagation(); deleteData(rule.id, 'LOYALTY_RULE'); }} className="p-3 bg-slate-50 text-slate-300 hover:text-rose-600 rounded-xl"><Trash2 size={16}/></button>
                        </div>
                     </div>
                   ))}
                </div>
             </div>
          </div>
        )}

        {activeTab === 'SECURITY' && (
          <div className="max-w-2xl mx-auto py-10 animate-in slide-in-from-bottom-5">
            <form onSubmit={handleSecuritySave} className="space-y-8 bg-slate-50 p-10 rounded-[3rem] border border-slate-200">
               <div className="text-center mb-10">
                  <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-4"><Key size={32}/></div>
                  <h3 className="text-2xl font-black italic">Giriş Anahtarları</h3>
               </div>
               <div className="space-y-6">
                  <InputBase label="Master (Admin) Key" name="admin" defaultValue={securityForm.admin} onChange={v => setSecurityForm({...securityForm, admin: v})} />
                  <InputBase label="Receptionist Key" name="receptionist" defaultValue={securityForm.receptionist} onChange={v => setSecurityForm({...securityForm, receptionist: v})} />
                  <InputBase label="Expert (Staff) Key" name="staff" defaultValue={securityForm.staff} onChange={v => setSecurityForm({...securityForm, staff: v})} />
               </div>
               <button type="submit" className={`w-full py-6 rounded-[2rem] font-black text-xl flex items-center justify-center gap-3 transition-all ${saved ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-white shadow-xl'}`}>
                  {saved ? <Check size={24}/> : <ShieldCheck size={24}/>}
                  {saved ? 'Güncellendi' : 'Ayarları Kaydet'}
               </button>
            </form>
          </div>
        )}
        
        {activeTab === 'CONTRACT' && (
           <div className="animate-in slide-in-from-bottom-5">
              <div className="bg-slate-50 p-10 rounded-[3rem] border border-slate-200 space-y-8">
                 <h3 className="text-2xl font-black italic">KVKK & Onam Metni</h3>
                 <textarea 
                   className="w-full h-96 p-8 bg-white rounded-3xl border border-slate-200 outline-none font-medium text-slate-600 leading-relaxed resize-none focus:ring-2 focus:ring-slate-900"
                   value={localKvkk}
                   onChange={(e) => setLocalKvkk(e.target.value)}
                 />
                 <button onClick={() => { updateKvkkText(localKvkk); setSaved(true); setTimeout(() => setSaved(false), 2000); }} className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black shadow-xl hover:bg-black transition-all">
                    {saved ? 'KAYDEDİLDİ' : 'SÖZLEŞMEYİ GÜNCELLE'}
                 </button>
              </div>
           </div>
        )}
      </div>

      {/* PACKAGE MODAL */}
      {showPackageModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-lg p-6">
          <form onSubmit={handlePackageSubmit} className="bg-white w-full max-w-xl rounded-[4rem] p-16 space-y-8 animate-in zoom-in-95 shadow-3xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-4xl font-black tracking-tighter italic flex items-center gap-4"><Package className="text-indigo-500" /> Paket Oluştur</h3>
              <button type="button" onClick={() => setShowPackageModal(false)} className="p-4 bg-slate-100 rounded-full hover:bg-rose-500 hover:text-white transition-all"><X /></button>
            </div>
            <div className="space-y-6">
               <InputBase label="Paket Adı" name="name" defaultValue={editingPackage?.name} />
               <InputBase label="Paket İçeriği (Açıklama)" name="description" defaultValue={editingPackage?.description} />
               <InputBase label="Paket Fiyatı (TL)" name="price" type="number" defaultValue={editingPackage?.price} />
               
               <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Görünürlük Seviyesi (Minimum Tier)</label>
                  <select name="minTier" defaultValue={editingPackage?.minTier || MembershipTier.BRONZE} className="w-full p-5 bg-slate-50 rounded-2xl font-black outline-none border-2 border-transparent focus:border-slate-900">
                     <option value={MembershipTier.BRONZE}>BRONZE ve üzeri</option>
                     <option value={MembershipTier.SILVER}>SILVER ve üzeri</option>
                     <option value={MembershipTier.GOLD}>GOLD ve üzeri</option>
                     <option value={MembershipTier.PLATINUM}>PLATINUM ve üzeri</option>
                     <option value={MembershipTier.BLACK_VIP}>Sadece BLACK VIP</option>
                  </select>
               </div>

               <InputBase label="Özellikler (Virgülle ayırın)" name="features" defaultValue={editingPackage?.features.join(', ')} placeholder="Örn: 5 Seans Lazer, Detoks İçecek, Özel Masaj" />
            </div>
            <button type="submit" className="w-full py-8 bg-slate-900 text-white rounded-[2.5rem] font-black text-2xl shadow-3xl hover:bg-indigo-600 transition-all">{editingPackage ? 'Güncelle' : 'Paketi Yayınla'}</button>
          </form>
        </div>
      )}

      {/* LOYALTY MODAL */}
      {showLoyaltyModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-lg p-6">
          <form onSubmit={handleLoyaltySubmit} className="bg-white w-full max-w-xl rounded-[4rem] p-16 space-y-8 animate-in zoom-in-95 shadow-3xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-4xl font-black tracking-tighter italic flex items-center gap-4"><Award className="text-amber-500" /> Kural Belirle</h3>
              <button type="button" onClick={() => setShowLoyaltyModal(false)} className="p-4 bg-slate-100 rounded-full hover:bg-amber-500 hover:text-white transition-all"><X /></button>
            </div>
            <div className="space-y-6">
               <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Kural Tipi</label>
                  <select name="type" defaultValue={editingLoyalty?.type || 'POINTS'} className="w-full p-5 bg-slate-50 rounded-2xl font-black outline-none border-2 border-transparent focus:border-slate-900">
                     <option value="POINTS">Puan Bazlı (Ciro)</option>
                     <option value="STAMPS">Hizmet Sayısı Bazlı (Stamp)</option>
                  </select>
               </div>

               <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Kategori (Sadece Stamp İçin)</label>
                  <select name="category" defaultValue={editingLoyalty?.category || 'GENERAL'} className="w-full p-5 bg-slate-50 rounded-2xl font-black outline-none border-2 border-transparent focus:border-slate-900">
                     <option value="GENERAL">Genel</option>
                     <option value="SKIN_CARE">Cilt Bakımı</option>
                     <option value="NAIL">Tırnak</option>
                     <option value="DIET">Diyet</option>
                  </select>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <InputBase label="Puan Barajı (Points)" name="minPoints" type="number" defaultValue={editingLoyalty?.minPoints || 0} icon={Zap} />
                  <InputBase label="Hizmet Sayısı (Stamps)" name="minStamps" type="number" defaultValue={editingLoyalty?.minStamps || 0} icon={Check} />
               </div>

               <InputBase label="Ödül / Talimat Mesajı" name="reward" defaultValue={editingLoyalty?.reward} placeholder="Örn: 10. Tırnak Bakımı Ücretsiz" icon={Gift} />
            </div>
            <button type="submit" className="w-full py-8 bg-slate-900 text-white rounded-[2.5rem] font-black text-2xl shadow-3xl hover:bg-amber-600 transition-all">{editingLoyalty ? 'Güncelle' : 'Ekle'}</button>
          </form>
        </div>
      )}

      {/* SERVICE MODAL */}
      {showServiceModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-lg p-6">
          <form onSubmit={handleServiceSubmit} className="bg-white w-full max-w-xl rounded-[4rem] p-16 space-y-8 animate-in zoom-in-95 shadow-3xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-4xl font-black tracking-tighter italic">Hizmet Tanımla</h3>
              <button type="button" onClick={() => setShowServiceModal(false)} className="p-4 bg-slate-100 rounded-full"><X /></button>
            </div>
            <div className="space-y-6">
               <InputBase label="Hizmet Adı" name="name" defaultValue={editingService?.name} />
               <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Kategori</label>
                  <select name="category" defaultValue={editingService?.category} className="w-full p-5 bg-slate-50 rounded-2xl font-black outline-none border-2 border-transparent focus:border-slate-900"><option value="SKIN_CARE">Cilt Bakımı</option><option value="NAIL">Tırnak</option><option value="DIET">Diyet</option><option value="GENERAL">Genel</option></select>
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <InputBase label="Süre (Dk)" name="duration" type="number" defaultValue={editingService?.duration} />
                  <InputBase label="Fiyat (TL)" name="price" type="number" defaultValue={editingService?.price} />
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <InputBase label="Personel Komisyon Oranı (%)" name="commissionRate" type="number" defaultValue={editingService?.commissionRate} />
                  <InputBase label="Ürün Maliyeti (TL)" name="productCost" type="number" defaultValue={editingService?.productCostPerSession} />
               </div>
               <InputBase label="Enerji/Genel Gider (TL/dk)" name="energyOverhead" type="number" defaultValue={editingService?.energyAndOverheadPerMinute} placeholder="Varsayılan: 5" />
               <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Stoktan Düşülecek Ürün</label>
                  <select name="linkedProductId" defaultValue={editingService?.linkedProductId} className="w-full p-5 bg-slate-50 rounded-2xl font-black outline-none border-2 border-transparent focus:border-slate-900">
                     <option value="">Seçiniz...</option>
                     {products.filter(p => p.isProfessional).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
               </div>
            </div>
            <button type="submit" className="w-full py-8 bg-slate-900 text-white rounded-[2.5rem] font-black text-2xl shadow-3xl hover:bg-black transition-all">Kaydet</button>
          </form>
        </div>
      )}

      {/* STAFF MODAL */}
      {showStaffModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-lg p-6">
          <form onSubmit={handleStaffSubmit} className="bg-white w-full max-w-xl rounded-[4rem] p-16 space-y-8 animate-in zoom-in-95 shadow-3xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-4xl font-black tracking-tighter italic">Personel</h3>
              <button type="button" onClick={() => setShowStaffModal(false)} className="p-4 bg-slate-100 rounded-full"><X /></button>
            </div>
            <InputBase label="Ad Soyad" name="name" defaultValue={editingStaff?.name} />
            <InputBase label="Rol / Unvan" name="role" defaultValue={editingStaff?.role} />
            <InputBase label="Performans Puanı (Başlangıç)" name="performance" type="number" defaultValue={editingStaff?.performanceScore} />
            <button type="submit" className="w-full py-8 bg-slate-900 text-white rounded-[2.5rem] font-black text-2xl shadow-3xl hover:bg-black transition-all">Kaydet</button>
          </form>
        </div>
      )}

      {/* DRINK MODAL */}
      {showDrinkModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-lg p-6">
          <form onSubmit={handleDrinkSubmit} className="bg-white w-full max-w-xl rounded-[4rem] p-16 space-y-8 animate-in zoom-in-95 shadow-3xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-4xl font-black tracking-tighter italic">İçecek</h3>
              <button type="button" onClick={() => setShowDrinkModal(false)} className="p-4 bg-slate-100 rounded-full"><X /></button>
            </div>
            <InputBase label="İçecek Adı" name="name" defaultValue={editingDrink?.name} />
            <InputBase label="Emoji İkonu" name="icon" defaultValue={editingDrink?.icon} placeholder="☕" />
            <InputBase label="Açıklama" name="description" defaultValue={editingDrink?.description} />
            <button type="submit" className="w-full py-8 bg-slate-900 text-white rounded-[2.5rem] font-black text-2xl shadow-3xl hover:bg-black transition-all">Kaydet</button>
          </form>
        </div>
      )}
    </div>
  );
};

const TabBtn = ({ active, onClick, icon: Icon, label }: any) => (
  <button onClick={onClick} className={`px-6 py-3 rounded-2xl flex items-center gap-2 font-black text-xs uppercase tracking-widest transition-all shrink-0 ${active ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'}`}>
    <Icon size={16} /> {label}
  </button>
);

const ManagementCard = ({ title, sub, price, onDelete, onEdit }: any) => (
  <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 flex flex-col justify-between group hover:border-slate-300 transition-all shadow-sm">
    <div>
      <h4 className="text-xl font-black text-slate-900 mb-1 italic">{title}</h4>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">{sub}</p>
      {price && <p className="mt-4 text-2xl font-black text-slate-900 tracking-tighter">{price}</p>}
    </div>
    <div className="flex justify-end gap-2 mt-8">
      <button onClick={onEdit} className="p-3 bg-white text-slate-300 hover:text-indigo-600 rounded-xl shadow-sm transition-colors border border-slate-100"><Edit size={18}/></button>
      <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-3 bg-white text-slate-300 hover:text-rose-600 rounded-xl shadow-sm transition-colors border border-slate-100"><Trash2 size={18}/></button>
    </div>
  </div>
);

const AddCard = ({ onClick, label, icon: Icon, color }: any) => {
  const colors: any = { rose: 'hover:text-rose-500 hover:border-rose-200', indigo: 'hover:text-indigo-500 hover:border-indigo-200', amber: 'hover:text-amber-500 hover:border-amber-200' };
  return (
    <button onClick={onClick} className={`border-4 border-dashed border-slate-100 rounded-[2.5rem] p-10 flex flex-col items-center justify-center text-slate-200 transition-all group ${colors[color]}`}>
      <Icon size={48} className="group-hover:scale-110 transition-transform" />
      <p className="font-black uppercase mt-4 text-xs tracking-widest">{label}</p>
    </button>
  );
};

const InputBase = ({ label, value, defaultValue, onChange, type = 'text', name, icon: Icon, placeholder }: any) => (
  <div className="relative group w-full">
    <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest">{label}</label>
    <div className="relative">
      {Icon && <Icon className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-900 transition-colors" size={18} />}
      <input 
        name={name}
        type={type} 
        value={value} 
        defaultValue={defaultValue}
        placeholder={placeholder}
        onChange={e => onChange?.(e.target.value)} 
        className={`w-full ${Icon ? 'pl-14' : 'px-6'} py-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none font-black focus:border-slate-900 focus:bg-white transition-all`} 
        required
      />
    </div>
  </div>
);
