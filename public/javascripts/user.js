function User(options) {
    this.id = options.id || 0;
    this.roles = options.roles || ['viewer'];
    this.name = options.name || 'Аноним';

    this.hasRole = function(role) {
        return this.roles.indexOf(role) > -1;
    }
}

$( document ).ready(function() {
    $('.user-edit-link').on('click', function() {
      $('#edituser-dialog').modal();
      var id = $(this).attr("rel");

      var form = $('#edituser-form');
      $('.error', form).addClass('hide');
      form.trigger('reset');

      $.ajax({
          url: '/users/' + id,
          method: "GET",
          statusCode: {
            200: function(user) {
              $('[name="id"]', form).val(id);
              $('[name="login"]', form).val(user.login);
              $('[name="name"]', form).val(user.name);

              if (user.roles.indexOf('admin') != -1) {
                 $('#userRoleAdmin', form).prop('checked', true);
              }
              if (user.roles.indexOf('editor') != -1) {
                 $('#userRoleEditor', form).prop('checked', true);
              }
              if (user.roles.indexOf('viewer') != -1) {
                 $('#userRoleViewer', form).prop('checked', true);
              }

              $('#edituser-dialog').on('shown.bs.modal', function () {
                $('[name="login"]', form).focus()
              })
            }
          }
        });
      return false;
    });

    $('#user-add-button').on('click', function() {
      $('#adduser-dialog').modal();
      $('#adduser-form').trigger('reset');

      $('#adduser-dialog').on('shown.bs.modal', function () {
        $('[name="login"]', $('#adduser-form')).focus()
      })
      return false;
    });

    $('.user-delete-link').on('click', function() {
      if (confirm("Вы действительно желаете удалить пользователя?")) {
        var id = $(this).attr("rel");
        $.ajax({
          url: '/users/' + id,
          method: "DELETE",
          statusCode: {
            200: function(user) {
              location.href='/users';
            }
          }
        });
      }
      return false;
    });

    $('#adduser-submit-button').on('click', function() {
      var form = $('#adduser-form');
      $(":submit", form).text("Сохранение...");
      $(":submit", form).prop("disabled", true);
      $('.error', form).addClass('hide');
      $.ajax({
          url: "/users",
          data: form.serialize(),
          method: "POST",
          complete: function() {
            $(":submit", form).prop("disabled", false);
            $(":submit", form).text("Сохранить");
          },
          statusCode: {
            200: function(response) {
              if (response.success) {
                $('#adduser-dialog').modal('hide');
                location.href = '/users';
              } else {
                $('.error', form).html(response.msg).removeClass('hide');
              }
            }
          }
        });
      return false;
    });

    $('#edituser-submit-button').on('click', function() {
      var form = $('#edituser-form');
      $(":submit", form).text("Сохранение...");
      $(":submit", form).prop("disabled", true);
      $('.error', form).addClass('hide');
      $.ajax({
          url: "/users/"+$('[name="id"]', form).val(),
          data: form.serialize(),
          method: "PUT",
          complete: function() {
            $(":submit", form).prop("disabled", false);
            $(":submit", form).text("Сохранить");
          },
          statusCode: {
            200: function(response) {
              if (response.success) {
                $('#edituser-dialog').modal('hide');
                location.href = '/users';
              } else {
                $('.error', form).html(response.msg).removeClass('hide');
              }
            }
          }
        });
      return false;
    });
});