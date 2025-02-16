/**
 * Helper Utilities Constants and Types
 */
const CONSTANTS = {
    DATE: {
        UTC_FORMAT: 'YYYY-MM-DD HH:mm:ss',
        DATE_FORMAT: 'YYYY-MM-DD',
        TIME_FORMAT: 'HH:mm:ss',
        LOCALE: 'en-US',
        TIMEZONE: 'UTC'
    },
    STORAGE: {
        USER_KEY: 'user_data',
        THEME_KEY: 'app_theme',
        SETTINGS_KEY: 'app_settings'
    },
    VALIDATION: {
        USERNAME_MIN: 3,
        USERNAME_MAX: 30,
        PASSWORD_MIN: 8,
        EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        USERNAME_REGEX: /^[a-zA-Z0-9_]+$/
    }
};

/**
 * Debounce function to limit the rate at which a function is called
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
 * Format chat timestamp
 * @param {number|string|Date} timestamp
 * @returns {string} Formatted chat time (e.g., "10:30 AM" or "Yesterday")
 */
export const formatChatTime = (timestamp) => {
    try {
        const date = new Date(timestamp);
        const now = new Date();

        const isToday = date.toDateString() === now.toDateString();
        const isYesterday = date.toDateString() === new Date(now.setDate(now.getDate() - 1)).toDateString();

        if (isToday) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (isYesterday) {
            return `Yesterday ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        } else {
            return date.toLocaleDateString();
        }
    } catch (error) {
        console.error('Error formatting chat time:', error);
        return '';
    }
};


/**
 * Date and Time Utilities
 */
export const getCurrentUTCDateTime = () => {
    return new Date().toISOString().replace('T', ' ').split('.')[0];
};

export const formatUTCDate = (date) => {
    try {
        return new Date(date).toISOString().split('T')[0];
    } catch (error) {
        console.error('Error formatting UTC date:', error);
        return '';
    }
};

export const formatDateTime = (datetime, includeTime = true) => {
    try {
        const date = new Date(datetime);
        const options = {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            ...(includeTime && {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            })
        };
        return date.toLocaleString(CONSTANTS.DATE.LOCALE, options);
    } catch (error) {
        console.error('Error formatting datetime:', error);
        return '';
    }
};


/**
 * Format a timestamp into a readable time format (e.g., "10:30 AM")
 * @param {number|string|Date} timestamp
 * @returns {string} Formatted time
 */
export const formatTime = (timestamp) => {
    try {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
        console.error('Error formatting time:', error);
        return '';
    }
};


/**
 * User Validation Utilities
 */
export const isValidUsername = (username) => {
    return (
        username &&
        username.length >= CONSTANTS.VALIDATION.USERNAME_MIN &&
        username.length <= CONSTANTS.VALIDATION.USERNAME_MAX &&
        CONSTANTS.VALIDATION.USERNAME_REGEX.test(username)
    );
};

export const isValidEmail = (email) => {
    return CONSTANTS.VALIDATION.EMAIL_REGEX.test(email);
};

export const validatePassword = (password) => {
    return {
        isValid: password.length >= CONSTANTS.VALIDATION.PASSWORD_MIN,
        hasUpperCase: /[A-Z]/.test(password),
        hasLowerCase: /[a-z]/.test(password),
        hasNumbers: /\d/.test(password),
        hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
};

/**
 * Storage Utilities
 */
export const saveToStorage = (key, data) => {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch (error) {
        console.error('Error saving to storage:', error);
        return false;
    }
};

export const getFromStorage = (key, defaultValue = null) => {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.error('Error reading from storage:', error);
        return defaultValue;
    }
};

/**
 * String Utilities
 */
export const truncateString = (str, maxLength = 50) => {
    return str.length > maxLength ? `${str.substring(0, maxLength)}...` : str;
};

export const generateRandomString = (length = 10) => {
    return Math.random().toString(36).substring(2, length + 2);
};

/**
 * Number Utilities
 */
export const formatNumber = (number) => {
    try {
        return number.toLocaleString(CONSTANTS.DATE.LOCALE);
    } catch (error) {
        return '0';
    }
};
/**
 * Check if an image URL is valid
 * @param {string} url - The image URL
 * @returns {boolean} True if valid, false otherwise
 */
export const isImageValid = (url) => {
    return url && typeof url === 'string' && url.startsWith('http');
};


/**
 * Array Utilities
 */
export const uniqueArray = (array, key = null) => {
    if (!Array.isArray(array)) return [];
    return key ? Array.from(new Map(array.map(item => [item[key], item])).values()) : [...new Set(array)];
};
/**
 * Format a timestamp into a "Last Seen" format
 * @param {number} timestamp - The timestamp in milliseconds
 * @returns {string} Formatted last seen time
 */
export const formatLastSeen = (timestamp) => {
    if (!timestamp) return 'Unavailable';
    const lastSeenDate = new Date(timestamp);
    return `Last seen on ${lastSeenDate.toLocaleString()}`;
};


/**
 * Debugging Utilities
 */
export const debugLog = (label, data) => {
    if (process.env.NODE_ENV !== 'production') {
        console.log(`[${label}]`, data);
    }
};

export default {
    debounce,
    formatTime,
    getCurrentUTCDateTime,
    formatUTCDate,
    formatLastSeen,
    formatDateTime,
    isValidUsername,
    isValidEmail,
    validatePassword,
    saveToStorage,
    getFromStorage,
    truncateString,
    generateRandomString,
    formatNumber,
    uniqueArray,
    isImageValid,
    debugLog
};
