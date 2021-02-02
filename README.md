# Avalanche IPC api to websockets

## Overview 

This project basically pipes BaseTX transactions to websocket as json format, with this you can:

  * Instantly deposit to your users on backend
  * Read live transactions on your websites
  * Update balance on client-server automatically without any interaction required

### Requirements

Node.js LTS version 12.14.1 or higher to run.

### Installation

Avalanche is available for install via `npm`:

`git clone https://github.com/avax-vr/avax-ipc-websockets.git`

`cd avax-ipc-websockets`

`npm install`

if you will use as ssl enabled

`openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days 100 -nodes`


## Running

edit config.json as you wish

start the avalanchego node with ipcs enabled

`./avalanchego --ipcs-chain-ids=11111111111111111111111111111111LpoYY,2oYMBNV4eNHyqk2fjjV5nVQLDbtmNJzq5s3qs3Lo6ftnC6FByM`

wait until your node get bootstrapped 

run

`node index.js`

Note : it only supports BaseTX currently it's enough for X-Chain transactions (i guess), all prs are wellcome.


## Example usage on browser

`const ws = new WebSocket('wss://avax-ws.lirax.app:8443'); // can't promise to this server will stay online forever

ws.onopen = function(){
   console.log('Websocket started!');
}

ws.onclose = function(){
   console.log('Websocket closed');
}

ws.onerror = function(error){
   console.log('Websocket error: ' + error);
}

ws.onmessage = function(e){
   console.log(JSON.parse(e.data));
}
`
