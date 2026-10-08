import { useState } from "react";
import CustomerProfileContent from "./CustomerProfileContent";

function CustomerProfile() {
  const [saved, setSaved] = useState(false);

  const [profile, setProfile] = useState({
    fullName: "Gayatri Panda",
    email: "gayatri@example.com",
    phone: "+91 98765 43210",
  });

  const handleChange = (e) => {
    setProfile({
      ...profile,
      [e.target.name]: e.target.value,
    });
  };

  const saveProfile = (e) => {
    e.preventDefault();

    console.log(profile);
    setSaved(true);

    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <CustomerProfileContent saved={saved} profile={profile} handleChange={handleChange} saveProfile={saveProfile} />
  );
}

export default CustomerProfile;
