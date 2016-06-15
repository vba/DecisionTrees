///<reference path='./CommonDataObjects.ts'/>
///<reference path='../../node_modules/immutable/dist/immutable.d.ts'/>

import common                = require('./CommonDataObjects');
import predictor             = require('./DecisionTreePredictor');
import forest                = require('./RandomForestBuilder');
import Immutable             = require('immutable');
import DecisionTreePredictor = predictor.DecisionTreePredictor;
import RandomForestBuilder   = forest.RandomForestBuilder;

type ITreeLeaf                 = common.Dto.ITreeLeaf;
type ITreeNode                 = common.Dto.ITreeNode;
type ITreeItem                 = ITreeLeaf | ITreeNode;
type IForest                   = ITreeItem[]
type PredictionItem            = {[p: string]: any};
type IDecisionTreePredictor<T> = common.Dto.IDecisionTreePredictor<T>;
type GetPredictor              = (x: ITreeItem) => IDecisionTreePredictor<string>

export class RandomForestPredictor {
    private _forest: IForest;
    private _getPredictor: GetPredictor;

    constructor(forest: IForest,
                getPredictor: GetPredictor = x => new DecisionTreePredictor(x)) {
        this._forest = forest;
        this._getPredictor = getPredictor;
    }

    public predict(item: PredictionItem): {[p: string]: number} {
        return this._forest.reduce((agg, tree) => {
            const predictor  = this._getPredictor(tree);
            const prediction = predictor.predict(item);
            return agg.set(prediction, agg.get(prediction, 0) + 1);
        }, Immutable.Map<string, number>()).toObject();
    }
}