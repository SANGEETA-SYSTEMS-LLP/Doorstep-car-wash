import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import BookingSteps from "../../../components/booking/BookingSteps";
import { useBooking } from "../../../context/BookingContext";
import SelectLocationContent from "./SelectLocationContent";

function SelectLocation() {
  const { updateBooking, updateAddress } = useBooking();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");

  const [selectedLocation, setSelectedLocation] = useState({
    name: "Green Valley Apartment",
    address: "Madhapur, Hyderabad, Telangana",
    type: "Society",
  });

  const [tower, setTower] = useState("");
  const [flatNumber, setFlatNumber] = useState("");
  const [landmark, setLandmark] = useState("");

  const handleContinue = () => {
    updateBooking({
      location: {
        name: selectedLocation.name,
        address: selectedLocation.address,
        type: selectedLocation.type,

        // Temporary mock coordinates.
        // Google Maps will provide these later.
        latitude: 17.4483,
        longitude: 78.3915,
      },
      society: {
        id: 1,
        name: selectedLocation.name,
      },
    });

    updateAddress({
      tower,
      flatNumber,
      landmark,
    });

    navigate("/customer/select-vehicle");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <BookingSteps currentStep={1} />

      <div className="mx-auto max-w-7xl p-6 lg:p-8">
        <button
          onClick={() => navigate("/customer")}
          className="mb-6 flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft size={17} />
          Dashboard
        </button>

        <div className="mb-7">
          <p className="font-semibold text-blue-600">
            BOOK A WASH
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            Where should we come?
          </h1>

          <p className="mt-2 text-slate-500">
            Search for your home, office, society or apartment.
          </p>
        </div>

        <SelectLocationContent search={search} setSearch={setSearch} selectedLocation={selectedLocation} tower={tower} setTower={setTower} flatNumber={flatNumber} setFlatNumber={setFlatNumber} landmark={landmark} setLandmark={setLandmark} handleContinue={handleContinue} />
      </div>
    </div>
  );
}

export default SelectLocation;
