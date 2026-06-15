import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { motion } from "framer-motion";
import { Pill, Check, Clock, X } from "lucide-react";
import { toast } from "sonner";

const fmtTime = (iso) => new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
const fmtDate = (iso) => new Date(iso).toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });

export default function Schedule() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    const refresh = async () => {
        setLoading(true);
        try {
            const r = await api.get("/dose-events?days=7");
            setEvents(r.data || []);
        } finally { setLoading(false); }
    };
    useEffect(() => { refresh(); }, []);

    const grouped = useMemo(() => {
        const map = {};
        for (const ev of events) {
            const d = new Date(ev.scheduled_for).toISOString().slice(0,10);
            (map[d] ||= []).push(ev);
        }
        return Object.entries(map).sort();
    }, [events]);

    const act = async (id, status) => {
        try {
            await api.post(`/dose-events/${id}/action`, { status });
            toast.success(status === "taken" ? "Marked taken" : status === "missed" ? "Marked missed" : "Marked");
            refresh();
        } catch { toast.error("Failed"); }
    };

    return (
        <div className="space-y-8">
            <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground">Medication schedule</p>
                <h1 className="text-4xl md:text-5xl mt-1" style={{fontFamily:"Outfit"}}>Next 7 days</h1>
            </div>
            {loading ? <p className="text-muted-foreground">Loading…</p> : grouped.length === 0 ? (
                <div className="glass-card p-10 text-center text-muted-foreground">
                    <Pill className="mx-auto" size={28}/>
                    <p className="mt-3 text-sm">No upcoming doses. Upload a prescription to generate a schedule.</p>
                </div>
            ) : grouped.map(([day, list], i) => (
                <motion.div key={day} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i*0.04 }} className="space-y-3">
                    <h2 className="text-sm uppercase tracking-widest text-muted-foreground">{fmtDate(day)}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {list.map((ev) => {
                            const status = ev.status || "pending";
                            const sIs = (s) => status === s;
                            return (
                                <div key={ev.event_id} className={`glass-card p-4 flex items-center justify-between ${sIs("taken") ? "opacity-60" : ""}`} data-testid={`dose-${ev.event_id}`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${sIs("taken") ? "bg-emergency-green/15 text-emergency-green" : sIs("missed") ? "bg-emergency-red/15 text-emergency-red" : sIs("delayed") ? "bg-emergency-orange/15 text-emergency-orange" : "bg-primary/15 text-primary"}`}>
                                            <Pill size={16}/>
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm">{ev.medicine_name}</p>
                                            <p className="text-xs text-muted-foreground flex items-center gap-1"><Clock size={11}/> {fmtTime(ev.scheduled_for)} · <span className="capitalize">{status}</span></p>
                                        </div>
                                    </div>
                                    {!sIs("taken") && (
                                        <div className="flex gap-1.5">
                                            <button onClick={() => act(ev.event_id, "taken")} data-testid={`dose-take-${ev.event_id}`}
                                                className="h-8 px-3 rounded-full bg-emergency-green/20 text-emergency-green text-xs flex items-center gap-1 hover:bg-emergency-green/30"><Check size={12}/> Taken</button>
                                            <button onClick={() => act(ev.event_id, "missed")} data-testid={`dose-miss-${ev.event_id}`}
                                                className="h-8 px-3 rounded-full bg-muted text-muted-foreground text-xs flex items-center gap-1 hover:bg-emergency-red/15 hover:text-emergency-red"><X size={12}/> Missed</button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </motion.div>
            ))}
        </div>
    );
}
