import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

const Dashboard = () => {
  const [streams, setStreams] = useState([]);
  const [measurements, setMeasurements] = useState([]);

  // Load streams once
  useEffect(() => {
    fetch("/api/streams")
      .then((r) => r.json())
      .then(setStreams)
      .catch(console.error);
  }, []);

  // Poll measurements every 15s
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

  // Group measurements by stream_id
  const byStream = useMemo(() => {
    const map = {};
    measurements.forEach((m) => {
      if (!map[m.stream_id]) map[m.stream_id] = [];
      map[m.stream_id].push({ ...m, ts: new Date(m.timestamp) });
    });
    return map;
  }, [measurements]);

  // Per-bar color based on avg_db
  const barColor = (avg) => {
    if (avg < -23) return "#FFD700"; // yellow - too low
    if (avg > -22) return "#FF4136"; // red - too loud
    return "#2ECC40"; // green - normal/acceptable
  };

  // Get latest measurement for each stream
  const latestMeasurements = useMemo(() => {
    return streams.map(stream => {
      const data = byStream[stream.id] || [];
      const latest = data.length > 0 ? data[data.length - 1] : null;
      return {
        ...stream,
        latestMeasurement: latest,
        status: latest ? latest.status : 'unknown'
      };
    });
  }, [streams, byStream]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Navigation */}
      <nav className="mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold">IPTS R&D Loudness Dashboard</h1>
        <Link to="/matrix" className="text-blue-600 hover:text-blue-800 hover:underline text-sm">
          View Matrix →
        </Link>
      </nav>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow border">
          <h3 className="text-sm font-medium text-gray-500">Total Channels</h3>
          <p className="text-2xl font-bold text-gray-900">{streams.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <h3 className="text-sm font-medium text-gray-500">Normal</h3>
          <p className="text-2xl font-bold text-green-600">
            {latestMeasurements.filter(s => s.status === 'acceptable').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <h3 className="text-sm font-medium text-gray-500">Too Low</h3>
          <p className="text-2xl font-bold text-yellow-600">
            {latestMeasurements.filter(s => s.status === 'low').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <h3 className="text-sm font-medium text-gray-500">Too Loud</h3>
          <p className="text-2xl font-bold text-red-600">
            {latestMeasurements.filter(s => s.status === 'loud').length}
          </p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {streams.map((s) => {
          const data = byStream[s.id] || [];
          const latest = data.length > 0 ? data[data.length - 1] : null;
          
          return (
            <div key={s.id} className="bg-white border rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-gray-900">
                  {s.name}
                </h2>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  latest?.status === 'acceptable' ? 'bg-green-100 text-green-800' :
                  latest?.status === 'low' ? 'bg-yellow-100 text-yellow-800' :
                  latest?.status === 'loud' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {latest?.status || 'unknown'}
                </span>
              </div>
              
              <div className="text-sm text-gray-600 mb-2">
                {s.profile} profile • {s.node}
              </div>
              
              {latest && (
                <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
                  <div>
                    <span className="text-gray-500">Min:</span>
                    <span className="ml-1 font-mono">{latest.min_db?.toFixed(1)} dB</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Avg:</span>
                    <span className="ml-1 font-mono">{latest.avg_db?.toFixed(1)} dB</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Max:</span>
                    <span className="ml-1 font-mono">{latest.max_db?.toFixed(1)} dB</span>
                  </div>
                </div>
              )}

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

      {/* Legend */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Chart Legend:</h3>
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-500 mr-2 rounded"></div>
            <span>Normal/Acceptable (-23.0 to -22.0 dB)</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-yellow-500 mr-2 rounded"></div>
            <span>Too Low (&lt; -23.0 dB)</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-red-500 mr-2 rounded"></div>
            <span>Too Loud (&gt; -22.0 dB)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;