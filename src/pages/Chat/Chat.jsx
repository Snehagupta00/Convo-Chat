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
    const [selectedChat, setSelectedChat] = useState(null);

    useEffect(() => {
        if (chatData && userData) {
            setLoading(false);
        }
    }, [chatData, userData]);

    const handleChatSelect = (chat) => {
        setSelectedChat(chat);
    };

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
                <LeftSidebar onChatSelect={handleChatSelect} />
                {selectedChat ? <ChatBox chat={selectedChat} /> : null}
                {selectedChat && <RightSidebar chat={selectedChat} />}
            </div>
        </div>
    );
};

export default Chat;
