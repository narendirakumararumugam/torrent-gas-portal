import {
  Bell,
  Building2,
  ClipboardList,
  CloudDownload,
  FileText,
  HelpCircle,
  LayoutDashboard,
  MessageSquareMore,
  Receipt,
  ShieldCheck,
  Sparkles,
  Route,
  Users,
} from 'lucide-react';

export const customerCategories = ['Industrial Customer', 'Commercial Customer'];
export const corporateDepartments = ['Marketing', 'Projects', 'O&M', 'Material Management'];

export const industrialCustomerNav = [
  { id: 'connection', label: 'Connection Status', icon: LayoutDashboard, path: '/customer/connection' },
  { id: 'persona-dashboard', label: 'Dashboard', icon: Users, path: '/customer/persona-dashboard' },
  { id: 'tariff', label: 'Tariff Information', icon: Sparkles, path: '/customer/tariff' },
  { id: 'billing', label: 'Bills and Payments', icon: Receipt, path: '/customer/billing' },
  { id: 'reports', label: 'Analytics', icon: CloudDownload, path: '/customer/reports' },
  { id: 'contracts', label: 'View Contracts', icon: FileText, path: '/customer/contracts' },
  { id: 'notifications', label: 'Notifications', icon: Bell, path: '/customer/notifications' },
  { id: 'support', label: 'Register Complaint / Help', icon: HelpCircle, path: '/customer/support' },
];

export const commercialCustomerNav = [
  { id: 'connection', label: 'Connection Status', icon: LayoutDashboard, path: '/customer/connection' },
  { id: 'contracts', label: 'View Contracts', icon: FileText, path: '/customer/contracts' },
  { id: 'billing', label: 'Bills & Payments', icon: Receipt, path: '/customer/billing' },
  { id: 'reports', label: 'Reports', icon: CloudDownload, path: '/customer/reports' },
  { id: 'persona-dashboard', label: 'Persona Dashboard', icon: Users, path: '/customer/persona-dashboard' },
  { id: 'complaint', label: 'Register Complaint', icon: MessageSquareMore, path: '/customer/complaint' },
  { id: 'tariff', label: 'Tariff Information', icon: Sparkles, path: '/customer/tariff' },
  { id: 'support', label: 'Support & Help', icon: HelpCircle, path: '/customer/support' },
  { id: 'notifications', label: 'Notifications', icon: Bell, path: '/customer/notifications' },
  { id: 'service-requests', label: 'Service Requests', icon: ClipboardList, path: '/customer/service-requests' },
];

export const marketingNav = [
  { id: 'pipeline-feasibility', label: 'GIS Pipeline Feasibility', icon: Route, path: '/corporate/pipeline-feasibility' },
  { id: 'existing-customers', label: 'Existing Customers', icon: FileText, path: '/corporate/existing-customers' },
  { id: 'customer-communications', label: 'Customer Communications', icon: MessageSquareMore, path: '/corporate/customer-communications' },
  { id: 'bills-payments-exposure', label: 'Bills & Payments', icon: Receipt, path: '/corporate/bills-payments-exposure' },
  { id: 'registered-complaints', label: 'Registered Complaints', icon: MessageSquareMore, path: '/corporate/registered-complaints' },
];

export const corporateNav = [
  { id: 'workspace', label: 'Department Workspace', icon: Building2, path: '/corporate/workspace' },
  { id: 'requests', label: 'Service Requests', icon: MessageSquareMore, path: '/corporate/requests' },
  { id: 'approvals', label: 'Approvals', icon: ShieldCheck, path: '/corporate/approvals' },
  { id: 'analytics', label: 'Analytics', icon: CloudDownload, path: '/corporate/analytics' },
  { id: 'support', label: 'Support & Help', icon: HelpCircle, path: '/corporate/support' },
];
