import React, { useState, useEffect, useMemo } from 'react';
import { useSalon } from '../store/SalonContext';
import { fetchStaffPerformanceAnalytics, StaffPerformanceReport } from '../services/performanceService';
import { forecastDemand, analyzeProfitability, predictBusinessGrowth } from '../geminiService';
import { TrendingUp, Zap, ShieldAlert, Plus, Trash2, Wallet, Lock, Unlock, AlertOctagon, BrainCircuit, Activity, EyeOff, ShieldCheck, Percent, ShoppingBag, Bell, Clock, X, Calendar, AlertTriangle, TrendingDown, FileBarChart, CreditCard, Banknote, Coffee, CheckCircle, Truck, ChefHat, Star, MessageCircle, UserPlus, CheckCircle2, User, Smile, Frown, Meh, BarChart2, PieChart, Target, ArrowUpRight, ArrowDownRight, Loader2, FileDown, Printer, Rocket } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend, BarChart, Bar, Cell, RadialBarChart, RadialBar, Pie, PieChart as RePieChart } from 'recharts';
import { DrinkOrder, MembershipTier } from '../types';

export const ManagerDashboard: React.FC = () => {
  const { transactions, expenses, addExpense, deleteData, staff, currentRole, notifications, markNotifRead, checkServicePerformance, drinkOrders, updateDrinkOrderStatus, addCustomer, services } = useSalon();
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [isPanicMode, setIsPanicMode] = useState(false);
  const [isGhostMode, setIsGhostMode] = useState(false);
  const [globalDiscount, setGlobalDiscount] = useState(25);
  
  // API Fetch State
  const [apiPerformanceData, setApiPerformanceData] = useState<StaffPerformanceReport[] | null>(null);
  const [isLoadingApi, setIsLoadingApi] = useState(false);

  // Financial Audit State
  const [profitAnalysis, setProfitAnalysis] = useState<any>(null);
  const [demandForecast, setDemandForecast] = useState<any>(null);
  const [isAuditing, setIsAuditing] = useState(false);

  // Growth Forecast State
  const [growthForecast, setGrowthForecast] = useState<any>(null);
  const [isForecasting, setIsForecasting] = useState(false);

  // Dashboard açıldığında performans kontrolü yap
  useEffect(() => {
    if (currentRole === 'MANAGER') {
       checkServicePerformance();
       loadApiData();
    }
  }, [currentRole, transactions]); // Re-fetch when transactions change

  const loadApiData = async () => {
      setIsLoadingApi(true);
      try {
          const data = await fetchStaffPerformanceAnalytics(staff, transactions);
          setApiPerformanceData(data);
      } catch (error) {
          console.error("API Error:", error);
      }
      setIsLoadingApi(false);
  };

  const runFinancialAudit = async () => {
      setIsAuditing(true);
      try {
          const [profit, demand] = await Promise.all([
              analyzeProfitability(transactions, expenses, services),
              forecastDemand(transactions, services)
          ]);
          setProfitAnalysis(profit);
          setDemandForecast(demand);
      } catch (error) {
          console.error("Audit Error:", error);
          alert("Finansal denetim sırasında bir hata oluştu.");
      }
      setIsAuditing(false);
  };

  const runGrowthForecast = async () => {
      setIsForecasting(true);
      try {
          const result = await predictBusinessGrowth(transactions, services);
          setGrowthForecast(result);
      } catch (error) {
          console.error("Forecast Error:", error);
          alert("Büyüme tahmini sırasında bir hata oluştu.");
      }
      setIsForecasting(false);
  };

  const handleExport = (type: 'CSV' | 'PRINT') => {
      if (!profitAnalysis || !demandForecast) return;

      if (type === 'PRINT') {
          window.print();
      } else if (type === 'CSV') {
          const headers = ['Service Name', 'Revenue', 'Estimated Cost', 'Net Profit', 'Margin', 'Status'];
          const rows = profitAnalysis.serviceAnalysis.map((s: any) => [
              s.serviceName,
              s.revenue,
              s.estimatedCost,
              s.netProfit,
              s.margin,
              s.status
          ]);
          
          const csvContent = "data:text/csv;charset=utf-8," 
              + headers.join(",") + "\n" 
              + rows.map((e: any[]) => e.join(",")).join("\n");
              
          const encodedUri = encodeURI(csvContent);
          const link = document.createElement("a");
          link.setAttribute("href", encodedUri);
          link.setAttribute("download", `financial_audit_${new Date().toISOString().split('T')[0]}.csv`);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
      }
  };

  // GÜNLÜK GELİR TRENDİ VERİSİ (SON 14 GÜN)
  const dailyTrendData = useMemo(() => {
    const data = [];
    const today = new Date();
    
    // Son 14 günü oluştur
    for (let i = 13; i >= 0; i--) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        const key = d.toISOString().split('T')[0]; // YYYY-MM-DD
        const name = d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
        
        const dailyTotal = transactions
            .filter(t => t.timestamp.startsWith(key))
            .reduce((sum, t) => sum + t.grossRevenue, 0);
            
        data.push({ name, revenue: dailyTotal, date: key });
    }
    return data;
  }, [transactions]);

  // GELİR GRAFİĞİ VERİSİ (AYLIK)
  const chartData = useMemo(() => {
    const data: Record<string, { name: string; revenue: number; sortKey: string }> = {};
    
    if (transactions.length === 0) {
        // Veri yoksa son 6 ayı boş göster
        const today = new Date();
        for(let i=5; i>=0; i--) {
            const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            const name = d.toLocaleString('tr-TR', { month: 'short' });
            data[key] = { name, revenue: 0, sortKey: key };
        }
    } else {
        transactions.forEach(t => {
            const date = new Date(t.timestamp);
            const monthNames = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
            const monthIndex = date.getMonth();
            const year = date.getFullYear();
            const sortKey = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
            const name = `${monthNames[monthIndex]}`;
    
            if (!data[sortKey]) {
                data[sortKey] = { name, revenue: 0, sortKey };
            }
            data[sortKey].revenue += t.grossRevenue;
        });
    }

    return Object.values(data).sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  }, [transactions]);

  // DAILY REPORT DATA
  const dailyReport = useMemo(() => {
      const today = new Date().toISOString().split('T')[0];
      const todayTx = transactions.filter(t => t.timestamp.startsWith(today));
      
      const byStaff: Record<string, { name: string, count: number, revenue: number, totalRating: number, ratedCount: number }> = {};
      let cash = 0;
      let card = 0;
      let transfer = 0;

      todayTx.forEach(t => {
          const s = staff.find(st => st.id === t.staffId);
          const sName = s?.name || 'Bilinmeyen';
          
          if (!byStaff[t.staffId]) byStaff[t.staffId] = { name: sName, count: 0, revenue: 0, totalRating: 0, ratedCount: 0 };
          byStaff[t.staffId].count += 1;
          byStaff[t.staffId].revenue += t.grossRevenue;
          
          if (t.rating) {
              byStaff[t.staffId].totalRating += t.rating;
              byStaff[t.staffId].ratedCount += 1;
          }

          if (t.paymentType === 'CASH') cash += t.grossRevenue;
          else if (t.paymentType === 'CARD') card += t.grossRevenue;
          else transfer += t.grossRevenue;
      });

      return {
          staffBreakdown: Object.values(byStaff).map(s => ({
              ...s,
              avgRating: s.ratedCount > 0 ? (s.totalRating / s.ratedCount).toFixed(1) : '-'
          })),
          totals: { cash, card, transfer, total: cash + card + transfer },
          count: todayTx.length
      };
  }, [transactions, staff]);

  const activeDrinkOrders = drinkOrders.filter(o => o.status !== 'DELIVERED');

  if (currentRole !== 'MANAGER') {
    return (
      <div className="flex flex-col items-center justify-center py-40 text-center space-y-6">
         <div className="w-24 h-24 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center animate-bounce"><ShieldAlert size={64}/></div>
         <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">Erişim Reddedildi</h2>
         <p className="text-slate-400 font-bold max-w-sm">Master yetkisi olmadan bu bölüme erişemezsiniz.</p>
      </div>
    );
  }

  const unreadNotifs = notifications.filter(n => !n.isRead);
  const totalGross = transactions.reduce((acc, t) => acc + t.grossRevenue, 0);
  const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
  const netProfit = totalGross - totalExpenses;

  const handleDrinkStatus = (order: DrinkOrder) => {
      if (order.status === 'RECEIVED') updateDrinkOrderStatus(order.id, 'PREPARING');
      else if (order.status === 'PREPARING') updateDrinkOrderStatus(order.id, 'ON_THE_WAY');
      else if (order.status === 'ON_THE_WAY') updateDrinkOrderStatus(order.id, 'DELIVERED');
  };

  const handleApproveRegistration = async (notif: any) => {
      if (!notif.data || !notif.data.name || !notif.data.phone) return;
      
      const newCustomer = {
          id: Math.random().toString(36).substr(2, 9),
          fullName: notif.data.name,
          phone: notif.data.phone,
          tcNo: '', 
          tier: MembershipTier.BRONZE, 
          branchId: 'b1',
          dna: { spendingPattern: 0, churnRisk: 0, packagePropensity: 0, luxuryTrendScore: 0, nextVisitPrediction: '', loyaltyPuan: 0, totalSpent: 0 },
          packages: [], 
          history: [], 
          consentSigned: false, 
          signedDocuments: [], 
          preferences: { music: '', drink: '', notes: '' }, 
          bodyAnalysis: [], 
          gallery: [], 
          loyaltyStamps: { skinCare: 0, nail: 0 }, 
          active: true
      };
      
      await addCustomer(newCustomer);
      await markNotifRead(notif.id);
      alert(`${notif.data.name} sisteme başarıyla kaydedildi!`);
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-1000 pb-20">
      {/* EXECUTIVE COMMAND CENTER */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className={`p-10 rounded-[3rem] transition-all duration-500 flex items-center justify-between ${isPanicMode ? 'bg-rose-600' : 'bg-slate-900'} text-white shadow-2xl`}>
            <div className="flex items-center gap-6">
                <div className={`p-4 rounded-3xl ${isPanicMode ? 'bg-white text-rose-600' : 'bg-white/10 text-white animate-pulse'}`}><AlertOctagon size={32} /></div>
                <div>
                  <h2 className="text-xl font-black uppercase italic">{isPanicMode ? 'KİLİTLİ' : 'GÜVENLİ'}</h2>
                  <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest">PANİK KİLİDİ</p>
                </div>
            </div>
            <button onClick={() => setIsPanicMode(!isPanicMode)} className={`p-4 rounded-2xl transition-all ${isPanicMode ? 'bg-white text-rose-600' : 'bg-rose-500'}`}>
                {isPanicMode ? <Unlock /> : <Lock />}
            </button>
          </div>

          <div className={`p-10 rounded-[3rem] transition-all duration-500 flex items-center justify-between ${isGhostMode ? 'bg-indigo-600' : 'bg-white border border-slate-100'} shadow-xl`}>
            <div className="flex items-center gap-6">
                <div className={`p-4 rounded-3xl ${isGhostMode ? 'bg-white/10 text-white' : 'bg-indigo-50 text-indigo-600'}`}><EyeOff size={32} /></div>
                <div>
                  <h2 className={`text-xl font-black uppercase italic ${isGhostMode ? 'text-white' : 'text-slate-900'}`}>{isGhostMode ? 'GİZLİ' : 'AÇIK'}</h2>
                  <p className={`text--[10px] font-bold uppercase tracking-widest ${isGhostMode ? 'text-indigo-200' : 'text-slate-400'}`}>HAYALET MODU</p>
                </div>
            </div>
            <button onClick={() => setIsGhostMode(!isGhostMode)} className={`p-4 rounded-2xl transition-all ${isGhostMode ? 'bg-white text-indigo-600' : 'bg-slate-900 text-white'}`}>
                {isGhostMode ? 'GÖSTER' : 'GİZLE'}
            </button>
          </div>

          <div className="bg-white border border-slate-100 p-10 rounded-[3rem] shadow-xl flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="p-4 bg-emerald-50 text-emerald-500 rounded-3xl"><Percent size={32} /></div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 italic">OFFER %</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">TABLET İNDİRİM</p>
                </div>
              </div>
              <input 
                type="number" 
                value={globalDiscount} 
                onChange={(e) => setGlobalDiscount(Number(e.target.value))}
                className="w-20 p-4 bg-slate-50 rounded-2xl font-black text-center text-xl outline-none focus:bg-white transition-all border border-transparent focus:border-emerald-500"
              />
          </div>

          <div className="bg-rose-500 p-10 rounded-[3rem] shadow-2xl text-white flex items-center justify-between relative overflow-hidden group">
              <Bell className="absolute -right-2 -bottom-2 opacity-10 rotate-12 group-hover:scale-150 transition-transform" size={120} />
              <div className="flex items-center gap-6 relative z-10">
                <div className="p-4 bg-white/20 rounded-3xl backdrop-blur-md"><ShoppingBag size={32} /></div>
                <div>
                  <h2 className="text-xl font-black italic">ALERT</h2>
                  <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest">CANLI BİLDİRİM</p>
                </div>
              </div>
              <p className="text-4xl font-black relative z-10">{unreadNotifs.length}</p>
          </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
        <div className="xl:col-span-8 space-y-10">
            <div className="bg-white rounded-[4rem] p-16 shadow-sm border border-slate-100 relative overflow-hidden">
                {isGhostMode && <div className="absolute inset-0 bg-white/60 backdrop-blur-3xl z-10 flex items-center justify-center font-black text-slate-300 uppercase tracking-[2em]">HAYALET KORUMASI</div>}
                <div className="flex flex-col lg:flex-row justify-between items-center gap-10">
                <div>
                    <h1 className="text-8xl font-black tracking-tighter mb-4 text-slate-900 italic">Audit Master<span className="text-rose-500">.</span></h1>
                    <p className="text-slate-400 font-bold text-xl uppercase tracking-[0.4em]">Life Center Finansal Komuta</p>
                </div>
                <div className="flex gap-8">
                    <FinCard label="Toplam Brüt" val={totalGross} color="slate" />
                    <FinCard label="Net Kar Analizi" val={netProfit} color="emerald" />
                </div>
                </div>
            </div>

            {/* FINANCIAL AUDIT SECTION (GERMAN DISCIPLINE) */}
            <div className="bg-white rounded-[4rem] p-16 shadow-sm border border-slate-100 relative overflow-hidden">
                <div className="flex justify-between items-center mb-12">
                    <div>
                        <h3 className="text-4xl font-black italic tracking-tighter text-slate-900 flex items-center gap-4"><Target className="text-rose-600" size={40}/> Finansal Denetim</h3>
                        <p className="text-slate-400 font-bold uppercase tracking-[0.2em] mt-2">KARLILIK & TALEP TAHMİNİ</p>
                    </div>
                    <div className="flex gap-2">
                        {profitAnalysis && (
                            <>
                                <button onClick={() => handleExport('CSV')} className="p-4 bg-slate-100 text-slate-600 rounded-2xl hover:bg-slate-200 transition-colors" title="CSV İndir"><FileDown size={20}/></button>
                                <button onClick={() => handleExport('PRINT')} className="p-4 bg-slate-100 text-slate-600 rounded-2xl hover:bg-slate-200 transition-colors" title="Yazdır"><Printer size={20}/></button>
                            </>
                        )}
                        <button 
                            onClick={runFinancialAudit} 
                            disabled={isAuditing}
                            className={`px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-sm transition-all flex items-center gap-3 ${isAuditing ? 'bg-slate-100 text-slate-400 cursor-wait' : 'bg-slate-900 text-white hover:bg-rose-600 shadow-xl'}`}
                        >
                            {isAuditing ? <><Loader2 className="animate-spin"/> Denetleniyor...</> : <><Zap size={18}/> Denetimi Başlat</>}
                        </button>
                    </div>
                </div>

                {profitAnalysis && demandForecast && (
                    <div className="space-y-12 animate-in slide-in-from-bottom-10">
                        {/* 1. PROFITABILITY CARDS */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="bg-emerald-50 p-8 rounded-[3rem] border border-emerald-100">
                                <p className="text-[10px] font-black uppercase text-emerald-400 tracking-widest mb-4">EN KARLI HİZMETLER</p>
                                <ul className="space-y-4">
                                    {profitAnalysis.topPerformers.slice(0, 3).map((s: string, i: number) => (
                                        <li key={i} className="flex items-center gap-3 font-black text-emerald-900 text-lg"><ArrowUpRight size={20}/> {s}</li>
                                    ))}
                                </ul>
                            </div>
                            <div className="bg-rose-50 p-8 rounded-[3rem] border border-rose-100">
                                <p className="text-[10px] font-black uppercase text-rose-400 tracking-widest mb-4">KRİTİK HİZMETLER</p>
                                <ul className="space-y-4">
                                    {profitAnalysis.underPerformers.slice(0, 3).map((s: string, i: number) => (
                                        <li key={i} className="flex items-center gap-3 font-black text-rose-900 text-lg"><ArrowDownRight size={20}/> {s}</li>
                                    ))}
                                </ul>
                            </div>
                            <div className="bg-slate-900 p-8 rounded-[3rem] text-white relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 opacity-10"><FileBarChart size={100}/></div>
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">DENETÇİ RAPORU</p>
                                <p className="text-sm font-medium italic leading-relaxed opacity-80 relative z-10">"{profitAnalysis.auditReport.slice(0, 200)}..."</p>
                            </div>
                        </div>

                        {/* 2. DEMAND FORECAST CHART */}
                        <div className="bg-slate-50 rounded-[3rem] p-10 border border-slate-100">
                            <h4 className="text-xl font-black italic text-slate-900 mb-8 flex items-center gap-3"><TrendingUp size={24} className="text-indigo-600"/> Gelecek Ay Talep Tahmini</h4>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={demandForecast.forecasts.sort((a:any,b:any) => b.predictedCount - a.predictedCount).slice(0, 8)}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                        <XAxis dataKey="serviceName" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10, fontWeight: 700}} interval={0} angle={-15} textAnchor="end" height={60}/>
                                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10, fontWeight: 700}} />
                                        <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontWeight: 'bold'}} />
                                        <Bar dataKey="predictedCount" name="Tahmini Adet" radius={[10, 10, 0, 0]}>
                                            {demandForecast.forecasts.map((entry: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={entry.trend === 'UP' ? '#10b981' : entry.trend === 'DOWN' ? '#f43f5e' : '#6366f1'} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="mt-6 flex gap-4 justify-center">
                                <div className="flex items-center gap-2 text-xs font-bold text-slate-500"><div className="w-3 h-3 rounded-full bg-emerald-500"></div> Yükseliş</div>
                                <div className="flex items-center gap-2 text-xs font-bold text-slate-500"><div className="w-3 h-3 rounded-full bg-indigo-500"></div> Stabil</div>
                                <div className="flex items-center gap-2 text-xs font-bold text-slate-500"><div className="w-3 h-3 rounded-full bg-rose-500"></div> Düşüş</div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* GROWTH FORECAST SECTION */}
            <div className="bg-white rounded-[4rem] p-16 shadow-sm border border-slate-100 relative overflow-hidden">
                <div className="flex justify-between items-center mb-12">
                    <div>
                        <h3 className="text-4xl font-black italic tracking-tighter text-slate-900 flex items-center gap-4"><Rocket className="text-indigo-600" size={40}/> Büyüme Tahmini</h3>
                        <p className="text-slate-400 font-bold uppercase tracking-[0.2em] mt-2">GELECEK 6 AY PROJEKSİYONU</p>
                    </div>
                    <button 
                        onClick={runGrowthForecast} 
                        disabled={isForecasting}
                        className={`px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-sm transition-all flex items-center gap-3 ${isForecasting ? 'bg-slate-100 text-slate-400 cursor-wait' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl'}`}
                    >
                        {isForecasting ? <><Loader2 className="animate-spin"/> Hesaplanıyor...</> : <><BrainCircuit size={18}/> Tahmin Oluştur</>}
                    </button>
                </div>

                {growthForecast && (
                    <div className="space-y-12 animate-in slide-in-from-bottom-10">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                             <div className="bg-indigo-50 p-8 rounded-[3rem] border border-indigo-100">
                                <p className="text-[10px] font-black uppercase text-indigo-400 tracking-widest mb-4">TAHMİNİ BÜYÜME</p>
                                <p className="text-5xl font-black text-indigo-900 tracking-tighter">%{growthForecast.growthRate}</p>
                                <p className="text-sm font-bold text-indigo-600 mt-2">Önümüzdeki 6 Ay</p>
                            </div>
                            <div className="bg-emerald-50 p-8 rounded-[3rem] border border-emerald-100">
                                <p className="text-[10px] font-black uppercase text-emerald-400 tracking-widest mb-4">POTANSİYEL CİRO</p>
                                <p className="text-4xl font-black text-emerald-900 tracking-tighter">{growthForecast.projectedRevenue.toLocaleString()} TL</p>
                                <p className="text-sm font-bold text-emerald-600 mt-2">Hedeflenen</p>
                            </div>
                             <div className="bg-slate-900 p-8 rounded-[3rem] text-white relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 opacity-10"><TrendingUp size={100}/></div>
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">STRATEJİK TAVSİYE</p>
                                <p className="text-sm font-medium italic leading-relaxed opacity-80 relative z-10">"{growthForecast.strategySuggestion}"</p>
                            </div>
                        </div>

                        <div className="bg-slate-50 rounded-[3rem] p-10 border border-slate-100">
                            <h4 className="text-xl font-black italic text-slate-900 mb-8">Fırsat Alanları</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {growthForecast.opportunities.map((opp: string, i: number) => (
                                    <div key={i} className="flex items-start gap-4 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                                        <div className="bg-indigo-100 text-indigo-600 p-2 rounded-xl"><Zap size={20}/></div>
                                        <p className="font-bold text-slate-700">{opp}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* PERFORMANCE & FEEDBACK INTELLIGENCE (NEW API MODULE) */}
            <div className="bg-slate-900 rounded-[4rem] p-12 text-white shadow-3xl relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-10">
                        <div className="flex items-center gap-6">
                            <div className="p-4 bg-indigo-500 rounded-3xl text-white shadow-lg shadow-indigo-500/50"><BarChart2 size={32} /></div>
                            <div>
                                <h3 className="text-3xl font-black italic tracking-tighter">Performans İstihbaratı</h3>
                                <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest">CANLI GERİ BİLDİRİM API</p>
                            </div>
                        </div>
                        {isLoadingApi && <div className="bg-white/10 px-4 py-2 rounded-full flex items-center gap-2 animate-pulse"><BrainCircuit size={16}/> <span className="text-xs font-bold">Veriler İşleniyor...</span></div>}
                    </div>

                    {!apiPerformanceData || apiPerformanceData.length === 0 ? (
                        <div className="py-20 text-center opacity-30 italic">Veri akışı bekleniyor...</div>
                    ) : (
                        <div className="space-y-8">
                            {/* Top Performers Row */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {apiPerformanceData.slice(0, 3).map((staff, idx) => (
                                    <div key={staff.staffId} className="bg-white/5 border border-white/10 p-6 rounded-[2.5rem] hover:bg-white/10 transition-all group">
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="w-12 h-12 bg-white text-slate-900 rounded-2xl flex items-center justify-center font-black text-lg shadow-lg">
                                                {idx + 1}
                                            </div>
                                            <div>
                                                <p className="font-black text-lg italic truncate">{staff.staffName}</p>
                                                <p className="text-[10px] uppercase tracking-widest text-slate-400">{staff.role}</p>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <p className="text-3xl font-black text-emerald-400">{staff.metrics.averageRating}</p>
                                                <div className="flex gap-1 mt-1 text-amber-400">
                                                    {[...Array(5)].map((_, i) => (
                                                        <Star key={i} size={10} fill={i < Math.round(staff.metrics.averageRating) ? "currentColor" : "none"} className={i < Math.round(staff.metrics.averageRating) ? "opacity-100" : "opacity-20"} />
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] text-slate-400 uppercase tracking-widest">NPS SKORU</p>
                                                <p className="text-xl font-bold text-indigo-300">{staff.metrics.npsScore}</p>
                                            </div>
                                        </div>
                                        {/* Recent Feedback Teaser */}
                                        {staff.feedbacks.length > 0 && (
                                            <div className="mt-4 pt-4 border-t border-white/5">
                                                <p className="text-[10px] text-slate-500 italic truncate flex items-center gap-2">
                                                    <MessageCircle size={10}/> "{staff.feedbacks[0].autoComment}"
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Detailed Feedback Stream */}
                            <div className="bg-black/20 rounded-[3rem] p-8 border border-white/5">
                                <h4 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2"><Activity size={14}/> Son Müşteri Reaksiyonları</h4>
                                <div className="space-y-4 max-h-[300px] overflow-y-auto no-scrollbar pr-2">
                                    {apiPerformanceData.flatMap(s => s.feedbacks.map(f => ({ ...f, staffName: s.staffName }))).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10).map((fb, i) => (
                                        <div key={i} className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                                            <div className={`p-2 rounded-xl ${fb.sentiment === 'POSITIVE' ? 'bg-emerald-500/20 text-emerald-400' : fb.sentiment === 'NEUTRAL' ? 'bg-amber-500/20 text-amber-400' : 'bg-rose-500/20 text-rose-400'}`}>
                                                {fb.sentiment === 'POSITIVE' ? <Smile size={20}/> : fb.sentiment === 'NEUTRAL' ? <Meh size={20}/> : <Frown size={20}/>}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-center mb-1">
                                                    <p className="font-bold text-sm text-white">{fb.staffName}</p>
                                                    <div className="flex items-center gap-1">
                                                        <span className="font-black text-amber-400">{fb.rating}</span>
                                                        <Star size={10} className="text-amber-400" fill="currentColor"/>
                                                    </div>
                                                </div>
                                                <p className="text-xs text-slate-300 italic">"{fb.autoComment}"</p>
                                                <p className="text-[9px] text-slate-500 mt-2 text-right">{new Date(fb.date).toLocaleDateString()} {new Date(fb.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* DAILY REPORT (Z-REPORT) SECTION */}
            <div className="bg-white rounded-[4rem] p-12 shadow-sm border border-slate-100">
               <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-6">
                     <div className="p-4 bg-indigo-50 text-indigo-600 rounded-3xl"><FileBarChart size={32} /></div>
                     <div>
                        <h3 className="text-2xl font-black text-slate-900 italic tracking-tighter">Gün Sonu Özeti</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">GÜNLÜK Z-RAPORU & PERSONEL CİRO</p>
                     </div>
                  </div>
                  <div className="text-right">
                     <p className="text-3xl font-black text-slate-900">{dailyReport.totals.total.toLocaleString()} TL</p>
                     <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">BUGÜNKÜ CİRO</p>
                  </div>
               </div>
               
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                  <div className="bg-slate-50 p-6 rounded-[2rem] flex items-center justify-between">
                     <div className="flex items-center gap-3"><Banknote className="text-emerald-500"/><span className="text-xs font-black text-slate-500 uppercase">NAKİT</span></div>
                     <span className="text-xl font-black text-slate-900">{dailyReport.totals.cash.toLocaleString()} TL</span>
                  </div>
                  <div className="bg-slate-50 p-6 rounded-[2rem] flex items-center justify-between">
                     <div className="flex items-center gap-3"><CreditCard className="text-indigo-500"/><span className="text-xs font-black text-slate-500 uppercase">KART</span></div>
                     <span className="text-xl font-black text-slate-900">{dailyReport.totals.card.toLocaleString()} TL</span>
                  </div>
                  <div className="bg-slate-50 p-6 rounded-[2rem] flex items-center justify-between">
                     <div className="flex items-center gap-3"><TrendingUp className="text-amber-500"/><span className="text-xs font-black text-slate-500 uppercase">HAVALE</span></div>
                     <span className="text-xl font-black text-slate-900">{dailyReport.totals.transfer.toLocaleString()} TL</span>
                  </div>
               </div>

               <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                     <thead>
                        <tr className="border-b border-slate-100">
                           <th className="py-4 text-xs font-black text-slate-400 uppercase tracking-widest pl-4">Personel</th>
                           <th className="py-4 text-xs font-black text-slate-400 uppercase tracking-widest">İşlem Adeti</th>
                           <th className="py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-center">Müşteri Puanı</th>
                           <th className="py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right pr-4">Toplam Ciro</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-50">
                        {dailyReport.staffBreakdown.length === 0 && (
                            <tr><td colSpan={4} className="py-8 text-center text-slate-300 font-bold italic">Bugün henüz işlem yapılmadı.</td></tr>
                        )}
                        {dailyReport.staffBreakdown.map((item, i) => (
                           <tr key={i} className="hover:bg-slate-50 transition-colors">
                              <td className="py-4 pl-4 font-black text-slate-900 italic">{item.name}</td>
                              <td className="py-4 font-medium text-slate-600">{item.count} İşlem</td>
                              <td className="py-4 text-center font-bold text-amber-500 flex justify-center items-center gap-1">
                                {item.avgRating !== '-' ? <><Star size={14} fill="currentColor" /> {item.avgRating}</> : <span className="text-slate-300">-</span>}
                              </td>
                              <td className="py-4 pr-4 text-right font-black text-indigo-600">{item.revenue.toLocaleString()} TL</td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>

            {/* GELİR & PERSONEL ANALİZ GRAFİKLERİ */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* AYLIK GELİR */}
                <div className="bg-white rounded-[4rem] p-10 lg:p-12 shadow-sm border border-slate-100 relative overflow-hidden">
                    <div className="flex items-center gap-6 mb-8">
                       <div className="p-4 bg-indigo-50 text-indigo-600 rounded-3xl"><TrendingUp size={32} /></div>
                       <div>
                          <h3 className="text-2xl font-black text-slate-900 italic tracking-tighter">Gelir Trendi</h3>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">AYLIK CİRO ANALİZİ</p>
                       </div>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis 
                                    dataKey="name" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 700}} 
                                    dy={10}
                                />
                                <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 700}} 
                                    tickFormatter={(value) => `${value >= 1000 ? (value / 1000) + 'k' : value}`}
                                />
                                <Tooltip 
                                    contentStyle={{backgroundColor: '#1e293b', borderRadius: '1.5rem', border: 'none', color: '#fff', padding: '1.5rem', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}}
                                    itemStyle={{color: '#fff', fontWeight: 700, fontSize: '14px'}}
                                    cursor={{stroke: '#6366f1', strokeWidth: 2, strokeDasharray: '5 5'}}
                                    formatter={(value: number) => [`${value.toLocaleString()} TL`, 'Toplam Ciro']}
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="revenue" 
                                    stroke="#6366f1" 
                                    strokeWidth={5} 
                                    fillOpacity={1} 
                                    fill="url(#colorRevenue)" 
                                    animationDuration={1500}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* GÜNLÜK GELİR TRENDİ (YENİ) */}
                <div className="bg-white rounded-[4rem] p-10 lg:p-12 shadow-sm border border-slate-100 relative overflow-hidden">
                    <div className="flex items-center gap-6 mb-8">
                       <div className="p-4 bg-emerald-50 text-emerald-600 rounded-3xl"><TrendingUp size={32} /></div>
                       <div>
                          <h3 className="text-2xl font-black text-slate-900 italic tracking-tighter">Günlük Akış</h3>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">SON 14 GÜN CİRO</p>
                       </div>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={dailyTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorDailyRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis 
                                    dataKey="name" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} 
                                    dy={10}
                                />
                                <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} 
                                    tickFormatter={(value) => `${value >= 1000 ? (value / 1000) + 'k' : value}`}
                                />
                                <Tooltip 
                                    contentStyle={{backgroundColor: '#1e293b', borderRadius: '1.5rem', border: 'none', color: '#fff', padding: '1.5rem', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}}
                                    itemStyle={{color: '#fff', fontWeight: 700, fontSize: '14px'}}
                                    cursor={{stroke: '#10b981', strokeWidth: 2, strokeDasharray: '5 5'}}
                                    formatter={(value: number) => [`${value.toLocaleString()} TL`, 'Günlük Ciro']}
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="revenue" 
                                    stroke="#10b981" 
                                    strokeWidth={4} 
                                    fillOpacity={1} 
                                    fill="url(#colorDailyRevenue)" 
                                    animationDuration={1500}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="bg-slate-900 p-16 rounded-[4rem] text-white relative overflow-hidden shadow-3xl">
                    <div className="relative z-10">
                        <div className="flex items-center gap-6 mb-12"><BrainCircuit className="text-rose-500" size={56} /><h3 className="text-4xl font-black tracking-tighter italic">Ekip Pulse</h3></div>
                        <div className="space-y-12">
                            {staff.map(s => (
                                <div key={s.id} className="group">
                                    <div className="flex justify-between items-end mb-4">
                                        <div><p className="font-black text-2xl italic">{s.name}</p><p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{s.role}</p></div>
                                        <p className="text-xs font-black text-rose-500 uppercase tracking-widest">Perf: %{s.performanceScore}</p>
                                    </div>
                                    <div className="h-6 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 shadow-inner">
                                        <div className="h-full bg-gradient-to-r from-indigo-500 via-rose-500 to-emerald-500 transition-all duration-1000 group-hover:brightness-125" style={{ width: `${s.performanceScore}%` }}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="bg-white p-16 rounded-[4rem] border border-slate-100 relative shadow-sm">
                    <div className="flex justify-between items-center mb-12"><h3 className="text-4xl font-black tracking-tighter italic flex items-center gap-4"><Wallet className="text-indigo-600" size={40}/> Gider Audit</h3><button onClick={() => setShowExpenseForm(true)} className="bg-slate-900 text-white p-6 rounded-3xl shadow-2xl hover:bg-black transition-all"><Plus size={32}/></button></div>
                    <div className="space-y-6 max-h-[400px] overflow-y-auto pr-6 no-scrollbar">
                        {expenses.map(e => (
                        <div key={e.id} className="flex justify-between items-center p-8 bg-slate-50 rounded-[3rem] border border-transparent hover:border-slate-100 transition-all">
                            <div>
                                <p className="font-black text-slate-900 text-2xl italic">{e.title}</p>
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{e.category}</p>
                                <p className="text-[10px] text-slate-300 font-bold mt-1">{new Date(e.date).toLocaleDateString()}</p>
                            </div>
                            <div className="flex items-center gap-8"><p className="font-black text-rose-500 text-3xl">-{e.amount.toLocaleString()} TL</p><button onClick={(evt) => { evt.stopPropagation(); deleteData(e.id, 'EXPENSE'); }} className="p-4 text-slate-200 hover:text-rose-500 transition-all"><Trash2 size={24}/></button></div>
                        </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>

        {/* CANLI BİLDİRİM & SİPARİŞ AKIŞI */}
        <div className="xl:col-span-4 bg-[#f8fafc] rounded-[4rem] border border-slate-200 shadow-xl p-12 flex flex-col h-fit sticky top-10">
            <div className="flex justify-between items-center mb-10">
                <h3 className="text-3xl font-black tracking-tighter italic flex items-center gap-3">
                   <Bell className="text-rose-500 animate-swing" /> CANLI AKIŞ
                </h3>
                <span className="bg-rose-500 text-white text-[10px] font-black px-4 py-2 rounded-full">{unreadNotifs.length + activeDrinkOrders.length} YENİ</span>
            </div>
            
            <div className="space-y-6 max-h-[800px] overflow-y-auto pr-4 no-scrollbar">
                {/* ACTIVE DRINK ORDERS SECTION */}
                {activeDrinkOrders.length > 0 && (
                   <div className="mb-6 space-y-4">
                      <p className="text-[10px] font-black uppercase text-amber-500 tracking-[0.2em] mb-2">Aktif Siparişler</p>
                      {activeDrinkOrders.map(order => (
                         <div key={order.id} className="bg-white border border-amber-200 rounded-[2.5rem] p-6 shadow-lg relative overflow-hidden">
                             <div className="absolute top-0 right-0 p-6 opacity-5"><Coffee size={64}/></div>
                             <div className="relative z-10">
                                <h4 className="text-xl font-black italic text-slate-900">{order.customerName}</h4>
                                <p className="text-sm font-bold text-amber-600 mb-4">{order.drinkName}</p>
                                
                                <div className="flex items-center gap-2 mb-4">
                                   <div className={`w-3 h-3 rounded-full animate-pulse ${order.status === 'RECEIVED' ? 'bg-amber-500' : order.status === 'PREPARING' ? 'bg-rose-500' : 'bg-indigo-500'}`}></div>
                                   <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                      {order.status === 'RECEIVED' ? 'Sipariş Alındı' : order.status === 'PREPARING' ? 'Hazırlanıyor' : 'Servis Ediliyor'}
                                   </span>
                                </div>

                                <button 
                                  onClick={() => handleDrinkStatus(order)}
                                  className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-md flex items-center justify-center gap-2 ${
                                    order.status === 'RECEIVED' ? 'bg-rose-500 text-white hover:bg-rose-600' : 
                                    order.status === 'PREPARING' ? 'bg-indigo-500 text-white hover:bg-indigo-600' : 
                                    'bg-emerald-500 text-white hover:bg-emerald-600'
                                  }`}
                                >
                                   {order.status === 'RECEIVED' ? <><ChefHat size={16}/> Hazırla</> : 
                                    order.status === 'PREPARING' ? <><Truck size={16}/> Yola Çıkar</> : 
                                    <><CheckCircle size={16}/> Teslim Et</>}
                                </button>
                             </div>
                         </div>
                      ))}
                      <div className="h-px bg-slate-200 my-6"></div>
                   </div>
                )}

                {/* NOTIFICATIONS */}
                {notifications.length === 0 && activeDrinkOrders.length === 0 && (
                    <div className="py-20 text-center opacity-30 italic font-bold">Henüz bildirim yok...</div>
                )}
                {notifications.map(n => {
                    let icon, colorClass;
                    switch(n.type) {
                      case 'ORDER': icon = <ShoppingBag size={20}/>; colorClass = 'bg-amber-100 text-amber-600'; break;
                      case 'LOW_STOCK': icon = <AlertTriangle size={20}/>; colorClass = 'bg-rose-100 text-rose-600 animate-pulse'; break;
                      case 'PERFORMANCE_ALERT': icon = <TrendingDown size={20}/>; colorClass = 'bg-indigo-100 text-indigo-600'; break;
                      case 'DIET_CHAT': icon = <MessageCircle size={20}/>; colorClass = 'bg-emerald-100 text-emerald-600'; break;
                      case 'REGISTRATION_REQUEST': icon = <UserPlus size={20}/>; colorClass = 'bg-indigo-100 text-indigo-600'; break;
                      default: icon = <Bell size={20}/>; colorClass = 'bg-slate-100 text-slate-600'; break;
                    }
                    
                    return (
                        <div key={n.id} className={`p-8 rounded-[2.5rem] border transition-all ${n.isRead ? 'bg-white border-slate-100 opacity-60' : 'bg-white border-rose-200 shadow-lg scale-[1.02]'}`}>
                            <div className="flex justify-between items-start mb-4">
                                <div className={`p-3 rounded-2xl ${colorClass}`}>
                                    {icon}
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-[10px] font-black text-slate-400">{n.timestamp}</span>
                                    {!n.isRead && <button onClick={() => markNotifRead(n.id)} className="p-2 hover:bg-slate-100 rounded-lg"><X size={14}/></button>}
                                    <button onClick={() => deleteData(n.id, 'NOTIFICATION')} className="p-2 text-rose-300 hover:text-rose-500"><Trash2 size={14}/></button>
                                </div>
                            </div>
                            <h4 className="font-black text-slate-900 text-xl mb-2">{n.title}</h4>
                            <p className="text-slate-500 font-bold text-sm italic">{n.message}</p>
                            
                            {/* Registration Approval Button */}
                            {n.type === 'REGISTRATION_REQUEST' && !n.isRead && (
                                <button 
                                    onClick={() => handleApproveRegistration(n)} 
                                    className="mt-4 w-full py-3 bg-indigo-500 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-indigo-600 transition-all flex items-center justify-center gap-2"
                                >
                                    <CheckCircle2 size={16} /> Onayla ve Kaydet
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
      </div>

      {showExpenseForm && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-6">
          <form onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.target as HTMLFormElement);
            const dateStr = fd.get('date') as string;
            const date = dateStr ? new Date(dateStr).toISOString() : new Date().toISOString();
            addExpense({ id: Date.now().toString(), title: fd.get('title') as string, amount: Number(fd.get('amount')), category: fd.get('category') as any, date });
            setShowExpenseForm(false);
          }} className="bg-white w-full max-w-xl rounded-[5rem] p-20 space-y-10 animate-in zoom-in-95">
            <h3 className="text-4xl font-black tracking-tighter italic">Gider Kaydı</h3>
            <div className="space-y-8">
                <InputManager label="Açıklama" name="title" />
                <InputManager label="Tutar (TL)" name="amount" type="number" />
                <InputManager label="Tarih" name="date" type="date" />
                <div><label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Kategori</label><select name="category" className="w-full p-6 bg-slate-50 rounded-3xl font-black outline-none border-2 border-transparent focus:border-slate-900 transition-all"><option value="RENT">Kira</option><option value="BILL">Fatura</option><option value="TAX">Vergi</option><option value="OTHER">Diğer</option></select></div>
            </div>
            <button type="submit" className="w-full py-10 bg-slate-900 text-white rounded-[3rem] font-black text-3xl shadow-3xl hover:bg-black transition-all">Masrafı Kaydet</button>
            <button type="button" onClick={() => setShowExpenseForm(false)} className="w-full text-slate-400 font-bold uppercase text-[10px] tracking-[0.4em]">Vazgeç</button>
          </form>
        </div>
      )}
    </div>
  );
};

const FinCard = ({ label, val, color }: any) => {
    const c: any = { slate: 'text-slate-900', emerald: 'text-emerald-500' };
    return (
        <div className="bg-slate-50 p-12 rounded-[4rem] border border-slate-100 min-w-[320px] text-center shadow-inner group">
            <p className="text-[10px] font-black text-slate-400 mb-4 uppercase tracking-[0.4em] group-hover:text-rose-500 transition-colors">{label}</p>
            <p className={`text-6xl font-black italic ${c[color]}`}>{val.toLocaleString()} TL</p>
        </div>
    );
};

const InputManager = ({ label, name, type = 'text' }: any) => (
  <div>
    <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest">{label}</label>
    <input name={name} type={type} className="w-full p-6 bg-slate-50 rounded-3xl font-black outline-none border-2 border-transparent focus:border-slate-900 transition-all" required />
  </div>
);