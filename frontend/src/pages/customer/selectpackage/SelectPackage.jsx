import { validateBookingPackage } from "../../../services/validateBookingPackage";
import { isPackageForVehicle } from "../../../utils/packageCompatibility";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBooking } from "../../../context/BookingContext";
import { supabase } from "../../../services/supabase";
import SelectPackageContent from "./SelectPackageContent";

function SelectPackage() {
  const { booking, updateBooking } = useBooking();
  const navigate = useNavigate();
  const [packages, setPackages] = useState([]);
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
        const { data, error } = await supabase
          .from("service_packages")
          .select("*")
          .eq("is_active", true)
          .eq("vehicle_type", booking.vehicle.type)
          .order("price", { ascending: true });

        if (error) {
          console.error("Package query failed:", {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint,
          });
          if (!cancelled) {
            setError(
              `Unable to load service packages: ${error.message}`
            );
          }
          return;
        }

        if (cancelled) return;

        setPackages(data ?? []);
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
        if (!cancelled) setLoading(false);
      }
    };

    loadPackages();
    return () => { cancelled = true; };
  }, [booking.vehicle?.type]);

  const handleContinue = async () => {
    let selectedPackage = packages.find(
      (pkg) => pkg.id === selected
    );

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
      },
    });

    navigate("/customer/select-schedule");
  };

  return (
    <SelectPackageContent booking={booking} packages={packages} loading={loading} checking={checking} error={error} navigate={navigate} selected={selected} setSelected={setSelected} handleContinue={handleContinue} />
  );
}

export default SelectPackage;
