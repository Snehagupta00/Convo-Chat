import React, { useState, useCallback } from 'react';
import './Login.css';
import assets from '../../assets/assets';
import { signup, login, resetPass } from '../../config/firebase';
import { toast } from 'react-toastify';

const Login = () => {
    const [currState, setCurrState] = useState('Sign Up');
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
    });
    const [loading, setLoading] = useState(false);
    const [termsAccepted, setTermsAccepted] = useState(false);

    const handleInputChange = useCallback((e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    }, []);

    const validateForm = () => {
        const { email, password, username } = formData;

        if (!email.trim()) {
            toast.error('Please enter your email address');
            return false;
        }

        if (currState === 'Sign Up') {
            if (!username.trim() || username.length < 3) {
                toast.error('Username must be at least 3 characters long');
                return false;
            }
            if (!termsAccepted) {
                toast.error('Please accept the terms and conditions');
                return false;
            }
        }

        if (password.length < 6) {
            toast.error('Password must be at least 6 characters long');
            return false;
        }

        return true;
    };

    const handleResetPassword = async () => {
        const { email } = formData;
        if (!email.trim()) {
            toast.error('Please enter your email address');
            return;
        }

        try {
            setLoading(true);
            await resetPass(email);
            toast.success('Password reset link sent to your email!');
        } catch (error) {
            toast.error(`Password reset failed: ${error?.message || 'Something went wrong'}`);
        } finally {
            setLoading(false);
        }
    };

    const onSubmitHandler = async (event) => {
        event.preventDefault();

        if (!validateForm()) return;

        const { email, password, username } = formData;
        setLoading(true);

        try {
            if (currState === 'Sign Up') {
                await signup(username.trim(), email.trim(), password);
                toast.success('Account created successfully!');
            } else {
                await login(email.trim(), password);
                toast.success('Logged in successfully!');
            }
            setFormData({ username: '', email: '', password: '' });
            setTermsAccepted(false);
        } catch (error) {
            toast.error(`${currState} failed: ${error?.message || 'Something went wrong'}`);
        } finally {
            setLoading(false);
        }
    };

    const toggleState = () => {
        setCurrState(prev => prev === 'Sign Up' ? 'Login' : 'Sign Up');
        setFormData({ username: '', email: '', password: '' });
        setTermsAccepted(false);
    };

    return (
        <div className="login">
            <img src={assets.logo_big} alt="Chat Application Logo" className="login-logo" />
            <div className="login-form-container">
                <form onSubmit={onSubmitHandler} className="login-form" noValidate>
                    <h1 className="login-title">{currState}</h1>

                    {currState === 'Sign Up' && (
                        <div className="form-group">
                            <label htmlFor="username" className="visually-hidden">Username</label>
                            <input
                                id="username"
                                name="username"
                                onChange={handleInputChange}
                                value={formData.username}
                                type="text"
                                placeholder="Username"
                                className="form-input"
                                required
                                minLength={3}
                                maxLength={30}
                                aria-required="true"
                            />
                        </div>
                    )}

                    <div className="form-group">
                        <label htmlFor="email" className="visually-hidden">Email Address</label>
                        <input
                            id="email"
                            name="email"
                            onChange={handleInputChange}
                            value={formData.email}
                            type="email"
                            placeholder="Email Address"
                            className="form-input"
                            required
                            aria-required="true"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password" className="visually-hidden">Password</label>
                        <input
                            id="password"
                            name="password"
                            onChange={handleInputChange}
                            value={formData.password}
                            type="password"
                            placeholder="Password"
                            className="form-input"
                            required
                            minLength={6}
                            aria-required="true"
                        />
                    </div>

                    {currState === 'Sign Up' && (
                        <div className="login-term">
                            <input
                                type="checkbox"
                                id="terms"
                                checked={termsAccepted}
                                onChange={(e) => setTermsAccepted(e.target.checked)}
                                required
                                aria-required="true"
                            />
                            <label htmlFor="terms">
                                I agree to the <button type="button" className="text-button">Terms</button>,{' '}
                                <button type="button" className="text-button">Data Policy</button>, and{' '}
                                <button type="button" className="text-button">Cookies Policy</button>
                            </label>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading || (currState === 'Sign Up' && !termsAccepted)}
                        className="login-button"
                        aria-busy={loading}
                    >
                        {loading ? 'Processing...' : (currState === "Sign Up" ? "Create account" : "Login now")}
                    </button>

                    <div className="login-forgot">
                        <p className="login-toggle">
                            {currState === 'Login' ? (
                                <>
                                    Don't have an account?{' '}
                                    <button type="button" onClick={toggleState} className="text-button">
                                        Sign Up Here
                                    </button>
                                </>
                            ) : (
                                <>
                                    Already have an account?{' '}
                                    <button type="button" onClick={toggleState} className="text-button">
                                        Login Here
                                    </button>
                                </>
                            )}
                        </p>
                        {currState === 'Login' && (
                            <p className="login-toggle">
                                Forgot Password?{' '}
                                <button
                                    type="button"
                                    onClick={handleResetPassword}
                                    className="text-button"
                                    disabled={loading}
                                >
                                    Reset Password
                                </button>
                            </p>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;
