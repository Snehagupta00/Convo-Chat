import React, { useContext, useState, useCallback } from "react";
import "./LeftSidebar.css";
import assets from "../../assets/assets";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../../context/AppContext";
import { debounce } from "../../utils/helpers";
import { searchUsers, addNewChat } from "../../services/chatService";
import { toast } from "react-toastify";

const LeftSidebar = () => {
    const navigate = useNavigate();
    const { 
        userData, 
        chatData, 
        chatUser, 
        setChatUser, 
        setMessagesId, 
        messageId, 
        chatVisible, 
        setChatVisible 
    } = useContext(AppContext);

    const [searchResults, setSearchResults] = useState(null);
    const [isSearching, setIsSearching] = useState(false);

    const debouncedSearch = useCallback(
        debounce(async (input) => {
            if (!input.trim()) {
                setSearchResults(null);
                setIsSearching(false);
                return;
            }
            try {
                const results = await searchUsers(input, userData?.id);
                setSearchResults(results);
            } catch (error) {
                toast.error("Search failed. Please try again.");
            } finally {
                setIsSearching(false);
            }
        }, 500),
        [userData]
    );

    const handleSearch = (e) => {
        setIsSearching(true);
        debouncedSearch(e.target.value);
    };

    const handleAddChat = async (selectedUser) => {
        try {
            await addNewChat(userData, selectedUser);
            setSearchResults(null);
            toast.success("Chat started successfully!");
        } catch (error) {
            toast.error("Failed to start chat. Please try again.");
        }
    };

    return (
        <div className={`left-sidebar ${chatVisible ? "hidden" : ""}`}>
            <div className="left-sidebar__header">
                <img 
                    src={userData?.avatar || assets.avatar_placeholder} 
                    alt="Profile" 
                    className="left-sidebar__profile-pic"
                    onClick={() => navigate("/profile")}
                />
                <div className="left-sidebar__search">
                    <input
                        type="text"
                        placeholder="Search users..."
                        onChange={handleSearch}
                        className="left-sidebar__search-input"
                    />
                    {isSearching && <div className="left-sidebar__search-loading" />}
                </div>
            </div>

            <div className="left-sidebar__content">
                {searchResults ? (
                    <div className="left-sidebar__search-results">
                        {searchResults.length > 0 ? (
                            searchResults.map((user) => (
                                <div 
                                    key={user.id}
                                    className="left-sidebar__search-item"
                                    onClick={() => handleAddChat(user)}
                                >
                                    <img src={user.avatar} alt={user.name} />
                                    <div>
                                        <h4>{user.name}</h4>
                                        <p>{user.username}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="left-sidebar__no-results">No users found</p>
                        )}
                    </div>
                ) : (
                    <div className="left-sidebar__chats">
                        {chatData?.length > 0 ? (
                            chatData.map((chat) => (
                                <div
                                    key={chat.messageId}
                                    className={`left-sidebar__chat-item ${
                                        chat.messageId === messageId ? "active" : ""
                                    } ${!chat.messageSeen ? "unread" : ""}`}
                                    onClick={() => {
                                        setMessagesId(chat.messageId);
                                        setChatUser(chat);
                                        setChatVisible(true);
                                    }}
                                >
                                    <img 
                                        src={chat.userData?.avatar || assets.avatar_placeholder} 
                                        alt={chat.userData?.name} 
                                    />
                                    <div className="left-sidebar__chat-info">
                                        <h4>{chat.userData?.name}</h4>
                                        {chat.lastMessage && (
                                            <p>{chat.lastMessage}</p>
                                        )}
                                    </div>
                                    {chat.lastMessageTime && (
                                        <span className="left-sidebar__chat-time">
                                            {formatTime(chat.lastMessageTime)}
                                        </span>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="left-sidebar__empty">
                                <img src={assets.empty_chat} alt="No chats" />
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