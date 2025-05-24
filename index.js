require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dns = require('dns');
const urlParser = require('url');

const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use('/public', express.static(`${process.cwd()}/public`));

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Schema
const urlSchema = new mongoose.Schema({
  original_url: String,
  short_url: Number
});

const Url = mongoose.model('Url', urlSchema);

// Serve front-end
app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Test API
app.get('/api/hello', function (req, res) {
  res.json({ greeting: 'hello API' });
});

// POST endpoint to shorten URL
app.post('/api/shorturl', async (req, res) => {
  const inputUrl = req.body.url;
  const parsedUrl = urlParser.parse(inputUrl);

  if (!parsedUrl.hostname) {
    return res.json({ error: 'invalid url' });
  }

  dns.lookup(parsedUrl.hostname, async (err) => {
    if (err) return res.json({ error: 'invalid url' });

    let urlCount = await Url.countDocuments();
    const newUrl = new Url({
      original_url: inputUrl,
      short_url: urlCount + 1
    });

    await newUrl.save();
    res.json({
      original_url: newUrl.original_url,
      short_url: newUrl.short_url
    });
  });
});

// GET endpoint to redirect
app.get('/api/shorturl/:short_url', async (req, res) => {
  const urlEntry = await Url.findOne({ short_url: parseInt(req.params.short_url) });
  if (urlEntry) {
    res.redirect(urlEntry.original_url);
  } else {
    res.json({ error: 'No short URL found for given input' });
  }
});

// Start server
app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
