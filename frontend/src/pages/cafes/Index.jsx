import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ClusterMap from "../../components/ClusterMap";

export default function Index() {
  const [cafes, setCafes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ✅ 加载咖啡馆数据
  useEffect(() => {
    fetch("/api/cafes", { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch cafes");
        return res.json();
      })
      .then((data) => {
        setCafes(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching cafes:", err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  /* ===============================
      ✅ Loading 状态
  =============================== */
  if (loading) {
    return (
      <div className="container-custom flex items-center justify-center min-h-screen">
        <div className="text-center animate-fade-in">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-gray-600">Loading cafes...</p>
        </div>
      </div>
    );
  }

  /* ===============================
      ✅ Error UI
  =============================== */
  if (error) {
    return (
      <div className="container-custom py-10">
        <div className="alert alert-error animate-fade-in">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  /* ===============================
      ✅ 主页面
  =============================== */
  return (
    <div className="container-custom py-8 space-y-10 animate-fade-in">

      {/* ✅ Cluster Map（现代玻璃态地图容器） */}
      {cafes.length > 0 && (
        <div className="map-container">
          <ClusterMap cafes={cafes} />
        </div>
      )}

      {/* ✅ 标题 + 创建按钮 */}
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold text-gradient">All Cafes</h1>

        <Link to="/cafes/new" className="btn btn-success">
          Add New Cafe
        </Link>
      </div>

      {/* ✅ 空数据 UI */}
      {cafes.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500 text-lg mb-6">No cafes yet.</p>
          <Link to="/cafes/new" className="btn btn-primary">
            Create Your First Cafe
          </Link>
        </div>
      ) : (
        /* ===============================
            ✅ Cafe List
        =============================== */
        <div className="grid-auto-fill">
          {cafes.map((cafe) => (
            <div key={cafe._id} className="card hover-lift">

              {/* ✅ 图片区域：使用 image-gallery 效果 */}
              <div className="image-gallery h-56">
                <img
                  src={
                    cafe.images?.length > 0
                      ? cafe.images[0].url
                      : "https://res.cloudinary.com/douqbebwk/image/upload/v1600103881/YelpCamp/lz8jjv2gyynjil7lswf4.png"
                  }
                  alt={cafe.title}
                />
              </div>

              {/* ✅ 内容区 */}
              <div className="p-6 space-y-3">
                <h2 className="text-2xl font-semibold text-gray-800">
                  {cafe.title}
                </h2>

                <p className="text-gray-600 line-clamp-2">
                  {cafe.description}
                </p>

                {/* ✅ Location */}
                <p className="text-gray-700 font-medium flex items-center gap-1">
                  <svg className="w-5 h-5 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {cafe.location}
                </p>

                {/* ✅ Price */}
                {cafe.price && (
                  <p className="text-gray-800 font-semibold">
                    ${cafe.price}
                  </p>
                )}

                <div className="pt-2">
                  <Link
                    to={`/cafes/${cafe._id}`}
                    className="btn btn-primary w-full"
                  >
                    View Details
                  </Link>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}
