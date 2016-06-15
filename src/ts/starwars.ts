

const swapi = require('swapi-node');


const getTrainingSet = () => {
    swapi.get('http://swapi.co/api/people/').then(function (result) {
        console.log(JSON.stringify(result, null, 2));
        return result.nextPage();
    }).then(function (result) {
        console.log(JSON.stringify(result, null, 2));
        return result.nextPage();
    }).then(function (result) {
        console.log(JSON.stringify(result, null, 2));
    }).catch(function (err) {
        console.log(err);
    });
}

getTrainingSet();
