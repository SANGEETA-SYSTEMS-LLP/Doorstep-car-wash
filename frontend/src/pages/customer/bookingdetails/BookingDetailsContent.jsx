import { ArrowLeft, CalendarDays, Car, Check, Clock3, Download, MapPin, ReceiptText, Star, UserRound } from "lucide-react";
import Card from "./Card";
import Info from "./Info";
import Price from "./Price";
import { timeline } from "./data";

function BookingDetailsContent({ navigate, bookingId }) {
  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-8">
      <div className="mx-auto max-w-6xl">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm font-semibold text-slate-500"
        >
          <ArrowLeft size={17} />
          Back
        </button>

        <div className="mt-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="font-semibold text-blue-600">
              {bookingId || "CW-2026-1028"}
            </p>

            <h1 className="mt-1 text-3xl font-bold">
              Booking Details
            </h1>
          </div>

          <span className="w-fit rounded-full bg-green-50 px-4 py-2 text-sm font-bold text-green-700">
            Completed
          </span>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="space-y-5">
            <Card title="Service Information">
              <Info
                icon={<Car />}
                label="Vehicle"
                value="Hyundai Creta • SUV"
              />

              <Info
                icon={<ReceiptText />}
                label="Service"
                value="Premium Wash"
              />

              <Info
                icon={<CalendarDays />}
                label="Date"
                value="08 October 2026"
              />

              <Info
                icon={<Clock3 />}
                label="Time"
                value="10:30 AM"
              />
            </Card>

            <Card title="Service Location">
              <div className="flex gap-3">
                <MapPin className="shrink-0 text-blue-600" />

                <div>
                  <p className="font-bold">
                    Green Valley Apartment
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Tower B, Flat 502
                  </p>

                  <p className="text-sm text-slate-500">
                    Madhapur, Hyderabad, Telangana
                  </p>
                </div>
              </div>
            </Card>

            <Card title="Assigned Washer">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                  <UserRound />
                </div>

                <div>
                  <p className="font-bold">
                    Rahul Kumar
                  </p>

                  <p className="mt-1 flex items-center gap-1 text-sm">
                    <Star
                      size={14}
                      className="fill-amber-400 text-amber-400"
                    />
                    4.8 • 326 services
                  </p>
                </div>
              </div>
            </Card>
          </div>

          <div className="space-y-5">
            <Card title="Booking Timeline">
              <div className="space-y-0">
                {timeline.map((item, index) => (
                  <div
                    key={item}
                    className="flex gap-3"
                  >
                    <div className="flex flex-col items-center">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-green-600 text-white">
                        <Check size={14} />
                      </div>

                      {index !== timeline.length - 1 && (
                        <div className="h-8 w-[2px] bg-green-200" />
                      )}
                    </div>

                    <p className="pt-1 text-sm font-medium">
                      {item}
                    </p>
                  </div>
                ))}
              </div>
            </Card>

            <Card title="Payment Summary">
              <Price label="Premium Wash" value="₹499" />
              <Price label="Platform Fee" value="₹20" />
              <Price label="Discount" value="-₹20" />

              <div className="my-4 border-t border-dashed" />

              <Price label="Total Paid" value="₹499" bold />

              <button className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-blue-200 py-3 font-semibold text-blue-600">
                <Download size={17} />
                Download Invoice
              </button>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BookingDetailsContent;
