import React, { useState, useEffect } from "react";

/**
 * MatrixView component renders a table of loudness readings for a selected
 * date.  It queries the server for available dates and for the matrix data
 * specific to the chosen date.  Nine hourly slots (09:00–17:00) are
 * displayed for each channel, and each cell is color coded based on the dB
 * range using the same thresholds as the dashboard: yellow for values
 * below –23 dB, red for values above –22 dB and green for values in
 * between.  Missing data is shown as “N/A”.
 */
function MatrixView() {
  // List of dates that have data available.  Populated from /api/dates.
  const [dates, setDates] = useState([]);
  // Currently selected date (YYYY-MM-DD).  Defaults to latest date.
  const [currentDate, setCurrentDate] = useState("");
  // Matrix data returned from /api/matrix for the selected date.
  const [data, setData] = useState([]);

  // Define the expected time slots (9 runs from 09:00 to 17:00).  These
  // columns will always appear in the matrix regardless of whether
  // measurements exist for that slot.
  const TIME_SLOTS = [
    "09:00",
    "10:00",
    "11:00",
    "12:00",
    "13:00",
    "14:00",
    "15:00",
    "16:00",
    "17:00",
  ];

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

  // The matrix always displays the predefined time slots.  We don't
  // compute a union from the data because the backend may omit keys for
  // missing values (rendered as N/A).
  const timeSlots = TIME_SLOTS;

  // Determine cell background color based on dB value.  Thresholds match
  // the dashboard: below -23 dB is too quiet (yellow); above -22 dB is too
  // loud (red); all others are acceptable (green).
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
    <div className="min-h-screen p-4 bg-white text-black">
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
        <h2 className="text-2xl font-bold">Daily Matrix View</h2>
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
          className="border border-gray-300 p-1 rounded bg-white"
        />
      </div>

      {/* Matrix Table */}
      {data.length > 0 ? (
        <div className="overflow-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
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
                <tr key={channel.channelName} className="odd:bg-gray-50">
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
