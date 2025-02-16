// dateUtils.js

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

export const formatChatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleString([], { hour: '2-digit', minute: '2-digit', hour12: true });
};
