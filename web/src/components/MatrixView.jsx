import React, { useState, useEffect } from "react";

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
      <h1 className="text-3xl font-bold mb-6">Matrix View</h1>
      
      {/* Date Selector Dropdown */}
      <div className="mb-6">
        <label
          htmlFor="date-select"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Date
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
        <div className="bg-white rounded-lg shadow overflow-hidden">
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
                  {matrixData[0]?.readings ? Object.keys(matrixData[0].readings).map((slot) => (
                    <th key={slot} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {slot}
                    </th>
                  )) : null}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {matrixData.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {row.channelName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 underline">
                      {row.ip}
                    </td>
                    {Object.keys(row.readings || {}).map((slot) => (
                      <td key={slot} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                        {row.readings[slot]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        // Fallback text if no data is available yet
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg">
            No data available for the selected date.
          </p>
        </div>
      )}
    </div>
  );
};

export default MatrixView;
