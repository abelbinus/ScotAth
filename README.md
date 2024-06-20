# ScotAth

# Node.js Server with Static React Application

This repository contains a Node.js server that serves a static React application. The React application is built using Create React App and is served by the Node.js server using Express.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Building the React Application](#building-the-react-application)
- [Running the Server](#running-the-server)

## Prerequisites

Ensure you have the following installed on your machine:

- [Node.js](https://nodejs.org/) (version 14.x or later recommended)
- [npm](https://www.npmjs.com/) (comes with Node.js)

## Installation

1. Clone the repository: git clone https://github.com/abelbinus/ScotAth.git
2. Navigation to the server by going to server directory: cd server
3. Install the dependencies: npm i
4. Go back to the ScotAth directory using cd ../.. 
5. Navigate to the client: cd client/rainbow
6. Install the dependencies: npm i

##  Build the React Application
1. From the client/rainbow directory, you can build the react application using npm run build.
2. Go back to the ScotAth directory using cd ../..

## Rub the Server
1. Go to the server directory: cd server
2. Run the server: npm start
3. The server will start on http://localhost:5000 and serve the static files from the React application's build directory.
