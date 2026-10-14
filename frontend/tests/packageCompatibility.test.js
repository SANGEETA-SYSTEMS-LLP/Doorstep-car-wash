import { test } from "node:test";
import assert from "node:assert/strict";
import { isPackageForVehicle } from "../src/utils/packageCompatibility.js";
test("packages must match the selected vehicle type", () => {
 assert.equal(isPackageForVehicle({vehicle_type:"sedan",is_active:true},{type:"hatchback"}),false);
 assert.equal(isPackageForVehicle({vehicle_type:"hatchback",is_active:true},{type:"hatchback"}),true);
 assert.equal(isPackageForVehicle({vehicleType:"hatchback"},{type:"hatchback"}),true);
 assert.equal(isPackageForVehicle({vehicle_type:"hatchback",is_active:false},{type:"hatchback"}),false);
 for (const [pkg,vehicle] of [[null,null],[{},{type:"hatchback"}],[{vehicleType:"sedan"},null]]) assert.equal(isPackageForVehicle(pkg,vehicle),false);
});
