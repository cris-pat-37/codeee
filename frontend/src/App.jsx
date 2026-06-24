import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import PropertyDetail from './pages/PropertyDetail';
import { HelmetProvider } from 'react-helmet-async';

// Official logo image matching WordPress site
function Logo() {
  return (
    <img 
      src="https://tirumakudaluproperties.com/wp-content/uploads/2026/05/Company_Logo1-removebg-preview_1_cropped_70.png" 
      alt="Tirumakudalu Properties Logo" 
      className="h-[55px] md:h-[65px] w-auto object-contain"
    />
  );
}

export default function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <HelmetProvider>
      <Router>
        <div className="min-h-screen bg-[#f7f7f7] text-[#333333] flex flex-col justify-between font-sans">
          
          {/* Header/Navigation */}
          <header className="bg-white border-b border-slate-100 z-50 sticky top-0 shadow-sm transition-all duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
              {/* Logo Area */}
              <Link to="/" className="flex items-center space-x-2">
                <Logo />
              </Link>
              
              {/* Desktop Nav Items */}
              <nav className="hidden lg:flex items-center space-x-8 text-sm font-semibold uppercase tracking-wider text-[#394041]">
                <Link to="/" className="hover:text-[#1ea69a] transition duration-200">Home</Link>
                <Link to="/" className="hover:text-[#1ea69a] transition duration-200">Residential</Link>
                <Link to="/" className="hover:text-[#1ea69a] transition duration-200">Commercial</Link>
                <Link to="/" className="hover:text-[#1ea69a] transition duration-200">For Sale</Link>
                <Link to="/" className="hover:text-[#1ea69a] transition duration-200">For Rent</Link>
                <a href="#leads" className="hover:text-[#1ea69a] transition duration-200">Contact</a>
              </nav>

              {/* Hamburger Button for Mobile */}
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 text-[#394041] hover:text-[#1ea69a] focus:outline-none"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>

            {/* Mobile Dropdown Menu */}
            {mobileMenuOpen && (
              <div className="lg:hidden bg-white border-t border-slate-100 px-4 py-4 space-y-3 shadow-md animate-fadeIn">
                <Link to="/" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-semibold uppercase tracking-wider text-[#394041] hover:text-[#1ea69a]">Home</Link>
                <Link to="/" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-semibold uppercase tracking-wider text-[#394041] hover:text-[#1ea69a]">Residential</Link>
                <Link to="/" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-semibold uppercase tracking-wider text-[#394041] hover:text-[#1ea69a]">Commercial</Link>
                <Link to="/" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-semibold uppercase tracking-wider text-[#394041] hover:text-[#1ea69a]">For Sale</Link>
                <Link to="/" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-semibold uppercase tracking-wider text-[#394041] hover:text-[#1ea69a]">For Rent</Link>
                <a href="#leads" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-semibold uppercase tracking-wider text-[#394041] hover:text-[#1ea69a]">Contact</a>
              </div>
            )}
          </header>

          {/* Main Pages */}
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/property/:slug" element={<PropertyDetail />} />
            </Routes>
          </main>

          {/* WordPress RealHomes Replica Footer */}
          <footer className="bg-[#232a34] text-[#8a99ad] pt-16 pb-8 border-t-4 border-[#1ea69a] shadow-2xl mt-auto text-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
              
              {/* Column 1: Contact details */}
              <div className="space-y-4">
                <h4 className="font-bold text-white text-base border-b border-slate-700 pb-2 mb-4 uppercase tracking-wider">Contact Details</h4>
                <div className="space-y-3 leading-relaxed text-slate-350">
                  <p className="flex items-start">
                    <span className="font-semibold text-white mr-2.5 shrink-0">Address:</span>
                    <span>78, SBM COLONY, 2ND CROSS, KONANAKUNTE, BANGALORE – 560062</span>
                  </p>
                  <p className="flex items-center">
                    <span className="font-semibold text-white mr-2.5 shrink-0">Email:</span>
                    <a href="mailto:seshadri@tirumakudaluproperties.com" className="hover:text-white transition">seshadri@tirumakudaluproperties.com</a>
                  </p>
                  <p className="flex items-center">
                    <span className="font-semibold text-white mr-2.5 shrink-0">Mobile:</span>
                    <a href="tel:+919741111756" className="hover:text-white transition">+91 97411 11756</a>
                  </p>
                </div>
              </div>

              {/* Column 2: Property Types list */}
              <div className="space-y-4">
                <h4 className="font-bold text-white text-base border-b border-slate-700 pb-2 mb-4 uppercase tracking-wider">Property Types</h4>
                <ul className="space-y-2.5 text-slate-350">
                  {['Commercial', 'Office Space', 'Show Room', 'WareHouse', 'Residential', 'Apartment', 'Individual Houses', 'Villa', 'Villa Plots'].map((type) => (
                    <li key={type} className="flex items-center">
                      <span className="text-[#1ea69a] mr-2">›</span>
                      <Link to="/" className="hover:text-white transition">{type}</Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Column 3: Quick Links */}
              <div className="space-y-4">
                <h4 className="font-bold text-white text-base border-b border-slate-700 pb-2 mb-4 uppercase tracking-wider">Quick Links</h4>
                <ul className="space-y-2.5 text-slate-350">
                  {['Home', 'For Sale', 'For Rent', 'Contact'].map((link) => (
                    <li key={link} className="flex items-center">
                      <span className="text-[#1ea69a] mr-2">›</span>
                      <a href={link === 'Contact' ? '#leads' : '/'} className="hover:text-white transition">{link}</a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Column 4: Property Types Tag Cloud */}
              <div className="space-y-4">
                <h4 className="font-bold text-white text-base border-b border-slate-700 pb-2 mb-4 uppercase tracking-wider">Property Tags</h4>
                <div className="flex flex-wrap gap-2 pt-1">
                  {['Apartment', 'Individual Houses', 'Residential', 'Villa', 'Villa Plots'].map((tag) => (
                    <Link 
                      key={tag} 
                      to="/" 
                      className="px-3 py-1.5 bg-[#2a3440] hover:bg-[#1ea69a] text-slate-300 hover:text-white border border-slate-700 hover:border-teal-500 rounded text-xs transition duration-200 uppercase tracking-wider font-semibold"
                    >
                      {tag}
                    </Link>
                  ))}
                </div>
              </div>

            </div>

            {/* Bottom Copyright Credit */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-6 border-t border-slate-700 flex flex-col md:flex-row items-center justify-between text-xs text-slate-400 gap-4">
              <p>© 2026 Tirumakudalu Properties. All rights reserved.</p>
              <p>Designed by <a href="https://codgres.com" target="_blank" rel="noopener noreferrer" className="text-[#1ea69a] hover:text-white transition font-semibold">Codgres</a></p>
            </div>
          </footer>

        </div>
      </Router>
    </HelmetProvider>
  );
}
