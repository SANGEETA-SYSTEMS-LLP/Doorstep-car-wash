
function WalletButton({ name }) {
  return (
    <button
      type="button"
      className="rounded-xl border border-slate-200 p-4 text-sm font-semibold transition hover:border-green-500 hover:bg-green-50"
    >
      {name}
    </button>
  );
}

export default WalletButton;
