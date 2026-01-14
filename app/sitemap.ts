import { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://mauluna.it'
  
  // Create server-side Supabase client for build time
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mzjrywhxgqddptdxecsx.supabase.co'
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16anJ5d2h4Z3FkZHB0ZHhlY3N4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwMTQzOTMsImV4cCI6MjA4MDU5MDM5M30.p6mvqJT1ptqnX1TDJQrJBBAV4hSovLwUpay5ZHFBKpI'
  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  
  // Fetch all approved properties from Supabase
  const { data: properties } = await supabase
    .from('properties')
    .select('id, updated_at')
    .eq('status', 'approved')
    .order('updated_at', { ascending: false })
    .limit(5000) // Google sitemap limit - 50,000 max
  
  // Generate property URLs with proper lastModified dates
  const propertyUrls: MetadataRoute.Sitemap = properties?.map((property) => ({
    url: `${baseUrl}/annuncio/${property.id}`,
    lastModified: new Date(property.updated_at),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  })) || []
  
  // Static pages with high priority
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/immobili`,
      lastModified: new Date(),
      changeFrequency: 'hourly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/chi-siamo`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    },
    {
      url: `${baseUrl}/contatti`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
    {
      url: `${baseUrl}/come-funziona`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/pubblica-annuncio`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'yearly' as const,
      priority: 0.3,
    },
    {
      url: `${baseUrl}/termini`,
      lastModified: new Date(),
      changeFrequency: 'yearly' as const,
      priority: 0.3,
    },
  ]
  
  // Combine static pages and property listings
  return [...staticPages, ...propertyUrls]
}
