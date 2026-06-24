'use strict';

const fs = require('fs');
const path = require('path');

module.exports = {
  register() {},

  async bootstrap({ strapi }) {
    console.log('Running Strapi bootstrap script...');

    try {
      // 3. Configure placeholders and descriptions in Strapi's Content Manager
      console.log('Configuring placeholders and descriptions in Content Manager...');
      const store = strapi.store({
        type: 'plugin',
        name: 'content_manager',
      });
      const key = 'configuration_content_types::api::property.property';
      const config = await store.get({ key });
      if (config && config.metadatas) {
        const placeholders = {
          title: 'e.g. Ajmera Marina',
          slug: 'e.g. ajmera-marina',
          price: 'e.g. 1.69 Crores',
          location: 'e.g. Kempanahalli, Bangalore',
          shortDescription: 'e.g. Premium 3 BHK residences with lake-view panoramas and 50+ world-class amenities.',
          longDescription: 'e.g. <p>Detailed description of the layout, amenities, and location advantages...</p>',
          bedrooms: 'e.g. 3',
          bathrooms: 'e.g. 3',
          area: 'e.g. 1600 Sqft',
          projectStatus: 'e.g. Under Construction',
          possessionDate: 'e.g. Dec 2027',
          builderName: 'e.g. Tirumakudalu Properties',
          reraNumber: 'e.g. PRM/KA/RERA/1251/310/PR/180627/003456',
          latitude: 'e.g. 12.9716',
          longitude: 'e.g. 77.5946',
          youtubeVideo: 'e.g. https://www.youtube.com/watch?v=ScMzIvxBSi4',
          brochureUrl: 'e.g. https://example.com/brochure.pdf',
          mainImageUrl: 'e.g. https://example.com/main-image.jpg'
        };

        const descriptions = {
          bedrooms: 'Enter numbers only (e.g. 2, 3, 4)',
          bathrooms: 'Enter numbers only (e.g. 2, 3, 4)',
          area: 'Include units, e.g. "1600 Sqft" or "2400 Sqft"',
          price: 'Include scale unit, e.g. "1.69 Crores" or "85 Lakhs"',
          reraNumber: 'RERA Registration Number (leave blank if not applicable)',
          possessionDate: 'Expected completion date, e.g. "Dec 2027" or "Ready to Move"',
          latitude: 'Decimal format for Leaflet Map centering, e.g. 12.9716',
          longitude: 'Decimal format for Leaflet Map centering, e.g. 77.5946',
          youtubeVideo: 'YouTube Video link for virtual tour, e.g. https://www.youtube.com/watch?v=...',
          brochureUrl: 'Direct HTTP link to the PDF brochure, if not uploading directly',
          mainImageUrl: 'External WordPress upload path, e.g. https://tirumakudaluproperties.com/wp-content/uploads/...'
        };

        for (const field of Object.keys(placeholders)) {
          if (config.metadatas[field] && config.metadatas[field].edit) {
            config.metadatas[field].edit.placeholder = placeholders[field];
          }
        }

        for (const field of Object.keys(descriptions)) {
          if (config.metadatas[field] && config.metadatas[field].edit) {
            config.metadatas[field].edit.description = descriptions[field];
          }
        }

        await store.set({ key, value: config });
        console.log('Successfully set Content Manager custom placeholders and descriptions.');
      }
      // 1. Configure Public permissions automatically so frontend can query without tokens
      const publicRole = await strapi.query('plugin::users-permissions.role').findOne({ 
        where: { type: 'public' } 
      });

      if (publicRole) {
        console.log(`Found Public role (ID: ${publicRole.id}). Configuring permissions...`);
        const permissionQuery = strapi.query('plugin::users-permissions.permission');

        const permissionsToGrant = [
          'api::property.property.find',
          'api::property.property.findOne',
          'api::lead.lead.create'
        ];

        for (const action of permissionsToGrant) {
          const exists = await permissionQuery.findOne({
            where: { role: publicRole.id, action }
          });
          if (!exists) {
            await permissionQuery.create({
              data: { role: publicRole.id, action }
            });
            console.log(`Granted permission for: ${action}`);
          }
        }
      }

      // 2. Seed Mock Property Data from properties_rest.json
      const getPropertiesCount = async () => {
        if (strapi.documents) {
          const res = await strapi.documents('api::property.property').findMany({ fields: ['id'] });
          return res.length;
        } else if (strapi.entityService) {
          return await strapi.entityService.count('api::property.property');
        }
        return 0;
      };

      // Check if file properties_rest.json exists
      const restJsonPath = path.join(__dirname, '..', 'properties_rest.json');
      if (fs.existsSync(restJsonPath)) {
        console.log('Found crawled properties data file properties_rest.json. Seeding into Strapi...');
        const rawData = fs.readFileSync(restJsonPath, 'utf8');
        const wpProperties = JSON.parse(rawData);

        console.log(`Crawl file contains ${wpProperties.length} properties.`);

        let seededCount = 0;

        for (const wpProp of wpProperties) {
          const slug = wpProp.slug;
          const title = wpProp.title?.rendered || 'Untitled Property';
          
          // Check if property with slug already exists
          let exists = [];
          if (strapi.documents) {
            exists = await strapi.documents('api::property.property').findMany({ 
              filters: { slug } 
            });
          }

          if (exists.length === 0) {
            // Map WordPress property to Strapi schema
            const meta = wpProp.property_meta || {};
            const details = meta.REAL_HOMES_additional_details_list || [];

            // Helper to find additional details values
            const getDetailValue = (keySubstring, defaultValue = '') => {
              for (const pair of details) {
                if (pair[0]?.toLowerCase().includes(keySubstring.toLowerCase())) {
                  return pair[1];
                }
              }
              return defaultValue;
            };

            // Map price
            let price = meta.REAL_HOMES_property_price || 'Price on Request';
            if (price !== 'Price on Request' && meta.REAL_HOMES_property_price_postfix) {
              price = `${price} ${meta.REAL_HOMES_property_price_postfix}`;
            }

            // Map size
            let area = '1200 Sqft';
            if (meta.REAL_HOMES_property_size) {
              area = `${meta.REAL_HOMES_property_size} ${meta.REAL_HOMES_property_size_postfix || 'Sq Ft'}`;
            } else {
              area = getDetailValue('area', '1200 Sqft');
            }

            // Map builder
            const builderName = getDetailValue('builder', getDetailValue('developer', 'Tirumakudalu Properties'));
            
            // Map RERA
            const reraNumber = getDetailValue('rera', '');

            // Map status
            const projectStatus = getDetailValue('status', getDetailValue('construction', 'Under Construction'));

            // Map possession
            let possessionDate = 'Dec 2027';
            if (meta.REAL_HOMES_property_year_built) {
              possessionDate = `Dec ${meta.REAL_HOMES_property_year_built}`;
            }
            possessionDate = getDetailValue('possession', getDetailValue('year built', possessionDate));

            // Map images
            const wpImages = meta.REAL_HOMES_property_images || [];
            let mainImageUrl = 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80';
            let galleryImageUrls = [];

            if (wpImages.length > 0) {
              mainImageUrl = wpImages[0].full_url || wpImages[0].url;
              galleryImageUrls = wpImages.map(img => img.full_url || img.url).filter(Boolean);
            }

            // Map property type
            let propertyType = 'Apartment';
            const classes = wpProp.class_list || [];
            if (classes.includes('property-type-villa')) propertyType = 'Villa';
            if (classes.includes('property-type-plot') || classes.includes('property-type-land')) propertyType = 'Plot';
            if (classes.includes('property-type-commercial')) propertyType = 'Commercial';

            // Map amenities
            const amenities = [];
            for (const cls of classes) {
              if (cls.startsWith('property-feature-')) {
                const name = cls.replace('property-feature-', '').split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                amenities.push({ name, icon: 'check' });
              }
            }
            if (amenities.length === 0) {
              amenities.push({ name: 'Swimming Pool', icon: 'pool' });
              amenities.push({ name: 'Gymnasium', icon: 'gym' });
              amenities.push({ name: 'Clubhouse', icon: 'club' });
              amenities.push({ name: '24/7 Security', icon: 'security' });
            }

            // Map landmarks
            const nearbyPlaces = [
              { place: 'Local Transit Hub', distance: '0.8 km', category: 'Transit' },
              { place: 'Local High School', distance: '1.2 km', category: 'Education' },
              { place: 'Local Medical Center', distance: '2.0 km', category: 'Healthcare' }
            ];

            // Floor plans
            const floorPlans = [
              { title: 'Typical Floor Layout', size: area, image: 'https://images.unsplash.com/photo-1545464693-f1798a373343?auto=format&fit=crop&w=800&q=80' }
            ];

            const propertyData = {
              title,
              slug,
              price,
              location: meta.REAL_HOMES_property_address || 'Bangalore',
              shortDescription: wpProp.excerpt?.rendered?.replace(/<[^>]*>/g, '')?.substring(0, 180)?.trim() + '...',
              longDescription: wpProp.content?.rendered || '<p>Premium residential project featuring world-class amenities.</p>',
              propertyType,
              bedrooms: parseInt(meta.REAL_HOMES_property_bedrooms) || 3,
              bathrooms: parseInt(meta.REAL_HOMES_property_bathrooms) || 3,
              area,
              projectStatus,
              possessionDate,
              builderName,
              reraNumber,
              featured: meta.REAL_HOMES_featured === '1',
              latitude: parseFloat(meta.REAL_HOMES_property_location?.latitude) || 12.9716,
              longitude: parseFloat(meta.REAL_HOMES_property_location?.longitude) || 77.5946,
              youtubeVideo: 'https://www.youtube.com/watch?v=ScMzIvxBSi4',
              mainImageUrl,
              galleryImageUrls,
              amenities,
              nearbyPlaces,
              floorPlans,
              seoTitle: `${title} | Premium Project in ${meta.REAL_HOMES_property_address || 'Bangalore'}`,
              seoDescription: wpProp.excerpt?.rendered?.replace(/<[^>]*>/g, '')?.substring(0, 150)?.trim()
            };

            if (strapi.documents) {
              await strapi.documents('api::property.property').create({ data: propertyData });
            }
            seededCount++;
          }
        }
        console.log(`WordPress seed process finished. Seeded ${seededCount} new properties.`);
      } else {
        console.log('No properties_rest.json found, skipping WordPress seed.');
      }
    } catch (err) {
      console.error('Error during Strapi bootstrap script:', err.message || err);
    }
  },
};
