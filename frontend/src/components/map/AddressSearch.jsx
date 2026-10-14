import { useEffect, useRef, useState } from "react";
import { loadGoogleMaps, locationFromPlace } from "../../services/maps";

export default function AddressSearch({ onSelect, onStart, onError, disabled = false }) {
  const host = useRef(null);
  const callback = useRef(onSelect);
  const blocked = useRef(disabled);
  const start = useRef(onStart);
  const reportError = useRef(onError);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  useEffect(() => { callback.current = onSelect; blocked.current = disabled; start.current = onStart; reportError.current = onError; }, [onSelect, onStart, onError, disabled]);
  useEffect(() => {
    let active = true, sequence = 0, pendingSelectionId;
    let widget, listener, failure, input;
    loadGoogleMaps().then(async maps => {
      const { PlaceAutocompleteElement } = await maps.importLibrary("places");
      if (!active) return;
      widget = new PlaceAutocompleteElement();
      widget.setAttribute("aria-label", "Search street, building or society");
      widget.style.colorScheme = "light";
      widget.style.width = "100%";
      listener = async event => {
        if (blocked.current) return;
        const id = ++sequence;
        const selectionId = start.current?.();
        pendingSelectionId = selectionId;
        setFetching(true); setError("");
        try {
          const place = event.placePrediction.toPlace();
          await place.fetchFields({ fields: ["location", "displayName", "formattedAddress", "addressComponents"] });
          if (!active || id !== sequence || blocked.current) return;
          const address = locationFromPlace(place);
          callback.current(place.location.toJSON(), address, selectionId);
        } catch { if (active && id === sequence) { const message = "This search result could not be loaded. Try another suggestion, or select a map pin and enter your address."; setError(message); reportError.current?.(message, selectionId); } }
        finally { if (active && id === sequence) { pendingSelectionId = undefined; setFetching(false); } }
      };
      failure = () => { if (active) { sequence++; reportError.current?.("", pendingSelectionId); setFetching(false); setError("Address search is unavailable. Select your location on the map or use current location, then enter your street address."); } };
      input = () => { sequence++; reportError.current?.("", pendingSelectionId); pendingSelectionId = undefined; setError(""); setFetching(false); };
      widget.addEventListener("gmp-select", listener);
      widget.addEventListener("gmp-error", failure);
      widget.addEventListener("input", input);
      host.current.replaceChildren(widget);
      setLoading(false);
    }).catch(() => { if (active) { setLoading(false); setError("Address search could not load. Use the map or current location below."); } });
    return () => { active = false; sequence++; widget?.removeEventListener("gmp-select", listener); widget?.removeEventListener("gmp-error", failure); widget?.removeEventListener("input", input); widget?.remove(); };
  }, []);
  return <div style={{ colorScheme: "light" }} inert={disabled}>
    <p className="mb-2 text-sm font-semibold text-slate-800">Search address</p>
    <div ref={host} />
    {(loading || fetching) && <p role="status" className="mt-2 text-sm text-slate-500">{loading ? "Loading address search…" : "Loading selected address…"}</p>}
    {error && <p role="alert" className="mt-2 text-sm text-amber-800">{error}</p>}
  </div>;
}
