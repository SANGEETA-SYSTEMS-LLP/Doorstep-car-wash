import { useState } from "react";
import { Bot, MessageCircle, Send } from "lucide-react";

const answers = [
  {
    id: "book",
    question: "How do I book a car wash?",
    keywords: ["book", "booking", "schedule", "appointment"],
    answer:
      "Choose “Book a wash” from your customer menu, then select a service location, vehicle, package, date, and time. You can review your booking and payment details before confirming.",
  },
  {
    id: "status",
    question: "Where can I check my booking status?",
    keywords: ["status", "track", "tracking", "where", "washer"],
    answer:
      "Open Booking History and select the booking to see its current status and details. When a washer is assigned and sharing GPS, the tracking page shows the latest location.",
  },
  {
    id: "payment",
    question: "I have a payment question",
    keywords: ["payment", "paid", "charge", "charged", "receipt", "invoice"],
    answer:
      "Open the booking details or invoice to review the payment summary. If the payment is missing, duplicated, or has the wrong amount, create a Payment issue ticket and include your booking reference.",
  },
  {
    id: "cancel",
    question: "I need to change or cancel a booking",
    keywords: ["cancel", "change", "reschedule", "edit", "modify"],
    answer:
      "Please submit a Booking issue ticket with your booking reference and the change you need. The support team can review the booking and follow up with the available options.",
  },
  {
    id: "refund",
    question: "How do I ask about a refund?",
    keywords: ["refund", "money back", "return"],
    answer:
      "Create a Refund request ticket and include the booking reference, payment details relevant to the issue, and a short description. You can follow the ticket status and support replies below.",
  },
  {
    id: "service",
    question: "I have a problem with the service",
    keywords: ["quality", "service", "washer", "damage", "clean"],
    answer:
      "Create a Service quality or Washer issue ticket. Include your booking reference and the details of what happened so the support team can investigate.",
  },
];

function CustomerSupportAssistant({ onCreateTicket }) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [message, setMessage] = useState("");

  function askAssistant(value = question) {
    const query = value.trim().toLowerCase();
    if (!query) {
      setMessage("Type a question or choose one of the common topics.");
      return;
    }

    const matchedAnswer = answers.find((item) =>
      item.keywords.some((keyword) => query.includes(keyword))
    );

    setAnswer(
      matchedAnswer?.answer ||
        "I couldn't find a direct answer in the support guide. Submit a support request below and our team will help with your specific situation."
    );
    setMessage("");
    setQuestion(value);
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-700">
          <Bot size={21} />
        </div>
        <div>
          <h2 className="font-bold text-slate-950">AI support assistant</h2>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Instant guidance from our support help topics. For account-specific
            issues, create a ticket.
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {answers.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => askAssistant(item.question)}
            className="rounded-full border border-slate-200 px-3 py-1.5 text-left text-xs font-medium text-slate-700 transition hover:border-green-300 hover:bg-green-50 hover:text-green-800"
          >
            {item.question}
          </button>
        ))}
      </div>

      <form
        className="mt-4 flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          askAssistant();
        }}
      >
        <label className="sr-only" htmlFor="support-assistant-question">
          Ask a support question
        </label>
        <input
          id="support-assistant-question"
          value={question}
          onChange={(event) => {
            setQuestion(event.target.value);
            setMessage("");
          }}
          placeholder="Ask about bookings, payments..."
          maxLength={240}
          className="min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/10"
        />
        <button
          type="submit"
          aria-label="Get support answer"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-700 text-white hover:bg-green-800"
        >
          <Send size={16} />
        </button>
      </form>

      {message && (
        <p role="status" className="mt-3 text-sm text-amber-700">
          {message}
        </p>
      )}

      {answer && (
        <div className="mt-4 rounded-xl bg-green-50 p-4">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-green-800">
            <MessageCircle size={14} />
            Support guidance
          </p>
          <p className="mt-2 text-sm leading-6 text-green-950">{answer}</p>
          <button
            type="button"
            onClick={onCreateTicket}
            className="mt-3 text-sm font-semibold text-green-800 underline underline-offset-2"
          >
            Contact the support team
          </button>
        </div>
      )}
    </section>
  );
}

export default CustomerSupportAssistant;
