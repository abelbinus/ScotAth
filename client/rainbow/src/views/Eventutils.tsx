export const formatEventCode = (eventCode: string) => {
  if (eventCode.includes('-')) {
    const parts = eventCode.split('-');
    if (parts.length === 2) {
      const mainEventCode = parts[0]; // Assuming eventCode always has a main code before "-"
      let round = null;
      let heat = null;

      if (parts[1].length === 2) {
        round = parts[1][0]; // Assuming round is the first character after "-"
        heat = parts[1].slice(1); // Assuming heat is the characters after the first one after "-"
      } else if (parts[1].length === 3) {
        round = parts[1][0]; // Extract the first character as round
        heat = parts[1].slice(1); // Extract the remaining characters as heat
      } else if (parts[1].length === 4) {
        round = parts[1].slice(0, 2); // Extract the first 2 characters as round
        heat = parts[1].slice(2); // Extract the remaining 2 characters as heat
      }

      return `Event Code: ${mainEventCode}, Round: ${round}, Heat: ${heat}`;
    }
  }

  return eventCode; // If format is unexpected, return the original eventCode
};

export const sortBasedonRank = (athletes: any) => {
  const sortedAthletesInfo = [...athletes].sort((athlete1, athlete2) => {
    // Sort by eventCode first
    const eventCodeComparison = athlete1.eventCode.localeCompare(athlete2.eventCode);
    if (eventCodeComparison !== 0) {
      return eventCodeComparison;
    }
  
    // Sort by finalPos (assuming finalPos is a string representing finishing position)
    if (athlete1.finalPFPos === null && athlete2.finalPFPos === null) {
      return 0;
    } else if (athlete1.finalPFPos === null) {
      return 1; // athlete1 with null finalPos comes after athlete2
    } else if (athlete2.finalPFPos === null) {
      return -1; // athlete2 with null finalPos comes after athlete1
    } else {
      return athlete1.finalPFPos.localeCompare(athlete2.finalPFPos);
    }
  });
  return sortedAthletesInfo;
}