import { useEffect, useMemo, useRef, useState } from "react";

export type MapPoint = {
  lat: number;
  lng: number;
};

export type MapViewportTarget = {
  id: string;
  name: string;
  label: string;
  position: MapPoint;
  zoom: number;
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
  focusedCity: MapViewportTarget;
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
  const baseFill = space.isFree ? "#22c55e" : "#ef4444";

  if (isSelected) {
    return {
      path: "M -8 -8 L 8 -8 L 8 8 L -8 8 Z",
      fillColor: "#0f172a",
      fillOpacity: 1,
      strokeColor: baseFill,
      strokeWeight: 3,
      scale: 1,
    };
  }

  if (space.isFree) {
    return {
      path: "M -7 -7 L 7 -7 L 7 7 L -7 7 Z",
      fillColor: "#22c55e",
      fillOpacity: 0.95,
      strokeColor: "#ffffff",
      strokeWeight: 2,
      scale: 1,
    };
  }

  return {
    path: "M -7 -7 L 7 -7 L 7 7 L -7 7 Z",
    fillColor: "#ef4444",
    fillOpacity: 0.95,
    strokeColor: "#ffffff",
    strokeWeight: 2,
    scale: 1,
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
  focusedCity,
  onSelectSpace,
  onActivateSpace,
  onSelectZone,
}: LiveMapProps) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const infoWindowRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);
  const destinationMarkerRef = useRef<any>(null);
  const directionsRendererRef = useRef<any>(null);
  const directionsServiceRef = useRef<any>(null);
  const zoneOverlaysRef = useRef<Record<string, any>>({});
  const spaceMarkersRef = useRef<Record<string, any>>({});
  const fallbackRouteRef = useRef<any>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error" | "missing-key">("loading");
  const [message, setMessage] = useState("Loading navigation map...");
  const [resolvedUserLocation, setResolvedUserLocation] = useState(userLocation.position);
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  const focusedCityZones = useMemo(
    () => zones.filter((zone) => zone.address.toLowerCase().includes(focusedCity.name.toLowerCase())),
    [focusedCity.name, zones],
  );

  const boundsPoints = useMemo(
    () => [focusedCity.position, ...focusedCityZones.map((zone) => zone.position)],
    [focusedCity.position, focusedCityZones],
  );

  useEffect(() => {
    setResolvedUserLocation(userLocation.position);

    if (typeof navigator === "undefined" || !navigator.geolocation) {
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setResolvedUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      () => {
        setResolvedUserLocation(userLocation.position);
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 120_000,
      },
    );
  }, [userLocation.position]);

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
        directionsServiceRef.current = new google.maps.DirectionsService();
        directionsRendererRef.current = new google.maps.DirectionsRenderer({
          map,
          suppressMarkers: true,
          preserveViewport: true,
          polylineOptions: {
            strokeColor: "#2563eb",
            strokeOpacity: 0.92,
            strokeWeight: 5,
          },
        });

        userMarkerRef.current = new google.maps.Marker({
          map,
          position: resolvedUserLocation,
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

        const overlays: Record<string, any> = {};
        zones.forEach((zone) => {
          const polygon = new google.maps.Polygon({
            map,
            paths: zone.outline,
            strokeColor: zone.free > 0 ? "#16a34a" : "#dc2626",
            strokeOpacity: zone.id === selectedZone.id ? 0.95 : 0.72,
            strokeWeight: zone.id === selectedZone.id ? 4 : 3,
            fillColor: zone.free > 0 ? "#22c55e" : "#ef4444",
            fillOpacity: zone.id === selectedZone.id ? 0.24 : 0.15,
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

        map.setCenter(focusedCity.position);
        map.setZoom(focusedCity.zoom);

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
      directionsRendererRef.current?.setMap(null);
      fallbackRouteRef.current?.setMap(null);
      Object.values(zoneOverlaysRef.current).forEach((overlay) => overlay.setMap(null));
      Object.values(spaceMarkersRef.current).forEach((marker) => marker.setMap(null));
      zoneOverlaysRef.current = {};
      spaceMarkersRef.current = {};
      userMarkerRef.current = null;
      destinationMarkerRef.current = null;
      directionsRendererRef.current = null;
      directionsServiceRef.current = null;
      fallbackRouteRef.current = null;
      mapInstanceRef.current = null;
    };
  }, [apiKey, focusedCity.position, focusedCity.zoom, onSelectZone, resolvedUserLocation, selectedZone.id, userLocation.label, zones]);

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
        strokeColor: zone.free > 0 ? "#16a34a" : "#dc2626",
        fillColor: zone.free > 0 ? "#22c55e" : "#ef4444",
        strokeOpacity: isActive ? 0.95 : 0.72,
        strokeWeight: isActive ? 4 : 3,
        fillOpacity: isActive ? 0.24 : 0.15,
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

    userMarkerRef.current?.setPosition(resolvedUserLocation);
    destinationMarkerRef.current?.setPosition(selectedSpace.position);
    destinationMarkerRef.current?.setTitle(selectedSpace.code);
    destinationMarkerRef.current?.setVisible(navigationActive && destinationSet);
  }, [destinationSet, navigationActive, onActivateSpace, onSelectSpace, resolvedUserLocation, selectedSpace.id, selectedSpace.position, selectedZone.id, spaces, zones]);

  useEffect(() => {
    const google = window.google;
    const map = mapInstanceRef.current;
    if (!google?.maps || !map) {
      return;
    }

    const resetBounds = new google.maps.LatLngBounds();

    if (viewportMode === "all-free-spaces") {
      resetBounds.extend(focusedCity.position);
      zones.forEach((zone) => resetBounds.extend(zone.position));
      spaces.forEach((space) => resetBounds.extend(space.position));
      map.fitBounds(resetBounds, 80);
      return;
    }

    resetBounds.extend(focusedCity.position);

    const candidateZones = focusedCityZones.length > 0 ? focusedCityZones : [selectedZone];
    candidateZones.forEach((zone) => resetBounds.extend(zone.position));
    spaces.forEach((space) => {
      if (candidateZones.some((zone) => zone.id === space.zoneId)) {
        resetBounds.extend(space.position);
      }
    });

    map.fitBounds(resetBounds, 110);
    const listener = window.google?.maps?.event.addListenerOnce(map, "bounds_changed", () => {
      if (map.getZoom() > focusedCity.zoom + 1) {
        map.setZoom(focusedCity.zoom + 1);
      }
      if (map.getZoom() < focusedCity.zoom - 1) {
        map.setZoom(focusedCity.zoom);
      }
    });

    return () => {
      if (listener) {
        window.google.maps.event.removeListener(listener);
      }
    };
  }, [focusedCity.position, focusedCity.zoom, focusedCityZones, selectedZone, spaces, viewportMode, zones]);

  useEffect(() => {
    const google = window.google;
    const map = mapInstanceRef.current;
    const directionsRenderer = directionsRendererRef.current;
    const directionsService = directionsServiceRef.current;
    if (!google?.maps || !map || !directionsRenderer || !directionsService) {
      return;
    }

    if (!destinationSet || !navigationActive) {
      directionsRenderer.set("directions", null);
      fallbackRouteRef.current?.setMap(null);
      fallbackRouteRef.current = null;
      destinationMarkerRef.current?.setVisible(false);
      setMessage("Destination is not set yet");
      return;
    }

    directionsService.route(
      {
        origin: resolvedUserLocation,
        destination: selectedSpace.position,
        travelMode: google.maps.TravelMode.DRIVING,
        provideRouteAlternatives: false,
      },
      (result: any, routeStatus: string) => {
        if (routeStatus === "OK" && result) {
          fallbackRouteRef.current?.setMap(null);
          fallbackRouteRef.current = null;
          directionsRenderer.setDirections(result);
          destinationMarkerRef.current?.setVisible(true);
          setMessage("Guidance active with Google driving directions");

          const leg = result.routes?.[0]?.legs?.[0];
          if (leg?.duration?.text && leg?.distance?.text) {
            setMessage(`Drive ${leg.distance.text} · ${leg.duration.text}`);
          }
          return;
        }

        directionsRenderer.set("directions", null);
        fallbackRouteRef.current?.setMap(null);
        fallbackRouteRef.current = new google.maps.Polyline({
          map,
          path: [resolvedUserLocation, ...selectedZone.navigationPath, selectedSpace.position],
          strokeColor: "#2563eb",
          strokeOpacity: 0.92,
          strokeWeight: 5,
        });
        destinationMarkerRef.current?.setVisible(true);

        const routeBounds = new google.maps.LatLngBounds();
        [resolvedUserLocation, ...selectedZone.navigationPath, selectedSpace.position].forEach((point) =>
          routeBounds.extend(point),
        );
        map.fitBounds(routeBounds, 100);
        setMessage(`Google directions unavailable (${routeStatus}), using local route fallback`);
      },
    );
  }, [destinationSet, navigationActive, resolvedUserLocation, selectedSpace.position, selectedZone.navigationPath]);

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
          <span className="map-meta-pill">{focusedCity.name}</span>
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
