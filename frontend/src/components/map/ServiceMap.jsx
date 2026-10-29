import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { coordinates } from "../../services/locations/maps";
export default function ServiceMap({location, washerLocation, onSelect, path, points, className="h-96"}) {
 const container=useRef(null), map=useRef(null), callback=useRef(onSelect);
 useEffect(()=>{callback.current=onSelect;},[onSelect]);
 useEffect(()=>{
  const instance=L.map(container.current).setView([20.5937,78.9629],5); map.current=instance;
  L.tileLayer(import.meta.env.VITE_MAP_TILE_URL || "https://tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19,attribution:import.meta.env.VITE_MAP_ATTRIBUTION || '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}).addTo(instance);
  instance.on("click",event=>callback.current?.({lat:event.latlng.lat,lng:event.latlng.lng}));
  const observer=new ResizeObserver(()=>instance.invalidateSize()); observer.observe(container.current);
  return ()=>{observer.disconnect();instance.remove();map.current=null;};
 },[]);
 useEffect(()=>{
  if(!map.current)return;
  const group=L.layerGroup().addTo(map.current), positions=[];
  for(const [value,title,color] of [[location,"Service location","#26704c"],[washerLocation,"Washer location","#26704c"],...(points || []).map(point=>[point,point.title,"#26704c"])]) {
   const p=coordinates(value); if(!p)continue;
   positions.push([p.lat,p.lng]);
   const label=document.createElement("span");label.textContent=value.name || title || "Location";
   L.circleMarker([p.lat,p.lng],{radius:9,color:"white",weight:3,fillColor:color,fillOpacity:1}).bindTooltip(label).addTo(group);
  }
  if(positions.length>1)map.current.fitBounds(positions,{padding:[50,50],maxZoom:16});
  else if(positions.length)map.current.setView(positions[0],16);
  if(path?.length)L.polyline(path.map(p=>Array.isArray(p)?p:[p.lat,p.lng]),{color:"#26704c",weight:5}).addTo(group);
  return ()=>group.remove();
 },[location,washerLocation,points,path]);
 return <div className={"relative z-0 overflow-hidden bg-slate-100 "+className}><div ref={container} className="h-full w-full" aria-label="Service location map"/></div>;
}
