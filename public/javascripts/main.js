$('#login-submit-button').on('click', function() {
    var form = $('#login-form');
    $('.error', form).html('');
    $(":submit", form).button("Вход...");
    $('.error').addClass('hide');
    $.ajax({
      url: "/login",
      data: form.serialize(),
      method: "POST",
      complete: function() {
        $(":submit", form).button("reset");
      },
      statusCode: {
        200: function() {
          window.location.href = "/map";
        },
        403: function(jqXHR) {
          var error = JSON.parse(jqXHR.responseText);
          $('.error', form).html(error.message).removeClass('hide');
        }
      }
    });
    return false;
});

$('#logout-button').on('click', function() {
    $.ajax({
        url: "/logout",
        method: "POST",
        statusCode: {
        200: function() {
          window.location.href = "/";
        },
      }
    });
});