// SVG World Map JS Demo

// Global Variables
var mapSVG; 
var svgInit = false;
var svgLoaded = false;
var coronaWorldMap; // For svg-world-map.js
var svgPanZoom; // For svg-pan-zoom.js
var virusData; 
var countryData; 
var dayData = {}; // Empty object for all days complete data 
var timeData = []; // Empty array for time controls
var detailcountry = 'World'; // 'World'
var detailprovince = false; 
var smallScreen = false; 
var isMobile = false; 
var day = 0;

// Startup async map + data load, init charts 
checkSize();
checkMobile();
loadCountryData();
initStartup();
initCharts();

// Wait untill everything is fully loaded
function initStartup() {
    var waitcounter = 0;
    var startuptimer = window.setInterval(function() {
        waitcounter++
        if (waitcounter > 20) { // Wait 20 * 500ms = 10s for data answer
            window.clearInterval(startuptimer);
            var url = location.protocol+'//'+location.host+location.pathname;
            document.getElementById('loading').innerHTML = '~~~ There seems to be a problem ~~~<br><br>Try again with <a href="' + url + '?api=1">API 1</a>, <a href="' + url + '?api=2">API 2</a> or <a href="' + url + '?api=3">fallback</a>';
        } else if (virusData == undefined) {
            document.getElementById('loading').innerHTML = '~~~ Loading Virus Data ~~~';
        } else if (svgInit == false && svgLoaded == false && countryData != undefined && virusData != undefined && timeData.length > 1) {
            document.getElementById('loading').innerHTML = '~~~ Loading SVG Map ~~~';
            loadSVGMap();
            svgInit = true;
        } else if (svgLoaded == true && countryData != undefined && virusData != undefined && timeData.length > 1 && document.getElementById('map-slider') != null) {
            window.clearInterval(startuptimer);
            document.getElementById('loading').innerHTML = '~~~ All Data Loaded ~~~';
            initSVGMap();
        }
    }, 500);
}

// Asynchronous load for SVG map
async function loadSVGMap() {
    // Custom options
    var params = { 
        showOcean: false,
        showInfoBox: true, 
        //worldColor: '#232323', // Use in next version
        worldColor: '#8AB1B4',
        countryStroke: { out: '#333333',  over: '#333333',  click: '#000000' }, 
        //provinceFill: { out: '#C0C89E',  over: '#CCCCCC',  click: '#999999' },
        provinceFill: { out: '#F2F2F2',  over: '#CCCCCC',  click: '#999999' },
        provinceStroke: { out: '#FFFFFF',  over: '#666666',  click: '#666666' }, 
        //provinceStrokeWidth: { out: '0.5',  over: '0.5',  click: '0.5' }, 
        labelFill: { out: '#666666',  over: '#000000',  click: '#000000' },
        timeControls: true, // Activate time antimation controls
        timePause: true, // No autostart
        timeLoop: false // No loop
        //mapClick: "mapClick" // Use default callback mapClick()
    };
    // Startup SVG World Map
    coronaWorldMap = await svgWorldMap(params, countryData, timeData);
    mapSVG = coronaWorldMap.worldMap;
    svgLoaded = true;
}

// SVG map start
function initSVGMap() {
    if (svgLoaded == true && timeData.length > 1) {
        // Change start day
        document.getElementById('map-slider').value = timeData.length - 14; // Start 2 weeks ago
        document.getElementById('map-slider').oninput();
        document.getElementById('map-control-play-pause').click();
        // Build country list 
        initCountryList();
        // Init svgPanZoom library
        svgPanZoom = svgPanZoom(mapSVG, { minZoom: 1, dblClickZoomEnabled: false });  //controlIconsEnabled: true, beforePan: beforePan
        if (smallScreen == false) {
            svgPanZoom.pan({ x: -90, y: 0 }); // Set map to better start position for big horizontal screens
        } else if (smallScreen == 'portrait') {
            svgPanZoom.pan({ x: -5, y: 170 }); // Set map to better start position for small vertical screens
            svgPanZoom.zoomBy(1.4); // Zoom in for small screens
        } else if (smallScreen == 'landscape') {
            svgPanZoom.pan({ x: -5, y: 20 }); // Set map to better start position for small horizontal screens
            svgPanZoom.zoomBy(1.1); // Zoom in for small screens
        }
        // Hide loading and show boxes and map after startup
        toggleBox('loading');
        toggleBox('settings');
        if (smallScreen != 'landscape') {
            toggleBox('details'); 
        }
        if (smallScreen == false) {
            toggleBox('countries');
        }
        // Fadein with opacity 
        document.getElementById('details').style.visibility = 'visible';
        document.getElementById('settings').style.visibility = 'visible';
        document.getElementById('countries').style.visibility = 'visible';
        document.getElementById('svg-world-map-container').style.visibility = 'visible';
        setTimeout(function() {
            document.getElementById('details').style.opacity = 1;
            document.getElementById('settings').style.opacity = 1;
            document.getElementById('countries').style.opacity = 1;
            document.getElementById('svg-world-map-container').style.opacity = 1;
        }, 200);
    }
}

// Callback function from the time control module, defined in 'options.mapDate'
function mapDate(updateDate) {
    day = updateDate;
    updateDetails();
    // Update day date info
    var daydate = new Date(document.getElementById('map-date').innerHTML).toString().split(' ');
    if (daydate[1] != 'May') { daydate[1] = daydate[1] + '.' }
    document.getElementById('map-date').innerHTML = daydate[2] + ' ' + daydate[1] + ' ' + daydate[3];
}

// Asynchronous load for country data
function loadCountryData() {
    // Load country data via async request, then startup map init
    var url = '../src/country-data.json';
    loadFile(url, function(response) {
        countryData = JSON.parse(response); 
        loadVirusData(); // Load virus data after country data is conplete
    });
}

// Asynchronous load for virus data
function loadVirusData() {
    document.getElementById('loading').innerHTML = '~~~ Loading Virus Data ~~~';
    // Switch API urls if needed
    var url1 = 'https://coronavirus-tracker-api.herokuapp.com/all'; // Main URL from Github project page
    var url2 = 'https://covid-tracker-us.herokuapp.com/all'; // Backup URL found in Github issues
    var url3 = '../demo/js/corona-data-fallback.json'; // Local fallback 
    var url = url1; // Default URL is API 1
    if (window.location.search != '') {
        var query = window.location.search.substr(1).split('=');
        if (query[0] == 'api' && !isNaN(query[1])) {
            url = eval('url' + query[1]);
        }
    }
    loadFile(url, function(response) {
        virusData = JSON.parse(response); 
        initDayData();
    });
}

// Add Virus data to dayData object
// TODO: Cleanup & refactor
function initDayData() {

    dayData['World'] = { confirmed: [], recovered: [], deaths: [] };
    var inputDates;
    var inputValues;

    // Add virusdata to dayData object
    for (var key in dayData.World) {
        for (var country in virusData[key].locations) {
            var location = virusData[key].locations[country];
            var countrycode = location.country_code;
            var province = location.province;
            var history = location.history;
            // "XX" are several cruise liners (e.g. Diamond Princess) they get mixed up
            if (countrycode == 'XX') {
                countrycode = location.country;
            }
            // Check if country exists in dayData
            if (dayData[countrycode] == undefined) {
                dayData[countrycode] = { 'dates': [] };
                inputDates = dayData[countrycode].dates;
            } else {
                inputDates = false;
            }
            // Check if key exists in country dayData
            if (dayData[countrycode][key] == undefined) {
                dayData[countrycode][key] = [];
            }
            // Check if provinces subobject exists in country dayData
            if (province == '') {
                inputValues = dayData[countrycode][key];
            } else {
                if (dayData[countrycode].provinces == undefined) {
                    dayData[countrycode].provinces = {};
                }
                // Check if province exists in province dayData
                if (dayData[countrycode].provinces[province] == undefined) {
                    dayData[countrycode].provinces[province] = { 'dates': [] };
                    inputDates = dayData[countrycode].provinces[province].dates;
                } else {
                    inputDates = false;
                }
                // Check if key exists in province dayData
                if (dayData[countrycode].provinces[province][key] == undefined) {
                    dayData[countrycode].provinces[province][key] = [];
                }
                inputValues = dayData[countrycode].provinces[province][key];
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
    for (var country in dayData) {
        // Add data for countries with provinces - currently Australia, Canada, China
        if (dayData[country].provinces != undefined && dayData[country].confirmed.length == 0) {
            for (var province in dayData[country].provinces) {
                // Add active cases and new confirmed array for country
                dayData[country].activecases = [];
                dayData[country].confirmednew = [];
                var provincedata = dayData[country].provinces[province];
                for (var d=0; d<provincedata.dates.length; d++) {
                    // Add active cases and new confirmed to province
                    if (provincedata.confirmednew == undefined) {
                        provincedata.activecases = [];
                        provincedata.confirmednew = [];
                        provincedata.activecases[d] = 0;
                        provincedata.confirmednew[d] = 0;
                    } else {
                        var activecases = parseInt(dayData[country].confirmed[d]) - parseInt(dayData[country].recovered[d]);
                        var confirmednew = parseInt(dayData[country].confirmed[d]) - parseInt(dayData[country].confirmed[d-1]);
                        if (confirmednew < 0) { confirmednew = 0; }
                        provincedata.activecases[d] = activecases;
                        provincedata.confirmednew[d] = confirmednew;
                    }
                    // Add parent country data
                    if (dayData[country].dates[d] == undefined) {
                        // Oh Canada... TODO: Check recovered data for CA
                        if (provincedata.recovered == undefined) {  provincedata.recovered = []; }
                        if (provincedata.recovered[d] == undefined) {  provincedata.recovered[d] = 0; }
                        // Add data
                        dayData[country].dates[d] = provincedata.dates[d];
                        dayData[country].confirmed[d] = provincedata.confirmed[d];
                        dayData[country].recovered[d] = provincedata.recovered[d];
                        dayData[country].deaths[d] = provincedata.deaths[d];
                        dayData[country].activecases[d] = provincedata.activecases[d];
                        dayData[country].confirmednew[d] = provincedata.confirmednew[d];
                    } else {
                        // Oh Canada... TODO: Check recovered data for CA
                        if (provincedata.recovered == undefined) {  provincedata.recovered = []; }
                        if (provincedata.recovered[d] == undefined) {  provincedata.recovered[d] = 0; }
                        // Add data
                        dayData[country].confirmed[d] += provincedata.confirmed[d];
                        dayData[country].recovered[d] += provincedata.recovered[d];
                        dayData[country].deaths[d] += provincedata.deaths[d];
                        dayData[country].activecases[d] += provincedata.activecases[d];
                        dayData[country].confirmednew[d] += provincedata.confirmednew[d];
                    }
                }
            }
        }
    }

    // Move provinces one level up if they are "countries" on the map, e.g. Greenland, Faroe, etc.
    for (var country in countryData) {
        var countrycode = country;
        if (dayData[countrycode] != undefined) {
            if (dayData[countrycode].provinces != undefined) {
                for (var province in dayData[countrycode].provinces) {
                    for (var subcountry in countryData) {
                        if (province == countryData[subcountry].name) {
                            var provinceid = getProvinceId('', province); // Get map id (ISO code) of province by name
                            // Copy province to countries in dayData
                            dayData[provinceid] = dayData[countrycode].provinces[province];
                            // Remove province from country
                            delete dayData[countrycode].provinces[province];
                        }
                    }
                }
            }
        } else {
            //console.log('No data: ' + countrycode + ' / ' + coronaWorldMap.countries[country].name);
        }
    }

    // Add world data, computed values and missing dates
    dayData['World'].dates = [];
    for (var country in dayData) {
        // Add missing dates to DK, FR, GB, NL (they are empty because of the sub province sort and the original data)
        if (country != 'World' && dayData[country].dates != undefined && dayData[country].dates.length == 0) {
            dayData[country].dates = dayData['CN'].dates; // Copy data from China, it should be filled by now / TODO: Use other method?
            delete dayData[country].provinces; // Delete left provinces, most were moved or sorted before
        }
        // Add active cases and new confirmed array for country
        dayData[country].activecases = [];
        dayData[country].confirmednew = [];
        // Add reproduction array for country
        //dayData[country].reproduction = [];
        // Add active cases and new confirmed, reproduction and world data
        for (var d=0; d<dayData[country].dates.length; d++) {
            // Add active cases and new confirmed data
            var activecases = parseInt(dayData[country].confirmed[d]) - parseInt(dayData[country].recovered[d]);
            dayData[country].activecases.push(activecases);
            if (dayData[country].confirmed[d-1] != undefined) {
                var confirmednew = parseInt(dayData[country].confirmed[d]) - parseInt(dayData[country].confirmed[d-1]);
                if (confirmednew < 0) { confirmednew = 0; }
                dayData[country].confirmednew.push(confirmednew);
            } else {
                dayData[country].confirmednew.push(0);
            }
            // Compute R0 over 4 days: D(t) = (N(t)+N(t-1)+N(t-2)+N(t-3))/4 
            // See: https://www.heise.de/newsticker/meldung/Corona-Pandemie-Die-Mathematik-hinter-den-Reproduktionszahlen-R-4712676.html
            /*if (dayData[country].confirmed[d-3] != undefined) {
                var R4 = parseFloat(((dayData[country].confirmed[d] + dayData[country].confirmed[d-1] + dayData[country].confirmed[d-2] + dayData[country].confirmed[d-3]) / 4).toPrecision(5));
                var R0t4 = parseFloat(((dayData[country].confirmed[d] - R4) / 100).toPrecision(5));
                dayData[country].reproduction.push(R0t4);
            } else {
                dayData[country].reproduction.push(0);
            }*/
            // Add world data
            if (dayData['World'].dates[d] == undefined) {
                dayData['World'].dates[d] = dayData[country].dates[d];
                dayData['World'].confirmed[d] = dayData[country].confirmed[d];
                dayData['World'].recovered[d] = dayData[country].recovered[d];
                dayData['World'].deaths[d] = dayData[country].deaths[d];
                dayData['World'].activecases[d] = dayData[country].activecases[d];
                dayData['World'].confirmednew[d] = dayData[country].confirmednew[d];
                //dayData['World'].reproduction[d] = dayData[country].reproduction[d];
            } else {
                dayData['World'].confirmed[d] += dayData[country].confirmed[d];
                dayData['World'].recovered[d] += dayData[country].recovered[d];
                dayData['World'].deaths[d] += dayData[country].deaths[d];
                dayData['World'].activecases[d] += dayData[country].activecases[d];
                dayData['World'].confirmednew[d] += dayData[country].confirmednew[d];
                //dayData['World'].reproduction[d] += dayData[country].reproduction[d];
            }
        }
    }

    initTimeData();
}

// Build timeData for SVG map time animation
// TODO: Cleanup & refactor
function initTimeData() {
    for (var d=0; d<dayData['World'].dates.length; d++) {
        var datekey = dayData['World'].dates[d];
        timeData[d] = { [datekey]: {} }; // Add new empty sub object for countries to array
        //console.log(datekey);
        for (var country in dayData) {
            if (country != 'World') {
                // Show province details only on bigMap
                if (dayData[country].provinces != undefined && smallScreen == false) {
                    for (var province in dayData[country].provinces) {
                        if (dayData[country].provinces[province] != undefined && countryData[country].provinces != undefined) {
                            var provinceid = getProvinceId(country, province); // Get map id (ISO code) of province by name
                            if (provinceid != undefined) {
                                timeData[d][datekey][provinceid] = getCountryColor(dayData[country].provinces[province].confirmed[d], dayData[country].provinces[province].recovered[d]);
                            } else {
                                // console.log(country + ' / ' + province); // Canada recovered and cruise ships
                            }
                        }
                    }
                } else {
                    timeData[d][datekey][country] = getCountryColor(dayData[country].confirmed[d], dayData[country].recovered[d]);
                }
            }
        }
    }
}

// Helper function, searches countryData for country or province id
// TODO: Put in main library? 
function getProvinceId(countrycode, province) {
    var returnid;
    if (countrycode == '') {
        var countryprovinces = countryData;
    } else {
        var countryprovinces = countryData[countrycode].provinces;
    }
    Object.keys(countryprovinces).map(key => {
        if (countryprovinces[key].name === province) {
            returnid = key;
        }
    });
    return returnid;
}

// Get country color for map 
function getCountryColor(confirmed, recovered) {
    var factor = (confirmed - recovered) / confirmed;
    if (isNaN(factor)) { factor = 0; }
    var color = parseInt(factor * 128);
    if (factor == 0) {
        return 'rgb(255,255,255)'; // white
    } else if (factor > 0.5) { // red
        return 'rgb(255,' + (255-color) + ',' + (255-color) + ')';
    } else if (factor > 0.3) { // orange
        return 'rgb(255,' + (160+color) + ',160)';
    } else { // green
        return 'rgb(' + (160+color) + ',255,' + (160+color) + ')';
    }
}

// Update details
function updateDetails() {
    // Avoid 'undefined Date' at midnight
    if (dayData['World'].confirmed[day] == undefined) { 
        day--; 
    }
    // Update charts (first?)
    updateCharts();
    // Update world stats
    var countrydetails = updateStats('World'); 
    document.getElementById('worldstats').innerHTML = countrydetails;
    // Update detail stats
    if (dayData[detailcountry] != undefined && detailcountry != 'World') {
        var countrydetails = updateStats(detailcountry);
        document.getElementById('countrystats').innerHTML = countrydetails;
        if (detailprovince != false) {
            document.getElementById('countrytitle').innerHTML = detailprovince + ' (' + countryData[detailcountry].name + ')';
        } else {
            document.getElementById('countrytitle').innerHTML = countryData[detailcountry].name;
        }
        document.getElementById("help").classList.add("hidden");
        document.getElementById("countrydetails").classList.remove("hidden");
        document.getElementById("countrytitle").classList.remove("hidden");
    } else {
        document.getElementById("countrydetails").classList.add("hidden");
        document.getElementById("countrytitle").classList.add("hidden");
        document.getElementById("help").classList.remove("hidden");
    }
    // Update country list
    updateCountryList();
}

// Update statistics
function updateStats(country) {
    if (dayData[country] != undefined) {
        // Province
        if (detailprovince != false && dayData[country].provinces != undefined && dayData[country].provinces[detailprovince] != undefined) { 
            var location = dayData[country].provinces[detailprovince];
        // Country
        } else { 
            var location = dayData[country];
        }
        // Set output data
        var confirmed = location.confirmed[day];
        var recovered = location.recovered[day];
        var deaths = location.deaths[day];
        var confirmednew = location.confirmednew[day];
        var activecases = location.activecases[day];
        if (location.confirmed[day-1] == undefined) { location.confirmed[day-1] = 0; } // For first day
        if (location.recovered[day-1] == undefined) { location.recovered[day-1] = 0; } 
        if (location.deaths[day-1] == undefined) { location.deaths[day-1] = 0; } 
        if (location.confirmednew[day-1] == undefined) { location.confirmednew[day-1] = 0; } 
        if (location.activecases[day-1] == undefined) { location.activecases[day-1] = 0; } 
        var confirmednewpercent = Math.floor((confirmednew / confirmed) * 100);
        var recoverednew = (recovered - location.recovered[day-1]);
        var recoveredpercent = Math.floor(((recovered - deaths) / confirmed) * 100);
        var recoverednewpercent = Math.floor((recoverednew / confirmed) * 100);
        var deathsnew = (deaths - location.deaths[day-1]);
        var deathspercent = Math.floor((deaths / confirmed) * 100);
        var deathsnewpercent = Math.floor((deathsnew / confirmed) * 100);
        var activenew = (activecases - location.activecases[day-1]);
        var activepercent = Math.floor((activecases / confirmed) * 100);
        var activenewpercent = Math.floor((activenew / confirmed) * 100);
        if (activenew > 0) { var activegrowth = '+'; } else { var activegrowth = ''; }
        // Output
        var countrydetails = '';
        countrydetails += '<div class="totalcount"><span class="big red">' + formatInteger(confirmed) + '</span><span class="small">Confirmed Cases</span><br>';
        countrydetails += '<span class="big orange">' + formatInteger(activecases) + '</span><span class="small">Active Cases (' + activepercent + '%)</span><br>';
        countrydetails += '<span class="big green">' + formatInteger(recovered) + '</span><span class="small">Recovered (' + recoveredpercent + '%)</span><br>';
        countrydetails += '<span class="big black">' + formatInteger(deaths) + '</span><span class="small">Deaths (' + deathspercent + '%)</span></div>';
        /*if (location.reproduction != undefined) {
            countrydetails += '<span class="big">' + location.reproduction[day].toPrecision(4) + '</span><span class="small">Reproduction Rate</span>';
        }*/
        countrydetails += '<div class="onedaycount small">Last 24 hours:<br>';
        countrydetails += '<span class="red">+' + formatInteger(confirmednew) + '</span> Conf. (+' + confirmednewpercent + '%)';
        countrydetails += '<span class="orange">' + activegrowth + formatInteger(activenew) + '</span> Active (' + activegrowth + activenewpercent + '%)<br>';
        countrydetails += '<span class="green">+' + formatInteger(recoverednew) + '</span> Rec. (+' + recoverednewpercent + '%)';
        countrydetails += '<span class="black">+' + formatInteger(deathsnew) + '</span> Deaths (+' + deathsnewpercent + '%)</div>';
    }
    return countrydetails;
}

// Update charts for world and selected country
// Format: confirmed, recovered, deaths, but reverse for chart
function updateCharts() {
    // World chart
    var lastdayindex = dayData['World'].dates.indexOf(dayData['World'].dates[day]) + 1;
    chartworld.data.labels = dayData['World'].dates;
    chartworld.data.datasets[0].data = dayData['World'].deaths.slice(0, (lastdayindex)); // Slice data at current day
    chartworld.data.datasets[1].data = dayData['World'].recovered.slice(0, (lastdayindex));
    chartworld.data.datasets[2].data = dayData['World'].activecases.slice(0, (lastdayindex));
    chartworld.data.datasets[3].data = dayData['World'].confirmed.slice(0, (lastdayindex));
    chartworld.update();
    chartworldnew.data.labels = dayData['World'].dates;
    chartworldnew.data.datasets[0].data = dayData['World'].confirmednew.slice(0, (lastdayindex)); // Slice data at current day
    chartworldnew.update();
    // Country chart
    if (dayData[detailcountry] != undefined && detailcountry != 'World') {
        if (detailprovince != false) { // Show province on chart
            var chartdata = dayData[detailcountry].provinces[detailprovince];
        } else { // Show main country
            var chartdata = dayData[detailcountry];
        }
        var lastdayindex = chartdata.dates.indexOf(chartdata.dates[day]) + 1;
        chartcountry.data.labels = chartdata.dates;
        chartcountry.data.datasets[0].data = chartdata.deaths.slice(0, (lastdayindex)); // Slice data at current day
        chartcountry.data.datasets[1].data = chartdata.recovered.slice(0, (lastdayindex));
        chartcountry.data.datasets[2].data = chartdata.activecases.slice(0, (lastdayindex));
        chartcountry.data.datasets[3].data = chartdata.confirmed.slice(0, (lastdayindex));
        chartcountry.update();
        chartcountrynew.data.labels = chartdata.dates;
        chartcountrynew.data.datasets[0].data = chartdata.confirmednew.slice(0, (lastdayindex)); // Slice data at current day
        chartcountrynew.update();
    }
}

// Show or hide box
function toggleBox(targetid) {
    var target = document.getElementById(targetid);
    if (target.classList.contains("hidden")) {
        target.classList.remove("hidden");
    } else {
        target.classList.add("hidden");
    }
}

// Country list
function initCountryList() {
    var countylist = '<ul>';
    for (var country in coronaWorldMap.countries) {
        var countrycode = coronaWorldMap.countries[country].id;
        var countryname = coronaWorldMap.countries[country].name;
        if (dayData[countrycode] != undefined && country != 'World') {
            // Main country
            //if (dayData[countrycode].provinces == undefined) {
                countylist += '<li id="' + countrycode + '" data-name="' + countryname + '" data-confirmed="" onmouseover="coronaWorldMap.over(\'' + countrycode + '\')" onmouseout="coronaWorldMap.out(\'' + countrycode + '\')" onclick="countryListClick(\'' + countrycode + '\')">' + countryname + '</li>';
            // Province
            //} else {
                //for (var province in dayData[countrycode].provinces) {
                //}
            //}
        /*} else {
            console.log('No data: ' + countrycode + ' / ' + countryname);*/
        }
    }
    countylist += '</ul>';
    document.getElementById("countrylist").innerHTML = countylist;
}

// Update country list
function updateCountryList() {
    if (coronaWorldMap != undefined) {
        for (var country in coronaWorldMap.countries) {
            var countrycode = coronaWorldMap.countries[country].id;
            if (dayData[countrycode] != undefined) {
                // Add confirmed to countrylist
                if (document.getElementById(countrycode) != null) {
                    var confirmedday = dayData[countrycode].confirmed[day];
                    var countryname = document.getElementById(countrycode).dataset.name;
                    if (confirmedday > 0) { 
                        document.getElementById(countrycode).dataset.confirmed = confirmedday;
                        document.getElementById(countrycode).innerHTML = '<span class="small red">' + formatInteger(confirmedday) + '</span>' + countryname;
                    } else {
                        document.getElementById(countrycode).dataset.confirmed = '';
                        document.getElementById(countrycode).innerHTML = countryname;
                    }
                }
            }
        }
        // Sort country list with new confirmed
        sortCountryList();
    }
}

// Sort countrylist by confirmed helper function
function sortCountryList() {
    var list, i, switching, b, shouldSwitch;
    list = document.getElementById("countrylist");
    switching = true;
    while (switching) {
        switching = false;
        b = list.getElementsByTagName("li");
        for (i = 0; i < (b.length - 1); i++) {
            shouldSwitch = false;
            if (Number(b[i].dataset.confirmed) < Number(b[i + 1].dataset.confirmed)) {
                shouldSwitch = true;
                break;
            }
        }
        if (shouldSwitch) {
            b[i].parentNode.insertBefore(b[i + 1], b[i]);
            switching = true;
        }
    }
}

// Country search
function searchCountry() {
    // Declare variables
    var input = document.getElementById('search');
    var searchval = input.value.toUpperCase();
    var li = document.getElementById('countrylist').getElementsByTagName('li');
    // Loop through all list items, and hide those who don't match the search query
    for (i = 0; i < li.length; i++) {
        if (li[i].dataset.name.toUpperCase().indexOf(searchval) > -1) {
            li[i].style.display = "";
        } else {
            li[i].style.display = "none";
        }
    }
}

// Country list click
function countryListClick(countrycode) {
    coronaWorldMap.click(countrycode);
    detailcountry = countrycode;
    updateDetails();
    // Pan map to country (label)
    /*if (smallScreen == false) {
        var coordsX = 500 - parseInt(coronaWorldMap.countryLabels[countrycode].getAttribute("x")); // 500 = SVG width / 2
        var coordsY = 253 - parseInt(coronaWorldMap.countryLabels[countrycode].getAttribute("y")); // 253 = SVG height / 2
        svgPanZoom.reset();
        svgPanZoom.pan({ x: coordsX, y: coordsY });
    }*/
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
        } else if (dayData[countryid] != undefined) {
            detailprovince = false;
        }
        detailcountry = countryid;
        updateDetails();
    }
}

// Click info button
function clickInfo() {
    if (smallScreen != false) {
        if (document.getElementById('countries').classList.contains("hidden") == false) {
            document.getElementById('countries').classList.add("hidden");
        }
        if (document.getElementById('details').classList.contains("hidden") == false) {
            document.getElementById('details').classList.add("hidden");
        }
    }
    toggleBox('info');
    toggleBox('logo');
}

// Chart legend padding
Chart.Legend.prototype.afterFit = function() {
    this.height = this.height + 10;
};

// Chart init
function initCharts() {
    var chartoptions = { 
        maintainAspectRatio: false, 
        legend: { reverse: true, labels: { usePointStyle: true, fontColor: "#CDCDCD", fontSize: 11 } }, 
        elements: { point:{ radius: 0 } }, 
        scales: { 
            xAxes: [{ ticks: { display: false } }], 
            yAxes: [{ ticks: { suggestedMin: 0, fontColor: "#CDCDCD", /*suggestedMax: 500*/
                    callback: function(label, index, labels) {
                        if (label >= 1000000) {
                            return label/1000000+'m';
                        } else  if (label >= 1000) {
                            return label/1000+'k';
                        } else {
                            return label;
                        }
                    }
                }
            }]
        }
    };
    var chartdatasets = [{
        label: 'Deaths',
        data: [ 0 ],
        borderWidth: 1,
        backgroundColor: 'rgba(0, 0, 0, .6)'
    }, {
        label: 'Rec.',
        data: [ 0 ],
        borderWidth: 1,
        backgroundColor: 'rgba(0, 200, 0, .6)'
    }, {
        label: 'Active',
        data: [ 0 ],
        borderWidth: 1,
        backgroundColor: 'rgba(255, 160, 64, .6)'
    }, {
        label: 'Conf.',
        data: [ 0 ],
        borderWidth: 1,
        backgroundColor: 'rgba(200, 0, 0, .6)'
    }];
    chartworld = new Chart(worldcanvas, {
        type: 'line',
        data: {
            labels: [ 0 ],
            datasets: chartdatasets
        },
        options: chartoptions
    });
    chartcountry = new Chart(countrycanvas, {
        type: 'line',
        data: {
            labels: [ 0 ],
            datasets: chartdatasets
        },
        options: chartoptions
    });
    // Change chart y axis label
    chartoptions.scales.yAxes[0].ticks.maxTicksLimit = 3;
    chartworldnew = new Chart(worldnewcanvas, {
        type: 'line',
        data: {
            labels: [ 0 ],
            datasets: [{
                label: 'New Cases',
                data: [ 0 ],
                borderWidth: 1,
                backgroundColor: 'rgba(255, 255, 255, .5)'
            }]
        },
        options: chartoptions
    });
    chartcountrynew = new Chart(countrynewcanvas, {
        type: 'line',
        data: {
            labels: [ 0 ],
            datasets: [{
                label: 'New Cases',
                data: [ 0 ],
                borderWidth: 1,
                backgroundColor: 'rgba(255, 255, 255, .5)'
            }]
        },
        options: chartoptions
    });
}

// Load file helper function
function loadFile(url, callback) {
    var xobj = new XMLHttpRequest();
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

// Mobile device detection
function checkMobile() {
    if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|ipad|iris|kindle|Android|Silk|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(navigator.userAgent) 
        || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(navigator.userAgent.substr(0,4))) { 
        isMobile = true;
    }
}

// Check screen size
function checkSize() {
    if (screen.width < 999) {
        if (screen.width < screen.height) {
            smallScreen = 'portrait';
        } else {
            smallScreen = 'landscape';
        }
    }
}
