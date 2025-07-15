# ASX ETF Performance Dashboard

A modern, responsive dashboard that displays the top 10 highest performing ASX-listed ETFs across different time periods.

## Features

- View top 10 ETFs by performance over 1 month, 1 year, 5 years, and 10 years
- Toggle between table and chart views
- Performance metrics include dividends reinvested
- Display key metrics including MER and AUM
- Responsive design for all screen sizes
- Modern UI with Tailwind CSS

## Technical Stack

- React 18 with TypeScript
- Tailwind CSS for styling
- Recharts for data visualization
- Heroicons for icons
- Headless UI for accessible components

## Prerequisites

- Node.js 16+ and npm

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm start
   ```

## Project Structure

```
src/
  ├── components/     # React components
  ├── types/         # TypeScript type definitions
  ├── App.tsx        # Main application component
  ├── index.tsx      # Application entry point
  └── index.css      # Global styles
```

## Data Sources

The dashboard currently uses mock data for development. In a production environment, it would fetch real-time data from:
- ASX ETF data feeds
- ETF provider APIs
- Market data providers

## Fee Information

The dashboard includes the following fee metrics:
- Management Expense Ratio (MER)
- Trading expenses
- Total expense ratio

## Future Enhancements

- Add real-time data integration
- Implement detailed ETF profile pages
- Add performance comparison features
- Include more fee metrics and analysis tools
- Add export functionality for data
- Implement user preferences and saved views 