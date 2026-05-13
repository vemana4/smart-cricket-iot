import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { History as HistoryIcon, Clock, Target, Activity } from "lucide-react";
import { format } from "date-fns";

export default function History() {
  return (
    <Layout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <header>
          <h2 className="text-2xl font-bold font-mono uppercase tracking-tight flex items-center gap-2">
            <HistoryIcon className="w-5 h-5 text-primary" />
            Session Archives
          </h2>
          <p className="text-sm text-muted-foreground mt-1 font-mono uppercase">
            Historical telemetry records
          </p>
        </header>

        <Card className="rounded-none border-border bg-card shadow-none">
          <CardHeader className="border-b border-border">
            <CardTitle className="text-sm font-mono uppercase tracking-wider text-muted-foreground">
              Past Sessions
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              <div className="p-12 text-center text-muted-foreground font-mono uppercase text-sm flex flex-col items-center gap-3">
                <Clock className="w-8 h-8 opacity-50" />
                No historical sessions found.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
