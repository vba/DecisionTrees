import swapi from "swapi-node";
import { range } from "lodash";
import Axios, { AxiosResponse } from "axios";
import { of } from "rxjs";
import { map, flatMap, reduce } from "rxjs/operators";

async function getTrainingSet() {
    const peopleArray = await of(...range(5, 10), 2)
        .pipe(map(x => `https://swapi.co/api/people/?format=json&page=${x}`))
        .pipe(flatMap(x => Axios.get(x).catch(console.error)))
        .pipe(map((x: AxiosResponse) => x.data))
        .pipe(reduce((acc: any[], x: any) => [x, ...acc], []))
        .toPromise();

    console.log(JSON.stringify(peopleArray, null, 2));
}

getTrainingSet();
