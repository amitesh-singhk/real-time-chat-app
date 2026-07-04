import React from "react";

function ImagePreview({ image, setImage }) {
    if (!image) return null;

    return (
        <div className="image-preview">

            <img
                src={URL.createObjectURL(image)}
                alt="preview"
                className="preview-image"
            />

            <button
                className="remove-image-btn"
                onClick={() => setImage(null)}
            >
                ✖ Remove
            </button>

        </div>
    );
}

export default ImagePreview;