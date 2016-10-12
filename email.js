"use strict";
const nodemailer	= require('nodemailer'),
      ses           = require('nodemailer-ses-transport'),
      moment        = require('moment'),
      fs 		 	= require('fs'),
      config 	 	= JSON.parse(fs.readFileSync('config.json', 'utf8')),
	  db         	= require('./modules/database'),	    
	  procesados    = [], 
      transporter   = nodemailer.createTransport(ses({
                            accessKeyId: 'ACCES_KEY',
                            secretAccessKey: 'SECRET_KEY_ACCES'
                      }));

db.conectaMongo((err, database) => 
{
    if (err) console.warn("Error total Vídeos", err.message);
    sendEmail(database);
});

//Para traer los datos de los concursos a los cuales están relacionados los vídeos...
let traerConcursos = (datos, callback) => 
{
	let concursos = [];
	for(let i = 0; i < datos.length; i++)
	{
		let existeToken = false;
		for(let c = 0; c < concursos.length; c++)
		{
			if(concursos[c].token_concurso === datos[i].token_concurso)
			{
				existeToken = true;
				break;
			}
		}
		if(!existeToken)
		{
			//Se guarda en el Array de Tokens...
			concursos.push({token_concurso : datos[i].token_concurso});
		}
	}
	db.coleccion("concourse")
	.find({ $or: concursos }, {_id : false, nombre_concurso : true, url_concurso : true, token_concurso : true})
	.toArray((err, concurse) => 
	{
		if (err) console.warn("Error listado de concursos", err.message);
		callback(err, concurse);
	});
};

//Para realizar la acción de envío de correo...
let sendEmail = (database) => 
{
	let query 		= 	{email_enviado : 0, estado_video : 3, error_conversion : 0}, 
		options 	=  	{_id : false, token_video : true, titulo_video : true, nombre_usuario : true, email : true, token_concurso : true}; 
	//Hacer la consulta...
	db.coleccion("video")
    .find(query, options)
    .limit(1)
    .toArray((err, data) => 
    {
		//console.log(data);
		if(data.length !== 0)
		{
			traerConcursos(data, (err, concursos) => 
			{
				for(let i = 0; i < data.length; i++)
				{
					procesados.push({
										token_video : data[i].token_video, 
										terminado : false
									});
					//Para buscar el token del concurso...
					for(let c = 0; c < concursos.length; c++)
					{
						if(concursos[c].token_concurso === data[i].token_concurso)
						{
							//Se agregan los nuevos elementos...
							data[i].nombre_concurso = concursos[c].nombre_concurso;
							data[i].url_concurso = concursos[c].url_concurso;
						}
					}
					enviarEmail(data[i], (err, video) => 
					{
						actualizaEstadoEmail(video, (err, video) => 
						{
							terminaDeProcesarEmail(video.token_video, database);
						});				
					});
				}
			});
		}
		else
		{
			database.close();
		}
	});
};

//Para cambiar el estado a terminado...
let terminaDeProcesarEmail = (token_video, database) => 
{
	let total = 0;
    for(let contador = 1; contador <= 2; contador++)
    {
        for(let i = 0; i < procesados.length; i++)
        {
            if(contador === 1)
            {
                if(procesados[i].token_video === token_video)
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
    console.log(`E-mail ${total} de ${procesados.length}`);
    if(total === procesados.length)
    {
        database.close();
    }
};

//Para actualizar el estado de envío del correo...
let actualizaEstadoEmail = (video, callback) => 
{
    db.coleccion("video").update(
    {
        token_video : video.token_video
    }, 
    {
        $set    :  {
						email_enviado : 1, 
						fecha_envia_email : moment().format(), 
						fecha_envia_email_string : moment().format("DD/MM/YYYY"), 
						fecha_envia_email_timestamp : moment().unix()
					}
    }, 
    (err, doc) => 
    {
        callback(true, video);
    });
};

//Para enviar el email...
let enviarEmail = (datosEmail, callback) => 
{	
	let urls = {
					video : `${config.sitio.url}/${datosEmail.url_concurso}/${datosEmail.token_video}`, 
					concurso : `${config.sitio.url}/${datosEmail.url_concurso}`
			   };	
	let mensaje = `<!DOCTYPE html>
					<html lang='en'>
					<head>
                        <meta charset='UTF-8'>
                        <title>SmartTools</title>
                    </head>
                    <body>
                    <center>
                    	<font face='Arial, Helvetica, sans-serif'>
                        	<table border='0' cellspacing='0' cellpadding='0' width='600'>
                            <tr>
                                <td><p align='center'>&nbsp;</p></td>
                            </tr>
                            <tr>
                                <td>
                                    <p>
                                        <center>
                                            <img border='0' src='https://dl.dropboxusercontent.com/u/181689/smarttools.jpg?a=1'>
                                        </center>
                                    </p>
                                </td>
                            </tr>
                            <tr>
                                <td>
                                	<p>
                                		<center>
                                			<strong><br>
                                				<font face='Arial, Helvetica, sans-serif'>
                                					TÚ VÍDEO YA ESTÁ DISPONIBLE
                                				</font>
                                			</strong>
                                		</center>
                                	</p>
                                    <p align='justify'>
                                    	<font face='Arial, Helvetica, sans-serif'>
	                                    	Hola ${datosEmail.nombre_usuario}, 
	                                    	el presente correo tiene como fin comunicarte que ha finalizado 
	                                    	el procesamiento del vídeo 
	                                    	<b>${datosEmail.titulo_video}</b>
	                                    	, que has subido en el concurso 
	                                    	<b><a href = '${urls.concurso}'>${datosEmail.nombre_concurso}</a></b>
                                    	</font>.<br><br>
                                    </p>
                                  <center>
                                    <table border = '0' cellspacing='0' cellpadding='0'>
                                            <tr>
                                                <td align='center' style='-webkit-border-radius: 3px; -moz-border-radius: 3px; border-radius: 3px;' bgcolor='#F44336'><a href='${urls.video}' target='_blank' style='font-size: 18px; font-family: Helvetica, Arial, sans-serif; color: #ffffff; text-decoration: none; text-decoration: none; -webkit-border-radius: 3px; -moz-border-radius: 3px; border-radius: 3px; padding: 12px 18px; border: 1px solid #F44336; display: inline-block;'>VER TÚ VÍDEO AHORA &rarr;</a></td>
                                            </tr>
                                    </table>
                                    <br>
                                  </center><hr><center>No responder a este correo, ya que ha sido enviado por un proceso automático</center></p>
                                </td>
                            </tr>
                        </table></font></center></body></html>`;
	let mailOptions = {
							from: '"SmartTools" <jh.rubiano10@uniandes.edu.co>',
							to: datosEmail.email, 
							subject: `${datosEmail.titulo_video} ha sido Convertido ✔`, 
							html: mensaje
					  };
	//Enviar el e-mail...
	transporter.sendMail(mailOptions, function(error, info)
	{
    	if(error)
    	{
        	return console.log(error);
    	}
    	console.log('Message sent: ' + info.response);
    	callback(error, datosEmail);
	});
};