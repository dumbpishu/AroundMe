import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";

export const getLocationFromIP = asyncHandler(async (req: Request, res: Response) => {
    const ip = req.ip || req.headers["x-forwarded-for"] || req.connection.remoteAddress || req.socket.remoteAddress || (req.connection as any).socket.remoteAddress;

    const response = await fetch(`http://ip-api.com/json/${ip}`);
    const data = await response.json();
    
    return res.status(200).json({
        latitude: data.lat,
        longitude: data.lon,
        city: data.city,
    });
})