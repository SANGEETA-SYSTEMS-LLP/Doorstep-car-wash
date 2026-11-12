import { test } from "node:test";
import assert from "node:assert/strict";
import { coordinates, currentPosition } from "../src/services/locations/maps.js";

test("map coordinates reject missing and out-of-range values without losing zero", () => {
  assert.deepEqual(coordinates({ latitude: 0, longitude: 0 }), { lat: 0, lng: 0 });
  assert.deepEqual(coordinates({ latitude: "17.4", longitude: "78.3" }), { lat: 17.4, lng: 78.3 });
  for (const value of [null, {}, { latitude: null, longitude: 1 }, { latitude: "", longitude: 1 }, { latitude: 91, longitude: 0 }, { latitude: 0, longitude: 181 }]) {
    assert.equal(coordinates(value), null);
  }
});

test("browser position reads geolocation coordinates", async () => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, "navigator");
  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: { geolocation: { getCurrentPosition: resolve => resolve({ coords: { latitude: 17.4, longitude: 78.3 } }) } },
  });
  try {
    assert.deepEqual(await currentPosition(), { lat: 17.4, lng: 78.3 });
  } finally {
    if (previous) Object.defineProperty(globalThis, "navigator", previous);
    else delete globalThis.navigator;
  }
});
