import { useState } from "react";
import {
  Check,
  Copy,
  Gift,
  Percent,
  Sparkles,
} from "lucide-react";

const offers = [
  {
    id: 1,
    code: "FIRSTWASH",
    title: "₹100 Off",
    description:
      "Get ₹100 off on your first doorstep car wash.",
    minimum: "Minimum booking ₹399",
  },
  {
    id: 2,
    code: "CLEAN20",
    title: "20% Off",
    description:
      "Save 20% on Premium Wash bookings.",
    minimum: "Maximum discount ₹150",
  },
  {
    id: 3,
    code: "WEEKEND50",
    title: "₹50 Off",
    description:
      "Special weekend discount on any car wash.",
    minimum: "Valid Saturday & Sunday",
  },
];

function Offers() {
  const [copied, setCopied] = useState(null);

  const copyCode = (offer) => {
    navigator.clipboard?.writeText(offer.code);
    setCopied(offer.id);

    setTimeout(() => {
      setCopied(null);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-8">
      <div className="mx-auto max-w-6xl">
        <p className="font-semibold text-blue-600">
          SAVE MORE
        </p>

        <h1 className="mt-2 text-3xl font-bold">
          Offers & Coupons
        </h1>

        <p className="mt-2 text-slate-500">
          Apply available offers to your next car wash.
        </p>

        <section className="mt-8 overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 to-cyan-500 p-8 text-white">
          <Gift size={34} />

          <h2 className="mt-5 text-3xl font-bold">
            Car care costs less with WashNow.
          </h2>

          <p className="mt-3 text-blue-100">
            Check your latest discounts and promotional offers.
          </p>
        </section>

        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {offers.map((offer) => (
            <div
              key={offer.id}
              className="rounded-3xl border border-slate-200 bg-white p-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  {offer.id === 1 ? (
                    <Sparkles />
                  ) : (
                    <Percent />
                  )}
                </div>

                <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700">
                  ACTIVE
                </span>
              </div>

              <h2 className="mt-5 text-2xl font-bold">
                {offer.title}
              </h2>

              <p className="mt-2 min-h-12 text-sm leading-6 text-slate-500">
                {offer.description}
              </p>

              <p className="mt-4 text-xs text-slate-400">
                {offer.minimum}
              </p>

              <div className="mt-6 flex items-center justify-between rounded-xl border border-dashed border-blue-300 bg-blue-50 p-3">
                <span className="font-mono font-bold text-blue-700">
                  {offer.code}
                </span>

                <button
                  onClick={() => copyCode(offer)}
                  className="flex items-center gap-1 text-sm font-semibold text-blue-600"
                >
                  {copied === offer.id ? (
                    <>
                      <Check size={16} />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy size={16} />
                      Copy
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Offers;