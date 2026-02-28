import { Staff, Transaction } from '../types';

export interface StaffPerformanceReport {
  staffId: string;
  staffName: string;
  role: string;
  metrics: {
    averageRating: number;
    totalRatedTransactions: number;
    npsScore: number; // Net Promoter Score simulation
    retentionRate: number; // Customer return rate
  };
  feedbacks: {
    id: string;
    rating: number;
    sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
    autoComment: string; // Simulated comment based on rating
    date: string;
  }[];
}

// Mock comments generator based on rating
const getMockComment = (rating: number): { text: string, sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' } => {
  if (rating === 5) {
    const comments = ["Harika bir deneyimdi!", "Çok ilgili ve profesyonel.", "Sonuçtan çok memnun kaldım.", "Kesinlikle tekrar geleceğim.", "Ellerinize sağlık, muhteşem."];
    return { text: comments[Math.floor(Math.random() * comments.length)], sentiment: 'POSITIVE' };
  } else if (rating === 4) {
    const comments = ["Gayet güzeldi, teşekkürler.", "Memnun kaldım.", "Hizmet kalitesi iyi.", "Personel güler yüzlüydü."];
    return { text: comments[Math.floor(Math.random() * comments.length)], sentiment: 'POSITIVE' };
  } else if (rating === 3) {
    const comments = ["Ortalama bir deneyim.", "Fena değil.", "Biraz daha özen gösterilebilir.", "Standart bir hizmet."];
    return { text: comments[Math.floor(Math.random() * comments.length)], sentiment: 'NEUTRAL' };
  } else {
    const comments = ["Beklentimin altındaydı.", "Daha iyi olabilirdi.", "İletişim eksikliği vardı.", "Süreçten memnun kalmadım."];
    return { text: comments[Math.floor(Math.random() * comments.length)], sentiment: 'NEGATIVE' };
  }
};

export const fetchStaffPerformanceAnalytics = async (staffList: Staff[], transactions: Transaction[]): Promise<StaffPerformanceReport[]> => {
  // Simulate API Network Latency
  await new Promise(resolve => setTimeout(resolve, 800));

  return staffList.map(staff => {
    const staffTx = transactions.filter(t => t.staffId === staff.id && t.rating);
    
    // Calculate Average Rating
    const totalRating = staffTx.reduce((sum, t) => sum + (t.rating || 0), 0);
    const averageRating = staffTx.length > 0 ? parseFloat((totalRating / staffTx.length).toFixed(1)) : 0;

    // Calculate NPS (Promoters: 5, Passives: 4, Detractors: 1-3)
    const promoters = staffTx.filter(t => (t.rating || 0) === 5).length;
    const detractors = staffTx.filter(t => (t.rating || 0) <= 3).length;
    const npsScore = staffTx.length > 0 ? Math.round(((promoters - detractors) / staffTx.length) * 100) : 0;

    // Retention Simulation (Randomized based on score for demo)
    const retentionRate = Math.min(100, Math.round(averageRating * 18 + (Math.random() * 10)));

    // Generate Feedbacks
    const feedbacks = staffTx
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5) // Last 5 feedbacks
      .map(t => {
        const { text, sentiment } = getMockComment(t.rating || 0);
        return {
          id: t.id,
          rating: t.rating || 0,
          sentiment,
          autoComment: text,
          date: t.timestamp
        };
      });

    return {
      staffId: staff.id,
      staffName: staff.name,
      role: staff.role,
      metrics: {
        averageRating,
        totalRatedTransactions: staffTx.length,
        npsScore,
        retentionRate
      },
      feedbacks
    };
  }).sort((a, b) => b.metrics.averageRating - a.metrics.averageRating);
};
