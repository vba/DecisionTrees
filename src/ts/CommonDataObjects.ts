
type Predicate = (a: any, pivot: any) => boolean;

export interface IEvaluationResult<T> {
    matched: T[];
    unmatched: T[];
}

export interface IHasStringKey {
    [p: string]: any;
}

export interface ISplit<T> {
    key: string;
    predicate: Predicate;
    predicateName: string;
    pivot: any;
    matched: T[];
    unmatched: T[];
    gain: number;
}

export interface ITreeNode {
    key: string;
    predicate: Predicate;
    predicateName: string;
    pivot: any;
    matched: ITreeNode | ITreeLeaf;
    unmatched: ITreeNode | ITreeLeaf;
}

export interface ITreeLeaf {
    category: string;
}

export interface ITreeConfig<T> {
    trainingSet: T[];
    ignoredKeys: string[];
    categoryKey: string;
    minItemsCount: number;
    entropyThreshold: number;
    maxDepth: number;
}
export interface IDecisionTreePredictor<T> {
    predict(item: { [p: string]: any }): T;
}
