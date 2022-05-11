// Loads libarys
const { $fetch } = require("ohmyfetch");
const { WebhookClient } = require("discord.js");
const fs = require("fs");
const { url } = require("./config.json");

// Creating webhook
const webhook = new WebhookClient({ url });

// Loads Storage initially
let storage;
if (fs.existsSync("storage.json")) {
  const text_utf = fs.readFileSync("storage.json", { encoding: "utf-8" });
  storage = JSON.parse(text_utf);
} else storage = {};

// Deletes Storage initially
Object.keys(storage).forEach(async (region) => {
  storage[region].forEach(async (id) => {
    await webhook.deleteMessage(id);
  });
  storage[region] = [];
});

// Initially state
let progress_state = {
  1: 0,
  2: 0,
  3: 0,
};

let timestamped_state = {
  1: 0,
  2: 0,
  3: 0,
};

const counter_state = {
  1: "969206244466368522",
  2: "969206307758419978",
  3: "969206348417998849",
};

const region_name = {
  1: "Amerika",
  2: "Europa",
  3: "Asien",
};

async function run() {
  // Fetching data
  const dclone_progress_data = await $fetch(
    "https://diablo2.io/dclone_api.php?ladder=1&hc=2",
    { parseResponse: JSON.parse }
  );

  // console.log(dclone_progress_data);

  for (let i = 0; i < dclone_progress_data.length; i++) {
    // Reading data
    const { progress, region, timestamped } = dclone_progress_data[i];
    console.log(progress, region, timestamped);

    // Webhook template
    const webhook_message = {
      username: "DClone",
      avatarURL:
        "https://diablo2.io/styles/zulu/theme/images/items/diablo_hell_graphic.png",
      embeds: [
        {
          title: `SC-Ladder DClone Status: ${progress}/6 auf ${region_name[region]}`,
          color: 7440858,
          footer: { text: "Data courtesy of diablo2.io" },
        },
      ],
    };

    if (
      progress == 1 &&
      progress_state[region] > 3 &&
      parseInt(timestamped) > timestamped_state[region] + 3600
    ) {
      const webhook_message_counter = await webhook.fetchMessage(
        counter_state[region]
      );

      webhook_message_counter.embeds[0].description = String(
        parseInt(webhook_message_counter.embeds[0].description) + 1
      );
      await webhook.editMessage(counter_state[region], {
        embeds: [webhook_message_counter.embeds[0]],
      });

      progress_state[region] = progress;
      timestamped_state[region] = parseInt(timestamped);

      webhook_message.content = `DClone ist gespawnt. Ich hoffe du hast es noch rechtzeitig geschafft.`;
      const { id } = await webhook.send(webhook_message);

      if (!storage[region]) storage[region] = [];
      storage[region].push(id);
      fs.writeFileSync("storage.json", JSON.stringify(storage));
    }

    if (progress < progress_state[region]) {
      progress_state[region] = 0;

      if (storage[region]) {
        storage[region].forEach(async (id) => {
          console.log("deleting msg", id);
          await webhook.deleteMessage(id);
        });
        storage[region] = [];
        fs.writeFileSync("storage.json", JSON.stringify(storage));
      }
    }

    if (progress > progress_state[region]) {
      progress_state[region] = progress;

      webhook_message.content = progress > 3 ? "<@&903980931264692295>" : null;
      const { id } = await webhook.send(webhook_message);
      console.log("sent", id);

      if (!storage[region]) storage[region] = [];
      storage[region].push(id);
      fs.writeFileSync("storage.json", JSON.stringify(storage));

      console.log(webhook_message.embeds[0].title);
    }
  }
}
setInterval(run, 1 * 60 * 1000);
run();

// Auto Update
// const express = require("express");
// const app = express();
// const port = 3000;

// app.get("/", (req, res) => {
//   res.json(storage);
// });

// app.listen(port, () => {
//   console.log(`Example app listening on port ${port}`);
// });
