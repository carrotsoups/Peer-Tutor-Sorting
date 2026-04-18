import { useState, useRef } from 'react';
import { exportScheduleToText } from '../utils/pairingExportImport';
import './ExportScheduleModal.css';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const TIMES = ['Morning', 'Lunch', 'Afterschool'];

const ExportScheduleModal = ({ schedule, tutors = [], students = [], isOpen, onClose }) => {
  const textRef = useRef(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const exportText = exportScheduleToText(schedule, DAYS, TIMES, tutors, students);

  const handleCopy = () => {
    if (textRef.current) {
      textRef.current.select();
      document.execCommand('copy');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Count pairings and unpaired
  let pairingCount = 0;
  let unpairedTutorCount = 0;
  let unpairedStudentCount = 0;
  const pairedTutorIds = new Set();
  const pairedStudentIds = new Set();

  DAYS.forEach(day => {
    TIMES.forEach(time => {
      const cellKey = `${day.toLowerCase()}-${time.toLowerCase()}`;
      const cellPairings = schedule[cellKey] || [];
      pairingCount += cellPairings.length;
      cellPairings.forEach(p => {
        pairedTutorIds.add(p.tutor.id);
        pairedStudentIds.add(p.student.id);
      });
    });
  });

  tutors.forEach(t => {
    if (!pairedTutorIds.has(t.id)) unpairedTutorCount++;
  });

  students.forEach(s => {
    if (!pairedStudentIds.has(s.id)) unpairedStudentCount++;
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Export Pairings</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <p className="export-description">
          Copy this and save it for later to import or share with others.
        </p>
        <div className="modal-body">
          <div className="export-info">
            <p>Scheduled Pairings: <strong>{pairingCount}</strong></p>
            <p>Unscheduled Tutors: <strong>{unpairedTutorCount}</strong></p>
            <p>Unscheduled Students: <strong>{unpairedStudentCount}</strong></p>
          </div>

          <textarea
            ref={textRef}
            className="export-textarea"
            value={exportText}
            readOnly
          />

          <div className="modal-actions">
            <button className="copy-btn" onClick={handleCopy}>
              {copied ? '✓ Copied!' : 'Copy to Clipboard'}
            </button>
            <button className="close-modal-btn" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportScheduleModal;
