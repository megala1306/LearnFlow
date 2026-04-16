const mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/learnflow').then(() => {
    console.log('CONNECTED');
    process.exit(0);
}).catch(err => {
    console.error('ERROR', err);
    process.exit(1);
});
