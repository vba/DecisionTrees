///<reference path='./CommonDataObjects.ts'/>
///<reference path='../../node_modules/immutable/dist/immutable.d.ts'/>

import common    = require('./CommonDataObjects');
import Immutable = require('immutable');

type ImmutableMap         = Immutable.Map<string, any>;
type MapReducer<T>        = (a: ImmutableMap, b: T) => ImmutableMap;
type ITreeLeaf            = common.Dto.ITreeLeaf;
type ITreeNode            = common.Dto.ITreeNode;
type ITreeConfig<T>       = common.Dto.ITreeConfig<T>;
type IEvaluationResult<T> = common.Dto.IEvaluationResult<T>;
type Predicate            = (a:  any, pivot: number) => boolean;
type BasicTrainingItem    = {[p: string]: any};
type Split<T>             = common.Dto.Split<T>;

export class DecisionTreeBuilder<T extends BasicTrainingItem> {
    private static TRAINING_SET = 'trainingSet';
    private static CATEGORY_KEY = 'categoryKey';
    private static MAX_DEPTH_KEY = 'maxDepth';
    private static EQUAL_OP = '==';
    private static MORE_EQUAL_OP = '>=';
    private static GAIN = 'gain';

    private _predicates: { [x: string]: Predicate } =
        Immutable.Map<string, Predicate>()
            .set(DecisionTreeBuilder.EQUAL_OP, (a, b) => a == b)
            .set(DecisionTreeBuilder.MORE_EQUAL_OP, (a, b) => a >= b)
            .toObject();

    public build(config: ITreeConfig<T>): ITreeNode | ITreeLeaf {
        if (config.maxDepth == 0
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
        const configMap    = Immutable.Map<string, any>(config).set(DecisionTreeBuilder.TRAINING_SET, trainingSet);
        const reduce:R     = this.reduceToBestInfoGain.bind(this, initEntropy, configMap, []);
        const bestSplitMap = trainingSet.reduce<ImmutableMap>(reduce, Immutable.Map({gain: 0}));
        const bestSplit    = bestSplitMap.toObject() as Split<T>;

        if (bestSplit.gain <= 0) {
            return this.buildCategory(config);
        }

        const newConfigMap     = configMap.set(DecisionTreeBuilder.MAX_DEPTH_KEY, config.maxDepth - 1);
        const matchedConfig    = newConfigMap.set(DecisionTreeBuilder.TRAINING_SET, bestSplit.matched).toObject() as C;
        const matchedSubTree   = this.build(matchedConfig);
        const unmatchedConfig  = newConfigMap.set(DecisionTreeBuilder.TRAINING_SET, bestSplit.unmatched).toObject() as C;
        const unmatchedSubTree = this.build(unmatchedConfig);

        const result: ITreeNode = {
            key:            bestSplit.key,
            predicate:      bestSplit.predicate,
            predicateName:  bestSplit.predicateName,
            pivot:          bestSplit.pivot,
            matched:        matchedSubTree,
            unmatched:      unmatchedSubTree
        };
        return result;
    }

    private reduceToBestInfoGain(initialEntropy: number,
                                 configMap     : ImmutableMap,
                                 checkedItems  : string[],
                                 prev          : ImmutableMap,
                                 item          : T): ImmutableMap {

        type M = (a: any, b: string) => ImmutableMap;
        const mapEvaluation: M = this.mapTrainingDataToInfoGain.bind(this, initialEntropy, configMap, checkedItems);
        const current = Immutable.Map<string, any>(item)
            .filter((v, k) => k != configMap.get(DecisionTreeBuilder.CATEGORY_KEY))
            .map(mapEvaluation)
            .maxBy(x => x.get(DecisionTreeBuilder.GAIN));

        const result = (current.get(DecisionTreeBuilder.GAIN) > prev.get(DecisionTreeBuilder.GAIN))
            ? current
            : prev;

        return result;
    }

    private mapTrainingDataToInfoGain(initialEntropy: number,
                                      configMap     : ImmutableMap,
                                      checkedItems  : string[],
                                      value         : any,
                                      key           : string): ImmutableMap {

            const pivot = /^[+-]?\d+(\.\d+)?$/.test(value) ? parseFloat(value) : value;
            const predicateName = this.isNumber(pivot)
                ? DecisionTreeBuilder.MORE_EQUAL_OP
                : DecisionTreeBuilder.EQUAL_OP;

            const keyPredPivot  = [key, predicateName, pivot].join('');

            if (checkedItems.indexOf(keyPredPivot) != -1) {
                return Immutable.Map({gain: -1});
            }
            checkedItems.push(keyPredPivot);

            const predicate = this._predicates[predicateName];
            const split     = this.split(key, predicate, pivot, configMap.get(DecisionTreeBuilder.TRAINING_SET));
            const gain      = this.calculateInfoGain(initialEntropy, configMap, split);

            return Immutable.Map({ gain, predicateName, predicate, key, pivot,
                                   matched: split.matched,
                                   unmatched: split.unmatched });
        }


    private calculateInfoGain(initialEntropy: number,
                              configMap     : ImmutableMap,
                              split         : IEvaluationResult<T>) {
        const me      = this.calculateEntropy(split.matched, configMap.get(DecisionTreeBuilder.CATEGORY_KEY));
        const ue      = this.calculateEntropy(split.unmatched, configMap.get(DecisionTreeBuilder.CATEGORY_KEY));
        const entropy = ((me * split.matched.length) + (ue * split.unmatched.length));
        const gain    = initialEntropy - (entropy / configMap.get(DecisionTreeBuilder.TRAINING_SET).length);
        return gain;
    }

    private mapTrainingItem(config: ITreeConfig<T>, item: T): BasicTrainingItem {
        const result: BasicTrainingItem = Object.create(null);
        for (const key in item) {
             if ((item.hasOwnProperty && !item.hasOwnProperty(key))
                 || config.ignoredKeys.indexOf(key) != -1) {
                 continue;
             }
             result[key] = item[key];
        }
        return result;
    }

    private buildCategory(config: ITreeConfig<T>): ITreeLeaf {
        return {
            category: this.getMostFrequentValue(config.trainingSet,
                                                config.categoryKey)
        }
    }

    private getMostFrequentValue(items: T[], attr: string) {
        const counter               = this.countUniqueValues(items, attr);
        let mostFrequentCount       = 0;
        let mostFrequentKey: string = null;

        for (const key in counter) {
            if (counter[key] <= mostFrequentCount) continue;
            mostFrequentCount = counter[key];
            mostFrequentKey   = key;
        }

        return mostFrequentKey;
    }

    private countUniqueValues(items: T[], attr: string)
        : {[x: string]: number} {
        const counter: {[x: string]: number} = {};

        for (let i = items.length - 1; i >= 0; i--) {
            counter[items[i][attr]] = 0;
        }
        for (let i = items.length - 1; i >= 0; i--) {
            counter[items[i][attr]] += 1;
        }

        return counter;
    }

    private calculateEntropy(items: T[], attr: string) {
        const counter = this.countUniqueValues(items, attr);
        const result = Object
            .keys(counter)
            .map(key => counter[key] / items.length)
            .reduce((agg, x) => {
                return agg + (-x * Math.log(x))
            }, 0)
        return result;
    }

    private split(key: string,
                  predicate: Predicate,
                  pivot: number,
                  items: T[]) : IEvaluationResult<T> {
        const aggregated = {matched: [], unmatched: []};
        const reduce = (aggregated: IEvaluationResult<T>, x) => {
            aggregated[(!predicate(x[key], pivot)? 'un' : '') + 'matched'].push(x);
            return aggregated;
        }
        return items.reduce(reduce, aggregated);
    }

    private isNumber(n: any) {
        return (Number(n) === n && n % 1 === 0) || (Number(n) === n && n % 1 !== 0)
    }
}

