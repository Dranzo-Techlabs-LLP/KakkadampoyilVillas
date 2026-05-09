export interface Villa {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  capacity: { adults: number; children: number };
  bedrooms: number;
  pricePerNight: string;
  coverImage: string;
  amenities: string[];
  images: string[];
}

const SHARED_AMENITIES = [
  'Campfire',
  "Children's Play Area",
  'Swimming Pool',
  'Carrom',
  'WiFi',
  'Barbeque Grill',
  'Private Compound',
];

const fortuneImages = [
  '/images/fortune/PHOTO_001.jpg',
  '/images/fortune/PHOTO_002.jpg',
  '/images/fortune/PHOTO_003.jpg',
  '/images/fortune/PHOTO_004.jpg',
  '/images/fortune/PHOTO_005.jpg',
  '/images/fortune/PHOTO_006.jpg',
  '/images/fortune/PHOTO_007.jpg',
  '/images/fortune/PHOTO_008.jpg',
  '/images/fortune/PHOTO_009.jpg',
  '/images/fortune/PHOTO_010.jpg',
  '/images/fortune/PHOTO_011.jpg',
  '/images/fortune/PHOTO_012.jpg',
  '/images/fortune/PHOTO_013.jpg',
  '/images/fortune/PHOTO_014.jpg',
  '/images/fortune/PHOTO_015.jpg',
  '/images/fortune/PHOTO_016.jpg',
  '/images/fortune/PHOTO_17.jpg',
  '/images/fortune/PHOTO_018.jpg',
  '/images/fortune/PHOTO_019.jpg',
  '/images/fortune/PHOTO_020.jpg',
  '/images/fortune/PHOTO_021.jpg',
  '/images/fortune/PHOTO_022.jpg',
  '/images/fortune/PHOTO_023.jpg',
  '/images/fortune/PHOTO_024.jpg',
  '/images/fortune/PHOTO_025.jpg',
  '/images/fortune/PHOTO_026.jpg',
];

const luxImages = [
  '/images/lux/PHOTO_001.jpg',
  '/images/lux/PHOTO_002.jpg',
  '/images/lux/PHOTO_003.jpg',
  '/images/lux/PHOTO_004.jpg',
  '/images/lux/PHOTO_005.jpg',
  '/images/lux/PHOTO_006.jpg',
  '/images/lux/PHOTO_007.jpg',
  '/images/lux/PHOTO_008.jpg',
  '/images/lux/PHOTO_009.jpg',
  '/images/lux/PHOTO_010.jpg',
  '/images/lux/PHOTO_011.jpg',
  '/images/lux/PHOTO_012.jpg',
  '/images/lux/PHOTO_013.jpg',
  '/images/lux/PHOTO_014.jpg',
  '/images/lux/PHOTO_015.jpg',
  '/images/lux/PHOTO_016.jpg',
  '/images/lux/PHOTO_017.jpg',
  '/images/lux/PHOTO_018.jpg',
  '/images/lux/PHOTO_019.jpg',
  '/images/lux/PHOTO_020.jpg',
  '/images/lux/PHOTO_021.jpg',
  '/images/lux/PHOTO_022.jpg',
  '/images/lux/PHOTO_023.jpg',
  '/images/lux/PHOTO_024.jpg',
  '/images/lux/PHOTO_025.jpg',
  '/images/lux/PHOTO_026.jpg',
  '/images/lux/PHOTO_027.jpg',
  '/images/lux/PHOTO_028.jpg',
  '/images/lux/PHOTO_029.jpg',
  '/images/lux/PFR02164.jpg',
];

const munnasImages = [
  '/images/munnas/PHOTO_001.jpg',
  '/images/munnas/PHOTO_002.jpg',
  '/images/munnas/PHOTO_003.jpg',
  '/images/munnas/PHOTO_004.jpg',
  '/images/munnas/PHOTO_005.jpg',
  '/images/munnas/PHOTO_006.jpg',
  '/images/munnas/PHOTO_007.jpg',
  '/images/munnas/PHOTO_008.jpg',
  '/images/munnas/PHOTO_009.jpg',
  '/images/munnas/PHOTO_010.jpg',
  '/images/munnas/PHOTO_011.jpg',
  '/images/munnas/PHOTO_012.jpg',
  '/images/munnas/PHOTO_013.jpg',
  '/images/munnas/PHOTO_014.jpg',
  '/images/munnas/PHOTO_015.jpg',
  '/images/munnas/PHOTO_016.jpg',
  '/images/munnas/PHOTO_017.jpg',
  '/images/munnas/PHOTO_018.jpg',
  '/images/munnas/PHOTO_019.jpg',
  '/images/munnas/PHOTO_020.jpg',
  '/images/munnas/PHOTO_021.jpg',
  '/images/munnas/PHOTO_022.jpg',
  '/images/munnas/PHOTO_023.jpg',
  '/images/munnas/PHOTO_024.jpg',
  '/images/munnas/PHOTO_025.jpg',
  '/images/munnas/PHOTO_026.jpg',
  '/images/munnas/PHOTO_027.jpg',
  '/images/munnas/PHOTO_028.jpg',
  '/images/munnas/PHOTO_029.jpg',
  '/images/munnas/PHOTO_030.jpg',
  '/images/munnas/PHOTO_031.jpg',
  '/images/munnas/PHOTO_032.jpg',
  '/images/munnas/PFR02164.jpg',
];

export const villas: Villa[] = [
  {
    slug: 'lux-villa',
    name: 'Lux Villa',
    tagline: 'A-Type Architectural Retreat',
    description:
      "An iconic A-frame villa built for groups of nine. Three bedrooms, a private compound, and every essential — pool, campfire, BBQ — set against the misty hills of Kakkadampoyil.",
    capacity: { adults: 6, children: 3 },
    bedrooms: 3,
    pricePerNight: 'Enquire for Price',
    coverImage: luxImages[0],
    amenities: [
      'Individual Villa',
      'A-Type Architecture',
      '3 Bedrooms',
      '3 Attached Washrooms',
      ...SHARED_AMENITIES,
      '100% Privacy',
    ],
    images: luxImages,
  },
  {
    slug: 'fortune-villa',
    name: 'Fortune Villa',
    tagline: 'Scenic Hilltop Escape',
    description:
      "A scenic three bedroom hilltop villa for nine guests — one AC and two non-AC rooms, all with attached bathrooms. Comes with a private pool, campfire setup, and a 360° terrace view.",
    capacity: { adults: 6, children: 3 },
    bedrooms: 3,
    pricePerNight: 'Enquire for Price',
    coverImage: fortuneImages[0],
    amenities: [
      'Individual Villa',
      '1 AC + 2 Non-AC Rooms',
      '3 Attached Bathrooms',
      ...SHARED_AMENITIES,
      '360° Terrace View',
      '100% Privacy',
    ],
    images: fortuneImages,
  },
  {
    slug: 'munnas-villa',
    name: 'Munnas Villa',
    tagline: 'Group & Family Retreat',
    description:
      "Built for big gatherings. Two AC and one non-AC bedrooms plus a 12-bed dormitory — sleeps eighteen in total. Ideal for extended families, friend trips, and celebration weekends.",
    capacity: { adults: 12, children: 6 },
    bedrooms: 3,
    pricePerNight: 'Enquire for Price',
    coverImage: munnasImages[0],
    amenities: [
      'Individual Villa',
      '2 AC + 1 Non-AC Rooms',
      'Dormitory · 12 Beds',
      'Sleeps 18 Guests',
      ...SHARED_AMENITIES,
      '100% Privacy',
    ],
    images: munnasImages,
  },
];
