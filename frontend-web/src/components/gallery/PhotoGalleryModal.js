import React, { useState, useEffect } from "react";
import "./PhotoGalleryModal.css";

const PhotoGalleryModal = ({
  isOpen,
  images = [],
  initialIndex = 0,
  onClose = () => {},
}) => {
  const [index, setIndex] = useState(initialIndex || 0);

  useEffect(() => {
    if (isOpen) setIndex(initialIndex || 0);
  }, [isOpen, initialIndex]);

  if (!isOpen) return null;

  const next = () => {
    if (index < images.length - 1) setIndex(index + 1);
  };
  const prev = () => {
    if (index > 0) setIndex(index - 1);
  };

  const current = images[index] || {};

  const formatDate = (d) => {
    if (!d) return "";
    const date = typeof d === "string" ? new Date(d) : d;
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="pg-modal-overlay" onClick={onClose}>
      <div className="pg-modal" onClick={(e) => e.stopPropagation()}>
        <div className="pg-header">
          <h3>Photos ({images.length})</h3>
          <button className="pg-close" onClick={(e) => { e.stopPropagation(); onClose(); }}>
            ✕
          </button>
        </div>

        <div className="pg-main">
          <div className="pg-image-stage">
            {images.length === 0 ? (
              <div className="pg-empty">Aucune photo</div>
            ) : (
              <img
                src={current.image_url || current.firebase_url}
                alt={`Photo ${index + 1}`}
                className="pg-main-image"
              />
            )}
          </div>

          {images.length > 1 && (
            <div className="pg-controls">
              <button onClick={(e) => { e.stopPropagation(); prev(); }} disabled={index === 0} className="pg-nav">
                ◀
              </button>
              <span className="pg-counter">
                {index + 1} / {images.length}
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); next(); }}
                disabled={index === images.length - 1}
                className="pg-nav"
              >
                ▶
              </button>
            </div>
          )}

          <div className="pg-meta">
            <div className="pg-date">{formatDate(current.created_at)}</div>
          </div>

          {images.length > 1 && (
            <div className="pg-thumbs">
              {images.map((img, i) => (
                <div
                  key={i}
                  className={`pg-thumb ${i === index ? "active" : ""}`}
                  onClick={(e) => { e.stopPropagation(); setIndex(i); }}
                >
                  <img
                    src={img.image_url || img.firebase_url}
                    alt={`Thumb ${i + 1}`}
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PhotoGalleryModal;
