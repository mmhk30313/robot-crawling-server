//It's from (expressjs) by searching in google
const express = require('express')
const bodyParser = require('body-parser');
const port = 3001
const cors = require('cors');
// const fetch = require('node-fetch');
const cheerio = require('cheerio');
const got = require('got');
// const rp = require('request-promise');
//It's from (dotenv npm) by searching in google
require('dotenv').config();
const DB_NAME = process.env.DB_NAME;
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_USER = process.env.DB_USER;
// console.log(DB_NAME);
const ObjectId = require('mongodb').ObjectId;
const MongoClient = require('mongodb').MongoClient;
// const uri = `mongodb+srv://${DB_USER}:${DB_PASSWORD}@cluster0.dmyuc.mongodb.net/${DB_NAME}?retryWrites=true&w=majority`;
const uri = `mongodb+srv://${DB_USER}:${DB_PASSWORD}@cluster0.ykx4x.mongodb.net/${DB_NAME}?retryWrites=true&w=majority`;

//It's from (expressjs) by searching in google
const app = express();
app.use(bodyParser.json());
app.use(cors());

// console.log("Link from website");
// const url = "https://www.w3schools.com/";
async function loadData(url){
    // console.log(url)
    try{
        const response = await got(url);
        const html = response.body;
        // console.log(html);
        const $ = cheerio.load(html);
        const linkObjects = $('a');
        const links = [];
        linkObjects.each((idx, element) =>{
            links.push({
                text: $(element).text(),
                href: $(element).attr('href')
            });
        });
        // console.log(links);
        // sendingServer(links);
        return links;
    }
    catch(err){
        console.log(err);
    }
}

app.get('/', (req, res) =>{
    res.send("Hello Heroku");
});

app.get('/all-links', (req, res) => {
    const url = req.query.url;
    // console.log(url);
    const data = loadData(url);
    // console.log(data);
    data.then( links => {
        // console.log({links});
        res.send(links);
    })
})
// loadData(url);
// console.log(data);


const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
    console.log("Mongo Connected")
    const linksCollection = client.db(DB_NAME).collection("all_links");
    // perform actions on the collection object
    app.post('/', (req, res) => {
        const allLinks = req.body;
        // console.log(allLinks);
        let targetLinks = [...allLinks];
        let current = null;
        let myAllLinks = [];
        targetLinks.sort((a,b) => (a.href > b.href) ? 1 : ((b.href > a.href) ? -1 : 0))
        // console.log(allLinks);
        let cnt = 0;
        for (let i = 0; i < targetLinks.length; i++) {
            const element = targetLinks[i];
            if(element.href != current){
                current = element.href;
                if(cnt > 0){
                    const object = {...element, cnt: cnt};
                    myAllLinks.push(object);

                }else{
                    const object = {...element, cnt: 1};
                    myAllLinks.push(object);
                }
                cnt = 1;
            }
            else{
                cnt++;
            }
        }
        // console.log(myAllLinks);
        linksCollection.deleteMany({})
        .then( data => {
            linksCollection.insertMany(myAllLinks)
            .then( links => {
                // console.log(links.ops);
                res.send(links.ops);
            })
        })
        
    })

});

app.listen(process.env.PORT || port);