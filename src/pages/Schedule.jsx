import { useState } from 'react'
import { useAuth } from '../components/AuthContext';
import { useSheet } from '../context/SheetContext';
import { sortRows, filterRows } from '../utils/processing';
import SchedulingGrid from '../components/SchedulingGrid';

export function Schedule(){
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
                <a href="/home" style={{ color: '#007bff', textDecoration: 'none' }}>
                    ← Back to Home
                </a>
            </div>
        );
    }

    return (
        <div style={{ padding: '2rem' }}>
            <h2>Peer Tutor Scheduling</h2>
            {user && (
                <div style={{ marginBottom: '1rem' }}>
                    <p>Logged in as: <strong>{user.name}</strong></p>
                </div>
            )}

            <div style={{ marginBottom: '2rem' }}>
                <a href="/home" style={{ color: '#007bff', textDecoration: 'none' }}>
                    ← Back to Data View
                </a>
            </div>

            <SchedulingGrid />
        </div>
    )
}