const request = require('request');
const parse = require("node-html-parser").parse;
const fs = require('fs');
require('dotenv').config();
const options = {
    url: 'https://www.jsae.or.jp/formula/', method: 'GET'
};


function sendDiscordMessage(name, msg, webhookUrl, linkedUrl) {
    const postData = {
        username: name, embeds: [{
            title: msg, url: linkedUrl, color: 32896
        }]
    }
    fetch(webhookUrl, {
        method: 'POST', headers: {
            'Accept': 'application/json', 'Content-Type': 'application/json',
        }, body: JSON.stringify(postData)
    }).then(r => {
        if (r.status !== 204) {

            return -1
        } else {
            return 0
        }
    })
    return 0
}

function htmlSpecialParse(text) {//htmlの特殊文字を変換
    return text.split("&amp;").join("&").split("&lt;").join("<").split("&gt;").join(">").split("&quot;").join("\"").split("&#39;").join("'").split("&nbsp;").join(" ");
}

function urlDomainCompliment(url) {
    if (url.startsWith("https://")) {
        return url;
    } else {
        return "https://www.jsae.or.jp" + url;
    }
}

function main() {
    let isChanged = false;
    request(options, function (error, response, body) {
        let root = parse(body)
        let processor = []
        let path = "./output.json"
        let input;
        let isNew = true;
        const TITLE = root?.querySelectorAll(".newsList_title");
        const TIME = root?.querySelectorAll(".newsList_dates");
        for (let i = 0; i < TITLE.length; i++) {
            processor.push({
                "name": TITLE[i].innerText.trim(),
                "url": urlDomainCompliment(TITLE[i].getAttribute('href')),
                "date": TIME[i].innerText.trim()
            });//trim()で前後の空白を削除
        }

        try {
            input = JSON.parse(fs.readFileSync(path, 'utf8'))
        } catch (e) {
            input = [{name: "example", url: "example.com", date: "1500.01.01"}]
        }

        for (let i = 0; i < processor.length; i++) {
            for (let j = 0; j < input.length; j++) {
                isNew = true;
                if (processor[i].name === input[j].name && processor[i].date === input[j].date) {
                    isNew = false;
                    break;
                }
            }

            if (isNew) {
                input.push(processor[i]);
                isChanged = true;
                if (sendDiscordMessage('JSAE Announce BOT', htmlSpecialParse(processor[i].name), process.env.discord_hook, processor[i].url) === -1) {
                    console.log("Failed to send message.")
                }
            }
        }
        if (isChanged) {
            fs.writeFile('output.json', JSON.stringify(input), (err) => {
                if (err) throw err;
                console.log('The file has been saved!');
            });
        } else {
            console.log("No change is detected.")
        }
    })

}

main()
