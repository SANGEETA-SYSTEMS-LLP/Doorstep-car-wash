

function CardPaymentForm() {
  return (
    <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
                <h3 className="font-bold">
                  Card Details
                </h3>

                <div className="mt-5 space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-semibold">
                      Card Number
                    </label>

                    <input
                      placeholder="1234 5678 9012 3456"
                      className="w-full rounded-xl border border-slate-300 px-4 py-3.5 outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold">
                      Name on Card
                    </label>

                    <input
                      placeholder="Enter card holder name"
                      className="w-full rounded-xl border border-slate-300 px-4 py-3.5 outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-2 block text-sm font-semibold">
                        Expiry
                      </label>

                      <input
                        placeholder="MM/YY"
                        className="w-full rounded-xl border border-slate-300 px-4 py-3.5 outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold">
                        CVV
                      </label>

                      <input
                        type="password"
                        maxLength={4}
                        placeholder="•••"
                        className="w-full rounded-xl border border-slate-300 px-4 py-3.5 outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
  );
}

export default CardPaymentForm;
