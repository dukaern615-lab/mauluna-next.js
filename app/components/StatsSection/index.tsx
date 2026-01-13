'use client';

import { useState, useEffect } from 'react';

export default function StatsSection() {
  const [stats, setStats] = useState({
    properties: 0,
    users: 0,
    savings: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch properties count
      const propertiesResponse = await fetch('/api/properties');
      if (propertiesResponse.ok) {
        const propertiesData = await propertiesResponse.json();
        const propertiesCount = Array.isArray(propertiesData.properties) 
          ? propertiesData.properties.length 
          : propertiesData.count || 0;
        
        // For users count, try to fetch from API
        let usersCount = 0;
        try {
          const usersResponse = await fetch('/api/users/count');
          if (usersResponse.ok) {
            const usersData = await usersResponse.json();
            usersCount = usersData.count || 0;
          }
        } catch (err) {
          console.error('Error fetching users count:', err);
        }

        // Calculate estimated savings (assuming average commission of 3% on average property value of €300k)
        const avgCommission = 0.03;
        const avgPropertyValue = 300000;
        const estimatedSavings = propertiesCount * avgPropertyValue * avgCommission;

        setStats({
          properties: propertiesCount,
          users: usersCount,
          savings: estimatedSavings
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatCurrency = (num: number) => {
    if (num >= 1000000) {
      return `€${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `€${(num / 1000).toFixed(0)}K`;
    }
    return `€${num.toLocaleString()}`;
  };

  const statItems = [
    {
      icon: 'ri-home-4-line',
      value: loading ? '...' : formatNumber(stats.properties),
      label: 'Proprietà Pubblicate',
      description: 'Immobili verificati e disponibili',
      color: 'from-[#D97860] to-[#C9A876]'
    },
    {
      icon: 'ri-user-line',
      value: loading ? '...' : formatNumber(stats.users),
      label: 'Utenti Attivi',
      description: 'Persone che usano la piattaforma',
      color: 'from-[#C9A876] to-[#D97860]'
    },
    {
      icon: 'ri-money-dollar-circle-line',
      value: loading ? '...' : formatCurrency(stats.savings),
      label: 'Risparmi Generati',
      description: 'Commissioni evitate dai nostri utenti',
      color: 'from-green-500 to-green-600'
    }
  ];

  return (
    <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-[#FAF7F2]">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8 sm:mb-12 lg:mb-16">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#3D2817] mb-3 sm:mb-4">
            Mauluna in Numeri
          </h2>
          <p className="text-sm sm:text-base lg:text-lg text-[#5C4B42] max-w-3xl mx-auto px-4">
            La piattaforma immobiliare gratuita che sta cambiando il modo di cercare e pubblicare immobili a Roma
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {statItems.map((item, index) => (
            <div
              key={index}
              className="bg-white rounded-xl p-6 sm:p-8 lg:p-10 text-center shadow-md hover:shadow-xl transition-all duration-300 border border-[#E8E4E0]"
            >
              <div className={`w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 bg-gradient-to-br ${item.color} rounded-full flex items-center justify-center shadow-lg`}>
                <i className={`${item.icon} text-2xl sm:text-3xl text-white`}></i>
              </div>
              <div className="mb-2 sm:mb-3">
                <span className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#3D2817]">
                  {item.value}
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-[#3D2817] mb-2">
                {item.label}
              </h3>
              <p className="text-sm sm:text-base text-[#5C4B42]">
                {item.description}
              </p>
            </div>
          ))}
        </div>

        {/* Trust Message */}
        <div className="mt-8 sm:mt-12 text-center">
          <div className="inline-flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-3 sm:py-4 bg-white rounded-xl shadow-md border border-[#E8E4E0]">
            <i className="ri-shield-check-line text-2xl sm:text-3xl text-green-500"></i>
            <div className="text-left">
              <p className="text-sm sm:text-base font-semibold text-[#3D2817]">
                100% Gratuito - Sempre
              </p>
              <p className="text-xs sm:text-sm text-[#5C4B42]">
                Nessuna commissione, nessun costo nascosto
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}



