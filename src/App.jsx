import React, { useContext, useEffect, useState } from 'react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import Login from './pages/Login/Login';
import Chat from './pages/Chat/Chat';
import ProfileUpdate from './pages/ProfileUpdate/ProfileUpdate';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './config/firebase';
import { AppContext } from './context/AppContext';
import ImageViewer from './components/ImageViewer/ImageViewer';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import "./App.css";

const App = () => {
    const navigate = useNavigate();
    const { setUserData, userData } = useContext(AppContext);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                try {
                    const userRef = doc(db, "users", user.uid);
                    const userSnap = await getDoc(userRef);

                    if (userSnap.exists()) {
                        const userInfo = userSnap.data();
                        setUserData(userInfo);
                        if (userInfo.avatar && userInfo.name) {
                            navigate('/chat');
                        } else {
                            navigate('/profile');
                        }
                    } else {
                        setUserData({ id: user.uid });
                        navigate('/profile');
                    }
                } catch (error) {
                    console.error("Error loading user data:", error);
                    setUserData(null);
                    navigate('/');
                }
            } else {
                setUserData(null);
                navigate('/');
            }
        });

        return () => unsubscribe();
    }, [navigate, setUserData]);

    useEffect(() => {
        const timeout = setTimeout(() => setIsLoading(false), 1000);
        return () => clearTimeout(timeout);
    }, []);

    if (isLoading) {
        return <div className="loading">Loading...</div>;
    }

    return (
        <>
            <ToastContainer
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="dark"
            />
            <Routes>
                <Route
                    path="/"
                    element={
                        userData ? <Navigate to="/chat" replace /> : <Login />
                    }
                />
                <Route
                    path="/chat"
                    element={
                        <ProtectedRoute>
                            <Chat />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/profile"
                    element={
                        <ProtectedRoute>
                            <ProfileUpdate />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/image-viewer"
                    element={
                        <ProtectedRoute>
                            <ImageViewer />
                        </ProtectedRoute>
                    }
                />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </>
    );
};

export default App;
