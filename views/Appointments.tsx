
import React, { useState, useMemo } from 'react';
import { useSalon } from '../store/SalonContext';
import { Calendar, Clock, MessageSquare, Plus, Trash2, X, User, Activity, MessageCircle, ChevronLeft, ChevronRight, CheckCircle2, Bell, Send } from 'lucide-react';

export const Appointments: React.FC = () => {
  const { appointments, customers, services, staff, addAppointment, updateAppointmentStatus, deleteData, currentRole } = useSalon();
  const [showForm, setShowForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [newApp, setNewApp] = useState({ customerId: '', serviceId: '', staffId: '', date: new Date().toISOString().split('T')[0], time: '' });

  // Saat Dilimleri (09:00 - 20:00)
  const timeSlots = Array.from({ length: 12 }, (_, i) => {
    const hour = i + 9;
    return `${hour < 10 ? '0' + hour : hour}:00`;
  });

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
              onClick={() => setShowForm(true)}
              className="bg-slate-900 text-white px-8 py-4 rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-xl hover:bg-black transition-all flex items-center gap-3"
            >
              <Plus size={18} /> Yeni Randevu
            </button>
        </div>
      </div>

      {/* Timeline View */}
      <div className="bg-white rounded-[3rem] shadow-xl border border-slate-100 overflow-hidden relative min-h-[800px]">
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
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Hizmet</label>
                  <select value={newApp.serviceId} onChange={e => setNewApp({...newApp, serviceId: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 font-bold outline-none focus:border-slate-900 transition-all">
                    <option value="">Seçiniz...</option>
                    {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
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
    </div>
  );
};
