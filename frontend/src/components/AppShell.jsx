import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { motion } from "framer-motion";
import {
    Heart, LayoutDashboard, ScanLine, Pill, AlertOctagon,
    MessageSquare, Users, Settings, Sun, Moon, LogOut, Eye
} from "lucide-react";

const navItems = [
    { to: "/app", icon: LayoutDashboard, label: "Overview", end: true, testid: "nav-overview" },
    { to: "/app/prescriptions", icon: ScanLine, label: "Prescriptions", testid: "nav-prescriptions" },
    { to: "/app/schedule", icon: Pill, label: "Schedule", testid: "nav-schedule" },
    { to: "/app/copilot", icon: MessageSquare, label: "AI Copilot", testid: "nav-copilot" },
    { to: "/app/pill-check", icon: Eye, label: "Pill check", testid: "nav-pill" },
    { to: "/app/emergency", icon: AlertOctagon, label: "Emergency", testid: "nav-emergency" },
    { to: "/app/caregiver", icon: Users, label: "Caregiver", testid: "nav-caregiver" },
    { to: "/app/settings", icon: Settings, label: "Settings", testid: "nav-settings" },
];

export default function AppShell() {
    const { user, logout } = useAuth();
    const { theme, toggle } = useTheme();
    const navigate = useNavigate();

    return (
        <div className="grain min-h-screen flex bg-background text-foreground">
            {/* Sidebar */}
            <aside className="hidden md:flex w-72 flex-col p-6 border-r border-border/60 sticky top-0 h-screen">
                <button onClick={() => navigate("/app")} className="flex items-center gap-2 mb-10" data-testid="brand-link">
                    <div className="h-10 w-10 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center">
                        <Heart size={20} weight="duotone" />
                    </div>
                    <div className="text-left">
                        <p className="text-base font-semibold tracking-tight" style={{fontFamily:'Outfit'}}>MediGuard</p>
                        <p className="text-xs text-muted-foreground -mt-0.5">AI healthcare safety</p>
                    </div>
                </button>
                <nav className="flex flex-col gap-1 flex-1">
                    {navItems.map((n) => (
                        <NavLink
                            key={n.to}
                            to={n.to}
                            end={n.end}
                            data-testid={n.testid}
                            className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
                        >
                            <n.icon size={18} />
                            <span>{n.label}</span>
                        </NavLink>
                    ))}
                </nav>
                <div className="mt-6 glass-card p-4">
                    <div className="flex items-center gap-3">
                        {user?.picture ? (
                            <img src={user.picture} alt="" className="h-10 w-10 rounded-full object-cover" />
                        ) : (
                            <div className="h-10 w-10 rounded-full bg-muted" />
                        )}
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate" data-testid="user-name">{user?.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                        </div>
                    </div>
                    <div className="flex items-center justify-between mt-3 gap-2">
                        <button
                            onClick={toggle}
                            data-testid="toggle-theme-btn"
                            className="flex-1 h-9 rounded-lg border border-border hover:bg-muted text-xs flex items-center justify-center gap-1.5"
                        >
                            {theme === "dark" ? <Sun size={14}/> : <Moon size={14}/>}
                            {theme === "dark" ? "Light" : "Dark"}
                        </button>
                        <button
                            onClick={async () => { await logout(); navigate("/"); }}
                            data-testid="logout-btn"
                            className="flex-1 h-9 rounded-lg border border-border hover:bg-destructive/10 hover:text-destructive text-xs flex items-center justify-center gap-1.5"
                        >
                            <LogOut size={14}/> Logout
                        </button>
                    </div>
                </div>
            </aside>

            {/* Mobile top bar */}
            <div className="md:hidden fixed top-0 inset-x-0 z-40 glass flex items-center justify-between px-4 h-14 border-b border-border">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-xl bg-primary text-primary-foreground flex items-center justify-center">
                        <Heart size={16}/>
                    </div>
                    <p className="font-semibold tracking-tight" style={{fontFamily:'Outfit'}}>MediGuard</p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={toggle} data-testid="toggle-theme-mobile" className="h-8 w-8 rounded-full border border-border flex items-center justify-center">
                        {theme === "dark" ? <Sun size={14}/> : <Moon size={14}/>}
                    </button>
                </div>
            </div>

            {/* Main */}
            <main className="flex-1 min-w-0 pt-14 md:pt-0">
                <motion.div
                    key={typeof window !== "undefined" ? window.location.pathname : "page"}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className="p-6 lg:p-10 max-w-7xl mx-auto"
                >
                    <Outlet />
                </motion.div>

                {/* Mobile bottom nav */}
                <div className="md:hidden fixed bottom-0 inset-x-0 z-40 glass border-t border-border flex justify-around py-2">
                    {navItems.slice(0,5).map(n => (
                        <NavLink key={n.to} to={n.to} end={n.end} data-testid={`mob-${n.testid}`}
                            className={({isActive}) => `flex flex-col items-center gap-0.5 py-1 px-2 rounded-md ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                            <n.icon size={18}/>
                            <span className="text-[10px]">{n.label}</span>
                        </NavLink>
                    ))}
                </div>
            </main>
        </div>
    );
}
