import React, { useEffect, useMemo, useState } from 'react';
import AuthGate from './components/AuthGate';
import AppHeader from './components/AppHeader';
import Sidebar from './components/Sidebar';
import ConnectionTracker from './components/ConnectionTracker';
import ContractSummary from './components/ContractSummary';
import CommercialContractSummary from './components/CommercialContractSummary';
import BillingCenter from './components/BillingCenter';
import CommercialBillingCenter from './components/CommercialBillingCenter';
import ReportsHub from './components/ReportsHub';
import CommercialReportsHub from './components/CommercialReportsHub';
import PersonaDashboard from './components/PersonaDashboard';
import CommercialPersonaDashboard from './components/CommercialPersonaDashboard';
import ComplaintDesk from './components/ComplaintDesk';
import TariffBoard from './components/TariffBoard';
import CommercialTariffBoard from './components/CommercialTariffBoard';
import NotificationsCenter from './components/NotificationsCenter';
import CommercialNotificationsCenter from './components/CommercialNotificationsCenter';
import ServiceRequests from './components/ServiceRequests';
import SupportCenter from './components/SupportCenter';
import IndustrialHelpHub from './components/IndustrialHelpHub';
import CorporateWorkspace from './components/CorporateWorkspace';
import ApprovalsPanel from './components/ApprovalsPanel';
import ExistingCustomers from './components/ExistingCustomers';
import PipelineFeasibilityCheck from './components/PipelineFeasibilityCheck';
import MarketingCustomerCommunications from './components/marketing/MarketingCustomerCommunications';
import MarketingBillingExposure from './components/marketing/MarketingBillingExposure';
import RegisteredComplaints from './components/marketing/RegisteredComplaints';
import { commercialCustomerNav, industrialCustomerNav, corporateNav, marketingNav } from './data/navigation';
import { generateDownload } from './utils/download';

const AUTH_STORAGE_KEY = 'png-portal-auth';
const DEFAULT_CUSTOMER_PATH = '/customer/connection';
const LOGIN_PATH = '/login';

function getCustomerDefaultPath(category) {
  return category === 'Commercial Customer' ? '/customer/contracts' : DEFAULT_CUSTOMER_PATH;
}

function loadAuth() {
  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveAuth(auth) {
  try {
    if (!auth) window.localStorage.removeItem(AUTH_STORAGE_KEY);
    else window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
  } catch {
    // Ignore storage failures and continue with in-memory auth.
  }
}

function normalizePath(pathname) {
  if (!pathname || pathname === '/') return LOGIN_PATH;
  return pathname.replace(/\/$/, '') || LOGIN_PATH;
}

function buildDepartmentNav(department) {
  return department === 'Marketing' ? marketingNav : corporateNav;
}

function buildCustomerNav(category) {
  return category === 'Industrial Customer' ? industrialCustomerNav : commercialCustomerNav;
}

function getDefaultDepartmentPath(department) {
  return department === 'Marketing' ? '/corporate/existing-customers' : '/corporate/workspace';
}

function App() {
  const [auth, setAuth] = useState(() => loadAuth());
  const [pathname, setPathname] = useState(() => normalizePath(window.location.pathname));
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(''), 2600);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const handlePopState = () => setPathname(normalizePath(window.location.pathname));
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    saveAuth(auth);
  }, [auth]);

  const navigate = (nextPath, replace = false) => {
    const resolved = normalizePath(nextPath);
    if (window.location.pathname !== resolved) {
      window.history[replace ? 'replaceState' : 'pushState']({}, '', resolved);
    }
    setPathname(resolved);
    setMobileSidebarOpen(false);
  };

  useEffect(() => {
    if (!auth) return;

    const allowedPaths = auth.personaType === 'customer' ? buildCustomerNav(auth.category).map((item) => item.path) : buildDepartmentNav(auth.category).map((item) => item.path);
    const defaultPath = auth.personaType === 'customer' ? getCustomerDefaultPath(auth.category) : getDefaultDepartmentPath(auth.category);

    if (!allowedPaths.includes(pathname) || pathname === LOGIN_PATH) {
      navigate(defaultPath, true);
    }
  }, [auth, pathname]);

  const showToast = (message) => setToast(message);

  const handleSignIn = ({ personaType, category, userId }) => {
    const nextAuth = { personaType, category, userId };
    setAuth(nextAuth);
    navigate(personaType === 'customer' ? getCustomerDefaultPath(category) : getDefaultDepartmentPath(category), true);
    showToast(`Signed in as ${category}`);
  };

  const handleProfileAction = (action) => {
    if (action === 'signout') {
      setAuth(null);
      navigate(LOGIN_PATH, true);
      showToast('Signed out successfully');
      return;
    }
    showToast(action === 'profile' ? 'My Profile opened' : 'Settings opened');
  };

  const downloadContract = (contractNumber) => {
    generateDownload(`${contractNumber}.pdf`, `Contract Summary\n${contractNumber}\nTorrent Gas Custom Self Service Portal`, 'application/pdf');
    showToast(`Download started for ${contractNumber}`);
  };

  const downloadReport = (title, format) => {
    const extension = format.toLowerCase();
    const content = format === 'CSV' ? `title\n${title}` : `Report: ${title}\nTorrent Gas Custom Self Service Portal`;
    generateDownload(`${title.replace(/[^a-z0-9]+/gi, '_').toLowerCase()}.${extension}`, content, format === 'CSV' ? 'text/csv' : 'application/pdf');
    showToast(`${format} export generated for ${title}`);
  };

  const submitComplaint = () => showToast('Complaint submitted successfully');
  const submitServiceRequest = () => showToast('Service request submitted successfully');

  const profile = useMemo(() => {
    if (!auth) return null;
    const isCommercialCustomer = auth.personaType === 'customer' && auth.category === 'Commercial Customer';
    return {
      name: auth.personaType === 'customer' ? (isCommercialCustomer ? 'Aisha Khan' : 'Ramesh Kumar') : 'Vinesh',
      id: auth.personaType === 'customer' ? (isCommercialCustomer ? 'CUST009881' : 'CUST001256') : 'EMP00781',
      category: auth.category,
    };
  }, [auth]);

  const navItems = auth?.personaType === 'customer' ? buildCustomerNav(auth.category) : auth ? buildDepartmentNav(auth.category) : [];

  const renderContent = () => {
    if (!auth) return null;
    const isCommercialCustomer = auth.personaType === 'customer' && auth.category === 'Commercial Customer';

    if (auth.personaType === 'customer') {
      switch (pathname) {
        case '/customer/contracts':
          return isCommercialCustomer ? <CommercialContractSummary onDownload={downloadContract} /> : <ContractSummary onDownload={downloadContract} onShowToast={showToast} />;
        case '/customer/billing':
          return isCommercialCustomer ? <CommercialBillingCenter onShowToast={showToast} /> : <BillingCenter onShowToast={showToast} />;
        case '/customer/reports':
          return isCommercialCustomer ? <CommercialReportsHub onDownload={downloadReport} onShowToast={showToast} /> : <ReportsHub onDownload={downloadReport} onShowToast={showToast} audience="customer" />;
        case '/customer/persona-dashboard':
          return isCommercialCustomer ? <CommercialPersonaDashboard /> : <PersonaDashboard />;
        case '/customer/complaint':
          return <ComplaintDesk onSubmit={submitComplaint} />;
        case '/customer/tariff':
          return isCommercialCustomer ? <CommercialTariffBoard /> : <TariffBoard />;
        case '/customer/notifications':
          return isCommercialCustomer ? <CommercialNotificationsCenter /> : <NotificationsCenter />;
        case '/customer/service-requests':
          return <ServiceRequests onSubmit={submitServiceRequest} />;
        case '/customer/support':
          return isCommercialCustomer ? <SupportCenter /> : <IndustrialHelpHub onSubmitComplaint={submitComplaint} onSubmitServiceRequest={submitServiceRequest} />;
        case '/customer/connection':
        default:
          return <ConnectionTracker />;
      }
    }

    switch (pathname) {
      case '/corporate/existing-customers':
        return <ExistingCustomers onShowToast={showToast} />;
      case '/corporate/pipeline-feasibility':
        return <PipelineFeasibilityCheck onShowToast={showToast} />;
      case '/corporate/customer-communications':
        return <MarketingCustomerCommunications onShowToast={showToast} />;
      case '/corporate/bills-payments-exposure':
        return <MarketingBillingExposure onShowToast={showToast} />;
      case '/corporate/registered-complaints':
        return <RegisteredComplaints onShowToast={showToast} />;
      case '/corporate/requests':
        return <ComplaintDesk onSubmit={submitComplaint} />;
      case '/corporate/approvals':
        return <ApprovalsPanel onShowToast={showToast} />;
      case '/corporate/analytics':
        return <ReportsHub onDownload={downloadReport} onShowToast={showToast} audience="corporate" />;
      case '/corporate/support':
        return <SupportCenter />;
      case '/corporate/workspace':
      default:
        return <CorporateWorkspace department={auth.category} onShowToast={showToast} />;
    }
  };

  if (!auth) {
    return <AuthGate onSignIn={handleSignIn} />;
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="flex min-h-screen">
        <Sidebar
          navItems={navItems}
          activePath={pathname}
          onNavigate={(nextPath) => navigate(nextPath)}
          mobileOpen={mobileSidebarOpen}
          onCloseMobile={() => setMobileSidebarOpen(false)}
          collapsed={sidebarCollapsed}
          onToggleCollapsed={() => setSidebarCollapsed((current) => !current)}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <AppHeader profile={profile} onMenuClick={() => setMobileSidebarOpen(true)} onProfileAction={handleProfileAction} />
          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{renderContent()}</main>
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-5 right-5 z-[60] rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm font-medium text-emerald-700 shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}

export default App;
