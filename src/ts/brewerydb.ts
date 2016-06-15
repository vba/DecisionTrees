///<reference path='../../typings/request/request.d.ts'/>

import Immutable = require('immutable');
import request   = require('request');
const key        = process.env.BREWERY_DB_KEY;
const endpoint   = 'http://api.brewerydb.com/v2/'
const page       = 4;

request([endpoint, 'styles?key=', key].join(''), (err, resp, body) => {
    console.log(resp.statusCode);
    const styles = JSON.parse(body).data.map(x => Immutable.Map({id: x.id, name: x.name}).toObject());
    const beers = [];
    for (let i = 0; i < styles.length; i++) {
        const style = styles[i];
        const url = [endpoint, 'beers?key=', key, '&styleId=', style.id, '&p=', page].join('');
        request(url, (err, resp, body) => {
            const data = JSON.parse(body).data;
            if (data == null) { return; }
            data.forEach(beer => {
                if (!beer['abv'] || !beer['ibu'] || !beer['srmId']) {
                    return;
                }
                const beer2 = {
                    id: beer.id,
                    name: beer.nameDisplay,
                    glassId: beer.glasswareId || "0",
                    availableId: beer.availableId || "0",
                    style: style.name,
                    isOrganic: [beer.isOrganic].join('').toLowerCase() === 'y',
                    abv: beer.abv,
                    ibu: beer.ibu,
                    srmId: beer.srmId,
                    ibuMin: beer.ibuMin || "-1",
                    ibuMax: beer.ibuMax || "-1",
                    abvMin: beer.abvMin || "-1",
                    abvMax: beer.abvMax || "-1",
                    srmMin: beer.srmMin || "-1",
                    srmMax: beer.srmMax || "-1",
                    ogMin: beer.ogMin || "-1",
                    fgMin: beer.fgMin || "-1",
                    fgMax: beer.fgMax || "-1"
                };
                console.log(JSON.stringify(beer2, null, 2));
            });
        })
    }
});