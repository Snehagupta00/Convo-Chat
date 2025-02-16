import { 
    doc, 
    updateDoc, 
    arrayUnion, 
    getDoc 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { compressImage } from '../utils/imageUtils';

export const sendMessage = async (text, messageId, senderId) => {
    if (!messageId || !senderId) throw new Error('Invalid parameters');

    const messageRef = doc(db, "messages", messageId);
    await updateDoc(messageRef, {
        messages: arrayUnion({
            sId: senderId,
            text,
            createdAt: new Date()
        })
    });
};

export const handleImageUpload = async (file, messageId, senderId) => {
    const compressedImage = await compressImage(file);
    const messageRef = doc(db, "messages", messageId);
    
    await updateDoc(messageRef, {
        messages: arrayUnion({
            sId: senderId,
            image: compressedImage,
            createdAt: new Date()
        })
    });

    return compressedImage;
};

export const updateLastMessage = async (lastMessage, messageId, senderId, receiverId) => {
    const userIDs = [senderId, receiverId];
    
    for (const id of userIDs) {
        const userChatsRef = doc(db, "chats", id);
        const userChatsSnapshot = await getDoc(userChatsRef);

        if (userChatsSnapshot.exists()) {
            const userChatData = userChatsSnapshot.data();
            const chatIndex = userChatData.chatsData.findIndex(
                chat => chat.messageId === messageId
            );

            if (chatIndex !== -1) {
                const updatedChats = [...userChatData.chatsData];
                updatedChats[chatIndex] = {
                    ...updatedChats[chatIndex],
                    lastMessage: lastMessage.slice(0, 30),
                    updatedAt: Date.now(),
                    messageSeen: id === senderId
                };

                await updateDoc(userChatsRef, { chatsData: updatedChats });
            }
        }
    }
};