$(function()
{
    //console.log("Carga");
    var numeroPagina    = 0,  
        totalPagina     = 0, 
        privado         = new factoria(), 
        token_concurso  = privado.getData("token_concurso"),  
        url_concurso    = privado.getData("url_concurso"),
        en_rango        = privado.getData("rango"),
        terminado       = privado.getData("terminado"),
        cloudfront      = privado.getData("cloudfront"),
        fecha_inicial     = privado.getData("fecha_inicial"),
        nomServicios    = {
                                numvideos : {metodo : "GET"},
                                getvideos : {metodo : "GET"}
                          };
    if(!en_rango && !terminado)
    {
        $('#countdown').countdown(
        {
            date: fecha_inicial,
            format: 'on'
        },
        function()
        {
            location.reload();
        });
    }
    var consumeServicios = function(opciones, callback)
	{
        //debugger;
		var servicio = {
							url 	: opciones.servicio,
							metodo	: nomServicios[opciones.servicio].metodo,
							datos 	: ""
						};
		if(opciones.data)
        {
            if(servicio.metodo === "GET")
            {
                servicio.url += "/" + token_concurso + "/" + opciones.data;
            }
            else
            {
                servicio.datos = JSON.stringify(opciones.data);   
            }
        }
        console.log(servicio.url);
		//Invocar el servicio...
		$.ajax(
		{
			url 		: servicio.url,
			type 		: servicio.metodo,
			data 		: servicio.datos,
			dataType 	: "json",
			contentType: "application/json; charset=utf-8"
		}).done(function(data)
		{
            callback(data);
		}).error(function(request, status, error)
        {
            sweetAlert("Error", request.responseText, "error");
		});
	};

    var muestraListadoConcursos = function(data)
    {
        console.log(data);
        var table = "<table class = 'table table-striped'><tbody>";
        for(var i = 0; i < data.length; i++)
        {
            var urlVideo = "/" + url_concurso + "/" + data[i].token_video;
            var txt = "<span style = 'font-size: 1.4em;'><a href = '"+(urlVideo)+"' style = 'color: #2196f3;'>" + data[i].titulo_video + 
                      "</a></span><br><span style = 'font-size: 0.7em;'>Por: " + 
                      data[i].nombre_usuario + " (<a href = 'mailto:"+(data[i].email)+"' style = 'color: #2196f3;'>"+(data[i].email)+"</a>)<br>" + 
                      "Agregado el día: " + (data[i].fecha_publica_string)+" - "+(data[i].hora_publica) + "<br>" + 
                      "Duración: " + (data[i].duracion_string) + "</span>";
            //<img src="cinqueterre.jpg" class="img-thumbnail" alt="Cinque Terre" width="304" height="236">
            table += "<tr><td width = '20%'><center>" + 
                     "<a href = '"+(urlVideo)+"'><img src = '"+(cloudfront)+"/"+(data[i].identificacion)+"/videos/thumbnail/"+(data[i].token_archivo)+".png' class = 'img-thumbnail' width = '100' height = '100' border = '0'></a>" + 
                     "<center></td>" + 
                     "<td>" + (txt) + "</td></tr>";
            /*
            table += "<tr>" + 
                     "<td>"+(data[i].titulo_video)+"</td>" + 
                     "<td><span class = 'small'>"+(data[i].fecha_publica_string)+" - "+(data[i].hora_publica)+"</span></td>" +
                     "</tr>";
            */
        }
        table += "</tbody></table>";
        $("#videos").html(table);
    };

    //Para traer los concurso...
    $("#videos").html("<div align = 'center'><img src = 'img/loader.gif' border = '0'/></div>");
    var listadoDeConcursos = function(page)
    {
        if(page > 0 && page <= totalPagina)
        {
            $("#videos").html("<div align = 'center'><img src = 'img/loader.gif' border = '0'/></div>");
            consumeServicios({servicio : "getvideos", data : page}, function(data)
            {
                muestraListadoConcursos(data);
                //Para poner la página donde debe estar...
                if(page === 1)
                {
                    $(".pagination > li:eq(0)").addClass("disabled");
                    $(".pagination > li:eq("+(totalPagina + 1)+")").removeClass("disabled");
                }
                else
                {
                    $(".pagination > li:eq(0)").removeClass("disabled");
                    if(page === totalPagina)
                    {
                        $(".pagination > li:eq("+(page + 1)+")").addClass("disabled");
                    }
                    else
                    {
                        $(".pagination > li:eq("+(totalPagina + 1)+")").removeClass("disabled");
                    }
                }
                $(".pagination > li:eq("+(page)+")").addClass("active");
                if(numeroPagina !== 0)
                {
                    $(".pagination > li:eq("+(numeroPagina)+")").removeClass("active");
                }
                numeroPagina = page;
                console.log(numeroPagina);
            });
        }
    };

    //Primero invocar el número de cursos que existen...
    var numeroConcursos = (function numeroConcursos()
    {
        numeroPagina = 0;
        if(en_rango || terminado)
        {
            consumeServicios({servicio : "numvideos", data : 1}, function(data)
            {
                console.log(data);
                totalPagina = data.numPagina;
                if(data.numPagina !== 0)
                {
                    $("#paginar").html("<nav aria-label = 'Page navigation'><ul class = 'pagination'></ul></nav>");
                    var valor = ""; 
                    for(var i = 0; i <= data.numPagina + 1; i++)
                    {
                        if(i === 0 || i === data.numPagina + 1)
                        {
                            valor = "<li class = '"+(i === 0 ? "disabled" : "")+"'>" + 
                                    "<a href = 'javascript:;' aria-label = '"+(i === 0 ? "Previous" : "Next")+"'>" + 
                                    "<span aria-hidden = 'true'>"+(i === 0 ? "&laquo;" : "&raquo;")+" </span>" + 
                                    "</a>" + 
                                    "</li>";
                        }
                        else
                        {
                            valor = "<li class = '"+(i === 1 ? "active" : "")+"'><a href = 'javascript:;'>"+(i)+"</a></li>";   
                        }
                        $(".pagination").append(valor);
                        $(".pagination > li > a:eq("+i+")").click(function(e)
                        {
                            if(!$(this).attr("aria-label"))
                            {
                                if(!$(this).parent().hasClass("active"))
                                {
                                    listadoDeConcursos(Number($(this).text()));
                                }
                            }
                            else
                            {
                                if(!$(this).parent().hasClass("disabled"))
                                {
                                    listadoDeConcursos(numeroPagina + ($(this).attr("aria-label") === "Previous" ? -1 : 1));
                                }
                            }
                        });
                    }
                    //Traer los primeros concursos...
                    listadoDeConcursos(1);
                }
                else
                {
                    $("#videos").html("<center><h3>No hay vídeos cargados en el momento</h3></center>");
                    $("#paginar").html("");
                }         
            });
        }
        return numeroConcursos;
    })();
});
  