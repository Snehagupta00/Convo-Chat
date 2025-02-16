import React, { useEffect, useState } from 'react';
import "./ProfileUpdate.css";
import assets from "../../assets/assets";
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../../config/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import upload from '../../lib/upload';

const ProfileUpdate = () => {
    const navigate = useNavigate();
    const [image, setImage] = useState(null);
    const [name, setName] = useState('');
    const [bio, setBio] = useState('');
    const [uid, setUid] = useState('');
    const [prevImage, setPrevImage] = useState('');

    const handleProfileUpdate = async (event) => {
        event.preventDefault();

        try {
            if (!name.trim() || !bio.trim()) {
                toast.error("Name and bio cannot be empty!");
                return;
            }

            if (!prevImage && !image) {
                toast.error("Please upload an image!");
                return;
            }

            const docRef = doc(db, 'users', uid);

            let imgUrl = prevImage;
            if (image) {
                imgUrl = await upload(image);
                if (!imgUrl) {
                    toast.error("Failed to upload image. Try again!");
                    return;
                }
                setPrevImage(imgUrl);
            }

            await updateDoc(docRef, {
                name,
                bio,
                avatar: imgUrl,
            });

            toast.success("Profile updated successfully!");
        } catch (error) {
            console.error("Profile update error:", error);
            toast.error("Failed to update profile. Try again!");
        }
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setUid(user.uid);
                const docRef = doc(db, 'users', user.uid);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const userData = docSnap.data();
                    setName(userData?.name || '');
                    setBio(userData?.bio || '');
                    setPrevImage(userData?.avatar || '');
                }
            } else {
                navigate('/');
            }
        });

        return () => unsubscribe();
    }, [navigate]);

    const handleFileChange = (e) => {
        if (e.target.files.length > 0) {
            setImage(e.target.files[0]);
        }
    };

    return (
        <div className='profile'>
            <div className="profile-container">
                <form onSubmit={handleProfileUpdate}>
                    <h3>Profile Details</h3>
                    <label htmlFor="avatar">
                        <input
                            type="file"
                            id="avatar"
                            accept=".png, .jpg, .jpeg"
                            hidden
                            onChange={handleFileChange}
                        />
                        <img
                            src={image ? URL.createObjectURL(image) : prevImage || assets.avatar_icon}
                            alt="avatar"
                        />
                        Upload Profile Picture
                    </label>
                    <textarea
                        onChange={(e) => setBio(e.target.value)}
                        value={bio}
                        placeholder='Write Profile bio'
                        required
                    ></textarea>
                    <input
                        onChange={(e) => setName(e.target.value)}
                        value={name}
                        type="text"
                        placeholder="Your Name"
                        required
                    />
                    <button type="submit">Save</button>
                </form>
                <img
                    className='profilepic'
                    src={image ? URL.createObjectURL(image) : prevImage || assets.logo_icon}
                    alt="Profile preview"
                />
            </div>
        </div>
    );
};

export default ProfileUpdate;
