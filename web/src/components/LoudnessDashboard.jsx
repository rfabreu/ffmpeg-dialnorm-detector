import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";

const LoudnessDashboard = () => {
  const [streams, setStreams] = useState([]);
  const [measurements, setMeasurements] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [availableDates, setAvailableDates] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load streams once
  useEffect(() => {
    fetch("/api/streams")
      .then((r) => r.json())
      .then(setStreams)
      .catch(console.error);
  }, []);

  // Load available dates
  useEffect(() => {
    fetch("/api/dates")
      .then((r) => r.json())
      .then((dates) => {
        setAvailableDates(dates || []);
        if (dates && dates.length > 0) {
          setSelectedDate(dates[0]);
        }
      })
      .catch(console.error);
  }, []);

  // Load measurements for selected date
  useEffect(() => {
    if (!selectedDate) return;
    
    setLoading(true);
    fetch(`/api/matrix?date=${encodeURIComponent(selectedDate)}`)
      .then((r) => r.json())
      .then((data) => {
        setMeasurements(data || []);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching matrix data:", error);
        setLoading(false);
      });
  }, [selectedDate]);

  // Get color based on dB value
  const getStatusColor = (dbValue) => {
    if (!dbValue || typeof dbValue === 'string') return 'bg-gray-100';
    
    const db = parseFloat(dbValue);
    if (isNaN(db)) return 'bg-gray-100';
    
    if (db < -23.0) return 'bg-red-500 text-white'; // too low
    if (db > -18.0) return 'bg-red-500 text-white'; // too loud
    return 'bg-green-500 text-white'; // normal/acceptable
  };

  // Get status text
  const getStatusText = (dbValue) => {
    if (!dbValue || typeof dbValue === 'string') return 'N/A';
    
    const db = parseFloat(dbValue);
    if (isNaN(db)) return 'N/A';
    
    if (db < -23.0) return 'Too Low';
    if (db > -18.0) return 'Too Loud';
    return 'Normal';
  };

  // Extract time slots from measurements
  const timeSlots = useMemo(() => {
    if (!measurements.length) return [];
    
    const slots = new Set();
    measurements.forEach(m => {
      Object.keys(m.readings || {}).forEach(slot => {
        slots.add(slot);
      });
    });
    
    return Array.from(slots).sort();
  }, [measurements]);

  // Create matrix data for display
  const matrixData = useMemo(() => {
    if (!measurements.length) return [];
    
    return measurements.map(stream => ({
      channelName: stream.channelName || 'Unknown',
      multicastIP: stream.ip || 'N/A',
      readings: stream.readings || {}
    }));
  }, [measurements]);

  const handleDateChange = (event) => {
    setSelectedDate(event.target.value);
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">Loading data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Navigation */}
      <nav className="mb-6 flex justify-end space-x-4">
        <Link to="/" className="text-blue-600 hover:underline text-sm">
          Dashboard
        </Link>
        <Link to="/matrix" className="text-blue-600 hover:underline text-sm">
          Matrix View
        </Link>
      </nav>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          IPTS R&D Loudness Dashboard
        </h1>
        <p className="text-gray-600">
          Real-time loudness level monitoring for MPEG-TS signals
        </p>
      </div>

      {/* Date Selector */}
      <div className="mb-6">
        <label htmlFor="date-select" className="block text-sm font-medium text-gray-700 mb-2">
          Select Date
        </label>
        <select
          id="date-select"
          value={selectedDate}
          onChange={handleDateChange}
          className="block w-48 rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        >
          {availableDates.map((dateStr) => (
            <option key={dateStr} value={dateStr}>
              {dateStr}
            </option>
          ))}
        </select>
      </div>

      {/* Loudness Matrix Table */}
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
                {timeSlots.map((slot) => (
                  <th key={slot} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {slot} (TIME OF SCAN)
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {matrixData.map((row, rowIndex) => (
                <tr key={rowIndex} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {row.channelName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 underline cursor-pointer">
                    {row.multicastIP}
                  </td>
                  {timeSlots.map((slot) => {
                    const reading = row.readings[slot];
                    const dbValue = reading ? reading.replace(' dB', '') : null;
                    const colorClass = getStatusColor(dbValue);
                    const statusText = getStatusText(dbValue);
                    
                    return (
                      <td key={slot} className="px-6 py-4 whitespace-nowrap text-center">
                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${colorClass}`}>
                          {reading || 'N/A'}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {statusText}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 bg-gray-50 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Color Legend</h3>
        <div className="flex space-x-6">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
            <span className="text-sm text-gray-600">Normal (-23.0 to -18.0 dB)</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-red-500 rounded mr-2"></div>
            <span className="text-sm text-gray-600">Too Low (&lt; -23.0 dB) / Too Loud (&gt; -18.0 dB)</span>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-500">Total Channels</h3>
          <p className="text-2xl font-bold text-gray-900">{matrixData.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-500">Time Slots</h3>
          <p className="text-2xl font-bold text-gray-900">{timeSlots.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-500">Date</h3>
          <p className="text-2xl font-bold text-gray-900">{selectedDate}</p>
        </div>
      </div>
    </div>
  );
};

export default LoudnessDashboard;