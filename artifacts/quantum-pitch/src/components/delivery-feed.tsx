import { Delivery } from "@workspace/api-client-react";
import { format } from "date-fns";
import { CheckCircle2, XCircle } from "lucide-react";

export function DeliveryFeed({ deliveries }: { deliveries: Delivery[] }) {
  if (!deliveries.length) {
    return (
      <div className="absolute inset-0 flex items-center justify-center text-sm font-mono uppercase text-muted-foreground/50">
        No telemetry data
      </div>
    );
  }

  return (
    <div className="absolute inset-0 overflow-y-auto custom-scrollbar">
      <div className="divide-y divide-border">
        {deliveries.map((delivery, index) => (
          <div 
            key={delivery.id} 
            className={`p-4 flex items-center justify-between transition-colors ${
              index === 0 ? "bg-primary/5 border-l-2 border-l-primary" : "hover:bg-muted/50 border-l-2 border-l-transparent"
            }`}
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold font-mono tracking-tight text-foreground">
                  {delivery.pace_kmh.toFixed(1)} <span className="text-xs text-muted-foreground font-sans tracking-normal">km/h</span>
                </span>
                {delivery.is_legal ? (
                  <span className="px-1.5 py-0.5 text-[10px] uppercase font-mono tracking-widest bg-primary/20 text-primary border border-primary/30">
                    Legal
                  </span>
                ) : (
                  <span className="px-1.5 py-0.5 text-[10px] uppercase font-mono tracking-widest bg-destructive/20 text-destructive border border-destructive/30">
                    No Ball
                  </span>
                )}
              </div>
              <div className="text-[10px] font-mono text-muted-foreground tracking-widest uppercase">
                {format(new Date(delivery.timestamp), "HH:mm:ss.SSS")}
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-1">
                Status
              </div>
              {delivery.is_legal ? (
                <CheckCircle2 className="w-5 h-5 text-primary ml-auto" />
              ) : (
                <XCircle className="w-5 h-5 text-destructive ml-auto" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
