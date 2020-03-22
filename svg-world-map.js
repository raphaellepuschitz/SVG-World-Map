
var countryData;

loadCountryData();

function svgWorldMap(svg, params) {
    loadSVGMap(svg);
}

// Wait for asynchronous svg load
function loadSVGMap(svg) {
    svg.addEventListener("load", function() {
        countries = {};
        countryNodes = svgmap.contentDocument.children[0].childNodes;
        countryNodes.forEach(function(country) {
            if (country.id != undefined) {  // Get all groups and paths here and sort later
                countries[country.id] = country;
            }
        });
        initMapControls();
    }, false);
}

// Map controls
function initMapControls() {
    //console.log(countries);
    for (var country in countries) {
        if (countries[country].id != 'Ocean') {

            var nation = getNation(countries[country]); // Get the state / nation from the hierarchy
            if (nation.children[nation.id.toLowerCase()] == undefined) { // Check if border layer for nation exists
                console.log(nation.id);
            }

            countries[country].addEventListener("mouseover", function() { countryOver(); });
            countries[country].addEventListener("mouseout", function() { countryOut(); });
            countries[country].addEventListener("click", function() { countryClick(); });
        }
    }
    // Map countries hover and click functions
    /*for (var i=0; i<mapcountries.length; i++) {
        mapcountries[i].style.transition = 'fill 1s';
        if (mapcountries[i].id == 'World') {
            mapcountries[i].style.fill = '#87b1b3';
            mapcountries[i].addEventListener("click", function() { worldClick(this.id); });
            mapcountries[i].addEventListener("dblclick", function() { worldDblclick(this.id); });
        } else {
            mapcountries[i].addEventListener("mouseover", function() { countryOver(this.id); });
            mapcountries[i].addEventListener("mouseout", function() { countryOut(this.id); });
            mapcountries[i].addEventListener("click", function() { countryClick(this.id); });
            mapcountries[i].addEventListener("dblclick", function() { countryDblclick(this.id); });
        }
    }*/
    // SVG pan zoom init, only for not mobiel devices
    // TODO: Add mobile support for svg-pan-zoom.js
    /*if (ismobile == false) {
        mappanzoom = svgPanZoom(mapsvg, { minZoom: 1, dblClickZoomEnabled: false, beforePan: beforePan }); //controlIconsEnabled: true
    }*/
}

function countryOver() {
    var country = event.srcElement; // Get (sub-)country / province / state
    var nation = getNation(country); // Get the state / nation from the hierarchy
    country.setAttribute('stroke', '#000000');
    if (nation.children[nation.id.toLowerCase()] != undefined) { // Check if border layer for nation exists
        var border = nation.children[nation.id.toLowerCase()];
        border.setAttribute('stroke', '#000000');
    } else {
        console.log('Border not found for ' + nation.id);
    }
}

function countryOut() {
    var country = event.srcElement; // Get (sub-)country / province / state
    var nation = getNation(country); // Get the state / nation from the hierarchy
    country.setAttribute('stroke', '#FFFFFF');
    if (nation.children[nation.id.toLowerCase()] != undefined) { // Check if border layer for nation exists
        var border = nation.children[nation.id.toLowerCase()];
        border.setAttribute('stroke', '#FFFFFF');
    } else {
        console.log('Border not found for ' + nation.id);
    }
}

function countryClick() {
    var country = event.srcElement; // Get (sub-)country / province / state
    var nation = getNation(country); // Get the state / nation from the hierarchy
    if (countryData[nation.id] != undefined) {
        var code = nation.id;
        var name = countryData[nation.id].name;
        var longname = countryData[nation.id].longname;
        var sovereignty = countryData[nation.id].sovereignty;
        var region = countryData[nation.id].region;
        //console.log('Country: ' + countryData[country.id].name);
        //console.log('Region: ' + region.id);
        document.getElementById("info").innerHTML = 'Country: ' + country.id + '<br>Nation: ' + name + '<br>Longname: ' + longname + '<br>Code: ' + code + '<br>Region: ' + region + '<br>Sovereignty: ' + sovereignty;
    }
}

// Traverse the SVG hierarchy to get the level of the nation
function getNation(country) {
    if (country.parentNode.id == 'Earth') {
        return country; 
    } else if (country.parentNode.parentNode.id == 'Earth') {
        return country.parentNode; 
    } else {
        return country.parentNode.parentNode; 
    }
}

// Wait for asynchronous json load
function loadCountryData() {
    loadFile('countrydata.json', function(response) {
        countryData = JSON.parse(response); 
        //console.log(countryData);
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
