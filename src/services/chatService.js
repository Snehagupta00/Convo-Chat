import {
    collection,
    query,
    where,
    getDocs,
    doc,
    getDoc,
    setDoc,
    updateDoc,
    arrayUnion,
    serverTimestamp,
    writeBatch
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { toast } from 'react-toastify';

/**
 * Error class for chat operations
 */
class ChatServiceError extends Error {
    constructor(message, code) {
        super(message);
        this.name = 'ChatServiceError';
        this.code = code;
    }
}

/**
 * Search for users by username
 * @param {string} searchTerm - The username to search for
 * @param {string} currentUserId - The ID of the current user to exclude from results
 * @returns {Promise<Array>} Array of matching users
 */
export const searchUsers = async (searchTerm, currentUserId) => {
    if (!searchTerm || !currentUserId) {
        throw new ChatServiceError('Invalid search parameters', 'INVALID_PARAMS');
    }

    try {
        const normalizedTerm = searchTerm.toLowerCase().trim();
        const usersRef = collection(db, "users");
        const q = query(
            usersRef,
            where("username", ">=", normalizedTerm),
            where("username", "<=", normalizedTerm + '\uf8ff')
        );

        const querySnapshot = await getDocs(q);
        return querySnapshot.docs
            .map(doc => doc.data())
            .filter(userData => userData.id !== currentUserId);
    } catch (error) {
        console.error("Error searching users:", error);
        throw new ChatServiceError('Failed to search users', 'SEARCH_ERROR');
    }
};

/**
 * Add a new chat between two users
 * @param {Object} currentUser - The current user's data
 * @param {Object} selectedUser - The selected user's data to chat with
 * @returns {Promise<Object>} New chat data
 */
export const addNewChat = async (currentUser, selectedUser) => {
    if (!currentUser?.id || !selectedUser?.id) {
        throw new ChatServiceError('Invalid user data', 'INVALID_USER_DATA');
    }

    try {
        // Check existing chat
        const existingChat = await checkExistingChat(currentUser.id, selectedUser.id);
        if (existingChat) {
            toast.info('Chat already exists!');
            return existingChat;
        }

        const batch = writeBatch(db);

        // Create messages document
        const messagesRef = doc(collection(db, "messages"));
        batch.set(messagesRef, {
            createdAt: serverTimestamp(),
            messages: []
        });

        const chatData = createChatData(messagesRef.id);

        // Update both users' chats
        await updateBothUsersChats(
            batch,
            currentUser,
            selectedUser,
            chatData
        );

        await batch.commit();

        return {
            messageId: messagesRef.id,
            userData: selectedUser
        };
    } catch (error) {
        console.error("Error adding new chat:", error);
        throw new ChatServiceError('Failed to create new chat', 'CREATE_CHAT_ERROR');
    }
};

/**
 * Create base chat data object
 * @param {string} messageId - ID of the messages document
 * @returns {Object} Base chat data
 */
const createChatData = (messageId) => ({
    messageId,
    lastMessage: "",
    updatedAt: Date.now(),
    messageSeen: true
});

/**
 * Update both users' chat collections
 * @param {WriteBatch} batch - Firestore write batch
 * @param {Object} user1 - First user
 * @param {Object} user2 - Second user
 * @param {Object} chatData - Base chat data
 */
const updateBothUsersChats = async (batch, user1, user2, chatData) => {
    const user1ChatData = {
        ...chatData,
        rid: user2.id,
        userData: {
            id: user2.id,
            name: user2.name,
            avatar: user2.avatar
        }
    };

    const user2ChatData = {
        ...chatData,
        rid: user1.id,
        userData: {
            id: user1.id,
            name: user1.name,
            avatar: user1.avatar
        }
    };

    await Promise.all([
        updateUserChatsInBatch(batch, user1.id, user1ChatData),
        updateUserChatsInBatch(batch, user2.id, user2ChatData)
    ]);
};

/**
 * Check if a chat already exists between two users
 * @param {string} userId1 - First user's ID
 * @param {string} userId2 - Second user's ID
 * @returns {Promise<Object|null>} Existing chat data or null
 */
const checkExistingChat = async (userId1, userId2) => {
    try {
        const userChatsRef = doc(db, "chats", userId1);
        const userChatsSnap = await getDoc(userChatsRef);

        if (userChatsSnap.exists()) {
            const userChats = userChatsSnap.data().chatsData || [];
            return userChats.find(chat => chat.rid === userId2) || null;
        }

        return null;
    } catch (error) {
        console.error("Error checking existing chat:", error);
        return null;
    }
};

/**
 * Update a user's chats in batch
 * @param {WriteBatch} batch - Firestore write batch
 * @param {string} userId - User's ID
 * @param {Object} chatData - Chat data to add
 */
const updateUserChatsInBatch = async (batch, userId, chatData) => {
    const userChatsRef = doc(db, "chats", userId);
    const userChatsSnap = await getDoc(userChatsRef);

    if (userChatsSnap.exists()) {
        batch.update(userChatsRef, {
            chatsData: arrayUnion(chatData)
        });
    } else {
        batch.set(userChatsRef, {
            chatsData: [chatData]
        });
    }
};

/**
 * Delete a chat between users
 * @param {string} currentUserId - Current user's ID
 * @param {string} chatId - ID of the chat to delete
 * @returns {Promise<boolean>} Success status
 */
export const deleteChat = async (currentUserId, chatId) => {
    if (!currentUserId || !chatId) {
        throw new ChatServiceError('Invalid deletion parameters', 'INVALID_PARAMS');
    }

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
        throw new ChatServiceError('Failed to delete chat', 'DELETE_ERROR');
    }
};

/**
 * Get user's chat list
 * @param {string} userId - The user's ID
 * @returns {Promise<Array>} Sorted array of user's chats
 */
export const getUserChats = async (userId) => {
    if (!userId) {
        throw new ChatServiceError('Invalid user ID', 'INVALID_USER_ID');
    }

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
        throw new ChatServiceError('Failed to get user chats', 'GET_CHATS_ERROR');
    }
};

export default {
    searchUsers,
    addNewChat,
    deleteChat,
    getUserChats
};
