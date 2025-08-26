import React, { useState, useEffect } from "react";
import Plot from "react-plotly.js";

export default function App() {
  const [dates, setDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [heatmapData, setHeatmapData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch available dates once when component mounts
  useEffect(() => {
    fetch("/api/dates")
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        // Handle the actual API response structure: {dates: [...]}
        const dateList = data.dates || data || [];
        setDates(dateList);
        if (dateList.length > 0) {
          setSelectedDate(dateList[0]);
        }
      })
      .catch((error) => {
        console.error("Error fetching dates:", error);
        setError("Failed to load available dates");
      });
  }, []);

  // Fetch heatmap data whenever the selectedDate changes
  useEffect(() => {
    if (!selectedDate) return;

    setLoading(true);
    setError(null);

    fetch(`/api/matrix?date=${encodeURIComponent(selectedDate)}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        setHeatmapData(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching heatmap data:", error);
        setError("Failed to load data for selected date");
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
    heatmapData.forEach((stream) => {
      Object.keys(stream.readings).forEach((time) => timeSlots.add(time));
    });
    const sortedTimeSlots = Array.from(timeSlots).sort();

    // Create the heatmap matrix
    const z = [];
    const y = []; // Channel names
    const x = []; // Time slots

    heatmapData.forEach((stream) => {
      y.push(stream.channelName);
      const row = [];
      sortedTimeSlots.forEach((timeSlot) => {
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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            IPTS R&D Loudness Analysis System
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Measure and visualize MPEG-TS signal loudness levels to normalize
            content and reduce channel switching discrepancies.
          </p>
        </div>

        {/* Date Selector */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="max-w-md mx-auto">
            <label
              htmlFor="date-select"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Select Date for Analysis
            </label>
            <select
              id="date-select"
              value={selectedDate}
              onChange={handleDateChange}
              className="block w-full rounded-md border border-gray-300 bg-white py-3 px-4 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg"
            >
              {dates.map((dateStr) => (
                <option key={dateStr} value={dateStr}>
                  {dateStr}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Legend */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
            Loudness Level Color Coding
          </h3>
          <div className="flex flex-wrap justify-center gap-8">
            <div className="flex items-center">
              <div className="w-6 h-6 bg-green-500 rounded mr-3"></div>
              <span className="text-gray-700">
                Normal/Acceptable (-23.0 to -22.0 dB)
              </span>
            </div>
            <div className="flex items-center">
              <div className="w-6 h-6 bg-yellow-500 rounded mr-3"></div>
              <span className="text-gray-700">Too Low (&lt; -23.0 dB)</span>
            </div>
            <div className="flex items-center">
              <div className="w-6 h-6 bg-red-500 rounded mr-3"></div>
              <span className="text-gray-700">Too Loud (&gt; -22.0 dB)</span>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <div className="flex">
              <div className="text-red-600">
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
            <p className="text-lg text-gray-600">Loading loudness data...</p>
          </div>
        )}

        {/* Heatmap Visualization */}
        {!loading && !error && heatmapDataForPlot && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
              Loudness Levels for {selectedDate}
            </h2>
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
                    [0, "#FF4136"], // Red for very loud
                  ],
                  zmin: -30,
                  zmax: 0,
                  hoverongaps: false,
                  hovertemplate:
                    "<b>%{y}</b><br>" +
                    "Time: %{x}<br>" +
                    "Loudness: %{z:.1f} dB<br>" +
                    "Status: %{customdata}<extra></extra>",
                  customdata: heatmapDataForPlot.z.map((row) =>
                    row.map((val) => getStatusText(val))
                  ),
                },
              ]}
              layout={{
                title: "",
                xaxis: {
                  title: "Time of Scan",
                  tickangle: -45,
                },
                yaxis: {
                  title: "Channel Name",
                  autorange: "reversed",
                },
                width: null,
                height: 600,
                margin: { l: 200, r: 50, t: 50, b: 100 },
              }}
              config={{
                displayModeBar: true,
                displaylogo: false,
                modeBarButtonsToRemove: ["pan2d", "lasso2d", "select2d"],
              }}
              style={{ width: "100%", height: "100%" }}
              useResizeHandler={true}
            />
          </div>
        )}

        {/* Data Table View */}
        {!loading && !error && heatmapData && heatmapData.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
              Detailed Data Table
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">
                      Channel Name
                    </th>
                    <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">
                      Multicast IP
                    </th>
                    {heatmapData[0] &&
                      Object.keys(heatmapData[0].readings)
                        .sort()
                        .map((timeSlot) => (
                          <th
                            key={timeSlot}
                            className="border border-gray-300 px-4 py-3 text-center font-semibold text-gray-700"
                          >
                            {timeSlot}
                          </th>
                        ))}
                  </tr>
                </thead>
                <tbody>
                  {heatmapData.map((stream, index) => (
                    <tr
                      key={index}
                      className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                    >
                      <td className="border border-gray-300 px-4 py-3 font-medium text-gray-900">
                        {stream.channelName}
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-blue-600 underline cursor-pointer">
                        {stream.ip}
                      </td>
                      {Object.keys(stream.readings)
                        .sort()
                        .map((timeSlot) => {
                          const reading = stream.readings[timeSlot];
                          const dbMatch = reading
                            ? reading.match(/([-\d.]+)/)
                            : null;
                          const dbValue = dbMatch
                            ? parseFloat(dbMatch[1])
                            : null;
                          const bgColor =
                            dbValue !== null
                              ? getColorForDb(dbValue)
                              : "#f3f4f6";

                          return (
                            <td
                              key={timeSlot}
                              className="border border-gray-300 px-4 py-3 text-center"
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

        {/* No Data State */}
        {!loading && !error && (!heatmapData || heatmapData.length === 0) && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="text-gray-400 mb-4">
              <svg
                className="mx-auto h-12 w-12"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <p className="text-lg text-gray-600">
              No data available for the selected date.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
