import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { motion } from "framer-motion";
import { Copy, Mail, Trash2, Link as LinkIcon, Plus, Users, AlertOctagon } from "lucide-react";
import { toast } from "sonner";
import RiskGauge from "@/components/RiskGauge";

export default function Caregiver() {
    const [data, setData] = useState(null);
    const [invites, setInvites] = useState([]);
    const [creating, setCreating] = useState(false);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");

    const loadAll = async () => {
        try {
            const [snap, inv] = await Promise.all([
                api.get("/caregiver/snapshot"),
                api.get("/caregiver/invites"),
            ]);
            setData(snap.data);
            setInvites(inv.data || []);
        } catch {}
    };
    useEffect(() => { loadAll(); }, []);

    if (!data) return <p className="text-muted-foreground" data-testid="caregiver-loading">Loading…</p>;

    const esc = data.escalation || {};
    const sevMap = {
        ok: "bg-emergency-green/15 text-emergency-green",
        info: "bg-emergency-yellow/15 text-emergency-yellow",
        warning: "bg-emergency-orange/15 text-emergency-orange",
        critical: "bg-emergency-red/15 text-emergency-red",
    };

    const createInvite = async () => {
        setCreating(true);
        try {
            await api.post("/caregiver/invite", { caregiver_name: name || null, caregiver_email: email || null });
            toast.success("Caregiver link created");
            setName(""); setEmail("");
            loadAll();
        } catch {
            toast.error("Failed to create invite");
        } finally { setCreating(false); }
    };
    

    const revoke = async (token) => {
        if (!window.confirm("Revoke this caregiver link?")) return;
        try {
            await api.delete(`/caregiver/invite/${token}`);
            toast.success("Revoked");
            loadAll();
        } catch { toast.error("Failed"); }
    };

    const copyLink = (token) => {
        const url = `${window.location.origin}/cg/${token}`;
        navigator.clipboard.writeText(url);
        toast.success("Link copied");
    };

   return (
    <div className="space-y-8">

        <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
                Caregiver snapshot
            </p>

            <h1
                className="text-4xl md:text-5xl mt-1"
                style={{ fontFamily: "Outfit" }}
            >
                {data.profile?.caregiver_name || "No Caregiver"}
            </h1>

            <p className="text-sm text-muted-foreground mt-2">
                {data.profile?.caregiver_email || "No Email"}
            </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-card p-6">
                    <p className="text-xs uppercase tracking-widest text-muted-foreground">Caregiver status</p>
                    <p className="text-xl mt-3" style={{fontFamily:"Outfit"}} data-testid="cg-status">
                        {data.caregiver_status?.required ? "Required" : data.caregiver_status?.recommended ? "Recommended" : "Optional"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">{data.caregiver_status?.reason}</p>
                </div>
                <div className="glass-card p-6">
                    <p className="text-xs uppercase tracking-widest text-muted-foreground">Adherence</p>
                    <p className="text-4xl mt-3 font-semibold" style={{fontFamily:"Outfit"}}>{data.adherence?.score ?? 100}<span className="text-base text-muted-foreground">/100</span></p>
                    <p className="text-xs text-muted-foreground mt-2">{data.adherence?.missed ?? 0} missed · {data.adherence?.taken ?? 0} taken</p>
                </div>
                <div className="glass-card p-6">
                    <p className="text-xs uppercase tracking-widest text-muted-foreground">Escalation</p>
                    <p className={`mt-3 px-3 py-1 inline-block rounded-full text-sm font-medium ${sevMap[esc.level] || "bg-muted"}`} data-testid="cg-escalation">
                        {esc.label}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 flex flex-col items-center">
                    <RiskGauge score={data.latest_prescription?.risk_score || 0}/>
                </motion.div>
                <div className="glass-card p-6 md:col-span-2">
                    <h3 className="font-semibold" style={{fontFamily:"Outfit"}}>Active medicines</h3>
                    <div className="mt-4 space-y-2">
                        {(data.latest_prescription?.medicines || []).slice(0, 8).map((m) => (
                            <div key={m.medicine_id} className="flex items-center justify-between text-sm p-2 rounded-lg border border-border" data-testid={`cg-med-${m.medicine_id}`}>
                                <span>{m.name} <span className="text-muted-foreground">{m.dosage}</span></span>
                                <span className="text-xs text-muted-foreground">{m.frequency || `${m.times_per_day}x`}</span>
                            </div>
                        ))}
                        {!(data.latest_prescription?.medicines || []).length && (
                            <p className="text-sm text-muted-foreground">No active prescription.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Magic-link invites */}
            <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center"><LinkIcon size={18}/></div>
                        <div>
                            <h3 className="font-semibold" style={{fontFamily:"Outfit"}}>Shareable caregiver links</h3>
                            <p className="text-xs text-muted-foreground">Read-only view. Expires in 30 days. Revoke anytime.</p>
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                    <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Caregiver name (optional)" data-testid="cg-invite-name"
                        className="md:col-span-5 h-11 px-4 rounded-xl bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"/>
                    <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="caregiver@email.com" data-testid="cg-invite-email"
                        className="md:col-span-5 h-11 px-4 rounded-xl bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"/>
                    <button onClick={createInvite} disabled={creating} data-testid="cg-invite-create"
                        className="md:col-span-2 h-11 rounded-xl bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50">
                        <Plus size={14}/> Create link
                    </button>
                </div>
                <div className="mt-6 space-y-2">
                    {invites.length === 0 && <p className="text-sm text-muted-foreground">No active invites yet.</p>}
                    {invites.map((inv) => {
                        const url = `${window.location.origin}/cg/${inv.token}`;
                        return (
                            <div key={inv.token} className="flex items-center justify-between gap-3 p-3 rounded-xl border border-border" data-testid={`cg-invite-${inv.token}`}>
                                <div className="min-w-0">
                                    <p className="text-sm font-medium">{inv.caregiver_name || inv.caregiver_email || "Caregiver"}</p>
                                    <p className="text-xs text-muted-foreground truncate">{url}</p>
                                </div>
                                <div className="flex gap-2 shrink-0">
                                    <button onClick={() => copyLink(inv.token)} data-testid={`cg-copy-${inv.token}`} className="h-9 px-3 rounded-full border border-border text-xs flex items-center gap-1 hover:bg-muted"><Copy size={12}/> Copy</button>
                                    <button onClick={() => revoke(inv.token)} data-testid={`cg-revoke-${inv.token}`} className="h-9 px-3 rounded-full border border-border text-xs flex items-center gap-1 hover:bg-emergency-red/10 hover:text-emergency-red"><Trash2 size={12}/> Revoke</button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="glass-card p-6">
                <h3 className="font-semibold" style={{fontFamily:"Outfit"}}>Allergies & conditions</h3>
                <div className="mt-4 flex flex-wrap gap-2">
                    {(data.profile?.allergies || []).map((a) => <span key={a} className="px-3 py-1 text-xs rounded-full bg-secondary/15 text-secondary">{a}</span>)}
                    {(data.profile?.chronic_conditions || []).map((c) => <span key={c} className="px-3 py-1 text-xs rounded-full bg-primary/15 text-primary">{c}</span>)}
                    {(!data.profile?.allergies?.length && !data.profile?.chronic_conditions?.length) && <p className="text-sm text-muted-foreground">None reported.</p>}
                </div>
            </div>
        </div>
    );
}
