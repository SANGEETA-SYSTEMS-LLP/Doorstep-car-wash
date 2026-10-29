import { Link, useLocation } from "react-router-dom";

const legalCopy = {
  terms: {
    title: "Terms of Service",
    intro: "These terms explain how to use WashNow to book doorstep car-wash services or to apply as a washer partner.",
    sections: [
      ["Using the service", "Provide accurate account, vehicle, contact and service-location details. Keep your sign-in credentials private and use only the workspace assigned to your account role."],
      ["Bookings and payment", "Review the service, appointment, total, taxes, offer terms and cancellation information shown during checkout before confirming. A booking is subject to the availability and assignment process shown in your account. Payment processing is handled through the payment provider displayed at checkout."],
      ["Changes and cancellations", "Available cancellation options, refund eligibility, refund amount and timing depend on the booking state and the terms shown in the product when you cancel. Any platform fee, tax or other excluded amount will be shown before you confirm a cancellation."],
      ["Vehicle keys, belongings and service responsibility", "WashNow provides a digital platform for booking and coordinating doorstep car-wash services; the wash is carried out by the assigned washer partner. Do not hand your vehicle keys to a washer. Keep your keys with you, secure your vehicle, and remove cash, jewellery, electronics, documents and other valuables before the appointment. You are responsible for securing and removing your personal belongings and for telling the washer about any known, pre-existing vehicle damage or condition before work begins. Washer partners are responsible for their own services and conduct. To the extent permitted by applicable law, WashNow is not responsible for loss of belongings left in the vehicle or for pre-existing damage that was not disclosed before service. Nothing in these terms limits a right or liability that cannot legally be excluded."],
      ["Service access", "WashNow may limit or suspend access when an account is inactive, details are inaccurate, or use creates a security or operational risk. Washer partners must complete the verification and approval process before receiving work."],
      ["Service updates and records", "Booking status, assignment details, service checklists and photos may be used to coordinate and verify the requested service. Do not upload content you do not have permission to share."],
      ["Questions", "For account or booking help, sign in and use the Support section. These terms do not change any consumer rights that apply under local law."],
    ],
  },
  privacy: {
    title: "Privacy Policy",
    intro: "This policy describes the information WashNow uses to operate customer bookings and partner workspaces.",
    sections: [
      ["Information you provide", "We process account details such as your name, email and phone number; saved addresses; vehicle information; booking and support details; and information submitted by washer partners for verification and payouts."],
      ["Location and service records", "A service address and, when you choose to use it, device location help check service coverage and coordinate a booking. Assigned washers and supervisors receive the booking details needed to carry out dispatch and service. Service checklists and before-and-after photos may be stored with the booking."],
      ["Payments", "Payments are initiated through the provider shown at checkout. WashNow uses booking and payment status, transaction references and payment-method details returned by the provider to confirm bookings, handle cancellations and support refunds. Card or bank credentials are handled by the payment provider, not stored as a saved payment method by this policy."],
      ["How information is used", "Information supports account access, booking and dispatch, customer support, payment and refund records, partner operations, service quality review, fraud prevention, security logging and legal obligations."],
      ["Service providers and access", "Information is shared with the service providers needed to run the platform, which may include Supabase for application data and authentication, Razorpay for payment processing, and mapping or address services for location features. Access is limited by staff and partner roles and the details needed for their work."],
      ["Retention and your choices", "Booking, payment, tax and service records may be retained where needed for operations, dispute handling or legal requirements. You can review and update supported profile details in your account. For an access, correction or deletion request, sign in and contact Support; some records may need to be retained for the reasons above."],
      ["Security and updates", "We use technical and organizational measures intended to protect account and service information. No internet service can guarantee absolute security. We may update this policy when the service or its data practices change and will post the current version here."],
    ],
  },
};

export default function LegalPage() {
  const { pathname } = useLocation();
  const type = pathname === "/privacy" ? "privacy" : "terms";
  const page = legalCopy[type];
  return <main className="min-h-screen bg-[#f4f6f5] px-5 py-8 sm:px-8 sm:py-12">
    <article className="mx-auto max-w-3xl border border-slate-300 bg-[#fbfcfb] px-6 py-8 sm:px-10 sm:py-10">
      <Link to="/" className="text-sm font-semibold text-green-900 underline">WashNow home</Link>
      <p className="mt-8 text-xs font-bold uppercase tracking-[0.14em] text-green-800">WashNow · Doorstep Car Wash</p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">{page.title}</h1>
      <p className="mt-4 text-sm leading-7 text-slate-600">Last updated 28 October 2026. {page.intro}</p>
      <div className="mt-8 divide-y divide-slate-200 border-y border-slate-200">
        {page.sections.map(([title, text], index) => <section key={title} className="py-5">
          <h2 className="text-base font-bold text-slate-900">{index + 1}. {title}</h2>
          <p className="mt-2 text-sm leading-7 text-slate-600">{text}</p>
        </section>)}
      </div>
      <nav aria-label="Legal documents" className="mt-7 flex gap-5 text-sm font-semibold text-green-900">
        <Link to="/terms" className="underline">Terms of Service</Link><Link to="/privacy" className="underline">Privacy Policy</Link>
      </nav>
    </article>
  </main>;
}
