import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import {
    Heart, ScanLine, ShieldCheck, Activity, Brain, Stethoscope, Users, MapPin,
    Mic, ArrowRight, Sparkles, ChevronRight, Pill, AlertOctagon, FileText, Eye
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

const HERO_IMG = "https://images.pexels.com/photos/7789620/pexels-photo-7789620.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=850&w=1240";
const TEXTURE_IMG = "https://images.pexels.com/photos/29543899/pexels-photo-29543899.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940";

const features = [
    { icon: ScanLine, title: "Prescription OCR", desc: "Gemini 3 Pro vision reads handwritten and printed prescriptions. Extracts every medicine, dose and instruction into structured data." },
    { icon: ShieldCheck, title: "Safety analysis", desc: "Detects drug interactions, duplicates, allergy conflicts, pregnancy and elderly risks before they harm." },
    { icon: Brain, title: "ML risk models", desc: "Real XGBoost + Random Forest. Adherence, emergency severity and visit urgency predicted per request." },
    { icon: Activity, title: "Adherence engine", desc: "Auto-generated schedules. Live adherence score with predictive miss-dose alerts." },
    { icon: Mic, title: "Voice in Hindi & English", desc: "Whisper STT and OpenAI TTS. Read prescriptions aloud, ask questions hands-free." },
    { icon: MapPin, title: "Emergency mode", desc: "Real OpenStreetMap-powered nearby hospitals, clinics and pharmacies with directions." },
    { icon: Eye, title: "Pill confusion check", desc: "Snap a pill to verify identity and warn about visual look-alikes among active medicines." },
    { icon: Users, title: "Caregiver shareable link", desc: "Read-only live snapshot link family members can open without an account." },
    { icon: FileText, title: "Doctor-ready PDF report", desc: "One click to export prescription, risks, and adherence as a polished PDF for clinic visits." },
];

const marquee = [
    "Gemini 3 Pro · OCR", "XGBoost · severity",
    "Random Forest · adherence", "Whisper · multilingual",
    "OpenStreetMap · emergency", "Caregiver mode",
    "Pregnancy-aware", "Elderly fall risk",
    "PDF reports", "Hindi · English",
];

export default function LandingPage() {
    const navigate = useNavigate();
    const { theme, toggle } = useTheme();
    const { scrollYProgress } = useScroll();
    const heroY = useTransform(scrollYProgress, [0, 0.3], [0, -80]);
    const [mouse, setMouse] = useState({ x: 0.5, y: 0.5 });

    useEffect(() => {
        const onMove = (e) => setMouse({ x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight });
        window.addEventListener("mousemove", onMove);
        return () => window.removeEventListener("mousemove", onMove);
    }, []);

    return (
        <div className="grain min-h-screen bg-background text-foreground overflow-x-hidden">
            {/* Sticky nav */}
            <header className="sticky top-0 z-50 glass">
                <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-3.5">
                    <div className="flex items-center gap-2.5">
                        <div className="h-9 w-9 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center">
                            <Heart size={17}/>
                        </div>
                        <p className="text-base font-semibold tracking-tight" style={{fontFamily:"Outfit"}}>MediGuard AI</p>
                        <span className="hidden md:inline ml-1 text-[10px] uppercase tracking-widest text-muted-foreground border border-border rounded-full px-2 py-0.5">v1</span>
                    </div>
                    <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
                        <a href="#features" className="hover:text-foreground" data-testid="nav-features">Features</a>
                        <a href="#how" className="hover:text-foreground" data-testid="nav-how">How it works</a>
                        <a href="#ml" className="hover:text-foreground" data-testid="nav-ml">ML Engine</a>
                        <a href="#trust" className="hover:text-foreground" data-testid="nav-trust">Trust</a>
                    </nav>
                    <div className="flex items-center gap-2">
                        <button onClick={toggle} data-testid="theme-toggle-landing" aria-label="Toggle theme" className="h-9 w-9 rounded-full border border-border flex items-center justify-center text-sm hover:bg-muted">{theme === "dark" ? "☀" : "☾"}</button>
                        <button
                            onClick={() => navigate("/login")}
                            data-testid="landing-signin-btn"
                            className="h-10 px-5 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:opacity-90"
                        >
                            Sign in
                        </button>
                    </div>
                </div>
            </header>

            {/* Hero */}
            <section className="relative overflow-hidden">
                {/* Ambient mesh orbs that follow cursor */}
                <motion.div
                    aria-hidden
                    style={{
                        x: (mouse.x - 0.5) * 80,
                        y: (mouse.y - 0.5) * 80,
                    }}
                    className="absolute -top-40 -left-40 w-[520px] h-[520px] rounded-full opacity-50 blur-3xl"
                >
                    <div className="w-full h-full rounded-full" style={{background: "radial-gradient(circle at 30% 30%, hsl(var(--primary)/0.5), transparent 60%)"}}/>
                </motion.div>
                <motion.div
                    aria-hidden
                    style={{
                        x: (0.5 - mouse.x) * 60,
                        y: (0.5 - mouse.y) * 60,
                    }}
                    className="absolute top-32 -right-32 w-[440px] h-[440px] rounded-full opacity-50 blur-3xl"
                >
                    <div className="w-full h-full rounded-full" style={{background: "radial-gradient(circle at 60% 50%, hsl(var(--secondary)/0.45), transparent 60%)"}}/>
                </motion.div>
                <div className="absolute inset-0 -z-10">
                    <img src={HERO_IMG} alt="" className="w-full h-full object-cover opacity-[0.18]"/>
                    <div className="absolute inset-0 bg-gradient-to-br from-background/95 via-background/70 to-background/95"/>
                </div>

                <div className="max-w-7xl mx-auto px-6 pt-24 md:pt-32 pb-24 lg:pb-28 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                    <motion.div className="lg:col-span-7" style={{ y: heroY }}>
                        <motion.div
                            initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
                            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass text-[11px] uppercase tracking-widest text-muted-foreground"
                        >
                            <Sparkles size={12}/> Gemini 3 Pro · XGBoost · Whisper
                        </motion.div>
                        <motion.h1
                            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }}
                            className="hero-headline mt-7 text-5xl sm:text-6xl lg:text-[5.5rem]"
                        >
                            Patient safety,<br/>
                            <span className="italic text-secondary" style={{fontFamily:"Outfit"}}>worth a second pair of eyes.</span>
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}
                            className="mt-7 text-base md:text-lg text-muted-foreground max-w-xl leading-relaxed"
                        >
                            MediGuard AI reads handwritten prescriptions, explains every medicine,
                            detects deadly drug interactions, predicts missed doses, and finds the
                            closest hospital — before something goes wrong.
                        </motion.p>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                            className="mt-10 flex flex-col sm:flex-row gap-3"
                        >
                            <button
                                onClick={() => navigate("/login")}
                                data-testid="hero-cta-btn"
                                className="group h-14 px-7 rounded-full bg-primary text-primary-foreground font-medium flex items-center justify-center gap-2 hover:opacity-95 hover:-translate-y-0.5 transition"
                            >
                                Get started free
                                <ArrowRight size={18} className="group-hover:translate-x-1 transition" />
                            </button>
                            <a href="#how" data-testid="hero-features-btn" className="h-14 px-7 rounded-full border border-border flex items-center justify-center text-sm font-medium hover:bg-muted">
                                See how it works <ChevronRight size={16} className="ml-1"/>
                            </a>
                        </motion.div>
                        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-y-3 gap-x-6 text-xs text-muted-foreground">
                            <Trust icon={ShieldCheck} label="HIPAA-aware design"/>
                            <Trust icon={Stethoscope} label="Built with clinicians"/>
                            <Trust icon={Brain} label="Real ML, no rules"/>
                            <Trust icon={MapPin} label="Open-source maps"/>
                        </div>
                    </motion.div>

                    {/* Hero visual — orbit of feature pills (no hardcoded numbers) */}
                    <div className="lg:col-span-5 relative h-[440px] hidden lg:block">
                        <HeroOrbit/>
                    </div>
                </div>

                {/* Marquee */}
                <div className="relative overflow-hidden border-y border-border/60 py-4 bg-muted/30">
                    <div className="flex gap-12 animate-[mg-marquee_28s_linear_infinite] whitespace-nowrap text-xs uppercase tracking-widest text-muted-foreground">
                        {[...marquee, ...marquee].map((m, i) => (
                            <span key={i} className="flex items-center gap-3">
                                <span className="h-1.5 w-1.5 rounded-full bg-primary/40"/> {m}
                            </span>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features bento */}
            <section id="features" className="py-24 md:py-32">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-end mb-14">
                        <div className="md:col-span-7">
                            <p className="text-xs uppercase tracking-widest text-secondary">Capabilities</p>
                            <h2 className="text-4xl md:text-5xl mt-3" style={{fontFamily:"Outfit"}}>
                                Real intelligence. <span className="text-muted-foreground italic">Real outcomes.</span>
                            </h2>
                        </div>
                        <p className="md:col-span-5 text-sm text-muted-foreground leading-relaxed">
                            Every output you see — risk score, severity, alerts, hospitals, transcriptions, summaries —
                            is computed live from your prescription, your profile and real models. Nothing is pre-rendered.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-5">
                        {features.map((f, i) => (
                            <motion.div
                                key={f.title}
                                initial={{ opacity: 0, y: 18 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.05 }}
                                whileHover={{ y: -3 }}
                                className={`glass-card p-6 md:p-7 ${i === 0 ? "md:col-span-6 lg:col-span-6" : i === 1 ? "md:col-span-6 lg:col-span-6" : "md:col-span-3 lg:col-span-4"}`}
                            >
                                <div className="h-11 w-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                                    <f.icon size={20}/>
                                </div>
                                <h3 className="mt-5 text-lg font-semibold tracking-tight" style={{fontFamily:"Outfit"}}>{f.title}</h3>
                                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How it works */}
            <section id="how" className="py-24 md:py-32 relative bg-muted/30">
                <div className="absolute right-0 top-10 w-1/3 -z-10 opacity-20 hidden lg:block">
                    <img src={TEXTURE_IMG} alt="" className="w-full"/>
                </div>
                <div className="max-w-7xl mx-auto px-6">
                    <p className="text-xs uppercase tracking-widest text-secondary">Patient journey</p>
                    <h2 className="text-4xl md:text-5xl mt-3 max-w-3xl" style={{fontFamily:"Outfit"}}>From paper to protection in seconds.</h2>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mt-14">
                        {[
                            { step: "01", title: "Upload prescription", desc: "Photo, PDF or upload — handwritten prescriptions work too." , icon: ScanLine},
                            { step: "02", title: "AI reads & explains", desc: "Every medicine extracted and explained in plain language.", icon: Brain },
                            { step: "03", title: "Safety + ML risk", desc: "Interactions, duplicates, allergies, pregnancy and elderly risks scored.", icon: ShieldCheck },
                            { step: "04", title: "Live monitoring", desc: "Schedules, adherence, caregiver alerts and emergency mode.", icon: Activity },
                        ].map((s, i) => (
                            <motion.div key={s.step} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                                className="glass-card p-6 h-full">
                                <div className="flex items-center justify-between">
                                    <p className="text-xs uppercase tracking-widest text-secondary">{s.step}</p>
                                    <s.icon size={16} className="text-primary"/>
                                </div>
                                <h3 className="mt-4 text-lg font-semibold" style={{fontFamily:"Outfit"}}>{s.title}</h3>
                                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ML section */}
            <section id="ml" className="py-24 md:py-32">
                <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
                    <div className="lg:col-span-6">
                        <p className="text-xs uppercase tracking-widest text-secondary">ML engine</p>
                        <h2 className="text-4xl md:text-5xl mt-3" style={{fontFamily:"Outfit"}}>Not rules.<br/><span className="italic text-muted-foreground">Real models. Trained at startup.</span></h2>
                        <p className="mt-6 text-muted-foreground leading-relaxed max-w-md">
                            Three production models ship in the box — adherence (Random Forest, 120 trees),
                            emergency severity (XGBoost, 4-class), doctor visit urgency (XGBoost, 4-class).
                            No hardcoded thresholds. Each prediction is computed per-request from your data.
                        </p>
                        <div className="mt-8 flex flex-wrap gap-2 text-xs">
                            <Pill2>RandomForest · 120 trees</Pill2>
                            <Pill2>XGBoost · 200 estimators</Pill2>
                            <Pill2>4-class severity</Pill2>
                            <Pill2>Per-request inference</Pill2>
                        </div>
                    </div>
                    <div className="lg:col-span-6">
                        <MLDemo/>
                    </div>
                </div>
            </section>

            {/* Trust */}
            <section id="trust" className="py-24 md:py-32 bg-muted/30">
                <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
                    <div>
                        <p className="text-xs uppercase tracking-widest text-secondary">Trust & safety</p>
                        <h2 className="text-4xl md:text-5xl mt-3" style={{fontFamily:"Outfit"}}>Designed for clinicians. Built for families.</h2>
                    </div>
                    <div className="space-y-4">
                        <TrustItem icon={ShieldCheck} title="Your data, your control" desc="Session-based auth. Revoke caregiver links anytime. No background data sharing."/>
                        <TrustItem icon={Stethoscope} title="Clinical context aware" desc="Age-based caregiver logic, pregnancy trimester checks, elderly-fall risk weighting."/>
                        <TrustItem icon={AlertOctagon} title="Emergency-first thinking" desc="Triage runs an ML severity model before showing facilities. Never just a search engine."/>
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="py-24 md:py-32">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <h2 className="text-4xl md:text-6xl" style={{fontFamily:"Outfit"}}>Healthcare deserves<br/><span className="italic">an attentive co-pilot.</span></h2>
                    <p className="mt-6 text-muted-foreground max-w-xl mx-auto">For patients, designed for caregivers, trusted by clinicians.</p>
                    <button onClick={() => navigate("/login")} data-testid="bottom-cta-btn"
                        className="mt-10 h-14 px-8 rounded-full bg-primary text-primary-foreground font-medium inline-flex items-center gap-2 hover:-translate-y-0.5 transition">
                        Continue with Google <ArrowRight size={18}/>
                    </button>
                </div>
            </section>

            <footer className="border-t border-border py-10 text-center text-xs text-muted-foreground space-y-2">
                <p>© 2026 MediGuard AI. Not a substitute for professional medical advice.</p>
                <p className="opacity-70">Gemini 3 Pro · XGBoost · OpenStreetMap · Whisper</p>
            </footer>

            <style>{`
                @keyframes mg-marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
                @keyframes mg-spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                @keyframes mg-spin-slower { from { transform: rotate(0deg); } to { transform: rotate(-360deg); } }
                .orbit-spin { animation: mg-spin-slow 40s linear infinite; }
                .orbit-spin-rev { animation: mg-spin-slower 50s linear infinite; }
            `}</style>
        </div>
    );
}

function Trust({ icon: Icon, label }) {
    return (
        <div className="flex items-center gap-2">
            <Icon size={14} className="text-primary"/>
            <span>{label}</span>
        </div>
    );
}

function Pill2({ children }) {
    return <span className="px-3 py-1.5 rounded-full border border-border bg-card/60 backdrop-blur-sm">{children}</span>;
}

function TrustItem({ icon: Icon, title, desc }) {
    return (
        <div className="glass-card p-5 flex gap-4">
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0"><Icon size={18}/></div>
            <div>
                <p className="font-semibold" style={{fontFamily:"Outfit"}}>{title}</p>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{desc}</p>
            </div>
        </div>
    );
}

function HeroOrbit() {
    const items = [
        { icon: Pill, label: "Medicines" },
        { icon: Brain, label: "ML" },
        { icon: ShieldCheck, label: "Safety" },
        { icon: AlertOctagon, label: "Emergency" },
        { icon: Mic, label: "Voice" },
        { icon: Users, label: "Caregiver" },
    ];
    return (
        <div className="absolute inset-0 flex items-center justify-center">
            {/* Concentric rings */}
            <div className="absolute w-[360px] h-[360px] rounded-full border border-border/60 orbit-spin"/>
            <div className="absolute w-[240px] h-[240px] rounded-full border border-border/60 orbit-spin-rev"/>
            <div className="absolute w-[120px] h-[120px] rounded-full border border-border/60 orbit-spin"/>

            {/* Center medallion */}
            <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.4, type: "spring" }}
                className="relative h-28 w-28 rounded-full glass-card flex flex-col items-center justify-center"
            >
                <Heart size={26} className="text-primary"/>
                <p className="text-[10px] uppercase tracking-widest mt-1 text-muted-foreground">MediGuard</p>
            </motion.div>

            {/* Orbit items */}
            {items.map((it, i) => {
                const angle = (i / items.length) * Math.PI * 2;
                const radius = 170;
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;
                return (
                    <motion.div
                        key={it.label}
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5 + i * 0.07, type: "spring" }}
                        style={{ x, y }}
                        className="absolute h-14 w-14 rounded-2xl glass-card flex items-center justify-center"
                    >
                        <it.icon size={18} className="text-primary"/>
                    </motion.div>
                );
            })}
        </div>
    );
}

function MLDemo() {
    // Animated abstract bars representing the three models (no real values shown)
    return (
        <div className="glass-card p-7">
            <div className="flex items-center justify-between mb-5">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">Inference pipeline</p>
                <span className="text-[10px] uppercase tracking-widest text-emergency-green flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emergency-green pulse-soft"/> live
                </span>
            </div>
            <div className="space-y-5">
                {[
                    { label: "Adherence · Random Forest" },
                    { label: "Severity · XGBoost" },
                    { label: "Urgency · XGBoost" },
                ].map((m, i) => (
                    <div key={m.label}>
                        <div className="flex items-center justify-between mb-2 text-xs text-muted-foreground">
                            <span>{m.label}</span>
                            <span>inference</span>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden relative">
                            <motion.div
                                initial={{ x: "-100%" }}
                                animate={{ x: "100%" }}
                                transition={{ duration: 2.4 + i * 0.4, repeat: Infinity, ease: "easeInOut", delay: i * 0.3 }}
                                className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-transparent via-primary to-transparent"
                            />
                        </div>
                    </div>
                ))}
            </div>
            <div className="mt-6 grid grid-cols-3 gap-3 text-center">
                <SoftBlock label="Per request"/>
                <SoftBlock label="Patient context"/>
                <SoftBlock label="No defaults"/>
            </div>
        </div>
    );
}

function SoftBlock({ label }) {
    return (
        <div className="p-3 rounded-xl bg-muted/60">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
        </div>
    );
}
