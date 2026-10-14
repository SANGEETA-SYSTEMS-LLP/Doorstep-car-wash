import { useRef, useState } from "react";
import {
  Clock3,
  LifeBuoy,
  MessageSquareText,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import useApi from "../../../hooks/useApi";
import { createSupportTicket } from "../../../services/customerSupportService";
import CallbackRequest from "./CallbackRequest";
import CustomerSupportAssistant from "./CustomerSupportAssistant";
import TicketForm from "./TicketForm";
import TicketList from "./TicketList";

const emptyForm = {
  bookingId: "",
  issueType: "",
  subject: "",
  description: "",
};

export default function Support() {
  const { profile } = useAuth();
  const tickets = useApi("/support/my");
  const ticketFormRef = useRef(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [createdTicket, setCreatedTicket] = useState(null);

  async function submitTicket(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setCreatedTicket(null);

    try {
      const result = await createSupportTicket(form);

      setCreatedTicket(result.ticket);
      setForm(emptyForm);
      tickets.refresh();
    } catch (submitError) {
      console.error("Unable to create support ticket:", submitError);
      setError(
        submitError.message ||
          "We couldn't submit your request. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function focusTicketForm() {
    ticketFormRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  const ticketCount = tickets.data?.tickets?.length || 0;
  const openTicketCount =
    tickets.data?.tickets?.filter(
      (ticket) => !["resolved", "closed"].includes(ticket.status)
    ).length || 0;

  return (
    <main className="min-h-full bg-slate-50 px-4 py-7 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-7">
        <header className="overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-blue-950 to-blue-800 px-6 py-7 text-white shadow-sm sm:px-9 sm:py-9">
          <div className="flex flex-col justify-between gap-7 sm:flex-row sm:items-center">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-blue-100">
                <LifeBuoy size={15} />
                WashNow customer care
              </div>
              <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
                How can we help?
              </h1>
              <p className="mt-2 max-w-xl leading-6 text-blue-100">
                Tell us what happened and our support team will follow up on your
                request. You can track updates to your tickets below.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:min-w-60">
              <SupportStat
                label="Your tickets"
                value={tickets.loading ? "—" : ticketCount}
                icon={<MessageSquareText size={16} />}
              />
              <SupportStat
                label="Open requests"
                value={tickets.loading ? "—" : openTicketCount}
                icon={<Clock3 size={16} />}
              />
            </div>
          </div>
        </header>

        <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.72fr)]">
          <div ref={ticketFormRef}>
            <TicketForm
              form={form}
              updateField={updateField}
              submitTicket={submitTicket}
              error={error}
              createdTicket={createdTicket}
              saving={saving}
            />
          </div>

          <aside className="space-y-4">
            <CustomerSupportAssistant onCreateTicket={focusTicketForm} />
            <CallbackRequest
              profilePhone={profile?.phone}
              onCreated={tickets.refresh}
            />
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                <ShieldCheck size={20} />
              </div>
              <h2 className="mt-4 font-bold text-slate-900">
                Your request, in one place
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Every request receives a reference number. Follow ticket status
                and support replies in your history below.
              </p>
            </div>
          </aside>
        </div>

        <TicketList {...tickets} />
      </div>
    </main>
  );
}

function SupportStat({ label, value, icon }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/10 p-3">
      <div className="flex items-center gap-1.5 text-xs text-blue-100">
        {icon}
        {label}
      </div>
      <p className="mt-1.5 text-2xl font-bold">{value}</p>
    </div>
  );
}
