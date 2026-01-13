'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

// PropertyCard Component
const PropertyCard = ({ property }: { property: any }) => {
  const router = useRouter();
  const [showContactModal, setShowContactModal] = useState(false);

  // Contact Modal Component
  const ContactModal = () => {
    const modalRef = useRef<HTMLDivElement>(null);
    const [showMessageForm, setShowMessageForm] = useState(false);
    const [message, setMessage] = useState('');
    const [messageSent, setMessageSent] = useState(false);

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
          setShowContactModal(false);
          setShowMessageForm(false);
          setMessageSent(false);
        }
      };

      if (showContactModal) {
        document.addEventListener('mousedown', handleClickOutside);
        document.body.style.overflow = 'hidden';
      }

      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.body.style.overflow = 'unset';
      };
    }, [showContactModal]);

    const handleSendMessage = () => {
      setMessageSent(true);
      setTimeout(() => {
        setShowContactModal(false);
        setShowMessageForm(false);
        setMessageSent(false);
        setMessage('');
      }, 2000);
    };

    if (!showContactModal) return null;

    // Add helper function if not already defined
    const formatPrice = (price: number, type: string) => {
      if (type === 'rent') {
        return `€${price.toLocaleString('it-IT')}/mese`;
      }
      return `€${price.toLocaleString('it-IT')}`;
    };

    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div ref={modalRef} className="bg-white rounded-xl max-w-md w-full shadow-2xl">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800">Contatta il Proprietario</h3>
              <button
                onClick={() => {
                  setShowContactModal(false);
                  setShowMessageForm(false);
                  setMessageSent(false);
                }}
                className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
              >
                <i className="ri-close-line text-xl text-gray-600"></i>
              </button>
            </div>
            
            <div className="bg-[#F9F6F3] rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 flex items-center justify-center bg-[#D97860] rounded-full text-white font-bold text-lg">
                  {property.owner?.name?.charAt(0) || 'P'}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">{property.owner?.name || 'Proprietario'}</h4>
                  <p className="text-sm text-gray-600">Proprietario</p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="space-y-3">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                <div className="flex items-center text-green-700">
                  <i className="ri-shield-check-line mr-2"></i>
                  <span className="text-sm font-medium">Contatto Diretto • 0% Commissioni</span>
                </div>
              </div>

              <a
                href={`https://wa.me/393508818666?text=${encodeURIComponent(`Ciao, sono interessato all'immobile: ${property.title} in ${property.zone}. Prezzo: ${formatPrice(property.price, property.type)}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={async () => {
                  try {
                    const { whatsappLeadsFunctions } = await import('@/lib/supabaseFunctions');
                    await whatsappLeadsFunctions.trackClick({
                      context: 'property_card',
                      messagePreview: `Ciao, sono interessato all'immobile: ${property.title} in ${property.zone}. Prezzo: ${formatPrice(property.price, property.type)}`,
                    });
                  } catch (err) {
                    // Silent fail
                  }
                }}
                className="flex items-center justify-between w-full p-4 bg-[#25D366] text-white rounded-lg hover:bg-[#20BA5A] transition-colors cursor-pointer"
              >
                <div className="flex items-center">
                  <i className="ri-whatsapp-line text-2xl mr-3"></i>
                  <div className="text-left">
                    <div className="font-semibold">WhatsApp</div>
                    <div className="text-sm opacity-90">+39 350 881 8666</div>
                  </div>
                </div>
                <i className="ri-arrow-right-line text-xl"></i>
              </a>

              <a
                href="tel:+393508818666"
                className="flex items-center justify-between w-full p-4 bg-[#D97860] text-white rounded-lg hover:bg-[#C86B54] transition-colors cursor-pointer"
              >
                <div className="flex items-center">
                  <i className="ri-phone-line text-2xl mr-3"></i>
                  <div className="text-left">
                    <div className="font-semibold">Telefono</div>
                    <div className="text-sm opacity-90">+39 340 123 4567</div>
                  </div>
                </div>
                <i className="ri-arrow-right-line text-xl"></i>
              </a>

              <a
                href={`mailto:info@mauluna.it?subject=${encodeURIComponent(`Interesse per: ${property.title}`)}&body=${encodeURIComponent(`Ciao,\n\nSono interessato all'immobile:\n${property.title}\n${property.zone}, Roma\nPrezzo: ${formatPrice(property.price, property.type)}\n\nGrazie`)}`}
                className="flex items-center justify-between w-full p-4 bg-[#C9A876] text-white rounded-lg hover:bg-[#B89766] transition-colors cursor-pointer"
              >
                <div className="flex items-center">
                  <i className="ri-mail-line text-2xl mr-3"></i>
                  <div className="text-left">
                    <div className="font-semibold">Email</div>
                    <div className="text-sm opacity-90">info@mauluna.it</div>
                  </div>
                </div>
                <i className="ri-arrow-right-line text-xl"></i>
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Your PropertyCard JSX content here */}
      {/* Add a button to trigger the modal */}
      <button 
        onClick={() => setShowContactModal(true)}
        className="bg-[#D97860] text-white px-4 py-2 rounded-lg hover:bg-[#C86B54] transition-colors"
      >
        Contatta Proprietario
      </button>
      <ContactModal />
    </>
  );
};

export default PropertyCard;
