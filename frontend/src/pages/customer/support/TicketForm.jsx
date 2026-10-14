import { Send } from "lucide-react";

const issueOptions = [
  ["booking_issue", "Booking issue"],
  ["washer_issue", "Washer issue"],
  ["payment_issue", "Payment issue"],
  ["refund_request", "Refund request"],
  ["service_quality", "Service quality"],
  ["additional_charge", "Additional charge"],
  ["other", "Other"],
];

const fieldClassName =
  "mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-normal text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 disabled:bg-slate-50";

function TicketForm({
  form,
  updateField,
  submitTicket,
  error,
  createdTicket,
  saving,
}) {
  return (
    <form
      onSubmit={submitTicket}
      className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"
    >
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-blue-700">
          Contact support
        </p>
        <h2 className="mt-1 text-xl font-bold text-slate-950">
          Submit a request
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Required fields are marked with an asterisk.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          <p className="font-semibold">Your request could not be submitted.</p>
          <p className="mt-1">{error}</p>
        </div>
      )}

      {createdTicket && (
        <div
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900"
        >
          <p className="font-semibold">Your support request was submitted.</p>
          <p className="mt-1">
            Reference: <span className="font-mono font-bold">{createdTicket.ticket_number}</span>
          </p>
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block text-sm font-semibold text-slate-700">
          Booking reference
          <span className="ml-1 font-normal text-slate-400">Optional</span>
          <input
            name="bookingId"
            value={form.bookingId}
            onChange={updateField}
            maxLength={64}
            placeholder="e.g. booking number"
            autoComplete="off"
            className={fieldClassName}
          />
          <span className="mt-1.5 block text-xs font-normal text-slate-500">
            Add this if your question is about a specific booking.
          </span>
        </label>

        <label className="block text-sm font-semibold text-slate-700">
          What do you need help with? <span className="text-red-600">*</span>
          <select
            name="issueType"
            required
            value={form.issueType}
            onChange={updateField}
            className={fieldClassName}
          >
            <option value="">Choose an issue</option>
            {issueOptions.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block text-sm font-semibold text-slate-700">
        Subject <span className="text-red-600">*</span>
        <input
          name="subject"
          required
          minLength={3}
          maxLength={160}
          value={form.subject}
          onChange={updateField}
          placeholder="Briefly describe your concern"
          className={fieldClassName}
        />
      </label>

      <label className="block text-sm font-semibold text-slate-700">
        How can we help? <span className="text-red-600">*</span>
        <textarea
          name="description"
          required
          minLength={10}
          maxLength={5000}
          rows={5}
          value={form.description}
          onChange={updateField}
          placeholder="Share the details so we can understand and help resolve your issue."
          className={`${fieldClassName} resize-y`}
        />
        <span className="mt-1 block text-right text-xs font-normal text-slate-400">
          {form.description.length}/5000
        </span>
      </label>

      <button
        type="submit"
        disabled={saving}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-3.5 font-semibold text-white shadow-sm transition hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-700/20 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        <Send size={17} />
        {saving ? "Submitting request..." : "Submit support request"}
      </button>
    </form>
  );
}

export default TicketForm;
