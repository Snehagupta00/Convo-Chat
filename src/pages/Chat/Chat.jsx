import React, { useContext, useEffect, useState } from 'react';
import "./Chat.css";
import LeftSidebar from '../../components/LeftSidebar/LeftSidebar';
import ChatBox from '../../components/ChatBox/ChatBox';
import RightSidebar from '../../components/RightSidebar/RightSidebar';
import { AppContext } from '../../context/AppContext';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';

const Chat = () => {
    const { chatData, userData, chatVisible, setChatVisible } = useContext(AppContext);
    const [loading, setLoading] = useState(true);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    // Handle window resize
    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth <= 768;
            setIsMobile(mobile);
            if (!mobile) {
                setChatVisible(true);
            }
        };

        window.addEventListener('resize', handleResize);
        handleResize(); // Initial check

        return () => window.removeEventListener('resize', handleResize);
    }, [setChatVisible]);

    useEffect(() => {
        if (chatData && userData) {
            setLoading(false);
        }
    }, [chatData, userData]);

    // Reset chatVisible when component unmounts
    useEffect(() => {
        return () => setChatVisible(true);
    }, [setChatVisible]);

    if (loading) {
        return (
            <div className='chat'>
                <LoadingSpinner message="Loading your chats..." />
            </div>
        );
    }

    return (
        <div className='chat'>
            <div className='chat-container'>
                <LeftSidebar className={isMobile && chatVisible ? 'hidden' : ''} />
                <ChatBox className={isMobile && !chatVisible ? 'hidden' : ''} />
                <RightSidebar />
            </div>
        </div>
    );
};

export default Chat;
