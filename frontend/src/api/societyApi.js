import { apiRequest } from "./apiClient";
export const getSocieties = (page = 1) => apiRequest("/admin/societies?page=" + page);
export const getServiceZones = (page = 1) => apiRequest("/admin/zones?page=" + page);
export const saveSociety = (body, id) => apiRequest("/admin/societies" + (id ? "/" + id : ""), { method: id ? "PATCH" : "POST", body: JSON.stringify(body) });
export const saveServiceZone = (body, id) => apiRequest("/admin/zones" + (id ? "/" + id : ""), { method: id ? "PATCH" : "POST", body: JSON.stringify(body) });
