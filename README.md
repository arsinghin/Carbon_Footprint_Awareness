# Carbon Footprint Awareness Platform

A modern, web-based platform designed to shift the focus from abstract carbon calculations to actionable behavioral changes through dynamic nudging and visual progress tracking.

## Features
- **Digital Forest**: Visualize your carbon savings as a growing forest.
- **Smart Nudges**: Receive actionable, context-aware suggestions based on your logged history.
- **What-If Simulator**: Instantly see how different choices impact your emissions.
- **Offline Resiliency**: Client falls back seamlessly to local mock calculations and storage if the backend is unreachable.

## Prerequisites
- Docker & Docker Compose
- Node.js (v18+)

## Setup Instructions

### 1. Run the Backend API
The backend is a FastAPI application that runs in a stateless container. For local development, it utilizes in-memory storage and mock authentication.

```bash
docker-compose up --build
```
The API will be available at `http://localhost:8080`.
API documentation is auto-generated at `http://localhost:8080/docs`.

### 2. Run the Frontend App
The frontend is a React Single Page Application (SPA) built with Vite and designed with a premium, accessible UI.

```bash
cd frontend
npm install
npm run dev
```
The application will be accessible at `http://localhost:5173`.

## Testing
To run the backend tests:
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pytest tests/
```
