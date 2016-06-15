///<reference path='./CommonDataObjects.ts'/>
///<reference path='../../node_modules/immutable/dist/immutable.d.ts'/>


import common    = require('./CommonDataObjects');
import Immutable = require('immutable');

type ITreeLeaf      = common.Dto.ITreeLeaf;
type ITreeNode      = common.Dto.ITreeNode;
type ITreeItem      = ITreeLeaf | ITreeNode;
type PredictionItem = {[p: string]: any};

export class DecisionTreePredictor
    implements common.Dto.IDecisionTreePredictor<string> {

    private _tree : ITreeItem;

    constructor(tree: ITreeItem) {
        this._tree = tree;
    }

    public predict(item: PredictionItem) {
        let tree = this._tree;
        while(true) {
            if (tree.hasOwnProperty('category')) {
                return (tree as ITreeLeaf).category;
            }
            const node      = tree as ITreeNode;
            const value     = item[node.key];
            const predicate = node.predicate;
            const pivot     = node.pivot;
            tree            = predicate(value, pivot) ? node.matched : node.unmatched;
        }
    }
}