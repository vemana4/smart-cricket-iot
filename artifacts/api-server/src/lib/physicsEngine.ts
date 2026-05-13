export interface SensorSample {
  sensor: string;
  x: string;
  y: string;
  z: string;
  seconds_elapsed: string;
}

export interface DeliveryResult {
  pace_kmh: number;
  is_legal: boolean;
  trajectory: [number, number, number][];
}

export function processDelivery(
  payloadArray: SensorSample[]
): DeliveryResult | null {
  // Filter for WatchTotalAcceleration sensor only
  const samples = payloadArray.filter(
    (s) => s.sensor === "WatchTotalAcceleration"
  );

  if (samples.length === 0) return null;

  // Parse floats
  const parsed = samples.map((s) => ({
    x: parseFloat(s.x),
    y: parseFloat(s.y),
    z: parseFloat(s.z),
    t: parseFloat(s.seconds_elapsed),
  }));

  // Step 1: Peak detection — find highest resultant acceleration
  let peakIdx = 0;
  let peakMag = 0;
  for (let i = 0; i < parsed.length; i++) {
    const { x, y, z } = parsed[i];
    const mag = Math.sqrt(x * x + y * y + z * z);
    if (mag > peakMag) {
      peakMag = mag;
      peakIdx = i;
    }
  }

  // If peak < 3G (≈29.4 m/s²), bowler is just walking — skip
  if (peakMag < 29.4) return null;

  // Step 2: Isolate Swing Window: peak−20 to peak+10 indices
  const start = Math.max(0, peakIdx - 20);
  const end = Math.min(parsed.length - 1, peakIdx + 10);
  const window = parsed.slice(start, end + 1);

  // Step 3: Double integration over the Swing Window
  let vx = 0, vy = 0, vz = 0;
  let px = 0, py = 0, pz = 0;
  const trajectory: [number, number, number][] = [];

  for (let i = 1; i < window.length; i++) {
    const dt = window[i].t - window[i - 1].t;
    if (dt <= 0) continue;

    const ax = window[i].x;
    const ay = window[i].y;
    // Subtract gravity from Z
    const az = window[i].z - 9.81;

    // Step 4: ZUPT — if at rest (resultant ≈ 1G), reset velocity
    const rawMag = Math.sqrt(
      window[i].x ** 2 + window[i].y ** 2 + window[i].z ** 2
    );
    if (rawMag >= 9.0 && rawMag <= 10.5) {
      vx = 0;
      vy = 0;
      vz = 0;
    }

    // Integrate acceleration → velocity
    vx += ax * dt;
    vy += ay * dt;
    vz += az * dt;

    // Integrate velocity → position
    px += vx * dt;
    py += vy * dt;
    pz += vz * dt;

    trajectory.push([
      parseFloat(px.toFixed(4)),
      parseFloat(py.toFixed(4)),
      parseFloat(pz.toFixed(4)),
    ]);
  }

  return {
    pace_kmh: parseFloat((peakMag * 3.6).toFixed(2)),
    is_legal: true,
    trajectory,
  };
}
