const nodemailer = require("nodemailer");
require("dotenv").config();
var transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USERNAME,
    pass: process.env.GMAIL_PASSWORD,
  },
});

exports.sendConfirmationEmail = async (email, confirmationCode, username) => {
  const mailOptions = {
    from: "CodeAvengers",
    to: email,
    subject: "Account Confirmation",
    // text: `Please click the following link to confirm your account: ${process.env.CLIENT_URL}/confirm-email/${confirmationCode}`,
    text: `Hey ${username},<br><br>A sign in attempt requires further verification because we did not recognize your device. To complete the sign in, enter the verification code on the unrecognized device.
      <br><br><br>&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;Verification code:<br>&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;<span style="font-size: 32px;"><b>${confirmationCode}</b></span>.<br><br>Thanks,<br>codeAvengers`,
    html: `Hey ${username},<br><br>A sign in attempt requires further verification because we did not recognize your device. To complete the sign in, enter the verification code on the unrecognized device.
      <br><br>&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;Verification code:<br>&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;<span style="font-size: 32px;"><b>${confirmationCode}</b></span>.<br><br>Thanks,<br>codeAvengers.`,
  };

  await transporter.sendMail(mailOptions);
};
exports.sendWelcomeEmail = async (email, username) => {
  const mailOptions = {
    from: "Code Avengers",
    to: email,
    subject: "Welcome to Mekedonia Website",
    text: `Welcome ${username},<br><br>You’ve just opened an account and are set to begin a user.<br><br>Thanks,<br>codeAvengers`,
    html: `Welcome to our website ${username},<br><br>You have just opened an account and are set to begin to signin to your account.
        <br><br>Thanks,<br>Mekedonia.</p>`,
  };

  await transporter.sendMail(mailOptions);
};
