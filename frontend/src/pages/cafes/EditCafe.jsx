import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { applyValidation } from "../../utils/ValidateForms";

export default function EditCafe() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [cafe, setCafe] = useState(null);

  useEffect(() => {
    fetch(`/api/cafes/${id}`)
      .then(res => res.json())
      .then(data => setCafe(data));
  }, [id]);

  useEffect(() => {
    if (cafe) applyValidation();
  }, [cafe]);

  if (!cafe) return <div className="text-center mt-10">Loading…</div>;

  async function handleSubmit(e) {
    e.preventDefault();
    const form = new FormData(e.target);

    const res = await fetch(`/api/cafes/${id}`, {
      method: "PUT",
      body: form
    });

    if (res.ok) navigate(`/cafes/${id}`);
    else alert("Update failed");
  }

  return (
    <div className="container-custom py-10">
      <div className="card p-10 animate-fade-in">
        <h1 className="text-4xl font-bold text-center mb-10 text-gradient">
          Edit Cafe
        </h1>

        <form
          onSubmit={handleSubmit}
          className="validated-form space-y-8"
          encType="multipart/form-data"
          noValidate
        >
          {/* Title */}
          <div>
            <label htmlFor="title" className="label">Title</label>
            <input
              type="text"
              id="title"
              name="cafe[title]"
              defaultValue={cafe.title}
              required
              className="input"
            />
          </div>

          {/* Location */}
          <div>
            <label htmlFor="location" className="label">Location</label>
            <input
              type="text"
              id="location"
              name="cafe[location]"
              defaultValue={cafe.location}
              required
              className="input"
            />
          </div>

          {/* Price */}
          <div>
            <label htmlFor="price" className="label">Price</label>
            <div className="flex items-center">
              <span className="px-4 py-3 bg-white/60 border border-gray-200 rounded-l-xl">
                $
              </span>
              <input
                type="text"
                id="price"
                name="cafe[price]"
                defaultValue={cafe.price}
                required
                className="input rounded-l-none"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="label">Description</label>
            <textarea
              id="description"
              name="cafe[description]"
              defaultValue={cafe.description}
              rows="4"
              required
              className="textarea"
            ></textarea>
          </div>

          {/* Upload new images */}
          <div>
            <label className="label">Add New Image(s)</label>
            <input
              type="file"
              name="image"
              multiple
              className="input bg-white/40 border-none"
            />
          </div>

          {/* Existing images + delete checkbox */}
          <div className="space-y-4">
            <label className="label">Existing Images</label>

            {cafe.images?.map((img, i) => (
              <div
                key={i}
                className="flex items-center gap-4 card-minimal p-4 hover-lift"
              >
                <div className="image-gallery w-24 h-24 rounded-xl overflow-hidden">
                  <img src={img.thumbnail} alt="" />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`image-${i}`}
                    name="deleteImages[]"
                    value={img.filename}
                    className="w-5 h-5"
                  />
                  <label htmlFor={`image-${i}`} className="text-gray-700">
                    Delete?
                  </label>
                </div>
              </div>
            ))}
          </div>

          {/* Submit button */}
          <button
            type="submit"
            className="btn btn-primary w-full mt-6"
          >
            Update Cafe
          </button>
        </form>

        <div className="mt-6 text-center">
          <a href={`/cafes/${cafe._id}`} className="text-amber-700 font-semibold hover:underline">
            Back To Cafe
          </a>
        </div>
      </div>
    </div>
  );
}
