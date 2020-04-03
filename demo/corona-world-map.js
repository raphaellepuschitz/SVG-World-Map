
// Global Variables
var mappanzoom; // For svg-pan-zoom.js
//var mapsvg = document.getElementById('svg-world-map'); // TODO: Needed globally? 
var canvasnew = document.getElementById('canvasnew'); // TODO: Needed globally? 
var chartnew;
var virusdata; // TODO: Needed globally? 
var countrydata; // TODO: Needed globally? 
var daydata = {}; /* Empty object for all days complete data */
var detailcountry = 'World'; // 'World'
var detailprovince = false; 

var day = 0;
var maxdays;

var coronaWorldMap;
var mapSVG = document.getElementById('svg-world-map'); 

var debugout = '';

//console.log(slider);

// Mobile device detection
var ismobile = false; // Initiate as false
if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|ipad|iris|kindle|Android|Silk|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(navigator.userAgent) 
    || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(navigator.userAgent.substr(0,4))) { 
    ismobile = true;
}

// Startup async map + data load, init charts 
loadVirusData();
initStartup();
initChart();
loadSVGMap();

function loadSVGMap() {
    document.getElementById('loading').innerHTML = '~~~ Loading SVG Map ~~~';
    mapSVG.addEventListener("load", function() {
        // Load country data via async request, then startup map init
        var url = '../src/countrydata.json';
        loadFile(url, function(response) {
            countryData = JSON.parse(response); 
            // Custom options
            var params = { 
                showOcean: false,
                //worldColor: '#232323', // Use in next version
                worldColor: '#8AB1B4',
                countryStroke: { out: '#333333',  over: '#333333',  click: '#000000' }, 
                //provinceFill: { out: '#C0C89E',  over: '#CCCCCC',  click: '#999999' },
                provinceFill: { out: '#F2F2F2',  over: '#CCCCCC',  click: '#999999' },
                provinceStroke: { out: '#666666',  over: '#666666',  click: '#666666' }, 
                //provinceStrokeWidth: { out: '0.5',  over: '0.5',  click: '0.5' }, 
                labelFill: { out: '#666666',  over: '#000000',  click: '#000000' },
                mapTimeControls: true
                //mapClick: "mapClick" // Use default callback mapClick()
            };
            // Startup SVG World Map
            coronaWorldMap = svgWorldMap(mapSVG, params, countryData);
            // Test svgPanZoom 
            svgPanZoom = svgPanZoom(mapSVG, { minZoom: 1, dblClickZoomEnabled: false });  //controlIconsEnabled: true, beforePan: beforePan
        });

    }, false);
}

// Asynchronous(!) load for virus data
function loadVirusData() {
    
    document.getElementById('loading').innerHTML = '~~~ Loading Virus Data ~~~';

    // Total new dataset: 
    var url = 'https://coronavirus-tracker-api.herokuapp.com/all';
    loadFile(url, function(response) {
    
        document.getElementById('loading').innerHTML = '~~~ All Data Loaded ~~~';

        //virusdata = parseCSV(response);
        virusdata = JSON.parse(response); 
        //console.log(virusdata);
        //debug("~~~ Virus data loaded ~~~");
    
        document.getElementById('loading').style.display = 'none'; // TODO: Refactor toggleBox()?
    });
}

// Wait untill everything is fully loaded
function initStartup() {
    var startuptimer = window.setInterval(function() {
        if (coronaWorldMap != undefined && virusdata != undefined) {
            window.clearInterval(startuptimer);
            debug("~~~ All data loaded ~~~");
            debug("...... Initializing ......");
            debug("<br>Debug start:");
            debug("ismobile: " + ismobile.toString());
            paused = true; // Set to 'false' for auto start
            initDayData();
        } else if (coronaWorldMap != undefined) {
            // Sometimes the map svg is loaded, but the map and the countries are not. -> TODO: Check loading logic again...
            debug("Map missing!");
            loadSVGMap();
        }
    }, 100);
}

// Add Virus data to daydata object
// TODO: Cleanup & refactor
function initDayData() {

    //console.log(virusdata);

    // TODO: Refactor totaldays logic?
    var firstday = '2020-01-22'; // New first day of virusdata
    var today = new Date().toISOString().split('T')[0];
    var totaldays = getDayDiff(firstday, today); // 2019-12-31 is the earliest date in the dataset, but 2020-01-01 makes more sense

    daydata['World'] = { confirmed: [], recovered: [], deaths: [] };
    var inputDates;
    var inputValues;

    // Add virusdata to daydata object
    for (var key in daydata.World) {
        for (var country in virusdata[key].locations) {
            var location = virusdata[key].locations[country];
            var countrycode = location.country_code;
            var province = location.province;
            var history = location.history;
            // "XX" are several cruise liners (e.g. Diamond Princess) they get mixed up
            if (countrycode == 'XX') {
                countrycode = location.country;
            }
            // Check if country exists in daydata
            if (daydata[countrycode] == undefined) {
                daydata[countrycode] = { 'dates': [] };
                inputDates = daydata[countrycode].dates;
            } else {
                inputDates = false;
            }
            // Check if key exists in country daydata
            if (daydata[countrycode][key] == undefined) {
                daydata[countrycode][key] = [];
            }
            // Check if provinces subobject exists in country daydata
            if (province == '') {
                inputValues = daydata[countrycode][key];
            } else {
                if (daydata[countrycode].provinces == undefined) {
                    daydata[countrycode].provinces = {};
                }
                // Check if province exists in province daydata
                if (daydata[countrycode].provinces[province] == undefined) {
                    daydata[countrycode].provinces[province] = { 'dates': [] };
                    inputDates = daydata[countrycode].provinces[province].dates;
                } else {
                    inputDates = false;
                }
                // Check if key exists in province daydata
                if (daydata[countrycode].provinces[province][key] == undefined) {
                    daydata[countrycode].provinces[province][key] = [];
                }
                inputValues = daydata[countrycode].provinces[province][key];
            }
            // Add data
            for (var h in history) {
                if (inputDates !== false) {
                    inputDates.push(h);
                }
                inputValues.push(history[h]);
            }
        }
    }

    // Check countries with provinces and other teritorries
    for (var country in daydata) {
        // Add data for countries with provinces - currently Australia, Canada, China
        if (daydata[country].provinces != undefined && daydata[country].confirmed.length == 0) {
            for (var province in daydata[country].provinces) {
                var provincedata = daydata[country].provinces[province];
                for (var d=0; d<provincedata.dates.length; d++) {
                    if (daydata[country].dates[d] == undefined) {
                        // Oh Canada... TODO: Check recovered data for CA
                        if (provincedata.recovered == undefined) {  provincedata.recovered = []; }
                        if (provincedata.recovered[d] == undefined) {  provincedata.recovered[d] = 0; }
                        // Add data
                        daydata[country].dates[d] = provincedata.dates[d];
                        daydata[country].confirmed[d] = provincedata.confirmed[d];
                        daydata[country].recovered[d] = provincedata.recovered[d];
                        daydata[country].deaths[d] = provincedata.deaths[d];
                    } else {
                        // Oh Canada... TODO: Check recovered data for CA
                        if (provincedata.recovered == undefined) {  provincedata.recovered = []; }
                        if (provincedata.recovered[d] == undefined) {  provincedata.recovered[d] = 0; }
                        // Add data
                        daydata[country].confirmed[d] += provincedata.confirmed[d];
                        daydata[country].recovered[d] += provincedata.recovered[d];
                        daydata[country].deaths[d] += provincedata.deaths[d];
                    }
                }
            }
        }
    }

    // Move provinces one level up if they are "countries" on the map, e.g. Greenland, Faroe, etc.
    for (var country in coronaWorldMap.countries) {
        var countrycode = coronaWorldMap.countries[country].id;
        if (daydata[countrycode] != undefined) {
            if (daydata[countrycode].provinces != undefined) {
                for (var province in daydata[countrycode].provinces) {
                    for (var subcountry in coronaWorldMap.countries) {
                        if (province == coronaWorldMap.countries[subcountry].name) {
                            var provinceid = getProvinceId('', province); // Get map id (ISO code) of province by name
                            // Copy province to countries in daydata
                            daydata[provinceid] = daydata[countrycode].provinces[province];
                            // Remove province from country
                            delete daydata[countrycode].provinces[province];

                        }
                    }
                }
            }
        /*} else {
            console.log('No data: ' + countrycode + ' / ' + coronaWorldMap.countries[country].name);*/
        }
    }

    // Add world data and missing dates
    daydata['World'].dates = [];
    for (var country in daydata) {
        // Add world data
        for (var d=0; d<daydata[country].dates.length; d++) {
            if (daydata['World'].dates[d] == undefined) {
                daydata['World'].dates[d] = daydata[country].dates[d];
                daydata['World'].confirmed[d] = daydata[country].confirmed[d];
                daydata['World'].recovered[d] = daydata[country].recovered[d];
                daydata['World'].deaths[d] = daydata[country].deaths[d];
            } else {
                daydata['World'].confirmed[d] += daydata[country].confirmed[d];
                daydata['World'].recovered[d] += daydata[country].recovered[d];
                daydata['World'].deaths[d] += daydata[country].deaths[d];
            }
        }
        // Add missing dates to DK, FR, GB, NL (they are empty because of the sub province sort and the original data)
        if (country != 'World' && daydata[country].dates != undefined && daydata[country].dates.length == 0) {
            daydata[country].dates = daydata['CN'].dates; // Copy data from China, it should be filled by now / TODO: Use other method?
            delete daydata[country].provinces; // Delete left provinces, most were moved or sorted before
        }
    }

    // Start all
    // TODO: Cleanup
    maxdays = totaldays - 1; // Set max days for timeline control
    //day = maxdays; // Set day to today
    day = maxdays - 14; // Set day to 14 days ago
    paused = false; // Set to 'false' for auto start

    // TODO: Put into time controls
    // Startup map controls
    //initDayTimer(svg);
    initDayTimer();
    initSilder();
    initControls();
    // Start values for timer controls
    document.getElementById("speed").innerHTML = speed + '00ms';
    document.getElementById("ticks").innerHTML = ticks;

    // Startup all other interfaces
    initCountryList();
    updateDetailStats();
    updateMap(); 
    // Init box toggle
    document.getElementById("togglehelp").click();
    document.getElementById("toggleinfo").click();
    document.getElementById("toggledebug").click();
}

// Update country colors on map
function updateMap() {
    var updateData = {};
    for (var country in coronaWorldMap.countries) {
        var countrycode = coronaWorldMap.countries[country].id;
        if (daydata[countrycode] != undefined) {
            // Main countries
            if (daydata[countrycode].provinces == undefined) {
                if (daydata[countrycode].confirmed[day] > 0 && daydata[countrycode].confirmed[day-1] != undefined) { // Check if last day exists
                    updateData[countrycode] = getCountryColor(daydata[countrycode].confirmed);
                } else {
                    updateData[countrycode] = '#F2F2F2'; // TODO: Check reset color in lib? // #C0C89E #F2F2F2
                }
            // Provinces
            } else {
                for (var province in daydata[countrycode].provinces) {
                    if (daydata[countrycode].provinces[province] != undefined && coronaWorldMap.countryData[countrycode].provinces != undefined) {
                        var provinceid = getProvinceId(countrycode, province); // Get map id (ISO code) of province by name
                        if (daydata[countrycode].provinces[province].confirmed[day] > 0 && daydata[countrycode].provinces[province].confirmed[day-1] != undefined) { // Check if last day exists
                            updateData[provinceid] = getCountryColor(daydata[countrycode].provinces[province].confirmed);
                        } else {
                            updateData[provinceid] = '#F2F2F2'; // TODO: Check reset color in lib?  // #C0C89E #F2F2F2
                        }
                    }
                }
            }
        }
    }
    coronaWorldMap.update(updateData);
}

// Helper function, searches countryData for country or province id
// TODO: Put in main library? 
function getProvinceId(countrycode, province) {
    var returnid;
    if (countrycode == '') {
        var countryprovinces = coronaWorldMap.countryData;
    } else {
        var countryprovinces = coronaWorldMap.countryData[countrycode].provinces;
    }
    Object.keys(countryprovinces).map(key => {
        if (countryprovinces[key].name === province) {
            returnid = key;
        }
    });
    return returnid;
}

// Get country color for map by virusdata
function getCountryColor(countryconfirmed) {
    var confirmednew = (countryconfirmed[day] - countryconfirmed[day-1]);
    var confirmedpercent = Math.ceil((confirmednew / countryconfirmed[day]) * 100);
    return 'rgb(255,' + (180-confirmedpercent) + ',' + (180-confirmedpercent) + ')';
}

// Country detail statistics
function updateDetailStats() {
    var name = coronaWorldMap.countryData[detailcountry].name + ' (' + detailcountry + ')';
    if (daydata[detailcountry] != undefined) {
        // Province
        if (detailprovince != false && daydata[detailcountry].provinces[detailprovince] != undefined) { 
            name = detailprovince + ' (' + coronaWorldMap.countryData[detailcountry].name + ')';
            var location = daydata[detailcountry].provinces[detailprovince];
        // Country
        } else { 
            detailprovince = false; // Reset to avoid errors because of missing province data
            var location = daydata[detailcountry];
        }
        // Output
        var confirmed = location.confirmed[day];
        var recovered = location.recovered[day];
        var deaths = location.deaths[day];
        var confirmednew = (confirmed - location.confirmed[day-1]);
        var growthpercent = Math.ceil((confirmednew / confirmed) * 100);
        var countrydetails = '<b>' + name + '</b><br>Date: ' + location.dates[day];
        countrydetails += '<br><br>Confirmed: ' + formatInteger(confirmed) + '<br>Recovered: ' + formatInteger(recovered) + '<br>Deaths: ' + formatInteger(deaths);
        countrydetails += '<br><br>New confirmed: ' + formatInteger(confirmednew) + '<br>Growth rate/day: ' + growthpercent + '%';
        updateChart();
    // No data
    } else {
        var countrydetails = '<b>' + name + '</b><br>(No data)';
        debug("Detail data missing for: " + name);
    }
    document.getElementById("day").innerHTML = (+day+1)
    document.getElementById("detailstats").innerHTML = countrydetails;
    // TODO: Put slider to time controls
    slider.value = day;
}

// Update charts for new and total cases
// Format: confirmed, recovered, deaths, but reverse for chart
function updateChart() {
    if (daydata[detailcountry] != undefined) {
        if (detailprovince != false) { // Show province on chart
            var chartdata = daydata[detailcountry].provinces[detailprovince];
        } else { // Show main country
            var chartdata = daydata[detailcountry];
        }
        var lastdayindex = chartdata.dates.indexOf(chartdata.dates[day]) + 1;
        charttotal.data.labels = chartdata.dates;
        charttotal.data.datasets[0].data = chartdata.deaths.slice(0, (lastdayindex));// Slice the data at the current day
        charttotal.data.datasets[1].data = chartdata.recovered.slice(0, (lastdayindex));
        charttotal.data.datasets[2].data = chartdata.confirmed.slice(0, (lastdayindex));
        charttotal.update();
    }
}

// TODO: Refactor to CSS classes
function toogleBox() {
    var boxid = event.srcElement.id;
    var target = document.getElementById(boxid.substr(6));
    if (target.style.display == '' || target.style.display == 'block') {
        target.style.display = 'none';
    } else {
        target.style.display = 'block';
    }
}

// Country list
function initCountryList() {
    var countylist = '<ul>';
    for (var country in coronaWorldMap.countries) {
        var countrycode = coronaWorldMap.countries[country].id;
        var countryname = coronaWorldMap.countries[country].name;
        if (daydata[countrycode] != undefined) {
            // Main country
            if (daydata[countrycode].provinces == undefined) {
                countylist += '<li onmouseover="coronaWorldMap.over(\'' + countrycode + '\')" onmouseout="coronaWorldMap.out(\'' + countrycode + '\')" onclick="countryListClick(\'' + countrycode + '\')">' + countryname + '</li>';
            // Province
            } else {
                for (var province in daydata[countrycode].provinces) {
                    //console.log(countrycode + ': ' + province);

                    /*
                    // TODO: Check provinces in SVG...
                    for (var subcountry in coronaWorldMap.countries) {
                        if (province == coronaWorldMap.countries[subcountry].name) {
                            console.log('Found:' + province);
                            console.log(countryname);
                            console.log(province);
                            console.log(daydata[countrycode].provinces[province]);
                        }
                    }
                    */
                }
            }
        /*} else {
            console.log('No data: ' + countrycode + ' / ' + countryname);*/
        }
    }
    countylist += '</ul>';
    document.getElementById("countries").innerHTML = countylist;
}

// Country list click
function countryListClick(countrycode) {
    coronaWorldMap.click(countrycode);
    detailcountry = countrycode;
    updateDetailStats();
}

// Callback function from SVG World Map JS
function mapClick(path) {
    if (path.country != undefined || path.id == 'Ocean' || path.id == 'World') {
        if (path.id == 'Ocean' || path.id == 'World') {
            var countryid = 'World';
        } else {
            var countryid = path.country.id;
        }
        // Provinces
        if (path.province != undefined) {
            var countryid = path.province.country.id;
            var provinceid = path.province.id;
            if (coronaWorldMap.countryData[countryid].provinces != undefined) {
                // Detail province found
                if (coronaWorldMap.countryData[countryid].provinces[provinceid] != undefined) {
                    detailprovince = coronaWorldMap.countryData[countryid].provinces[provinceid].name;
                }
            // Province not found
            } else {
                detailprovince = false;
            }
        // Main countries
        } else if (daydata[countryid] != undefined) {
            detailprovince = false;
        }
        detailcountry = countryid;
        updateDetailStats();
    }
}

// Helper function to not zoom out of the SVG
function beforePan(oldPan, newPan) {
    var stopHorizontal = false, 
        stopVertical = false, 
        //gutterWidth = 100, 
        //gutterHeight = 100, 
        gutterWidth = (mappanzoom.getSizes().width), 
        gutterHeight = (mappanzoom.getSizes().height), 
        // Computed variables, 
        sizes = this.getSizes(), 
        leftLimit = -((sizes.viewBox.x + sizes.viewBox.width) * sizes.realZoom) + gutterWidth, 
        rightLimit = sizes.width - gutterWidth - (sizes.viewBox.x * sizes.realZoom), 
        topLimit = -((sizes.viewBox.y + sizes.viewBox.height) * sizes.realZoom) + gutterHeight, 
        bottomLimit = sizes.height - gutterHeight - (sizes.viewBox.y * sizes.realZoom);

    customPan = {};
    customPan.x = Math.max(leftLimit, Math.min(rightLimit, newPan.x));
    customPan.y = Math.max(topLimit, Math.min(bottomLimit, newPan.y));
    return customPan;
}

// Mouseover, mouseout and click functions for map and countrylist
/*
function countryDblclick(countryid) {
    var bbox = mapcountries[detailcountry].getBBox();
    var center = { x: bbox.x + bbox.width / 2, y: bbox.y  + bbox.height / 2 };
    if (bbox.height < 10) { // get zoom by size
        var zoom = 6;
    } else if (bbox.height < 100) {
        var zoom = 5;
    } else {
        var zoom = 4;
    }
    if (mappanzoom.getZoom() != zoom) { // Zoom in
        mappanzoom.zoomAtPoint(zoom, center);
    } else { // Reset = zoom out to center
        mappanzoom.reset();
    }
    //debug("mappanzoom.getZoom(): " + mappanzoom.getZoom());
}

function worldClick() {
    mapcountries[detailcountry].style.strokeWidth = '1'; // Reset former selected country
    detailcountry = 'World';
    updateDetailStats();
}

function worldDblclick(countryid) {
    mappanzoom.reset(); // Reset pan and zoom
}
*/

// Chart 
function initChart() {
    charttotal = new Chart(canvastotal, {
        type: 'line',
        data: {
            labels: [ 0 ],
            datasets: [{
                label: 'Deaths',
                data: [ 0 ],
                borderWidth: 1,
                backgroundColor: 'rgba(0, 0, 0, .5)'
            }, {
                label: 'Recovered',
                data: [ 0 ],
                borderWidth: 1,
                backgroundColor: 'rgba(0, 200, 0, .5)'
            }, {
                label: 'Confirmed',
                data: [ 0 ],
                borderWidth: 1,
                backgroundColor: 'rgba(200, 0, 0, .5)'
            }]
        },
        options: { scales: { yAxes: [{ ticks: { suggestedMin: 0, suggestedMax: 500 } }] }, legend: { reverse: true } }
    });
}

// Load file helper function
function loadFile(url, callback) {
    var xobj = new XMLHttpRequest();
    //xobj.overrideMimeType("application/json");
    //xobj.open('GET', 'countries.json', true);
    xobj.open('GET', url, true);
    xobj.onreadystatechange = function() {
        if (xobj.readyState === 4 && xobj.status === 200) {
            callback(xobj.responseText);
        }
    };
    xobj.send(null);
}

// Number format helper function
function formatInteger(number) {
    return new Intl.NumberFormat('en-GB').format(number);
}

// Get new object with key-val inverted helper function
function getObjectKeys(object) {
    const ret = {};
    Object.keys(object).forEach(key => {
        ret[object[key]] = key;
    });
    return ret;
}

// Get day difference between two dates helper function
function getDayDiff(date1, date2) {
    const difftime = Math.abs(new Date(date2) - new Date(date1));
    return Math.ceil(difftime / (1000 * 60 * 60 * 24)); 
}

// Helper function for debug
function debug(addvalue) {
    debugout += addvalue + '<br>';
    document.getElementById("debug").innerHTML = debugout;
}



// TODO: Finish library module svg-world-map-time-cotrols.js and get all the following functions from there 

// Map time control variables
var svgMapTimeControls = {};
var slider; 
var timer;
var ticks = 0;
var speed = 10;
var paused = true;

// Interval for day timer
function initDayTimer() {
    timer = window.setInterval(function() {
        if (!paused) {
            increaseDayTicks();
        }
    }, 100);
}

// 'Tick'-logic for days per speed
function increaseDayTicks() {
    ticks++;
    document.getElementById("ticks").innerHTML = ticks;
    //console.log(ticks%speed);
    if (speed == 1 || (ticks % speed) == 1) {
        if (day < maxdays) {
            day++;
            updateMap(); 
            updateDetailStats();
        } else {
            paused = true; // Pause if last day of data is reached
            document.getElementById("playpause").innerHTML = '<i class="flaticon-play"></i>';
        }
    }
}

// Slider control
function initSilder() {
    slider = document.getElementById("daysilder");
    slider.value = 0;
    slider.min = 0;
    slider.max = maxdays;
    // Update the current slider value (each time you drag the slider handle)
    slider.oninput = function() {
        day = slider.value;
        paused = true;
        document.getElementById("playpause").innerHTML = '<i class="flaticon-play"></i>';
        updateDetailStats();
        updateMap();
    } 
}

// Keyboard controls and start values
function initControls() {
    // Keyboard controls
    document.addEventListener('keyup', function(event) {
        if (event.keyCode == 32) { // Space
            document.getElementById("playpause").firstChild.click();
        } else if (event.keyCode == 37) { // Arrow left
            document.getElementById("back").firstChild.click();
        } else if (event.keyCode == 38) { // Arrow up
            document.getElementById("start").firstChild.click();
        } else if (event.keyCode == 39) { // Arrow right
            document.getElementById("forward").firstChild.click();
        } else if (event.keyCode == 40) { // Arrow down
            document.getElementById("end").firstChild.click();
        } else if (event.keyCode == 171) { // Arrow right
            document.getElementById("faster").click();
        } else if (event.keyCode == 173) { // Arrow down
            document.getElementById("slower").click();
        }
    });
}

// Play and pause controls
function clickPlayPause() {
    paused = !paused;
    if (paused) {
        document.getElementById("playpause").innerHTML = '<i class="flaticon-play"></i>';
    } else {
        document.getElementById("playpause").innerHTML = '<i class="flaticon-pause"></i>';
    }
}

// Controls for play, pause, forward, back, start, end
function clickControl() {
    var controlid = event.srcElement.parentNode.id; 
    if (controlid == 'start') {
        day = 0;
    } else if (controlid == 'end') {
        day = maxdays;
    } else if (controlid == 'back' && day > 0) {
        day--;
    } else if (controlid == 'forward' && day < maxdays) {
        day++;
    }
    paused = true;
    document.getElementById("playpause").innerHTML = '<i class="flaticon-play"></i>';
    updateDetailStats();
    updateMap();
}

// Speed controls
function clickSpeed() {
    var speedid = event.srcElement.id;
    if (speedid == 'faster' && speed > 1) {
        speed--;
    } else if (speedid == 'slower' && speed < 20) {
        speed++;
    }
    document.getElementById("speed").innerHTML = speed + '00ms';
}

