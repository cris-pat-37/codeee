import { queryAll, queryGet } from '../config/db.js';

// Format flat SQLite row into Strapi REST JSON structure
const formatProperty = (row) => {
  if (!row) return null;

  let galleryImages = [];
  try {
    galleryImages = JSON.parse(row.gallery_image_urls || '[]');
  } catch (e) {
    galleryImages = [];
  }

  let floorPlans = [];
  try {
    floorPlans = JSON.parse(row.floor_plans || '[]');
  } catch (e) {
    floorPlans = [];
  }

  let amenities = [];
  try {
    amenities = JSON.parse(row.amenities || '[]');
  } catch (e) {
    amenities = [];
  }

  let nearbyPlaces = [];
  try {
    nearbyPlaces = JSON.parse(row.nearby_places || '[]');
  } catch (e) {
    nearbyPlaces = [];
  }

  let additionalDetails = {};
  try {
    additionalDetails = JSON.parse(row.additional_details || '{}');
  } catch (e) {
    additionalDetails = {};
  }

  return {
    id: row.id,
    documentId: row.document_id,
    title: row.title,
    slug: row.slug,
    price: row.price,
    location: row.location,
    shortDescription: row.short_description,
    longDescription: row.long_description,
    propertyType: row.property_type,
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms,
    area: row.area,
    projectStatus: row.project_status,
    possessionDate: row.possession_date,
    builderName: row.builder_name,
    reraNumber: row.rera_number,
    featured: Boolean(row.featured),
    latitude: row.latitude,
    longitude: row.longitude,
    youtubeVideo: row.youtube_video,
    brochureUrl: row.brochure_url,
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
    furnishing: row.furnishing,
    parking: row.parking,
    configuration: row.configuration,
    specialFeatures: row.special_features,
    additionalDetails: additionalDetails,
    
    // Strapi Media/Relation mocks
    mainImage: {
      data: row.main_image_url ? {
        id: 1,
        attributes: {
          url: row.main_image_url
        }
      } : null
    },
    galleryImages: {
      data: galleryImages.map((url, i) => ({
        id: i + 1,
        attributes: {
          url: url
        }
      }))
    },
    floorPlans: floorPlans,
    amenities: amenities,
    nearbyPlaces: nearbyPlaces
  };
};

// @desc    Get all properties or filter by query parameters (slug equality/similarity)
// @route   GET /api/properties
// @access  Public
export const getProperties = async (req, res) => {
  try {
    // 1. Check if filtering by slug: filters[slug][$eq]=value
    const slugEq = req.query.filters?.slug?.['$eq'];
    if (slugEq) {
      console.log(`[Consolidated API] Fetching property details for slug: ${slugEq}`);
      const row = await queryGet('SELECT * FROM properties WHERE slug = ?', [slugEq]);
      if (!row) {
        return res.json({ data: [] });
      }
      return res.json({ data: [formatProperty(row)] });
    }

    // 2. Check if filtering by slug inequality ($ne) for similar properties
    const slugNe = req.query.filters?.slug?.['$ne'];
    if (slugNe) {
      // similar query
      const propertyType = req.query.filters?.['$or']?.[0]?.propertyType?.['$eq'] || '';
      const locationContains = req.query.filters?.['$or']?.[1]?.location?.['$contains'] || '';
      
      console.log(`[Consolidated API] Fetching similar properties. Exclude: ${slugNe}, Type: ${propertyType}, Location matches: ${locationContains}`);
      
      const rows = await queryAll(`
        SELECT * FROM properties 
        WHERE slug != ? 
          AND (property_type = ? OR location LIKE ?) 
        LIMIT 4
      `, [slugNe, propertyType, `%${locationContains}%`]);
      
      return res.json({ data: rows.map(formatProperty) });
    }

    // 3. Otherwise, return all properties (up to limit)
    const limit = parseInt(req.query.pagination?.limit || '100', 10);
    console.log(`[Consolidated API] Fetching all properties, limit: ${limit}`);
    
    const rows = await queryAll('SELECT * FROM properties LIMIT ?', [limit]);
    return res.json({ data: rows.map(formatProperty) });
  } catch (error) {
    console.error('[Consolidated API] Error fetching properties from SQLite:', error.message);
    res.status(500).json({ error: 'Failed to retrieve properties from SQLite database.' });
  }
};
