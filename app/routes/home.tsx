import { useCallback, useMemo, useState } from "react";

import {
  LiveMap,
  type MapPoint,
  type MapZone,
  type ParkingSpace,
  type UserLocation,
} from "../components/live-map";
import type { Route } from "./+types/home";

type CityOption = {
  id: string;
  name: string;
  label: string;
  position: MapPoint;
  zoom: number;
};

type ParkingZoneRecord = MapZone & {
  cityId: string;
  district: string;
  eta: string;
  total: number;
  price: string;
  confidence: string;
  accent: string;
  holdWindow: string;
};

function createRotatedOutline(
  center: MapPoint,
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

function createNavigationPath(start: MapPoint, end: MapPoint) {
  return [
    {
      lat: start.lat + (end.lat - start.lat) * 0.28,
      lng: start.lng + (end.lng - start.lng) * 0.18,
    },
    {
      lat: start.lat + (end.lat - start.lat) * 0.62,
      lng: start.lng + (end.lng - start.lng) * 0.58,
    },
  ];
}

function createSpace(
  zoneId: string,
  code: string,
  position: MapPoint,
  isFree: boolean,
  kind: ParkingSpace["kind"],
  address: string,
) {
  return {
    id: `${zoneId}-${code.toLowerCase()}`,
    code,
    zoneId,
    position,
    isFree,
    kind,
    address,
  } satisfies ParkingSpace;
}

const cityOptions: CityOption[] = [
  {
    id: "ljubljana",
    name: "Ljubljana",
    label: "Ljubljana center",
    position: { lat: 46.056946, lng: 14.505751 },
    zoom: 13,
  },
  {
    id: "maribor",
    name: "Maribor",
    label: "Maribor center",
    position: { lat: 46.55465, lng: 15.645881 },
    zoom: 13,
  },
  {
    id: "koper",
    name: "Koper",
    label: "Koper coast",
    position: { lat: 45.54806, lng: 13.73019 },
    zoom: 13,
  },
  {
    id: "celje",
    name: "Celje",
    label: "Celje center",
    position: { lat: 46.23875, lng: 15.267706 },
    zoom: 13,
  },
  {
    id: "novo-mesto",
    name: "Novo Mesto",
    label: "Novo Mesto center",
    position: { lat: 45.80397, lng: 15.16886 },
    zoom: 13,
  },
  {
    id: "kranj",
    name: "Kranj",
    label: "Kranj old town",
    position: { lat: 46.23887, lng: 14.35561 },
    zoom: 13,
  },
  {
    id: "nova-gorica",
    name: "Nova Gorica",
    label: "Nova Gorica center",
    position: { lat: 45.95604, lng: 13.64837 },
    zoom: 13,
  },
  {
    id: "ptuj",
    name: "Ptuj",
    label: "Ptuj center",
    position: { lat: 46.42005, lng: 15.87018 },
    zoom: 13,
  },
];

const liveZones: ParkingZoneRecord[] = [
  {
    id: "lj-kongresni-trg",
    cityId: "ljubljana",
    name: "Kongresni trg Garage",
    district: "Ljubljana center",
    eta: "4 min walk",
    free: 42,
    total: 720,
    price: "EUR 2.40/h",
    confidence: "99.1%",
    accent: "from-blue-500/85 via-sky-500/55 to-transparent",
    holdWindow: "12 min hold",
    color: "#2563eb",
    position: { lat: 46.0507318, lng: 14.503472 },
    outline: createRotatedOutline({ lat: 46.0507318, lng: 14.503472 }, 82, 50, -8),
    address: "Kongresni trg Garage, 1000 Ljubljana",
    spaceCount: 720,
    navigationPath: createNavigationPath(cityOptions[0].position, { lat: 46.0507318, lng: 14.503472 }),
  },
  {
    id: "lj-kozolec",
    cityId: "ljubljana",
    name: "Kozolec Garage",
    district: "Ljubljana north center",
    eta: "7 min walk",
    free: 27,
    total: 240,
    price: "EUR 2.20/h",
    confidence: "98.4%",
    accent: "from-cyan-500/85 via-sky-500/55 to-transparent",
    holdWindow: "15 min hold",
    color: "#0891b2",
    position: { lat: 46.0567897, lng: 14.5049346 },
    outline: createRotatedOutline({ lat: 46.0567897, lng: 14.5049346 }, 88, 46, 23),
    address: "Kozolec Garage, Masarykova cesta, Ljubljana",
    spaceCount: 240,
    navigationPath: createNavigationPath(cityOptions[0].position, { lat: 46.0567897, lng: 14.5049346 }),
  },
  {
    id: "lj-tivoli",
    cityId: "ljubljana",
    name: "Tivoli I P+R",
    district: "Ljubljana Tivoli",
    eta: "8 min walk",
    free: 58,
    total: 320,
    price: "EUR 1.80/h",
    confidence: "97.9%",
    accent: "from-emerald-500/85 via-teal-500/55 to-transparent",
    holdWindow: "10 min hold",
    color: "#10b981",
    position: { lat: 46.0576361, lng: 14.4990628 },
    outline: createRotatedOutline({ lat: 46.0576361, lng: 14.4990628 }, 98, 54, -17),
    address: "Tivoli I P+R, Ljubljana",
    spaceCount: 320,
    navigationPath: createNavigationPath(cityOptions[0].position, { lat: 46.0576361, lng: 14.4990628 }),
  },
  {
    id: "mb-city-center",
    cityId: "maribor",
    name: "Center Maribor Garage",
    district: "Maribor center",
    eta: "3 min walk",
    free: 61,
    total: 410,
    price: "EUR 1.90/h",
    confidence: "97.8%",
    accent: "from-orange-500/85 via-amber-500/55 to-transparent",
    holdWindow: "10 min hold",
    color: "#f97316",
    position: { lat: 46.558791, lng: 15.648052 },
    outline: createRotatedOutline({ lat: 46.558791, lng: 15.648052 }, 88, 50, 4),
    address: "Ulica Vita Kraigherja, Maribor",
    spaceCount: 410,
    navigationPath: createNavigationPath(cityOptions[1].position, { lat: 46.558791, lng: 15.648052 }),
  },
  {
    id: "mb-europark",
    cityId: "maribor",
    name: "Europark Parking",
    district: "Maribor Drava south",
    eta: "6 min walk",
    free: 133,
    total: 790,
    price: "EUR 1.50/h",
    confidence: "96.9%",
    accent: "from-rose-500/85 via-pink-500/55 to-transparent",
    holdWindow: "18 min hold",
    color: "#ec4899",
    position: { lat: 46.552485, lng: 15.652807 },
    outline: createRotatedOutline({ lat: 46.552485, lng: 15.652807 }, 112, 58, -9),
    address: "Pobreka cesta 18, Maribor",
    spaceCount: 790,
    navigationPath: createNavigationPath(cityOptions[1].position, { lat: 46.552485, lng: 15.652807 }),
  },
  {
    id: "kp-center",
    cityId: "koper",
    name: "Koper Center Parking",
    district: "Koper old port",
    eta: "5 min walk",
    free: 34,
    total: 220,
    price: "EUR 1.70/h",
    confidence: "97.2%",
    accent: "from-sky-500/85 via-cyan-500/55 to-transparent",
    holdWindow: "9 min hold",
    color: "#0ea5e9",
    position: { lat: 45.546472, lng: 13.729217 },
    outline: createRotatedOutline({ lat: 45.546472, lng: 13.729217 }, 80, 44, -12),
    address: "Pristanika ulica, Koper",
    spaceCount: 220,
    navigationPath: createNavigationPath(cityOptions[2].position, { lat: 45.546472, lng: 13.729217 }),
  },
  {
    id: "kp-zusterna",
    cityId: "koper",
    name: "Zusterna P+R",
    district: "Koper coast",
    eta: "9 min walk",
    free: 89,
    total: 360,
    price: "EUR 1.20/h",
    confidence: "95.8%",
    accent: "from-teal-500/85 via-cyan-500/55 to-transparent",
    holdWindow: "14 min hold",
    color: "#14b8a6",
    position: { lat: 45.53791, lng: 13.71776 },
    outline: createRotatedOutline({ lat: 45.53791, lng: 13.71776 }, 108, 50, 7),
    address: "Istrska cesta, Koper",
    spaceCount: 360,
    navigationPath: createNavigationPath(cityOptions[2].position, { lat: 45.53791, lng: 13.71776 }),
  },
  {
    id: "ce-center",
    cityId: "celje",
    name: "Glavni trg Parking",
    district: "Celje center",
    eta: "4 min walk",
    free: 29,
    total: 180,
    price: "EUR 1.40/h",
    confidence: "96.5%",
    accent: "from-lime-500/85 via-emerald-500/55 to-transparent",
    holdWindow: "11 min hold",
    color: "#84cc16",
    position: { lat: 46.23995, lng: 15.2672 },
    outline: createRotatedOutline({ lat: 46.23995, lng: 15.2672 }, 72, 40, 6),
    address: "Glavni trg, Celje",
    spaceCount: 180,
    navigationPath: createNavigationPath(cityOptions[3].position, { lat: 46.23995, lng: 15.2672 }),
  },
  {
    id: "ce-zelezniska",
    cityId: "celje",
    name: "Rail Station Parking",
    district: "Celje station district",
    eta: "6 min walk",
    free: 41,
    total: 240,
    price: "EUR 1.10/h",
    confidence: "95.6%",
    accent: "from-yellow-500/85 via-amber-500/55 to-transparent",
    holdWindow: "16 min hold",
    color: "#eab308",
    position: { lat: 46.23674, lng: 15.26895 },
    outline: createRotatedOutline({ lat: 46.23674, lng: 15.26895 }, 76, 42, -11),
    address: "Otkarjeva ulica, Celje",
    spaceCount: 240,
    navigationPath: createNavigationPath(cityOptions[3].position, { lat: 46.23674, lng: 15.26895 }),
  },
  {
    id: "nm-center",
    cityId: "novo-mesto",
    name: "Novo Mesto Center Parking",
    district: "Novo Mesto core",
    eta: "5 min walk",
    free: 38,
    total: 210,
    price: "EUR 1.30/h",
    confidence: "96.1%",
    accent: "from-indigo-500/85 via-blue-500/55 to-transparent",
    holdWindow: "13 min hold",
    color: "#4f46e5",
    position: { lat: 45.80317, lng: 15.16841 },
    outline: createRotatedOutline({ lat: 45.80317, lng: 15.16841 }, 74, 42, 2),
    address: "Rozmanova ulica, Novo Mesto",
    spaceCount: 210,
    navigationPath: createNavigationPath(cityOptions[4].position, { lat: 45.80317, lng: 15.16841 }),
  },
  {
    id: "nm-brsljin",
    cityId: "novo-mesto",
    name: "Brsljin P+R",
    district: "Novo Mesto north",
    eta: "9 min walk",
    free: 67,
    total: 280,
    price: "EUR 0.90/h",
    confidence: "94.8%",
    accent: "from-purple-500/85 via-indigo-500/55 to-transparent",
    holdWindow: "17 min hold",
    color: "#7c3aed",
    position: { lat: 45.81152, lng: 15.17361 },
    outline: createRotatedOutline({ lat: 45.81152, lng: 15.17361 }, 102, 48, -7),
    address: "Ljubljanska cesta, Novo Mesto",
    spaceCount: 280,
    navigationPath: createNavigationPath(cityOptions[4].position, { lat: 45.81152, lng: 15.17361 }),
  },
  {
    id: "kr-center",
    cityId: "kranj",
    name: "Kranj Center Parking",
    district: "Kranj old town",
    eta: "4 min walk",
    free: 23,
    total: 170,
    price: "EUR 1.20/h",
    confidence: "95.9%",
    accent: "from-slate-500/85 via-sky-500/55 to-transparent",
    holdWindow: "8 min hold",
    color: "#64748b",
    position: { lat: 46.23846, lng: 14.3559 },
    outline: createRotatedOutline({ lat: 46.23846, lng: 14.3559 }, 70, 38, 15),
    address: "Slovenski trg, Kranj",
    spaceCount: 170,
    navigationPath: createNavigationPath(cityOptions[5].position, { lat: 46.23846, lng: 14.3559 }),
  },
  {
    id: "ng-center",
    cityId: "nova-gorica",
    name: "Nova Gorica Center Garage",
    district: "Nova Gorica center",
    eta: "5 min walk",
    free: 31,
    total: 205,
    price: "EUR 1.30/h",
    confidence: "95.2%",
    accent: "from-fuchsia-500/85 via-violet-500/55 to-transparent",
    holdWindow: "10 min hold",
    color: "#d946ef",
    position: { lat: 45.95554, lng: 13.64895 },
    outline: createRotatedOutline({ lat: 45.95554, lng: 13.64895 }, 72, 42, -5),
    address: "Delpinova ulica, Nova Gorica",
    spaceCount: 205,
    navigationPath: createNavigationPath(cityOptions[6].position, { lat: 45.95554, lng: 13.64895 }),
  },
  {
    id: "ptuj-center",
    cityId: "ptuj",
    name: "Ptuj Center Parking",
    district: "Ptuj old town",
    eta: "4 min walk",
    free: 26,
    total: 160,
    price: "EUR 1.10/h",
    confidence: "94.9%",
    accent: "from-red-500/85 via-orange-500/55 to-transparent",
    holdWindow: "9 min hold",
    color: "#ef4444",
    position: { lat: 46.41973, lng: 15.87084 },
    outline: createRotatedOutline({ lat: 46.41973, lng: 15.87084 }, 68, 38, 8),
    address: "Miklosiceva ulica, Ptuj",
    spaceCount: 160,
    navigationPath: createNavigationPath(cityOptions[7].position, { lat: 46.41973, lng: 15.87084 }),
  },
];

const parkingSpaces: ParkingSpace[] = [
  createSpace("lj-kongresni-trg", "K-01", { lat: 46.05064, lng: 14.50328 }, true, "standard", "Kongresni trg Garage, bay K-01, Ljubljana"),
  createSpace("lj-kongresni-trg", "K-02", { lat: 46.05078, lng: 14.50342 }, false, "standard", "Kongresni trg Garage, bay K-02, Ljubljana"),
  createSpace("lj-kongresni-trg", "K-03", { lat: 46.05088, lng: 14.5036 }, true, "accessible", "Kongresni trg Garage, bay K-03, Ljubljana"),
  createSpace("lj-kozolec", "KO-01", { lat: 46.05658, lng: 14.50474 }, true, "standard", "Kozolec Garage, bay KO-01, Ljubljana"),
  createSpace("lj-kozolec", "KO-02", { lat: 46.05682, lng: 14.50496 }, true, "ev", "Kozolec Garage, bay KO-02, Ljubljana"),
  createSpace("lj-kozolec", "KO-03", { lat: 46.05696, lng: 14.5051 }, false, "standard", "Kozolec Garage, bay KO-03, Ljubljana"),
  createSpace("lj-tivoli", "T-01", { lat: 46.05742, lng: 14.4989 }, true, "standard", "Tivoli I P+R, bay T-01, Ljubljana"),
  createSpace("lj-tivoli", "T-02", { lat: 46.05762, lng: 14.49908 }, false, "standard", "Tivoli I P+R, bay T-02, Ljubljana"),
  createSpace("lj-tivoli", "T-03", { lat: 46.0578, lng: 14.4992 }, true, "accessible", "Tivoli I P+R, bay T-03, Ljubljana"),
  createSpace("mb-city-center", "MB-01", { lat: 46.55863, lng: 15.64782 }, true, "standard", "Center Maribor Garage, bay MB-01, Maribor"),
  createSpace("mb-city-center", "MB-02", { lat: 46.55879, lng: 15.64805 }, true, "accessible", "Center Maribor Garage, bay MB-02, Maribor"),
  createSpace("mb-city-center", "MB-03", { lat: 46.55894, lng: 15.64823 }, false, "standard", "Center Maribor Garage, bay MB-03, Maribor"),
  createSpace("mb-europark", "EP-01", { lat: 46.55234, lng: 15.65253 }, true, "standard", "Europark Parking, bay EP-01, Maribor"),
  createSpace("mb-europark", "EP-02", { lat: 46.55248, lng: 15.65279 }, true, "ev", "Europark Parking, bay EP-02, Maribor"),
  createSpace("mb-europark", "EP-03", { lat: 46.55266, lng: 15.65308 }, false, "standard", "Europark Parking, bay EP-03, Maribor"),
  createSpace("kp-center", "KP-01", { lat: 45.54631, lng: 13.72906 }, true, "standard", "Koper Center Parking, bay KP-01, Koper"),
  createSpace("kp-center", "KP-02", { lat: 45.54648, lng: 13.72923 }, false, "standard", "Koper Center Parking, bay KP-02, Koper"),
  createSpace("kp-center", "KP-03", { lat: 45.54662, lng: 13.72939 }, true, "accessible", "Koper Center Parking, bay KP-03, Koper"),
  createSpace("kp-zusterna", "ZU-01", { lat: 45.53775, lng: 13.71758 }, true, "standard", "Zusterna P+R, bay ZU-01, Koper"),
  createSpace("kp-zusterna", "ZU-02", { lat: 45.53793, lng: 13.71778 }, true, "ev", "Zusterna P+R, bay ZU-02, Koper"),
  createSpace("kp-zusterna", "ZU-03", { lat: 45.53811, lng: 13.71795 }, false, "standard", "Zusterna P+R, bay ZU-03, Koper"),
  createSpace("ce-center", "CE-01", { lat: 46.23983, lng: 15.26704 }, true, "standard", "Glavni trg Parking, bay CE-01, Celje"),
  createSpace("ce-center", "CE-02", { lat: 46.24001, lng: 15.26718 }, false, "standard", "Glavni trg Parking, bay CE-02, Celje"),
  createSpace("ce-center", "CE-03", { lat: 46.24015, lng: 15.26734 }, true, "accessible", "Glavni trg Parking, bay CE-03, Celje"),
  createSpace("ce-zelezniska", "CZ-01", { lat: 46.23655, lng: 15.26874 }, true, "standard", "Rail Station Parking, bay CZ-01, Celje"),
  createSpace("ce-zelezniska", "CZ-02", { lat: 46.23672, lng: 15.26893 }, true, "ev", "Rail Station Parking, bay CZ-02, Celje"),
  createSpace("ce-zelezniska", "CZ-03", { lat: 46.23689, lng: 15.26911 }, false, "standard", "Rail Station Parking, bay CZ-03, Celje"),
  createSpace("nm-center", "NM-01", { lat: 45.80301, lng: 15.16823 }, true, "standard", "Novo Mesto Center Parking, bay NM-01, Novo Mesto"),
  createSpace("nm-center", "NM-02", { lat: 45.80318, lng: 15.16843 }, false, "standard", "Novo Mesto Center Parking, bay NM-02, Novo Mesto"),
  createSpace("nm-center", "NM-03", { lat: 45.80335, lng: 15.16861 }, true, "accessible", "Novo Mesto Center Parking, bay NM-03, Novo Mesto"),
  createSpace("nm-brsljin", "BR-01", { lat: 45.81136, lng: 15.17342 }, true, "standard", "Brsljin P+R, bay BR-01, Novo Mesto"),
  createSpace("nm-brsljin", "BR-02", { lat: 45.81154, lng: 15.17363 }, true, "ev", "Brsljin P+R, bay BR-02, Novo Mesto"),
  createSpace("nm-brsljin", "BR-03", { lat: 45.81169, lng: 15.1738 }, false, "standard", "Brsljin P+R, bay BR-03, Novo Mesto"),
  createSpace("kr-center", "KR-01", { lat: 46.23829, lng: 14.35573 }, true, "standard", "Kranj Center Parking, bay KR-01, Kranj"),
  createSpace("kr-center", "KR-02", { lat: 46.23845, lng: 14.35592 }, false, "standard", "Kranj Center Parking, bay KR-02, Kranj"),
  createSpace("kr-center", "KR-03", { lat: 46.23861, lng: 14.35608 }, true, "accessible", "Kranj Center Parking, bay KR-03, Kranj"),
  createSpace("ng-center", "NG-01", { lat: 45.95538, lng: 13.64878 }, true, "standard", "Nova Gorica Center Garage, bay NG-01, Nova Gorica"),
  createSpace("ng-center", "NG-02", { lat: 45.95556, lng: 13.64894 }, false, "standard", "Nova Gorica Center Garage, bay NG-02, Nova Gorica"),
  createSpace("ng-center", "NG-03", { lat: 45.9557, lng: 13.6491 }, true, "ev", "Nova Gorica Center Garage, bay NG-03, Nova Gorica"),
  createSpace("ptuj-center", "PT-01", { lat: 46.41957, lng: 15.87067 }, true, "standard", "Ptuj Center Parking, bay PT-01, Ptuj"),
  createSpace("ptuj-center", "PT-02", { lat: 46.41975, lng: 15.87087 }, true, "accessible", "Ptuj Center Parking, bay PT-02, Ptuj"),
  createSpace("ptuj-center", "PT-03", { lat: 46.41992, lng: 15.87102 }, false, "standard", "Ptuj Center Parking, bay PT-03, Ptuj"),
];

const userLocation: UserLocation = {
  label: "Driver start",
  address: "Trg republike 3, 1000 Ljubljana",
  position: { lat: 46.05068, lng: 14.49891 },
};

const searchHints = [
  "Ljubljana",
  "Maribor",
  "Koper",
  "Celje",
  "Novo Mesto",
  "Kranj",
  "Nova Gorica",
  "Ptuj",
];

export function meta({}: Route.MetaArgs) {
  return [
    { title: "ParkPilot AI | Slovenia Parking Explorer" },
    {
      name: "description",
      content:
        "Search Slovenian cities, snap the map to the destination, and explore hardcoded parking areas across the country.",
    },
  ];
}

export default function Home() {
  const [selectedZoneId, setSelectedZoneId] = useState(liveZones[0]?.id ?? "");
  const [selectedSpaceId, setSelectedSpaceId] = useState(parkingSpaces[0]?.id ?? "");
  const [destinationSet, setDestinationSet] = useState(false);
  const [navigationActive, setNavigationActive] = useState(false);
  const [paymentMode, setPaymentMode] = useState<"pay-now" | "park-later">("park-later");
  const [copyState, setCopyState] = useState("Copy address");
  const [parkingFilter, setParkingFilter] = useState<"nearby-available" | "all-free-spaces">(
    "nearby-available",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [focusedCityId, setFocusedCityId] = useState(cityOptions[0]?.id ?? "");
  const [searchOpen, setSearchOpen] = useState(false);

  const selectedZone = liveZones.find((zone) => zone.id === selectedZoneId) ?? liveZones[0];

  const selectedCity =
    cityOptions.find((city) => city.id === focusedCityId) ??
    cityOptions.find((city) => city.id === selectedZone?.cityId) ??
    cityOptions[0];

  const visibleSpaces = useMemo(
    () => parkingSpaces.filter((space) => space.zoneId === selectedZone.id),
    [selectedZone.id],
  );

  const selectedSpace =
    visibleSpaces.find((space) => space.id === selectedSpaceId) ?? visibleSpaces[0] ?? parkingSpaces[0];

  const searchResults = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (!normalizedQuery) {
      return cityOptions;
    }

    return cityOptions.filter((city) => {
      const haystack = `${city.name} ${city.label}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [searchQuery]);

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
    const anchor = selectedCity?.position ?? userLocation.position;

    const toDistance = (lat: number, lng: number) => {
      const dLat = lat - anchor.lat;
      const dLng = lng - anchor.lng;
      return Math.sqrt(dLat * dLat + dLng * dLng);
    };

    return [...liveZones]
      .sort((a, b) => toDistance(a.position.lat, a.position.lng) - toDistance(b.position.lat, b.position.lng))
      .slice(0, 6);
  }, [selectedCity]);

  const allFreeParking = useMemo(() => {
    return [...liveZones].filter((zone) =>
      parkingSpaces.some((space) => space.zoneId === zone.id && space.isFree),
    );
  }, []);

  const displayedParking = useMemo(() => {
    const source =
      parkingFilter === "all-free-spaces"
        ? allFreeParking
        : nearbyParking.filter((zone) => zone.free > 0);

    return source.slice(0, 6);
  }, [allFreeParking, nearbyParking, parkingFilter]);

  const setSelectionForZone = useCallback((zoneId: string) => {
    const nextZone = liveZones.find((zone) => zone.id === zoneId);
    if (!nextZone) {
      return;
    }

    const nextSpace =
      parkingSpaces.find((space) => space.zoneId === zoneId && space.isFree) ??
      parkingSpaces.find((space) => space.zoneId === zoneId) ??
      parkingSpaces[0];

    setSelectedZoneId(nextZone.id);
    setSelectedSpaceId(nextSpace.id);
    setFocusedCityId(nextZone.cityId);
    setDestinationSet(false);
    setNavigationActive(false);
    setCopyState("Copy address");
  }, []);

  const resetToFilterDefault = useCallback(
    (nextFilter: "nearby-available" | "all-free-spaces") => {
      const zonePool =
        nextFilter === "all-free-spaces"
          ? allFreeParking
          : nearbyParking.filter((zone) => zone.free > 0);

      const nextZone = zonePool[0] ?? liveZones[0];

      setParkingFilter(nextFilter);
      setSelectionForZone(nextZone.id);
    },
    [allFreeParking, nearbyParking, setSelectionForZone],
  );

  const handleZoneSelect = useCallback(
    (zoneId: string) => {
      setParkingFilter("nearby-available");
      setSelectionForZone(zoneId);
    },
    [setSelectionForZone],
  );

  const handleSpaceSelect = useCallback((spaceId: string) => {
    const nextSpace = parkingSpaces.find((space) => space.id === spaceId);
    if (!nextSpace) {
      return;
    }

    const zone = liveZones.find((entry) => entry.id === nextSpace.zoneId);
    if (zone) {
      setSelectedZoneId(zone.id);
      setFocusedCityId(zone.cityId);
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

    const zone = liveZones.find((entry) => entry.id === nextSpace.zoneId);
    if (zone) {
      setFocusedCityId(zone.cityId);
      setSelectedZoneId(zone.id);
    }

    setParkingFilter("nearby-available");
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

  const handleCityFocus = useCallback(
    (cityId: string) => {
      const nextCity = cityOptions.find((city) => city.id === cityId);
      if (!nextCity) {
        return;
      }

      setFocusedCityId(nextCity.id);
      setSearchQuery(nextCity.name);

      const cityZones = liveZones.filter((zone) => zone.cityId === nextCity.id);
      const preferredZone = cityZones.find((zone) => zone.free > 0) ?? cityZones[0] ?? liveZones[0];

      setParkingFilter("nearby-available");
      setSelectionForZone(preferredZone.id);
    },
    [setSelectionForZone],
  );

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f3f6fb] text-slate-950">
      <div className="city-map-glow absolute inset-0" aria-hidden="true" />

      <div className="floating-search-shell">
        <div className={`floating-search-card ${searchOpen ? "floating-search-card-open" : ""}`}>
          <button
            type="button"
            className="floating-search-toggle"
            onClick={() => setSearchOpen((current) => !current)}
            aria-expanded={searchOpen}
            aria-controls="floating-search-panel"
          >
            <span className="floating-search-toggle-title">Search</span>
            <span className="floating-search-toggle-copy">
              {searchOpen ? "Hide city search" : `Open search for ${selectedCity.name}`}
            </span>
          </button>

          {searchOpen ? (
            <div id="floating-search-panel" className="floating-search-panel">
              <div className="floating-search-header">
                <p className="eyebrow">Search destination</p>
                <span className="panel-meta">Snap anywhere in Slovenia</span>
              </div>

              <label className="floating-search-input-shell">
                <span className="sr-only">Search cities</span>
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="floating-search-input"
                  placeholder="Search Ljubljana, Maribor, Koper..."
                  list="city-search-hints"
                />
              </label>

              <datalist id="city-search-hints">
                {searchHints.map((hint) => (
                  <option key={hint} value={hint} />
                ))}
              </datalist>

              <div className="floating-search-results" role="list" aria-label="City search results">
                {searchResults.map((city) => {
                  const isActive = city.id === selectedCity.id;

                  return (
                    <button
                      key={city.id}
                      type="button"
                      className={`floating-search-chip ${isActive ? "floating-search-chip-active" : ""}`}
                      onClick={() => handleCityFocus(city.id)}
                    >
                      <span className="floating-search-chip-title">{city.name}</span>
                      <span className="floating-search-chip-copy">{city.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="floating-destination-shell">
        <button
          type="button"
          className={`floating-destination-button ${navigationActive ? "floating-destination-button-active" : ""} ${!selectedSpace.isFree ? "floating-destination-button-disabled" : ""}`}
          onClick={handleSetDestination}
          disabled={!selectedSpace.isFree}
        >
          {navigationActive ? "Navigating to parking" : "Set destination"}
        </button>
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-[1500px] flex-col gap-6 px-6 py-28">
        <header className="professional-header">
          <div>
            <p className="eyebrow">Parking operations</p>
            <h1 className="app-title">Slovenia parking explorer</h1>
            <p className="app-subtitle">
              Search cities, snap the map into place, and browse hardcoded parking areas inspired by Slovenian public parking datasets.
            </p>
          </div>

          <div className="header-meta">
            <div className="header-stat">
              <span className="header-stat-label">Selected city</span>
              <span className="header-stat-value">{selectedCity.name}</span>
            </div>
            <div className="header-stat">
              <span className="header-stat-label">Selected space</span>
              <span className="header-stat-value">{selectedSpace.code}</span>
            </div>
            <div className="header-stat">
              <span className="header-stat-label">Coverage</span>
              <span className="header-stat-value">{liveZones.length} parking areas</span>
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
              focusedCity={selectedCity}
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
                  <span className="panel-meta">City-aware selection</span>
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
                    ? `The route is currently focused on ${selectedCity.name} and the selected bay.`
                    : "Pick a city or parking area, then set a destination to preview guidance."}
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
                    ? `The map is snapped to ${selectedCity.name} and guidance is active for ${selectedSpace.code}.`
                    : `Search a city from the floating bar to reposition the map and inspect local parking supply.`}
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
                  <p className="info-label">City</p>
                  <p className="info-value">{selectedCity.name}</p>
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
                      : `Closest areas to ${selectedCity.name}`}
                  </h2>
                </div>
                <span className="panel-meta">
                  {parkingFilter === "all-free-spaces"
                    ? "Map shows free spaces nationwide"
                    : "Sorted from the current city focus"}
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
              <p className="eyebrow">Dataset note</p>
              <h2 className="panel-title">Source direction</h2>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <div className="summary-row">
                  <span className="summary-label">Public data inspiration</span>
                  <span className="summary-value">
                    Based on publicly discoverable Slovenian parking references such as OPSI datasets for Ljubljana and Novo Mesto, plus the national SIPARK / NAP parking platform metadata.
                  </span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">Current implementation</span>
                  <span className="summary-value">
                    Locations are hardcoded frontend records so the UI can display wider national coverage without a backend importer yet.
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
