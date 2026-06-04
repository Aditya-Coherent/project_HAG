'use client'

import Image from 'next/image'
import { Phone, Mail, MapPin, Linkedin, Facebook, Twitter } from 'lucide-react'

export function Footer({ variant = 'default' }: { variant?: 'default' | 'magma' }) {
  const magma = variant === 'magma'
  // Theme-dependent classes — magma reuses the electric-blue palette.
  const stripBg = magma ? 'bg-[#0726a0] border-b border-white/10' : 'bg-gray-200 border-b border-gray-300'
  const stripText = magma ? 'text-white/90' : 'text-black'
  const footerBg = magma ? 'bg-[#0a3cce] text-white/80' : 'bg-gray-800 text-gray-300'
  const bodyText = magma ? 'text-white/75' : 'text-gray-300'
  const linkText = magma ? 'text-white/75 hover:text-white' : 'text-gray-300 hover:text-white'
  const divider = magma ? 'border-white/10' : 'border-gray-700'
  const copyText = magma ? 'text-white/60' : 'text-gray-400'

  return (
    <>
      {/* Contact Us Strip */}
      <div className={stripBg}>
        <div className="container mx-auto px-6 py-3">
          <div className="flex flex-wrap items-center gap-6 text-sm">
            <span className={`font-semibold ${stripText}`}>Contact Us</span>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Phone className={`h-4 w-4 ${stripText}`} />
                <span className={stripText}>United States: <strong>+1-252-477-1362</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className={`h-4 w-4 ${stripText}`} />
                <span className={stripText}>United Kingdom: <strong>+44-203-957-8553 / +44-203-949-5508</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className={`h-4 w-4 ${stripText}`} />
                <span className={stripText}>Australia: <strong>+61-8-7924-7805</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className={`h-4 w-4 ${stripText}`} />
                <span className={stripText}>India: <strong>+91-848-285-0837</strong></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <footer className={footerBg}>
        <div className="container mx-auto px-6 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
            {/* Left Column - Contact and Office Information */}
            <div className="lg:col-span-2 space-y-4">
              <div>
                <p className="text-white font-semibold mb-2">For Business Enquiry :</p>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <a href="mailto:sales@coherentmarketinsights.com" className="text-gray-300 hover:text-white">
                    sales@coherentmarketinsights.com
                  </a>
                </div>
              </div>
              
              <div>
                <p className="text-white font-semibold mb-2">Sales Office (U.S.) :</p>
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-1 flex-shrink-0" />
                  <p className={`${bodyText} text-sm`}>
                    Coherent Market Insights Pvt Ltd, 533 Airport Boulevard, Suite 400, Burlingame, CA 94010, United States
                  </p>
                </div>
              </div>
              
              <div>
                <p className="text-white font-semibold mb-2">Asia Pacific Intelligence Center (India) :</p>
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-1 flex-shrink-0" />
                  <p className={`${bodyText} text-sm`}>
                    Coherent Market Insights Pvt Ltd, 401-402, Bremen Business Center, University Road, Aundh, Pune - 411007, India.
                  </p>
                </div>
              </div>
            </div>

            {/* Menu Column */}
            <div>
              <h3 className="text-white font-semibold mb-4">Menu</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className={`${linkText} transition-colors`}>About Us</a></li>
                <li><a href="#" className={`${linkText} transition-colors`}>Industries</a></li>
                <li><a href="#" className={`${linkText} transition-colors`}>Services</a></li>
                <li><a href="#" className={`${linkText} transition-colors`}>Contact Us</a></li>
                <li><a href="#" className={`${linkText} transition-colors`}>Careers</a></li>
              </ul>
            </div>

            {/* Reader Club Column */}
            <div>
              <h3 className="text-white font-semibold mb-4">Reader Club</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className={`${linkText} transition-colors`}>Latest Insights</a></li>
                <li><a href="#" className={`${linkText} transition-colors`}>COVID-19 Tracker</a></li>
                <li><a href="#" className={`${linkText} transition-colors`}>Press Release</a></li>
                <li><a href="#" className={`${linkText} transition-colors`}>Infographics</a></li>
                <li><a href="#" className={`${linkText} transition-colors`}>Blogs</a></li>
                <li><a href="#" className={`${linkText} transition-colors`}>News</a></li>
              </ul>
            </div>

            {/* Help Column */}
            <div>
              <h3 className="text-white font-semibold mb-4">Help</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className={`${linkText} transition-colors`}>Become Reseller</a></li>
                <li><a href="#" className={`${linkText} transition-colors`}>How To Order?</a></li>
                <li><a href="#" className={`${linkText} transition-colors`}>Terms and Conditions</a></li>
                <li><a href="#" className={`${linkText} transition-colors`}>Privacy Policy</a></li>
                <li><a href="#" className={`${linkText} transition-colors`}>Disclaimer</a></li>
                <li><a href="#" className={`${linkText} transition-colors`}>Sitemap</a></li>
                <li><a href="#" className={`${linkText} transition-colors`}>Feeds</a></li>
              </ul>
            </div>
          </div>

          {/* Right Section - HR, Social Media, Payment */}
          <div className={`mt-8 pt-8 border-t ${divider}`}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* HR Contact */}
              <div>
                <p className="text-white font-semibold mb-2">HR Contact :</p>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <span className={bodyText}>+91-7262891127</span>
                </div>
              </div>

              {/* Social Media */}
              <div>
                <p className="text-white font-semibold mb-3">Connect With Us :</p>
                <div className="flex gap-3">
                  <a 
                    href="#" 
                    className="w-10 h-10 bg-blue-600 rounded flex items-center justify-center text-white hover:bg-blue-700 transition-colors"
                    aria-label="LinkedIn"
                  >
                    <Linkedin className="h-5 w-5" />
                  </a>
                  <a 
                    href="#" 
                    className="w-10 h-10 bg-black rounded flex items-center justify-center text-white hover:bg-gray-800 transition-colors"
                    aria-label="Twitter"
                  >
                    <Twitter className="h-5 w-5" />
                  </a>
                  <a 
                    href="#" 
                    className="w-10 h-10 bg-blue-700 rounded flex items-center justify-center text-white hover:bg-blue-800 transition-colors"
                    aria-label="Facebook"
                  >
                    <Facebook className="h-5 w-5" />
                  </a>
                  <a 
                    href="#" 
                    className="w-10 h-10 bg-red-600 rounded flex items-center justify-center text-white hover:bg-red-700 transition-colors font-bold"
                    aria-label="Pinterest"
                  >
                    <span className="text-sm">P</span>
                  </a>
                </div>
              </div>

              {/* Payment Methods */}
              <div>
                <p className="text-white font-semibold mb-3">Secure Payment By :</p>
                <div className="flex flex-wrap gap-3 items-center">
                  <div className="px-3 py-2 bg-white rounded text-blue-600 font-bold text-xs">VISA</div>
                  <div className="px-3 py-2 bg-white rounded text-orange-600 font-bold text-xs">DISCOVER</div>
                  <div className="px-3 py-2 bg-white rounded text-red-600 font-bold text-xs">MasterCard</div>
                  <div className="px-3 py-2 bg-white rounded text-blue-600 font-bold text-xs">AMERICAN EXPRESS</div>
                </div>
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div className={`mt-8 pt-6 border-t ${divider} text-center`}>
            <p className={`${copyText} text-sm`}>
              © 2026 Coherent Market Insights Pvt Ltd. All Rights Reserved.
            </p>
          </div>
        </div>
      </footer>
    </>
  )
}

