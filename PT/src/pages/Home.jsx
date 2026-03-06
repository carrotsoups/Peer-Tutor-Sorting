import { useState } from 'react'
import { useAuth } from '../components/AuthContext';
import GoogleDriverPicker from '../components/GoogleDrivePicker';

export function Home(){
    const { user } = useAuth();
    
    return (
        <div style={{ padding: '2rem' }}>
            <h2>Welcome to Peer Tutor Sorting</h2>
            {user && (
                <div>
                    <p>Logged in as: <strong>{user.name}</strong></p>
                    <p>Email: {user.email}</p>
                </div>
            )}
            <p>This is the home page content.</p>
            <GoogleDriverPicker />
        </div>
    )
}
