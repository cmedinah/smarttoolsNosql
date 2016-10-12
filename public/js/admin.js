$(function()
{
    var numeroPagina    = 0,  
        totalPagina     = 0, 
        nomServicios    = {
                                numconcursos : {metodo : "GET"},
                                listarconcursos : {metodo : "GET"}, 
                                eliminaconcurso : {metodo : "DELETE"}
                          };
    var consumeServicios = function(opciones, callback)
	{
		var servicio = {
							url 	: opciones.servicio,
							metodo	: nomServicios[opciones.servicio].metodo,
							datos 	: ""
						};
		if(opciones.data)
        {
            if(servicio.metodo === "GET" || servicio.metodo === "DELETE")
            {
                servicio.url += "/" + opciones.data;
            }
            else
            {
                servicio.datos = JSON.stringify(opciones.data);   
            }
        }
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
            //alert(request.responseText);
            //window.location = "/";
            sweetAlert("Error", request.responseText, "error");
		});
	};

    var muestraListadoConcursos = function(data)
    {
        console.log(data); 
        /*
        "<li><a href='#' type = 'list'>Listado de vídeos</a></li>" +
        "<li role='separator' class='divider'></li>" +
        "<li><a href='#' type = 'copy'>Copiar URL</a></li>" +
        */
        var opciones = "<div class='btn-group'>" + 
                       "<button type = 'button' class = 'btn btn-default dropdown-toggle' data-toggle='dropdown' aria-haspopup='true' aria-expanded='false'>" +
                       "Opciones <span class='caret'></span>" +
                       "</button>" +
                       "<ul class = 'dropdown-menu pull-right' id = 'concurso_TOKENCONCURSO'>" +
                       "<li><a href='URL_EDITAR'>Editar</a></li>" +
                       "<li><a href='javascript:;' type = 'del'>Eliminar</a></li>" +                       
                       "</ul></div>";
        var table = "<table class = 'table'>" + 
                    "<thead>" + 
                    "<tr>" +
                    "<th>Concurso</th>" +
                    "<th>Fecha Inicio</th>" +
                    "<th>Fecha Final</th>" +                    
                    "<th></th>" +
                    "</tr>" +
                    "</thead><tbody></tbody></table>";
        $("#concursos").html(table);
        for(var i = 0; i < data.length; i++)
        {
            var opcTr = opciones.replace("TOKENCONCURSO", data[i].token_concurso), 
                opcTr = opcTr.replace("URL_EDITAR", "/newconcurso/" + data[i].token_concurso);
                txtCurso = "<h5><a href = '/"+(data[i].url_concurso)+"' target = '_blank'>"+(data[i].nombre_concurso)+"</a></h5>" + 
                           "<p class = 'small'>"+(data[i].fecha_creacion_string)+" - "+(data[i].hora_creacion_string)+"</p>";
            var tr = "<tr>" + 
                     "<td>"+(txtCurso)+"</td>" + 
                     "<td>"+(data[i].fecha_inicial_string)+"</td>" +
                     "<td>"+(data[i].fecha_final_string)+"</td>" +                     
                     "<td>"+(opcTr)+"</td>" +
                     "</tr>";            
            $("#concursos tbody").append(tr);
            $("#concurso_" + data[i].token_concurso + " > li > a").click(function(event)
            {
                var token = $(this).parent().parent().attr("id").split("_")[1];
                switch($(this).attr("type"))
                {                    
                    case "del" : //Para eliminar un concurso...
                                swal({
                                        title: "¿Estás Segur@?", 
                                        text: "¿Deseas eiminar el concurso seleccionado?",
                                        type: "info", 
                                        showCancelButton: true, 
                                        confirmButtonColor: "#DD6B55", 
                                        confirmButtonText: "Si, lo deseo", 
                                        cancelButtonText: "No, cancelar", 
                                        closeOnConfirm: false, 
                                        closeOnCancel: false, 
                                        showLoaderOnConfirm : true
                                    }, 
                                    function(isConfirm)
                                    {
                                        if (isConfirm)
                                        {
                                            consumeServicios({servicio : "eliminaconcurso", data : token}, function(data)
                                            {
                                                numeroConcursos();
                                                swal({
                                                        title: "Eliminado", 
                                                        text: "Se ha eliminado el concurso", 
                                                        timer: 2000, 
                                                        type : "success"
                                                    });
                                            });                                            
                                        }
                                        else
                                        {
                                            swal({
                                                title: "Cancelar", 
                                                text: "Se ha cancelado la acción", 
                                                timer: 2000, 
                                                type : "error"
                                            });                         
                                        }
                                    });
                                break;
                }
            });
            //$("#concursos")
            //var fecha = new Date(data[i].fecha_final);
            //Para llamar la opción de editar...
            //newconcurso/"+(data[i].token_concurso)+"
            /*
            table += "<tr>" + 
                    "<td><h5><a href = '/"+(data[i].url_concurso)+"' target = '_blank'>"+(data[i].nombre_concurso)+"</a></h5></td>" + 
                    "<td>"+(data[i].fecha_inicial)+"</td>" +
                    "<td>"+(data[i].fecha_final)+"</td>" +
                    "<td>"+(opciones)+"</td>" +
                    "</tr>";
            */
        }
        //table += "</tbody></table>";
        //$("#concursos").html(table);
        //numeroPagina
        /*
        <!-- Single button -->
        <div class="btn-group">
        <button type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
            Action <span class="caret"></span>
        </button>
        <ul class="dropdown-menu">
            <li><a href="#">Action</a></li>
            <li><a href="#">Another action</a></li>
            <li><a href="#">Something else here</a></li>
            <li role="separator" class="divider"></li>
            <li><a href="#">Separated link</a></li>
        </ul>
        </div>
        */



        



        /*
        <table class="table">
        <thead>
        <tr>
            <th>Firstname</th>
            <th>Lastname</th>
            <th>Email</th>
        </tr>
        </thead>

        <tbody>
      <tr>
        <td>John</td>
        <td>Doe</td>
        <td>john@example.com</td>
      </tr>
      <tr>
        <td>Mary</td>
        <td>Moe</td>
        <td>mary@example.com</td>
      </tr>
      <tr>
        <td>July</td>
        <td>Dooley</td>
        <td>july@example.com</td>
      </tr>
    </tbody>
  </table>
        */
    };

    //Para traer los concurso...
    var listadoDeConcursos = function(page)
    {
        if(page > 0 && page <= totalPagina)
        {
            $("#concursos").html("<div align = 'center'><img src = 'img/loader.gif' border = '0'/></div>");
            consumeServicios({servicio : "listarconcursos", data : page}, function(data)
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
        consumeServicios({servicio : "numconcursos"}, function(data)
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
                                "<a href = '#' aria-label = '"+(i === 0 ? "Previous" : "Next")+"'>" + 
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
            }
            else
            {
                $("#concursos").html("<center><h3>No hay concursos creados en el momento</h3></center>");
                $("#paginar").html("");
            }
            //Traer los primeros concursos...
            listadoDeConcursos(1);
        });
        return numeroConcursos;
    })();
});
  