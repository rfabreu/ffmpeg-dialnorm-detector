import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

const Dashboard = () => {
  const [streams, setStreams] = useState([]);
  const [measurements, setMeasurements] = useState([]);

  // 1) load streams once
  useEffect(() => {
    fetch("/api/streams")
      .then((r) => r.json())
      .then(setStreams)
      .catch(console.error);
  }, []);

  // 2) poll measurements every 15s
  useEffect(() => {
    const load = () => {
      fetch("/api/measurements")
        .then((r) => r.json())
        .then(setMeasurements)
        .catch(console.error);
    };
    load();
    const iv = setInterval(load, 15000);
    return () => clearInterval(iv);
  }, []);

  // group measurements by stream_id
  const byStream = useMemo(() => {
    const map = {};
    measurements.forEach((m) => {
      if (!map[m.stream_id]) map[m.stream_id] = [];
      map[m.stream_id].push({ ...m, ts: new Date(m.timestamp) });
    });
    return map;
  }, [measurements]);

  // per‐bar color based on avg_db
  const barColor = (avg) => {
    if (avg < -23) return "#FFD700"; // yellow
    if (avg > -22) return "#FF4136"; // red
    return "#2ECC40"; // green
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Navigation Header */}
      <nav className="mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">IPTS R&D Loudness Dashboard</h1>
        <div className="flex space-x-4">
          <Link 
            to="/" 
            className="px-3 py-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            Home
          </Link>
          <Link 
            to="/dashboard" 
            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Dashboard
          </Link>
          <Link 
            to="/heatmap" 
            className="px-3 py-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            Heatmap
          </Link>
          <Link 
            to="/matrix" 
            className="px-3 py-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            Matrix View
          </Link>
        </div>
      </nav>

      <p className="text-gray-600 mb-6">
        Individual channel loudness levels over time. Each bar represents a measurement with color coding:
        <span className="text-green-600 font-semibold"> Green</span> (normal),
        <span className="text-yellow-600 font-semibold"> Yellow</span> (too low),
        <span className="text-red-600 font-semibold"> Red</span> (too loud).
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {streams.map((s) => {
          const data = byStream[s.id] || [];
          return (
            <div key={s.id} className="border rounded-lg p-3 bg-white shadow-sm">
              <h2 className="text-lg font-semibold mb-2">
                {s.name} ({s.profile})
              </h2>
              <ResponsiveContainer width="100%" height={150}>
                <BarChart
                  data={data}
                  margin={{ top: 5, right: 5, bottom: 20, left: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="ts"
                    type="number"
                    scale="time"
                    domain={["dataMin", "dataMax"]}
                    tickFormatter={(ts) =>
                      new Date(ts).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    }
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis domain={[-30, 0]} tick={{ fontSize: 10 }} width={40} />
                  <Tooltip
                    formatter={(val) => `${val.toFixed(2)} dB`}
                    labelFormatter={(ts) => new Date(ts).toLocaleString()}
                  />
                  <Bar
                    dataKey="avg_db"
                    isAnimationActive={false}
                    shape={({ x, y, width, height, payload }) => (
                      <rect
                        x={x}
                        y={y}
                        width={width}
                        height={height}
                        fill={barColor(payload.avg_db)}
                      />
                    )}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Dashboard;