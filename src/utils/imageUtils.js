/**
 * Compresses and resizes an image file
 * @param {File} file - The image file to compress
 * @param {Object} options - Compression options
 * @returns {Promise<string>} - Returns a base64 data URL of the compressed image
 */
export const compressImage = async (file, options = {}) => {
    const {
        maxWidth = 1200,
        maxHeight = 1200,
        quality = 0.8,
        maxSizeKB = 500
    } = options;

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);

        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;

            img.onload = () => {
                // Calculate new dimensions while maintaining aspect ratio
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > maxWidth) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width = Math.round((width * maxHeight) / height);
                        height = maxHeight;
                    }
                }

                // Create canvas for compression
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;

                // Draw and compress image
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = '#FFFFFF'; // Set white background
                ctx.fillRect(0, 0, width, height);
                ctx.drawImage(img, 0, 0, width, height);

                // First compression attempt
                let compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
                
                // Check if size is still too large
                let currentSize = getBase64Size(compressedDataUrl);
                
                // Further compress if needed
                if (currentSize > maxSizeKB * 1024) {
                    let adjustedQuality = quality;
                    while (currentSize > maxSizeKB * 1024 && adjustedQuality > 0.1) {
                        adjustedQuality -= 0.1;
                        compressedDataUrl = canvas.toDataURL('image/jpeg', adjustedQuality);
                        currentSize = getBase64Size(compressedDataUrl);
                    }
                }

                resolve(compressedDataUrl);
            };

            img.onerror = (error) => {
                reject(new Error('Failed to load image'));
            };
        };

        reader.onerror = (error) => {
            reject(new Error('Failed to read file'));
        };
    });
};

/**
 * Calculates the size of a base64 string in bytes
 * @param {string} base64String - The base64 string to check
 * @returns {number} - Size in bytes
 */
const getBase64Size = (base64String) => {
    const padding = base64String.endsWith('==') ? 2 : 
                   base64String.endsWith('=') ? 1 : 0;
    const base64Length = base64String.substr(base64String.indexOf(',') + 1).length;
    return (base64Length * 0.75) - padding;
};

/**
 * Validates if a file is an acceptable image
 * @param {File} file - The file to validate
 * @returns {boolean} - Whether the file is valid
 */
export const isValidImageFile = (file) => {
    const acceptedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    return file && acceptedTypes.includes(file.type);
};

/**
 * Creates a thumbnail from an image file
 * @param {File} file - The image file
 * @param {number} size - The desired thumbnail size
 * @returns {Promise<string>} - Returns a base64 data URL of the thumbnail
 */
export const createThumbnail = async (file, size = 100) => {
    return compressImage(file, {
        maxWidth: size,
        maxHeight: size,
        quality: 0.6,
        maxSizeKB: 50
    });
};

/**
 * Converts a data URL to a Blob object
 * @param {string} dataUrl - The data URL to convert
 * @returns {Blob} - The resulting Blob object
 */
export const dataUrlToBlob = (dataUrl) => {
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    
    return new Blob([u8arr], { type: mime });
};

/**
 * Gets image dimensions from a file
 * @param {File} file - The image file
 * @returns {Promise<{width: number, height: number}>} - Image dimensions
 */
export const getImageDimensions = (file) => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = URL.createObjectURL(file);
        
        img.onload = () => {
            URL.revokeObjectURL(img.src);
            resolve({
                width: img.width,
                height: img.height
            });
        };
        
        img.onerror = () => {
            URL.revokeObjectURL(img.src);
            reject(new Error('Failed to load image'));
        };
    });
};

/**
 * Rotates an image to the correct orientation based on EXIF data
 * @param {File} file - The image file
 * @returns {Promise<string>} - Returns a base64 data URL of the rotated image
 */
export const fixImageOrientation = async (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsArrayBuffer(file);

        reader.onload = (event) => {
            const view = new DataView(event.target.result);
            
            // Check if image has EXIF data
            if (view.getUint16(0, false) !== 0xFFD8) {
                // Not a JPEG
                resolve(URL.createObjectURL(file));
                return;
            }

            let offset = 2;
            let orientation = 1;

            while (offset < view.byteLength) {
                if (view.getUint16(offset, false) === 0xFFE1) {
                    if (view.getUint32(offset + 2, false) === 0x45786966) {
                        const little = view.getUint16(offset + 8, false) === 0x4949;
                        offset += 10;
                        
                        // Find orientation tag
                        for (let i = 0; i < view.getUint16(offset, little); i++) {
                            if (view.getUint16(offset + 2 + 12 * i, little) === 0x0112) {
                                orientation = view.getUint16(offset + 8 + 12 * i, little);
                                break;
                            }
                        }
                    }
                    break;
                }
                offset += 2;
            }

            // Apply rotation if needed
            const img = new Image();
            img.src = URL.createObjectURL(file);

            img.onload = () => {
                URL.revokeObjectURL(img.src);
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                // Set proper canvas dimensions before transform
                if ([5, 6, 7, 8].indexOf(orientation) > -1) {
                    canvas.width = img.height;
                    canvas.height = img.width;
                } else {
                    canvas.width = img.width;
                    canvas.height = img.height;
                }

                // Transform context based on orientation
                switch (orientation) {
                    case 2: ctx.transform(-1, 0, 0, 1, img.width, 0); break;
                    case 3: ctx.transform(-1, 0, 0, -1, img.width, img.height); break;
                    case 4: ctx.transform(1, 0, 0, -1, 0, img.height); break;
                    case 5: ctx.transform(0, 1, 1, 0, 0, 0); break;
                    case 6: ctx.transform(0, 1, -1, 0, img.height, 0); break;
                    case 7: ctx.transform(0, -1, -1, 0, img.height, img.width); break;
                    case 8: ctx.transform(0, -1, 1, 0, 0, img.width); break;
                }

                ctx.drawImage(img, 0, 0);
                resolve(canvas.toDataURL('image/jpeg', 0.9));
            };

            img.onerror = () => {
                reject(new Error('Failed to load image'));
            };
        };

        reader.onerror = () => {
            reject(new Error('Failed to read file'));
        };
    });
};