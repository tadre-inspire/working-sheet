export function Sparkline({
  data,
  up,
  className = "h-8 w-24",
}: {
  data: number[];
  up: boolean;
  className?: string;
}) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * 96 + 2;
      const y = 28 - ((v - min) / span) * 24;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg viewBox="0 0 100 32" className={className} aria-hidden="true">
      <polyline
        points={pts}
        fill="none"
        stroke={up ? "var(--ink)" : "var(--muted)"}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={pts.split(" ").at(-1)!.split(",")[0]}
        cy={pts.split(" ").at(-1)!.split(",")[1]}
        r="3.2"
        fill="var(--lemon)"
        stroke="var(--ink)"
        strokeWidth="1.5"
      />
    </svg>
  );
}
