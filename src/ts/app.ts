import { DecisionTreeBuilder } from "./DecisionTreeBuilder";
import { DecisionTreePredictor } from "./DecisionTreePredictor";
import { RandomForestBuilder } from "./RandomForestBuilder";
import { RandomForestPredictor } from "./RandomForestPredictor";
import { flatten, values, max } from "lodash";
import { IHasStringKey } from "./CommonDataObjects";
import IrisTrainingSet from "../json/iris_training.json";
import SWTrainingSet from "../json/starwars_training.json";
import IrisTestSet from "../json/iris_test.json";

const simpsonSample = () => {
    interface ISimpsonsModel {
        person: string;
        hairLength: number;
        weight: number;
        age: number;
        sex: string;
    }

    const simpsonsTreeBuilder = new DecisionTreeBuilder<ISimpsonsModel>();

    const data: ISimpsonsModel[] =
        [{ person: "Homer", hairLength: 0, weight: 250, age: 36, sex: "male" },
         { person: "Marge", hairLength: 10, weight: 150, age: 34, sex: "female" },
         { person: "Bart", hairLength: 2, weight: 90, age: 10, sex: "male" },
         { person: "Lisa", hairLength: 6, weight: 78, age: 8, sex: "female" },
         { person: "Maggie", hairLength: 4, weight: 20, age: 1, sex: "female" },
         { person: "Abe", hairLength: 1, weight: 170, age: 70, sex: "male" },
         { person: "Selma", hairLength: 8, weight: 160, age: 41, sex: "female" },
         { person: "Otto", hairLength: 10, weight: 180, age: 38, sex: "male" },
         { person: "Krusty", hairLength: 6, weight: 200, age: 45, sex: "male" }];

    const config = {
        trainingSet     : data,
        categoryKey     : "sex",
        ignoredKeys     : ["person"],
        entropyThreshold: 0.01,
        maxDepth        : 90,
        minItemsCount   : 0,
    };

    const singleTree = simpsonsTreeBuilder.build(config);
    const predictor = new DecisionTreePredictor(singleTree);
    const comic = {person: "Comic guy", hairLength: 8, weight: 290, age: 38};

    console.log(JSON.stringify(singleTree, null, 2));
    console.log("Predict with a single tree: ", predictor.predict(comic));
};

const starwarsGenderSample = () => {

    const config = {
        trainingSet: flatten(SWTrainingSet.map(x => x.results)),
        categoryKey: "gender",
        ignoredKeys: ["name",
                      "hair_color",
                      "skin_color",
                      "eye_color",
                      "birth_year",
                      "films",
                      "vehicles",
                      "starships",
                      "created",
                      "edited",
                      "url"],
        entropyThreshold: 0.01,
        maxDepth: 90,
        minItemsCount: 0,
    };
    const treeBuilder = new DecisionTreeBuilder<IHasStringKey>();
    const tree = treeBuilder.build(config);
    const predictor = new DecisionTreePredictor(tree);

    const testSubject1 = {
        name: "Qui-Gon Jinn",
        height: "193",
        mass: "89",
        hair_color: "brown",
        skin_color: "fair",
        eye_color: "blue",
        birth_year: "92BBY",
    };

    const testSubject2 = {
        name: "Shmi Skywalker",
        height: "163",
        mass: "unknown",
        hair_color: "black",
        skin_color: "fair",
        eye_color: "brown",
        birth_year: "72BBY",
    };

    const testSubject3 =     {
        name: "R2-D2",
        height: "96",
        mass: "32",
        hair_color: "n/a",
        skin_color: "white, blue",
        eye_color: "red",
        birth_year: "33BBY",
    };

    const testSubject4 =     {
        name: "Jabba the Second",
        height: "180",
        mass: "1500",
        hair_color: "n/a",
        skin_color: "green-tan, brown",
        eye_color: "orange",
        birth_year: "33BBY",
    };

    console.log("Qui-Gon Jinn: ", predictor.predict(testSubject1));
    console.log("Shmi Skywalker: ", predictor.predict(testSubject2));
    console.log("R2-D2: ", predictor.predict(testSubject3));
    console.log("Jabba the Second: ", predictor.predict(testSubject4));
};

function irisSample() {
    const config = {
        trainingSet     : IrisTrainingSet,
        categoryKey     : "species",
        ignoredKeys     : [],
        entropyThreshold: 0.01,
        maxDepth        : 90,
        minItemsCount   : 0,
    };

    const irisRandomForest = new RandomForestBuilder<any>().build(config, 2);
    const forestPredictor = new RandomForestPredictor(irisRandomForest);
    const forestErrorsCount = IrisTestSet
        .filter(x => {
            const prediction = forestPredictor.predict({...x, species: null});
            return prediction[x.species] < max(values(prediction));
        }).length;
    console.log(`Forest errors ${forestErrorsCount} of ${IrisTestSet.length}`);
}

// simpsonSample();
// starwarsGenderSample();
irisSample();
