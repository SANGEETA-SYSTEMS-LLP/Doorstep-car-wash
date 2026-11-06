import { useRef, useState } from "react";
import {
  Clock3,
  Mail,
  LifeBuoy,
  MessageSquareText,
  Phone,
  ShieldCheck,
  Send,
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import useApi from "../../../hooks/useApi";
import { createSupportTicket } from "../../../services/customer/customerSupportService";
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
const SUPPORT_EMAIL = "support@sangeetasystems.com";
const SUPPORT_PHONE = "+917396691030";
const SUPPORT_WHATSAPP = "917396691030";

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
        <header className="overflow-hidden border-y border-slate-300 bg-green-900 px-6 py-7 text-white sm:px-9 sm:py-9">
          <div className="flex flex-col justify-between gap-7 sm:flex-row sm:items-center">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-green-100">
                <LifeBuoy size={15} />
                WashNow customer care
              </div>
              <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
                How can we help?
              </h1>
              <p className="mt-2 max-w-xl leading-6 text-green-100">
                Tell us what happened and our support team will follow up on your
                request. You can track updates to your tickets below.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:min-w-60">
              <SupportStat
                label="Your tickets"
                value={tickets.loading ? "-" : ticketCount}
                icon={<MessageSquareText size={16} />}
              />
              <SupportStat
                label="Open requests"
                value={tickets.loading ? "-" : openTicketCount}
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
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-700">
                <LifeBuoy size={20} />
              </div>
              <h2 className="mt-4 font-bold text-slate-900">Contact our support team</h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Submit a ticket to save your request, or contact us directly by email, phone, or WhatsApp.
              </p>
              <div className="mt-4 grid gap-2">
                <a href={`mailto:${SUPPORT_EMAIL}`} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                  <Mail size={17} className="text-green-700" /> {SUPPORT_EMAIL}
                </a>
                <a href={`tel:${SUPPORT_PHONE}`} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                  <Phone size={17} className="text-green-700" /> +91 73966 91030
                </a>
                <a href={`https://wa.me/${SUPPORT_WHATSAPP}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-700 px-4 py-3 text-sm font-semibold text-white hover:bg-green-800">
                  <MessageSquareText size={17} /> Chat with support on WhatsApp <Send size={15} />
                </a>
              </div>
              <p className="mt-3 text-xs leading-5 text-slate-500">
                Ticket submissions are saved in your support history. Direct email and WhatsApp links open your app so you can send a message.
              </p>
            </div>
            <CustomerSupportAssistant onCreateTicket={focusTicketForm} />
            <CallbackRequest
              profilePhone={profile?.phone}
              onCreated={tickets.refresh}
            />
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-700">
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
      <div className="flex items-center gap-1.5 text-xs text-green-100">
        {icon}
        {label}
      </div>
      <p className="mt-1.5 text-2xl font-bold">{value}</p>
    </div>
  );
}
