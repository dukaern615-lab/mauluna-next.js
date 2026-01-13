'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Footer() {
  // Detect if user is on mobile device (only on client side)
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.userAgent) {
      setIsMobile(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    }
  }, []);

  // Handle social media clicks with mobile app deep links
  const handleInstagramClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (isMobile) {
      // Try to open Instagram app, fallback to web
      window.location.href = 'instagram://user?username=mauluna.it';
      setTimeout(() => {
        window.open('https://www.instagram.com/mauluna.it/', '_blank');
      }, 1500);
    } else {
      // Desktop: open Instagram web
      window.open('https://www.instagram.com/mauluna.it/', '_blank');
    }
  };

  const handleWhatsAppClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    
    // Track WhatsApp click
    try {
      const { whatsappLeadsFunctions } = await import('@/lib/supabaseFunctions');
      await whatsappLeadsFunctions.trackClick({
        context: 'footer',
        messagePreview: "Ciao! Ho una domanda su Mauluna Immobiliare",
      });
    } catch (err) {
      console.error('Error tracking WhatsApp click:', err);
    }

    const message = encodeURIComponent('Ciao! Ho una domanda su Mauluna Immobiliare');
    const phone = '393508818666';
    
    if (isMobile) {
      // For mobile: Try app first with better intent, fallback to web
      window.location.href = `whatsapp://send?phone=${phone}&text=${message}`;
      setTimeout(() => {
        window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
      }, 1500);
    } else {
      // For desktop: Open WhatsApp Web directly
      window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
    }
  };

  return (
    <footer className="bg-[#3D2817] border-t-2 border-[#C9A876] mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 lg:py-16 pb-24 sm:pb-12 lg:pb-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10 lg:gap-12 mb-8 sm:mb-10">
          {/* Company Info & Social */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="mb-6">
              <img 
                src="https://static.readdy.ai/image/1bbf788ba92aaba852bdb317aec78e6c/849ee4b3cf950628cb8ba641c1f7207f.png" 
                alt="MAULUNA IMMOBILIARE" 
                className="h-12 sm:h-14 w-auto mb-4 brightness-0 invert"
              />
              <p className="text-white/80 text-sm sm:text-base leading-relaxed mb-6">
                La piattaforma immobiliare a Roma che mette in contatto diretto proprietari e acquirenti, senza commissioni.
              </p>
            </div>
            
            {/* Social Media */}
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wide">Seguici</h4>
              <div className="flex items-center space-x-3">
                <a 
                  href="https://www.facebook.com/Maulunaimmobiliare/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-white/10 hover:bg-[#D97860] text-white rounded-lg transition-all cursor-pointer"
                  aria-label="Facebook"
                >
                  <i className="ri-facebook-fill text-lg sm:text-xl"></i>
                </a>
                <a 
                  href="https://www.instagram.com/mauluna.it/" 
                  onClick={handleInstagramClick}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-white/10 hover:bg-[#D97860] text-white rounded-lg transition-all cursor-pointer"
                  aria-label="Instagram"
                >
                  <i className="ri-instagram-line text-lg sm:text-xl"></i>
                </a>
                <a 
                  href="https://wa.me/393508818666?text=Ciao!%20Ho%20una%20domanda%20su%20Mauluna%20Immobiliare" 
                  onClick={handleWhatsAppClick}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-white/10 hover:bg-[#25D366] text-white rounded-lg transition-all cursor-pointer"
                  aria-label="WhatsApp"
                >
                  <i className="ri-whatsapp-line text-lg sm:text-xl"></i>
                </a>
              </div>
            </div>
          </div>
          
          {/* Navigation Links */}
          <div>
            <h4 className="text-white font-semibold mb-4 sm:mb-5 text-sm uppercase tracking-wide">Navigazione</h4>
            <ul className="space-y-2.5 sm:space-y-3">
              <li>
                <Link href="/immobili" className="text-white/80 hover:text-[#D97860] transition-colors text-sm sm:text-base flex items-center group">
                  <i className="ri-arrow-right-s-line mr-2 opacity-0 group-hover:opacity-100 transition-opacity"></i>
                  Tutte le Proprietà
                </Link>
              </li>
              <li>
                <Link href="/pubblica-annuncio" className="text-white/80 hover:text-[#D97860] transition-colors text-sm sm:text-base flex items-center group">
                  <i className="ri-arrow-right-s-line mr-2 opacity-0 group-hover:opacity-100 transition-opacity"></i>
                  Inserisci Annuncio
                </Link>
              </li>
              <li>
                <Link href="/come-funziona" className="text-white/80 hover:text-[#D97860] transition-colors text-sm sm:text-base flex items-center group">
                  <i className="ri-arrow-right-s-line mr-2 opacity-0 group-hover:opacity-100 transition-opacity"></i>
                  Come Funziona
                </Link>
              </li>
              <li>
                <Link href="/chi-siamo" className="text-white/80 hover:text-[#D97860] transition-colors text-sm sm:text-base flex items-center group">
                  <i className="ri-arrow-right-s-line mr-2 opacity-0 group-hover:opacity-100 transition-opacity"></i>
                  Chi Siamo
                </Link>
              </li>
              <li>
                <Link href="/contatti" className="text-white/80 hover:text-[#D97860] transition-colors text-sm sm:text-base flex items-center group">
                  <i className="ri-arrow-right-s-line mr-2 opacity-0 group-hover:opacity-100 transition-opacity"></i>
                  Contatti
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Contact Information */}
          <div>
            <h4 className="text-white font-semibold mb-4 sm:mb-5 text-sm uppercase tracking-wide">Contatti</h4>
            <ul className="space-y-2.5 sm:space-y-3 text-white/80 text-sm sm:text-base">
              <li className="flex items-start space-x-3">
                <i className="ri-whatsapp-line text-[#D97860] mt-0.5 flex-shrink-0"></i>
                <a 
                  href="https://wa.me/393508818666?text=Ciao!%20Ho%20una%20domanda%20su%20Mauluna%20Immobiliare" 
                  onClick={handleWhatsAppClick}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#D97860] transition-colors"
                >
                  +39 350 881 8666
                </a>
              </li>
              <li className="flex items-start space-x-3">
                <i className="ri-mail-line text-[#D97860] mt-0.5 flex-shrink-0"></i>
                <a href="mailto:info@mauluna.it" className="hover:text-[#D97860] transition-colors break-all">
                  info@mauluna.it
                </a>
              </li>
              <li className="flex items-start space-x-3">
                <i className="ri-map-pin-line text-[#D97860] mt-0.5 flex-shrink-0"></i>
                <span>Roma, Italia</span>
              </li>
            </ul>
          </div>
        </div>
        
        {/* Bottom Bar */}
        <div className="border-t border-[#C9A876]/30 pt-6 sm:pt-8 mt-6 sm:mt-8">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0 gap-4">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 sm:gap-4 md:gap-6 text-xs sm:text-sm">
              <Link href="/privacy" className="text-white/70 hover:text-[#D97860] transition-colors">
                Privacy
              </Link>
              <span className="text-white/30">|</span>
              <Link href="/termini" className="text-white/70 hover:text-[#D97860] transition-colors">
                Termini di Servizio
              </Link>
            </div>
            <p className="text-white/70 text-xs sm:text-sm text-center sm:text-right">
              © {new Date().getFullYear()} MAULUNA IMMOBILIARE. Tutti i diritti riservati.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
