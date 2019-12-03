var express = require('express')
var bodyParser = require('body-parser')
var app = express()
var morgan = require('morgan')
var routes = require('./routes')
// var oAuth     = require('./o-auth');
// var googleAuth     = require('./google-auth');
var { google } = require('googleapis')
var config = require('./config')
var fs = require('fs')
var OAuth2 = google.auth.OAuth2
var axios = require('axios')

var data = require('./data.json')

const DOMOTZ_PUBLIC_API =
  'https://api-testing-eu-central-1-cell-1.domotz.nl/public-api/v1/'
const X_API_Key = 'j8gGcpKY4YsmnNiOHib9lAv1pexbnL8uj92UBas6BTR'

// configure app
app.use(morgan('dev')) // log requests to the console
// app.use(bodyParser)

// configure body parser
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

app.use(function (req, res, next) {
  // Website you wish to allow to connect
  res.setHeader('Access-Control-Allow-Origin', '*')

  // Request methods you wish to allow
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, OPTIONS, PUT, PATCH, DELETE'
  )

  // Request headers you wish to allow
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type')

  // Set to true if you need the website to include cookies in the requests sent
  // to the API (e.g. in case you use sessions)
  // res.setHeader('Access-Control-Allow-Credentials', true)

  // Pass to next layer of middleware
  next()
})

var port = process.env.PORT || 5555 // set our port

app.get('/events/updates', function (req, res) {
  var new_data = JSON.parse(fs.readFileSync('./data.json', 'utf8'))

  var data = JSON.parse(fs.readFileSync('./data.json', 'utf8'))
  data.events = []
  fs.writeFileSync('data.json', JSON.stringify(data, null, 1))

  var events = new_data.events
  res.status(200).json({ events })
})

app.post('/events/new', function (req, res) {
  console.log('New Domotz WEBHOOK event received ')
  console.log(req.body)

  let event = {
    agent_id: req.body.data.agent_id,
    device_id: req.body.data.device_id,
    event_type: req.body.name,
    event_value: req.body.data.value ? req.body.data.value : ''
  }
  let data = JSON.parse(fs.readFileSync('./data.json', 'utf8'))
  let domotz_public_api_call_device = {
    url:
      DOMOTZ_PUBLIC_API + `/agent/${event.agent_id}/device/${event.device_id}`,
    method: 'get',
    headers: {
      Accept: 'application/json',
      'X-Api-Key': X_API_Key
    }
  }
  axios(domotz_public_api_call_device)
    .then(response => {
      event.device_display_name = response.data.display_name

      let domotz_public_api_call_agent = {
        url: DOMOTZ_PUBLIC_API + `/agent/${event.agent_id}`,
        method: 'get',
        headers: {
          Accept: 'application/json',
          'X-Api-Key': X_API_Key
        }
      }

      axios(domotz_public_api_call_agent)
        .then(response => {
          event.agent_display_name = response.data.display_name

          data.events.push(event)

          fs.writeFileSync('data.json', JSON.stringify(data, null, 1))
          res.status(200)

          var ifttt_call = {
            url: `https://maker.ifttt.com/trigger/new_domotz_event/with/key/dkmPCLOY6qXAYqkjdTUUWt`,
            method: 'post',
            headers: {
              Accept: 'application/json'
            },
            data: {
              value1: event.device_display_name,
              value2: event.agent_display_name,
              value2: event.event_type + ' ' + (event.event_value || '')
            }
          }
          axios(ifttt_call)
            .then(response => console.log(response.data))
            .catch(error => console.log(error))
        })
        .catch(error => console.log(error))
    })
    .catch(error => console.log(error))
})

var oauth2Client = new OAuth2(
  config.googleClientId,
  config.clientSecret,
  config.redirectUrl
)

app.get('/oauthtest', function (req, res) {
  console.log('oauthtest')
  // generate a url that asks permissions for Google+ and Google Calendar scopes
  var scopes = [
    'https://www.googleapis.com/auth/plus.me',
    'https://www.googleapis.com/auth/calendar'
  ]

  var url = oauth2Client.generateAuthUrl({
    // 'online' (default) or 'offline' (gets refresh_token)
    access_type: 'offline',
    // If you only need one scope you can pass it as a string
    scope: scopes
    // Optional property that passes state parameters to redirect URI
    // state: 'foo'
  })
  console.log('url', url)
  res.send(url)
})

app.get('/oauthcallback', function (req, res) {
  console.log('oauthcallback')
  console.log(req.query)
  var token
  oauth2Client.getToken(req.query.code, function (err, tokens) {
    // Now tokens contains an access_token and an optional refresh_token. Save them.
    if (!err) {
      token = tokens
      console.log('tokens', tokens)
      oauth2Client.setCredentials(tokens)
    }
  })
  res.send(token)
})

// REGISTER OUR ROUTES -------------------------------
app.use('/ifttt/v1', routes)

// START THE SERVER
// =============================================================================
app.listen(port)
console.log('Magic happens on port ' + port)
