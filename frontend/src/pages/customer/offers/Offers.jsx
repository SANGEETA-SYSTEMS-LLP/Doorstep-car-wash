import { useEffect, useState } from "react";
import { Check, Copy, Gift, Percent } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useBooking } from "../../../context/BookingContext";
import { getCustomerOffers } from "../../../services/customer/customerOfferService";

function OfferSkeleton() {
  return <div role="status" aria-label="Loading available offers" className="mt-7 divide-y divide-slate-200 border-y border-slate-200">
    <span className="sr-only">Loading available offers</span>
    {[0, 1, 2].map(item => <div key={item} className="grid animate-pulse gap-4 bg-[#fbfcfb] p-5 sm:grid-cols-[1fr_auto] sm:items-center sm:px-6">
      <div><div className="h-4 w-40 rounded bg-slate-200"/><div className="mt-3 h-3 w-64 max-w-full rounded bg-slate-100"/><div className="mt-4 h-8 w-36 rounded bg-slate-100"/></div><div className="h-10 w-32 rounded bg-slate-200"/>
    </div>)}
  </div>;
}

function Offers() {
  const navigate = useNavigate();
  const { updateBooking } = useBooking();
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(null);

  useEffect(() => {
    let active = true;
    getCustomerOffers()
      .then(items => { if (active) setOffers(items); })
      .catch(loadError => { if (active) setError(loadError.message || "Offers could not be loaded."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function copyCode(offer) {
    try {
      await navigator.clipboard.writeText(offer.code);
      setCopied(offer.code);
      window.setTimeout(() => setCopied(null), 1500);
    } catch {
      setError("Clipboard access is unavailable. You can still enter the offer code at checkout.");
    }
  }

  function selectOffer(offer) {
    updateBooking({ promoCode: offer.code, appliedOffer: null });
    navigate("/customer/select-location");
  }

  return <main className="min-h-screen bg-slate-50 p-6 lg:p-8">
    <div className="mx-auto max-w-6xl">
      <p className="font-semibold text-slate-500">SAVINGS</p>
      <h1 className="mt-2 text-3xl font-bold text-slate-900">Offers &amp; coupons</h1>
      <p className="mt-2 text-slate-600">Choose an offer and apply it to an eligible booking at checkout.</p>

      <section className="mt-7 flex items-center gap-4 border-y border-slate-300 bg-[#edf3f4] p-5">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-green-900 text-white"><Gift size={22}/></span>
        <div><h2 className="font-semibold text-slate-900">Available for your next wash</h2><p className="mt-1 text-sm text-slate-600">Offer eligibility is checked with your selected vehicle, package, and service date.</p></div>
      </section>

      {error && <p role="alert" className="mt-5 border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}
      {loading && <OfferSkeleton/>}
      {!loading && !error && offers.length === 0 && <p className="mt-7 border border-slate-200 bg-[#fbfcfb] p-5 text-slate-600">You’ve used all the current offers. New offers will appear here when available.</p>}

      {!loading && offers.length > 0 && <div className="mt-7 divide-y divide-slate-200 border-y border-slate-200">
        {offers.map((offer, index) => <article key={offer.code} className="grid gap-4 bg-[#fbfcfb] p-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-6">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-100 text-green-900">{index === 0 ? <Gift size={18}/> : <Percent size={18}/>}</span><h2 className="text-lg font-bold text-slate-900">{offer.title}</h2><span className="text-xs font-semibold text-green-800">Available</span></div>
            <p className="mt-2 text-sm leading-6 text-slate-600">{offer.description}</p>
            <p className="mt-1 text-xs text-slate-500">{offer.terms}</p>
            <div className="mt-3 inline-flex items-center gap-3 border border-dashed border-slate-300 px-3 py-2">
              <span className="font-mono text-sm font-bold tracking-wide text-slate-800">{offer.code}</span>
              <button type="button" onClick={() => copyCode(offer)} className="inline-flex items-center gap-1 text-sm font-semibold text-green-900 underline">{copied === offer.code ? <><Check size={15}/>Copied</> : <><Copy size={15}/>Copy code</>}</button>
            </div>
          </div>
          <button type="button" onClick={() => selectOffer(offer)} className="min-h-11 rounded-md bg-green-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-950">Use this offer</button>
        </article>)}
      </div>}
    </div>
  </main>;
}
export default Offers;
