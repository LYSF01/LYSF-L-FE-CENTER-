
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, Service, Customer, Staff, Transaction, UserRole, MembershipTier, Branch, Device, Appointment, Expense, BodyAnalysis, AppNotification, Drink, LoyaltyRule, ServicePackage, DrinkOrder, DietDay, ChatMessage, ActiveCall, SessionPackage } from '../types';
import { db, isDemoMode } from '../firebaseConfig';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  setDoc, 
  writeBatch,
  query,
  orderBy,
  limit,
  where,
  startAfter,
  getDocs
} from 'firebase/firestore';

interface SalonState {
  branches: Branch[];
  devices: Device[];
  products: Product[];
  services: Service[];
  customers: Customer[];
  staff: Staff[];
  transactions: Transaction[];
  expenses: Expense[];
  appointments: Appointment[];
  notifications: AppNotification[];
  drinks: Drink[];
  loyaltyRules: LoyaltyRule[];
  loyaltyRate: number;
  tierLimits: Record<string, number>;
  servicePackages: ServicePackage[];
  drinkOrders: DrinkOrder[];
  adminKey: string;
  receptionistKey: string;
  staffKey: string;
  kvkkText: string;
  currentRole: UserRole;
  activeCall: ActiveCall | null;
  setRole: (role: UserRole) => void;
  isAuthenticated: boolean;
  isOnline: boolean;
  login: (key: string) => boolean;
  logout: () => void;
  updateSystemKeys: (admin: string, receptionist: string, staff: string) => void;
  updateKvkkText: (text: string) => void;
  updateLoyaltySettings: (rate: number, rules: LoyaltyRule[], limits: Record<string, number>) => void;
  completeSale: (customerId: string, staffId: string, items: any[], paymentType: any, rating?: number) => void;
  checkServicePerformance: () => void;
  exportData: () => void;
  importData: (file: File) => Promise<{ success: boolean; message: string }>;
  addAppointment: (app: Appointment) => void;
  updateAppointmentStatus: (id: string, status: 'PENDING' | 'COMPLETED' | 'CANCELLED') => void;
  deleteData: (id: string, type: string) => void;
  addProduct: (product: Product) => void;
  updateProduct: (product: Product) => void;
  addService: (service: Service) => void;
  updateService: (service: Service) => void;
  addStaff: (staff: Staff) => void;
  updateStaff: (staff: Staff) => void;
  addCustomer: (customer: Customer) => void;
  updateCustomer: (customer: Customer) => void;
  addExpense: (expense: Expense) => void;
  addDevice: (device: Device) => void;
  updateDevice: (device: Device) => void;
  addBodyAnalysis: (customerId: string, analysis: BodyAnalysis) => void;
  useSession: (customerId: string, packageId: string) => void;
  resetToDefaults: () => void;
  addNotification: (notif: Omit<AppNotification, 'id' | 'timestamp' | 'isRead'>) => void;
  markNotifRead: (id: string) => void;
  addDrink: (drink: Drink) => void;
  updateDrink: (drink: Drink) => void;
  addPackage: (pkg: ServicePackage) => void;
  updatePackage: (pkg: ServicePackage) => void;
  addDrinkOrder: (order: Omit<DrinkOrder, 'id' | 'timestamp' | 'status'>) => void;
  updateDrinkOrderStatus: (id: string, status: DrinkOrder['status']) => void;
  updateDietPlan: (customerId: string, plan: DietDay[]) => void;
  sendDietMessage: (customerId: string, message: Omit<ChatMessage, 'id' | 'timestamp' | 'isRead'>) => void;
  initiateCall: (customerId: string, type: 'VIDEO' | 'AUDIO') => void;
  answerCall: () => void;
  endCall: () => void;
  generateHealthReport: (customerId: string) => Promise<boolean>;
  searchCustomers: (queryStr: string) => Promise<void>;
  loadMoreCustomers: () => Promise<void>;
  hasMoreCustomers: boolean;
  isLoadingCustomers: boolean;
}

const SalonContext = createContext<SalonState | undefined>(undefined);

const DEFAULT_KVKK = `Değerli Misafirimiz, L'YSF Life Center olarak kişisel verilerinizin güvenliği hususuna azami hassasiyet göstermekteyiz...`;

const DEFAULT_PACKAGES: ServicePackage[] = [
  {
    id: 'pkg_skin_1',
    name: 'Glow Cilt Yenileme',
    description: '5 Seans Hydrafacial ve Vitamin Bakımı içeren avantaj paketi.',
    price: 7500,
    minTier: MembershipTier.BRONZE,
    features: ['5x Hydrafacial', 'Ücretsiz Cilt Analizi', '%10 Ürün İndirimi', 'Detoks İçecek İkramı'],
    sessionCount: 5,
    active: true
  },
  {
    id: 'pkg_nail_1',
    name: 'Nail Art Lovers',
    description: 'Ay boyunca sınırsız oje değişimi ve 2 kez protez tırnak bakımı.',
    price: 3000,
    minTier: MembershipTier.SILVER,
    features: ['Sınırsız Kalıcı Oje', '2x Protez Bakım', 'Öncelikli Randevu', 'Özel Tasarım Seçenekleri'],
    sessionCount: 30, // Mock usage
    active: true
  },
  {
    id: 'pkg_diet_1',
    name: 'Total Wellness & Diet',
    description: 'Diyetisyen eşliğinde 8 haftalık yoğun zayıflama ve takip programı.',
    price: 12000,
    minTier: MembershipTier.GOLD,
    features: ['8 Hafta Diyet Listesi', 'Haftalık Vücut Analizi', 'Sınırsız Diyetisyen Chat', 'Wellness Bar Aboneliği'],
    sessionCount: 8,
    active: true
  }
];

const saveLocal = (key: string, data: any) => {
  localStorage.setItem(`LYSF_DEMO_${key}`, JSON.stringify(data));
};

const getLocal = (key: string) => {
  const d = localStorage.getItem(`LYSF_DEMO_${key}`);
  return d ? JSON.parse(d) : [];
};

export const SalonProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(localStorage.getItem('LYSF_AUTH') === 'true');
  const [currentRole, setRole] = useState<UserRole>((localStorage.getItem('LYSF_ROLE') as UserRole) || UserRole.STAFF);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  
  const [branches, setBranches] = useState<Branch[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [drinks, setDrinks] = useState<Drink[]>([]);
  const [servicePackages, setServicePackages] = useState<ServicePackage[]>([]);
  const [drinkOrders, setDrinkOrders] = useState<DrinkOrder[]>([]);
  
  const [activeCall, setActiveCall] = useState<ActiveCall | null>(null);

  const [lastCustomerDoc, setLastCustomerDoc] = useState<any>(null);
  const [hasMoreCustomers, setHasMoreCustomers] = useState(true);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);

  const [loyaltyRules, setLoyaltyRules] = useState<LoyaltyRule[]>([
    { id: 'lr1', type: 'POINTS', minPoints: 10000, reward: 'Ücretsiz Yüz Maskesi Hediyesi!' },
    { id: 'lr2', type: 'POINTS', minPoints: 25000, reward: 'Vücut Analizi & Diyetisyen Randevusu Hediye!' }
  ]);
  const [loyaltyRate, setLoyaltyRate] = useState<number>(5);
  const [tierLimits, setTierLimits] = useState<Record<string, number>>({
    SILVER: 5000, GOLD: 15000, PLATINUM: 30000, BLACK_VIP: 50000
  });
  const [adminKey, setAdminKey] = useState<string>('ADMIN_LYSF');
  const [receptionistKey, setReceptionistKey] = useState<string>('RECEP_LYSF');
  const [staffKey, setStaffKey] = useState<string>('EXPERT_LYSF');
  const [kvkkText, setKvkkText] = useState<string>(DEFAULT_KVKK);

  useEffect(() => {
    const filterActive = (list: any[]) => list.filter((item: any) => item.active !== false);
    
    if (isDemoMode) {
        setProducts(filterActive(getLocal('products')));
        setServices(filterActive(getLocal('services')));
        setCustomers(filterActive(getLocal('customers')));
        setStaff(filterActive(getLocal('staff')));
        setExpenses(filterActive(getLocal('expenses')));
        setAppointments(filterActive(getLocal('appointments')));
        setBranches(filterActive(getLocal('branches')));
        setDevices(filterActive(getLocal('devices')));
        setDrinks(filterActive(getLocal('drinks')));
        
        const localPackages = getLocal('servicePackages');
        if (localPackages.length > 0) {
            setServicePackages(filterActive(localPackages));
        } else {
            setServicePackages(DEFAULT_PACKAGES);
            saveLocal('servicePackages', DEFAULT_PACKAGES);
        }

        setTransactions(filterActive(getLocal('transactions')).sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
        setNotifications(filterActive(getLocal('notifications')).sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
        setDrinkOrders(filterActive(getLocal('drinkOrders')));
        
        const sys = getLocal('system_config');
        if (sys && !Array.isArray(sys)) { 
            setAdminKey(sys.adminKey || 'ADMIN_LYSF');
            setReceptionistKey(sys.receptionistKey || 'RECEP_LYSF');
            setStaffKey(sys.staffKey || 'EXPERT_LYSF');
            setKvkkText(sys.kvkkText || DEFAULT_KVKK);
            setLoyaltyRate(sys.loyaltyRate || 5);
            setTierLimits(sys.tierLimits || { SILVER: 5000, GOLD: 15000, PLATINUM: 30000, BLACK_VIP: 50000 });
            setLoyaltyRules((sys.loyaltyRules || []).filter((r: any) => r.active !== false));
        }
    } else if (db) {
        // --- REALTIME LISTENERS (CLOUD MODE) ---
        // This ensures the UI updates automatically when data changes in the database.
        const qActive = (col: string) => query(collection(db, col), where('active', '!=', false));

        const unsubCustomers = onSnapshot(qActive('customers'), (snap) => setCustomers(snap.docs.map(d => ({ id: d.id, ...d.data() } as Customer))));
        const unsubServices = onSnapshot(qActive('services'), (snap) => setServices(snap.docs.map(d => ({ id: d.id, ...d.data() } as Service))));
        const unsubProducts = onSnapshot(qActive('products'), (snap) => setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() } as Product))));
        const unsubStaff = onSnapshot(qActive('staff'), (snap) => setStaff(snap.docs.map(d => ({ id: d.id, ...d.data() } as Staff))));
        const unsubTransactions = onSnapshot(qActive('transactions'), (snap) => setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() } as Transaction)).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())));
        const unsubAppointments = onSnapshot(qActive('appointments'), (snap) => setAppointments(snap.docs.map(d => ({ id: d.id, ...d.data() } as Appointment))));
        const unsubExpenses = onSnapshot(qActive('expenses'), (snap) => setExpenses(snap.docs.map(d => ({ id: d.id, ...d.data() } as Expense))));
        const unsubDrinks = onSnapshot(qActive('drinks'), (snap) => setDrinks(snap.docs.map(d => ({ id: d.id, ...d.data() } as Drink))));
        const unsubPackages = onSnapshot(qActive('servicePackages'), (snap) => setServicePackages(snap.docs.map(d => ({ id: d.id, ...d.data() } as ServicePackage))));
        const unsubOrders = onSnapshot(qActive('drinkOrders'), (snap) => setDrinkOrders(snap.docs.map(d => ({ id: d.id, ...d.data() } as DrinkOrder))));
        const unsubNotifs = onSnapshot(qActive('notifications'), (snap) => setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() } as AppNotification)).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())));

        return () => {
            unsubCustomers(); unsubServices(); unsubProducts(); unsubStaff();
            unsubTransactions(); unsubAppointments(); unsubExpenses();
            unsubDrinks(); unsubPackages(); unsubOrders(); unsubNotifs();
        };
    }
  }, []);

  const initiateCall = (customerId: string, type: 'VIDEO' | 'AUDIO') => {
      const call: ActiveCall = {
          customerId,
          hostName: 'L\'YSF Yönetim',
          type,
          status: 'RINGING',
          timestamp: new Date().toISOString()
      };
      setActiveCall(call);
  };

  const answerCall = () => {
      if (activeCall) {
          setActiveCall({ ...activeCall, status: 'CONNECTED' });
      }
  };

  const endCall = () => {
      setActiveCall(null);
  };

  const generateHealthReport = async (customerId: string): Promise<boolean> => {
      return new Promise((resolve) => {
          setTimeout(() => {
              resolve(true);
          }, 3000);
      });
  };

  const searchCustomers = async (queryStr: string) => {
  };

  const loadMoreCustomers = async () => {
  };

  const addNotification = async (notif: Omit<AppNotification, 'id' | 'timestamp' | 'isRead'>) => {
      const newNotif = { 
          ...notif, 
          id: Date.now().toString(), 
          timestamp: new Date().toLocaleTimeString(), 
          isRead: false,
          active: true
      };
      if (!isDemoMode && db) {
          await setDoc(doc(db, 'notifications', newNotif.id), newNotif);
      } else {
          const updated = [newNotif, ...notifications];
          setNotifications(updated);
          saveLocal('notifications', updated);
      }
  };

  const markNotifRead = async (id: string) => {
      if (!isDemoMode && db) {
          await updateDoc(doc(db, 'notifications', id), { isRead: true });
      } else {
          const updated = notifications.map(n => n.id === id ? { ...n, isRead: true } : n);
          setNotifications(updated);
          saveLocal('notifications', updated);
      }
  };

  const login = (key: string) => {
    if (key === adminKey) {
      setRole(UserRole.MANAGER);
      setIsAuthenticated(true);
      localStorage.setItem('LYSF_AUTH', 'true');
      localStorage.setItem('LYSF_ROLE', UserRole.MANAGER);
      return true;
    }
    if (key === receptionistKey) {
      setRole(UserRole.RECEPTIONIST);
      setIsAuthenticated(true);
      localStorage.setItem('LYSF_AUTH', 'true');
      localStorage.setItem('LYSF_ROLE', UserRole.RECEPTIONIST);
      return true;
    }
    if (key === staffKey) {
      setRole(UserRole.EXPERT);
      setIsAuthenticated(true);
      localStorage.setItem('LYSF_AUTH', 'true');
      localStorage.setItem('LYSF_ROLE', UserRole.EXPERT);
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    setRole(UserRole.STAFF);
    localStorage.removeItem('LYSF_AUTH');
    localStorage.removeItem('LYSF_ROLE');
    window.location.reload();
  };

  const updateSystemKeys = (admin: string, receptionist: string, staff: string) => {
      setAdminKey(admin);
      setReceptionistKey(receptionist);
      setStaffKey(staff);
      saveLocal('system_config', { adminKey: admin, receptionistKey: receptionist, staffKey: staff, kvkkText, loyaltyRate, tierLimits, loyaltyRules });
  };

  const updateKvkkText = (text: string) => {
      setKvkkText(text);
      saveLocal('system_config', { adminKey, receptionistKey, staffKey, kvkkText: text, loyaltyRate, tierLimits, loyaltyRules });
  };

  const updateLoyaltySettings = (rate: number, rules: LoyaltyRule[], limits: Record<string, number>) => {
      setLoyaltyRate(rate);
      setLoyaltyRules(rules);
      setTierLimits(limits);
      saveLocal('system_config', { adminKey, receptionistKey, staffKey, kvkkText, loyaltyRate: rate, tierLimits: limits, loyaltyRules: rules });
  };

  const updateDietPlan = async (customerId: string, plan: DietDay[]) => {
      if (!isDemoMode && db) {
          await updateDoc(doc(db, 'customers', customerId), { dietPlan: plan });
      } else {
          const updatedCustomers = customers.map(c => c.id === customerId ? { ...c, dietPlan: plan } : c);
          setCustomers(updatedCustomers);
          saveLocal('customers', updatedCustomers);
      }
  };

  const sendDietMessage = async (customerId: string, message: Omit<ChatMessage, 'id' | 'timestamp' | 'isRead'>) => {
      const customer = customers.find(c => c.id === customerId);
      if (!customer) return;

      const newMessage: ChatMessage = {
          ...message,
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          isRead: false
      };
      
      const updatedHistory = [...(customer.dietChatHistory || []), newMessage];

      if (!isDemoMode && db) {
          await updateDoc(doc(db, 'customers', customerId), { dietChatHistory: updatedHistory });
      } else {
          const newList = customers.map(c => c.id === customerId ? { ...c, dietChatHistory: updatedHistory } : c);
          setCustomers(newList);
          saveLocal('customers', newList);
      }

      if (message.sender === 'CUSTOMER') {
          addNotification({
              type: 'DIET_CHAT',
              title: 'Diyetisyen Mesajı',
              message: `${customer.fullName} size yeni bir mesaj gönderdi.`
          });
      }
  };

  const addProduct = async (p: Product) => { 
      if (!isDemoMode && db) { await setDoc(doc(db, 'products', p.id), { ...p, active: true }); } 
      else { setProducts(prev => [...prev, p]); saveLocal('products', [...products, p]); } 
  };
  const updateProduct = async (p: Product) => { 
      if (!isDemoMode && db) { await updateDoc(doc(db, 'products', p.id), p as any); }
      else { setProducts(prev => prev.map(i => i.id === p.id ? p : i)); saveLocal('products', products.map(i => i.id === p.id ? p : i)); }
  };
  
  const addService = async (s: Service) => { 
      if (!isDemoMode && db) { await setDoc(doc(db, 'services', s.id), { ...s, active: true }); }
      else { setServices(prev => [...prev, s]); saveLocal('services', [...services, s]); }
  };
  const updateService = async (s: Service) => { 
      if (!isDemoMode && db) { await updateDoc(doc(db, 'services', s.id), s as any); }
      else { setServices(prev => prev.map(i => i.id === s.id ? s : i)); saveLocal('services', services.map(i => i.id === s.id ? s : i)); }
  };
  
  const addStaff = async (s: Staff) => { 
      if (!isDemoMode && db) { await setDoc(doc(db, 'staff', s.id), { ...s, active: true }); }
      else { setStaff(prev => [...prev, s]); saveLocal('staff', [...staff, s]); }
  };
  const updateStaff = async (s: Staff) => { 
      if (!isDemoMode && db) { await updateDoc(doc(db, 'staff', s.id), s as any); }
      else { setStaff(prev => prev.map(i => i.id === s.id ? s : i)); saveLocal('staff', staff.map(i => i.id === s.id ? s : i)); }
  };
  
  const addCustomer = async (c: Customer) => { 
      if (!isDemoMode && db) { await setDoc(doc(db, 'customers', c.id), { ...c, active: true }); }
      else { setCustomers(prev => [...prev, c]); saveLocal('customers', [...customers, c]); }
  };
  const updateCustomer = async (c: Customer) => { 
      if (!isDemoMode && db) { await updateDoc(doc(db, 'customers', c.id), c as any); }
      else { setCustomers(prev => prev.map(i => i.id === c.id ? c : i)); saveLocal('customers', customers.map(i => i.id === c.id ? c : i)); }
  };
  
  const addExpense = async (e: Expense) => { 
      if (!isDemoMode && db) { await setDoc(doc(db, 'expenses', e.id), { ...e, active: true }); }
      else { setExpenses(prev => [...prev, e]); saveLocal('expenses', [...expenses, e]); }
  };
  
  const addDevice = (d: Device) => { setDevices(prev => [...prev, d]); saveLocal('devices', [...devices, d]); };
  const updateDevice = (d: Device) => { setDevices(prev => prev.map(i => i.id === d.id ? d : i)); saveLocal('devices', devices.map(i => i.id === d.id ? d : i)); };
  
  const addDrink = async (d: Drink) => { 
      if (!isDemoMode && db) { await setDoc(doc(db, 'drinks', d.id), { ...d, active: true }); }
      else { setDrinks(prev => [...prev, d]); saveLocal('drinks', [...drinks, d]); }
  };
  const updateDrink = async (d: Drink) => { 
      if (!isDemoMode && db) { await updateDoc(doc(db, 'drinks', d.id), d as any); }
      else { setDrinks(prev => prev.map(i => i.id === d.id ? d : i)); saveLocal('drinks', drinks.map(i => i.id === d.id ? d : i)); }
  };
  
  const addPackage = async (p: ServicePackage) => { 
      if (!isDemoMode && db) { await setDoc(doc(db, 'servicePackages', p.id), { ...p, active: true }); }
      else { setServicePackages(prev => [...prev, p]); saveLocal('servicePackages', [...servicePackages, p]); }
  };
  const updatePackage = async (p: ServicePackage) => { 
      if (!isDemoMode && db) { await updateDoc(doc(db, 'servicePackages', p.id), p as any); }
      else { setServicePackages(prev => prev.map(i => i.id === p.id ? p : i)); saveLocal('servicePackages', servicePackages.map(i => i.id === p.id ? p : i)); }
  };
  
  const addAppointment = async (app: Appointment) => { 
      if (!isDemoMode && db) { await setDoc(doc(db, 'appointments', app.id), { ...app, active: true }); }
      else { setAppointments(prev => [...prev, app]); saveLocal('appointments', [...appointments, app]); }
      
      addNotification({
          type: 'APPOINTMENT_REQUEST',
          title: 'Yeni Randevu',
          message: `${app.date} ${app.time} için yeni randevu oluşturuldu.`
      });
  };
  
  const updateAppointmentStatus = async (id: string, status: any) => {
      if (!isDemoMode && db) { await updateDoc(doc(db, 'appointments', id), { status }); }
      else {
          const updated = appointments.map(a => a.id === id ? { ...a, status } : a);
          setAppointments(updated);
          saveLocal('appointments', updated);
      }
  };

  const addBodyAnalysis = async (customerId: string, analysis: BodyAnalysis) => {
      const c = customers.find(x => x.id === customerId);
      if (!c) return;
      const updated = { ...c, bodyAnalysis: [...c.bodyAnalysis, analysis] };
      updateCustomer(updated);
  };

  const useSession = async (customerId: string, packageId: string) => {
      const c = customers.find(x => x.id === customerId);
      if (!c) return;
      const updatedPackages = c.packages.map(p => p.id === packageId ? { ...p, remainingSessions: Math.max(0, p.remainingSessions - 1) } : p);
      updateCustomer({ ...c, packages: updatedPackages });
  };

  const completeSale = async (customerId: string, staffId: string, items: any[], paymentType: any, rating?: number) => {
      const newTx: Transaction = {
          id: Date.now().toString(),
          branchId: 'b1',
          customerId,
          staffId,
          items,
          grossRevenue: items.reduce((acc: number, i: any) => acc + (i.price * i.quantity), 0),
          netProfit: items.reduce((acc: number, i: any) => acc + (i.price * i.quantity), 0) * 0.8, // Mock margin
          paymentType,
          rating,
          timestamp: new Date().toISOString(),
          active: true
      };
      
      if (!isDemoMode && db) {
          await setDoc(doc(db, 'transactions', newTx.id), newTx);
      } else {
          setTransactions(prev => [...prev, newTx]);
          saveLocal('transactions', [...transactions, newTx]);
      }

      // 1. UPDATE CUSTOMER (Loyalty + Packages)
      const c = customers.find(x => x.id === customerId);
      if (c) {
          const pointsEarned = Math.floor(newTx.grossRevenue * (loyaltyRate / 100));
          
          const newPackages: SessionPackage[] = [];
          items.forEach(item => {
              if (item.type === 'PACKAGE') {
                  const pkgDef = servicePackages.find(p => p.id === item.id);
                  if (pkgDef) {
                      newPackages.push({
                          id: Math.random().toString(36).substr(2, 9),
                          packageTemplateId: pkgDef.id,
                          name: pkgDef.name,
                          totalSessions: pkgDef.sessionCount || 1,
                          remainingSessions: pkgDef.sessionCount || 1,
                          purchaseDate: new Date().toISOString()
                      });
                  }
              }
          });

          const updatedCustomer = {
              ...c,
              dna: { ...c.dna, totalSpent: c.dna.totalSpent + newTx.grossRevenue, loyaltyPuan: c.dna.loyaltyPuan + pointsEarned },
              packages: [...(c.packages || []), ...newPackages]
          };
          updateCustomer(updatedCustomer);
      }

      // 2. UPDATE STAFF (Performance) - In Demo this is local, in Cloud we rely on Transactions
      if (isDemoMode) {
          const s = staff.find(x => x.id === staffId);
          if (s) {
              const updatedStaff = { 
                  ...s, 
                  totalSales: s.totalSales + newTx.grossRevenue,
                  performanceScore: Math.min(100, s.performanceScore + (rating ? rating : 1)) 
              };
              updateStaff(updatedStaff);
          }
      }
  };

  const addDrinkOrder = async (order: any) => {
      const newOrder = { ...order, id: Date.now().toString(), timestamp: new Date().toLocaleTimeString(), status: 'RECEIVED', active: true };
      if (!isDemoMode && db) {
          await setDoc(doc(db, 'drinkOrders', newOrder.id), newOrder);
      } else {
          setDrinkOrders(prev => [...prev, newOrder]);
          saveLocal('drinkOrders', [...drinkOrders, newOrder]);
      }
      addNotification({ type: 'ORDER', title: 'Yeni Sipariş', message: `${order.customerName} - ${order.drinkName}` });
  };

  const updateDrinkOrderStatus = async (id: string, status: any) => {
      if (!isDemoMode && db) {
          await updateDoc(doc(db, 'drinkOrders', id), { status });
      } else {
          const updated = drinkOrders.map(o => o.id === id ? { ...o, status } : o);
          setDrinkOrders(updated);
          saveLocal('drinkOrders', updated);
      }
  };

  // --- DELETE FUNCTIONALITY (SOFT DELETE FOR CLOUD) ---
  const deleteData = async (id: string, type: string) => {
      if (!window.confirm("Silmek istediğinize emin misiniz?")) return;

      if (!isDemoMode && db) {
          const collectionMap: Record<string, string> = {
              'PRODUCT': 'products',
              'SERVICE': 'services',
              'STAFF': 'staff',
              'CUSTOMER': 'customers',
              'EXPENSE': 'expenses',
              'APPOINTMENT': 'appointments',
              'NOTIFICATION': 'notifications',
              'DRINK': 'drinks',
              'PACKAGE': 'servicePackages',
              'LOYALTY_RULE': 'loyaltyRules',
              'TRANSACTION': 'transactions'
          };
          const colName = collectionMap[type];
          if (colName) {
              try {
                  await updateDoc(doc(db, colName, id), { active: false });
              } catch (e) {
                  console.error("Delete failed:", e);
                  alert("Silme işlemi başarısız oldu.");
              }
          }
          return;
      }

      // Demo Mode Delete (Local)
      if (type === 'PRODUCT') { const n = products.filter(x => x.id !== id); setProducts(n); saveLocal('products', n); }
      if (type === 'SERVICE') { const n = services.filter(x => x.id !== id); setServices(n); saveLocal('services', n); }
      if (type === 'STAFF') { const n = staff.filter(x => x.id !== id); setStaff(n); saveLocal('staff', n); }
      if (type === 'DRINK') { const n = drinks.filter(x => x.id !== id); setDrinks(n); saveLocal('drinks', n); }
      if (type === 'PACKAGE') { const n = servicePackages.filter(x => x.id !== id); setServicePackages(n); saveLocal('servicePackages', n); }
      if (type === 'LOYALTY_RULE') { const n = loyaltyRules.filter(x => x.id !== id); setLoyaltyRules(n); saveLocal('system_config', { adminKey, receptionistKey, staffKey, kvkkText, loyaltyRate, tierLimits, loyaltyRules: n }); }
      if (type === 'NOTIFICATION') { const n = notifications.filter(x => x.id !== id); setNotifications(n); saveLocal('notifications', n); }
      if (type === 'EXPENSE') { const n = expenses.filter(x => x.id !== id); setExpenses(n); saveLocal('expenses', n); }
      if (type === 'APPOINTMENT') { const n = appointments.filter(x => x.id !== id); setAppointments(n); saveLocal('appointments', n); }
      if (type === 'CUSTOMER') { const n = customers.filter(x => x.id !== id); setCustomers(n); saveLocal('customers', n); }
  };

  const checkServicePerformance = () => {};
  const exportData = () => {
      const data = { products, services, customers, staff, transactions, expenses, appointments, branches, devices, drinks, servicePackages, notifications, drinkOrders, system_config: { adminKey, receptionistKey, staffKey, kvkkText, loyaltyRate, tierLimits, loyaltyRules } };
      const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `LYSF_BACKUP_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
  };
  
  const importData = async (file: File) => {
      try {
          const text = await file.text();
          const data = JSON.parse(text);
          if (data.products) setProducts(data.products);
          if (data.services) setServices(data.services);
          if (data.customers) setCustomers(data.customers);
          if (data.staff) setStaff(data.staff);
          if (data.transactions) setTransactions(data.transactions);
          if (data.expenses) setExpenses(data.expenses);
          if (data.appointments) setAppointments(data.appointments);
          if (data.drinks) setDrinks(data.drinks);
          if (data.servicePackages) setServicePackages(data.servicePackages);
          
          Object.keys(data).forEach(k => {
              if (k !== 'system_config') saveLocal(k, data[k]);
          });
          
          if (data.system_config) {
              const sc = data.system_config;
              setAdminKey(sc.adminKey || 'ADMIN_LYSF');
              setReceptionistKey(sc.receptionistKey || 'RECEP_LYSF');
              setStaffKey(sc.staffKey || 'EXPERT_LYSF');
              setKvkkText(sc.kvkkText || DEFAULT_KVKK);
              setLoyaltyRate(sc.loyaltyRate || 5);
              setLoyaltyRules(sc.loyaltyRules || []);
              saveLocal('system_config', sc);
          }
          return { success: true, message: 'Yüklendi' };
      } catch (e) {
          return { success: false, message: 'Dosya hatası' };
      }
  };
  
  const resetToDefaults = async () => {
      if(!confirm("TÜM VERİLER SİLİNECEK! Emin misiniz?")) return;
      localStorage.clear();
      window.location.reload();
  };

  return (
    <SalonContext.Provider value={{
      branches, devices, products, services, customers, staff, transactions, expenses, appointments, notifications, drinks, loyaltyRules, loyaltyRate, tierLimits, servicePackages, drinkOrders, adminKey, receptionistKey, staffKey, kvkkText, currentRole, setRole, activeCall,
      isAuthenticated, isOnline, login, logout, updateSystemKeys, updateKvkkText, updateLoyaltySettings, completeSale, checkServicePerformance, exportData, importData,
      addAppointment, updateAppointmentStatus, deleteData, addProduct, updateProduct,
      addService, updateService, addStaff, updateStaff, addCustomer, updateCustomer, addExpense, addDevice, updateDevice,
      addBodyAnalysis, useSession, resetToDefaults, addNotification, markNotifRead, addDrink, updateDrink,
      addPackage, updatePackage, addDrinkOrder, updateDrinkOrderStatus,
      updateDietPlan, sendDietMessage, initiateCall, answerCall, endCall, generateHealthReport,
      searchCustomers, loadMoreCustomers, hasMoreCustomers, isLoadingCustomers
    }}>
      {children}
    </SalonContext.Provider>
  );
};

export const useSalon = () => {
  const context = useContext(SalonContext);
  if (!context) throw new Error("useSalon error");
  return context;
};
