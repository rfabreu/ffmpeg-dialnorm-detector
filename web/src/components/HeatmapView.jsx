import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Plot from "react-plotly.js";

const HeatmapView = () => {
  const [dates, setDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [heatmapData, setHeatmapData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch available dates once when component mounts
  useEffect(() => {
    fetch("/api/dates")
      .then((response) => response.json())
      .then((data) => {
        const dateList = data || [];
        setDates(dateList);
        if (dateList.length > 0) {
          setSelectedDate(dateList[0]);
        }
      })
      .catch((error) => console.error("Error fetching dates:", error));
  }, []);

  // Fetch heatmap data whenever the selectedDate changes
  useEffect(() => {
    if (!selectedDate) return;
    
    setLoading(true);
    fetch(`/api/matrix?date=${encodeURIComponent(selectedDate)}`)
      .then((response) => response.json())
      .then((data) => {
        setHeatmapData(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching heatmap data:", error);
        setLoading(false);
      });
  }, [selectedDate]);

  const handleDateChange = (event) => {
    setSelectedDate(event.target.value);
  };

  // Function to get color based on dB value
  const getColorForDb = (dbValue) => {
    if (dbValue < -23.0) return "#FFD700"; // Yellow for too low
    if (dbValue > -22.0) return "#FF4136"; // Red for too loud
    return "#2ECC40"; // Green for normal/acceptable
  };

  // Function to get status text based on dB value
  const getStatusText = (dbValue) => {
    if (dbValue < -23.0) return "Too Low";
    if (dbValue > -22.0) return "Too Loud";
    return "Normal";
  };

  // Prepare data for Plotly heatmap
  const prepareHeatmapData = () => {
    if (!heatmapData || !Array.isArray(heatmapData)) return null;

    // Get unique time slots from all streams
    const timeSlots = new Set();
    heatmapData.forEach(stream => {
      Object.keys(stream.readings).forEach(time => timeSlots.add(time));
    });
    const sortedTimeSlots = Array.from(timeSlots).sort();

    // Create the heatmap matrix
    const z = [];
    const y = []; // Channel names
    const x = []; // Time slots

    heatmapData.forEach(stream => {
      y.push(stream.channelName);
      const row = [];
      sortedTimeSlots.forEach(timeSlot => {
        const reading = stream.readings[timeSlot];
        if (reading) {
          // Extract numeric value from "XX.X dB" format
          const dbMatch = reading.match(/([-\d.]+)/);
          const dbValue = dbMatch ? parseFloat(dbMatch[1]) : -25; // Default to -25 if parsing fails
          row.push(dbValue);
        } else {
          row.push(null); // No data for this time slot
        }
      });
      z.push(row);
    });

    // Format time slots for display
    x.push(...sortedTimeSlots);

    return { z, x, y };
  };

  const heatmapDataForPlot = prepareHeatmapData();

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Navigation Header */}
      <nav className="mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">IPTS R&D Loudness Heatmap Dashboard</h1>
        <div className="flex space-x-4">
          <Link 
            to="/" 
            className="px-3 py-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            Home
          </Link>
          <Link 
            to="/dashboard" 
            className="px-3 py-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            Dashboard
          </Link>
          <Link 
            to="/heatmap" 
            className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
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
      
      {/* Date Selector */}
      <div className="mb-6">
        <label htmlFor="date-select" className="block text-sm font-medium text-gray-700 mb-2">
          Select Date
        </label>
        <select
          id="date-select"
          value={selectedDate}
          onChange={handleDateChange}
          className="block w-full max-w-xs rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        >
          {dates.map((dateStr) => (
            <option key={dateStr} value={dateStr}>
              {dateStr}
            </option>
          ))}
        </select>
      </div>

      {/* Legend */}
      <div className="mb-6 flex flex-wrap gap-4">
        <div className="flex items-center">
          <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
          <span className="text-sm">Normal/Acceptable (-23.0 to -22.0 dB)</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-yellow-500 rounded mr-2"></div>
          <span className="text-sm">Too Low (&lt; -23.0 dB)</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-red-500 rounded mr-2"></div>
          <span className="text-sm">Too Loud (&gt; -22.0 dB)</span>
        </div>
      </div>

      {/* Heatmap Visualization */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-gray-600">Loading heatmap data...</div>
        </div>
      ) : heatmapDataForPlot ? (
        <div className="bg-white rounded-lg shadow-lg p-4">
          <Plot
            data={[
              {
                z: heatmapDataForPlot.z,
                x: heatmapDataForPlot.x,
                y: heatmapDataForPlot.y,
                type: "heatmap",
                colorscale: [
                  [-30, "#FFD700"], // Yellow for very low
                  [-23, "#FFD700"], // Yellow for too low
                  [-22.5, "#2ECC40"], // Green for normal
                  [-22, "#2ECC40"], // Green for normal
                  [-15, "#FF4136"], // Red for too loud
                  [0, "#FF4136"]   // Red for very loud
                ],
                zmin: -30,
                zmax: 0,
                hoverongaps: false,
                hovertemplate: 
                  "<b>%{y}</b><br>" +
                  "Time: %{x}<br>" +
                  "Loudness: %{z:.1f} dB<br>" +
                  "Status: %{customdata}<extra></extra>",
                customdata: heatmapDataForPlot.z.map(row => 
                  row.map(val => getStatusText(val))
                )
              }
            ]}
            layout={{
              title: `Loudness Levels for ${selectedDate}`,
              xaxis: {
                title: "Time of Scan",
                tickangle: -45
              },
              yaxis: {
                title: "Channel Name",
                autorange: "reversed"
              },
              width: null,
              height: 600,
              margin: { l: 200, r: 50, t: 80, b: 100 }
            }}
            config={{
              displayModeBar: true,
              displaylogo: false,
              modeBarButtonsToRemove: ["pan2d", "lasso2d", "select2d"]
            }}
            style={{ width: "100%", height: "100%" }}
            useResizeHandler={true}
          />
        </div>
      ) : (
        <div className="text-center text-gray-600 py-8">
          No data available for the selected date.
        </div>
      )}

      {/* Data Table View */}
      {heatmapData && heatmapData.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Detailed Data Table</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse border border-gray-300 bg-white">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Channel Name</th>
                  <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Multicast IP</th>
                  {heatmapData[0] && Object.keys(heatmapData[0].readings).sort().map(timeSlot => (
                    <th key={timeSlot} className="border border-gray-300 px-4 py-2 text-center font-semibold">
                      {timeSlot}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {heatmapData.map((stream, index) => (
                  <tr key={index} className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                    <td className="border border-gray-300 px-4 py-2 font-medium">{stream.channelName}</td>
                    <td className="border border-gray-300 px-4 py-2 text-blue-600 underline cursor-pointer">
                      {stream.ip}
                    </td>
                    {Object.keys(stream.readings).sort().map(timeSlot => {
                      const reading = stream.readings[timeSlot];
                      const dbMatch = reading ? reading.match(/([-\d.]+)/) : null;
                      const dbValue = dbMatch ? parseFloat(dbMatch[1]) : null;
                      const status = dbValue !== null ? getStatusText(dbValue) : "No Data";
                      const bgColor = dbValue !== null ? getColorForDb(dbValue) : "#f3f4f6";
                      
                      return (
                        <td 
                          key={timeSlot} 
                          className="border border-gray-300 px-4 py-2 text-center"
                          style={{ backgroundColor: bgColor }}
                        >
                          {reading || "No Data"}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default HeatmapView;