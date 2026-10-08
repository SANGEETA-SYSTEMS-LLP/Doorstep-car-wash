import { Link } from "react-router-dom";
import { Car, Menu } from "lucide-react";

function Navbar() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-5 lg:px-8">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
            <Car size={22} />
          </div>

          <div>
            <p className="text-xl font-bold text-slate-900">
              WashNow
            </p>
            <p className="text-xs text-slate-500">
              Doorstep Car Care
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <Link to="/" className="text-sm font-medium text-slate-600">
            Home
          </Link>

          <a href="#services" className="text-sm font-medium text-slate-600">
            Services
          </a>

          <a href="#how-it-works" className="text-sm font-medium text-slate-600">
            How it works
          </a>

          <Link
            to="/login"
            className="text-sm font-semibold text-slate-700"
          >
            Login
          </Link>

          <Link
            to="/register"
            className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Book a Wash
          </Link>
        </nav>

        <button className="md:hidden">
          <Menu />
        </button>
      </div>
    </header>
  );
}

export default Navbar;