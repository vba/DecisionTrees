/// <reference path="../../typings/mocha/mocha.d.ts"/>
/// <reference path="../../typings/chai/chai.d.ts"/>
/// <reference path="../../src/ts/DecisionTreeBuilder.ts" />
/// <reference path="../../node_modules/immutable/dist/immutable.d.ts"/>

import common                = require('../../src/ts/CommonDataObjects');
import Immutable             = require('immutable');
import tree                  = require('../../src/ts/DecisionTreeBuilder');
import predictor             = require('../../src/ts/DecisionTreePredictor');
import chai                  = require('chai');
import DecisionTreeBuilder   = tree.DecisionTreeBuilder;
import DecisionTreePredictor = predictor.DecisionTreePredictor
import ITreeNode             = common.Dto.ITreeNode;
import ITreeLeaf             = common.Dto.ITreeLeaf;
type BaseConfig              = {[p: string]: any}
type ITreeConfig             = common.Dto.ITreeConfig<BaseConfig>;

chai.should();

const config = Immutable.Map<string,any>({
    trainingSet: [],
    categoryKey: 'sex',
    ignoredKeys: ['person'],
    entropyThreshold: 0.01,
    maxDepth: 90,
    minItemsCount: 0
});

describe("Tree predictor based on basic settings", () => {
    it('should predict sex, basing itself on hair length', () => {
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

        const sut = new DecisionTreePredictor(tree);

        sut.predict({hairLength: 12}).should.equal('male');
        sut.predict({hairLength: 1}).should.equal('male');
        sut.predict({hairLength: 9}).should.equal('male');
        sut.predict({hairLength: 25}).should.equal('female');
        sut.predict({hairLength: 120}).should.equal('female');
    });

    it('should predict sex, basing itself on hair length and weight', () => {
        const armyTrainingSet = [
            { hairLength: 0, sex: 'male', weight: 75},
            { hairLength: 5, sex: 'male', weight: 78},
            { hairLength: 9, sex: 'male', weight: 80},
            { hairLength: 9, sex: 'female', weight: 72},
            { hairLength: 10, sex: 'female', weight: 75}
        ];
        const conf = config
            .set('trainingSet', armyTrainingSet).toObject() as ITreeConfig;
        const tree = new DecisionTreeBuilder().build(conf) as ITreeNode

        const sut = new DecisionTreePredictor(tree);

        sut.predict({hairLength: 50, weight: 100}).should.equal('male'); // a fat hippie
        sut.predict({hairLength: 0, weight: 50}).should.equal('male');
        sut.predict({hairLength: 10, weight: 55}).should.equal('female');
    });
});
