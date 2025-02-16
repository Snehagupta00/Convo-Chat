import React, { useContext, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import Login from './pages/Login/Login';
import Chat from './pages/Chat/Chat';
import ProfileUpdate from './pages/ProfileUpdate/ProfileUpdate';
import { ToastContainer } from 'react-toastify';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './config/firebase';
import { AppContext } from './context/AppContext';
import ImageViewer from '../src/components/ImageViewer/ImageViewer';


const App = () => {
    const navigate = useNavigate();
    const { setUserData } = useContext(AppContext);

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
                        setUserData({ uid: user.uid });
                        navigate('/profile');
                    }
                } catch (error) {
                    console.error("Error loading user data:", error);
                    navigate('/');
                }
            } else {
                setUserData(null);
                navigate('/');
            }
        });

        return () => unsubscribe();
    }, [navigate, setUserData]);

    return (
        <>
            <ToastContainer />
            <Routes>
                <Route path='/' element={<Login />} />
                <Route path='/chat' element={<Chat />} />
                <Route path='/profile' element={<ProfileUpdate />} />
                <Route path='/image-viewer' element={<ImageViewer />} />
            </Routes>
        </>
    );
};

export default App;
