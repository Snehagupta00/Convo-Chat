import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AppContext } from '../../context/AppContext';

const ProtectedRoute = ({ children }) => {
    const { userData } = useContext(AppContext);

    if (!userData) {
        return <Navigate to="/" replace />;
    }

    return children;
};

export default ProtectedRoute;
