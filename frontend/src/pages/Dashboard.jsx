import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { motion } from "framer-motion";
import RiskGauge from "@/components/RiskGauge";
import { Pill, AlertTriangle, TrendingUp, ScanLine, Users, ArrowRight, Activity } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";

export default function Dashboard() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        api.get("/dashboard").then((r) => { setData(r.data); setLoading(false); }).catch(() => setLoading(false));
    }, []);

    if (loading) return <div className="text-muted-foreground" data-testid="dashboard-loading">Loading…</div>;
    if (!data) return null;

    const latest = data.latest_prescription;
    const alerts = data.alerts || [];
    const adh = data.adherence || {};
    const trend = (adh.trend || []).map((d) => ({ ...d, total: d.taken + d.missed + d.delayed }));

    const sevColor = {
        critical: "bg-emergency-red/15 text-emergency-red",
        severe: "bg-emergency-red/15 text-emergency-red",
        moderate: "bg-emergency-orange/15 text-emergency-orange",
        mild: "bg-emergency-yellow/15 text-emergency-yellow",
    };

    return (
        <div className="space-y-8" data-testid="dashboard-root">
            <div className="flex items-end justify-between gap-4 flex-wrap">
                <div>
                    <p className="text-xs uppercase tracking-widest text-muted-foreground">Hello {data.profile?.full_name?.split(" ")[0] || "there"}</p>
                    <h1 className="text-4xl md:text-5xl mt-1" style={{fontFamily:"Outfit"}}>Overview</h1>
                </div>
                <button onClick={() => navigate("/app/prescriptions")} data-testid="dashboard-upload-btn"
                    className="h-11 px-5 rounded-full bg-primary text-primary-foreground text-sm font-medium flex items-center gap-2">
                    <ScanLine size={16}/> Scan prescription
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-8 lg:col-span-1 flex flex-col items-center">
                    <RiskGauge score={latest?.risk_score || 0} />
                    <p className="mt-3 text-sm text-center text-muted-foreground">Severity: <span className="font-medium text-foreground capitalize">{latest?.severity_label || "unknown"}</span></p>
                    <p className="text-xs text-muted-foreground">Visit urgency: <span className="capitalize">{(latest?.visit_urgency || "routine").replaceAll("_"," ")}</span></p>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card p-8 lg:col-span-2">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs uppercase tracking-widest text-muted-foreground">Adherence (last 14 days)</p>
                            <p className="text-4xl mt-2 font-semibold tabular-nums" style={{fontFamily:"Outfit"}} data-testid="adherence-score">{adh.score ?? 100}<span className="text-xl text-muted-foreground">/100</span></p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-muted-foreground">Predicted miss-risk</p>
                            <p className={`text-sm font-medium ${adh.future_miss_level === "high" ? "text-emergency-red" : adh.future_miss_level === "moderate" ? "text-emergency-orange" : "text-emergency-green"}`} data-testid="adh-miss-level">
                                {((adh.future_miss_prob || 0) * 100).toFixed(0)}% · {adh.future_miss_level || "low"}
                            </p>
                        </div>
                    </div>
                    <div className="mt-6 h-44">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={trend}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                <XAxis dataKey="date" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} hide={trend.length === 0}/>
                                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}/>
                                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }}/>
                                <Line type="monotone" dataKey="taken" stroke="#4ADE80" strokeWidth={2} dot={false}/>
                                <Line type="monotone" dataKey="missed" stroke="#EF4444" strokeWidth={2} dot={false}/>
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-4 grid grid-cols-4 gap-3 text-center text-xs">
                        <Stat label="Taken" val={adh.taken ?? 0} color="text-emergency-green"/>
                        <Stat label="Missed" val={adh.missed ?? 0} color="text-emergency-red"/>
                        <Stat label="Delayed" val={adh.delayed ?? 0} color="text-emergency-yellow"/>
                        <Stat label="Pending" val={adh.pending ?? 0} color="text-muted-foreground"/>
                    </div>
                </motion.div>
            </div>

            {/* Active meds + alerts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6 lg:col-span-2">
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-xl font-semibold" style={{fontFamily:"Outfit"}}>Active medicines</h2>
                        <Link to="/app/prescriptions" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1" data-testid="see-all-rx">
                            All prescriptions <ArrowRight size={12}/>
                        </Link>
                    </div>
                    {(data.active_medicines || []).length === 0 ? (
                        <EmptyState icon={Pill} text="Upload a prescription to start tracking medicines." cta={() => navigate("/app/prescriptions")} ctaLabel="Upload"/>
                    ) : (
                        <div className="space-y-3">
                            {data.active_medicines.slice(0,6).map((m) => (
                                <div key={m.medicine_id} className="flex items-center justify-between p-3 rounded-xl border border-border/60 hover:bg-muted/40 transition" data-testid={`med-${m.medicine_id}`}>
                                    <div>
                                        <p className="font-medium">{m.name} <span className="text-xs text-muted-foreground">{m.dosage}</span></p>
                                        <p className="text-xs text-muted-foreground">{m.frequency || `${m.times_per_day}× daily`} {m.food ? `· ${m.food}` : ""}</p>
                                    </div>
                                    <Pill size={16} className="text-primary"/>
                                </div>
                            ))}
                        </div>
                    )}
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card p-6">
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-xl font-semibold" style={{fontFamily:"Outfit"}}>Safety alerts</h2>
                        <span className="text-xs text-emergency-red">{data.critical_alerts_count} critical</span>
                    </div>
                    {alerts.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No alerts yet. Stay safe.</p>
                    ) : (
                        <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                            {alerts.map((a) => (
                                <div key={a.alert_id} className="p-3 rounded-xl border border-border/60" data-testid={`alert-${a.alert_id}`}>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full ${sevColor[a.severity] || "bg-muted text-muted-foreground"}`}>{a.severity}</span>
                                        <span className="text-[10px] text-muted-foreground">{a.category}</span>
                                    </div>
                                    <p className="mt-2 text-sm font-medium">{a.title}</p>
                                    <p className="mt-1 text-xs text-muted-foreground line-clamp-3">{a.detail}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </motion.div>
            </div>

            {/* Caregiver block */}
            {data.caregiver_status && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${data.caregiver_status.required ? "bg-emergency-red/15 text-emergency-red" : "bg-primary/15 text-primary"}`}>
                            <Users size={20}/>
                        </div>
                        <div>
                            <p className="font-semibold" style={{fontFamily:"Outfit"}}>Caregiver — {data.caregiver_status.required ? "Required" : data.caregiver_status.recommended ? "Recommended" : "Optional"}</p>
                            <p className="text-xs text-muted-foreground">{data.caregiver_status.reason}</p>
                        </div>
                    </div>
                    <button onClick={() => navigate("/app/caregiver")} data-testid="goto-caregiver" className="h-10 px-5 rounded-full border border-border text-sm hover:bg-muted">Caregiver view</button>
                </motion.div>
            )}
        </div>
    );
}

function Stat({ label, val, color }) {
    return (
        <div className="p-3 rounded-xl bg-muted">
            <p className={`text-xl font-semibold ${color}`}>{val}</p>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
        </div>
    );
}

function EmptyState({ icon: Icon, text, cta, ctaLabel }) {
    return (
        <div className="text-center py-10">
            <Icon size={32} className="mx-auto text-muted-foreground"/>
            <p className="text-sm text-muted-foreground mt-3">{text}</p>
            <button onClick={cta} data-testid="empty-cta" className="mt-4 h-10 px-5 rounded-full bg-primary text-primary-foreground text-sm">{ctaLabel}</button>
        </div>
    );
}
