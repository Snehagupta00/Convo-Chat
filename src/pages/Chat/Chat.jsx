import React, { useContext } from 'react';
import "./Chat.css";
import LeftSidebar from '../../components/LeftSidebar/LeftSidebar';
import ChatBox from '../../components/ChatBox/ChatBox';
import RightSidebar from '../../components/RightSidebar/RightSidebar';
import { AppContext } from '../../context/AppContext';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';

const Chat = () => {
    const {
        isLoading,
        isMobile,
        chatVisible,
        chatUser
    } = useContext(AppContext);

    if (isLoading) {
        return (
            <div className="chat">
                <LoadingSpinner message="Loading your chats..." />
            </div>
        );
    }

    return (
        <div className="chat">
            <div className="chat-container">
                {/* Left Sidebar - Initially visible on mobile */}
                <div className={`chat-section left-section ${isMobile && chatVisible ? 'hidden' : ''}`}>
                    <LeftSidebar />
                </div>

                {/* Main Chat */}
                <div className={`chat-section main-section ${isMobile && !chatVisible ? 'hidden' : ''}`}>
                    {chatUser ? (
                        <ChatBox />
                    ) : (
                        <div className="select-chat-message">
                            <div className="message-content">
                                <i className="fas fa-comments"></i>
                                <h3>Select a chat to start messaging</h3>
                                <p>Choose from your existing conversations or start a new one</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Sidebar - Only on desktop */}
                {!isMobile && (
                    <div className="chat-section right-section">
                        <RightSidebar />
                    </div>
                )}
            </div>
        </div>
    );
};

export default Chat;
