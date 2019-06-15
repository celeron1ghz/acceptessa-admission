const fs = require('fs');
const path = require('path');

const mosca = require('mosca');
const https = require('https');
const mqtt = new mosca.Server();

const certdir = path.join(__dirname, '..', '.cert');
const server = https.createServer({
  key:  fs.readFileSync(path.join(certdir, 'key.pem')),
  cert: fs.readFileSync(path.join(certdir, 'cert.pem')),
});

mqtt.attachHttpServer(server);
server.listen(8883);

mqtt.on('ready', () => {
  console.log('server started');
});

mqtt.on('clientConnected', client => {
  console.log('client connected: ', client.id);
});

mqtt.on('clientDisconnected', client => {
  console.log('client disconnected:', client.id);
});

mqtt.on('subscribed', (topic, client) => {
  console.log('subscribed:', client.id, topic);
});

mqtt.on('unsubscribed', (topic, client) => {
  console.log('unsubscribed:', client.id);
});

mqtt.on('published', (packet) => {
  console.log('published:', JSON.stringify(packet));
});
