
import React, { useState, useMemo } from 'react';
import { useSalon } from '../store/SalonContext';
import { optimizeSchedule } from '../geminiService';
import { Calendar, Clock, MessageSquare, Plus, Trash2, X, User, Activity, MessageCircle, ChevronLeft, ChevronRight, CheckCircle2, Bell, Send, Sparkles, TrendingUp, Zap } from 'lucide-react';

export const Appointments: React.FC = () => {
  const { appointments, customers, services, staff, addAppointment, updateAppointmentStatus, deleteData, currentRole } = useSalon();
  const [showForm, setShowForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [newApp, setNewApp] = useState({ customerId: '', serviceId: '', staffId: '', date: new Date().toISOString().split('T')[0], time: '' });
  const [viewMode, setViewMode] = useState<'TIME' | 'STAFF'>('TIME');
  
  // Optimization States
  const [showOptimization, setShowOptimization] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState<any>(null);

  // Saat Dilimleri (09:00 - 20:00)
  const timeSlots = Array.from({ length: 12 }, (_, i) => {
    const hour = i + 9;
    return `${hour < 10 ? '0' + hour : hour}:00`;
  });

  const handleOptimize = async () => {
    setIsOptimizing(true);
    setShowOptimization(true);
    try {
        const result = await optimizeSchedule(appointments, services);
        setOptimizationResult(result);
    } catch (e) {
        alert("Optimizasyon sırasında bir hata oluştu.");
        setShowOptimization(false);
    }
    setIsOptimizing(false);
  };

  const handleAdd = () => {
    if(!newApp.customerId || !newApp.date || !newApp.time) return;
    addAppointment({
      id: Math.random().toString(36).substr(2, 9),
      ...newApp,
      status: 'PENDING',
      reminderSent: false
    });
    setShowForm(false);
  };

  const handleNotifyWhatsApp = (customer: any, app: any) => {
    const serviceName = services.find(s => s.id === app.serviceId)?.name || 'Hizmet';
    const message = `Merhaba Sayın ${customer.fullName}, L'YSF Life Center'dan randevu hatırlatması: ${app.date} tarihinde saat ${app.time}'da ${serviceName} randevunuz bulunmaktadır. Sizi bekliyoruz! ✨`;
    const phone = customer.phone.replace(/\D/g, '');
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handleTodayReminders = () => {
      const todayStr = new Date().toISOString().split('T')[0];
      const todaysAppointments = appointments.filter(a => a.date === todayStr && a.status === 'PENDING');

      if (todaysAppointments.length === 0) {
          alert(`Bugün (${todayStr}) için hatırlatılacak bekleyen randevu yok.`);
          return;
      }

      if (confirm(`Bugün tarihli ${todaysAppointments.length} adet randevu için WhatsApp hatırlatması gönderilsin mi?`)) {
          alert(`✅ İŞLEM BAŞLATILDI: ${todaysAppointments.length} kişiye 'Bugün Randevunuz Var' mesajı gönderim kuyruğuna alındı.`);
      }
  };

  const handleAutoReminders = () => {
      // 1 gün sonrasını hesapla
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split('T')[0];
      
      // Yarınki randevuları bul
      const tomorrowsAppointments = appointments.filter(a => a.date === dateStr);
      
      if (tomorrowsAppointments.length === 0) {
          alert(`Yarın (${dateStr}) için planlanmış randevu bulunamadı.`);
          return;
      }

      // Burada gerçek bir SMS servisi olmadığı için simüle ediyoruz
      // Normalde backend'e bir istek atılırdı.
      alert(`✅ BAŞARILI: Yarın için toplam ${tomorrowsAppointments.length} müşteriye ve ilgili personele otomatik hatırlatma SMS/E-posta kuyruğa eklendi.`);
  };

  const dailyAppointments = useMemo(() => {
    return appointments.filter(a => a.date === selectedDate);
  }, [appointments, selectedDate]);

  const getAppointmentsForSlot = (time: string) => {
    return dailyAppointments.filter(a => a.time >= time && a.time < `${parseInt(time) + 1}:00`).sort((a,b) => a.time.localeCompare(b.time));
  };

  const changeDate = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header & Date Controls */}
      <div className="bg-white rounded-[3rem] p-8 shadow-xl border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-6">
           <div className="bg-rose-50 p-4 rounded-2xl text-rose-500"><Calendar size={32} /></div>
           <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight italic">Randevu Ajandası</h2>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">GÜNLÜK PLANLAMA</p>
           </div>
        </div>

        <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-full border border-slate-100">
           <button onClick={() => changeDate(-1)} className="p-3 bg-white rounded-full shadow-sm hover:bg-slate-900 hover:text-white transition-all"><ChevronLeft size={20}/></button>
           <div className="px-6 text-center min-w-[150px]">
              <span className="block text-sm font-black text-slate-900 uppercase tracking-widest">
                {new Date(selectedDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' })}
              </span>
           </div>
           <button onClick={() => changeDate(1)} className="p-3 bg-white rounded-full shadow-sm hover:bg-slate-900 hover:text-white transition-all"><ChevronRight size={20}/></button>
        </div>

        <div className="bg-slate-100 p-1 rounded-xl flex gap-1">
            <button onClick={() => setViewMode('TIME')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'TIME' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Zaman</button>
            <button onClick={() => setViewMode('STAFF')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'STAFF' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Personel</button>
        </div>

        <div className="flex gap-2">
            <button 
                onClick={handleTodayReminders}
                className="bg-emerald-500 text-white px-6 py-4 rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-xl hover:bg-emerald-600 transition-all flex items-center gap-2"
                title="Bugünkü randevulara hatırlatma gönder"
            >
                <Send size={18} /> Bugün
            </button>
            <button 
                onClick={handleAutoReminders}
                className="bg-indigo-500 text-white px-6 py-4 rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-xl hover:bg-indigo-600 transition-all flex items-center gap-2"
                title="Yarınki tüm randevulara otomatik hatırlatma gönder"
            >
                <Bell size={18} /> Yarın
            </button>
            <button 
                onClick={handleOptimize}
                className="bg-amber-500 text-white px-6 py-4 rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-xl hover:bg-amber-600 transition-all flex items-center gap-2"
                title="Yapay Zeka ile Randevu Optimizasyonu"
            >
                <Sparkles size={18} /> AI Optimizasyon
            </button>
            <button 
              onClick={() => setShowForm(true)}
              className="bg-slate-900 text-white px-8 py-4 rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-xl hover:bg-black transition-all flex items-center gap-3"
            >
              <Plus size={18} /> Yeni Randevu
            </button>
        </div>
      </div>

      {/* Timeline / Staff View */}
      <div className="bg-white rounded-[3rem] shadow-xl border border-slate-100 overflow-hidden relative min-h-[800px]">
         {viewMode === 'TIME' ? (
             <>
                 <div className="absolute left-24 top-0 bottom-0 w-px bg-slate-100 z-0"></div>
                 <div className="divide-y divide-slate-50 relative z-10">
                    {timeSlots.map(time => {
                      const slotApps = getAppointmentsForSlot(time);
                      return (
                        <div key={time} className="flex min-h-[120px] group hover:bg-slate-50/30 transition-colors">
                           {/* Time Column */}
                           <div className="w-24 flex-shrink-0 p-6 text-right border-r border-slate-100 bg-white sticky left-0 z-20">
                              <span className="text-sm font-black text-slate-400 group-hover:text-rose-500 transition-colors">{time}</span>
                           </div>

                           {/* Appointments Area */}
                           <div className="flex-1 p-4 flex flex-wrap gap-4 items-start content-start">
                              {slotApps.length === 0 && (
                                <div className="w-full h-full flex items-center opacity-0 group-hover:opacity-100 transition-opacity px-4">
                                   <button onClick={() => { setNewApp({...newApp, date: selectedDate, time}); setShowForm(true); }} className="text-xs font-bold text-slate-300 hover:text-indigo-500 flex items-center gap-2 border border-dashed border-slate-200 px-4 py-2 rounded-xl">
                                      <Plus size={14}/> Bu Saate Ekle
                                   </button>
                                </div>
                              )}
                              
                              {slotApps.map(app => {
                                const customer = customers.find(c => c.id === app.customerId);
                                const service = services.find(s => s.id === app.serviceId);
                                const staffMember = staff.find(s => s.id === app.staffId);
                                
                                return (
                                  <div key={app.id} className={`relative p-5 rounded-[2rem] border shadow-sm min-w-[280px] hover:shadow-lg transition-all flex flex-col gap-2 ${app.status === 'COMPLETED' ? 'bg-emerald-50 border-emerald-100 opacity-70' : 'bg-white border-slate-200'}`}>
                                     <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-2">
                                           <Clock size={14} className={app.status === 'COMPLETED' ? "text-emerald-500" : "text-rose-500"} />
                                           <span className="text-sm font-black text-slate-900">{app.time}</span>
                                        </div>
                                        {app.status === 'COMPLETED' && <CheckCircle2 size={16} className="text-emerald-500" />}
                                     </div>
                                     
                                     <div>
                                        <h4 className="font-black text-slate-900 italic truncate">{customer?.fullName}</h4>
                                        <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest truncate">{service?.name}</p>
                                     </div>

                                     <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100/50">
                                        <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500">
                                           {staffMember?.name.charAt(0)}
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-400 truncate max-w-[100px]">{staffMember?.name}</span>
                                     </div>

                                     {/* Actions Overlay */}
                                     <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleNotifyWhatsApp(customer, app)} className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-500 hover:text-white" title="WhatsApp"><MessageCircle size={14}/></button>
                                        {app.status === 'PENDING' && (
                                           <button onClick={() => updateAppointmentStatus(app.id, 'COMPLETED')} className="p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-500 hover:text-white" title="Tamamla"><CheckCircle2 size={14}/></button>
                                        )}
                                        {currentRole === 'MANAGER' && (
                                           <button onClick={() => deleteData(app.id, 'APPOINTMENT')} className="p-2 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-500 hover:text-white" title="Sil"><Trash2 size={14}/></button>
                                        )}
                                     </div>
                                  </div>
                                );
                              })}
                           </div>
                        </div>
                      );
                    })}
                 </div>
             </>
         ) : (
             <div className="flex h-full overflow-x-auto">
                 {/* Time Column */}
                 <div className="w-24 flex-shrink-0 border-r border-slate-100 bg-white sticky left-0 z-20">
                     <div className="h-20 border-b border-slate-100 flex items-center justify-center bg-slate-50">
                         <Clock size={20} className="text-slate-400"/>
                     </div>
                     {timeSlots.map(time => (
                         <div key={time} className="h-32 border-b border-slate-50 flex items-center justify-center text-xs font-black text-slate-400">
                             {time}
                         </div>
                     ))}
                 </div>

                 {/* Staff Columns */}
                 {staff.map(s => (
                     <div key={s.id} className="min-w-[250px] flex-1 border-r border-slate-100">
                         <div className="h-20 border-b border-slate-100 flex items-center justify-center bg-slate-50 sticky top-0 z-10">
                             <div className="flex items-center gap-3">
                                 <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-xs font-black text-slate-600">
                                     {s.name.charAt(0)}
                                 </div>
                                 <span className="font-black text-slate-900 text-sm">{s.name}</span>
                             </div>
                         </div>
                         {timeSlots.map(time => {
                             const app = dailyAppointments.find(a => a.staffId === s.id && a.time >= time && a.time < `${parseInt(time) + 1}:00`);
                             const customer = app ? customers.find(c => c.id === app.customerId) : null;
                             const service = app ? services.find(srv => srv.id === app.serviceId) : null;

                             return (
                                 <div key={time} className="h-32 border-b border-slate-50 p-2 relative group hover:bg-slate-50/50 transition-colors">
                                     {app ? (
                                         <div className={`w-full h-full rounded-2xl p-3 border shadow-sm flex flex-col justify-between relative group/card ${app.status === 'COMPLETED' ? 'bg-emerald-50 border-emerald-100 opacity-80' : 'bg-white border-indigo-100 hover:border-indigo-300'}`}>
                                             <div>
                                                 <p className="text-[10px] font-black text-slate-400 mb-1">{app.time}</p>
                                                 <h5 className="font-black text-slate-900 text-sm truncate">{customer?.fullName}</h5>
                                                 <p className="text-[10px] font-bold text-indigo-500 truncate">{service?.name}</p>
                                             </div>
                                             
                                             <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity bg-white/80 backdrop-blur-sm p-1 rounded-lg">
                                                 <button onClick={() => handleNotifyWhatsApp(customer, app)} className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-500 hover:text-white"><MessageCircle size={12}/></button>
                                                 {app.status === 'PENDING' && (
                                                     <button onClick={() => updateAppointmentStatus(app.id, 'COMPLETED')} className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-500 hover:text-white"><CheckCircle2 size={12}/></button>
                                                 )}
                                                 {currentRole === 'MANAGER' && (
                                                     <button onClick={() => deleteData(app.id, 'APPOINTMENT')} className="p-1.5 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-500 hover:text-white"><Trash2 size={12}/></button>
                                                 )}
                                             </div>
                                         </div>
                                     ) : (
                                         <button 
                                             onClick={() => { setNewApp({...newApp, date: selectedDate, time, staffId: s.id}); setShowForm(true); }}
                                             className="w-full h-full rounded-2xl border-2 border-dashed border-slate-100 flex items-center justify-center text-slate-300 hover:border-indigo-200 hover:text-indigo-400 hover:bg-indigo-50/30 transition-all opacity-0 group-hover:opacity-100"
                                         >
                                             <Plus size={20} />
                                         </button>
                                     )}
                                 </div>
                             );
                         })}
                     </div>
                 ))}
             </div>
         )}
      </div>

      {/* Randevu Ekleme Modalı */}
      {showForm && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
          <div className="bg-white w-full max-w-xl rounded-[3rem] p-10 shadow-3xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-10">
              <h3 className="text-2xl font-black italic">Randevu Oluştur</h3>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-slate-100 rounded-full"><X /></button>
            </div>
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Müşteri Seç</label>
                <select value={newApp.customerId} onChange={e => setNewApp({...newApp, customerId: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 font-bold outline-none focus:border-slate-900 transition-all">
                  <option value="">Seçiniz...</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.fullName}</option>)}
                </select>
                {newApp.customerId && (() => {
                    const c = customers.find(cust => cust.id === newApp.customerId);
                    const activePkgs = c?.packages?.filter(p => p.remainingSessions > 0) || [];
                    const rewards = []; // TODO: Calculate rewards based on rules
                    
                    return (
                        <div className="mt-2 space-y-2">
                            {activePkgs.length > 0 && (
                                <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-100">
                                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Aktif Paketler</p>
                                    {activePkgs.map(p => (
                                        <div key={p.id} className="text-xs font-bold text-indigo-900 flex justify-between">
                                            <span>{p.name}</span>
                                            <span>{p.remainingSessions} Seans Kaldı</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {c?.loyaltyStamps && (
                                <div className="bg-amber-50 p-3 rounded-xl border border-amber-100 flex gap-4">
                                    <div>
                                        <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Cilt Puan</p>
                                        <p className="text-sm font-black text-amber-900">{c.loyaltyStamps.skinCare || 0}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Tırnak Puan</p>
                                        <p className="text-sm font-black text-amber-900">{c.loyaltyStamps.nail || 0}</p>
                                    </div>
                                    {c.loyaltyStamps.diet && (
                                        <div>
                                            <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Diyet Puan</p>
                                            <p className="text-sm font-black text-amber-900">{c.loyaltyStamps.diet || 0}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })()}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Hizmet</label>
                  <select value={newApp.serviceId} onChange={e => setNewApp({...newApp, serviceId: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 font-bold outline-none focus:border-slate-900 transition-all">
                    <option value="">Seçiniz...</option>
                    {Array.from(new Set(services.map(s => s.category))).map(cat => (
                        <optgroup key={cat} label={cat}>
                            {services.filter(s => s.category === cat).map(s => (
                                <option key={s.id} value={s.id}>{s.name} ({s.duration} dk) - {s.price} TL</option>
                            ))}
                        </optgroup>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Uzman</label>
                  <select value={newApp.staffId} onChange={e => setNewApp({...newApp, staffId: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 font-bold outline-none focus:border-slate-900 transition-all">
                    <option value="">Seçiniz...</option>
                    {staff.map(st => <option key={st.id} value={st.id}>{st.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Tarih</label>
                  <input type="date" value={newApp.date} onChange={e => setNewApp({...newApp, date: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 font-bold outline-none focus:border-slate-900 transition-all" />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Saat</label>
                  <input type="time" value={newApp.time} onChange={e => setNewApp({...newApp, time: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 font-bold outline-none focus:border-slate-900 transition-all" />
                </div>
              </div>
              <button onClick={handleAdd} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-lg hover:bg-black transition-all shadow-xl">Randevuyu Kaydet</button>
            </div>
          </div>
        </div>
      )}
      {/* AI Optimization Modal */}
      {showOptimization && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4">
            <div className="bg-white w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-[3rem] p-10 shadow-3xl animate-in zoom-in-95 relative">
                <button onClick={() => setShowOptimization(false)} className="absolute top-8 right-8 p-4 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors"><X /></button>
                
                <div className="flex items-center gap-4 mb-8">
                    <div className="p-4 bg-amber-50 text-amber-500 rounded-2xl"><Sparkles size={32} /></div>
                    <div>
                        <h3 className="text-3xl font-black italic tracking-tight">AI Randevu Optimizasyonu</h3>
                        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">GEMINI 3 PRO ANALYTICS</p>
                    </div>
                </div>

                {isOptimizing ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-20 h-20 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin mb-6"></div>
                        <h4 className="text-xl font-black text-slate-900">Veriler Analiz Ediliyor...</h4>
                        <p className="text-slate-500 mt-2">Geçmiş randevular, personel performansı ve müşteri tercihleri işleniyor.</p>
                    </div>
                ) : optimizationResult ? (
                    <div className="space-y-8">
                        {/* 1. Peak Hours & Popular Services */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100">
                                <h4 className="flex items-center gap-3 font-black text-slate-900 mb-6 text-lg"><Clock size={20} className="text-rose-500"/> Yoğun Saatler (Peak Hours)</h4>
                                <div className="space-y-3">
                                    {optimizationResult.peakHours?.map((p: any, i: number) => (
                                        <div key={i} className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                                            <span className="font-bold text-slate-700">{p.day} - {p.hour}</span>
                                            <span className="text-[10px] font-black bg-rose-100 text-rose-600 px-3 py-1 rounded-lg uppercase tracking-wider">{p.intensity}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100">
                                <h4 className="flex items-center gap-3 font-black text-slate-900 mb-6 text-lg"><TrendingUp size={20} className="text-emerald-500"/> Popüler Hizmetler</h4>
                                <div className="space-y-3">
                                    {optimizationResult.popularServices?.map((s: any, i: number) => (
                                        <div key={i} className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                                            <span className="font-bold text-slate-700">{s.serviceName}</span>
                                            <span className="text-sm font-black text-emerald-600">%{s.percentage}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* 2. Strategic Suggestions */}
                        <div className="bg-indigo-50 p-10 rounded-[3rem] border border-indigo-100 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-10 opacity-5"><Zap size={120}/></div>
                            <h4 className="flex items-center gap-3 font-black text-indigo-900 mb-6 text-xl relative z-10"><Zap size={24} className="text-indigo-600"/> Stratejik Öneriler</h4>
                            <ul className="space-y-4 relative z-10">
                                {optimizationResult.strategicSuggestions?.map((s: string, i: number) => (
                                    <li key={i} className="flex gap-4 items-start bg-white/60 p-4 rounded-2xl backdrop-blur-sm">
                                        <div className="mt-1 min-w-[20px]"><CheckCircle2 size={20} className="text-indigo-500"/></div>
                                        <p className="text-indigo-900 font-medium leading-relaxed">{s}</p>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* 3. Optimized Schedule Proposal */}
                        <div>
                            <h4 className="font-black text-slate-900 mb-6 text-2xl italic tracking-tight">Önerilen Program Akışı</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {optimizationResult.optimizedScheduleProposal?.map((item: any, i: number) => (
                                    <div key={i} className="bg-white border border-slate-200 p-8 rounded-[2.5rem] hover:shadow-xl transition-all group hover:-translate-y-1 duration-300">
                                        <div className="flex justify-between items-center mb-4">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{item.day}</span>
                                            <span className="text-xs font-black text-slate-900 bg-slate-100 px-3 py-1 rounded-lg">{item.hour}</span>
                                        </div>
                                        <h5 className="font-black text-slate-800 mb-3 text-lg group-hover:text-indigo-600 transition-colors">{item.focus}</h5>
                                        <p className="text-xs text-slate-500 leading-relaxed font-medium">{item.reason}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-20 text-slate-400">
                        <p>Analiz sonucu bulunamadı.</p>
                    </div>
                )}
            </div>
        </div>
      )}
    </div>
  );
};
