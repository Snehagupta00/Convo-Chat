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
    const [uploadProgress, setUploadProgress] = useState(0);

    const handleProfileUpdate = async (event) => {
        event.preventDefault();
        setIsLoading(true);
        setUploadProgress(0);

        try {
            if (!name.trim() || !bio.trim()) {
                toast.error("Name and bio cannot be empty!");
                setIsLoading(false);
                return;
            }

            if (!prevImage && !image) {
                toast.error("Please upload an image!");
                setIsLoading(false);
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
                    imgUrl = await upload(image, {
                        onProgress: (progress) => setUploadProgress(progress),
                        onError: (error) => toast.error(error.message),
                    });

                    if (!imgUrl) {
                        throw new Error('Image upload failed');
                    }
                } catch (error) {
                    console.error("Image upload error:", error);
                    toast.error(error.message || "Failed to upload image. Please try again.");
                    setIsLoading(false);
                    return;
                }
            }

            await updateDoc(docRef, {
                name: name.trim(),
                bio: bio.trim(),
                avatar: imgUrl,
                updatedAt: new Date().toISOString(),
                isProfileComplete: true
            });

            setPrevImage(imgUrl);
            toast.success("Profile updated successfully!");

            setTimeout(() => {
                navigate('/chat');
            }, 1000);

        } catch (error) {
            console.error("Profile update error:", error);
            toast.error(error.message || "Failed to update profile. Please try again.");
        } finally {
            setIsLoading(false);
            setUploadProgress(0);
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
            if (!file.type.match('image.*')) {
                toast.error('Please upload an image file');
                return;
            }
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
        <div className='profile-update'>
            <div className="profile-update__container">
                <form onSubmit={handleProfileUpdate} className="profile-update__form">
                    <h3 className="profile-update__title">Profile Details</h3>

                    <label htmlFor="avatar" className="profile-update__avatar-label">
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
                            className="profile-update__avatar-preview"
                        />
                        <span className="profile-update__avatar-text">Upload Profile Picture</span>
                    </label>

                    {uploadProgress > 0 && (
                        <div className="upload-progress">
                            Uploading... {uploadProgress}%
                        </div>
                    )}

                    <textarea
                        onChange={(e) => setBio(e.target.value)}
                        value={bio}
                        placeholder='Write Profile bio'
                        required
                        maxLength={500}
                        disabled={isLoading}
                        className="profile-update__textarea"
                    ></textarea>

                    <input
                        onChange={(e) => setName(e.target.value)}
                        value={name}
                        type="text"
                        placeholder="Your Name"
                        required
                        maxLength={100}
                        disabled={isLoading}
                        className="profile-update__input"
                    />

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="profile-update__button"
                    >
                        {isLoading ? 'Saving...' : 'Save'}
                    </button>
                </form>

                <img
                    className="profile-update__preview"
                    src={image ? URL.createObjectURL(image) : prevImage || assets.logo_icon}
                    alt="Profile preview"
                    onError={handleImageError}
                />
            </div>
        </div>
    );
};

export default ProfileUpdate;
