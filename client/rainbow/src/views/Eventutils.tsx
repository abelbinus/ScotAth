/**
 * Formats an event code by breaking it down into its main components:
 * main event code, round, and heat. This function assumes a specific format
 * of the event code with a hyphen separating the main code and the round/heat
 * information.
 *
 * @param eventCode The event code string that needs to be formatted.
 * @returns A formatted string detailing the main event code, round, and heat,
 *          or the original event code if the format is unexpected.
 */
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

/**
 * Sorts a list of athletes based on their event code and final position (finalPFPos).
 * The sorting is done in two steps:
 * 1. First, the athletes are sorted by their event code.
 * 2. Then, they are sorted by their final position within each event code.
 * 
 * @param athletes The array of athlete objects to be sorted.
 * @returns A new array of athletes sorted first by event code and then by final position.
 */
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
