import {
    doc,
    updateDoc,
    arrayUnion,
    getDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { compressImage } from '../utils/imageUtils';

/**
 * Custom error class for message operations
 */
class MessageServiceError extends Error {
    constructor(message, code) {
        super(message);
        this.name = 'MessageServiceError';
        this.code = code;
    }
}

/**
 * Constants for message service
 */
const MESSAGE_CONSTANTS = {
    MAX_TEXT_LENGTH: 30, // Maximum length for preview text
    MAX_RETRIES: 3,     // Maximum retries for updates
    RETRY_DELAY: 1000,  // Delay between retries (in milliseconds)
};

/**
 * Send a text message
 * @param {string} text - Message text
 * @param {string} messageId - ID of the message thread
 * @param {string} senderId - ID of the sender
 * @returns {Promise<void>}
 */
export const sendMessage = async (text, messageId, senderId) => {
    if (!text?.trim()) throw new MessageServiceError('Message text is required', 'INVALID_TEXT');
    if (!messageId) throw new MessageServiceError('Message ID is required', 'INVALID_MESSAGE_ID');
    if (!senderId) throw new MessageServiceError('Sender ID is required', 'INVALID_SENDER');

    try {
        const messageRef = doc(db, "messages", messageId);

        // Verify the message document exists
        const messageDoc = await getDoc(messageRef);
        if (!messageDoc.exists()) {
            throw new MessageServiceError('Message thread not found', 'NOT_FOUND');
        }

        const newMessage = {
            sId: senderId,
            text: text.trim(),
            createdAt: Date.now(),
            type: 'text',
            status: 'sent'
        };

        await updateDoc(messageRef, {
            messages: arrayUnion(newMessage)
        });

        console.log('Message sent successfully:', newMessage);
    } catch (error) {
        console.error('Error sending message:', {
            error,
            messageId,
            senderId,
            textLength: text.length
        });
        throw new MessageServiceError(
            error.message || 'Failed to send message',
            error.code || 'SEND_ERROR'
        );
    }
};

/**
 * Handle image upload and send image message
 * @param {File} file - Image file to upload
 * @param {string} messageId - ID of the message thread
 * @param {string} senderId - ID of the sender
 * @returns {Promise<string>} Compressed image data URL
 */
export const handleImageUpload = async (file, messageId, senderId) => {
    if (!file || !messageId || !senderId) {
        throw new MessageServiceError('Invalid image upload parameters', 'INVALID_PARAMS');
    }

    try {
        // Compress image
        const compressedImage = await compressImage(file, {
            maxWidth: 1200,
            maxHeight: 1200,
            quality: 0.8
        });

        // Update message thread
        const messageRef = doc(db, "messages", messageId);
        await updateDoc(messageRef, {
            messages: arrayUnion({
                sId: senderId,
                image: compressedImage,
                createdAt: Date.now(),
                type: 'image',
                status: 'sent'
            })
        });

        console.log('Image uploaded successfully:', compressedImage);
        return compressedImage;
    } catch (error) {
        console.error('Error uploading image:', error);
        throw new MessageServiceError('Failed to upload image', 'UPLOAD_ERROR');
    }
};

/**
 * Update last message preview and status
 * @param {string} lastMessage - Last message text
 * @param {string} messageId - ID of the message thread
 * @param {string} senderId - ID of the sender
 * @param {string} receiverId - ID of the receiver
 * @returns {Promise<void>}
 */
export const updateLastMessage = async (lastMessage, messageId, senderId, receiverId) => {
    if (!lastMessage) throw new MessageServiceError('Last message is required', 'INVALID_MESSAGE');
    if (!messageId) throw new MessageServiceError('Message ID is required', 'INVALID_MESSAGE_ID');
    if (!senderId) throw new MessageServiceError('Sender ID is required', 'INVALID_SENDER');
    if (!receiverId) throw new MessageServiceError('Receiver ID is required', 'INVALID_RECEIVER');

    console.log('Updating last message:', {
        messageId,
        senderId,
        receiverId,
        messagePreview: truncateMessage(lastMessage)
    });

    const userIDs = [senderId, receiverId];
    const timestamp = Date.now();

    try {
        await Promise.all(userIDs.map(async (userId) => {
            const userChatsRef = doc(db, "chats", userId);
            let retries = 0;

            while (retries < MESSAGE_CONSTANTS.MAX_RETRIES) {
                try {
                    const snapshot = await getDoc(userChatsRef);
                    if (!snapshot.exists()) {
                        console.warn(`No chats found for user: ${userId}`);
                        break;
                    }

                    const chatData = snapshot.data();
                    const chatIndex = chatData.chatsData.findIndex(chat => chat.messageId === messageId);

                    if (chatIndex === -1) {
                        console.warn(`Chat not found: ${messageId} for user: ${userId}`);
                        break;
                    }

                    const updatedChats = [...chatData.chatsData];
                    updatedChats[chatIndex] = {
                        ...updatedChats[chatIndex],
                        lastMessage: truncateMessage(lastMessage),
                        updatedAt: timestamp,
                        messageSeen: userId === senderId,  // Mark as seen only for sender
                        lastSenderId: senderId
                    };

                    await updateDoc(userChatsRef, { chatsData: updatedChats });
                    console.log(`Last message updated successfully for user ${userId}`);
                    break;
                } catch (error) {
                    retries++;
                    if (retries === MESSAGE_CONSTANTS.MAX_RETRIES) {
                        console.error(`Update failed after ${retries} retries:`, error);
                        throw new MessageServiceError('Failed to update last message', 'UPDATE_ERROR');
                    }
                    console.warn(`Retrying update (${retries}) for user ${userId}...`);
                    await new Promise(resolve => setTimeout(resolve, MESSAGE_CONSTANTS.RETRY_DELAY * retries));
                }
            }
        }));
    } catch (error) {
        console.error('Error updating last message:', {
            error,
            messageId,
            senderId,
            receiverId
        });
        throw new MessageServiceError('Failed to update last message', 'UPDATE_ERROR');
    }
};

/**
 * Truncate message text for preview
 * @param {string} message - Message to truncate
 * @returns {string} Truncated message
 */
const truncateMessage = (message) => {
    if (!message) return '';
    return message.length > MESSAGE_CONSTANTS.MAX_TEXT_LENGTH
        ? `${message.slice(0, MESSAGE_CONSTANTS.MAX_TEXT_LENGTH)}...`
        : message;
};

export default {
    sendMessage,
    handleImageUpload,
    updateLastMessage
};
