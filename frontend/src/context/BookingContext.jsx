import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

const BookingContext = createContext(null);

const initialBooking = {
  location: null,
  society: null,

  address: {
    tower: "",
    flatNumber: "",
    landmark: "",
  },

  vehicle: null,
  package: null,

  schedule: {
    date: null,
    time: null,
  },

  paymentMethod: null,

  databaseBookingId: null,

  bookingId: null,

  washer: null,

  status: "draft",
};

export function BookingProvider({ children }) {
  const [booking, setBooking] = useState(() => {
    try {
      const savedBooking =
        localStorage.getItem("carWashBooking");

      return savedBooking
        ? JSON.parse(savedBooking)
        : initialBooking;
    } catch (error) {
      console.error(
        "Unable to load booking:",
        error
      );

      return initialBooking;
    }
  });

  useEffect(() => {
    try {
      if (booking === initialBooking) {
        localStorage.removeItem("carWashBooking");
        return;
      }

      localStorage.setItem(
        "carWashBooking",
        JSON.stringify(booking)
      );
    } catch (error) {
      console.error(
        "Unable to save booking:",
        error
      );
    }
  }, [booking]);

  const updateBooking = (data) => {
    setBooking((previous) => ({
      ...previous,
      ...data,
    }));
  };

  const updateAddress = (data) => {
    setBooking((previous) => ({
      ...previous,

      address: {
        ...previous.address,
        ...data,
      },
    }));
  };

  const updateSchedule = (data) => {
    setBooking((previous) => ({
      ...previous,

      schedule: {
        ...previous.schedule,
        ...data,
      },
    }));
  };

  const setWasher = (washer) => {
    setBooking((previous) => ({
      ...previous,
      washer,
    }));
  };

  const updateStatus = (status) => {
    setBooking((previous) => ({
      ...previous,
      status,
    }));
  };

  const resetBooking = () => {
    setBooking(initialBooking);

    localStorage.removeItem(
      "carWashBooking"
    );
  };

  return (
    <BookingContext.Provider
      value={{
        booking,
        updateBooking,
        updateAddress,
        updateSchedule,
        setWasher,
        updateStatus,
        resetBooking,
      }}
    >
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking() {
  const context =
    useContext(BookingContext);

  if (!context) {
    throw new Error(
      "useBooking must be used inside BookingProvider"
    );
  }

  return context;
}

export default BookingContext;