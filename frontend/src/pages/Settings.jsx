import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function Settings() {
    const { refresh } = useAuth();
    const [profile, setProfile] = useState(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        api.get("/profile").then((r) => setProfile(r.data));
    }, []);

    if (!profile) return <p className="text-muted-foreground">Loading…</p>;
    const set = (k, v) => setProfile((p) => ({ ...p, [k]: v }));

    const save = async () => {
        setSaving(true);
        try {
            await api.post("/profile", {
                full_name: profile.full_name,
                age: parseInt(profile.age),
                sex: profile.sex,
                weight_kg: profile.weight_kg ? parseFloat(profile.weight_kg) : null,
                pregnant: !!profile.pregnant,
                trimester: profile.trimester,
                chronic_conditions: profile.chronic_conditions || [],
                allergies: profile.allergies || [],
                language: profile.language || "en",
                caregiver_name: profile.caregiver_name,
                caregiver_email: profile.caregiver_email,
                caregiver_phone: profile.caregiver_phone,
                location: profile.location,
            });
            await refresh();
            toast.success("Saved");
        } catch (e) {
            toast.error("Failed");
        } finally { setSaving(false); }
    };

    return (
        <div className="space-y-6 max-w-3xl">
            <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground">Profile</p>
                <h1 className="text-4xl md:text-5xl mt-1" style={{fontFamily:"Outfit"}}>Settings</h1>
            </div>
            <div className="glass-card p-6 space-y-4">
                <Row label="Name"><input value={profile.full_name || ""} onChange={(e) => set("full_name", e.target.value)} data-testid="set-name" className="input"/></Row>
                <div className="grid grid-cols-2 gap-3">
                    <Row label="Age"><input type="number" value={profile.age || ""} onChange={(e) => set("age", e.target.value)} data-testid="set-age" className="input"/></Row>
                    <Row label="Language">
                        <select value={profile.language || "en"} onChange={(e) => set("language", e.target.value)} data-testid="set-lang" className="input">
                            <option value="en">English</option>
                            <option value="hi">Hindi</option>
                        </select>
                    </Row>
                </div>
                <Row label="Caregiver email"><input value={profile.caregiver_email || ""} onChange={(e) => set("caregiver_email", e.target.value)} data-testid="set-cg-email" className="input"/></Row>
                <Row label="Caregiver phone"><input value={profile.caregiver_phone || ""} onChange={(e) => set("caregiver_phone", e.target.value)} data-testid="set-cg-phone" className="input"/></Row>
                <button onClick={save} disabled={saving} data-testid="set-save" className="h-11 px-5 rounded-full bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50">
                    {saving ? "Saving…" : "Save changes"}
                </button>
            </div>
            <style>{`.input{height:3rem;width:100%;border-radius:0.75rem;background:hsl(var(--background));border:1px solid hsl(var(--border));padding:0 1rem;outline:none}.input:focus{box-shadow:0 0 0 2px hsl(var(--primary)/0.4)}`}</style>
        </div>
    );
}

function Row({ label, children }) {
    return (
        <div>
            <label className="text-xs uppercase tracking-widest text-muted-foreground">{label}</label>
            <div className="mt-2">{children}</div>
        </div>
    );
}
