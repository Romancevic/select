// Global variables
// initialize the map
var map = L.map('map', {zoomControl:false}).fitWorld();
// new L.Control.Zoom({position: 'bottomleft'}).addTo(map);
var lng = 0;
var lat = 0;
var area = 0;
var country = "";
var capital = "";
var currency = "";
var issTimeoutID;
var issMarker;
var issCircle;
var locationMarker;
var bounds;
var issIcon = L.icon({
    iconUrl: '././media/img/iss.png',
    iconSize: [60, 60],
    iconAnchor: [30, 30],
    popupAnchor: [-3, 16]
});

var locationIcon = L.icon({
    iconUrl: '././media/img/location.png',
    iconSize: [48, 48],
    iconAnchor: [24, 24],
    popupAnchor: [0, -10]
});

var polyStyle = {
    "color": "violet",
    "weight": 5,
    "opacity": 0.9
};

(() => {
    $.ajax({
        url: "libs/php/getCountryList.php",
        type: 'POST',
        dataType: 'json',
        success: function(data) {
            data.data.countryList.forEach((item, id) => {
                let option = $('#selectCountry option').eq(id+1);

                option.text(item.title);
                option.val(item.value);
            })
            $('#selectCountry').eq(0).css('width', '370px')
        },
        error: function(jqXHR, textStatus, errorThrown) {
            alert(`#1 ${textStatus} error in country info`);
        }
    });
})()

// Initialize the map with user location and specifies accuracy in pop up window on the map
function loadMap(){
    // load a tile layer
    L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}',
        {
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors,  Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        maxZoom: 20,
        id: 'mapbox/dark-v10',
  //       style: 'mapbox://styles/romancevic/ckjbckcml0k2n19ted911sr0h', // style URL
        tileSize: 512,
        zoomOffset: -1,

        accessToken: 'pk.eyJ1Ijoicm9tYW5jZXZpYyIsImEiOiJja2oydWticHE1YWxlMzFxanhwZWY0cXV2In0.8SvxMB7LG3xmbsig-XnR_Q'

        }).addTo(map);

  //      mapboxgl.accessToken = 'pk.eyJ1Ijoicm9tYW5jZXZpYyIsImEiOiJja2oydWticHE1YWxlMzFxanhwZWY0cXV2In0.8SvxMB7LG3xmbsig-XnR_Q';
  //          var map = new mapboxgl.map({
  //              container: 'map', // container id
  //              style: 'mapbox://styles/romancevic/ckjbckcml0k2n19ted911sr0h', // style URL
  //              center: [-74.5, 40], // starting position [lng, lat]
  //              zoom: 9 // starting zoom
  //          });

//  mapbox://styles/mapbox/streets-v11
//mapbox://styles/mapbox/outdoors-v11
//mapbox://styles/mapbox/light-v10
//mapbox://styles/mapbox/dark-v10
//mapbox://styles/mapbox/satellite-v9
//mapbox://styles/mapbox/satellite-streets-v11
//mapbox://styles/mapbox/navigation-preview-day-v4
//mapbox://styles/mapbox/navigation-preview-night-v4
//mapbox://styles/mapbox/navigation-guidance-day-v4
//mapbox://styles/mapbox/navigation-guidance-night-v4


    // Location found handler
    function onLocationFound(e) {
        //console.log(e);

        $.ajax({
            url: "libs/php/getUserCountryCode.php",
            type: 'POST',
            dataType: 'json',
            data: {
                lat: e['latlng']['lat'],
                lng: e['latlng']['lng']
            },
            success: function(result){
                //console.log(result);

              	setFlag(result['data']);

                $.ajax({
                    url: "libs/php/getCountryInfo.php",
                    type: 'POST',
                    dataType: 'json',
                    data: {
                        country: result['data'],
                        lang: 'en'
                    },
                    success: function(result){
                        //console.log(result);
                        if(result.status.code == 200){
                           setCountryInfo(result);
                        }
                    },
                    error: function(jqXHR, textStatus, errorThrown){
                        alert(`#1 ${textStatus} error in country info`);
                    }
                });
            },
            error: function(jqXHR, textStatus, errorThrown){
                alert(`#2 ${textStatus} error in country info`);
            }
        });
    }

    // Error handler
    function onLocationError(e) {
        alert(e.message);
    }

    map.on('locationfound', onLocationFound);
    map.on('locationerror', onLocationError);

    map.locate({setView: false, maxZoom: 16});
}

function setCountryInfo(result) {
    // $('#apiCont').empty();

    $.ajax({
        url: "libs/php/getArticles.php",
        type: 'POST',
        dataType: 'json',
        data: {
            country: result['data'][0]['countryName']
        },
        success: function(data) {
            let API = new APINews('News');

            if (data) {
                data = data['articles']['results'];
                let main = data[0];

                Object.defineProperty(main, 'description',
                    Object.getOwnPropertyDescriptor(main, 'body'));
                delete main['body'];

                Object.defineProperty(main, 'urlToImage',
                    Object.getOwnPropertyDescriptor(main, 'image'));
                delete main['image'];

                if (main['authors'][0]) {
                    main['author'] = main['authors'][0]['name']
                }

                main['description'] = main['description'].length > 200 ? main['description'].slice(0, 200) + '...' : main['description'];

                API.addInfos([main])

                API.generateHTML()
            } else {
                API.clear();
            }
        },
        error: function(jqXHR, textStatus, errorThrown){
            alert(`#5 ${textStatus} error in articles info`);
        }
    });

    /* --------------------------------------- */

    $.ajax({
        url: "libs/php/getCovid.php",
        type: 'POST',
        dataType: 'json',
        data: {
            country: result['data'][0]['countryName']
        },
        success: function(data) {
            if (data.length) {
                let main = data[data.length-1];
                let API = new APIComponent('Coronavirus News', 'Stay Safe');

                API.addInfos([
                    {
                        title: 'Confirmed',
                        text: main['Confirmed']
                    },
                    {
                        title: 'Recovered',
                        text: main['Recovered'],
                    },
                    {
                        title: 'Deaths',
                        text: main['Deaths'],
                    },
                    {
                        title: 'Last Update',
                        text: main['Date'],
                        size: 'wide'
                    }
                ])

                API.generateHTML(0)
            }
        },
        error: function(jqXHR, textStatus, errorThrown){
            alert(`#4 ${textStatus} error in covid-19 info`);
        }
    });

    fetch('../../iso.json')
        .then(iso => iso.json())
        .then(iso => {
            $.ajax({
                url: "libs/php/getBorders.php",
                type: 'POST',
                dataType: 'json',
                data: {
                    code: encodeURI(result['data'][0]['countryCode'])
                },
                success: function(data) {
                    let main = data['borders'];

                    if (data['borders']) {
                        main = main.map(it => {
                            let ret = null;

                            for (let i = 0; i < iso.length; i++) {
                                if (iso[i]['alpha-3'] == it) {
                                    ret = iso[i]['alpha-2'];
                                    break;
                                }
                            }

                            if (ret) {
                                return ret;
                            } else {
                                return 'be'
                            }
                        });

                        let API = new APIBorders('Borders');

                        API.addInfos(main)

                        API.generateHTML()
                    }

                    /* ----------------------------- */

                    if (data['timezones']) {
                        let timezones = data['timezones'];

                        timezones = timezones.map(item => {
                            return {
                                title: item
                            }
                        })

                        let APITimezones = new APIComponent('Timezones');

                        APITimezones.addInfos(timezones)

                        APITimezones.generateHTML(1);
                    }

                    /* ----------------------------- */

                    if (data['currencies'][0]['code']) {
                        $.ajax({
                            url: "libs/php/getCurrencies.php",
                            type: 'POST',
                            dataType: 'json',
                            data: {
                                code: encodeURI(data['currencies'][0]['code'])
                            },
                            success: function(info) {
                                let put = [
                                    {
                                        details: info,
                                        currency: data['currencies'][0]['code']
                                    }
                                ];

                                let APICurr = new APICurrency('Currency');

                                APICurr.addInfos(put);

                                APICurr.generateHTML();
                            },
                            error: function(jqXHR, textStatus, errorThrown){
                                alert(`#7 ${textStatus} error in currency info`);
                            }
                        });
                    }
                },
                error: function(jqXHR, textStatus, errorThrown){
                    alert(`#5 ${textStatus} error in borders info`);
                }
            });
        })

    $.ajax({
        url: "libs/php/getWeatherCountry.php",
        type: 'POST',
        dataType: 'json',
        data: {
            capital: encodeURI(result['data'][0]['capital'])
        },
        success: function(info) {

            console.log(info)

            let API = new APIComponent('Current Weather');

            if (info.success !== false) {
                let data = info['current'];

                /* ---------------------------------------- */

                API.addInfos([
                    {
                        title: 'Cloud Cover',
                        text: catcher(data['cloudcover']),
                    },
                    {
                        title: 'Temperature',
                        text: catcher(data['temperature']),
                    },
                    {
                        title: 'Feels Like',
                        text: catcher(data['feelslike']),
                    },
                    {
                        title: 'Visibility',
                        text: catcher(data['visibility']),
                    },
                    {
                        title: 'Wind Speed',
                        text: catcher(data['wind_speed']),
                    },
                    {
                        title: 'Wind Degree',
                        text: catcher(data['wind_degree']),
                    },
                    {
                        title: catcher(data['weather_descriptions'][0]),
                        image: data['weather_icons'][0]
                    },
                ])

                API.generateHTML(2)
            } else {
                API.clear(2)
            }

            /* ---------------------------------------- */

            let APIForecst = new APIComponent('Weather Forecast');

            if (info.success !== false) {
                let main = info['forecast'][Object.keys(info['forecast'])[0]];

                APIForecst.addInfos([
                    {
                        title: 'Average Temp.',
                        text: catcher(main['avgtemp']),
                    },
                    {
                        title: 'Max Temp.',
                        text: catcher(main['maxtemp']),
                    },
                    {
                        title: 'Min Temp',
                        text: catcher(main['mintemp']),
                    },
                    {
                        title: 'Total Snow',
                        text: catcher(main['totalsnow']),
                    },
                    {
                        title: 'Sun Hour',
                        text: catcher(main['sunhour']),
                    },
                ])

                APIForecst.generateHTML(3)
            } else {
                APIForecst.clear(3);
            }

            /* ---------------------------------------- */

            let APINight = new APIComponent('Astro Info');

            if (info.success !== false) {
                let night = info['forecast'][Object.keys(info['forecast'])[0]]['astro'];

                APINight.addInfos([
                    {
                        title: 'Moon Illumination',
                        text: catcher(night['moon_illumination']),
                    },
                    {
                        title: 'Moon Phase',
                        text: catcher(night['moon_phase']),
                    },
                    {
                        title: 'Moon Rise',
                        text: catcher(night['moonrise']),
                    },
                    {
                        title: 'Moon Set',
                        text: catcher(night['moonset']),
                    },
                    {
                        title: 'Sun Rise',
                        text: catcher(night['sunrise']),
                    },
                    {
                        title: 'Sun Set',
                        text: catcher(night['sunset']),
                    },
                ])

                APINight.generateHTML(4)
            } else {
                APINight.clear(4);
            }

            /* ---------------------------------------- */
        },
        error: function(jqXHR, textStatus, errorThrown){
            alert(`#8 ${textStatus} error in weather info`);
        }
    });


    showInfoBtn();
    $('#continent').html(result['data'][0]['continent']);
    capital = result['data'][0]['capital'];
    currency = result['data'][0]['currencyCode'];
    country = result['data'][0]['isoAlpha3'];
  	setCountry(result['data'][0]['countryName']);
    $('#capital').html(capital);
    $('#languages').html(result['data'][0]['languages']);
    $('#population').html(formatPopulation(result['data'][0]['population']));
    lng = (result['data'][0]['north'] + result['data'][0]['south']) / 2;
    lat = (result['data'][0]['east'] + result['data'][0]['west']) / 2;
    $('#area').html(`${formatArea(result['data'][0]['areaInSqKm'])} km<sup>2</sup>`);
    getGeoJson();
    callGeolocation(lng, lat);
}

function catcher(x, y='No Info') {
    return x || y;
}

class API {
    constructor(title, note) {
        this.title = title || 'Example Title';
        this.note = note;
        this.info = [];
    }

    setUp(element) {
        element.append(this.generateHTML());

        return 1;
    }

    addInfo(info) {
        this.info.push(info);

        return 1;
    }

    addInfos(infos) {
        infos.forEach(info => {
            this.addInfo(info);
        })

        return 1;
    }

    generateHTML() {

    }

    clear() {

    }

    show() {

    }
}


class APIComponent extends API {
    constructor(title, note) {
        super(title, note);
    }

    generateHTML(id) {
        this.clear(id)
        this.show(id)

        let api = $('.api').eq(id);

        api.find(`.api-main-title`).text(this.title);

        if (this.note) {
            api.find(`.api-main-note`).text(this.note);
        }

        if (this.info.length > 0) {
            this.info.forEach((item, id) => {
                let info = api.find(`.api-container`).eq(id);

                if (info) {

                    info.addClass(item.size ? item.size : '');

                    if (item.title) {
                        info.find('.api-title').css('display', 'block')
                        info.find('.api-title').text(item.title);
                    } else {
                        info.find('.api-title').css('display', 'none')
                    }

                    if (item.text) {
                        info.find('.api-text').css('display', 'block')
                        info.find('.api-text').text(item.text);
                    } else {
                        info.find('.api-text').css('display', 'none')
                    }

                    if (item.image) {
                        info.find('.api-image').css('display', 'block')
                        info.find('.api-image').attr('src', item.image);
                    } else {
                        info.find('.api-image').css('display', 'none')
                    }

                    if (item.note) {
                        info.find('.api-note').css('display', 'block')
                        info.find('.api-note').text(item.note);
                    } else {
                        info.find('.api-note').css('display', 'none')
                    }

                    if (item.link) {
                        info.find('.api-link').css('display', 'block')
                        info.find('.api-link').attr('href', item.link);
                        info.find('.api-link').text('Get More');
                    } else {
                        info.find('.api-link').css('display', 'none')
                        info.find('.api-link').text('');
                    }
                }
            });

            this.hide(id);

            return 1;
        } else {
            api.css('display', 'none')

            return 0;
        }
    }

    show(id) {
        let api = $('.api').eq(id);
        api.css('display', 'block')
    }

    hide(id) {
        let api = $('.api').eq(id);

        api.find(`.api-container`).each(function (idx) {
            let info = $(this);

            if ((info.find('.api-title').text() + info.find('.api-text').text() + info.find('.api-link').text()).length == 0) {
                info.css('display', 'none')
            }
        })
    }

    clear(id) {
        let api = $('.api').eq(id);
        api.css('display', 'none')
        api.find(`.api-main-title`).text('');
        api.find(`.api-main-note`).text('');

        api.find(`.api-container`).each(function (idx) {
            let info = $(this);

            info.find('.api-title').text('')
            info.find('.api-text').text('')
            info.find('.api-image').css('display', 'none')
            info.find('.api-note').text('')
            info.find('.api-link').css('display', 'none')
            info.find('.api-link').text('')
        })
    }
}

class APINews extends API {
    constructor(title, note) {
        super(title, note);
    }

    generateHTML() {
        this.show();

        let item = this.info[0];

        let item_container = $(`.news_item`);
        $(`.news_item a`).attr('href', item.url);
        $(`.news_title`).text(item.title);
        $(`.news_description`).text(item.description);

        if (item.author) {
            $(`.news_author`).text(item.author);
        }

        item_container.css(`background-image`, `linear-gradient(90deg, rgba(0,0,0,1) 10%, rgba(0,15,18,1) 19%, rgba(0,212,255,0) 100%), url('${item['urlToImage']}')`);


        return 1;
    }

    clear() {
        $(`.news_item`).css('display', 'none');
        $(`.news_item a`).attr('href', '');
        $(`.news_title`).text('');
        $(`.news_description`).text('');
        $(`.news_author`).text('');
    }

    show() {
        $(`.news_item`).css('display', 'block');
    }
}

class APIBorders extends API {
    constructor(title, note) {
        super(title, note);
    }

    generateHTML() {
        this.clear();
        this.show();

        $(`.borders_title`).text(this.title);

        this.info.forEach((item, id) => {
            let item_container = $(`.border`).eq(id);
            item_container.find('img').attr('src', `https://www.countryflags.io/${item}/shiny/64.png`);
            item_container.find('.border_name').text(item);
        })

        this.hide();


        return 1;
    }

    hide() {
        $(`.border`).each(function(id) {
            if (!$(this).find('.border_name').text().length > 0) {
                $(this).css('display', 'none');
            }
        })
    }

    show() {
        $(`.border`).each(function(id) {
            $(this).css('display', 'inline-block');
        })
    }

    clear() {
        $(`.border`).each(function(id) {
            $(this).css('display', 'none');
            $(this).find('img').attr('src', ``);
            $(this).find('.border_name').text('');
        })
    }
}

class APICurrency extends API {
    constructor(title, note) {
        super(title, note);
    }

    generateHTML() {
        this.clear();
        this.show();

        if (!this.info[0].details.error) {
            let rate = !this.info[0].details.error ? this.info[0].details.rates[this.info[0].currency] : 1;

            $(`#currency_input`).change(() => currencyChange(rate, false));
            $(`#currency_output`).change(() => currencyChange(rate, true));
            $(`#currency_output`).attr('value', rate);
            $(`.currency_divider`).text(`USD/${!this.info[0].details.error ? this.info[0].currency : 'USD'}`);

            currencyChange(rate, false)
        } else {
            this.clear();
        }

        return 1;
    }

    clear() {
        $(`.currency`).css('display', 'none');
        $(`#currency_input`).attr('value', 1);
        $(`#currency_output`).change(() => {});
        $(`#currency_input`).change(() => {});
        $(`#currency_output`).val(0);
        $(`#currency_input`).val(1);
    }

    show() {
        $(`.currency`).css('display', 'grid');
    }
}

function currencyChange(k, reverse) {
    k = k*1;

    if (reverse) {
        $('#currency_input').val(($('#currency_output').val() * (1/k)).toFixed(3))
    } else {
        $('#currency_output').val(($('#currency_input').val() * k).toFixed(3))
    }
}

// Handles map click event
function onMapClick(e) {

	$('.loadingCountry').show();

    $.ajax({
        url: "libs/php/getUserCountryCode.php",
        type: 'POST',
        dataType: 'json',
        data: {
            lat: e['latlng']['lat'],
            lng: e['latlng']['lng']
        },
        success: function(result){
            setFlag(result['data']);
            $.ajax({
                url: "libs/php/getCountryInfo.php",
                type: 'POST',
                dataType: 'json',
                data: {
                    country: result['data'],
                    lang: 'en'
                },
                success: function(result){

                	if(result.data[0].countryName == $('#country-name').text()) {

                		$('.loadingCountry').hide();

                		return false;
                	}
                    if(result.status.code == 200){
                       setCountryInfo(result);
                    }
                },
                error: function(jqXHR, textStatus, errorThrown){
                    alert(`${textStatus} error in user country info`);
                }
            });
        },
        error: function(jqXHR, textStatus, errorThrown){
            alert(`#3 ${textStatus} error in country info`);
        }
    });
}

map.on('click', onMapClick);

// Handles country selection option event
$('#selectCountry').change(function(){

	$('.loadingCountry').show();

    showInfoBtn();
    emptyTable('#table2');
    stopISS();
    $.ajax({
        url: "libs/php/getCountryInfo.php",
        type: 'POST',
        dataType: 'json',
        data: {
            country: $('#selectCountry').val(),
            lang: 'en'
        },
        success: function(result){

        	if(result.data[0].countryName == $('#country-name').text()) {

        		$('.loadingCountry').hide();

        		return false;
        	}

            if(result.status.code == 200){
               setFlag($('#selectCountry').val());
               setCountryInfo(result);
            }
        },
        error: function(jqXHR, textStatus, errorThrown){
            alert(`#4 ${textStatus} error in country info`);
        }
    });
});

function updateCounry(code) {
    showInfoBtn();
    emptyTable('#table2');
    stopISS();
    $.ajax({
        url: "libs/php/getCountryInfo.php",
        type: 'POST',
        dataType: 'json',
        data: {
            country: code,
            lang: 'en'
        },
        success: function(result){

            if(result.data[0].countryName == code) {

                $('.loadingCountry').hide();

                return false;
            }

            if(result.status.code == 200){
                setFlag(code);
                setCountryInfo(result);
            }
        },
        error: function(jqXHR, textStatus, errorThrown){
            alert(`#4 ${textStatus} error in country info`);
        }
    });
}

// info modal button trigger handler
$('#infoModal').on('shown.bs.modal', function () {
    $('#myInput').trigger('focus');
  });

function callGeolocation(lng, lat) {
    $.ajax({
        url: "libs/php/getGeolocation.php",
        type: 'POST',
        dataType: 'json',
        data: {
            q: (lng).toString() + ',' + (lat).toString(),
            lang: 'en'
        },
        success: function(result){

            //console.log(result);

            if(result.status.code == 200){
                $('#currency').html(currency);
                getWeatherData();
                getExchangeRateData();
                getISSData();
            }
        },
        error: function(jqXHR, textStatus, errorThrown){
            alert(`${textStatus} error in geolocation`);
        }
    });
}

// handles ISS tracking mode
$('#btnISS').click(function() {
    if($('#btnISS').html() === 'Track ISS'){
        hideInfoBtn();
        trackISS();
    $('#btnISS').html('Stop ISS');
    }else {
        stopISS();
        $('#btnISS').html('Track ISS');
        map.locate({setView: true, maxZoom: 5});
    }
});

// Updates map with specified latitude and longitude(west subtracted from east)
function updateMarker(lng, lat){
	//console.log(lng, lat)
    if(locationMarker != undefined){
        map.removeLayer(locationMarker);
    }
    locationMarker = L.marker([lng, lat], {icon: locationIcon}).addTo(map);
    $('.loadingCountry').hide();
};


// handles ISS tracking on the map updating it every 3 sec with custom marker
function trackISS () {
    $.ajax({
        url: "libs/php/getIssPosition.php",
        type: 'GET',
        dataType: 'json',
        success: function(result){
            //console.log(result);
            if(result){
                updateISSMarker(result['latitude'],
                result['longitude']);
            }
        },
        error: function(jqXHR, textStatus, errorThrown){
            alert(`Error in ISS pos: ${textStatus} ${errorThrown} ${jqXHR}`);
        }
    });
     issTimeoutID = setTimeout(trackISS, 3000);
}

// ISS marker and circle update function
function updateISSMarker(lat, lon) {
    if(issMarker != undefined && issCircle != undefined){
        map.removeLayer(issMarker);
        map.removeLayer(issCircle);
    }
    issMarker = new L.marker([lat, lon], {icon: issIcon}).addTo(map);
    issCircle = new L.circle([lat, lon], {color: 'gray', opacity: .5}).addTo(map);

    map.flyTo([lat, lon], zoomOffset=5, animate=true);
}

// stops ISS tracking on map
function stopISS() {
    clearTimeout(issTimeoutID);
}

// get current weather open weather api
function getWeatherData(){
    $.ajax({
        url: "libs/php/getWeather.php",
        type: 'POST',
        dataType: 'json',
        data: {
            q: capital
        },
        success: function(result){
            if(result.cod == 200){
                //console.log(result);
                $('#temperature').html(`${Math.floor(parseFloat(result['main']['temp']) - 273.15)} <sup>o</sup>C`);
                $('#humidity').html(`${result['main']['humidity']} %`);
                $('#pressure').html(`${result['main']['pressure']} hPa`);
                lng = result['coord']['lon'];
                lat = result['coord']['lat'];
                updateMarker(result['coord']['lat'], result['coord']['lon']);
                locationMarker.bindPopup(`Capital: ${capital}`).openPopup();
            } else {
            	$('.loadingCountry').hide();
            }
        },
        error: function(jqXHR, textStatus, errorThrown){
            alert(`Error in weather: ${textStatus} : ${errorThrown} : ${jqXHR}`);
        }
    });
}


// get exchange rate open exchange rate api
function getExchangeRateData() {
	return false;
    $.ajax({
        url: "libs/php/getExchangeRate.php",
        type: 'GET',
        dataType: 'json',
        success: function(result){
            if(result){
                //console.log(result);
                $('#exchangeTitle').html(`USD/${currency} XR:`);
                $('#exchangeRate').html(result['rates'][currency]);
            }
        },
        error: function(jqXHR, textStatus, errorThrown){
            alert(`Error in exchange: ${textStatus} ${errorThrown} ${jqXHR}`);
        }
    });
}

// get iss pass data from n2yo api
function getISSData() {
	return false;
    $.ajax({
        url: "libs/php/getIssData.php",
        type: 'POST',
        dataType: 'json',
        data: {
            lat: lat,
            lng: lng
        },
        success: function(result){
            if(result['passes']){
                //console.log(result);
                $('#issPass').html(`Predicted ISS passes for next 10 days over ${capital}`);
                if(result['passes']){
                    result['passes'].forEach(function (d) {
                        var date = new Date(d['startUTC']*1000);
                        $('#table2').append('<tr><th>' + "<img src='././media/img/iss.svg'></img>" + '</th><td>' + date.toString() + '</td></tr>');
                    }
                    );
                }else {
                    $('#issPass').html(`No visible ISS passes over ${capital} in next 10 days`);
                }
            }else {
                $('#issPass').html(`No visible ISS passes over ${capital} in next 10 days`);
            }
        },
        error: function(jqXHR, textStatus, errorThrown){
            alert(`Error in iss data: ${textStatus} : ${errorThrown} : ${jqXHR}`);
        }
    });
}

  // get specific country border data from geojson file
function getGeoJson() {
    $.ajax({
        url: "libs/php/getCountryPolygon.php",
        type: 'POST',
        dataType: 'json',
        data: {
            iso3: 'it',
            country: country
        },
        success: function(result){
            if(result){
                if (result.data.countryInfo.geonames.length > 0) {
                    if(bounds != undefined){
                        map.removeLayer(bounds);
                    }
                    bounds = L.geoJSON(result.data.border, {style: polyStyle}).addTo(map);
                    map.flyToBounds(bounds.getBounds(), {
                        animate: true,
                        duration: 2.5
                    });
                } else {
                    alert('Данные для данного места не найдены!')
                }
            }
        },
        error: function(jqXHR, textStatus, errorThrown){
            alert(`Error in geojson: ${textStatus} ${errorThrown} ${jqXHR}`);
        }
    });
}

function emptyTable(tabID) {
    $(tabID).empty();
}

function startTime() {
    $('#date-time').html(`Date: ${new Date().toLocaleString()}`);
    setTimeout(startTime, 1000);
}

function showInfoBtn() {
    $('#btnInfo').css("display", "block");
}

function hideInfoBtn() {
    $('#btnInfo').css("display", "none");
}

function formatPopulation(num){
    let pop = parseInt(num);
    if(pop/1000000 > 1){
        return `${(pop/1000000).toFixed(2)} mln`;
    }else if(pop/1000 > 1){
        return `${(pop/1000).toFixed(2)} k`;
    }else {
        return `${pop.toFixed()}`;
    }
}

function formatArea(num){
    let area = Number(num).toPrecision();
    if(area/1000000 > 1){
        return `${(area/1000000).toFixed(2)} mln`;
    }else if(area/1000 > 1) {
        return `${(area/1000).toFixed(2)} k`
    }else {
        return `${area}`;
    }
}

function setCountry(countryName) {
    $('#country-name').html(countryName);
}

function setFlag(iso2code) {
    $('#country-flag').html(`<img src="https://www.countryflags.io/${iso2code}/shiny/64.png"></img>`);
}
