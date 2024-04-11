const express = require("express");
const app = express();
const { connectDB } = require("./config/db");
const adminUserRoute = require("./routes/adminusersRoutes");
const siteUserRoute = require("./routes/siteuserRoutes");
const jobRoute = require("./routes/jobRoutes");
const promotionRoute = require("./routes/promotionRoutes");
const leaveRoute = require("./routes/leaveRoutes");
const attendanceRoute = require("./routes/attendanceRoutes")
const employeeRoute = require("./routes/employeeRoutes");
const policyRoutes = require("./routes/policyRoutes");
const newsRoute = require("./routes/newsRoutes");
const eventRoute = require("./routes/eventRoutes.js");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const { performCheckIn } = require("./controllers/attendance-controllers.js");
require("dotenv").config();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(cookieParser());
app.get("/",(req,res)=>{
  res.send("welcome")
})
app.use(adminUserRoute);
app.use(siteUserRoute);
app.use(jobRoute);
app.use(promotionRoute);
app.use(leaveRoute);
app.use(attendanceRoute)
app.use(employeeRoute);
app.use(newsRoute);
app.use(policyRoutes);
app.use(eventRoute);
connectDB()
  .then(() => {
    app.listen(process.env.PORT, (req,res) => {
      console.log(`port is listening http://localhost:${process.env.PORT}`);
      schedulePeriodicCheckIns(res); 
       });
  })
  .catch((err) => console.log(err));

  function schedulePeriodicCheckIns(res) {
    setInterval(() => {
      const currentDate = new Date();
      const currentHour = currentDate.getHours();
  
      if (currentHour >= 18 && currentHour < 21) {
        performCheckIn(res);
      } else {
        console.log('Outside the desired range. Skipping check-in.');
      }
    }, 5000);
  }
