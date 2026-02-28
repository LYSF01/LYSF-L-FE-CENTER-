
import React, { useState } from 'react';
import { SalonProvider, useSalon } from './store/SalonContext';
import { Layout } from './components/Layout';
import { ManagerDashboard } from './views/ManagerDashboard';
import { StaffTerminal } from './views/StaffTerminal';
import { CustomerPortal } from './views/CustomerPortal';
import { Inventory } from './views/Inventory';
import { AIAdvice } from './views/AIAdvice';
import { CustomerCRM } from './views/CustomerCRM';
import { Appointments } from './views/Appointments';
import { LoginView } from './views/LoginView';
import { SystemManagement } from './views/SystemManagement';
import { AIChatBot } from './components/AIChatBot';
import { DietitianCockpit } from './views/DietitianCockpit';

const ContentSwitcher: React.FC<{ tab: string; setTab: (t: string) => void }> = ({ tab, setTab }) => {
  switch (tab) {
    case 'dashboard': return <ManagerDashboard />;
    case 'sales': return <StaffTerminal />;
    case 'customer-portal': return <CustomerPortal />;
    case 'inventory': return <Inventory />;
    case 'ai-advice': return <AIAdvice />;
    case 'customers': return <CustomerCRM />;
    case 'appointments': return <Appointments />;
    case 'system-management': return <SystemManagement />;
    case 'dietitian-cockpit': return <DietitianCockpit setTab={setTab} />;
    default: return <ManagerDashboard />;
  }
};

const AppContent: React.FC = () => {
  const { isAuthenticated } = useSalon();
  const [currentTab, setCurrentTab] = useState('customers');
  
  if (!isAuthenticated) return <LoginView />;

  return (
    <Layout currentTab={currentTab} setTab={setCurrentTab}>
      <div className="max-w-[1600px] mx-auto">
        <ContentSwitcher tab={currentTab} setTab={setCurrentTab} />
      </div>
      <AIChatBot />
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <SalonProvider>
      <AppContent />
    </SalonProvider>
  );
};

export default App;
