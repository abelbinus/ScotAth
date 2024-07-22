const path = require('path');
const fs = require('fs');
const logger = require('./logger');

// async function fileExists(filePath) {
//     try {
//         await fs.access(filePath);
//         return true;
//     } catch (error) {
//         return false;
//     }
// }

function findScotathClientDir(currentDir) {
    // Check if both 'sqlite' and 'client' directories exist in currentDir
    const clientExists = fs.existsSync(path.join(currentDir, 'client'));

    if (clientExists) {
        logger.info('Client folder found in current directory');
        return currentDir;
    }
    const parentDir = path.resolve(currentDir, '..');
    if (parentDir === currentDir) {
        logger.error('Folder doesn\'t contain client folder');
        throw new Error('Folder doesn\'t contain client folder');
    }
    return findScotathClientDir(parentDir);
}

function findScotathDBDir(currentDir) {
    // Check if both 'sqlite' and 'client' directories exist in currentDir
    const sqliteExists = fs.existsSync(path.join(currentDir, 'sqlite'));

    if (sqliteExists) {
        logger.info('Database found in current directory');
        return currentDir;
    }
    const parentDir = path.resolve(currentDir, '..');
    if (parentDir === currentDir) {
        logger.error('Folder doesn\'t contain sqlite folder');
        throw new Error('Folder doesn\'t contain sqlite folder');
    }
    return findScotathDBDir(parentDir);
}

// Inside your route handler for updating start lists

function deleteExistingEvents(meetID, db) {
    return new Promise((resolve, reject) => {
        // Delete existing records from tblEvent
        let sqlDeleteEvent = `DELETE FROM tblevents WHERE MeetID = ?`;
        db.run(sqlDeleteEvent, [meetID], function(err) {
            if (err) {
            console.error('Error deleting records from tblevents:', err.message);
            return reject({ error: 'Failed to delete records from tblevents' });
            }
            resolve();
        });
    });
}

function deleteEventInfo(meetID, db) {
    return new Promise((resolve, reject) => {
        // Delete existing records from tblEvent
        let sqlDeleteEvent = `DELETE FROM tbleventinfo WHERE MeetID = ?`;
        db.run(sqlDeleteEvent, [meetID], function(err) {
            if (err) {
            console.error('Error deleting records from tbleventinfo:', err.message);
            return reject({ error: 'Failed to delete records from tbleventinfo' });
            }
            resolve();
        });
    });
}

function makeEventNum(event, round, heat) {
    const firstbit = String(event).padStart(3, '0');
    const lastbit = String(heat).padStart(2, '0');
    return `${firstbit}-${round}${lastbit}`;
}

async function readFile(folderPath, fileName) {
    const filePath = path.join(folderPath, fileName);

    try {
        const content = await fs.promises.readFile(filePath, 'utf-8');
        // Remove UTF-8 BOM if present
        // if (content.charCodeAt(0) === 0xFEFF) {
        //     content = content.slice(1);
        // }
        logger.info(`Text file ${fileName} successfully processed.`);
        return content;
    } catch (error) {
        logger.error(`Error reading file ${fileName}: ${error.message}`);
        throw new Error(`Error reading file ${fileName}: ${error.message}`);
    }
}

async function copyFile(srcFolder, destFolder, fileName) {
    const srcFilePath = path.join(srcFolder, fileName);
    const destFilePath = path.join(destFolder, fileName);

    try {
        await fs.promises.copyFile(srcFilePath, destFilePath);
        logger.info(`File ${fileName} successfully copied from ${srcFolder} to ${destFolder}.`);
        return true;
    } catch (error) {
        logger.error(`Error copying file ${fileName}: ${error.message}`);
        return false;
    }
}

async function readEventListFiles (folderPath, intFolder, eventList, meetId, db, res) {
    let evtContents = [];
    let pplContents = [];
    let copyError = null;
    let dbError = null;
    let [failedFlagEventInfo, failedFlagEvents, totalFlagEventinfo, totalFlagEvents] = [null, null, null, null];
    if (eventList === 'FL') {
        const fileName = 'lynx.evt';
        const fileNamePpl = 'lynx.ppl';

        try {
            evtContents = await readFile(folderPath, fileName);
            pplContents = await readFile(folderPath, fileNamePpl);
            [failedFlagEventInfo, failedFlagEvents, totalFlagEventinfo, totalFlagEvents] = await insertFLIntoDatabase(evtContents, pplContents, meetId, db);
            postEventsResponse(failedFlagEventInfo, failedFlagEvents, totalFlagEventinfo, totalFlagEvents, copyError, dbError, res);
        } catch (error) {
            console.log(error);
            if(copyError) {
                logger.error(`Error reading file ${fileName}: ${error.message}`);
                res.json({
                    error: {
                        message: `Failed to update start list.`,
                        copyError
                    },
                    status: 'failure'
                });
            }
            else {
                res.json({
                    error: {
                        message: `Failed to update start list.`
                    },
                    fileNamePpl: pplContents,
                    fileName: evtContents,
                    status: 'failure'
                });
            }
        }

    } else if (eventList === 'OMEGA' || eventList === 'HYTEK OMEGA') {
        const fileName = 'startlist.csv';
        let fileContents = [];

        if (eventList === 'HYTEK OMEGA' && intFolder.trim() !== '' && intFolder !== null){
            const copySuccess = await copyFile(intFolder, folderPath, fileName);
            if (!copySuccess) {
                copyError = `Failed to copy startlist from interface.`;
            }
        }

        try {
            fileContents = await readFile(folderPath, fileName);
            [failedFlagEventInfo, failedFlagEvents, totalFlagEventinfo, totalFlagEvents] = await insertCSVIntoDatabase(fileContents, meetId, db);
            postEventsResponse(failedFlagEventInfo, failedFlagEvents, totalFlagEventinfo, totalFlagEvents, copyError, dbError, res);

        } catch (error) {
            if(copyError) {
                logger.error(`Error reading file ${fileName}: ${error.message}`);
                res.json({
                    error: {
                        message: `Failed to update start list.`,
                        copyError
                    },
                    status: 'failure'
                });
            }
            else {
                logger.error(`Error reading file ${fileName}: ${error.message}`);
                res.json({
                    error: {
                        message: `Failed to update start list.`
                    },
                    status: 'failure'
                });
            }
        }
    }
}

function reformatEventCode(eventCode) {
    // Match the pattern to capture groups: first part, second part without last 2 digits, and last 2 digits
    const match = eventCode.match(/(\d+)-(\d)(\d{2})/);
    if (match) {
      // Construct the new format with an additional hyphen before the last 2 digits
      return `${match[1]}-${match[2]}-${match[3]}`;
    } else {
      throw new Error('Invalid event code format');
    }
  }

async function readPFFiles(folderPath, pfOutput, meetId, eventCode, db, res) {
    let extension;
    if (pfOutput === 'lif') {
        eventCode = reformatEventCode(eventCode);
        extension = '.lif';
    } else if (pfOutput === 'cl') {
        extension = '.cl';
    } else {
        throw new Error('Invalid pfOutput value. Expected "lif" or "cl".');
    }
    // Attempt to read file with lowercase and uppercase extension
    const lowerCaseFileName = `${eventCode}${extension.toLowerCase()}`;
    const upperCaseFileName = `${eventCode}${extension.toUpperCase()}`;

    let fileContent;
    
    try {
        if (fs.existsSync(path.join(folderPath, lowerCaseFileName))) {
            fileContent = await readFile(folderPath, lowerCaseFileName);
        } else if (fs.existsSync(path.join(folderPath, upperCaseFileName))) {
            fileContent = await readFile(folderPath, upperCaseFileName);
        } else {
            throw new Error(`File not found with either ${lowerCaseFileName} or ${upperCaseFileName}`);
        }
    } catch (error) {
        logger.error(`Error processing file ${lowerCaseFileName} or ${upperCaseFileName}: ${error.message}`);
        throw new Error(`Error processing file ${lowerCaseFileName} or ${upperCaseFileName}: ${error.message}`);
    }

    try {
        let failedFlagEventInfo = 0;
        let failedFlagEvents = 0;
        let totalFlagEventinfo = 0; // Total number of event info rows
        let totalFlagEvents = 0; // Total number of event rows
        let dbError = null;
        // Process the content as needed, e.g., insert into the database
        if (pfOutput === 'lif') {
            [failedFlagEventInfo, failedFlagEvents, totalFlagEventinfo, totalFlagEvents] = await insertLifIntoDatabase(fileContent, failedFlagEventInfo, failedFlagEvents, totalFlagEventinfo, totalFlagEvents, meetId, db);
        } else if (pfOutput === 'cl') {
            console.log('Processing cl file');
            [failedFlagEventInfo, failedFlagEvents, totalFlagEventinfo, totalFlagEvents] = await insertCLIntoDatabase(fileContent, failedFlagEventInfo, failedFlagEvents, totalFlagEventinfo, totalFlagEvents, meetId, db, eventCode);
        }
        if (failedFlagEventInfo > 0 && failedFlagEvents > 0) {
            dbError = `Database error updating event info and events.`;
        } else if (failedFlagEventInfo > 0) {
            dbError = `Database error updating event info.`;
        } else if (failedFlagEvents > 0) {
            dbError = `Database error updating events.`;
        }
        if (dbError) {
            res.json({
                error: {
                    eventCode: eventCode,
                    message: `Failed to update phtofinish results for ${lowerCaseFileName}.`,
                    dbError
                },
                status: 'failure'
            });
        } else {
            res.json({message: `Updated photofinish results successfully for ${lowerCaseFileName}.`, status: 'success'});
        }
    } catch (error) {
        logger.error(`Error reading file: ${error.message}`);
        res.json({
            error: {
                eventCode: eventCode,
                message: `Failed to update photofinish for ${lowerCaseFileName}.`
            },
            status: 'failure'
        });
    }
}

async function insertFLIntoDatabase(evtContents, pplContents, meetId, db) {
    const pplLines = pplContents.split('\n');
    const evtLines = evtContents.split('\n');
    let ppl_firstName = {};
    let ppl_lastName = {};
    let ppl_athleteClub = {};
    let currentEvent = null;
    let failedFlagEventInfo = 0;
    let failedFlagEvents = 0;
    let totalFlagEventinfo = 0; // Total number of event info rows
    let totalFlagEvents = 0; // Total number of event rows
    let pplExists = false;
    for (const row of pplLines) {
        const columns = row.split(',');
        if (columns.length > 3 && columns[0]) {
            ppl_firstName[columns[0]] = columns[2].trim();
            ppl_lastName[columns[0]] = columns[1].trim();
            ppl_athleteClub[columns[0]] = columns[3].trim();
        }
    };
    pplExists = true;

    for (const row of evtLines) {
        const columns = row.split(',').map(col => col.trim());
        let numColumns = columns.length;

        if (columns[0] && columns[0].includes('Event')) { // New event header row
            currentEvent = columns;
        }
        else if (columns[0]) {
            currentEvent = columns;
            const [
                eventCode, eventName
            ] = [
                makeEventNum(currentEvent[0], currentEvent[1], currentEvent[2]), currentEvent[3]
            ];

            let eventLength = null;
            if(numColumns > 9) {
                eventLength = currentEvent[9];
            }
            totalFlagEventinfo, failedFlagEventInfo = await dbQueryTblEventInfo(eventCode, null, null, eventLength, eventName, null, null, totalFlagEventinfo, failedFlagEventInfo, meetId, db);        
        }
        else {
            const eventCode = makeEventNum(currentEvent[0], currentEvent[1], currentEvent[2]);
            if(numColumns > 1) {
                const athleteNum = columns[1].trim();
                let firstName = null;
                let lastName = null;
                let athleteClub = null;
                let laneOrder = null;
                if (athleteNum.length > 0) {
                    laneOrder = columns[2].trim();

                    if (numColumns > 3 || pplExists) {
                        lastName = ppl_lastName[athleteNum] || '';
                    }

                    if (numColumns > 4 || pplExists) {
                        firstName = ppl_firstName[athleteNum] || '';
                    }

                    if (numColumns > 5 || pplExists) {
                        athleteClub = ppl_athleteClub[athleteNum] || '';
                    }
                }
                if(laneOrder.length > 0) {
                    totalFlagEvents, failedFlagEvents = await dbQueryTblEvents(eventCode, laneOrder, athleteNum, lastName, firstName, athleteClub, totalFlagEvents, failedFlagEvents, meetId, db);
                }
            }
            
        }
    }

    return [failedFlagEventInfo, failedFlagEvents, totalFlagEventinfo, totalFlagEvents];
}

// Function to detect the delimiter
function detectDelimiter(data) {
    const lines = data.split('\n').slice(0, 10); // Check the first 10 lines
    let semicolonCount = 0;
    let commaCount = 0;

    for (const line of lines) {
        semicolonCount += (line.match(/;/g) || []).length;
        commaCount += (line.match(/,/g) || []).length;
    }

    return semicolonCount > commaCount ? ';' : ',';
}

// Function to insert content into SQLite database
async function insertCSVIntoDatabase(content, meetId, db) {
    const delimiter = detectDelimiter(content);
    const rows = content.split('\n');

    let currentEvent = null;
    let failedFlagEventInfo = 0;
    let failedFlagEvents = 0;
    let totalFlagEventinfo = 0; // Total number of event info rows
    let totalFlagEvents = 0; // Total number of event rows
    for (const row of rows) {
        const columns = row.split(delimiter).map(col => col.trim());
        if (columns[0] && columns[0].includes('Event')) { // New event header row
            currentEvent = columns;
        } 
        else if (columns[0]) {
            currentEvent = columns;
            totalFlagEventinfo, failedFlagEventInfo = await dbQueryTblEventInfo(currentEvent[0], currentEvent[1], currentEvent[2], currentEvent[8], currentEvent[9], currentEvent[10], currentEvent[11], totalFlagEventinfo, failedFlagEventInfo, meetId, db);
        } else if (currentEvent && columns.length > 1) { // Athlete row
            totalFlagEvents, failedFlagEvents = await dbQueryTblEvents(currentEvent[0], columns[3], columns[4], columns[5], columns[6], columns[7], totalFlagEvents, failedFlagEvents, meetId, db);
            
        }
    }

    // Combine the flags into an array and return
    return [failedFlagEventInfo, failedFlagEvents, totalFlagEventinfo, totalFlagEvents];
}

async function insertCLIntoDatabase(content, failedFlagEventInfo, failedFlagEvents, totalFlagEventinfo, totalFlagEvents, meetId, db, eventCode) {
    const data = content;
    const lines = data.split('\n');
    let found = 0;
    let rank = -1;
    let eventName = '';
    let raceLength = '';
    let windSpeed = '';
    let eventDate = '';
    let eventTime = '';
    
    lines.forEach(async (myLine, line_num) => {
        let athRank = '';
        let lane = '';
        let athNum = '';
        let firstName = '';
        let lastName = '';
        let club = '';
        let time = '';
        let type = '';
        if (line_num === 0) {
        } 
        else {
            if (myLine.toLowerCase().includes('race length')) {
                found = line_num;
                if (line_num > 2) {
                    eventName = lines[line_num - 2].trim();
                }
                const columns = myLine.split(":");
                if (columns.length > 1) {
                    raceLength = columns[1].trim(); // Trim leading/trailing spaces
                }
            }
            if (myLine.toLowerCase().includes('wind speed')) {
                if (!myLine.toLowerCase().includes('no measurement')) {
                    const columns = myLine.split(":");
                    if (columns.length > 1) {
                        windSpeed = columns[1].trim(); // Trim leading/trailing spaces
                    }
                }
            }
            if (myLine.toLowerCase().includes('start :')) {
                const columns = myLine.split(/:(.*)/); // Split only on the first colon
                if (columns.length > 1) {
                    const dateTime = columns[1].trim().split(' '); // Trim leading/trailing spaces
                    if(dateTime.length > 2) {
                        eventDate = dateTime[0];
                        eventTime = dateTime[2];
                    }
                    else if (dateTime.length > 1) {
                        eventDate = dateTime[0];
                        eventTime = dateTime[1];
                    }
                    else {
                        eventTime = dateTime[0];
                    }
                }
            }
            if (found > 0 && line_num > found + 7) {
                if (rank < 0) {
                    if (myLine.includes('---')) {
                        rank = 0;
                    }
                } else {
                    const dot = myLine.indexOf('.');
                    if (dot !== -1) {
                        athRank = myLine.slice(0, dot);
                        const remainingLine = myLine.slice(dot + 1);
                        const columns = remainingLine.split(" ").filter(word => word.trim().length > 0);
                        for (let i = 0; i < columns.length; i++) {
                            if(i === 0) {
                                lane = columns[i];
                            } else if(i === 1) {
                                athNum = columns[i];
                            } else if(i === 2) {
                                firstName = columns[i];
                            } else if(i === 3) {
                                lastName = columns[i];
                            } else if (i === 4 && columns.length > 6) {
                                type = columns[i];
                            }
                            else if (columns[i].includes('.') && !isNaN(parseFloat(columns[i].split('.')[0]))) {
                                time = columns[i];
                                break;
                            }
                            else {
                                club = club + ' ' + (columns[i]);
                            }
                        }
                    }
                }
            }
            if(athRank) {
                totalFlagEvents, failedFlagEvents = await updateDBQueryTblEvents(eventCode, athRank, athNum, time, totalFlagEventinfo, failedFlagEventInfo, meetId, db);
            }
        }
      });
    totalFlagEventinfo, failedFlagEventInfo = await updateDBQueryTblEventInfo(eventCode, eventName, eventTime, totalFlagEventinfo, failedFlagEventInfo, meetId, db);
    // Combine the flags into an array and return
    return [failedFlagEventInfo, failedFlagEvents, totalFlagEventinfo, totalFlagEvents];
}

async function insertLifIntoDatabase(content, failedFlagEventInfo, failedFlagEvents, totalFlagEventinfo, totalFlagEvents, meetId, db) {
    const data = content;
    const rows = data.split('\n');
    let currentEvent = null;
    let titleRow = false;
    let eventPFTime = null;
    for (let i=0; i<rows.length; i++) {
        const row = rows[i];
        const columns = row.split(',').map(col => col.trim());
        let numColumns = columns.length;
        if (columns[0] && columns[0].includes('Event')) { // New event header row
            currentEvent = columns;
            titleRow = true;
        } 
        else if ( i==0 && !titleRow) {
            currentEvent = columns;
            const [
                eventCode, eventName
            ] = [
                makeEventNum(currentEvent[0], currentEvent[1], currentEvent[2]), currentEvent[3]
            ];
            if(numColumns > 9) {
                eventPFTime = currentEvent[10];
            }
            totalFlagEventinfo, failedFlagEventInfo = await updateDBQueryTblEventInfo(eventCode, eventName, eventPFTime, totalFlagEventinfo, failedFlagEventInfo, meetId, db);
        } else if (currentEvent && columns.length > 1) { // Athlete row
            const eventCode = makeEventNum(currentEvent[0], currentEvent[1], currentEvent[2]);
            totalFlagEvents, failedFlagEvents = await updateDBQueryTblEvents(eventCode, columns[0], columns[1], columns[6], totalFlagEvents, failedFlagEvents, meetId, db);
            
        }
    }
    // Combine the flags into an array and return
    return [failedFlagEventInfo, failedFlagEvents, totalFlagEventinfo, totalFlagEvents];
}

async function dbQueryTblEventInfo(eventCode, eventDate, eventTime, eventLength, eventName, title2, sponsor, totalFlagEventinfo, failedFlagEventInfo, meetId, db) {
    const eventInfoSql = `
        INSERT INTO tbleventinfo (meetId, eventCode, eventDate, eventTime, eventLength, eventName, title2, sponsor)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.run(eventInfoSql, [meetId, eventCode, eventDate, eventTime, eventLength, eventName, title2, sponsor], function(err) {
        totalFlagEventinfo++;
        if (err) {
            failedFlagEventInfo++;
            logger.error(`Error inserting event info into database:`, err);
            return 1;
        } else {
            logger.info(`Event Info inserted successfully into database from file ${eventCode}`);
        }
    });
    return [totalFlagEventinfo, failedFlagEventInfo];    
}

async function dbQueryTblEvents(eventCode, laneOrder, athleteNum, lastName, firstName, athleteClub, totalFlagEvents, failedFlagEvents, meetId, db) {
    const sql = `
        INSERT INTO tblevents (meetId, eventCode, laneOrder, athleteNum, lastName, firstName, athleteClub)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    db.run(sql, [meetId, eventCode, laneOrder, athleteNum, lastName, firstName, athleteClub], function(err) {
        totalFlagEvents++;
        if (err) {
            failedFlagEvents++;
            logger.error(`Error inserting row into database:`, err);
        } else {
            logger.info(`Athlete ${athleteNum} inserted successfully into database for event ${eventCode}`);
        }
    });
    return [totalFlagEvents, failedFlagEvents];    
}

async function updateDBQueryTblEventInfo(eventCode, eventName, eventPFTime, totalFlagEventinfo, failedFlagEventInfo, meetId, db) {
    const query = `
      UPDATE tbleventinfo
      SET eventName = ?,
          eventPFTime = ?
      WHERE MeetID = ? AND eventCode = ?;
    `;

    db.run(query, [eventName, eventPFTime, meetId, eventCode], function(err) {
        totalFlagEventinfo++;
        if (err) {
            failedFlagEventInfo++;
            logger.error(`Error inserting event info into database:`, err);
            return 1;
        } else {
            logger.info(`Event Info inserted successfully into database from file ${eventCode}`);
        }
    });
    return [totalFlagEventinfo, failedFlagEventInfo];
}

async function updateDBQueryTblEvents(eventCode, finalPFPos, athleteNum, finalPFTime, totalFlagEventinfo, failedFlagEventInfo, meetId, db) {
    const query = `
      UPDATE tblevents
      SET finalPFPos = ?,
          finalPFTime = ?
      WHERE MeetID = ? AND eventCode = ? AND athleteNum = ?;
    `;

    db.run(query, [finalPFPos, finalPFTime, meetId, eventCode, athleteNum], function(err) {
        totalFlagEventinfo++;
        if (err) {
            failedFlagEventInfo++;
            logger.error(`Error inserting event info into database:`, err);
            return 1;
        } else {
            logger.info(`Athlete ${athleteNum} inserted successfully into database from file ${eventCode}`);
        }
    });
    return [totalFlagEventinfo, failedFlagEventInfo];
}

function postEventsResponse(failedFlagEventInfo, failedFlagEvents, totalFlagEventinfo, totalFlagEvents, copyError, dbError, res) {
    if (failedFlagEventInfo > 0 && failedFlagEvents > 0) {
        dbError = `Database error inserting event info and events: ${failedFlagEventInfo} eventinfo errors out of ${totalFlagEventinfo} rows and ${failedFlagEvents} event errors out of ${totalFlagEvents} rows`;
    } else if (failedFlagEventInfo > 0) {
        dbError = `Database error inserting event info: ${failedFlagEventInfo} errors out of ${totalFlagEventinfo} rows`;
    } else if (failedFlagEvents > 0) {
        dbError = `Database error inserting events: ${failedFlagEvents} errors out of ${totalFlagEvents} rows`;
    }
    if (copyError && dbError) {
        res.json({
            error: {
                message: `Failed to update start list.`,
                copyError,
                dbError
            },
            status: 'failure'
        });
    } else if (copyError) {
        res.json({
            error: {
                copyError
            },
            message: `Updated existing start list successfully.`,
            status: 'success'
        });
    } else if (dbError) {
        res.json({
            error: {
                message: `Failed to update start list.`,
                dbError
            },
            status: 'failure'
        });
    } else {
        res.json({message: 'Updated start list successfully', status: 'success'});
    }
}

module.exports = {
    findScotathClientDir,
    findScotathDBDir,
    readEventListFiles,
    readPFFiles,
    deleteExistingEvents,
    deleteEventInfo
};