import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "@/components/adventure/adventure.css";
import { TILE_ATTRIBUTION, TILE_URL, worldForCity } from "@/lib/world/config";

export type EditorPin = {
  /** Objective index in the form array. */
  index: number;
  title: string;
  lat: number;
  lng: number;
  radiusM: number;
};

export type ObjectiveMapEditorProps = {
  pins: EditorPin[];
  /** Index that a map click assigns coordinates to. */
  activeIndex: number | null;
  routeMode: "sequential" | "free" | "custom";
  city?: string | null;
  anchor?: { lat: number; lng: number } | null;
  onPlace: (index: number, lat: number, lng: number) => void;
  className?: string;
};

/** Client-only Leaflet editor for placing objective pins. */
export default function ObjectiveMapEditorEngine({
  pins,
  activeIndex,
  routeMode,
  city,
  anchor,
  onPlace,
  className,
}: ObjectiveMapEditorProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const placeRef = useRef(onPlace);
  const activeRef = useRef(activeIndex);
  const [ready, setReady] = useState(false);
  const world = useMemo(() => worldForCity(city), [city]);

  placeRef.current = onPlace;
  activeRef.current = activeIndex;

  useEffect(() => {
    const host = hostRef.current;
    if (!host || mapRef.current) return;

    const first = pins[0] ?? anchor ?? null;
    const map = L.map(host, {
      center: first ? [first.lat, first.lng] : world.center,
      zoom: first ? 16 : world.defaultZoom,
      minZoom: world.minZoom,
      maxZoom: world.maxZoom,
      zoomControl: true,
      attributionControl: true,
    });
    L.tileLayer(TILE_URL, { attribution: TILE_ATTRIBUTION, detectRetina: true, maxZoom: world.maxZoom }).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);

    map.on("click", (e: L.LeafletMouseEvent) => {
      const idx = activeRef.current;
      if (idx == null) return;
      placeRef.current(idx, Number(e.latlng.lat.toFixed(6)), Number(e.latlng.lng.toFixed(6)));
    });

    mapRef.current = map;
    setReady(true);
    return () => {
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
      setReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [world]);

  useEffect(() => {
    const layer = layerRef.current;
    if (!ready || !layer) return;
    layer.clearLayers();

    if (routeMode !== "free" && pins.length > 1) {
      L.polyline(
        pins.map((p) => [p.lat, p.lng] as [number, number]),
        { className: "sq-route-core", interactive: false, dashArray: routeMode === "custom" ? "6 8" : undefined },
      ).addTo(layer);
    }

    for (const p of pins) {
      L.circle([p.lat, p.lng], {
        radius: p.radiusM,
        interactive: false,
        color: "oklch(0.75 0.18 290)",
        weight: 1,
        opacity: 0.6,
        fillOpacity: 0.08,
      }).addTo(layer);

      const marker = L.marker([p.lat, p.lng], {
        draggable: true,
        title: p.title || `Objective ${p.index + 1}`,
        icon: L.divIcon({
          className: "",
          html: `<div class="sq-editpin" data-active="${p.index === activeIndex}"><div class="sq-editpin__dot">${p.index + 1}</div></div>`,
          iconSize: [40, 40],
          iconAnchor: [20, 20],
        }),
      }).addTo(layer);

      marker.on("dragend", () => {
        const ll = marker.getLatLng();
        placeRef.current(p.index, Number(ll.lat.toFixed(6)), Number(ll.lng.toFixed(6)));
      });
    }
  }, [ready, pins, routeMode, activeIndex]);

  return <div ref={hostRef} className={`sq-adv ${className ?? ""}`} />;
}