import { useState } from "react";
import SupportContent from "./SupportContent";

function Support() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <SupportContent submitted={submitted} setSubmitted={setSubmitted} handleSubmit={handleSubmit} />
  );
}

export default Support;
