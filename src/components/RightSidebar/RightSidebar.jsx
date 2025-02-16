import React, { useContext, useEffect, useState } from 'react';
import "./RightSidebar.css";
import assets from "../../assets/assets";
import { logout } from '../../config/firebase';
import { AppContext } from '../../context/AppContext';

const RightSidebar = () => {
    const { chatUser, messages } = useContext(AppContext);
    const [msgImages, setMsgImages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        try {
            if (!messages || messages.length === 0) {
                setMsgImages([]);
            } else {
                const images = messages.filter(msg => msg.image).map(msg => msg.image);
                setMsgImages(images);
            }
            setLoading(false);
        } catch (err) {
            setError("Failed to load images");
            setLoading(false);
        }
    }, [messages]);

    if (loading) return <div className='rs'>Loading...</div>;
    if (error) return <div className='rs'>{error}</div>;

    return chatUser ? (
        <div className='rs'>
            <div className="rs-profile">
                <img src={chatUser?.userData?.avatar || "/placeholder.svg"} alt="User Avatar" />
                <h3>
                    {chatUser?.userData?.lastSeen && (Date.now() - chatUser.userData.lastSeen <= 300000) ? (
                        <img className='dot' src={assets.green_dot} alt="Online" />
                    ) : null}
                    {chatUser?.userData?.name || "Unknown User"}
                </h3>
                <p>{chatUser?.userData?.bio || "No bio available"}</p>
            </div>
            <hr />
            <div className='rs-media'>
                <p>Media</p>
                <div className='media-grid'>
                    {msgImages.length > 0 ? (
                        msgImages.map((url, index) => (
                            <img
                                onClick={() => {
                                    try {
                                        window.open(url, "_blank");
                                    } catch (error) {
                                        console.error("Error opening image:", error);
                                    }
                                }}
                                key={index}
                                src={url}
                                alt='Media'
                                style={{ cursor: 'pointer' }}
                            />
                        ))
                    ) : (
                        <p>No media available.</p>
                    )}
                </div>
            </div>
            <button onClick={logout}>Logout</button>
        </div>
    ) : (
        <div className='rs'>
            <button onClick={logout}>Logout</button>
        </div>
    );
}

export default RightSidebar;
