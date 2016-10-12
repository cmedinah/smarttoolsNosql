"use strict";
const db   	        = require('./modules/database'),
      fs            = require('fs'), 
      ffmpeg        = require('fluent-ffmpeg'), 
      moment        = require('moment'),  
      procesados    = [];
//Para conectar a la base de datos de Mongo...
console.time('test');
db.conectaMongo((err, database) => 
{
    if (err) console.warn("Error total Vídeos", err.message);
    processConvertVideo(database);
});
//Para el proceso de conversión de vídeos...
let processConvertVideo = (database) => 
{
    //Para traer los vídeos que no se han ejecutado...
    let query = {estado_video : 1, error_conversion : 0}, 
        options = {token_video : true, identificacion : true, token_archivo : true, extension : true, token_concurso : true, _id : false};
    db.coleccion("video")
    .find(query, options)
    .sort({fecha_publica_timestamp : 1})
    .limit(3)
    .toArray(function(err, data)
    {
        if (err) console.warn("Error total Vídeos", err.message);
        //console.log(data);
        //Si tiene vídeos por procesar...
        if(data.length !== 0)
        {
            console.log(`Video 0 de ${data.length}`);
            for(let i = 0; i < data.length; i++)
            {
                procesados.push({
                                    token : data[i].token_archivo, 
                                    terminado : false
                });
                //Verificar si el archivo existe...
                let baseUbicaVideo = `${__dirname}/uploadedfiles/${data[i].identificacion}/videos`, 
                    videoOriginal  = `${baseUbicaVideo}/org/${data[i].token_archivo}.${data[i].extension}`;
                fs.exists(videoOriginal, function(exists)
                {
                    if(exists)
                    {
                        actualizaEstadoVideo(
                        {
                            video           : data[i], 
                            estado          : 2, 
                            errorConvierte  : 0
                        },
                        (err, video) => 
                        {
                            convierteVideo(video, (err, video, duration) => 
                            {
                                actualizaEstadoVideo(
                                {
                                    video           : video, 
                                    estado          : 3, 
                                    errorConvierte  : err ? 1 : 0, 
                                    duration        : duration
                                },
                                (err, video) => 
                                {
                                    terminaDeProcesarVideos(video.token_archivo, database);
                                });
                            });
                        });
                    }
                    else
                    {
                        actualizaEstadoVideo(
                        {
                            video           : data[i], 
                            estado          : 3, 
                            errorConvierte  : 1
                        },
                        (err, video) => 
                        {
                            terminaDeProcesarVideos(video.token_archivo, database);
                        });
                    }
                });
            }
        }
        else
        {
            //Cerrar la conexión a la base de datos...
            database.close();
        }
	});
};

//Para terminar el proceso de conversión...
let terminaDeProcesarVideos = (token_archivo, database) => 
{
    let total = 0;
    for(let contador = 1; contador <= 2; contador++)
    {
        for(let i = 0; i < procesados.length; i++)
        {
            if(contador === 1)
            {
                if(procesados[i].token === token_archivo)
                {
                    procesados[i].terminado = true;
                    break; 
                }
            }
            else
            {
                if(procesados[i].terminado)
                {
                    total++;
                }
            }
        }
    }
    console.log(`Video ${total} de ${procesados.length}`);
    if(total === procesados.length)
    {
        console.timeEnd('test');
        database.close();
    }
};

//Para actualizar el estado del vídeo...
let actualizaEstadoVideo = (opc, callback) => 
{
    let sqlAdciona      = "", 
        estados         = ["En cola", "En Proceso", "Procesado"], 
        setActualiza    = {estado_video : opc.estado, nombre_estado_video : estados[opc.estado - 1]};
    //3 indica que lo terminó de procesar...
    if(opc.estado === 3)
    {
        let segundos = 0;
        if(opc.errorConvierte === 0)
        {
            let parteDuracion = opc.duration.split(":");
            for(let i = 0, exp = 2; i < parteDuracion.length; i++, exp--)
            {
                segundos += Math.round(Math.pow(60, exp) * Number(parteDuracion[i]));
            }
        }
        setActualiza.duracion = segundos;
        setActualiza.duracion_string = opc.duration;
        //Para agregar las fechas de conversión...
        let fecha  = {
                        fecha_convierte   : moment().format(),
                        fecha_convierte_string : moment().format("DD/MM/YYYY"),
                        fecha_convierte_timestamp   : moment().unix()
                    };
        for(let obj in fecha)
        {
            setActualiza[obj] = fecha[obj];
        }
    }
    //Para actualizat el estado del vídeo en la colección...
    db.coleccion("video").update(
    {
        token_video : opc.video.token_video
    }, 
    {
        $set    :  setActualiza
    }, 
    (err, doc) => 
    {
        callback(true, opc.video);
    });
};

let convierteVideo = (datosVideo, callback) => 
{
    let baseUbicaVideo = `${__dirname}/uploadedfiles/${datosVideo.identificacion}/videos`, 
        videoOriginal  = `${baseUbicaVideo}/org/${datosVideo.token_archivo}.${datosVideo.extension}`, 
        duration       = 0;
    let command = new ffmpeg({ source: videoOriginal, nolog: true })
                  .setFfmpegPath("/usr/local/bin/ffmpeg/ffmpeg")
                  .screenshots({
                                    filename: `${datosVideo.token_archivo}.png`,
                                    count: 1,
                                    folder: `${baseUbicaVideo}/thumbnail`
                 });
        command.clone()
                        .save(`${baseUbicaVideo}/convert/${datosVideo.token_archivo}.mp4`)
                        .on('end', function()
                        {
                            callback(false, datosVideo, duration);
                        })
                        .on('error', function(err)
                        {
                            callback(true, datosVideo, duration);
                        })
                        .on('codecData', function(data)
                        {
                            duration = data.duration;
                        });
};