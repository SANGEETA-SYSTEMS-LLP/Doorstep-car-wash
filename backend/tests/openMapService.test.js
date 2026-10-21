import {test} from 'node:test';
import assert from 'node:assert/strict';
import {normalizeAddress,searchPlaces,drivingRoute} from '../src/services/openMapService.js';
test('OSM address normalization preserves coordinates and village fallback',()=>{
 const result=normalizeAddress({lat:'20.2',lon:'85.1',display_name:'Tower A, Street, Odisha',namedetails:{name:'Tower A'},address:{village:'Test village',state:'Odisha',postcode:'751001'}});
 assert.equal(result.latitude,20.2);assert.equal(result.city,'Test village');assert.equal(result.name,'Tower A');assert.equal(result.address,'Tower A, Street, Odisha');
 assert.equal(normalizeAddress({lat:'20.2',lon:'85.1',display_name:'Street, Odisha'}).name,'Street, Odisha');
 assert.throws(()=>normalizeAddress({lat:'invalid',lon:'0',display_name:'Bad'}));
});
test('provider configuration, caching and routing use compatible contracts',async()=>{
 const oldFetch=global.fetch, oldBase=process.env.GEOCODING_BASE_URL,oldRoute=process.env.OSRM_BASE_URL;
 try {
 delete process.env.GEOCODING_BASE_URL;
 let calls=0, requestUrl;
 let userAgent;
 global.fetch=async(url,options)=>{calls++;requestUrl=new URL(url);userAgent=options.headers["User-Agent"];return {ok:true,json:async()=>[{lat:'20',lon:'85',display_name:'Test street'}]};};
 await searchPlaces('Test street');
 assert.equal(requestUrl.origin,'https://nominatim.openstreetmap.org');
 assert.equal(requestUrl.searchParams.get('namedetails'),'1');
 assert.match(userAgent,/DoorstepCarWash/);
 await searchPlaces('Test street');assert.equal(calls,1);
 await assert.rejects(searchPlaces('Another street'),/wait a moment/);
 process.env.GEOCODING_BASE_URL='https://example.test/';
 process.env.OSRM_BASE_URL='https://example.test';
 global.fetch=async()=>({ok:true,json:async()=>({code:'Ok',routes:[{distance:1500,duration:120,geometry:{coordinates:[[85,20],[86,21]]}}]})});
 assert.deepEqual(await drivingRoute(20,85,21,86),{path:[{lat:20,lng:85},{lat:21,lng:86}],distanceMeters:1500,durationMillis:120000});
 }finally{global.fetch=oldFetch;for(const [key,value]of [['GEOCODING_BASE_URL',oldBase],['OSRM_BASE_URL',oldRoute]]){if(value===undefined)delete process.env[key];else process.env[key]=value;}}
});
