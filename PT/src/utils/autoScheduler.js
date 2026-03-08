import { createPairing } from './processing';

// Constants matching SchedulingGrid
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const TIMES = ['Morning', 'Lunch', 'Afterschool'];

/**
 * Converts grade string to numeric value for age comparison
 * @param {string} grade - Grade like "Grade 9", "Grade 10", etc.
 * @returns {number} Numeric grade value
 */
const gradeToNumber = (grade) => {
  const match = grade.match(/\d+/);
  return match ? parseInt(match[0]) : 0;
};

/**
 * Checks if a person is available at a given time slot
 * @param {Object} person - Person object with availability data
 * @param {string} day - Day name (e.g., "Monday")
 * @param {string} time - Time name (e.g., "Lunch") - "Morning", "Lunch", or "Afterschool"
 * @param {boolean} isTutor - Whether checking tutor or student availability
 * @returns {boolean}
 */
const isPersonAvailable = (person, day, time, isTutor) => {
  const dayKey = day.toLowerCase();
  const timeKey = time.toLowerCase();
  
  // Check if person has availability data
  if (!person.availability || !person.availability[dayKey]) {
    return false;
  }
  
  return person.availability[dayKey][timeKey] === true;
};

/**
 * Finds the best time slot to schedule a pairing
 * Prefers lunch, then morning, then afterschool
 * @param {Object} tutor - Tutor object
 * @param {Object} student - Student object
 * @param {Object} schedule - Current schedule
 * @returns {string|null} Cell key (e.g., "monday-lunch") or null if no slot available
 */
const findBestTimeSlot = (tutor, student, schedule) => {
  // Try lunch first, then other times
  const timesByPreference = ['Lunch', 'Morning', 'Afterschool'];
  
  // Try each day and time, preferring lunch
  for (const day of DAYS) {
    for (const time of timesByPreference) {
      const cellKey = `${day.toLowerCase()}-${time.toLowerCase()}`;
      
      // Check if both are available
      if (!isPersonAvailable(tutor, day, time, true)) continue;
      if (!isPersonAvailable(student, day, time, false)) continue;
      
      // Check if cell is empty or has room
      const cellPairings = schedule[cellKey] || [];
      
      // Check for conflicts
      const tutorConflict = cellPairings.some(p => p.tutor.id === tutor.id);
      const studentConflict = cellPairings.some(p => p.student.id === student.id);
      
      if (!tutorConflict && !studentConflict) {
        return cellKey;
      }
    }
  }
  
  return null;
};

/**
 * Auto-schedules tutors with students based on constraints
 * Frozen pairs (already in schedule) are not changed
 * 
 * Rules:
 * - Tutor must be older than student (unless student is grade 12, then must be grade 12)
 * - Each student gets exactly 1 slot
 * - Minimize number of students per tutor
 * - Prefer lunch times
 * - Maximize total pairings (all students paired unless impossible)
 * 
 * @param {Array} tutors - List of tutor objects
 * @param {Array} students - List of student objects
 * @param {Object} schedule - Current schedule with placed pairs
 * @returns {Object} { schedule: updated schedule, unpairedStudents: array of unpaired students }
 */
export const autoScheduleTutorStudentPairs = (tutors, students, schedule) => {
  // Identify frozen pairs and students (students can only have 1 pairing)
  const frozenStudentIds = new Set();
  
  // Initialize tutor workload tracking
  const tutorStudentCount = {};
  tutors.forEach(tutor => {
    tutorStudentCount[tutor.id] = 0;
  });
  
  // Count frozen assignments and mark frozen students
  Object.values(schedule).forEach(pairings => {
    pairings.forEach(pairing => {
      frozenStudentIds.add(pairing.student.id);
      tutorStudentCount[pairing.tutor.id]++;
    });
  });
  
  // Get available students (students not yet scheduled)
  // Tutors can have multiple pairings, so we don't exclude them
  const availableStudents = students.filter(s => !frozenStudentIds.has(s.id));
  
  // Create new schedule (deep copy to avoid mutating original)
  const newSchedule = {};
  
  // Initialize all cells
  DAYS.forEach(day => {
    TIMES.forEach(time => {
      const cellKey = `${day.toLowerCase()}-${time.toLowerCase()}`;
      newSchedule[cellKey] = [...(schedule[cellKey] || [])];
    });
  });
  
  // Sort students by ID for consistent ordering
  const sortedStudents = [...availableStudents].sort((a, b) => a.id - b.id);
  
  // Track unpaired students
  const unpairedStudents = [];
  
  // Schedule each student - maximize total pairings
  sortedStudents.forEach(student => {
    // Find tutors compatible with this student
    const compatibleTutors = tutors.filter(tutor => {
      if (student.grade === 'Grade 12') {
        // Grade 12 students need grade 12 tutors
        return tutor.grade === 'Grade 12';
      } else {
        // Other students need older (higher grade) tutors
        return gradeToNumber(tutor.grade) > gradeToNumber(student.grade);
      }
    });
    
    if (compatibleTutors.length === 0) {
      unpairedStudents.push(student);
      return; // No compatible tutor
    }
    
    // Sort compatible tutors by workload (ascending) to balance while maximizing pairings
    const sortedTutors = [...compatibleTutors].sort((a, b) => {
      return tutorStudentCount[a.id] - tutorStudentCount[b.id];
    });
    
    // Try each tutor until we find one that can be scheduled
    let paired = false;
    for (const tutor of sortedTutors) {
      const bestSlot = findBestTimeSlot(tutor, student, newSchedule);
      
      if (bestSlot) {
        // Create and place the pairing with autoScheduled flag
        const newPairing = createPairing(tutor, student);
        newPairing.autoScheduled = true;
        newSchedule[bestSlot] = [...(newSchedule[bestSlot] || []), newPairing];
        tutorStudentCount[tutor.id]++;
        paired = true;
        break; // Student is paired, move to next student
      }
    }
    
    if (!paired) {
      unpairedStudents.push(student);
    }
  });
  
  return { schedule: newSchedule, unpairedStudents };
};
