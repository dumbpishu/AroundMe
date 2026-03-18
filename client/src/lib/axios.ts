import axios from "axios";

export const api = axios.create({
    baseURL: import.meta.env.SERVER_BASE_URL || "http://localhost:3000/api/v1",
    withCredentials: true,
});