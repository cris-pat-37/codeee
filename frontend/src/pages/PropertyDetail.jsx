import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import { Helmet } from 'react-helmet-async';
import L from 'leaflet';
import { api } from '../services/api';
import { PropertyDetailSkeleton } from '../components/SkeletonLoader';

// Icons
import { 
  BiBed, BiBath, BiArea, BiBuilding, BiCalendar, BiUser,
  BiPhoneCall, BiEnvelope, BiMessageDetail, BiDownload,
  BiMapPin, BiShareAlt, BiHeart, BiPlayCircle, BiX,
  BiCheckCircle, BiLoaderAlt, BiChevronLeft, BiChevronRight
} from 'react-icons/bi';
import { FaWhatsapp } from 'react-icons/fa';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

export default function PropertyDetail() {
  const { slug } = useParams();
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
      const lat = parseFloat(property.latitude) || 12.9716;
      const lng = parseFloat(property.longitude) || 77.5946;

      if (mapRef.current) {
        mapRef.current.remove();
      }

      const map = L.map('map-container', {
        zoomControl: true,
        scrollWheelZoom: false
      }).setView([lat, lng], 15);

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

      L.marker([lat, lng], { icon: customIcon })
        .addTo(map)
        .bindPopup(`<div class="text-slate-800 font-sans font-semibold p-1">${property.title}</div>`)
        .openPopup();
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
  const fPrice = resolveField(property?.price, '1.69 Crores');
  const fLocation = resolveField(property?.location, 'Kempanahalli, Bangalore');
  const fBedrooms = resolveField(property?.bedrooms, '3');
  const fBathrooms = resolveField(property?.bathrooms, '3');
  const fArea = resolveField(property?.area, '1600 Sqft');
  const fPropertyType = resolveField(property?.propertyType, 'Apartment');
  const fPossessionDate = resolveField(property?.possessionDate, 'Dec 2027');
  const fBuilderName = resolveField(property?.builderName, 'Tirumakudalu Properties');
  const fReraNumber = resolveField(property?.reraNumber, 'PRM/KA/RERA/1251/310/PR/180627/003456');
  const fProjectStatus = resolveField(property?.projectStatus, 'Under Construction');

  const youtubeVideo = property?.youtubeVideo || 'https://www.youtube.com/watch?v=ScMzIvxBSi4';
  const youtubeVideoId = youtubeVideo.split('v=')[1]?.split('&')[0] || youtubeVideo.split('/').pop() || 'ScMzIvxBSi4';

  // Dynamic Image resolution (Local CMS assets vs Absolute crawled URLs)
  let mainImageUrl = 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80';
  if (property?.mainImage?.data) {
    mainImageUrl = api.getImageUrl(property.mainImage.data.attributes.url);
  } else if (property?.mainImageUrl) {
    mainImageUrl = property.mainImageUrl;
  }

  let galleryUrls = [];
  if (property?.galleryImages?.data) {
    galleryUrls = property.galleryImages.data.map(img => api.getImageUrl(img.attributes.url));
  } else if (property?.galleryImageUrls && Array.isArray(property.galleryImageUrls)) {
    galleryUrls = property.galleryImageUrls;
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

            <div className="flex flex-col sm:flex-row gap-3 text-sm">
              <a 
                href="tel:+919741111756" 
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium border border-slate-200 transition duration-300"
              >
                <BiPhoneCall className="text-lg text-teal-500" />
                Call Agent
              </a>
              <a 
                href={`https://wa.me/919741111756?text=I%20am%20interested%20in%20${encodeURIComponent(title)}%20located%20in%20${encodeURIComponent(fLocation.text)}.%20Please%20send%20more%20details.`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-[#25d366] hover:bg-[#20ba5a] text-white rounded-xl font-bold transition duration-300"
              >
                <FaWhatsapp className="text-lg" />
                WhatsApp
              </a>
              <button 
                onClick={() => setEnquireModalOpen(true)}
                className="flex-1 flex items-center justify-center px-5 py-3 bg-teal-500 hover:bg-teal-650 text-white rounded-xl font-bold transition duration-300 shadow-md shadow-teal-500/20"
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
                { label: 'Bedrooms', value: `${fBedrooms.text} BHK`, icon: <BiBed />, isDemo: fBedrooms.isDemo },
                { label: 'Bathrooms', value: `${fBathrooms.text} Baths`, icon: <BiBath />, isDemo: fBathrooms.isDemo },
                { label: 'Super Built-Up Area', value: fArea.text, icon: <BiArea />, isDemo: fArea.isDemo },
                { label: 'Property Type', value: fPropertyType.text, icon: <BiBuilding />, isDemo: fPropertyType.isDemo },
                { label: 'Possession Date', value: fPossessionDate.text, icon: <BiCalendar />, isDemo: fPossessionDate.isDemo },
                { label: 'Builder Name', value: fBuilderName.text, icon: <BiUser />, isDemo: fBuilderName.isDemo }
              ].map((item, index) => (
                <motion.div 
                  key={index}
                  whileHover={{ y: -5 }}
                  className="bg-white p-4 rounded-xl border border-slate-200 flex items-center space-x-4 shadow-sm"
                >
                  <div className="text-2xl text-teal-600 bg-teal-50 p-3 rounded-lg">
                    {item.icon}
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider">{item.label}</p>
                    <p className={`text-sm font-bold mt-0.5 ${item.isDemo ? 'text-slate-450 italic font-normal' : 'text-slate-800'}`}>
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
                dangerouslySetInnerHTML={{ __html: property?.longDescription || '<p>Premium residences in Bangalore by Tirumakudalu Properties.</p>' }}
              />
              <div className="pt-4 flex flex-wrap gap-4 items-center">
                <a 
                  href={property?.brochureUrl || '#'} 
                  download 
                  onClick={(e) => {
                    if (!property?.brochureUrl) {
                      e.preventDefault();
                      alert('Brochure file is being generated. An agent will send it over WhatsApp shortly.');
                    }
                  }}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-teal-500 hover:bg-teal-650 text-white rounded-xl font-bold transition duration-300 text-sm shadow-md"
                >
                  <BiDownload className="text-lg" />
                  Download Brochure
                </a>
                <div className="text-xs text-slate-500 flex flex-col justify-center">
                  <p>RERA Registration Number:</p>
                  <p className={`font-semibold mt-0.5 ${fReraNumber.isDemo ? 'text-slate-450 italic font-normal' : 'text-slate-700'}`}>
                    {fReraNumber.text}
                  </p>
                </div>
              </div>
            </div>
          </section>

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

      {/* SECTION 9: SIMILAR PROPERTIES */}
      {similarProperties.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-20 space-y-6">
          <h2 className="text-2xl font-bold font-display text-slate-800 border-l-4 border-teal-500 pl-3">
            Similar Premium Projects
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {similarProperties.map((p, idx) => {
              const pTitle = p.title || 'Premium Project';
              const pLoc = p.location || 'Bangalore';
              const pPrice = p.price || 'Price on Request';
              const pArea = p.area || '1500 Sqft';
              const pBhk = p.bedrooms || '3';
              
              let pImage = 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80';
              if (p.mainImage?.data) {
                pImage = api.getImageUrl(p.mainImage.data.attributes.url);
              } else if (p.mainImageUrl) {
                pImage = p.mainImageUrl;
              }

              return (
                <motion.div 
                  key={idx}
                  whileHover={{ y: -8 }}
                  className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm flex flex-col h-full hover:shadow-md transition duration-300"
                >
                  <div className="h-48 relative overflow-hidden bg-slate-100 border-b border-slate-150">
                    <img 
                      src={pImage} 
                      alt={pTitle} 
                      className="w-full h-full object-cover transition duration-500 hover:scale-105" 
                    />
                    <span className="absolute top-4 left-4 px-2.5 py-1 bg-teal-500 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg shadow-sm">
                      {p.propertyType}
                    </span>
                  </div>
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-slate-800 text-lg tracking-tight line-clamp-1">{pTitle}</h3>
                      <p className="text-xs text-slate-500 mt-1 flex items-center"><BiMapPin className="mr-0.5 text-teal-500" />{pLoc}</p>
                      
                      <div className="flex gap-4 mt-4 text-xs text-slate-600">
                        <span className="flex items-center gap-1"><BiBed className="text-teal-500" />{pBhk} BHK</span>
                        <span className="flex items-center gap-1"><BiArea className="text-teal-500" />{pArea}</span>
                      </div>
                    </div>

                    <div className="mt-6 border-t border-slate-100 pt-4 flex justify-between items-center text-xs">
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider">Starting From</p>
                        <p className="font-bold text-slate-800 text-base">₹{pPrice}</p>
                      </div>
                      <Link 
                        to={`/property/${p.slug}`} 
                        className="px-4 py-2 bg-slate-100 hover:bg-teal-500 hover:text-white text-slate-700 text-xs font-bold rounded-xl transition duration-300"
                      >
                        Explore Project
                      </Link>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>
      )}

      {/* MOBILE STICKY CTA BAR */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur border-t border-slate-200 p-3 flex gap-3 md:hidden shadow-lg">
        <a 
          href="tel:+919741111756" 
          className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold flex items-center justify-center gap-2 border border-slate-200 text-sm hover:bg-slate-250 transition"
        >
          <BiPhoneCall className="text-teal-500 text-lg" />
          Call
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
    </div>
  );
}
