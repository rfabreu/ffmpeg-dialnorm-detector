import React, { useState, useEffect, useMemo } from "react";

/**
 * MatrixView component renders a table of loudness readings for a selected
 * date.  It queries the server for available dates and for the matrix data
 * specific to the chosen date.  Users can toggle between light and dark
 * themes via a simple checkbox.  Each cell is color coded based on the dB
 * range using the same thresholds as the bar chart (yellow for too quiet,
 * red for too loud, green for acceptable).
 */
function MatrixView() {
  // List of dates that have data available.  Populated from /api/dates.
  const [dates, setDates] = useState([]);
  // Currently selected date (YYYY-MM-DD).  Defaults to latest date.
  const [currentDate, setCurrentDate] = useState("");
  // Matrix data returned from /api/matrix for the selected date.
  const [data, setData] = useState([]);
  // Dark theme toggle state.
  const [isDark, setIsDark] = useState(false);

  // On mount, load the list of available dates.  The endpoint returns
  // chronological dates; we pick the last one as default.
  useEffect(() => {
    fetch("/api/dates")
      .then((res) => res.json())
      .then((list) => {
        if (Array.isArray(list)) {
          setDates(list);
          if (list.length > 0) {
            setCurrentDate(list[list.length - 1]);
          }
        }
      })
      .catch((err) => {
        console.error("Failed to load date list", err);
      });
  }, []);

  // Whenever the current date changes, fetch the matrix data for that date.
  useEffect(() => {
    if (!currentDate) return;
    fetch(`/api/matrix?date=${currentDate}`)
      .then((res) => res.json())
      .then((d) => {
        setData(Array.isArray(d) ? d : []);
      })
      .catch((err) => {
        console.error("Failed to load matrix data", err);
      });
  }, [currentDate]);

  // Compute the union of all time slots present in the data.  Sorting
  // alphabetically yields chronological order for "HH:MM" strings.
  const timeSlots = useMemo(() => {
    const set = new Set();
    data.forEach((channel) => {
      Object.keys(channel.readings).forEach((time) => set.add(time));
    });
    const arr = Array.from(set);
    arr.sort((a, b) => a.localeCompare(b));
    return arr;
  }, [data]);

  // Determine cell background color based on dB value.
  const getCellColor = (valueStr) => {
    const val = parseFloat(valueStr);
    if (isNaN(val)) return "";
    if (val < -23) return "#FFD700"; // yellow
    if (val > -22) return "#FF4136"; // red
    return "#2ECC40"; // green
  };

  // Handle date picker changes.
  const handleDateChange = (e) => {
    setCurrentDate(e.target.value);
  };

  return (
    <div
      className={
        (isDark ? "bg-gray-900 text-white" : "bg-white text-black") +
        " min-h-screen p-4"
      }
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-2 sm:space-y-0">
        <h2 className="text-2xl font-bold">Daily Matrix View</h2>
        {/* Dark theme toggle */}
        <label className="inline-flex items-center cursor-pointer">
          <span className="mr-2 text-sm">Dark Mode</span>
          <input
            type="checkbox"
            checked={isDark}
            onChange={() => setIsDark(!isDark)}
            className="form-checkbox h-4 w-4"
          />
        </label>
      </div>

      {/* Date Picker */}
      <div className="mb-4">
        <label htmlFor="datePicker" className="font-semibold mr-2">
          Select Date:
        </label>
        <input
          id="datePicker"
          type="date"
          value={currentDate}
          min={dates.length ? dates[0] : undefined}
          max={dates.length ? dates[dates.length - 1] : undefined}
          onChange={handleDateChange}
          className={
            (isDark
              ? "bg-gray-800 border-gray-700"
              : "bg-white border-gray-300") + " border p-1 rounded"
          }
        />
      </div>

      {/* Matrix Table */}
      {data.length > 0 ? (
        <div className="overflow-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className={isDark ? "bg-gray-700" : "bg-gray-100"}>
                <th className="px-2 py-1 border whitespace-nowrap">
                  Channel Name
                </th>
                <th className="px-2 py-1 border whitespace-nowrap">
                  Multicast IP
                </th>
                {timeSlots.map((time) => (
                  <th key={time} className="px-2 py-1 border whitespace-nowrap">
                    {time}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((channel) => (
                <tr
                  key={channel.channelName}
                  className={isDark ? "odd:bg-gray-800" : "odd:bg-gray-50"}
                >
                  <td className="px-2 py-1 border font-medium whitespace-nowrap">
                    {channel.channelName}
                  </td>
                  <td className="px-2 py-1 border whitespace-nowrap">
                    {channel.ip}
                  </td>
                  {timeSlots.map((time) => {
                    const value = channel.readings[time];
                    const bg = value ? getCellColor(value) : "";
                    return (
                      <td
                        key={time}
                        className="px-2 py-1 border text-center whitespace-nowrap"
                        style={{ backgroundColor: bg }}
                      >
                        {value || "N/A"}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>
          <em>No data available for {currentDate || "selected date"}.</em>
        </p>
      )}
    </div>
  );
}

export default MatrixView;
