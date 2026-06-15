import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, ScanLine, FileText, AlertTriangle, Pill, Trash2, ChevronRight, Loader2, Camera } from "lucide-react";import { toast } from "sonner";
import RiskGauge from "@/components/RiskGauge";

export default function Prescriptions() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [selected, setSelected] = useState(null);
    const fileRef = useRef(null);
    const navigate = useNavigate();

    const refresh = async () => {
        setLoading(true);
        try {
            const r = await api.get("/prescriptions");
            setItems(r.data || []);
        } catch {} finally { setLoading(false); }
    };

    useEffect(() => { refresh(); }, []);

    const onFiles = async (files) => {
        if (!files || !files.length) return;
        const file = files[0];
        if (file.size > 12 * 1024 * 1024) { toast.error("File too large (max 12MB)"); return; }
        const fd = new FormData();
        fd.append("file", file);
        setProcessing(true);
        try {
            const r = await api.post("/prescriptions/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
            toast.success("Prescription analysed");
            setSelected(r.data);
            await refresh();
        } catch (e) {
            toast.error(e?.response?.data?.detail || "Failed to process");
        } finally {
            setProcessing(false);
        }
    };

    const openDetail = async (id) => {
        try {
            const r = await api.get(`/prescriptions/${id}`);
            setSelected(r.data);
        } catch {}
    };

    const removeRx = async (id, e) => {
        e.stopPropagation();
        if (!window.confirm("Delete this prescription?")) return;
        try {
            await api.delete(`/prescriptions/${id}`);
            toast.success("Deleted");
            if (selected?.prescription_id === id) setSelected(null);
            refresh();
        } catch { toast.error("Failed"); }
    };

    return (
        <div className="space-y-8">
            <div className="flex items-end justify-between gap-4 flex-wrap">
                <div>
                    <p className="text-xs uppercase tracking-widest text-muted-foreground">OCR + safety</p>
                    <h1 className="text-4xl md:text-5xl mt-1" style={{fontFamily:"Outfit"}}>Prescriptions</h1>
                </div>
            </div>

            {/* Upload dropzone */}
            <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); onFiles(e.dataTransfer.files); }}
                className="relative glass-card p-10 border-2 border-dashed border-border/70 hover:border-primary/60 transition overflow-hidden"
                data-testid="rx-dropzone"
            >
                {processing && (
                    <div className="absolute inset-0 z-20 bg-background/60 backdrop-blur-sm flex flex-col items-center justify-center">
                        <div className="relative h-40 w-32 border border-primary/40 rounded-xl bg-muted/60 overflow-hidden">
                            <div className="scan-line"/>
                        </div>
                        <p className="mt-4 text-sm flex items-center gap-2 text-muted-foreground"><Loader2 className="animate-spin" size={14}/> Reading prescription with Gemini 3 Pro…</p>
                    </div>
                )}
                <div className="flex flex-col md:flex-row items-center gap-6">
                    <div className="h-16 w-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                        <ScanLine size={26}/>
                    </div>
                    <div className="flex-1">
                        <h3 className="text-xl font-semibold" style={{fontFamily:"Outfit"}}>Drop a prescription here</h3>
                        <p className="text-sm text-muted-foreground mt-1">JPG, PNG, WEBP or PDF · up to 12 MB · handwritten works.</p>
                    </div>
                    <div className="flex gap-2">
                        <input ref={fileRef} type="file" accept="image/*,application/pdf" hidden onChange={(e) => onFiles(e.target.files)} data-testid="rx-file-input"/>
                        <button onClick={() => fileRef.current?.click()} data-testid="rx-upload-btn" className="h-12 px-5 rounded-full bg-primary text-primary-foreground text-sm font-medium flex items-center gap-2">
                            <Upload size={16}/> Choose file
                        </button>
                    </div>
                </div>
            </motion.div>

            {/* List */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-3">
                    <h2 className="text-sm uppercase tracking-widest text-muted-foreground">Recent</h2>
                    {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : items.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No prescriptions yet.</p>
                    ) : items.map((rx) => (
                        <button key={rx.prescription_id} onClick={() => openDetail(rx.prescription_id)}
                            data-testid={`rx-item-${rx.prescription_id}`}
                            className={`w-full text-left p-4 rounded-xl border transition ${selected?.prescription_id === rx.prescription_id ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40"}`}>
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-medium truncate">{rx.doctor_name || rx.diagnosis || "Prescription"}</p>
                                <Trash2 size={14} className="text-muted-foreground hover:text-emergency-red" onClick={(e) => removeRx(rx.prescription_id, e)}/>
                            </div>
                            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                <span>{(rx.medicines || []).length} meds</span>
                                <span>·</span>
                                <span>Risk {rx.risk_score}</span>
                                <span>·</span>
                                <span className="capitalize">{rx.severity_label}</span>
                            </div>
                        </button>
                    ))}
                </div>

                <div className="lg:col-span-2">
                    {!selected ? (
                        <div className="glass-card p-10 text-center text-muted-foreground">
                            <FileText className="mx-auto" size={28}/>
                            <p className="mt-3 text-sm">Select a prescription to view its analysis.</p>
                        </div>
                    ) : (
                        <PrescriptionDetail rx={selected}/>
                    )}
                </div>
            </div>
        </div>
    );
}

function PrescriptionDetail({ rx }) {
    const explanations = rx.explanations || {};
    const alerts = rx.alerts || [];
    const sevBadge = {
        critical: "bg-emergency-red/15 text-emergency-red",
        severe: "bg-emergency-red/15 text-emergency-red",
        moderate: "bg-emergency-orange/15 text-emergency-orange",
        mild: "bg-emergency-yellow/15 text-emergency-yellow",
    };

    const downloadPdf = async () => {
        try {
            const url = `${process.env.REACT_APP_BACKEND_URL}/api/reports/${rx.prescription_id}/pdf`;
            const res = await fetch(url, { credentials: "include" });
            if (!res.ok) throw new Error("PDF failed");
            const blob = await res.blob();
            const u = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = u;
            a.download = `mediguard-${rx.prescription_id}.pdf`;
            a.click();
            URL.revokeObjectURL(u);
            toast.success("PDF downloaded");
        } catch {
            toast.error("Failed to download PDF");
        }
    };

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="glass-card p-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                <RiskGauge score={rx.risk_score} size={180}/>
                <div className="md:col-span-2 space-y-3">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div>
                            <h2 className="text-2xl" style={{fontFamily:"Outfit"}}>{rx.doctor_name || "Prescription analysis"}</h2>
                            {rx.diagnosis && <p className="text-sm text-muted-foreground">Diagnosis: {rx.diagnosis}</p>}
                        </div>
                        <button onClick={downloadPdf} data-testid="rx-pdf-btn"
                            className="h-9 px-4 rounded-full border border-border text-xs flex items-center gap-2 hover:bg-muted">
                            <FileText size={14}/> Download PDF
                        </button>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-center">
                        <Mini label="Severity" val={rx.severity_label} conf={rx.severity_confidence}/>
                        <Mini label="Urgency" val={(rx.visit_urgency || "").replaceAll("_"," ")} conf={rx.visit_urgency_confidence}/>
                        <Mini label="Miss-risk" val={`${Math.round((rx.adherence_predicted_risk || 0)*100)}%`}/>
                    </div>
                </div>
            </div>

            {alerts.length > 0 && (
                <div className="glass-card p-6">
                    <h3 className="text-lg font-semibold mb-4" style={{fontFamily:"Outfit"}}>Safety alerts ({alerts.length})</h3>
                    <div className="space-y-3">
                        {alerts.map((a) => (
                            <div key={a.alert_id} className="p-4 rounded-xl border border-border" data-testid={`detail-alert-${a.alert_id}`}>
                                <div className="flex items-center gap-2">
                                    <span className={`text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full ${sevBadge[a.severity] || ""}`}>{a.severity}</span>
                                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{a.category}</span>
                                </div>
                                <p className="mt-2 font-medium">{a.title}</p>
                                <p className="text-sm text-muted-foreground mt-1">{a.detail}</p>
                                {a.action && <p className="text-xs text-secondary mt-2"><strong>Action:</strong> {a.action}</p>}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="glass-card p-6">
                <h3 className="text-lg font-semibold mb-4" style={{fontFamily:"Outfit"}}>Medicines ({(rx.medicines || []).length})</h3>
                <div className="space-y-4">
                    {(rx.medicines || []).map((m) => {
                        const exp = explanations[m.medicine_id];
                        return (
                            <div key={m.medicine_id} className="p-4 rounded-xl border border-border" data-testid={`detail-med-${m.medicine_id}`}>
                                <div className="flex items-center justify-between">
                                    <p className="font-medium">{m.name} <span className="text-xs text-muted-foreground">{m.dosage}</span></p>
                                    <span className="text-xs text-muted-foreground">{m.frequency || `${m.times_per_day}× daily`}</span>
                                </div>
                                {m.food && <p className="text-xs text-muted-foreground">{m.food}</p>}
                                {m.instructions && <p className="text-xs text-muted-foreground mt-1">{m.instructions}</p>}
                                {exp && (
                                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                                        <Info title="Why" body={exp.why}/>
                                        <Info title="How it works" body={exp.how_it_works}/>
                                        <Info title="When" body={exp.when_to_take}/>
                                        <Info title="Missed dose" body={exp.missed_dose}/>
                                        {exp.side_effects?.length > 0 && (
                                            <Info title="Side effects" body={exp.side_effects.join(", ")}/>
                                        )}
                                        {exp.precautions?.length > 0 && (
                                            <Info title="Precautions" body={exp.precautions.join(", ")}/>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </motion.div>
    );
}

function Mini({ label, val, conf }) {
    return (
        <div className="p-3 rounded-xl bg-muted">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
            <p className="text-lg font-semibold capitalize" style={{fontFamily:"Outfit"}}>{val}</p>
            {conf !== undefined && <p className="text-[10px] text-muted-foreground">{Math.round((conf || 0)*100)}% conf</p>}
        </div>
    );
}

function Info({ title, body }) {
    if (!body) return null;
    return (
        <div className="p-3 rounded-lg bg-muted/40">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{title}</p>
            <p className="text-xs mt-1">{body}</p>
        </div>
    );
}
