/// <reference path="../../typings/mocha/mocha.d.ts"/>
/// <reference path="../../typings/chai/chai.d.ts"/>
/// <reference path="../../src/ts/DecisionTreeBuilder.ts" />
/// <reference path="../../node_modules/immutable/dist/immutable.d.ts"/>

import common              = require('../../src/ts/CommonDataObjects');
import Immutable           = require('immutable');
import tree                = require('../../src/ts/DecisionTreeBuilder');
import chai                = require('chai');
import DecisionTreeBuilder = tree.DecisionTreeBuilder;
import ITreeNode           = common.Dto.ITreeNode;
import ITreeLeaf           = common.Dto.ITreeLeaf;
type BaseConfig            = {[p: string]: any}
type ITreeConfig           = common.Dto.ITreeConfig<BaseConfig>;

chai.should();

const config = Immutable.Map<string,any>({
    trainingSet: [],
    categoryKey: 'sex',
    ignoredKeys: ['person'],
    entropyThreshold: 0.01,
    maxDepth: 90,
    minItemsCount: 0
});

describe('Tree building with basic config', () => {
    const getRandomNum = (min: number, max: number) =>
        Math.random() * (max - min) + min;

    const getRandomData = (x: number) =>
        Array.apply(null, {length: x})
            .map(Number.call, Number)
            .map((i) => {
                return {
                    person: 'person_'+(i+1),
                    hairLength: Math.round(i % 4 == 0 ? getRandomNum(3, 50): getRandomNum(0, 10)),
                    sex: (i % 2 == 0 ? 'male' : 'female'),
                    weight: Math.round(i % 2 == 0 ? getRandomNum(90, 120) : getRandomNum(40, 100)),
                    age: Math.round(getRandomNum(23, 65))
                };
            });

    it('should respect max depth constraint', () => {
        const trainingSet = getRandomData(21);
        const conf = config.set('maxDepth', 1).set('trainingSet', trainingSet).toObject() as ITreeConfig;

        const tree = new DecisionTreeBuilder().build(conf) as ITreeNode;

        tree.matched.should.haveOwnProperty('category');
        tree.unmatched.should.haveOwnProperty('category');
    });

    it('should respect max entropy threshold constraint', () => {
        const trainingSet = getRandomData(21);
        const conf = config.set('entropyThreshold', 1000).set('trainingSet', trainingSet).toObject() as ITreeConfig;

        const tree = new DecisionTreeBuilder().build(conf) as ITreeNode;

        tree.should.haveOwnProperty('category');
    });

    it('should respect min items count constraint', () => {
        const trainingSet = getRandomData(21);
        const conf = config
            .set('minItemsCount', 200)
            .set('trainingSet', trainingSet).toObject() as ITreeConfig;

        const tree = new DecisionTreeBuilder().build(conf) as ITreeNode;

        tree.should.haveOwnProperty('category');
    });
});

describe('Tree building with basic data', () => {
    it('should build a trivial sex-detection tree based on hair length data', () => {
        const trainingSet = [
            { hairLength: 0, sex: 'male' },
            { hairLength: 5, sex: 'male' },
            { hairLength: 10, sex: 'male' },
            { hairLength: 25, sex: 'female' }, // split part with entropy=0 and info gain=0.69
            { hairLength: 27, sex: 'female' },
            { hairLength: 45, sex: 'female' },
        ];
        const conf = config
            .set('trainingSet', trainingSet).toObject() as ITreeConfig;

        const tree = new DecisionTreeBuilder().build(conf) as ITreeNode;

        /*  EXPECTED TREE

            hairLength >= 25
        yes /          \ no
         female        male
        */

        tree.matched.should.haveOwnProperty('category');
        tree.unmatched.should.haveOwnProperty('category');
        tree.pivot.should.equal(25);
        tree.predicateName.should.equal('>=');
        (tree.matched as ITreeLeaf).category.should.equal('female');
        (tree.unmatched as ITreeLeaf).category.should.equal('male');
    });
    it('should build a less trivial sex-detection tree based on hair length and weight', () => {
        const armyTrainingSet = [
            { hairLength: 0, sex: 'male', weight: 75},
            { hairLength: 5, sex: 'male', weight: 78}, // first split part, weight >= 78, info gain 0.29
            { hairLength: 9, sex: 'male', weight: 80},
            { hairLength: 9, sex: 'female', weight: 72}, // second split part, hairLenght >= 9, info gain 0.63
            { hairLength: 10, sex: 'female', weight: 75}
        ];
        const conf = config
            .set('trainingSet', armyTrainingSet).toObject() as ITreeConfig;

        const tree = new DecisionTreeBuilder().build(conf) as ITreeNode;


        /*          EXPECTED TREE

                    weight >= 78
                 yes /        \ no
                  male     hairLength >= 9
                         yes /    \ no
                         female   male
        */

        tree.matched.should.haveOwnProperty('category');
        tree.unmatched.should.haveOwnProperty('pivot');
        tree.pivot.should.equal(78);
        tree.predicateName.should.equal('>=');
        tree.key.should.equal('weight');
        (tree.unmatched as ITreeNode).unmatched.should.haveOwnProperty('category');
        (tree.unmatched as ITreeNode).matched.should.haveOwnProperty('category');
        (tree.unmatched as ITreeNode).key.should.equal('hairLength');
        (tree.unmatched as ITreeNode).pivot.should.equal(9);
        ((tree.unmatched as ITreeNode).unmatched as ITreeLeaf).category.should.equal('male');
        ((tree.unmatched as ITreeNode).matched as ITreeLeaf).category.should.equal('female');
    })
});