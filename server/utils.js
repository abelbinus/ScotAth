const path = require('path');
const fs = require('fs');
const os = require('os');
const logger = require('./logger');
const { log, count } = require('console');

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
async function readText(folderPath, fileName) {
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
function getEventsResponse(failedFlagEventInfo, failedFlagEvents, totalFlagEventinfo, totalFlagEvents, copyError, dbError, res) {
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
async function readTextFiles(folderPath, intFolder, eventList, meetId, db, res) {
    let fileContents = [];
    let evtContents = [];
    let pplContents = [];
    let copyError = null;
    let dbError = null;
    let [failedFlagEventInfo, failedFlagEvents, totalFlagEventinfo, totalFlagEvents] = [null, null, null, null];
    if (eventList === 'FL') {
        const fileName = 'lynx.evt';
        const fileNamePpl = 'lynx.ppl';

        try {
            evtContents = await readText(folderPath, fileName);
            pplContents = await readText(folderPath, fileNamePpl);
            [failedFlagEventInfo, failedFlagEvents, totalFlagEventinfo, totalFlagEvents] = await insertFLTextIntoDatabase(evtContents, pplContents, meetId, db);
            getEventsResponse(failedFlagEventInfo, failedFlagEvents, totalFlagEventinfo, totalFlagEvents, copyError, dbError, res);
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
            fileContents = await readText(folderPath, fileName);
            [failedFlagEventInfo, failedFlagEvents, totalFlagEventinfo, totalFlagEvents] = await insertCSVTextIntoDatabase(fileContents, meetId, db);
            getEventsResponse(failedFlagEventInfo, failedFlagEvents, totalFlagEventinfo, totalFlagEvents, copyError, dbError, res);

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

// async function fileExists(filePath) {
//     try {
//         await fs.access(filePath);
//         return true;
//     } catch (error) {
//         return false;
//     }
// }
function makeEventNum(event, round, heat) {
    const firstbit = String(event).padStart(3, '0');
    const lastbit = String(heat).padStart(2, '0');
    return `${firstbit}-${round}${lastbit}`;
}


async function insertFLTextIntoDatabase(evtContents, pplContents, meetId, db) {
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
            const eventInfoSql = `
                INSERT INTO tbleventinfo (meetId, eventCode, eventLength, eventName)
                VALUES (?, ?, ?, ?)
            `;
            db.run(eventInfoSql, [meetId, eventCode, eventLength, eventName], function(err) {
                totalFlagEventinfo++;
                if (err) {
                    failedFlagEventInfo++;
                    logger.error(`Error inserting event info into database:`, err);
                    return 1;
                } else {
                    logger.info(`Event Info inserted successfully into database: ${eventCode}`);
                }
            });
        
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
                    const sql = `
                        INSERT INTO tblevents (meetId, eventCode, laneOrder, athleteNum, lastName, firstName, athleteClub)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    `;

                    db.run(sql, [meetId, eventCode, laneOrder, athleteNum, lastName, firstName, athleteClub], function(err) {
                        totalFlagEvents++;
                        if (err) {
                            failedFlagEvents++;
                            logger.error(`Error inserting row into database from file:`, err);
                        } else {
                            logger.info(`Row inserted successfully into database for event ${eventCode}`);
                        }
                    });
                }
            }
            
        }
    }

    return [failedFlagEventInfo, failedFlagEvents, totalFlagEventinfo, totalFlagEvents];
}
// Function to insert content into SQLite database
async function insertCSVTextIntoDatabase(content, meetId, db) {
    const data = content;
    const rows = data.split('\n');

    let currentEvent = null;
    let failedFlagEventInfo = 0;
    let failedFlagEvents = 0;
    let totalFlagEventinfo = 0; // Total number of event info rows
    let totalFlagEvents = 0; // Total number of event rows
    for (const row of rows) {
        const columns = row.split(';').map(col => col.trim());
        let numColumns = columns.length;
        if (columns[0] && columns[0].includes('Event')) { // New event header row
            currentEvent = columns;
        } 
        else if (columns[0]) {
            currentEvent = columns;
            const [
                eventCode, eventDate, eventTime, eventLength, eventName, title2, sponsor
            ] = [
                currentEvent[0], currentEvent[1], currentEvent[2], currentEvent[8], currentEvent[9], currentEvent[10], currentEvent[11]
            ];
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
        
        } else if (currentEvent && columns.length > 1) { // Athlete row
            const [
                eventCode, laneOrder, athleteNum,
                lastName, firstName, athleteClub
            ] = [
                currentEvent[0], columns[3],
                columns[4], columns[5], columns[6], columns[7]
            ];
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
                    logger.info(`Row inserted successfully into database for event ${eventCode}`);
                }
            });
        }
    }

    // Combine the flags into an array and return
    return [failedFlagEventInfo, failedFlagEvents, totalFlagEventinfo, totalFlagEvents];
}

module.exports = {
    findScotathClientDir,
    findScotathDBDir,
    readTextFiles,
    insertFLTextIntoDatabase,
    insertCSVTextIntoDatabase,
    deleteExistingEvents,
    deleteEventInfo
};