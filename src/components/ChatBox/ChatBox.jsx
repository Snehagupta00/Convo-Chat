import React, { useContext, useEffect, useState, useRef } from "react";
import "./ChatBox.css";
import assets from "../../assets/assets";
import { AppContext } from "../../context/AppContext";
import { sendMessage, updateLastMessage, handleImageUpload } from "../../services/messageService";
import { isValidImageFile } from "../../utils/imageUtils";
import { formatTime } from "../../utils/dateUtils";
import { toast } from "react-toastify";
import EmojiPicker from "emoji-picker-react";
import {
    Send,
    Smile,
    ImagePlus,
    ChevronLeft,
    Search,
    MoreVertical,
    Phone,
    Video
} from 'lucide-react';

const ChatBox = () => {
    const {
        userData,
        chatUser,
        messagesId,
        messages,
        setMessages,
        chatVisible,
        setChatVisible,
        isMobile
    } = useContext(AppContext);

    const [input, setInput] = useState("");
    const [isUploading, setIsUploading] = useState(false);
    const [showEmoji, setShowEmoji] = useState(false);
    const [showOptions, setShowOptions] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const chatContainerRef = useRef(null);
    const inputRef = useRef(null);
    const emojiPickerRef = useRef(null);
    const fileInputRef = useRef(null);
    const optionsRef = useRef(null);

    // Scroll to bottom for latest messages
    const scrollToBottom = () => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    };

    // Auto scroll on new messages
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Handle clicking outside emoji picker
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
                setShowEmoji(false);
            }
            if (optionsRef.current && !optionsRef.current.contains(event.target)) {
                setShowOptions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Reset states when chat user changes
    useEffect(() => {
        setInput("");
        setShowEmoji(false);
        setShowOptions(false);
        setIsSearching(false);
        setSearchQuery("");
    }, [chatUser]);

    // Handle emoji selection
    const handleEmojiClick = (emojiData) => {
        const cursor = inputRef.current.selectionStart;
        const text = input.slice(0, cursor) + emojiData.emoji + input.slice(cursor);
        setInput(text);

        // Maintain cursor position
        setTimeout(() => {
            inputRef.current.focus();
            const newCursor = cursor + emojiData.emoji.length;
            inputRef.current.setSelectionRange(newCursor, newCursor);
        }, 10);
    };

    // Handle file upload with validation
    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!userData?.id || !messagesId || !chatUser?.userData?.id) {
            toast.error("Missing required chat data. Please try again.");
            return;
        }

        if (!(await isValidImageFile(file))) {
            toast.error("Invalid image file. Max size: 5MB");
            return;
        }

        setIsUploading(true);
        try {
            const imageUrl = await handleImageUpload(file, messagesId, userData.id);
            const newMessage = {
                id: Date.now(),
                sId: userData.id,
                image: imageUrl,
                createdAt: new Date().toISOString(),
            };
            setMessages(prevMessages => [...prevMessages, newMessage]);

            await updateLastMessage(
                "📷 Image",
                messagesId,
                userData.id,
                chatUser.userData.id
            );
            toast.success("Image sent successfully!");
            scrollToBottom();
        } catch (error) {
            console.error("Error uploading image:", error);
            toast.error(error.message || "Failed to send image. Please try again.");
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    // Send text message with validation
    const handleSendMessage = async (e) => {
        e.preventDefault();

        const trimmedInput = input.trim();
        if (!trimmedInput) return;

        // Validate required data
        if (!userData?.id) {
            toast.error("User data is missing. Please try logging in again.");
            return;
        }

        if (!messagesId) {
            toast.error("Chat session is not initialized.");
            return;
        }

        if (!chatUser?.userData?.id) {
            toast.error("Recipient data is missing.");
            return;
        }

        try {
            const newMessage = {
                id: Date.now(),
                sId: userData.id,
                text: trimmedInput,
                createdAt: new Date().toISOString(),
            };
            setMessages(prevMessages => [...prevMessages, newMessage]);

            await sendMessage(trimmedInput, messagesId, userData.id);
            await updateLastMessage(
                trimmedInput,
                messagesId,
                userData.id,
                chatUser.userData.id
            );
            setInput("");
            setShowEmoji(false);
            scrollToBottom();
        } catch (error) {
            console.error("Error sending message:", error);
            toast.error(error.message || "Failed to send message. Please try again.");
            setMessages(prevMessages => prevMessages.filter(msg => msg.id !== newMessage.id));
        }
    };
    const handleBackClick = () => {
        if (isMobile) {
            setChatVisible(false);
            setShowEmoji(false);
            setShowOptions(false);
        }
    };
    const handleSearchToggle = () => {
        setIsSearching(!isSearching);
        if (!isSearching) {
            setSearchQuery("");
        }
    };
    const filteredMessages = searchQuery
        ? messages.filter(msg =>
            msg.text?.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : messages;
    const isUserOnline = (lastSeen) => {
        if (!lastSeen) return false;
        return Date.now() - new Date(lastSeen).getTime() < 5 * 60 * 1000;
    };
    if (!chatUser) {
        return (
            <div className={`chatbox-welcome ${isMobile && !chatVisible ? "hidden" : ""}`}>
                <img src={assets.logo_icon} alt="Welcome" className="welcome-logo" />
                <h2>Welcome to ChatApp</h2>
                <p>Select a chat to start messaging</p>
            </div>
        );
    }

    return (
        <div className={`chatbox ${isMobile && !chatVisible ? "hidden" : ""}`}>
            {/* Chat Header */}
            <div className="chatbox__header">
                <div className="chatbox__user-info">
                    {isMobile && (
                        <ChevronLeft
                            className="chatbox__back-btn"
                            onClick={handleBackClick}
                            size={24}
                        />
                    )}
                    <img
                        src={chatUser.userData?.avatar || assets.avatar_placeholder}
                        alt={chatUser.userData?.name}
                        className="chatbox__user-avatar"
                    />
                    <div className="chatbox__user-details">
                        <h3>{chatUser.userData?.name}</h3>
                        <span className={`chatbox__status ${isUserOnline(chatUser.userData?.lastSeen) ? "online" : "offline"}`}>
                            {isUserOnline(chatUser.userData?.lastSeen) ? "Online" : "Offline"}
                        </span>
                    </div>
                </div>
                <div className="chatbox__actions">
                    {!isSearching ? (
                        <>
                            <Phone className="chatbox__action-icon" />
                            <Video className="chatbox__action-icon" />
                            <Search
                                className="chatbox__action-icon"
                                size={20}
                                onClick={handleSearchToggle}
                            />
                            <div className="chatbox__more-options" ref={optionsRef}>
                                <MoreVertical
                                    className="chatbox__action-icon"
                                    size={20}
                                    onClick={() => setShowOptions(!showOptions)}
                                />
                                {showOptions && (
                                    <div className="chatbox__options-menu">
                                        <button>View Profile</button>
                                        <button>Clear Chat</button>
                                        <button>Block User</button>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="chatbox__search-bar">
                            <input
                                type="text"
                                placeholder="Search in conversation..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                autoFocus
                            />
                            <button onClick={handleSearchToggle}>Cancel</button>
                        </div>
                    )}
                </div>
            </div>

            {/* Chat Messages */}
            <div className="chatbox__messages" ref={chatContainerRef}>
                {filteredMessages.map((msg, index) => (
                    <div
                        key={msg.id || index}
                        className={`chatbox__message ${msg.sId === userData.id ? "sent" : "received"}`}
                    >
                        {msg.image ? (
                            <div className="chatbox__image-message">
                                <img
                                    src={msg.image}
                                    alt="Shared"
                                    onClick={() => window.open(msg.image, "_blank")}
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

            {/* Chat Input */}
            <form className="chatbox__input-area" onSubmit={handleSendMessage}>
                <div className="chatbox__input-container">
                    <div className="chatbox__input-actions">
                        <div className="chatbox__emoji-wrapper" ref={emojiPickerRef}>
                            <Smile
                                className={`chatbox__action-icon ${showEmoji ? 'active' : ''}`}
                                onClick={() => setShowEmoji(!showEmoji)}
                                size={24}
                            />
                            {showEmoji && (
                                <div className="chatbox__emoji-picker">
                                    <EmojiPicker
                                        onEmojiClick={handleEmojiClick}
                                        autoFocusSearch={false}
                                        theme="light"
                                        searchPlaceHolder="Search emoji..."
                                        height={350}
                                        width={300}
                                        lazyLoadEmojis={true}
                                        skinTonesDisabled
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                    <input
                        type="text"
                        placeholder="Type a message..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        ref={inputRef}
                        className="chatbox__input"
                    />
                    <label className="chatbox__file-input">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileUpload}
                            disabled={isUploading}
                            hidden
                            ref={fileInputRef}
                        />
                        <ImagePlus
                            className={`chatbox__action-icon ${isUploading ? 'uploading' : ''}`}
                            size={24}
                        />
                    </label>
                </div>
                <button
                    type="submit"
                    disabled={!input.trim() || isUploading}
                    className="chatbox__send-btn"
                >
                    <Send size={15} />
                </button>
            </form>
        </div>
    );
};

export default ChatBox;
