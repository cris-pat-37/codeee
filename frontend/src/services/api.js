import axios from 'axios';

// Supabase REST API configuration
const SUPABASE_URL = 'https://nwlsuypykquxqqymtvuk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53bHN1eXB5a3F1eHFxeW10dnVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ3NDk4MjQsImV4cCI6MjEwMDMyNTgyNH0.1WrpPgEQVpsOts6VxyQqKj8OZEnsAeA0Vhgi6SD2Xo4';

const supabaseClient = axios.create({
  baseURL: `${SUPABASE_URL}/rest/v1`,
  timeout: 15000,
  headers: {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json'
  }
});

// Backend URL for lead form submissions (falls back gracefully)
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5000');

const backendClient = axios.create({
  baseURL: `${BACKEND_URL}/api`,
  timeout: 10000,
});

// Normalize Supabase snake_case fields to camelCase for frontend components
const normalizeProperty = (p) => ({
  ...p,
  // Map snake_case DB fields to camelCase frontend fields
  propertyType: p.property_type || p.propertyType || '',
  builderName: p.builder_name || p.builderName || '',
  reraNumber: p.rera_no || p.reraNumber || '',
  price: p.price_display || p.price || '',
  area: p.area_display || p.area || '',
  areaSqft: p.area_sqft || p.areaSqft || 0,
  shortDescription: p.description || p.shortDescription || '',
  longDescription: p.description || p.longDescription || '',
  projectStatus: p.status === 'For Sale' ? 'Under Construction' : (p.projectStatus || p.status || ''),
  possessionDate: p.completion_date || p.possessionDate || '',
  mainImageUrl: p.image_url || p.mainImageUrl || '',
  image_url: p.image_url || '',
  gallery: p.gallery || [],
  galleryImageUrls: p.gallery || [],
  brochureUrl: p.brochure_url || p.brochureUrl || '',
  youtubeVideo: p.video_url || p.youtubeVideo || '',
  floorPlanUrl: p.floor_plan_url || p.floorPlanUrl || '',
  floorPlans: (p.slug === 'ajmeera-marina' || p.title === 'Ajmeera Marina') ? [
    { title: '2 BHK Floor Plan', size: '1,200 Sq.ft', image: 'https://raw.githubusercontent.com/cris-pat-37/codeee/main/frontend/public/uploads/ajmeera-marina-fp-2bhk.jpg' },
    { title: '3 BHK Series 1 (West Facing)', size: '1,600 Sq.ft', image: 'https://raw.githubusercontent.com/cris-pat-37/codeee/main/frontend/public/uploads/ajmeera-marina-fp-3bhk-west.jpg' },
    { title: '3 BHK Series 2', size: '1,600 Sq.ft', image: 'https://raw.githubusercontent.com/cris-pat-37/codeee/main/frontend/public/uploads/ajmeera-marina-fp-3bhk-s2.jpg' },
    { title: '3 BHK Series 3 (East Facing)', size: '1,600 Sq.ft', image: 'https://raw.githubusercontent.com/cris-pat-37/codeee/main/frontend/public/uploads/ajmeera-marina-fp-3bhk-east.jpg' },
    { title: 'Typical Floor Plan (Tower G)', size: 'Tower G Layout', image: 'https://raw.githubusercontent.com/cris-pat-37/codeee/main/frontend/public/uploads/ajmeera-marina-fp-tower-g.jpg' },
    { title: 'Typical Floor Plan (Tower H)', size: 'Tower H Layout', image: 'https://raw.githubusercontent.com/cris-pat-37/codeee/main/frontend/public/uploads/ajmeera-marina-fp-tower-h.jpg' },
    { title: '10.5 Acre Master Plan', size: '10.5 Acres Layout', image: 'https://raw.githubusercontent.com/cris-pat-37/codeee/main/frontend/public/uploads/ajmeera-marina-master-plan.jpg' }
  ] : (p.slug === 'elixir' || p.title === 'DSR Elixir' || p.title === 'Elixir') ? [
    { title: '4 BHK Villa Floor Plan', size: '2,705 Sq.ft', image: 'https://raw.githubusercontent.com/cris-pat-37/codeee/main/frontend/public/uploads/elixir-fp-4bhk.jpg' },
    { title: '21.11 Acre Master Layout', size: '21.11 Acres', image: 'https://raw.githubusercontent.com/cris-pat-37/codeee/main/frontend/public/uploads/elixir-master-plan.jpg' }
  ] : (p.slug === 'mea-meadows' || p.title === 'Mea & Meadows') ? [
    { title: '3 BHK Floor Plan', size: '2,061 Sq.ft', image: 'https://raw.githubusercontent.com/cris-pat-37/codeee/main/frontend/public/uploads/mea-meadows-fp-3bhk.jpg' },
    { title: '4 BHK Floor Plan', size: '3,244 Sq.ft', image: 'https://raw.githubusercontent.com/cris-pat-37/codeee/main/frontend/public/uploads/mea-meadows-fp-4bhk.jpg' },
    { title: '87% Open Space Master Layout', size: 'Master Plan', image: 'https://raw.githubusercontent.com/cris-pat-37/codeee/main/frontend/public/uploads/mea-meadows-master-plan.jpg' }
  ] : (p.slug === 'mizumi-reserve' || p.title === 'Mizumi Reserve') ? [
    { title: '3 BHK Floor Plan', size: '1,900 Sq.ft', image: 'https://raw.githubusercontent.com/cris-pat-37/codeee/main/frontend/public/uploads/mizumi-reserve-fp-3bhk.jpg' },
    { title: '4 BHK Floor Plan', size: '2,500 Sq.ft', image: 'https://raw.githubusercontent.com/cris-pat-37/codeee/main/frontend/public/uploads/mizumi-reserve-fp-4bhk.jpg' },
    { title: '80-Acre Master Layout', size: 'Master Plan', image: 'https://raw.githubusercontent.com/cris-pat-37/codeee/main/frontend/public/uploads/mizumi-reserve-master-plan.jpg' }
  ] : (p.slug === 'everfine-straatosphere' || p.title === 'Everfine Straatosphere') ? [
    { title: '4 BHK Sky Villa (3,411 Sq.ft)', size: '3,411 Sq.ft', image: 'https://raw.githubusercontent.com/cris-pat-37/codeee/main/frontend/public/uploads/everfine-fp-4bhk-north.jpg' },
    { title: '4 BHK Grand Sky Villa (3,456 Sq.ft)', size: '3,456 Sq.ft', image: 'https://raw.githubusercontent.com/cris-pat-37/codeee/main/frontend/public/uploads/everfine-fp-4bhk-east.jpg' }
  ] : (p.slug === 'habulus-tranquility' || p.title === 'Habulus Tranquility') ? [
    { title: 'Master Typical Floor Plan', size: '1,200 - 1,650 Sq.ft', image: 'https://raw.githubusercontent.com/cris-pat-37/codeee/main/frontend/public/uploads/habulus-tranquility-fp-1.jpg' },
    { title: '5-Acre Master Layout', size: '5 Acres', image: 'https://raw.githubusercontent.com/cris-pat-37/codeee/main/frontend/public/uploads/habulus-tranquility-master-plan.jpg' }
  ] : (p.slug === 'the-ascent' || p.title === 'The Ascent') ? [
    { title: '2 BHK Floor Plan (1,295 Sq.ft)', size: '1,295 Sq.ft', image: 'https://raw.githubusercontent.com/cris-pat-37/codeee/main/frontend/public/uploads/the-ascent-fp-2bhk.jpg' },
    { title: '3 BHK Floor Plan (1,571 Sq.ft)', size: '1,571 Sq.ft', image: 'https://raw.githubusercontent.com/cris-pat-37/codeee/main/frontend/public/uploads/the-ascent-fp-3bhk.jpg' },
    { title: '3 BHK Grand Floor Plan (1,885 Sq.ft)', size: '1,885 Sq.ft', image: 'https://raw.githubusercontent.com/cris-pat-37/codeee/main/frontend/public/uploads/the-ascent-fp-3bhk-grand.jpg' },
    { title: '4-Acre Master Layout', size: '4 Acres', image: 'https://raw.githubusercontent.com/cris-pat-37/codeee/main/frontend/public/uploads/the-ascent-master-plan.jpg' }
  ] : (p.slug === 'kumar-plumeria' || p.title === 'Kumar Plumeria' || p.title === 'Plumeria') ? [
    { title: '3.5 BHK Floor Plan (2,680 Sq.ft)', size: '2,680 Sq.ft', image: 'https://raw.githubusercontent.com/cris-pat-37/codeee/main/frontend/public/uploads/kumar-plumeria-fp-3-5bhk.jpg' },
    { title: '4.5 BHK Floor Plan (3,070 Sq.ft)', size: '3,070 Sq.ft', image: 'https://raw.githubusercontent.com/cris-pat-37/codeee/main/frontend/public/uploads/kumar-plumeria-fp-4-5bhk.jpg' },
    { title: '3.5-Acre Master Layout', size: '3.5 Acres', image: 'https://raw.githubusercontent.com/cris-pat-37/codeee/main/frontend/public/uploads/kumar-plumeria-master-plan.jpg' }
  ] : (p.slug === 'terra-alegria' || p.title === 'Terra Alegria') ? [
    { title: '4 BHK Luxury Villa (2,650 Sq.ft)', size: '2,650 Sq.ft', image: 'https://raw.githubusercontent.com/cris-pat-37/codeee/main/frontend/public/uploads/terra-alegria-fp-1.jpg' },
    { title: '4 BHK Grand Villa (3,205 Sq.ft)', size: '3,205 Sq.ft', image: 'https://raw.githubusercontent.com/cris-pat-37/codeee/main/frontend/public/uploads/terra-alegria-fp-1.jpg' },
    { title: '13.5-Acre Villa Township Layout', size: '13.5 Acres', image: 'https://raw.githubusercontent.com/cris-pat-37/codeee/main/frontend/public/uploads/terra-alegria-fp-1.jpg' }
  ] : (p.slug === 'godrej-vanantaara' || p.title === 'Godrej Vanantaara') ? [
    { title: 'Tower A Floor Plan', size: '1,650 Sq.ft', image: 'https://raw.githubusercontent.com/cris-pat-37/codeee/main/frontend/public/uploads/godrej-vanantaara-fp-ta.jpg' },
    { title: 'Tower B Floor Plan', size: '2,150 Sq.ft', image: 'https://raw.githubusercontent.com/cris-pat-37/codeee/main/frontend/public/uploads/godrej-vanantaara-fp-tb.jpg' },
    { title: '10-Acre Master Layout', size: '10 Acres', image: 'https://raw.githubusercontent.com/cris-pat-37/codeee/main/frontend/public/uploads/godrej-vanantaara-master-plan.jpg' }
  ] : (p.slug === 'godrej-woods' || p.title === 'Godrej Woods') ? [
    { title: '2 BHK Unit Plan', size: '1,190 Sq.ft', image: 'https://raw.githubusercontent.com/cris-pat-37/codeee/main/frontend/public/uploads/godrej-woods-fp-2bhk.jpg' },
    { title: '3 BHK Premium Unit Plan', size: '1,887 Sq.ft', image: 'https://raw.githubusercontent.com/cris-pat-37/codeee/main/frontend/public/uploads/godrej-woods-fp-3bhk.jpg' },
    { title: '7-Acre Master Layout', size: '7 Acres', image: 'https://raw.githubusercontent.com/cris-pat-37/codeee/main/frontend/public/uploads/godrej-woods-master-plan.jpg' }
  ] : (p.slug === 'azur' || p.title === 'Azur') ? [
    { title: '3 BHK Floor Plan', size: '1,265 Sq.ft', image: 'https://raw.githubusercontent.com/cris-pat-37/codeee/main/frontend/public/uploads/azur-fp-3bhk.jpg' },
    { title: '4 BHK Floor Plan', size: '1,900 Sq.ft', image: 'https://raw.githubusercontent.com/cris-pat-37/codeee/main/frontend/public/uploads/azur-fp-4bhk.jpg' },
    { title: '10-Acre Master Layout', size: '10 Acres', image: 'https://raw.githubusercontent.com/cris-pat-37/codeee/main/frontend/public/uploads/azur-master-plan.jpg' }
  ] : (p.slug === 'hevan' || p.title === 'Hevan') ? [
    { title: '3 BHK Floor Plan', size: '1,450 Sq.ft', image: 'https://raw.githubusercontent.com/cris-pat-37/codeee/main/frontend/public/uploads/hevan-fp-3bhk.jpg' },
    { title: '3.5 BHK + Study Floor Plan', size: '1,650 Sq.ft', image: 'https://raw.githubusercontent.com/cris-pat-37/codeee/main/frontend/public/uploads/hevan-fp-3bhk-study.jpg' },
    { title: '12-Acre Master Layout', size: '12 Acres', image: 'https://raw.githubusercontent.com/cris-pat-37/codeee/main/frontend/public/uploads/hevan-master-plan.jpg' }
  ] : (p.slug === 'lodha-mirabelle' || p.title === 'Lodha Mirabelle' || p.title === 'Lodha Mirabelle Phase 2') ? [
    { title: '3 BHK Luxe Floor Plan (Tower 5)', size: '2,000 Sq.ft', image: 'https://raw.githubusercontent.com/cris-pat-37/codeee/main/frontend/public/uploads/lodha-mirabelle-fp-t5.jpg' },
    { title: '3.5 BHK Luxury Floor Plan (Tower 6)', size: '2,200 Sq.ft', image: 'https://raw.githubusercontent.com/cris-pat-37/codeee/main/frontend/public/uploads/lodha-mirabelle-fp-t6.jpg' },
    { title: 'Tower 7 Floor Plan', size: 'Typical Floor Layout', image: 'https://raw.githubusercontent.com/cris-pat-37/codeee/main/frontend/public/uploads/lodha-mirabelle-fp-t7.jpg' }
  ] : (p.slug === 'eco-city-villas' || p.title === 'Eco City Villas') ? [
    { title: '3 BHK Villa Floor Plan', size: '2,100 Sq.ft', image: 'https://raw.githubusercontent.com/cris-pat-37/codeee/main/frontend/public/uploads/eco-city-villas-1.png' },
    { title: '4 BHK Villa Floor Plan', size: '2,800 Sq.ft', image: 'https://raw.githubusercontent.com/cris-pat-37/codeee/main/frontend/public/uploads/eco-city-villas-2.png' },
    { title: '48-Acre Villa Township Layout', size: '48 Acres', image: 'https://raw.githubusercontent.com/cris-pat-37/codeee/main/frontend/public/uploads/eco-city-villas-1.png' }
  ] : (p.slug === 'courtyard-of-life' || p.title === 'Courtyard of Life') ? [
    { title: '3 BHK 2T Floor Plan (1,381 Sq.ft)', size: '1,381 Sq.ft', image: 'https://raw.githubusercontent.com/cris-pat-37/codeee/main/frontend/public/uploads/courtyard-of-life-fp-3bhk.jpg' },
    { title: '3 BHK 3T Floor Plan (1,759 Sq.ft)', size: '1,759 Sq.ft', image: 'https://raw.githubusercontent.com/cris-pat-37/codeee/main/frontend/public/uploads/courtyard-of-life-fp-3bhk.jpg' },
    { title: '3-Acre Master Layout', size: '3 Acres', image: 'https://raw.githubusercontent.com/cris-pat-37/codeee/main/frontend/public/uploads/courtyard-of-life-master-plan.jpg' }
  ] : (p.slug === 'parth-gardenia' || p.title === 'Parth Gardenia') ? [
    { title: '2 BHK Typical Floor Plan (1,250 Sq.ft)', size: '1,250 Sq.ft', image: 'https://raw.githubusercontent.com/cris-pat-37/codeee/main/frontend/public/uploads/parth-gardenia-fp-1.jpg' },
    { title: '3 BHK Typical Floor Plan (1,650 Sq.ft)', size: '1,650 Sq.ft', image: 'https://raw.githubusercontent.com/cris-pat-37/codeee/main/frontend/public/uploads/parth-gardenia-fp-1.jpg' },
    { title: 'Typical Wing Layout (5th Floor & Above)', size: 'Wing 1 Layout', image: 'https://raw.githubusercontent.com/cris-pat-37/codeee/main/frontend/public/uploads/parth-gardenia-fp-1.jpg' }
  ] : (p.slug === 'madhura-gardens' || p.title === 'Madhura Gardens') ? [
    { title: '4 BHK Type 1 Floor Plan (2,850 Sq.ft)', size: '2,850 Sq.ft', image: 'https://raw.githubusercontent.com/cris-pat-37/codeee/main/frontend/public/uploads/madhura-gardens-fp-type1.jpg' },
    { title: '4 BHK Type 2 Floor Plan (3,250 Sq.ft)', size: '3,250 Sq.ft', image: 'https://raw.githubusercontent.com/cris-pat-37/codeee/main/frontend/public/uploads/madhura-gardens-fp-type2.jpg' },
    { title: '6-Acre Phase 1 Master Layout', size: '6 Acres', image: 'https://raw.githubusercontent.com/cris-pat-37/codeee/main/frontend/public/uploads/madhura-gardens-master-plan.jpg' }
  ] : (p.slug === 'soulace' || p.title === 'Soulace') ? [
    { title: '4 BHK Luxury Villa Floor Plan (3,387 Sq.ft)', size: '3,387 Sq.ft', image: 'https://raw.githubusercontent.com/cris-pat-37/codeee/main/frontend/public/uploads/soulace-fp-4bhk.jpg' },
    { title: '4 BHK Detailed Villa Layout', size: 'Detailed Layout', image: 'https://raw.githubusercontent.com/cris-pat-37/codeee/main/frontend/public/uploads/soulace-fp-4bhk-detailed.jpg' },
    { title: '26.5-Acre Master Layout', size: '26.5 Acres', image: 'https://raw.githubusercontent.com/cris-pat-37/codeee/main/frontend/public/uploads/soulace-master-plan.jpg' }
  ] : (p.slug === 'sobha-hosakote' || p.title === 'Sobha Hosakote') ? [
    { title: '1 BHK Floor Plan (650 Sq.ft)', size: '650 Sq.ft', image: 'https://raw.githubusercontent.com/cris-pat-37/codeee/main/frontend/public/uploads/sobha-hosakote-1.png' },
    { title: '2 BHK Floor Plan (1,200 Sq.ft)', size: '1,200 Sq.ft', image: 'https://raw.githubusercontent.com/cris-pat-37/codeee/main/frontend/public/uploads/sobha-hosakote-2.png' },
    { title: '3 BHK Floor Plan (1,750 Sq.ft)', size: '1,750 Sq.ft', image: 'https://raw.githubusercontent.com/cris-pat-37/codeee/main/frontend/public/uploads/sobha-hosakote-3.png' },
    { title: '300-Acre Integrated Township Layout', size: '300 Acres', image: 'https://raw.githubusercontent.com/cris-pat-37/codeee/main/frontend/public/uploads/sobha-hosakote-4.png' }
  ] : (p.slug === 'poulomi-florique' || p.title === 'Poulomi Florique' || p.title === 'Peace of mind - Florique') ? [
    { title: '3 BHK Floor Plan (Alpine & Dew Drop)', size: '1,585 Sq.ft', image: 'https://raw.githubusercontent.com/cris-pat-37/codeee/main/frontend/public/uploads/florique-fp-alpine.jpg' },
    { title: '3.5 BHK Floor Plan (Blossom & Cascade)', size: '2,210 Sq.ft', image: 'https://raw.githubusercontent.com/cris-pat-37/codeee/main/frontend/public/uploads/florique-fp-blossom.jpg' },
    { title: '9-Acre Master Layout', size: '9 Acres', image: 'https://raw.githubusercontent.com/cris-pat-37/codeee/main/frontend/public/uploads/florique-master-plan.jpg' }
  ] : (p.slug === 'pm-gardens' || p.title === 'PM Gardens') ? [
    { title: '2 BHK Floor Plan (1,225 Sq.ft)', size: '1,225 Sq.ft', image: 'https://raw.githubusercontent.com/cris-pat-37/codeee/main/frontend/public/uploads/pm-gardens-fp-2bhk.jpg' },
    { title: '3 BHK Floor Plan (1,575 Sq.ft)', size: '1,575 Sq.ft', image: 'https://raw.githubusercontent.com/cris-pat-37/codeee/main/frontend/public/uploads/pm-gardens-fp-3bhk.jpg' },
    { title: '1-Acre Master Layout', size: '1 Acre', image: 'https://raw.githubusercontent.com/cris-pat-37/codeee/main/frontend/public/uploads/pm-gardens-master-plan.jpg' }
  ] : (p.slug === 'merusri-sunscape' || p.title === 'Merusri Sunscape') ? [
    { title: '3 BHK Row Villa Floor Plan (2,410 Sq.ft)', size: '2,410 Sq.ft', image: 'https://raw.githubusercontent.com/cris-pat-37/codeee/main/frontend/public/uploads/merusri-sunscape-fp-type1.jpg' },
    { title: '4 BHK Row Villa Floor Plan (3,676 Sq.ft)', size: '3,676 Sq.ft', image: 'https://raw.githubusercontent.com/cris-pat-37/codeee/main/frontend/public/uploads/merusri-sunscape-fp-type2.jpg' },
    { title: '5.39-Acre Villa Layout', size: '5.39 Acres', image: 'https://raw.githubusercontent.com/cris-pat-37/codeee/main/frontend/public/uploads/merusri-sunscape-master-plan.jpg' }
  ] : (p.slug === 'merusri-antelopes' || p.title === 'Merusri Antelopes') ? [
    { title: '4 BHK Villa Floor Plan', size: '3,150 Sq.ft', image: 'https://raw.githubusercontent.com/cris-pat-37/codeee/main/frontend/public/uploads/merusri-antelopes-fp-1.png' },
    { title: 'Gated Villa Township Layout', size: 'Master Plan', image: 'https://raw.githubusercontent.com/cris-pat-37/codeee/main/frontend/public/uploads/merusri-antelopes-fp-1.png' }
  ] : (p.slug === 'montecito-villas' || p.title === 'Montecito Villas') ? [
    { title: '4 BHK Type A1 Tuscan Floor Plan (4,200 Sq.ft)', size: '4,200 Sq.ft', image: 'https://raw.githubusercontent.com/cris-pat-37/codeee/main/frontend/public/uploads/montecito-villas-fp-a1.jpg' },
    { title: '5 BHK Type C Spanish Floor Plan (5,800 Sq.ft)', size: '5,800 Sq.ft', image: 'https://raw.githubusercontent.com/cris-pat-37/codeee/main/frontend/public/uploads/montecito-villas-fp-c.jpg' },
    { title: '28-Acre Master Layout', size: '28 Acres', image: 'https://raw.githubusercontent.com/cris-pat-37/codeee/main/frontend/public/uploads/montecito-villas-master-plan.jpg' }
  ] : (p.slug === 'villa-feliz' || p.title === 'Villa Feliz' || p.title === 'Ruchira Villa Feliz') ? [
    { title: '4 BHK Luxury Villa Floor Plan (2,400 Sq.ft)', size: '2,400 Sq.ft', image: 'https://raw.githubusercontent.com/cris-pat-37/codeee/main/frontend/public/uploads/villa-feliz-fp-1.jpg' },
    { title: '117-Villa Township Master Layout', size: '117 Villas Layout', image: 'https://raw.githubusercontent.com/cris-pat-37/codeee/main/frontend/public/uploads/villa-feliz-fp-1.jpg' }
  ] : (p.slug === 'sobha-madison' || p.title === 'Sobha Madison') ? [
    { title: '3 BHK 2T Floor Plan + Home Office (1,347 Sq.ft)', size: '1,347 Sq.ft', image: 'https://raw.githubusercontent.com/cris-pat-37/codeee/main/frontend/public/uploads/sobha-madison-fp-1.jpg' },
    { title: '3 BHK 3T Floor Plan (1,514 Sq.ft)', size: '1,514 Sq.ft', image: 'https://raw.githubusercontent.com/cris-pat-37/codeee/main/frontend/public/uploads/sobha-madison-fp-2.jpg' },
    { title: '4 BHK 3T Grand Residence Floor Plan (1,847 Sq.ft)', size: '1,847 Sq.ft', image: 'https://raw.githubusercontent.com/cris-pat-37/codeee/main/frontend/public/uploads/sobha-madison-fp-3.jpg' }
  ] : (p.floor_plans && p.floor_plans.length > 0)
    ? p.floor_plans
    : (p.variants && p.variants.length > 0 && p.variants.some(v => v.image || v.floor_plan_url))
      ? p.variants.filter(v => v.image || v.floor_plan_url).map(v => ({
          title: v.name || `${v.bhk} Layout`,
          size: v.area_display || v.size || '',
          image: v.image || v.floor_plan_url || ''
        }))
      : (p.floor_plan_url ? [{ title: 'Master Floor Plan', size: p.area_display || '', image: p.floor_plan_url }] : []),
  configuration: p.configuration || '',
  furnishing: p.furnishing || '',
  parking: p.parking || '',
  amenities: p.amenities || [],
  variants: p.variants || [],
  agentName: p.agent_name || p.agentName || '',
  agentPhone: p.agent_phone || p.agentPhone || '',
  agentEmail: p.agent_email || p.agentEmail || '',
});

export const api = {
  // Fetch all active properties from Supabase
  getAllProperties: async () => {
    try {
      const response = await supabaseClient.get('/properties', {
        params: {
          select: '*',
          status: 'neq.DELETED',
          order: 'featured.desc,created_at.desc'
        }
      });
      // Filter out archived properties and normalize
      const filtered = (response.data || []).filter(p => 
        p.status !== 'Archived' && 
        p.status !== 'DELETED' && 
        !String(p.title || '').includes('Archived') &&
        !String(p.title || '').includes('DELETED')
      ).map(normalizeProperty);
      return { data: filtered };
    } catch (error) {
      console.error(`Error fetching all properties: ${error.message}`);
      throw error;
    }
  },

  // Get single property details by slug from Supabase
  getPropertyBySlug: async (slug) => {
    try {
      const response = await supabaseClient.get('/properties', {
        params: {
          select: '*',
          slug: `eq.${slug}`
        }
      });
      const normalized = (response.data || []).map(normalizeProperty);
      return { data: normalized };
    } catch (error) {
      console.error(`Error fetching property by slug: ${error.message}`);
      throw error;
    }
  },

  // Get similar properties (same property type or location)
  getSimilarProperties: async (propertyType, location, currentSlug) => {
    try {
      const response = await supabaseClient.get('/properties', {
        params: {
          select: '*',
          slug: `neq.${currentSlug}`,
          status: 'neq.DELETED',
          limit: 8,
          order: 'featured.desc'
        }
      });
      const city = location?.split(',').pop()?.trim() || '';
      const filtered = (response.data || []).filter(p =>
        p.status !== 'Archived' &&
        !String(p.title || '').includes('Archived') &&
        (p.property_type === propertyType || (city && String(p.location || '').includes(city)))
      ).map(normalizeProperty).slice(0, 4);
      return { data: filtered };
    } catch (error) {
      console.error(`Error fetching similar properties: ${error.message}`);
      return { data: [] };
    }
  },

  // Submit Lead Form
  submitLead: async (leadData) => {
    try {
      const response = await backendClient.post('/leads', leadData);
      return response.data;
    } catch (error) {
      // Fallback: insert lead directly into Supabase
      try {
        const supabaseResponse = await supabaseClient.post('/leads', leadData);
        return supabaseResponse.data;
      } catch (supaErr) {
        console.error(`Error submitting lead form: ${error.message}`);
        throw error.response?.data || new Error('Failed to submit enquiry. Please try again.');
      }
    }
  },

  // Helper to format image URLs (serving uploads from GitHub Raw CDN)
  getImageUrl: (imagePath) => {
    if (!imagePath) return '';
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    return `https://raw.githubusercontent.com/cris-pat-37/codeee/main/frontend/public${cleanPath}`;
  }
};
