import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || (typeof window !== 'undefined' ? (window.location.port && window.location.port !== '80' && window.location.port !== '443' ? `${window.location.protocol}//${window.location.hostname}:5000` : window.location.origin) : 'http://localhost:5000');
const STRAPI_URL = BACKEND_URL; // Point to the single consolidated server!

const strapiClient = axios.create({
  baseURL: `${STRAPI_URL}/api`,
  timeout: 10000,
});

const backendClient = axios.create({
  baseURL: `${BACKEND_URL}/api`,
  timeout: 10000,
});

export const api = {
  // Get single property details by slug
  getPropertyBySlug: async (slug) => {
    try {
      // populate=* gets all relations and media fields (images, brochure, etc.)
      const response = await strapiClient.get(`/properties?filters[slug][$eq]=${slug}&populate=*`);
      // Strapi returns data wrap, usually { data: [ { id: 1, attributes: {...} } ] }
      // Or in Strapi v4/v5, response.data.data contains the list
      return response.data;
    } catch (error) {
      console.error(`Error fetching property by slug: ${error.message}`);
      throw error;
    }
  },

  // Get similar properties (same property type or same location)
  getSimilarProperties: async (propertyType, location, currentSlug) => {
    try {
      // In Strapi, we can search by type or location
      // Let's search properties of the same type OR location, excluding current property, limit to 4
      const city = location.split(',').pop()?.trim() || location;
      
      const response = await strapiClient.get(
        `/properties?filters[slug][$ne]=${currentSlug}&filters[$or][0][propertyType][$eq]=${propertyType}&filters[$or][1][location][$contains]=${city}&pagination[limit]=4&populate=*`
      );
      return response.data;
    } catch (error) {
      console.error(`Error fetching similar properties: ${error.message}`);
      // Fallback to empty array instead of failing
      return { data: [] };
    }
  },

  // Fetch all properties (catalog/listings)
  getAllProperties: async () => {
    try {
      const response = await strapiClient.get('/properties?populate=*&pagination[limit]=100');
      return response.data;
    } catch (error) {
      console.error(`Error fetching all properties: ${error.message}`);
      throw error;
    }
  },

  // Submit Lead Form to Express Backend
  submitLead: async (leadData) => {
    try {
      const response = await backendClient.post('/leads', leadData);
      return response.data;
    } catch (error) {
      console.error(`Error submitting lead form: ${error.message}`);
      throw error.response?.data || new Error('Failed to submit enquiry. Please try again.');
    }
  },

  // Helper to format Strapi image URLs
  getImageUrl: (imagePath) => {
    if (!imagePath) return '';
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    return `${STRAPI_URL}${imagePath}`;
  }
};
