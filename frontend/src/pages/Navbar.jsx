import { NavLink, Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

export default function Navbar() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // ✅ 获取当前用户
  useEffect(() => {
    fetch("/api/current-user", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        setUser(data.user);
        setLoading(false);
      })
      .catch(() => {
        setUser(null);
        setLoading(false);
      });
  }, []);

  async function handleLogout() {
    try {
      await fetch("/api/logout", { method: "POST", credentials: "include" });
      setUser(null);
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }

  return (
    <nav className="fixed top-0 left-0 w-full z-50 backdrop-blur-md bg-white/70 shadow-lg border-b border-white/20">
      <div className="container-custom">
        <div className="flex items-center justify-between h-20">
          {/* ===============================
              ✅ 左侧 Logo
          =============================== */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
              <span className="text-white text-xl">☕</span>
            </div>
            <span className="text-2xl font-bold text-gradient tracking-wide">
              SipSpot
            </span>
          </Link>

          {/* ===============================
              ✅ 中间导航项 (桌面版)
          =============================== */}
          <div className="hidden md:flex items-center gap-2">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `nav-link ${isActive ? "active" : ""}`
              }
            >
              Home
            </NavLink>
            <NavLink
              to="/cafes"
              className={({ isActive }) =>
                `nav-link ${isActive ? "active" : ""}`
              }
            >
              Explore
            </NavLink>
            {user && (
              <NavLink
                to="/cafes/new"
                className={({ isActive }) =>
                  `nav-link ${isActive ? "active" : ""}`
                }
              >
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Cafe
                </span>
              </NavLink>
            )}
          </div>

          {/* ===============================
              ✅ 右侧用户区域
          =============================== */}
          <div className="flex items-center gap-3">
            {loading ? (
              <div className="w-20 h-8 bg-gray-200/50 rounded-lg animate-pulse"></div>
            ) : !user ? (
              /* ✅ 未登录状态 */
              <>
                <NavLink
                  to="/login"
                  className="hidden sm:block px-4 py-2 font-semibold text-gray-700 rounded-lg transition-all duration-300 hover:bg-white/50"
                >
                  Login
                </NavLink>
                <NavLink
                  to="/register"
                  className="btn btn-primary text-sm"
                >
                  Sign Up
                </NavLink>
              </>
            ) : (
              /* ✅ 已登录状态 */
              <div className="flex items-center gap-3">
                {/* 用户头像 + 名字 */}
                <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white/50 backdrop-blur-sm rounded-xl shadow-sm border border-white/30">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-semibold text-gray-700">
                    {user.username}
                  </span>
                </div>

                {/* Logout 按钮 */}
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-all duration-300 shadow-sm hover:shadow-md"
                >
                  Logout
                </button>
              </div>
            )}

            {/* ===============================
                ✅ 移动端菜单按钮
            =============================== */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-white/50 transition-colors"
            >
              <svg
                className="w-6 h-6 text-gray-700"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {mobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* ===============================
            ✅ 移动端菜单
        =============================== */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4 animate-fade-in">
            <div className="flex flex-col gap-2 bg-white/50 backdrop-blur-sm rounded-xl p-4 shadow-lg">
              <NavLink
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `px-4 py-2 rounded-lg font-semibold transition-all ${
                    isActive
                      ? "bg-gradient-to-r from-amber-400 to-orange-400 text-white"
                      : "text-gray-700 hover:bg-white/50"
                  }`
                }
              >
                Home
              </NavLink>
              <NavLink
                to="/cafes"
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `px-4 py-2 rounded-lg font-semibold transition-all ${
                    isActive
                      ? "bg-gradient-to-r from-amber-400 to-orange-400 text-white"
                      : "text-gray-700 hover:bg-white/50"
                  }`
                }
              >
                Explore
              </NavLink>
              {user && (
                <NavLink
                  to="/cafes/new"
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `px-4 py-2 rounded-lg font-semibold transition-all ${
                      isActive
                        ? "bg-gradient-to-r from-amber-400 to-orange-400 text-white"
                        : "text-gray-700 hover:bg-white/50"
                    }`
                  }
                >
                  Add Cafe
                </NavLink>
              )}
              
              {!user && (
                <>
                  <div className="border-t border-gray-200 my-2"></div>
                  <NavLink
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-2 rounded-lg font-semibold text-gray-700 hover:bg-white/50 transition-all"
                  >
                    Login
                  </NavLink>
                  <NavLink
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-2 rounded-lg font-semibold text-white bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 transition-all text-center"
                  >
                    Sign Up
                  </NavLink>
                </>
              )}
              
              {user && (
                <>
                  <div className="border-t border-gray-200 my-2"></div>
                  <div className="px-4 py-2 text-sm text-gray-600">
                    Signed in as <span className="font-semibold">{user.username}</span>
                  </div>
                  <button
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="px-4 py-2 rounded-lg font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition-all"
                  >
                    Logout
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}