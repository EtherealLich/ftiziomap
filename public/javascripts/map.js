function Map(view, view_options) {

    this.map = null;
    this.markers = null;
    this.markers_list = [];
    this.icon = null;
    this.view_options = view_options;

    this.balloon_options = {
        minWidth: 200,
        sprawling: true
    }

    // Добавления слушателя на нажатие на карту
    this.setMapClickListener = function() {
        var self = this;
        this.map.on('click', function(e) {
            DG.ajax({
                url: 'https://catalog.api.2gis.ru/geo/search',
                data: {
                    key: gis_key,
                    version: 1.3,
                    q: e.latlng.lng + ',' + e.latlng.lat
                },
                success: function(data) {
                    //if (data.result) {

                        var button = document.createElement("button");
                        button.type = "button";
                        button.className = "btn btn-default";
                        button.id = "add-point-button";
                        button.innerHTML = '<span class="glyphicon glyphicon-plus" aria-hidden="true"></span> Добавить очаг';
                        var div = document.createElement("div");
                        if (data.result) {
                            div.innerHTML = data.result[0].name;
                        } else {
                            div.innerHTML = '<Адрес не определен>';
                        }
                        div.innerHTML += '<br/><br/>';
                        div.appendChild(button);

                        var popup = DG.popup(self.balloon_options)
                            .setLatLng(e.latlng)
                            .setContent(div)
                            .openOn(self.map);

                        $(button).on("click", function() {
                            if (data.result) {
                                var address = data.result[0].name;

                                var district = {
                                    id: null
                                };
                                data.result.forEach(function(item) {
                                    if (item.type == 'district') {
                                        district = item;
                                    }
                                });
                            } else {
                                address = '';
                                district = {
                                    id: null
                                };
                            }

                            map.addPoint(e.latlng, address, district.id);
                        });
                    //}
                },
                error: function(error) {
                    console.log(error);
                }
            });
        });
    }

    this.initMap = function() {
        // Инициализация карты
        this.icon = DG.icon({
            iconUrl: '/images/bluecircle.png',
            iconRetinaUrl: '/images/bluecircle.png',
            iconSize: [16, 16],
            iconAnchor: [8, 8],
            popupAnchor: [0, 20],
        });

        this.icon2 = DG.icon({
            iconUrl: '/images/redcircle.png',
            iconRetinaUrl: '/images/redcircle.png',
            iconSize: [16, 16],
            iconAnchor: [8, 8],
            popupAnchor: [0, 20],
        });

        this.map = DG.map('map', {
            center: [this.view_options.lat, this.view_options.lng],
            zoom: this.view_options.zoom,
            fullscreenControl: false
        });

        DG.control.fullscreen({position: 'topleft'}).addTo(this.map);
    }

    this.renderPopupText = function(point) {
        var popupHtml = point.tubform == 'БК+' ? '<div class="bk_plus">БК+</div>' : '';

        popupHtml += '<strong>' + point.address + '</strong>';
        if (point.fio) {
            popupHtml +=  '<br/>' + point.fio;
        }
        if (point.comment) {
            popupHtml +=  '<br/><small>' + point.comment.replace(/(?:\r\n|\r|\n)/g, '<br />') + '</small>';
        }
        if ( user.hasRole('editor') ) {
            popupHtml += '<br/><br/><button type="button" class="btn btn-default" onClick="map.editPoint(' + point.id + ')"><span class="glyphicon glyphicon-edit" aria-hidden="true"></span> Редактировать</button> <button type="button" class="btn btn-default" onClick="map.delPoint(' + point.id + ')"><span class="glyphicon glyphicon-remove" aria-hidden="true"></span> Удалить</button>';
        }
        return popupHtml;
    }

    // Создание маркера с баллуном и содержанием в зависимости от роли
    this.createMarker = function(point) {
        var icon = point.tubform == 'БК+' ? this.icon2: this.icon;
        var marker = DG.marker([point.lat || point.coords.coordinates[0], point.lng || point.coords.coordinates[1]], { icon: icon });
        marker.bindPopup(this.renderPopupText(point), this.balloon_options );
        this.markers_list[point.id] = marker;
        this.markers_list[point.id].point = point;
        return marker;
    }

    // Вид отображения - отдельные точки
    this.setViewBasic = function(){
        var self = this;
        DG.then(function () {
            self.initMap();

            fetch('/points', {credentials: 'same-origin'})
              .then(function(response) {
                return response.json();
               })
              .then(function(points) {

                points.forEach(function(item, i, arr) {
                    self.createMarker(item).addTo(self.map);
                });

                if ( user.hasRole('editor') ) {
                    self.setMapClickListener();
                }
              })
              .catch( alert );
        });
    }

    // Вид отображения - кластерный карта
    this.setViewCluster = function() {
        var self = this;
        DG.then(function () {
            return DG.plugin('/javascripts/leaflet.markercluster.js');
        }).then(function() {
            self.initMap();

            fetch('/points', {credentials: 'same-origin'})
              .then(function(response) {
                return response.json();
               })
              .then(function(points) {
                self.markers = DG.markerClusterGroup({
                    maxClusterRadius: 40
                });

                points.forEach(function(item, i, arr) {
                    var marker = self.createMarker(item);
                    self.markers.addLayer(marker);
                });

                self.map.addLayer(self.markers);
                if ( user.hasRole('editor') ) {
                    self.setMapClickListener();
                }

              })
              .catch( alert );
        });
    }

    // Вид отображения - тепловая карта
    this.setViewHeatMap = function() {
        var self = this;
        DG.then(function () {
            return DG.plugin('https://2gis.github.io/mapsapi/vendors/HeatLayer/heatLayer.js');
        }).then(function() {
            self.initMap();

            fetch('/points', {credentials: 'same-origin'})
              .then(function(response) {

                return response.json();
               })
              .then(function(points) {

                var locations = [];
                points.forEach(function(item, i, arr) {
                    locations.push([item.coords.coordinates[0], item.coords.coordinates[1]])
                });

                DG.heatLayer(locations, {radius: 40}).addTo(self.map);
              })
              .catch( alert );
        });
    }

    // Редактирование очага
    this.editPoint = function(id) {
        $('#editpoint-form :input[name="address"]').val(this.markers_list[id].point.address);
        $('#editpoint-form :input[name="fio"]').val(this.markers_list[id].point.fio);
        $('#editpoint-form :input[name="comment"]').val(this.markers_list[id].point.comment);
        $('#editpoint-form :input[name="point_id"]').val(this.markers_list[id].point.id);
        $('#editpoint-form :input[name="district_id"]').val(this.markers_list[id].point.district_id);
        $('#editpoint-form :input[name="tubform"]').prop('checked', this.markers_list[id].point.tubform == 'БК+').change();
        $('#editpoint-dialog').modal();
        $('#editpoint-dialog').on('shown.bs.modal', function () {
            $('[name="address"]', $('#editpoint-form')).focus();
        });
    }

    // Добавление нового очага
    this.addPoint = function(latlng, address, district_id) {
        $('#addpoint-form :input[name="address"]').val(address);
        $('#addpoint-form :input[name="district_id"]').val(district_id);
        $('#addpoint-form :input[name="lat"]').val(latlng.lat);
        $('#addpoint-form :input[name="lng"]').val(latlng.lng);

        $('#addpoint-dialog').modal();
        $('#addpoint-dialog').on('shown.bs.modal', function () {
            $('[name="address"]', $('#addpoint-form')).focus();
        });
    }

    // Удаление очага
    this.delPoint = function(id) {
        var self = this;
        fetch('/points/' + id,
            {
                method: 'delete',
                credentials: 'same-origin'
            }
        )
        .then(function(response) {
            return response.json();
        })
        .then(function(resp) {
            if (resp.success) {
                if (self.markers) {
                    self.markers.removeLayer(self.markers_list[id]);
                }
                self.markers_list[id].removeFrom(self.map);
                delete self.markers_list[id];
            }
        })
    }

    // Загрузка выбранного вида
    switch(view){
        case 'basic':
            this.setViewBasic();
            break;
        case 'cluster':
            this.setViewCluster();
            break;
        case 'heatmap':
            this.setViewHeatMap();
            break;
        default:
    }
}

$( document ).ready(function() {
    // Поиск в адресной строке
    $('#address_search').autoComplete({
      delay: 500,
      source: function(term, response){
        var query = (term.indexOf('Пермь') == -1 ? 'Пермь, ' : '') + term;
        DG.ajax({
            url: 'https://catalog.api.2gis.ru/geo/search',
            data: {
                key: gis_key,
                version: 1.3,
                q: query,
                limit: 10
            },
            success: function(data) {
              if (data.result) {
                response(data.result);
              }
            },
            error: function(error) {
              console.log(error);
            }
        });
      },
      renderItem: function (item, search){
        search = search.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        var re = new RegExp("(" + search.split(' ').join('|') + ")", "gi");
        return '<div class="autocomplete-suggestion" data-val="' + item.name + '" data-point="' + item.centroid + '">' + item.name.replace(re, "<b>$1</b>") + '</div>';
      },
      onSelect: function(e, term, item){
          var point = item.data('point').match(/POINT\(([0-9.]+)\s([0-9.]+)\)/i);
          if (map.map.getZoom() < 18) {
            map.map.setZoom(18, {animate: false});
          }
          map.map.panTo([point[2], point[1]]);
      }
    });

    // Открытие окна фильтров
    $('#districts-filter-button').on('click', function() {
      $('#district-filter-dialog').modal();
      var id = $(this).attr("rel");
      return false;
    });

    // Применение фильтра
    $('#district-filter-submit-button').on('click', function() {
      var form = $('#district-filter-form');
      $.ajax({
        url: '/map/setFilter',
        method: "GET",
        data: form.serialize(),
        statusCode: {
          200: function() {
            window.location.href = "/map";
          }
        }
      });
      return false;
    });

    // Сброс фильтра
    $('#district-filter-reset-button').on('click', function() {
      $.ajax({
        url: '/map/resetFilter',
        method: "GET",
        statusCode: {
          200: function() {
            window.location.href = "/map";
          }
        }
      });
      return false;
    });

    // Смена представления
    $('#view-menu a').on('click', function() {
        var url = this.pathname;
        $.ajax({
          url: url,
          method: "GET",
          data: {
            lat: map.map.getCenter().lat,
            lng: map.map.getCenter().lng,
            zoom: map.map.getZoom()
          },
          statusCode: {
            200: function() {
              window.location.href = "/map";
            }
          }
        });
        return false;
    });

    $('#editpoint-submit-button').on('click', function() {
        var form = $('#editpoint-form');

        var point = {
          id: $('[name="point_id"]', form).val(),
          address: $('[name="address"]', form).val(),
          fio: $('[name="fio"]', form).val(),
          comment: $('[name="comment"]', form).val(),
          coords: map.markers_list[$('[name="point_id"]', form).val()].point,
          district_id: $('[name="district_id"]', form).val(),
          tubform: $('[name="tubform"]', form).prop('checked') ? 'БК+' : 'БК-'
        }

        $('.error', form).html('');
        $(":submit", form).button("Сохранение...");
        $('.error').addClass('hide');

        $('[name="tubform"]', form).val($('[name="tubform"]', form).prop('checked') ? 'БК+' : 'БК-');
        $('[name="tubform"]', form).prop('checked', true);

        $.ajax({
          url: "/points/" + point.id,
          data: form.serialize(),
          method: "PUT",
          complete: function() {
            $(":submit", form).button("reset");
          },
          statusCode: {
            200: function(response) {
              $('#editpoint-dialog').modal('hide');

              map.markers_list[point.id].setIcon(point.tubform == 'БК+' ? map.icon2: map.icon);
              map.markers_list[point.id].point = point;
              map.markers_list[point.id].bindPopup(map.renderPopupText(point), map.balloon_options );
              map.markers_list[point.id].openPopup();
            }
          }
        });
        return false;
    });

    $('#addpoint-submit-button').on('click', function() {
        var form = $('#addpoint-form');

        var tubform = $('[name="tubform"]', form).prop('checked') ? 'БК+' : 'БК-';
        var point = {
          address: $('[name="address"]', form).val(),
          fio: $('[name="fio"]', form).val(),
          comment: $('[name="comment"]', form).val(),
          district_id: $('[name="district_id"]', form).val(),
          tubform: tubform
        }

        $('[name="tubform"]', form).val($('[name="tubform"]', form).prop('checked') ? 'БК+' : 'БК-');
        $('[name="tubform"]', form).prop('checked', true);

        var formData = form.serializeArray();
        var data = {};
        $.each(formData, function() {
            if (data[this.name] !== undefined) {
                if (!data[this.name].push) {
                    data[this.name] = [data[this.name]];
                }
                data[this.name].push(this.value || '');
            } else {
                data[this.name] = this.value || '';
            }
        });

        fetch('/points',
            {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                method: 'post',
                body: JSON.stringify(data),
                credentials: 'same-origin'
            }
        )
        .then(
            function(response) {
                if (response.status == 200) {
                    return response.json();
                } else {
                    alert('Сервер вернул ошибку');
                }

            },
            function(error) {
                alert('Ошибка обращения к серверу');
            }
        )
        .then(function(resp) {
            if (resp.success) {
                var marker = map.createMarker({
                    id: resp.id,
                    fio: $('[name="fio"]', form).val(),
                    address: $('[name="address"]', form).val(),
                    lat: $('[name="lat"]', form).val(),
                    lng: $('[name="lng"]', form).val(),
                    comment: $('[name="comment"]', form).val(),
                    district_id: $('[name="district_id"]', form).val(),
                    tubform: tubform
                });
                if (map.markers) {
                    map.markers.addLayer(marker);
                } else {
                    marker.addTo(map.map);
                }
                $('#addpoint-dialog').modal('hide');
                marker.openPopup();
            } else {
                alert('Операция неуспешна');
            }
        })

        return false;
    });

    // Открытие списка очагов
    $('#points-report-button').on('click', function() {
      $('#points-report-dialog').modal();
      var bounds = map.map.getBounds();
      var query = 'from_x=' + bounds.getWest() + '&to_x=' + bounds.getEast() + '&from_y=' + bounds.getSouth() + '&to_y=' + bounds.getNorth();
      fetch('/points?' + query, {credentials: 'same-origin'})
          .then(function(response) {
            return response.json();
           })
          .then(function(points) {
            $("#points-report-export-button").attr("href", '/points_report?' + query);
            $("#points-report-table > tbody").html("");
            points.forEach(function(item, i, arr) {
                $("#points-report-table").find('tbody')
                .append($('<tr>')
                    .append($('<td>').text(item.fio))
                    .append($('<td>').text(item.address))
                    .append($('<td>').text(item.comment))
                    .append($('<td>').text(item.tubform ? item.tubform : 'БК-'))
                );
            });
          })
          .catch( alert );

      return false;
    });

    $('#points-report-close-button').on('click', function() {
        $('#points-report-dialog').modal('hide');
        return false;
    });
});