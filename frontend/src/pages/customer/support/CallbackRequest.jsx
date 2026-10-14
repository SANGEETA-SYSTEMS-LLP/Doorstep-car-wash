import { useState } from "react";
import { PhoneCall } from "lucide-react";
import { createSupportTicket } from "../../../services/customerSupportService";

const callbackWindows = [
  ["anytime", "Any time"],
  ["morning", "Morning (9 AM – 12 PM)"],
  ["afternoon", "Afternoon (12 PM – 4 PM)"],
  ["evening", "Evening (4 PM – 8 PM)"],
];

function CallbackRequest({ profilePhone, onCreated }) {
  const [phone, setPhone] = useState("");
  const [phoneEdited, setPhoneEdited] = useState(false);
  const [timeWindow, setTimeWindow] = useState("anytime");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [ticket, setTicket] = useState(null);

  const displayedPhone =
    phoneEdited ? phone : profilePhone || phone;

  async function submitCallback(event) {
    event.preventDefault();
    setError("");
    setTicket(null);

    const digits = displayedPhone.replace(/\D/g, "");
    if (digits.length < 8 || digits.length > 15) {
      setError("Enter a valid callback number with 8 to 15 digits.");
      return;
    }

    setSaving(true);
    try {
      const result = await createSupportTicket({
        issueType: "other",
        subject: "Customer callback request",
        description: [
          "The customer requests a phone callback from the support team.",
          `Callback number: ${displayedPhone.trim()}`,
          `Preferred callback time: ${
            callbackWindows.find(([value]) => value === timeWindow)?.[1] ||
            "Any time"
          }`,
        ].join("\n"),
      });
      setTicket(result.ticket);
      onCreated();
    } catch (submitError) {
      console.error("Unable to submit callback request:", submitError);
      setError(
        submitError.message ||
          "Unable to request a callback. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
          <PhoneCall size={20} />
        </div>
        <div>
          <h2 className="font-bold text-slate-950">Request a call</h2>
          <p className="mt-1 text-sm leading-5 text-slate-500">
            Ask our support team to call you about your issue.
          </p>
        </div>
      </div>

      {ticket ? (
        <div role="status" className="mt-4 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-900">
          <p className="font-semibold">Callback request received.</p>
          <p className="mt-1">
            Reference: <span className="font-mono font-bold">{ticket.ticket_number}</span>
          </p>
          <p className="mt-1 text-xs">
            Your preferred time has been added to the request. Our team will
            review it and follow up.
          </p>
        </div>
      ) : (
        <form onSubmit={submitCallback} className="mt-4 space-y-3">
          <label className="block text-sm font-semibold text-slate-700">
            Phone number
            <input
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              required
              minLength={8}
              maxLength={24}
              value={displayedPhone}
              onChange={(event) => {
                setPhone(event.target.value);
                setPhoneEdited(true);
              }}
              placeholder="+91 98765 43210"
              className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10"
            />
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            Preferred time
            <select
              value={timeWindow}
              onChange={(event) => setTimeWindow(event.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10"
            >
              {callbackWindows.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          {error && (
            <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={saving}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <PhoneCall size={16} />
            {saving ? "Sending request..." : "Request a callback"}
          </button>
          <p className="text-xs leading-5 text-slate-400">
            This submits a callback ticket to customer support; it does not
            place an immediate call.
          </p>
        </form>
      )}
    </section>
  );
}

export default CallbackRequest;
