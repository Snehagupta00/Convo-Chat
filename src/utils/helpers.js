export const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const formatLastSeen = (timestamp) => {
    if (!timestamp) return 'Last seen unavailable';
    const now = Date.now();
    const diff = now - new Date(timestamp).getTime();

    if (diff <= 300000) return 'Online';
    if (diff < 86400000) {
        const hours = Math.floor(diff / 3600000);
        return `Last seen ${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    }
    const days = Math.floor(diff / 86400000);
    if (days === 1) return 'Last seen yesterday';
    if (days < 7) return `Last seen ${days} days ago`;

    return new Date(timestamp).toLocaleDateString();
};

export const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

export const isImageValid = async (file) => {
    if (!file.type.startsWith('image/')) return false;
    if (file.size > 5 * 1024 * 1024) return false; // 5MB limit

    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = URL.createObjectURL(file);
    });
};
