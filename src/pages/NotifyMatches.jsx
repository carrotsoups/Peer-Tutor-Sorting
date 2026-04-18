import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSheet } from '../context/SheetContext';
import { parseTutorsAndStudents } from '../utils/processing';
import '../css/NotifyMatches.css';

export function NotifyMatches() {
  const navigate = useNavigate();
  const { rows } = useSheet();
  const [selectedMatches, setSelectedMatches] = useState(new Set());
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);

  // Extract all scheduled matches from the data
  const allMatches = useMemo(() => {
    if (rows.length === 0) return [];
    
    const { tutors, students } = parseTutorsAndStudents(rows);
    const matches = [];
    
    // Since we don't have direct access to schedule from here,
    // we'll need to use localStorage or pass schedule through context
    // For now, let's get schedule data from sessionStorage if available
    const scheduleData = sessionStorage.getItem('tutorSchedule');
    
    if (scheduleData) {
      try {
        const schedule = JSON.parse(scheduleData);
        const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
        const TIMES = ['Morning', 'Lunch', 'Afterschool'];
        
        DAYS.forEach(day => {
          TIMES.forEach(time => {
            const cellKey = `${day.toLowerCase()}-${time.toLowerCase()}`;
            const pairings = schedule[cellKey] || [];
            
            pairings.forEach(pairing => {
              matches.push({
                id: pairing.id,
                tutorName: pairing.tutor.fullName,
                studentName: pairing.student.fullName,
                day,
                time
              });
            });
          });
        });
      } catch (e) {
        console.error('Error parsing schedule data:', e);
      }
    }
    
    return matches;
  }, [rows]);

  const toggleSelectMatch = (matchId) => {
    const newSelected = new Set(selectedMatches);
    if (newSelected.has(matchId)) {
      newSelected.delete(matchId);
    } else {
      newSelected.add(matchId);
    }
    setSelectedMatches(newSelected);
  };

  const selectAll = () => {
    if (selectedMatches.size === allMatches.length) {
      setSelectedMatches(new Set());
    } else {
      setSelectedMatches(new Set(allMatches.map(m => m.id)));
    }
  };

  const handleEmailClick = () => {
    if (selectedMatches.size === 0) {
      alert('Please select at least one match to email.');
      return;
    }
    setShowEmailConfirmation(true);
  };

  const handleEmailConfirm = () => {
    // Get selected matches data
    const matchesToEmail = allMatches.filter(m => selectedMatches.has(m.id));
    
    // Log to console
    console.log('emailed');
    
    // Optional: You can also log the selected matches
    console.log('Matches emailed:', matchesToEmail);
    
    // Show success message
    alert(`Successfully emailed ${matchesToEmail.length} match(es)!`);
    
    // Close confirmation modal
    setShowEmailConfirmation(false);
    
    // Clear selection
    setSelectedMatches(new Set());
  };

  const handleEmailCancel = () => {
    setShowEmailConfirmation(false);
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <a href="/schedule" style={{ color: '#bb2822', textDecoration: 'none' }}>
          ← Back to Schedule
        </a>
      </div>

      <h2>Notify Matches</h2>

      {allMatches.length === 0 ? (
        <div style={{ 
          padding: '2rem', 
          textAlign: 'center', 
          backgroundColor: '#f5f5f5',
          borderRadius: '4px'
        }}>
          <p style={{ fontSize: '1.1rem', color: '#666' }}>
            No scheduled matches found. Please create matches in the scheduling grid first.
          </p>
        </div>
      ) : (
        <>
          <div style={{ marginBottom: '1.5rem' }}>
            <button 
              className="select-all-btn"
              onClick={selectAll}
            >
              {selectedMatches.size === allMatches.length ? 'Deselect All' : 'Select All'}
            </button>
            <span style={{ marginLeft: '1rem', color: '#666' }}>
              {selectedMatches.size} of {allMatches.length} selected
            </span>
          </div>

          <div className="matches-list">
            {allMatches.map(match => (
              <div key={match.id} className="match-item">
                <input
                  type="checkbox"
                  checked={selectedMatches.has(match.id)}
                  onChange={() => toggleSelectMatch(match.id)}
                  className="match-checkbox"
                />
                <div className="match-details">
                  <div className="match-names">
                    <strong>{match.tutorName}</strong> (Tutor) ↔ <strong>{match.studentName}</strong> (Student)
                  </div>
                  <div className="match-time">
                    {match.day} - {match.time}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '2rem' }}>
            <button 
              className="email-btn"
              onClick={handleEmailClick}
            >
              Email
            </button>
          </div>
        </>
      )}

      {showEmailConfirmation && (
        <div className="email-confirmation-modal">
          <div className="email-confirmation-content">
            <h3>Confirm Email</h3>
            <p>Are you sure you want to email {selectedMatches.size} match(es)?</p>
            <div className="email-confirmation-actions">
              <button 
                className="btn-confirm"
                onClick={handleEmailConfirm}
              >
                Confirm
              </button>
              <button 
                className="btn-cancel"
                onClick={handleEmailCancel}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
