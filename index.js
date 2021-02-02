const config = require('./config.json');
const bech32 = require('bech32');
const Big = require('big.js');
const WebSocket = require('ws');
const fs = require('fs');
const crypto = require('crypto');
const https = config.ssl_enabled?require('https'):null;
const { Avalanche, BinTools, Buffer, BN, utils, avm } = require("avalanche");
const AvaxUtils = utils.Serialization.getInstance();
const bintools = BinTools.getInstance();
const client = require('net').connect({ path: config.sockfile });


const server = config.ssl_enabled ? https.createServer({
  cert: fs.readFileSync(config.ssl_keys.cert),
  key: fs.readFileSync(config.ssl_keys.key)
}) : null;

wss = config.ssl_enabled ? new WebSocket.Server({ server }) : new WebSocket.Server({ port: config.websocket_listen_port });

wss.broadcast = (msg) => {
   wss.clients.forEach(function each(client) {
       client.send(msg);
    });
}


const asset_name = (asset) => {
  if (Object.keys(config.known_assets).includes(asset)) {
    return config.known_assets[asset].name;
  }
  return asset;
}

const amount_to_readable_format = (num, asset) => {
	if (Object.keys(config.known_assets).includes(asset)) {
		return Big(new BN(num, 16).toString()).div(Big(10).pow(config.known_assets[asset].denomination)).toLocaleString(config.known_assets[asset].denomination);
	}
  return Big(new BN(num, 16).toString()).div(Big(10).pow(config.default_denomination)).toLocaleString(config.default_denomination);
}

const blockchain_alias = (blockchain_id) => {
	if (Object.keys(config.blockchains).includes(blockchain_id)) {
	return config.blockchains[blockchain_id]["alias"];
	}
  return blockchain_id;
}

const transaction_to_json = (data, output_txid) => {
	outputs=[];
	
	
	data.unsignedTx.transaction.outs.forEach((d) => {
	
        d.output.addresses.forEach((out) => {
		  outputs.push({
			  "readable_amount" : amount_to_readable_format(d.output.amount,asset_name(AvaxUtils.decoder(d.assetID, "hex", "cb58", "cb58"))),
			  "output_address" : blockchain_alias(AvaxUtils.decoder(data.unsignedTx.transaction.blockchainid, "hex", "cb58", "cb58")) + '-' + bech32.encode(config.hrp, bech32.toWords(bintools.cb58Decode(AvaxUtils.decoder(out.bytes, "hex", "cb58", "cb58")))),
			  "assetID" : asset_name(AvaxUtils.decoder(d.assetID, "hex", "cb58", "cb58")),
			  "amount" : d.output.amount
		  });
        });
      });
	  
	return {
		"input_transaction_ids":[...new Set( data.unsignedTx.transaction.ins.map((d) => AvaxUtils.decoder(d.txid,"hex","cb58","cb58")))],
		"transaction_id": output_txid,
		"outputs":outputs,
		"blockchain_id":AvaxUtils.decoder(data.unsignedTx.transaction.blockchainid, "hex", "cb58", "cb58")
	}
}



client
  .on('connect', () => {
	  ('client connected');
  })
  .on('data', (data) => {
	  try {
		  if(data.length>10)
		  {
			output_txid = bintools.cb58Encode(crypto.createHash("sha256").update(data).digest());
			aTx = new avm.Tx();
			try { aTx.fromBuffer(data); } catch(e) {
			output_txid = bintools.cb58Encode(crypto.createHash("sha256").update(data.slice(8)).digest());
			aTx.fromBuffer(data.slice(8)); 
			}
			tx = aTx.serialize();
			if (tx.unsignedTx.transaction._typeName == 'BaseTx') {		
			wss.broadcast(JSON.stringify(transaction_to_json(tx,output_txid)));
			}
			delete atx,tx,output_txid,aTx;
		  }
	  } catch(e){
		  console.log(["bad tx",e,data.toString('hex')]);
	  }
  })
  .on('error', (err) => { console.log(err); })
  .on('end', () => { ('client disconnected'); });
  
config.ssl_enabled && server.listen(config.websocket_listen_port);