import { useState } from "react";
import { api } from "@/lib/api";
import { motion } from "framer-motion";
import { AlertOctagon, MapPin, Phone, Navigation, Share2, Loader2, Hospital, Cross, Pill } from "lucide-react";
import { toast } from "sonner";

const severityColor = (label) => ({
    green: "bg-emergency-green/15 text-emergency-green",
    yellow: "bg-emergency-yellow/15 text-emergency-yellow",
    orange: "bg-emergency-orange/15 text-emergency-orange",
    red: "bg-emergency-red/15 text-emergency-red",
}[label] || "bg-muted text-muted-foreground");

export default function EmergencyPage() {
    const [symptoms, setSymptoms] = useState("");
    const [locationQuery, setLocationQuery] = useState("");
    const [latLon, setLatLon] = useState(null);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    const detectLocation = () => {
        if (!navigator.geolocation) { toast.error("Geolocation unavailable"); return; }
        navigator.geolocation.getCurrentPosition(
            (pos) => { setLatLon({ lat: pos.coords.latitude, lon: pos.coords.longitude }); toast.success("Location detected"); },
            () => toast.error("Could not get location"),
            { timeout: 6000 }
        );
    };

    const submit = async () => {
        if (!symptoms.trim()) { toast.error("Describe your symptoms"); return; }
        setLoading(true);
        try {
            const body = { symptoms };
            if (latLon) Object.assign(body, latLon);
            else if (locationQuery) body.location_query = locationQuery;
            const r = await api.post("/emergency/assess", body);
            setResult(r.data);
        } catch (e) {
            toast.error(e?.response?.data?.detail || "Assessment failed");
        } finally {
            setLoading(false);
        }
    };

    const share = async () => {
        if (!result?.summary) return;
        try {
            if (navigator.share) {
                await navigator.share({ title: "MediGuard emergency summary", text: result.summary });
            } else {
                await navigator.clipboard.writeText(result.summary);
                toast.success("Summary copied");
            }
        } catch {}
    };

    return (
        <div className="space-y-8">
            <div>
                <p className="text-xs uppercase tracking-widest text-emergency-red">Emergency mode</p>
                <h1 className="text-4xl md:text-5xl mt-1" style={{fontFamily:"Outfit"}}>Get help fast.</h1>
                <p className="text-sm text-muted-foreground mt-2 max-w-xl">Describe what is happening. The ML severity model classifies urgency and we will surface the nearest hospitals, clinics and pharmacies.</p>
            </div>

            <div className="glass-card p-6 space-y-4">
                <div>
                    <label className="text-xs uppercase tracking-widest text-muted-foreground">Symptoms</label>
                    <textarea data-testid="emerg-symptoms" rows={4} value={symptoms} onChange={(e) => setSymptoms(e.target.value)}
                        placeholder="e.g. Severe chest pain for 30 minutes, sweating, short of breath"
                        className="mt-2 w-full p-3 rounded-xl bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"/>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input data-testid="emerg-location" value={locationQuery} onChange={(e) => setLocationQuery(e.target.value)} placeholder="City or address"
                        className="h-12 px-4 rounded-xl bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary/50 md:col-span-2"/>
                    <button onClick={detectLocation} data-testid="emerg-geo-btn" className="h-12 px-4 rounded-xl border border-border text-sm flex items-center justify-center gap-2">
                        <Navigation size={14}/> Use device GPS
                    </button>
                </div>
                <button onClick={submit} disabled={loading} data-testid="emerg-submit"
                    className="h-12 px-6 rounded-full bg-emergency-red text-white font-medium flex items-center gap-2 disabled:opacity-60">
                    {loading ? <Loader2 className="animate-spin" size={16}/> : <AlertOctagon size={16}/>}
                    Assess emergency
                </button>
            </div>

            {result && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="glass-card p-6">
                            <p className="text-xs uppercase tracking-widest text-muted-foreground">Severity</p>
                            <p className={`mt-3 px-3 py-1 inline-block rounded-full text-sm font-semibold uppercase ${severityColor(result.severity.label)}`} data-testid="emerg-severity">
                                {result.severity.label}
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">{Math.round(result.severity.confidence * 100)}% confidence</p>
                        </div>
                        <div className="glass-card p-6">
                            <p className="text-xs uppercase tracking-widest text-muted-foreground">Urgency</p>
                            <p className="text-2xl mt-3 capitalize" style={{fontFamily:"Outfit"}} data-testid="emerg-urgency">{result.urgency.label.replaceAll("_"," ")}</p>
                            <p className="text-xs text-muted-foreground mt-2">{Math.round(result.urgency.confidence * 100)}% confidence</p>
                        </div>
                        <div className="glass-card p-6">
                            <p className="text-xs uppercase tracking-widest text-muted-foreground">Risk score</p>
                            <p className="text-4xl mt-3 font-semibold tabular-nums" style={{fontFamily:"Outfit"}}>{result.risk_score}<span className="text-base text-muted-foreground">/100</span></p>
                        </div>
                    </div>

                    <div className="glass-card p-6">
                        <div className="flex items-center justify-between flex-wrap gap-3">
                            <h2 className="text-lg font-semibold" style={{fontFamily:"Outfit"}}>Emergency summary</h2>
                            <button onClick={share} data-testid="emerg-share" className="h-9 px-4 rounded-full border border-border text-xs flex items-center gap-1"><Share2 size={12}/> Share</button>
                        </div>
                        <pre className="mt-3 text-sm whitespace-pre-wrap leading-relaxed" data-testid="emerg-summary">{result.summary}</pre>
                    </div>

                    <FacilitySection title="Hospitals" icon={Hospital} items={result.facilities.hospitals} testid="hospitals"/>
                    <FacilitySection title="Clinics" icon={Cross} items={result.facilities.clinics} testid="clinics"/>
                    <FacilitySection title="Pharmacies" icon={Pill} items={result.facilities.pharmacies} testid="pharmacies"/>
                </motion.div>
            )}
        </div>
    );
}

function FacilitySection({ title, icon: Icon, items, testid }) {
    if (!items || items.length === 0) {
        return (
            <div className="glass-card p-6">
                <div className="flex items-center gap-2 mb-2"><Icon size={18}/> <h3 className="font-semibold" style={{fontFamily:"Outfit"}}>{title}</h3></div>
                <p className="text-sm text-muted-foreground">No nearby {title.toLowerCase()} found. Try a different location.</p>
            </div>
        );
    }
    return (
        <div className="glass-card p-6">
            <div className="flex items-center gap-2 mb-4"><Icon size={18}/><h3 className="font-semibold" style={{fontFamily:"Outfit"}}>{title} ({items.length})</h3></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {items.slice(0, 10).map((f) => (
                    <div key={f.id} className="p-4 rounded-xl border border-border" data-testid={`${testid}-item-${f.id}`}>
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <p className="font-medium text-sm truncate">{f.name}</p>
                                {f.address && <p className="text-xs text-muted-foreground line-clamp-2">{f.address}</p>}
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1"><MapPin size={11}/> {f.distance_km} km</span>
                                    {f.phone && <a href={`tel:${f.phone}`} className="flex items-center gap-1 hover:text-foreground"><Phone size={11}/> Call</a>}
                                </div>
                            </div>
                            <a href={f.directions_url} target="_blank" rel="noopener noreferrer" className="h-9 w-9 rounded-full border border-border flex items-center justify-center hover:bg-muted shrink-0">
                                <Navigation size={14}/>
                            </a>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
