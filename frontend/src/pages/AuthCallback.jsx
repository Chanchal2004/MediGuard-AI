import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

export default function AuthCallback() {
    const navigate = useNavigate();
    const { refresh } = useAuth();
    const processed = useRef(false);

    useEffect(() => {
        if (processed.current) return;
        processed.current = true;

        const hash = window.location.hash || "";
        const params = new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash);
        const sessionId = params.get("session_id");
        if (!sessionId) {
            navigate("/login");
            return;
        }
        (async () => {
            try {
                await api.post("/auth/session", { session_id: sessionId });
                // Clean URL and refresh user
                window.history.replaceState(null, "", "/onboarding");
                await refresh();
                navigate("/onboarding");
            } catch (e) {
                navigate("/login");
            }
        })();
    }, [navigate, refresh]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
            <div className="flex items-center gap-3 text-muted-foreground">
                <Loader2 className="animate-spin" /> Signing you in…
            </div>
        </div>
    );
}
