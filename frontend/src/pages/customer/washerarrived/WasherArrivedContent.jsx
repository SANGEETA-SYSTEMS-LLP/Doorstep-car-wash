import WasherArrivalIntro from "./WasherArrivalIntro";
import WasherArrivalProfile from "./WasherArrivalProfile";
import WasherArrivalBookingDetails from "./WasherArrivalBookingDetails";
import ArrivalConfirmationPanel from "./ArrivalConfirmationPanel";

function WasherArrivedContent({ booking, washer, onContinue }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-green-600">
              Booking {booking.bookingId || ""}
            </p>
            <h1 className="mt-1 text-xl font-bold">Washer Arrived</h1>
          </div>
          <div className="rounded-full bg-green-50 px-4 py-2 text-sm font-semibold text-green-700">Arrived</div>
        </div>
      </header>
      <main className="mx-auto max-w-4xl p-6 lg:p-8">
        <WasherArrivalIntro washer={washer} />
        <WasherArrivalProfile washer={washer} />
        <WasherArrivalBookingDetails booking={booking} />
        <ArrivalConfirmationPanel onContinue={onContinue} />
      </main>
    </div>
  );
}

export default WasherArrivedContent;
