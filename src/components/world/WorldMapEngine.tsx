import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./world.css";
import { AnimatePresence } from "framer-motion";
import {
  ANKLESHWAR,
  DEFAULT_LAYERS,
  LANDMARK_ICON,
  TILE_ATTRIBUTION,
  TILE_URL,
  TILE_URL_LIGHT,
  type WorldConfig,
} from "@/lib/world/config";
import { atmosphereNow, type Atmosphere } from "@/lib/world/atmosphere";
import { detectTier, TIER_BUDGET } from "@/lib/world/perf";
import { distanceM } from "@/lib/world/geo";
import { placeQuest } from "@/lib/world/placement";
import type { MarkerState, WorldMarker, WorldQuest } from "@/lib/world/types";
import { usePlayerPosition } from "@/hooks/usePlayerPosition";
import { useTheme } from "@/lib/theme";
import { AmbientLayer } from "./AmbientLayer";
import { WorldHUD } from "./WorldHUD";
import { QuestPeek } from "./QuestPeek";

export type WorldMapEngineProps = {
  quests: WorldQuest[];
  /** Quest ids the player has already completed. */
  completedIds?: string[];
  /** Quest ids that are not yet available to this player. */
  lockedIds?: string[];
  level?: number | null;
  xpInLevel?: number | null;
  xpForLevel?: number | null;
  world?: WorldConfig;
  className?: string;
};

/**
 * The living world. Leaflet handles geography; every game layer above it is
 * plain DOM/CSS so it composites on the GPU and stays at 60fps.
 * Client-only: this module must be lazy-imported (see WorldMap.tsx).
 */
export default function WorldMapEngine({
  quests,
  completedIds = [],
  lockedIds = [],
  level = null,
  xpInLevel = null,
  xpForLevel = null,
  world = ANKLESHWAR,
  className,
}: WorldMapEngineProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerLayerRef = useRef<L.LayerGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const playerMarkerRef = useRef<L.Marker | null>(null);
  const flewToPlayer = useRef(false);

  const [ready, setReady] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [parallax, setParallax] = useState({ x: 0, y: 0 });
  const [atmosphere, setAtmosphere] = useState<Atmosphere>(() => atmosphereNow());
  const tier = useMemo(() => detectTier(), []);
  const { theme } = useTheme();
  const { position, status } = usePlayerPosition(true);

  // Atmosphere follows the player's local clock.
  useEffect(() => {
    const id = window.setInterval(() => setAtmosphere(atmosphereNow()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  // ---- markers: real coords win, otherwise deterministic landmark anchoring
  const markers = useMemo<WorldMarker[]>(() => {
    const completed = new Set(completedIds);
    const locked = new Set(lockedIds);
    return quests.map((quest) => {
      const spot = placeQuest(quest, world);
      const d = position ? distanceM(position, spot) : null;
      let state: MarkerState = "active";
      if (completed.has(quest.id)) state = "completed";
      else if (locked.has(quest.id)) state = "locked";
      else if (spot.approximate && (d == null || d > world.revealRadiusM)) state = "unknown";
      return { quest, lat: spot.lat, lng: spot.lng, state, distanceM: d };
    });
  }, [quests, completedIds, lockedIds, position, world]);

  const selected = markers.find((m) => m.quest.id === selectedId) ?? null;

  // ---- map bootstrap (once)
  useEffect(() => {
    const host = hostRef.current;
    if (!host || mapRef.current) return;

    const map = L.map(host, {
      center: world.center,
      zoom: world.defaultZoom,
      minZoom: world.minZoom,
      maxZoom: world.maxZoom,
      maxBounds: L.latLngBounds(world.bounds[0], world.bounds[1]).pad(0.35),
      maxBoundsViscosity: 0.7,
      zoomControl: false,
      attributionControl: true,
      zoomSnap: 0.25,
      wheelPxPerZoomLevel: 140,
      preferCanvas: true,
    });

    tileLayerRef.current = L.tileLayer(
      document.documentElement.classList.contains("dark") ? TILE_URL : TILE_URL_LIGHT,
      {
      attribution: TILE_ATTRIBUTION,
      detectRetina: true,
      maxZoom: world.maxZoom,
      updateWhenIdle: tier === "low",
      keepBuffer: tier === "high" ? 3 : 1,
      },
    ).addTo(map);

    markerLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    setReady(true);

    // light parallax driven by map drift
    const onMove = () => {
      const c = map.getCenter();
      setParallax({
        x: Math.max(-24, Math.min(24, (c.lng - world.center[1]) * 900)),
        y: Math.max(-24, Math.min(24, (world.center[0] - c.lat) * 900)),
      });
    };
    map.on("move", onMove);

    return () => {
      map.off("move", onMove);
      map.remove();
      mapRef.current = null;
      markerLayerRef.current = null;
      tileLayerRef.current = null;
      setReady(false);
    };
  }, [world, tier]);

  // ---- basemap follows the app theme
  useEffect(() => {
    tileLayerRef.current?.setUrl(theme === "dark" ? TILE_URL : TILE_URL_LIGHT);
  }, [theme, ready]);

  // ---- tile grading follows atmosphere
  useEffect(() => {
    hostRef.current?.style.setProperty("--sq-tile-filter", atmosphere.tileFilter);
  }, [atmosphere]);

  // ---- render quest markers
  useEffect(() => {
    const layer = markerLayerRef.current;
    if (!ready || !layer) return;
    layer.clearLayers();

    // landmark flavour (non-interactive, thinned on weak devices)
    const landmarks = tier === "low" ? [] : world.landmarks.filter((l) => (l.weight ?? 1) >= (tier === "high" ? 1 : 2));
    for (const lm of landmarks) {
      L.marker([lm.lat, lm.lng], {
        interactive: false,
        keyboard: false,
        icon: L.divIcon({
          className: "",
          html: `<div class="sq-landmark"><div class="sq-landmark__dot">${LANDMARK_ICON[lm.kind]}</div><div class="sq-landmark__name">${escapeHtml(lm.name)}</div></div>`,
          iconSize: [80, 34],
          iconAnchor: [40, 17],
        }),
      }).addTo(layer);
    }

    for (const m of markers) {
      const isSelected = m.quest.id === selectedId;
      const label = m.state === "unknown" ? "Unknown signal" : m.quest.title;
      const glyph = m.state === "unknown" ? "?" : m.state === "locked" ? "🔒" : m.state === "completed" ? "✓" : "📍";
      const icon = L.divIcon({
        className: "",
        html: `<div class="sq-marker" data-state="${m.state}" data-selected="${isSelected}">
            <div class="sq-marker__halo"></div>
            <div class="sq-marker__ripple"></div>
            <div class="sq-marker__ring"></div>
            <div class="sq-marker__burst"></div>
            <div class="sq-marker__pin">${glyph}</div>
            <div class="sq-marker__label">${escapeHtml(label)}</div>
          </div>`,
        iconSize: [44, 44],
        iconAnchor: [22, 22],
      });
      const marker = L.marker([m.lat, m.lng], {
        icon,
        riseOnHover: true,
        title: label,
        alt: label,
      }).addTo(layer);
      marker.on("click", () => selectMarker(m));
    }
    // selectMarker is stable via ref-free closure over setState only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, markers, selectedId, world, tier]);

  const selectMarker = useCallback((m: WorldMarker) => {
    setSelectedId(m.quest.id);
    if (navigator.vibrate) navigator.vibrate(8);
    const map = mapRef.current;
    if (!map) return;
    map.flyTo([m.lat, m.lng], Math.max(map.getZoom(), 15.5), { duration: 0.9, easeLinearity: 0.22 });
  }, []);

  // ---- player marker + opening fly-to
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map || !position) return;

    const html = `<div class="sq-player" style="--sq-heading:${position.heading ?? 0}deg">
        <div class="sq-player__radius"></div>
        <div class="sq-player__dir"></div>
        <div class="sq-player__core"></div>
      </div>`;
    const icon = L.divIcon({ className: "", html, iconSize: [56, 56], iconAnchor: [28, 28] });

    if (playerMarkerRef.current) {
      playerMarkerRef.current.setLatLng([position.lat, position.lng]).setIcon(icon);
    } else {
      playerMarkerRef.current = L.marker([position.lat, position.lng], {
        icon,
        interactive: false,
        keyboard: false,
        zIndexOffset: 500,
      }).addTo(map);
    }

    if (!flewToPlayer.current) {
      flewToPlayer.current = true;
      map.flyTo([position.lat, position.lng], 15, { duration: 1.6 });
    }
  }, [ready, position]);

  const recenter = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    if (navigator.vibrate) navigator.vibrate(8);
    if (position) map.flyTo([position.lat, position.lng], 15.5, { duration: 1.1 });
    else map.flyTo(world.center, world.defaultZoom, { duration: 1.1 });
  }, [position, world]);

  const budget = TIER_BUDGET[tier];

  return (
    <div className={`sq-world relative overflow-hidden rounded-3xl border border-border/60 ${className ?? ""}`}>
      <div ref={hostRef} className="h-full w-full" />

      <AmbientLayer
        atmosphere={atmosphere}
        layers={{ ...DEFAULT_LAYERS, fog: budget.fog, rays: budget.rays, birds: budget.birds }}
        tier={tier}
        parallax={parallax}
      />

      <WorldHUD
        atmosphere={atmosphere}
        heading={position?.heading ?? null}
        level={level}
        xpInLevel={xpInLevel}
        xpForLevel={xpForLevel}
        activeQuestTitle={selected && selected.state !== "unknown" ? selected.quest.title : null}
        distanceM={selected?.distanceM ?? null}
        locating={status === "locating"}
        onRecenter={recenter}
        questCount={markers.length}
      />

      <AnimatePresence>
        {selected && <QuestPeek key={selected.quest.id} marker={selected} onClose={() => setSelectedId(null)} />}
      </AnimatePresence>

      {status === "denied" && (
        <div className="pointer-events-none absolute inset-x-0 top-20 z-[600] mx-auto w-fit rounded-full border border-border/60 bg-background/70 px-3 py-1.5 text-[10px] text-muted-foreground backdrop-blur-xl">
          Location off — nearby signals stay hidden
        </div>
      )}
    </div>
  );
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string,
  );
}
