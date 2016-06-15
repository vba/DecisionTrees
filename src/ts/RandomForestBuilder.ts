///<reference path='./CommonDataObjects.ts'/>
///<reference path='../../node_modules/immutable/dist/immutable.d.ts'/>

import common              = require('./CommonDataObjects');
import builder             = require('./DecisionTreeBuilder');
import Immutable           = require('immutable');
import DecisionTreeBuilder = builder.DecisionTreeBuilder;

type ITreeConfig<T>         = common.Dto.ITreeConfig<T>;
type ITreeLeaf              = common.Dto.ITreeLeaf;
type ITreeNode              = common.Dto.ITreeNode;
type ITreeItem              = ITreeLeaf | ITreeNode;
type BasicTrainingItem      = {[p: string]: any};
type List<T>                = Immutable.List<T>;
type IForest                = ITreeItem[]

export class RandomForestBuilder<T extends BasicTrainingItem> {
    public build(config: ITreeConfig<T>, forestSize: number = 3): IForest {
        const configMap = Immutable.Map<string, any>(config);
        const items = config.trainingSet
            .reduce(this.reduceTrainingSet.bind(this, forestSize), Immutable.List<T[]>())
            .map(this.mapSubTrainingSet.bind(this, configMap) as ((a: T[]) => ITreeItem))
            .toArray();
        return items;
    }

    private mapSubTrainingSet(configMap: Immutable.Map<string,any>, array: T[]) : ITreeItem {
        return new DecisionTreeBuilder<T>()
            .build(configMap.set('trainingSet', array).toObject() as ITreeConfig<T>)
    }

    private reduceTrainingSet(forestSize: number, agg: List<T[]>, x: T, i: number) : List<T[]> {
        const index = i % forestSize;
        let list = agg;
        if (list.size < (index + 1)) {
            list = list.push([]);
        }
        return list.set(index,
                        Immutable.List<T>(list.get(index)).push(x).toArray());
    }
}