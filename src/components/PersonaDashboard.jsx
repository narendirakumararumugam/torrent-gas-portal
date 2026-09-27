import React from 'react';
import PersonaBasedDashboards from './reports/PersonaBasedDashboards';
import FloatingContractAssistant from './reports/FloatingContractAssistant';

/* Top-level page for the persona-specific (Operations/Finance/Management) dashboards, split out of Reports Hub */
function PersonaDashboard() {
  return (
    <div className="space-y-6">
      <PersonaBasedDashboards />
      <FloatingContractAssistant />
    </div>
  );
}

export default PersonaDashboard;
