import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import supabase from "./supabaseClient";

export default function App() {
  const [streams, setStreams] = useState([]);
  const [measurements, setMeasurements] = useState([]);

  // 1) load stream configs once
  useEffect(() => {
    supabase
      .from("streams")
      .select("id, name, profile")
      .order("id", { ascending: true })
      .then(({ data, error }) => {
        if (error) throw error;
        setStreams(data);
      })
      .catch(console.error);
  }, []);

  // 2) poll measurements every 15s
  useEffect(() => {
    let timer;

    const loadMeasurements = () => {
      supabase
        .from("measurements")
        .select("stream_id, timestamp, avg_db")
        .order("timestamp", { ascending: true })
        .then(({ data, error }) => {
          if (error) throw error;
          setMeasurements(data);
        })
        .catch(console.error);
    };

    loadMeasurements();
    timer = setInterval(loadMeasurements, 15000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">
        IPTS R&amp;D Loudness Dashboard
      </h1>

      {streams.map((s) => (
        <div key={s.id} className="mb-8 p-4 border border-gray-300 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">
            {s.name}{" "}
            <span className="text-sm text-gray-600">({s.profile})</span>
          </h2>

          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={measurements.filter((m) => m.stream_id === s.id)}>
              <XAxis
                dataKey="timestamp"
                tickFormatter={(ts) => new Date(ts).toLocaleTimeString()}
              />
              <YAxis domain={[-30, 0]} />
              <Tooltip labelFormatter={(ts) => new Date(ts).toLocaleString()} />
              <Line
                type="monotone"
                dataKey="avg_db"
                stroke="#3b82f6"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ))}
    </div>
  );
}
