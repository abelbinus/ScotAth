const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const fs = require('fs');
const logger = require('./logger'); // Import the logger
const bcrypt = require('bcryptjs-react');
const cors = require('cors');
const app = express();

const port = process.env.PORT || 5912;
const IP = process.env.IP || 'localhost';

const {
    findScotathClientDir,
    findScotathDBDir,
    readEventListFiles,
    readPFFiles,
    deleteExistingEvents,
    deleteEventInfo
} = require('./utils'); // Import utility functions

// Determine the client path
const clientPath = path.resolve(findScotathClientDir(__dirname));

// Determine the database path
const dbPath = path.resolve(findScotathDBDir(process.cwd()), 'sqlite', 'trackjudging.db');

// Serve static files from the React app
app.use(express.static(path.join(clientPath, 'client', 'rainbow', 'build')));

app.use(bodyParser.json());
// Enable CORS for all routes
//app.use(cors());
app.options('*', cors());

app.use(cors({
  origin: '*', // or specify the origin you want to allow
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Connect to SQLite database
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        logger.error('Error opening database:', err);
    } else {
        logger.info('Connected to the SQLite database.');
    }
});

/**
 * Endpoint to retrieve environment variables (IP and port).
 * @route GET /env
 * @returns {Object} JSON containing the IP and PORT values.
 */
app.get('/env', (req, res) => {
  res.json({ IP: IP, PORT: port });
});

// Start the server
app.listen(port, () => {
  logger.info(`Server is running on http://${IP}:${port}`);
});

/**
 * API endpoint to fetch all users.
 * @route GET /api/rainbow/user
 * @returns {Array} List of users.
 */
app.get('/api/rainbow/user', (req, res) => {
    const query = 'SELECT * FROM tblusers';
    db.all(query, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

/**
 * API endpoint to fetch a specific user based on userId.
 * @route GET /api/rainbow/users/:userId
 * @param {string} userId - The ID of the user to retrieve.
 * @returns {Object} The user information.
 */
app.get('/api/rainbow/users/:userId', (req, res) => {
    const query = 'SELECT * FROM tblusers WHERE userId = ?';
    db.get(query, [userId], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
  });

/**
 * Endpoint to add a user.
 * @route POST /api/rainbow/user
 * @param {Object} req.body - The user object containing user details.
 * @returns {Object} A message indicating the result of the operation.
 */
app.post('/api/rainbow/user', async (req, res) => {
    const user = req.body;

    // Insert user into database
    const sql = `INSERT INTO tblusers (userId, firstName, middleName, lastName, userName, userEmail, userRole, userPass, userMob, userAddress) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const values = [
        user.userId,
        user.firstName,
        user.middleName,
        user.lastName,
        user.userName,
        user.userEmail,
        user.userRole,
        user.userPass,
        user.userMob,
        user.userAddress
    ];

    db.run(sql, values, function(err) {
        if (err) {
            console.error(err.message);

            // Determine the type of SQLite constraint error
            if (err.message.includes('NOT NULL')) {
                const field = err.message.split(': ')[2].split('.')[1];
                return res.status(400).json({ error: `Failed to add user. The field '${field}' cannot be null.` });
            } else if (err.message.includes('UNIQUE')) {
                const field = err.message.split(': ')[2].split('.')[1];
                return res.status(400).json({ error: `Failed to add user. The value for '${field}' must be unique.` });
            }

            return res.status(500).json({ error: 'Failed to add user' });
        }

        logger.info(`A user with ID ${this.lastID} has been added`);
        res.json({ message: 'User added successfully' });
    });
});

/**
 * Endpoint to update a user.
 * @route PUT /api/rainbow/user
 * @param {Object} req.body - The user object containing updated user details.
 * @returns {Object} A message indicating the result of the operation.
 */
app.put('/api/rainbow/user', async (req, res) => {
    const user = req.body;
    // Update user in the database
    let sql;
    let values;
    if(user.userPass === '' || user.userPass === null || user.userPass === undefined){
        sql = `
          UPDATE tblusers
          SET firstName = ?, middleName = ?, lastName = ?, userName = ?, userEmail = ?, userRole = ?, userMob = ?, userAddress = ?
          WHERE userId = ?
        `;
        values = [
          user.firstName,
          user.middleName,
          user.lastName,
          user.userName,
          user.userEmail,
          user.userRole,
          user.userMob,
          user.userAddress,
          user.userId,
        ];
    }
    else {
      sql = `
        UPDATE tblusers
        SET firstName = ?, middleName = ?, lastName = ?, userName = ?, userEmail = ?, userRole = ?, userPass = ?, userMob = ?, userAddress = ?
        WHERE userId = ?
      `;
      values = [
        user.firstName,
        user.middleName,
        user.lastName,
        user.userName,
        user.userEmail,
        user.userRole,
        user.userPass,
        user.userMob,
        user.userAddress,
        user.userId,
      ];

    }
  
    db.run(sql, values, function (err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed') && err.message.includes('tblusers.userName')) {
          return res.status(400).json({ error: 'Username already exists' });
        }
        console.error(err.message);
        return res.status(500).json({ error: `Failed to update user\n${err.message}` });
      }
  
      if (this.changes === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
  
      logger.info(`User with ID ${user.userId} has been updated`);
      res.json({ message: 'User updated successfully' });
    });
  });

/**
 * API endpoint to fetch all meets.
 * @route GET /api/rainbow/meet
 * @returns {Array} List of meets.
 */
app.get('/api/rainbow/meet', (req, res) => {
    const query = 'SELECT * FROM tblmeets';
    db.all(query, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({meet: rows});
    });
});

/**
 * API endpoint to fetch a specific meet by meetId.
 * @route GET /api/rainbow/meet/:meetId
 * @param {string} meetId - The ID of the meet to retrieve.
 * @returns {Object} The meet information.
 */
app.get('/api/rainbow/meet/:meetId', (req, res) => {
    const { meetId } = req.params;
    const query = 'SELECT * FROM tblmeets WHERE meetId = ?';
    
    db.get(query, [meetId], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (!row) {
            res.status(404).json({ error: 'Meet not found' });
            return;
        }
        res.json({ meet: row });
    });
});

/**
 * API endpoint to fetch a specific event by meetId and eventCode.
 * @route GET /api/rainbow/event/:meetId/:eventCode
 * @param {string} meetId - The ID of the meet.
 * @param {string} eventCode - The code of the event.
 * @returns {Array} List of events.
 */
app.get('/api/rainbow/event/:meetId/:eventCode', (req, res) => {
    const { meetId, eventCode } = req.params;
    const query = 'SELECT * FROM tblevents WHERE meetId = ? AND eventCode = ?';
    
    db.all(query, [meetId, eventCode], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (!rows) {
            res.status(404).json({ error: 'Event not found' });
            return;
        }
        res.json({ events: rows });
    });
});

/**
 * Endpoint to add a new meet.
 * @route POST /api/rainbow/meet
 * @param {Object} req.body - The meet object containing meet details.
 * @returns {Object} A message indicating the result of the operation.
 */
app.post('/api/rainbow/meet', (req, res) => {
    const { meetId, meetName, meetDesc, pfFolder, pfOutput, eventList, intFolder, edit } = req.body;

    // Validation: Check if all required fields are provided
    if (!meetId || !meetName) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
    }

    // Insert the new meet into the tblmeets table
    const query = `
        INSERT INTO tblmeets (meetId, meetName, meetDesc, pfFolder, pfOutput, eventList, intFolder, edit)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    db.run(query, [meetId, meetName, meetDesc, pfFolder, pfOutput, eventList, intFolder, edit], function(err) {
        if (err) {
            if(err.message.includes('UNIQUE constraint failed') && err.message.includes('tblmeets.meetId')) {
                res.status(400).json({ error: 'Meet ID already exists' });
                return;
            }
            else {
              res.status(500).json({ error: err.message });
              return
            }
            return;
        }
        res.status(201).json({ message: 'Meet added successfully', meetId: this.lastID });
    });
});

/**
 * API endpoint to update a meet based on meetId.
 * @route PUT /api/rainbow/meet
 * @param {Object} req.body - The meet object containing updated meet details.
 * @returns {Object} A message indicating the result of the operation.
 */
app.put('/api/rainbow/meet', (req, res) => {
    const { meetId, meetName, meetDesc, pfFolder, pfOutput, eventList, intFolder, edit } = req.body;
  
    const query = `
      UPDATE tblmeets
      SET MeetName = ?,
          MeetDesc = ?,
          PFFolder = ?,
          PFOutput = ?,
          EventList = ?,
          intFolder = ?,
          Edit = ?
      WHERE MeetID = ?;
    `;
    
    db.run(query, [meetName, meetDesc, pfFolder, pfOutput, eventList, intFolder, edit, meetId], function(err) {
      if (err) {
        logger.error(err);
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ message: 'Meet updated successfully.', changes: this.changes });
    });
  });

/**
 * Endpoint to delete a user.
 * @route DELETE /api/rainbow/user/:userId
 * @param {string} userId - The ID of the user to delete.
 * @returns {Object} A message indicating the result of the operation.
 */
app.delete('/api/rainbow/user/:userId', (req, res) => {
    const userId = req.params.userId;

    const sql = 'DELETE FROM tblusers WHERE userId = ?';

    db.run(sql, [userId], function(err) {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: 'Failed to delete user\n' + err.message });
        }

        if (this.changes === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        logger.info(`User with ID ${userId} has been deleted`);
        res.json({ message: 'User deleted successfully' });
    });
});

/**
 * DELETE endpoint to delete a meet by meetId.
 * @route DELETE /api/rainbow/meet/:meetId
 * @param {string} meetId - The ID of the meet to delete.
 * @returns {Object} A message indicating the result of the operation.
 */
app.delete('/api/rainbow/meet/:meetId', (req, res) => {
    const { meetId } = req.params;

    // Check if the meet exists before attempting to delete
    db.get('SELECT * FROM tblmeets WHERE MeetID = ?', [meetId], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (!row) {
            res.status(404).json({ message: 'Meet not found' });
            return;
        }

        // Delete the meet
        deleteExistingEvents(meetId, db);
        deleteEventInfo(meetId, db);
        const deleteQuery = 'DELETE FROM tblmeets WHERE MeetID = ?';
        db.run(deleteQuery, [meetId], function (err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ message: 'Meet deleted successfully', changes: this.changes });
        });
    });
}); 

/**
 * Login API endpoint.
 * @route POST /api/login
 * @param {Object} req.body - The login credentials (username and password).
 * @returns {Object} The user information or an error message.
 */
app.post('/api/login', (req, res) => {
    const { userName, userPass } = req.body;
    const query = 'SELECT * FROM tblusers WHERE userName = ?';
    db.get(query, [userName], (err, row) => {
        if (err) {
            logger.error(err.message);
            res.status(500).json({ error: err.message });
            return;
        }
        if (!row) {
            logger.error('Invalid username or password');
            res.status(401).json({ error: 'Invalid username or password' });
            return;
        }
        // Successful login
          res.json({ user: row });
    });
});

/**
 * API endpoint to change a user's password.
 * @route POST /api/rainbow/user/changePassword
 * @param {Object} req.body - The password details (old password, new password, userId).
 * @returns {Object} A message indicating the result of the operation.
 */
app.post('/api/rainbow/user/changePassword', async (req, res) => {
  const { oldPass, newPass, userId } = req.body;
  const query = 'SELECT userPass FROM tblusers WHERE userId = ?';
  db.get(query, [userId], async (err, row) => {
    if (err) {
      logger.error(err.message);
      res.status(500).json({ error: err.message });
      return;
    }
    else if (!row) {
      logger.error('User not found');
      res.status(404).json({ error: 'User not found' });
      return;
    }
    else {
      // Check if the old password matches;
      const updateQuery = 'UPDATE tblusers SET userPass = ? WHERE userId = ?';
      db.run(updateQuery, [newPass, userId], function(err) {
        if (err) {
          logger.error(err.message);
          res.status(500).json({ error: err.message });
          return;
        }
        logger.info(`Password updated for user with ID ${userId}`);
        res.json({ message: 'Password updated successfully' });
      });
    }
  });
});

/**
 * API endpoint to add events.
 * @route POST /api/rainbow/event
 * @param {Object} req.body - The event details (pfFolder, intFolder, eventList, meetId).
 * @returns {Object} A message indicating the result of the operation.
 */
app.post('/api/rainbow/event', async (req, res) => {
    const { pfFolder, intFolder, eventList, meetId } = req.body;

    if (!pfFolder) {
        return res.status(400).json({ error: 'pfFolder path is required' });
    } else if (!eventList) {
        return res.status(400).json({ error: 'eventList type is required' });
    } else if (!meetId) {
        return res.status(400).json({ error: 'meetId is missing' });
    }

    let responseSent = false;

    try {
        deleteExistingEvents(meetId, db);
        deleteEventInfo(meetId, db);

        const folderPath = path.resolve(pfFolder);
        await readEventListFiles(folderPath, intFolder, eventList, meetId, db, res);
    } catch (error) {
        console.error('Error in /api/rainbow/event:', error);
        if (!responseSent) {
            res.status(500).json({ error: 'No files found in the provided directory' });
        }
    }
});

/**
 * API endpoint to add PF events.
 * @route POST /api/rainbow/pfevent
 * @param {Object} req.body - The event details (pfFolder, pfOutput, meetId, eventCode).
 * @returns {Object} A message indicating the result of the operation.
 */
app.post('/api/rainbow/pfevent', async (req, res) => {
    const { pfFolder, pfOutput, meetId, eventCode } = req.body;
    if (!pfFolder) {
        return res.status(400).json({ error: 'pfFolder path is required' });
    } else if (!pfOutput) {
        return res.status(400).json({ error: 'pfOutput type is required' });
    } else if (!meetId) {
        return res.status(400).json({ error: 'meetId is missing' });
    } else if (!eventCode) {
        return res.status(400).json({ error: 'eventCode is missing' });
    }

    try {
        const folderPath = path.resolve(pfFolder);
        await readPFFiles(folderPath, pfOutput, meetId, eventCode, db, res);
    } catch (error) {
        console.error('Error in /api/rainbow/event:', error);
        res.status(500).json({ error: 'Could not find the directory' });
    }
});

/**
 * API endpoint to fetch event info and related athlete info based on meetId.
 * @route GET /api/rainbow/eventinfo/:meetId
 * @param {string} meetId - The ID of the meet.
 * @returns {Object} An object containing eventInfo and athleteInfo arrays.
 */
app.get('/api/rainbow/eventinfo/:meetId', (req, res) => {
    const { meetId } = req.params;
  
    // Query to get event information based on meetId
    const eventInfoQuery = `
      SELECT * 
      FROM tbleventinfo 
      WHERE meetId = ?`;
  
    // Query to get athlete information based on meetId
    const athleteInfoQuery = `
      SELECT * 
      FROM tblevents 
      WHERE meetId = ?`;
  
    // Execute both queries in parallel
    db.all(eventInfoQuery, [meetId], (err, eventInfoRows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
  
      db.all(athleteInfoQuery, [meetId], (err, athleteInfoRows) => {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
  
        res.json({ eventInfo: eventInfoRows, athleteInfo: athleteInfoRows });
      });
    });
  });

/**
 * API endpoint to update athlete information in the tblevents table.
 * @route POST /api/rainbow/updateAthleteAPI
 * @param {Array} req.body - An array of athlete objects containing the updated details.
 * @returns {Object} A message indicating the result of the operation.
 */
app.post('/api/rainbow/updateAthleteAPI', (req, res) => {
    const athletes = req.body;
    const updateQuery = `
      UPDATE tblevents
      SET startPos = ?, finishPos = ?, startTime = ?, finishTime = ?
      WHERE meetId = ? AND eventCode = ? AND athleteNum = ? AND lastName = ? AND firstName = ?
    `;
  
    db.serialize(() => {
      const stmt = db.prepare(updateQuery);
  
      athletes.forEach(event => {
        stmt.run(event.startPos, event.finishPos, event.startTime, event.finishTime, event.meetId, event.eventCode, event.athleteNum, event.lastName, event.firstName, function(err) {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
        });
      });
  
      stmt.finalize((err) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'Athletes Information updated successfully!' });
      });
    });
  });

/**
 * API endpoint to update event information in the tbleventinfo table.
 * @route POST /api/rainbow/updateEventAPI/
 * @param {Array} req.body - An array of event objects containing the updated details.
 * @returns {Object} A message indicating the result of the operation.
 */
app.post('/api/rainbow/updateEventAPI/', (req, res) => {
    const events = req.body;
    const updateQuery = `
      UPDATE tbleventinfo
      SET eventDescription = ?, eventComments = ?, eventDate = ?, eventTime = ?, eventLength = ?, eventName = ?, sponsor = ?, title2 = ?
      WHERE meetId = ? AND eventCode = ?
    `;
  
    db.serialize(() => {
      const stmt = db.prepare(updateQuery);
  
      events.forEach(event => {
        stmt.run(event.eventDescription, event.eventComments, event.eventDate, event.eventTime, event.eventLength, event.eventName, event.sponsor, event.title2, event.meetId, event.eventCode, function(err) {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
        });
      });
  
      stmt.finalize((err) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'Events updated successfully!' });
      });
    });
  });

/**
 * API endpoint to retrieve event photos from a specified folder.
 * @route POST /api/rainbow/getEventPhotoAPI/
 * @param {Object} req.body - The event photo details (pfFolder, filename).
 * @returns {Object} An object containing an array of base64-encoded image data.
 */
app.post('/api/rainbow/getEventPhotoAPI/', (req, res) => {
    const { pfFolder, filename } = req.body;
    if (!pfFolder || !filename) {
        return res.status(400).json({ error: 'pfFolder path is not present' });
    }

    // Construct the directory path based on meetId and eventId
    const eventPhotoFolder = path.join(pfFolder);

    fs.readdir(pfFolder, (err, files) => {
        if (err) {
        return res.status(500).json({ error: 'Error reading photos directory' });
        }

        // Filter files to match the provided filename
        const matchingFiles = files.filter(file => file.includes(filename) && /\.(jpg|jpeg|png|gif)$/.test(file));
        if (matchingFiles.length === 0) {
            return res.status(404).json({ error: 'No matching photos found' });
        }

        // base64 data for each image
        /**
         * Array of base64-encoded image data.
         * @type {Array<string>}
         */
        const photos = matchingFiles.map(file => {
        const filePath = path.join(eventPhotoFolder, file);
        const fileData = fs.readFileSync(filePath, { encoding: 'base64' });
        return `data:image/${path.extname(file).substring(1)};base64,${fileData}`;
        });

        res.json({ photos });
    });
});
  
// All other requests go to React app
app.get('*', (req, res) => {
    res.sendFile(path.join(clientPath + '/' + 'client', 'rainbow', 'build', 'index.html'));
});

