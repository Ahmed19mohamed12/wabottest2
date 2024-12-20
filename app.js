const { Client, LocalAuth ,MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require("express");
const QRCode = require('qrcode');
const fs = require('fs');
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
require('dotenv').config();
const app = express();
app.use(express.json());
const SESSION_FILE_PATH = 'session.json';
let sessionCfg;
if (fs.existsSync(SESSION_FILE_PATH)) {
    sessionCfg = require(SESSION_FILE_PATH);
}
const client = new Client({
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    },
    session: sessionCfg,
    authStrategy: new LocalAuth() // Use LocalAuth for session management
});
app.post("/send",(req,res)=>{
     const data  = req.body;
     const message = data['message'];
     const phone = data['phone'];
     const media = MessageMedia.fromFilePath('1.jpg');
     client.sendMessage(phone,media,{caption:message})
                 .then(response => {
                     console.log(`Message sent to ${phone}:`, response);
                      res.status(200).send(message + " " + phone);
                 })
                 .catch(err => {
                     console.error(`Failed to send message to ${phone}:`, err);
                 });
     
     
})
client.on('authenticated', (session) => {
    console.log('AUTHENTICATED', session);
    sessionCfg = session;
    fs.writeFile(SESSION_FILE_PATH, JSON.stringify(session), (err) => {
        if (err) {
            console.error(err);
        }
    });
});
app.get('/auth', (req,res)=>{
     client.on('qr', async (qr) => {
         qrcode.generate(qr, {small: true});
               // const url = req.query.url || 'https://example.com';
               const qrCodeImage = await QRCode.toDataURL(qr);
               res.send(`<img src="${qrCodeImage}" alt="QR Code"/>`);
               console.log(qr);
          });
     
     client.on('ready',  async () => {
         app.send('Client is ready!');
     
         // Read the list of numbers from a JSON file
         let parents = fs.readFileSync('parents.json');
         parents = JSON.parse(parents);
     
         // Loop through the numbers and send messages
         for (let i = 0; i < parents.length; i++) {
             const media = MessageMedia.fromFilePath('1.jpg');
             let number = parents[i].number + '@c.us'; // Format the number
             client.sendMessage(number,media,{caption:'أهلا وسهلا\n ♥♥ يا احمد'})
                 .then(response => {
                     console.log(`Message sent to ${number}:`, response);
                 })
                 .catch(err => {
                     console.error(`Failed to send message to ${number}:`, err);
                 });
             await delay(5000);
             
         }
     });
})
app.listen(3000, () => {
    console.log("Started on port 3000");
     client.initialize();
});
