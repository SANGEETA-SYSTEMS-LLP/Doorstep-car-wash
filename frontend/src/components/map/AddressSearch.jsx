import { useEffect, useRef, useState } from "react";
import { MapPin, Search } from "lucide-react";
import { searchAddresses } from "../../services/locations/maps";

const MIN_QUERY_LENGTH = 3;
const SEARCH_DELAY_MS = 1200;

export default function AddressSearch({ onSelect, onStart, onError, disabled = false }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const [open, setOpen] = useState(false);
  const [searchNow, setSearchNow] = useState(0);
  const sequence = useRef(0);
  const root = useRef(null);
  const input = useRef(null);

  useEffect(() => () => { sequence.current++; }, []);

  useEffect(() => {
    const value = query.trim();
    setResults([]);
    setError("");
    setActiveIndex(-1);
    if (value.length < MIN_QUERY_LENGTH || !open || disabled) {
      setBusy(false);
      return undefined;
    }

    const id = ++sequence.current;
    setBusy(true);
    const timer = window.setTimeout(async () => {
      try {
        const data = await searchAddresses(value);
        if (id === sequence.current) {
          setResults(data);
          if (!data.length) setError("No matching places found. Try a nearby street or landmark.");
        }
      } catch (lookupError) {
        if (id === sequence.current) setError(lookupError.message || "Unable to search locations right now.");
      } finally {
        if (id === sequence.current) setBusy(false);
      }
    }, searchNow ? 0 : SEARCH_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [query, open, disabled, searchNow]);

  useEffect(() => {
    function dismiss(event) {
      if (!root.current?.contains(event.target)) setOpen(false);
    }
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, []);

  function choose(address) {
    const id = onStart?.();
    try {
      onSelect({ lat: address.latitude, lng: address.longitude }, address, id);
      setQuery(address.address || address.name || "");
      setResults([]);
      setError("");
      setOpen(false);
    } catch (selectionError) {
      onError?.(selectionError.message, id);
    }
  }

  function handleKeyDown(event) {
    if (event.key === "Escape") {
      setOpen(false);
      return;
    }
    if (event.key === "ArrowDown" && results.length) {
      event.preventDefault();
      setActiveIndex(index => (index + 1) % results.length);
      return;
    }
    if (event.key === "ArrowUp" && results.length) {
      event.preventDefault();
      setActiveIndex(index => index <= 0 ? results.length - 1 : index - 1);
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      if (activeIndex >= 0 && results[activeIndex]) choose(results[activeIndex]);
      else if (results.length) choose(results[0]);
      else if (query.trim().length >= MIN_QUERY_LENGTH) setOpen(true);
    }
  }

  return <div ref={root} className="relative">
    <label htmlFor="address-place-search" className="block text-sm font-semibold text-slate-800">Search address, apartment or office</label>
    <div className="mt-2 flex gap-2">
      <div className="relative min-w-0 flex-1">
        <Search size={18} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          ref={input}
          id="address-place-search"
          type="search"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open && results.length > 0}
          aria-controls="address-place-results"
          aria-activedescendant={activeIndex >= 0 ? `address-place-option-${activeIndex}` : undefined}
          disabled={disabled}
          value={query}
          onFocus={() => setOpen(true)}
          onChange={event => { setQuery(event.target.value); setOpen(true); }}
          onKeyDown={handleKeyDown}
          placeholder="Start typing a place, street or landmark"
          className="min-w-0 w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-3 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
        />
      </div>
      <button type="button" disabled={disabled || busy || query.trim().length < MIN_QUERY_LENGTH} onClick={() => { setOpen(true); input.current?.focus(); setSearchNow(value => value + 1); }} className="shrink-0 rounded-xl bg-green-700 px-4 text-sm font-semibold text-white disabled:opacity-50">{busy ? "Searching…" : "Search"}</button>
    </div>

    {open && (busy || results.length > 0 || error) && <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
      {busy && <p role="status" className="px-4 py-3 text-sm text-slate-500">Finding places…</p>}
      {error && !busy && <p role="status" className="px-4 py-3 text-sm text-amber-800">{error}</p>}
      {!busy && results.length > 0 && <ul id="address-place-results" role="listbox" aria-label="Matching places" className="max-h-72 overflow-y-auto py-1">
        {results.map((place, index) => <li key={`${place.latitude},${place.longitude},${index}`} id={`address-place-option-${index}`} role="option" aria-selected={activeIndex === index}>
          <button type="button" disabled={disabled} onMouseDown={event => event.preventDefault()} onClick={() => choose(place)} className={`flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-green-50 ${activeIndex === index ? "bg-green-50" : ""}`}>
            <MapPin size={17} aria-hidden="true" className="mt-0.5 shrink-0 text-green-700" />
            <span className="min-w-0"><span className="block text-sm font-semibold text-slate-900">{place.name || place.address}</span><span className="mt-0.5 block text-xs leading-5 text-slate-600">{place.address}</span></span>
          </button>
        </li>)}
      </ul>}
    </div>}
    <p className="mt-2 text-xs text-slate-500">Suggestions appear as you type. Select a public place or street to move the map pin. Enter private flat details separately. © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" className="underline">OpenStreetMap contributors</a></p>
  </div>;
}
