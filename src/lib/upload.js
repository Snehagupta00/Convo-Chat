/**
 * Constants for upload configuration
 */
const UPLOAD_CONFIG = {
    CLOUD_NAME: 'vipinyadav01',
    UPLOAD_PRESET: 'Vipinyadav',
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
    API_URL: 'https://api.cloudinary.com/v1_1/vipinyadav01/image/upload'
};

/**
 * Custom error class for upload errors
 */
class UploadError extends Error {
    constructor(message, code) {
        super(message);
        this.name = 'UploadError';
        this.code = code;
    }
}

/**
 * Validates file before upload
 * @param {File} file - File to validate
 * @throws {UploadError} If file is invalid
 */
const validateFile = (file) => {
    if (!file) {
        throw new UploadError('No file provided', 'NO_FILE');
    }

    if (!UPLOAD_CONFIG.ALLOWED_TYPES.includes(file.type)) {
        throw new UploadError('Invalid file type. Only JPEG, PNG and WebP are allowed', 'INVALID_TYPE');
    }

    if (file.size > UPLOAD_CONFIG.MAX_FILE_SIZE) {
        throw new UploadError('File size exceeds 5MB limit', 'FILE_TOO_LARGE');
    }
};

/**
 * Uploads a file to Cloudinary
 * @param {File} file - File to upload
 * @param {Object} options - Upload options
 * @returns {Promise<string>} Uploaded file URL
 */
const upload = async (file, options = {}) => {
    const {
        onProgress,
        onError
    } = options;

    try {
        // Validate file
        validateFile(file);

        // Create form data
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', UPLOAD_CONFIG.UPLOAD_PRESET);
        formData.append('cloud_name', UPLOAD_CONFIG.CLOUD_NAME);

        // Upload with XHR to track progress
        const uploadPromise = new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();

            // Setup progress handler
            xhr.upload.onprogress = (event) => {
                if (event.lengthComputable && onProgress) {
                    const progress = (event.loaded / event.total) * 100;
                    onProgress(Math.round(progress));
                }
            };

            // Setup completion handler
            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        const response = JSON.parse(xhr.responseText);
                        resolve(response.secure_url);
                    } catch (error) {
                        reject(new UploadError('Invalid response from server', 'PARSE_ERROR'));
                    }
                } else {
                    try {
                        const error = JSON.parse(xhr.responseText);
                        reject(new UploadError(error.message || 'Upload failed', 'UPLOAD_ERROR'));
                    } catch (e) {
                        reject(new UploadError('Upload failed', 'UPLOAD_ERROR'));
                    }
                }
            };

            // Setup error handler
            xhr.onerror = () => {
                reject(new UploadError('Network error occurred', 'NETWORK_ERROR'));
            };

            // Setup timeout handler
            xhr.ontimeout = () => {
                reject(new UploadError('Upload timed out', 'TIMEOUT_ERROR'));
            };

            // Send request
            xhr.open('POST', UPLOAD_CONFIG.API_URL, true);
            xhr.timeout = 30000; // 30 second timeout
            xhr.send(formData);
        });

        // Return upload result
        return await uploadPromise;

    } catch (error) {
        // Handle errors
        console.error('Upload error:', error);

        if (onError) {
            onError(error);
        }

        throw error instanceof UploadError
            ? error
            : new UploadError(error.message || 'Upload failed', 'UNKNOWN_ERROR');
    }
};

export default upload;
