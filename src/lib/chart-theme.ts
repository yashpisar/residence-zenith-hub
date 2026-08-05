export const chartTheme = {
  grid: "oklch(0.6 0.02 257 / 0.18)",
  axis: "oklch(0.71 0.03 257)",
};

export const tooltipStyle = {
  contentStyle: {
    background: "var(--popover)",
    border: "1px solid var(--border)",
    borderRadius: "14px",
    boxShadow: "var(--shadow-lift)",
    fontSize: "12px",
    color: "var(--popover-foreground)",
  },
  labelStyle: { color: "var(--foreground)", fontWeight: 600 },
  itemStyle: { color: "var(--muted-foreground)" },
} as const;
