import React, { useContext, useEffect, useState } from 'react';
import "./RightSidebar.css";
import assets from "../../assets/assets";
import { logout } from '../../config/firebase';
import { AppContext } from '../../context/AppContext';
import { formatLastSeen } from '../../utils/helpers';
import { toast } from 'react-toastify';
import ImageViewer from '../ImageViewer/ImageViewer';

const RightSidebar = () => {
    const { chatUser, messages } = useContext(AppContext);
    const [msgImages, setMsgImages] = useState([]);
    const [selectedImage, setSelectedImage] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        try {
            setLoading(true);
            if (!messages || messages.length === 0) {
                setMsgImages([]);
            } else {
                const images = messages
                    .filter(msg => msg.image)
                    .map(msg => ({
                        url: msg.image,
                        timestamp: msg.createdAt,
                        senderId: msg.sId
                    }));
                setMsgImages(images);
            }
        } catch (err) {
            toast.error("Failed to load media");
        } finally {
            setLoading(false);
        }
    }, [messages]);

    const handleLogout = async () => {
        try {
            await logout();
            toast.success("Logged out successfully");
        } catch (error) {
            toast.error("Failed to logout");
        }
    };

    if (!chatUser) {
        return (
            <div className='right-sidebar right-sidebar--empty'>
                <button onClick={handleLogout} className="right-sidebar__logout-btn">
                    Logout
                </button>
            </div>
        );
    }

    return (
        <div className='right-sidebar'>
            <div className="right-sidebar__profile">
                <img 
                    src={chatUser?.userData?.avatar || assets.avatar_placeholder} 
                    alt="Profile" 
                    className="right-sidebar__avatar"
                />
                <h3 className="right-sidebar__name">
                    {chatUser?.userData?.lastSeen && 
                     Date.now() - chatUser.userData.lastSeen <= 300000 ? (
                        <img className='right-sidebar__status-dot' src={assets.green_dot} alt="Online" />
                    ) : null}
                    {chatUser?.userData?.name || "Unknown User"}
                </h3>
                <p className="right-sidebar__bio">
                    {chatUser?.userData?.bio || "No bio available"}
                </p>
                <p className="right-sidebar__last-seen">
                    {chatUser?.userData?.lastSeen ? 
                        formatLastSeen(chatUser.userData.lastSeen) : 
                        "Last seen unavailable"}
                </p>
            </div>

            <div className="right-sidebar__section">
                <h4>Shared Media</h4>
                {loading ? (
                    <div className="right-sidebar__loading">Loading media...</div>
                ) : msgImages.length > 0 ? (
                    <div className="right-sidebar__media-grid">
                        {msgImages.map((image, index) => (
                            <img
                                key={index}
                                src={image.url}
                                alt={`Shared ${index + 1}`}
                                onClick={() => setSelectedImage(image.url)}
                                className="right-sidebar__media-item"
                            />
                        ))}
                    </div>
                ) : (
                    <p className="right-sidebar__no-media">No media shared yet</p>
                )}
            </div>

            <button onClick={handleLogout} className="right-sidebar__logout-btn">
                Logout
            </button>

            {selectedImage && (
                <ImageViewer
                    imageUrl={selectedImage}
                    onClose={() => setSelectedImage(null)}
                />
            )}
        </div>
    );
};

export default RightSidebar;