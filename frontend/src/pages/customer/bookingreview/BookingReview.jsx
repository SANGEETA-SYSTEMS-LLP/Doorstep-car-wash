import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import BookingSteps from "../../../components/booking/BookingSteps";
import BookingReviewContent from "./BookingReviewContent";
import usePaymentWorkflow from "../payment/usePaymentWorkflow";
import { useBooking } from "../../../context/BookingContext";
import { validateCustomerOffer } from "../../../services/customer/customerOfferService";
import { getCheckoutPriceBreakdown } from "../../../services/payments/checkoutPricing";

function BookingReview() {
  const { booking, paymentError, processing, handlePayment } = usePaymentWorkflow();
  const { updateBooking } = useBooking();
  const [offerCode, setOfferCode] = useState(booking.promoCode || "");
  const [offerError, setOfferError] = useState("");
  const [offerBusy, setOfferBusy] = useState(false);
  const servicePrice = booking.package?.price || 0;
  const offerDiscount = Number(booking.appliedOffer?.discountAmount || 0);
  const { platformFee, discountAmount: discount, automaticDiscountAmount, offerDiscountAmount, taxAmount, totalAmount: total } = getCheckoutPriceBreakdown(servicePrice, offerDiscount);

  const navigate = useNavigate();

  async function applyOffer(event) {
    event.preventDefault();
    setOfferError("");
    if (!booking.vehicle?.id || !booking.package?.id || !booking.schedule?.date?.iso) {
      setOfferError("Choose your vehicle, package, and service date before applying an offer.");
      return;
    }
    setOfferBusy(true);
    try {
      const offer = await validateCustomerOffer({
        code: offerCode,
        vehicleId: booking.vehicle.id,
        packageId: booking.package.id,
        scheduledDate: booking.schedule.date.iso,
      });
      updateBooking({
        promoCode: offer.code,
        appliedOffer: { code: offer.code, title: offer.title, discountAmount: Number(offer.discount_amount) },
      });
      setOfferCode(offer.code);
    } catch (error) {
      updateBooking({ promoCode: null, appliedOffer: null });
      setOfferError(error.message || "This offer could not be applied.");
    } finally {
      setOfferBusy(false);
    }
  }

  function removeOffer() {
    setOfferCode("");
    setOfferError("");
    updateBooking({ promoCode: null, appliedOffer: null });
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <BookingSteps currentStep={5} />

      <div className="mx-auto max-w-6xl p-6 lg:p-8">
        <button
          onClick={() =>
            navigate("/customer/select-schedule")
          }
          className="flex items-center gap-2 text-sm font-semibold text-slate-500"
        >
          <ArrowLeft size={17} />
          Back
        </button>

        <div className="mt-7">
          <p className="font-semibold text-green-600">
            REVIEW BOOKING
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            Everything look good?
          </h1>

          <p className="mt-2 text-slate-500">
            Review your service information before continuing to
            payment.
          </p>
        </div>

        <BookingReviewContent
          booking={booking}
          servicePrice={servicePrice}
          platformFee={platformFee}
          discount={discount}
          automaticDiscountAmount={automaticDiscountAmount}
          offerDiscountAmount={offerDiscountAmount}
          offerDiscount={offerDiscount}
          appliedOffer={booking.appliedOffer}
          offerCode={offerCode}
          offerError={offerError}
          offerBusy={offerBusy}
          onOfferCodeChange={setOfferCode}
          onApplyOffer={applyOffer}
          onRemoveOffer={removeOffer}
          total={total}
          taxAmount={taxAmount}
          paymentError={paymentError}
          processing={processing}
          onContinue={handlePayment}
          navigate={navigate}
        />
      </div>
    </div>
  );
}

export default BookingReview;
