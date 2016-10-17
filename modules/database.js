"use strict";
const fs            = require('fs'),
      request       = require('request'),
      config 	 	= JSON.parse(fs.readFileSync('./config.json', 'utf8')), 
      MongoClient   = require("mongodb").MongoClient,
      url           = 'remote/database.json', 
      esquemas      = {
                            administrator   : "", 
                            concourse       : "", 
                            video           : ""
                      };

let conectaMongo = (callback) => 
{
    //Conectar con un archivo externo y traer la ip de la base de datos...
    request(url, (error, response, body)=>
    {
        if (!error && response.statusCode === 200)
        {
            let database = JSON.parse(body);
            console.log(database.ipdatabase);
            MongoClient.connect(`mongodb://${config.db.userPass}${database.ipdatabase}:${config.db.port}/${config.db.database}`, (err, database) => 
            {
                if(err) throw err;
                esquemas.administrator = database.collection("administrator");
                esquemas.concourse = database.collection("concourse");
                esquemas.video = database.collection("video");
                callback(err, database);
            });
        }
        else
        {
            console.log("Got an error: ", error, ", status code: ", response.statusCode)
        }
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

