import React, { useEffect, useState, useCallback } from 'react';
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
    const [isLoading, setIsLoading] = useState(false);

    const handleProfileUpdate = async (event) => {
        event.preventDefault();
        setIsLoading(true);

        try {
            if (!name.trim() || !bio.trim()) {
                toast.error("Name and bio cannot be empty!");
                return;
            }

            if (!prevImage && !image) {
                toast.error("Please upload an image!");
                return;
            }

            if (!uid) {
                toast.error("User not authenticated!");
                navigate('/');
                return;
            }

            const docRef = doc(db, 'users', uid);

            let imgUrl = prevImage;
            if (image) {
                try {
                    imgUrl = await upload(image);
                    if (!imgUrl) {
                        throw new Error('Image upload failed');
                    }
                } catch (error) {
                    console.error("Image upload error:", error);
                    toast.error("Failed to upload image. Try again!");
                    return;
                }
            }

            await updateDoc(docRef, {
                name: name.trim(),
                bio: bio.trim(),
                avatar: imgUrl,
                updatedAt: new Date().toISOString(),
                isProfileComplete: true  // Add this flag
            });

            setPrevImage(imgUrl);
            toast.success("Profile updated successfully!");
            
            // Add a small delay before navigation to ensure the toast is visible
            setTimeout(() => {
                navigate('/chat');  // Navigate to chat page after successful update
            }, 1000);

        } catch (error) {
            console.error("Profile update error:", error);
            toast.error("Failed to update profile. Try again!");
        } finally {
            setIsLoading(false);
        }
    };

    const fetchUserData = useCallback(async (userId) => {
        try {
            const docRef = doc(db, 'users', userId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const userData = docSnap.data();
                setName(userData?.name || '');
                setBio(userData?.bio || '');
                setPrevImage(userData?.avatar || '');
                
                // If profile is already complete, redirect to chat
                if (userData?.isProfileComplete) {
                    navigate('/chat');
                }
            }
        } catch (error) {
            console.error("Error fetching user data:", error);
            toast.error("Failed to load profile data");
        }
    }, [navigate]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setUid(user.uid);
                fetchUserData(user.uid);
            } else {
                navigate('/');
            }
        });

        return () => unsubscribe();
    }, [navigate, fetchUserData]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file type
            if (!file.type.match('image.*')) {
                toast.error('Please upload an image file');
                return;
            }
            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                toast.error('Image size should be less than 5MB');
                return;
            }
            setImage(file);
        }
    };

    const handleImageError = (e) => {
        e.target.src = assets.avatar_icon;
    };

    return (
        <div className='profile'>
            <div className="profile-container">
                <form onSubmit={handleProfileUpdate}>
                    <h3>Profile Details</h3>
                    <label htmlFor="avatar" className="avatar-label">
                        <input
                            type="file"
                            id="avatar"
                            accept="image/*"
                            hidden
                            onChange={handleFileChange}
                            disabled={isLoading}
                        />
                        <img
                            src={image ? URL.createObjectURL(image) : prevImage || assets.avatar_icon}
                            alt="avatar"
                            onError={handleImageError}
                            className="avatar-preview"
                        />
                        <span>Upload Profile Picture</span>
                    </label>
                    <textarea
                        onChange={(e) => setBio(e.target.value)}
                        value={bio}
                        placeholder='Write Profile bio'
                        required
                        maxLength={500}
                        disabled={isLoading}
                    ></textarea>
                    <input
                        onChange={(e) => setName(e.target.value)}
                        value={name}
                        type="text"
                        placeholder="Your Name"
                        required
                        maxLength={100}
                        disabled={isLoading}
                    />
                    <button type="submit" disabled={isLoading}>
                        {isLoading ? 'Saving...' : 'Save'}
                    </button>
                </form>
                <img
                    className='profilepic'
                    src={image ? URL.createObjectURL(image) : prevImage || assets.logo_icon}
                    alt="Profile preview"
                    onError={handleImageError}
                />
            </div>
        </div>
    );
};

export default ProfileUpdate;