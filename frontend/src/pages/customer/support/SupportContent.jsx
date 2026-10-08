import { CheckCircle2, CircleHelp, Mail, MessageCircle, Phone, Send } from "lucide-react";
import SupportCard from "./SupportCard";

function SupportContent({ submitted, setSubmitted, handleSubmit }) {
  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-8">
      <div className="mx-auto max-w-6xl">
        <p className="font-semibold text-blue-600">
          HELP CENTER
        </p>

        <h1 className="mt-2 text-3xl font-bold">
          Customer Support
        </h1>

        <p className="mt-2 text-slate-500">
          Need help with a booking, payment or service?
        </p>

        <div className="mt-8 grid gap-6 lg:grid-cols-[0.7fr_1.3fr]">
          <div className="space-y-4">
            <SupportCard
              icon={<Phone />}
              title="Call Support"
              description="Speak with our customer support team."
            />

            <SupportCard
              icon={<MessageCircle />}
              title="Live Chat"
              description="Chat with a support executive."
            />

            <SupportCard
              icon={<Mail />}
              title="Email Support"
              description="Send us your questions or concerns."
            />

            <div className="rounded-2xl bg-blue-600 p-6 text-white">
              <CircleHelp size={30} />

              <h2 className="mt-4 text-xl font-bold">
                Booking issue?
              </h2>

              <p className="mt-2 text-sm leading-6 text-blue-100">
                Include your booking ID so our support team can
                resolve the issue faster.
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-7">
            <h2 className="text-xl font-bold">
              Create Support Ticket
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Tell us what happened and our support team will
              review your request.
            </p>

            {submitted ? (
              <div className="mt-8 rounded-2xl bg-green-50 p-7 text-center">
                <CheckCircle2
                  size={40}
                  className="mx-auto text-green-600"
                />

                <h3 className="mt-4 text-xl font-bold">
                  Ticket Created
                </h3>

                <p className="mt-2 text-sm text-slate-500">
                  Ticket ID: SUP-2026-00124
                </p>

                <button
                  onClick={() => setSubmitted(false)}
                  className="mt-5 rounded-xl bg-green-600 px-5 py-3 font-semibold text-white"
                >
                  Create Another Ticket
                </button>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="mt-7 space-y-5"
              >
                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Booking ID
                  </label>

                  <input
                    placeholder="Example: CW-2026-1028"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3.5 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Issue Type
                  </label>

                  <select
                    required
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3.5"
                  >
                    <option value="">
                      Select issue
                    </option>
                    <option>Booking Issue</option>
                    <option>Washer Issue</option>
                    <option>Payment Issue</option>
                    <option>Refund Request</option>
                    <option>Service Quality</option>
                    <option>Additional Charge</option>
                    <option>Other</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Subject
                  </label>

                  <input
                    required
                    placeholder="Briefly describe the issue"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3.5"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Description
                  </label>

                  <textarea
                    required
                    rows={6}
                    placeholder="Explain your issue..."
                    className="w-full resize-none rounded-xl border border-slate-300 p-4"
                  />
                </div>

                <button
                  type="submit"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-4 font-semibold text-white"
                >
                  <Send size={18} />
                  Submit Ticket
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SupportContent;
