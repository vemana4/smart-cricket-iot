import { useState, useEffect, useRef } from "react";
import Pusher from "pusher-js";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Wifi, WifiOff, Copy, Check, Radio, Cpu, ChevronRight, Activity, Send, Loader2
} from "lucide-react";

const PUSHER_KEY = "7551dc90d2d1a24b4eee";
const PUSHER_CLUSTER = "ap2";
const LIVE_CHANNEL = "live-session-0338";
const THRESHOLD_MS2 = 29.4;

interface CalibrateResult {
  timestamp: string;
  sensor_found: boolean;
  sample_count: number;
  total_sample_count: number;
  peak_accel_ms2: number;
  peak_accel_g: number;
  peak_idx: number;
  passes_threshold: boolean;
  threshold_ms2: number;
  pace_kmh_if_valid: number | null;
  accel_trace: number[];
}

interface ServerInfo {
  public_url: string | null;
  telemetry_url: string | null;
  calibrate_url: string | null;
  stump_url: string | null;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        });
      }}
      data-testid="button-copy-url"
      className="ml-2 p-1.5 text-muted-foreground hover:text-primary transition-colors shrink-0"
      title="Copy to clipboard"
    >
      {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
    </button>
  );
}

function UrlRow({ label, url, highlight }: { label: string; url: string | null; highlight?: boolean }) {
  return (
    <div>
      <p className="text-[10px] font-mono uppercase text-muted-foreground mb-1">{label}</p>
      <div className={`flex items-center border px-3 py-2 ${highlight ? "bg-muted border-primary/50" : "bg-muted border-border"}`}>
        {url ? (
          <>
            <span
              className={`text-xs font-mono flex-1 break-all ${highlight ? "text-primary" : "text-foreground/60"}`}
              data-testid={`text-url-${label.toLowerCase().replace(/\s+/g, "-")}`}
            >
              {url}
            </span>
            <CopyButton text={url} />
          </>
        ) : (
          <span className="text-xs font-mono text-muted-foreground animate-pulse">Fetching URL...</span>
        )}
      </div>
    </div>
  );
}

function AccelBar({ value, max = 60 }: { value: number; max?: number }) {
  const pct = Math.min(100, (value / max) * 100);
  const isHot = value >= THRESHOLD_MS2;
  return (
    <div className="w-full h-1.5 bg-muted overflow-hidden">
      <div
        className={`h-full transition-all duration-150 ${isHot ? "bg-primary" : "bg-muted-foreground/40"}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function MiniTrace({ trace }: { trace: number[] }) {
  if (trace.length < 2) return null;
  const max = Math.max(...trace, THRESHOLD_MS2 * 1.1);
  const W = 200, H = 48;
  const pts = trace.map((v, i) => `${(i / (trace.length - 1)) * W},${H - (v / max) * H}`);
  const threshY = H - (THRESHOLD_MS2 / max) * H;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-12" preserveAspectRatio="none">
      <line x1="0" y1={threshY} x2={W} y2={threshY} stroke="hsl(var(--primary))" strokeWidth="1" strokeDasharray="4 3" opacity="0.4" />
      <polyline points={pts.join(" ")} fill="none" stroke="hsl(var(--primary))" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

function ResultCard({ result, index }: { result: CalibrateResult; index: number }) {
  const pass = result.passes_threshold;
  return (
    <div
      data-testid={`card-calibrate-result-${index}`}
      className={`border-l-2 pl-4 py-3 pr-4 bg-card space-y-2 ${pass ? "border-primary" : "border-destructive"}`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className={`text-xs font-mono font-bold uppercase tracking-widest ${pass ? "text-primary" : "text-destructive"}`}>
            {pass ? "PASS" : "FAIL"}
          </span>
          <span className="text-xs text-muted-foreground font-mono">
            {new Date(result.timestamp).toLocaleTimeString()}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {result.sensor_found ? (
            <Badge variant="outline" className="text-[10px] font-mono rounded-none border-primary/40 text-primary">SENSOR OK</Badge>
          ) : (
            <Badge variant="destructive" className="text-[10px] font-mono rounded-none">NO SENSOR</Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <div className="text-2xl font-bold font-mono tracking-tight" data-testid={`text-peak-g-${index}`}>
            {result.peak_accel_g}<span className="text-xs text-muted-foreground ml-0.5">G</span>
          </div>
          <div className="text-[10px] text-muted-foreground font-mono uppercase">Peak</div>
        </div>
        <div>
          <div className="text-2xl font-bold font-mono tracking-tight text-muted-foreground">
            {result.sample_count}
          </div>
          <div className="text-[10px] text-muted-foreground font-mono uppercase">Samples</div>
        </div>
        <div>
          <div className={`text-2xl font-bold font-mono tracking-tight ${pass ? "text-primary" : "text-muted-foreground"}`}>
            {pass ? `${result.pace_kmh_if_valid}` : "—"}
            {pass && <span className="text-xs text-muted-foreground ml-0.5">km/h</span>}
          </div>
          <div className="text-[10px] text-muted-foreground font-mono uppercase">Est. Pace</div>
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
          <span>0</span>
          <span className="text-primary/60">3G ({THRESHOLD_MS2} m/s²)</span>
          <span>60 m/s²</span>
        </div>
        <AccelBar value={result.peak_accel_ms2} max={60} />
      </div>

      {result.accel_trace.length > 1 && <MiniTrace trace={result.accel_trace} />}
    </div>
  );
}

// Fake sensor payload simulating a 120 km/h bowl (peak ~33 m/s²)
function makeFakePayload() {
  const samples = [];
  const count = 50;
  for (let i = 0; i < count; i++) {
    const t = i * 0.01;
    // Gaussian-shaped acceleration peak at sample 30
    const envelope = 33 * Math.exp(-0.5 * Math.pow((i - 30) / 5, 2));
    const noise = () => (Math.random() - 0.5) * 0.4;
    samples.push({
      sensor: "WatchTotalAcceleration",
      x: String((envelope * 0.6 + noise()).toFixed(4)),
      y: String((envelope * 0.3 + noise()).toFixed(4)),
      z: String((9.81 + envelope * 0.1 + noise()).toFixed(4)),
      seconds_elapsed: String(t.toFixed(4)),
    });
  }
  return { payload: samples };
}

export default function Calibrate() {
  const [pusherConnected, setPusherConnected] = useState(false);
  const [results, setResults] = useState<CalibrateResult[]>([]);
  const [info, setInfo] = useState<ServerInfo | null>(null);
  const [sending, setSending] = useState(false);
  const pusherRef = useRef<Pusher | null>(null);

  // Fetch the public server URLs
  useEffect(() => {
    fetch("/api/info")
      .then((r) => r.json())
      .then((d: ServerInfo) => setInfo(d))
      .catch(() => {});
  }, []);

  // Pusher real-time listener
  useEffect(() => {
    const pusher = new Pusher(PUSHER_KEY, { cluster: PUSHER_CLUSTER });
    pusherRef.current = pusher;
    const channel = pusher.subscribe(LIVE_CHANNEL);
    pusher.connection.bind("connected", () => setPusherConnected(true));
    pusher.connection.bind("disconnected", () => setPusherConnected(false));
    pusher.connection.bind("error", () => setPusherConnected(false));
    channel.bind("calibrate-result", (data: CalibrateResult) => {
      setResults((prev) => [data, ...prev].slice(0, 20));
    });
    return () => {
      channel.unbind_all();
      pusher.unsubscribe(LIVE_CHANNEL);
      pusher.disconnect();
    };
  }, []);

  const sendTestThrow = async () => {
    setSending(true);
    try {
      await fetch("/api/calibrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(makeFakePayload()),
      });
    } catch {
      // result arrives via Pusher regardless
    } finally {
      setTimeout(() => setSending(false), 1200);
    }
  };

  return (
    <Layout>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold font-mono uppercase tracking-tight flex items-center gap-2">
              <span className="w-2 h-2 bg-primary shadow-[0_0_10px_var(--primary)]" />
              Watch Calibration
            </h2>
            <p className="text-sm text-muted-foreground font-mono mt-1 uppercase tracking-wide">
              Galaxy Watch 6 — Sensor Logger Setup
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={sendTestThrow}
              disabled={sending}
              variant="outline"
              className="rounded-none font-mono uppercase tracking-wider text-xs border-primary text-primary hover:bg-primary hover:text-primary-foreground"
              data-testid="button-send-test-throw"
            >
              {sending ? (
                <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5 mr-2" />
              )}
              Send Test Throw
            </Button>
            <div className="flex items-center gap-2 text-xs font-mono uppercase">
              {pusherConnected ? (
                <><Wifi className="w-4 h-4 text-primary" /><span className="text-primary">Pusher Live</span></>
              ) : (
                <><WifiOff className="w-4 h-4 text-destructive" /><span className="text-destructive">Connecting...</span></>
              )}
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT: Setup instructions */}
          <div className="space-y-4">

            {/* Step 1: Sensor Config */}
            <Card className="rounded-none border-border bg-card shadow-none">
              <CardHeader className="border-b border-border pb-4">
                <CardTitle className="text-sm font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <span className="w-5 h-5 border border-primary text-primary text-xs flex items-center justify-center font-bold shrink-0">1</span>
                  Sensor Logger — Enable Sensor
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-5 space-y-2 text-xs font-mono text-muted-foreground">
                <p>Open <span className="text-foreground">Sensor Logger</span> on Galaxy Watch 6 → Sensors:</p>
                <div className="space-y-1.5 border border-border p-3">
                  <div className="flex items-start gap-2">
                    <ChevronRight className="w-3 h-3 text-primary mt-0.5 shrink-0" />
                    <span>Enable: <span className="text-primary">Total Acceleration (Watch)</span></span>
                  </div>
                  <div className="flex items-start gap-2">
                    <ChevronRight className="w-3 h-3 text-primary mt-0.5 shrink-0" />
                    <span>Sampling rate: <span className="text-primary">100 Hz</span></span>
                  </div>
                  <div className="flex items-start gap-2">
                    <ChevronRight className="w-3 h-3 text-primary mt-0.5 shrink-0" />
                    <span>Sensor key name in payload must be: <span className="text-primary">WatchTotalAcceleration</span></span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Step 2: HTTP Push */}
            <Card className="rounded-none border-border bg-card shadow-none">
              <CardHeader className="border-b border-border pb-4">
                <CardTitle className="text-sm font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <span className="w-5 h-5 border border-primary text-primary text-xs flex items-center justify-center font-bold shrink-0">2</span>
                  Sensor Logger — HTTP Push Config
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-5 space-y-4 text-xs font-mono text-muted-foreground">
                <div className="space-y-1.5 border border-border p-3">
                  <div className="flex items-start gap-2">
                    <ChevronRight className="w-3 h-3 text-primary mt-0.5 shrink-0" />
                    <span>Method: <span className="text-primary">POST</span></span>
                  </div>
                  <div className="flex items-start gap-2">
                    <ChevronRight className="w-3 h-3 text-primary mt-0.5 shrink-0" />
                    <span>Push interval: <span className="text-primary">1000 ms</span></span>
                  </div>
                  <div className="flex items-start gap-2">
                    <ChevronRight className="w-3 h-3 text-primary mt-0.5 shrink-0" />
                    <span>Content-Type: <span className="text-primary">application/json</span></span>
                  </div>
                  <div className="flex items-start gap-2">
                    <ChevronRight className="w-3 h-3 text-primary mt-0.5 shrink-0" />
                    <span>Payload wrapper key: <span className="text-primary">payload</span></span>
                  </div>
                </div>

                {/* URLs */}
                <div className="space-y-3 pt-1">
                  <UrlRow
                    label="Calibration URL (paste this into Sensor Logger now)"
                    url={info?.calibrate_url ?? null}
                    highlight
                  />
                  <UrlRow
                    label="Live Telemetry URL (switch to this during a match)"
                    url={info?.telemetry_url ?? null}
                  />
                  <UrlRow
                    label="ESP32 Stump URL"
                    url={info?.stump_url ?? null}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Physics thresholds */}
            <Card className="rounded-none border-border bg-card shadow-none">
              <CardHeader className="border-b border-border pb-4">
                <CardTitle className="text-sm font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <span className="w-5 h-5 border border-primary text-primary text-xs flex items-center justify-center font-bold shrink-0">3</span>
                  Physics Engine — Detection Thresholds
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-5 space-y-2">
                {[
                  { icon: <Cpu className="w-3 h-3 text-primary" />, label: "Ball detect threshold", value: "3G / 29.4 m/s²" },
                  { icon: <Activity className="w-3 h-3 text-primary" />, label: "ZUPT rest band", value: "9.0 – 10.5 m/s²" },
                  { icon: <Radio className="w-3 h-3 text-primary" />, label: "Swing window", value: "Peak −20 / +10 samples" },
                ].map(({ icon, label, value }) => (
                  <div key={label} className="flex items-center justify-between border border-border px-3 py-2 text-xs font-mono">
                    <div className="flex items-center gap-2 text-muted-foreground uppercase">
                      {icon}{label}
                    </div>
                    <span className="text-primary font-bold">{value}</span>
                  </div>
                ))}
                <p className="text-xs font-mono text-muted-foreground pt-1 leading-relaxed">
                  A full bowling action must exceed <span className="text-foreground">3G</span> to register as a delivery.
                  Click <span className="text-foreground">Send Test Throw</span> above to verify the Pusher pipeline first.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT: Live results panel */}
          <div>
            <Card className="rounded-none border-border bg-card shadow-none flex flex-col" style={{ minHeight: 560 }}>
              <CardHeader className="border-b border-border pb-4">
                <CardTitle className="text-sm font-mono uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Radio className="w-4 h-4" />
                    Live Throw Analysis
                  </span>
                  {results.length > 0 && (
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_var(--primary)]" data-testid="status-calibrate-live" />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 p-4 space-y-3 overflow-y-auto max-h-[640px]">
                {results.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-56 text-center gap-3">
                    <Radio className="w-10 h-10 text-muted-foreground/30 animate-pulse" />
                    <p className="text-xs font-mono uppercase text-muted-foreground tracking-widest">
                      Awaiting throw data...
                    </p>
                    <p className="text-xs text-muted-foreground/60 max-w-xs leading-relaxed">
                      Click <span className="text-foreground">Send Test Throw</span> to verify the pipeline,
                      then do a bowling action with Sensor Logger pointing at the calibration URL.
                    </p>
                  </div>
                ) : (
                  results.map((r, i) => <ResultCard key={r.timestamp + i} result={r} index={i} />)
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Expected payload shape */}
        <Card className="rounded-none border-border bg-card shadow-none">
          <CardHeader className="border-b border-border pb-4">
            <CardTitle className="text-sm font-mono uppercase tracking-wider text-muted-foreground">
              Expected Sensor Logger Payload Shape
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <pre className="text-xs font-mono text-muted-foreground bg-muted p-4 overflow-x-auto leading-relaxed">{`POST /api/calibrate
Content-Type: application/json

{
  "payload": [
    {
      "sensor": "WatchTotalAcceleration",
      "x": "0.123",
      "y": "-9.812",
      "z": "1.045",
      "seconds_elapsed": "0.010"
    },
    ...  (≈100 samples per second at 100 Hz)
  ]
}`}</pre>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
