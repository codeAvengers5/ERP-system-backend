const Attendance = require("../models/attendance");
const Employee = require("../models/employee");
const fs = require('fs').promises;
const moment = require('moment')
const path = require('path');
const process = require('process');
const { authenticate } = require('@google-cloud/local-auth');
const { google } = require('googleapis');
const EmployeeInfo = require("../models/employeeInfo");
const Role = require("../models/role");
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets',];
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

async function checkIn(auth) {
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

      const currentDate = new Date();
      const dayOfWeek = currentDate.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // 0 = Sunday, 6 = Saturday
      const calendar = google.calendar({ version: 'v3', auth });
      const calendarEvents = await calendar.events.list({
        calendarId: 'primary',
        timeMin: currentDate.toISOString(),
        timeMax: currentDate.toISOString(),
        singleEvents: true,
      });
      const isHoliday = calendarEvents.data.items.length > 0;

      const attendance = await Attendance.findOne({
        employee_id: employee._id,
      });
      
      if (!isWeekend && !isHoliday) {
        if (!attendance) {
          const newAttendance = new Attendance({
            employee_id: employee._id,
          });
          await newAttendance.checkIn();

          const event = {
            summary: 'Check-in',
            start: {
              dateTime: new Date().toISOString(),
            },
            end: {
              dateTime: new Date().toISOString(),
            },
            description: `Check-in recorded for ${employee.name}`,
          };
           calendar.events.insert({
            calendarId: 'primary',
            resource: event,
          });
        } else {
          await attendance.checkIn();
        }
      } else {
        // If it's a weekend or holiday, record attendance as "No Record"
        const attendanceRecord = {
          date: currentDate,
          check_in: null,
          status: "No Record, It is a  Weekend or Holiday",
        };
        if (attendance) {
          attendance.attendanceHistory.push(attendanceRecord);
          await attendance.save();
        } else {
          const newAttendance = new Attendance({
            employee_id: employee._id,
            attendanceHistory: [attendanceRecord]
          });
          await newAttendance.save();
        }
      }
    } catch (error) {
      console.log('Error fetching employee info:', error.message);
      // throw error;
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
    await checkIn(auth);
    console.log('Check-in performed successfully.');
    schedulePeriodicRead(auth); 
    } catch (error) {
    console.log('Error performing check-in:', error);
  }
}
async function fetchAttendanceInfo(req, res) {
  try {
    const mostRecentDocument = await Attendance.findOne().sort({ _id: -1 });
    if (mostRecentDocument) {
      const employeeId = mostRecentDocument.employee_id;

      const employee = await Employee.findOne({ _id: employeeId }).exec();
      if (!employee) return res.status(404).json({ message: "Employee Not Found" });
      const roleId = employee.role_id.toString();
      const role = await Role.findOne({ _id: roleId });
      if (!role) {
        return res.status(404).json({ message: "Role Not Found" });
      }
      const employeeInfo = await EmployeeInfo.findOne({ employee_id: employeeId }).exec();
      if (!employeeInfo) return res.status(404).json({ message: "Employee info not found" });

      res.status(200).json({
        employee: employee,
        employeeInfo:employeeInfo,
        role: role,
        arrivaltime: `${mostRecentDocument.attendanceHistory[0].check_in.getHours()}:${mostRecentDocument.attendanceHistory[0].check_in.getMinutes()}`
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
async function searchEmployee(req, res) {
  const { name } = req.query;
  try {
    const employees = await Employee.find({ full_name: { $regex: `^${name}`, $options: 'i' } });
    
    if (employees.length === 0) {
      return res.status(404).json({ error: "No employees found" });
    }

    const attendanceInfo = await Promise.all(employees.map(async (employee) => {
      const E_id = employee._id;
      return await Attendance.findOne({ employee_id: E_id });
    }));

    return res.status(200).json({
      employeesWithAttendance: employees.map((employee, index) => ({
        employee: employee,
        attendanceInfo: attendanceInfo[index]
      }))
    });
  } catch (error) {
    console.error("Error searching employees:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
async function filterEmployeesByStatus(req, res) {
  try {
    const { status, date } = req.query;

    let attendanceInfo = await Attendance.find({});

    const filterDate = new Date(date);
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

        const filteredHistory = attendance.attendanceHistory
          .filter((entry) => {
            const entryDate = new Date(entry.date);
            return entryDate.toDateString() === filterDate.toDateString();
          })
          .filter((entry) => !status || entry.status === status)
          .map((entry) => {
            const { date, check_in, status: entryStatus } = entry;

            return {
              date,
              check_in,
              status: entryStatus,
            };
          });

        return {
          name: employee.full_name,
          email: employee.email,
          attendanceHistory: filteredHistory,
        };
      })
    );

    const filteredAttendanceWithEmployeeInfo = attendanceWithEmployeeInfo.filter(
      Boolean
    );

    if (filteredAttendanceWithEmployeeInfo.length === 0) {
      return res.status(404).json({
        error: "No attendance info found for employees with this status",
      });
    }

    return res.status(200).json({
      attendanceInfo: filteredAttendanceWithEmployeeInfo,
    });
  } catch (error) {
    console.error("Error filtering employees by status:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
async function filterEmployeesByDate(req, res) {
  try {
    const { date, userId } = req.query;
    const filterDate = new Date(date);
    let filteredAttendance;
    let attendanceInfo;

    if (userId !== "undefined") {
      attendanceInfo = await Attendance.findOne({ employee_id: userId });
    } else {
      attendanceInfo = await Attendance.find();
    }

    filteredAttendance = Object.values(attendanceInfo).filter((attendance) => {
      if (Array.isArray(attendance.attendanceHistory)) {
        return attendance.attendanceHistory.some((entry) => {
          const entryDate = new Date(entry.date);
          return entryDate.toDateString() === filterDate.toDateString();
        });
      }
      return false;
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
          attendanceHistory: attendance.attendanceHistory.filter(entry => {
            const entryDate = new Date(entry.date);
            return entryDate.toDateString() === filterDate.toDateString();
          }),
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
    const currentDate = moment('').startOf('day').toDate(); 
    const employeeCounts = await Employee.countDocuments();
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

    res.status(200).json({ absent, present, late, leave,employeeCounts });
  } catch (error) {
    console.error('Error fetching attendance counts:', error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}
module.exports = { performCheckIn,searchEmployee,filterEmployeesByDate,filterEmployeesByStatus,fetchAttendanceInfo,getAttendanceCounts };