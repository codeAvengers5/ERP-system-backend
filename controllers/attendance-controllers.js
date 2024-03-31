const Attendance = require("../models/attendance");
const EmployeeInfo = require("../models/employeeInfo");
const Employee = require("../models/employee");
const fs = require('fs').promises;
const path = require('path');
const process = require('process');
const { authenticate } = require('@google-cloud/local-auth');
const { google } = require('googleapis');
// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
// The file token.json stores the user's access and refresh tokens and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = path.join(process.cwd(), 'helpers/token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'helpers/credentials.json');

// /
//  * Reads previously authorized credentials from the save file.
//  *
//  * @return {Promise<OAuth2Client|null>}
//  */

async function loadSavedCredentialsIfExist() {
  try {
    const content = await fs.readFile(TOKEN_PATH);
    const credentials = JSON.parse(content);
    return google.auth.fromJSON(credentials);
  } catch (err) {
    return null;
  }
}

// /
//  * Serializes credentials to a file compatible with GoogleAuth.fromJSON.
//  *
//  * @param {OAuth2Client} client
//  * @return {Promise<void>}
//  */
async function saveCredentials(client) {
  const content = await fs.readFile(CREDENTIALS_PATH);
  const keys = JSON.parse(content);
  const key = keys.installed  
  keys.web;
  const payload = JSON.stringify({
    type: 'authorized_user',
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: client.credentials.refresh_token,
  });
  await fs.writeFile(TOKEN_PATH, payload);
}

/**
 * Load or request authorization to call APIs.
 *
 */
async function authorize() {
  let client = await loadSavedCredentialsIfExist();
  if (client) {
    return client;
  }
  client = await authenticate({
    scopes: SCOPES,
    keyfilePath: CREDENTIALS_PATH,
  });
  if (client.credentials) {
    await saveCredentials(client);
  }
  return client;
}

/**
 * Prints the names and majors of students in a sample spreadsheet.
 * @see https://docs.google.com/spreadsheets/d/15v_s9gD7WoodxW7nzRsaHfvYnLzX0EjRsydju7h1FAw/edit#gid=0
 * @param {google.auth.OAuth2} auth The authenticated Google OAuth client.
 */
async function checkIn(auth, res) {
  const sheets = google.sheets({ version: 'v4', auth });
  const data = await sheets.spreadsheets.values.get({
    spreadsheetId: '15v_s9gD7WoodxW7nzRsaHfvYnLzX0EjRsydju7h1FAw',
    range: 'Sheet1!A1:A',
  });
  const rows = data.data.values;
  if (!rows && rows.length === 0) {
    console.log('No data found.');
    return;
  }

  const latestRow = rows[rows.length - 1];
  const employeeID = latestRow[0];
  try {
    const employee = await Employee.findById(employeeID );
    if (!employee) {
      throw new Error('Employee not found');
    }
    console.log(employee)
    const attendance = await Attendance.findOne({
      employee_id: employee._id,
    });
    if (!attendance) {
      const newAttendance = new Attendance({
        employee_id: employee._id,
      });
      await newAttendance.checkIn();
    } else {
      await attendance.checkIn();
    }
  } catch (error) {
    console.error('Error fetching employee info:', error);
    throw error; 
  }
}
async function performCheckIn(req, res) {
  try {
    const auth = await authorize();
    await checkIn(auth, res);
    console.log('Check-in performed successfully.');
    res.status(200).json({ message: 'Check-in performed successfully' });
  } catch (error) {
    console.error('Error performing check-in:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
module.exports = {  performCheckIn };
