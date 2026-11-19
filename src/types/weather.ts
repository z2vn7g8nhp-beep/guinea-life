export type WeatherCondition =
  | 'clear'
  | 'partly-cloudy'
  | 'overcast'
  | 'fog'
  | 'drizzle'
  | 'rain'
  | 'heavy-rain'
  | 'thunderstorm'
  | 'snow'
  | 'blizzard'
  | 'windy';

export type TimeOfDay = 'dawn' | 'day' | 'sunset' | 'night';

export type AppModuleId = 'weather' | 'wardrobe' | 'lifestyle' | 'upcoming';

export type TempTierId =
  | 'freezing'   // <= 0°C
  | 'cold'       // 1 - 9°C
  | 'cool'       // 10 - 17°C
  | 'mild'       // 18 - 24°C
  | 'warm'       // 25 - 30°C
  | 'hot';       // >= 31°C

export interface CityLocation {
  name: string;
  region?: string;
  country?: string;
  latitude: number;
  longitude: number;
  timezone?: string;
}

export interface HourlyPoint {
  time: string; // ISO string or HH:mm
  hourLabel: string;
  temperature: number;
  condition: WeatherCondition;
  precipitationProb: number;
  isDay: boolean;
}

export interface DailyPoint {
  date: string;
  dayLabel: string;
  condition: WeatherCondition;
  tempMax: number;
  tempMin: number;
  precipitationProb: number;
  uvIndexMax: number;
}

export interface WeatherSnapshot {
  city: CityLocation;
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  windSpeed: number; // km/h
  windDirection: number; // degrees
  pressure: number; // hPa
  uvIndex: number;
  visibility: number; // km
  cloudCover: number; // 0-100
  condition: WeatherCondition;
  conditionLabel: string;
  isDay: boolean;
  timeOfDay: TimeOfDay;
  sunrise: string;
  sunset: string;
  updatedAt: string;
  hourly: HourlyPoint[];
  daily: DailyPoint[];
  isSimulated?: boolean;
  isOfflineFallback?: boolean;
}

export type HeadwearType =
  | 'none'
  | 'pom-beanie'
  | 'earmuffs'
  | 'beret'
  | 'newsboy'
  | 'straw-hat'
  | 'sun-visor'
  | 'rain-hood'
  | 'nightcap';

export type EyewearType = 'none' | 'sunglasses' | 'round-glasses' | 'snow-goggles';

export type OuterwearType =
  | 'none'
  | 'parka'
  | 'duffle-coat'
  | 'knit-cardigan'
  | 'denim-overalls'
  | 'floral-shirt'
  | 'cooling-tank';

export type NeckwearType = 'none' | 'wool-scarf' | 'plaid-scarf' | 'cooling-ring' | 'bowtie';

export type FootwearType = 'bare-paws' | 'snow-boots' | 'ankle-boots' | 'sneakers' | 'rain-boots' | 'sandals';

export type HandheldPropType =
  | 'none'
  | 'hot-cocoa'
  | 'sweet-potato'
  | 'milk-tea'
  | 'hay-clover'
  | 'lemonade'
  | 'mini-fan'
  | 'umbrella'
  | 'lantern';

export type RainGearType = 'none' | 'yellow-poncho' | 'storm-slicker';

export interface GuineaPigOutfit {
  tierId: TempTierId;
  tierLabel: string;
  outfitTitle: string;
  description: string;
  headwear: HeadwearType;
  eyewear: EyewearType;
  outerwear: OuterwearType;
  neckwear: NeckwearType;
  footwear: FootwearType;
  rainGear: RainGearType;
  handheldProp: HandheldPropType;
  hasFrostBreath: boolean;
  hasSnowDust: boolean;
  hasPuddle: boolean;
  hasSweatDrop: boolean;
  isWindy: boolean;
  animationMode: 'shiver' | 'breathe' | 'bounce' | 'pant';
  reactionQuotes: string[];
  tags: string[];
}

export interface LifestyleIndexItem {
  id: string;
  title: string;
  level: string;
  score: number; // 1-100
  summary: string;
  tone: 'emerald' | 'sky' | 'amber' | 'rose' | 'indigo';
}
