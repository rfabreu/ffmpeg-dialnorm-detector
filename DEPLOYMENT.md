# Deployment Guide - IPTS Loudness Monitoring System

This guide provides step-by-step instructions for deploying the complete loudness monitoring system.

## Prerequisites

- **Netlify Account**: For hosting the web interface and API functions
- **Supabase Account**: For the database backend
- **Python 3.8+**: For running the analyzer locally
- **FFmpeg**: With EBU R128 support for audio analysis
- **Node.js 18+**: For building and deploying the web interface

## Step 1: Database Setup (Supabase)

1. **Create a new Supabase project**
2. **Set up the database tables**:

```sql
-- Create streams table
CREATE TABLE streams (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  node TEXT,
  profile TEXT NOT NULL,
  mcast_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create measurements table
CREATE TABLE measurements (
  id SERIAL PRIMARY KEY,
  stream_id INTEGER REFERENCES streams(id),
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  min_db NUMERIC(5,2),
  max_db NUMERIC(5,2),
  avg_db NUMERIC(5,2) NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_measurements_stream_id ON measurements(stream_id);
CREATE INDEX idx_measurements_timestamp ON measurements(timestamp);
CREATE INDEX idx_measurements_status ON measurements(status);
```

3. **Get your Supabase credentials**:
   - Project URL
   - Anon key
   - Service role key (for admin operations)

## Step 2: Deploy API Functions (Netlify)

1. **Install Netlify CLI**:
   ```bash
   npm install -g netlify-cli
   ```

2. **Navigate to functions directory**:
   ```bash
   cd functions
   ```

3. **Set environment variables**:
   ```bash
   netlify env:set SUPABASE_URL "your-supabase-url"
   netlify env:set SUPABASE_ANON_KEY "your-supabase-anon-key"
   netlify env:set SUPABASE_SERVICE_ROLE_KEY "your-supabase-service-role-key"
   ```

4. **Deploy functions**:
   ```bash
   netlify deploy --prod
   ```

5. **Note the function URLs** for the next step

## Step 3: Configure Analyzer

1. **Navigate to analyzer directory**:
   ```bash
   cd analyzer
   ```

2. **Create `.env` file**:
   ```bash
   API_ENDPOINT=https://your-netlify-app.netlify.app/.netlify/functions/submit
   API_TOKEN=your-secure-api-token
   ```

3. **Install Python dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Test the analyzer**:
   ```bash
   python3 test_analyzer.py sample_channels.csv
   ```

## Step 4: Deploy Web Interface

1. **Navigate to web directory**:
   ```bash
   cd web
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Build the application**:
   ```bash
   npm run build
   ```

4. **Deploy to Netlify**:
   ```bash
   netlify deploy --prod --dir=dist
   ```

## Step 5: Test the System

1. **Run the analyzer** with your actual CSV:
   ```bash
   cd analyzer
   python3 analyze_low.py --csv your_channels.csv
   ```

2. **Check the web interface** at your Netlify URL
3. **Verify data is being collected** in the Supabase dashboard

## Environment Variables Reference

### Netlify Functions
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: Public anon key for read operations
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key for admin operations

### Analyzer
- `API_ENDPOINT`: Full URL to your submit function
- `API_TOKEN`: Secure token for API authentication

## CSV Format Requirements

Your CSV file must contain these columns:
- `Channel Name`: Display name for the channel
- `NODE`: Node identifier
- `Lowest Profile MCAST`: Multicast IP:port for low profile
- `Highest Profile MCAST`: Multicast IP:port for high profile

Example:
```csv
Channel Name,NODE,Lowest Profile MCAST,Highest Profile MCAST
News Channel,Node A,239.1.1.1:5000,239.1.1.2:5000
Sports Channel,Node A,239.1.1.3:5000,239.1.1.4:5000
```

## Monitoring and Maintenance

1. **Check function logs** in Netlify dashboard
2. **Monitor database performance** in Supabase dashboard
3. **Review analyzer logs** for any FFmpeg errors
4. **Regular backups** of your Supabase database

## Troubleshooting

### Common Issues

1. **FFmpeg not found**: Install FFmpeg with EBU R128 support
2. **API errors**: Check environment variables and function URLs
3. **Database connection**: Verify Supabase credentials and network access
4. **Build failures**: Ensure Node.js version compatibility

### Support

- Check Netlify function logs for API errors
- Review Supabase query performance
- Verify CSV format matches requirements
- Test analyzer with sample data first

## Security Considerations

1. **API Token**: Use a strong, unique token for analyzer authentication
2. **Database Access**: Limit service role key usage to necessary operations
3. **Network Security**: Ensure multicast streams are accessible from analyzer location
4. **Data Privacy**: Review data retention policies for measurements

## Performance Optimization

1. **Batch Processing**: Analyzer processes 10 streams simultaneously
2. **Database Indexing**: Proper indexes on timestamp and stream_id
3. **Caching**: Web interface polls data every 15 seconds
4. **Compression**: Enable gzip compression in Netlify