import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import ShowPageMap from "../../components/ShowPageMap";
import { applyValidation } from "../../utils/ValidateForms";
import "../../styles/stars.css";

export default function ShowCafe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cafe, setCafe] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /* ===============================
        LOAD DATA
  =============================== */
  useEffect(() => {
    fetch(`/api/cafes/${id}`, { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch cafe");
        return res.json();
      })
      .then((data) => {
        setCafe(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  useEffect(() => {
    fetch(`/api/current-user`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => setCurrentUser(data.user))
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    if (cafe) applyValidation();
  }, [cafe]);

  if (loading) {
    return (
      <div className="container-custom flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-gray-600">Loading cafe...</p>
        </div>
      </div>
    );
  }

  if (error || !cafe) {
    return (
      <div className="container-custom py-10">
        <div className="alert alert-error animate-fade-in">
          <p className="font-bold">Error</p>
          <p>{error || "Cafe Not Found"}</p>
          <Link to="/cafes" className="text-amber-700 font-semibold hover:underline mt-2 inline-block">
            Back to Cafes
          </Link>
        </div>
      </div>
    );
  }

  /* ===============================
        DELETE CAFE
  =============================== */
  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this cafe?")) return;
    const res = await fetch(`/api/cafes/${id}`, { method: "DELETE", credentials: "include" });
    if (res.ok) navigate("/cafes");
    else alert("Delete failed");
  }

  /* ===============================
        SUBMIT REVIEW
  =============================== */
  async function handleReviewSubmit(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const review = {
      rating: formData.get("review[rating]"),
      body: formData.get("review[body]"),
    };

    const res = await fetch(`/api/cafes/${id}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ review }),
    });

    if (res.ok) {
      const updated = await res.json();
      setCafe(updated);
      e.target.reset();
    } else {
      alert("Review submission failed");
    }
  }

  /* ===============================
        DELETE REVIEW
  =============================== */
  async function deleteReview(reviewId) {
    const res = await fetch(`/api/cafes/${id}/reviews/${reviewId}`, {
      method: "DELETE",
      credentials: "include",
    });

    if (res.ok) {
      setCafe((prev) => ({
        ...prev,
        reviews: prev.reviews.filter((r) => r._id !== reviewId),
      }));
    } else {
      alert("Failed to delete review");
    }
  }

  /* ===============================
        RENDER UI
  =============================== */
  return (
    <div className="container-custom py-8 space-y-8 animate-fade-in">

      {/* Back Button */}
      <Link to="/cafes" className="text-amber-700 hover:underline font-semibold">
        ← Back to All Cafes
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

        {/* ==============================
              LEFT COLUMN (IMAGES + INFO)
        =============================== */}
        <div className="space-y-6">

          {/* Images */}
          <div className="card p-0 overflow-hidden h-80 relative">

            {cafe.images?.length > 0 ? (
              <div className="w-full h-full relative">
                {cafe.images.map((img, i) => (
                  <img
                    key={i}
                    src={img.url}
                    alt=""
                    className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
                      i === 0 ? "opacity-100" : "opacity-0"
                    }`}
                  />
                ))}
              </div>
            ) : (
              <img
                src="https://res.cloudinary.com/douqbebwk/image/upload/v1600103881/YelpCamp/lz8jjv2gyynjil7lswf4.png"
                className="w-full h-full object-cover"
              />
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
          </div>

          {/* Info */}
          <div className="card p-8 space-y-4">
            <h2 className="text-4xl font-bold text-gray-900">{cafe.title}</h2>
            <p className="text-gray-700">{cafe.description}</p>

            <div className="space-y-3 text-gray-700 pt-3 border-t border-gray-200">

              <p className="flex items-center gap-2">
                <span className="text-amber-600 text-xl">📍</span>
                <strong>Location:</strong> {cafe.location}
              </p>

              <p className="flex items-center gap-2">
                <span className="text-amber-600 text-xl">👤</span>
                <strong>Author:</strong> {cafe.author?.username || "Unknown"}
              </p>

              {cafe.price && (
                <p className="flex items-center gap-2">
                  <span className="text-amber-600 text-xl">💲</span>
                  <strong>Price:</strong> ${cafe.price}
                </p>
              )}

            </div>

            {currentUser?._id === cafe.author?._id && (
              <div className="grid grid-cols-2 gap-4 pt-4">
                <Link to={`/cafes/${id}/edit`} className="btn btn-secondary text-center">
                  Edit Cafe
                </Link>
                <button onClick={handleDelete} className="btn btn-danger">
                  Delete Cafe
                </button>
              </div>
            )}
          </div>

        </div>

        {/* ==============================
              RIGHT COLUMN (MAP + REVIEWS)
        =============================== */}
        <div className="space-y-6">

          {/* Map */}
          <div className="map-container">
            <ShowPageMap cafe={cafe} />
          </div>

          {/* Review Form */}
          {currentUser && (
            <form
              className="card p-6 validated-form space-y-4"
              onSubmit={handleReviewSubmit}
              noValidate
            >
              <h3 className="text-2xl font-bold text-gray-800">Leave a Review</h3>

              {/* Star Rating */}
              <div className="star-rating flex gap-1">
                {[5, 4, 3, 2, 1].map((n) => (
                  <label key={n}>
                    <input type="radio" name="review[rating]" value={n} required />
                    ★
                  </label>
                ))}
              </div>

              <textarea
                name="review[body]"
                rows="4"
                className="textarea"
                placeholder="Write your review..."
                required
              ></textarea>

              <button className="btn btn-success w-full">Submit Review</button>
            </form>
          )}

          {/* Review List */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-gray-900">Reviews</h3>

            {cafe.reviews?.length > 0 ? (
              cafe.reviews.map((review) => (
                <div key={review._id} className="card-minimal p-4 space-y-2">

                  <div className="flex justify-between items-center">
                    <h4 className="font-bold">{review.author?.username || "Anonymous"}</h4>

                    <span className="text-yellow-400 text-lg">
                      {"★".repeat(review.rating)}
                      <span className="text-gray-300">
                        {"★".repeat(5 - review.rating)}
                      </span>
                    </span>
                  </div>

                  <p className="text-gray-700">{review.body}</p>

                  {currentUser?._id === review.author?._id && (
                    <button
                      onClick={() => deleteReview(review._id)}
                      className="btn btn-danger text-sm"
                    >
                      Delete Review
                    </button>
                  )}
                </div>
              ))
            ) : (
              <p className="text-gray-600 text-center py-8">No reviews yet.</p>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
