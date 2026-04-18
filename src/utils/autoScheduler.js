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
 * 
 * Rules:
 * - Each tutor gets exactly 1 student, each student gets exactly 1 tutor
 * - Tutor grade must be at least 1 greater than student grade
 * - Prefer lunch times when scheduling
 * - Maximize total number of pairs that fit the above constraints
 * 
 * @param {Array} tutors - List of tutor objects
 * @param {Array} students - List of student objects
 * @param {Object} schedule - Current schedule with placed pairs
 * @returns {Object} { schedule: updated schedule, unpairedStudents: array of unpaired students }
 */
export const autoScheduleTutorStudentPairs = (tutors, students, schedule) => {
  // First, clear all auto-scheduled pairings and identify manual (frozen) pairs
  const clearedSchedule = {};
  const frozenStudentIds = new Set();
  const frozenTutorIds = new Set();
  
  // Initialize cleared schedule with same structure
  DAYS.forEach(day => {
    TIMES.forEach(time => {
      clearedSchedule[`${day.toLowerCase()}-${time.toLowerCase()}`] = [];
    });
  });
  
  // Separate manual pairings (keep them) from auto-scheduled (remove them)
  Object.entries(schedule).forEach(([cellKey, pairings]) => {
    pairings.forEach(pairing => {
      if (pairing.autoScheduled) {
        // Remove auto-scheduled pairings
      } else {
        // Keep manual pairings and mark people as frozen
        clearedSchedule[cellKey].push(pairing);
        frozenStudentIds.add(pairing.student.id);
        frozenTutorIds.add(pairing.tutor.id);
      }
    });
  });
  
  // Get available tutors and students (not frozen by manual pairings)
  const availableTutors = tutors.filter(t => !frozenTutorIds.has(t.id));
  const availableStudents = students.filter(s => !frozenStudentIds.has(s.id));
  
  // Build compatibility matrix: which tutors can tutor which students
  const compatibility = {};
  availableStudents.forEach(student => {
    compatibility[student.id] = [];
    
    availableTutors.forEach(tutor => {
      // Check grade constraint: tutor must be at least 1 grade higher
      const tutorGrade = gradeToNumber(tutor.grade);
      const studentGrade = gradeToNumber(student.grade);
      
      if (tutorGrade > studentGrade) {
        compatibility[student.id].push(tutor);
      }
    });
  });
  
  // Find the best matching using improved greedy approach
  // Sort students by compatibility (most constrained first)
  const sortedStudents = [...availableStudents].sort((a, b) => {
    const aOptions = compatibility[a.id].length;
    const bOptions = compatibility[b.id].length;
    // Sort by fewer options first (most constrained students get priority)
    return aOptions - bOptions;
  });
  
  const pairedTutorIds = new Set();
  const pairings = [];
  
  // For each student (sorted by constraint level), find the best available tutor
  for (const student of sortedStudents) {
    const validTutors = compatibility[student.id].filter(
      t => !pairedTutorIds.has(t.id)
    );
    
    if (validTutors.length > 0) {
      // Sort tutors by availability compatibility with student (most common slots first)
      const tutorsWithAvailabilityScore = validTutors.map(tutor => {
        let commonSlots = 0;
        let lunchSlots = 0;
        DAYS.forEach(day => {
          TIMES.forEach(time => {
            if (isPersonAvailable(tutor, day, time, true) && isPersonAvailable(student, day, time, false)) {
              commonSlots++;
              if (time === 'Lunch') lunchSlots++;
            }
          });
        });
        return { tutor, commonSlots, lunchSlots };
      });
      
      tutorsWithAvailabilityScore.sort((a, b) => {
        // Prefer more lunch slots, then more total common slots
        if (a.lunchSlots !== b.lunchSlots) return b.lunchSlots - a.lunchSlots;
        return b.commonSlots - a.commonSlots;
      });
      
      const selectedTutor = tutorsWithAvailabilityScore[0].tutor;
      pairings.push({ tutor: selectedTutor, student });
      pairedTutorIds.add(selectedTutor.id);
    }
  }
  
  // Identify unpaired students
  const pairedStudentIds = new Set(pairings.map(p => p.student.id));
  const unpairedStudents = availableStudents.filter(s => !pairedStudentIds.has(s.id));
  
  // Now schedule the pairings into the calendar
  const newSchedule = {};
  
  // Initialize all cells with existing manual pairings (auto-scheduled ones were cleared)
  DAYS.forEach(day => {
    TIMES.forEach(time => {
      const cellKey = `${day.toLowerCase()}-${time.toLowerCase()}`;
      newSchedule[cellKey] = [...(clearedSchedule[cellKey] || [])];
    });
  });
  
  console.log('Pairings to schedule:', pairings.map(p => `${p.tutor.fullName} → ${p.student.fullName}`));
  
  // Schedule each pairing, preferring lunch
  pairings.forEach(({ tutor, student }) => {
    const slot = findBestTimeSlot(tutor, student, newSchedule);
    
    if (slot) {
      const newPairing = createPairing(tutor, student);
      newPairing.autoScheduled = true;
      newSchedule[slot].push(newPairing);
    } else {
      unpairedStudents.push(student);
    }
  });
  
  return { schedule: newSchedule, unpairedStudents };
};
