import React, { useState, useEffect } from "react";
// Removed React DatePicker import and CSS since we're using a native select now

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
    <div className="p-4">
      {" "}
      {/* Container with some padding */}
      {/* Date Selector Dropdown */}
      <div className="mb-4">
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
        /** Render the matrix data as before. For example, if matrixData is a 2D array: **/
        <table className="min-w-full border-collapse border border-gray-300">
          <tbody>
            {matrixData.map((row, i) => (
              <tr key={i}>
                {row.map((cell, j) => (
                  <td
                    key={j}
                    className="border border-gray-300 px-2 py-1 text-center"
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        // Fallback text if no data is available yet
        <p className="text-gray-600">
          No data available for the selected date.
        </p>
      )}
    </div>
  );
};

export default MatrixView;
