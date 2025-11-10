import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

export default function HomePage() {
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    fetch("/api/current-user", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => setCurrentUser(data.user))
      .catch(() => setCurrentUser(null));
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="pt-12 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* 使用自定义的 hero-gradient class */}
          <div className="hero-gradient rounded-3xl shadow-2xl p-12 md:p-20 text-center animate-fade-in-up">
            <div className="relative z-10">
              <div className="inline-block mb-6 text-8xl animate-float">☕</div>
              <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 drop-shadow-2xl">
                Welcome to SipSpot
              </h1>
              <p className="text-xl md:text-2xl text-white/95 mb-10 max-w-3xl mx-auto leading-relaxed">
                Discover amazing coffee spots around the world.<br />
                Share your favorites and connect with fellow coffee enthusiasts!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/cafes"
                  className="btn-gradient px-10 py-4 rounded-xl font-bold text-white text-lg inline-flex items-center justify-center space-x-2"
                >
                  <span>🔍</span>
                  <span>Explore Cafes</span>
                </Link>
                {!currentUser && (
                  <Link
                    to="/register"
                    className="btn-glass px-10 py-4 rounded-xl font-bold text-white text-lg inline-flex items-center justify-center space-x-2"
                  >
                    <span>🚀</span>
                    <span>Get Started</span>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-4 text-gradient animate-fade-in-up">
            Why Choose SipSpot?
          </h2>
          <p className="text-center text-gray-600 text-lg mb-16 animate-fade-in-up">
            Everything you need to discover and share amazing coffee experiences
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {/* 使用 card-glass class */}
            <div className="card-glass rounded-2xl p-8 text-center animate-fade-in-up" style={{animationDelay: '0.1s'}}>
              <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-3xl flex items-center justify-center mb-6 mx-auto shadow-lg feature-icon">
                <span className="text-5xl">📍</span>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-800">Discover Nearby</h3>
              <p className="text-gray-600 text-lg leading-relaxed">
                Find the best coffee spots in your area with our interactive map and smart search.
              </p>
            </div>

            <div className="card-glass rounded-2xl p-8 text-center animate-fade-in-up" style={{animationDelay: '0.2s'}}>
              <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-3xl flex items-center justify-center mb-6 mx-auto shadow-lg feature-icon">
                <span className="text-5xl">⭐</span>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-800">Honest Reviews</h3>
              <p className="text-gray-600 text-lg leading-relaxed">
                Read authentic reviews from coffee lovers and share your own experiences.
              </p>
            </div>

            <div className="card-glass rounded-2xl p-8 text-center animate-fade-in-up" style={{animationDelay: '0.3s'}}>
              <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-pink-500 rounded-3xl flex items-center justify-center mb-6 mx-auto shadow-lg feature-icon">
                <span className="text-5xl">👥</span>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-800">Join Community</h3>
              <p className="text-gray-600 text-lg leading-relaxed">
                Connect with passionate coffee enthusiasts and discover hidden gems together.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-r from-amber-400 via-orange-400 to-pink-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-12 text-center text-white">
            <div className="animate-fade-in-up" style={{animationDelay: '0.1s'}}>
              <div className="text-6xl font-bold mb-3 drop-shadow-lg">1,000+</div>
              <div className="text-2xl opacity-90">Coffee Spots</div>
            </div>
            <div className="animate-fade-in-up" style={{animationDelay: '0.2s'}}>
              <div className="text-6xl font-bold mb-3 drop-shadow-lg">5,000+</div>
              <div className="text-2xl opacity-90">Reviews</div>
            </div>
            <div className="animate-fade-in-up" style={{animationDelay: '0.3s'}}>
              <div className="text-6xl font-bold mb-3 drop-shadow-lg">500+</div>
              <div className="text-2xl opacity-90">Active Users</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="card-glass rounded-3xl p-12 md:p-16 text-center shadow-2xl animate-fade-in-up">
            <div className="text-6xl mb-6 animate-float">🎉</div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gradient">
              Ready to Start Your Coffee Journey?
            </h2>
            <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              Join our community of coffee lovers today. It's completely free and takes less than a minute!
            </p>
            {!currentUser ? (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/register"
                  className="btn-gradient px-10 py-4 rounded-xl font-bold text-white text-lg"
                >
                  Sign Up Free
                </Link>
                <Link
                  to="/login"
                  className="px-10 py-4 rounded-xl font-bold text-gray-700 bg-white hover:bg-gray-50 text-lg shadow-lg hover:shadow-xl transition-all"
                >
                  Login
                </Link>
              </div>
            ) : (
              <Link
                to="/cafes/new"
                className="inline-block btn-gradient px-10 py-4 rounded-xl font-bold text-white text-lg"
              >
                Share Your Favorite Cafe
              </Link>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}