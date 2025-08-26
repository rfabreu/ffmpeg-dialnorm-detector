import { Link } from "react-router-dom";

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6 max-w-6xl mx-auto">
        {/* Navigation Header */}
        <nav className="mb-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">IPTS R&D Loudness System</h1>
          <div className="flex space-x-4">
            <Link 
              to="/dashboard" 
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Dashboard
            </Link>
            <Link 
              to="/heatmap" 
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Heatmap
            </Link>
            <Link 
              to="/matrix" 
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Matrix View
            </Link>
          </div>
        </nav>

        {/* Welcome Content */}
        <div className="text-center py-16">
          <h2 className="text-4xl font-bold text-gray-800 mb-6">
            Welcome to the IPTS Loudness Analysis System
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            This system measures MPEG-TS signal loudness levels to help normalize content 
            and reduce discrepancies when users switch channels. Choose a view below to 
            analyze your data.
          </p>
          
          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Dashboard</h3>
              <p className="text-gray-600 mb-4">
                View individual channel loudness levels over time with color-coded status indicators.
              </p>
              <Link 
                to="/dashboard" 
                className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                View Dashboard
              </Link>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Heatmap</h3>
              <p className="text-gray-600 mb-4">
                Interactive heatmap visualization showing loudness levels across all channels and time periods.
              </p>
              <Link 
                to="/heatmap" 
                className="inline-block px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
              >
                View Heatmap
              </Link>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Matrix View</h3>
              <p className="text-gray-600 mb-4">
                Tabular data view with detailed measurements and status information for each channel.
              </p>
              <Link 
                to="/matrix" 
                className="inline-block px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
              >
                View Matrix
              </Link>
            </div>
          </div>

          {/* System Info */}
          <div className="mt-16 bg-white p-6 rounded-lg shadow-md max-w-4xl mx-auto">
            <h3 className="text-2xl font-semibold text-gray-800 mb-4">System Overview</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">Data Collection</h4>
                <ul className="text-gray-600 space-y-1">
                  <li>• Reads IP values from CSV files</li>
                  <li>• Analyzes 10 IPTS signals simultaneously</li>
                  <li>• 60-second measurement duration per signal</li>
                  <li>• Stores results in Supabase database</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">Loudness Standards</h4>
                <ul className="text-gray-600 space-y-1">
                  <li>• <span className="text-green-600 font-medium">Normal:</span> -23.0 to -22.0 dB</li>
                  <li>• <span className="text-yellow-600 font-medium">Too Low:</span> &lt; -23.0 dB</li>
                  <li>• <span className="text-red-600 font-medium">Too Loud:</span> &gt; -22.0 dB</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
