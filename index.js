// require the discord.js module
const Discord = require("discord.js");

// require configuration file
const secret = require("./secret.json");

// require ytdl-core package
const ytdl = require("ytdl-core");
const { repeat, startsWith } = require("ffmpeg-static");

// require ytsr
const ytsr = require("ytsr");

// require ytpl
const ytpl = require("ytpl");

/***********************************************************/
// create a new Discord client
const client = new Discord.Client();
/***********************************************************/

// variable
// var yt_linklist = ["https://www.youtube.com/watch?v=mBgJwg-chyc"];
// var yt_title = ["はい！"];

var yt_linklist = ["start","start"];
var yt_title = ["start","start"];

var voice_connection = false;
var musik_q_rpt = false;

var selection = false;
var inquiry = [];

// debug console log
function console_debug(type, message) {
  console.log(
    "\x1b[33m%s\x1b[0m",
    "Debug: " + message + "   type=[" + type + "]"
  );
}

// debug user message log
function debug_message_log(message, user) {
  console.log("\x1b[36m%s\x1b[0m", "[message] " + message + "\n[user] " + user);
}

async function pl_yt(message, pl_link) {
  const yt_playlist = await ytpl(pl_link);
  let send_string = "";
  yt_playlist.items.forEach((element, index) => {
    yt_linklist.push(element.shortUrl);
    yt_title.push(element.title);
    send_string += index + 1 + ". " + element.title + "\n";
  });
  send_string +=
    yt_playlist.items.length + " songs were queued successfully! \n";
  const embed = new Discord.MessageEmbed()
    .setColor("4f60cc")
    .setDescription(send_string);
  message.channel.send(embed);
}

async function search_yt(message, yttt) {
  const filters1 = await ytsr.getFilters(yttt);
  const filter1 = filters1.get("Type").get("Video");
  const options = {
    pages: 1,
    gl: "JP",
    hl: "JA",
  };
  const searchResults = await ytsr(filter1.url, options);
  let send_string = "";
  searchResults.items.forEach((element, index) => {
    send_string += index + 1 + ". " + element.title + "\n";
    inquiry.push(element.url);
  });
  send_string += "Send /'C/' to cancel. \n";
  const embed = new Discord.MessageEmbed()
    .setColor("FF8800")
    .setDescription(send_string);
  selection = true;
  console.log(inquiry);
  message.channel.send(embed);
}

// audio dispatcher
async function audio_play(link = null, title = null, message = null, connection = null, mode = 0) {
  // // acquire link and store in streamable object
  // const stream = ytdl(yt_link, {
  // 	quality: 'highestaudio',
  // 	highWaterMark: 1 << 25
  // });
  if (yt_linklist[0] != "start") {
    message.channel.send("Now Playing: " + title);
    // create stream
    const stream = await ytdl(link, {
      quality: "highestaudio",
      highWaterMark: 1 << 25,
    });
    console_debug("stream", "created!");
    // create streamDispatcher to play audio
    const dispatcher = connection.play(stream);
    console_debug("stream", "now playing!");
    // once finished, leave voice channel
    dispatcher.on("finish", () => {
      message.channel.send("Music finished");
      play_yt_queue(message, connection);
    });

    // always log errors :>
    dispatcher.on("error", console.error);
  }
  else {
    message.channel.send("test");
    yt_title.shift();
    yt_linklist.shift();
    const dispatcher = connection.play("./audio/主砲砲撃開始.mp3");
    // once finished, leave voice channel
    dispatcher.on("finish", () => {
      message.channel.send("Music finished");
      play_yt_queue(message, connection);
    });

    // always log errors :>
    dispatcher.on("error", console.error);
  }
}

// private music playing handler
function play_yt(message, user_voice) {
  // join user voice channel
  user_voice
    .join()
    .then((connection) => {
      play_yt_queue(message, connection);
    })
    .catch(console.error);
}

// playlist handler
function play_yt_queue(message, connection) {
  if (yt_linklist.length >= 1 && musik_q_rpt === false)
    audio_play(yt_linklist.shift(), yt_title.shift(), message, connection);
  else if (yt_linklist.length >= 1 && musik_q_rpt == true) {
    let ytlk = yt_linklist.shift();
    let yttt = yt_title.shift();
    audio_play(ytlk, yttt, message, connection);
    yt_linklist.push(ytlk);
    yt_title.push(yttt);
  } else {
    message.channel.send("Queue is empty");
    message.guild.voice.channel.leave();
    voice_connection = false;
    console_debug("voice connection", voice_connection);
  }
}

// song queuer
function queue_song(link, message) {
  console_debug("pushing link", link);

  // get basic information
  ytdl.getBasicInfo(link).then(
    (data) => {
      let title = data.videoDetails.title;
      console_debug("log", "data received");
      console_debug("video_url", link);
      console_debug("video_title", title);

      // Video Title
      message.channel.send("Song added: " + title);
      // append to title list
      yt_title.push(title);
    },
    (error) => {
      console.log(error);
      console.log("Connection failed, retrying: " + String(attempt));
    }
  );

  try {
    yt_linklist.push(link);
    console_debug("queue confirmation", "Success!");
  } catch {
    console.log("Failed");
  }
}

// // why the hell did i make this (?)
// // music helper function
// function yt_helper(playlist, message, vc){
// 	if (playlist.length <= 0){
// 		message.channel.send("Queue Empty");
// 		vc.leave();
// 	} else {
// 		playlist.shift();
// 		message.channel.send("Next song.");
// 		play_yt(playlist, message);
// 	}
// }

// login to Discord with your app's token
client.login(secret.token);
/***********************************************************/
// when the client is ready, run this code
client.once("ready", () => {
  // bot is online
  console_debug("log_in", "success!");

  // caching a list of all guilds, log to a list
  const guild_id = client.guilds.cache.map((guild) => guild.id);
  for (var i = 0; i < guild_id.length; i++)
    console_debug("joined_guild_id", guild_id[i]);
});
/***********************************************************/

// message listener
client.on("message", (message) => {
  // message testing log
  debug_message_log(message.content, message.author);

  // get user voice channel
  try {
    var user_voice = message.member.voice.channel;
  } catch {
    var user_voice = null;
  }

  // audio testing
  if (
    message.content === "join pls" &&
    user_voice != null &&
    !voice_connection
  ) {
    play_yt(message, user_voice);
    voice_connection = true;
    console_debug("voice connection", voice_connection);
  } else if (message.content === "skip pls" && user_voice != null) {
    play_yt(message, user_voice);
  } else if (
    message.content === "thank you for your hard work!" &&
    user_voice != null
  ) {
    voice_connection = false;
    message.guild.voice.channel.leave();
  } else if (message.content === "repeat pls" && user_voice != null) {
    musik_q_rpt = true;
    message.channel.send("わかりました、提督！");
  } else if (message.content === "repeat off thank you" && user_voice != null) {
    musik_q_rpt = false;
    message.channel.send("はい！");
  }

  if (message.content === "haruna" && voice_connection) {
    ytdl
      .getBasicInfo("https://www.youtube.com/watch?v=mu2oWcoXn0w")
      .then((data) => {
        let title = data.videoDetails.title;
        console_debug("log", "data received");
        console_debug(
          "video_url",
          "https://www.youtube.com/watch?v=mu2oWcoXn0w"
        );
        console_debug("video_title", title);

        // Video Title
        message.channel.send("榛名は、最高です！");
        // append to title list
        yt_title.unshift(title);
      })
      .catch((error) => {
        console.error(error);
        console.log("Connection failed");
      });
    yt_linklist.unshift("https://www.youtube.com/watch?v=mu2oWcoXn0w");
  }

  if (message.content === "baka" && voice_connection) {
    ytdl
      .getBasicInfo("https://www.youtube.com/watch?v=xFdDNrd6W9s")
      .then((data) => {
        let title = data.videoDetails.title;
        return title;
      })
      .then((data_send) => {
        console_debug("log", "data received");
        console_debug(
          "video_url",
          "https://www.youtube.com/watch?v=xFdDNrd6W9s"
        );
        console_debug("video_title", data_send);

        // Video Title
        message.channel.send("ば、ばか！");
        // append to title list
        yt_title.unshift(data_send);
      })
      .catch((error) => {
        console.error(error);
        console.log("Connection failed");
      });

    yt_linklist.unshift("https://www.youtube.com/watch?v=xFdDNrd6W9s");
  }

  if (
    message.content.startsWith("queue") &&
    message.content.split(" ")[2] === "pls"
  ) {
    let yt_link = message.content.split(" ")[1];
    queue_song(yt_link, message);

    console_debug("music queue", "queued successfully!");
  }

  if (
    message.content.startsWith("search") &&
    message.content.split(" ")[message.content.split(" ").length - 1] ===
      "pls" &&
    selection == false
  ) {
    let yt_sr = message.content.split(" ");
    yt_sr = yt_sr.slice(1, yt_sr.length - 1).join();
    search_yt(message, yt_sr);

    console_debug("music queue", "queued successfully!");
  }

  if (message.content === "display queue pls") {
    let queue_string = "";
    for (var i = 0; i < yt_title.length; i++) {
      queue_string += String(i + 1) + ": " + yt_title[i] + "\n";
    }
    let embed = new Discord.MessageEmbed()
      .setColor("86CECB")
      .setDescription(queue_string);
    message.channel.send(embed);
  }

  if (selection) {
    if (message.content === "c") {
      selection = false;
      inquiry = [];
      message.channel.send("お問い合わせをキャンセルしました。");
    }
    if (Number(message.content) >= 1 && Number(message.content) <= 20) {
      console.log(Number(message.content));
      let yt_link = inquiry[Number(message.content) - 1];
      queue_song(yt_link, message);
      inquiry = [];
      console_debug("music queue", "queued successfully!");
      selection = false;
    }
  }

  if (
    message.content.startsWith("pl") &&
    message.content.split(" ")[2] === "pls"
  ) {
    let ytpl_link = message.content.split(" ")[1];
    pl_yt(message, ytpl_link);

    console_debug("music queue", "queued successfully!");
  }
});
