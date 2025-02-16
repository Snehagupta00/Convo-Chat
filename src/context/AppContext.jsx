import React, { createContext, useState, useEffect, useCallback } from "react";
import { auth, db } from "../config/firebase";
import { doc, getDoc, onSnapshot, updateDoc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

export const AppContext = createContext();

const AppContextProvider = ({ children }) => {
    const navigate = useNavigate();
    const [userData, setUserData] = useState(null);
    const [chatData, setChatData] = useState([]);
    const [messagesId, setMessagesId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [chatUser, setChatUser] = useState(null);
    const [chatVisible, setChatVisible] = useState(window.innerWidth > 768);
    const [isLoading, setIsLoading] = useState(true);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    // Handle window resize for mobile responsiveness
    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth <= 768;
            if (mobile !== isMobile) {
                setIsMobile(mobile);
                setChatVisible(!mobile);
            }
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [isMobile]);

    /**
     * Load user data from Firestore
     */
    const loadUserData = useCallback(async (uid) => {
        try {
            const userRef = doc(db, "users", uid);
            const userSnap = await getDoc(userRef);

            if (!userSnap.exists()) {
                const newUserData = {
                    id: uid,
                    createdAt: Date.now(),
                    lastSeen: Date.now(),
                };
                await setDoc(userRef, newUserData);
                setUserData(newUserData);
                navigate("/profile");
                return;
            }

            const userInfo = userSnap.data();
            setUserData(userInfo);

            await updateDoc(userRef, { lastSeen: Date.now() });

            // Update chat user last seen if applicable
            if (chatUser?.userData?.id === uid) {
                setChatUser((prev) => ({
                    ...prev,
                    userData: { ...prev.userData, lastSeen: Date.now() },
                }));
            }

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

    // Handle authentication state changes
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            setIsLoading(true);
            try {
                if (user) {
                    await loadUserData(user.uid);
                } else {
                    setUserData(null);
                    setChatData([]);
                    setMessages([]);
                    setChatUser(null);
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

    /**
     * Handle selecting a user for chat
     * @param {Object} selectedUser - The selected user's details
     * @param {string} messageThreadId - The message thread ID
     */
    const handleChatUserSelection = (selectedUser, messageThreadId) => {
        if (!selectedUser || !messageThreadId) {
            console.warn("Invalid chat user selection");
            return;
        }

        setChatUser({
            userData: {
                id: selectedUser.id,
                name: selectedUser.name,
                avatar: selectedUser.avatar || "",
            },
            messageId: messageThreadId,
        });

        setMessagesId(messageThreadId);

        // Adjust chat visibility for mobile users
        if (isMobile) {
            setChatVisible(true);
        }
    };

    // Listen for messages updates
    useEffect(() => {
        if (!messagesId) {
            setMessages([]);
            return;
        }

        const unsubscribe = onSnapshot(
            doc(db, "messages", messagesId),
            (doc) => {
                if (doc.exists()) {
                    setMessages([...doc.data().messages].reverse());
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

    // Listen for chat updates
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
                                return userSnap.exists()
                                    ? { ...item, userData: userSnap.data() }
                                    : null;
                            } catch (err) {
                                console.error("Error fetching chat user:", err);
                                return null;
                            }
                        })
                    );

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
        handleChatUserSelection,
        chatVisible,
        setChatVisible,
        isLoading,
        isMobile,
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export default AppContextProvider;
