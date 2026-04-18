import { useState, useMemo } from 'react';
import { useSheet } from '../context/SheetContext';
import emailjs from '@emailjs/browser';
import '../css/NotifyMatches.css';

export function NotifyMatches() {
  const { rows } = useSheet();
  const [selectedMatches, setSelectedMatches] = useState(new Set());
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);

  // Initialize EmailJS
  useMemo(() => {
    emailjs.init('JuY-9WqtbhBfsYSAf');
  }, []);

  // Extract all scheduled matches from the data
  const allMatches = useMemo(() => {
    if (rows.length === 0) return [];
    
    // Since we don't have direct access to schedule from here,
    // we'll need to use localStorage or pass schedule through context
    // For now, let's get schedule data from sessionStorage if available
    const scheduleData = sessionStorage.getItem('tutorSchedule');
    
    if (scheduleData) {
      try {
        const schedule = JSON.parse(scheduleData);
        const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
        const TIMES = ['Morning', 'Lunch', 'Afterschool'];
        
        const matches = [];
        
        DAYS.forEach(day => {
          TIMES.forEach(time => {
            const cellKey = `${day.toLowerCase()}-${time.toLowerCase()}`;
            const pairings = schedule[cellKey] || [];
            
            pairings.forEach(pairing => {
              matches.push({
                id: pairing.id,
                tutorName: pairing.tutor.fullName,
                tutorGrade: pairing.tutor.grade,
                tutorEmail: pairing.tutor.email,
                studentName: pairing.student.fullName,
                studentGrade: pairing.student.grade,
                studentEmail: pairing.student.email,
                day,
                time
              });
            });
          });
        });
        
        return matches;
      } catch (e) {
        console.error('Error parsing schedule data:', e);
      }
    }
    
    return [];
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

  const handleEmailConfirm = async () => {
    // Get selected matches data
    const matchesToEmail = allMatches.filter(m => selectedMatches.has(m.id));
    
    if (matchesToEmail.length === 0) {
      alert('No matches selected.');
      return;
    }
    console.log('Selected matches to email:', matchesToEmail);
    console.log('Number of matches:', matchesToEmail.length);
    // Check if any matches are missing email data
    const matchesWithoutEmails = matchesToEmail.filter(match => 
      !match.tutorEmail || !match.studentEmail || 
      match.tutorEmail.trim() === '' || match.studentEmail.trim() === ''
    );

    if (matchesWithoutEmails.length > 0) {
      alert(`Cannot send emails: ${matchesWithoutEmails.length} match(es) are missing email addresses. Please ensure your Google Sheet includes email addresses in the notes column and reload the schedule.`);
      return;
    }

    try {
      // Send email for each match
      for (const match of matchesToEmail) {
        console.log('Processing match:', match);
        console.log('Tutor email:', match.tutorEmail, 'Type:', typeof match.tutorEmail);
        console.log('Student email:', match.studentEmail, 'Type:', typeof match.studentEmail);
        console.log('Tutor name:', match.tutorName, 'Type:', typeof match.tutorName);
        console.log('Student name:', match.studentName, 'Type:', typeof match.studentName);
        
        const templateParams = {
          emailtutor: match.tutorEmail,
          emailstudent: match.studentEmail,
          tutorname: match.tutorName,
          tutorgrade: match.tutorGrade,
          studentname: match.studentName,
          studentgrade: match.studentGrade,
          time: `${match.day} ${match.time}`
        };

        await emailjs.send('default_service', 'template_i4iie1c', templateParams);
      }

      alert(`Successfully emailed ${matchesToEmail.length} match(es)!`);
    } catch (error) {
      console.error('Email sending failed:', error);
      alert(`Failed to send emails: ${error.text || error.message || 'Unknown error'}`);
    }
    
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
