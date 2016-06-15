///<reference path='./DecisionTreeBuilder.ts'/>
///<reference path='./DecisionTreePredictor.ts'/>
///<reference path='../../typings/node/node.d.ts'/>

import tree       = require('./DecisionTreeBuilder');
import predictor  = require('./DecisionTreePredictor');
import predictors = require('./RandomForestPredictor');
import forest     = require('./RandomForestBuilder');
import common     = require('./CommonDataObjects');
import Immutable  = require('immutable');

import DecisionTreeBuilder   = tree.DecisionTreeBuilder;
import DecisionTreePredictor = predictor.DecisionTreePredictor;
import RandomForestPredictor = predictors.RandomForestPredictor;
import RandomForestBuilder   = forest.RandomForestBuilder;

const simpsonSample = () => {
    interface ISimpsonsModel{
        person: string;
        hairLength: number;
        weight: number;
        age: number;
        sex: string;
    }

    const simpsonsTreeBuilder = new DecisionTreeBuilder<ISimpsonsModel>();

    const data: ISimpsonsModel[] =
        [{ person: 'Homer', hairLength: 0, weight: 250, age: 36, sex: 'male' },
         { person: 'Marge', hairLength: 10, weight: 150, age: 34, sex: 'female' },
         { person: 'Bart', hairLength: 2, weight: 90, age: 10, sex: 'male' },
         { person: 'Lisa', hairLength: 6, weight: 78, age: 8, sex: 'female' },
         { person: 'Maggie', hairLength: 4, weight: 20, age: 1, sex: 'female' },
         { person: 'Abe', hairLength: 1, weight: 170, age: 70, sex: 'male' },
         { person: 'Selma', hairLength: 8, weight: 160, age: 41, sex: 'female' },
         { person: 'Otto', hairLength: 10, weight: 180, age: 38, sex: 'male' },
         { person: 'Krusty', hairLength: 6, weight: 200, age: 45, sex: 'male' }];

    const config = {
        trainingSet     : data,
        categoryKey     : 'sex',
        ignoredKeys     : ['person'],
        entropyThreshold: 0.01,
        maxDepth        : 90,
        minItemsCount   : 0
    }

    const singleTree = simpsonsTreeBuilder.build(config);

    const predictor = new DecisionTreePredictor(singleTree);

    const forest = new RandomForestBuilder().build(config, 3);

    const forestPredictor = new RandomForestPredictor(forest);

    const comic = {person: 'Comic guy', hairLength: 8, weight: 290, age: 38};

    console.log(JSON.stringify(singleTree, null, 2));

    console.log('Predict with a single tree: ', predictor.predict(comic));
    //console.log('Predict with a forest: ', forestPredictor.predict(comic))
};

const starwarsGenderSample = () => {
    const trainingPersonaSet = (require('../../resources/training/starwars_p') as [])
        .map(x => Immutable.Map<string, any>(x).set('species', x['species'].length >0 ? x['species'][0] : '').toObject());

    const config = {
        trainingSet: trainingPersonaSet,
        categoryKey: 'gender',
        ignoredKeys: ['name', 'hair_color', 'skin_color', 'eye_color', 'birth_year', 'films', 'vehicles', 'starships', 'created', 'edited', 'url'],
        entropyThreshold: 0.01,
        maxDepth: 90,
        minItemsCount: 0
    }
    //console.log(JSON.stringify(trainingPersonaSet, null, 2));
    const treeBuilder = new DecisionTreeBuilder<{[x: string]: any}>();
    const tree = treeBuilder.build(config);
    const predictor = new DecisionTreePredictor(tree);

    const testSubject1 = {
        "name": "Qui-Gon Jinn",
        "height": "193",
        "mass": "89",
        "hair_color": "brown",
        "skin_color": "fair",
        "eye_color": "blue",
        "birth_year": "92BBY",
        "homeworld": "http://swapi.co/api/planets/28/",
        "species": "http://swapi.co/api/species/1/",
        "created": "2014-12-19T16:54:53.618000Z",
        "edited": "2014-12-20T21:17:50.375000Z",
        "url": "http://swapi.co/api/people/32/"
    };

    const testSubject2 = {
        "name": "Shmi Skywalker",
        "height": "163",
        "mass": "unknown",
        "hair_color": "black",
        "skin_color": "fair",
        "eye_color": "brown",
        "birth_year": "72BBY",
        "gender": "female",
        "homeworld": "http://swapi.co/api/planets/1/",
        "species":"http://swapi.co/api/species/1/",
        "vehicles": [],
        "starships": [],
        "created": "2014-12-19T17:57:41.191000Z",
        "edited": "2014-12-20T21:17:50.401000Z",
        "url": "http://swapi.co/api/people/43/"
    }

    const testSubject3 = {
        "name": "R4-P17",
        "height": "96",
        "mass": "unknown",
        "hair_color": "none",
        "skin_color": "silver, red",
        "eye_color": "red, blue",
        "birth_year": "unknown",
        "gender": "female",
        "homeworld": "http://swapi.co/api/planets/28/",
        "species": 'http://swapi.co/api/species/2/',
        "vehicles": [],
        "starships": [],
        "created": "2014-12-20T17:43:36.409000Z",
        "edited": "2014-12-20T21:17:50.478000Z",
        "url": "http://swapi.co/api/people/75/"
    };

    console.log('Qui-Gon Jinn: ', predictor.predict(testSubject1));
    console.log('Shmi Skywalker: ', predictor.predict(testSubject2));
    console.log('R4-P17: ', predictor.predict(testSubject3));
}

const beersStyleSample = () => {
    const trainingBeersSet = (require('../../resources/training/beers_training') as []);

    const config = {
        trainingSet: trainingBeersSet,
        categoryKey: 'style',
        ignoredKeys: ['name', 'id'],
        entropyThreshold: 0.01,
        maxDepth: 90,
        minItemsCount: 0
    }
    //console.log(JSON.stringify(trainingPersonaSet, null, 2));
    const treeBuilder = new DecisionTreeBuilder<{ [x: string]: any }>();
    const tree = treeBuilder.build(config);
    const predictor = new DecisionTreePredictor(tree);

    const forest = new RandomForestBuilder().build(config, 4);
    const forestPredictor = new RandomForestPredictor(forest);

    const testSubject1 = {
        "id": "09IKmh",
        "name": "Labyrinth",
        "glassId": 8,
        "availableId": 1,
        "style": "Wood- and Barrel-Aged Strong Beer",
        "isOrganic": false,
        "abv": "13.2", // Alc
        "ibu": "56",  //  International Bittering Unit - the scale used to measure hop bitterness in beer
        "srmId": 41 // Color stuff
    };

    const testSubject2 = {
        "id": "jYBtXz",
        "name": "Abbey Ale",
        "glassId": 2,
        "availableId": 1,
        "style": "Belgian-Style Dubbel",
        "isOrganic": false,
        "abv": "8.2",
        "ibu": "20",
        "srmId": 38
    }

    console.log('Labyrinth (Wood- and Barrel-Aged Strong Beer): ', forestPredictor.predict(testSubject1));
    //console.log('Abbey Ale (Belgian-Style Dubbel): ', JSON.stringify(predictor.predict(testSubject2), null, 2));
    console.log('Abbey Ale (Belgian-Style Dubbel): ', JSON.stringify(forestPredictor.predict(testSubject2), null, 2));
}

//simpsonSample();
//starwarsGenderSample();
beersStyleSample();