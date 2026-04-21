import { useCallback, useMemo, useState } from "react";

import {
  LiveMap,
  type MapZone,
  type ParkingSpace,
  type UserLocation,
} from "../components/live-map";
import type { Route } from "./+types/home";

function createRotatedOutline(
  center: { lat: number; lng: number },
  widthMeters: number,
  heightMeters: number,
  angleDegrees: number,
) {
  const metersPerDegreeLat = 111_320;
  const metersPerDegreeLng = 111_320 * Math.cos((center.lat * Math.PI) / 180);
  const angle = (angleDegrees * Math.PI) / 180;
  const halfWidth = widthMeters / 2;
  const halfHeight = heightMeters / 2;

  const corners = [
    { x: -halfWidth, y: -halfHeight },
    { x: halfWidth, y: -halfHeight },
    { x: halfWidth, y: halfHeight },
    { x: -halfWidth, y: halfHeight },
  ];

  return corners.map(({ x, y }) => {
    const rotatedX = x * Math.cos(angle) - y * Math.sin(angle);
    const rotatedY = x * Math.sin(angle) + y * Math.cos(angle);

    return {
      lat: center.lat + rotatedY / metersPerDegreeLat,
      lng: center.lng + rotatedX / metersPerDegreeLng,
    };
  });
}

const liveZones: Array<
  MapZone & {
    district: string;
    eta: string;
    total: number;
    price: string;
    confidence: string;
    accent: string;
    holdWindow: string;
  }
> = [
  {
    id: "kongresni-trg",
    name: "Parkirisce Kongresni trg",
    district: "Center garage",
    eta: "4 min walk",
    free: 42,
    total: 720,
    price: "EUR 2.40/h",
    confidence: "99.1%",
    accent: "from-blue-500/85 via-sky-500/55 to-transparent",
    holdWindow: "12 min hold",
    color: "#2563eb",
    position: { lat: 46.0507318, lng: 14.503472 },
    outline: createRotatedOutline({ lat: 46.0507318, lng: 14.503472 }, 68, 42, -8),
    address: "Parkirisce Kongresni trg, 1000 Ljubljana",
    spaceCount: 720,
    navigationPath: [
      { lat: 46.05072, lng: 14.49984 },
      { lat: 46.05072, lng: 14.50072 },
      { lat: 46.05073, lng: 14.50182 },
      { lat: 46.05073, lng: 14.50286 },
    ],
  },
  {
    id: "sanatorij-emona",
    name: "Parkirisce Sanatorij Emona",
    district: "Center east",
    eta: "5 min walk",
    free: 16,
    total: 110,
    price: "EUR 2.00/h",
    confidence: "97.5%",
    accent: "from-violet-500/85 via-fuchsia-500/55 to-transparent",
    holdWindow: "8 min hold",
    color: "#8b5cf6",
    position: { lat: 46.0535559, lng: 14.5086226 },
    outline: createRotatedOutline({ lat: 46.0535559, lng: 14.5086226 }, 56, 34, 11),
    address: "Parkirisce Sanatorij Emona, 1000 Ljubljana",
    spaceCount: 110,
    navigationPath: [
      { lat: 46.05078, lng: 14.49986 },
      { lat: 46.0513, lng: 14.50166 },
      { lat: 46.05198, lng: 14.50384 },
      { lat: 46.05272, lng: 14.50618 },
      { lat: 46.0533, lng: 14.50806 },
    ],
  },
  {
    id: "kozolec",
    name: "Parkirisce Kozolec",
    district: "North center",
    eta: "7 min walk",
    free: 27,
    total: 240,
    price: "EUR 2.20/h",
    confidence: "98.4%",
    accent: "from-cyan-500/85 via-sky-500/55 to-transparent",
    holdWindow: "15 min hold",
    color: "#0891b2",
    position: { lat: 46.0567897, lng: 14.5049346 },
    outline: createRotatedOutline({ lat: 46.0567897, lng: 14.5049346 }, 74, 38, 23),
    address: "Parkirisce Kozolec, 1000 Ljubljana",
    spaceCount: 240,
    navigationPath: [
      { lat: 46.0509, lng: 14.49912 },
      { lat: 46.05202, lng: 14.49924 },
      { lat: 46.05366, lng: 14.50016 },
      { lat: 46.05508, lng: 14.50198 },
      { lat: 46.05622, lng: 14.50412 },
    ],
  },
  {
    id: "tivoli-i",
    name: "Parkirisce Tivoli I.",
    district: "Tivoli",
    eta: "8 min walk",
    free: 58,
    total: 320,
    price: "EUR 1.80/h",
    confidence: "97.9%",
    accent: "from-emerald-500/85 via-teal-500/55 to-transparent",
    holdWindow: "10 min hold",
    color: "#10b981",
    position: { lat: 46.0576361, lng: 14.4990628 },
    outline: createRotatedOutline({ lat: 46.0576361, lng: 14.4990628 }, 82, 44, -17),
    address: "Parkirisce Tivoli I., 1000 Ljubljana",
    spaceCount: 320,
    navigationPath: [
      { lat: 46.05102, lng: 14.49898 },
      { lat: 46.05224, lng: 14.49902 },
      { lat: 46.05386, lng: 14.49904 },
      { lat: 46.05558, lng: 14.49906 },
      { lat: 46.05708, lng: 14.49908 },
    ],
  },
];

const userLocation: UserLocation = {
  label: "Driver start",
  address: "Trg republike 3, 1000 Ljubljana",
  position: { lat: 46.05068, lng: 14.49891 },
};

const parkingSpaces: ParkingSpace[] = [
  {
    id: "space-k1",
    code: "K-01",
    zoneId: "kongresni-trg",
    position: { lat: 46.05064, lng: 14.50328 },
    isFree: true,
    kind: "standard",
    address: "Parkirisce Kongresni trg, bay K-01, Ljubljana",
  },
  {
    id: "space-k2",
    code: "K-02",
    zoneId: "kongresni-trg",
    position: { lat: 46.05078, lng: 14.50342 },
    isFree: false,
    kind: "standard",
    address: "Parkirisce Kongresni trg, bay K-02, Ljubljana",
  },
  {
    id: "space-k3",
    code: "K-03",
    zoneId: "kongresni-trg",
    position: { lat: 46.05088, lng: 14.5036 },
    isFree: true,
    kind: "accessible",
    address: "Parkirisce Kongresni trg, bay K-03, Ljubljana",
  },
  {
    id: "space-s1",
    code: "SE-01",
    zoneId: "sanatorij-emona",
    position: { lat: 46.05338, lng: 14.50842 },
    isFree: true,
    kind: "standard",
    address: "Parkirisce Sanatorij Emona, bay SE-01, Ljubljana",
  },
  {
    id: "space-s2",
    code: "SE-02",
    zoneId: "sanatorij-emona",
    position: { lat: 46.05356, lng: 14.5086 },
    isFree: false,
    kind: "accessible",
    address: "Parkirisce Sanatorij Emona, bay SE-02, Ljubljana",
  },
  {
    id: "space-s3",
    code: "SE-03",
    zoneId: "sanatorij-emona",
    position: { lat: 46.0537, lng: 14.50878 },
    isFree: true,
    kind: "ev",
    address: "Parkirisce Sanatorij Emona, bay SE-03, Ljubljana",
  },
  {
    id: "space-ko1",
    code: "KO-01",
    zoneId: "kozolec",
    position: { lat: 46.05658, lng: 14.50474 },
    isFree: true,
    kind: "standard",
    address: "Parkirisce Kozolec, bay KO-01, Ljubljana",
  },
  {
    id: "space-ko2",
    code: "KO-02",
    zoneId: "kozolec",
    position: { lat: 46.05682, lng: 14.50496 },
    isFree: true,
    kind: "ev",
    address: "Parkirisce Kozolec, bay KO-02, Ljubljana",
  },
  {
    id: "space-ko3",
    code: "KO-03",
    zoneId: "kozolec",
    position: { lat: 46.05696, lng: 14.5051 },
    isFree: false,
    kind: "standard",
    address: "Parkirisce Kozolec, bay KO-03, Ljubljana",
  },
  {
    id: "space-t1",
    code: "T-01",
    zoneId: "tivoli-i",
    position: { lat: 46.05742, lng: 14.4989 },
    isFree: true,
    kind: "standard",
    address: "Parkirisce Tivoli I., bay T-01, Ljubljana",
  },
  {
    id: "space-t2",
    code: "T-02",
    zoneId: "tivoli-i",
    position: { lat: 46.05762, lng: 14.49908 },
    isFree: false,
    kind: "standard",
    address: "Parkirisce Tivoli I., bay T-02, Ljubljana",
  },
  {
    id: "space-t3",
    code: "T-03",
    zoneId: "tivoli-i",
    position: { lat: 46.0578, lng: 14.4992 },
    isFree: true,
    kind: "accessible",
    address: "Parkirisce Tivoli I., bay T-03, Ljubljana",
  },
];

export function meta({}: Route.MetaArgs) {
  return [
    { title: "ParkPilot AI | Future Parking Interface" },
    {
      name: "description",
      content:
        "A futuristic parking discovery experience with map-first search, AI camera detection, reservations, and arrival payments.",
    },
  ];
}

export default function Home() {
  const [selectedZoneId, setSelectedZoneId] = useState("kongresni-trg");
  const [selectedSpaceId, setSelectedSpaceId] = useState("space-k1");
  const [destinationSet, setDestinationSet] = useState(false);
  const [navigationActive, setNavigationActive] = useState(false);
  const [paymentMode, setPaymentMode] = useState<"pay-now" | "park-later">("park-later");
  const [copyState, setCopyState] = useState("Copy address");
  const [parkingFilter, setParkingFilter] = useState<"nearby-available" | "all-free-spaces">(
    "nearby-available",
  );

  const selectedZone =
    liveZones.find((zone) => zone.id === selectedZoneId) ?? liveZones[0];

  const visibleSpaces = useMemo(
    () => parkingSpaces.filter((space) => space.zoneId === selectedZone.id),
    [selectedZone.id],
  );

  const selectedSpace =
    visibleSpaces.find((space) => space.id === selectedSpaceId) ?? visibleSpaces[0];

  const mapSpaces = useMemo(() => {
    if (parkingFilter === "all-free-spaces") {
      return parkingSpaces.filter((space) => space.isFree);
    }

    return visibleSpaces;
  }, [parkingFilter, visibleSpaces]);

  const occupancy = useMemo(
    () => Math.round(((selectedZone.total - selectedZone.free) / selectedZone.total) * 100),
    [selectedZone.free, selectedZone.total],
  );

  const nearbyParking = useMemo(() => {
    const toDistance = (lat: number, lng: number) => {
      const dLat = lat - userLocation.position.lat;
      const dLng = lng - userLocation.position.lng;
      return Math.sqrt(dLat * dLat + dLng * dLng);
    };

    return [...liveZones]
      .sort((a, b) => toDistance(a.position.lat, a.position.lng) - toDistance(b.position.lat, b.position.lng))
      .slice(0, 4);
  }, []);

  const allFreeParking = useMemo(() => {
    const toDistance = (lat: number, lng: number) => {
      const dLat = lat - userLocation.position.lat;
      const dLng = lng - userLocation.position.lng;
      return Math.sqrt(dLat * dLat + dLng * dLng);
    };

    return [...liveZones]
      .filter((zone) => parkingSpaces.some((space) => space.zoneId === zone.id && space.isFree))
      .sort((a, b) => toDistance(a.position.lat, a.position.lng) - toDistance(b.position.lat, b.position.lng));
  }, []);

  const displayedParking = useMemo(() => {
    const source =
      parkingFilter === "all-free-spaces"
        ? allFreeParking
        : nearbyParking.filter((zone) => zone.free > 0);

    return source.slice(0, 4);
  }, [allFreeParking, nearbyParking, parkingFilter]);

  const resetToFilterDefault = useCallback(
    (nextFilter: "nearby-available" | "all-free-spaces") => {
      const zonePool =
        nextFilter === "all-free-spaces"
          ? allFreeParking
          : nearbyParking.filter((zone) => zone.free > 0);

      const nextZone = zonePool[0] ?? liveZones[0];
      const nextSpace =
        parkingSpaces.find((space) => space.zoneId === nextZone.id && space.isFree) ??
        parkingSpaces.find((space) => space.zoneId === nextZone.id) ??
        parkingSpaces[0];

      setParkingFilter(nextFilter);
      setSelectedZoneId(nextZone.id);
      setSelectedSpaceId(nextSpace.id);
      setDestinationSet(false);
      setNavigationActive(false);
      setCopyState("Copy address");
    },
    [allFreeParking, nearbyParking],
  );

  const handleZoneSelect = useCallback((zoneId: string) => {
    setSelectedZoneId(zoneId);

    const nextSpace = parkingSpaces.find(
      (space) => space.zoneId === zoneId && space.isFree,
    ) ?? parkingSpaces.find((space) => space.zoneId === zoneId);

    if (nextSpace) {
      setSelectedSpaceId(nextSpace.id);
    }

    setParkingFilter("nearby-available");
    setDestinationSet(false);
    setNavigationActive(false);
  }, []);

  const handleSpaceSelect = useCallback((spaceId: string) => {
    const nextSpace = parkingSpaces.find((space) => space.id === spaceId);
    if (nextSpace) {
      setSelectedZoneId(nextSpace.zoneId);
    }

    setSelectedSpaceId(spaceId);
    setDestinationSet(false);
    setNavigationActive(false);
  }, []);

  const handleSetDestination = () => {
    if (!selectedSpace.isFree) {
      return;
    }

    setDestinationSet(true);
    setNavigationActive(true);
  };

  const handleActivateSpace = useCallback((spaceId: string) => {
    const nextSpace = parkingSpaces.find((space) => space.id === spaceId);
    if (!nextSpace || !nextSpace.isFree) {
      return;
    }

    setParkingFilter("nearby-available");
    setSelectedZoneId(nextSpace.zoneId);
    setSelectedSpaceId(nextSpace.id);
    setDestinationSet(true);
    setNavigationActive(true);
    setCopyState("Copy address");
  }, []);

  const handleCopyAddress = async () => {
    await navigator.clipboard.writeText(selectedSpace.address);
    setCopyState("Address copied");
    window.setTimeout(() => setCopyState("Copy address"), 1800);
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f3f6fb] text-slate-950">
      <div className="city-map-glow absolute inset-0" aria-hidden="true" />
      <div className="relative mx-auto flex min-h-screen max-w-[1500px] flex-col gap-6 px-6 py-6">
        <header className="professional-header">
          <div>
            <p className="eyebrow">Parking operations</p>
            <h1 className="app-title">Smart parking map</h1>
            <p className="app-subtitle">
              Draw spaces on the map, choose a destination, and decide whether payment starts now or on arrival.
            </p>
          </div>

          <div className="header-meta">
            <div className="header-stat">
              <span className="header-stat-label">Selected space</span>
              <span className="header-stat-value">{selectedSpace.code}</span>
            </div>
            <div className="header-stat">
              <span className="header-stat-label">Mode</span>
              <span className="header-stat-value">{paymentMode === "pay-now" ? "Pay now" : "Park later"}</span>
            </div>
          </div>
        </header>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <section className="panel-surface p-5">
            <LiveMap
              zones={liveZones}
              spaces={mapSpaces}
              selectedZone={selectedZone}
              selectedSpace={selectedSpace}
              userLocation={userLocation}
              destinationSet={destinationSet}
              navigationActive={navigationActive}
              viewportMode={parkingFilter}
              onSelectSpace={handleSpaceSelect}
              onActivateSpace={handleActivateSpace}
              onSelectZone={handleZoneSelect}
            />

            <section className="mt-5 grid gap-4 lg:grid-cols-[1.1fr_1fr_0.9fr]">
              <article className="panel-surface p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="eyebrow">Parking spaces</p>
                    <h2 className="panel-title">Choose a bay</h2>
                  </div>
                  <span className="panel-meta">Hover on map for labels</span>
                </div>

                <div className="mt-4 space-y-3">
                  {visibleSpaces.map((space) => (
                    <button
                      key={space.id}
                      type="button"
                      className={`space-list-item ${space.id === selectedSpace.id ? "space-list-item-active" : ""}`}
                      onClick={() => handleSpaceSelect(space.id)}
                    >
                      <div>
                        <p className="zone-name">{space.code}</p>
                        <p className="zone-meta">{space.address}</p>
                      </div>
                      <span className={`availability-pill ${space.isFree ? "availability-pill-free" : "availability-pill-busy"}`}>
                        {space.isFree ? "Free" : "Busy"}
                      </span>
                    </button>
                  ))}
                </div>
              </article>

              <article className="panel-surface p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="eyebrow">Navigation</p>
                    <h2 className="panel-title">Driver route</h2>
                  </div>
                  <button type="button" className="copy-button" onClick={handleCopyAddress}>
                    {copyState}
                  </button>
                </div>

                <div className="nav-card mt-4">
                  <div className="nav-stop">
                    <span className="nav-dot nav-dot-start" />
                    <div>
                      <p className="nav-label">Current driver position</p>
                      <p className="nav-value">{userLocation.address}</p>
                    </div>
                  </div>
                  <div className="nav-line" />
                  <div className="nav-stop">
                    <span className="nav-dot nav-dot-end" />
                    <div>
                      <p className="nav-label">Parking destination</p>
                      <p className="nav-value">{selectedSpace.address}</p>
                    </div>
                  </div>
                </div>

                <p className="mt-4 text-sm leading-6 text-slate-600">
                  {destinationSet
                    ? "The route follows Google road navigation from the driver location to the selected bay."
                    : "Select a free parking space and press set destination to generate the route."}
                </p>
              </article>

              <article className="panel-surface p-5">
                <p className="eyebrow">Arrival and payment</p>
                <h2 className="panel-title">Parking flow</h2>

                <div className="mt-4 grid gap-3">
                  <button
                    type="button"
                    className={`action-button ${navigationActive ? "action-button-primary" : "action-button-light"}`}
                    onClick={handleSetDestination}
                  >
                    {navigationActive ? "Navigating to parking" : "Set destination"}
                  </button>

                  <div className="segmented-control">
                    <button
                      type="button"
                      className={`segment ${paymentMode === "pay-now" ? "segment-active" : ""}`}
                      onClick={() => setPaymentMode("pay-now")}
                    >
                      Pay now
                    </button>
                    <button
                      type="button"
                      className={`segment ${paymentMode === "park-later" ? "segment-active" : ""}`}
                      onClick={() => setPaymentMode("park-later")}
                    >
                      Park later
                    </button>
                  </div>
                </div>

                <div className="mt-4 rounded-[18px] border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                  {paymentMode === "pay-now"
                    ? "Payment is armed to begin immediately after the destination is confirmed."
                    : "Payment will start only after the driver arrives in the selected parking area."}
                </div>

                <div className="mt-4 rounded-[18px] border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-600">
                  {navigationActive
                    ? `Google navigation is guiding the driver from ${userLocation.address} to ${selectedSpace.address}.`
                    : "Set destination to start guidance from the driver location to the selected parking area."}
                </div>
              </article>
            </section>
          </section>

          <aside className="flex flex-col gap-4">
            <section className="panel-surface p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="eyebrow">Current parking</p>
                  <h2 className="panel-title">{selectedZone.name}</h2>
                  <p className="panel-copy">{selectedZone.district}</p>
                </div>
                <span className="availability-pill">{selectedZone.free} free</span>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="info-card">
                  <p className="info-label">Walk time</p>
                  <p className="info-value">{selectedZone.eta}</p>
                </div>
                <div className="info-card">
                  <p className="info-label">Price</p>
                  <p className="info-value">{selectedZone.price}</p>
                </div>
                <div className="info-card">
                  <p className="info-label">Occupancy</p>
                  <p className="info-value">{occupancy}%</p>
                </div>
                <div className="info-card">
                  <p className="info-label">Arrival flow</p>
                  <p className="info-value">{paymentMode === "pay-now" ? "Immediate" : "On site"}</p>
                </div>
                <div className="info-card">
                  <p className="info-label">Capacity</p>
                  <p className="info-value">{selectedZone.spaceCount}</p>
                </div>
                <div className="info-card">
                  <p className="info-label">Destination</p>
                  <p className="info-value">{destinationSet ? selectedSpace.code : "Not set"}</p>
                </div>
              </div>
            </section>

            <section className="panel-surface p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="eyebrow">Available parking</p>
                  <h2 className="panel-title">
                    {parkingFilter === "all-free-spaces"
                      ? "All free spaces on map"
                      : "Nearby available places"}
                  </h2>
                </div>
                <span className="panel-meta">
                  {parkingFilter === "all-free-spaces"
                    ? "Map shows all free spaces, list shows 4 closest areas"
                    : "Sorted by distance"}
                </span>
              </div>

              <div className="mt-4 filter-toggle-row">
                <button
                  type="button"
                  className={`toggle-chip ${parkingFilter === "nearby-available" ? "toggle-chip-active" : ""}`}
                  onClick={() => resetToFilterDefault("nearby-available")}
                >
                  Nearby available places
                </button>
                <button
                  type="button"
                  className={`toggle-chip ${parkingFilter === "all-free-spaces" ? "toggle-chip-active" : ""}`}
                  onClick={() => resetToFilterDefault("all-free-spaces")}
                >
                  All free spaces
                </button>
              </div>

              <div className="mt-4 space-y-3">
                {displayedParking.map((zone) => {
                  const isSelected = zone.id === selectedZone.id;

                  return (
                    <button
                      key={zone.id}
                      type="button"
                      className={`zone-list-item ${isSelected ? "zone-list-item-active" : ""}`}
                      onClick={() => handleZoneSelect(zone.id)}
                    >
                      <div>
                        <p className="zone-name">{zone.name}</p>
                        <p className="zone-meta">
                          {zone.district} · {zone.eta} · {zone.price}
                        </p>
                        <p className="zone-meta">{zone.address}</p>
                      </div>
                      <span className="availability-pill">{zone.free}</span>
                    </button>
                  );
                })}

                {displayedParking.length === 0 ? (
                  <div className="empty-list-state">No free parking areas match the selected filter.</div>
                ) : null}
              </div>
            </section>

            <section className="panel-surface p-5">
              <p className="eyebrow">Driver summary</p>
              <h2 className="panel-title">Current trip</h2>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <div className="summary-row">
                  <span className="summary-label">Origin</span>
                  <span className="summary-value">{userLocation.address}</span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">Selected bay</span>
                  <span className="summary-value">
                    {selectedSpace.code} · {selectedSpace.isFree ? "Free" : "Unavailable"}
                  </span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">Payment action</span>
                  <span className="summary-value">
                    {paymentMode === "pay-now"
                      ? "Begin charging once destination is confirmed"
                      : "Wait until the driver reaches the parking area"}
                  </span>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
