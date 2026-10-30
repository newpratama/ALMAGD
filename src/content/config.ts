import { defineCollection, z } from 'astro:content';

const l10nSchema = z.object({
  id: z.string(),
  en: z.string().optional(),
  ar: z.string().optional(),
});

const factStatusSchema = z.enum([
  'USER_CONFIRMED',
  'USER_PROVIDED',
  'OFFICIAL_SOURCE',
  'VERIFIED',
  'VERIFIED_MULTIPLE_SOURCES',
  'PUBLIC_SOURCE_ONLY',
  'NEEDS_CONFIRMATION',
  'CONFLICT',
  'SUSPICIOUS',
  'MISSING',
  'SOURCE_NOT_ACCESSIBLE',
]);

// 1. Site configuration & facilities dictionary
const siteConfigSchema = z.object({
  type: z.literal('site_config').default('site_config'),
  brandName: z.string(),
  brandNameAr: z.string(),
  groupName: l10nSchema,
  corporateDescriptor: l10nSchema,
  tagline: l10nSchema,
  descriptor: l10nSchema,
  legalName: z.string(),
  logo: z
    .object({
      svg: z.string().nullable().optional(),
      svgInverse: z.string().nullable().optional(),
      alt: l10nSchema.optional(),
    })
    .nullable()
    .optional(),
  defaultOgImage: z.string(),
  email: z.string().email().nullable().optional(),
  phone: z.string().nullable().optional(),
  socials: z
    .array(
      z.object({
        platform: z.enum(['instagram', 'tiktok', 'facebook']),
        url: z.string().url(),
        handle: z.string(),
        status: factStatusSchema,
      })
    )
    .default([]),
  domain: z.string(),
  lastUpdated: z.string(),
});

const facilityItemSchema = z.object({
  id: z.string(),
  icon: z.string(),
  label: l10nSchema,
});

const facilitiesDictionarySchema = z.object({
  type: z.literal('facilities_dict').default('facilities_dict'),
  facilities: z.array(facilityItemSchema),
});

const siteCollection = defineCollection({
  type: 'data',
  schema: z.union([siteConfigSchema, facilitiesDictionarySchema]),
});

// 2. Venues
const venueSchema = z.object({
  id: z.string(),
  slug: z.string(),
  type: z.enum(['villa', 'hotel', 'resort', 'restaurant', 'cafe', 'experience']),
  collection: z.enum(['stays', 'dining', 'experiences']),
  name: z.string(),
  shortName: z.string().optional(),
  typeLabel: l10nSchema,
  endorsement: l10nSchema,
  status: z.enum(['draft', 'published']),
  sortOrder: z.number().int(),
  summary: l10nSchema,
  description: l10nSchema,
  highlights: z
    .array(
      z.object({
        icon: z.string(),
        label: l10nSchema,
        factRef: z.string(),
      })
    )
    .default([]),
  address: z.object({
    street: z.string(),
    village: z.string(),
    district: z.string(),
    regency: z.string(),
    province: z.string(),
    postalCode: z.string(),
    country: z.string(),
  }),
  geo: z
    .object({
      lat: z.number(),
      lng: z.number(),
    })
    .nullable()
    .optional(),
  mapsUrl: z.string().nullable().optional(),
  directionsUrl: z.string().nullable().optional(),
  placeId: z.string().nullable().optional(),
  staticMap: z.string().nullable().optional(),
  phone: z.string(),
  whatsapp: z.string(),
  email: z.string().nullable().optional(),
  socials: z
    .array(
      z.object({
        platform: z.enum(['instagram', 'tiktok', 'facebook']),
        url: z.string(),
        handle: z.string(),
      })
    )
    .default([]),
  otaLinks: z
    .array(
      z.object({
        platform: z.enum(['traveloka', 'tiket', 'agoda', 'booking_com', 'trip_com']),
        url: z.string().url(),
        verified: z.boolean(),
      })
    )
    .default([]),
  checkIn: z.string().nullable().optional(),
  checkOut: z.string().nullable().optional(),
  openingHours: z
    .array(
      z.object({
        days: z.array(z.string()),
        opens: z.string(),
        closes: z.string(),
      })
    )
    .default([]),
  servesCuisine: z.array(l10nSchema).default([]),
  acceptsWalkIns: z.boolean().nullable().optional(),
  facilities: z.array(z.string()).default([]),
  policies: z
    .array(
      z.object({
        key: z.string(),
        value: l10nSchema,
      })
    )
    .default([]),
  heroImage: z.string(),
  cardImage: z.string(),
  gallery: z.array(z.string()).default([]),
  faqIds: z.array(z.string()).default([]),
  relatedVenueIds: z.array(z.string()).default([]),
  ratingIds: z.array(z.string()).default([]),
  seo: z.object({
    title: l10nSchema,
    description: l10nSchema,
    ogImage: z.string().optional(),
  }),
  fieldStatus: z.record(z.string(), factStatusSchema).default({}),
});

const venuesCollection = defineCollection({
  type: 'data',
  schema: venueSchema,
});

// 3. Rooms
const roomSchema = z.object({
  id: z.string(),
  venueId: z.string(),
  slug: z.string(),
  name: z.string(),
  kind: z.enum(['room', 'villa']),
  summary: l10nSchema,
  sizeM2: z.number().nullable().optional(),
  maxGuests: z.number().int().nullable().optional(),
  bedrooms: z.number().int().nullable().optional(),
  beds: l10nSchema.nullable().optional(),
  bathrooms: z.number().int().nullable().optional(),
  features: z.array(z.string()).default([]),
  images: z.array(z.string()).default([]),
  sortOrder: z.number().int(),
  status: z.enum(['draft', 'published', 'hidden']),
  fieldStatus: z.record(z.string(), factStatusSchema).default({}),
});

const roomsCollection = defineCollection({
  type: 'data',
  schema: roomSchema,
});

// 4. Menu (Categories and Items)
const menuCategorySchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: l10nSchema,
  description: l10nSchema.optional(),
  sortOrder: z.number().int(),
  visible: z.boolean().default(true),
});

const menuItemSchema = z.object({
  id: z.string(), // m001..m047
  slug: z.string(),
  name: z.string(), // original Indonesian name
  altName: l10nSchema.optional(),
  categoryId: z.string(),
  description: l10nSchema.optional(),
  price: z.number().int().nullable(), // null -> Ask for price
  currency: z.literal('IDR').default('IDR'),
  image: z.string().nullable().optional(),
  availability: z.enum(['available', 'seasonal', 'unavailable']).default('available'),
  featured: z.boolean().default(false),
  dietary: z.array(z.enum(['halal', 'vegetarian', 'contains-nuts', 'contains-dairy'])).default([]),
  spicy: z.number().int().min(0).max(3).default(0),
  variants: z
    .array(
      z.object({
        name: l10nSchema,
        price: z.number().int().nullable(),
      })
    )
    .default([]),
  notes: z.string().optional(),
  sortOrder: z.number().int(),
  status: z.enum(['draft', 'published', 'hidden']).default('draft'),
});

const menuCategoriesFileSchema = z.object({
  type: z.literal('menu_categories').default('menu_categories'),
  categories: z.array(menuCategorySchema),
});

const menuItemsFileSchema = z.object({
  type: z.literal('menu_items').default('menu_items'),
  items: z.array(menuItemSchema),
});

const menuCollection = defineCollection({
  type: 'data',
  schema: z.union([menuCategoriesFileSchema, menuItemsFileSchema]),
});

// 5. Gallery
const galleryImageSchema = z.object({
  id: z.string(),
  file: z.string(),
  venueId: z.string().nullable().optional(),
  topic: z.enum([
    'exterior',
    'room',
    'pool',
    'view',
    'food',
    'drink',
    'interior',
    'facility',
    'people',
    'area',
  ]),
  alt: l10nSchema,
  caption: l10nSchema.optional(),
  credit: z.string().optional(),
  orientation: z.enum(['landscape', 'portrait', 'square']).default('landscape'),
  width: z.number().int().default(1920),
  height: z.number().int().default(1080),
  focalPoint: z
    .object({
      x: z.number(),
      y: z.number(),
    })
    .default({ x: 50, y: 50 }),
  featured: z.boolean().default(false),
  rightsConfirmed: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
});

const galleryCollection = defineCollection({
  type: 'data',
  schema: z.object({
    images: z.array(galleryImageSchema),
  }),
});

// 6. FAQs
const faqItemSchema = z.object({
  id: z.string(),
  venueId: z.string().nullable().optional(),
  question: l10nSchema,
  answer: l10nSchema,
  answerStatus: factStatusSchema,
  factRefs: z.array(z.string()).default([]),
  sortOrder: z.number().int(),
});

const faqsCollection = defineCollection({
  type: 'data',
  schema: z.object({
    faqs: z.array(faqItemSchema),
  }),
});

// 7. Attractions
const attractionItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.enum(['nature', 'park', 'food', 'culture', 'transport']),
  description: l10nSchema.optional(),
  distances: z
    .array(
      z.object({
        venueId: z.string(),
        km: z.number(),
        status: factStatusSchema,
        source: z.string().optional(),
      })
    )
    .default([]),
  mapsUrl: z.string().nullable().optional(),
});

const attractionsCollection = defineCollection({
  type: 'data',
  schema: z.object({
    attractions: z.array(attractionItemSchema),
  }),
});

// 8. Ratings
const ratingItemSchema = z.object({
  id: z.string(),
  venueId: z.string(),
  platform: z.enum(['traveloka', 'tiket', 'agoda', 'booking_com', 'trip_com', 'google']),
  score: z.number(),
  scale: z.number(), // 5 or 10
  count: z.number().int(),
  url: z.string().url().nullable().optional(),
  asOf: z.string(), // YYYY-MM
  approved: z.boolean(),
});

const ratingsCollection = defineCollection({
  type: 'data',
  schema: z.object({
    ratings: z.array(ratingItemSchema),
  }),
});

// 9. Pages (Markdown content)
const pagesCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    ogImage: z.string().optional(),
    status: z.enum(['draft', 'published']),
  }),
});

// 10. i18n UI strings
const i18nCollection = defineCollection({
  type: 'data',
  schema: z.record(z.string(), z.string()),
});

export const collections = {
  site: siteCollection,
  venues: venuesCollection,
  rooms: roomsCollection,
  menu: menuCollection,
  gallery: galleryCollection,
  faqs: faqsCollection,
  attractions: attractionsCollection,
  ratings: ratingsCollection,
  pages: pagesCollection,
  i18n: i18nCollection,
};
