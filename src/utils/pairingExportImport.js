// Export schedule to readable text format
export const exportScheduleToText = (schedule, DAYS, TIMES, tutors = [], students = []) => {
  const allPairings = [];
  const pairedTutorIds = new Set();
  const pairedStudentIds = new Set();

  // Collect all pairings with their times
  DAYS.forEach(day => {
    TIMES.forEach(time => {
      const cellKey = `${day.toLowerCase()}-${time.toLowerCase()}`;
      const pairings = schedule[cellKey] || [];
      
      pairings.forEach(pairing => {
        allPairings.push({
          tutor: pairing.tutor.fullName,
          tutorGrade: pairing.tutor.grade,
          student: pairing.student.fullName,
          studentGrade: pairing.student.grade,
          day,
          time,
          tutorId: pairing.tutor.id,
          studentId: pairing.student.id
        });
        pairedTutorIds.add(pairing.tutor.id);
        pairedStudentIds.add(pairing.student.id);
      });
    });
  });

  let text = '';

  // Add all scheduled pairings
  allPairings.forEach(pairing => {
    text += `${pairing.day}\t${pairing.time}\t${pairing.tutor} (${pairing.tutorGrade})\t${pairing.student} (${pairing.studentGrade})\n`;
  });

  // Add unpaired tutors
  tutors.forEach(tutor => {
    if (!pairedTutorIds.has(tutor.id)) {
      text += `Unscheduled\tUnscheduled\t${tutor.fullName} (${tutor.grade})\t-\n`;
    }
  });

  // Add unpaired students
  students.forEach(student => {
    if (!pairedStudentIds.has(student.id)) {
      text += `Unscheduled\tUnscheduled\t-\t${student.fullName} (${student.grade})\n`;
    }
  });

  return text;
};

// Parse text format back to schedule
export const importScheduleFromText = (text, schedule, tutors, students, DAYS, TIMES) => {
  const lines = text.split('\n');
  const errors = [];
  let addedCount = 0;

  // Create maps for quick lookup
  const tutorMap = {};
  const studentMap = {};
  
  tutors.forEach(t => {
    tutorMap[t.fullName.toLowerCase()] = t;
  });
  
  students.forEach(s => {
    studentMap[s.fullName.toLowerCase()] = s;
  });

  const newSchedule = JSON.parse(JSON.stringify(schedule)); // Deep copy

  // Process each line - start from line 0, no header
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Use regex to extract the structured data more reliably
    // Pattern: Day\tTime\t...Tutor Name (Grade)...  Student Name (Grade)
    const lineMatch = line.match(/^(\w+)\s+(\w+)\s+(.+?)\s+(.+)$/);
    
    if (!lineMatch) continue;

    let day = lineMatch[1];
    let time = lineMatch[2];
    let tutorStudent = lineMatch[3] + ' ' + lineMatch[4];

    // Try to find pattern: "Name (X)" repeated twice or "-"
    // Match patterns like: "John Doe (10)" and "Jane Smith (9)" or "-"
    const pairingsMatch = tutorStudent.match(/(.+?\s*\([^)]+\)|\-)\s+(.+?\s*\([^)]+\)|\-)$/);
    
    if (!pairingsMatch) {
      // Try alternate parsing - look for all content with parentheses
      const altMatch = line.match(/^(\w+)\s+(\w+)\s+(.+?)\(\s*(\w+)\s+(\d+)\s*\)\s+(.+?|\-)(?:\(\s*(\w+)\s+(\d+)\s*\))?$/);
      if (altMatch) {
        day = altMatch[1];
        time = altMatch[2];
        const tutorPart = altMatch[3].trim();
        const studentPart = altMatch[6].trim();
        
        // Handle "-" for unpaired
        if (tutorPart === '-' || studentPart === '-') {
          // Skip unpaired entries - they don't need to be imported as pairings
          continue;
        }

        const tutor = tutorMap[tutorPart.toLowerCase()];
        const student = studentMap[studentPart.toLowerCase()];

        if (!tutor || !student) {
          if (!tutor) errors.push(`Line ${i + 1}: Tutor "${tutorPart}" not found.`);
          if (!student) errors.push(`Line ${i + 1}: Student "${studentPart}" not found.`);
          continue;
        }

        // Validate day and time
        if (!DAYS.map(d => d.toLowerCase()).includes(day.toLowerCase())) {
          errors.push(`Line ${i + 1}: Invalid day "${day}".`);
          continue;
        }

        if (!TIMES.map(t => t.toLowerCase()).includes(time.toLowerCase())) {
          errors.push(`Line ${i + 1}: Invalid time "${time}".`);
          continue;
        }

        const cellKey = `${day.toLowerCase()}-${time.toLowerCase()}`;
        const newPairing = {
          id: `${tutor.id}-${student.id}-${Date.now()}`,
          tutor,
          student
        };

        const exists = newSchedule[cellKey].some(
          p => p.tutor.id === tutor.id && p.student.id === student.id
        );

        if (!exists) {
          newSchedule[cellKey].push(newPairing);
          addedCount++;
        }
      }
      continue;
    }

    let tutorPart = pairingsMatch[1].trim();
    let studentPart = pairingsMatch[2].trim();

    // Skip if either is "-" (unpaired)
    if (tutorPart === '-' || studentPart === '-') {
      continue;
    }

    // Parse tutor name and grade
    const tutorMatch = tutorPart.match(/^(.+?)\s*\(\s*(\w+)\s+(\d+)\s*\)$/);
    const studentMatch = studentPart.match(/^(.+?)\s*\(\s*(\w+)\s+(\d+)\s*\)$/);

    if (!tutorMatch || !studentMatch) {
      errors.push(`Line ${i + 1}: Could not parse format. Expected "Name (Grade)" format.`);
      continue;
    }

    const tutorName = tutorMatch[1].trim();
    const studentName = studentMatch[1].trim();

    // Find matching tutor and student
    const tutor = tutorMap[tutorName.toLowerCase()];
    const student = studentMap[studentName.toLowerCase()];

    if (!tutor) {
      errors.push(`Line ${i + 1}: Tutor "${tutorName}" not found in tutors list.`);
      continue;
    }

    if (!student) {
      errors.push(`Line ${i + 1}: Student "${studentName}" not found in students list.`);
      continue;
    }

    // Validate day and time
    if (!DAYS.map(d => d.toLowerCase()).includes(day.toLowerCase())) {
      errors.push(`Line ${i + 1}: Invalid day "${day}". Must be one of: ${DAYS.join(', ')}`);
      continue;
    }

    if (!TIMES.map(t => t.toLowerCase()).includes(time.toLowerCase())) {
      errors.push(`Line ${i + 1}: Invalid time "${time}". Must be one of: ${TIMES.join(', ')}`);
      continue;
    }

    // Create pairing and add to schedule
    const cellKey = `${day.toLowerCase()}-${time.toLowerCase()}`;
    const newPairing = {
      id: `${tutor.id}-${student.id}-${Date.now()}`,
      tutor,
      student
    };

    // Check if this pairing already exists in this time slot
    const exists = newSchedule[cellKey].some(
      p => p.tutor.id === tutor.id && p.student.id === student.id
    );

    if (exists) {
      errors.push(`Line ${i + 1}: Pairing "${tutorName}" - "${studentName}" at ${day} ${time} already exists.`);
      continue;
    }

    newSchedule[cellKey].push(newPairing);
    addedCount++;
  }

  return { schedule: newSchedule, errors, addedCount };
};
