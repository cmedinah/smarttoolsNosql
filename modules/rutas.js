"use strict";
const db   			= 	require('./database'), 
	  bcrypt    	= 	require('bcrypt-nodejs'), 
	  passport 		= 	require('passport'), 
	  concurso		=	require('./concurso'),
	  videos		=	require('./videos');	 
	  //db.conectaDatabase();
//Vista Principal...
let index = (req, res) => 
{
	res.render("index", {
		titulo 	:  	"SmartTools"
	});
};

let admin = (req, res) => 
{
	if(!req.isAuthenticated())
    {
        res.redirect('/login');
    }
    else
    {
		res.render("admin", { 
			data	:  req.user
		});
    }
}

let adminvideos = (req, res) => 
{
	if(!req.isAuthenticated())
    {
        res.redirect('/login');
    }
    else
    {
		res.render("adminvideos", { 
			data	:  req.user
		});
    }
}

let login = (req, res) => 
{
	if(!req.isAuthenticated())
	{
		res.render("login", {
			titulo 	:  	"SmartTools"
		});
	}
	else
	{
		res.redirect('/admin');
	}
};

let register = (req, res) => 
{
	res.render("register", {
		titulo 	:  	"SmartTools"
	});
};

let registerPost = (req, res, next) => 
{
	//db.administrator.find( { $or: [ { identificacion: "11276127" }, { email: "ostricajh@gmail.com" } ] } )
	let data 	= req.body,
		admin 	= db.coleccion("administrator"), 
		query 	=  {$or : [
							{identificacion : data.identificacion}, 
							{ email: data.email } 
						] 
				};
	//Primero saber si el usuario ya existe...
	admin.find(query).count(function(err, doc)
	{
		if (err) console.warn("Error buscaUsuario", err.message);
		if(doc !== 0)
		{
			res.json({error : true, msg : "Ya existe un usuario con estos datos"});
		}
		else
		{
			//Se debe crear el nuevo usuario...
			let  date     		= new Date(), 
				 fecha 			= `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`; 
			data.password = bcrypt.hashSync(data.password);
			data.fecha 	= fecha;
			//El campo de repite password no es necesario guardarlo...
			delete data.repite_password;
			admin.insert(data, function(err, doc)
			{
				if (err) console.warn("Error guardaAdmin", err.message);

				if(doc.result.ok === 1)
				{
					res.json({error : false});
				}				
			});
		}
	});	
};

let logout = (req, res) => 
{
	if(req.isAuthenticated())
	{
		req.logout();
    }
	res.redirect('/login');
}

//Para realizar la autenticación...
let loginPost = (req, res, next) => 
{
	passport.authenticate('local', {successRedirect: '/admin', failureRedirect: '/login'},
	(err, user, info) => 
	{
		if(err)
		{
			return res.render('login', {titulo: 'SmartTools', error: err.message});
		}
		if(!user)
		{
			return res.render('login', {titulo: 'SmartTools', error: info.message, usuario : info.usuario});
		}
		return req.logIn(user, (err) => 
		{
			if(err)
			{
				return res.render('login', {titulo: 'SmartTools', error: err.message});
			}
			else
			{
				return res.redirect('/admin');
			}
		});
	})(req, res, next);
};

//Para crear un nuevo concurso...
let newConcurso = (req, res) => 
{
	if(!req.isAuthenticated())
    {
        res.redirect('/login');
    }
    else
    {
		if(req.params.id !== "0")
		{
			concurso.getConcurso(1, req.params.id, (err, concurso, rango) =>
			{
				if(!err)
				{
					res.render("newconcurso", {data	: req.user, concurso : concurso, rango : rango});
				}
				else
				{
					res.redirect('/login');
				}
			});
		}
		else
		{
			res.render("newconcurso", { 
				data		:  req.user, 
				concurso	: {}
			});
		}
    }
};

//Para crear un nuevo concurso...
let newConcursoPost = (req, res) => 
{
	if(!req.isAuthenticated())
    {
        res.json({error : true});
    }
    else
    {
		concurso.crearConcurso(req, (err, data) => 
		{
			res.json({err, data});
		});
    }
};

let numConcurso = (req, res) => 
{
	if(!req.isAuthenticated())
    {
        res.redirect('/login');
    }
	else
	{
		concurso.totalRegistrosConcurso(req.user.identificacion, (err, data) => 
		{
			res.json(data);
		});
	}
};

let listarConcursos = (req, res) => 
{
	if(!req.isAuthenticated())
    {
        res.redirect('/login');
    }
	else
	{
		concurso.listarConcursos(req.user.identificacion, req.params.page, (err, data) => 
		{
			res.json(data);
		});
	}
};

let eliminaConcurso  = (req, res) => 
{
	if(!req.isAuthenticated())
    {
        res.json({error: true, data : "No está autenticado"});
    }
	else
	{
		concurso.eliminaConcurso(req.params.token, (err, data) => 
		{
			res.json({error : err, data});
		});
	}
};

let eliminarvideo  = (req, res) => 
{
	if(!req.isAuthenticated())
    {        
        res.json({error: true, data : "No está autenticado"});
    }
	else
	{
	
		videos.eliminarvideo(req.params.token, (err, data) => 
		{
			res.json({error:false, data});
		});
	}
};

let showConcurso = (req, res) => 
{
	concurso.getConcurso(2, req.params.url, (err, concurso, rango) =>
	{
		if(!err)
		{
			res.render("concurso", {concurso : concurso, rango : rango});			
		}
		else
		{
			notFound404(req, res);
		}
	});
};

//Para crear un nuevo vídeo...
let vistaConcursoVideo = (req, res) => 
{
	let template = "";
	if(req.params.accion === "new" || req.params.accion === "rules")
	{
		template = req.params.accion === "new" ? "newvideo" : "rules";
	}
	else
	{
		template = "video";
	}
	concurso.getConcurso(2, req.params.url, (err, concurso, rango) =>
	{
		if(!err)
		{
			if(template !== "video")
			{
				res.render(template, {concurso : concurso, rango : rango});
			}
			else
			{
				//Se debe buscar los datos del vídeo...
				videos.getVideo(req.params.accion, (error, video) =>
				{
					if(video)
					{
						res.render(template, {concurso : concurso, video, rango : rango});
					}
					else
					{
						notFound404(req, res);
					}
				});
			}
		}
		else
		{
			notFound404(req, res);
		}
	});
};

let newVideoPost = (req, res) => 
{
	videos.newVideo(req, (error, data) => 
	{
		res.json({error, data});
	});
};

let numeroVideos = (req, res) => 
{
	videos.totalRegistrosVideos(req.params.token, (err, data) => 
	{
		res.json(data);
	});
};

let numeroVideosAdmin = (req, res) => 
{
	videos.totalRegistrosVideosAdmin(req.user.identificacion, (err, data) => 
	{
		res.json(data);
	});
};

let listadoVideos = (req, res) => 
{
	videos.listadoVideos(req, (err, data) => 
	{
		res.json(data);
	});
};

let listadoVideosAdmin = (req, res) => 
{
	videos.listadoVideosAdmin(req, (err, data) => 
	{
		res.json(data);
	});
};


let notFound404 = (req, res) => 
{
	res.status(404).send("Página no encontrada :( en el momento");
};

//Exportar las rutas...
module.exports.index = index;
module.exports.admin = admin;
module.exports.adminvideos = adminvideos;
module.exports.login = login;
module.exports.logout = logout;
module.exports.register = register;
module.exports.registerPost = registerPost;
module.exports.loginPost = loginPost;
//Para el concurso...
module.exports.newConcurso = newConcurso;
module.exports.newConcursoPost = newConcursoPost;
module.exports.numConcurso = numConcurso;
module.exports.listarConcursos = listarConcursos;
module.exports.eliminaConcurso = eliminaConcurso;
module.exports.showConcurso = showConcurso;
module.exports.notFound404 = notFound404;
//Para el proceso de los vídeo...
module.exports.vistaConcursoVideo = vistaConcursoVideo;
module.exports.newVideoPost = newVideoPost;
module.exports.numeroVideos = numeroVideos;
module.exports.numeroVideosAdmin = numeroVideosAdmin;
module.exports.listadoVideos = listadoVideos;
module.exports.listadoVideosAdmin = listadoVideosAdmin;
module.exports.eliminarvideo = eliminarvideo;