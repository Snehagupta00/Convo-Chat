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

    const onSubmitHandler = async (event) => {
        event.preventDefault();
        setLoading(true);

        try {
            if (currState === 'Sign Up') {
                await signup(username, email, password);
                toast.success('Account created successfully!');
            } else {
                await login(email, password);
                toast.success('Logged in successfully!');
            }
            setUsername('');
            setEmail('');
            setPassword('');
        } catch (error) {
            toast.error(`Failed: ${error?.message || 'Something went wrong'}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login">
            <img src={assets.logo_big} alt="Logo" className="login-logo" />
            <form onSubmit={onSubmitHandler} className="login-form">
                <h2>{currState}</h2>

                {currState === 'Sign Up' && (
                    <input
                        onChange={(e) => setUsername(e.target.value)}
                        value={username}
                        type="text"
                        placeholder="Username"
                        className="form-input"
                        required
                    />
                )}

                <input
                    onChange={(e) => setEmail(e.target.value)}
                    value={email}
                    type="email"
                    placeholder="Email Address"
                    className="form-input"
                    required
                />

                <input
                    onChange={(e) => setPassword(e.target.value)}
                    value={password}
                    type="password"
                    placeholder="Password"
                    className="form-input"
                    required
                />

                {currState === 'Sign Up' && (
                    <div className="login-term">
                        <input type="checkbox" id="terms" required />
                        <label htmlFor="terms">
                            Agree to the <span>Terms</span>, <span>Data Policy</span>, and <span>Cookies Policy</span>
                        </label>
                    </div>
                )}

                <button type="submit" disabled={loading}>
                    {loading ? 'Processing...' : (currState === "Sign Up" ? "Create account" : "Login now")}
                </button>

                <div className="login-forgot">
                    {currState === 'Login' ? (
                        <p className="login-toggle">
                            Don’t have an account?{' '}
                            <span onClick={() => setCurrState('Sign Up')}>Sign Up Here</span>
                        </p>
                    ) : (
                        <p className="login-toggle">
                            Already have an account?{' '}
                            <span onClick={() => setCurrState('Login')}>Login Here</span>
                        </p>
                    )}
                    {currState === 'login' ? <p className="login-toggle">Forgot Password?{' '}?
                        <span onClick={() => resetPass(email)}>Reset Password</span>
                    </p> : null}
                </div>
            </form>
        </div>
    );
};

export default Login;
