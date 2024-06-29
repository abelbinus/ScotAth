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
async function readText(folderPath, fileExtension) {
    const files = await fs.promises.readdir(folderPath);
    const textFiles = files.filter(file => path.extname(file).toLowerCase() === fileExtension.toLowerCase());
    if (textFiles.length < 1) {
        throw new Error("No text files found in the provided directory");
    }

    const fileContents = [];

    for (const file of textFiles) {
        const filePath = path.join(folderPath, file);
        const content = await fs.promises.readFile(filePath, 'utf-8');

        // // Remove UTF-8 BOM if present
        // if (content.charCodeAt(0) === 0xFEFF) {
        //     content = content.slice(1);
        // }

        logger.info(`Text file ${file} successfully processed.`);
        fileContents.push({ fileName: file, data: content });
    }
    return fileContents;
}

async function readTextFiles(folderPath, eventList, meetId, db, res) {
    if(eventList === 'FL') {
        const fileExtension = '.lynx.evt';
        const fileExtensionPpl = '.lynx.ppl';
        const fileContents = readText(folderPath, fileExtension);
        const fileContentsPpl = readText(folderPath, fileExtensionPpl);
        insertFLTextIntoDatabase(fileContents, meetId, db);
        res.json({ files: fileContents });
    } else if(eventList === 'OMEGA' || eventList === 'HYTEK OMEGA') {
        const fileExtension = '.csv';
        let fileContents = [];
        fileContents = await readText(folderPath, fileExtension);
        insertCSVTextIntoDatabase(fileContents, meetId, db);
        res.json({ files: fileContents });
    } 
}

async function insertFLTextIntoDatabase(contents, meetId, db) {
}
// Function to insert content into SQLite database
async function insertCSVTextIntoDatabase(contents, meetId, db) {
    for (const content of contents) {
        const { fileName, data } = content;
        const rows = data.split('\n');

        let currentEvent = null;
        for (const row of rows) {
            const columns = row.split(';').map(col => col.trim());

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
                const athleteSql = `
                    INSERT INTO tbleventinfo (meetId, eventCode, eventDate, eventTime, eventLength, eventName, title2, sponsor)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `;

                db.run(athleteSql, [meetId, eventCode, eventDate, eventTime, eventLength, eventName, title2, sponsor], function(err) {
                    if (err) {
                        logger.error(`Error inserting athlete row into database from file ${fileName}:`, err);
                    } else {
                        logger.info(`Event row inserted successfully into database from file ${eventCode}`);
                    }
                });
            
            } else if (currentEvent && columns.length > 1) { // Athlete row
                const [
                    eventCode, laneOrder, athleteNum,
                    familyName, firstName, athleteClub
                ] = [
                    currentEvent[0], columns[3],
                    columns[4], columns[5], columns[6], columns[7]
                ];
                const sql = `
                    INSERT INTO tblevents (meetId, eventCode, laneOrder, athleteNum, familyName, firstName, athleteClub)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                `;

                db.run(sql, [meetId, eventCode, laneOrder, athleteNum, familyName, firstName, athleteClub], function(err) {
                    if (err) {
                        logger.error(`Error inserting row into database from file ${fileName}:`, err);
                    } else {
                        logger.info(`Row inserted successfully into database for event ${eventCode}`);
                    }
                });
            }
        }
    }
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