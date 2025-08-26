import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const MatrixView = () => {
  const [dates, setDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState(""); // selected date string
  const [matrixData, setMatrixData] = useState(null); // data returned from /api/matrix

  // Fetch available dates once when component mounts
  useEffect(() => {
    fetch("/api/dates")
      .then((response) => response.json())
      .then((data) => {
        const dateList = data || [];
        setDates(dateList);
        if (dateList.length > 0) {
          // If dates are available, select the first date by default (you can adjust this logic if needed)
          setSelectedDate(dateList[0]);
        }
      })
      .catch((error) => console.error("Error fetching dates:", error));
  }, []);

  // Fetch matrix data whenever the selectedDate changes (and is not empty)
  useEffect(() => {
    if (!selectedDate) return; // Do nothing if no date is selected
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

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Navigation Header */}
      <nav className="mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">IPTS R&D Loudness Matrix View</h1>
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
            className="px-3 py-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            Heatmap
          </Link>
          <Link 
            to="/matrix" 
            className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Matrix View
          </Link>
        </div>
      </nav>

      {/* Date Selector Dropdown */}
      <div className="mb-6">
        <label
          htmlFor="date-select"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
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

      {/* Matrix Data Display */}
      {matrixData ? (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">Matrix Data for {selectedDate}</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Channel Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Multicast IP
                  </th>
                  {matrixData[0] && Object.keys(matrixData[0].readings).sort().map(timeSlot => (
                    <th key={timeSlot} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {timeSlot}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {matrixData.map((stream, index) => (
                  <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {stream.channelName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 underline cursor-pointer">
                      {stream.ip}
                    </td>
                    {Object.keys(stream.readings).sort().map(timeSlot => {
                      const reading = stream.readings[timeSlot];
                      return (
                        <td key={timeSlot} className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
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
      ) : (
        // Fallback text if no data is available yet
        <div className="text-center text-gray-600 py-8">
          No data available for the selected date.
        </div>
      )}
    </div>
  );
};

export default MatrixView;
