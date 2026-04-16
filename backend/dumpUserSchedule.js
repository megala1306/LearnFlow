const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');

mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/learnflow").then(async () => {
  const users = await User.find({});
  users.forEach(u => {
    console.log("User:", u.name, "Email:", u.email);
    console.log("Schedule:", JSON.stringify(u.revisionSchedule, null, 2));
  });
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
