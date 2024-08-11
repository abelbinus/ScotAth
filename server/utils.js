const path = require('path');
const fs = require('fs');
const logger = require('./logger');

/**
 * Recursively searches for the 'client' directory starting from the current directory.
 * If the directory is found, returns the path; otherwise, continues searching in parent directories.
 * @param {string} currentDir - The current directory path from which the search begins.
 * @returns {string} The path of the directory containing the 'client' folder.
 * @throws Will throw an error if the 'client' directory is not found.
 */
function findScotathClientDir(currentDir) {
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

/**
 * Recursively searches for the 'sqlite' directory starting from the current directory.
 * If the directory is found, returns the path; otherwise, continues searching in parent directories.
 * @param {string} currentDir - The current directory path from which the search begins.
 * @returns {string} The path of the directory containing the 'sqlite' folder.
 * @throws Will throw an error if the 'sqlite' directory is not found.
 */
function findScotathDBDir(currentDir) {
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

/**
 * Deletes existing events from the 'tblevents' table based on the provided meetID.
 * @param {string} meetID - The ID of the meet for which events should be deleted.
 * @param {object} db - The SQLite database instance.
 * @returns {Promise<void>} A promise that resolves when the events are deleted, or rejects with an error.
 */
function deleteExistingEvents(meetID, db) {
    return new Promise((resolve, reject) => {
        const sqlDeleteEvent = `DELETE FROM tblevents WHERE MeetID = ?`;
        db.run(sqlDeleteEvent, [meetID], function(err) {
            if (err) {
                console.error('Error deleting records from tblevents:', err.message);
                return reject({ error: 'Failed to delete records from tblevents' });
            }
            resolve();
        });
    });
}

/**
 * Deletes existing event information from the 'tbleventinfo' table based on the provided meetID.
 * @param {string} meetID - The ID of the meet for which event information should be deleted.
 * @param {object} db - The SQLite database instance.
 * @returns {Promise<void>} A promise that resolves when the event information is deleted, or rejects with an error.
 */
function deleteEventInfo(meetID, db) {
    return new Promise((resolve, reject) => {
        const sqlDeleteEvent = `DELETE FROM tbleventinfo WHERE MeetID = ?`;
        db.run(sqlDeleteEvent, [meetID], function(err) {
            if (err) {
                console.error('Error deleting records from tbleventinfo:', err.message);
                return reject({ error: 'Failed to delete records from tbleventinfo' });
            }
            resolve();
        });
    });
}

/**
 * Generates an event number in the format '###-X##' where the first part is padded to 3 digits, and the heat number is padded to 2 digits.
 * @param {number|string} event - The event number.
 * @param {string} round - The round number/identifier.
 * @param {number|string} heat - The heat number.
 * @returns {string} The formatted event number.
 */
function makeEventNum(event, round, heat) {
    const firstbit = String(event).padStart(3, '0');
    const lastbit = String(heat).padStart(2, '0');
    return `${firstbit}-${round}${lastbit}`;
}

/**
 * Reads the content of a file from the specified folder.
 * @param {string} folderPath - The path to the folder containing the file.
 * @param {string} fileName - The name of the file to read.
 * @returns {Promise<string>} A promise that resolves with the file content or rejects with an error.
 * @throws Will throw an error if the file cannot be read.
 */
async function readFile(folderPath, fileName) {
    const filePath = path.join(folderPath, fileName);

    try {
        const content = await fs.promises.readFile(filePath, 'utf-8');
        logger.info(`Text file ${fileName} successfully processed.`);
        return content;
    } catch (error) {
        logger.error(`Error reading file ${fileName}: ${error.message}`);
        throw new Error(`Error reading file ${fileName}: ${error.message}`);
    }
}

/**
 * Copies a file from the source folder to the destination folder.
 * @param {string} srcFolder - The source folder path.
 * @param {string} destFolder - The destination folder path.
 * @param {string} fileName - The name of the file to copy.
 * @returns {Promise<boolean>} A promise that resolves to true if the file was successfully copied, or false if an error occurred.
 */
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

/**
 * Reads event list files and inserts data into the database.
 * Handles files in both 'FL' and 'OMEGA' or 'HYTEK OMEGA' formats.
 * @param {string} folderPath - The path to the folder containing the event list files.
 * @param {string} intFolder - The path to the interface folder for HYTEK OMEGA files.
 * @param {string} eventList - The event list type (either 'FL' or 'OMEGA').
 * @param {string} meetId - The meet ID associated with the event list.
 * @param {object} db - The SQLite database instance.
 * @param {object} res - The response object for sending responses to the client.
 */
async function readEventListFiles(folderPath, intFolder, eventList, meetId, db, res) {
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

/**
 * Reformat an event code by adding a hyphen before the last two digits.
 * Example: '123-456' becomes '123-4-56'.
 * @param {string} eventCode - The event code to be reformatted.
 * @returns {string} The reformatted event code.
 * @throws Will throw an error if the event code format is invalid.
 */
function reformatEventCode(eventCode) {
    const match = eventCode.match(/(\d+)-(\d)(\d{2})/);
    if (match) {
        return `${match[1]}-${match[2]}-${match[3]}`;
    } else {
        throw new Error('Invalid event code format');
    }
}

/**
 * Reads and processes photofinish files (.lif or .cl) and inserts the results into the database.
 * @param {string} folderPath - The path to the folder containing the photofinish files.
 * @param {string} pfOutput - The output type ('lif' or 'cl').
 * @param {string} meetId - The meet ID associated with the photofinish files.
 * @param {string} eventCode - The event code associated with the photofinish files.
 * @param {object} db - The SQLite database instance.
 * @param {object} res - The response object for sending responses to the client.
 * @throws Will throw an error if the file cannot be processed.
 */
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
        let totalFlagEventinfo = 0;
        let totalFlagEvents = 0;
        let dbError = null;
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
                    message: `Failed to update photofinish results for ${lowerCaseFileName}.`,
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

/**
 * Inserts data from the 'FL' file format into the database.
 * @param {string} evtContents - The content of the .evt file.
 * @param {string} pplContents - The content of the .ppl file.
 * @param {string} meetId - The meet ID associated with the event list.
 * @param {object} db - The SQLite database instance.
 * @returns {Promise<Array<number>>} A promise that resolves to an array containing counts of failed and total rows inserted for event info and events.
 */
async function insertFLIntoDatabase(evtContents, pplContents, meetId, db) {
    const pplLines = pplContents.split('\n');
    const evtLines = evtContents.split('\n');
    let ppl_firstName = {};
    let ppl_lastName = {};
    let ppl_athleteClub = {};
    let currentEvent = null;
    let failedFlagEventInfo = 0;
    let failedFlagEvents = 0;
    let totalFlagEventinfo = 0;
    let totalFlagEvents = 0;
    let pplExists = false;
    for (const row of pplLines) {
        if (row.trim() === '') {
            continue;
        }
        const columns = row.split(',');
        if (columns.length > 3 && columns[0]) {
            ppl_firstName[columns[0]] = columns[2].trim();
            ppl_lastName[columns[0]] = columns[1].trim();
            ppl_athleteClub[columns[0]] = columns[3].trim();
        }
    };
    pplExists = true;

    for (const row of evtLines) {
        if (row.trim().startsWith(';') || row.trim() === '') {
            continue;
        }
        const columns = row.split(',').map(col => col.trim());
        let numColumns = columns.length;

        if (columns[0] && columns[0].includes('Event')) {
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

/**
 * Detects the delimiter used in a CSV file by checking the first few lines.
 * @param {string} data - The content of the CSV file.
 * @returns {string} The detected delimiter, either ';' or ','.
 */
function detectDelimiter(data) {
    const lines = data.split('\n').slice(0, 10);
    let semicolonCount = 0;
    let commaCount = 0;

    for (const line of lines) {
        semicolonCount += (line.match(/;/g) || []).length;
        commaCount += (line.match(/,/g) || []).length;
    }

    return semicolonCount > commaCount ? ';' : ',';
}

/**
 * Inserts data from a CSV file into the database.
 * @param {string} content - The content of the CSV file.
 * @param {string} meetId - The meet ID associated with the CSV file.
 * @param {object} db - The SQLite database instance.
 * @returns {Promise<Array<number>>} A promise that resolves to an array containing counts of failed and total rows inserted for event info and events.
 */
async function insertCSVIntoDatabase(content, meetId, db) {
    const delimiter = detectDelimiter(content);
    const rows = content.split('\n');

    let currentEvent = null;
    let failedFlagEventInfo = 0;
    let failedFlagEvents = 0;
    let totalFlagEventinfo = 0;
    let totalFlagEvents = 0;
    for (const row of rows) {
        const columns = row.split(delimiter).map(col => col.trim());
        if (columns[0] && columns[0].includes('Event')) {
            currentEvent = columns;
        } 
        else if (columns[0]) {
            currentEvent = columns;
            totalFlagEventinfo, failedFlagEventInfo = await dbQueryTblEventInfo(currentEvent[0], currentEvent[1], currentEvent[2], currentEvent[8], currentEvent[9], currentEvent[10], currentEvent[11], totalFlagEventinfo, failedFlagEventInfo, meetId, db);
        } else if (currentEvent && columns.length > 1) {
            totalFlagEvents, failedFlagEvents = await dbQueryTblEvents(currentEvent[0], columns[3], columns[4], columns[5], columns[6], columns[7], totalFlagEvents, failedFlagEvents, meetId, db);
        }
    }

    return [failedFlagEventInfo, failedFlagEvents, totalFlagEventinfo, totalFlagEvents];
}

/**
 * Inserts data from a CL file into the database and updates event info and events.
 * @param {string} content - The content of the CL file.
 * @param {number} failedFlagEventInfo - The count of failed event info rows.
 * @param {number} failedFlagEvents - The count of failed event rows.
 * @param {number} totalFlagEventinfo - The total number of event info rows.
 * @param {number} totalFlagEvents - The total number of event rows.
 * @param {string} meetId - The meet ID associated with the CL file.
 * @param {object} db - The SQLite database instance.
 * @param {string} eventCode - The event code associated with the CL file.
 * @returns {Promise<Array<number>>} A promise that resolves to an array containing counts of failed and total rows inserted for event info and events.
 */
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
        if (myLine.trim() === '') {
            return;
        }
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
                    raceLength = columns[1].trim();
                }
            }
            if (myLine.toLowerCase().includes('wind speed')) {
                if (!myLine.toLowerCase().includes('no measurement')) {
                    const columns = myLine.split(":");
                    if (columns.length > 1) {
                        windSpeed = columns[1].trim();
                    }
                }
            }
            if (myLine.toLowerCase().includes('start :')) {
                const columns = myLine.split(/:(.*)/);
                if (columns.length > 1) {
                    const dateTime = columns[1].trim().split(' ');
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
    return [failedFlagEventInfo, failedFlagEvents, totalFlagEventinfo, totalFlagEvents];
}

/**
 * Inserts data from a LIF file into the database and updates event info and events.
 * @param {string} content - The content of the LIF file.
 * @param {number} failedFlagEventInfo - The count of failed event info rows.
 * @param {number} failedFlagEvents - The count of failed event rows.
 * @param {number} totalFlagEventinfo - The total number of event info rows.
 * @param {number} totalFlagEvents - The total number of event rows.
 * @param {string} meetId - The meet ID associated with the LIF file.
 * @param {object} db - The SQLite database instance.
 * @returns {Promise<Array<number>>} A promise that resolves to an array containing counts of failed and total rows inserted for event info and events.
 */
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
        if (columns[0] && columns[0].includes('Event')) {
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
            totalFlagEventinfo, failedFlagEventInfo = await updateDBQueryTblEventInfo(eventCode, eventPFTime, totalFlagEventinfo, failedFlagEventInfo, meetId, db);
        } else if (currentEvent && columns.length > 1) {
            const eventCode = makeEventNum(currentEvent[0], currentEvent[1], currentEvent[2]);
            totalFlagEvents, failedFlagEvents = await updateDBQueryTblEvents(eventCode, columns[0], columns[1], columns[6], totalFlagEvents, failedFlagEvents, meetId, db);
        }
    }
    return [failedFlagEventInfo, failedFlagEvents, totalFlagEventinfo, totalFlagEvents];
}

/**
 * Inserts event information into the tbleventinfo table in the database.
 * @param {string} eventCode - The event code.
 * @param {string|null} eventDate - The event date.
 * @param {string|null} eventTime - The event time.
 * @param {string|null} eventLength - The event length.
 * @param {string} eventName - The event name.
 * @param {string|null} title2 - Additional title information (optional).
 * @param {string|null} sponsor - Sponsor information (optional).
 * @param {number} totalFlagEventinfo - The total number of event info rows processed.
 * @param {number} failedFlagEventInfo - The total number of event info rows that failed to insert.
 * @param {string} meetId - The meet ID.
 * @param {object} db - The SQLite database instance.
 * @returns {Promise<Array<number>>} A promise that resolves to an array containing counts of total and failed event info rows.
 */
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

/**
 * Inserts event data into the tblevents table in the database.
 * @param {string} eventCode - The event code.
 * @param {string} laneOrder - The lane order.
 * @param {string} athleteNum - The athlete number.
 * @param {string} lastName - The last name of the athlete.
 * @param {string} firstName - The first name of the athlete.
 * @param {string} athleteClub - The club of the athlete.
 * @param {number} totalFlagEvents - The total number of event rows processed.
 * @param {number} failedFlagEvents - The total number of event rows that failed to insert.
 * @param {string} meetId - The meet ID.
 * @param {object} db - The SQLite database instance.
 * @returns {Promise<Array<number>>} A promise that resolves to an array containing counts of total and failed event rows.
 */
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

/**
 * Updates event information in the tbleventinfo table in the database.
 * @param {string} eventCode - The event code.
 * @param {string|null} eventPFTime - The event photofinish time.
 * @param {number} totalFlagEventinfo - The total number of event info rows processed.
 * @param {number} failedFlagEventInfo - The total number of event info rows that failed to update.
 * @param {string} meetId - The meet ID.
 * @param {object} db - The SQLite database instance.
 * @returns {Promise<Array<number>>} A promise that resolves to an array containing counts of total and failed event info rows.
 */
async function updateDBQueryTblEventInfo(eventCode, eventPFTime, totalFlagEventinfo, failedFlagEventInfo, meetId, db) {
    const query = `
      UPDATE tbleventinfo
      SET eventPFTime = ?
      WHERE MeetID = ? AND eventCode = ?;
    `;

    db.run(query, [eventPFTime, meetId, eventCode], function(err) {
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

/**
 * Updates event data in the tblevents table in the database.
 * @param {string} eventCode - The event code.
 * @param {string} finalPFPos - The final photofinish position.
 * @param {string} athleteNum - The athlete number.
 * @param {string|null} finalPFTime - The final photofinish time.
 * @param {number} totalFlagEventinfo - The total number of event rows processed.
 * @param {number} failedFlagEventInfo - The total number of event rows that failed to update.
 * @param {string} meetId - The meet ID.
 * @param {object} db - The SQLite database instance.
 * @returns {Promise<Array<number>>} A promise that resolves to an array containing counts of total and failed event rows.
 */
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

/**
 * Sends a response after attempting to update the event list or photofinish results, indicating success or failure.
 * @param {number} failedFlagEventInfo - The count of failed event info rows.
 * @param {number} failedFlagEvents - The count of failed event rows.
 * @param {number} totalFlagEventinfo - The total number of event info rows processed.
 * @param {number} totalFlagEvents - The total number of event rows processed.
 * @param {string|null} copyError - The error message related to file copying, if any.
 * @param {string|null} dbError - The error message related to database insertion, if any.
 * @param {object} res - The response object for sending the response to the client.
 */
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
