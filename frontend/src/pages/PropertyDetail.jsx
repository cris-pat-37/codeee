import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import { Helmet } from 'react-helmet-async';
import L from 'leaflet';
import { api } from '../services/api';
import { PropertyDetailSkeleton } from '../components/SkeletonLoader';

import { 
  BiBed, BiBath, BiArea, BiBuilding, BiCalendar, BiUser,
  BiPhoneCall, BiEnvelope, BiMessageDetail, BiDownload,
  BiMapPin, BiShareAlt, BiHeart, BiPlayCircle, BiX,
  BiCheckCircle, BiLoaderAlt, BiChevronLeft, BiChevronRight,
  BiCar
} from 'react-icons/bi';
import { FaWhatsapp } from 'react-icons/fa';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

export default function PropertyDetail() {
  const { slug } = useParams();
  
  const formatStartingPrice = (priceStr) => {
    if (!priceStr) return '';
    if (priceStr.toLowerCase().includes('request')) return 'Price on Request';
    const cleanStr = priceStr.replace(/–/g, '-');
    let startPart = '';
    if (cleanStr.includes('-')) {
      const parts = cleanStr.split('-');
      startPart = parts[0].trim();
      const unitMatch = cleanStr.match(/(Cr|Crores|Crore|Lakh|Lakhs|L|Lac|Lacs)\b/i);
      const unit = unitMatch ? unitMatch[0] : '';
      const hasUnit = /(Cr|Crores|Crore|Lakh|Lakhs|L|Lac|Lacs)\b/i.test(startPart);
      if (!hasUnit && unit) {
        startPart = `${startPart} ${unit}`;
      }
    } else {
      startPart = cleanStr.trim();
    }
    
    // Remove existing "+", "Onwards", and trailing/leading spaces
    startPart = startPart.replace(/\s*onwards\s*/i, '').replace(/\+$/, '').trim();
    
    if (/(Cr|Crores|Crore|Lakh|Lakhs|L|Lac|Lacs)\b/i.test(startPart)) {
      return `${startPart} Onwards`;
    }
    return startPart;
  };

  const formatStartingArea = (areaStr) => {
    if (!areaStr) return '';
    const cleanStr = areaStr.replace(/–/g, '-');
    if (cleanStr.includes('-')) {
      const parts = cleanStr.split('-');
      let startPart = parts[0].trim();
      const unitMatch = cleanStr.match(/(Sq\.?ft|sqft|square\s*feet|sq\s*meters|sq\s*yds)/i);
      const unit = unitMatch ? unitMatch[0] : 'Sq.ft';
      const hasUnit = /(Sq\.?ft|sqft|square\s*feet|sq\s*meters|sq\s*yds)/i.test(startPart);
      if (!hasUnit) {
        startPart = `${startPart} ${unit}`;
      }
      startPart = startPart.replace(/\+$/, '').trim();
      return startPart;
    }
    if (areaStr.endsWith('+')) {
      return areaStr.slice(0, -1).trim();
    }
    return areaStr;
  };

  const getExactAreaForBhk = (prop) => {
    if (!prop) return '';
    const areaStr = prop.area || '';
    const bedrooms = prop.bedrooms;
    
    if (!areaStr.includes('-')) {
      return areaStr;
    }
    
    const desc = prop.longDescription || '';
    if (desc && bedrooms) {
      const regex = new RegExp(`<td[^>]*>\\s*${bedrooms}\\s*BHK\\s*<\\/td>\\s*<td[^>]*>([^<]+)<\\/td>`, 'i');
      const match = desc.match(regex);
      if (match) {
        const bhkArea = match[1].trim();
        return formatStartingArea(bhkArea);
      }
    }
    
    return formatStartingArea(areaStr);
  };

  const formatHtmlRanges = (html) => {
    if (!html) return '';
    let cleanHtml = html;
    
    // Replace price ranges
    cleanHtml = cleanHtml.replace(/(?:₹|Rs\.?)\s*(\d+(?:\.\d+)?)\s*(Cr|Crores|Lakhs|Lakh)?\s*-\s*(\d+(?:\.\d+)?)\s*(Cr|Crores|Lakhs|Lakh)?/gi, (match, p1, u1, p2, u2) => {
      const unit = u1 || u2 || '';
      return `₹${p1} ${unit} Onwards`;
    });
    
    // Replace area ranges
    cleanHtml = cleanHtml.replace(/(\d+(?:\.\d+)?)\s*(Sq\.?ft|sqft|square\s*feet)?\s*-\s*(\d+(?:\.\d+)?)\s*(Sq\.?ft|sqft|square\s*feet)/gi, (match, a1, u1, a2, u2) => {
      const unit = u1 || u2 || 'Sq.ft';
      return `${a1} ${unit}`;
    });
    
    return cleanHtml;
  };

  const capitalizeWords = (str) => {
    if (!str) return '';
    return str.replace(/\b\w/g, c => c.toUpperCase());
  };
  const [property, setProperty] = useState(null);
  const [similarProperties, setSimilarProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Lead Form States
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    message: 'Hello, I am interested in this property. Please share more details.'
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState(null);
  const [formError, setFormError] = useState(null);

  // UI Interactive States
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeFloorPlanIndex, setActiveFloorPlanIndex] = useState(0);
  const [floorPlanLightboxOpen, setFloorPlanLightboxOpen] = useState(false);
  const [enquireModalOpen, setEnquireModalOpen] = useState(false);

  // Brochure Gated Form States
  const [brochureModalOpen, setBrochureModalOpen] = useState(false);
  const [brochureFormData, setBrochureFormData] = useState({
    name: '',
    phone: '',
    email: '',
  });
  const [brochureSubmitting, setBrochureSubmitting] = useState(false);
  const [brochureSuccess, setBrochureSuccess] = useState(null);
  const [brochureError, setBrochureError] = useState(null);

  const handleBrochureInputChange = (e) => {
    setBrochureFormData({ ...brochureFormData, [e.target.name]: e.target.value });
  };

  const handleBrochureSubmit = async (e) => {
    e.preventDefault();
    setBrochureSubmitting(true);
    setBrochureSuccess(null);
    setBrochureError(null);

    const leadPayload = {
      ...brochureFormData,
      message: `Downloaded Brochure for ${property?.title || 'this property'}.`,
      propertySlug: slug,
      propertyName: property?.title || 'Unknown Property'
    };

    try {
      await api.submitLead(leadPayload);
      setBrochureSuccess('Thank you! Your download is starting.');
      
      // Trigger actual download of brochure
      if (!property?.brochureUrl) {
        alert('Brochure file is being generated. An agent will send it over WhatsApp shortly.');
      } else {
        const link = document.createElement('a');
        link.href = property.brochureUrl;
        link.target = '_blank';
        link.download = `${property.title.replace(/\s+/g, '_')}_Brochure.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      setTimeout(() => {
        setBrochureModalOpen(false);
        setBrochureSuccess(null);
        setBrochureFormData({ name: '', phone: '', email: '' });
      }, 3000);
    } catch (err) {
      console.error('Brochure submit error:', err);
      setBrochureError(err.message || 'Failed to process request. Please try again.');
    } finally {
      setBrochureSubmitting(false);
    }
  };

  // Map ref
  const mapRef = useRef(null);

  useEffect(() => {
    const fetchPropertyData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch current property
        const res = await api.getPropertyBySlug(slug);
        
        if (!res.data || res.data.length === 0) {
          throw new Error('Property not found');
        }

        const rawProperty = res.data[0];
        const propertyData = rawProperty.attributes ? { id: rawProperty.id, ...rawProperty.attributes } : rawProperty;
        
        setProperty(propertyData);

        // Fetch similar properties
        try {
          const type = propertyData.propertyType || 'Apartment';
          const loc = propertyData.location || '';
          const similarRes = await api.getSimilarProperties(type, loc, slug);
          const rawSimilar = similarRes.data || [];
          const normalizedSimilar = rawSimilar.map(p => p.attributes ? { id: p.id, ...p.attributes } : p);
          setSimilarProperties(normalizedSimilar);
        } catch (simErr) {
          console.error('Failed to load similar properties', simErr);
        }

        setLoading(false);
      } catch (err) {
        console.error('Error fetching property data:', err);
        setError(err.message || 'Failed to load property details. Please try again later.');
        setLoading(false);
      }
    };

    fetchPropertyData();
  }, [slug]);

  // Leaflet Map Initialization
  useEffect(() => {
    if (!loading && property && document.getElementById('map-container')) {
      const initializeMap = (mapLat, mapLng) => {
        if (mapRef.current) {
          mapRef.current.remove();
        }

        const map = L.map('map-container', {
          zoomControl: true,
          scrollWheelZoom: false
        }).setView([mapLat, mapLng], 15);

        mapRef.current = map;

        // CartoDB Voyager light tiles fit the light theme perfectly
        L.tileLayer('https://{s}.tile.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: 'abcd',
          maxZoom: 20
        }).addTo(map);

        const tealMarkerHtml = `
          <div class="relative flex items-center justify-center">
            <div class="absolute w-10 h-10 bg-teal-500/30 rounded-full animate-ping"></div>
            <div class="relative w-8 h-8 rounded-full bg-teal-500 border-2 border-white flex items-center justify-center shadow-md">
              <div class="w-2.5 h-2.5 rounded-full bg-white"></div>
            </div>
          </div>
        `;

        const customIcon = L.divIcon({
          html: tealMarkerHtml,
          className: 'custom-map-marker',
          iconSize: [40, 40],
          iconAnchor: [20, 20]
        });

        L.marker([mapLat, mapLng], { icon: customIcon })
          .addTo(map)
          .bindPopup(`<div class="text-slate-800 font-sans font-semibold p-1">${property.title}</div>`)
          .openPopup();
      };

      const lat = parseFloat(property.latitude);
      const lng = parseFloat(property.longitude);

      if (lat && lng && lat !== 0 && lng !== 0) {
        initializeMap(lat, lng);
      } else {
        // Geocode location using Nominatim
        const query = `${property.location || 'Bangalore'}, Karnataka, India`;
        fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`)
          .then(res => res.json())
          .then(data => {
            if (data && data.length > 0) {
              const geocodedLat = parseFloat(data[0].lat);
              const geocodedLng = parseFloat(data[0].lon);
              initializeMap(geocodedLat, geocodedLng);
            } else {
              // Fallback to default Bangalore coordinates
              initializeMap(12.9716, 77.5946);
            }
          })
          .catch(err => {
            console.error("OSM Nominatim Geocoding failed:", err);
            // Fallback to default Bangalore coordinates
            initializeMap(12.9716, 77.5946);
          });
      }
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [loading, property]);

  // Handle Form Submission
  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormSuccess(null);
    setFormError(null);

    const leadPayload = {
      ...formData,
      propertySlug: slug,
      propertyName: property?.title || 'Unknown Property'
    };

    try {
      await api.submitLead(leadPayload);
      setFormSuccess('Thank you! Your enquiry has been submitted. Our team will get back to you shortly.');
      setFormData({
        name: '',
        phone: '',
        email: '',
        message: `Hello, I am interested in ${property?.title || 'this property'}. Please share more details.`
      });
    } catch (err) {
      console.error('Lead submission failure:', err);
      setFormError(err.message || 'Failed to submit enquiry. Please try again.');
    } finally {
      setFormSubmitting(false);
    }
  };

  if (loading) return <PropertyDetailSkeleton />;
  if (error) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-4 bg-slate-50">
        <div className="bg-red-50 border border-red-100 p-8 rounded-2xl max-w-md space-y-4">
          <h2 className="text-2xl font-bold text-red-500">Oops!</h2>
          <p className="text-slate-700">{error}</p>
          <Link to="/" className="inline-block px-6 py-3 bg-teal-500 text-white rounded-lg font-semibold hover:bg-teal-650 transition">
            Back to Catalog
          </Link>
        </div>
      </div>
    );
  }

  // Visual Fallback Helper: Prefilled demo data for blanks (dimmed preview style)
  const resolveField = (val, placeholder) => {
    if (val && String(val).trim() !== '') {
      return { text: val, isDemo: false };
    }
    return { text: `${placeholder} (Demo)`, isDemo: true };
  };

  const title = property?.title || 'Property Detail';
  
  // Field values with prefilled demo data resolve
  const formattedPrice = formatStartingPrice(property?.price);
  const formattedArea = getExactAreaForBhk(property);

  const fPrice = resolveField(formattedPrice, '1.69 Crores');
  const fLocation = resolveField(property?.location, 'Kempanahalli, Bangalore');
  const fBedrooms = resolveField(property?.bedrooms, '3');
  const fBathrooms = resolveField(property?.bathrooms, '3');
  const fArea = resolveField(formattedArea, '1600 Sqft');
  const fPropertyType = resolveField(property?.propertyType, 'Apartment');
  const fPossessionDate = resolveField(property?.possessionDate, 'Dec 2027');
  const fBuilderName = resolveField(property?.builderName, 'Tirumakudalu Properties');
  const fReraNumber = resolveField(property?.reraNumber, 'PRM/KA/RERA/1251/310/PR/180627/003456');
  const fProjectStatus = resolveField(property?.projectStatus, 'Under Construction');
  const fFurnishing = resolveField(property?.furnishing ? capitalizeWords(property.furnishing) : null, 'Unfurnished');
  const fParking = resolveField(property?.parking ? capitalizeWords(property.parking) : null, '4-Wheeler Parking');

  const youtubeVideo = property?.youtubeVideo || 'https://www.youtube.com/watch?v=ScMzIvxBSi4';
  const youtubeVideoId = youtubeVideo.split('v=')[1]?.split('&')[0] || youtubeVideo.split('/').pop() || 'ScMzIvxBSi4';

  // Dynamic Image resolution (Local CMS assets vs Absolute crawled URLs)
  let mainImageUrl = 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80';
  if (property?.mainImage?.data) {
    mainImageUrl = api.getImageUrl(property.mainImage.data.attributes.url);
  } else if (property?.mainImageUrl) {
    mainImageUrl = api.getImageUrl(property.mainImageUrl);
  }

  let galleryUrls = [];
  if (property?.galleryImages?.data) {
    galleryUrls = property.galleryImages.data.map(img => api.getImageUrl(img.attributes.url));
  } else if (property?.galleryImageUrls && Array.isArray(property.galleryImageUrls)) {
    galleryUrls = property.galleryImageUrls.map(url => api.getImageUrl(url));
  }
  
  if (galleryUrls.length === 0) {
    galleryUrls = [mainImageUrl];
  }

  // Amenities parsing
  const rawAmenities = property?.amenities || [
    { name: 'Swimming Pool', icon: 'pool' },
    { name: 'Gymnasium', icon: 'gym' },
    { name: 'Clubhouse', icon: 'club' },
    { name: '24/7 Security', icon: 'security' },
    { name: 'Childrens Play Area', icon: 'play' },
    { name: 'Jogging Track', icon: 'track' }
  ];
  const amenitiesList = Array.isArray(rawAmenities) ? rawAmenities : [];

  // Floor plans
  const defaultFloorPlans = [
    { title: 'Typical Unit A', size: fArea.text, image: 'https://images.unsplash.com/photo-1545464693-f1798a373343?auto=format&fit=crop&w=800&q=80' }
  ];
  const floorPlansList = property?.floorPlans || defaultFloorPlans;

  // Nearby Landmarks
  const defaultNearby = [
    { place: 'Metro Transit Station', distance: '0.8 km', category: 'Transit' },
    { place: 'Delhi Public School', distance: '1.2 km', category: 'Education' },
    { place: 'Local Healthcare Hospital', distance: '2.5 km', category: 'Healthcare' }
  ];
  const nearbyPlacesList = property?.nearbyPlaces || defaultNearby;

  const renderAmenityIcon = (iconName) => {
    switch (iconName?.toLowerCase()) {
      case 'pool':
      case 'swimming pool':
        return <div className="p-3 bg-teal-50 text-teal-600 rounded-lg text-2xl"><BiBuilding /></div>;
      case 'gym':
      case 'gymnasium':
        return <div className="p-3 bg-teal-50 text-teal-600 rounded-lg text-2xl"><BiArea /></div>;
      case 'club':
      case 'clubhouse':
        return <div className="p-3 bg-teal-50 text-teal-600 rounded-lg text-2xl"><BiBuilding /></div>;
      case 'security':
        return <div className="p-3 bg-teal-50 text-teal-600 rounded-lg text-2xl"><BiCheckCircle /></div>;
      default:
        return <div className="p-3 bg-teal-50 text-teal-600 rounded-lg text-2xl"><BiCheckCircle /></div>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-16">
      <Helmet>
        <title>{property?.seoTitle || `${title} | Tirumakudalu Properties`}</title>
        <meta name="description" content={property?.seoDescription || `${title} details.`} />
        <meta property="og:title" content={property?.seoTitle || title} />
        <meta property="og:description" content={property?.seoDescription || `Premium property`} />
        <meta property="og:image" content={mainImageUrl} />
      </Helmet>

      {/* SECTION 1: HERO */}
      <section className="relative w-full h-[65vh] sm:h-[75vh] overflow-hidden">
        <Swiper
          modules={[Navigation, Pagination, Autoplay]}
          navigation
          pagination={{ clickable: true }}
          autoplay={{ delay: 5000, disableOnInteraction: false }}
          className="w-full h-full"
        >
          {galleryUrls.map((url, idx) => (
            <SwiperSlide key={idx} className="w-full h-full relative">
              <img 
                src={url} 
                alt={`${title} Slide ${idx + 1}`} 
                className="w-full h-full object-cover" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent"></div>
            </SwiperSlide>
          ))}
        </Swiper>

        {/* Floating Property Info Overlay Card */}
        <div className="absolute bottom-12 left-4 right-4 md:left-12 md:right-auto z-20 max-w-xl">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="bg-white/95 backdrop-blur-md p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-2xl"
          >
            <div className="flex items-center space-x-2 mb-2">
              <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full ${
                fProjectStatus.isDemo ? 'bg-teal-50 text-teal-600 border border-teal-100' : 'bg-teal-500 text-white'
              }`}>
                {fProjectStatus.text}
              </span>
              {property?.featured && (
                <span className="px-3 py-1 bg-slate-800 text-white text-xs font-bold uppercase tracking-wider rounded-full">
                  Featured
                </span>
              )}
            </div>
            
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-800 font-display tracking-tight mb-2">
              {title}
            </h1>
            
            <p className="flex items-center text-slate-600 text-sm sm:text-base mb-4">
              <BiMapPin className="text-teal-500 mr-1 text-lg shrink-0" />
              {fLocation.text}
            </p>

            <div className="flex flex-wrap items-baseline gap-2 mb-6">
              <span className="text-slate-500 text-xs uppercase font-semibold">Starting Price</span>
              <span className={`text-3xl font-bold font-display ${fPrice.isDemo ? 'text-teal-500/60 italic' : 'text-slate-800'}`}>
                ₹{fPrice.text}
              </span>
            </div>

            {/* Quick highlights list */}
            <div className="grid grid-cols-3 gap-2 border-t border-slate-200 pt-4 mb-6 text-center text-xs text-slate-600">
              <div className="border-r border-slate-250">
                <p className={`font-semibold ${fBedrooms.isDemo ? 'text-slate-450 italic' : 'text-slate-800'}`}>{fBedrooms.text} BHK</p>
                <p className="text-[10px] text-slate-500">Configuration</p>
              </div>
              <div className="border-r border-slate-250">
                <p className={`font-semibold ${fArea.isDemo ? 'text-slate-450 italic' : 'text-slate-800'}`}>{fArea.text}</p>
                <p className="text-[10px] text-slate-500">Super Area</p>
              </div>
              <div>
                <p className={`font-semibold ${fPossessionDate.isDemo ? 'text-slate-450 italic' : 'text-slate-800'}`}>{fPossessionDate.text}</p>
                <p className="text-[10px] text-slate-500">Possession</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 text-xs">
              <a 
                href="tel:+919741111756" 
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium border border-slate-200 transition duration-300 whitespace-nowrap"
              >
                <BiPhoneCall className="text-base text-teal-500 shrink-0" />
                Call Us
              </a>
              <a 
                href={`https://wa.me/919741111756?text=I%20am%20interested%20in%20${encodeURIComponent(title)}%20located%20in%20${encodeURIComponent(fLocation.text)}.%20Please%20send%20more%20details.`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-3 bg-[#25d366] hover:bg-[#20ba5a] text-white rounded-xl font-bold transition duration-300 whitespace-nowrap"
              >
                <FaWhatsapp className="text-base shrink-0" />
                WhatsApp
              </a>
              <button 
                onClick={() => setEnquireModalOpen(true)}
                className="flex-1 flex items-center justify-center px-3 py-3 bg-teal-500 hover:bg-teal-650 text-white rounded-xl font-bold transition duration-300 shadow-md shadow-teal-500/20 whitespace-nowrap"
              >
                Enquire
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Main Content Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-2 space-y-12">
          
          {/* SECTION 2: QUICK OVERVIEW */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold font-display text-slate-800 border-l-4 border-teal-500 pl-3">
              Quick Overview
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[
                { label: 'Property Type', value: fPropertyType.text, icon: <BiBuilding />, isDemo: fPropertyType.isDemo },
                { label: 'Builder Name', value: fBuilderName.text, icon: <BiUser />, isDemo: fBuilderName.isDemo },
                { label: 'Bathrooms', value: `${fBathrooms.text} Baths`, icon: <BiBath />, isDemo: fBathrooms.isDemo },
                { label: 'Furnishing', value: fFurnishing.text, icon: <BiBed />, isDemo: fFurnishing.isDemo },
                { label: 'Parking Spaces', value: fParking.text, icon: <BiCar />, isDemo: fParking.isDemo },
                { label: 'RERA Reg No.', value: fReraNumber.text, icon: <img src="/rera_logo.png" className="w-6 h-6 object-contain" alt="RERA" />, isDemo: fReraNumber.isDemo }
              ].map((item, index) => (
                <motion.div 
                  key={index}
                  whileHover={{ y: -5 }}
                  className="bg-white p-4 rounded-xl border border-slate-200 flex items-center space-x-4 shadow-sm min-w-0"
                >
                  <div className="text-2xl text-teal-600 bg-teal-50 p-3 rounded-lg shrink-0 flex items-center justify-center w-12 h-12">
                    {item.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-slate-500 uppercase tracking-wider">{item.label}</p>
                    <p className={`text-sm font-bold mt-0.5 break-all ${item.isDemo ? 'text-slate-450 italic font-normal' : 'text-slate-800'}`}>
                      {item.value}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          {/* SECTION 3: ABOUT PROPERTY */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold font-display text-slate-800 border-l-4 border-teal-500 pl-3">
              About the Property
            </h2>
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              {property?.shortDescription && (
                <p className="text-teal-600 font-medium text-lg leading-relaxed">
                  {property.shortDescription}
                </p>
              )}
              <div 
                className="text-slate-600 leading-relaxed font-sans text-sm sm:text-base space-y-4 pt-2 border-t border-slate-100"
                dangerouslySetInnerHTML={{ __html: formatHtmlRanges(property?.longDescription || '<p>Premium residences in Bangalore by Tirumakudalu Properties.</p>') }}
              />
              {/* STUNNING BROCHURE & RERA TRUST BADGES */}
              <div className="mt-8 pt-6 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gradient-to-r from-slate-50 to-teal-50/20 p-5 rounded-2xl border border-slate-200/80 flex flex-col justify-between gap-4">
                  <div className="flex items-center space-x-3.5">
                    <div className="p-3 bg-teal-500/10 text-teal-600 rounded-xl text-2xl">
                      <BiDownload />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">Project Brochure</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">Download full floor plans and pricing guide PDF</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setBrochureModalOpen(true)}
                    className="w-full py-2.5 bg-teal-500 hover:bg-teal-600 text-white rounded-lg font-bold transition duration-300 text-xs shadow-sm text-center cursor-pointer"
                  >
                    Download Brochure
                  </button>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 flex flex-col justify-between gap-4">
                  <div className="flex items-center space-x-3.5">
                    <div className="w-12 h-12 bg-white rounded-xl overflow-hidden flex items-center justify-center border border-slate-100 p-1">
                      <img src="/rera_logo.png" alt="RERA Logo" className="max-w-full max-h-full object-contain" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-bold text-slate-800 text-sm">RERA Registered</h4>
                        <span className="bg-emerald-50 text-emerald-700 text-[9px] font-bold px-1.5 py-0.2 rounded-full border border-emerald-205">Verified</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        No: <span className="font-mono font-semibold text-slate-700">{fReraNumber.text}</span>
                      </p>
                    </div>
                  </div>
                  {!fReraNumber.isDemo ? (
                    <a 
                      href="https://rera.karnataka.gov.in/" 
                      target="_blank" 
                      rel="noreferrer"
                      className="w-full py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg font-bold transition duration-300 text-xs text-center"
                    >
                      Verify on RERA Portal
                    </a>
                  ) : (
                    <span className="w-full py-2.5 bg-slate-50 border border-slate-100 text-slate-400 rounded-lg font-bold text-xs text-center cursor-not-allowed">
                      Demo RERA Number
                    </span>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 3B: ADDITIONAL SPECIFICATIONS */}
          {((property?.additionalDetails && property?.additionalDetails.length > 0) || property?.furnishing || property?.parking || property?.configuration || property?.specialFeatures) && (
            <section className="space-y-4">
              <h2 className="text-2xl font-bold font-display text-slate-800 border-l-4 border-teal-500 pl-3">
                Project Specifications
              </h2>
              <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                {property?.additionalDetails && property.additionalDetails.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {property.additionalDetails.map(([key, val], idx) => (
                      <div 
                        key={idx} 
                        className="flex justify-between items-center px-4 py-3 bg-slate-50/40 hover:bg-slate-50/90 border border-slate-105 rounded-xl transition duration-150 min-w-0"
                      >
                        <span className="text-slate-500 font-medium text-xs sm:text-sm shrink-0">{key}</span>
                        <span className="font-semibold text-slate-800 text-xs sm:text-sm text-right pl-4 break-all">{val}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {property?.furnishing && (
                      <motion.div 
                        whileHover={{ y: -3 }}
                        className="p-4 bg-slate-50/50 rounded-xl border border-slate-150 flex items-center space-x-3.5"
                      >
                        <div className="text-xl text-teal-600 bg-teal-50 p-2.5 rounded-lg">
                          <BiBed />
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Furnishing</p>
                          <p className="text-xs font-bold text-slate-700 mt-0.5">
                            {capitalizeWords(property.furnishing)}
                          </p>
                        </div>
                      </motion.div>
                    )}
                    {property?.parking && (
                      <motion.div 
                        whileHover={{ y: -3 }}
                        className="p-4 bg-slate-50/50 rounded-xl border border-slate-150 flex items-center space-x-3.5"
                      >
                        <div className="text-xl text-teal-600 bg-teal-50 p-2.5 rounded-lg">
                          <BiCar />
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Parking Spaces</p>
                          <p className="text-xs font-bold text-slate-700 mt-0.5">
                            {capitalizeWords(property.parking)}
                          </p>
                        </div>
                      </motion.div>
                    )}
                    {property?.configuration && (
                      <motion.div 
                        whileHover={{ y: -3 }}
                        className="p-4 bg-slate-50/50 rounded-xl border border-slate-150 flex items-center space-x-3.5"
                      >
                        <div className="text-xl text-teal-600 bg-teal-50 p-2.5 rounded-lg">
                          <BiBuilding />
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Configuration</p>
                          <p className="text-xs font-bold text-slate-700 mt-0.5">
                            {property.configuration}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </div>
                )}
                {property?.specialFeatures && property.specialFeatures !== 'None' && (
                  <div className="pt-4 border-t border-slate-100">
                    <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-2">Special Features & Customizations</p>
                    <p className="text-slate-650 leading-relaxed text-sm bg-slate-50 p-4 rounded-xl border border-slate-100 whitespace-pre-line">
                      {property.specialFeatures}
                    </p>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* SECTION 4: GALLERY */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold font-display text-slate-800 border-l-4 border-teal-500 pl-3">
              Gallery
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {galleryUrls.map((url, idx) => (
                <div 
                  key={idx} 
                  className="group relative h-40 sm:h-48 rounded-xl overflow-hidden cursor-pointer border border-slate-200"
                  onClick={() => {
                    setLightboxIndex(idx);
                    setLightboxOpen(true);
                  }}
                >
                  <img 
                    src={url} 
                    alt={`${title} Gallery ${idx + 1}`} 
                    className="w-full h-full object-cover transition duration-500 group-hover:scale-110" 
                  />
                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition duration-300 flex items-center justify-center">
                    <span className="text-white text-xs font-semibold uppercase tracking-wider bg-slate-850/90 px-3 py-1.5 rounded-lg border border-slate-700">
                      View Image
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* SECTION 5: AMENITIES */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold font-display text-slate-800 border-l-4 border-teal-500 pl-3">
              World-Class Amenities
            </h2>
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-2 md:grid-cols-3 gap-4">
              {amenitiesList.map((amenity, idx) => (
                <div key={idx} className="flex items-center space-x-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  {renderAmenityIcon(amenity.icon || amenity.name)}
                  <span className="text-sm font-semibold text-slate-700">{amenity.name}</span>
                </div>
              ))}
            </div>
          </section>

          {/* SECTION 6: FLOOR PLANS */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold font-display text-slate-800 border-l-4 border-teal-500 pl-3">
              Floor Plans
            </h2>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex border-b border-slate-150 mb-6 gap-4">
                {floorPlansList.map((plan, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveFloorPlanIndex(idx)}
                    className={`pb-3 font-semibold text-sm transition relative ${
                      activeFloorPlanIndex === idx ? 'text-teal-600' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {plan.title || `Plan ${idx + 1}`}
                    {activeFloorPlanIndex === idx && (
                      <motion.div 
                        layoutId="floorPlanUnderline"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-500" 
                      />
                    )}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-center">
                <div className="md:col-span-2 space-y-4">
                  <h3 className="text-lg font-bold text-slate-800">
                    {floorPlansList[activeFloorPlanIndex]?.title || 'Floor Plan'}
                  </h3>
                  <div className="space-y-2 text-xs text-slate-655">
                    <p className="flex justify-between border-b border-slate-100 pb-2">
                      <span className="text-slate-500">Total Area:</span>
                      <span className={`font-semibold ${fArea.isDemo ? 'text-slate-450 italic font-normal' : 'text-slate-800'}`}>
                        {floorPlansList[activeFloorPlanIndex]?.size || fArea.text}
                      </span>
                    </p>
                    <p className="flex justify-between border-b border-slate-100 pb-2">
                      <span className="text-slate-500">Property Type:</span>
                      <span className="font-semibold text-slate-800">{fPropertyType.text}</span>
                    </p>
                  </div>
                  <button 
                    onClick={() => setFloorPlanLightboxOpen(true)}
                    className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-xs transition border border-slate-200"
                  >
                    View Layout Spec
                  </button>
                </div>
                <div 
                  className="md:col-span-3 border border-slate-150 rounded-xl overflow-hidden cursor-zoom-in bg-slate-50 p-4 flex items-center justify-center h-64 relative group"
                  onClick={() => setFloorPlanLightboxOpen(true)}
                >
                  <img 
                    src={floorPlansList[activeFloorPlanIndex]?.image || 'https://images.unsplash.com/photo-1545464693-f1798a373343?auto=format&fit=crop&w=800&q=80'} 
                    alt={floorPlansList[activeFloorPlanIndex]?.title || 'Floor Plan'} 
                    className="max-h-full max-w-full object-contain"
                  />
                  <div className="absolute top-4 right-4 bg-slate-800/90 p-2 rounded-lg text-slate-200 border border-slate-700 opacity-0 group-hover:opacity-100 transition text-[10px]">
                    Click to Zoom
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 7: LOCATION */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold font-display text-slate-800 border-l-4 border-teal-500 pl-3">
              Location Advantage
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 h-80 rounded-xl overflow-hidden border border-slate-200 relative">
                <div id="map-container" className="w-full h-full bg-slate-100"></div>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-800 flex items-center">
                  <BiMapPin className="text-teal-500 mr-1" /> Nearby Landmarks
                </h3>
                <div className="space-y-2 overflow-y-auto max-h-64 pr-2 text-xs">
                  {nearbyPlacesList.map((landmark, idx) => (
                    <div key={idx} className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-slate-800">{landmark.place}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">{landmark.category}</p>
                      </div>
                      <span className="px-2.5 py-1 bg-teal-50 text-teal-600 font-bold rounded-lg border border-teal-100">
                        {landmark.distance}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 8: PROPERTY VIDEO */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold font-display text-slate-800 border-l-4 border-teal-500 pl-3">
              Walkthrough Video
            </h2>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <div className="aspect-video w-full rounded-xl overflow-hidden bg-slate-950 relative border border-slate-200">
                <iframe 
                  src={`https://www.youtube.com/embed/${youtubeVideoId}`}
                  title={`${title} Video Walkthrough`}
                  className="absolute inset-0 w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            </div>
          </section>

        </div>

        {/* SIDEBAR FOR LEAD FORM */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-6">
            
            {/* SECTION 10: LEAD FORM */}
            <section className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-600"></div>
              
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-slate-800 font-display">Schedule a Private Tour</h3>
                <p className="text-xs text-slate-500 mt-1">Book your slots or get answers directly from the builder</p>
              </div>

              {formSuccess ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-6 bg-teal-50 border border-teal-100 rounded-xl text-center space-y-4"
                >
                  <BiCheckCircle className="text-4xl text-teal-500 mx-auto" />
                  <p className="text-sm font-semibold text-slate-700">{formSuccess}</p>
                  <button 
                    onClick={() => setFormSuccess(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
                  >
                    Submit another response
                  </button>
                </motion.div>
              ) : (
                <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
                  {formError && (
                    <div className="p-3 bg-red-50 border border-red-105 text-red-500 rounded-lg">
                      {formError}
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-slate-600 mb-1 font-semibold uppercase tracking-wider text-[10px]">Full Name</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400"><BiUser /></span>
                      <input 
                        type="text" 
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        placeholder="John Doe" 
                        className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-teal-500 focus:outline-none text-slate-800 transition placeholder-slate-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1 font-semibold uppercase tracking-wider text-[10px]">Phone Number</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400"><BiPhoneCall /></span>
                      <input 
                        type="tel" 
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        required
                        placeholder="+91 XXXXX XXXXX" 
                        className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-teal-500 focus:outline-none text-slate-800 transition placeholder-slate-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1 font-semibold uppercase tracking-wider text-[10px]">Email Address</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400"><BiEnvelope /></span>
                      <input 
                        type="email" 
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        placeholder="john.doe@example.com" 
                        className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-teal-500 focus:outline-none text-slate-800 transition placeholder-slate-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1 font-semibold uppercase tracking-wider text-[10px]">Message</label>
                    <div className="relative">
                      <span className="absolute left-3 top-3.5 text-slate-400"><BiMessageDetail /></span>
                      <textarea 
                        name="message"
                        value={formData.message}
                        onChange={handleInputChange}
                        required
                        rows="3"
                        placeholder="Write your custom question..." 
                        className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-teal-500 focus:outline-none text-slate-800 transition placeholder-slate-400 resize-none"
                      />
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={formSubmitting}
                    className="w-full py-3.5 bg-teal-500 hover:bg-teal-650 disabled:bg-slate-100 disabled:text-slate-400 text-white rounded-xl font-bold transition duration-300 shadow-md shadow-teal-500/20 flex items-center justify-center gap-2"
                  >
                    {formSubmitting ? (
                      <>
                        <BiLoaderAlt className="animate-spin text-lg" />
                        Submitting...
                      </>
                    ) : (
                      'Request Free Site Visit'
                    )}
                  </button>
                </form>
              )}
            </section>

            {/* Builder Details */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-xs space-y-4">
              <h4 className="font-bold text-slate-800 mb-1 text-sm">Authorized Marketing Partner</h4>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-teal-50 border border-teal-100 text-teal-600 rounded-full flex items-center justify-center text-xl font-bold shadow-inner">
                  T
                </div>
                <div>
                  <p className="font-bold text-slate-800">Tirumakudalu Properties</p>
                  <p className="text-[10px] text-slate-500">RERA Marketing Partner</p>
                </div>
              </div>
              <div className="space-y-2 text-slate-600 pt-2 border-t border-slate-100">
                <p>Office Address: Konanakunte, Bangalore</p>
                <p className={`${fReraNumber.isDemo ? 'italic text-slate-450' : ''}`}>RERA No: {fReraNumber.text}</p>
              </div>
            </div>

          </div>
        </div>

      </div>



      {/* MOBILE STICKY CTA BAR */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur border-t border-slate-200 p-3 flex gap-3 md:hidden shadow-lg">
        <a 
          href="tel:+919741111756" 
          className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold flex items-center justify-center gap-2 border border-slate-200 text-sm hover:bg-slate-250 transition"
        >
          <BiPhoneCall className="text-teal-500 text-lg" />
          Call Us
        </a>
        <a 
          href={`https://wa.me/919741111756?text=I%20am%20interested%20in%20${encodeURIComponent(title)}.%20Please%20send%20details.`}
          target="_blank"
          rel="noreferrer"
          className="flex-1 py-3 bg-[#25d366] text-white rounded-xl font-bold flex items-center justify-center gap-2 text-sm hover:bg-[#20ba5a] transition"
        >
          <FaWhatsapp className="text-lg" />
          WhatsApp
        </a>
        <button 
          onClick={() => setEnquireModalOpen(true)}
          className="flex-1 py-3 bg-teal-500 text-white rounded-xl font-bold flex items-center justify-center text-sm shadow-lg shadow-teal-500/20 hover:bg-teal-650 transition"
        >
          Enquire
        </button>
      </div>

      {/* FULLSCREEN LIGHTBOX FOR GALLERY */}
      <AnimatePresence>
        {lightboxOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-9999 bg-slate-950/95 flex items-center justify-center p-4"
          >
            <button 
              onClick={() => setLightboxOpen(false)}
              className="absolute top-6 right-6 text-white text-3xl hover:text-teal-400 p-2 focus:outline-none"
            >
              <BiX />
            </button>
            <div className="max-w-4xl max-h-[85vh] w-full relative flex items-center justify-center">
              <button 
                onClick={() => setLightboxIndex((lightboxIndex - 1 + galleryUrls.length) % galleryUrls.length)}
                className="absolute left-0 md:-left-16 text-white hover:text-teal-400 text-4xl p-2 bg-slate-900/50 rounded-full"
              >
                <BiChevronLeft />
              </button>
              <img 
                src={galleryUrls[lightboxIndex]} 
                alt={`${title} Lightbox`} 
                className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl border border-slate-800" 
              />
              <button 
                onClick={() => setLightboxIndex((lightboxIndex + 1) % galleryUrls.length)}
                className="absolute right-0 md:-right-16 text-white hover:text-teal-400 text-4xl p-2 bg-slate-900/50 rounded-full"
              >
                <BiChevronRight />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FLOOR PLAN LIGHTBOX */}
      <AnimatePresence>
        {floorPlanLightboxOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-9999 bg-slate-950/95 flex items-center justify-center p-4"
          >
            <button 
              onClick={() => setFloorPlanLightboxOpen(false)}
              className="absolute top-6 right-6 text-white text-3xl hover:text-teal-400 p-2"
            >
              <BiX />
            </button>
            <div className="max-w-4xl max-h-[85vh] w-full p-4 flex items-center justify-center bg-slate-900/40 rounded-2xl border border-slate-800">
              <img 
                src={floorPlansList[activeFloorPlanIndex]?.image || 'https://images.unsplash.com/photo-1545464693-f1798a373343?auto=format&fit=crop&w=800&q=80'} 
                alt="Floor Plan Detail" 
                className="max-w-full max-h-[80vh] object-contain" 
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* POPUP ENQUIRY MODAL */}
      <AnimatePresence>
        {enquireModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-9999 bg-slate-900/60 flex items-center justify-center p-4 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 30 }}
              className="bg-white border border-slate-200 w-full max-w-md p-6 sm:p-8 rounded-2xl shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-500 to-teal-600"></div>
              
              <button 
                onClick={() => setEnquireModalOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-650 text-2xl"
              >
                <BiX />
              </button>

              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-slate-800 font-display">Enquire About {title}</h3>
                <p className="text-xs text-slate-500 mt-1">Leave your contacts to schedule a site visit or receive cost sheets.</p>
              </div>

              {formSuccess ? (
                <div className="p-4 bg-teal-50 border border-teal-100 rounded-xl text-center space-y-4">
                  <BiCheckCircle className="text-4xl text-teal-600 mx-auto" />
                  <p className="text-sm font-semibold text-slate-700">{formSuccess}</p>
                  <button 
                    onClick={() => {
                      setFormSuccess(null);
                      setEnquireModalOpen(false);
                    }}
                    className="px-5 py-2.5 bg-teal-500 text-white text-sm font-bold rounded-xl transition hover:bg-teal-650 shadow-md"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
                  {formError && (
                    <div className="p-3 bg-red-50 border border-red-100 text-red-500 rounded-lg">
                      {formError}
                    </div>
                  )}

                  <div>
                    <label className="block text-slate-600 mb-1 font-semibold">Your Name</label>
                    <input 
                      type="text" 
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      placeholder="John Doe" 
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-teal-500 focus:outline-none text-slate-850 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1 font-semibold">Phone Number</label>
                    <input 
                      type="tel" 
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                      placeholder="+91 XXXXX XXXXX" 
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-teal-500 focus:outline-none text-slate-850 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1 font-semibold">Email Address</label>
                    <input 
                      type="email" 
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      placeholder="john@example.com" 
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-teal-500 focus:outline-none text-slate-850 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1 font-semibold">Message</label>
                    <textarea 
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      required
                      rows="3"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-teal-500 focus:outline-none text-slate-850 transition resize-none"
                    />
                  </div>

                  <button 
                    type="submit" 
                    disabled={formSubmitting}
                    className="w-full py-3 bg-teal-500 hover:bg-teal-650 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl font-bold transition shadow-lg shadow-teal-500/20"
                  >
                    {formSubmitting ? 'Submitting...' : 'Submit Inquiry'}
                  </button>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* GATED BROCHURE DOWNLOAD MODAL */}
      <AnimatePresence>
        {brochureModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-9999 bg-slate-900/60 flex items-center justify-center p-4 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 30 }}
              className="bg-white border border-slate-200 w-full max-w-md p-6 sm:p-8 rounded-2xl shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-500 to-teal-650"></div>
              
              <button 
                onClick={() => setBrochureModalOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-650 text-2xl"
              >
                <BiX />
              </button>

              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-slate-800 font-display">Download Project Brochure</h3>
                <p className="text-xs text-slate-500 mt-1">Please enter your details to immediately unlock and download the official brochure.</p>
              </div>

              {brochureSuccess ? (
                <div className="p-4 bg-teal-50 border border-teal-100 rounded-xl text-center space-y-4">
                  <BiCheckCircle className="text-4xl text-teal-600 mx-auto animate-bounce" />
                  <p className="text-sm font-semibold text-slate-700">{brochureSuccess}</p>
                </div>
              ) : (
                <form onSubmit={handleBrochureSubmit} className="space-y-4 text-xs">
                  {brochureError && (
                    <div className="p-3 bg-red-50 border border-red-100 text-red-500 rounded-lg">
                      {brochureError}
                    </div>
                  )}

                  <div>
                    <label className="block text-slate-600 mb-1 font-semibold">Your Name</label>
                    <input 
                      type="text" 
                      name="name"
                      value={brochureFormData.name}
                      onChange={handleBrochureInputChange}
                      required
                      placeholder="John Doe" 
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-teal-500 focus:outline-none text-slate-850 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1 font-semibold">Phone Number</label>
                    <input 
                      type="tel" 
                      name="phone"
                      value={brochureFormData.phone}
                      onChange={handleBrochureInputChange}
                      required
                      placeholder="+91 XXXXX XXXXX" 
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-teal-500 focus:outline-none text-slate-850 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1 font-semibold">Email Address</label>
                    <input 
                      type="email" 
                      name="email"
                      value={brochureFormData.email}
                      onChange={handleBrochureInputChange}
                      required
                      placeholder="john@example.com" 
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-teal-500 focus:outline-none text-slate-850 transition"
                    />
                  </div>

                  <button 
                    type="submit" 
                    disabled={brochureSubmitting}
                    className="w-full py-3.5 bg-teal-500 hover:bg-teal-650 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl font-bold transition shadow-lg shadow-teal-500/20"
                  >
                    {brochureSubmitting ? 'Starting Download...' : 'Unlock & Download Brochure'}
                  </button>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
