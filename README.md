# ILP Dispatch Studio

Natural language interface for the ILP drone-based medicine delivery system. Type "Send 3kg insulin with cooling to Ocean Terminal at 2pm" and get valid ILP dispatches. Upload prescription PDFs and get pharmaceutical intelligence. Watch multi-drone routes animate on a map.

## Features

- **Natural Language Processing**: Plain English → structured ILP dispatches via GPT-4
- **Prescription Intelligence**: Upload PDFs/scans → OCR → drug interaction warnings + temperature requirements
- **Smart Geocoding**: Two-tier system (hardcoded Edinburgh locations + Google Maps API fallback)
- **Multi-Drone Route Planning**: Automatic ILP integration with visual route animation
- **Pharmaceutical Analysis**: Drug interactions, temperature requirements, quantity warnings
- **Scenario Persistence**: Save complete scenarios for training and audits
- **Industrial Design**: Professional healthcare UI with sharp edges, monospace fonts, high contrast

## Prerequisites

- **Node.js 18+**
- **ILP Backend**: Running at `localhost:8080` (your CW2 implementation)
- **OpenAI API Key**: For GPT-4 natural language parsing
- **Google Maps API Key**: For geocoding (optional - 9 Edinburgh locations work without it)

## Quick Start

```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env.local

# Edit .env.local with your API keys (see below)

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

Create `.env.local` in the project root:

```env
# Required: OpenAI API for natural language parsing and pharmaceutical analysis
OPENAI_API_KEY=sk-proj-your-openai-api-key-here

# Required: LLM Model (GPT-4 or compatible)
LLM_MODEL=gpt-4o

# Required: ILP Backend URL
ILP_BASE_URL=http://localhost:8080

# Optional: Google Maps API for geocoding unknown locations
# (9 Edinburgh locations work without this - Ocean Terminal, Royal Infirmary, etc.)
GOOGLE_MAPS_API_KEY=your-google-maps-api-key-here
```

### Environment Variables Reference

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `OPENAI_API_KEY` | **Yes** | OpenAI API key for GPT-4 | - |
| `LLM_MODEL` | **Yes** | Model identifier | `gpt-4o` |
| `ILP_BASE_URL` | **Yes** | ILP backend URL | `http://localhost:8080` |
| `GOOGLE_MAPS_API_KEY` | No | Google Maps API key for geocoding | - |

**Note**: Without `GOOGLE_MAPS_API_KEY`, the system uses 9 hardcoded Edinburgh locations (Royal Infirmary, Ocean Terminal, Appleton Tower, etc.). Unknown locations will show geocoding errors but can be manually edited.

## Usage

### 1. Natural Language Input

Type delivery instructions in plain English:

```
Send 3kg insulin with cooling to Ocean Terminal at 2pm
```

```
Deliver 2kg antibiotics at 10am AND 3.5kg surgical supplies with cooling at 2pm tomorrow
```

```
Send 7kg warm blood products to Royal Infirmary, needs heating, today at 4pm, max cost £50
```

The system:
1. Parses with GPT-4
2. Checks hardcoded location database (9 Edinburgh locations)
3. Geocodes unknown locations via Google Maps API
4. Returns complete dispatches with coordinates filled in

### 2. Prescription Upload

Upload prescription PDFs or scanned images:

1. **PDF Processing**: pdf-parse extracts text
2. **OCR**: Tesseract.js handles scanned images
3. **Analysis**: GPT-4 runs pharmaceutical checks in parallel:
   - Drug interactions (e.g., warfarin + aspirin)
   - Temperature requirements (e.g., insulin needs 2-8°C)
   - Quantity warnings (e.g., 50 vials suggests institutional use)
4. **Dispatch Creation**: Converts prescriptions to delivery dispatches

### 3. Route Planning

1. **Validate**: Check drone availability
2. **Plan Routes**: POST to ILP `/plan-routes`
3. **Animate**: Watch multi-drone routes with cost tracking
4. **Save**: Store scenarios for later review

### 4. Map Visualization

- Service points (Appleton Tower, Ocean Terminal)
- ILP restricted areas (George Square, Bristo Square, Bayes Central, Dr Elsie Inglis Quadrangle)
- Multi-drone routes (blue for first drone, green for others)
- Real-time animation with cost interpolation and compass heading

## API Routes

### `POST /api/nlp/parse-dispatches`

Natural language → structured dispatches

**Request:**
```json
{
  "inputText": "Send 2kg insulin to Ocean Terminal at 2pm",
  "defaultDate": "2025-11-28",
  "defaultTime": "14:00",
  "idBase": 1000
}
```

**Response:**
```json
{
  "dispatches": [{
    "id": 1000,
    "date": "2025-11-28",
    "time": "14:00",
    "requirements": { "capacity": 2, "cooling": true },
    "delivery": { "lng": -3.18, "lat": 55.982, "address": "Ocean Terminal, Edinburgh" }
  }],
  "notes": ["Recognized Ocean Terminal from location database"],
  "warnings": []
}
```

### `POST /api/prescriptions/extract-text`

PDF/Image → text extraction

**Request:** FormData with `file` field

**Response:**
```json
{
  "text": "PRESCRIPTION\nInsulin Glargine 100 units/mL\n...",
  "method": "pdf" | "ocr"
}
```

### `POST /api/prescriptions/convert`

Prescription text → dispatches

**Request:**
```json
{
  "text": "Insulin Glargine 50 vials...",
  "defaultDate": "2025-11-28",
  "defaultTime": "14:00",
  "idBase": 1000
}
```

### `POST /api/prescriptions/analyze`

Pharmaceutical analysis

**Response:**
```json
{
  "medications": [
    {
      "name": "Warfarin",
      "interactions": ["Major bleeding risk when combined with aspirin"],
      "temperature": "Room temperature (15-25°C)",
      "quantity": "28 tablets",
      "warnings": []
    }
  ],
  "overallWarnings": ["Warfarin + aspirin detected - major bleeding risk"]
}
```

### `POST /api/geocoding/forward`

Address → coordinates

**Request:**
```json
{ "address": "Ocean Terminal" }
```

**Response:**
```json
{
  "lat": 55.982,
  "lng": -3.18,
  "formattedAddress": "Ocean Terminal, Edinburgh, UK"
}
```

### `POST /api/geocoding/reverse`

Coordinates → address

**Request:**
```json
{ "lat": 55.982, "lng": -3.18 }
```

**Response:**
```json
{
  "address": "Ocean Terminal, Edinburgh, UK",
  "formattedAddress": "Ocean Terminal, Edinburgh, UK"
}
```

### `POST /api/ilp/query-available-drones`

Check drone availability

**Request:** Array of `MedDispatchRec` objects

**Response:**
```json
{
  "drones": ["1", "3", "9"]
}
```

### `POST /api/ilp/plan-routes`

Plan delivery routes

**Request:** Array of `MedDispatchRec` objects

**Response:**
```json
{
  "plan": {
    "totalCost": 0.0123,
    "totalMoves": 456,
    "dronePaths": [...]
  },
  "geojson": {
    "type": "MultiLineString",
    "coordinates": [[[lng, lat], ...], ...]
  }
}
```

## Known Edinburgh Locations

Hardcoded in GPT-4 system prompt (instant, no API calls):

- Royal Infirmary (lng: -3.177, lat: 55.940)
- Western General Hospital (lng: -3.235, lat: 55.963)
- St John's Hospital (lng: -3.519, lat: 55.895)
- Sick Kids / RHSC (lng: -3.212, lat: 55.922)
- Marchmont (lng: -3.198, lat: 55.935)
- Appleton Tower (lng: -3.1863580789, lat: 55.9446806671)
- Ocean Terminal (lng: -3.18, lat: 55.982)
- George Square (lng: -3.189, lat: 55.9437)
- Waverley Station (lng: -3.190, lat: 55.952)
- Edinburgh Airport (lng: -3.3725, lat: 55.9508)

Unknown locations trigger Google Maps geocoding automatically.

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── geocoding/
│   │   │   ├── forward/route.ts      # Address → coordinates
│   │   │   └── reverse/route.ts      # Coordinates → address
│   │   ├── ilp/
│   │   │   ├── query-available-drones/route.ts
│   │   │   └── plan-routes/route.ts
│   │   ├── nlp/
│   │   │   └── parse-dispatches/route.ts
│   │   └── prescriptions/
│   │       ├── analyze/route.ts       # Drug interaction analysis
│   │       ├── convert/route.ts       # Prescription → dispatches
│   │       └── extract-text/route.ts  # PDF/OCR
│   ├── globals.css                    # Custom design system
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── DispatchListEditor.tsx         # Edit/validate dispatches
│   ├── MapView.tsx                    # Leaflet map + animation
│   ├── NaturalLanguageInput.tsx       # Text input + prescription upload
│   ├── PlanSummary.tsx                # Cost/moves display
│   ├── PrescriptionInsights.tsx       # Drug analysis panel
│   └── SavedScenarios.tsx             # Scenario persistence
├── lib/
│   ├── geocoding.ts                   # Google Maps integration
│   ├── llm.ts                         # OpenAI GPT-4 calls
│   ├── medications.ts                 # Drug interaction database
│   ├── scenarios.ts                   # localStorage persistence
│   └── validation.ts                  # Dispatch validation
└── types/
    └── index.ts                       # TypeScript definitions
```

## Development

### Build for Production

```bash
npm run build
npm start
```

### TypeScript

Strict mode enabled. All components type-checked. No `any` types.

### Code Style

- Modular components (one concern per component)
- Server-side API routes for security (keys never reach browser)
- Debounced geocoding (1-second delay to avoid API spam)
- Error boundaries (OCR fails → show warning, keep dispatch)
- Validation at every layer (frontend, backend, ILP)

## Design Philosophy

**Industrial aesthetic**: Aviation cockpits, not consumer apps.

- **Sharp edges**: `border-radius: 0` conveys precision
- **Monospace fonts**: Data integrity signals (Diatype Mono)
- **High contrast**: `#000000` text on `#FFFFFF` background (readable under hospital fluorescent lighting)
- **Uppercase labels**: Matches aviation and logistics interfaces
- **Consistent spacing**: 0.875rem padding, 2.5-unit gaps

## Limitations

- **localStorage**: No multi-user access (production needs PostgreSQL)
- **No authentication**: Production needs user accounts
- **Google Maps API costs**: Scale requires budget
- **OCR accuracy**: Depends on scan quality
- **GPT-4 cost**: LLM calls add up at scale
- **Ambiguous parsing**: GPT-4 occasionally misinterprets unclear phrasing

## What Works

✅ Natural language → structured JSON
✅ Prescription PDFs/scans → dispatches
✅ Multi-drone route visualization
✅ Drug interaction warnings
✅ Temperature requirement detection
✅ Scenario save/load
✅ Validation at every layer
✅ Real-time cost tracking
✅ Geocoding (9 locations + Google Maps fallback)

## License

Part of ILP coursework.
