import('node-fetch');
const {parse} = require("node-html-parser");
const fs = require('fs');
require('dotenv').config();
const {URL} = require('url');

const options = {
    url: 'https://www.jsae.or.jp/formula/',
    method: 'GET'
};

async function sendDiscordMessage(name, msg, webhookUrl, linkedUrl) {
    const postData = {
        username: name,
        embeds: [
            {
                title: msg,
                url: linkedUrl,
                color: 32896
            }
        ]
    };
    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(postData)
        });
        if (response.status !== 204) {
            return -1;
        }
        return 0;
    } catch (error) {
        console.error("Failed to send message:", error);
        return -1;
    }
}

function htmlSpecialParse(text) {
    return text.replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, "\"")
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, " ");
}

function urlDomainCompliment(url) {
    const parsedUrl = new URL(url, 'https://www.jsae.or.jp');
    return parsedUrl.href;
}

async function main() {
    try {
        const response = await fetch(options.url);
        const body = await response.text();
        const root = parse(body);
        const processor = [];
        const path = "./output.json";
        let input;
        let isChanged = false;

        const TITLE = root.querySelectorAll(".newsList_title");
        const TIME = root.querySelectorAll(".newsList_dates");

        for (let i = 0; i < TITLE.length; i++) {
            processor.push({
                "name": TITLE[i].innerText.trim(),
                "url": urlDomainCompliment(TITLE[i].getAttribute('href')),
                "date": TIME[i].innerText.trim()
            });
        }

        try {
            input = JSON.parse(fs.readFileSync(path, 'utf8'));
        } catch (error) {
            console.error("Error reading JSON file:", error);
            input = [{name: "example", url: "example.com", date: "1500.01.01"}];
        }

        for (let i = 0; i < processor.length; i++) {
            let isNew = true;
            for (let j = 0; j < input.length; j++) {
                if (processor[i].name === input[j].name && processor[i].date === input[j].date) {
                    isNew = false;
                    break;
                }
            }

            if (isNew) {
                input.push(processor[i]);
                isChanged = true;
                if (await sendDiscordMessage('JSAE Announce BOT', htmlSpecialParse(processor[i].name), process.env.discord_hook, processor[i].url) === -1) {
                    console.log("Failed to send message.");
                }
            }
        }

        if (isChanged) {
            fs.writeFile('output.json', JSON.stringify(input), (err) => {
                if (err) throw err;
                console.log('The file has been saved!');
            });
        } else {
            console.log("No change is detected.");
        }
    } catch (error) {
        console.error("Error:", error);
    }
}

main().then(r => {
    if (!r) {
        console.log("Finished.")
    }
});
