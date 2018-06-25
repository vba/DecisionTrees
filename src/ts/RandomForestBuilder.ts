import { ITreeLeaf, ITreeNode, IHasStringKey, ITreeConfig } from "./CommonDataObjects";
import { DecisionTreeBuilder } from "./DecisionTreeBuilder";
import { Map, List } from "immutable";

type ITreeItem = ITreeLeaf | ITreeNode;
type IForest   = ITreeItem[];

export class RandomForestBuilder<T extends IHasStringKey> {
    public build(config: ITreeConfig<T>, forestSize: number = 3): IForest {
        const configMap = Map<string, any>(config);
        const items = config.trainingSet
            .reduce(this.reduceTrainingSet.bind(this, forestSize), List<T[]>())
            .map(this.mapSubTrainingSet.bind(this, configMap) as ((a: T[]) => ITreeItem))
            .toArray();
        return items;
    }

    private mapSubTrainingSet(configMap: Map<string, any>, array: T[]): ITreeItem {
        return new DecisionTreeBuilder<T>()
            .build(configMap.set("trainingSet", array).toObject() as ITreeConfig<T>);
    }

    private reduceTrainingSet(forestSize: number, agg: List<T[]>, x: T, i: number): List<T[]> {
        const index = i % forestSize;
        let list = agg;
        if (list.size < (index + 1)) {
            list = list.push([]);
        }
        return list.set(index, List<T>(list.get(index)).push(x).toArray());
    }
}
