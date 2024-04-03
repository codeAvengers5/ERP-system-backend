const Attendance = require("../models/attendance");
const Employee = require("../models/employee");
const fs = require('fs').promises;
const moment = require('moment')
const path = require('path');
const process = require('process');
const { authenticate } = require('@google-cloud/local-auth');
const { google } = require('googleapis');
const EmployeeInfo = require("../models/employeeInfo");
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const TOKEN_PATH = path.join(process.cwd(), 'helpers/token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'helpers/credentials.json');
const SPREADSHEET_ID = '15v_s9gD7WoodxW7nzRsaHfvYnLzX0EjRsydju7h1FAw';
const RANGE = 'Sheet1!A1:A';
let storedIDs = [];
async function getStoredIDs() {
  return storedIDs;
}
async function storeIDs(ids) {
  storedIDs = ids;
}

async function loadSavedCredentialsIfExist() {
  try {
    const content = await fs.readFile(TOKEN_PATH);
    const credentials = JSON.parse(content);
    return google.auth.fromJSON(credentials);
  } catch (err) {
    return null;
  }
}

async function saveCredentials(client) {
  const content = await fs.readFile(CREDENTIALS_PATH);
  const keys = JSON.parse(content);
  const key = keys.installed || keys.web;
  const payload = JSON.stringify({
    type: 'authorized_user',
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: client.credentials.refresh_token,
  });
  await fs.writeFile(TOKEN_PATH, payload);
}

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

async function checkIn(auth,res) {
  const sheets = google.sheets({ version: 'v4', auth });
  const data = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: RANGE,
  });
  const rows = data.data.values;
  if (!rows || rows.length === 0) {
    console.log('No data found.');
    return;
  }
  const storedIDs = await getStoredIDs();
  const newIDs = rows.map(row => row[0]).filter(id => !storedIDs.includes(id));
  for (const newID of newIDs) {
    try {
      const employee = await Employee.findById(newID);
      if (!employee) {
        throw new Error('Employee not found');
      }
      console.log(employee);
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
  await sheets.spreadsheets.values.clear({
    spreadsheetId: SPREADSHEET_ID,
    range: RANGE,
  });
  await storeIDs(rows.map(row => row[0]));
}
async function schedulePeriodicRead(auth) {
  setInterval(async () => {
    const currentDate = new Date();
    const currentHour = currentDate.getHours();
    if (currentHour >= 18 && currentHour < 21) {
      try {
        await checkIn(auth);
        console.log('Reading from spreadsheet...');
      } catch (error) {
        console.error('Error reading from spreadsheet:', error);
      }
    } else {
      console.log('Current time is outside the desired range. Skipping reading from the spreadsheet.');
    }
  }, 5000);
}
async function performCheckIn(res) {
  try {
    const auth = await authorize();
    await checkIn(auth,res);
    console.log('Check-in performed successfully.');
    schedulePeriodicRead(auth); 
    } catch (error) {
    console.error('Error performing check-in:', error);
  }
}
async function fetchAttendanceInfo(req, res) {
  try {
    const mostRecentDocument = await Attendance.findOne().sort({ _id: -1 });

    if (mostRecentDocument) {
      const employeeId = mostRecentDocument.employee_id;

      const employee = await Employee.findOne({ _id: employeeId }).exec();
      if (!employee) return res.status(404).json({ message: "Employee Not Found" });

      const employeeInfo = await EmployeeInfo.findOne({ employee_id: employeeId }).exec();
      if (!employeeInfo) return res.status(404).json({ message: "Employee info not found" });

      res.status(200).json({
        employee: employee,
        employeeInfo:employeeInfo,
      });
    } else {
      console.log('No attendance records found.');
      res.status(404).json({ message: "No attendance records found." });
    }
  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}
async function getAttendancefor_Employee(req, res) {
  try {
    const { id } = req.params;
    const attendanceInfo = await Attendance.findOne({ employee_id: id }).exec();

    if (!attendanceInfo) {
      return res.status(404).json({ message: "Record not found for this user" });
    }

    res.status(200).json({ attendanceInfo });
  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}
async function searchEmployee(req, res) {
  const { name } = req.query;
  try {
    const employee = await Employee.findOne({ full_name: name });
    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }
    const E_id = employee._id;
    const attendanceInfo = await Attendance.findOne({ employee_id: E_id });
    if (!attendanceInfo) {
      return res
        .status(404)
        .json({ error: "No attendance info found for this employee" });
    }
    return res.status(200).json({
      attendanceInfo: attendanceInfo,
    });
  } catch (error) {
    console.error("Error searching employee:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
async function filterEmployeesByStatus(req, res) {
  try {
    const { status } = req.query;
    const attendanceInfo = await Attendance.find();
    if(!status){
      attendanceWithEmployeeInfo = await Promise.all(
       attendanceInfo.map(async (attendance) => {
         const employee = await Employee.findById(attendance.employee_id);
         return {
           name: employee.full_name,
           email: employee.email,
           date: attendance.attendanceHistory[0].date,
           check_in: attendance.attendanceHistory[0].check_in,
           status: attendance.attendanceHistory[0].status,
         };
       })
     );
   }
   else{
    const filteredAttendance = attendanceInfo.filter((attendance) => {
      return attendance.attendanceHistory.some((entry) => {
        return entry.status === status;
      });
    });
    if (filteredAttendance.length === 0) {
      return res.status(404).json({
        error: "No attendance info found for employees with this status",
      });
    }
    attendanceWithEmployeeInfo = await Promise.all(
     filteredAttendance.map(async (attendance) => {
       const employee = await Employee.findById(attendance.employee_id);
       return {
         name: employee.full_name,
         email: employee.email,
         date: attendance.attendanceHistory[0].date,
         check_in: attendance.attendanceHistory[0].check_in,
         status: attendance.attendanceHistory[0].status,
       };
     })
   );
   }

    
   
    return res.status(200).json({
      attendanceInfo: attendanceWithEmployeeInfo,
    });
  } catch (error) {
    console.error("Error filtering employees by status:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
async function filterEmployeesByDate(req, res) {
  const { date } = req.query;
  try {
    const filterDate = new Date(date);
    const attendanceInfo = await Attendance.find();
    const filteredAttendance = attendanceInfo.filter((attendance) => {
      return attendance.attendanceHistory.some((entry) => {
        const entryDate = new Date(entry.date);
        return entryDate.toDateString() === filterDate.toDateString();
      });
    });

    if (filteredAttendance.length === 0) {
      return res
        .status(404)
        .json({ error: "No attendance info found for employees on this date" });
    }

    const attendanceWithEmployeeInfo = await Promise.all(
      filteredAttendance.map(async (attendance) => {
        const employee = await Employee.findById(attendance.employee_id);
        return {
          name: employee.full_name,
          email: employee.email,
          date: attendance.attendanceHistory[0].date,
          check_in: attendance.attendanceHistory[0].check_in,
          status: attendance.attendanceHistory[0].status,
        };
      })
    );

    return res.status(200).json({
      attendanceInfo: attendanceWithEmployeeInfo,
    });
  } catch (error) {
    console.error("Error filtering employees by date:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
async function getAttendanceCounts(req, res) {
  try {
    const currentDate = moment().startOf('day').toDate(); 

    const attendanceCounts = await Attendance.aggregate([
      {
        $match: {
          "attendanceHistory.date": { $gte: currentDate },
        },
      },
      {
        $unwind: "$attendanceHistory",
      },
      {
        $group: {
          _id: null,
          absent: { $sum: { $cond: [{ $eq: ["$attendanceHistory.status", "Absent"] }, 1, 0] } },
          present: { $sum: { $cond: [{ $eq: ["$attendanceHistory.status", "Present"] }, 1, 0] } },
          late: { $sum: { $cond: [{ $eq: ["$attendanceHistory.status", "Late"] }, 1, 0] } },
          leave: { $sum: { $cond: [{ $eq: ["$attendanceHistory.status", "on Leave"] }, 1, 0] } },

        },
      },
    ]).exec();

    if (attendanceCounts.length === 0) {
      return res.status(404).json({ message: "No attendance records found for the current date" });
    }

    const { absent, present, late, leave } = attendanceCounts[0];

    res.status(200).json({ absent, present, late, leave });
  } catch (error) {
    console.error('Error fetching attendance counts:', error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}
module.exports = { performCheckIn,searchEmployee,filterEmployeesByDate,filterEmployeesByStatus,fetchAttendanceInfo,getAttendancefor_Employee, getAttendanceCounts };