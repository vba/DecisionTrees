import { ITreeConfig, ITreeNode, ITreeLeaf, ISplit, IEvaluationResult } from "./CommonDataObjects";
import { Map } from "immutable";

type ImmutableMap         = Map<string, any>;
type MapReducer<T>        = (a: ImmutableMap, b: T) => ImmutableMap;
type Predicate            = (a: any, pivot: number) => boolean;

interface IBasicTrainingItem {
    [p: string]: any;
}

interface IGroupedLabels {
    [x: string]: number;
}

enum Operation {
    EQUAL_OP = "==",
    MORE_EQUAL_OP = ">=",
}
export class DecisionTreeBuilder<T extends IBasicTrainingItem> {
    private static TRAINING_SET = "trainingSet";
    private static CATEGORY_KEY = "categoryKey";
    private static MAX_DEPTH_KEY = "maxDepth";
    private static GAIN = "gain";

    private readonly predicates: { [x: string]: Predicate } = Object.freeze({
        [Operation.EQUAL_OP]: (a, b) => a === b,
        [Operation.MORE_EQUAL_OP]: (a, b) => a >= b,
    });

    public build(config: ITreeConfig<T>): ITreeNode | ITreeLeaf {
        if (config.maxDepth === 0
            || config.trainingSet.length <= config.minItemsCount) {
            return this.buildCategory(config);
        }
        type R = MapReducer<T>;
        type C = ITreeConfig<T>;
        const initEntropy  = this.calculateEntropy(config.trainingSet, config.categoryKey);

        if (config.entropyThreshold >= initEntropy) {
            return this.buildCategory(config);
        }

        const trainingSet  = config.trainingSet.map(this.mapTrainingItem.bind(this, config));
        const configMap    = {...config, [DecisionTreeBuilder.TRAINING_SET]: trainingSet};
        const reduce       = this.reduceToBestInfoGain.bind(this, initEntropy, configMap, []) as R;
        const bestSplit = trainingSet.reduce(reduce, {gain: 0}) as ISplit<T>;

        if (bestSplit.gain <= 0) {
            return this.buildCategory(config);
        }

        const newConfigMap  = { ...configMap, [DecisionTreeBuilder.MAX_DEPTH_KEY]: config.maxDepth - 1 };
        const trueConfig    = { ...newConfigMap, [DecisionTreeBuilder.TRAINING_SET]: bestSplit.true } as C;
        const trueSubTree   = this.build(trueConfig);
        const falseConfig   = { ...newConfigMap, [DecisionTreeBuilder.TRAINING_SET]: bestSplit.false } as C;
        const falseSubTree  = this.build(falseConfig);

        const result: ITreeNode = {
            key:            bestSplit.key,
            predicate:      bestSplit.predicate,
            predicateName:  bestSplit.predicateName,
            pivot:          bestSplit.pivot,
            true:           trueSubTree,
            false:          falseSubTree,
        };
        return result;
    }

    private reduceToBestInfoGain(initialEntropy: number,
                                 configMap: any,
                                 checkedItems: string[],
                                 prev: any,
                                 item: T): any {

        type M = (a: any, b: string) => any;
        const mapEvaluation: M = this.mapTrainingDataToInfoGain.bind(this, initialEntropy, configMap, checkedItems);
        const current = Map<string, any>(item)
            .filter((v, k) => k !== configMap[DecisionTreeBuilder.CATEGORY_KEY])
            .map(mapEvaluation)
            .maxBy(x => x[DecisionTreeBuilder.GAIN]);

        const result = (current[DecisionTreeBuilder.GAIN] > prev[DecisionTreeBuilder.GAIN])
            ? current
            : prev;

        return result;
    }

    private mapTrainingDataToInfoGain(initialEntropy: number,
                                      configMap: any,
                                      checkedItems: string[],
                                      value: any,
                                      key: string): any {

            const pivot = /^[+-]?\d+(\.\d+)?$/.test(value) ? parseFloat(value) : value;
            const predicateName = this.isNumber(pivot) ? Operation.MORE_EQUAL_OP : Operation.EQUAL_OP;

            const keyPivot = [key, predicateName, pivot].join("");

            if (checkedItems.indexOf(keyPivot) !== -1) {
                return {gain: -1};
            }
            checkedItems.push(keyPivot);

            const predicate = this.predicates[predicateName];
            const split     = this.split(key, predicate, pivot, configMap[DecisionTreeBuilder.TRAINING_SET]);
            const gain      = this.calculateInfoGain(initialEntropy, configMap, split);

            return {gain, predicateName, predicate, key, pivot, true: split.true, false: split.false};
        }

    private calculateInfoGain(initialEntropy: number,
                              configMap: any,
                              split: IEvaluationResult<T>) {
        const me      = this.calculateEntropy(split.true, configMap[DecisionTreeBuilder.CATEGORY_KEY]);
        const ue      = this.calculateEntropy(split.false, configMap[DecisionTreeBuilder.CATEGORY_KEY]);
        const entropy = ((me * split.true.length) + (ue * split.false.length));
        const gain    = initialEntropy - (entropy / configMap[DecisionTreeBuilder.TRAINING_SET].length);
        return gain;
    }

    private mapTrainingItem(config: ITreeConfig<T>, item: T): IBasicTrainingItem {
        const result: IBasicTrainingItem = Object.create(null);
        for (const key in item) {
             if ((item.hasOwnProperty && !item.hasOwnProperty(key))
                 || config.ignoredKeys.indexOf(key) !== -1) {
                 continue;
             }
             result[key] = item[key];
        }
        return result;
    }

    private buildCategory(config: ITreeConfig<T>): ITreeLeaf {
        return {
            category: this.getMostFrequentValue(config.trainingSet,
                                                config.categoryKey),
        };
    }

    private getMostFrequentValue(items: T[], attr: string): string {
        const grouped = this.groupValues(items, attr);
        const tuple = Object.keys(grouped)
            .reduce((acc: [string, number], x: string) =>
                (grouped[acc[0]] || 0) > grouped[x] ? acc : [x, grouped[x]],
                ["", 0]) as [string, number];

        return tuple[0];
    }

    private groupValues(items: T[], attr: string): IGroupedLabels {
            return items.reduce((acc: IGroupedLabels, x: T) => ({
                ...acc,
                [x[attr]]: acc.hasOwnProperty(x[attr]) ? acc[x[attr]] + 1 : 1,
            }), {});
    }

    private calculateEntropy(items: T[], attr: string) {
        const groupedValues = this.groupValues(items, attr);
        const result = Object
            .keys(groupedValues)
            .map(key => groupedValues[key] / items.length)
            .reduce((agg: number, x: number) => agg + (-x * Math.log(x)), 0);
        return result;
    }

    private split(label: string,
                  predicate: Predicate,
                  pivot: number,
                  items: T[]): IEvaluationResult<T> {
        const seed = {true: [], false: []};
        const reduce = (acc: IEvaluationResult<T>, x: T) => {
            const key = (!predicate(x[label], pivot) ? "false" : "true");
            return { ...acc, [key]: [...acc[key], x] };
        };
        return items.reduce(reduce, seed);
    }

    private isNumber(n: any) {
        return (Number(n) === n && n % 1 === 0) || (Number(n) === n && n % 1 !== 0);
    }
}
