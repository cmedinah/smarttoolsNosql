"use strict";
const db   	        = require('./database'), 
      filessystem 	= require('fs'), 
	  utils			= require('./utils'), 
      moment        = require('moment'),
      striptags     = require('striptags'),
      maximoPagina  = 5;

let newVideo = (req, callback) => 
{
    let data = req.body;
    if (!req.files)
    {
        callback(true, "No existe archivos para subir");
    }
    let directorio      = `./uploadedfiles/${data.identificacion}`,
        folderVideos    = `${directorio}/videos`, 
        extensionValida = ["avi", "wmv", "flv", "mov", "mp4", "webm"], 
        videoUbicacion  = {
                                original    : `${folderVideos}/org`,
                                convertido  : `${folderVideos}/convert`,
                                thumbnail   : `${folderVideos}/thumbnail`
                            },
        sampleFile      =  req.files.sampleFile, 
        nombre_archivo  =  sampleFile.name, 
        parteNombre     =  nombre_archivo.split("."),
        extension       =  parteNombre[parteNombre.length - 1].toLowerCase(), 
        token_archivo   =  utils.guid(),
        token_video     =  utils.guid(), 
        nombreArchivo   =  `${token_archivo}.${extension}`,
        uploadPath      = `${videoUbicacion.original}/${nombreArchivo}`, 
        titulo_video    =  striptags(data.titulo_video), 
        nombre_usuario  =  striptags(data.nombre_usuario), 
        email           =  striptags(data.email);
        //Primero saber que los campos estén correctos.
        if(titulo_video === "" || nombre_usuario === "" || email === "")
        {
            callback(true, "No se han completado los campos");
        }
        else
        {
            //Saber si el email es válido...
            if(!utils.validateEmail(email))
            {
                callback(true, "El email no es válido");
            }
        }
        //Saber si el archivo que se ha subido es válido o no...
        if(sampleFile.mimetype.split("/")[0].toLowerCase() !== "video")
        {
            callback(true, "No es un archivo de vídeo");
        }
        else
        {
            //Saber si la extensión está entrega
            let extensionBien = false;
            for(let compara of extensionValida)
            {
                if(compara === extension)
                {
                    extensionBien = true;
                    break;
                }
            }
            if(!extensionBien)
            {
                callback(true, "La extensión del vídeo no es válida");
            }
        }
        //Crear el directorio principal, sí es que no existe...
        utils.crearDirectorio(directorio);
        //Crear la carpeta de vídeos...
        utils.crearDirectorio(folderVideos);
        //Para crear los demás folders que se manejarán...
        let keyUbica = Object.keys(videoUbicacion); 
        for(let i = 0; i < keyUbica.length; i++)
        {
            utils.crearDirectorio(videoUbicacion[keyUbica[i]]);
        }
        
        let fechas = {
                                    fecha_actual : moment().format(), 
                                    fecha_string : moment().format("DD/MM/YYYY"),
                                    hora_string  : moment().format("hh:mm:ss a"), 
                                    timestamp    : moment().unix()
                             } ;
        //Agregar los campos que hacen falta para guardar...
        data.token_video = token_video;
        data.estado_video = 1;
        data.nombre_estado_video = "En cola";
        data.nombre_archivo = striptags(nombre_archivo);
        data.token_archivo = token_archivo;        
        data.extension = extension;        
        data.fecha_publica = fechas.fecha_actual;
        data.fecha_publica_string = fechas.fecha_string;
        data.hora_publica = fechas.hora_string;
        data.fecha_publica_timestamp = fechas.timestamp;
        data.email_enviado = 0;
        data.error_conversion = 0;
        //Para subir el archivo...        
        sampleFile.mv(uploadPath, function(err)
        {
            if (err)
            {
                callback(true, "No ha sido posible subir el vídeo");
            }
            else
            {                
                //Guardar el registro...
                //Actualizar el valor del banner...                
                db.coleccion("video").insert(data, function(err, doc)
                {
                    if (err) console.warn("Error guardaAdmin", err.message);
                    if(doc.result.ok === 1)
                    {
                        //res.json({error : false});
                        callback(false, doc);
                    }
                });
            }
        });        
};

let totalRegistrosVideos = (token_concurso, callback) => 
{

    db.coleccion("video").find({token_concurso : token_concurso, estado_video : 3}).count((err, total) => 
    {
        if (err) console.warn("Error total Vídeos", err.message);        
        callback(err, {total, maximoPagina, numPagina : Math.ceil(total / maximoPagina)});
    });    
};

// videos por parte del administrador
let totalRegistrosVideosAdmin = (identificacion, callback) => 
{
    db.coleccion("video").find({identificacion : identificacion}).count((err, total) => 
    {
        if (err) console.warn("Error total Vídeos", err.message);        
        callback(err, {total, maximoPagina, numPagina : Math.ceil(total / maximoPagina)});
    });
    /*
    let sql = `select count(*) as numero 
               from concursos a,  
                    concursos_videos b 
               where a.idadministrador = '${id_admin}' and 
                     b.idconcurso = a.idconcurso`;
    db.queryMysql(sql, (err, data) => 
    {
        if (err) throw err;
        let total     = data[0].numero, 
            numPagina = Math.ceil(total / maximoPagina);
        callback("", {total, maximoPagina, numPagina});
    });
    */
};

//LLevar el listado de vídeos...
let listadoVideos = (req, callback) => 
{
    let numPagina   = maximoPagina * (req.params.page - 1),  
        query       = {token_concurso : req.params.token, estado_video : 3, error_conversion : 0};    
    db.coleccion("video")
    .find(query)
    .sort({fecha_publica_timestamp : -1})
    .skip(numPagina).
    limit(maximoPagina)
    .toArray(function(err, doc)
    {
		if (err) console.warn("Error listar vídeos", err.message);
		callback(err, doc);
	});
};

//LLevar el listado de todos los vídeos de los concursos de una empresa
let listadoVideosAdmin = (req, callback) => 
{    
    let numPagina       = maximoPagina * (req.params.page - 1);
    db.coleccion("video").aggregate([
    { $match : { identificacion : req.user.identificacion } }, 
    {
        $lookup :
        {
            from: "concourse", 
            localField: "token_concurso", 
            foreignField : "token_concurso", 
            as: "concurso"
        }
    }])
    .sort({fecha_publica_timestamp : -1})
    .skip(numPagina)
    .limit(maximoPagina)
    .toArray((err, doc) => 
    {
        if (err) console.warn("Error listar vídeos", err.message);
		callback(err, doc);
    });
};

//Para eliminar un video...
let eliminarvideo = (token_video, callback) => 
{
    db.coleccion("video").remove({token_video : token_video}, (err, response) => 
    {
        callback(err, response);
    });
};

let getVideo = (token_video, callback) => 
{
    db.coleccion("video").findOne({token_video : token_video}, (err, doc) => 
    {
        if (err) console.warn("Error Consulta Vídeo", err.message);
        callback(err, doc);
    });
};

module.exports.newVideo = newVideo;
module.exports.totalRegistrosVideos = totalRegistrosVideos;
module.exports.totalRegistrosVideosAdmin = totalRegistrosVideosAdmin;
module.exports.listadoVideos = listadoVideos;
module.exports.listadoVideosAdmin = listadoVideosAdmin;
module.exports.getVideo = getVideo;
module.exports.eliminarvideo = eliminarvideo;