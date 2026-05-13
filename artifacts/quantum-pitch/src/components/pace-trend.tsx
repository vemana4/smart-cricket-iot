import { Delivery } from "@workspace/api-client-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, TooltipProps } from "recharts";
import { format } from "date-fns";

export function PaceTrend({ deliveries }: { deliveries: Delivery[] }) {
  if (!deliveries.length) {
    return (
      <div className="h-[250px] flex items-center justify-center text-sm font-mono uppercase text-muted-foreground/50 border border-dashed border-border">
        Awaiting Data
      </div>
    );
  }

  // Reverse to show chronological order left to right
  const data = [...deliveries].reverse().map(d => ({
    ...d,
    timeLabel: format(new Date(d.timestamp), "HH:mm:ss")
  }));

  const minPace = Math.min(...data.map(d => d.pace_kmh));
  const maxPace = Math.max(...data.map(d => d.pace_kmh));

  const domainMin = Math.max(0, Math.floor(minPace - 5));
  const domainMax = Math.ceil(maxPace + 5);

  return (
    <div className="h-[250px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis 
            dataKey="timeLabel" 
            stroke="hsl(var(--muted-foreground))" 
            fontSize={10} 
            tickMargin={10}
            fontFamily="var(--font-mono)"
            minTickGap={30}
          />
          <YAxis 
            stroke="hsl(var(--muted-foreground))" 
            fontSize={10}
            tickFormatter={(val) => `${val}`}
            fontFamily="var(--font-mono)"
            domain={[domainMin, domainMax]}
            tickCount={5}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1, strokeDasharray: '4 4' }} />
          <Line 
            type="monotone" 
            dataKey="pace_kmh" 
            stroke="hsl(var(--primary))" 
            strokeWidth={2}
            dot={{ r: 2, fill: "hsl(var(--background))", stroke: "hsl(var(--primary))", strokeWidth: 2 }}
            activeDot={{ r: 4, fill: "hsl(var(--primary))", stroke: "hsl(var(--background))", strokeWidth: 2 }}
            animationDuration={300}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as Delivery;
    return (
      <div className="bg-popover border border-border p-3 rounded-none shadow-xl">
        <div className="text-[10px] uppercase font-mono tracking-widest text-muted-foreground mb-1">
          {label}
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-xl font-bold font-mono text-foreground">
            {data.pace_kmh.toFixed(1)}
          </span>
          <span className="text-xs text-muted-foreground">km/h</span>
        </div>
        {!data.is_legal && (
          <div className="mt-1 text-[10px] uppercase font-mono tracking-widest text-destructive">
            No Ball
          </div>
        )}
      </div>
    );
  }
  return null;
};
