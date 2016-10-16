"use strict";
const express 			= 	require("express"),
	  redis   			= 	require("redis"), 
	  app				= 	express(),
	  cons 				=	require("consolidate"),
	  puerto 			= 	process.env.PORT || 3000,
	  bodyParser 		= 	require('body-parser'),
	  passport 			= 	require('passport'),
	  LocalStrategy 	= 	require('passport-local').Strategy,
	  cookieParser 		= 	require('cookie-parser'),
	  session 			= 	require('express-session'),
	  redisStore 		= 	require('connect-redis')(session),
	  bcrypt 			= 	require('bcrypt-nodejs'),
	  db   				= 	require('./modules/database'),
	  rutas				=	require('./modules/rutas'), 
	  fileUpload 		= 	require('express-fileupload'), 
      filessystem 	    =   require('fs'),
      config 	 	    =   JSON.parse(filessystem.readFileSync('config.json', 'utf8')),
	  client  			= 	redis.createClient(config.aws.elasticache.port, config.aws.elasticache.url); 
	
	//Para el manejo de autenticación...
	passport.use(new LocalStrategy((username, password, done) => 
	{
		db.coleccion("administrator").findOne({email : username}, (err, admin) => 
		{
			if (err) { return done(err); }
			if (!admin)
			{
        		return done(null, false, { message: 'Nombre de usaurio incorrecto.' });
      		}
			if(!bcrypt.compareSync(password, admin.password))
			{
				return done(null, false, { message: 'Password incorrecto' });
			}
			return done(null, admin);
		});
	}));

	passport.serializeUser(function(admin, done)
	{
	    done(null, admin.identificacion);
	});

	passport.deserializeUser(function(identificacion, done)
	{
		db.coleccion("administrator").findOne({identificacion : identificacion}, (err, admin) => 
		{
			done(null, admin);
		});
	});
	//Fin del manejo de passport
	//consolidate integra swig con express...
	app.engine("html", cons.swig); //Template engine...
	app.set("view engine", "html");
	app.set("views", __dirname + "/views");
	app.use(express.static('public'));
	app.use("/static", express.static(__dirname + "/uploadedfiles"));
	//Para indicar que se envía y recibe información por medio de Json...
	app.use(bodyParser.json());
	app.use(bodyParser.urlencoded({extended: true}));
	//Para subir archivo...
	app.use(fileUpload());

	//Para el manejo de las Cookies...
	app.use(cookieParser());
    app.use(session({
                        secret: config.secret,
                        cookie: { maxAge: 6000000 },
                        resave: true,
                        saveUninitialized: true, 
                        store: new redisStore({ client: client , ttl :  260})
                    }));
	app.use(passport.initialize());
	app.use(passport.session());
	//Rutas/Servicios REST
	app.get("/", rutas.index);
	app.get("/admin", rutas.admin);
	app.get("/adminvideos", rutas.adminvideos);
	//Para el Login...
	app.get("/login", rutas.login);
	app.get("/logout", rutas.logout);
	//Para la página de registro...
	app.get("/register", rutas.register);
	//Para regitrar un nuevo usuario...
	app.post("/register", rutas.registerPost);
	//Para la acción del login...
	app.post('/login', rutas.loginPost);
	//Para la ruta de crear un nuevo concurso...
	app.get('/newconcurso/:id', rutas.newConcurso);
	//Para crear un nuevo concurso...
	app.post('/newconcurso', rutas.newConcursoPost);
	//Para editar un concurso...
	app.put('/newconcurso', rutas.newConcursoPost);
	//Para traer la cantidad de concursos de un administrador...
	app.get('/numconcursos', rutas.numConcurso);
	//Para llevar todos los concursos...
	app.get('/listarconcursos/:page', rutas.listarConcursos);
	//Para eliminar un concurso...
	app.delete('/eliminaconcurso/:token', rutas.eliminaConcurso);
	//Para eliminar un video
	app.delete('/eliminarvideo/:token', rutas.eliminarvideo);
	//Para saber el total de vídeos que tiene un adminsitrador
	app.get('/numvideosAdmin', rutas.numeroVideosAdmin);
	app.get('/getvideosAdmin/:page', rutas.listadoVideosAdmin);
	app.get('/:url', rutas.showConcurso);
	//Para ver si se pueden recibir dos variables...
	app.get('/:url/:accion', rutas.vistaConcursoVideo);
	//Para crear/subir, ver detalle un nuevo vídeo...
	app.post('/newvideo', rutas.newVideoPost);
	//Para listar los vídeos de un concurso...
	app.get('/getvideos/:token/:page', rutas.listadoVideos);
	//Para saber el total de vídeos que existe en un concurso..
	app.get('/numvideos/:token/:page', rutas.numeroVideos);
	app.get("*", rutas.notFound404);
	//Iniciar el Servidor...
	db.conectaMongo((err, database) => 
	{
		if(err) throw err;
		let server = app.listen(puerto, (err) => 
		{
	   		if(err) throw err;
	   		let message = 'Servidor corriendo en @ http://localhost:' + server.address().port;
	   		console.log(message);	   
		});
	});