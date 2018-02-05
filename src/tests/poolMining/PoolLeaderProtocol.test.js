
var assert = require('assert');
const BigNumber = require('bignumber.js');

import PoolLeaderProtocol from 'common/poolMining/PoolLeaderProtocol.js';
import TestsHelper from 'tests/Tests.helper';


describe('test pool leader protocol', () => {

    let miner = new PoolLeaderProtocol();

    let reward = 2500;
    let targetHash = new Buffer("FB71734148693018491DC1456858B9C6", "hex");

    let numberOfHashes = 10;
    let hashList =[];

    for (let i=0;i<numberOfHashes;i++){

        hashList[i]= {
            address:"adress"+i,
            hash:TestsHelper.makeIdHex(32),
            reward:0,
            difficulty:0
        }

    }

    it('generate hash dificulties', ()=>{

        let respose = miner.generateHashDificulties(targetHash,hashList);

        assert(respose,"Correct");

    });

    it('create reward distribution', () => {

        let leaderCommissionPercentage = 10;
        let respose = miner.rewardsDistribution(reward,leaderCommissionPercentage,hashList);

        assert(respose.poolLeaderReward === reward/leaderCommissionPercentage, "Bad Pool leader reward");

        let totalMinersReward = new BigNumber(respose.minnersReward[0].reward);

        for (let i=1; i<respose.minnersReward.length; i++){

            totalMinersReward = totalMinersReward.plus(respose.minnersReward[i].reward);

        }

        assert(totalMinersReward==reward-respose.poolLeaderReward,"Good minners reward distribution with "+totalMinersReward+ " WEBD");

    });

    it('test BudisteanuFormula', ()=>{

        let bestHash=TestsHelper.makeIdHex(32);
        let hashsNumberLastTime=250;

        let respose = miner.getMinerReward(bestHash,targetHash,reward,hashsNumberLastTime);

    });

    it('test BudisteanuFormula simulating blockchain', ()=>{

        let numberOfFindedBlocks = 5;
        let numberOfCalls = 40;

        for (let i=0; i<numberOfFindedBlocks.length; i++){

            let hashsNumberLastTime=250;

            for (let j=0; j<numberOfCalls.length;j++){

                let bestHash=TestsHelper.makeIdHex(32);

                let respose = miner.getMinerReward(bestHash,targetHash,reward,hashsNumberLastTime);

            }

            hashsNumberLastTime+=10;

        }

    });

});

