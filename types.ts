
export enum UserRole {
  MANAGER = 'MANAGER',
  FINANCE_MANAGER = 'FINANCE_MANAGER',
  OPS_MANAGER = 'OPS_MANAGER',
  EXPERT = 'EXPERT',
  RECEPTIONIST = 'RECEPTIONIST',
  TRAINEE = 'TRAINEE',
  CUSTOMER_VIP = 'CUSTOMER_VIP',
  CUSTOMER = 'CUSTOMER',
  STAFF = 'STAFF'
}

export interface ActiveCall {
  customerId: string;
  hostName: string;
  type: 'VIDEO' | 'AUDIO';
  status: 'RINGING' | 'CONNECTED' | 'ENDED';
  timestamp: string;
}

export interface AppNotification {
  id: string;
  type: 'ORDER' | 'APPOINTMENT_REQUEST' | 'OFFER_ACCEPTED' | 'SYSTEM' | 'LOW_STOCK' | 'REWARD_ALERT' | 'PERFORMANCE_ALERT' | 'DIET_CHAT' | 'REGISTRATION_REQUEST' | 'INCOMING_CALL';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  active?: boolean;
  data?: any; // To store temporary data like registration details
}

export interface DrinkOrder {
  id: string;
  customerId: string;
  customerName: string;
  drinkName: string;
  status: 'RECEIVED' | 'PREPARING' | 'ON_THE_WAY' | 'DELIVERED';
  timestamp: string;
  active?: boolean;
}

export enum MembershipTier {
  BRONZE = 'BRONZE',
  SILVER = 'SILVER',
  GOLD = 'GOLD',
  PLATINUM = 'PLATINUM',
  BLACK_VIP = 'BLACK_VIP'
}

export interface LoyaltyRule {
  id: string;
  type: 'POINTS' | 'STAMPS';
  category?: 'SKIN_CARE' | 'NAIL' | 'DIET' | 'GENERAL';
  minPoints: number; // Used for POINTS type
  minStamps?: number; // Used for STAMPS type
  reward: string;
  active?: boolean;
}

export interface ServicePackage {
  id: string;
  name: string;
  description: string;
  price: number;
  minTier: MembershipTier; 
  features: string[];
  sessionCount?: number; // Added session count for logic
  active?: boolean;
}

export interface Branch {
  id: string;
  name: string;
  location: string;
  monthlyFixedCosts: number;
  active?: boolean;
}

export interface Device {
  id: string;
  name: string;
  currentHours: number;
  maxHoursBeforeMaintenance: number;
  lastMaintenanceDate: string;
  status: 'ACTIVE' | 'MAINTENANCE' | 'ERROR';
  active?: boolean;
}

export interface Service {
  id: string;
  name: string;
  category: 'SKIN_CARE' | 'NAIL' | 'DIET' | 'GENERAL';
  duration: number;
  price: number;
  commissionRate: number; 
  productCostPerSession: number;
  energyAndOverheadPerMinute: number;
  linkedProductId?: string;
  active?: boolean;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  stock: number;
  costPrice: number;
  salePrice: number;
  unit: string;
  volumePerUnit: number;
  currentUnitRemaining: number;
  usagePerSession: number;
  isProfessional: boolean;
  wasteThreshold: number;
  lowStockThreshold: number;
  lastAuditDate: string;
  active?: boolean;
}

export interface BodyAnalysis {
  date: string;
  weight: number;
  height: number;
  fatPercentage: number;
  muscleMass: number;
  bmi: number;
}

export interface Drink {
  id: string;
  name: string;
  icon: string;
  description: string;
  active?: boolean;
}

export interface SignedDocument {
  id: string;
  title: string;
  type: 'KVKK' | 'TREATMENT_CONSENT' | 'DIET_CONTRACT';
  content: string;
  signature: string;
  timestamp: string;
  ipAddress?: string;
  clientInfo?: string;
}

export interface CustomerDNA {
  spendingPattern: number;
  churnRisk: number;
  packagePropensity: number;
  luxuryTrendScore: number;
  nextVisitPrediction: string;
  loyaltyPuan: number;
  totalSpent: number;
}

// --- NEW DIET INTERFACES ---
export interface DietMeal {
  title: string;
  content: string;
  calories?: number;
  isCheat?: boolean;
}

export interface DietDay {
  dayName: string; // Pazartesi, Salı vb.
  meals: {
    breakfast: DietMeal;
    lunch: DietMeal;
    dinner: DietMeal;
    snacks: DietMeal[];
  };
  waterTarget: number; // Litre
  notes: string;
}

export interface ChatMessage {
  id: string;
  sender: 'CUSTOMER' | 'DIETITIAN' | 'MANAGER';
  content: string; // Text or Base64 Image or Base64 Audio
  type: 'TEXT' | 'IMAGE' | 'CALL_REQUEST' | 'AUDIO';
  timestamp: string;
  isRead: boolean;
}

export interface WellnessPlan {
  wellnessPlanTitle: string;
  introMessage: string;
  recommendedServices: {
    serviceId: string;
    reason: string;
  }[];
  dailyRoutineSuggestion: string;
  nutritionTip: string;
  timestamp?: string; // To know when it was generated
}

export interface Customer {
  id: string;
  fullName: string;
  phone: string;
  tcNo: string;
  tier: MembershipTier;
  branchId: string;
  dna: CustomerDNA;
  packages: SessionPackage[]; // Purchased packages
  history: string[];
  consentSigned: boolean;
  signature?: string; 
  signedDocuments: SignedDocument[];
  preferences: { music: string; drink: string; notes: string };
  bodyAnalysis: BodyAnalysis[];
  gallery: string[]; 
  specialPriceList?: Record<string, number>; 
  loyaltyStamps?: { skinCare: number; nail: number; diet?: number; };
  wellnessPlan?: WellnessPlan; // AI Generated Plan
  // DIET EXTENSIONS
  dietPassword?: string; // Özel giriş şifresi
  dietPlan?: DietDay[]; // Haftalık plan
  dietChatHistory?: ChatMessage[];
  dietContractSigned?: boolean; // Diyet sözleşmesi imzalandı mı?
  active?: boolean;
}

export interface SessionPackage {
  id: string; // Unique ID for this specific purchase
  packageTemplateId: string; // Reference to the ServicePackage
  name: string;
  totalSessions: number;
  remainingSessions: number;
  purchaseDate: string;
}

export interface TransactionItem {
  type: 'SERVICE' | 'PRODUCT' | 'PACKAGE';
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Transaction {
  id: string;
  branchId: string;
  customerId: string;
  staffId: string;
  items: TransactionItem[];
  grossRevenue: number;
  netProfit: number;
  paymentType: 'CASH' | 'CARD' | 'TRANSFER';
  rating?: number; 
  timestamp: string;
  active?: boolean;
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: 'RENT' | 'BILL' | 'TAX' | 'OTHER';
  date: string;
  active?: boolean;
}

export interface Staff {
  id: string;
  name: string;
  role: string;
  performanceScore: number;
  totalSales: number;
  totalCommissions: number;
  totalPrim: number;
  riskScore: number;
  active?: boolean;
}

export interface Appointment {
  id: string;
  customerId: string;
  serviceId: string;
  staffId: string;
  date: string;
  time: string;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  reminderSent: boolean;
  active?: boolean;
}
