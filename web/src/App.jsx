import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function App() {
  const [streams, setStreams] = useState([]);
  const [measurements, setMeasurements] = useState([]);

  useEffect(() => {
    fetch("/api/streams")
      .then((r) => r.json())
      .then(setStreams);
    fetch("/api/measurements")
      .then((r) => r.json())
      .then(setMeasurements);
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">IPTS R&D Loudness Dashboard</h1>
      {streams.map((s) => (
        <div key={s.id} className="mb-6 p-4 border rounded-lg shadow">
          <h2 className="text-xl">
            {s.name} ({s.profile})
          </h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={measurements.filter((m) => m.stream_id === s.id)}>
              <XAxis dataKey="timestamp" />
              <YAxis domain={[-30, 0]} />
              <Tooltip />
              <Line type="monotone" dataKey="avg_db" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ))}
    </div>
  );
}
