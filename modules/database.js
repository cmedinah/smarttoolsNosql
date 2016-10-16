"use strict";
const fs            = require('fs'),
      config 	 	= JSON.parse(fs.readFileSync('./config.json', 'utf8')), 
      MongoClient = require("mongodb").MongoClient,
      esquemas    = {
                        administrator   : "", 
                        concourse       : "", 
                        video           : ""
                    };

let conectaMongo = (callback) => 
{
    MongoClient.connect(`mongodb://${config.db.userPass}${config.db.server}:${config.db.port}/${config.db.database}`, (err, database) => 
    {
        if(err) throw err;
        esquemas.administrator = database.collection("administrator");
        esquemas.concourse = database.collection("concourse");
        esquemas.video = database.collection("video");
        callback(err, database);
    });
};

let closeMongo = () => 
{
    MongoClient.close();
}
//Para retornar las colecciones...
let coleccion = (esquema) => esquemas[esquema];
module.exports.coleccion = coleccion;
module.exports.conectaMongo = conectaMongo;
module.exports.closeMongo = closeMongo;

