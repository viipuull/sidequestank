import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./adventure.css";
import { DEFAULT_LAYERS, TILE_ATTRIBUTION, TILE_URL, worldForCity } from "@/lib/world/config";
import { atmosphereNow, type Atmosphere } from "@/lib/world/atmosphere";
import { detectTier, TIER_BUDGET } from "@/lib/world/perf";
import { distanceM } from "@/lib/world/geo";
import { isRevealed, lerpLatLng, type LatLng, type Waypoint } from "@/lib/world/adventure";
import { AmbientLayer } from "@/components/world/AmbientLayer";

export type AdventureMapEngineProps = {
  waypoints: Waypoint[];
  player: LatLng | null;
  heading: number | null;
  city?: string | null;
  /** Ids of waypoints the player is currently inside the radius of. */
  onArrive?: (waypointId: string) => void;
  onSelect?: (waypointId: string) => void;
  className?: string;
};

const GLYPH: Record<string, string> = {
  gps_checkin: "\u{1F4CD}",
  visit_location: "\u{1F4CD}",
  scan_qr: "\u{1F4F7}",
  photo_proof: "\u{1F5BC}",
  answer_trivia: "\u{2753}",
};

/**
 * Cinematic navigation map. Client-only: always lazy-import via AdventureMap.
 * Leaflet owns geography; every game layer above it is DOM/CSS for GPU compositing.
 */
export default function AdventureMapEngine({
  waypoints,
  player,
  heading,
  city,
  onArrive,
  onSelect,
  className,
}: AdventureMapEngineProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const routeLayerRef = useRef<L.LayerGroup | null>(null);
  const pinLayerRef = useRef<L.LayerGroup | null>(null);
  const playerMarkerRef = useRef<L.Marker | null>(null);
  const smoothRef = useRef<LatLng | null>(null);
  const rafRef = useRef<number | null>(null);
  const arrivedRef = useRef<Set<string>>(new Set());
  const cameraTargetRef = useRef<string | null>(null);

  const world = useMemo(() => worldForCity(city), [city]);
  const tier = useMemo(() => detectTier(), []);
  const budget = TIER_BUDGET[tier];
  const [ready, setReady] = useState(false);
  const [sweep, setSweep] = useState(0);
  const [atmosphere, setAtmosphere] = useState<Atmosphere>(() => atmosphereNow());

  const current = waypoints.find((w) => w.state === "current") ?? null;

  useEffect(() => {
    const id = window.setInterval(() => setAtmosphere(atmosphereNow()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  // ---- bootstrap
  useEffect(() => {
    const host = hostRef.current;
    if (!host || mapRef.current) return;

    const map = L.map(host, {
      center: current ? [current.lat, current.lng] : world.center,
      zoom: 16,
      minZoom: world.minZoom,
      maxZoom: world.maxZoom,
      zoomControl: false,
      attributionControl: true,
      zoomSnap: 0.25,
      preferCanvas: false,
      wheelPxPerZoomLevel: 140,
    });

    L.tileLayer(TILE_URL, {
      attribution: TILE_ATTRIBUTION,
      detectRetina: true,
      maxZoom: world.maxZoom,
      updateWhenIdle: tier === "low",
      keepBuffer: tier === "high" ? 3 : 1,
    }).addTo(map);

    routeLayerRef.current = L.layerGroup().addTo(map);
    pinLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    setReady(true);

    return () => {
      map.remove();
      mapRef.current = null;
      routeLayerRef.current = null;
      pinLayerRef.current = null;
      playerMarkerRef.current = null;
      setReady(false);
    };
    // Bootstrap once; `current` is only the initial camera hint.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [world, tier]);

  useEffect(() => {
    hostRef.current?.style.setProperty("--sq-tile-filter", atmosphere.tileFilter);
  }, [atmosphere]);

  // ---- route trail: player -> current -> remaining checkpoints
  useEffect(() => {
    const layer = routeLayerRef.current;
    if (!ready || !layer) return;
    layer.clearLayers();

    const done = waypoints.filter((w) => w.state === "done").map((w) => [w.lat, w.lng] as [number, number]);
    if (done.length > 1) {
      L.polyline(done, { className: "sq-route-done", interactive: false, smoothFactor: 1 }).addTo(layer);
    }

    const ahead: [number, number][] = [];
    if (player) ahead.push([player.lat, player.lng]);
    for (const w of waypoints) {
      if (w.state === "current" || w.state === "upcoming" || w.state === "pending") {
        if (isRevealed(w, player)) ahead.push([w.lat, w.lng]);
      }
    }
    if (ahead.length > 1) {
      L.polyline(ahead, { className: "sq-route-base", interactive: false, smoothFactor: 1 }).addTo(layer);
      L.polyline(ahead, { className: "sq-route-core", interactive: false, smoothFactor: 1 }).addTo(layer);
      L.polyline(ahead, { className: "sq-route-flow", interactive: false, smoothFactor: 1 }).addTo(layer);
      if (tier !== "low") {
        L.polyline(ahead, { className: "sq-route-spark", interactive: false, smoothFactor: 1 }).addTo(layer);
      }
    }
  }, [ready, waypoints, player, tier]);

  // ---- checkpoint markers
  useEffect(() => {
    const layer = pinLayerRef.current;
    if (!ready || !layer) return;
    layer.clearLayers();

    for (const w of waypoints) {
      const revealed = isRevealed(w, player);
      const d = player ? distanceM(player, w) : null;
      const near = d != null && d <= Math.max(w.radiusM * 2.2, 90);
      const glyph = !revealed
        ? "?"
        : w.state === "done"
          ? "\u2713"
          : w.state === "pending"
            ? "\u23F3"
            : (GLYPH[w.objectiveType] ?? "\u{1F4CD}");
      const label = revealed ? w.title : "Mysterious beacon";

      const icon = L.divIcon({
        className: "",
        html: `<div class="sq-cp" data-state="${w.state}" data-unknown="${!revealed}" data-near="${near}" data-burst="${w.state === "done"}">
            <div class="sq-cp__glow"></div>
            <div class="sq-cp__ring"></div>
            <div class="sq-cp__burst"></div>
            <div class="sq-cp__pin">${glyph}</div>
            <div class="sq-cp__label">${escapeHtml(label)}</div>
          </div>`,
        iconSize: [56, 56],
        iconAnchor: [28, 28],
      });

      const marker = L.marker([w.lat, w.lng], { icon, riseOnHover: true, title: label, alt: label }).addTo(layer);
      marker.on("click", () => onSelect?.(w.id));

      if (w.state === "current" && revealed) {
        L.circle([w.lat, w.lng], {
          radius: w.radiusM,
          interactive: false,
          color: "oklch(0.88 0.15 90)",
          weight: 1,
          opacity: 0.55,
          fillColor: "oklch(0.88 0.15 90)",
          fillOpacity: 0.08,
        }).addTo(layer);
      }
    }
  }, [ready, waypoints, player, onSelect]);

  // ---- explorer marker with smooth interpolation
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map || !player) return;

    const from = smoothRef.current ?? player;
    const start = performance.now();
    const dur = smoothRef.current ? 900 : 0;

    const html = () => `<div class="sq-explorer" style="--sq-heading:${heading ?? 0}deg">
        <div class="sq-explorer__pulse"></div>
        <div class="sq-explorer__pulse2"></div>
        <div class="sq-explorer__shadow"></div>
        <div class="sq-explorer__ring"></div>
        <div class="sq-explorer__core"></div>
        <div class="sq-explorer__heading"></div>
      </div>`;

    const ensure = (p: LatLng) => {
      const icon = L.divIcon({ className: "", html: html(), iconSize: [72, 72], iconAnchor: [36, 36] });
      if (playerMarkerRef.current) playerMarkerRef.current.setLatLng([p.lat, p.lng]).setIcon(icon);
      else
        playerMarkerRef.current = L.marker([p.lat, p.lng], {
          icon,
          interactive: false,
          keyboard: false,
          zIndexOffset: 900,
        }).addTo(map);
    };

    const step = (now: number) => {
      const t = dur === 0 ? 1 : Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      const p = lerpLatLng(from, player, eased);
      smoothRef.current = p;
      ensure(p);
      if (t < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [ready, player, heading]);

  // ---- camera pans to each new checkpoint
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map || !current) return;
    if (cameraTargetRef.current === current.id) return;
    cameraTargetRef.current = current.id;

    if (player) {
      map.flyToBounds(
        L.latLngBounds([player.lat, player.lng], [current.lat, current.lng]).pad(0.55),
        { duration: 1.5, maxZoom: 17 },
      );
    } else {
      map.flyTo([current.lat, current.lng], 16.5, { duration: 1.4 });
    }
    setSweep((n) => n + 1);
  }, [ready, current, player]);

  // ---- arrival detection
  useEffect(() => {
    if (!player || !current) return;
    const d = distanceM(player, current);
    if (d <= Math.max(current.radiusM, 25) && !arrivedRef.current.has(current.id)) {
      arrivedRef.current.add(current.id);
      if (navigator.vibrate) navigator.vibrate([18, 50, 30]);
      setSweep((n) => n + 1);
      onArrive?.(current.id);
    }
  }, [player, current, onArrive]);

  const recenter = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    if (navigator.vibrate) navigator.vibrate(8);
    if (player && current) {
      map.flyToBounds(L.latLngBounds([player.lat, player.lng], [current.lat, current.lng]).pad(0.55), {
        duration: 1.1,
        maxZoom: 17,
      });
    } else if (player) map.flyTo([player.lat, player.lng], 16.5, { duration: 1 });
    else if (current) map.flyTo([current.lat, current.lng], 16.5, { duration: 1 });
  }, [player, current]);

  return (
    <div className={`sq-adv relative overflow-hidden ${className ?? ""}`}>
      <div ref={hostRef} className="h-full w-full" />

      <AmbientLayer
        atmosphere={atmosphere}
        layers={{ ...DEFAULT_LAYERS, fog: budget.fog, rays: budget.rays, birds: false }}
        tier={tier}
        parallax={{ x: 0, y: 0 }}
      />

      {sweep > 0 && <div key={sweep} className="sq-arrival-sweep z-[650]" />}

      <button
        type="button"
        onClick={recenter}
        aria-label="Recenter on route"
        className="absolute bottom-4 right-4 z-[700] grid h-11 w-11 place-items-center rounded-full border border-border/60 bg-background/70 text-lg backdrop-blur-xl transition-transform active:scale-95"
      >
        {"\u{1F3AF}"}
      </button>
    </div>
  );
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string,
  );
}