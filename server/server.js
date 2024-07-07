const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
//const bcrypt = require('bcrypt');
const fs = require('fs');
const logger = require('./logger'); // Import the logger

const app = express();
const port = process.env.PORT || 5000;
const cors = require('cors');

const {
    findScotathClientDir,
    findScotathDBDir,
    readEventListFiles,
    readPFFiles,
    deleteExistingEvents,
    deleteEventInfo
} = require('./utils'); // Import utility functions

// Start the server
app.listen(port, () => {
    logger.info(`Server is running on http://localhost:${port}`);
});

// Determine the client path
const clientPath = path.resolve(findScotathClientDir(__dirname));

// Determine the database path
const dbPath = path.resolve(findScotathDBDir(process.cwd()), 'sqlite', 'trackjudging.db');

// Serve static files from the React app
app.use(express.static(path.join(clientPath, 'client', 'rainbow', 'build')));

app.use(bodyParser.json());
// Enable CORS for all routes
app.use(cors());
app.options('*', cors());


// Connect to SQLite database
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        logger.error('Error opening database:', err);
    } else {
        logger.info('Connected to the SQLite database.');
    }
});

// API endpoint to fetch all users
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

// API endpoint to fetch a specific user based on userId
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

// Endpoint to add a user
app.post('/api/rainbow/user', async (req, res) => {
    const user = req.body;

    // // Hash the user's password
    // try {
    //     user.userPass = await bcrypt.hash(user.userPass, 10);
    // } catch (error) {
    //     return res.status(500).json({ error: 'Failed to hash password' });
    // }

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

// Endpoint to update a user
app.put('/api/rainbow/user', async (req, res) => {
    const user = req.body;
  
    // // Check if the password needs to be hashed
    // let hashedPassword = user.userPass;
    // if (user.userPass) {
    //   try {
    //     const salt = await bcrypt.genSalt(10);
    //     hashedPassword = await bcrypt.hash(user.userPass, salt);
    //   } catch (err) {
    //     console.error('Error hashing password:', err);
    //     return res.status(500).json({ error: 'Failed to hash password' });
    //   }
    // }
  
    // Update user in the database
    let sql;
    let values;
    console.log(user.userPass);
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

  

// API endpoint to fetch all meets
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

// New endpoint to fetch a specific meet by meetId
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

// New endpoint to fetch a specific event by meetId and eventCode
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

// POST endpoint to add a new meet
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

// API endpoint to update a meet based on meetId
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


// Endpoint to delete a user
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

// DELETE endpoint to delete a meet by meetId
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


// Login API endpoint
app.post('/api/login', (req, res) => {
    const { userName, userPass } = req.body;
    const query = 'SELECT * FROM tblusers WHERE userName = ? AND userPass = ?';
    db.get(query, [userName, userPass], (err, row) => {
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
        res.json({ message: 'Login successful', user: row });
    });
});

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

  // New endpoint to fetch eventinfo and events based on meetId
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

  // Update tblevents API
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

    // Update tbleventsinfo API
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
  

  

  // Endpoint to get photos
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

        // Construct URLs or base64 data for each image
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