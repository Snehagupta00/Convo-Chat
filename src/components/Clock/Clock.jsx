import React, { useState, useEffect } from 'react';
import { formatUTCDateTime } from '../../utils/dateUtils';
import './Clock.css';
const Clock = () => {
    const [currentTime, setCurrentTime] = useState(formatUTCDateTime());
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(formatUTCDateTime());
        }, 1000);

        return () => clearInterval(timer);
    }, []);
    return (
        <div className="clock">
            <span className="clock__time">{currentTime}</span>
        </div>
    );
};
export default Clock;
