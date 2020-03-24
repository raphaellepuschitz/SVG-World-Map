// SVG World Map
// v0.0.3

var svgWorldMap = (function(){ 

    // Variables
    var svgMap;
    var options = {};
    var countries;
    var countryData;
    var countryGroups = {};
    
    // Main 
    function svgWorldMap(svg, options) {
        initMapCountries(svg);

        // TODO: Optimize
        var loadInterval = window.setInterval(function() {
            console.log(countryData);
            console.log(countryGroups);

            if (countryData != undefined && countryGroups != undefined) {
                svgMap = { 'countries': countries,   'countryData': countryData,   'countryGroups':  countryGroups};
                console.log(loadInterval);
                clearInterval(loadInterval);
                console.log(loadInterval);
                return svgMap;
            }

        }, 100);
    }

    // Init countries on map
    function initMapCountries(svg) {
        countries = {};
        countryNodes = svg.contentDocument.children[0].childNodes;
        countryNodes.forEach(function(country) {
            if (country.id != undefined) {  // Get all groups and paths here and sort later
                countries[country.id] = country;
            }
        });
        sortProvinces();
        loadCountryData();
    }

    // Pre-sort sub-provinces in countries for faster access and node cleanup
    function sortProvinces() {
        for (var country in countries) {
            var provinces = [];
            countries[country].childNodes.forEach(function(child) { // Ungrouped provinces are 1 level deep
                if (child.tagName == 'path' && child.tagName != 'circle' && child.id != countries[country].id.toLowerCase()) { // 'id.toLowerCase()' is the border element, so skip it
                    provinces.push(child);
                } else if (child.tagName == 'g') {
                    child.childNodes.forEach(function(grandchild) { // Grouped provinces are 2 levels deep
                        if (grandchild.tagName == 'path') { 
                            if (grandchild.getAttribute('fill') != 'none') {
                                provinces.push(grandchild);
                            /*} else { // TODO: Check invisible grandchildren in SVG
                                console.log(country);
                                console.log(grandchild.id + '.fill = none');*/
                            }
                        } 
                    }); 
                } 
            }); 
            countries[country].provinces = provinces; // Add provinces to country
        }
        initMapControls();
    }

    // Map controls
    function initMapControls() {
        //console.log(countries);
        for (var country in countries) {
            if (countries[country].id == 'Ocean') {
                countries[country].style.fill = 'rgb(216, 235, 255)';
            } else {
                countries[country].addEventListener("mouseover", function() { countryOverOut(true); });
                countries[country].addEventListener("mouseout", function() { countryOverOut(false); });
                countries[country].addEventListener("click", function() { countryClick(); });
            }
        }
    }

    // TODO: Optimize?
    function countryOverOut(over) {
        if (over) {
            var color = '#000000';
        } else {
            var color = '#FFFFFF';
        }
        var country = event.srcElement; // Get (sub-)country / province / state
        var nation = getNation(country); // Get the state / nation from the hierarchy
        country.setAttribute('stroke', color);
        if (country.tagName == 'circle' && !over) { // Remove highlight from circles for microstates on out
            console.log(country);
            country.removeAttribute('stroke');
            console.log(country);
        }
        if (nation.children[nation.id.toLowerCase()] != undefined) { // Check if border layer for nation exists
            var border = nation.children[nation.id.toLowerCase()];
            border.setAttribute('stroke', color);
            if (border.childNodes.length > 1) { // Some countries have borders in groups
                border.childNodes.forEach(function(child) { if (child.tagName == 'path') { child.setAttribute('stroke', color); } }); 
            }
        } else {
            //console.log('Border not found for ' + nation.id);
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
            document.getElementById("info").innerHTML += '<br><br>All countries / provinces / states in ' + name + ':<br>';
            nation.provinces.forEach(function(province) { document.getElementById("info").innerHTML += province.id + '<br>'; }); 
        } else {
            console.log('Country data missing: ' + nation.id);
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

        // TODO: Re-check for svg-pan-zoom integration
        /*console.log(country.id);
        console.log(country.parentNode.id);
        console.log(country.parentNode.parentNode.id);
        console.log(country.parentNode.parentNode.parentNode.id);*/
        /*if (country.parentNode.id == 'Earth') {
            return country; 
        } else if (country.parentNode.parentNode.id == 'Earth' && country.parentNode.parentNode.id.substr(0, 8) != 'viewport') {
            return country.parentNode; 
        } else if(country.parentNode.parentNode.id.substr(0, 8) != 'viewport') {
            return country.parentNode.parentNode; 
        } else {
            return country.parentNode.parentNode.parentNode; 
        }*/
    }

    // Build groups of countries with the JSON data
    function buildCountryGroups() {
        var regionGroup = {}; // Group object for regions: AF, AS, EU, NA, OC, SA
        var sovereigntyGroup = {}; // Group object forUnited Nations memeber states and single dependent territories, e.g. from: France, Netherlands, ...
        for (var country in countries) {
            if (countries[country].id != 'Ocean') {
                if (countryData[countries[country].id] != undefined) { // Check for non-missing countries
                    // Country region
                    var region = countryData[countries[country].id].region;
                    if (regionGroup[region] == undefined) {
                        regionGroup[region] = []; // New sub-array for each region
                    }
                    regionGroup[region].push(countries[country].id); // Push country to region
                    // UN and dependent territories
                    var sovereignty = countryData[countries[country].id].sovereignty;
                    if (sovereigntyGroup[sovereignty] == undefined) {
                        sovereigntyGroup[sovereignty] = []; // New sub-array for each nation with dependent territories
                    }
                    sovereigntyGroup[sovereignty].push(countries[country].id); // Push country to dependent territories
                } else {
                    //console.log('Country data missing: ' + countries[country].id);
                }
            }
        }
        // Push single groups to global country groups object
        countryGroups['regions'] = regionGroup;
        countryGroups['sovereignty'] = sovereigntyGroup;
    }

    // Wait for asynchronous json load
    function loadCountryData() {
        loadFile('countrydata.json', function(response) {
            countryData = JSON.parse(response); 
            //console.log(countryData);
            buildCountryGroups();
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

    return svgWorldMap;

})();
