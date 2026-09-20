import { useMemo, useState } from "react";

interface ProductGalleryProps {
  name: string;
  image?: string;
  images?: string[];
}

export function ProductGallery({
  name,
  image,
  images = [],
}: ProductGalleryProps) {
  const sources = useMemo(
    () =>
      [
        ...new Set(
          [image, ...images].filter(
            (value): value is string =>
              Boolean(value?.trim()),
          ),
        ),
      ],
    [image, images],
  );

  const [selected, setSelected] =
    useState(0);

  const safeSelected =
    selected < sources.length
      ? selected
      : 0;

  const selectedImage =
    sources[safeSelected] ?? sources[0];

  const initials = name
    .split(" ")
    .map((word) => word.charAt(0))
    .slice(0, 2)
    .join("");

  return (
    <div className="product-gallery">
      <div className="product-gallery-main">
        {selectedImage ? (
          <img
            src={selectedImage}
            alt={name}
            className="product-gallery-image"
          />
        ) : (
          <div className="product-detail-placeholder">
            <div className="product-detail-bottle">
              <span>{initials}</span>
            </div>
          </div>
        )}
      </div>

      {sources.length > 1 && (
        <div className="product-gallery-thumbnails">
          {sources.map((url, index) => (
            <button
              key={`${url}:${index}`}
              className={
                index === safeSelected
                  ? "product-thumbnail active"
                  : "product-thumbnail"
              }
              type="button"
              onClick={() =>
                setSelected(index)
              }
              aria-label={`Ver imagen ${index + 1} de ${name}`}
              aria-pressed={
                index === safeSelected
              }
            >
              <img
                src={url}
                alt=""
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}