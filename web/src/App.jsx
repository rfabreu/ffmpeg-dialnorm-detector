import { useEffect, useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Brush,
  Cell,
  ResponsiveContainer
} from 'recharts'

export default function App() {
  const [streams, setStreams] = useState([])
  const [measurements, setMeasurements] = useState([])

  // 1) Load streams once on mount
  useEffect(() => {
    fetch('/api/streams')
      .then(res => res.json())
      .then(setStreams)
      .catch(console.error)
  }, [])

  // 2) Load all measurements on mount, then poll for new measurements every 15s
  useEffect(() => {
    let latestTimestamp = null

    // Fetch the full history of measurements (initial load)
    const loadAllMeasurements = () => {
      return fetch('/api/measurements')
        .then(res => res.json())
        .then(data => {
          setMeasurements(data)  // set initial dataset
          if (data.length > 0) {
            // Record the timestamp of the latest measurement
            const lastEntry = data[data.length - 1]
            latestTimestamp = lastEntry.timestamp
          }
        })
    }

    // Fetch only new measurements since the last known timestamp
    const loadNewMeasurements = () => {
      if (!latestTimestamp) {
        // If no data yet, fetch full history instead (safety fallback)
        return loadAllMeasurements()
      }
      fetch('/api/measurements?since=' + encodeURIComponent(latestTimestamp))
        .then(res => res.json())
        .then(newData => {
          if (newData && newData.length > 0) {
            setMeasurements(prevMeasurements => {
              // Deduplicate new entries against existing measurements
              const existingKeys = new Set(prevMeasurements.map(m => m.stream_id + '|' + m.timestamp))
              const filteredNew = newData.filter(m => !existingKeys.has(m.stream_id + '|' + m.timestamp))
              // Append new measurements to the previous list
              const combined = [...prevMeasurements, ...filteredNew]
              // Keep measurements sorted by timestamp (ascending)
              combined.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
              return combined
            })
            // Update the latest known timestamp for the next poll
            const lastNewMeasurement = newData[newData.length - 1]
            latestTimestamp = lastNewMeasurement.timestamp
          }
        })
        .catch(console.error)
    }

    // Initial load and start polling interval
    loadAllMeasurements().catch(console.error)
    const intervalId = setInterval(loadNewMeasurements, 15000)
    return () => clearInterval(intervalId)  // cleanup on unmount
  }, [])

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">IPTS R&D Loudness Dashboard</h1>
      {streams.map(s => {
        // Filter measurements for this stream
        const data = measurements.filter(m => m.stream_id === s.id)
        return (
          <div key={s.id} className="mb-6 p-4 border rounded-lg">
            <h2 className="text-xl mb-2">
              {s.name} ({s.profile})
            </h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data} margin={{ bottom: 20 }}>
                <XAxis 
                  dataKey="timestamp"
                  tickFormatter={(ts) => new Date(ts).toLocaleTimeString()}
                />
                <YAxis domain={[-30, 0]} />
                <Tooltip 
                  labelFormatter={(ts) => new Date(ts).toLocaleString()}
                />
                <Bar dataKey="avg_db">
                  {data.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`}
                      fill={
                        entry.avg_db >= -22 
                          ? 'red'    // loud
                          : entry.avg_db >= -24 
                          ? 'green'  // acceptable
                          : 'yellow' // low
                      }
                    />
                  ))}
                </Bar>
                <Brush dataKey="timestamp" height={30} stroke="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )
      })}
    </div>
  )
}
