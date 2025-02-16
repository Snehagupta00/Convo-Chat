import {
    collection,
    query,
    where,
    getDocs,
    doc,
    getDoc,
    setDoc,
    updateDoc,
    arrayUnion
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { toast } from 'react-toastify';

/**
 * Search for users by username
 * @param {string} searchTerm - The username to search for
 * @param {string} currentUserId - The ID of the current user to exclude from results
 */
export const searchUsers = async (searchTerm, currentUserId) => {
    try {
        const usersRef = collection(db, "users");
        const q = query(
            usersRef,
            where("username", ">=", searchTerm.toLowerCase()),
            where("username", "<=", searchTerm.toLowerCase() + '\uf8ff')
        );

        const querySnapshot = await getDocs(q);
        const users = [];

        querySnapshot.forEach((doc) => {
            const userData = doc.data();
            // Exclude current user from results
            if (userData.id !== currentUserId) {
                users.push(userData);
            }
        });

        return users;
    } catch (error) {
        console.error("Error searching users:", error);
        throw new Error('Failed to search users');
    }
};

/**
 * Add a new chat between two users
 * @param {Object} currentUser - The current user's data
 * @param {Object} selectedUser - The selected user's data to chat with
 */
export const addNewChat = async (currentUser, selectedUser) => {
    try {
        // Check if chat already exists
        const existingChat = await checkExistingChat(currentUser.id, selectedUser.id);
        if (existingChat) {
            toast.info('Chat already exists!');
            return existingChat;
        }

        // Create new message document
        const messagesRef = collection(db, "messages");
        const newMessageDoc = doc(messagesRef);
        await setDoc(newMessageDoc, {
            createdAt: new Date(),
            messages: []
        });

        const timestamp = Date.now();
        const chatData = {
            messageId: newMessageDoc.id,
            lastMessage: "",
            updatedAt: timestamp,
            messageSeen: true
        };

        // Update current user's chats
        await updateUserChats(
            currentUser.id,
            {
                ...chatData,
                rid: selectedUser.id,
                userData: {
                    id: selectedUser.id,
                    name: selectedUser.name,
                    avatar: selectedUser.avatar
                }
            }
        );

        // Update selected user's chats
        await updateUserChats(
            selectedUser.id,
            {
                ...chatData,
                rid: currentUser.id,
                userData: {
                    id: currentUser.id,
                    name: currentUser.name,
                    avatar: currentUser.avatar
                }
            }
        );

        return {
            messageId: newMessageDoc.id,
            userData: selectedUser
        };
    } catch (error) {
        console.error("Error adding new chat:", error);
        throw new Error('Failed to create new chat');
    }
};

/**
 * Check if a chat already exists between two users
 * @param {string} userId1 - First user's ID
 * @param {string} userId2 - Second user's ID
 */
const checkExistingChat = async (userId1, userId2) => {
    try {
        const userChatsRef = doc(db, "chats", userId1);
        const userChatsSnap = await getDoc(userChatsRef);

        if (userChatsSnap.exists()) {
            const userChats = userChatsSnap.data().chatsData || [];
            const existingChat = userChats.find(chat => chat.rid === userId2);
            return existingChat || null;
        }

        return null;
    } catch (error) {
        console.error("Error checking existing chat:", error);
        return null;
    }
};

/**
 * Update a user's chats collection
 * @param {string} userId - The user's ID
 * @param {Object} chatData - The chat data to add
 */
const updateUserChats = async (userId, chatData) => {
    try {
        const userChatsRef = doc(db, "chats", userId);
        const userChatsSnap = await getDoc(userChatsRef);

        if (userChatsSnap.exists()) {
            // Update existing chats document
            await updateDoc(userChatsRef, {
                chatsData: arrayUnion(chatData)
            });
        } else {
            // Create new chats document
            await setDoc(userChatsRef, {
                chatsData: [chatData]
            });
        }
    } catch (error) {
        console.error("Error updating user chats:", error);
        throw new Error('Failed to update user chats');
    }
};

/**
 * Delete a chat between users
 * @param {string} currentUserId - Current user's ID
 * @param {string} chatId - ID of the chat to delete
 */
export const deleteChat = async (currentUserId, chatId) => {
    try {
        const userChatsRef = doc(db, "chats", currentUserId);
        const userChatsSnap = await getDoc(userChatsRef);

        if (userChatsSnap.exists()) {
            const userChats = userChatsSnap.data().chatsData || [];
            const updatedChats = userChats.filter(chat => chat.messageId !== chatId);

            await updateDoc(userChatsRef, {
                chatsData: updatedChats
            });

            return true;
        }

        return false;
    } catch (error) {
        console.error("Error deleting chat:", error);
        throw new Error('Failed to delete chat');
    }
};

/**
 * Get user's chat list
 * @param {string} userId - The user's ID
 */
export const getUserChats = async (userId) => {
    try {
        const userChatsRef = doc(db, "chats", userId);
        const userChatsSnap = await getDoc(userChatsRef);

        if (userChatsSnap.exists()) {
            const chats = userChatsSnap.data().chatsData || [];
            return chats.sort((a, b) => b.updatedAt - a.updatedAt);
        }

        return [];
    } catch (error) {
        console.error("Error getting user chats:", error);
        throw new Error('Failed to get user chats');
    }
};
