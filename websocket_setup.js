const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8081 }); // WebSocket server

wss.on('connection', (ws) => {
  console.log('Client Connected');

  ws.on('message', (message)=>{
    console.log('Received Message:', message);
  });

  ws.on('close', () => {
    console.log('Client Disconnected');
  });
});


const broadcastProgress = (progress) => {
  wss.clients.forEach(client => {
    if(client.readyState === WebSocket.OPEN){
      client.send(JSON.stringify({progress}));
    }
  });
};

module.exports = {broadcastProgress};

