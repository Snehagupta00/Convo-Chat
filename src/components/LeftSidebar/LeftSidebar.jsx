import React, { useContext, useState, useCallback, useRef } from "react";
import "./LeftSidebar.css";
import assets from "../../assets/assets";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../../context/AppContext";
import { debounce } from "../../utils/helpers";
import { searchUsers, addNewChat } from "../../services/chatService";
import { formatChatTime } from '../../utils/helpers';
import { toast } from "react-toastify";

const LeftSidebar = () => {
    const navigate = useNavigate();
    const {
        userData,
        chatData,
        chatUser,
        setChatUser,
        setMessagesId,
        messagesId,
        chatVisible,
        setChatVisible,
        isMobile
    } = useContext(AppContext);

    const [searchResults, setSearchResults] = useState(null);
    const [isSearching, setIsSearching] = useState(false);
    const [loadingChat, setLoadingChat] = useState(null);

    // Persistent debounce function using useRef (prevents unnecessary re-renders)
    const debouncedSearchRef = useRef(
        debounce(async (input) => {
            if (!input.trim()) {
                setSearchResults(null);
                setIsSearching(false);
                return;
            }
            try {
                setIsSearching(true);
                const results = await searchUsers(input, userData?.id);
                setSearchResults(results);
            } catch (error) {
                console.error("Search error:", error);
                toast.error("Search failed. Please try again.");
            } finally {
                setIsSearching(false);
            }
        }, 500)
    );

    // Handle search input change
    const handleSearch = (e) => {
        debouncedSearchRef.current(e.target.value);
    };

    // Start a new chat
    const handleAddChat = async (selectedUser) => {
        if (loadingChat) return; // Prevent multiple clicks

        try {
            setLoadingChat(selectedUser.id);
            const newChat = await addNewChat(userData, selectedUser);
            setSearchResults(null);
            setChatUser(newChat);
            setMessagesId(newChat.messageId);
            setChatVisible(isMobile ? true : chatVisible); // Only toggle on mobile
            toast.success("Chat started successfully!");
        } catch (error) {
            console.error("Chat creation error:", error);
            toast.error("Failed to start chat. Please try again.");
        } finally {
            setLoadingChat(null);
        }
    };

    // Select an existing chat
    const handleChatSelect = (chat) => {
        setMessagesId(chat.messageId);
        setChatUser(chat);
        if (isMobile) {
            setChatVisible(true);
        }
    };

    // Handle broken images
    const handleImageError = (e) => {
        e.target.src = assets.avatar_placeholder;
    };

    return (
        <div className={`left-sidebar ${isMobile && chatVisible ? "hidden" : ""}`}>
            <div className="left-sidebar__header">
                <div className="left-sidebar__profile">
                    <img
                        src={userData?.avatar || assets.avatar_placeholder}
                        alt="Profile"
                        className="left-sidebar__profile-pic"
                        onClick={() => navigate("/profile")}
                        onError={handleImageError}
                    />
                    <div className="left-sidebar__profile-info">
                        <h3>{userData?.name}</h3>
                        <span>{userData?.status || "Online"}</span>
                    </div>
                </div>
                <div className="left-sidebar__search">
                    <input
                        type="text"
                        placeholder="Search users..."
                        onChange={handleSearch}
                        className="left-sidebar__search-input"
                    />
                    {isSearching && (
                        <div className="left-sidebar__search-loading">
                            <div className="spinner"></div>
                        </div>
                    )}
                </div>
            </div>

            <div className="left-sidebar__content">
                {searchResults ? (
                    <div className="left-sidebar__search-results">
                        {searchResults.length > 0 ? (
                            searchResults.map((user) => (
                                <div
                                    key={user.id}
                                    className={`left-sidebar__search-item ${loadingChat === user.id ? 'loading' : ''}`}
                                    onClick={() => handleAddChat(user)}
                                >
                                    <img
                                        src={user.avatar || assets.avatar_placeholder}
                                        alt={user.name}
                                        onError={handleImageError}
                                        className="left-sidebar__user-avatar"
                                    />
                                    <div className="left-sidebar__user-info">
                                        <h4>{user.name}</h4>
                                        <p>{user.username}</p>
                                    </div>
                                    {loadingChat === user.id && (
                                        <div className="left-sidebar__loading-indicator" />
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="left-sidebar__no-results">
                                <p>No users found</p>
                                <span>Try a different search term</span>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="left-sidebar__chats">
                        {chatData?.length > 0 ? (
                            chatData.map((chat) => (
                                <div
                                    key={chat.messageId}
                                    className={`left-sidebar__chat-item ${chat.messageId === messagesId ? "active" : ""} ${!chat.messageSeen ? "unread" : ""}`}
                                    onClick={() => handleChatSelect(chat)}
                                >
                                    <img
                                        src={chat.userData?.avatar || assets.avatar_placeholder}
                                        alt={chat.userData?.name}
                                        onError={handleImageError}
                                        className="left-sidebar__chat-avatar"
                                    />
                                    <div className="left-sidebar__chat-info">
                                        <h4>{chat.userData?.name}</h4>
                                        <div className="left-sidebar__message-preview">
                                            {chat.lastMessage && <p>{chat.lastMessage}</p>}
                                        </div>
                                    </div>
                                    {chat.lastMessageTime && (
                                        <span className="left-sidebar__chat-time">
                                            {formatChatTime(chat.lastMessageTime)}
                                        </span>
                                    )}
                                    {!chat.messageSeen && <div className="left-sidebar__unread-indicator" />}
                                </div>
                            ))
                        ) : (
                            <div className="left-sidebar__empty">
                                <img
                                    src={assets.empty_chat}
                                    alt="No chats"
                                    className="left-sidebar__empty-icon"
                                />
                                <p>No chats yet</p>
                                <span>Search for users to start chatting</span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default LeftSidebar;
