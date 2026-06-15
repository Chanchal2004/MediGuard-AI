import { Heart, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
    const navigate = useNavigate();
    const handleLogin = () => {
    navigate("/onboarding");
};

    return (
        <div className="grain min-h-screen bg-background text-foreground flex items-center justify-center px-6">
            <div className="w-full max-w-md glass-card p-10">
                <button onClick={() => navigate("/")} className="flex items-center gap-2 mb-8" data-testid="back-home-btn">
                    <div className="h-9 w-9 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center">
                        <Heart size={18}/>
                    </div>
                    <p className="text-base font-semibold tracking-tight" style={{fontFamily:"Outfit"}}>MediGuard AI</p>
                </button>
                <h1 className="text-3xl md:text-4xl" style={{fontFamily:"Outfit"}}>Welcome back.</h1>
                <p className="text-sm text-muted-foreground mt-3">Sign in to continue protecting your prescriptions.</p>
                <button
                    onClick={handleLogin}
                    data-testid="google-signin-btn"
                    className="mt-10 w-full h-12 rounded-full bg-foreground text-background font-medium flex items-center justify-center gap-3 hover:opacity-90"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 48 48">
                        <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34 6.3 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.2-.1-2.3-.4-3.5z"/>
                        <path fill="#FF3D00" d="M6.3 14.1l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34 6.3 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.1z"/>
                        <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.1C29.1 35 26.7 36 24 36c-5.3 0-9.7-3.4-11.3-8.1l-6.5 5C9.5 39.7 16.2 44 24 44z"/>
                        <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-0.8 2.3-2.3 4.3-4.2 5.7l6.2 5.1C40.9 35.4 44 30.1 44 24c0-1.2-.1-2.3-.4-3.5z"/>
                    </svg>
                    Continue with Google
                </button>
                <div className="mt-8 flex items-center gap-2 text-xs text-muted-foreground">
                    <ShieldCheck size={14}/>
                    <p>HTTPS · session-based auth · revoke any time</p>
                </div>
            </div>
        </div>
    );
} 