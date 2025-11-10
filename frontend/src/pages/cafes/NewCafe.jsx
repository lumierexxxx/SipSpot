import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { applyValidation } from "../../utils/ValidateForms";

export default function NewCafe() {
  const navigate = useNavigate();

  useEffect(() => {
    applyValidation();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    const form = new FormData(e.target);

    const res = await fetch("/api/cafes", {
      method: "POST",
      body: form,
    });

    if (res.ok) {
      const data = await res.json();
      navigate(`/cafes/${data._id}`);
    } else {
      alert("Create Cafe Failed");
    }
  }

  return (
    <div className="container-custom py-10">
      <div className="card p-10 animate-fade-in max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold text-gradient text-center mb-10">
          Create New Cafe
        </h1>

        <form
          onSubmit={handleSubmit}
          className="validated-form space-y-8"
          encType="multipart/form-data"
          noValidate
        >
          {/* Title */}
          <div>
            <label className="label" htmlFor="title">
              Title
            </label>
            <input
              className="input"
              type="text"
              id="title"
              name="cafe[title]"
              required
            />
          </div>

          {/* Location */}
          <div>
            <label className="label" htmlFor="location">
              Location
            </label>
            <input
              className="input"
              type="text"
              id="location"
              name="cafe[location]"
              required
            />
          </div>

          {/* Price */}
          <div>
            <label className="label" htmlFor="price">
              Cafe Price
            </label>
            <div className="flex items-center">
              <span className="px-4 py-3 bg-white/60 border border-gray-200 rounded-l-xl">
                $
              </span>
              <input
                type="text"
                className="input rounded-l-none"
                id="price"
                placeholder="0.00"
                name="cafe[price]"
                required
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="label" htmlFor="description">
              Description
            </label>
            <textarea
              className="textarea"
              id="description"
              name="cafe[description]"
              rows="4"
              required
            ></textarea>
          </div>

          {/* Upload Image(s) */}
          <div>
            <label className="label" htmlFor="image">
              Upload Image(s)
            </label>
            <input
              type="file"
              id="image"
              name="image"
              multiple
              className="w-full text-gray-700 bg-white/60 py-2 px-3 rounded-xl border border-gray-200 cursor-pointer hover:bg-white transition"
            />
          </div>

          {/* Submit */}
          <div>
            <button
              type="submit"
              className="btn btn-primary w-full mt-4"
            >
              Add Cafe
            </button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <a href="/cafes" className="text-amber-700 font-semibold hover:underline">
            Back to All Cafes
          </a>
        </div>
      </div>
    </div>
  );
}
