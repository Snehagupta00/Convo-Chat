// Import the necessary functions from the SDKs
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, sendPasswordResetEmail } from "firebase/auth";
import { getFirestore, setDoc, doc, collection, getDocs, query, where } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
import { toast } from "react-toastify";

// Firebase configuration for the new project
const firebaseConfig = {
    apiKey: "AIzaSyC20XR5oNmBYDnVjITGcMhhdToKdEEGj2M",
    authDomain: "convo2-2.firebaseapp.com",
    projectId: "convo2-2",
    storageBucket: "convo2-2.firebasestorage.app",
    messagingSenderId: "110954263927",
    appId: "1:110954263927:web:e9b2b823db93d9cc4c1d72",
    measurementId: "G-S5P5HDC0QS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

const signup = async (username, email, password) => {
    if (!username || !email || !password) {
        toast.error("All fields are required!");
        return;
    }

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        await setDoc(doc(db, "users", user.uid), {
            id: user.uid,
            username: username.toLowerCase(),
            email,
            name: "",
            avatar: "",
            bio: "Hey there! I am using Convo",
            lastSeen: new Date(),
        });

        await setDoc(doc(db, "chats", user.uid), { chatsData: [] });

        console.log("User created:", user);
    } catch (error) {
        console.error("Signup error:", error);
        const errorMessage = error.message.split('/')[1].split('-').join(' ');
        toast.error(errorMessage);
    }
};

const login = async (email, password) => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log("User logged in:", userCredential.user);
    } catch (error) {
        console.error("Login error:", error);
        const errorMessage = error.message.split('/')[1].split('-').join(' ');
        toast.error(errorMessage);
    }
};

const logout = async () => {
    try {
        await signOut(auth);
        console.log("User logged out");
    } catch (error) {
        console.error("Logout error:", error);
        toast.error(error.message);
    }
};

const resetPass = async (email) => {
    if (!email) {
        toast.error("Email is required");
        return null;
    }
    try {
        const userRef = collection(db, "users");
        const q = query(userRef, where("email", "==", email));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            await sendPasswordResetEmail(auth, email);
            toast.success("Password reset email sent!");
        } else {
            toast.error("Email does not exist in the database");
        }
    } catch (error) {
        console.error("Reset password error", error);
        toast.error(error.message);
    }
};

export { signup, login, logout, auth, db, resetPass };
