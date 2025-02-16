import React, { useEffect } from 'react';
import './ImageViewer.css';

const ImageViewer = ({ imageUrl, onClose }) => {
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [onClose]);

    return (
        <div className="image-viewer" onClick={onClose}>
            <div className="image-viewer__content" onClick={e => e.stopPropagation()}>
                <button className="image-viewer__close" onClick={onClose}>×</button>
                <img src={imageUrl} alt="Full size" className="image-viewer__img" />
            </div>
        </div>
    );
};

export default ImageViewer;