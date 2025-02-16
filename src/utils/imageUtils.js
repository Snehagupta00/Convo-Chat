/**
 * Image Processing Utility Functions
 * Handles image compression, validation, thumbnails, and transformations
 */

// Constants for image processing
const IMAGE_CONSTANTS = {
    ACCEPTED_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB in bytes
    DEFAULT_QUALITY: 0.8,
    MIN_QUALITY: 0.1,
    COMPRESSION_STEPS: 0.1,
    DEFAULTS: {
        maxWidth: 1200,
        maxHeight: 1200,
        quality: 0.8,
        maxSizeKB: 500,
        thumbnailSize: 100,
        thumbnailQuality: 0.6
    },
    MIME_TYPES: {
        JPEG: 'image/jpeg',
        PNG: 'image/png',
        GIF: 'image/gif',
        WEBP: 'image/webp'
    }
};

/**
 * Error class for image processing errors
 */
class ImageProcessingError extends Error {
    constructor(message, code) {
        super(message);
        this.name = 'ImageProcessingError';
        this.code = code;
    }
}

/**
 * Validates if a file is an acceptable image
 * @param {File} file - The file to validate
 * @returns {boolean} - Whether the file is valid
 */
export const isValidImageFile = (file) => {
    if (!file) return false;

    return (
        IMAGE_CONSTANTS.ACCEPTED_TYPES.includes(file.type) &&
        file.size <= IMAGE_CONSTANTS.MAX_FILE_SIZE
    );
};

/**
 * Reads a file as Data URL
 * @param {File} file - The file to read
 * @returns {Promise<string>} - Data URL
 */
const readFileAsDataURL = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = () => reject(new ImageProcessingError('Failed to read file', 'READ_ERROR'));
        reader.readAsDataURL(file);
    });
};

/**
 * Loads an image from a source
 * @param {string} src - Image source
 * @returns {Promise<HTMLImageElement>} - Loaded image
 */
const loadImage = (src) => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new ImageProcessingError('Failed to load image', 'LOAD_ERROR'));
        img.src = src;
    });
};

/**
 * Calculates new dimensions maintaining aspect ratio
 * @param {Object} params - Parameters for calculation
 * @returns {Object} - New dimensions
 */
const calculateDimensions = ({ width, height, maxWidth, maxHeight }) => {
    let newWidth = width;
    let newHeight = height;

    const aspectRatio = width / height;

    if (width > maxWidth) {
        newWidth = maxWidth;
        newHeight = Math.round(maxWidth / aspectRatio);
    }

    if (newHeight > maxHeight) {
        newHeight = maxHeight;
        newWidth = Math.round(maxHeight * aspectRatio);
    }

    return { width: newWidth, height: newHeight };
};

/**
 * Creates a canvas with given dimensions
 * @param {number} width - Canvas width
 * @param {number} height - Canvas height
 * @returns {Object} - Canvas and context
 */
const createCanvas = (width, height) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { alpha: false });
    return { canvas, ctx };
};

/**
 * Calculates the size of a base64 string in bytes
 * @param {string} base64String - The base64 string
 * @returns {number} - Size in bytes
 */
const getBase64Size = (base64String) => {
    const base64Length = base64String.substring(base64String.indexOf(',') + 1).length;
    return Math.floor(base64Length * 0.75);
};

/**
 * Compresses an image with quality adjustment
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @param {number} initialQuality - Initial quality
 * @param {number} maxSizeKB - Maximum size in KB
 * @returns {string} - Compressed data URL
 */
const compressWithQuality = (canvas, initialQuality, maxSizeKB) => {
    let quality = initialQuality;
    let dataUrl = canvas.toDataURL(IMAGE_CONSTANTS.MIME_TYPES.JPEG, quality);
    let size = getBase64Size(dataUrl);

    while (size > maxSizeKB * 1024 && quality > IMAGE_CONSTANTS.MIN_QUALITY) {
        quality -= IMAGE_CONSTANTS.COMPRESSION_STEPS;
        dataUrl = canvas.toDataURL(IMAGE_CONSTANTS.MIME_TYPES.JPEG, quality);
        size = getBase64Size(dataUrl);
    }

    return dataUrl;
};

/**
 * Main function to compress and resize an image
 * @param {File} file - The image file to compress
 * @param {Object} options - Compression options
 * @returns {Promise<string>} - Compressed image data URL
 */
export const compressImage = async (file, options = {}) => {
    if (!isValidImageFile(file)) {
        throw new ImageProcessingError('Invalid image file', 'INVALID_FILE');
    }

    const {
        maxWidth = IMAGE_CONSTANTS.DEFAULTS.maxWidth,
        maxHeight = IMAGE_CONSTANTS.DEFAULTS.maxHeight,
        quality = IMAGE_CONSTANTS.DEFAULTS.quality,
        maxSizeKB = IMAGE_CONSTANTS.DEFAULTS.maxSizeKB
    } = options;

    try {
        const dataUrl = await readFileAsDataURL(file);
        const img = await loadImage(dataUrl);

        const dimensions = calculateDimensions({
            width: img.width,
            height: img.height,
            maxWidth,
            maxHeight
        });

        const { canvas, ctx } = createCanvas(dimensions.width, dimensions.height);

        // Draw with white background
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, dimensions.width, dimensions.height);
        ctx.drawImage(img, 0, 0, dimensions.width, dimensions.height);

        const compressedDataUrl = compressWithQuality(canvas, quality, maxSizeKB);

        return compressedDataUrl;
    } catch (error) {
        throw new ImageProcessingError(
            error.message || 'Image compression failed',
            error.code || 'COMPRESSION_ERROR'
        );
    }
};

/**
 * Creates a thumbnail from an image file
 * @param {File} file - The image file
 * @param {Object} options - Thumbnail options
 * @returns {Promise<string>} - Thumbnail data URL
 */
export const createThumbnail = async (file, options = {}) => {
    const {
        size = IMAGE_CONSTANTS.DEFAULTS.thumbnailSize,
        quality = IMAGE_CONSTANTS.DEFAULTS.thumbnailQuality
    } = options;

    return compressImage(file, {
        maxWidth: size,
        maxHeight: size,
        quality,
        maxSizeKB: 50
    });
};

/**
 * Converts a data URL to a Blob
 * @param {string} dataUrl - The data URL
 * @returns {Blob} - The resulting Blob
 */
export const dataUrlToBlob = (dataUrl) => {
    try {
        const arr = dataUrl.split(',');
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);

        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }

        return new Blob([u8arr], { type: mime });
    } catch (error) {
        throw new ImageProcessingError('Failed to convert data URL to Blob', 'CONVERSION_ERROR');
    }
};

/**
 * Gets dimensions of an image file
 * @param {File} file - The image file
 * @returns {Promise<Object>} - Image dimensions
 */
export const getImageDimensions = async (file) => {
    try {
        const url = URL.createObjectURL(file);
        const img = await loadImage(url);

        URL.revokeObjectURL(url);

        return {
            width: img.width,
            height: img.height
        };
    } catch (error) {
        throw new ImageProcessingError('Failed to get image dimensions', 'DIMENSION_ERROR');
    }
};

/**
 * Checks if an image is within specified dimensions
 * @param {File} file - The image file
 * @param {Object} limits - Dimension limits
 * @returns {Promise<boolean>} - Whether image is within limits
 */
export const isImageWithinDimensions = async (file, limits = {}) => {
    const {
        maxWidth = IMAGE_CONSTANTS.DEFAULTS.maxWidth,
        maxHeight = IMAGE_CONSTANTS.DEFAULTS.maxHeight
    } = limits;

    try {
        const dimensions = await getImageDimensions(file);
        return dimensions.width <= maxWidth && dimensions.height <= maxHeight;
    } catch (error) {
        return false;
    }
};

/**
 * Batch processes multiple images
 * @param {File[]} files - Array of image files
 * @param {Object} options - Processing options
 * @returns {Promise<string[]>} - Array of processed image data URLs
 */
export const batchProcessImages = async (files, options = {}) => {
    const validFiles = files.filter(isValidImageFile);

    if (validFiles.length === 0) {
        throw new ImageProcessingError('No valid images to process', 'NO_VALID_FILES');
    }

    try {
        const processed = await Promise.all(
            validFiles.map(file => compressImage(file, options))
        );

        return processed;
    } catch (error) {
        throw new ImageProcessingError('Batch processing failed', 'BATCH_ERROR');
    }
};

export default {
    compressImage,
    createThumbnail,
    isValidImageFile,
    dataUrlToBlob,
    getImageDimensions,
    isImageWithinDimensions,
    batchProcessImages,
    IMAGE_CONSTANTS
};
