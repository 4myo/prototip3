import { useEffect, useMemo, useRef, useState } from "react";

type MapPoint = {
  lat: number;
  lng: number;
};

export type ParkingSpace = {
  id: string;
  code: string;
  zoneId: string;
  position: MapPoint;
  isFree: boolean;
  kind: "standard" | "ev" | "accessible";
  address: string;
};

export type MapZone = {
  id: string;
  name: string;
  free: number;
  color: string;
  position: MapPoint;
  outline: MapPoint[];
  address: string;
  spaceCount: number;
  navigationPath: MapPoint[];
};

export type UserLocation = {
  label: string;
  address: string;
  position: MapPoint;
};

type LiveMapProps = {
  zones: MapZone[];
  spaces: ParkingSpace[];
  selectedZone: MapZone;
  selectedSpace: ParkingSpace;
  userLocation: UserLocation;
  destinationSet: boolean;
  navigationActive: boolean;
  viewportMode: "nearby-available" | "all-free-spaces";
  onSelectSpace: (spaceId: string) => void;
  onActivateSpace: (spaceId: string) => void;
  onSelectZone: (zoneId: string) => void;
};

declare global {
  interface Window {
    google?: any;
    __parkPilotGoogleMapsPromise?: Promise<any>;
  }
}

const MAP_STYLES = [
  { elementType: "geometry", stylers: [{ color: "#edf3fa" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#445064" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#ffffff" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#ffffff" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#d9e2ee" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#dbeafe" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#d9ebff" }],
  },
];

function loadGoogleMaps(apiKey: string) {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Google Maps can only load in the browser."));
  }

  if (window.google?.maps) {
    return Promise.resolve(window.google);
  }

  if (window.__parkPilotGoogleMapsPromise) {
    return window.__parkPilotGoogleMapsPromise;
  }

  window.__parkPilotGoogleMapsPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google?.maps) {
        resolve(window.google);
        return;
      }

      reject(new Error("Google Maps finished loading but the API was unavailable."));
    };
    script.onerror = () => reject(new Error("Google Maps script failed to load."));
    document.head.appendChild(script);
  });

  return window.__parkPilotGoogleMapsPromise;
}

function getSpaceIcon(space: ParkingSpace, isSelected: boolean) {
  if (isSelected) {
    return {
      path: window.google.maps.SymbolPath.CIRCLE,
      fillColor: "#0f172a",
      fillOpacity: 1,
      strokeColor: "#22c55e",
      strokeWeight: 4,
      scale: 8,
    };
  }

  if (space.isFree) {
    return {
      path: window.google.maps.SymbolPath.CIRCLE,
      fillColor: "#22c55e",
      fillOpacity: 0.95,
      strokeColor: "#ffffff",
      strokeWeight: 2,
      scale: 6,
    };
  }

  return {
    path: window.google.maps.SymbolPath.CIRCLE,
    fillColor: "#94a3b8",
    fillOpacity: 0.95,
    strokeColor: "#ffffff",
    strokeWeight: 2,
    scale: 5,
  };
}

function buildPinSvg(fill: string, inner: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="42" viewBox="0 0 30 42"><path d="M15 1C8 1 2.5 6.5 2.5 13.4c0 9.7 12.5 24.8 12.5 24.8s12.5-15.1 12.5-24.8C27.5 6.5 22 1 15 1z" fill="${fill}" stroke="white" stroke-width="1.6"/><circle cx="15" cy="13.5" r="7.2" fill="white" fill-opacity="0.95"/><text x="15" y="17.2" text-anchor="middle" font-family="Inter, sans-serif" font-size="9.5" font-weight="700" fill="${fill}">${inner}</text></svg>`;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export function LiveMap({
  zones,
  spaces,
  selectedZone,
  selectedSpace,
  userLocation,
  destinationSet,
  navigationActive,
  viewportMode,
  onSelectSpace,
  onActivateSpace,
  onSelectZone,
}: LiveMapProps) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const infoWindowRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);
  const destinationMarkerRef = useRef<any>(null);
  const routePolylineRef = useRef<any>(null);
  const zoneOverlaysRef = useRef<Record<string, any>>({});
  const spaceMarkersRef = useRef<Record<string, any>>({});
  const [status, setStatus] = useState<"loading" | "ready" | "error" | "missing-key">("loading");
  const [message, setMessage] = useState("Loading navigation map...");
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  const boundsPoints = useMemo(
    () => [userLocation.position, ...zones.map((zone) => zone.position)],
    [userLocation.position, zones],
  );

  useEffect(() => {
    if (!apiKey) {
      setStatus("missing-key");
      setMessage("Add VITE_GOOGLE_MAPS_API_KEY to enable the live map.");
      return;
    }

    let cancelled = false;

    loadGoogleMaps(apiKey)
      .then((google) => {
        if (cancelled || !mapRef.current) {
          return;
        }

        const map = new google.maps.Map(mapRef.current, {
          center: selectedZone.position,
          zoom: 15,
          tilt: 0,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          clickableIcons: false,
          gestureHandling: "greedy",
          styles: MAP_STYLES,
        });

        mapInstanceRef.current = map;
        infoWindowRef.current = new google.maps.InfoWindow();

        userMarkerRef.current = new google.maps.Marker({
          map,
          position: userLocation.position,
          title: userLocation.label,
          icon: {
            url: buildPinSvg("#2563eb", "U"),
            scaledSize: new google.maps.Size(30, 42),
            anchor: new google.maps.Point(15, 40),
          },
        });
        userMarkerRef.current.setZIndex(1000);

        destinationMarkerRef.current = new google.maps.Marker({
          map,
          position: selectedSpace.position,
          title: selectedSpace.code,
          visible: false,
          icon: {
            url: buildPinSvg("#16a34a", "P"),
            scaledSize: new google.maps.Size(30, 42),
            anchor: new google.maps.Point(15, 40),
          },
        });
        destinationMarkerRef.current.setZIndex(999);

        routePolylineRef.current = new google.maps.Polyline({
          map,
          path: [],
          strokeColor: "#2563eb",
          strokeOpacity: 0.92,
          strokeWeight: 5,
          visible: false,
        });

        const overlays: Record<string, any> = {};
        zones.forEach((zone) => {
          const polygon = new google.maps.Polygon({
            map,
            paths: zone.outline,
            strokeColor: zone.color,
            strokeOpacity: zone.id === selectedZone.id ? 0.9 : 0.5,
            strokeWeight: zone.id === selectedZone.id ? 3 : 2,
            fillColor: zone.color,
            fillOpacity: zone.id === selectedZone.id ? 0.18 : 0.08,
          });

          polygon.addListener("click", () => onSelectZone(zone.id));
          polygon.addListener("mouseover", (event: any) => {
            infoWindowRef.current?.setContent(
              `<div style="padding:6px 8px;font:600 13px Inter,sans-serif;color:#0f172a;">${zone.name}<div style="margin-top:4px;font:400 12px Inter,sans-serif;color:#475569;">${zone.spaceCount} parking spaces</div></div>`,
            );
            infoWindowRef.current?.setPosition(event.latLng);
            infoWindowRef.current?.open({ map });
          });
          polygon.addListener("mouseout", () => infoWindowRef.current?.close());

          overlays[zone.id] = polygon;
        });
        zoneOverlaysRef.current = overlays;

        const bounds = new google.maps.LatLngBounds();
        boundsPoints.forEach((point) => bounds.extend(point));
        map.fitBounds(bounds, 80);

        setStatus("ready");
        setMessage("Navigation map ready");
      })
      .catch((error: Error) => {
        if (cancelled) {
          return;
        }

        setStatus("error");
        setMessage(error.message);
      });

    return () => {
      cancelled = true;
      infoWindowRef.current?.close();
      userMarkerRef.current?.setMap(null);
      destinationMarkerRef.current?.setMap(null);
      routePolylineRef.current?.setMap(null);
      Object.values(zoneOverlaysRef.current).forEach((overlay) => overlay.setMap(null));
      Object.values(spaceMarkersRef.current).forEach((marker) => marker.setMap(null));
      zoneOverlaysRef.current = {};
      spaceMarkersRef.current = {};
      userMarkerRef.current = null;
      destinationMarkerRef.current = null;
      routePolylineRef.current = null;
      mapInstanceRef.current = null;
    };
  }, [apiKey, boundsPoints, onSelectZone, selectedZone.id, userLocation.label, userLocation.position, zones]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !window.google?.maps || !infoWindowRef.current) {
      return;
    }

    Object.entries(zoneOverlaysRef.current).forEach(([zoneId, overlay]) => {
      const zone = zones.find((item) => item.id === zoneId);
      if (!zone) {
        return;
      }

      const isActive = zoneId === selectedZone.id;
      overlay.setOptions({
        strokeColor: zone.color,
        fillColor: zone.color,
        strokeOpacity: isActive ? 0.9 : 0.5,
        strokeWeight: isActive ? 3 : 2,
        fillOpacity: isActive ? 0.18 : 0.08,
      });
    });

    Object.values(spaceMarkersRef.current).forEach((marker) => marker.setMap(null));
    const nextMarkers: Record<string, any> = {};
    spaces.forEach((space) => {
      const marker = new window.google.maps.Marker({
        map,
        position: space.position,
        title: `${space.code} parking space`,
        icon: getSpaceIcon(space, space.id === selectedSpace.id),
      });

      marker.addListener("click", () => {
        if (space.isFree) {
          onActivateSpace(space.id);
          return;
        }

        onSelectSpace(space.id);
      });
      marker.addListener("mouseover", () => {
        infoWindowRef.current?.setContent(
          `<div style="padding:6px 8px;font:600 13px Inter,sans-serif;color:#0f172a;">${space.code} - parking space<div style="margin-top:4px;font:400 12px Inter,sans-serif;color:#475569;">${space.isFree ? "Free now" : "Currently occupied"}</div></div>`,
        );
        infoWindowRef.current?.open({ map, anchor: marker });
      });
      marker.addListener("mouseout", () => infoWindowRef.current?.close());

      nextMarkers[space.id] = marker;
    });
    spaceMarkersRef.current = nextMarkers;

    userMarkerRef.current?.setPosition(userLocation.position);
    destinationMarkerRef.current?.setPosition(selectedSpace.position);
    destinationMarkerRef.current?.setTitle(selectedSpace.code);
    destinationMarkerRef.current?.setVisible(navigationActive && destinationSet);
  }, [destinationSet, navigationActive, onActivateSpace, onSelectSpace, selectedSpace.id, selectedSpace.position, selectedZone.id, spaces, userLocation.position, zones]);

  useEffect(() => {
    const google = window.google;
    const map = mapInstanceRef.current;
    if (!google?.maps || !map) {
      return;
    }

    const resetBounds = new google.maps.LatLngBounds();

    if (viewportMode === "all-free-spaces") {
      resetBounds.extend(userLocation.position);
      zones.forEach((zone) => resetBounds.extend(zone.position));
      spaces.forEach((space) => resetBounds.extend(space.position));
      map.fitBounds(resetBounds, 80);
      return;
    }

    resetBounds.extend(userLocation.position);
    resetBounds.extend(selectedZone.position);
    spaces.forEach((space) => {
      if (space.zoneId === selectedZone.id) {
        resetBounds.extend(space.position);
      }
    });
    map.fitBounds(resetBounds, 110);
  }, [selectedZone.id, selectedZone.position, spaces, userLocation.position, viewportMode, zones]);

  useEffect(() => {
    const google = window.google;
    const map = mapInstanceRef.current;
    if (!google?.maps || !map || !routePolylineRef.current) {
      return;
    }

    if (!destinationSet || !navigationActive) {
      routePolylineRef.current.setPath([]);
      routePolylineRef.current.setVisible(false);
      destinationMarkerRef.current?.setVisible(false);
      setMessage("Destination is not set yet");

      const overviewBounds = new google.maps.LatLngBounds();
      boundsPoints.forEach((point) => overviewBounds.extend(point));
      map.fitBounds(overviewBounds, 80);
      return;
    }

    const navigationPath = [
      userLocation.position,
      ...selectedZone.navigationPath,
      selectedSpace.position,
    ];

    routePolylineRef.current.setPath(navigationPath);
    routePolylineRef.current.setVisible(true);
    destinationMarkerRef.current?.setVisible(true);
    setMessage("Guidance active to selected parking area");

    const routeBounds = new google.maps.LatLngBounds();
    navigationPath.forEach((point) => routeBounds.extend(point));
    map.fitBounds(routeBounds, 100);
  }, [boundsPoints, destinationSet, navigationActive, selectedSpace.position, selectedZone.navigationPath, userLocation.position]);

  return (
    <div className="map-shell">
      <div className="map-toolbar">
        <div>
          <p className="map-toolbar-label">Live map</p>
          <h2 className="map-toolbar-title">{selectedZone.name}</h2>
        </div>

        <div className="map-toolbar-meta">
          <span className="map-meta-pill">{selectedZone.free} free spaces</span>
          <span className="map-meta-pill">{selectedSpace.code} selected</span>
          <span className="map-meta-pill">{userLocation.label}</span>
        </div>
      </div>

      <div className="map-frame">
        <div ref={mapRef} className="absolute inset-0" aria-label="Interactive parking navigation map" />
      </div>

      <div className="map-underbar">
        <div className="underbar-item">
          <span className="underbar-label">Driver</span>
          <span className="underbar-value">{userLocation.address}</span>
        </div>
        <div className="underbar-item">
          <span className="underbar-label">Destination</span>
          <span className="underbar-value">{selectedSpace.address}</span>
        </div>
        <div className="underbar-item">
          <span className="underbar-label">Map status</span>
          <span className="underbar-value">{status === "missing-key" ? "Missing API key" : message}</span>
        </div>
      </div>
    </div>
  );
}
