import {
  BadgeCheck,
  Banknote,
  BriefcaseBusiness,
  FileCheck2,
  Mail,
  MapPin,
  Phone,
  Star,
  UserRound,
} from "lucide-react";

function WasherProfile() {
  return (
    <div className="p-5 lg:p-8">
      <div className="mx-auto max-w-6xl">
        <p className="text-sm font-bold uppercase tracking-wider text-blue-600">
          Account
        </p>

        <h1 className="mt-2 text-3xl font-bold">
          Washer Profile
        </h1>

        <div className="mt-8 grid gap-6 lg:grid-cols-[0.7fr_1.3fr]">
          <aside>
            <div className="rounded-3xl border border-slate-200 bg-white p-7 text-center">
              <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                <UserRound size={50} />
              </div>

              <h2 className="mt-5 text-2xl font-bold">
                Rahul Kumar
              </h2>

              <div className="mt-2 flex items-center justify-center gap-1 text-green-600">
                <BadgeCheck size={17} />
                <span className="text-sm font-semibold">
                  Verified Partner
                </span>
              </div>

              <div className="mt-6 grid grid-cols-2 divide-x">
                <div>
                  <div className="flex items-center justify-center gap-1">
                    <Star
                      size={15}
                      className="fill-amber-400 text-amber-400"
                    />
                    <p className="font-bold">
                      4.8
                    </p>
                  </div>

                  <p className="mt-1 text-xs text-slate-400">
                    Rating
                  </p>
                </div>

                <div>
                  <p className="font-bold">
                    326
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    Services
                  </p>
                </div>
              </div>
            </div>
          </aside>

          <div className="space-y-6">
            <ProfileCard title="Personal Information">
              <Info
                icon={<UserRound />}
                label="Full Name"
                value="Rahul Kumar"
              />

              <Info
                icon={<Phone />}
                label="Mobile"
                value="+91 98765 43210"
              />

              <Info
                icon={<Mail />}
                label="Email"
                value="rahul@example.com"
              />

              <Info
                icon={<MapPin />}
                label="Service Area"
                value="Madhapur Zone • 5 km"
              />
            </ProfileCard>

            <ProfileCard title="Professional Details">
              <Info
                icon={<BriefcaseBusiness />}
                label="Washer ID"
                value="WSH-1001"
              />

              <Info
                icon={<FileCheck2 />}
                label="KYC Status"
                value="Verified"
              />

              <Info
                icon={<BadgeCheck />}
                label="Skills"
                value="Basic Wash, Premium Wash, Detailing"
              />
            </ProfileCard>

            <ProfileCard title="Settlement Account">
              <Info
                icon={<Banknote />}
                label="Bank Account"
                value="•••• •••• 4582"
              />

              <Info
                icon={<Banknote />}
                label="UPI"
                value="rahul@upi"
              />
            </ProfileCard>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileCard({
  title,
  children,
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6">
      <h2 className="font-bold">
        {title}
      </h2>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        {children}
      </div>
    </section>
  );
}

function Info({
  icon,
  label,
  value,
}) {
  return (
    <div className="flex gap-3">
      <div className="text-blue-600">
        {icon}
      </div>

      <div>
        <p className="text-xs text-slate-400">
          {label}
        </p>

        <p className="mt-1 text-sm font-semibold">
          {value}
        </p>
      </div>
    </div>
  );
}

export default WasherProfile;