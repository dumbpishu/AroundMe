import axios from "axios";

export type LocationPayload = {
  lat: number;
  lng: number;
  source: "gps" | "ip";
};

export const getLocationFromIP = async (): Promise<LocationPayload | null> => {
  try {
    const res = await axios.get("https://ipapi.co/json/", {
      timeout: 3000,
    });

    if (!res.data?.latitude || !res.data?.longitude) return null;

    return {
      lat: res.data.latitude,
      lng: res.data.longitude,
      source: "ip",
    };
  } catch {
    return null;
  }
};

export const getLocation = (): Promise<LocationPayload | null> => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      getLocationFromIP().then(resolve);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          source: "gps",
        });
      },
      async () => {
        const ipLoc = await getLocationFromIP();
        resolve(ipLoc);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
      }
    );
  });
};