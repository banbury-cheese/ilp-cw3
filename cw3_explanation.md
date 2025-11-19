# CW3 Explanation: Natural-Language Dispatch Builder for ILP

## Problem Statement and Motivation

The ILP drone delivery system requires operators to construct precise `MedDispatchRec` objects with correct coordinates, timestamps, and temperature constraints. Clinical staff—nurses, pharmacy technicians, logistics coordinators—are healthcare professionals, not engineers. Expecting them to manually construct JSON payloads creates friction and error risk.

The core problem is the impedance mismatch between human intent and machine-readable data. When a pharmacist needs to send insulin to Ocean Terminal before 2pm, they shouldn't need to know that insulin requires cooling, that Ocean Terminal has coordinates [-3.177, 55.981], or that the payload weighs 0.3kg. This knowledge gap creates bottlenecks and resistance to adoption.

## Target Users

1. **Clinical Pharmacy Staff**: Pharmacists who understand drug properties but shouldn't translate that knowledge into dispatch parameters.

2. **Ward Coordinators**: Staff managing medication logistics who work with urgency requirements but lack technical training.

3. **Operations Supervisors**: Staff who review scenarios for quality assurance, training, and compliance reporting.

## Solution Overview

The Natural-Language Dispatch Builder allows users to describe delivery requirements in plain English, automatically generates valid ILP dispatch records, visualizes routes, and provides compliance documentation.

## Key Features

### Natural Language Processing

Users type requests like "Send 3kg of insulin requiring cooling to 55.95, -3.19 tomorrow at 2pm." The system uses OpenAI's GPT-4 to parse intent, infer missing parameters, and construct valid `MedDispatchRec` objects. Ambiguous inputs generate clarification notes.

### Prescription Intelligence Panel

The system analyzes prescription text to provide pharmaceutical insights: identifies medications and storage requirements, flags temperature-sensitive items, highlights ambiguities ("no delivery time specified"), and summarizes for quick review.

### Route Animation and Playback

Users visualize drone flight paths with animated playback: play/pause with variable speed (1x, 2x, 4x), real-time display of step number, cumulative cost, and 16-point compass heading, plus a visual drone marker traversing the path.

### No-Fly Zone Editor (Sandbox Mode)

Users toggle sandbox mode to draw custom no-fly zones on the map. The system calculates impact by comparing original versus modified routes, showing cost and move differences with AI-generated analysis of the operational impact.

### GeoJSON Export & Regulator Report

One-click export of route data as GeoJSON for mapping tools. A regulator compliance report generator produces formal documentation covering route safety, no-fly zone compliance, and risk assessment for aviation authority submission.

### Scenario Persistence

Save complete scenarios to localStorage for incident investigation, staff training, configuration comparison, and session recovery.

## Technical Implementation

### Architecture

**Next.js 14** with App Router for server-side rendering. **React** and **TypeScript** frontend styled with **TailwindCSS** using custom CSS variables for a clean industrial design system.

### LLM Integration

API routes proxy to **OpenAI's GPT-4** with engineered prompts including the `MedDispatchRec` schema, Edinburgh location references (Appleton Tower at 55.9447,-3.1864; Ocean Terminal at 55.9812,-3.1773), temperature guidelines, and JSON output instructions.

### Map Visualization

**React Leaflet** renders OpenStreetMap with layers for service points, restricted zones (George Square, Bayes Centre, Bristo Square, Dr Elsie Inglis Quadrangle), delivery markers, route polylines, sandbox zones, and animated drone position.

### ILP Backend Integration

Proxies to ILP service: `queryAvailableDrones` checks which of the 10 drones can fulfill requirements based on capacity (4-20kg), cooling/heating capabilities, and availability schedules; `calcDeliveryPathAsGeoJson` returns route geometry.

### Polygon Drawing

Leaflet's `useMapEvents` hook captures clicks to build vertex arrays. Clicking near the first point closes the polygon. Custom zones display with dashed borders and compare against original routes.

## Design Decisions

**Why React/Next.js?** API routes keep OpenAI keys secure. TypeScript catches errors during development.

**Why custom CSS?** Full control over industrial aesthetic. Consistent design tokens.

**Why localStorage?** Proof-of-concept simplicity. Data stays on user's device. Production could add PostgreSQL.

**Why sandbox simulation instead of actual ILP modification?** The ILP backend doesn't accept custom restricted areas, but visual simulation with AI impact analysis demonstrates the concept effectively.

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

Runs at `http://localhost:3000`, requires ILP service at `http://localhost:8080`.

## Conclusion

This Natural-Language Dispatch Builder demonstrates how AI bridges clinical workflows and technical systems. By accepting human-readable input, providing visual feedback, enabling sandbox experimentation, and generating compliance documentation, it makes ILP accessible to healthcare professionals. The proof-of-concept validates the core idea while remaining extensible for production features like authentication and real-time tracking.

---
**Word Count: 698**
