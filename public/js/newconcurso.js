$(function()
{   
    var token_concurso = $("#token_concurso").val(), 
        editar         = token_concurso === "" ? false : true;
    /* 
    if($("#token_concurso").val() !== "")
    {
        console.log($("#token_concurso").val());    
    }
    */
    $('.summernote').summernote({
        height: 200,
        tabsize: 2
    });

    $("#upbanner").click(function()
    {
        $("#upload").trigger("click");
    });

    $('#upload').change(function ()
    {
        var val = $(this).val().toLowerCase();
        //.avi, .wmv, .flv, .mov, .mp4
        var regex = new RegExp("(.*?)\.(png|jpg|jpeg)$");
        if(!(regex.test(val)))
        {
            $(this).val('');
            sweetAlert("Formato de Archivo", "El formato del Archivo no es válido", "error");
            $("#nombreArchivo").html("Selecciona la Imagen");
        }
        else
        {
            var parteVal = $(this).val().split("\\"), 
                nombreImagen = parteVal[parteVal.length - 1]; 
            $("#nombreArchivo").html(nombreImagen);
        }
    });

    //Validar datos del formulario...
    $('#uploadForm').submit(function(event)
    {
        event.preventDefault();
        event.stopPropagation();
        var fecha_inicia = new Date($("#fecha_inicial").val()), 
            fecha_final  = new Date($("#fecha_final").val()),
            date     	 = new Date(),  
            mes          = date.getMonth() + 1 <= 9 ? "0" + Number(date.getMonth() + 1) : date.getMonth() + 1;
            dia          = date.getDate() <= 9 ? "0" + date.getDate() : date.getDate();
            fecha_actual = new Date(date.getFullYear() + "-" + mes + "-" + dia), 
            procesa      = true;
        /*
        console.log(fecha_actual);
        console.log(+fecha_inicia);
        console.log(+fecha_actual);
        */
        if(!editar)
        {
            if(+fecha_inicia !== +fecha_actual)
            {
                if(+fecha_inicia < +fecha_actual)
                {
                    sweetAlert("Fecha Inicial", "La fecha inicial no puede ser menor que la actual", "error");
                    procesa = false;
                }
            }
        }
        if(procesa)
        {
            if(+fecha_inicia !== +fecha_final)
            {
                if(+fecha_final < +fecha_inicia)
                {
                    sweetAlert("Fecha Final", "La fecha final no puede ser menor que la fecha inicial", "error");
                    procesa = false;
                }
            }
        }
        if(procesa)
        {
            if(!editar)
            {
                if($("#upload").val() === "")
                {
                    sweetAlert("Banner", "Por favor selecciona la Imagen del Banner", "error");
                    procesa = false;
                }
            }
        }
        if(procesa)
        {
            $.ajax(
            {
                url: $(this).attr('action'),
                type: !editar ? 'POST' : 'PUT',
                data: new FormData( this ),
                processData: false,
                contentType: false
            }).done(function( data )
            {
                if(data.err)
                {
                    sweetAlert("Error", data.data, "error");
                }
                else
                {
                    window.location = "/admin";
                }                
            });
        }
        return false;
    });

    $("#nombre_concurso").keyup(function()
    {
        var parteNombre = $(this).val().split(" "), 
            nomUrl      = "";
        for(var i = 0; i < parteNombre.length; i++)
        {
            if(nomUrl !== "")
            {
                nomUrl += "_";
            }
            nomUrl += parteNombre[i];
        }
        $("#url_concurso").val(nomUrl.toLowerCase());
    });
});
  