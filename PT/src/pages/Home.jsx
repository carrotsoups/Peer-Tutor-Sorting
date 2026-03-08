import { useState } from 'react'
import { useAuth } from '../components/AuthContext';
import GoogleDrivePicker from '../components/GoogleDrivePicker';
import { useSheet } from '../context/SheetContext';
import { sortRows, filterRows } from '../utils/processing';

export function Home(){
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

    return (
        <div style={{ padding: '2rem' }}>
            <h2>Welcome to Peer Tutor Sorting</h2>
            {user && (
                <div>
                    <p>Logged in as: <strong>{user.name}</strong></p>
                    <p>Email: {user.email}</p>
                </div>
            )}
            <GoogleDrivePicker />
            
            {rows.length > 0 && (
                <div style={{ marginTop: '2rem' }}>
                    <h3>Sheet Data</h3>
                    
                    {/* Controls */}
                    <div style={{ marginBottom: '1rem' }}>
                        <label>
                            Sort by column: 
                            <select value={sortColumn} onChange={(e) => setSortColumn(Number(e.target.value))}>
                                {rows[0] && rows[0].map((_, i) => (
                                    <option key={i} value={i}>Column {i + 1}</option>
                                ))}
                            </select>
                        </label>
                        
                        <label style={{ marginLeft: '1rem' }}>
                            Filter column: 
                            <select value={filterColumn} onChange={(e) => setFilterColumn(Number(e.target.value))}>
                                {rows[0] && rows[0].map((_, i) => (
                                    <option key={i} value={i}>Column {i + 1}</option>
                                ))}
                            </select>
                        </label>
                        
                        <input 
                            type="text" 
                            placeholder="Filter term" 
                            value={filterTerm} 
                            onChange={(e) => setFilterTerm(e.target.value)}
                            style={{ marginLeft: '1rem' }}
                        />
                    </div>
                    
                    {/* Table */}
                    <table border="1" cellPadding="5">
                        <tbody>
                            {processedRows.map((row, i) => (
                                <tr key={i}>
                                    {row.map((cell, j) => (
                                        <td key={j}>{cell}</td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Link to Scheduling */}
                    <div style={{ marginTop: '3rem', textAlign: 'center' }}>
                        <a href="/schedule" style={{ 
                            backgroundColor: '#007bff', 
                            color: 'white', 
                            padding: '15px 30px', 
                            textDecoration: 'none', 
                            borderRadius: '5px',
                            display: 'inline-block',
                            fontSize: '18px',
                            fontWeight: 'bold'
                        }}>
                            🗓️ Go to Peer Tutor Scheduling
                        </a>
                    </div>
                </div>
            )}
        </div>
    )
}
