# IPTS R&D Loudness Monitoring System

A comprehensive system for measuring and monitoring the loudness levels of MPEG-TS signals in real-time. This system helps normalize content across channels to minimize discrepancies when users switch between them.

## Features

- **Real-time Monitoring**: Analyzes 10 IPTS signals simultaneously for 60 seconds each
- **Dual Profile Support**: Handles both low and high profile multicast streams
- **Color-coded Dashboard**: Visual representation with green (normal), red (too low/too loud) indicators
- **Historical Data**: View measurements by date with hourly granularity
- **Multiple Views**: Dashboard, Charts, and Matrix views for different analysis needs

## System Architecture

### Backend Components

- **Analyzer** (`analyzer/analyze_low.py`): Python script that reads CSV data, processes multicast streams, and sends measurements to the database
- **API Functions** (`functions/`): Netlify functions for data retrieval and processing
- **Database**: Supabase for storing streams and measurements

### Frontend Components

- **Dashboard** (`/`): Main view with color-coded loudness matrix
- **Charts** (`/charts`): Bar chart visualization of loudness over time
- **Matrix View** (`/matrix`): Tabular data view with date selection

## Setup Instructions

### Prerequisites

- Python 3.8+
- FFmpeg with EBU R128 support
- Netlify account
- Supabase account

### Environment Variables

Create a `.env` file in the `analyzer/` directory:

```bash
API_ENDPOINT=https://your-netlify-function.netlify.app/.netlify/functions/submit
API_TOKEN=your-api-token
```

### Installation

1. **Install Python dependencies**:
   ```bash
   cd analyzer
   pip install -r requirements.txt
   ```

2. **Install Node.js dependencies**:
   ```bash
   cd web
   npm install
   ```

3. **Deploy functions**:
   ```bash
   cd functions
   netlify deploy --prod
   ```

### Usage

1. **Run the analyzer**:
   ```bash
   cd analyzer
   python analyze_low.py --csv your_channels.csv
   ```

2. **Start the web interface**:
   ```bash
   cd web
   npm run dev
   ```

## CSV Format

The analyzer expects a CSV file with the following columns:

- `Channel Name`: Name of the channel
- `NODE`: Node identifier
- `Lowest Profile MCAST`: Multicast IP:port for low profile
- `Highest Profile MCAST`: Multicast IP:port for high profile

## Loudness Standards

The system uses EBU R128 standards for loudness measurement:

- **Normal**: -23.0 dB to -18.0 dB (Green)
- **Too Low**: < -23.0 dB (Red)
- **Too Loud**: > -18.0 dB (Red)

## API Endpoints

- `GET /api/streams`: List all streams
- `GET /api/measurements`: Get measurements with optional filtering
- `GET /api/matrix?date=YYYY-MM-DD`: Get matrix data for a specific date
- `GET /api/dates`: Get available dates
- `GET /api/status`: Get real-time status summary
- `POST /api/submit`: Submit new measurements (used by analyzer)

## Data Flow

1. CSV file is processed by the analyzer
2. Multicast streams are analyzed using FFmpeg with EBU R128 filter
3. Measurements are sent to Supabase via API
4. Web interface displays data in real-time with color coding
5. Historical data is available for analysis and R&D purposes

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

