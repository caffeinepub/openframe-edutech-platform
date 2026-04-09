import { GraduationCap, LogIn, Users } from "lucide-react";
import { useTL } from "../../context/TLContext";

const TL_DEMO_ACCOUNTS = [
  {
    tlId: "TL001",
    name: "Amit Kumar",
    code: "TL001",
    teamSize: 2,
    role: "Senior Team Leader",
    avatar: "AK",
    color: "bg-blue-500",
  },
  {
    tlId: "TL002",
    name: "Priya Singh",
    code: "TL002",
    teamSize: 1,
    role: "Team Leader",
    avatar: "PS",
    color: "bg-purple-500",
  },
];

export function TLLogin() {
  const { login } = useTL();

  const handleLogin = (tlId: string) => {
    login(tlId);
    window.location.href = "/tl/dashboard";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 teal-gradient rounded-2xl mb-4 shadow-lg">
            <GraduationCap className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">OpenFrame EduTech</h1>
          <p className="text-slate-400 text-sm mt-1">Team Leader Portal</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Team Leader Login
              </h2>
              <p className="text-xs text-gray-500">Select your demo account</p>
            </div>
          </div>

          <div className="space-y-3">
            {TL_DEMO_ACCOUNTS.map((account) => (
              <button
                key={account.tlId}
                type="button"
                onClick={() => handleLogin(account.tlId)}
                data-ocid={`tl.login.${account.tlId.toLowerCase()}`}
                className="w-full flex items-center gap-4 p-4 border-2 border-gray-100 rounded-xl hover:border-blue-200 hover:bg-blue-50 transition-all group text-left"
              >
                <div
                  className={`w-10 h-10 ${account.color} rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}
                >
                  {account.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm">
                    {account.name}
                  </p>
                  <p className="text-xs text-gray-500">{account.role}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-700">
                      {account.code}
                    </span>
                    <span className="text-xs text-gray-400">
                      {account.teamSize} FE{account.teamSize !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
                <LogIn className="h-4 w-4 text-gray-300 group-hover:text-blue-500 transition-colors flex-shrink-0" />
              </button>
            ))}
          </div>

          <p className="text-center text-xs text-gray-400 mt-5 pt-4 border-t border-gray-100">
            Demo accounts for testing. Internet Identity login coming soon.
          </p>
        </div>

        <p className="text-center text-xs text-slate-500 mt-4">
          <a href="/" className="hover:text-slate-300 transition-colors">
            ← Back to Home
          </a>
        </p>
      </div>
    </div>
  );
}

export default TLLogin;
