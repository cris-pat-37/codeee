# Tirumakudalu Properties

Welcome to the Tirumakudalu Properties web application repository. This is a MERN-stack real estate platform integrating a custom Express backend, a React frontend, and a Strapi CMS.

## Repository Structure

The project is structured as a monorepo containing three core services:

```text
├── backend/          # Express API server (Mongoose, Web Crawler/Scraper)
├── cms/              # Strapi CMS (sqlite3, content models, plugins)
│   └── strapi/       # Strapi application root
└── frontend/         # Vite + React client application (TailwindCSS, Leaflet map)
```

---

## Getting Started

### 1. Prerequisites
Ensure you have the following installed on your system:
* **Node.js** (v20+ recommended)
* **npm** (v10+ recommended)
* **MongoDB** (local server running, or remote URI)

### 2. Environment Setup
Create a `.env` file in the root directory. You can copy the template from `.env.example`:
```bash
cp .env.example .env
```

Configure the following environment variables in `.env` or in the respective directory's `.env` files:
```env
# Express Backend Server Config
PORT=5000
MONGO_URI=mongodb://localhost:27017/realestate
NODE_ENV=development

# Strapi CMS Integration
STRAPI_URL=http://localhost:1337
STRAPI_API_TOKEN=your_strapi_api_token_here

# React Frontend Config
VITE_STRAPI_URL=http://localhost:1337
VITE_BACKEND_URL=http://localhost:5000
```

---

## Services & Running Locally

### Backend Server (`/backend`)
An Express server that manages leads, coordinates property integrations, and implements web crawler utility scripts.
1. Navigate to directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server (uses `nodemon`):
   ```bash
   npm run dev
   ```

### Strapi CMS (`/cms/strapi`)
Strapi serves as the headless CMS for managing properties, dynamic fields, and user roles.
1. Navigate to directory:
   ```bash
   cd cms/strapi
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Strapi development server:
   ```bash
   npm run dev
   ```

### Frontend Client (`/frontend`)
A modern, responsive React web application built with Vite and TailwindCSS for smooth, fast UX.
1. Navigate to directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run local dev server:
   ```bash
   npm run dev
   ```
4. Build for production:
   ```bash
   npm run build
   ```

---

## Development Standards
* Avoid committing private credentials, API keys, or `.env` files directly to Git. Always use `.env.example` for documenting config schema updates.
* Ensure package dependencies are updated via local package files without committing global `node_modules` folders.
