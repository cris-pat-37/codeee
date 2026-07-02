# Tirumakudalu Properties

Welcome to the **Tirumakudalu Properties** web application repository. This is a production-grade, MERN-stack real estate platform built to integrate a robust custom Express backend, a modern React client, and a Strapi headless CMS.

## Key Features

* **Modern Responsive UI**: Built with React, Vite, TailwindCSS, and Framer Motion, presenting an interactive user experience optimized for mobile, tablet, and desktop viewports.
* **Headless CMS (Strapi)**: Extended database schema to handle rich real estate metrics, including configuration, furnishing, parking, special features, and JSON-based additional details metadata.
* **Automatic Geocoding Lifecycle**: Leverages OpenStreetMap Nominatim API via custom Strapi lifecycle hooks to automatically resolve latitude and longitude coordinates from plain text property locations if left blank.
* **Gated Brochure Lead Capture**: Captures contact leads (name, phone, email) dynamically prior to PDF downloads, automatically persisting the information to the lead database and fallback JSON storage.
* **Smart Data Normalizers**: Intelligent client-side formatters resolving starting price points and area units from unstructured database fields cleanly across listing pages.
* **Monorepo Architecture**: Clean separation between services for simple local development, containerization, and production deployment.

## Repository Structure

```text
├── backend/          # Express API server (Mongoose, Leads Management, WP crawler script)
├── cms/              # Headless CMS service
│   └── strapi/       # Strapi application root (SQLite, schemas, lifecycle hooks)
├── frontend/         # Vite + React web application (TailwindCSS, Leaflet Map)
└── README.md         # Repository documentation
```

---

## Setup & Local Development

### 1. Prerequisites
Ensure you have the following installed locally:
* **Node.js** (v20 or higher recommended)
* **npm** (v10 or higher)
* **MongoDB** (running locally or a remote MongoDB Atlas URI)

### 2. Environment Configurations
A template is provided in the root directory. Copy it to create your local variables:
```bash
cp .env.example .env
```
Ensure you create local `.env` files in the respective service directories (`/backend`, `/cms/strapi`, and `/frontend`) or set them globally matching the schema below:

```env
# Express Backend Config
PORT=5000
MONGO_URI=mongodb://localhost:27017/realestate
NODE_ENV=development

# Strapi CMS Config
STRAPI_URL=http://localhost:1337
STRAPI_API_TOKEN=your_strapi_api_token_here

# React Frontend Config
VITE_STRAPI_URL=http://localhost:1337
VITE_BACKEND_URL=http://localhost:5000

# WordPress Crawler Config (for database seeding)
WP_URL=https://tirumakudaluproperties.com
WP_CRAWLER_USER=your_email@example.com
WP_CRAWLER_PASSWORD=your_wordpress_application_password
```

---

## Service Commands

### Backend Server (`/backend`)
An Express.js API managing property leads and web scraper utilities.
1. Navigate to directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server (runs with nodemon):
   ```bash
   npm run dev
   ```

### Strapi CMS (`/cms/strapi`)
The headless CMS managing content models, plugins, and automatic geocoding lifecycles.
1. Navigate to directory:
   ```bash
   cd cms/strapi
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Strapi CMS server:
   ```bash
   npm run dev
   ```

### Frontend Client (`/frontend`)
The responsive React web application.
1. Navigate to directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run dev server:
   ```bash
   npm run dev
   ```
4. Build for production:
   ```bash
   npm run build
   ```

---

## Database Seeding Workflow

To seed Strapi with real property data fetched from the source WordPress REST API, follow these steps:

1. **Configure Crawler Credentials**: Add your WordPress username and Application Password in `backend/.env`.
2. **Execute Crawler**:
   ```bash
   cd backend
   node wp_crawler.js
   ```
   This will output a `properties_rest.json` file in the `backend` directory.
3. **Move Data to CMS**: Copy the generated file into the Strapi folder:
   * **On Windows (PowerShell)**:
     ```powershell
     Copy-Item backend/properties_rest.json cms/strapi/properties_rest.json
     ```
   * **On macOS/Linux (Bash)**:
     ```bash
     cp backend/properties_rest.json cms/strapi/properties_rest.json
     ```
4. **Trigger Seeding**: Start the Strapi server:
   ```bash
   cd cms/strapi
   npm run dev
   ```
   The bootstrap lifecycle will automatically detect `properties_rest.json`, parse the properties, resolve the custom metadata field mappings, and seed them into your local Strapi database.

## Development Standards
* Never commit active credentials, session secrets, API tokens, or `.env` files to git.
* Keep the SQLite database files and dynamic media uploads outside version control (configured via `.gitignore`).
* Ensure all new API endpoints, model migrations, or UI views are thoroughly tested locally.
