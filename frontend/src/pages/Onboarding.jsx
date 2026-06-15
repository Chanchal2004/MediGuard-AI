import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { Heart, ArrowRight, X } from "lucide-react";
import { toast } from "sonner";

const CHRONIC_OPTIONS = [
    "Diabetes", "Hypertension", "Heart disease", "Cancer", "Stroke",
    "Dementia", "Parkinson", "Chronic kidney disease", "Asthma", "COPD",
];

export default function Onboarding() {
    const { refresh } = useAuth();
    const navigate = useNavigate();
    const [step, setStep] = useState(0);
    const [data, setData] = useState({
        full_name: "",
        age: "",
        sex: "other",
        weight_kg: "",
        pregnant: false,
        trimester: null,
        chronic_conditions: [],
        chronic_input: "",
        allergies: [],
        allergy_input: "",
        language: "en",
        caregiver_name: "",
        caregiver_email: "",
        caregiver_phone: "",
        location_query: "",
    });
    const [loading, setLoading] = useState(false);

    const update = (k, v) => setData((p) => ({ ...p, [k]: v }));

    const addChronic = (val) => {
        const v = (val || data.chronic_input).trim();
        if (!v) return;
        if (!data.chronic_conditions.includes(v)) {
            update("chronic_conditions", [...data.chronic_conditions, v]);
        }
        update("chronic_input", "");
    };
    const addAllergy = () => {
        const v = data.allergy_input.trim();
        if (!v) return;
        if (!data.allergies.includes(v)) {
            update("allergies", [...data.allergies, v]);
        }
        update("allergy_input", "");
    };

    const submit = async () => {
        setLoading(true);
        try {
            const payload = {
                full_name: data.full_name.trim(),
                age: parseInt(data.age, 10),
                sex: data.sex,
                weight_kg: data.weight_kg ? parseFloat(data.weight_kg) : null,
                pregnant: !!data.pregnant,
                trimester: data.pregnant ? data.trimester : null,
                chronic_conditions: data.chronic_conditions,
                allergies: data.allergies,
                language: data.language,
                caregiver_name: data.caregiver_name || null,
                caregiver_email: data.caregiver_email || null,
                caregiver_phone: data.caregiver_phone || null,
                location: data.location_query ? { label: data.location_query } : null,
            };
            await api.post("/profile", payload);
            await refresh();
            toast.success("Profile saved");
            navigate("/app");
        } catch (e) {
            toast.error(e?.response?.data?.detail || "Failed to save");
        } finally {
            setLoading(false);
        }
    };

    const canNext = () => {
        if (step === 0) return data.full_name.trim() && data.age && parseInt(data.age) > 0;
        return true;
    };

    return (
        <div className="grain min-h-screen bg-background text-foreground px-6 py-12 flex items-center justify-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-2xl glass-card p-8 md:p-12">
                <div className="flex items-center gap-2 mb-8">
                    <div className="h-9 w-9 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center"><Heart size={18}/></div>
                    <p className="font-semibold tracking-tight" style={{fontFamily:"Outfit"}}>MediGuard AI</p>
                </div>
                <div className="flex items-center gap-2 mb-8 text-xs text-muted-foreground">
                    <span className={step >= 0 ? "text-foreground" : ""}>About you</span><span>·</span>
                    <span className={step >= 1 ? "text-foreground" : ""}>Health</span><span>·</span>
                    <span className={step >= 2 ? "text-foreground" : ""}>Caregiver</span>
                </div>

                {step === 0 && (
                    <div className="space-y-5">
                        <h1 className="text-3xl md:text-4xl" style={{fontFamily:"Outfit"}}>Tell us about you.</h1>
                        <div>
                            <label className="text-xs uppercase tracking-widest text-muted-foreground">Full name</label>
                            <input data-testid="onb-name" value={data.full_name} onChange={(e) => update("full_name", e.target.value)}
                                className="mt-2 w-full h-12 px-4 rounded-xl bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"/>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs uppercase tracking-widest text-muted-foreground">Age</label>
                                <input data-testid="onb-age" type="number" value={data.age} onChange={(e) => update("age", e.target.value)}
                                    className="mt-2 w-full h-12 px-4 rounded-xl bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"/>
                            </div>
                            <div>
                                <label className="text-xs uppercase tracking-widest text-muted-foreground">Sex</label>
                                <select data-testid="onb-sex" value={data.sex} onChange={(e) => update("sex", e.target.value)}
                                    className="mt-2 w-full h-12 px-3 rounded-xl bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary/50">
                                    <option value="female">Female</option>
                                    <option value="male">Male</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs uppercase tracking-widest text-muted-foreground">Weight (kg)</label>
                                <input data-testid="onb-weight" type="number" value={data.weight_kg} onChange={(e) => update("weight_kg", e.target.value)}
                                    className="mt-2 w-full h-12 px-4 rounded-xl bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"/>
                            </div>
                            <div>
                                <label className="text-xs uppercase tracking-widest text-muted-foreground">Language</label>
                                <select data-testid="onb-language" value={data.language} onChange={(e) => update("language", e.target.value)}
                                    className="mt-2 w-full h-12 px-3 rounded-xl bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary/50">
                                    <option value="en">English</option>
                                    <option value="hi">हिन्दी (Hindi)</option>
                                </select>
                            </div>
                        </div>
                        {data.sex === "female" && (
                            <div className="flex items-center gap-3">
                                <input id="preg" type="checkbox" checked={data.pregnant} onChange={(e) => update("pregnant", e.target.checked)} data-testid="onb-pregnant"/>
                                <label htmlFor="preg" className="text-sm">Currently pregnant</label>
                                {data.pregnant && (
                                    <select data-testid="onb-trimester" value={data.trimester || ""} onChange={(e) => update("trimester", parseInt(e.target.value))}
                                        className="h-9 px-2 rounded-lg bg-background border border-border text-sm">
                                        <option value="">Trimester</option>
                                        <option value="1">1st trimester</option>
                                        <option value="2">2nd trimester</option>
                                        <option value="3">3rd trimester</option>
                                    </select>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {step === 1 && (
                    <div className="space-y-5">
                        <h1 className="text-3xl md:text-4xl" style={{fontFamily:"Outfit"}}>Your health context.</h1>
                        <div>
                            <label className="text-xs uppercase tracking-widest text-muted-foreground">Chronic conditions</label>
                            <div className="flex gap-2 mt-2 flex-wrap">
                                {CHRONIC_OPTIONS.map((c) => (
                                    <button key={c} onClick={() => addChronic(c)} data-testid={`chronic-opt-${c}`}
                                        className={`px-3 py-1.5 rounded-full text-xs border ${data.chronic_conditions.includes(c) ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"}`}>
                                        {c}
                                    </button>
                                ))}
                            </div>
                            <div className="flex gap-2 mt-3">
                                <input data-testid="chronic-input" value={data.chronic_input} onChange={(e) => update("chronic_input", e.target.value)} placeholder="Add another…"
                                    className="flex-1 h-11 px-3 rounded-xl bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"/>
                                <button onClick={() => addChronic()} data-testid="chronic-add" className="h-11 px-4 rounded-xl border border-border text-sm">Add</button>
                            </div>
                            {data.chronic_conditions.length > 0 && (
                                <div className="flex gap-2 mt-3 flex-wrap">
                                    {data.chronic_conditions.map((c) => (
                                        <span key={c} className="px-3 py-1 rounded-full text-xs bg-primary/15 text-primary flex items-center gap-1.5">
                                            {c}<X size={12} className="cursor-pointer" onClick={() => update("chronic_conditions", data.chronic_conditions.filter(x => x !== c))}/>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div>
                            <label className="text-xs uppercase tracking-widest text-muted-foreground">Allergies</label>
                            <div className="flex gap-2 mt-2">
                                <input data-testid="allergy-input" value={data.allergy_input} onChange={(e) => update("allergy_input", e.target.value)} placeholder="e.g. Penicillin"
                                    className="flex-1 h-11 px-3 rounded-xl bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"/>
                                <button onClick={addAllergy} data-testid="allergy-add" className="h-11 px-4 rounded-xl border border-border text-sm">Add</button>
                            </div>
                            {data.allergies.length > 0 && (
                                <div className="flex gap-2 mt-3 flex-wrap">
                                    {data.allergies.map((a) => (
                                        <span key={a} className="px-3 py-1 rounded-full text-xs bg-secondary/20 text-secondary flex items-center gap-1.5">
                                            {a}<X size={12} className="cursor-pointer" onClick={() => update("allergies", data.allergies.filter(x => x !== a))}/>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-5">
                        <h1 className="text-3xl md:text-4xl" style={{fontFamily:"Outfit"}}>Caregiver & location.</h1>
                        <p className="text-sm text-muted-foreground">A caregiver gets visibility into adherence and emergencies. Optional but recommended for elderly or chronic patients.</p>
                        <div>
                            <label className="text-xs uppercase tracking-widest text-muted-foreground">Caregiver name</label>
                            <input data-testid="onb-cg-name" value={data.caregiver_name} onChange={(e) => update("caregiver_name", e.target.value)}
                                className="mt-2 w-full h-12 px-4 rounded-xl bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"/>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs uppercase tracking-widest text-muted-foreground">Email</label>
                                <input data-testid="onb-cg-email" value={data.caregiver_email} onChange={(e) => update("caregiver_email", e.target.value)}
                                    className="mt-2 w-full h-12 px-4 rounded-xl bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"/>
                            </div>
                            <div>
                                <label className="text-xs uppercase tracking-widest text-muted-foreground">Phone</label>
                                <input data-testid="onb-cg-phone" value={data.caregiver_phone} onChange={(e) => update("caregiver_phone", e.target.value)}
                                    className="mt-2 w-full h-12 px-4 rounded-xl bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"/>
                            </div>
                        </div>
                        <div>
                            <label className="text-xs uppercase tracking-widest text-muted-foreground">City / location (for emergency mode)</label>
                            <input data-testid="onb-location" value={data.location_query} onChange={(e) => update("location_query", e.target.value)} placeholder="e.g. Bengaluru, Karnataka"
                                className="mt-2 w-full h-12 px-4 rounded-xl bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"/>
                        </div>
                    </div>
                )}

                <div className="flex items-center justify-between mt-10">
                    <button data-testid="onb-back" onClick={() => setStep(Math.max(0, step - 1))} className="text-sm text-muted-foreground hover:text-foreground" disabled={step === 0}>
                        ← Back
                    </button>
                    {step < 2 ? (
                        <button data-testid="onb-next" onClick={() => setStep(step + 1)} disabled={!canNext()} className="h-12 px-7 rounded-full bg-primary text-primary-foreground font-medium disabled:opacity-50 flex items-center gap-2">
                            Continue <ArrowRight size={16}/>
                        </button>
                    ) : (
                        <button data-testid="onb-submit" onClick={submit} disabled={loading} className="h-12 px-7 rounded-full bg-primary text-primary-foreground font-medium disabled:opacity-50">
                            {loading ? "Saving…" : "Finish"}
                        </button>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
