# CW3 Explanation: Natural-Language Dispatch Builder for ILP

## Problem Statement and Motivation

The Informatics Large Practical (ILP) drone delivery system requires operators to construct precise `MedDispatchRec` objects with correct coordinates, timestamps, capacity requirements, and temperature constraints. In real-world NHS deployment scenarios, clinical staff—nurses, pharmacy technicians, and logistics coordinators—would interact with this system. These users are healthcare professionals, not software engineers. Expecting them to manually construct JSON payloads or navigate complex technical interfaces creates unnecessary friction and introduces significant error risk.

The core problem is the impedance mismatch between human intent and machine-readable dispatch data. When a pharmacist needs to send insulin to a patient at Ocean Terminal before 2pm, they shouldn't need to know that insulin requires cooling, that Ocean Terminal has coordinates [-3.18, 55.982], or that the payload weighs approximately 0.3kg. This knowledge gap creates bottlenecks, errors, and resistance to adoption.

## Target Users

This solution targets three primary user groups:

1. **Clinical Pharmacy Staff**: Pharmacists and technicians who prepare and dispatch medications daily. They understand drug properties but shouldn't need to translate that knowledge into dispatch parameters.

2. **Ward Coordinators**: NHS staff managing medication logistics across hospital departments. They work with urgency requirements and delivery schedules but lack technical training.

3. **Operations Supervisors**: Staff who need to review, validate, and replay scenarios for quality assurance, training, and incident investigation.

## Solution Overview

The Natural-Language Dispatch Builder is a web application that allows users to describe delivery requirements in plain English or paste prescription text, then automatically generates valid ILP dispatch records. The system provides immediate visual feedback through interactive maps, AI-powered analysis, and scenario persistence.

## Key Features

### Natural Language Processing

Users type requests like "Send 2kg of blood products requiring cooling to 55.95, -3.20 by 3pm tomorrow" or "Deliver insulin to Ocean Terminal." The system uses OpenAI's GPT-4 to parse intent, infer missing parameters, and construct valid `MedDispatchRec` objects. Ambiguous inputs generate clarification notes; invalid requests produce actionable warnings.

### Prescription Intelligence Panel

Beyond simple parsing, the system analyzes prescription text to provide pharmaceutical insights:
- Identifies medications and their typical storage requirements
- Flags temperature-sensitive items (biologics, vaccines, insulin)
- Highlights ambiguities ("no delivery time specified," "multiple addresses mentioned")
- Summarizes the prescription for quick review

This transforms the interface from a data-entry tool into an intelligent assistant that validates clinical correctness.

### Route Animation and Playback

Once routes are planned, users can visualize drone flight paths with animated playback. Controls include:
- Play/pause with variable speed (1x, 2x, 4x)
- Real-time display of step number, cumulative cost, and 16-point compass heading
- Visual drone marker traversing the calculated path

This feature serves both operational monitoring and educational purposes—new staff can understand how the system routes deliveries.

### Scenario Persistence

Users can save complete scenarios (input text, generated dispatches, calculated plan, route geometry) to localStorage. Saved scenarios can be reloaded for:
- Incident investigation ("what happened with that delivery?")
- Training new staff on typical dispatch patterns
- Comparing different route configurations
- Recovering from browser crashes during long sessions

## Technical Implementation

### Architecture

The application uses **Next.js 14** with the App Router for server-side rendering and API routes. The frontend is built with **React** and **TypeScript**, styled using **TailwindCSS** with custom CSS variables implementing a clean, industrial design system inspired by B2B SaaS applications like Rekki.

### LLM Integration

API routes proxy requests to **OpenAI's GPT-4** with carefully engineered system prompts. The prompts include:
- The complete `MedDispatchRec` schema
- Edinburgh-specific location references (Appleton Tower, Ocean Terminal)
- Temperature requirement guidelines for common pharmaceuticals
- Instructions to return structured JSON with notes and warnings

### Map Visualization

**React Leaflet** renders OpenStreetMap tiles with layers for:
- Service points (pickup locations)
- Restricted no-fly zones (George Square, Bayes Centre)
- Delivery markers
- Route polylines
- Animated drone position

### ILP Backend Integration

The application proxies requests to the ILP service for:
- `queryAvailableDrones`: Check which drones can fulfill requirements
- `calcDeliveryPathAsGeoJson`: Get route geometry for visualization
- Plan responses with total moves and costs

### State Management

React's `useState` hooks manage application state. Scenarios serialize to JSON for localStorage persistence. The animation system uses `setInterval` with speed multipliers, calculating headings from coordinate deltas using arctangent.

## Design Decisions

**Why React/Next.js?** Server-side rendering improves SEO and initial load performance. API routes keep OpenAI keys secure. TypeScript catches errors during development.

**Why custom CSS over component libraries?** Full control over the industrial aesthetic. No bloat from unused components. Consistent design tokens throughout.

**Why localStorage over a database?** Proof-of-concept simplicity. No backend infrastructure required. Data stays on user's device for privacy. Production deployment could add PostgreSQL.

**Why parallel API calls for prescription analysis?** Conversion and analysis are independent operations. Running them concurrently improves perceived performance without complicating error handling.

## Build Instructions

```bash
# Install dependencies
npm install

# Set environment variable
export OPENAI_API_KEY=your_key_here

# Run development server
npm run dev

# Build for production
npm run build && npm start
```

The application runs at `http://localhost:3000` and requires the ILP service at `http://localhost:8080`.

## Conclusion

This Natural-Language Dispatch Builder demonstrates how AI can bridge the gap between clinical workflows and technical systems. By accepting human-readable input and providing rich visual feedback, it makes ILP accessible to the healthcare professionals who would actually use it. The proof-of-concept validates the core idea while remaining extensible for production features like authentication, audit logging, and real-time drone tracking.

---
**Word Count: 978**
