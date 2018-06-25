import { ITreeLeaf, ITreeNode, IDecisionTreePredictor, IHasStringKey } from "./CommonDataObjects";
import { DecisionTreePredictor } from "./DecisionTreePredictor";
import { Map } from "immutable";

type ITreeItem    = ITreeLeaf | ITreeNode;
type IForest      = ITreeItem[];
type GetPredictor = (x: ITreeItem) => IDecisionTreePredictor<string>;

export class RandomForestPredictor {
    private forest: IForest;
    private getPredictor: GetPredictor;

    constructor(forest: IForest,
                getPredictor: GetPredictor = x => new DecisionTreePredictor(x)) {
        this.forest = forest;
        this.getPredictor = getPredictor;
    }

    public predict(item: IHasStringKey): {[p: string]: number} {
        return this.forest.reduce((agg, tree) => {
            const predictor  = this.getPredictor(tree);
            const prediction = predictor.predict(item);
            return agg.set(prediction, agg.get(prediction, 0) + 1);
        }, Map<string, number>()).toObject();
    }
}
