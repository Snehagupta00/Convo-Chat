import React, { useContext, useEffect, useState, useRef } from 'react';
import './ChatBox.css';
import assets from '../../assets/assets';
import { AppContext } from '../../context/AppContext';
import { sendMessage, updateLastMessage, handleImageUpload } from '../../services/messageService';
import { formatTime, isImageValid } from '../../utils/helpers';
import { toast } from 'react-toastify';
import EmojiPicker from 'emoji-picker-react';

const ChatBox = () => {
    const {
        userData,
        chatUser,
        messagesId,
        messages,
        setMessages,
        chatVisible,
        setChatVisible
    } = useContext(AppContext);

    const [input, setInput] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [showEmoji, setShowEmoji] = useState(false);
    const chatContainerRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    };

    const handleEmojiClick = (emojiData) => {
        setInput(prev => prev + emojiData.emoji);
        setShowEmoji(false);
        inputRef.current?.focus();
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            if (!await isImageValid(file)) {
                toast.error('Please upload a valid image file (max 5MB)');
                return;
            }

            setIsUploading(true);
            await handleImageUpload(file, messagesId, userData.id);
            toast.success('Image sent successfully!');
        } catch (error) {
            toast.error('Failed to send image. Please try again.');
        } finally {
            setIsUploading(false);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();

        if (!input.trim() && !isUploading) return;

        try {
            await sendMessage(input.trim(), messagesId, userData.id);
            await updateLastMessage(input.trim(), messagesId, userData.id, chatUser.rId);
            setInput('');
        } catch (error) {
            toast.error('Failed to send message. Please try again.');
        }
    };

    if (!chatUser) {
        return (
            <div className={`chatbox-welcome ${chatVisible ? "" : "hidden"}`}>
                <img src={assets.logo_icon} alt="Welcome" />
                <h2>Welcome to ChatApp</h2>
                <p>Select a chat to start messaging</p>
            </div>
        );
    }

    return (
        <div className={`chatbox ${chatVisible ? "" : "hidden"}`}>
            <div className="chatbox__header">
                <div className="chatbox__user-info">
                    <img
                        src={assets.back_arrow}
                        alt="Back"
                        className="chatbox__back-btn"
                        onClick={() => setChatVisible(false)}
                    />
                    <img
                        src={chatUser.userData?.avatar || assets.avatar_placeholder}
                        alt={chatUser.userData?.name}
                        className="chatbox__user-avatar"
                    />
                    <div>
                        <h3>{chatUser.userData?.name}</h3>
                        <span className={`chatbox__status ${chatUser.userData?.isOnline ? 'online' : 'offline'
                            }`}>
                            {chatUser.userData?.isOnline ? 'Online' : 'Offline'}
                        </span>
                    </div>
                </div>
                <div className="chatbox__actions">
                    <img src={assets.search_icon} alt="Search" />
                    <img src={assets.more_icon} alt="More" />
                </div>
            </div>

            <div className="chatbox__messages" ref={chatContainerRef}>
                {messages.map((msg, index) => (
                    <div
                        key={index}
                        className={`chatbox__message ${msg.sId === userData.id ? 'sent' : 'received'
                            }`}
                    >
                        {msg.image ? (
                            <div className="chatbox__image-message">
                                <img
                                    src={msg.image}
                                    alt="Shared"
                                    onClick={() => window.open(msg.image, '_blank')}
                                />
                                <span className="chatbox__message-time">
                                    {formatTime(msg.createdAt)}
                                </span>
                            </div>
                        ) : (
                            <div className="chatbox__text-message">
                                <p>{msg.text}</p>
                                <span className="chatbox__message-time">
                                    {formatTime(msg.createdAt)}
                                </span>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <form className="chatbox__input-area" onSubmit={handleSendMessage}>
                <div className="chatbox__input-container">
                    <img
                        src={assets.emoji_icon}
                        alt="Emoji"
                        onClick={() => setShowEmoji(!showEmoji)}
                    />
                    <input
                        type="text"
                        placeholder="Type a message..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        ref={inputRef}
                    />
                    <label className="chatbox__file-input">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileUpload}
                            disabled={isUploading}
                        />
                        <img src={assets.attachment_icon} alt="Attach" />
                    </label>
                </div>
                <button
                    type="submit"
                    disabled={!input.trim() && !isUploading}
                    className="chatbox__send-btn"
                >
                    <img src={assets.send_icon} alt="Send" />
                </button>
            </form>

            {showEmoji && (
                <div className="chatbox__emoji-picker">
                    <EmojiPicker
                        onEmojiClick={handleEmojiClick}
                        width={300}
                        height={400}
                    />
                </div>
            )}
        </div>
    );
};

export default ChatBox;
