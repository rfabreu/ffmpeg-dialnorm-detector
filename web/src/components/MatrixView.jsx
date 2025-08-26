import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const MatrixView = () => {
  const [dates, setDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [matrixData, setMatrixData] = useState(null);
  const [streams, setStreams] = useState([]);

  // Fetch available dates once when component mounts
  useEffect(() => {
    fetch("/api/dates")
      .then((response) => response.json())
      .then((data) => {
        const dateList = data?.dates || [];
        setDates(dateList);
        if (dateList.length > 0) {
          setSelectedDate(dateList[0]);
        }
      })
      .catch((error) => console.error("Error fetching dates:", error));
  }, []);

  // Fetch streams once
  useEffect(() => {
    fetch("/api/streams")
      .then((response) => response.json())
      .then(setStreams)
      .catch((error) => console.error("Error fetching streams:", error));
  }, []);

  // Fetch matrix data whenever the selectedDate changes
  useEffect(() => {
    if (!selectedDate) return;
    fetch(`/api/matrix?date=${encodeURIComponent(selectedDate)}`)
      .then((response) => response.json())
      .then((data) => {
        setMatrixData(data);
      })
      .catch((error) => console.error("Error fetching matrix data:", error));
  }, [selectedDate]);

  // Handle user selecting a new date from the dropdown
  const handleDateChange = (event) => {
    setSelectedDate(event.target.value);
  };

  // Function to get color based on dB value
  const getDbValueColor = (dbValue) => {
    if (!dbValue) return "bg-gray-100";
    
    // Extract numeric value from "XX.X dB" format
    const match = dbValue.match(/(-?\d+\.?\d*)/);
    if (!match) return "bg-gray-100";
    
    const db = parseFloat(match[1]);
    if (db < -23.0) return "bg-yellow-200"; // too low
    if (db > -22.0) return "bg-red-200"; // too loud
    return "bg-green-200"; // normal/acceptable
  };

  // Get unique time slots from matrix data
  const getTimeSlots = () => {
    if (!matrixData) return [];
    const slots = new Set();
    matrixData.forEach(channel => {
      Object.keys(channel.readings).forEach(slot => slots.add(slot));
    });
    return Array.from(slots).sort();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Navigation */}
      <nav className="mb-6 flex justify-between items-center">
        <Link to="/" className="text-blue-600 hover:text-blue-800 hover:underline text-sm">
          ← Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold">IPTS R&D Loudness Matrix Dashboard</h1>
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
              {new Date(dateStr).toLocaleDateString()}
            </option>
          ))}
        </select>
      </div>

      {/* Matrix Data Display */}
      {matrixData && matrixData.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse border border-gray-300 bg-white shadow-lg">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Channel Name
                </th>
                <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Multicast IP
                </th>
                {getTimeSlots().map((timeSlot) => (
                  <th key={timeSlot} className="border border-gray-300 px-4 py-3 text-center text-sm font-semibold text-gray-700">
                    {timeSlot}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrixData.map((channel, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="border border-gray-300 px-4 py-3 text-sm font-medium text-gray-900">
                    {channel.channelName}
                  </td>
                  <td className="border border-gray-300 px-4 py-3 text-sm text-blue-600 underline cursor-pointer hover:text-blue-800">
                    {channel.ip}
                  </td>
                  {getTimeSlots().map((timeSlot) => (
                    <td 
                      key={timeSlot} 
                      className={`border border-gray-300 px-4 py-3 text-center text-sm font-mono ${getDbValueColor(channel.readings[timeSlot])}`}
                    >
                      {channel.readings[timeSlot] || "N/A"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : selectedDate ? (
        <div className="text-center py-8">
          <p className="text-gray-600 text-lg">
            No data available for {selectedDate}. Please select a different date.
          </p>
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-600 text-lg">
            Please select a date to view the loudness matrix.
          </p>
        </div>
      )}

      {/* Legend */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Color Legend:</h3>
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-200 border border-gray-300 mr-2"></div>
            <span>Normal/Acceptable (-23.0 to -22.0 dB)</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-yellow-200 border border-gray-300 mr-2"></div>
            <span>Too Low (&lt; -23.0 dB)</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-red-200 border border-gray-300 mr-2"></div>
            <span>Too Loud (&gt; -22.0 dB)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatrixView;
