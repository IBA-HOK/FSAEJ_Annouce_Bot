const request = require('request');
const parse = require("node-html-parser").parse;
const fs = require('fs');
require('dotenv').config();
const options = {
    url: 'https://www.jsae.or.jp/formula/',
    method: 'GET'
};

function htmlSpecialParse(text) {
    return text.split("&amp;").join("&").split("&lt;").join("<").split("&gt;").join(">").split("&quot;").join("\"").split("&#39;").join("'").split("&nbsp;").join(" ");
}

function main() {
    request(options, function (error, response, body) {
        let root = parse(body)
        let processor = []
        const TITLE = root?.querySelectorAll(".newsList_title");
        const TIME = root?.querySelectorAll(".newsList_dates");
        for (let i = 0; i < TITLE.length; i++) {
            processor.push({
                "name": TITLE[i].innerText.trim(),
                "url": TITLE[i].getAttribute('href'),
                "time": TIME[i].innerText.trim()
            });//trim()で前後の空白を削除
        }
        let path = "./output.json"
        let input;
        try {
            input = JSON.parse(fs.readFileSync(path, 'utf8'))
        } catch (e) {
            input = []
        }
        let isNew = true;
        //inputにnewsを追記
        let postData;
        for (let i = 0; i < processor.length; i++) {
            for (let j = 0; j < input.length; j++) {
                isNew = true;
                if (processor[i].name === input[j].name && processor[i].time === input[j].time) {
                    isNew = false;
                    break;
                }
            }
            if (isNew) {
                input.push(processor[i]);
                //postTest.push(processor[i]);
                postData = {
                    username: 'JSAE Announce BOT',
                    content: `${htmlSpecialParse(processor[i].name)}\n${processor[i].url}`
                }
                console.log(postData)
                fetch(process.env.discord_hook, {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(postData)
                })
            }
        }
        fs.writeFile('output.json', JSON.stringify(input), (err) => {
            if (err) throw err;
            console.log('The file has been saved!');
        });
    })
}

main()
