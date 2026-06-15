import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import "@/App.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { Toaster } from "sonner";

import LandingPage from "@/pages/LandingPage";
import LoginPage from "@/pages/LoginPage";
import AuthCallback from "@/pages/AuthCallback";
import Onboarding from "@/pages/Onboarding";
import AppShell from "@/components/AppShell";
import Dashboard from "@/pages/Dashboard";
import Prescriptions from "@/pages/Prescriptions";
import Schedule from "@/pages/Schedule";
import Copilot from "@/pages/Copilot";
import EmergencyPage from "@/pages/EmergencyPage";
import Caregiver from "@/pages/Caregiver";
import PublicCaregiver from "@/pages/PublicCaregiver";
import PillCheck from "@/pages/PillCheck";
import Settings from "@/pages/Settings";

function Protected({ children }) {
    return children;
}

function AppRouter() {
    const location = useLocation();

    if (location.hash?.includes("session_id=")) {
        return <AuthCallback />;
    }

    return (
        <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/cg/:token" element={<PublicCaregiver />} />
            <Route path="/onboarding" element={<Protected><Onboarding /></Protected>} />

            <Route path="/app" element={<Protected><AppShell /></Protected>}>
                <Route index element={<Dashboard />} />
                <Route path="prescriptions" element={<Prescriptions />} />
                <Route path="schedule" element={<Schedule />} />
                <Route path="copilot" element={<Copilot />} />
                <Route path="emergency" element={<EmergencyPage />} />
                <Route path="pill-check" element={<PillCheck />} />
                <Route path="caregiver" element={<Caregiver />} />
                <Route path="settings" element={<Settings />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

export default function App() {
    return (
        <ThemeProvider>
            <AuthProvider>
                <BrowserRouter>
                    <AppRouter />
                    <Toaster richColors position="top-right" />
                </BrowserRouter>
            </AuthProvider>
        </ThemeProvider>
    );
}