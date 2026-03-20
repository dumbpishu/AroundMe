import Redis from "ioredis";

export const pub = new Redis(process.env.REDIS_URL!);
export const sub = new Redis(process.env.REDIS_URL!);

pub.on("connect", () => { console.log("Redis publisher connected"); });
pub.on("error", (err) => { console.error("Redis publisher error:", err); });

sub.on("connect", () => { console.log("Redis subscriber connected"); });
sub.on("error", (err) => { console.error("Redis subscriber error:", err); });