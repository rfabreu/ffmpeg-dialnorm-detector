import React, { useState, useEffect } from "react";

export default function App() {
  const [dates, setDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [matrixData, setMatrixData] = useState(null);
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
        console.log("Dates API response:", data);
        const dateList = data.dates || [];
        console.log("Extracted dates:", dateList);
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

  // Fetch matrix data whenever the selectedDate changes
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
        console.log("Matrix API response:", data);
        if (Array.isArray(data)) {
          setMatrixData(data);
        } else {
          console.error("Matrix API returned non-array data:", data);
          setError("Invalid data format received from server");
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching matrix data:", error);
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

  // Function to extract EST time from the last reading in a column
  const getLastTimestampForColumn = (timeSlot) => {
    if (!matrixData || !Array.isArray(matrixData)) return timeSlot;

    let lastTimestamp = null;

    // Find the last non-null reading for this time slot across all streams
    for (let i = matrixData.length - 1; i >= 0; i--) {
      const stream = matrixData[i];
      if (stream && stream.readings && stream.readings[timeSlot]) {
        const reading = stream.readings[timeSlot];
        // Extract EST time from the reading format: "XX.X dB (HH:MM EST)"
        const estTimeMatch = reading.match(/\((\d{2}:\d{2}) EST\)/);
        if (estTimeMatch) {
          lastTimestamp = estTimeMatch[1];
          break;
        }
      }
    }

    return lastTimestamp || timeSlot;
  };

  // Function to format scan header with last timestamp
  const formatScanHeader = (timeSlot, index) => {
    const scanLetter = String.fromCharCode(65 + index); // A, B, C, etc.
    const lastTimestamp = getLastTimestampForColumn(timeSlot);

    // If we found an EST timestamp, use it; otherwise fall back to the time slot
    if (lastTimestamp && lastTimestamp !== timeSlot) {
      return `Scan ${scanLetter} (${lastTimestamp} EST)`;
    } else {
      return `Scan ${scanLetter} (${timeSlot})`;
    }
  };

  // Function to extract only the dB value from a reading
  const extractDbValue = (reading) => {
    if (!reading) return "No Data";

    // Extract just the dB value from "XX.X dB (HH:MM EST)" format
    const dbMatch = reading.match(/([-\d.]+) dB/);
    return dbMatch ? `${dbMatch[1]} dB` : reading;
  };

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
              {Array.isArray(dates) &&
                dates.map((dateStr) => (
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
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
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

        {/* Loudness Data Matrix */}
        {!loading &&
          !error &&
          matrixData &&
          Array.isArray(matrixData) &&
          matrixData.length > 0 && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
                Loudness Levels Matrix for {selectedDate}
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
                      {matrixData[0] &&
                        matrixData[0].readings &&
                        Object.keys(matrixData[0].readings)
                          .sort()
                          .map((timeSlot, index) => (
                            <th
                              key={index}
                              className="border border-gray-300 px-4 py-3 text-center font-semibold text-gray-700"
                            >
                              {formatScanHeader(timeSlot, index)}
                            </th>
                          ))}
                    </tr>
                  </thead>
                  <tbody>
                    {matrixData.map((stream, index) => {
                      if (!stream || !stream.readings) {
                        console.error("Invalid stream data:", stream);
                        return null;
                      }

                      return (
                        <tr
                          key={index}
                          className={
                            index % 2 === 0 ? "bg-white" : "bg-gray-50"
                          }
                        >
                          <td className="border border-gray-300 px-4 py-3 font-medium text-gray-900">
                            {stream.channelName || "Unknown"}
                          </td>
                          <td className="border border-gray-300 px-4 py-3 text-blue-600 underline cursor-pointer">
                            {stream.ip || "Unknown"}
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
                                  {extractDbValue(reading)}
                                </td>
                              );
                            })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        {/* No Data State */}
        {!loading &&
          !error &&
          (!matrixData ||
            !Array.isArray(matrixData) ||
            matrixData.length === 0) && (
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
