import {
  CheckCircle2,
  Clock3,
  MessageSquareText,
  RefreshCw,
} from "lucide-react";

const statusStyles = {
  open: "bg-blue-50 text-blue-700",
  in_progress: "bg-amber-50 text-amber-800",
  waiting_on_customer: "bg-violet-50 text-violet-700",
  resolved: "bg-emerald-50 text-emerald-700",
  closed: "bg-slate-100 text-slate-600",
};

function TicketList({ data, loading, error, refresh }) {
  const ticketList = data?.tickets || [];

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-blue-700">
            Request history
          </p>
          <h2 className="mt-1 text-xl font-bold text-slate-950">
            Your support tickets
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            View ticket status and replies from our team.
          </p>
        </div>
        <button
          type="button"
          onClick={refresh}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60"
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="mt-5 flex flex-col justify-between gap-4 rounded-xl border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center"
        >
          <div>
            <p className="font-semibold text-red-900">
              We couldn&apos;t load your support requests.
            </p>
            <p className="mt-1 text-sm text-red-800">{error}</p>
            <p className="mt-1 text-xs text-red-700">
              Try again. If this keeps happening, the support service may need
              attention from the site administrator.
            </p>
          </div>
          <button
            type="button"
            onClick={refresh}
            className="shrink-0 rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800"
          >
            Try again
          </button>
        </div>
      )}

      {loading && (
        <div role="status" className="mt-5 space-y-3">
          {[1, 2].map((item) => (
            <div
              key={item}
              className="h-28 animate-pulse rounded-xl bg-slate-100"
            />
          ))}
          <span className="sr-only">Loading your support tickets...</span>
        </div>
      )}

      {!loading && !error && ticketList.length > 0 && (
        <div className="mt-5 space-y-3">
          {ticketList.map((ticket) => (
            <TicketCard key={ticket.id} ticket={ticket} />
          ))}
        </div>
      )}

      {!loading && !error && ticketList.length === 0 && (
        <div className="mt-5 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-5 py-9 text-center">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-white text-slate-400 shadow-sm">
            <MessageSquareText size={20} />
          </div>
          <h3 className="mt-3 font-semibold text-slate-900">
            No support requests yet
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Once you submit a request, its reference and updates will appear here.
          </p>
        </div>
      )}
    </section>
  );
}

function TicketCard({ ticket }) {
  const status = ticket.status || "open";
  const statusStyle = statusStyles[status] || "bg-slate-100 text-slate-700";
  const createdDate = formatDateTime(ticket.created_at);

  return (
    <article className="rounded-xl border border-slate-200 p-4 sm:p-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-bold text-blue-700">
              {ticket.ticket_number || "Support request"}
            </span>
            <span className="text-slate-300" aria-hidden="true">·</span>
            <span className="text-xs capitalize text-slate-500">
              {(ticket.issue_type || "general").replaceAll("_", " ")}
            </span>
          </div>
          <h3 className="mt-1 break-words font-bold text-slate-900">
            {ticket.subject}
          </h3>
          <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-600">
            {ticket.description}
          </p>
        </div>
        <span className={`inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${statusStyle}`}>
          {["resolved", "closed"].includes(status)
            ? <CheckCircle2 size={14} />
            : <Clock3 size={14} />}
          {formatStatus(status)}
        </span>
      </div>

      {ticket.resolution_note && (
        <div className="mt-4 rounded-lg border-l-2 border-blue-500 bg-blue-50 p-3">
          <p className="text-xs font-bold uppercase tracking-wide text-blue-800">
            Response from support
          </p>
          <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-blue-950">
            {ticket.resolution_note}
          </p>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-slate-100 pt-3 text-xs text-slate-500">
        {createdDate && (
          <time dateTime={ticket.created_at}>
            Submitted {createdDate}
          </time>
        )}
        {ticket.booking_id && (
          <span className="font-mono">
            Booking linked
          </span>
        )}
        {ticket.priority && (
          <span className="capitalize">
            Priority: {ticket.priority}
          </span>
        )}
      </div>
    </article>
  );
}

function formatStatus(status) {
  return status.replaceAll("_", " ").replace(/\b\w/g, (letter) =>
    letter.toUpperCase()
  );
}

function formatDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default TicketList;
