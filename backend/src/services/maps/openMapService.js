const cache=new Map(); let pending=false, nextRequest=0;
const DEFAULT_GEOCODING_BASE_URL="https://nominatim.openstreetmap.org";
const DEFAULT_GEOCODING_USER_AGENT="DoorstepCarWash/1.0 (car-wash address search)";
function configuredProviderBase(value, name) {
 if (!value) return null;
 let url;
 try { url = new URL(value); } catch { throw new Error(`${name} must be a valid HTTPS provider URL.`); }
 if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash) {
  throw new Error(`${name} must be an HTTPS URL without credentials, query, or fragment.`);
 }
 if (url.port && url.port !== "443") throw new Error(`${name} must use the standard HTTPS port.`);
 return url;
}
export function normalizeAddress(item) {
 const a=item.address || {};
 const latitude=Number(item.lat),longitude=Number(item.lon);
 if(!Number.isFinite(latitude)||!Number.isFinite(longitude)||Math.abs(latitude)>90||Math.abs(longitude)>180||!item.display_name)throw new Error("No address found. Enter your address manually.");
 return {latitude,longitude,address:item.display_name,name:item.namedetails?.name||item.name||item.display_name,city:a.city||a.town||a.village||a.municipality||"",state:a.state||"",postalCode:a.postcode||""};
}
async function geocode(endpoint,params) {
 const base=configuredProviderBase(process.env.GEOCODING_BASE_URL, "GEOCODING_BASE_URL") || new URL(DEFAULT_GEOCODING_BASE_URL);
 const url=new URL(endpoint,base.href.replace(/\/$/,"")+"/");
 if (url.origin !== base.origin || !url.pathname.startsWith(base.pathname.replace(/\/$/, "") + "/")) throw new Error("Geocoding provider URL is invalid.");
 for(const [key,value] of Object.entries({...params,format:"jsonv2",addressdetails:1,namedetails:1}))url.searchParams.set(key,value);
 const key=url.href, hit=cache.get(key);
 if(hit && hit.until>Date.now())return hit.data;
 if(pending || Date.now()<nextRequest)throw Object.assign(new Error("Please wait a moment and try the address lookup again."),{status:429});
 pending=true;nextRequest=Date.now()+1100;
 try {
  const response=await fetch(url,{headers:{"User-Agent":process.env.GEOCODING_USER_AGENT || DEFAULT_GEOCODING_USER_AGENT},signal:AbortSignal.timeout(10000)});
  if(!response.ok)throw new Error("Address provider unavailable. Select a pin and enter your address manually.");
  const data=await response.json();
  if(cache.size>=500)cache.delete(cache.keys().next().value);
  cache.set(key,{data,until:Date.now()+86400000});return data;
 }finally{pending=false;nextRequest=Date.now()+1100;}
}
export async function searchPlaces(q){return (await geocode("search",{q,limit:5})).map(normalizeAddress);}
export async function reversePlace(lat,lon){return normalizeAddress(await geocode("reverse",{lat,lon}));}
export async function drivingRoute(fromLat,fromLon,toLat,toLon){
 const base=configuredProviderBase(process.env.OSRM_BASE_URL, "OSRM_BASE_URL");
 if(!base)throw Object.assign(new Error("Driving routes are not configured. Location markers are still available."),{status:503});
 const url=new URL("route/v1/driving/"+fromLon+","+fromLat+";"+toLon+","+toLat, base.href.replace(/\/$/,"")+"/");
 url.searchParams.set("overview", "full"); url.searchParams.set("geometries", "geojson");
 if (url.origin !== base.origin || !url.pathname.startsWith(base.pathname.replace(/\/$/, "") + "/")) throw new Error("Routing provider URL is invalid.");
 const response=await fetch(url,{signal:AbortSignal.timeout(10000)});
 if(!response.ok)throw new Error("Driving route unavailable.");
 const data=await response.json(),route=data.routes?.[0];
 if(data.code!=="Ok" || !route)throw new Error("No driving route is available.");
 return {path:route.geometry.coordinates.map(([lng,lat])=>({lat,lng})),distanceMeters:route.distance,durationMillis:route.duration*1000};
}
