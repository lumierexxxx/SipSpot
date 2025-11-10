import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { applyValidation } from "../utils/ValidateForms";

export default function Login() {
  const navigate = useNavigate();

  // ✅ 启用表单验证
  useEffect(() => {
    applyValidation();
  }, []);

  // ✅ 登录提交
  async function handleSubmit(e) {
    e.preventDefault();
    const form = new FormData(e.target);

    const res = await fetch("/api/login", {
      method: "POST",
      body: form,
      credentials: "include", // 登录写 session 必须带
    });

    if (res.ok) {
      navigate("/cafes"); // 登录成功跳转
    } else {
      alert("Login failed");
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1571863533956-01c88e79957e?ixlib=rb-1.2.1&auto=format&fit=crop&w=1267&q=80"
            alt="Cafe"
            className="w-full h-48 object-cover"
          />
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>

            <form
              className="validated-form space-y-4"
              noValidate
              onSubmit={handleSubmit}
            >
              {/* Username */}
              <div>
                <label htmlFor="username" className="block mb-1 font-medium">
                  Username
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  autoFocus
                  required
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <div className="valid-feedback text-green-600 mt-1">
                  Looks good!
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block mb-1 font-medium">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  required
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <div className="valid-feedback text-green-600 mt-1">
                  Looks good!
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded transition"
              >
                Login
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
