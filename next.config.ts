import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  async rewrites() {
    return [
      { source: '/immobili', destination: '/properties' },
      { source: '/annuncio/:path*', destination: '/property/:path*' },
      { source: '/pubblica-annuncio', destination: '/add-listing' },
      { source: '/risultati-ricerca', destination: '/search-results' },
      { source: '/chi-siamo', destination: '/about' },
      { source: '/contatti', destination: '/contact' },
      { source: '/come-funziona', destination: '/how-it-works' },
      { source: '/accedi', destination: '/login' },
      { source: '/registrati', destination: '/register' },
      { source: '/reimposta-password', destination: '/reset-password' },
      { source: '/profilo', destination: '/profile' },
      { source: '/preferiti', destination: '/favorites' },
      { source: '/messaggi', destination: '/messages' },
      { source: '/notifiche', destination: '/notifications' },
      { source: '/termini', destination: '/terms' },
    ];
  },
};

export default nextConfig;
