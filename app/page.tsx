'use client';

import React from 'react';
import Header from '@/components/feature/Header';
import Footer from '@/components/feature/Footer';
import HeroSection from './components/HeroSection';
import ContactCTA from './components/ContactCTA';
import AboutPlatform from './components/AboutPlatform';
import FeaturedProperties from './components/FeaturedProperties';
import RecentProperties from './components/RecentProperties';
import FAQSchema, { homepageFAQs } from '@/components/FAQSchema';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* FAQ Schema for SEO */}
      <FAQSchema faqs={homepageFAQs} />
      
      <Header />
      <HeroSection />
      <ContactCTA />
      <AboutPlatform />
      <FeaturedProperties />
      <RecentProperties />
      <Footer />
    </div>
  );
}
