# Tirumakudalu Properties

Welcome to the **Tirumakudalu Properties** real estate platform. This repository contains a production-grade, consolidated MERN-stack application optimized for performance, simplicity, and low-cost deployment.

---

## 🏗️ Monorepo & Deployment Architecture

The codebase is organized as a monorepo containing three core services:
1. **`frontend/`**: A modern responsive web application built with React, Vite, TailwindCSS, and Framer Motion.
2. **`cms/`**: A Strapi CMS configuration used locally by administrators to seed, customize, and manage real estate listings.
3. **`backend/`**: An Express.js Node.js server that manages lead submissions and crawls properties.

### ⚡ The Consolidated 1-Server Production Model
To simplify maintenance and eliminate multiple hosting fees, the production environment is consolidated into **one single Express Node.js process**:
* **Frontend serving**: Express serves the compiled React frontend static files (`frontend/dist`) directly from the root path (`/`).
* **Direct SQLite Access**: Rather than running the Strapi CMS server in production, the Express backend reads all property metadata directly from the local SQLite database file (`data.db`).
* **Local Leads Database**: Forms and brochure downloads are saved directly into the local SQLite database, completely removing external MongoDB dependencies.
* **Consolidated Media**: All PDF brochures and rendering images are served statically via `/uploads` through the Express process.

---

## 🚀 Getting Started & Local Development

### 1. Developer Setup
Install dependencies in all folders:
```bash
# Install root/helper dependencies
npm install

# Install Frontend dependencies
cd frontend && npm install

# Install Express Backend dependencies
cd ../backend && npm install

# Install Strapi CMS dependencies
cd ../cms/strapi && npm install
```

### 2. Consolidated Server Startup
To start the consolidated backend server (which serves the compiled React UI and queries SQLite):
1. **Build the React UI:**
   ```bash
   cd frontend
   npm run build
   ```
2. **Start the Express Server:**
   ```bash
   cd ../backend
   npm run dev
   ```
3. **Access the application:**
   * Consolidated Site + APIs: [http://localhost:5000/](http://localhost:5000/)
   * Vite Frontend Dev Client (with hot-reloading): [http://localhost:5174/](http://localhost:5174/)

---

## 📋 Production Deployment Strategy

To deploy to production (e.g. Render, Railway, or VPS):

1. **Build the UI:** Run `npm run build` in the `/frontend` directory to compile static assets.
2. **Deploy to Render/Railway:** Create a single **Node.js Web Service** pointing to the `/backend` folder.
3. **Start Command:** Run `npm start`.
4. **Persistent Disk Storage:** Attach a persistent disk/volume mapped to `/cms/strapi/public/uploads` so that uploaded brochures and property rendering images remain persistent across server rebuilds.
5. **Environment Variables:** Set `PORT=5000` and `NODE_ENV=production`. No external databases or API tokens are required.

---

## 🛠️ Project Rules & Constraints
Please refer to [rules.md](file:///c:/Users/Sunny/OneDrive/Desktop/CodeCustomWhite/rules.md) for database seeding logic, size/pricing string normalization rules, layout formatting boundaries, and image display constraints.
