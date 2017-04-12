var map;
var dataRoutes, dataStops;
var infoRoutes = [];
var infoStops = [];


function initMap() {
    var marker;
    var minskTransCenterGPS = '275744375;539045326'.split(';');


    var centerGPS = {
        lat: toGPS(minskTransCenterGPS[1]),
        lng: toGPS(minskTransCenterGPS[0])
    };

    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 12,
        center: centerGPS
    });
};

function toGPS(bs) {
    var tmp = bs.split('');
    tmp.splice(2, 0, '.');
    return parseFloat(tmp.join(''));
};

(function getSuccessOutput() {
    $.ajax({
        url: 'https://gp-js-test.herokuapp.com/proxy/http://www.minsktrans.by/city/minsk/routes.txt',
        complete: function(response) {
            dataRoutes = response.responseText.split('M1')[0];
            var regExpRoutes = /.*A>B.*/g;
            dataRoutes = dataRoutes.match(regExpRoutes);
            $(dataRoutes).each(function(){
                //this.split(';');
                infoRoutes.push({
                    numberRoute: this.split(';')[0],
                    nameRoute:this.split(';')[10],
                    stopsRoute: this.split(';')[14].split(','),
                });
            });
        },
        error: function(error) {
        },
    });

    $.ajax({
        url: 'https://gp-js-test.herokuapp.com/proxy/http://www.minsktrans.by/city/minsk/stops.txt',
        complete: function(response) {
            dataStops = response.responseText.split('\n');
            $(dataStops).each(function(){
               var lat = this.split(';')[7];
               lat = toGPS(lat);
               var lng = toGPS(this.split(';')[6]);
               infoStops.push({
                    numberStop: this.split(';')[0],
                    nameStop:this.split(';')[4],
                    stopsGPS: {lat: lat, lng: lng}
                });
            });
            console.log(infoStops);
        },
        error: function(error) {
        },
    });
}());

function toGPS(bs) {
    if (bs) {
        var tmp = bs.split('');
        tmp.splice(2, 0, '.');
        return parseFloat(tmp.join(''));
    }
}

new Vue({
    el: '#listRoutes',
    data:{
        dataRoutes: infoRoutes,
        dataMarkers: [],
        markers: []
    },
    methods:{
        setCenterGPS: function(GPS){
            map.setCenter(GPS);
        },

        showMarkers: function(map){

            for (let i = 0; i < this.dataMarkers.length; i++) {
                var contentString = '<div class="content">' + this.dataMarkers[i].nameStop + '</div>';
                var marker = new google.maps.Marker({
                    position: this.dataMarkers[i].stopsGPS,
                    map: map,
                    title: contentString
                });
                var infowindow = new google.maps.InfoWindow({
                    content: this.dataMarkers[i].nameStop
                });

                marker.addListener('click', function() {
                    infowindow.setContent(this.title);
                    infowindow.open(map, this);
                });

                this.markers.push(marker);
            }
        },

        deleteMarkers: function(){
            for (var i = 0; i < this.markers.length; i++){
                this.markers[i].setMap(null);
            }
            this.markers = [];
            this.dataMarkers = [];
        },

        showRoutes: function(event){
            this.deleteMarkers();
            var numberCurrentRoute = $(event.target).prev('span').text();
            var stops=[];
            $(infoRoutes).each(function(index){
                if (this.numberRoute === numberCurrentRoute){
                    for (let i = 0; i < this.stopsRoute.length; i++){
                        stops.push(this.stopsRoute[i]);
                    }
                }
            });

            for (let i = 0; i < stops.length; i++){
                for (let j = 0; j < infoStops.length; j++) {
                    if (stops[i] == infoStops[j].numberStop){
                        var n = j;
                        while (!infoStops[n].nameStop) {
                            n--;
                        }
                        infoStops[j].nameStop = infoStops[n].nameStop;
                        this.dataMarkers.push({
                            nameStop: infoStops[j].nameStop,
                            stopsGPS: infoStops[j].stopsGPS,
                        });
                    }
                }
            }
            var currentCenterGPS = {
                lat: (this.dataMarkers[0].stopsGPS.lat + this.dataMarkers[this.dataMarkers.length - 1].stopsGPS.lat) / 2,
                lng: (this.dataMarkers[0].stopsGPS.lng + this.dataMarkers[this.dataMarkers.length - 1].stopsGPS.lng) / 2
            }

            this.showMarkers(map);
            this.setCenterGPS(currentCenterGPS);
        }
    }
});




