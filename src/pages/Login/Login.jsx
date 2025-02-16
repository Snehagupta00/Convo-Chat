import React, { useState } from 'react';
import './Login.css';
import assets from '../../assets/assets';
import { signup, login, logout, resetPass } from '../../config/firebase';
import { toast } from 'react-toastify';

const Login = () => {
    const [currState, setCurrState] = useState('Sign Up');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [termsAccepted, setTermsAccepted] = useState(false);

    const handleResetPassword = async () => {
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
        
        if (currState === 'Sign Up' && !termsAccepted) {
            toast.error('Please accept the terms and conditions');
            return;
        }

        setLoading(true);

        try {
            if (currState === 'Sign Up') {
                if (password.length < 6) {
                    throw new Error('Password must be at least 6 characters long');
                }
                await signup(username.trim(), email.trim(), password);
                toast.success('Account created successfully!');
            } else {
                await login(email.trim(), password);
                toast.success('Logged in successfully!');
            }
            setUsername('');
            setEmail('');
            setPassword('');
            setTermsAccepted(false);
        } catch (error) {
            toast.error(`${currState} failed: ${error?.message || 'Something went wrong'}`);
        } finally {
            setLoading(false);
        }
    };

    const toggleState = () => {
        setCurrState(currState === 'Sign Up' ? 'Login' : 'Sign Up');
        setUsername('');
        setEmail('');
        setPassword('');
        setTermsAccepted(false);
    };

    return (
        <div className="login">
            <img src={assets.logo_big} alt="Chat Application Logo" className="login-logo" />
            <div className="login-form-container">
                <form onSubmit={onSubmitHandler} className="login-form">
                    <h2>{currState}</h2>

                    {currState === 'Sign Up' && (
                        <div className="form-group">
                            <input
                                onChange={(e) => setUsername(e.target.value)}
                                value={username}
                                type="text"
                                placeholder="Username"
                                className="form-input"
                                required
                                minLength={3}
                                maxLength={30}
                            />
                        </div>
                    )}

                    <div className="form-group">
                        <input
                            onChange={(e) => setEmail(e.target.value)}
                            value={email}
                            type="email"
                            placeholder="Email Address"
                            className="form-input"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <input
                            onChange={(e) => setPassword(e.target.value)}
                            value={password}
                            type="password"
                            placeholder="Password"
                            className="form-input"
                            required
                            minLength={6}
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
                            />
                            <label htmlFor="terms">
                                I agree to the <span>Terms</span>, <span>Data Policy</span>, and <span>Cookies Policy</span>
                            </label>
                        </div>
                    )}

                    <button 
                        type="submit" 
                        disabled={loading || (currState === 'Sign Up' && !termsAccepted)}
                        className="login-button"
                    >
                        {loading ? 'Processing...' : (currState === "Sign Up" ? "Create account" : "Login now")}
                    </button>

                    <div className="login-forgot">
                        <p className="login-toggle">
                            {currState === 'Login' ? (
                                <>
                                    Don't have an account?{' '}
                                    <span onClick={toggleState} role="button" tabIndex={0}>
                                        Sign Up Here
                                    </span>
                                </>
                            ) : (
                                <>
                                    Already have an account?{' '}
                                    <span onClick={toggleState} role="button" tabIndex={0}>
                                        Login Here
                                    </span>
                                </>
                            )}
                        </p>
                        {currState === 'Login' && (
                            <p className="login-toggle">
                                Forgot Password?{' '}
                                <span 
                                    onClick={handleResetPassword}
                                    role="button"
                                    tabIndex={0}
                                    disabled={loading}
                                >
                                    Reset Password
                                </span>
                            </p>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;