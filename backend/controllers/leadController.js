import Lead from '../models/leadModel.js';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { queryRun } from '../config/db.js';

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
    console.log(`[Lead Controller] New lead submission received from: ${email}`);

    // 1. Save to SQLite database (core production leads table)
    let sqliteSaved = false;
    let sqliteId = null;
    try {
      const result = await queryRun(
        'INSERT INTO leads (name, email, phone, property_title) VALUES (?, ?, ?, ?)',
        [name, email, phone, propertyName]
      );
      sqliteId = result.id;
      sqliteSaved = true;
      console.log(`[Lead Controller] Lead saved successfully to SQLite database (Row ID: ${sqliteId}).`);
    } catch (sqliteErr) {
      console.error(`[Lead Controller] Failed to save lead to SQLite database: ${sqliteErr.message}`);
    }

    // 2. Optional: Save to MongoDB if connected
    let mongoSaved = false;
    let savedLead = null;
    const isMongoConnected = mongoose.connection.readyState === 1;
    if (isMongoConnected) {
      try {
        const newLead = new Lead({
          name,
          phone,
          email,
          message,
          propertySlug,
          propertyName,
        });
        savedLead = await newLead.save();
        mongoSaved = true;
        console.log('[Lead Controller] Lead saved successfully to MongoDB.');
      } catch (mongoErr) {
        console.error(`[Lead Controller] Failed to save lead to MongoDB: ${mongoErr.message}`);
      }
    }

    // 3. Fallback: Save to a local JSON file as additional redundancy
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
        console.error('[Lead Controller] Failed to read fallback leads file, resetting list:', readErr.message);
      }
    }

    leadsList.push(newLeadData);
    fs.writeFileSync(fallbackFilePath, JSON.stringify(leadsList, null, 2), 'utf8');
    console.log('[Lead Controller] Lead successfully written to local JSON backup leads_fallback.json.');

    res.status(201).json({
      message: 'Lead submitted successfully',
      sqlite: {
        success: sqliteSaved,
        id: sqliteId
      },
      mongo: {
        success: mongoSaved,
        lead: savedLead
      },
      fallbackJson: true
    });
  } catch (error) {
    console.error(`[Lead Controller] Error saving lead: ${error.message}`);
    res.status(500).json({ message: 'Internal server error occurred while processing lead' });
  }
};
