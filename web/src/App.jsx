import { useEffect, useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts'
import { supabase } from './supabaseClient'

export default function App() {
  const [streams, setStreams]         = useState([])
  const [measurements, setMeasurements] = useState([])

  // 1) load streams once
  useEffect(() => {
    supabase
      .from('streams')
      .select('*')
      .then(({ data, error }) => {
        if (error) console.error(error)
        else setStreams(data)
      })
  }, [])

  // 2) poll measurements every 15s
  useEffect(() => {
    const load = () => {
      supabase
        .from('measurements')
        .select('*')
        .order('timestamp', { ascending: true })
        .then(({ data, error }) => {
          if (error) console.error(error)
          else setMeasurements(data)
        })
    }
    load()
    const iv = setInterval(load, 15000)
    return () => clearInterval(iv)
  }, [])

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">
        IPTS R&D Loudness Dashboard
      </h1>

      {streams.map((s) => (
        <div key={s.id} className="mb-6 p-4 border rounded-lg">
          <h2 className="text-xl mb-2">
            {s.name} ({s.profile})
          </h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart
              data={measurements.filter((m) => m.stream_id === s.id)}
            >
              <XAxis
                dataKey="timestamp"
                tickFormatter={(ts) =>
                  new Date(ts).toLocaleTimeString()
                }
              />
              <YAxis domain={[-30, 0]} />
              <Tooltip
                labelFormatter={(ts) =>
                  new Date(ts).toLocaleString()
                }
              />
              <Line type="monotone" dataKey="avg_db" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ))}
    </div>
  )
}
