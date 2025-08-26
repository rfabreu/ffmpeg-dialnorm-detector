# IPTS R&D Loudness Measurement System

A comprehensive system for measuring and monitoring the loudness levels of MPEG-TS signals across multiple channels. This system provides real-time analysis, data storage, and visualization for R&D purposes to normalize content across channels.

## System Overview

The system consists of three main components:

1. **Python Analyzer** - Processes MPEG-TS streams and measures loudness levels
2. **Supabase Database** - Stores stream definitions and measurement data
3. **React Web Dashboard** - Visualizes data with real-time updates and historical analysis

## Features

- **Real-time Monitoring**: Analyzes 10 IPTS signals simultaneously for 60 seconds each
- **Color-coded Visualization**: Green (normal), Yellow (too low), Red (too loud)
- **Historical Data**: View measurements by date with matrix view
- **Channel Management**: Automatic stream detection and management
- **Responsive Dashboard**: Modern UI with charts and status overview

## Architecture

```
CSV Input → Python Analyzer → Netlify Functions → Supabase → React Dashboard
```

## Prerequisites

- Python 3.8+
- FFmpeg installed and accessible in PATH
- Node.js 18+ (for web dashboard)
- Supabase account and database

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd ipts-loudness-system
```

### 2. Backend Setup (Python Analyzer)

```bash
cd analyzer
pip install -r requirements.txt
```

Create a `.env` file in the analyzer directory:

```env
API_ENDPOINT=https://your-netlify-app.netlify.app/.netlify/functions/submit
API_TOKEN=your-api-token
```

### 3. Frontend Setup (React Dashboard)

```bash
cd web
npm install
npm run dev
```

### 4. Netlify Functions Setup

```bash
cd functions
npm install
```

Set environment variables in Netlify:

```env
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

## Database Schema

### Streams Table
- `id` (UUID, Primary Key)
- `name` (Text) - Channel name
- `node` (Text) - Node identifier
- `profile` (Text) - Stream profile (low/high)
- `mcast_url` (Text) - Multicast URL
- `created_at` (Timestamp)

### Measurements Table
- `id` (UUID, Primary Key)
- `stream_id` (UUID, Foreign Key) - References streams.id
- `timestamp` (Timestamp) - Measurement time
- `min_db` (Float) - Minimum dB value
- `max_db` (Float) - Maximum dB value
- `avg_db` (Float) - Average dB value
- `status` (Text) - low/acceptable/loud
- `created_at` (Timestamp)

## Usage

### Running the Analyzer

```bash
cd analyzer
python analyze_low.py --csv your_channels.csv
```

The CSV should have columns:
- `Channel Name` - Name of the channel
- `Lowest Profile MCAST` - Multicast IP:port
- `NODE` - Node identifier

### Accessing the Dashboard

1. Start the development server: `npm run dev`
2. Open http://localhost:5173
3. Navigate between Dashboard and Matrix views

## Dashboard Views

### 1. Dashboard View (`/`)
- Real-time status overview
- Individual channel charts
- Color-coded loudness indicators
- Live data updates every 15 seconds

### 2. Matrix View (`/matrix`)
- Historical data by date
- Tabular format with time-based columns
- Color-coded dB values
- Date selection dropdown

## Loudness Thresholds

- **Too Low**: < -23.0 dB (Yellow)
- **Normal/Acceptable**: -23.0 to -22.0 dB (Green)
- **Too Loud**: > -22.0 dB (Red)

## API Endpoints

- `GET /api/streams` - List all streams
- `GET /api/measurements` - Get measurements (with optional `since` parameter)
- `GET /api/matrix?date=YYYY-MM-DD` - Get matrix data for specific date
- `GET /api/dates` - Get available dates
- `POST /api/submit` - Submit new measurement data

## Development

### Project Structure

```
├── analyzer/           # Python analysis scripts
│   ├── analyze_low.py # Main analysis script
│   ├── utils.py       # Utility functions
│   └── requirements.txt
├── functions/         # Netlify serverless functions
│   ├── submit.js      # Data submission endpoint
│   ├── measurements.js # Data retrieval endpoint
│   ├── streams.js     # Stream management
│   ├── matrix.js      # Matrix data endpoint
│   └── dates.js       # Date management
├── web/              # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── Dashboard.jsx    # Main dashboard view
│   │   │   └── MatrixView.jsx   # Matrix visualization
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
└── README.md
```

### Adding New Features

1. **Backend**: Add new Python scripts in `analyzer/`
2. **API**: Create new Netlify functions in `functions/`
3. **Frontend**: Add new React components in `web/src/components/`

## Troubleshooting

### Common Issues

1. **FFmpeg not found**: Ensure FFmpeg is installed and in PATH
2. **Database connection**: Check Supabase credentials in environment variables
3. **Port conflicts**: Ensure no other services are using the same ports

### Logs

- Python analyzer: Console output with progress bars
- Netlify functions: Check Netlify function logs
- Frontend: Browser console and network tab

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For technical support or questions, please open an issue in the repository or contact the development team.

