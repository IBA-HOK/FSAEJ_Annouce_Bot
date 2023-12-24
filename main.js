const request = require('request');
const parse = require("node-html-parser").parse;
const fs = require('fs');
require('node-cron');
const env = require('dotenv').config();
const options = {
    url: 'https://www.jsae.or.jp/formula/',
    method: 'GET'
};
request(options, function (error, response, body) {
    let root = parse(body)
    let processor = []
    const h2 = root?.querySelectorAll(".newsList_title");
    for (let i = 0; i < h2.length; i++) {
        processor.push([h2[i].innerText.trim(), h2[i].getAttribute('href')]);
    }
    let path = "./output.json"
    let input = JSON.parse(fs.readFileSync(path, 'utf8'))
    //inputにnewsを追記
    let postData;
    for (let i = 0; i < processor.length; i++) {
        if (!input.some((element) => element[0] === processor[i][0])) {
            input.push(processor[i]);
            postData = {
                username: 'JSAE Announce BOT',
                content: `${processor[i][0]}\n${processor[i][1]}`
            }
            fetch(process.env.discord_hook, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(postData)
            })
            console.log(postData)
        }
    }
    fs.writeFile('output.json', JSON.stringify(input), (err) => {
        if (err) throw err;
        console.log('The file has been saved!');
    });
})

