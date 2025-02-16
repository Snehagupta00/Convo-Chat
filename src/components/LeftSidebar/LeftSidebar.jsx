import React, { useContext, useEffect, useState } from "react";
import "./LeftSidebar.css";
import assets from "../../assets/assets";
import { useNavigate } from "react-router-dom";
import {
    collection,
    doc,
    query,
    where,
    getDocs,
    setDoc,
    updateDoc,
    arrayUnion,
    getDoc,
} from "firebase/firestore";
import { db } from "../../config/firebase";
import { AppContext } from "../../context/AppContext";
import { toast } from "react-toastify";

const LeftSidebar = () => {
    const navigate = useNavigate();
    const { userData, chatData, chatUser, setChatUser, setMessagesId, messageId, chatVisible, setChatVisible } = useContext(AppContext);
    const [user, setUser] = useState(null);
    const [showSearch, setShowSearch] = useState(false);

    const inputHandler = async (e) => {
        try {
            const input = e.target.value.trim().toLowerCase();
            if (!input) {
                setUser(null);
                setShowSearch(false);
                return;
            }

            const userRef = collection(db, "users");
            const q = query(userRef, where("username", "==", input));
            const querySnap = await getDocs(q);

            if (!querySnap.empty && querySnap.docs[0].data().id !== userData?.id) {
                const searchedUser = querySnap.docs[0].data();
                const userExists = chatData?.some((chat) => chat.id === searchedUser.id);

                if (!userExists) {
                    setUser(searchedUser);
                } else {
                    setUser(null);
                }
            } else {
                setUser(null);
            }

            setShowSearch(true);
        } catch (error) {
            setShowSearch(false);
            toast.error("Error searching for user");
        }
    };

    const addChat = async () => {
        if (!user || !userData) return;

        try {
            const messageRef = collection(db, "messages");
            const newMessage = doc(messageRef);
            await setDoc(newMessage, { createdAt: Date.now(), messages: [] });

            const timestamp = Date.now();
            const currentUserChatRef = doc(db, "chats", userData.id);
            const searchedUserChatRef = doc(db, "chats", user.id);

            await updateDoc(currentUserChatRef, {
                chatsData: arrayUnion({
                    messageId: newMessage.id,
                    lastMessage: "",
                    rid: user.id,
                    updatedAt: timestamp,
                    messageSeen: true,
                }),
            });

            await updateDoc(searchedUserChatRef, {
                chatsData: arrayUnion({
                    messageId: newMessage.id,
                    lastMessage: "",
                    rid: userData.id,
                    updatedAt: timestamp,
                    messageSeen: true,
                }),
            });

            toast.success("Chat added successfully!");
            setUser(null);
            setShowSearch(false);
            setChatVisible(true);
        } catch (error) {
            toast.error("Error adding chat");
        }
    };

    const setChat = async (item) => {
        try {
            if (!item || !item.messageId || !userData) return;

            setMessagesId(item.messageId);
            setChatUser(item);
            setChatVisible(true);

            const userChatsRef = doc(db, "chats", userData.id);
            const userChatsSnapshot = await getDoc(userChatsRef);

            if (userChatsSnapshot.exists()) {
                const userChatData = userChatsSnapshot.data();
                const updatedChats = userChatData.chatsData.map((chat) =>
                    chat.messageId === item.messageId ? { ...chat, messageSeen: true } : chat
                );

                await updateDoc(userChatsRef, { chatsData: updatedChats });
            }
            setChatVisible(true);
        } catch (error) {
            toast.error(error.message);
        }
    };

    return (
        <div className={`ls ${chatVisible ? "hidden" : ""}`}>
            <div className="ls-top">
                <div className="ls-nav">
                    <img src={assets.logo || "/placeholder.svg"} className="logo" alt="Logo" />
                    <div className="menu">
                        <img src={assets.menu_icon || "/placeholder.svg"} alt="Menu Icon" />
                        <div className="sub-menu">
                            <p onClick={() => navigate("/profile")}>Edit Profile</p>
                            <hr />
                            <p>Logout</p>
                        </div>
                    </div>
                </div>
                <div className="ls-search">
                    <img src={assets.search_icon || "/placeholder.svg"} alt="Search Icon" />
                    <input onChange={inputHandler} type="text" placeholder="Search or start new chat" />
                </div>
            </div>
            <div className="ls-list">
                {showSearch && user ? (
                    <div onClick={addChat} className="friends add-user">
                        <img src={user.avatar || "/placeholder.svg"} alt="" />
                        <p>{user.name}</p>
                    </div>
                ) : chatData && chatData.length > 0 ? (
                    chatData.map((item, index) => (
                        <div
                            onClick={() => setChat(item)}
                            key={index}
                            className={`friends ${!item.messageSeen ? "border" : ""} ${item.messageId === messageId ? "active" : ""}`}
                        >
                            <img src={item.userData?.avatar || "/placeholder.svg"} alt="" />
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <p style={{ margin: 0 }}>{item.userData?.name || "Unknown User"}</p>
                                {item.lastMessage && (
                                    <span style={{ fontSize: '0.8em', color: '#666' }}>{item.lastMessage}</span>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <h1 style={{ textAlign: 'center', color: '#666', marginTop: '20px', fontSize: '1.2em' }}>No chats available.</h1>
                )}
            </div>
        </div>
    );
};

export default LeftSidebar;
