# Event Booking System

A full-stack web application for browsing events, checking availability, making bookings, and managing existing bookings. The project was built as a mini-project by Team 4.

## Features

- Browse upcoming events and view event details.
- Filter events by category and date.
- Filter for events with available places.
- Sort event listings using the supported sorting options.
- View event capacity and availability.
- Book between 1 and 4 places for an event.
- Find an existing booking using the customer's phone number and booking code.
- Cancel a booking before the event starts, when cancellation is allowed.
- Validate booking requests and return readable API error messages.
- Serve event images from the backend.

## Tech Stack

### Frontend
- React 18
- TypeScript
- Vite
- React Router
- Redux Toolkit / React Redux

### Backend
- NestJS 10
- TypeScript
- class-validator and class-transformer
- Express
- Jest for tests

## Project Structure

```text
.
├── api/                    # NestJS backend
│   ├── public/images/      # Event images
│   ├── src/
│   │   ├── bookings/       # Booking creation, lookup and cancellation
│   │   ├── events/         # Event listing and event details
│   │   ├── common/         # Validation helpers and shared utilities
│   │   └── store/          # Seed data and in-memory store
│   └── package.json
├── client/                 # React frontend
│   ├── src/
│   │   ├── api/            # Frontend API requests
│   │   ├── components/     # Shared UI components
│   │   └── pages/          # Events, details, booking and management pages
│   └── package.json
├── Doc/                    # Project documentation and team task PDFs
├── API-Contract.md         # Frontend/backend API contract
└── README.md
```

## Requirements

Install the following before running the project:

- Node.js (a current LTS release is recommended)
- npm

## Getting Started

Run the backend and frontend in separate terminal windows.

### 1. Start the backend

```bash
cd api
npm install
npm run start:dev
```

The NestJS API runs at:

```text
http://localhost:3000
```

Event images are served from the backend under `/images/`.

### 2. Start the frontend

In a second terminal, from the project root:

```bash
cd client
npm install
npm run dev
```

Vite prints the local frontend URL in the terminal (typically `http://localhost:5173`).

The frontend API modules currently use `http://localhost:3000` as their API base URL. Make sure the backend is running before using the frontend.

### Production build

Build the frontend:

```bash
cd client
npm run build
```

Build the backend:

```bash
cd api
npm run build
```

## Application Pages

| Page | Route | Purpose |
| --- | --- | --- |
| Events | `/` | Browse and filter events |
| Event details | `/events/:id` | View details and availability |
| Booking form | `/events/:id/book` | Create a booking |
| Confirmation | `/confirmation` | Display booking confirmation |
| Manage booking | `/manage` | Find and manage an existing booking |

## API Reference

Base URL: `http://localhost:3000`

### Events

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/events` | List events; accepts optional query parameters |
| `GET` | `/events/:id` | Get one event by ID |

Supported `GET /events` query parameters:

- `category` — filter by event category.
- `date` — filter by date in `YYYY-MM-DD` format.
- `availableOnly=true` — include events with availability.
- `includePast=true` — include past events.
- `sortBy` — select a supported sorting option.
- `asc=true` or `asc=false` — choose sort direction when sorting is selected.

Example:

```bash
curl "http://localhost:3000/events?category=Workshop&availableOnly=true"
```

### Bookings

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/bookings` | Create a booking |
| `GET` | `/bookings/find?phone=...&code=...` | Find a booking using phone and code |
| `PATCH` | `/bookings/:id/cancel` | Cancel a booking |

Create-booking request body:

```json
{
  "eventId": 3,
  "customerName": "Sara Ahmad",
  "customerPhone": "0933123456",
  "places": 2
}
```

Find a booking:

```bash
curl "http://localhost:3000/bookings/find?phone=0933123456&code=EV-2093"
```

Cancel a booking by ID (the phone number must match the booking):

```bash
curl -X PATCH "http://localhost:3000/bookings/101/cancel" \
  -H "Content-Type: application/json" \
  -d '{"phone":"0933123456"}'
```

### Booking rules

- A booking must reference an existing event.
- The event must not have started.
- The requested number of places must be available.
- Each booking is for 1–4 places.
- The same phone number cannot have more than one active booking for the same event.
- A booking can only be cancelled if it is still active and the event has not started.
- Phone numbers are normalized by removing spaces and dashes; booking codes are matched without case sensitivity.

Errors are returned as JSON with a `statusCode` and a readable `message`.

## Data Storage

The current backend uses seeded in-memory data rather than a persistent database. Data created or changed while the server is running may be lost when the backend restarts. This setup is suitable for a demonstration or mini-project, but a production deployment should use persistent storage.

## Testing and Code Quality

Backend commands (run from `api/`):

```bash
npm test
npm run test:e2e
npm run lint
```

Frontend lint command (run from `client/`):

```bash
npm run lint
```

These commands are available in the project; run them locally to verify the current state of the code.

## Documentation

- [`API-Contract.md`](./API-Contract.md) — API data shapes and integration rules.
- [`Doc/`](./Doc/) — UI design, review notes, pull request guide, and team task documents.

## Notes

- The API contract documents `POST /bookings/find` and `POST /bookings/:id/cancel`, but the current backend implementation uses `GET /bookings/find` and `PATCH /bookings/:id/cancel`. This README documents the implemented routes.
- The frontend currently calls the API at `http://localhost:3000` directly. Configure the API base URL if the backend is hosted elsewhere.
