import ngeohash from "ngeohash";

export const getGeohash = (latitude: number, longitude: number, precision: number = 4): string => {
    return ngeohash.encode(latitude, longitude, precision);
};