/**
 * Date and Time Utility Constants
 */
const TIME_CONSTANTS = {
    MILLISECONDS_IN_MINUTE: 60000,
    MILLISECONDS_IN_HOUR: 3600000,
    MILLISECONDS_IN_DAY: 86400000,
    ONLINE_THRESHOLD_MINUTES: 5,
    MAX_FILE_SIZE_MB: 5,
    DATE_LOCALE: 'en-US'
};

/**
 * Format time to 12-hour format with AM/PM
 * @param {number|string|Date} timestamp - The timestamp to format
 * @returns {string} Formatted time string
 */
export const formatTime = (timestamp) => {
    if (!timestamp) return '';
    try {
        const date = new Date(timestamp);
        if (!isValidDate(date)) return '';

        return date.toLocaleTimeString(TIME_CONSTANTS.DATE_LOCALE, {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        }).toUpperCase();
    } catch (error) {
        console.error('Error formatting time:', error);
        return '';
    }
};

/**
 * Format last seen status with relative time
 * @param {number|string|Date} timestamp - The timestamp to format
 * @returns {string} Formatted last seen string
 */
export const formatLastSeen = (timestamp) => {
    if (!timestamp) return 'Last seen unavailable';
    try {
        const date = new Date(timestamp);
        if (!isValidDate(date)) return 'Last seen unavailable';

        const now = new Date();
        const diff = now.getTime() - date.getTime();

        // Handle future dates
        if (diff < 0) return 'Last seen recently';

        const minutes = Math.floor(diff / TIME_CONSTANTS.MILLISECONDS_IN_MINUTE);
        const hours = Math.floor(diff / TIME_CONSTANTS.MILLISECONDS_IN_HOUR);
        const days = Math.floor(diff / TIME_CONSTANTS.MILLISECONDS_IN_DAY);

        // Online if active in last 5 minutes
        if (minutes < TIME_CONSTANTS.ONLINE_THRESHOLD_MINUTES) {
            return 'Online';
        }

        // Just now (less than a minute ago)
        if (minutes === 0) {
            return 'Last seen just now';
        }

        // Within the last hour
        if (minutes < 60) {
            return `Last seen ${minutes} ${pluralize('minute', minutes)} ago`;
        }

        // Within the last 24 hours
        if (hours < 24) {
            return `Last seen ${hours} ${pluralize('hour', hours)} ago`;
        }

        // Yesterday
        if (days === 1) {
            return `Last seen yesterday at ${formatTime(timestamp)}`;
        }

        // Within the last week
        if (days < 7) {
            return `Last seen ${days} ${pluralize('day', days)} ago`;
        }

        // More than a week ago
        return `Last seen on ${formatDate(date)}`;
    } catch (error) {
        console.error('Error formatting last seen:', error);
        return 'Last seen unavailable';
    }
};

/**
 * Debounce function with proper TypeScript typing
 * @param {Function} func - The function to debounce
 * @param {number} wait - The number of milliseconds to delay
 * @returns {Function} Debounced function
 */
export const debounce = (func, wait) => {
    let timeoutId;

    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeoutId);
            func.apply(this, args);
        };

        clearTimeout(timeoutId);
        timeoutId = setTimeout(later, wait);
    };
};

/**
 * Validate if a file is a valid image and within size limits
 * @param {File} file - The file to validate
 * @returns {Promise<boolean>} Promise that resolves to true if image is valid
 */
export const isImageValid = async (file) => {
    try {
        if (!isValidImageFile(file)) {
            return false;
        }

        return await validateImageLoading(file);
    } catch (error) {
        console.error('Error validating image:', error);
        return false;
    }
};

/**
 * Helper function to check if date is valid
 * @param {Date} date - Date to validate
 * @returns {boolean} Whether the date is valid
 */
const isValidDate = (date) => {
    return date instanceof Date && !isNaN(date.getTime());
};

/**
 * Helper function to format date
 * @param {Date} date - Date to format
 * @returns {string} Formatted date string
 */
const formatDate = (date) => {
    return date.toLocaleDateString(TIME_CONSTANTS.DATE_LOCALE, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};

/**
 * Helper function to pluralize words
 * @param {string} word - Word to pluralize
 * @param {number} count - Count to check against
 * @returns {string} Pluralized word
 */
const pluralize = (word, count) => {
    return `${word}${count !== 1 ? 's' : ''}`;
};

/**
 * Helper function to validate image file type and size
 * @param {File} file - File to validate
 * @returns {boolean} Whether the file is valid
 */
const isValidImageFile = (file) => {
    if (!file || !file.type.startsWith('image/')) {
        return false;
    }

    const maxSize = TIME_CONSTANTS.MAX_FILE_SIZE_MB * 1024 * 1024;
    return file.size <= maxSize;
};

/**
 * Helper function to validate image loading
 * @param {File} file - File to validate
 * @returns {Promise<boolean>} Promise that resolves to true if image loads
 */
const validateImageLoading = (file) => {
    return new Promise((resolve) => {
        const img = new Image();
        const objectUrl = URL.createObjectURL(file);

        const cleanup = () => {
            URL.revokeObjectURL(objectUrl);
        };

        img.onload = () => {
            cleanup();
            resolve(true);
        };

        img.onerror = () => {
            cleanup();
            resolve(false);
        };

        img.src = objectUrl;
    });
};

export default {
    formatTime,
    formatLastSeen,
    debounce,
    isImageValid,
    TIME_CONSTANTS
};
