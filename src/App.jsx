import React, { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { SystemProvider, useSystem } from "./context/SystemContext";
import { Navbar } from "./components/common/Navbar";
import { Sidebar } from "./components/common/Sidebar";
import { OfflineBanner } from "./components/common/OfflineBanner";

// Pages
import { DashboardPage } from "./pages/DashboardPage";
import { DisasterMonitoringPage } from "./pages/DisasterMonitoringPage";
import { SensorMonitoringPage } from "./pages/SensorMonitoringPage";
import { CitizenReportPage } from "./pages/CitizenReportPage";
import { AIRecommendationsPage } from "./pages/AIRecommendationsPage";
import { EmergencyAlertsPage } from "./pages/EmergencyAlertsPage";
import { EvacuationPlansPage } from "./pages/EvacuationPlansPage";
import { UserManagementPage } from "./pages/UserManagementPage";
import { SystemSettingsPage } from "./pages/SystemSettingsPage";
import { AuthPage } from "./pages/AuthPage";

const MainLayout = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // If user explicitly signs out and wants to see AuthPage
  if (!currentUser || showAuthModal) {
    return <AuthPage onAuthSuccess={() => setShowAuthModal(false)} />;
  }

  const renderActivePage = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardPage onNavigate={(tab) => setActiveTab(tab)} />;
      case "disasters":
        return <DisasterMonitoringPage />;
      case "sensors":
        return <SensorMonitoringPage />;
      case "citizen-reports":
        return <CitizenReportPage />;
      case "ai-recommendations":
        return <AIRecommendationsPage />;
      case "emergency-alerts":
        return <EmergencyAlertsPage />;
      case "evacuation-plans":
        return <EvacuationPlansPage />;
      case "user-management":
        return <UserManagementPage />;
      case "system-settings":
        return <SystemSettingsPage />;
      default:
        return <DashboardPage onNavigate={(tab) => setActiveTab(tab)} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navigation */}
      <Navbar 
        onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)} 
      />

      {/* Connectivity & Sync Status Bar */}
      <OfflineBanner />

      {/* Main Body with Sidebar & Content */}
      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          activeTab={activeTab}
          onSelectTab={(tab) => setActiveTab(tab)}
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        <main className="flex-1 overflow-y-auto p-4 lg:p-8 max-w-7xl mx-auto w-full">
          {renderActivePage()}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <SystemProvider>
        <MainLayout />
      </SystemProvider>
    </AuthProvider>
  );
}
