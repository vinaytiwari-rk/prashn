/// <reference types="vite/client" />

declare module 'tz-lookup' {
  const tzlookup: (latitude: number, longitude: number) => string;
  export default tzlookup;
}

declare module 'cities.json' {
  export interface RawCityJsonItem {
    name: string;
    lat: string;
    lng: string;
    country: string;
    admin1?: string;
    admin2?: string;
  }
  const cities: RawCityJsonItem[];
  export default cities;
}
