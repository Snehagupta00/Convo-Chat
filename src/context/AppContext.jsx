import React from 'react';
import { createContext, useState, useEffect, useCallback } from "react";
import { auth, db } from "../config/firebase";
import { doc, getDoc, onSnapshot, updateDoc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { toast } from 'react-toastify';

export const AppContext = createContext();

const AppContextProvider = ({ children }) => {
    const navigate = useNavigate();
    const [userData, setUserData] = useState(null);
    const [chatData, setChatData] = useState([]);
    const [messagesId, setMessagesId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [chatUser, setChatUser] = useState(null);
    const [chatVisible, setChatVisible] = useState(true);
    const [isLoading, setIsLoading] = useState(true);

    // Load user data
    const loadUserData = useCallback(async (uid) => {
        try {
            const userRef = doc(db, "users", uid);
            const userSnap = await getDoc(userRef);

            if (!userSnap.exists()) {
                // Create user document if it doesn't exist
                const newUserData = {
                    id: uid,
                    createdAt: Date.now(),
                    lastSeen: Date.now()
                };
                await setDoc(userRef, newUserData);
                setUserData(newUserData);
                navigate('/profile');
                return;
            }

            const userInfo = userSnap.data();
            setUserData(userInfo);

            // Update last seen
            await updateDoc(userRef, { lastSeen: Date.now() });

            // Update chat user if needed
            if (userInfo.id === chatUser?.userData?.id) {
                setChatUser(prev => ({
                    ...prev,
                    userData: {
                        ...prev.userData,
                        lastSeen: Date.now()
                    }
                }));
            }

            // Navigate based on profile completion
            if (userInfo.avatar && userInfo.name) {
                if (window.location.pathname === '/') {
                    navigate('/chat');
                }
            } else {
                navigate('/profile');
            }
        } catch (error) {
            console.error("Error loading user data:", error);
            toast.error("Failed to load user data");
            setUserData(null);
            navigate('/');
        }
    }, [navigate, chatUser]);

    // Auth state observer
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            try {
                if (user) {
                    await loadUserData(user.uid);
                } else {
                    setUserData(null);
                    setChatData([]);
                    setMessages([]);
                    setChatUser(null);
                    if (window.location.pathname !== '/') {
                        navigate('/');
                    }
                }
            } catch (error) {
                console.error("Auth state change error:", error);
                toast.error("Authentication error");
            } finally {
                setIsLoading(false);
            }
        });

        return () => unsubscribe();
    }, [navigate, loadUserData]);

    // Messages listener
    useEffect(() => {
        if (!messagesId) {
            setMessages([]);
            return;
        }

        const unsubscribe = onSnapshot(
            doc(db, "messages", messagesId),
            (doc) => {
                if (doc.exists()) {
                    const messagesData = doc.data().messages || [];
                    setMessages([...messagesData].reverse());
                } else {
                    setMessages([]);
                }
            },
            (error) => {
                console.error("Messages sync error:", error);
                toast.error("Failed to sync messages");
            }
        );

        return () => unsubscribe();
    }, [messagesId]);

    // Chats listener
    useEffect(() => {
        if (!userData?.id) {
            setChatData([]);
            return;
        }

        const chatRef = doc(db, "chats", userData.id);
        const unsubscribe = onSnapshot(
            chatRef,
            async (snap) => {
                try {
                    if (!snap.exists()) {
                        // Create chats document if it doesn't exist
                        await setDoc(chatRef, { chatsData: [] });
                        setChatData([]);
                        return;
                    }

                    const chatItems = snap.data().chatsData || [];

                    const tempData = await Promise.all(
                        chatItems.map(async (item) => {
                            if (!item.rid) return null;

                            try {
                                const userRef = doc(db, "users", item.rid);
                                const userSnap = await getDoc(userRef);

                                if (!userSnap.exists()) {
                                    console.warn("User not found:", item.rid);
                                    return null;
                                }

                                return {
                                    ...item,
                                    userData: userSnap.data()
                                };
                            } catch (err) {
                                console.error("Error fetching chat user:", err);
                                return null;
                            }
                        })
                    );

                    // Sort by latest message and filter out null values
                    const validChats = tempData
                        .filter(Boolean)
                        .sort((a, b) => b.updatedAt - a.updatedAt);

                    setChatData(validChats);
                } catch (error) {
                    console.error("Chat sync error:", error);
                    toast.error("Failed to sync chats");
                }
            },
            (error) => {
                console.error("Chat listener error:", error);
                toast.error("Failed to listen to chat updates");
            }
        );

        return () => unsubscribe();
    }, [userData]);

    const value = {
        userData,
        setUserData,
        chatData,
        setChatData,
        messagesId,
        setMessagesId,
        messages,
        setMessages,
        chatUser,
        setChatUser,
        chatVisible,
        setChatVisible,
        isLoading
    };

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
};

export default AppContextProvider;
