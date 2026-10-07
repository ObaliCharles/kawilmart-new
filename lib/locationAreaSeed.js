// City coordinates are city-centre reference points from GeoNames. Child-area
// coordinates intentionally remain null until they are verified from an
// authoritative local source; the app must never fabricate precise locations.
export const INITIAL_AREA_SEED = [
    { key: "gulu", name: "Gulu", type: "CITY", parentKey: null, lat: 2.774569, lng: 32.29899 },
    { key: "pece", name: "Pece", type: "DIVISION", parentKey: "gulu", lat: null, lng: null },
    { key: "laroo", name: "Laroo", type: "DIVISION", parentKey: "gulu", lat: null, lng: null },
    { key: "bardege", name: "Bardege", type: "DIVISION", parentKey: "gulu", lat: null, lng: null },
    { key: "layibi", name: "Layibi", type: "DIVISION", parentKey: "gulu", lat: null, lng: null },
    { key: "kampala", name: "Kampala", type: "CITY", parentKey: null, lat: 0.316284, lng: 32.582188 },
    { key: "nakawa", name: "Nakawa", type: "DIVISION", parentKey: "kampala", lat: null, lng: null },
    { key: "ntinda", name: "Ntinda", type: "PARISH", parentKey: "kampala", lat: null, lng: null },
    { key: "kawempe", name: "Kawempe", type: "DIVISION", parentKey: "kampala", lat: null, lng: null },
];
