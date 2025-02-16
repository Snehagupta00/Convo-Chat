import React, { useContext, useEffect, useState } from 'react';
import "./Chat.css";
import LeftSidebar from '../../components/LeftSidebar/LeftSidebar';
import ChatBox from '../../components/ChatBox/ChatBox';
import RightSidebar from '../../components/RightSidebar/RightSidebar';
import { AppContext } from '../../context/AppContext';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';

const Chat = () => {
    const { chatData, userData } = useContext(AppContext);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (chatData && userData) {
            setLoading(false);
        }
    }, [chatData, userData]);

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
                <LeftSidebar />
                <ChatBox />
                <RightSidebar />
            </div>
        </div>
    );
};

export default Chat;
