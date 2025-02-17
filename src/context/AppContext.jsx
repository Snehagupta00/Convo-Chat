import React, { createContext, useState, useEffect, useCallback } from "react";
import { auth, db } from "../config/firebase";
import {
    doc,
    getDoc,
    onSnapshot,
    updateDoc,
    setDoc,
    serverTimestamp,
    collection,
    query,
    where,
    getDocs
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

export const AppContext = createContext();

const AppContextProvider = ({ children }) => {
    const navigate = useNavigate();

    // User and Chat States
    const [userData, setUserData] = useState(null);
    const [chatData, setChatData] = useState([]);
    const [messagesId, setMessagesId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [chatUser, setChatUser] = useState(null);

    // UI States
    const [chatVisible, setChatVisible] = useState(window.innerWidth > 768);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const [isLoading, setIsLoading] = useState(true);
    const [onlineUsers, setOnlineUsers] = useState(new Set());

    // Handle window resize
    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth <= 768;
            setIsMobile(mobile);

            if (!mobile) {
                setChatVisible(true);
            } else if (!chatUser) {
                setChatVisible(false);
            }
        };

        // Set initial state
        handleResize();

        // Add resize listener with debounce
        let timeoutId;
        const debouncedResize = () => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(handleResize, 100);
        };

        window.addEventListener("resize", debouncedResize);
        return () => {
            window.removeEventListener("resize", debouncedResize);
            clearTimeout(timeoutId);
        };
    }, [chatUser]);

    // Update online status
    const updateOnlineStatus = useCallback(async (isOnline) => {
        if (!userData?.id) return;

        try {
            const userRef = doc(db, "users", userData.id);
            await updateDoc(userRef, {
                isOnline,
                lastSeen: serverTimestamp()
            });
        } catch (error) {
            console.error("Error updating online status:", error);
        }
    }, [userData?.id]);

    // Handle chat user selection
    const handleChatUserSelection = useCallback(async (selectedUser, messageThreadId) => {
        if (!selectedUser || !messageThreadId) {
            console.warn("Invalid chat user selection");
            return;
        }

        try {
            setChatUser({
                userData: {
                    id: selectedUser.id,
                    name: selectedUser.name,
                    avatar: selectedUser.avatar || "",
                    lastSeen: selectedUser.lastSeen || Date.now(),
                    isOnline: selectedUser.isOnline || false
                },
                messageId: messageThreadId
            });

            setMessagesId(messageThreadId);

            // Mark messages as read
            const messageRef = doc(db, "messages", messageThreadId);
            const messageSnap = await getDoc(messageRef);

            if (messageSnap.exists()) {
                const messageData = messageSnap.data();
                const updatedMessages = messageData.messages.map(msg =>
                    msg.senderId !== userData.id && !msg.read
                        ? { ...msg, read: true }
                        : msg
                );

                await updateDoc(messageRef, {
                    messages: updatedMessages,
                    lastRead: serverTimestamp()
                });
            }

            // Show chat on mobile
            if (isMobile) {
                setChatVisible(true);
            }
        } catch (error) {
            console.error("Error in chat selection:", error);
            toast.error("Failed to load chat");
        }
    }, [isMobile, userData?.id]);

    // Handle back to list
    const handleBackToList = useCallback(() => {
        if (isMobile) {
            setChatVisible(false);
        }
    }, [isMobile]);

    // Load user data
    const loadUserData = useCallback(async (uid) => {
        try {
            const userRef = doc(db, "users", uid);
            const userSnap = await getDoc(userRef);

            if (!userSnap.exists()) {
                const newUserData = {
                    id: uid,
                    createdAt: serverTimestamp(),
                    lastSeen: serverTimestamp(),
                    isOnline: true,
                    name: "User", // Default name
                    username: `user_${uid.slice(0, 5)}`,
                };
                await setDoc(userRef, newUserData);
                setUserData(newUserData);
                navigate("/profile");
                return;
            }

            const userInfo = userSnap.data();
            setUserData(userInfo);

            await updateDoc(userRef, {
                lastSeen: serverTimestamp(),
                isOnline: true
            });

            // Update chat user status if applicable
            if (chatUser?.userData?.id === uid) {
                setChatUser(prev => ({
                    ...prev,
                    userData: {
                        ...prev.userData,
                        lastSeen: new Date().toISOString(),
                        isOnline: true
                    }
                }));
            }

            // Navigation logic
            if (userInfo.avatar && userInfo.name) {
                if (window.location.pathname === "/") {
                    navigate("/chat");
                }
            } else {
                navigate("/profile");
            }
        } catch (error) {
            console.error("Error loading user data:", error);
            toast.error("Failed to load user data");
            setUserData(null);
            navigate("/");
        }
    }, [navigate, chatUser]);

    // Authentication state observer
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            setIsLoading(true);
            try {
                if (user) {
                    await loadUserData(user.uid);
                } else {
                    // Clear all states on logout
                    setUserData(null);
                    setChatData([]);
                    setMessages([]);
                    setChatUser(null);
                    setChatVisible(false);
                    navigate("/");
                }
            } catch (error) {
                console.error("Auth state error:", error);
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
                    const messageData = doc.data().messages || [];
                    setMessages([...messageData].reverse());

                    // Mark messages as read if chat is visible
                    if (chatVisible && chatUser) {
                        const unreadMessages = messageData.filter(
                            msg => msg.senderId !== userData?.id && !msg.read
                        );

                        if (unreadMessages.length > 0) {
                            const updatedMessages = messageData.map(msg =>
                                msg.senderId !== userData?.id && !msg.read
                                    ? { ...msg, read: true }
                                    : msg
                            );

                            updateDoc(doc.ref, {
                                messages: updatedMessages,
                                lastRead: serverTimestamp()
                            });
                        }
                    }
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
    }, [messagesId, chatVisible, chatUser, userData]);

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
                        await setDoc(chatRef, {
                            chatsData: [],
                            lastUpdated: serverTimestamp()
                        });
                        setChatData([]);
                        return;
                    }

                    const chatItems = snap.data().chatsData || [];

                    // Fetch user data for each chat
                    const tempData = await Promise.all(
                        chatItems.map(async (item) => {
                            if (!item.rid) return null;
                            try {
                                const userRef = doc(db, "users", item.rid);
                                const userSnap = await getDoc(userRef);
                                if (!userSnap.exists()) return null;

                                const userData = userSnap.data();
                                return {
                                    ...item,
                                    userData: {
                                        ...userData,
                                        lastSeen: userData.lastSeen?.toDate?.() || new Date(),
                                        isOnline: userData.isOnline || false
                                    },
                                    unreadCount: (item.messages || [])
                                        .filter(m => !m.read && m.senderId !== userData.id)
                                        .length
                                };
                            } catch (err) {
                                console.error("Error fetching chat user:", err);
                                return null;
                            }
                        })
                    );
                    const validChats = tempData
                        .filter(Boolean)
                        .sort((a, b) => {
                            const aTime = a.lastMessage?.timestamp || a.updatedAt || 0;
                            const bTime = b.lastMessage?.timestamp || b.updatedAt || 0;
                            return bTime - aTime;
                        });

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

    useEffect(() => {
        if (!userData?.id) return;
        const handleVisibilityChange = () => {
            updateOnlineStatus(!document.hidden);
        };
        const handleBeforeUnload = () => {
            updateOnlineStatus(false);
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        window.addEventListener("beforeunload", handleBeforeUnload);
        updateOnlineStatus(true);

        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            window.removeEventListener("beforeunload", handleBeforeUnload);
            updateOnlineStatus(false);
        };
    }, [userData?.id, updateOnlineStatus]);

    const contextValue = {
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
        handleChatUserSelection,
        handleBackToList,
        chatVisible,
        setChatVisible,
        isLoading,
        isMobile,
        onlineUsers,
        currentTime: new Date('2025-02-17T15:00:40Z'),
        currentUser: 'Sneha Gupta '
    };

    return (
        <AppContext.Provider value={contextValue}>
            {children}
        </AppContext.Provider>
    );
};

export default AppContextProvider;
