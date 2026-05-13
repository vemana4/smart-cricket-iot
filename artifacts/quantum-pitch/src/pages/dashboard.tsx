import { useGetDashboard, useStartSession, useCloseSession, getGetDashboardQueryKey } from "@workspace/api-client-react";
import { usePusher } from "@/hooks/use-pusher";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Target, Zap, ShieldAlert, Crosshair, Play, Square } from "lucide-react";
import { DeliveryFeed } from "@/components/delivery-feed";
import { PaceTrend } from "@/components/pace-trend";
import { WicketAlerts } from "@/components/wicket-alerts";
import { useQueryClient } from "@tanstack/react-query";

export default function Dashboard() {
  const { data: dashboard, isLoading } = useGetDashboard();
  const session = dashboard?.session;
  
  usePusher(session?.id);

  const queryClient = useQueryClient();
  const startSession = useStartSession();
  const closeSession = useCloseSession();

  const handleStart = () => {
    startSession.mutate(
      { data: {} },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
        }
      }
    );
  };

  const handleClose = () => {
    if (!session?.id) return;
    closeSession.mutate(
      { sessionId: session.id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
        }
      }
    );
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="p-6 h-[calc(100vh-65px)] flex items-center justify-center">
          <div className="flex flex-col items-center gap-4 text-muted-foreground animate-pulse">
            <Activity className="w-12 h-12" />
            <div className="uppercase tracking-widest text-sm font-mono">Initializing Telemetry...</div>
          </div>
        </div>
      </Layout>
    );
  }

  const isSessionActive = session?.status === "active";

  return (
    <Layout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold font-mono uppercase tracking-tight flex items-center gap-2">
              <span className="w-2 h-2 bg-primary rounded-none shadow-[0_0_10px_var(--primary)]" />
              Live Telemetry
            </h2>
            {isSessionActive && (
              <p className="text-sm text-muted-foreground mt-1 font-mono uppercase">
                Session ID: <span className="text-foreground">{session.id}</span>
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            {!isSessionActive ? (
              <Button 
                onClick={handleStart} 
                disabled={startSession.isPending}
                className="rounded-none uppercase tracking-wider font-mono font-bold bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Play className="w-4 h-4 mr-2" />
                Initialize Session
              </Button>
            ) : (
              <Button 
                variant="destructive"
                onClick={handleClose}
                disabled={closeSession.isPending}
                className="rounded-none uppercase tracking-wider font-mono font-bold"
              >
                <Square className="w-4 h-4 mr-2" />
                Terminate Session
              </Button>
            )}
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Deliveries"
            value={dashboard?.total_deliveries || 0}
            icon={<Target className="w-4 h-4 text-primary" />}
          />
          <StatCard
            title="Avg Pace"
            value={`${dashboard?.avg_pace_kmh?.toFixed(1) || "0.0"} km/h`}
            icon={<Activity className="w-4 h-4 text-primary" />}
          />
          <StatCard
            title="Max Pace"
            value={`${dashboard?.max_pace_kmh?.toFixed(1) || "0.0"} km/h`}
            icon={<Zap className="w-4 h-4 text-primary" />}
          />
          <StatCard
            title="Legal %"
            value={
              dashboard?.total_deliveries
                ? `${Math.round((dashboard.legal_deliveries / dashboard.total_deliveries) * 100)}%`
                : "0%"
            }
            icon={<Crosshair className="w-4 h-4 text-primary" />}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="rounded-none border-border bg-card shadow-none">
              <CardHeader className="border-b border-border pb-4">
                <CardTitle className="text-sm font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Velocity Trend (Last 50)
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <PaceTrend deliveries={dashboard?.recent_deliveries || []} />
              </CardContent>
            </Card>

            <Card className="rounded-none border-border bg-card shadow-none">
              <CardHeader className="border-b border-border pb-4">
                <CardTitle className="text-sm font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4" />
                  Wicket Events
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <WicketAlerts wickets={dashboard?.recent_wickets || []} />
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="rounded-none border-border bg-card shadow-none h-full flex flex-col">
              <CardHeader className="border-b border-border pb-4">
                <CardTitle className="text-sm font-mono uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Crosshair className="w-4 h-4" />
                    Delivery Feed
                  </span>
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_var(--primary)]" />
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 p-0 overflow-hidden relative min-h-[400px]">
                <DeliveryFeed deliveries={dashboard?.recent_deliveries || []} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function StatCard({ title, value, icon }: { title: string; value: string | number; icon: React.ReactNode }) {
  return (
    <Card className="rounded-none border-border bg-card shadow-none relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
        {icon}
      </div>
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold font-mono tracking-tight text-foreground">
          {value}
        </div>
      </CardContent>
      <div className="absolute bottom-0 left-0 h-[2px] bg-primary w-0 group-hover:w-full transition-all duration-500 ease-out" />
    </Card>
  );
}
