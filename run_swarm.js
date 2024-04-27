import {spawn} from 'child_process';
import {exec} from 'child_process';
import { parse } from 'path';
import {promisify} from 'util';
import os from 'os';
import fs from 'fs';
import path from 'path';

const execPromise = promisify(exec);

export async function runSwarmMaster(threads=0) {
    let processes = [];
    let process_status = [];
    let process_message = [];
    console.log("run_swarm.js: runSwarm: threads: ", threads);
    let this_dir = process.cwd().replace("/src", "")
    for (let i = 0; i < threads; i++) {
        const port_offset = 8192;
        let this_port = i + port_offset;
        const chunk = 64
        const swarmKey = "Caselaww_Access_Project_OrbitDB"
        let command = "node "+this_dir+"/src/orbitv3-master-swarm.js --ipAddress=127.0.0.1 " + "--port=" + this_port + " --swarmKey=" + swarmKey + " --chunk=" + chunk + " --index=" + i;
        console.log(command);   
        
        // processes[i] = exec(command, {shell: true, detached: true}, (error, stdout, stderr) => {
        //     if (error) {
        //         console.error(`exec error: ${error}`);
        //         process_message[i] = error;
        //         return;
        //     }
        //     if (stdout) {
        //         console.log(`stdout: ${stdout}`);
        //         process_message[i] = stdout;
        //     }
        // });

    }
    console.log('run_swarm.js: processes: ', processes);

    let all_processes_dead = false;
    while (true && all_processes_dead == false) {
        for (let i = 0; i < threads; i++) {
            await execPromise('sleep 5');
        }
        for (let i = 0; i < threads; i++) {

        }
        console.log('run_swarm.js: process_message: ', process_message);
    }
    return false;

}


export  async function runSwarmSlave(threads=0) {
    let processes = [];
    let process_status = [];
    let process_message = [];
    console.log("run_swarm.js: runSwarm: threads: ", threads);
    let this_dir = process.cwd().replace("/src", "")
    for (let i = 0; i < threads; i++) {
        const port_offset = 8192;
        let this_port = i + port_offset;
        const chunk = 64
        const swarmKey = "Caselaww_Access_Project_OrbitDB"
        let command = "node "+this_dir+"/src/orbitv3-slave-swarm.js --index " + i + "";
        console.log(command);   
        processes[i] = exec(command, {shell: true, detached: true}, (error, stdout, stderr) => {
            if (error) {
                console.error(`exec error: ${error}`);
                process_message[i] = error;
                return;
            }
            if (stdout) {
                console.log(`stdout: ${stdout}`);
                process_message[i] = stdout;
            }
        });

    }
    console.log('run_swarm.js: processes: ', processes);

    let all_processes_dead = false;
    while (all_processes_dead == false) {
        await execPromise('sleep 1');
        for (let i = 0; i < threads; i++) {

        }
        console.log('run_swarm.js: process_message: ', process_message);
    }
    return false;

}



runSwarmSlave(64);
