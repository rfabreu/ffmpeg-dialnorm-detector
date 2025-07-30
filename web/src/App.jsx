import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { supabase } from "./supabaseClient";

export default function App() {
  const [streams, setStreams] = useState([]);
  const [measurements, setMeasurements] = useState([]);

  // load streams once
  useEffect(() => {
    supabase
      .from("streams")
      .select("id, name, profile")
      .order("id")
      .then(({ data, error }) =>
        error ? console.error(error) : setStreams(data)
      );
  }, []);

  // subscribe to real-time INSERTs on measurements
  useEffect(() => {
    // initial load
    supabase
      .from("measurements")
      .select("*")
      .order("timestamp")
      .then(({ data }) => setMeasurements(data || []));

    // realtime listener
    const subscription = supabase
      .channel("public:measurements")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "measurements" },
        ({ new: row }) => {
          setMeasurements((prev) => [...prev, row]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">IPTS Loudness Dashboard</h1>
      {streams.map((s) => (
        <div key={s.id} className="mb-8 p-4 border rounded-lg">
          <h2 className="text-xl mb-2">
            {s.name}{" "}
            <span className="text-sm text-gray-600">({s.profile})</span>
          </h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={measurements.filter((m) => m.stream_id === s.id)}>
              <XAxis
                dataKey="timestamp"
                tickFormatter={(t) => new Date(t).toLocaleTimeString()}
              />
              <YAxis domain={[-30, 0]} />
              <Tooltip labelFormatter={(t) => new Date(t).toLocaleString()} />
              <Line type="monotone" dataKey="avg_db" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ))}
    </div>
  );
}
