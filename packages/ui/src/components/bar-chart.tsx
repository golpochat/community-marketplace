interface BarChartProps {
  data: Array<{ label: string; value: number }>;
  height?: number;
  className?: string;
}

export function BarChart({ data, height = 160, className }: BarChartProps) {
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className={className}>
      <div className="flex items-end gap-2" style={{ height }}>
        {data.map((item) => (
          <div key={item.label} className="flex flex-1 flex-col items-center gap-1">
            <div
              className="w-full rounded-t bg-primary/80 transition-all"
              style={{ height: `${(item.value / max) * 100}%`, minHeight: item.value > 0 ? 4 : 0 }}
              title={`${item.label}: ${item.value}`}
            />
            <span className="max-w-full truncate text-[10px] text-muted-foreground">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
