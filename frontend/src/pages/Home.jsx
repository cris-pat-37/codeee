import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import { api } from '../services/api';
import { SkeletonCard } from '../components/SkeletonLoader';
import { BiMapPin, BiBed, BiArea, BiSearchAlt, BiBuilding, BiUser, BiPhoneCall, BiEnvelope, BiMessageDetail } from 'react-icons/bi';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

export default function Home() {
  const extractAreaNumber = (areaStr) => {
    if (!areaStr) return 0;
    const str = areaStr.toLowerCase().replace(/\d+(?:\.\d+)?\s*(?:bhk|bed|bedroom|villas|villa|apts|apt|apartments)/gi, '').replace(/–/g, '-').replace(/\s*to\s*/g, '-');
    const match = str.match(/(\d{3,5})/);
    if (match) {
      return parseFloat(match[1]);
    }
    return 0;
  };

  const formatStartingPrice = (priceStr, areaStr) => {
    if (!priceStr) return '';
    const str = priceStr.toLowerCase();
    if (str.includes('request')) return 'Price on Request';
    
    // Check if it's a rate per sq.ft and we need to multiply it by the area
    const isRate = str.includes('per sq') || str.includes('/sq') || str.includes('rate');
    if (isRate) {
      const rateMatch = str.match(/(?:rate|rs\.?)?\s*(\d+(?:,\d+)?)(?:\/-)?\s*(?:per|\/)\s*sq/i) || str.match(/(\d+(?:,\d+)?)\s*(?:per|\/)\s*sq/i) || str.match(/(\d{4,5})/);
      if (rateMatch) {
        const rate = parseFloat(rateMatch[1].replace(/,/g, ''));
        if (rate > 0) {
          const areaNum = extractAreaNumber(areaStr);
          if (areaNum > 0) {
            const total = rate * areaNum;
            const formattedVal = total >= 10000000 
              ? parseFloat((total / 10000000).toFixed(2)) + " Cr"
              : parseFloat((total / 100000).toFixed(2)) + " Lakh";
            return `${formattedVal} Onwards`;
          }
        }
      }
    }
    
    // Find all matches for prices in crores or lakhs (e.g. Rs 2.799 cr)
    const regex = /(?:rs\.?\s*)?(\d+(?:\.\d+)?)\s*(?:cr|crore|crores|lakh|lakhs|lakh\s*\+)/g;
    let matches = [];
    let match;
    while ((match = regex.exec(str)) !== null) {
      const val = parseFloat(match[1]);
      const isLakh = match[0].includes('lakh');
      matches.push({
        value: val,
        isLakh: isLakh,
        text: isLakh 
          ? `${parseFloat(val.toFixed(2))} Lakh` 
          : `${parseFloat(val.toFixed(2))} Cr`
      });
    }
    
    if (matches.length > 0) {
      matches.sort((a, b) => {
        const valA = a.isLakh ? a.value : a.value * 100;
        const valB = b.isLakh ? b.value : b.value * 100;
        return valA - valB;
      });
      return `${matches[0].text} Onwards`;
    }
    
    let cleanStr = priceStr.replace(/\s*onwards\s*/i, '').replace(/\+$/, '').trim();
    if (cleanStr.includes(',')) {
      cleanStr = cleanStr.split(',')[0].trim();
    }
    return `${cleanStr} Onwards`;
  };

  const formatStartingArea = (areaStr) => {
    if (!areaStr) return '';
    // Clean BHK and other layouts including typos like bhl or bhr
    const strCleaned = areaStr.toLowerCase().replace(/\d+(?:\.\d+)?\s*(?:bhk|bhl|bhr|hk|bed|bedroom|villas|villa|apts|apt|apartments)/gi, '');
    let str = strCleaned.replace(/–/g, '-').replace(/\s*to\s*/g, '-');
    
    // Strip plot dimensions like 30*40 or 30*50
    str = str.replace(/\d{2}\s*[\*x]\s*\d{2}/g, '');
    
    // Enforce 3 to 5 digits only to avoid matching single configuration digit types
    const regex = /(\d{3,5})\s*(?:sq\.?ft|sqft|sft|sq\s*meters|sq\s*yds|square\s*feet|plot\s*sq\.?ft)?/i;
    const match = str.match(regex);
    if (match) {
      const val = match[1];
      const unitMatch = str.match(/(sq\.?ft|sqft|sft|sq\s*meters|sq\s*yds|square\s*feet|plot\s*sq\.?ft)/i);
      const unit = unitMatch ? unitMatch[0] : 'Sq.ft';
      let displayUnit = 'Sq.ft';
      if (unit.toLowerCase().includes('meter')) displayUnit = 'Sq.m';
      if (unit.toLowerCase().includes('yd')) displayUnit = 'Sq.yds';
      
      const isRange = areaStr.toLowerCase().includes('to') || areaStr.toLowerCase().includes('-') || areaStr.toLowerCase().includes('or') || areaStr.toLowerCase().includes('+');
      return isRange ? `${val} ${displayUnit} Onwards` : `${val} ${displayUnit}`;
    }
    return areaStr;
  };

  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search parameters
  const [keyword, setKeyword] = useState('');
  const [propertyId, setPropertyId] = useState('');
  const [location, setLocation] = useState('All');
  const [propertyType, setPropertyType] = useState('All');
  const [projectStatus, setProjectStatus] = useState('All');

  // Contact Widget Form States
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    message: 'Hello, I would like to enquire about properties. Please contact me.'
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState(null);
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setLoading(true);
        const res = await api.getAllProperties();
        
        // Normalize results
        const rawProperties = res.data || [];
        const normalized = rawProperties.map(p => p.attributes ? { id: p.id, ...p.attributes } : p);
        
        setProperties(normalized);
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch properties for catalog:', err);
        setError('Unable to load listings at the moment. Showing catalog placeholder properties.');
        
        // Load fallback demo property
        setProperties([
          {
            id: 1,
            title: 'Ajmera Marina',
            slug: 'ajmera-marina',
            price: '1.69 Crores',
            location: 'Kempanahalli, Bangalore',
            shortDescription: 'Ajmera Marina offers premium 3BHK residences with lake-view panoramas and 50+ world-class amenities.',
            propertyType: 'Apartment',
            bedrooms: 3,
            area: '1600 Sqft',
            featured: true,
            projectStatus: 'Under Construction',
            mainImage: null
          },
          {
            id: 2,
            title: 'Ivory Terraces',
            slug: 'ivory-terraces',
            price: '2.45 Crores',
            location: 'Kanakapura Road, Bangalore',
            shortDescription: 'Luxury 3.5 BHK penthouses featuring expansive private sky decks and home automation systems.',
            propertyType: 'Apartment',
            bedrooms: 4,
            area: '2200 Sqft',
            featured: true,
            projectStatus: 'Under Construction',
            mainImage: null
          },
          {
            id: 3,
            title: 'Navanaami Courtyard',
            slug: 'navanaami-courtyard',
            price: '1.67 Crores',
            location: 'Hennur, Bangalore',
            shortDescription: 'Elegant community design emphasizing green courtyards and pedestrian-friendly walkways.',
            propertyType: 'Apartment',
            bedrooms: 3,
            area: '1550 Sqft',
            featured: false,
            projectStatus: 'Ready to Move',
            mainImage: null
          },
          {
            id: 4,
            title: 'Sipani City Phase 1',
            slug: 'sipani-city-phase-1',
            price: '1.17 Crores',
            location: 'Electronic City, Bangalore',
            shortDescription: 'Affordable high-end flats optimized for IT professionals near tech corridors.',
            propertyType: 'Apartment',
            bedrooms: 2,
            area: '1200 Sqft',
            featured: false,
            projectStatus: 'Ready to Move',
            mainImage: null
          }
        ]);
        setLoading(false);
      }
    };

    fetchProperties();
  }, []);

  // Form handlers
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
      propertySlug: 'home-sidebar-enquiry',
      propertyName: 'Homepage Sidebar Contact Widget'
    };

    try {
      await api.submitLead(leadPayload);
      setFormSuccess('Thank you! Our representative will call you back shortly.');
      setFormData({
        name: '',
        phone: '',
        email: '',
        message: 'Hello, I would like to enquire about properties. Please contact me.'
      });
    } catch (err) {
      console.error(err);
      setFormError(err.message || 'Failed to submit enquiry. Please try again.');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Compile unique locations for search dropdown
  const uniqueLocations = ['All', ...new Set(properties.map(p => {
    if (!p.location) return '';
    const parts = p.location.split(',');
    return parts.pop()?.trim() || p.location;
  }).filter(Boolean))];

  // Filter listings
  const filteredProperties = properties.filter(p => {
    const matchesKeyword = 
      !keyword || 
      p.title?.toLowerCase().includes(keyword.toLowerCase()) || 
      p.location?.toLowerCase().includes(keyword.toLowerCase()) ||
      p.shortDescription?.toLowerCase().includes(keyword.toLowerCase());
      
    const matchesId = 
      !propertyId || 
      String(p.id).includes(propertyId) ||
      (p.reraNumber && p.reraNumber.toLowerCase().includes(propertyId.toLowerCase()));
      
    const matchesLocation = 
      location === 'All' || 
      p.location?.toLowerCase().includes(location.toLowerCase());
      
    const matchesType = 
      propertyType === 'All' || 
      p.propertyType?.toLowerCase() === propertyType.toLowerCase();

    const matchesStatus = 
      projectStatus === 'All' || 
      p.projectStatus?.toLowerCase().includes(projectStatus.toLowerCase());

    return matchesKeyword && matchesId && matchesLocation && matchesType && matchesStatus;
  });

  // Get featured properties for the Swiper slider
  const featuredProperties = properties.filter(p => p.featured) || [];
  const sliderList = (featuredProperties.length > 0 ? featuredProperties : properties)
    .filter(p => p.mainImage || p.mainImageUrl)
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-[#f7f7f7] text-[#333333] font-sans pb-20">
      
      {/* 2-COLUMN HERO SECTION (SLIDER + SIDEBAR FORM) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Swiper Slider (2/3 width) */}
          <div className="lg:col-span-2 h-[420px] md:h-[480px] rounded-lg overflow-hidden relative shadow-sm border border-slate-100 bg-white">
            <Swiper
              modules={[Navigation, Pagination, Autoplay]}
              navigation
              pagination={{ clickable: true }}
              autoplay={{ delay: 5000, disableOnInteraction: false }}
              className="w-full h-full"
            >
              {sliderList.map((p, idx) => {
                let imgUrl = null;
                if (p.mainImage?.data) {
                  imgUrl = api.getImageUrl(p.mainImage.data.attributes.url);
                } else if (p.mainImageUrl) {
                  imgUrl = api.getImageUrl(p.mainImageUrl);
                } else if (p.mainImage) {
                  imgUrl = typeof p.mainImage === 'string' ? api.getImageUrl(p.mainImage) : api.getImageUrl(p.mainImage.url || null);
                }

                const priceText = p.price || 'Price on Request';

                return (
                  <SwiperSlide key={idx} className="w-full h-full relative">
                    <img 
                      src={imgUrl} 
                      alt={p.title} 
                      className="w-full h-full object-cover" 
                    />
                    
                    {/* White details card overlay matching WordPress theme */}
                    <div className="absolute bottom-10 left-6 right-6 md:left-10 max-w-sm sm:max-w-md bg-white p-5 rounded shadow-lg border border-slate-100 space-y-2.5 z-20 animate-fadeIn">
                      <div className="flex gap-2">
                        <span className="px-2 py-0.5 bg-[#1ea69a] text-white text-[9px] font-bold uppercase tracking-wider rounded">
                          {p.propertyType || 'Apartment'}
                        </span>
                        <span className="px-2 py-0.5 bg-slate-800 text-white text-[9px] font-bold uppercase tracking-wider rounded">
                          Featured
                        </span>
                        <span className="px-2 py-0.5 bg-[#e4f6f4] text-[#1ea69a] text-[9px] font-bold uppercase tracking-wider rounded">
                          For Sale
                        </span>
                      </div>
                      <h2 className="text-xl font-bold font-display text-[#333333] leading-tight line-clamp-1 hover:text-[#1ea69a] transition">
                        <Link to={`/property/${p.slug}`}>{p.title}</Link>
                      </h2>
                      <p className="text-slate-500 text-xs flex items-center">
                        <BiMapPin className="text-[#1ea69a] mr-1 text-sm shrink-0" />
                        {p.location}
                      </p>
                      
                      <div className="flex justify-between items-center border-t border-slate-150 pt-3 mt-1 text-xs">
                        <div className="flex gap-3 text-slate-600">
                          <span className="flex items-center gap-1">
                            <BiBed className="text-[#1ea69a]" /> {p.bedrooms || '3'} BHK
                          </span>
                          <span>•</span>
                          <span>{formatStartingArea(p.area) || '1600 Sqft'}</span>
                        </div>
                        <div>
                          <Link 
                            to={`/property/${p.slug}`}
                            className="text-xs font-bold text-[#1ea69a] hover:underline"
                          >
                            {priceText.toLowerCase().includes('request') ? priceText : `₹${formatStartingPrice(priceText, p.area)}`}
                          </Link>
                        </div>
                      </div>
                    </div>
                  </SwiperSlide>
                );
              })}
            </Swiper>
          </div>

          {/* Right Column: "Let Us Call You!" Widget Form (1/3 width) */}
          <div id="leads" className="col-span-1 bg-white border border-slate-100 p-6 rounded shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-[#333333] border-l-4 border-[#1ea69a] pl-2.5 font-display mb-1 uppercase tracking-wider">
                Let Us Call You!
              </h3>
              <p className="text-xs text-slate-500 mb-4">Leave your details below and a property expert will reach out to you shortly.</p>
              
              {formSuccess ? (
                <div className="p-5 bg-[#e4f6f4] border border-[#cdece9] rounded text-center space-y-3">
                  <div className="w-10 h-10 bg-[#1ea69a] text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto">✓</div>
                  <p className="text-xs font-semibold text-[#333333]">{formSuccess}</p>
                  <button 
                    onClick={() => setFormSuccess(null)}
                    className="px-4 py-1.5 bg-[#1ea69a] text-white text-[10px] font-bold rounded hover:bg-[#16847b] transition"
                  >
                    Send Another Request
                  </button>
                </div>
              ) : (
                <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
                  {formError && (
                    <div className="p-2 bg-red-50 border border-red-100 text-red-500 rounded">
                      {formError}
                    </div>
                  )}
                  <div>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400"><BiUser /></span>
                      <input 
                        type="text" 
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        placeholder="Your Name" 
                        className="w-full pl-8 pr-3 py-3 bg-[#f7f7f7] border border-slate-200 rounded focus:border-[#1ea69a] focus:bg-white focus:outline-none text-[#333333] transition placeholder-slate-400"
                      />
                    </div>
                  </div>
                  <div>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400"><BiEnvelope /></span>
                      <input 
                        type="email" 
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        placeholder="Your Email" 
                        className="w-full pl-8 pr-3 py-3 bg-[#f7f7f7] border border-slate-200 rounded focus:border-[#1ea69a] focus:bg-white focus:outline-none text-[#333333] transition placeholder-slate-400"
                      />
                    </div>
                  </div>
                  <div>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400"><BiPhoneCall /></span>
                      <input 
                        type="tel" 
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        required
                        placeholder="Your Number" 
                        className="w-full pl-8 pr-3 py-3 bg-[#f7f7f7] border border-slate-200 rounded focus:border-[#1ea69a] focus:bg-white focus:outline-none text-[#333333] transition placeholder-slate-400"
                      />
                    </div>
                  </div>
                  <div>
                    <div className="relative">
                      <span className="absolute left-3 top-3.5 text-slate-400"><BiMessageDetail /></span>
                      <textarea 
                        name="message"
                        value={formData.message}
                        onChange={handleInputChange}
                        required
                        rows="3"
                        placeholder="Tell us about desired property" 
                        className="w-full pl-8 pr-3 py-2 bg-[#f7f7f7] border border-slate-200 rounded focus:border-[#1ea69a] focus:bg-white focus:outline-none text-[#333333] transition placeholder-slate-400 resize-none"
                      />
                    </div>
                  </div>
                  <button 
                    type="submit" 
                    disabled={formSubmitting}
                    className="w-full py-3 bg-[#1ea69a] hover:bg-[#16847b] disabled:bg-slate-200 disabled:text-slate-400 text-white rounded font-bold uppercase tracking-wider transition duration-300 shadow"
                  >
                    {formSubmitting ? 'Submitting...' : 'Submit'}
                  </button>
                </form>
              )}
            </div>
          </div>

        </div>
      </section>

      {/* SEARCH BAR SECTION (BELOW THE HERO SLIDER) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="bg-white border border-slate-150 p-5 rounded shadow-sm grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 items-end text-xs text-[#333333]">
          
          <div>
            <label className="block text-slate-600 font-semibold mb-1.5 uppercase tracking-wider text-[10px]">Keyword</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400"><BiSearchAlt /></span>
              <input 
                type="text" 
                placeholder="Any" 
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="w-full pl-8 pr-3 py-2.5 bg-[#f7f7f7] border border-slate-200 rounded focus:border-[#1ea69a] focus:bg-white focus:outline-none text-[#333333]"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-600 font-semibold mb-1.5 uppercase tracking-wider text-[10px]">Property ID</label>
            <input 
              type="text" 
              placeholder="Any" 
              value={propertyId}
              onChange={(e) => setPropertyId(e.target.value)}
              className="w-full px-3 py-2.5 bg-[#f7f7f7] border border-slate-200 rounded focus:border-[#1ea69a] focus:bg-white focus:outline-none text-[#333333]"
            />
          </div>

          <div>
            <label className="block text-slate-600 font-semibold mb-1.5 uppercase tracking-wider text-[10px]">Main Location</label>
            <select 
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-3 py-2.5 bg-[#f7f7f7] border border-slate-200 rounded focus:border-[#1ea69a] focus:bg-white focus:outline-none text-[#333333]"
            >
              <option value="All">All Locations</option>
              {uniqueLocations.filter(loc => loc !== 'All').map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-600 font-semibold mb-1.5 uppercase tracking-wider text-[10px]">Property Status</label>
            <select 
              value={projectStatus}
              onChange={(e) => setProjectStatus(e.target.value)}
              className="w-full px-3 py-2.5 bg-[#f7f7f7] border border-slate-200 rounded focus:border-[#1ea69a] focus:bg-white focus:outline-none text-[#333333]"
            >
              <option value="All">Any Status</option>
              <option value="Under Construction">Under Construction</option>
              <option value="Ready to Move">Ready to Move</option>
            </select>
          </div>

          <div className="flex gap-2">
            <button 
              onClick={() => {
                setKeyword('');
                setPropertyId('');
                setLocation('All');
                setPropertyType('All');
                setProjectStatus('All');
              }}
              className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded transition duration-200 text-center"
            >
              Reset
            </button>
            <button 
              className="flex-1 py-2.5 bg-[#1ea69a] hover:bg-[#16847b] text-white font-bold rounded uppercase tracking-wider transition duration-200"
            >
              Search
            </button>
          </div>

        </div>
      </section>

      {/* PROPERTIES SECTION */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
        <div className="text-center space-y-2 mb-10">
          <h2 className="text-3xl font-bold font-display text-[#333333] tracking-tight uppercase">Properties</h2>
          <p className="text-[#1ea69a] font-bold text-sm uppercase tracking-widest">For Sale</p>
          <div className="w-12 h-1 bg-[#1ea69a] mx-auto mt-2 rounded"></div>
          <p className="text-slate-500 text-xs mt-2 max-w-md mx-auto">Check out latest properties for sale. Showing {filteredProperties.length} listings</p>
        </div>

        {/* Listings Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
          {loading ? (
            [...Array(6)].map((_, i) => <SkeletonCard key={i} />)
          ) : filteredProperties.length === 0 ? (
            <div className="col-span-full py-20 text-center space-y-4">
              <div className="text-5xl text-slate-350 flex justify-center"><BiBuilding /></div>
              <p className="text-slate-500 text-base">No properties match your filter parameters.</p>
              <button 
                onClick={() => {
                  setKeyword('');
                  setPropertyId('');
                  setLocation('All');
                  setPropertyType('All');
                  setProjectStatus('All');
                }}
                className="px-4 py-2 bg-[#e4f6f4] text-[#1ea69a] hover:bg-[#cdece9] rounded text-xs font-bold border border-[#cdece9] transition"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            filteredProperties.map((p, index) => {
              // Parse main image URL
              let mainImageUrl = null;
              if (p.mainImage?.data) {
                mainImageUrl = api.getImageUrl(p.mainImage.data.attributes.url);
              } else if (p.mainImageUrl) {
                mainImageUrl = api.getImageUrl(p.mainImageUrl);
              } else if (p.mainImage) {
                mainImageUrl = typeof p.mainImage === 'string' ? api.getImageUrl(p.mainImage) : api.getImageUrl(p.mainImage.url || null);
              }

              // Prefilled demo data visual placeholder resolution
              const resolveField = (val, placeholder) => {
                if (val && String(val).trim() !== '') {
                  return { text: val, isDemo: false };
                }
                return { text: placeholder, isDemo: true };
              };

              const fLocation = resolveField(p.location, 'Kempanahalli, Bangalore');
              const fBedrooms = resolveField(p.bedrooms, '3');
              const fArea = resolveField(formatStartingArea(p.area), '1600 Sqft');
              const fPrice = resolveField(formatStartingPrice(p.price, p.area), '1.69 Crores');

              return (
                <div
                  key={p.id}
                  className="bg-white rounded overflow-hidden border border-slate-150 flex flex-col h-full wp-card-shadow transition-all duration-300"
                >
                  {/* Card Image */}
                  <div className="h-56 relative overflow-hidden bg-slate-100 flex items-center justify-center border-b border-slate-100">
                    {mainImageUrl ? (
                      <Link to={`/property/${p.slug}`} className="w-full h-full">
                        <img 
                          src={mainImageUrl} 
                          alt={p.title} 
                          className="w-full h-full object-cover transition duration-500 hover:scale-105"
                          loading="lazy"
                        />
                      </Link>
                    ) : (
                      <Link to={`/property/${p.slug}`} className="w-full h-full flex flex-col items-center justify-center bg-slate-50 text-slate-400 select-none">
                        <span className="text-[10px] font-bold uppercase tracking-wider">No Image Available</span>
                      </Link>
                    )}
                    <div className="absolute top-4 left-4">
                      <span className="px-2 py-1 bg-slate-800/80 backdrop-blur-sm text-white text-[9px] font-bold uppercase tracking-wider rounded">
                        Featured
                      </span>
                    </div>
                    <div className="absolute top-4 right-4">
                      <span className="px-2 py-1 bg-[#1ea69a]/80 backdrop-blur-sm text-white text-[9px] font-bold uppercase tracking-wider rounded">
                        For Sale
                      </span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <h3 className="text-base font-bold text-[#333333] hover:text-[#1ea69a] tracking-tight line-clamp-1 transition">
                        <Link to={`/property/${p.slug}`}>{p.title}</Link>
                      </h3>
                      <p className={`text-xs flex items-center ${fLocation.isDemo ? 'text-slate-400 italic' : 'text-slate-500'}`}>
                        <BiMapPin className="text-[#1ea69a] mr-1 text-sm shrink-0" />
                        {fLocation.text}
                      </p>
                      <p className="text-slate-500 text-xs leading-relaxed line-clamp-2 pt-2 border-t border-slate-100">
                        {p.shortDescription || 'A premium residential project configured with spacious BHK options, modern amenities, and prime connectivity.'}
                      </p>
                    </div>

                    {/* Configuration Specs */}
                    <div className="flex gap-4 text-xs text-slate-600">
                      <span className={`flex items-center gap-1 ${fBedrooms.isDemo ? 'text-slate-400 italic' : ''}`}>
                        <BiBed className="text-slate-400 text-sm" />
                        {fBedrooms.text} BHK
                      </span>
                      <span className={`flex items-center gap-1 ${fArea.isDemo ? 'text-slate-400 italic' : ''}`}>
                        <BiArea className="text-slate-400 text-sm" />
                        {fArea.text}
                      </span>
                    </div>

                    {/* Price and Action Button */}
                    <div className="border-t border-slate-100 pt-3 flex justify-between items-center">
                      <div>
                        <p className={`font-bold text-base ${fPrice.isDemo ? 'text-teal-500/60 italic font-normal' : 'text-[#1ea69a]'}`}>₹{fPrice.text}</p>
                      </div>
                      <Link 
                        to={`/property/${p.slug}`}
                        className="px-4 py-2 bg-[#f7f7f7] border border-slate-200 hover:bg-[#1ea69a] hover:text-white text-[#333333] hover:border-teal-500 font-bold rounded text-xs transition duration-200"
                      >
                        Explore Project
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* AMAZING FEATURES SECTION */}
      <section className="bg-white border-t border-b border-slate-150 py-16 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-2 mb-12">
            <h2 className="text-3xl font-bold font-display text-[#333333] tracking-tight uppercase">Amazing Features</h2>
            <p className="text-[#1ea69a] font-bold text-sm uppercase tracking-widest">Test featured from elementor</p>
            <div className="w-12 h-1 bg-[#1ea69a] mx-auto mt-2 rounded"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { title: 'Smart Property Discovery', desc: 'Find your dream home using our advanced filters and accurate mapped coordinates.' },
              { title: 'Premium Real Estate Designs', desc: 'Modern architecture, luxury finishes, and spacious floor layouts curated for comfort.' },
              { title: 'Advanced Property Search', desc: 'Filter by location, property size, price, and builder to pinpoint matching projects.' },
              { title: 'Premium Property Listings', desc: 'Verified homes, complete with high-resolution images, floor plans, and video tours.' },
              { title: 'Luxury Villas & Apartments', desc: 'A curated collection of top-tier residential units in Bangalore\'s prime tech hubs.' },
              { title: 'Featured Properties', desc: 'Hand-picked high-value listings with RERA approvals and premium builder partnerships.' }
            ].map((feat, idx) => (
              <div key={idx} className="p-6 bg-[#f7f7f7] border border-slate-100 rounded text-center space-y-3 hover:shadow-md transition duration-300">
                <div className="w-12 h-12 bg-[#e4f6f4] text-[#1ea69a] rounded-full flex items-center justify-center text-xl font-bold mx-auto">
                  {idx + 1}
                </div>
                <h3 className="font-bold text-[#333333] text-base">{feat.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LOOKING FOR MORE CTA SECTION */}
      <section className="bg-[#1ea69a] text-white py-16 text-center">
        <div className="max-w-4xl mx-auto px-4 space-y-6">
          <h2 className="text-3xl font-bold uppercase tracking-wide">Looking for More?</h2>
          <p className="text-sm text-[#e4f6f4] max-w-md mx-auto">Talk to our experts or Browse through more properties.</p>
          <div className="flex justify-center gap-4 pt-2">
            <a 
              href="#leads" 
              className="px-6 py-3 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded uppercase tracking-wider text-xs transition duration-200 shadow"
            >
              Get In Touch
            </a>
            <button 
              onClick={() => {
                setKeyword('');
                setPropertyId('');
                setLocation('All');
                setPropertyType('All');
                setProjectStatus('All');
                const listingsElement = document.querySelector('main');
                listingsElement?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-6 py-3 bg-white hover:bg-slate-100 text-[#1ea69a] font-bold rounded uppercase tracking-wider text-xs transition duration-200 shadow"
            >
              Browse More
            </button>
          </div>
        </div>
      </section>

    </div>
  );
}
