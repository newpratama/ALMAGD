export interface SchemaOrgOrganization {
  '@context': 'https://schema.org';
  '@type': 'Organization';
  name: string;
  url: string;
  logo: string;
  description: string;
}

export interface SchemaOrgLodging {
  '@context': 'https://schema.org';
  '@type': 'LodgingBusiness';
  name: string;
  description: string;
  url: string;
  telephone?: string;
  address: {
    '@type': 'PostalAddress';
    streetAddress?: string;
    addressLocality?: string;
    addressRegion?: string;
    postalCode?: string;
    addressCountry: string;
  };
  geo?: {
    '@type': 'GeoCoordinates';
    latitude: number;
    longitude: number;
  };
  amenityFeature?: Array<{
    '@type': 'LocationFeatureSpecification';
    name: string;
    value: boolean;
  }>;
}

export interface SchemaOrgRestaurant {
  '@context': 'https://schema.org';
  '@type': 'Restaurant';
  name: string;
  description: string;
  url: string;
  telephone?: string;
  address: {
    '@type': 'PostalAddress';
    streetAddress?: string;
    addressLocality?: string;
    addressRegion?: string;
    postalCode?: string;
    addressCountry: string;
  };
  servesCuisine?: string[];
}

export function buildOrganizationSchema(siteUrl: string = 'https://almagd.id'): SchemaOrgOrganization {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'ALMAGD Hospitality',
    url: siteUrl,
    logo: `${siteUrl}/favicon.svg`,
    description: 'Hospitality brand in Puncak, Bogor, Indonesia, encompassing New Pratama Villa, Villa NJD, and NJD Cafe.',
  };
}

export function buildVenueSchema(venue: any, siteUrl: string = 'https://almagd.id'): SchemaOrgLodging | SchemaOrgRestaurant {
  const isRestaurant = venue.type === 'cafe' || venue.collection === 'dining';

  const address = {
    '@type': 'PostalAddress' as const,
    streetAddress: venue.address.street || undefined,
    addressLocality: venue.address.district || venue.address.village || undefined,
    addressRegion: venue.address.province || undefined,
    postalCode: venue.address.postalCode || undefined,
    addressCountry: venue.address.country || 'ID',
  };

  const pageUrl = isRestaurant
    ? `${siteUrl}/dining/${venue.slug}`
    : `${siteUrl}/properties/${venue.slug}`;

  if (isRestaurant) {
    return {
      '@context': 'https://schema.org',
      '@type': 'Restaurant',
      name: venue.name,
      description: venue.summary.en || venue.summary.id,
      url: pageUrl,
      telephone: venue.phone || undefined,
      address,
      servesCuisine: venue.servesCuisine ? venue.servesCuisine.map((c: any) => c.en || c.id) : undefined,
    };
  }

  const lodging: SchemaOrgLodging = {
    '@context': 'https://schema.org',
    '@type': 'LodgingBusiness',
    name: venue.name,
    description: venue.summary.en || venue.summary.id,
    url: pageUrl,
    telephone: venue.phone || undefined,
    address,
  };

  if (venue.geo) {
    lodging.geo = {
      '@type': 'GeoCoordinates',
      latitude: venue.geo.lat,
      longitude: venue.geo.lng,
    };
  }

  if (venue.facilities && venue.facilities.length > 0) {
    lodging.amenityFeature = venue.facilities.map((f: string) => ({
      '@type': 'LocationFeatureSpecification',
      name: f,
      value: true,
    }));
  }

  return lodging;
}
