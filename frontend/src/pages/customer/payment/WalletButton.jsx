
function WalletButton({ name }) {
  return (
    <button
      type="button"
      className="rounded-xl border border-slate-200 p-4 text-sm font-semibold transition hover:border-blue-500 hover:bg-blue-50"
    >
      {name}
    </button>
  );
}

export default WalletButton;
