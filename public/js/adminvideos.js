$(function()
{
    //console.log("Carga");
    var numeroPagina    = 0,  
        totalPagina     = 0, 
        privado         = new factoriaAdminVideos(), 
        id_admin  = privado.getData("id_admin"),  
        nomServicios    = {
                                numvideosAdmin : {metodo : "GET"},
                                getvideosAdmin : {metodo : "GET"},
                                eliminarvideo: {metodo: "DELETE"}
                          };
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
                servicio.url += "/" + opciones.data;
            }
            else if(servicio.metodo === "DELETE")
            {
                servicio.url +=  "/" + opciones.data;
            }
            else
            {
                servicio.datos = JSON.stringify(opciones.data);   
            }
        }
        //console.log(servicio.url);
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

    var muestraListadoVideos = function(data)
    {
        //console.log(data);
        var table = "<table class = 'table table-striped'><tbody>";
     
        var opciones = "<div class='btn-group'>" + 
                       "<button type = 'button' class = 'btn btn-default dropdown-toggle' data-toggle='dropdown' aria-haspopup='true' aria-expanded='false'>" +
                       "Opciones <span class='caret'></span>" +
                       "</button>" +
                       "<ul class = 'dropdown-menu pull-right' id = 'video_TOKENVIDEO'>" +
                       "<li><a href='javascript:;' type = 'del'>Eliminar</a></li>" +                       
                       "</ul></div>";
        var table = "<table class = 'table' id='admin-table-videos'>" + 
                    "<thead>" + 
                    "<tr>" +
                    "<th id='state-video'>Estado</th>" +
                    "<th></th>" +
                    "<th></th>" +
                    "</tr>" +
                    "</thead><tbody></tbody></table>";
        $("#concursos").html(table);                    

        for(var i = 0; i < data.length; i++)
        {
            var opcTr = opciones.replace("TOKENVIDEO", data[i].token_video); 
                
            var urlVideo = "/" + data[i].concurso[0].url_concurso + "/" + data[i].token_video;
            var txt = "<span style = 'font-size: 1.4em;'><a href = '"+(urlVideo)+"' style = 'color: #2196f3;' target = '_blank'>" + data[i].titulo_video + 
                      "</a></span><br><span style = 'font-size: 0.7em;'>Por: " + 
                      data[i].nombre_usuario + " (<a href = 'mailto:"+(data[i].email)+"' style = 'color: #2196f3;'>"+(data[i].email)+"</a>)<br>" + 
                      "Pertenece al concurso: " + (data[i].concurso[0].nombre_concurso)+ "<br>" + 
                      "Agregado el día: " + (data[i].fecha_publica_string)+" - "+(data[i].hora_publica) + 
                      "</span>";
            var tr = "<tr><td width = '20%' class='state-video'><center>" + 
                     data[i].nombre_estado_video+ "</center></td>" + 
                     "<td>" + (txt) + "</td>"+ "<td>"+opcTr+ "</td>"+"</tr>";
            $("#concursos tbody").append(tr);
                        

            $("#video_" + data[i].token_video + " > li > a").click(function(event)
            {
                var token = $(this).parent().parent().attr("id").split("_")[1];
                switch($(this).attr("type"))
                {                    
                    case "del" : //Para eliminar un concurso...
                                swal({
                                        title: "¿Estás Segur@?", 
                                        text: "¿Deseas eiminar el video seleccionado?",
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
                                            consumeServicios({servicio : "eliminarvideo", data : token}, function(data)
                                            {
                                                numeroVideos();
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
        }

        $(document).ready(function() {
            // Setup - add a text input to each footer cell
            var title = $('#admin-table-videos thead #state-video').text();
            $('#admin-table-videos thead #state-video').html( '<input type="text" id="search" placeholder="Buscar '+title+'" />' );

                // DataTable
         //   var tableVideos = $('#admin-table-videos').DataTable();
         
            // Apply the search
         
                $( '#search').keyup(function () {
                    var value = $(this).val().toUpperCase();

                    if (value.length){
                        $("table tr").each(function (index) {
                            if (index != 0) {

                                $row = $(this);

                                $row.find("td.state-video").each(function () {

                                var cell = $(this).text().toUpperCase();

                                if (cell.indexOf(value) < 0) {
                                    $row.hide();
                                } else {
                                    $row.show();
                                    return false; //Once it's shown you don't want to hide it on the next cell
                            }

                        });
                    }
                });
                }
                else{
                    //if empty search text, show all rows
                    $("table tr").show();

                }
                });
            
        }
        );
        //table += "</tbody></table>";
        //$("#videos").html(table);

    };

    //Para traer los concurso...
    $("#videos").html("<div align = 'center'><img src = 'img/loader.gif' border = '0'/></div>");
    var listadoDeVideos = function(page)
    {
        if(page > 0 && page <= totalPagina)
        {
            $("#videos").html("<div align = 'center'><img src = 'img/loader.gif' border = '0'/></div>");
            consumeServicios({servicio : "getvideosAdmin", data : page}, function(data)
            {
                //console.log(data);
                muestraListadoVideos(data);
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
                
            });
        }
    };

    //Primero invocar el número de videos que existen...
    var numeroVideos = (function numeroVideos()
    {
        numeroPagina = 0;
        consumeServicios({servicio : "numvideosAdmin"}, function(data)
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
                                listadoDeVideos(Number($(this).text()));
                            }
                        }
                        else
                        {
                            if(!$(this).parent().hasClass("disabled"))
                            {
                                listadoDeVideos(numeroPagina + ($(this).attr("aria-label") === "Previous" ? -1 : 1));
                            }
                        }
                    });
                }
                //Traer los primeros concursos...
                listadoDeVideos(1);
            }
            else
            {
                console.log("Estoy dejando vacio el pagination!!!!!");
                $("#videos").html("<center><h3>No hay vídeos cargados en el momento</h3></center>");
                $("#paginar").html("");
            }         
        });
        return numeroVideos;
    })();
});
  