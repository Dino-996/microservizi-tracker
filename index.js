require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');

const mongoose = require('mongoose');
const { Schema } = mongoose;
mongoose.connect(process.env.MONGO_URI);

app.use(cors());
app.use(express.static('public'));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

// Schemi e definizioni
const userSchema = new mongoose.Schema({
  username: { type: String, required: true }
});
const User = mongoose.model('User', userSchema);

const logSchema = new mongoose.Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: { type: String, required: true }
});
const Log = mongoose.model('Log', logSchema);

// 2
app.post('/api/users', async function (req, res) {
  const username = req.body.username;

  try {
    const newUser = new User({ username });
    await newUser.save();
    res.json({ username: newUser.username, _id: newUser._id });
  } catch (error) {
    res.status(500).json({ error: "Error creating user" });
  }
});

// 3, 4, 5
app.get('/api/users', async function (req, res) {
  try {
    const users = await User.find({}, '_id username');
    res.json(users);
  } catch (error) {
    res.status(500).send("Error retrieving users");
  }
});

// 6, 7, 8
app.post('/api/users/:_id/exercises', async function (req, res) {
  const _id = req.params._id;
  const { description, duration, date } = req.body;

  let validDate;

  if (date) {
    validDate = new Date(date);
  } else {
    validDate = new Date();
  }

  const dateString = validDate.toDateString();

  try {
    const user = await User.findById(_id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const logData = { user: user._id, description: description, duration: Number(duration), date: dateString };

    const newLog = new Log(logData);
    await newLog.save();

    res.json({ _id: user._id, username: user.username, date: dateString, duration: Number(duration), description: description });

  } catch (error) {
    console.error(error);
    res.status(500).send("Error adding exercise");
  }
});

// 9
app.get('/api/users/:_id/logs', async function (req, res) {
  const _id = req.params._id;
  const { from, to, limit } = req.query;

  try {
    const user = await User.findById(_id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    let filter = { user: _id };

    if (from || to) {
      filter.date = {};

      if (from) {
        const fromDate = new Date(from);
        filter.date.$gte = fromDate.toDateString();
      }

      if (to) {
        const toDate = new Date(to);
        filter.date.$lte = toDate.toDateString();
      }
    }

    let query = Log.find(filter);

    if (limit) {
      query = query.limit(Number(limit));
    }

    const logs = await query.exec();

    const formattedLogs = logs.map(log => ({ description: log.description, duration: log.duration, date: log.date }));

    res.json({ _id: user._id, username: user.username, count: logs.length, log: formattedLogs });

  } catch (error) {
    console.error(error);
    res.status(500).send("Error retrieving logs");
  }
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
});