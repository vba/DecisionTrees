import { IDecisionTreePredictor, ITreeLeaf, ITreeNode, IHasStringKey } from "./CommonDataObjects";

type ITreeItem = ITreeLeaf | ITreeNode;

export class DecisionTreePredictor
    implements IDecisionTreePredictor<string> {

    private tree: ITreeItem;

    constructor(tree: ITreeItem) {
        this.tree = tree;
    }

    public predict(item: IHasStringKey) {
        let tree = this.tree;
        while (true) {
            if (tree.hasOwnProperty("category")) {
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
