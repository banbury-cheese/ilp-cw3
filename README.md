# ILP Dispatch Builder

A natural-language dispatch builder for the ILP drone-based medicine delivery system. This web application allows dispatchers and pharmacists to type natural-language instructions and convert them into valid ILP MedDispatchRec objects, validate them, and plan + visualize routes using the existing ILP backend.

## Features

- **Natural Language Processing**: Describe deliveries in plain English and let AI convert them to structured dispatch data
- **Interactive Dispatch Editor**: Review, edit, and validate generated dispatches
- **Drone Availability Check**: Query which drones can fulfill your dispatch requirements
- **Route Planning**: Calculate optimal delivery routes using the ILP backend
- **Map Visualization**: View planned routes on an interactive map with service points and restricted areas
- **Client & Server Validation**: Comprehensive validation at both ends

## Prerequisites

- Node.js 18+
- npm or yarn
- Access to an ILP backend (CW2 endpoints)
- OpenAI API key (or compatible LLM API)

## Setup

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd ilp-cw3
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment variables**

   Create a `.env.local` file in the root directory:

   ```env
   # ILP Backend URL (without trailing slash)
   ILP_BASE_URL=http://localhost:8080/api/v1

   # LLM Configuration
   LLM_API_KEY=your-openai-api-key-here
   LLM_MODEL=gpt-4.1
   ```

4. **Run the development server**

   ```bash
   npm run dev
   ```

5. **Open the application**

   Navigate to [http://localhost:3000](http://localhost:3000)

## Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `ILP_BASE_URL` | Base URL for the ILP backend API | Yes | - |
| `LLM_API_KEY` | API key for the LLM service (OpenAI) | Yes | - |
| `LLM_MODEL` | Model identifier to use | No | `gpt-4.1` |

## Usage

### 1. Enter Natural Language Instructions

Type your delivery requirements in plain English. Examples:

- "Deliver 2kg of insulin that needs cooling to the Royal Infirmary tomorrow at 2pm"
- "Send 500g of warm blood samples to Western General Hospital today around 4pm, keep them heated"
- "Tomorrow morning: 1kg of vaccines (refrigerated) to Sick Kids, and in the afternoon send 750g of medication to Marchmont"

### 2. Review Generated Dispatches

The AI will parse your instructions and generate structured MedDispatchRec objects. You can:

- Edit any field (ID, date, time, capacity, cooling/heating, coordinates)
- Review notes explaining the AI's interpretation
- Check warnings about ambiguities or approximations

### 3. Check Available Drones

Click "Check Available Drones" to query which drones can fulfill your dispatch requirements based on their capacity and temperature control capabilities.

### 4. Plan Routes

Click "Plan Routes" to:

- Calculate optimal delivery paths
- View the route on the interactive map
- See total cost, moves, and drone assignments

## API Routes

### `POST /api/nlp/parse-dispatches`

Converts natural language to MedDispatchRec objects.

**Request:**
```json
{
  "inputText": "Deliver 2kg of insulin...",
  "defaultDate": "2025-12-22",
  "defaultTime": "14:00",
  "idBase": 1000
}
```

**Response:**
```json
{
  "dispatches": [...],
  "notes": [...],
  "warnings": [...]
}
```

### `POST /api/ilp/query-available-drones`

Queries available drones for given dispatches.

**Request:** Array of MedDispatchRec objects

**Response:**
```json
{
  "drones": ["1", "9"]
}
```

### `POST /api/ilp/plan-routes`

Plans delivery routes for dispatches.

**Request:** Array of MedDispatchRec objects

**Response:**
```json
{
  "plan": {
    "totalCost": 10.92,
    "totalMoves": 12,
    "dronePaths": [...]
  },
  "geojson": {
    "type": "LineString",
    "coordinates": [...]
  }
}
```

## MedDispatchRec Schema

```typescript
interface MedDispatchRec {
  id: number;              // Unique dispatch ID
  date: string;            // yyyy-MM-dd
  time: string;            // HH:mm (24h)
  requirements: {
    capacity: number;      // Weight in kg
    cooling?: boolean;     // Needs refrigeration
    heating?: boolean;     // Needs warming
    maxCost?: number;      // Cost limit
  };
  delivery: {
    lng: number;           // Longitude
    lat: number;           // Latitude
  };
}
```

## Known Locations

The system recognizes these Edinburgh locations:

- Royal Infirmary
- Western General Hospital
- St John's Hospital
- Sick Kids (Royal Hospital for Sick Children)
- Marchmont
- Appleton Tower
- Ocean Terminal
- George Square
- Waverley Station
- Edinburgh Airport

## Development

### Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── ilp/           # ILP backend proxy routes
│   │   └── nlp/           # NLP parsing route
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx           # Main application page
├── components/
│   ├── DispatchListEditor.tsx
│   ├── MapView.tsx
│   ├── NaturalLanguageInput.tsx
│   └── PlanSummary.tsx
├── lib/
│   ├── llm.ts             # LLM utility functions
│   └── validation.ts      # Validation utilities
└── types/
    └── index.ts           # TypeScript type definitions
```

### Build for Production

```bash
npm run build
npm start
```

## License

This project is part of the ILP coursework.
