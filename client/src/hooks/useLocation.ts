import { useEffect } from "react";
import { useSocketStore } from "../store/socket.store";
import toast from "react-hot-toast";
import { api } from "../lib/axios";

export const useLocation = () => {
  const socket = useSocketStore((s) => s.socket);

  useEffect(() => {
    if (!socket) return;

    navigator.geolocation.getCurrentPosition(
      // gps success
      (pos) => {
        socket.emit("update_location", {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });

        console.log("Using GPS location");
      },

      // gps failed or denied, fallback to IP-based location
      async (error) => {
        console.error("Geolocation error:", error);

        if (error.code === error.PERMISSION_DENIED) {
          toast.error("Please enable location for better experience 📍");
        }

        // fallback =
        try {
          const res = await api.get("/location");
          const data = res.data;

          socket.emit("update_location", {
            latitude: data.lat,
            longitude: data.lng,
          });

          console.log("Using IP-based location");
        } catch {
          toast.error("Unable to determine location");
        }
      }
    );
  }, [socket]);
};