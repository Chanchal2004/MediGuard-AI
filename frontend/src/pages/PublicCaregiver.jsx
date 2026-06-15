import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";
import { Heart, ShieldCheck, AlertOctagon, Pill, Users } from "lucide-react";
import RiskGauge from "@/components/RiskGauge";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function PublicCaregiver() {
    const { token } = useParams();
    const [data, setData] = useState(null);
    const [err, setErr] = useState(null);

    useEffect(() => {
        axios.get(`${BACKEND_URL}/api/public/caregiver/${token}`)
            .then((r) => setData(r.data))
            .catch((e) => setErr(e?.response?.data?.detail || "Invalid link"));
    }, [token]);

    if (err) {
        return (
            <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
                <div className="glass-card p-10 max-w-md text-center">
                    <AlertOctagon size={28} className="mx-auto text-emergency-red"/>
                    <h1 className="text-2xl mt-3" style={{fontFamily:"Outfit"}}>Link unavailable</h1>
                    <p className="text-sm text-muted-foreground mt-2">{err}</p>
                </div>
            </div>
        );
    }
    if (!data) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading…</div>;

    const patient = data.patient || {};
    const rx = data.latest_prescription;
    const adh = data.adherence || {};
    const esc = data.escalation || {};
    const sevMap = {
        ok: "bg-emergency-green/15 text-emergency-green",
        info: "bg-emergency-yellow/15 text-emergency-yellow",
        warning: "bg-emergency-orange/15 text-emergency-orange",
        critical: "bg-emergency-red/15 text-emergency-red",
    };

    return (
        <div className="grain min-h-screen bg-background text-foreground">
            <header className="sticky top-0 z-40 glass">
                <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="h-9 w-9 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center"><Heart size={16}/></div>
                        <p className="text-base font-semibold" style={{fontFamily:"Outfit"}}>MediGuard · Caregiver view</p>
                    </div>
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground border border-border rounded-full px-2 py-0.5">read-only</span>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-6 py-10 space-y-8">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <p className="text-xs uppercase tracking-widest text-muted-foreground">You are watching over</p>
                    <h1 className="text-4xl md:text-5xl mt-1" style={{fontFamily:"Outfit"}}>{patient.full_name || "Patient"}</h1>
                    <p className="text-sm text-muted-foreground mt-2">{patient.age}y · {patient.sex}</p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="glass-card p-6">
                        <p className="text-xs uppercase tracking-widest text-muted-foreground">Adherence</p>
                        <p className="text-4xl mt-3 font-semibold" style={{fontFamily:"Outfit"}} data-testid="pub-adh-score">
                            {adh.score ?? 100}<span className="text-base text-muted-foreground">/100</span>
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">{adh.missed ?? 0} missed · {adh.taken ?? 0} taken</p>
                    </div>
                    <div className="glass-card p-6 flex items-center justify-center">
                        <RiskGauge score={rx?.risk_score || 0} size={170}/>
                    </div>
                    <div className="glass-card p-6">
                        <p className="text-xs uppercase tracking-widest text-muted-foreground">Escalation</p>
                        <p className={`mt-3 px-3 py-1 inline-block rounded-full text-sm font-medium ${sevMap[esc.level] || "bg-muted"}`} data-testid="pub-escalation">
                            {esc.label}
                        </p>
                        <p className="text-xs text-muted-foreground mt-3">Severity: <span className="capitalize font-medium">{rx?.severity_label || "—"}</span></p>
                    </div>
                </div>

                <div className="glass-card p-6">
                    <h3 className="font-semibold mb-4 flex items-center gap-2" style={{fontFamily:"Outfit"}}><Pill size={16}/> Active medicines</h3>
                    {rx?.medicines?.length ? (
                        <div className="space-y-2">
                            {rx.medicines.map((m, i) => (
                                <div key={i} className="flex items-center justify-between text-sm p-3 rounded-xl border border-border">
                                    <span>{m.name} <span className="text-muted-foreground">{m.dosage}</span></span>
                                    <span className="text-xs text-muted-foreground">{m.frequency || "—"}</span>
                                </div>
                            ))}
                        </div>
                    ) : <p className="text-sm text-muted-foreground">No active prescription.</p>}
                </div>

                {rx?.alerts?.length > 0 && (
                    <div className="glass-card p-6">
                        <h3 className="font-semibold mb-4 flex items-center gap-2" style={{fontFamily:"Outfit"}}><ShieldCheck size={16}/> Safety alerts</h3>
                        <div className="space-y-2">
                            {rx.alerts.map((a, i) => (
                                <div key={i} className="p-3 rounded-xl border border-border">
                                    <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{a.severity}</span>
                                    <p className="mt-2 text-sm font-medium">{a.title}</p>
                                    <p className="text-xs text-muted-foreground">{a.category}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="glass-card p-6">
                    <h3 className="font-semibold mb-3" style={{fontFamily:"Outfit"}}>Health context</h3>
                    <div className="flex flex-wrap gap-2">
                        {(patient.allergies || []).map((a) => <span key={a} className="px-3 py-1 text-xs rounded-full bg-secondary/15 text-secondary">Allergy: {a}</span>)}
                        {(patient.chronic_conditions || []).map((c) => <span key={c} className="px-3 py-1 text-xs rounded-full bg-primary/15 text-primary">{c}</span>)}
                        {(!patient.allergies?.length && !patient.chronic_conditions?.length) && <p className="text-sm text-muted-foreground">None reported.</p>}
                    </div>
                </div>

                <p className="text-center text-xs text-muted-foreground pb-10">Generated by MediGuard AI · Updates live · Patient controls access</p>
            </main>
        </div>
    );
}
