import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';

import { connectMongoDB } from './config/db.js';
import leadRoutes from './routes/leadRoutes.js';
import propertyRoutes from './routes/propertyRoutes.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB optionally
connectMongoDB();

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middlewares
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// 1. Serve Uploads Folder (Local property images and PDF brochures)
const uploadsPath = path.resolve(__dirname, '../cms/strapi/public/uploads');
console.log(`[Consolidated Server] Serving uploads static folder from: ${uploadsPath}`);
app.use('/uploads', express.static(uploadsPath));

// 2. Serve built static React client SPA files
const frontendDistPath = path.resolve(__dirname, '../frontend/dist');
console.log(`[Consolidated Server] Serving frontend static assets from: ${frontendDistPath}`);
app.use(express.static(frontendDistPath));

// Basic Health Check Route
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Consolidated Real Estate Platform API is running.' });
});

// API Routes
app.use('/api/leads', leadRoutes);
app.use('/api/properties', propertyRoutes);

// 3. Fallback all non-API GET requests to React index.html for SPA Client routing
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
    return next();
  }
  res.sendFile(path.join(frontendDistPath, 'index.html'), (err) => {
    if (err) {
      res.status(404).send('Frontend static assets are not built yet. Run npm run build in frontend directory.');
    }
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong on the server!' });
});

// Port Configuration
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Consolidated Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
