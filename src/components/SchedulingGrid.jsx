import { useState, useEffect } from 'react';
import { useSheet } from '../context/SheetContext';
import { parseTutorsAndStudents, createPairing, canSchedulePairing } from '../utils/processing';
import { autoScheduleTutorStudentPairs } from '../utils/autoScheduler';
import ExportScheduleModal from './ExportScheduleModal';
import ImportScheduleModal from './ImportScheduleModal';
import './SchedulingGrid.css';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const TIMES = ['Morning', 'Lunch', 'Afterschool'];

const SchedulingGrid = () => {
  const { rows, setRows } = useSheet();
  const [tutors, setTutors] = useState([]);
  const [students, setStudents] = useState([]);
  const [schedule, setSchedule] = useState({});
  const [draggedItem, setDraggedItem] = useState(null);
  const [hoveredCell, setHoveredCell] = useState(null);
  const [pendingTutor, setPendingTutor] = useState(null);
  const [pendingStudent, setPendingStudent] = useState(null);
  const [pairings, setPairings] = useState([]);
  const [isPairingAreaCollapsed, setIsPairingAreaCollapsed] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Parse data when rows change
  useEffect(() => {
    if (rows && rows.length > 0) {
      const { tutors: parsedTutors, students: parsedStudents } = parseTutorsAndStudents(rows);
      
      // Sort alphabetically by full name
      const sortedTutors = [...parsedTutors].sort((a, b) => a.fullName.localeCompare(b.fullName));
      const sortedStudents = [...parsedStudents].sort((a, b) => a.fullName.localeCompare(b.fullName));
      
      setTutors(sortedTutors);
      setStudents(sortedStudents);
    }
  }, [rows]);

  // Initialize schedule
  useEffect(() => {
    const initialSchedule = {};
    DAYS.forEach(day => {
      TIMES.forEach(time => {
        initialSchedule[`${day.toLowerCase()}-${time.toLowerCase()}`] = [];
      });
    });
    setSchedule(initialSchedule);
  }, []);

  const handleDragStart = (e, item, type) => {
    setDraggedItem({ item, type });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, day, time) => {
    e.preventDefault();
    setHoveredCell(`${day}-${time}`);

    if (draggedItem?.type === 'pairing') {
      const cellKey = `${day.toLowerCase()}-${time.toLowerCase()}`;
      const canDrop = canSchedulePairing(draggedItem.item, day, time, schedule, cellKey);
      e.dataTransfer.dropEffect = canDrop ? 'move' : 'none';
    }
  };

  const handleDragLeave = () => {
    setHoveredCell(null);
  };

  const handleDrop = (e, day, time) => {
    e.preventDefault();
    setHoveredCell(null);

    if (!draggedItem || draggedItem.type !== 'pairing') {
      setDraggedItem(null);
      return;
    }

    const cellKey = `${day.toLowerCase()}-${time.toLowerCase()}`;
    const canDrop = canSchedulePairing(draggedItem.item, day, time, schedule, cellKey);

    if (canDrop) {
      // Add the pairing to the schedule
      setSchedule(prev => ({
        ...prev,
        [cellKey]: [...prev[cellKey], draggedItem.item]
      }));
      // Remove the pairing from the available pairings list
      setPairings(prev => prev.filter(p => p.id !== draggedItem.item.id));
    }
    // If cannot drop, the pairing stays in the available list

    setDraggedItem(null);
  };

  const handleDropOnPairingZone = (e) => {
    e.preventDefault();

    if (!draggedItem) return;

    let newTutor = pendingTutor;
    let newStudent = pendingStudent;

    if (draggedItem.type === 'tutor') {
      newTutor = draggedItem.item;
    } else if (draggedItem.type === 'student') {
      newStudent = draggedItem.item;
    }

    // If we now have both tutor and student, create a pairing
    if (newTutor && newStudent) {
      const newPairing = createPairing(newTutor, newStudent);
      setPairings([newPairing]); // Only allow one pairing at a time
      setPendingTutor(null);
      setPendingStudent(null);
    } else {
      // Set the pending items
      setPendingTutor(newTutor);
      setPendingStudent(newStudent);
    }

    setDraggedItem(null);
  };

  const breakApartPairing = (pairingId) => {
    const pairing = pairings.find(p => p.id === pairingId);
    if (pairing) {
      setPendingTutor(pairing.tutor);
      setPendingStudent(pairing.student);
      setPairings([]); // Remove the pairing
    }
  };

  const removePairing = (day, time, pairingId) => {
    const cellKey = `${day.toLowerCase()}-${time.toLowerCase()}`;
    setSchedule(prev => ({
      ...prev,
      [cellKey]: prev[cellKey].filter(pairing => pairing.id !== pairingId)
    }));
  };

  const getCellClassName = (day, time) => {
    const cellKey = `${day.toLowerCase()}-${time.toLowerCase()}`;
    const isHovered = hoveredCell === cellKey;

    if (!isHovered || !draggedItem) return 'schedule-cell';

    if (draggedItem.type === 'pairing') {
      const canDrop = canSchedulePairing(draggedItem.item, day, time, schedule, cellKey);
      return `schedule-cell ${canDrop ? 'can-drop' : 'cannot-drop'}`;
    }

    return 'schedule-cell';
  };

  const handleAutoSchedule = () => {
    const result = autoScheduleTutorStudentPairs(tutors, students, schedule);
    setSchedule(result.schedule);
    setPairings([]); // Clear the pairing maker since pairs have been scheduled
    setPendingTutor(null);
    setPendingStudent(null);
    
    // Show warning for unpaired students
    if (result.unpairedStudents.length > 0) {
      const unpairedNames = result.unpairedStudents.map(s => `${s.fullName} (${s.grade})`).join(', ');
      alert(`Warning: The following students could not be paired due to scheduling constraints:\n\n${unpairedNames}\n\nThese students may need manual pairing or additional tutor availability.`);
    }
  };

  const handleImportPairings = (newSchedule) => {
    setSchedule(newSchedule);
    alert('Pairings imported successfully!');
  };

  const handleClearAllPairings = () => {
    if (window.confirm('Are you sure you want to clear ALL pairings from the board? This cannot be undone.')) {
      // Clear all pairings from the schedule
      const clearedSchedule = {};
      DAYS.forEach(day => {
        TIMES.forEach(time => {
          clearedSchedule[`${day.toLowerCase()}-${time.toLowerCase()}`] = [];
        });
      });
      setSchedule(clearedSchedule);
      setPairings([]);
      setPendingTutor(null);
      setPendingStudent(null);
      alert('All pairings have been cleared!');
    }
  };

  const handleDeleteTutor = (tutor) => {
    if (window.confirm(`Are you sure you want to delete "${tutor.fullName}"? This will remove them from the system.`)) {
      // Remove the row that matches this tutor
      const newRows = rows.filter(row => 
        !(row[1] === tutor.firstName && row[2] === tutor.lastName && row[3] === tutor.grade)
      );
      setRows(newRows);
      // Also remove any pairings with this tutor from the current schedule
      const newSchedule = {};
      DAYS.forEach(day => {
        TIMES.forEach(time => {
          const cellKey = `${day.toLowerCase()}-${time.toLowerCase()}`;
          newSchedule[cellKey] = (schedule[cellKey] || []).filter(p => 
            !(p.tutor.firstName === tutor.firstName && p.tutor.lastName === tutor.lastName && p.tutor.grade === tutor.grade)
          );
        });
      });
      setSchedule(newSchedule);
      setPendingTutor(null);
      setPairings([]);
    }
  };

  const handleDeleteStudent = (student) => {
    if (window.confirm(`Are you sure you want to delete "${student.fullName}"? This will remove them from the system.`)) {
      // Remove the row that matches this student
      const newRows = rows.filter(row => 
        !(row[1] === student.firstName && row[2] === student.lastName && row[3] === student.grade)
      );
      setRows(newRows);
      // Also remove any pairings with this student from the current schedule
      const newSchedule = {};
      DAYS.forEach(day => {
        TIMES.forEach(time => {
          const cellKey = `${day.toLowerCase()}-${time.toLowerCase()}`;
          newSchedule[cellKey] = (schedule[cellKey] || []).filter(p => 
            !(p.student.firstName === student.firstName && p.student.lastName === student.lastName && p.student.grade === student.grade)
          );
        });
      });
      setSchedule(newSchedule);
      setPendingStudent(null);
      setPairings([]);
    }
  };

  return (
    <div className="scheduling-container">
      {/* Top Action Bar */}
      <div className="scheduling-header">
        <button className="clear-all-btn" onClick={handleClearAllPairings}>
          Clear All Pairings
        </button>
      </div>

      {/* Main Content Area */}
      <div className="scheduling-content">
        {/* Tutors Sidebar */}
        <div className="sidebar tutors-sidebar">
          <h3>Tutors</h3>
          <div className="person-list">
            {tutors.map(tutor => (
              <div
                key={tutor.id}
                className="person-card tutor-card"
                draggable
                onDragStart={(e) => handleDragStart(e, tutor, 'tutor')}
              >
                <div className="person-info">
                  <div className="person-name">{tutor.fullName}</div>
                  <div className="person-grade">{tutor.grade}</div>
                </div>
                <button 
                  className="delete-btn"
                  onClick={() => handleDeleteTutor(tutor)}
                  title="Delete tutor"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Main Grid */}
        <div className="schedule-grid">
        {/* Header Row */}
        <div className="grid-header">
          <div className="time-label"></div>
          {DAYS.map(day => (
            <div key={day} className="day-header">{day}</div>
          ))}
        </div>

        {/* Time Rows */}
        {TIMES.map(time => (
          <div key={time} className="grid-row">
            <div className="time-label">{time}</div>
            {DAYS.map(day => {
              const cellKey = `${day.toLowerCase()}-${time.toLowerCase()}`;
              const pairings = schedule[cellKey] || [];

              return (
                <div
                  key={cellKey}
                  className={getCellClassName(day, time)}
                  onDragOver={(e) => handleDragOver(e, day, time)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, day, time)}
                >
                  {pairings.map(pairing => (
                    <div
                      key={pairing.id}
                      className={`pairing-card${pairing.autoScheduled ? ' auto-scheduled' : ''}`}
                      onClick={() => removePairing(day, time, pairing.id)}
                    >
                      <div className="tutor-info">
                        <span className="tutor-name">{pairing.tutor.fullName}</span>
                        <span className="tutor-grade">({pairing.tutor.grade})</span>
                      </div>
                      <div className="student-info">
                        <span className="student-name">{pairing.student.fullName}</span>
                        <span className="student-grade">({pairing.student.grade})</span>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Students Sidebar */}
      <div className="sidebar students-sidebar">
        <h3>Students</h3>
        <div className="person-list">
          {students.map(student => (
            <div
              key={student.id}
              className="person-card student-card"
              draggable
              onDragStart={(e) => handleDragStart(e, student, 'student')}
            >
              <div className="person-info">
                <div className="person-name">{student.fullName}</div>
                <div className="person-grade">{student.grade}</div>
              </div>
              <button 
                className="delete-btn"
                onClick={() => handleDeleteStudent(student)}
                title="Delete student"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>
      </div>

      {/* Pairing Area */}
      <div className="pairing-area">
        <div className="pairing-area-header">
          <h3>Create Tutor-Student Pair</h3>
          <button 
            className="collapse-toggle"
            onClick={() => setIsPairingAreaCollapsed(!isPairingAreaCollapsed)}
            title={isPairingAreaCollapsed ? "Expand pairing area" : "Collapse pairing area"}
          >
            {isPairingAreaCollapsed ? '▼' : '▲'}
          </button>
        </div>
        {!isPairingAreaCollapsed && (
          <>
            <div className="button-row">
              <button className="auto-schedule-btn" onClick={handleAutoSchedule}>
                Auto Schedule
              </button>
              <button className="export-btn" onClick={() => setIsExportModalOpen(true)}>
                Export Schedule
              </button>
              <button className="import-btn" onClick={() => setIsImportModalOpen(true)}>
                Import Schedule
              </button>
            </div>
            <div
              className="pairing-zone"
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDropOnPairingZone}
            >
              <div className="pending-items">
                {pendingTutor && (
                  <div className="pending-tutor">
                    <span>Tutor: {pendingTutor.fullName} ({pendingTutor.grade})</span>
                    <button onClick={() => setPendingTutor(null)}>×</button>
                  </div>
                )}
                {pendingStudent && (
                  <div className="pending-student">
                    <span>Student: {pendingStudent.fullName} ({pendingStudent.grade})</span>
                    <button onClick={() => setPendingStudent(null)}>×</button>
                  </div>
                )}
                {!pendingTutor && !pendingStudent && pairings.length === 0 && (
                  <span>Drop tutor and student here to create a pair</span>
                )}
                {((pendingTutor && !pendingStudent) || (!pendingTutor && pendingStudent)) && (
                  <span>Drop the other person to create pair</span>
                )}
              </div>

              {/* Active Pairing Block */}
              {pairings.length > 0 && (
                <div className="active-pairing">
                  <div
                    className="pairing-block"
                    draggable
                    onDragStart={(e) => {
                      setDraggedItem({ item: pairings[0], type: 'pairing' });
                      e.dataTransfer.effectAllowed = 'move';
                      e.dataTransfer.setData('text/plain', pairings[0].id);
                    }}
                    onClick={() => breakApartPairing(pairings[0].id)}
                    title="Drag to schedule or click to break apart"
                  >
                    <div className="pairing-tutor">
                      <strong>{pairings[0].tutor.fullName}</strong> ({pairings[0].tutor.grade})
                    </div>
                    <div className="pairing-student">
                      <strong>{pairings[0].student.fullName}</strong> ({pairings[0].student.grade})
                    </div>
                    <div className="pairing-instruction">Drag to schedule • Click to break apart</div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      <ExportScheduleModal 
        schedule={schedule}
        tutors={tutors}
        students={students}
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />
      <ImportScheduleModal
        schedule={schedule}
        tutors={tutors}
        students={students}
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImportPairings}
      />
    </div>
  );
};

export default SchedulingGrid;