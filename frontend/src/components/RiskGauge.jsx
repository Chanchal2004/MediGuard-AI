import { motion } from "framer-motion";

const sevColor = (score) => {
    if (score >= 75) return "#EF4444";
    if (score >= 50) return "#F97316";
    if (score >= 25) return "#FBBF24";
    return "#4ADE80";
};

export default function RiskGauge({ score = 0, size = 220, label = "Risk Score" }) {
    const r = (size - 24) / 2;
    const c = 2 * Math.PI * r * 0.75; // 270° arc
    const offset = c * (1 - Math.min(100, Math.max(0, score)) / 100);
    const color = sevColor(score);
    return (
        <div className="flex flex-col items-center justify-center" data-testid="risk-gauge">
            <div style={{ width: size, height: size }} className="relative">
                <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                    <defs>
                        <linearGradient id="riskGrad" x1="0" x2="1">
                            <stop offset="0%" stopColor="#4ADE80" />
                            <stop offset="50%" stopColor="#FBBF24" />
                            <stop offset="100%" stopColor="#EF4444" />
                        </linearGradient>
                    </defs>
                    <circle
                        cx={size/2} cy={size/2} r={r}
                        fill="none" stroke="hsl(var(--muted))" strokeWidth="14"
                        strokeDasharray={`${c} ${c*0.34}`}
                        transform={`rotate(135 ${size/2} ${size/2})`}
                        strokeLinecap="round"
                    />
                    <motion.circle
                        cx={size/2} cy={size/2} r={r}
                        fill="none" stroke="url(#riskGrad)" strokeWidth="14"
                        strokeDasharray={`${c} ${c*0.34}`}
                        strokeDashoffset={c}
                        animate={{ strokeDashoffset: offset }}
                        transition={{ duration: 1.2, ease: "easeOut" }}
                        transform={`rotate(135 ${size/2} ${size/2})`}
                        strokeLinecap="round"
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <p className="text-5xl font-semibold tabular-nums" style={{fontFamily:"Outfit", color}} data-testid="risk-score-value">
                        {Math.round(score)}
                    </p>
                    <p className="text-xs uppercase tracking-widest text-muted-foreground mt-1">{label}</p>
                </div>
            </div>
        </div>
    );
}
