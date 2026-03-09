import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import GoogleDrivePicker from '../components/GoogleDrivePicker';
import { useSheet } from '../context/SheetContext';
import { sortRows, filterRows, parseSpreadsheetText } from '../utils/processing';

export function Home(){
    const { user } = useAuth();
    const { rows, setRows } = useSheet();
    const navigate = useNavigate();

    const [sortColumn, setSortColumn] = useState(0);
    const [filterTerm, setFilterTerm] = useState('');
    const [filterColumn, setFilterColumn] = useState(0);

    // manual paste states
    const [manualOpen, setManualOpen] = useState(false);
    const [manualText, setManualText] = useState('');
    const [previewRows, setPreviewRows] = useState([]);

    // Redirect to landing if not logged in
    useEffect(() => {
        if (!user) {
            console.warn("No user logged in, redirecting to landing page.");
            navigate("/");
        }
    }, [user, navigate]);

    const handlePreview = () => {
      const parsed = parseSpreadsheetText(manualText);
      setPreviewRows(parsed);
    };
    const handleConfirm = () => {
      if (previewRows.length === 0) return;
      setRows(previewRows);
      navigate('/schedule');
    };

    

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
            <div style={{ margin: '1.5rem 0', textAlign: 'center' }}>
              <p>— OR —</p>
              <button onClick={() => {
                  setManualOpen(!manualOpen);
                  setManualText('');
                  setPreviewRows([]);
                }}
                style={{ padding: '0.5rem 1rem' }}
              >
                {manualOpen ? 'Close manual input' : 'Paste spreadsheet manually'}
              </button>
            </div>
            {manualOpen && (
              <div style={{ marginTop: '1rem', textAlign: 'left' }}>
                <p>Copy &amp; paste spreadsheet rows (tabs/comma separated)</p>
                <textarea
                  rows={8}
                  cols={80}
                  value={manualText}
                  onChange={(e) => setManualText(e.target.value)}
                />
                <div style={{ marginTop: '0.5rem' }}>
                  <button onClick={handlePreview}>Preview</button>
                  <button onClick={() => setManualOpen(false)} style={{ marginLeft: '1rem' }}>
                    Cancel
                  </button>
                </div>
                {previewRows.length > 0 && (
                  <div style={{ marginTop: '1rem' }}>
                    <h4>Preview</h4>
                    <table border="1" cellPadding="5">
                      <tbody>
                        {previewRows.map((row,i)=>(
                          <tr key={i}>{row.map((c,j)=><td key={j}>{c}</td>)}</tr>
                        ))}
                      </tbody>
                    </table>
                    <button onClick={handleConfirm} style={{ marginTop: '1rem' }}>
                      Confirm and go to scheduling
                    </button>
                  </div>
                )}
              </div>
            )}

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
                            backgroundColor: '#bb2822', 
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
