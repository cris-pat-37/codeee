import Lead from '../models/leadModel.js';
import axios from 'axios';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// @desc    Create new lead submission
// @route   POST /api/leads
// @access  Public
export const createLead = async (req, res) => {
  const { name, phone, email, message, propertySlug, propertyName } = req.body;

  if (!name || !phone || !email || !message || !propertySlug || !propertyName) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    let savedLead = null;
    let databaseType = 'MongoDB';
    const isMongoConnected = mongoose.connection.readyState === 1;

    if (isMongoConnected) {
      // 1a. Save to MongoDB
      const newLead = new Lead({
        name,
        phone,
        email,
        message,
        propertySlug,
        propertyName,
      });
      savedLead = await newLead.save();
      console.log('Lead saved successfully to MongoDB.');
    } else {
      // 1b. Fallback: Save to a local JSON file so no data is lost
      databaseType = 'Local JSON File';
      const fallbackFilePath = path.join(__dirname, '..', 'leads_fallback.json');
      
      const newLeadData = {
        name,
        phone,
        email,
        message,
        propertySlug,
        propertyName,
        createdAt: new Date().toISOString()
      };

      let leadsList = [];
      if (fs.existsSync(fallbackFilePath)) {
        try {
          const fileData = fs.readFileSync(fallbackFilePath, 'utf8');
          leadsList = JSON.parse(fileData);
        } catch (readErr) {
          console.error('Failed to read fallback leads file, resetting list:', readErr.message);
        }
      }

      leadsList.push(newLeadData);
      fs.writeFileSync(fallbackFilePath, JSON.stringify(leadsList, null, 2), 'utf8');
      console.log('MongoDB is offline. Lead saved to local fallback file leads_fallback.json.');
      savedLead = newLeadData;
    }

    // 2. Forward to Strapi CMS
    const strapiUrl = process.env.STRAPI_URL || 'http://localhost:1337';
    const strapiToken = process.env.STRAPI_API_TOKEN;

    const headers = {};
    if (strapiToken) {
      headers['Authorization'] = `Bearer ${strapiToken}`;
    }

    const strapiPayload = {
      data: {
        name,
        phone,
        email,
        message,
        propertySlug,
        propertyName,
      }
    };

    let strapiSaved = false;
    let strapiError = null;

    try {
      console.log(`Forwarding lead to Strapi at ${strapiUrl}/api/leads...`);
      await axios.post(`${strapiUrl}/api/leads`, strapiPayload, { headers });
      console.log('Lead successfully saved in Strapi CMS.');
      strapiSaved = true;
    } catch (err) {
      console.error(`Failed to save lead in Strapi: ${err.response?.data?.error?.message || err.message}`);
      strapiError = err.response?.data?.error?.message || err.message;
    }

    res.status(201).json({
      message: 'Lead submitted successfully',
      database: databaseType,
      lead: savedLead,
      strapiSync: {
        success: strapiSaved,
        error: strapiError
      }
    });
  } catch (error) {
    console.error(`Error saving lead: ${error.message}`);
    res.status(500).json({ message: 'Internal server error occurred while processing lead' });
  }
};
