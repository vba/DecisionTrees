/// <reference path="../../typings/mocha/mocha.d.ts"/>
/// <reference path="../../typings/chai/chai.d.ts"/>
/// <reference path="../../src/ts/RandomForestPredictor.ts" />
/// <reference path="../../node_modules/immutable/dist/immutable.d.ts"/>

import common                = require('../../src/ts/CommonDataObjects');
import predictor             = require('../../src/ts/DecisionTreePredictor');
import forest                = require('../../src/ts/RandomForestPredictor');
import Immutable             = require('immutable');
import DecisionTreePredictor = predictor.DecisionTreePredictor;
import RandomForestPredictor = forest.RandomForestPredictor;
import chai                  = require('chai');

type ITreeLeaf                 = common.Dto.ITreeLeaf;
type ITreeNode                 = common.Dto.ITreeNode;
type ITreeItem                 = ITreeLeaf | ITreeNode;
type IForest                   = ITreeItem[]
type PredictionItem            = {[p: string]: any};
type IDecisionTreePredictor<T> = common.Dto.IDecisionTreePredictor<T>;
type GetPredictor              = (x: ITreeItem) => IDecisionTreePredictor<string>;

chai.should();


describe('Random forest predictor with basic settings', () => {
    it('should return an expected prediction range from fake tree predictor', () => {
        const predictor: IDecisionTreePredictor<string> = {predict: (x) => 'cat'};
        const forest = [{category: 'some'}, {category: 'some'}, {category: 'some'}] as IForest;
        const sut = new RandomForestPredictor(forest, (tree) => predictor);

        const actual = sut.predict({});

        actual.should.have.ownProperty('cat');
        actual['cat'].should.equal(3);
    });
});