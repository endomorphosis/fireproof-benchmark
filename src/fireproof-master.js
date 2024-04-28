import { fireproof } from '@fireproof/core/node'
import { connect } from '@fireproof/ipfs'




import { WebSocketServer } from 'ws'
import { createRequire } from "module";
const require = createRequire(import.meta.url);
import fs from 'fs'
import crypto from 'crypto'

async function run(options = {}) {
	const argv = require('minimist')(process.argv.slice(2))
	let ipAddress
	let dbAddress
	let index
	let chunkSize
	let swarmName
	let port
	if (!argv.ipAddress && !Object.keys(options).includes('ipAddress')) {
			ipAddress = "127.0.0.1"
	} else if (Object.keys(options).includes('ipAddress')){
			ipAddress = options.ipAddress
	}
	else if (argv.ipAddress) {
			ipAddress = argv.ipAddress
	}
	
	if (!argv.swarmName && !options.swarmName) {
			console.error('Please provide a swarm Name');
			process.exit(1);
	}
	else if (Object.keys(options).includes('swarmName')) {
			swarmName = options.swarmName
	}
	else if (argv.swarmName) {
			swarmName = argv.swarmName
	}
	
	if (!argv.port && !Object.keys(options).includes('port')) {
			console.error('Please provide a port number');
			process.exit(1);
	}else if (Object.keys(options).includes('port')) {
			port = options.port
	}else if (argv.port) {
			port = argv.port
	}

	if (!argv.chunkSize && !Object.keys(options).includes('chunkSize')) {
			console.error('Please provide a chunk size');
			process.exit(1);
	}else if (Object.keys(options).includes('chunkSize')) {
			chunkSize = options.chunkSize
	}else if (argv.chunkSize) {
			chunkSize = argv.chunkSize
	}

	if (!argv.index && !Object.keys(options).includes('index')) {
			console.error('Please provide an index');
			process.exit(1);
	}
	else if (Object.keys(options).includes('index')) {
			index = options.index
	}
	else if (argv.index) {
			index = argv.index
	}

	process.on('SIGTERM', handleTerminationSignal);
	process.on('SIGINT', handleTerminationSignal);
	const id = index
	const db = fireproof(swarmName+"-"+index+"-of-"+chunkSize)
	const cx = connect.ipfs(db)
	cx.ready.then(() => {
		if (cx.authorized) {
			// Hide the email input field
		}
		else {
			cx.authorize(email)
		}   
	})


	let config_json
	if (fs.existsSync('config.json') === false) {
			fs.writeFileSync('config.json', JSON.stringify([]), 'utf8');
	}

	if (fs.existsSync('config.json') === true) {
		config_json = fs.readFileSync('config.json', 'utf8');
		config_json = JSON.parse(config_json);
		let config_json_length = Object.keys(config_json).length;
		while((config_json_length - 1) < parseInt(index)) {
				config_json.push({});
				config_json_length = Object.keys(config_json).length;
		}
		if (Object.keys(config_json[index]).includes("orbitdbAddress") === true) {
				config_json[index]["firebasedbAddress"] = db.address.toString();
		}
		else {
				config_json[index] = {
						index: index,
						ipAddress: ipAddress,
						port: port,
						swarmName: swarmName,
						orbitdbAddress: db.address,
						chunkSize: chunkSize
				};
		}
		fs.writeFileSync('config.json', JSON.stringify(config_json), 'utf8');
	}
	//console.info(`running with db address ${db.address}`)
	const wss = new WebSocketServer({ port: port })
	wss.on('connection', (ws) => {
		console.log('New WebSocket connection');
		ws.on('message', (message) => {
			message = JSON.parse(message.toString());
			console.log('Received message:', message);
			let method = Object.keys(message)[0];
			let data = message[method];
			// Handle WebSocket messages here
			switch (method) {
				case 'insert':
					// Handle insert logic
					let insertKey = data._id;
					let insertValue = data.content;
					console.log('Inserting data: ', insertKey, insertValue);
					validate(insertValue).then((result) => {
						if (result) {
							db.put({"_id": insertKey, "content": insertValue}).then(() => {
								console.log('Data inserted:', data);
								ws.send('Data inserted');
							}).catch((error) => {
								console.error('Error inserting data:', error);
								ws.send('Error inserting data');
							});
						}
						else{
							console.error('Data validation failed:', insertValue);
							ws.send('Data validation failed');
						}
					});
					break;
				case 'update':
					// Handle update logic
					let updateKey = data._id;
					let updateValue = data.content;
					let updatedDoc = {_id: updateKey, content: updateValue};
					let docToUpdate = db.get(updateKey).then((doc) => {
						if (!doc._id) {
							console.error('Document not found:', updateKey);
							console.log(doc)
							ws.send('Document not found');
						}
						else{
							updateKey = doc._id;
							validate(updatedDoc).then((result) => {
								db.put(updatedDoc).then(() => {
									console.log('Data updated:', data);
									ws.send('Data updates');
								}).catch((error) => {
									console.error('Error updating data:', error);
									ws.send('Error updating data');
								});
							}).catch((error) => {
								console.error('Error updating data:', error);
								ws.send('Error updating data');
							})
						}
					}).catch((error) => {
							console.error('Error updating document:', error);
							ws.send('Error updating document');
					});
					break;
				case 'select':
					// Handle select logic
					let selectID = data._id;
					let docToSelect = db.get(selectID).then((doc) => {
						console.log('Selected document:', doc);
						ws.send(JSON.stringify(doc));
					}).catch((error) => {
						console.error('Error selecting document:', error);
						ws.send('Error selecting document');
					})
					break;
				case 'delete':
					// Handle delete by ID logic
					let deleteId = data._id;
					let docToDelete = db.get(deleteId).then((doc) => {
						if(!doc._id){
							console.error('Document not found:', deleteId);
							ws.send('Document not found');
						}
						else{
							db.del(deleteId).then((deletedDoc) => {
								console.log('Document deleted:', deletedDoc);
								ws.send('Document deleted');
							}).catch((error) => {
								console.error('Error deleting document:', error);
								ws.send('Error deleting document');
							});	
						}
					}).catch((error) => {
						console.error('Error deleting document:', error);
						ws.send('Error deleting document');
					});
					break;
					default:
						console.log('Unknown message:', message);
						break;
			}
		});
	});
}

async function handleTerminationSignal() {
	console.info('received termination signal, cleaning up and exiting...');
	await db.close()
	await orbitdb.stop()
	await ipfs.stop()
	process.exit();
}

async function validate() {
	return true;
}

async function test() {
	let ipAddress = "127.0.0.1"
	let dbAddress = undefined
	let index = 1
	let chunkSize = 64  
	let swarmName    = "caselaw"
	let port = 50000

	let test = {
			ipAddress: ipAddress,
			dbAddress: dbAddress,
			index: index,
			chunkSize: chunkSize,
			swarmName: swarmName,
			port: port
	}
	return await run(test)
}

await test()
//await run()