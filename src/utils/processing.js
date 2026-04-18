// Processing utilities for sheet data manipulation

/**
 * Parses sheet data to extract tutors and students with availability
 * @param {Array} rows - The sheet rows
 * @returns {Object} { tutors: [], students: [] }
 */
export const parseTutorsAndStudents = (rows) => {
  if (!rows || rows.length === 0) return { tutors: [], students: [] };

  const tutors = [];
  const students = [];

  // Skip header row if it exists
  const dataRows = rows[0] && rows[0][0] === 'Timestamp' ? rows.slice(1) : rows;

  dataRows.forEach((row, index) => {
    if (row.length < 9) return; // Skip incomplete rows - need up to notes column (which contains email)

    const person = {
      id: index,
      firstName: row[1] || '',
      lastName: row[2] || '',
      grade: row[3] || '',
      fullName: `${row[1] || ''} ${row[2] || ''}`.trim(),
      role: row[4] || '',
      availability: parseTimeSpecificAvailability(row[5] || '', row[6] || '', row[7] || ''),
      email: row[8] || '', // Email is stored in the notes column
      notes: '' // Notes field is now empty since it contains email
    };

    // Determine if they're a tutor or student based on their response
    if (person.role.includes('BE a peer tutor')) {
      tutors.push(person);
    } else if (person.role.includes('looking for a peer tutor')) {
      students.push(person);
    }
  });

  return { tutors, students };
};

/**
 * Parses comma-separated availability string into structured format
 * @param {string} availabilityStr - e.g., "Monday, Tuesday, Wednesday"
 * @returns {Object} { monday: boolean, tuesday: boolean, ... }
 */
const parseAvailability = (availabilityStr) => {
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
  const availability = {};

  days.forEach(day => {
    availability[day] = availabilityStr.toLowerCase().includes(day);
  });

  return availability;
};

/**
 * Parses time-specific availability into structured format
 * @param {string} morningStr - Morning availability
 * @param {string} lunchStr - Lunch availability
 * @param {string} afterschoolStr - After school availability
 * @returns {Object} { monday: {morning: boolean, lunch: boolean, afterschool: boolean}, ... }
 */
const parseTimeSpecificAvailability = (morningStr, lunchStr, afterschoolStr) => {
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
  const availability = {};

  days.forEach(day => {
    availability[day] = {
      morning: morningStr.toLowerCase().includes(day),
      lunch: lunchStr.toLowerCase().includes(day),
      afterschool: afterschoolStr.toLowerCase().includes(day)
    };
  });

  return availability;
};

/**
 * Checks if a person is available for a specific time slot
 * @param {Object} person - Person object with availability
 * @param {string} day - 'monday', 'tuesday', etc.
 * @param {string} time - 'morning', 'lunch', 'afterschool'
 * @param {boolean} isTutor - Whether checking tutor or student availability (not used in new structure)
 * @returns {boolean} True if available
 */
export const isPersonAvailable = (person, day, time, isTutor = true) => {
  if (!person || !person.availability) return false;

  const dayKey = day.toLowerCase();
  const timeKey = time.toLowerCase();

  if (!person.availability[dayKey]) return false;

  return person.availability[dayKey][timeKey] === true;
};

/**
 * Creates a pairing between a tutor and student
 * @param {Object} tutor - Tutor object
 * @param {Object} student - Student object
 * @returns {Object} Pairing object
 */
export const createPairing = (tutor, student) => {
  return {
    id: `${tutor.id}-${student.id}`,
    tutor,
    student,
    created: new Date()
  };
};

/**
 * Checks if a pairing can be scheduled at a specific time slot
 * @param {Object} pairing - Pairing object
 * @param {string} day - Day of week
 * @param {string} time - Time slot
 * @returns {boolean} True if both are available
 */
export const canSchedulePairing = (pairing, day, time, schedule, cellKey) => {
  const tutorAvailable = isPersonAvailable(pairing.tutor, day, time, true);
  const studentAvailable = isPersonAvailable(pairing.student, day, time, false);
  
  // Check if tutor or student is already scheduled in this slot
  if (schedule && cellKey) {
    const cellPairings = schedule[cellKey] || [];
    const tutorAlreadyScheduled = cellPairings.some(
      p => p.tutor.id === pairing.tutor.id
    );
    const studentAlreadyScheduled = cellPairings.some(
      p => p.student.id === pairing.student.id
    );
    
    if (tutorAlreadyScheduled || studentAlreadyScheduled) {
      return false;
    }
  }
  
  return tutorAvailable && studentAvailable;
};

/**
 * Sorts rows by a specific column index
 * @param {Array} rows - The sheet rows
 * @param {number} columnIndex - The column to sort by (0-based)
 * @param {boolean} ascending - Sort ascending or descending
 * @returns {Array} Sorted rows
 */
export const sortRows = (rows, columnIndex, ascending = true) => {
  if (!rows || rows.length === 0) return rows;

  return [...rows].sort((a, b) => {
    const aVal = a[columnIndex] || '';
    const bVal = b[columnIndex] || '';

    if (ascending) {
      return aVal.localeCompare(bVal);
    } else {
      return bVal.localeCompare(aVal);
    }
  });
};

/**
 * Filters rows based on a search term in a specific column
 * @param {Array} rows - The sheet rows
 * @param {number} columnIndex - The column to filter by (0-based)
 * @param {string} searchTerm - The term to search for
 * @returns {Array} Filtered rows
 */
export const filterRows = (rows, columnIndex, searchTerm) => {
  if (!rows || !searchTerm) return rows;

  return rows.filter(row => {
    const cellValue = row[columnIndex] || '';
    return cellValue.toLowerCase().includes(searchTerm.toLowerCase());
  });
};

/**
 * Parse a block of plain text (CSV or tab-delimited) into a row array
 * @param {string} text - pasted spreadsheet data
 * @returns {Array<Array<string>>}
 */
export const parseSpreadsheetText = (text) => {
  return text
    .split(/\r?\n/)
    .filter((line) => line.trim() !== "")
    .map((line) => {
      const delimiter = line.includes("\t") ? "\t" : ",";
      return line.split(delimiter).map((cell) => cell.trim());
    });
};