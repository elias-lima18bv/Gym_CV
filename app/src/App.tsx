import {useState} from "react";
import {AppProvider} from "./context/AppContext";
import Sidebar from "./components/Sidebar";
import MobileNav from "./components/MobileNav";
import Toolbar from "./components/Toolbar";
import Dashboard from "./pages/Dashboard";
import Members from "./pages/Members";
import GymAreas from "./pages/GymAreas";
import CheckIn from "./pages/CheckIn";
import Team from "./pages/Team";
import Schedule from "./pages/Schedule";
import PlanDesigner from "./pages/PlanDesigner";
import Billing from "./pages/Billing";
import Onboarding from "./pages/Onboarding";
import {Toaster} from "@/components/ui/sonner";

export type Page =
  | "dashboard"
  | "members"
  | "areas"
  | "checkin"
  | "team"
  | "schedule"
  | "plandesigner"
  | "billing"
  | "onboarding";

function AppContent() {
  const [currentPage, setCurrentPage] = useState<Page>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <Dashboard />;
      case "members":
        return <Members />;
      case "areas":
        return <GymAreas />;
      case "checkin":
        return <CheckIn />;
      case "team":
        return <Team />;
      case "schedule":
        return <Schedule />;
      case "plandesigner":
        return <PlanDesigner />;
      case "billing":
        return <Billing />;
      case "onboarding":
        return <Onboarding />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[hsl(0,0%,17%)] text-[hsl(0,0%,95%)]">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />
      </div>

      {/* Mobile Sidebar Drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full animate-slide-in-left">
            <Sidebar
              currentPage={currentPage}
              onNavigate={(page) => {
                setCurrentPage(page);
                setSidebarOpen(false);
              }}
            />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <Toolbar
          currentPage={currentPage}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main className="flex-1 overflow-y-auto scrollbar-thin pb-20 lg:pb-6">
          {renderPage()}
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <MobileNav currentPage={currentPage} onNavigate={setCurrentPage} />

      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "hsl(0, 0%, 21%)",
            border: "1px solid hsl(0, 0%, 29%)",
            color: "hsl(0, 0%, 95%)",
          },
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
