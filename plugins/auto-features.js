const fs = require('fs');
const path = require('path');
const config = require('../config')
const {cmd , commands} = require('../command')


//auto recording
cmd({
  on: "body"
},    
async (conn, mek, m, { from, body, isOwner }) => {       
 if (config.AUTO_RECORDING === 'true') {
                await conn.sendPresenceUpdate('recording', from);
            }
         } 
   );

//auto_voice
cmd({
  on: "body"
},    
async (conn, mek, m, { from, body, isOwner }) => {
    const filePath = path.join(__dirname, '../data/autovoice.json');
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    for (const text in data) {
        if (body.toLowerCase() === text.toLowerCase()) {
            
            if (config.AUTO_VOICE === 'true') {
                //if (isOwner) return;        
                await conn.sendPresenceUpdate('recording', from);
                await conn.sendMessage(from, { audio: { url: data[text] }, mimetype: 'audio/mpeg', ptt: true }, { quoted: mek });
            }
        }
    }                
});

//auto sticker 
cmd({
  on: "body"
},    
async (conn, mek, m, { from, body, isOwner }) => {
    const filePath = path.join(__dirname, '../data/autosticker.json');
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    for (const text in data) {
        if (body.toLowerCase() === text.toLowerCase()) {
            
            if (config.AUTO_STICKER === 'true') {
                //if (isOwner) return;        
                await conn.sendMessage(from,{sticker: { url : data[text]},package: 'KHAN-MD'},{ quoted: mek })   
            
            }
        }
    }                
});

// Composing (Auto Typing)
cmd({
    on: "body"
},    
async (conn, mek, m, { from, body, isOwner }) => {
    if (config.AUTO_TYPING === 'true') {
        await conn.sendPresenceUpdate('composing', from); // send typing 
    }
});
