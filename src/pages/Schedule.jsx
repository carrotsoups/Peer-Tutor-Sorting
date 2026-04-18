import { useState } from 'react'
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import { useSheet } from '../context/SheetContext';
import { sortRows, filterRows } from '../utils/processing';
import SchedulingGrid from '../components/SchedulingGrid';

export function Schedule(){
    const navigate = useNavigate();
    const { user } = useAuth();
    const { rows } = useSheet();
    const [sortColumn, setSortColumn] = useState(0);
    const [filterTerm, setFilterTerm] = useState('');
    const [filterColumn, setFilterColumn] = useState(0);

    // Apply sorting and filtering
    let processedRows = rows;
    if (filterTerm) {
        processedRows = filterRows(processedRows, filterColumn, filterTerm);
    }
    processedRows = sortRows(processedRows, sortColumn);

    // If no data, show message
    if (rows.length === 0) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
                <h2>Peer Tutor Scheduling</h2>
                <p>No data available. Please upload a sheet first.</p>
                <a href="/home" style={{ color: '#bb2822', textDecoration: 'none' }}>
                    ← Back to Home
                </a>
            </div>
        );
    }

    return (
        <div>
            <h2>Peer Tutor Scheduling</h2>
            {user && (
                <div style={{ marginBottom: '1rem' }}>
                    <p>Logged in as: <strong>{user.name}</strong></p>
                </div>
            )}

            <div style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <a href="/home" style={{ color: '#bb2822', textDecoration: 'none' }}>
                    ← Back to Data View
                </a>
                <button 
                    onClick={() => navigate('/notify-matches')}
                    style={{
                        backgroundColor: '#bb2822',
                        color: 'white',
                        border: 'none',
                        padding: '10px 20px',
                        fontSize: '1rem',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        transition: 'background-color 0.3s'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#a01d18'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#bb2822'}
                >
                    Notify Matches
                </button>
            </div>

            <SchedulingGrid />
        </div>
    )
}