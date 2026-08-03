export type WorldLandmarkKind =
  | "industry"
  | "residential"
  | "park"
  | "lake"
  | "temple"
  | "cafe"
  | "museum"
  | "landmark"
  | "route";

export type WorldLandmark = {
  id: string;
  name: string;
  kind: WorldLandmarkKind;
  lat: number;
  lng: number;
  weight?: number;
};

export type WorldConfig = {
  id: string;
  city: string;
  label: string;
  center: [number, number];
  defaultZoom: number;
  minZoom: number;
  maxZoom: number;
  bounds: [[number, number], [number, number]];
  /** Distance (m) at which an unknown signal resolves into a real quest. */
  revealRadiusM: number;
  /** "You are here" ring radius (m). */
  discoveryRadiusM: number;
  landmarks: WorldLandmark[];
};

/** The MVP world. Future cities plug in by adding another entry to WORLDS. */
export const ANKLESHWAR: WorldConfig = {
  id: "ankleshwar",
  city: "Ankleshwar",
  label: "Ankleshwar",
  center: [21.6279, 73.0143],
  defaultZoom: 13,
  minZoom: 11,
  maxZoom: 18,
  bounds: [
    [21.53, 72.9],
    [21.73, 73.13],
  ],
  revealRadiusM: 1200,
  discoveryRadiusM: 150,
  landmarks: [
    { id: "gidc", name: "GIDC Estate", kind: "industry", lat: 21.6042, lng: 72.9905, weight: 3 },
    { id: "gidc-north", name: "GIDC North Block", kind: "industry", lat: 21.6165, lng: 72.9832, weight: 2 },
    { id: "old-town", name: "Old Ankleshwar", kind: "residential", lat: 21.6301, lng: 73.0072, weight: 2 },
    { id: "valia-road", name: "Valia Road Colony", kind: "residential", lat: 21.6188, lng: 73.0301, weight: 1 },
    { id: "sardar-baug", name: "Sardar Baug", kind: "park", lat: 21.6338, lng: 73.0035, weight: 2 },
    { id: "green-belt", name: "Green Belt Walk", kind: "route", lat: 21.6412, lng: 73.0189, weight: 1 },
    { id: "lake", name: "Ankleshwar Lake", kind: "lake", lat: 21.6455, lng: 72.9968, weight: 2 },
    { id: "temple", name: "Old Town Temple", kind: "temple", lat: 21.6276, lng: 73.0121, weight: 2 },
    { id: "museum", name: "Heritage Corner", kind: "museum", lat: 21.6324, lng: 73.0158, weight: 1 },
    { id: "cafe-row", name: "Cafe Row", kind: "cafe", lat: 21.6259, lng: 73.0206, weight: 1 },
    { id: "golden-bridge", name: "Golden Bridge", kind: "landmark", lat: 21.6742, lng: 72.9903, weight: 3 },
  ],
};

export const WORLDS: Record<string, WorldConfig> = { ankleshwar: ANKLESHWAR };

export function worldForCity(city?: string | null): WorldConfig {
  return WORLDS[(city ?? "").trim().toLowerCase()] ?? ANKLESHWAR;
}

export const LANDMARK_ICON: Record<WorldLandmarkKind, string> = {
  industry: "\u{1F3ED}",
  residential: "\u{1F3D8}\u{FE0F}",
  park: "\u{1F333}",
  lake: "\u{1F30A}",
  temple: "\u{1F6D5}",
  cafe: "\u{2615}",
  museum: "\u{1F5FF}",
  landmark: "\u{1F309}",
  route: "\u{1F6B6}",
};

/** Layer switchboard. Weather is scaffolded but off until the weather sprint. */
export type WorldLayerFlags = {
  fog: boolean;
  grid: boolean;
  particles: boolean;
  birds: boolean;
  rays: boolean;
  parallax: boolean;
  weather: "off" | "rain" | "fog" | "wind" | "snow";
};

export const DEFAULT_LAYERS: WorldLayerFlags = {
  fog: true,
  grid: true,
  particles: true,
  birds: true,
  rays: true,
  parallax: true,
  weather: "off",
};

/** CARTO basemap - key-free, dark-native, retina aware. */
export const TILE_URL = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
/** Light counterpart, used when the app runs in light mode. */
export const TILE_URL_LIGHT = "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
export const TILE_ATTRIBUTION = "&copy; OpenStreetMap contributors &copy; CARTO";
