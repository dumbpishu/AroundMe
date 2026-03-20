import { useEffect, useRef } from "react";
import { socket } from "../lib/socket";
import { getLocation } from "../utils/location";
import { getDistanceInMeters } from "../utils/geo";

export const useLocation = (setError: (msg: string) => void) => {
  const lastCoords = useRef<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported");
      return;
    }

    let watchId: number;

    // ✅ initial location
    getLocation()
      .then((loc) => {
        if (!loc) return;

        if (socket.connected) {
          socket.emit("update_location", loc);
        }
      })
      .catch(() => {
        setError("Initial location failed");
      });

    // ✅ watch position
    watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;

        const prev = lastCoords.current;

        // ✅ distance filter
        if (prev) {
          const distance = getDistanceInMeters(
            prev.lat,
            prev.lng,
            latitude,
            longitude
          );

          if (distance < 50) return;
        }

        const payload = {
          lat: latitude,
          lng: longitude,
          source: "gps" as const,
        };

        if (socket.connected) {
          socket.emit("update_location", payload);
        }

        lastCoords.current = { lat: latitude, lng: longitude };
      },
      async () => {
        try {
          const loc = await getLocation();

          if (!loc) {
            setError("Location unavailable");
            return;
          }

          if (socket.connected) {
            socket.emit("update_location", loc);
          }

          if (loc.source === "ip") {
            setError("Using approximate location");
          }
        } catch {
          setError("Location failed completely");
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 10000,
      }
    );

    return () => {
      if (watchId !== undefined) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, []);
};