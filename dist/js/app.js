var app = {
    init: function() {
        app.otherMobileFix();
        app.createMap();
        app.share();
    },
    share: function() {
        $(".icon-twitter").on("click", function() {
            var tweet = getSocialLang();
            var url = "http://data.baltimoresun.com/jin/md-shootings-near-you";
            var twitter_url = "https://twitter.com/intent/tweet?text=" + tweet + "&url=" + url + "&tw_p=tweetbutton";
            window.open(twitter_url, "mywin", "left=200,top=200,width=500,height=300,toolbar=1,resizable=0");
            return false;
        });
        $(".icon-facebook").on("click", function() {
            var picture = "http://data.baltimoresun.com/jin/md-shootings-near-you/images/thumb.png";
            var title = "How violent is your neighborhood?";
            var description = getSocialLang();
            var url = "http://data.baltimoresun.com/jin/md-shootings-near-you";
            var facebook_url = "https://www.facebook.com/dialog/feed?display=popup&app_id=310302989040998&link=" + url + "&picture=" + picture + "&name=" + title + "&description=" + description + "&redirect_uri=http://www.facebook.com";
            window.open(facebook_url, "mywin", "left=200,top=200,width=500,height=300,toolbar=1,resizable=0");
            return false;
        });
        function getSocialLang() {
            var area;
            var stats = [];
            stats[0] = $(".incidentsNumber").text();
            stats[1] = $(".shootingsNumber").text();
            stats[2] = $(".homicidesNumber").text();
            if (Number(stats[0]) > 500) {
                area = "in Maryland";
            } else {
                area = "in my area";
            }
            return "In 2015, " + stats[0] + " shootings " + area + " resulted in " + stats[1] + " injuries and " + stats[2] + " deaths.";
        }
    },
    createMap: function() {
        window.onload = function() {
            var isMobile = false;
            if ($(window).width() < 600) {
                isMobile = true;
            }
            var options = {
                center: [ 39.289156, -76.59342 ],
                zoom: 12,
                touchZoom: true,
                scrollWheelZoom: true,
                zoomControl: false,
                doubleClickZoom: false,
                boxZoom: false,
                attributionControl: false
            };
            var homicideMap = new L.Map("homicideMap", options);
            L.tileLayer("http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png", {
                attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="http://cartodb.com/attributions">CartoDB</a>'
            }).addTo(homicideMap);
            var mainlayers = [];
            var sublayers = [];
            var layerSource = {
                user_name: "baltsun",
                type: "cartodb",
                sublayers: [ {
                    sql: "SELECT * FROM md_nonfatal_shootings_2015",
                    cartocss: "#md_nonfatal_shootings_2015{marker-fill-opacity: 1;" + "marker-line-color: #daa520;" + "marker-line-width: 1;" + "marker-line-opacity: 1;" + "marker-placement: point;" + "marker-type: ellipse;" + "marker-width: 4;" + "marker-fill: #fff;" + "marker-allow-overlap: true;" + "[zoom>13]{marker-width: 8;}}"
                }, {
                    sql: "SELECT * FROM md_fatal_shootings_2015",
                    cartocss: "#md_fatal_shootings_2015{marker-fill-opacity: 1;" + "marker-line-color: #900020;" + "marker-line-width: 1;" + "marker-line-opacity: 1;" + "marker-placement: point;" + "marker-type: ellipse;" + "marker-width: 4;" + "marker-fill: #fff;" + "marker-allow-overlap: true;" + "[zoom>13]{marker-width: 8;}}"
                } ]
            };
            mainlayers = [];
            cartodb.createLayer(homicideMap, layerSource, {
                cartodb_logo: false
            }).addTo(homicideMap).done(function(layer) {
                for (var i = 0; i < layer.getSubLayerCount(); i++) {
                    mainlayers[i] = layer.getSubLayer(i);
                }
                mainlayers[1].setInteractivity("address, date, injured, killed");
                mainlayers[0].setInteractivity("address, date, injured");
                var homicidesTooltip = layer.leafletMap.viz.addOverlay({
                    type: "infobox",
                    layer: mainlayers[1],
                    template: '<div class="homicidesInfobox">' + "<p>{{address}}</p>" + "<p>{{date}}</p>" + "<p># Injured: {{injured}}</p>" + "<p># Killed: {{killed}}</p></div>",
                    width: 208,
                    fields: [ {
                        address: "address",
                        date: "date",
                        injured: "injured",
                        killed: "killed"
                    } ]
                });
                var shootingsTooltip = layer.leafletMap.viz.addOverlay({
                    type: "infobox",
                    layer: mainlayers[0],
                    template: '<div class="shootingsInfobox">' + "<p>{{address}}</p>" + "<p>{{date}}</p>" + "<p># Injured: {{injured}}</p></div>",
                    width: 208,
                    fields: [ {
                        address: "address",
                        date: "date",
                        injured: "injured"
                    } ]
                });
                $(".infobox--homicides").append(homicidesTooltip.render().el);
                $(".infobox--shootings").append(shootingsTooltip.render().el);
                var lat = 39.289156;
                var lon = -76.58342;
                var zoomLvl = 9;
                if (isMobile) {
                    lat -= .02;
                    lon -= .04;
                    zoomLvl -= 1;
                }
                homicideMap.setView([ lat, lon ], zoomLvl);
            }).error(function(err) {
                console.log("error: " + err);
            });
            var radius, marker;
            function createFullMap() {
                clearMap();
                countPoints("SELECT * FROM md_nonfatal_shootings_2015", "SELECT * FROM md_fatal_shootings_2015");
                var lat = 39.289156;
                var lon = -76.58342;
                var zoomLvl = 9;
                if (isMobile) {
                    lat -= .02;
                    lon -= .04;
                    zoomLvl -= 1;
                }
                homicideMap.setView([ lat, lon ], zoomLvl, {
                    animation: true
                });
            }
            function detectUserLocation() {
                if (navigator.geolocation) {
                    var timeoutVal = 10 * 1e3 * 1e3;
                    navigator.geolocation.getCurrentPosition(createProximityMap, alertError, {
                        enableHighAccuracy: true,
                        timeout: timeoutVal,
                        maximumAge: 0
                    });
                } else {
                    alert("Geolocation is not supported by this browser");
                }
                function alertError(error) {
                    var errors = {
                        1: "Permission denied. Please check your location settings or input the address manually.",
                        2: "Position unavailable",
                        3: "Request timeout"
                    };
                    alert("Error: " + errors[error.code]);
                }
            }
            function createProximityMap(position) {
                clearMap();
                var lon = position.coords.longitude;
                var lat = position.coords.latitude;
                var latlng = L.latLng(lat, lon);
                radius = new L.circle(latlng, 1609, {
                    color: "#DAA520",
                    fillColor: "#DAA520",
                    fillOpacity: .1
                }).addTo(homicideMap);
                radius.bringToBack();
                marker = L.circleMarker(latlng, {
                    stroke: false,
                    fillColor: "#DAA520",
                    fillOpacity: .5
                }).addTo(homicideMap);
                var shootingsSQL = "SELECT * FROM md_nonfatal_shootings_2015 WHERE ST_Distance(the_geom, ST_GeomFromText('POINT(" + lon + " " + lat + ")', 4326), true) < 1609";
                var homicidesSQL = "SELECT * FROM md_fatal_shootings_2015 WHERE ST_Distance(the_geom, ST_GeomFromText('POINT(" + lon + " " + lat + ")', 4326), true) < 1609";
                var viewLat = parseFloat(lat);
                var viewLon = parseFloat(lon);
                var zoomLvl = 14;
                if (!isMobile) {
                    viewLon += .009;
                } else {
                    viewLat -= .009;
                    zoomLvl -= 1;
                }
                homicideMap.setView([ viewLat, viewLon ], zoomLvl, {
                    animation: true
                });
                countPoints(shootingsSQL, homicidesSQL);
            }
            function clearMap() {
                if ($(".overlay").length != 0) {
                    $(".overlay").fadeOut();
                }
                if (radius != undefined) {
                    homicideMap.removeLayer(radius);
                }
                if (marker != undefined) {
                    homicideMap.removeLayer(marker);
                }
            }
            function countPoints(shootingsSQL, homicidesSQL) {
                var incidentsCount = 0;
                var shootingsCount = 0;
                var homicidesCount = 0;
                $.getJSON("https://baltsun.cartodb.com/api/v2/sql/?q=" + shootingsSQL, function(data) {
                    $.each(data.rows, function(key, val) {
                        shootingsCount += val.injured;
                        incidentsCount++;
                    });
                    $.getJSON("https://baltsun.cartodb.com/api/v2/sql/?q=" + homicidesSQL, function(data) {
                        $.each(data.rows, function(key, val) {
                            homicidesCount += val.killed;
                            shootingsCount += val.injured;
                            incidentsCount++;
                        });
                        if (incidentsCount == 1) {
                            $(".incidentsPlural").hide();
                        } else {
                            $(".incidentsPlural").show();
                        }
                        if (incidentsCount > 500) {
                            $(".withinMile").hide();
                        } else {
                            $(".withinMile").show();
                        }
                        $(".incidentsNumber").text(incidentsCount);
                        $(".homicidesNumber").text(homicidesCount);
                        $(".shootingsNumber").text(shootingsCount);
                    });
                });
            }
            var osmGeocoder = new L.Control.OSMGeocoder({
                collapsed: false,
                position: "topright",
                text: "Locate",
                bounds: L.latLngBounds(L.latLng(37.864594, -79.577236), L.latLng(39.805303, -74.85964)),
                callback: function(results) {
                    if (results[0] != undefined) {
                        var bbox = results[0].boundingbox, first = new L.LatLng(bbox[0], bbox[2]), second = new L.LatLng(bbox[1], bbox[3]), bounds = new L.LatLngBounds([ first, second ]);
                        var newPos = {
                            coords: {
                                latitude: results[0].lat,
                                longitude: results[0].lon
                            }
                        };
                        createProximityMap(newPos);
                    } else {
                        alert("Error: Cannot find address in Maryland.");
                    }
                }
            });
            homicideMap.addControl(osmGeocoder);
            $(".mapButton--nearby").on("click", function() {
                detectUserLocation();
            });
            homicideMap.on("click", function(result) {
                var newPos = {
                    coords: {
                        latitude: result.latlng.lat,
                        longitude: result.latlng.lng
                    }
                };
                createProximityMap(newPos);
            });
            $(".mapButton--full").on("click", function() {
                createFullMap();
            });
            $(".overlay").one("click", function() {
                $(".overlay").fadeOut();
                createFullMap();
            });
        };
    },
    mobileCheck: function() {
        var isMobile = false;
        if ($(window).width() < 600) {
            isMobile = true;
        }
        return isMobile;
    },
    otherMobileFix: function() {
        var isMobile = false;
        if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|ipad|iris|kindle|Android|Silk|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(navigator.userAgent) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(navigator.userAgent.substr(0, 4))) isMobile = true;
        var tablet = window.matchMedia("only screen and (max-width: 760px)");
        if (tablet.matches || isMobile) {
            $(".infoboxContainer").hide();
            $(".mobileFooter").on("click", function() {
                $("footer").fadeIn("fast");
            });
            $("footer").on("click", function() {
                $("footer").fadeOut("fast");
            });
        }
    }
};

$(document).ready(function() {
    app.init();
    console.log("connected");
});