$(function()
{
    $('.summernote').summernote({
        height: 200,
        tabsize: 2
    });

    $("#upvideo").click(function()
    {
        $("#upload").trigger("click");
    });

    $('#upload').change(function ()
	{
		var val = $(this).val().toLowerCase();
        //.avi, .wmv, .flv, .mov, .mp4
		var regex = new RegExp("(.*?)\.(avi|wmv|flv|mov|mp4|webm)$");
		if(!(regex.test(val)))
		{
			$(this).val('');
			sweetAlert("Formato de vídeo", "El formato de vídeo no es válido", "error");
            $("#nombreVideo").html("Selecciona el vídeo");
		}
		else
		{
            var parteVal = $(this).val().split("\\"), 
                nombreVideo = parteVal[parteVal.length - 1]; 
            $("#nombreVideo").html(nombreVideo);
		}
	});

    $('#uploadForm').submit(function(event)
    {
        event.preventDefault();
        event.stopPropagation();
        if($("#upload").val() === "")
        {
            sweetAlert("Vídeo", "Por favor selecciona el vídeo", "error");
        }
        else
        {
            $("form").hide("fast");
            $("#progreso").show("fast");
            $("#tituloSube").html("Subiendo: " + $("#titulo_video").val());
            $("#progress").width("0%").html("0%");
            $.ajax(
            {
                url: $(this).attr('action'),
                type: 'POST',
                data: new FormData( this ),
                processData: false,
                contentType: false, 
                xhr: function()
                {
                    //upload Progress
                    var xhr = $.ajaxSettings.xhr();
                    if (xhr.upload)
                    {
                        xhr.upload.addEventListener('progress', function(event) 
                        {
                            var percent = 0;
                            var position = event.loaded || event.position;
                            var total = event.total;
                            if (event.lengthComputable) {
                                percent = Math.ceil(position / total * 100);
                            }
                            $("#progress").width(percent + "%").html( + percent + "%");
                        }, true);
                    }
                    return xhr;
                }
            }).done(function( data )
            {
                console.log(data);
                if(data.error)
                {
                    sweetAlert("Error", data.data, "error");
                    $("form").show("fast");
                    $("#progreso").hide("fast");
                }
                else
                {
                    $("#progreso").hide("fast");
                    $("#termina").show("fast");
                }               
            });
        }
        return false;
    });
});