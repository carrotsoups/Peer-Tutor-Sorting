import { useState } from 'react';
import { importScheduleFromText } from '../utils/pairingExportImport';
import './ImportScheduleModal.css';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const TIMES = ['Morning', 'Lunch', 'Afterschool'];

const ImportScheduleModal = ({ schedule, tutors, students, isOpen, onClose, onImport }) => {
  const [pastedText, setPastedText] = useState('');
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);

  if (!isOpen) return null;

  const handleImport = () => {
    if (!pastedText.trim()) {
      setResult({ 
        errors: ['Please paste the exported data first.'],
        addedCount: 0
      });
      return;
    }

    setImporting(true);
    try {
      const importResult = importScheduleFromText(
        pastedText,
        schedule,
        tutors,
        students,
        DAYS,
        TIMES
      );
      setResult(importResult);
      
      // Auto-apply if no errors
      if (importResult.errors.length === 0 && importResult.addedCount > 0) {
        setTimeout(() => {
          onImport(importResult.schedule);
          handleClose();
        }, 1000);
      }
    } catch (error) {
      setResult({
        errors: [`Error parsing data: ${error.message}`],
        addedCount: 0
      });
    }
    setImporting(false);
  };

  const handleApplyImport = () => {
    onImport(result.schedule);
    handleClose();
  };

  const handleClose = () => {
    setPastedText('');
    setResult(null);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content import-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Import Pairings</h2>
          <button className="close-btn" onClick={handleClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="import-instructions">
            <p>Paste the exported pairing data below:</p>
          </div>

          {!result ? (
            <>
              <textarea
                className="import-textarea"
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Paste exported pairings here..."
              />
              <div className="modal-actions">
                <button 
                  className="import-btn" 
                  onClick={handleImport}
                  disabled={importing}
                >
                  {importing ? 'Processing...' : 'Import & Validate'}
                </button>
                <button className="close-modal-btn" onClick={handleClose}>Cancel</button>
              </div>
            </>
          ) : (
            <>
              <div className="import-results">
                {result.addedCount > 0 && (
                  <div className="success-message">
                    ✓ Successfully parsed {result.addedCount} pairing{result.addedCount !== 1 ? 's' : ''}
                  </div>
                )}

                {result.errors.length > 0 && (
                  <div className="errors-section">
                    <h4>Issues Found ({result.errors.length}):</h4>
                    <div className="errors-list">
                      {result.errors.map((error, idx) => (
                        <div key={idx} className="error-item">
                          ⚠ {error}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {result.addedCount === 0 && result.errors.length === 0 && (
                  <div className="no-data-message">
                    No pairings found to import. Check your data and try again.
                  </div>
                )}
              </div>

              <div className="modal-actions">
                {result.addedCount > 0 && (
                  <button 
                    className="import-btn" 
                    onClick={handleApplyImport}
                  >
                    Apply {result.addedCount} Pairing{result.addedCount !== 1 ? 's' : ''}
                  </button>
                )}
                <button 
                  className="try-again-btn" 
                  onClick={() => {
                    setPastedText('');
                    setResult(null);
                  }}
                >
                  {result.addedCount > 0 ? 'Import Different Data' : 'Try Again'}
                </button>
                <button className="close-modal-btn" onClick={handleClose}>Close</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportScheduleModal;
