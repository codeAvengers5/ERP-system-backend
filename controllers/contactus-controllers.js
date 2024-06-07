const Contact = require("../models/contact");

const createContactus = async (req, res) => {
  const { full_name, email, message } = req.body;
  if (!full_name || !email || !message) {
   
    res.status(400).json({ error: "Please fill all the fields"});
  }
  try {
    const contactus = new Contact({
      full_name,
      email,
      message,
    });
    await contactus.save();
    res.status(200).json({ contactus });
  } catch (error) {
    res.status(500).json({ error: "Failed to send contacus form" });
    console.log(error);
  }
};
const getContactUsInfo = async (req, res) => {
  try {
    const contactus = await Contact.find();
    res.status(200).json({ contactus });
  } catch (error) {
    res.status(500).json({ error: "Failed to get contact us info" });
  }
};
module.exports = { createContactus, getContactUsInfo };
