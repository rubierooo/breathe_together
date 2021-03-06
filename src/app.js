require('dotenv').config();

// add timestamps in front of log messages
require('console-stamp')(console, '[HH:MM:ss.l]');

var schedule = require('node-schedule');

const TelegramBot = require('node-telegram-bot-api');
// Simple-git without promise
const simpleGit = require('simple-git')();

// Simple Git with Promise for handling success and failure
const simpleGitPromise = require('simple-git/promise')();
const fs = require('fs');

// .env contains bot token TOKEN, git username USER and password PASS, and repo url REPO:
const token = process.env.TOKEN;
const gitUser = process.env.USERNAME;
const gitPass = process.env.PASS;
const gitRepo = process.env.REPO;
const gitHubUrl = `https://${gitUser}:${gitPass}@github.com/${gitUser}/${gitRepo}`;

simpleGit.clone(gitHubUrl);

// Created instance of TelegramBot
const bot = new TelegramBot(token, {
    polling: true
});

// In-memory storage
const URLs = [];
const URLLabels = [];
let tempSiteURL = '';

//function to push to the github pages site: add content.html, commit with message, fetch origin
function gitCommit () {
  // add local git config like username and email
  simpleGit.addConfig('user.email','13jibber@gmail.com');
  simpleGit.addConfig('user.name','Breathe Together');

  // clone to embed user/pass

  // Add all files for commit
    simpleGitPromise.add('content.html')
      .then(
         (addSuccess) => {
            console.log(addSuccess);
         }, (failedAdd) => {
            console.log('adding files failed');
      });
  // Commit files as Initial Commit
   simpleGitPromise.commit('Intial commit by simplegit')
     .then(
        (successCommit) => {
          console.log(successCommit);
       }, (failed) => {
          console.log('failed commmit');
   });
  // Finally push to online repository
   simpleGitPromise.push('origin','master')
      .then((success) => {
         console.log('repo successfully pushed');
      },(failed)=> {
         console.log('repo push failed');
   });
}

//add date every night at midnight
var addDate = schedule.scheduleJob('0 0 * * *',function(){
  let date_ob = new Date();
  var date = ("0" + (date_ob.getDate())).slice(-2) + "/" + ("0" + (date_ob.getMonth())).slice(-2);
  var para = "\n<p class=date>" + date + "</p>";
  fs.appendFile('content.html', para, (err) => {
      if (err) throw err;
      console.log('Daily Date Added');
  });
});

//press g to push to git now
const readline = require('readline');
readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);
process.stdin.on('keypress', (str, key) => {
  if (key.ctrl && key.name === 'c') {
    process.exit();
  } else if (key.name === 'g') {
    console.log('force git push')
    gitCommit();
  }
});

//every hour, check if anything's changed; then push to git if it has
var hasChanged = false;

var hourlyCheck = schedule.scheduleJob('55 * * * *',function(){
  console.log('Hourly Check Started');
  if (hasChanged) {
  console.log('Changes found - commiting');
    gitCommit();
    hasChanged = false
  } else {
  console.log('no changes');

  }
});

//function to add a message to the webpage
function updatePage (user, message) {
  let date_ob = new Date();
  var time = ("0" + (date_ob.getHours())).slice(-2) + ":" + ("0" + (date_ob.getMinutes())).slice(-2);
  var para = "\n<p>" + message + "<br/><span class=timestamp>" + user + " - " + time + "</span></p>";
  fs.appendFile('content.html', para, (err) => {
      if (err) throw err;
      console.log('Post added to content.html');
  });
  hasChanged = true;
}

//add a text message
bot.on('text', (msg) => {
  let username = msg.from.first_name;
  updatePage(username, msg.text);
});

//add photo message
bot.on('photo', (msg) => {
  let date_ob = new Date();
  let username = msg.from.first_name;
  let newFilename = ("0" + date_ob.getDate()).slice(-2) + ("0" + (date_ob.getMonth() + 1)).slice(-2) + date_ob.getFullYear() + "-" + ("0" + (date_ob.getHours())).slice(-2) + ("0" + (date_ob.getMinutes())).slice(-2) + ("0" + (date_ob.getSeconds())).slice(-2) + "_" + username; //create new file name to change downloaded file to
  let newPath =  "media/img/" + newFilename + ".jpg";
  let imgCode = '<img src="media/img/' + newFilename + '.jpg"/>';

  function whenDownloaded(filePath) {  //function to run when image sucessfully downloaded - filePath is the path to the file
    fs.rename(filePath, newPath, function(err) { //rename photo
      if ( err ) console.log('ERROR: ' + err);
    });
    if (msg.caption == undefined) { //append caption if there is one
      updatePage(username, imgCode);
    } else {
      updatePage(username, imgCode + "<br/>" + msg.caption);
    }
  }

  let pSize = msg.photo;
  let photoId = pSize[pSize.length - 1].file_id; //get id of largest photo size

  const dlPromise = bot.downloadFile(photoId, 'media/img'); //save photo and create Promise dlPromise
  dlPromise.then(whenDownloaded)
});

//add voice memo message
bot.on('voice', (msg) => {
  let date_ob = new Date();
  let username = msg.from.first_name;
  let newFilename = ("0" + date_ob.getDate()).slice(-2) + ("0" + (date_ob.getMonth() + 1)).slice(-2) + date_ob.getFullYear() + "-" + ("0" + (date_ob.getHours())).slice(-2) + ("0" + (date_ob.getMinutes())).slice(-2) + ("0" + (date_ob.getSeconds())).slice(-2) + "_" + username; //create new file name to change downloaded file to
  let newPath =  "media/sound/" + newFilename + ".ogg";
  let soundCode = '<audio controls><source src="media/sound/' + newFilename + '.ogg" type="audio/ogg"></audio>';

  function whenDownloaded(filePath) {  //function to run when sucessfully downloaded - filePath is the path to the file
    fs.rename(filePath, newPath, function(err) { //rename sound file
      if ( err ) console.log('ERROR: ' + err);
    });
    if (msg.caption == undefined) { //append caption if there is one
      updatePage(username, soundCode);
    } else {
      updatePage(username, soundCode + "<br/>" + msg.caption);
    }
  }

  let soundId = msg.voice.file_id; //get id of sound file

  const dlPromise = bot.downloadFile(soundId, 'media/sound'); //save photo and create Promise dlPromise
  dlPromise.then(whenDownloaded)
});

//add audioo message
bot.on('audio', (msg) => {
  let date_ob = new Date();
  let username = msg.from.first_name;
  let newFilename = ("0" + date_ob.getDate()).slice(-2) + ("0" + (date_ob.getMonth() + 1)).slice(-2) + date_ob.getFullYear() + "-" + ("0" + (date_ob.getHours())).slice(-2) + ("0" + (date_ob.getMinutes())).slice(-2) + ("0" + (date_ob.getSeconds())).slice(-2) + "_" + username; //create new file name to change downloaded file to
  let newPath =  "media/sound/" + newFilename + ".ogg";
  let soundCode = '<audio controls><source src="media/sound/' + newFilename + '.ogg" type="audio/ogg"></audio>';

  function whenDownloaded(filePath) {  //function to run when sucessfully downloaded - filePath is the path to the file
    fs.rename(filePath, newPath, function(err) { //rename sound file
      if ( err ) console.log('ERROR: ' + err);
    });
    if (msg.caption == undefined) { //append caption if there is one
      updatePage(username, soundCode);
    } else {
      updatePage(username, soundCode + "<br/>" + msg.caption);
    }
  }

  let soundId = msg.audio.file_id; //get id of sound file

  const dlPromise = bot.downloadFile(soundId, 'media/sound'); //save photo and create Promise dlPromise
  dlPromise.then(whenDownloaded)
});

//add video message
bot.on('video_note', (msg) => {
  let date_ob = new Date();
  let username = msg.from.first_name;
  let newFilename = ("0" + date_ob.getDate()).slice(-2) + ("0" + (date_ob.getMonth() + 1)).slice(-2) + date_ob.getFullYear() + "-" + ("0" + (date_ob.getHours())).slice(-2) + ("0" + (date_ob.getMinutes())).slice(-2) + ("0" + (date_ob.getSeconds())).slice(-2) + "_" + username; //create new file name to change downloaded file to
  let newPath =  "media/video/" + newFilename + ".mp4";
  let videoCode = '<video class="videonote" width="300px" height="300px"><source src="media/video/' + newFilename + '.mp4" type="video/mp4"></video>';

  function whenDownloaded(filePath) {  //function to run when sucessfully downloaded - filePath is the path to the file
    fs.rename(filePath, newPath, function(err) { //rename sound file
      if ( err ) console.log('ERROR: ' + err);
    });
    if (msg.caption == undefined) { //append caption if there is one
      updatePage(username, videoCode);
    } else {
      updatePage(username, videoCode + "<br/>" + msg.caption);
    }
  }

  let videoId = msg.video_note.file_id; //get id of sound file

  const dlPromise = bot.downloadFile(videoId, 'media/sound'); //save photo and create Promise dlPromise
  dlPromise.then(whenDownloaded)
});

//add video
bot.on('video', (msg) => {
  let date_ob = new Date();
  let username = msg.from.first_name;
  let newFilename = ("0" + date_ob.getDate()).slice(-2) + ("0" + (date_ob.getMonth() + 1)).slice(-2) + date_ob.getFullYear() + "-" + ("0" + (date_ob.getHours())).slice(-2) + ("0" + (date_ob.getMinutes())).slice(-2) + ("0" + (date_ob.getSeconds())).slice(-2) + "_" + username; //create new file name to change downloaded file to
  let newPath =  "media/video/" + newFilename + ".mp4";
  let videoCode = '<video width="400px" height="400px"><source src="media/video/' + newFilename + '.mp4" type="video/mp4"></video>';

  function whenDownloaded(filePath) {  //function to run when sucessfully downloaded - filePath is the path to the file
    fs.rename(filePath, newPath, function(err) { //rename sound file
      if ( err ) console.log('ERROR: ' + err);
    });
    if (msg.caption == undefined) { //append caption if there is one
      updatePage(username, videoCode);
    } else {
      updatePage(username, videoCode + "<br/>" + msg.caption);
    }
  }

  let videoId = msg.video.file_id; //get id of sound file

  const dlPromise = bot.downloadFile(videoId, 'media/sound'); //save photo and create Promise dlPromise
  dlPromise.then(whenDownloaded)
});

//give more information about errors
bot.on("polling_error", (err) => console.log(err));
