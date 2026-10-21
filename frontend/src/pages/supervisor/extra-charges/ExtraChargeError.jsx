function ExtraChargeError({ message }) {
  if (!message) return null;
  return <div className="mt-6 rounded-xl bg-red-50 p-4 text-red-600">{message}</div>;
}

export default ExtraChargeError;
