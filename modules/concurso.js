"use strict";
const db   	        = require('./database'), 
      filessystem 	= require('fs'), 
	  utils			= require('./utils'), 
      moment        = require('moment'), 
      striptags     = require('striptags'),
      maximoPagina  = 5;

//Para saber si un enlace ya existe...
let existeEnlace = (url_concurso, token, callback) => 
{
    let query = {url_concurso : url_concurso, token_concurso : {$ne : token}};
    db.coleccion("concourse").find(query).count((err, doc) => 
    {
        if (err) console.warn("Error buscaUrl", err.message);        
        callback(err, doc === 0);
    });
};

//Para el total de registros de concursos...
let totalRegistrosConcurso = (identificacion, callback) => 
{
    db.coleccion("concourse").find({identificacion : identificacion}).count((err, total) => 
    {
        if (err) console.warn("Error totalConcursos", err.message);        
        if (err) throw err; 
        callback(err, {total, maximoPagina, numPagina : Math.ceil(total / maximoPagina)});
    });
};

//Para listar los concursos...
let listarConcursos = (identificacion, page, callback) =>
{
    let numPagina = maximoPagina * (page - 1);
    db.coleccion("concourse")
    .find({identificacion : identificacion})
    .sort({fecha_creacion_unix : -1})
    .skip(numPagina).
    limit(maximoPagina)
    .toArray(function(err, doc)
    {
		if (err) console.warn("Error buscaUsuarioSesion", err.message);
		callback(null, doc);
	});
};

/*
    El id puede ser el token del concurso o la url única del mismo...
*/
let getConcurso = (type, param, callback) => 
{
    let query = {},  
        campo = type === 1 ? "token_concurso" : "url_concurso";
    query[campo] = param;
    //console.log(query);
    db.coleccion("concourse").findOne(query, (err, doc) => 
    {
        if (err) console.warn("Error ConsultaConcurso", err.message);
        //callback(err, doc === 0);
        if(doc)
        {
            let terminado  = false, 
                timestamp  = moment().unix(), 
                enrango    = (timestamp >= doc.fecha_inicial_timestamp  && timestamp <= doc.fecha_final_timestamp);
            if(!enrango)
            {
                //Preguntar si ya se pasó el tiempo...
                terminado = timestamp > doc.fecha_final_timestamp;
            }
            callback(false, doc, {enrango, terminado});
        }
        else
        {
            callback(true);
        }
        //console.log("INGRESA ACÁ");
        //console.log(doc);
    });
};

//Parea guardar/editar los datos de un concurso...
let guardaEditaConcurso = (token_concurso, registros, callback) => 
{
    db.coleccion("concourse").findAndModify
    (
        {token_concurso : token_concurso},
        [['_id','asc']],
        {$set: registros},
        {upsert: true},
        (err, object) => 
        {
            if (err) console.warn("Error", err.message);
            //console.log(object);
            callback(null, object);
        }
    );
};

//Para crear un concurso...
let crearConcurso = (req, callback) => 
{
    let data = req.body, 
        editar = data.token_concurso === "" ? false : true,
        token_concurso = data.token_concurso === "" ? utils.guid() : data.token_concurso,  
        existeArchivo = true, 
        fecha = {
                        fecha_actual : moment().format("YYYY-MM-DD HH:MM:SS"), 
                        fecha_string : moment().format("DD/MM/YYYY"), 
                        hora_string  : moment().format("hh:mm:ss a")
                }; 
    //Sabe si existe un archivo...    
    if (!req.files)
    {        
        callback(true, "No existe archivo para subir");        
    }
    else
    {
        //Saber si llega un archivo...        
        if(editar)
        {
            if(req.files.sampleFile.name === "")
            {
                existeArchivo = false;
            }
        }
    }    
    let directorio      = `./uploadedfiles/${req.user.identificacion}`,
        banner	        = `${directorio}/banner`, 
        sampleFile      = existeArchivo ? req.files.sampleFile : "", 
        extension       = existeArchivo ? sampleFile.mimetype.split("/") : "",
        nombreBanner    = existeArchivo ? `${utils.guid()}.${extension[1]}` : "",
        uploadPath      = `${banner}/${nombreBanner}`, 
        nombre_concurso = striptags(data.nombre_concurso), 
        url_concurso    = striptags(data.url_concurso).toLowerCase(), 
        fecha_inicial   = striptags(data.fecha_inicial), 
        fecha_final     = striptags(data.fecha_final), 
        registros       = { 
                                identificacion : req.user.identificacion,
                                token_concurso,
                                nombre_concurso,
                                descripcion : data.descripcion,
                                url_concurso : url_concurso,
                                fecha_inicial : moment(fecha_inicial, "YYYY/MM/DD").format(), 
                                fecha_inicial_string : fecha_inicial,
                                fecha_inicial_timestamp : moment(fecha_inicial, "YYYY/MM/DD").unix(), 
                                fecha_final : moment(fecha_final, "YYYY/MM/DD").format(), 
                                fecha_final_string : fecha_final,  
                                fecha_final_timestamp : moment(fecha_final, "YYYY/MM/DD").unix(),
                                fecha_creacion : fecha.fecha_actual, 
                                fecha_creacion_string : fecha.fecha_string,
                                fecha_creacion_unix : moment().unix(),
                                hora_creacion_string : fecha.hora_string
                        };
        //Primero validar que los datos enviados sean válidos...
        if(!moment(fecha_inicial, "YYYY/MM/DD").isValid() || !moment(fecha_final, "YYYY/MM/DD").isValid())
        {
            callback(true, "La fechas no son válidas");
        }
        if(existeArchivo)
        {
            if(extension[0].toLowerCase() !== "image")
            {
                callback(true, "No es una imagen válida");
            }
        }
        //Para saber si el enlace dle curso ya existe...
        existeEnlace(url_concurso, token_concurso, (err, NoExiste) => 
        {
            if(NoExiste)
            {
                //Se crea los direcotrios del concurso...
                if(!editar)
                {
                    //Directorio del administrador...
                    utils.crearDirectorio(directorio);
                    //Directorio del concurso...
                    utils.crearDirectorio(banner);
                }
                if(existeArchivo)
                {
                    sampleFile.mv(uploadPath, (err) => 
                    {
                        if (err)
                        {                        
                            callback(true, "Error al subir la imagen");
                        }
                        else
                        {
                            registros.banner = nombreBanner;
                            guardaEditaConcurso(token_concurso, registros, (err, response) => 
                            {
                                callback(false, "Registro realizado");
                            });
                        }
                    });
                }
                else
                {
                    if(editar)
                    {
                        guardaEditaConcurso(token_concurso, registros, (err, response) => 
                        {
                            callback(false, "Registro realizado");
                        });
                    }
                }
            }
            else
            {
                callback(true, `La url ${url_concurso} ya está asociada a otro concurso`);
            }
        });
};

//Para eliminar un concurso...
let eliminaConcurso = (token_concurso, callback) => 
{
    db.coleccion("concourse").remove({token_concurso : token_concurso}, (err, response) => 
    {
        callback(err, response);
    });
};

module.exports.crearConcurso = crearConcurso;
module.exports.totalRegistrosConcurso = totalRegistrosConcurso;
module.exports.getConcurso = getConcurso;
module.exports.listarConcursos = listarConcursos;
module.exports.eliminaConcurso = eliminaConcurso;