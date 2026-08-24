import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";

function useCounter(target, duration = 900) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let frame = 0;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      setValue(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);
  return value;
}

const toneVar = {
  primary: "var(--primary)",
  info: "var(--info)",
  amber: "var(--amber)",
  success: "var(--success)",
  destructive: "var(--destructive)",
};

export function StatCard({
  label,
  value,
  prefix = "",
  suffix = "",
  change,
  icon: Icon,
  trend,
  tone = "primary",
  index = 0,
}) {
  const animated = useCounter(value);
  const color = toneVar[tone];
  const positive = change >= 0;

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.07, ease: [0.22, 1, 0.36, 1] }}
      className="surface-card lift-on-hover group relative overflow-hidden p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className="grid size-12 place-items-center rounded-2xl border"
          style={{
            background: `color-mix(in oklab, ${color} 16%, transparent)`,
            borderColor: `color-mix(in oklab, ${color} 35%, transparent)`,
          }}
        >
          <Icon className="size-6" style={{ color }} />
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold",
            positive ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive",
          )}
        >
          {positive ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
          {Math.abs(change)}%
        </span>
      </div>

      <p className="mt-5 text-3xl font-bold tracking-tight text-foreground tabular-nums">
        {prefix}
        {animated.toLocaleString("en-IN")}
        {suffix}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">{label}</p>

      <div className="mt-4 h-12 w-full opacity-80 transition-opacity group-hover:opacity-100">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={trend} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id={`spark-${label.replace(/\s/g, "")}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.45} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="v"
              stroke={color}
              strokeWidth={2}
              fill={`url(#spark-${label.replace(/\s/g, "")})`}
              isAnimationActive
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.article>
  );
}
