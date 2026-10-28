import { useEffect, useState } from "react";
import { Check, Copy, Gift, Percent, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useBooking } from "../../../context/BookingContext";
import { getCustomerOffers } from "../../../services/customer/customerOfferService";

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
      .then((items) => { if (active) setOffers(items); })
      .catch((loadError) => { if (active) setError(loadError.message || "Offers could not be loaded."); })
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

  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-8">
      <div className="mx-auto max-w-6xl">
        <p className="font-semibold text-slate-500">SAVINGS</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">Offers &amp; coupons</h1>
        <p className="mt-2 text-slate-600">Choose an offer and apply it to an eligible booking at checkout.</p>

        <section className="mt-7 flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700"><Gift size={24} /></span>
          <div>
            <h2 className="font-semibold text-slate-900">Available for your next wash</h2>
            <p className="mt-1 text-sm text-slate-600">Offer eligibility is checked with your selected vehicle, package, and service date.</p>
          </div>
        </section>

        {error && <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}
        {loading ? <p role="status" className="mt-8 text-sm text-slate-600">Loading available offers…</p> : null}
        {!loading && !error && offers.length === 0 ? <p className="mt-8 rounded-xl border border-slate-200 bg-white p-5 text-slate-600">You’ve used all the current offers. New offers will appear here when available.</p> : null}

        <div className="mt-7 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {offers.map((offer, index) => (
            <article key={offer.code} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6">
              <div className="flex items-center justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700">{index === 0 ? <Sparkles size={20} /> : <Percent size={20} />}</span>
                <span className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Available</span>
              </div>
              <h2 className="mt-5 text-xl font-bold text-slate-900">{offer.title}</h2>
              <p className="mt-2 min-h-12 text-sm leading-6 text-slate-600">{offer.description}</p>
              <p className="mt-3 text-xs text-slate-500">{offer.terms}</p>
              <div className="mt-5 flex items-center justify-between rounded-xl border border-dashed border-slate-300 px-3 py-2.5">
                <span className="font-mono font-bold tracking-wide text-slate-800">{offer.code}</span>
                <button type="button" onClick={() => copyCode(offer)} className="flex items-center gap-1 text-sm font-semibold text-slate-700 hover:text-slate-950">
                  {copied === offer.code ? <><Check size={16} /> Copied</> : <><Copy size={15} /> Copy</>}
                </button>
              </div>
              <button type="button" onClick={() => selectOffer(offer)} className="mt-5 w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">Use this offer</button>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Offers;
