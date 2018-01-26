const colors = require('colors/safe');
import NodesList from 'node/lists/nodes-list'
import InterfaceBlockchainProtocol from "./../protocol/Interface-Blockchain-Protocol"
import MiniBlockchainProtocol from "common/blockchain/mini-blockchain/protocol/Mini-Blockchain-Protocol"
/**
 *
 * Agent 47   - The place I was raised, they didn't give us names. They gave us numbers. Mine was 47.
 *
 *
 * An Agent is a class that force your machine to synchronize to the network based on the protocol you use it
 */

class InterfaceBlockchainAgent{

    constructor( blockchain, blockchainProtocolClass){

        this.agentQueueProcessing = [];
        this.agentQueueCount = 0;

        this.AGENT_TIME_OUT = 10000;
        this.AGENT_QUEUE_COUNT_MAX = 2;
        this.NODES_LIST_MINIM_LENGTH = 2;

        this.blockchain = blockchain;
        if ( blockchainProtocolClass === undefined) blockchainProtocolClass = InterfaceBlockchainProtocol;

        this.protocol = new blockchainProtocolClass(this.blockchain);
        this._initializeProtocol();


    }

    _initializeProtocol(){

        this.protocol.initialize(["acceptBlockHeaders"]);
    }

    async _requestBlockchainForNewPeer(result) {

        // let's ask everybody

        clearTimeout(this.startAgentTimeOut);
        this.startAgentTimeOut = undefined;

        try {

            this.agentQueueProcessing.push(true);
            let answerBlockchain = await this.protocol.askBlockchain(result.socket);
            console.log("answerBlockchain");
            this.agentQueueProcessing.splice(this.agentQueueProcessing.length - 1);

        } catch (exception) {
            console.log(colors.red("Error asking for Blockchain"), exception);
        }

        result.socket.node.protocol.agent.startedAgentDone = true;
        this.agentQueueCount++;

        //check if start Agent is finished

        if (this.startAgentResolver !== undefined && this.agentQueueProcessing.length === 0) {

            let done = true;
            for (let i = 0; i < NodesList.nodes.length; i++)
                if (NodesList.nodes[i].socket.level <= 3 && NodesList.nodes[i].socket.node.protocol.agent.startedAgentDone === false) {

                    done = false;
                    console.log("not done", NodesList.nodes[i]);
                    break;
                }

            //in case the agent is done and at least 4 nodes were tested
            if (done === true && this.startAgentResolver !== undefined &&
                NodesList.nodes.length >= this.NODES_LIST_MINIM_LENGTH && this.agentQueueCount >= this.AGENT_QUEUE_COUNT_MAX) {

                if (this.startAgentResolver === undefined) return;

                let resolver = this.startAgentResolver;
                this.startAgentResolver = undefined;

                console.log(colors.green("Synchronization done"));

                resolver({
                    result: true,
                    message: "Start Agent worked successfully",
                });

            } else
            //it is not done, maybe timeout
                this._setStartAgentTimeOut();


        }
    }

    async _requestBlockchainForNewPeers(){

        this.agentQueueProcessing = [];
        this.agentQueueCount = 0;

        NodesList.emitter.on("nodes-list/connected", (result) => { this._requestBlockchainForNewPeer(result) } );

        NodesList.emitter.on("nodes-list/disconnected", (result) => {

        });


        for (let i=0; i<NodesList.nodes.length; i++)
            await this._requestBlockchainForNewPeer(NodesList.nodes[i]);

    }

    async initializeStartAgent(){

        this._startAgentPromise = new Promise((resolve)=>{
            this.startAgentResolver = resolve;
        });


        this._setStartAgentTimeOut();

        await this._requestBlockchainForNewPeers();

    }

    startAgent(){
        console.log(colors.yellow("startAgent was started"));

        return this._startAgentPromise;
    }

    _setStartAgentTimeOut(){

        console.log("_setStartAgentTimeOut");

        if (this.startAgentTimeOut !== undefined) return;

        this.startAgentTimeOut = setTimeout( ()=>{

            if (this.startAgentResolver === undefined) return;

            let resolver = this.startAgentResolver;
            this.startAgentResolver = undefined;

            console.log( colors.green("Synchronization done FAILED") );

            this.startAgentTimeOut = undefined;

            resolver({
                result: false,
                message: "Start Agent Timeout",
            });

        }, this.AGENT_TIME_OUT);
    }

    _setBlockchain(newBlockchain){

        this.blockchain = newBlockchain;
        this.protocol._setBlockchain(newBlockchain);
    }

}

export default InterfaceBlockchainAgent;