/// <reference path="../../typings/mocha/mocha.d.ts"/>
/// <reference path="../../typings/chai/chai.d.ts"/>
/// <reference path="../../src/ts/RandomForestBuilder.ts" />
/// <reference path="../../node_modules/immutable/dist/immutable.d.ts"/>

import common                = require('../../src/ts/CommonDataObjects');
import Immutable             = require('immutable');
import tree                  = require('../../src/ts/DecisionTreeBuilder');
import forest                = require('../../src/ts/RandomForestBuilder');
import chai                  = require('chai');
import DecisionTreeBuilder   = tree.DecisionTreeBuilder;
import RandomForestBuilder   = forest.RandomForestBuilder
import ITreeNode             = common.Dto.ITreeNode;
import ITreeLeaf             = common.Dto.ITreeLeaf;
type BaseConfig              = {[p: string]: any}
type ITreeConfig             = common.Dto.ITreeConfig<BaseConfig>;

const config = Immutable.Map<string,any>({
    trainingSet: [],
    categoryKey: 'sex',
    ignoredKeys: ['person'],
    entropyThreshold: 0.01,
    maxDepth: 90,
    minItemsCount: 0
});

chai.should();

describe('Random forest builder with basic settings', () => {
    it('should create a random forest from ordinary configuration', () => {
        const expectedForestSize = 3;
        const trainingSet = [
            { hairLength: 0, sex: 'male' },
            { hairLength: 5, sex: 'male' },
            { hairLength: 10, sex: 'male' },
            { hairLength: 25, sex: 'female' },
            { hairLength: 27, sex: 'female' },
            { hairLength: 45, sex: 'female' },
        ];
        const conf = config
            .set('trainingSet', trainingSet).toObject() as ITreeConfig;
        const tree = new DecisionTreeBuilder().build(conf) as ITreeNode;

        const sut = new RandomForestBuilder<BaseConfig>().build(conf, expectedForestSize);

        sut.should.have.property('length', expectedForestSize);
        sut.forEach(x => {
            x.should.have.ownProperty('key', 'hairLength');
        })
    });
});