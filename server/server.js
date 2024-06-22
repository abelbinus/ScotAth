const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const csv = require('csv-parser');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 5000;
const cors = require('cors');

// Middleware
app.use(express.static(path.join(__dirname, '/../client/rainbow/build')));
app.use(bodyParser.json());
// Enable CORS for all routes
app.use(cors());

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});


// Connect to SQLite database
const db = new sqlite3.Database(path.join(__dirname, '/../sqlite/trackjudging.db'), (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
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

        console.log(`A user with ID ${this.lastID} has been added`);
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
    const sql = `
      UPDATE tblusers
      SET firstName = ?, middleName = ?, lastName = ?, userName = ?, userEmail = ?, userRole = ?, userPass = ?, userMob = ?, userAddress = ?
      WHERE userId = ?
    `;
    const values = [
      user.firstName,
      user.middleName,
      user.lastName,
      user.userName,
      user.userEmail,
      user.userRole,
      hashedPassword,
      user.userMob,
      user.userAddress,
      user.userId,
    ];
  
    db.run(sql, values, function (err) {
      if (err) {
        console.error(err.message);
        return res.status(500).json({ error: `Failed to update user\n${err.message}` });
      }
  
      if (this.changes === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
  
      console.log(`User with ID ${user.userId} has been updated`);
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
            res.status(500).json({ error: err.message });
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
        console.log(err);
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

        console.log(`User with ID ${userId} has been deleted`);
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
            res.status(500).json({ error: err.message });
            return;
        }
        if (!row) {
            console.log(row);
            res.status(401).json({ error: 'Invalid username or password' });
            return;
        }
        // Successful login
        res.json({ message: 'Login successful', user: row });
    });
});



  // Inside your route handler for updating start lists

  

  function deleteStartLists(meetID, res) {
    return new Promise((resolve, reject) => {
      // Delete existing records from tblEvent
      let sqlDeleteEvent = `DELETE FROM tblevents WHERE MeetID = ?`;
      db.run(sqlDeleteEvent, [meetID], function(err) {
        if (err) {
          console.error('Error deleting records from tblEvent:', err.message);
          return reject({ error: 'Failed to delete records from tblevents' });
        }
        resolve();
      });
    });
  }

  app.post('/api/rainbow/event', async (req, res) => {
      const { pfFolder, meetId } = req.body;
      if (!pfFolder) {
          return res.status(400).json({ error: 'pfFolder path is required' });
      }

      let responseSent = false;

      try {
          await deleteStartLists(meetId, res);

          const folderPath = path.resolve(pfFolder);
          const fileContents = await readTextFiles(folderPath);
          //const fileContents = await readCSVFiles(folderPath);
          res.json({ files: fileContents });
          // if (!responseSent) {
          //     await insertCSVIntoDatabase(fileContents, meetId);
          //     // await updateEventCodes();  // Uncomment this if you have this function implemented
          //     res.json({ files: fileContents });
          // }

      } catch (error) {
          console.error('Error in /api/rainbow/event:', error);
          if (!responseSent) {
              res.status(500).json({ error: 'Internal Server Error' });
          }
      }
  });

  // New endpoint to fetch all events based on meetId
  app.get('/api/rainbow/events/:meetId', (req, res) => {
    const meetId = req.params.meetId;

    const query = 'SELECT * FROM tblevents WHERE meetId = ? AND athleteNum IS NOT NULL';
    db.all(query, [meetId], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ events: rows });
    });
  });

  async function readTextFiles(folderPath) {
      const files = await fs.promises.readdir(folderPath);
      const textFiles = files.filter(file => path.extname(file).toLowerCase() === '.csv'); // Adjusted to filter text files
      console.log(`Number of text files: ${textFiles.length}`);

      if (textFiles.length < 1) {
          throw new Error("No text files found in the provided directory");
      }

      const fileContents = [];

      for (const file of textFiles) {
          const filePath = path.join(folderPath, file);
          const content = await fs.promises.readFile(filePath, 'utf-8'); // Read file content as plain text
          console.log(`Text file ${file} successfully processed.`);
          fileContents.push({ fileName: file, data: content });
      }

      return fileContents;
  };

  async function readCSVFiles(folderPath) {
    const files = await fs.promises.readdir(folderPath);
    const csvFiles = files.filter(file => path.extname(file).toLowerCase() === '.csv');
    console.log(`Number of CSV files: ${csvFiles.length}`);

    if (csvFiles.length < 1) {
        throw new Error("No CSV files found in the provided directory");
    }

    if (csvFiles.length > 1) {
        const startlistFile = csvFiles.find(file => file.toLowerCase() === 'startlist.csv');
        if (!startlistFile) {
            throw new Error("startlist.csv file not found");
        }
        csvFiles = [startlistFile];
    }

    const fileContents = [];

    for (const file of csvFiles) {
        const filePath = path.join(folderPath, file);
        const rows = [];
        await new Promise((resolve, reject) => {
            const stream = fs.createReadStream(filePath, { encoding: 'utf-8' })
                .on('error', (error) => {
                    console.error(`Error reading file ${file}:`, error);
                    reject(error);
                })
                .pipe(csv({ separator: ';' }))
                .on('data', (row) => {
                    rows.push(row);
                })
                .on('end', () => {
                    console.log(`CSV file ${file} successfully processed.`);
                    fileContents.push({ fileName: file, data: rows });
                    resolve();
                });
        });
    }

    return fileContents;
  }

  // Function to insert content into SQLite database
  async function insertCSVIntoDatabase(contents, meetId) {
      // Assuming 'contents' is an array of objects containing data from CSV files
    
      for (const content of contents) {
        const { fileName, data } = content;
        let previousEventCode = null;
        
        for (const row of data) {
          let eventCode = row['Event Code'];
          const eventDate = row['Date'];
          const eventTime = row['Time'];
          const laneOrder = row['Lane/order'];
          const athleteNum = row['Bib'];
          const familyName = row['Family Name'];
          const firstName = row['Firstname'];
          const eventLength = row['Length'];
          const athleteClub = row['Nation'];
          const sponsor = row['Sponsor'];
          const eventName = row['Title 1'];
          const title2 = row['Title 2'];

          // if(eventCode && !athleteNum) {
          //   previousEventCode = eventCode;
          // } else if(!eventCode && athleteNum){
          //   eventCode = previousEventCode;
          // }
          
          // console.log(eventCode)
          // SQL statement to insert data into a table named 'StartList'
          const sql = `
            INSERT INTO tblevents (meetId, eventCode, eventDate, eventTime, laneOrder, athleteNum, familyName, firstName, eventLength, athleteClub, sponsor, eventName, title2)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `;
    
          // Execute the SQL statement
          db.run(sql, [meetId, eventCode, eventDate, eventTime, laneOrder, athleteNum, familyName, firstName, eventLength, athleteClub, sponsor, eventName, title2], function(err) {
            if (err) {
              console.error(`Error inserting row into database from file ${fileName}:`, err);
            } else {
              //console.log(`Row inserted successfully into database from file ${fileName}`);
            }
          });
        }
      }
    }

  // Function to update event codes
  async function updateEventCodes() {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            let previousEventCode = null;

            db.each(
                "SELECT rowid, eventCode, athleteNum FROM tblevents ORDER BY rowid",
                (err, row) => {
                    if (err) {
                        console.error('Error reading from tblevents:', err.message);
                        return reject(err);
                    }
                    if (row.eventCode) {
                        previousEventCode = row.eventCode;
                    } else if (!row.eventCode && row.athleteNum) {
                        db.run(
                            "UPDATE tblevents SET eventCode = ? WHERE rowid = ?",
                            [previousEventCode, row.rowid],
                            function (err) {
                                if (err) {
                                    console.error(`Error updating rowid ${row.rowid}:`, err.message);
                                } else {
                                    //console.log(`Updated rowid ${row.rowid} with eventCode ${previousEventCode}`);
                                }
                            }
                        );
                    }
                },
                (err, numRows) => {
                    if (err) {
                        return reject(err);
                    }
                    resolve(numRows);
                }
            );
        });
    });
  }
  
// All other requests go to React app
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname + '/../client/rainbow/build/index.html'));
});