import { Wicket } from "@workspace/api-client-react";
import { format } from "date-fns";
import { ShieldAlert, Info } from "lucide-react";

export function WicketAlerts({ wickets }: { wickets: Wicket[] }) {
  if (!wickets.length) {
    return (
      <div className="p-8 text-center text-sm font-mono uppercase text-muted-foreground/50 border border-dashed border-border m-4">
        No Wicket Events
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {wickets.map((wicket) => (
        <div key={wicket.id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
          <div className="flex items-center gap-3">
            <div className={`p-2 border ${
              wicket.status === "out" 
                ? "border-primary/50 text-primary bg-primary/10" 
                : "border-muted-foreground/50 text-muted-foreground bg-muted"
            }`}>
              {wicket.status === "out" ? <ShieldAlert className="w-5 h-5" /> : <Info className="w-5 h-5" />}
            </div>
            <div>
              <div className="font-mono text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                Event: {wicket.status.replace("_", " ")}
                {wicket.status === "out" && (
                  <span className="w-1.5 h-1.5 bg-primary animate-pulse rounded-full" />
                )}
              </div>
              <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mt-0.5">
                {format(new Date(wicket.timestamp), "HH:mm:ss.SSS")}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">
              Impact Force
            </div>
            <div className="font-mono text-lg font-bold text-foreground">
              {wicket.impact_force.toFixed(1)} <span className="text-xs text-muted-foreground">N</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
