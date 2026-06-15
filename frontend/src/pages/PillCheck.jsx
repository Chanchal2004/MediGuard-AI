import { useRef, useState } from "react";
import { api } from "@/lib/api";
import { motion } from "framer-motion";
import { Camera, Eye, Loader2, AlertTriangle, CheckCircle2, Upload } from "lucide-react";
import { toast } from "sonner";

export default function PillCheck() {
    const [file, setFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [medicine, setMedicine] = useState("");
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const inputRef = useRef(null);

    const onPick = (f) => {
        if (!f) return;
        if (f.size > 12 * 1024 * 1024) { toast.error("Image too large"); return; }
        setFile(f);
        setPreviewUrl(URL.createObjectURL(f));
        setResult(null);
    };

    const submit = async () => {
        if (!file) { toast.error("Select a pill image first"); return; }
        setLoading(true);
        try {
            const fd = new FormData();
            fd.append("file", file);
            if (medicine.trim()) fd.append("medicine_name", medicine.trim());
            const r = await api.post("/pill/check", fd, { headers: { "Content-Type": "multipart/form-data" } });
            setResult(r.data);
        } catch (e) {
            toast.error(e?.response?.data?.detail || "Pill check failed");
        } finally { setLoading(false); }
    };

    const riskColor = {
        none: "text-emergency-green bg-emergency-green/15",
        low: "text-emergency-yellow bg-emergency-yellow/15",
        moderate: "text-emergency-orange bg-emergency-orange/15",
        high: "text-emergency-red bg-emergency-red/15",
    };
    const matchColor = {
        yes: "text-emergency-green bg-emergency-green/15",
        no: "text-emergency-red bg-emergency-red/15",
        uncertain: "text-emergency-yellow bg-emergency-yellow/15",
    };

    return (
        <div className="space-y-8">
            <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground">Visual verification</p>
                <h1 className="text-4xl md:text-5xl mt-1" style={{fontFamily:"Outfit"}}>Pill confusion check</h1>
                <p className="text-sm text-muted-foreground mt-2 max-w-2xl">Snap a photo of a pill. Gemini 3 Pro compares it visually against your active medicines and warns about look-alikes — especially important for elderly patients.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass-card p-6 space-y-5">
                    <div
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => { e.preventDefault(); onPick(e.dataTransfer.files?.[0]); }}
                        onClick={() => inputRef.current?.click()}
                        data-testid="pill-dropzone"
                        className="relative h-72 rounded-2xl border-2 border-dashed border-border/70 hover:border-primary/70 transition cursor-pointer flex items-center justify-center overflow-hidden bg-muted/30"
                    >
                        {previewUrl ? (
                            <img src={previewUrl} alt="pill" className="w-full h-full object-contain"/>
                        ) : (
                            <div className="text-center">
                                <Camera size={28} className="mx-auto text-muted-foreground"/>
                                <p className="text-sm font-medium mt-3">Drop pill photo or tap to upload</p>
                                <p className="text-xs text-muted-foreground mt-1">JPG / PNG / WEBP · up to 12 MB</p>
                            </div>
                        )}
                        <input ref={inputRef} type="file" accept="image/*" capture="environment" className="hidden"
                            data-testid="pill-file-input" onChange={(e) => onPick(e.target.files?.[0])}/>
                    </div>
                    <div>
                        <label className="text-xs uppercase tracking-widest text-muted-foreground">What medicine should this be? (optional)</label>
                        <input value={medicine} onChange={(e) => setMedicine(e.target.value)} data-testid="pill-medicine-input"
                            placeholder="e.g. Metformin 500"
                            className="mt-2 w-full h-12 px-4 rounded-xl bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"/>
                    </div>
                    <button onClick={submit} disabled={loading || !file} data-testid="pill-submit-btn"
                        className="h-12 px-6 rounded-full bg-primary text-primary-foreground text-sm font-medium flex items-center gap-2 disabled:opacity-50">
                        {loading ? <Loader2 className="animate-spin" size={16}/> : <Eye size={16}/>}
                        Verify pill
                    </button>
                </div>

                <div className="glass-card p-6">
                    {!result ? (
                        <div className="h-full flex items-center justify-center text-center text-muted-foreground">
                            <div>
                                <Eye size={28} className="mx-auto"/>
                                <p className="mt-3 text-sm">Upload a pill photo and we will analyse it.</p>
                            </div>
                        </div>
                    ) : (
                        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className={`text-[11px] uppercase tracking-widest px-3 py-1 rounded-full ${riskColor[result.confusion_risk] || "bg-muted"}`} data-testid="pill-risk">
                                    {result.confusion_risk} risk
                                </span>
                                {result.match_with_claim && (
                                    <span className={`text-[11px] uppercase tracking-widest px-3 py-1 rounded-full ${matchColor[result.match_with_claim] || "bg-muted"}`} data-testid="pill-match">
                                        match · {result.match_with_claim}
                                    </span>
                                )}
                                {result.guessed_medicine && (
                                    <span className="text-[11px] uppercase tracking-widest px-3 py-1 rounded-full bg-muted">
                                        likely: {result.guessed_medicine}
                                    </span>
                                )}
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-widest text-muted-foreground">What we see</p>
                                <p className="mt-2 text-sm" data-testid="pill-identified">{result.identified}</p>
                            </div>
                            {result.confusion_with?.length > 0 && (
                                <div>
                                    <p className="text-xs uppercase tracking-widest text-muted-foreground">Looks similar to</p>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {result.confusion_with.map((c) => (
                                            <span key={c} className="px-3 py-1 text-xs rounded-full bg-emergency-orange/15 text-emergency-orange">{c}</span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {result.recommendations?.length > 0 && (
                                <div>
                                    <p className="text-xs uppercase tracking-widest text-muted-foreground">Recommendations</p>
                                    <ul className="mt-2 space-y-1.5">
                                        {result.recommendations.map((r, i) => (
                                            <li key={i} className="text-sm flex items-start gap-2">
                                                <CheckCircle2 size={14} className="text-primary mt-0.5 shrink-0"/>
                                                <span>{r}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {result.safety_note && (
                                <div className="p-3 rounded-xl bg-primary/10 text-primary text-sm flex gap-2">
                                    <AlertTriangle size={16} className="shrink-0 mt-0.5"/>
                                    <p>{result.safety_note}</p>
                                </div>
                            )}
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
}
