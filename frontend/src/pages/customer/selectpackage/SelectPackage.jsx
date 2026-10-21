import { validateBookingPackage } from "../../../services/validateBookingPackage";
import { isPackageForVehicle } from "../../../utils/packageCompatibility";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBooking } from "../../../context/BookingContext";
import { getMonthlyWashPackages, getOneTimeWashPackages } from "../../../services/packageService";
import SelectPackageContent from "./SelectPackageContent";

function SelectPackage() {
  const { booking, updateBooking } = useBooking();
  const navigate = useNavigate();
  const [packages, setPackages] = useState([]);
  const [monthlyPackages, setMonthlyPackages] = useState([]);
  const [monthlyLoading, setMonthlyLoading] = useState(true);
  const [monthlyError, setMonthlyError] = useState("");
  const [checking, setChecking] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(booking.package?.id || "");

  useEffect(() => {
    let cancelled = false;

    const loadPackages = async () => {
      try {
        setLoading(true);
        setError("");

        if (!booking.vehicle?.type) { setPackages([]); setError("Select a vehicle before choosing a package."); return; }
        const [data, monthlyData] = await Promise.all([
          getOneTimeWashPackages(booking.vehicle.id),
          getMonthlyWashPackages(booking.vehicle.id).catch(monthlyFailure => {
            if (!cancelled) setMonthlyError(monthlyFailure.message || "Unable to load monthly plans.");
            return [];
          }),
        ]);

        if (cancelled) return;

        setPackages(data ?? []);
        setMonthlyPackages(monthlyData ?? []);
        setSelected((previous) =>
          (data ?? []).some((pkg) => pkg.id === previous)
            ? previous
            : data?.[0]?.id || ""
        );
      } catch (error) {
        console.error(error);
        if (!cancelled) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "An unexpected error occurred.";
          const errorCode =
            error && typeof error === "object" && "code" in error
              ? ` (${error.code})`
              : "";

          setError(
            `Unable to load service packages: ${errorMessage}${errorCode}`
          );
        }
      } finally {
        if (!cancelled) { setLoading(false); setMonthlyLoading(false); }
      }
    };

    loadPackages();
    return () => { cancelled = true; };
  }, [booking.vehicle?.type, booking.vehicle?.id]);

  const continueWithPackage = async selectedPackage => {
    if (loading || checking) return;

    if (!selectedPackage || !isPackageForVehicle(selectedPackage, booking.vehicle)) {
      setError("Please select an active package for your vehicle type.");
      return;
    }

    setError("");
    setChecking(true);
    try {
      selectedPackage = await validateBookingPackage(selectedPackage.id, booking.vehicle.id);
    } catch (err) { setError(err.message); setChecking(false); return; }
    setChecking(false);

    updateBooking({
      databaseBookingId: null, bookingId: null,
      package: {
        id: selectedPackage.id,
        name: selectedPackage.name,
        description: selectedPackage.description,
        price: Number(selectedPackage.price),
        duration: selectedPackage.duration_minutes,
        vehicleType: selectedPackage.vehicle_type,
        washCount: Number(selectedPackage.plan_washes || 0) || null,
        billingPeriod: selectedPackage.plan_washes ? "monthly" : null,
      },
    });

    navigate("/customer/select-schedule");
  };

  const handleContinue = () => continueWithPackage(packages.find(pkg => pkg.id === selected));

  return (
    <SelectPackageContent booking={booking} packages={packages} monthlyPackages={monthlyPackages} monthlyLoading={monthlyLoading} monthlyError={monthlyError} loading={loading} checking={checking} error={error} navigate={navigate} selected={selected} setSelected={setSelected} handleContinue={handleContinue} handleMonthlyContinue={continueWithPackage} />
  );
}

export default SelectPackage;
