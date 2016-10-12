"use strict";
const filessystem = require('fs');
let guid = () => 
{
	function s4()
	{
		return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
	}
	return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}

let crearDirectorio = (dir) => 
{
	if (!filessystem.existsSync(dir))
	{
		filessystem.mkdirSync(dir);
	}
};

let validateEmail = (email) =>  
{
    var re = /\S+@\S+\.\S+/;
    return re.test(email);
};

module.exports.guid = guid;
module.exports.crearDirectorio = crearDirectorio;
module.exports.validateEmail = validateEmail;