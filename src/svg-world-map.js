/**
 * SVG World Map JS
 * v0.2.4
 * 
 * Description: A Javascript library to easily integrate one or more SVG world map(s) with all nations (countries) and political subdivisions (countries, provinces, states). 
 * Author: Raphael Lepuschitz <raphael.lepuschitz@gmail.com>
 * Copyright: Raphael Lepuschitz
 * URL: https://github.com/raphaellepuschitz/SVG-World-Map
 * License: MIT
 **/

var svgWorldMap = (function() { 

    // Global variables
    var svg;
    var baseNode;
    var basePoint;
    var infoBox;
    var isMobile = false;
    var smallScreen = false;
    var svgMap = {};
    var countries = {};
    var countryData = {};
    var countryGroups = {};
    var countryLabels = {};
    var shapes = {};
    var tableData = {};
    var selectedCountry;
    var svgNS = "http://www.w3.org/2000/svg";
    //var dragMap = false; // TODO: Check, doesn't work smooth 

    // Default options
    var options = {
        // Base path 
        libPath: '../src/', // Point to library folder, e.g. (http[s]:)//myserver.com/map/src/
        // Basic options
        bigMap: true, // Set to 'false' to load small map without provinces
        showOcean: true, // Show or hide ocean layer
        showAntarctica: true, // Show or hide antarctic layer
        showLabels: true, // Show country labels
        showMicroLabels: false, // Show microstate labels
        showMicroStates: true, // Show microstates on map
        showInfoBox: false, // Show info box
        backgroundImage: '', // Background image path
        // Color options
        oceanColor: '#D8EBFF', 
        worldColor: '#FFFFFF', 
        labelFill: { out: '#666666',  over: '#333333',  click: '#000000' }, 
        //countryFill: { out: '#B9B9B9',  over: '#CCCCCC',  click: '#666666' }, // TODO: Currently this makes no sense for main country groups, until all country borders are existing in the SVG (a lot are missing, e.g. Japan, Greenland, Antarctica)
        countryStroke: { out: '#FFFFFF',  over: '#FFFFFF',  click: '#333333' }, 
        countryStrokeWidth: { out: '0.5',  over: '1',  click: '1' }, 
        provinceFill: { out: '#B9B9B9',  over: '#FFFFFF',  click: '#666666' }, 
        provinceStroke: { out: '#FFFFFF',  over: '#FFFFFF',  click: '#666666' }, 
        provinceStrokeWidth: { out: '0.1',  over: '0.5',  click: '0.5' }, 
        // Group options
        groupCountries: true, // Enable or disable country grouping
        groupBy: [ "region" ], // Sort countryData by this value(s) and return to countryGroups
        // Coordinates
        trackCoords: false, // Track map coords, default 'false' due to performance
        // Callback functions from the map to the outside, can have custom names
        mapOut: "mapOut", 
        mapOver: "mapOver", 
        mapClick: "mapClick", 
        mapCoords: "mapCoords", 
        mapDate: "mapDate", // (Custom) callback function for time control date return
        mapTable: "mapTable", // (Custom) callback function for HTML data parsing
        // Time controls
        timeControls: false, // Set to 'true' for time controls
        timePause: true, // Set to 'false' for time animation autostart
        timeLoop: false //  Set to 'true' for time animation loop
    };

    // Main function: SVG map init call, options handling, return the map object
    async function svgWorldMap(initOptions, initCountryData, initTimeData) {
        let promise1 = new Promise(resolve1 => {
            // Check size, viewport and mobile
            checkSize();
            checkMobile();
            // Overwrite default options with initOptions
            for (var option in initOptions) {
                if (initOptions.hasOwnProperty(option)) { 
                    options[option] = initOptions[option];
                }
            }
            // Overwrite countryData with initCountryData
            if (initCountryData != undefined && initCountryData != false) { 
                countryData = initCountryData;
            }
            // Asynchronous SVG map load
            // Inject HTML with SVG map
            initMap();
            // Wait for asynchronous svg load
            svg.addEventListener("load", async () => {
                let promise2 = new Promise(resolve2 => {
                    // Set SVG base node
                    baseNode = svg.getSVGDocument().children[0]; 
                    // Startup SVG path traversing, then country sorting, followed by click handlers, etc.
                    initMapCountries();
                    // Return svgMap object after everything is ready and bind calling home functions
                    svgMap = { 
                        'worldMap': svg, 
                        'countries': countries, 
                        'countryData': countryData, 
                        'countryGroups': countryGroups, 
                        'countryLabels': countryLabels, 
                        'shapes': shapes, 
                        // Calling home functions from outside into the map 
                        // TODO: maybe use 'this["countryXYZ"]' insted of 'window["countryXYZ"]' for several maps? -> Leads to too much recursion...
                        'out': function(id) { window["countryOut"].call(null, id); }, 
                        'over': function(id) { window["countryOver"].call(null, id); }, 
                        'click': function(id) { window["countryClick"].call(null, id); }, 
                        'update': function(data) { window["updateMapData"].call(null, data); }, 
                        'reset': function(data) { window["resetMap"].call(null, data); }, 
                        'labels': function(data) { window["toggleMapLabels"].call(null, data); }, 
                        'download': function(data) { window["downloadMap"].call(null, data); }, 
                        'coords': function(data) { window["getCoords"].call(null, data); }, 
                        'shape': function(data) { window["drawShape"].call(null, data); }, 
                        'date': function(data) { window["timeControlsDate"].call(null, data); }, 
                        'table': function(data) { window["parseHTMLTable"].call(null, data); }, 
                    };
                    // Load time controls
                    if (options.timeControls == true) {
                        svgWorldMapTimeControls(options.timePause, options.timeLoop, initTimeData);
                    }
                    // Add info box
                    if (options.showInfoBox == true) {
                        initInfoBox();
                    }
                    // Init coordinates
                    if (options.trackCoords == true) {
                        initCoords();
                    }
                    resolve2(svgMap);
                });
                let result2 = await promise2;
                resolve1(result2);
            }, false);
        });
        // Wait for loaded map
        let result1 = await promise1;
        svgMap = result1;
        // Return SVG World Map object
        return svgMap;
    }

    // Init SVG map
    function initMap() {
        // Avoid double loading
        if (document.getElementById('svg-world-map-container') == null) {
            // Add SVG container HTML
            var container = document.createElement("div");
            container.setAttribute("id", "svg-world-map-container");
            document.body.prepend(container);
            // Add SVG HTML, 'svg' is global
            svg = document.createElement("object");
            svg.setAttribute("id", "svg-world-map");
            svg.setAttribute("type", "image/svg+xml");
            // Load small map with states only
            if (smallScreen != false || options.bigMap == false) { // isMobile == true
                svg.setAttribute("data", options.libPath + "world-states.svg");
            // Load big map with provinces
            } else {
                svg.setAttribute("data", options.libPath + "world-states-provinces.svg");
            }
            container.appendChild(svg);
            // Add container and SVG CSS
            // TODO: Make optional? Not needed for SVG World Map, but for SVG pan zoom etc.
            var style = document.createElement('style');
            style.innerHTML = `#svg-world-map-container, #svg-world-map { width: 100%; height: 100%; }`;
            document.head.appendChild(style);
        }
    }

    // Init countries on SVG map
    function initMapCountries() {
        // Iterate through child nodes and add them to countries object
        baseNode.childNodes.forEach(function(node) {
            // Skip unclear disputed territories and also metadata, defs etc. - we want a clean node list
            if (node.id != undefined && node.id.substr(0, 1) != '_' && (node.tagName == 'g' || node.tagName == 'path' || node.tagName == 'rect')) { 
                countries[node.id] = node;
            }
        });
        // World & ocean settings
        countries['World'].style.fill = options.worldColor; 
        countries['Ocean'].style.fill = options.oceanColor; 
        if (options.showOcean == false) {
            countries['Ocean'].style.fill = 'none'; 
            countries['Ocean'].style.stroke = 'none'; 
        }
        // Add map backgound image, if set
        if (options.backgroundImage != '') {
            var background = document.createElementNS(svgNS, "image");
            background.setAttribute("id", "Background");
            background.setAttribute("overflow", "visible");
            background.setAttribute("width", "1000");
            background.setAttribute("height", "507");
            //background.setAttribute("width", "2000");
            //background.setAttribute("height", "1000");
            background.setAttribute("href", options.backgroundImage);
            //var zw = baseNode.getElementById("ZW");
            //baseNode.insertBefore(background, zw);
            var world = baseNode.getElementById("World");
            baseNode.insertBefore(background, world);
            countries['World'].style.fill = 'rgba(255, 255, 255, 0)'; 
            countries['Ocean'].style.fill = 'rgba(255, 255, 255, 0)'; 
        }
        // Get microstates from labels and remove from countries
        sortLabels();
        //delete countries['Ocean']; // (Delete ocean from countries object) Keep it currently
        // Delete Antarctica from countries and labels, if set in options
        if (options.showAntarctica == false) {
            baseNode.removeChild(baseNode.getElementById("AQ"));
            delete countries['AQ']; 
            baseNode.getElementById("labels").removeChild(baseNode.getElementById("AQ-label"));
            delete countryLabels['AQ']; 
        }
        // Show labels on start, if it is set
        if (options.showLabels == true) {
            toggleMapLabels('all');
        }
        delete countries['labels']; // Delete labels from countries object, not from map
        // Pre-sort provinces
        sortProvinces();
        // Sort countries alphabetically
        countries = sortObject(countries);
        // Init country groups
        if (options.groupCountries == true) {
            buildCountryGroups();
        }
        // Add group for shapes
        var shapeGroup = document.createElementNS(svgNS, "g");
        shapeGroup.setAttribute("id", "shapes");
        baseNode.appendChild(shapeGroup);
        shapes = baseNode.getElementById("shapes");
    }

    // Pre-sort provinces and subprovinces in countries for faster access and node cleanup
    // TODO: Cleanup, optimize?
    function sortProvinces() {
        for (var country in countries) {
            // Add all details from countryData to country
            if (countryData[countries[country].id] != undefined) {
                var currentCountryData = countryData[countries[country].id];
                for (var key in currentCountryData) {
                    countries[country][key] = currentCountryData[key]; 
                }
            }
            countries[country].country = countries[country]; // Reference to self for hierarchy compatibility - it's a little crazy, i know ;-) 
            var provinces = []; // Empty array for all provinces
            // Ungrouped provinces are 1 level deep
            countries[country].childNodes.forEach(function(child) { 
                // Add parent country and province for hierarchy compatibility
                child.country = countries[country]; 
                child.province = child; // Reference to self for hierarchy compatibility
                // 'id.toLowerCase()' is the nation (border) element, so this is the main country (nation)
                if (child.id == countries[country].id.toLowerCase()) { 
                    countries[country].border = child; // Add border to nation
                    if (child.tagName != 'g') { // Groups are colored below
                        pathSetAttributes(child, 'out'); // Set border attributes
                        //provinces.push(child); // Don't push the nation (border) element, it's not needed in provinces
                    } else {
                        child.childNodes.forEach(function(grandchild) { 
                            if (grandchild.nodeType != Node.TEXT_NODE) {
                                // Add country and parent province for hierarchy compatibility
                                grandchild.country = countries[country];
                                grandchild.province = child; 
                                pathSetAttributes(grandchild, 'out');
                            }
                        });
                    }
                // Skip elements like circles (microstates)
                } else if (child.tagName == 'path' && child.tagName != 'circle' && child.id != countries[country].id.toLowerCase()) { 
                    pathSetAttributes(child, 'out');
                    provinces.push(child);
                // Grouped provinces are 2 levels deep (We have to go deeper!)
                } else if (child.tagName == 'g') {
                    var subprovinces = []; // Empty array for all sub-provinces
                    child.childNodes.forEach(function(grandchild) { 
                        // Add country and parent province for hierarchy compatibility
                        grandchild.country = countries[country];
                        grandchild.province = child; 
                        if (grandchild.tagName == 'path') { 
                            if (grandchild.getAttribute('fill') != 'none') { // Don't push border grandchilds
                            //provinces.push(grandchild);
                            subprovinces.push(grandchild);
                            /*} else {
                                console.log(grandchild); // Only path15677, TODO: Cleanup SVG */
                            }
                            pathSetAttributes(grandchild, 'out');
                        /* } else if (grandchild.nodeType != Node.TEXT_NODE) {
                            console.log(grandchild);  // Only <circle id="tf."> and <circle id="hk_">, TODO: Cleanup SVG  */
                        }
                    }); 
                    child.provinces = subprovinces; // Add subprovinces to province
                    provinces.push(child);
                }
            }); 
            countries[country].provinces = provinces; // Add provinces to country
        }
        initMapControls();
        //countCountries();
    }

    // Get microstates from labels
    function sortLabels() {
        countries['labels'].childNodes.forEach(function(label) { 
            // Skip non-<text> text 
            if (label.tagName == 'text') {
                var countryId = label.id.substr(0, 2);
                countryLabels[countryId] = label; // Add to countryLabels
                // Set custom country name
                if (label.textContent != countryData[countryId].name) {
                    label.textContent = countryData[countryId].name;
                }
                // Set fill and get microstates by font size in SVG
                label.setAttribute('fill', options.labelFill.out);
                if (label.getAttribute('font-size') == 2) { // TODO: Make country sizes var? 
                    label.microstate = true;
                } else {
                    label.microstate = false;
                }
                // Add event listeners
                label.addEventListener("mouseover", function() { countryOver(this.id.substr(0, 2)); updateInfoBox('over', countries[this.id.substr(0, 2)]); });
                label.addEventListener("mouseout", function() { countryOut(this.id.substr(0, 2)); updateInfoBox('out', countries[this.id.substr(0, 2)]); });
                label.addEventListener("mouseup", function() { countryClick(this.id.substr(0, 2)); });
            }
        });
        for (var label in countryLabels) {
            if (countryLabels[label].microstate == true) {
                var microid = countryLabels[label].id.substr(0, 2);
                // Set microstate labels
                if (options.showMicroLabels == false) {
                    countryLabels[label].setAttribute('display', 'none');
                }
                // Set microstates
                if (options.showMicroStates == false) {
                    countries[microid].setAttribute('display', 'none');
                }
            }
        }
    }

    // Set country label color
    function setLabelFill(id, event) {
        if (countryLabels != undefined && countryLabels[id] != undefined) {
            countryLabels[id].setAttribute('fill', options.labelFill[event]); 
        }
    }

    // Set all attributes for a path
    // TODO: Check over, out and selectedCountry logic
    function pathSetAttributes(path, event) {
        if (path != undefined && path.id != 'World' && path.id != 'Ocean') {
            // Hover and click colors and stroke width are defined in options, don't hover selected country
            if (event == 'click' || ((event == 'out' || event == 'over') && path != selectedCountry && path.country != selectedCountry)) {
                // Country border (nation overlay, get's no fill)
                if (path == path.country.border || path.parentNode == path.country.border) {
                    path.setAttribute('stroke', options.countryStroke[event]);
                    path.setAttribute('stroke-width', options.countryStrokeWidth[event]);
                // Other provinces
                } else {
                    // Keep updated color 
                    if (path.updateColor != undefined) {
                        path.setAttribute('fill', path.updateColor);
                    } else {
                        path.setAttribute('fill', options.provinceFill[event]);
                    }
                    path.setAttribute('stroke', options.provinceStroke[event]);
                    path.setAttribute('stroke-width', options.provinceStrokeWidth[event]);
                }
            // Set color to path directly, also to selected country
            } else if (typeof event === "string" && (event.substr(0, 1) == '#' || event.substr(0, 3) == 'rgb')) { // && path != selectedCountry && path.country != selectedCountry
                path.setAttribute('fill', event);
            }
        }
    }
    
    // Init info box
    function initInfoBox() {
        // Add info box HTML to SVG map container
        infoBox = document.createElement("div");
        infoBox.setAttribute("id", "map-infobox");
        document.getElementById('svg-world-map-container').appendChild(infoBox);
        // Add info box CSS
        var style = document.createElement('style');
        style.innerHTML = `
            #map-infobox { position: absolute; top: 0; left: 0; padding: 3px 6px; max-width: 270px; overflow: hidden; font-family: 'Trebuchet MS', Verdana, Arial, sans-serif; font-size: 13px; color: #444444; background-color: rgba(255, 255, 255, .75); border: 1px solid #CDCDCD; border-radius: 5px; }
            #map-infobox .data { margin-top: 5px; }
        `;
        document.head.appendChild(style);
        // Add event listener and set display to none at start
        infoBox.style.display = 'none';
        baseNode.addEventListener("mousemove", function(event) {
            if (infoBox.style.display != 'none') {
                infoBox.style.left = (event.clientX - (infoBox.offsetWidth / 2)) + 'px';
                if (event.clientY < (infoBox.offsetHeight + 25)) {
                    infoBox.style.top = (event.clientY + 25) + 'px';
                } else {
                    infoBox.style.top = (event.clientY - infoBox.offsetHeight - 15) + 'px';
                }
            }
        }, false);
    }

    // Update info box
    function updateInfoBox(event, path) {
        // Info box is set in options.showInfoBox, otherwise undefined
        if (infoBox != undefined) {
            if (event == 'over' && path.id != 'World' && path.id != 'Ocean') {
                var infoText = '<b>' + path.country.name + '</b>';
                // Add province info, but not for unnamed paths and borders
                if (path.id.substr(0, 4) != 'path' && path.id.substr(0, 2) != path.country.id.toLowerCase() && path.id.length != 2) {
                    infoText += '<br>' + path.id;
                }
                // Add table data info for country or province
                if (tableData[path.country.id] != undefined || tableData[path.id] != undefined) {
                    infoText += '<div class="data">';
                    if (tableData[path.country.id] != undefined) {
                        var tableInfo = tableData[path.country.id];
                    } else {
                        var tableInfo = tableData[path.id];
                    }
                    for (var details in tableInfo) {
                        infoText += '<b>' + details + '</b>: ' + tableInfo[details] + '<br>';
                    }
                    infoText += '</div>';
                }
                // Basic implementation of time data info for corona map, TODO: refactor
                // Add info for dayData, if it exists
                if (typeof(dayData) !== 'undefined' && dayData[path.country.id] != undefined) {
                    infoText += '<div class="data">';
                    infoText += 'Date: ' + dayData[path.country.id].dates[day] + '<br>';
                    infoText += 'Conf. : <span class="red">' + dayData[path.country.id].confirmed[day] + '</span><br>';
                    infoText += 'Active: <span class="orange">' + dayData[path.country.id].activecases[day] + '</span><br>';
                    infoText += 'Rec. : <span class="green">' + dayData[path.country.id].recovered[day] + '</span><br>';
                    infoText += 'Deaths: <span class="black">' + dayData[path.country.id].deaths[day] + '</span><br>';
                    //infoText += 'New Cases: <span class="black">' + dayData[path.country.id].confirmednew[day] + '</span>';
                    infoText += '</div>';
                }
                infoBox.innerHTML = infoText;
                infoBox.style.display = 'block';
            } else {
                infoBox.style.display = 'none';
            }
        }
    }

    // Init coordiante tracking
    // Robinson projection: Use https://github.com/proj4js/proj4js/releases
    // TODO: Make coords work with svg pan zoom 
    function initCoords() {
        // Add base point and event listener for coords
        basePoint = baseNode.createSVGPoint(); 
        baseNode.addEventListener("mousemove", function(event) { 
            basePoint.x = event.clientX;
            basePoint.y = event.clientY;
            // Translate cursor point to svg coordinates
            var svgPoint =  basePoint.matrixTransform(baseNode.getScreenCTM().inverse());
            callBack('coords', svgPoint);
        });
    }

    // Map controls
    function initMapControls() {
        for (var country in countries) {
            countries[country].addEventListener("mouseover", function() { provinceOverOut('over'); });
            countries[country].addEventListener("mouseout", function() { provinceOverOut('out'); });
            countries[country].addEventListener("mouseup", function() { provinceClick(); });
        }
    }

    // Map country hover handling
    function provinceOverOut(overout) {
        var province = event.srcElement; // Get (sub-)country / province / state
        var country = province.country; 
        // Check if (parent) country for path exists
        if (country != undefined) { 
            // Check if country is not selected
            if (province != selectedCountry) { 
                pathSetAttributes(province, overout);
                // Remove highlight from circles for microstates on out
                if (province.tagName == 'circle' && overout == 'out') { 
                    province.removeAttribute('fill');
                    province.removeAttribute('stroke');
                }
            }
        } else {
            //console.log('Country not found for ' + province.id);
        }
        // Update info box and make callback
        updateInfoBox(overout, province);
        callBack(overout, province);
    }
 
    // Map click handling and internal callback routing
    function provinceClick() {
        //if (dragMap == false) { // TODO: Check, doesn't work smooth
            var province = event.srcElement; // Get (sub-)country / province / state
            var selectedOld = selectedCountry;
            // Set new or unset current selectedCountry
            if (selectedCountry == province) {
                selectedCountry = undefined; 
                pathSetAttributes(province, 'out');
            } else {
                var selectedOld = selectedCountry;
                selectedCountry = province; 
                pathSetAttributes(selectedCountry, 'click');
            }
            resetOldSelected(selectedOld); // Reset selectedOld
            callBack('click', selectedCountry);
        /*} else {
            console.log('drag...');
        }*/
    }

    // Hover over function for calling home from the outside, defined in 'svgMap.over' 
    // TODO: Optimize / refactor with window.countryOut
    window.countryOver = function(id) {
        var country = countries[id]; 
        if (country != undefined && country != selectedCountry) {
            country.provinces.forEach(function(province) { 
                pathSetAttributes(province, 'over'); 
                if (province.provinces != undefined) { province.provinces.forEach(function(subprovince) { pathSetAttributes(subprovince, 'over') }); } 
            }); 
            setLabelFill(id, 'over');
        } else {
            province = findProvinceById(id);
            if (province != undefined) {
                pathSetAttributes(province, 'over');
                if (province.provinces != undefined) { province.provinces.forEach(function(subprovince) { pathSetAttributes(subprovince, 'over') }); } 
            }
        }
    }

    // Hover out function for calling home from the outside, defined in 'svgMap.out' 
    window.countryOut = function(id) {
        var country = countries[id]; 
        if (country != undefined && country != selectedCountry) {
            country.provinces.forEach(function(province) { 
                pathSetAttributes(province, 'out'); 
                if (province.provinces != undefined) { province.provinces.forEach(function(subprovince) { pathSetAttributes(subprovince, 'out') }); } 
            }); 
            setLabelFill(id, 'out');
        } else {
            province = findProvinceById(id);
            if (province != undefined) {
                pathSetAttributes(province, 'out');
                if (province.provinces != undefined) { province.provinces.forEach(function(subprovince) { pathSetAttributes(subprovince, 'out') }); } 
            }
        }
    }

    // Click function for calling home from the outside, defined in 'svgMap.click' 
    window.countryClick = function(id) {
        var country = countries[id]; 
        var selectedOld = selectedCountry;
        // Set new selected
        if (country != undefined && country != selectedCountry) {
            country.provinces.forEach(function(province) { 
                pathSetAttributes(province, 'click'); 
                if (province.provinces != undefined) { province.provinces.forEach(function(subprovince) { pathSetAttributes(subprovince, 'click') }); } 
            }); 
            setLabelFill(id, 'click');
        } else {
            country = findProvinceById(id);
            pathSetAttributes(country, 'click');
        }
        selectedCountry = country; // New selected
        resetOldSelected(selectedOld); // Reset selectedOld
        callBack('click', country);
    }

    // Reset all colors and fills, function defined in 'svgMap.resetMap' 
    window.resetMap = function() {
        for (var country in countries) {
            if (countries[country].provinces != undefined) { 
                countries[country].provinces.forEach(function(province) { 
                    if (province.updateColor != undefined) { 
                        delete province.updateColor;
                        pathSetAttributes(province, 'out');
                    }
                    if (province.provinces != undefined) {
                        province.provinces.forEach(function(subprovince) { 
                            if (subprovince.updateColor != undefined) { 
                                delete subprovince.updateColor;
                                pathSetAttributes(subprovince, 'out');
                            }
                        });
                    }
                });
            }
        }
    }

    // Update function for calling home from the outside, defined in 'svgMap.update' 
    window.updateMapData = function(updateData) {
        for (var id in updateData) {
            if (countries[id] != undefined) {
                var country = countries[id]; 
            } else {
                var country = findProvinceById(id);
            }
            if (country != undefined) {
                if (country.provinces == undefined) { // Is mostly a province and no country. TODO: Rename variables? 
                    country.updateColor = updateData[id];
                    pathSetAttributes(country, updateData[id]);
                } else {
                    country.provinces.forEach(function(province) { 
                        province.updateColor = updateData[id];
                        pathSetAttributes(province, updateData[id]);
                        if (province.provinces != undefined) {
                            province.provinces.forEach(function(subprovince) { 
                                subprovince.updateColor = updateData[id];
                                pathSetAttributes(subprovince, updateData[id]);
                            });
                        }
                    }); 
                }
            } 
        };
    }

    // Update function for calling home from the outside, defined in 'svgMap.labels' 
    window.toggleMapLabels = function(updateLabels) {
        if (updateLabels == 'all') {
            var labelGroup = baseNode.getElementById('labels');
            if (labelGroup.getAttribute('display') == null || labelGroup.getAttribute('display') == 'block') {
                labelGroup.setAttribute('display', 'none');
            } else {
                labelGroup.setAttribute('display', 'block');
            }
        } else if (updateLabels == 'micro') {
            for (var label in countryLabels) {
                if (countryLabels[label].microstate == true) {
                    if (countryLabels[label].getAttribute('display') == null || countryLabels[label].getAttribute('display') == 'block') {
                        countryLabels[label].setAttribute('display', 'none');
                    } else {
                        countryLabels[label].setAttribute('display', 'block');
                    }
                }
            };
        }
    }

    // Export Map as SVG or PNG, defined in 'svgMap.download' 
    // TODO: Refactor + cleanup
    window.downloadMap = function(type) {
        var serializer = new XMLSerializer();
        var svgXML = serializer.serializeToString(svg.contentDocument);
        var blob = new Blob([svgXML], { type: "image/svg+xml;charset=utf-8" });
        var url = URL.createObjectURL(blob);
        if (type == 'svg') {
            var downloadLink = document.createElement("a");
            downloadLink.href = url;
            downloadLink.download = "world-map." + type;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
        } else if (type == 'png') {
            var canvas = document.createElement('canvas');
            var context = canvas.getContext('2d');
            var svgSize = baseNode.viewBox.baseVal;
            canvas.width = svgSize.width*2;
            canvas.height = svgSize.height*2;
            var data = new XMLSerializer().serializeToString(svg.contentDocument);
            var win = window.URL || window.webkitURL || window;
            var blob = new Blob([data], { type: 'image/svg+xml' });
            var url = win.createObjectURL(blob);
            var img = new Image();
            img.onload = function () {
                context.drawImage(img, 0, 0, canvas.width, canvas.height);
                win.revokeObjectURL(url);
                var uri = canvas.toDataURL('image/png').replace('image/png', 'octet/stream');
                var a = document.createElement('a');
                document.body.appendChild(a);
                a.style = 'display: none';
                a.href = uri;
                a.download = "world-map." + type;
                a.click();
                window.URL.revokeObjectURL(uri);
                document.body.removeChild(a);
            };
            img.src = url;
        } 
    }
    
    // Draw shape on map, defined in 'svgMap.shape' 
    window.drawShape = function(svgString) {
        var template = document.createElementNS(svgNS, 'svg');
        template.innerHTML = svgString;
        shapes.appendChild(template.firstChild);
    }

    // Caller for time controls to callback out, defined in 'svgMap.date' 
    window.timeControlsDate = function(currDate) {
        callBack('date', currDate);
    }

    // Parse HTML for <table> data, defined in 'svgMap.table' 
    window.parseHTMLTable = function(html) {
        tableData = {};
        var tableKeys = ['iso', 'name', 'country', 'countries', 'state', 'states', 'nation', 'nations', 'member state', 'member states', 'country or territory'];
        var dom = new DOMParser().parseFromString(html, "text/html");
        var tables = dom.getElementsByTagName('table');
        // Search for table to use
        loop_table:
        for (t=0; t<tables.length; t++) {
            var headers = tables[t].getElementsByTagName('th');
            for (h=0; h<headers.length; h++) {
                var headerText = stripHTML(headers[h].innerHTML);
                // Table key found
                if (tableKeys.indexOf(headerText.toLowerCase()) != -1) {
                    var tableNumber = t;
                    var tableKey = tableKeys[tableKeys.indexOf(headerText.toLowerCase())];
                    break loop_table;
                }
            }
        }
        // Scrape table if found
        if (tableNumber != undefined) {
            var table = dom.getElementsByTagName('table')[tableNumber];
            var headers = table.getElementsByTagName('th');
            var rows = table.getElementsByTagName('tr');
            var searchKey = new RegExp('(' + tableKey + ')', 'gi');
            var headerKey = '';
            var columnKeys = [];
            var timeTable = false;
            // Get header data
            for (h=0; h<headers.length; h++) {
                var headerText = stripHTML(headers[h].innerHTML);
                // Check if <th> has search key first
                if (headerText.search(searchKey) != -1) {
                    headerKey = headerText;
                }
                // Add <th> value to column keys
                if (headerText != '') {
                    columnKeys.push(headerText);
                }
            }
            // Check if table has time data = following numbers in a row
            if ( (!isNaN(columnKeys[1]) && !isNaN(columnKeys[2]) && !isNaN(columnKeys[3])) && // 3 numbers in a row
                 ( (parseInt(columnKeys[1])+1 == parseInt(columnKeys[2]) && parseInt(columnKeys[2])+1 == parseInt(columnKeys[3])) ||
                   (parseInt(columnKeys[1])-1 == parseInt(columnKeys[2]) && parseInt(columnKeys[2])-1 == parseInt(columnKeys[3])) ) ) {
                    timeTable = true;
                    /*if (isNaN(columnKeys[0])) {
                        columnKeys.splice(0, 1);
                    }*/
            }
            // Get rows data
            for (r=0; r<rows.length; r++) {
                var rowData = {};
                var columns = rows[r].getElementsByTagName('td');
                if (timeTable == true) { // Why?
                    var startColumn = 1;
                } else {
                    var startColumn = 0;
                }
                for (c=startColumn; c<columns.length; c++) {
                    var columnText = stripHTML(columns[c].innerHTML);
                    if (columnText != '') {
                        // Check if text is a number and convert it
                        if (/^[0-9,.]*$/.test(columnText) == true) {
                            columnText = Number(columnText.replace(/,/g, ""));
                        }
                        // Check if <td> has background color and add and value and color
                        if (columns[c].style.backgroundColor != undefined && columns[c].style.backgroundColor != '') {
                            // Add data for time animation
                            if (timeTable == true && parseHTMLTable.caller == null) { // Attention: function.caller in NOT supported in strict JavaScript! 
                                var countryKey = findIdByName(stripHTML(columns[0].innerHTML));
                                if (tableData[columnKeys[c]] == undefined) {
                                    tableData[columnKeys[c]] = {};
                                }
                                // Push country color to tableData directly if time animation is true
                                if (countryKey != undefined) {
                                    tableData[columnKeys[c]][countryKey] = columns[c].style.backgroundColor;
                                }
                                rowData[countryKey] = columns[c].style.backgroundColor;
                            // Or push other color for none animated but colored
                            } else {
                                rowData[columnKeys[c]] = { data: columnText, color: columns[c].style.backgroundColor };
                            }
                        // Or just add <td> value to row data
                        } else if (parseHTMLTable.caller != null) { // Attention: function.caller in NOT supported in strict JavaScript! 
                            rowData[columnKeys[c]] = columnText;
                        }
                    }
                }
                // Add row data to table data
                if (rowData[headerKey] != undefined) {
                    // Check if country has full name instead of ISO code and replace
                    if (rowData[headerKey].length > 2 && tableKey != 'iso') {
                        var countryKey = findIdByName(rowData[headerKey]);
                    } else {
                        var countryKey = rowData[headerKey];
                    }
                    // Skip table index (1, 2, 3...), only use iso country identifiers
                    if (isNaN(countryKey)) {
                        tableData[countryKey] = rowData;
                    }
                }
            }
        }
        // No table found or data not valid
        if (tableNumber == undefined || Object.keys(tableData)[0] == 'undefined') {
            tableData = { error: 'No valid data found in ' + tables.length + ' tables' };
        // Sort countries alphabetically 
        } else {
            tableData = sortObject(tableData);
        }
        // Return data
        callBack('table', tableData);
    }

    // Fire the (custom) callback functions, defined in 'options.mapOver', 'options.mapOut', 'options.mapClick', 'options.mapCoords', 'options.mapDate' and 'options.mapTable'
    function callBack(event, data) { // 'data' is a path except for coords and time controls date
        if (event == 'over' && window[options.mapOver] && typeof(window[options.mapOver]) === "function") { 
            window[options.mapOver].apply(window, [data]);
        } else if (event == 'out' && window[options.mapOut] && typeof(window[options.mapOut]) === "function") { 
            window[options.mapOut].apply(window, [data]);
        } else if (event == 'click' && window[options.mapClick] && typeof(window[options.mapClick]) === "function") { 
            if (data == undefined) { data = ''; } // If path is undefined (because of selectedCountry), return empty string
            window[options.mapClick].apply(window, [data]);
        } else if (event == 'coords' && window[options.mapCoords] && typeof(window[options.mapCoords]) === "function") { 
            window[options.mapCoords].apply(window, [data]);
        } else if (event == 'date' && window[options.mapDate] && typeof(window[options.mapDate]) === "function") { 
            window[options.mapDate].apply(window, [data]);
        } else if (event == 'table' && window[options.mapTable] && typeof(window[options.mapTable]) === "function") { 
            window[options.mapTable].apply(window, [data]);
        } 
    }

    // Build groups of countries with countryData (or passed JSON countryData) 
    function buildCountryGroups() {
        for (var country in countries) {
            // Check if country exists in countryData
            if (countryData[countries[country].id] != undefined) { 
                // Add new mainGroups and subGroups
                for (var i=0; i<options.groupBy.length; i++) {
                    var mainGroup = options.groupBy[i]; // E.g. "region"
                    var subGroup = countryData[countries[country].id][mainGroup]; // E.g. "EU"
                    // Add new mainGroup, if it doesn't exist
                    if (countryGroups[mainGroup] == undefined) { 
                        countryGroups[mainGroup] = {}; // New object for each mainGroup
                    }
                    if (subGroup != '') {
                        // Add new subGroup, if it doesn't exist
                        if (countryGroups[mainGroup][subGroup] == undefined) { 
                            countryGroups[mainGroup][subGroup] = {}; // New object for each subGroup
                        }
                        // Push country to subGroup
                        countryGroups[mainGroup][subGroup][countries[country].id] = countries[country]; 
                    }
                }
            } else {
                //console.log('Country data missing: ' + countries[country].id);
            }
        }
        // Sort groups alphabetically
        for (var group in countryGroups) {
            countryGroups[group] = sortObject(countryGroups[group]); 
        }
    }

    // Helper function to get text without HTML
    function stripHTML(input) {
        return input.replace(/(<br>)/ig, " ")
                    .replace(/(&nbsp;)/ig, " ")
                    .replace(/(<\/li><li>)/ig, " ")
                    .replace(/(\n)/ig, "")
                    .replace(/(\[.*\])/ig, "")
                    .replace(/(<([^>]+)>)/ig, "")
                    .trim();
    }

    // Helper function for object alphabetical sort
    function sortObject(input) {
        return Object.keys(input).sort().reduce(function (object, key) { 
            object[key] = input[key];
            return object;
        }, {});
    }

    // Reset the old selectedCountry
    function resetOldSelected(selectedOld) {
        if (selectedOld != undefined) {
            pathSetAttributes(selectedOld, 'out');
            if (selectedOld.provinces != undefined) {
                selectedOld.provinces.forEach(function(province) { 
                    pathSetAttributes(province, 'out'); 
                    if (province.provinces != undefined) {
                        province.provinces.forEach(function(subprovince) { 
                            pathSetAttributes(subprovince, 'out'); 
                        }); 
                    }
                }); 
            }
            setLabelFill(selectedOld.id, 'out'); // Reset selectedOld label
        }
    }

    // Find path in countries
    function findProvinceById(id) {
        for (var country in countries) {
            var provinces = countries[country].provinces;
            for (var province in provinces) {
                if (id == provinces[province].id) {
                    return provinces[province]; // No break needed if returned
                }
            }
        }
    }

    // Find id by country name
    function findIdByName(name) {
        // Remove "The ", e.g. from "The Bahamas"
        if (name.substr(0, 4).toLowerCase() == 'the ') { name = name.substr(4); }
        // Remove ", The", e.g. from "Bahamas, The"
        if (name.substr(-5).toLowerCase() == ', the') { name = name.substr(0, name.length-5); }
        // Remove last single characters, e.g. " b" from "Syrian Arab Republic  b"
        if (name.substr(-2, 1) == ' ') { name = name.substr(0, name.length-2); }
        // Remove special characters, e.g. "†"
        if (name.substr(-1, 1) == '†') { name = name.substr(0, name.length-1); }
        // Remove everything in brackets, e.g. "(France)" from "French Guiana (France)" and trim()
        name = name.replace(/(\(.*\))/ig, "").trim();
        // Search countries for name
        for (var country in countryData) {
            if (countryData[country].name == name) {
                return country; // No break needed if returned
            } else if (countryData[country].altnames != undefined && countryData[country].altnames.split(',').indexOf(name) != -1) {
                return country; 
            }
        }
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

    // Debug helper function for all countries and provinces
    function countCountries() {
        var countCountries = 0;
        var countProvinces = 0;
        for (var country in countries) {
            var countSub = 0;
            countCountries++;
            for (var province in countries[country].provinces) {
                countSub++;
                countProvinces++;
            }
            console.log(country + ': ' + countSub);
        }
        console.log('Total countries: ' + countCountries);
        console.log('Total provinces: ' + countProvinces);
    }

    // Fallback for countryData if no other is passed
    var countryData = { 
        "AD": { "name": "Andorra", "region": "EU" }, "AE": { "name": "United Arab Emirates", "region": "AS" }, "AF": { "name": "Afghanistan", "region": "AS" }, "AG": { "name": "Antigua and Barbuda", "region": "NA" }, "AI": { "name": "Anguilla", "region": "NA" }, "AL": { "name": "Albania", "region": "EU" }, "AM": { "name": "Armenia", "region": "AS" }, "AO": { "name": "Angola", "region": "AF" }, "AQ": { "name": "Antarctica", "region": "AN" }, "AR": { "name": "Argentina", "region": "SA" }, "AS": { "name": "American Samoa", "region": "OC" }, "AT": { "name": "Austria", "region": "EU" }, "AU": { "name": "Australia", "region": "OC" }, "AW": { "name": "Aruba", "region": "SA" }, "AX": { "name": "Åland Islands", "region": "EU" }, "AZ": { "name": "Azerbaijan", "region": "AS" }, 
        "BA": { "name": "Bosnia and Herzegovina", "region": "EU" }, "BB": { "name": "Barbados", "region": "SA" }, "BD": { "name": "Bangladesh", "region": "AS" }, "BE": { "name": "Belgium", "region": "EU" }, "BF": { "name": "Burkina Faso", "region": "AF" }, "BG": { "name": "Bulgaria", "region": "EU" }, "BH": { "name": "Bahrain", "region": "AS" }, "BI": { "name": "Burundi", "region": "AF" }, "BJ": { "name": "Benin", "region": "AF" }, "BL": { "name": "Saint Barthélemy", "region": "NA" }, "BM": { "name": "Bermuda", "region": "NA" }, "BN": { "name": "Brunei", "region": "AS" }, "BO": { "name": "Bolivia", "region": "SA" }, "BQ": { "name": "Bonaire, Sint Eustatius and Saba", "region": "SA" }, "BR": { "name": "Brazil", "region": "SA" }, "BS": { "name": "Bahamas", "region": "NA" }, "BT": { "name": "Bhutan", "region": "AS" }, "BV": { "name": "Bouvet Island", "region": "AN" }, "BW": { "name": "Botswana", "region": "AF" }, "BY": { "name": "Belarus", "region": "EU" }, "BZ": { "name": "Belize", "region": "NA" }, 
        "CA": { "name": "Canada", "region": "NA" }, "CC": { "name": "Cocos (Keeling) Islands", "region": "AS" }, "CD": { "name": "Congo (Dem. Rep.)", "altnames": "Democratic Republic of the Congo,DR Congo", "region": "AF" }, "CF": { "name": "Central African Republic", "region": "AF" }, "CG": { "name": "Congo", "altnames": "Republic of the Congo", "region": "AF" }, "CH": { "name": "Switzerland", "region": "EU" }, "CI": { "name": "Côte d'Ivoire", "altnames": "Ivory Coast", "region": "AF" }, "CK": { "name": "Cook Islands", "region": "OC" }, "CL": { "name": "Chile", "region": "SA" }, "CM": { "name": "Cameroon", "region": "AF" }, "CN": { "name": "China", "region": "AS" }, "CO": { "name": "Colombia", "region": "SA" }, "CR": { "name": "Costa Rica", "region": "NA" }, "CU": { "name": "Cuba", "region": "NA" }, "CV": { "name": "Cabo Verde", "altnames": "Cape Verde", "region": "AF" }, "CW": { "name": "Curaçao", "region": "SA" }, "CX": { "name": "Christmas Island", "region": "AS" }, "CY": { "name": "Cyprus", "region": "EU" }, "CZ": { "name": "Czechia", "altnames": "Czech Republic", "region": "EU" }, 
        "DE": { "name": "Germany", "region": "EU" }, "DJ": { "name": "Djibouti", "region": "AF" }, "DK": { "name": "Denmark", "region": "EU" }, "DM": { "name": "Dominica", "region": "NA" }, "DO": { "name": "Dominican Republic", "region": "NA" }, "DZ": { "name": "Algeria", "region": "AF" }, 
        "EC": { "name": "Ecuador", "region": "SA" }, "EE": { "name": "Estonia", "region": "EU" }, "EG": { "name": "Egypt", "region": "AF" }, "EH": { "name": "Western Sahara", "altnames": "Sahrawi Arab Democratic Republic", "region": "AF" }, "ER": { "name": "Eritrea", "region": "AF" }, "ES": { "name": "Spain", "region": "EU" }, "ET": { "name": "Ethiopia", "region": "AF" }, 
        "FI": { "name": "Finland", "region": "EU" }, "FJ": { "name": "Fiji", "region": "OC" }, "FK": { "name": "Falkland Islands", "region": "SA" }, "FM": { "name": "Micronesia", "region": "OC" }, "FO": { "name": "Faroe Islands", "region": "EU" }, "FR": { "name": "France", "region": "EU" }, 
        "GA": { "name": "Gabon", "region": "AF" }, "GB": { "name": "United Kingdom", "region": "EU" }, "GD": { "name": "Grenada", "region": "NA" }, "GE": { "name": "Georgia", "region": "AS" }, "GF": { "name": "French Guiana", "region": "SA" }, "GG": { "name": "Guernsey", "region": "EU" }, "GH": { "name": "Ghana", "region": "AF" }, "GI": { "name": "Gibraltar", "region": "EU" }, "GL": { "name": "Greenland", "region": "NA" }, "GM": { "name": "Gambia", "region": "AF" }, "GN": { "name": "Guinea", "region": "AF" }, "GP": { "name": "Guadeloupe", "region": "NA" }, "GQ": { "name": "Equatorial Guinea", "region": "AF" }, "GR": { "name": "Greece", "region": "EU" }, "GS": { "name": "South Georgia and the South Sandwich Islands", "region": "AN" }, "GT": { "name": "Guatemala", "region": "NA" }, "GU": { "name": "Guam", "region": "OC" }, "GW": { "name": "Guinea-Bissau", "region": "AF" }, "GY": { "name": "Guyana", "region": "SA" }, 
        "HK": { "name": "Hong Kong", "region": "AS" }, "HM": { "name": "Heard Island and McDonald Islands", "region": "AN" }, "HN": { "name": "Honduras", "region": "NA" }, "HR": { "name": "Croatia", "region": "EU" }, "HT": { "name": "Haiti", "region": "NA" }, "HU": { "name": "Hungary", "region": "EU" }, 
        "ID": { "name": "Indonesia", "region": "AS" }, "IE": { "name": "Ireland", "region": "EU" }, "IL": { "name": "Israel", "region": "AS" }, "IM": { "name": "Isle of Man", "region": "EU" }, "IN": { "name": "India", "region": "AS" }, "IO": { "name": "British Indian Ocean Territory", "region": "AS" }, "IQ": { "name": "Iraq", "region": "AS" }, "IR": { "name": "Iran", "region": "AS" }, "IS": { "name": "Iceland", "region": "EU" }, "IT": { "name": "Italy", "region": "EU" }, 
        "JE": { "name": "Jersey", "region": "EU" }, "JM": { "name": "Jamaica", "region": "NA" }, "JO": { "name": "Jordan", "region": "AS" }, "JP": { "name": "Japan", "region": "AS" }, 
        "KE": { "name": "Kenya", "region": "AF" }, "KG": { "name": "Kyrgyzstan", "region": "AS" }, "KH": { "name": "Cambodia", "region": "AS" }, "KI": { "name": "Kiribati", "region": "OC" }, "KM": { "name": "Comoros", "region": "AF" }, "KN": { "name": "Saint Kitts and Nevis", "region": "NA" }, "KP": { "name": "North Korea", "region": "AS" }, "KR": { "name": "South Korea", "region": "AS" }, "KW": { "name": "Kuwait", "region": "AS" }, "KY": { "name": "Cayman Islands", "region": "NA" }, "KZ": { "name": "Kazakhstan", "region": "AS" }, 
        "LA": { "name": "Laos", "region": "AS" }, "LB": { "name": "Lebanon", "region": "AS" }, "LC": { "name": "Saint Lucia", "region": "NA" }, "LI": { "name": "Liechtenstein", "region": "EU" }, "LK": { "name": "Sri Lanka", "region": "AS" }, "LR": { "name": "Liberia", "region": "AF" }, "LS": { "name": "Lesotho", "region": "AF" }, "LT": { "name": "Lithuania", "region": "EU" }, "LU": { "name": "Luxembourg", "region": "EU" }, "LV": { "name": "Latvia", "region": "EU" }, "LY": { "name": "Libya", "region": "AF" }, 
        "MA": { "name": "Morocco", "region": "AF" }, "MC": { "name": "Monaco", "region": "EU" }, "MD": { "name": "Moldova", "region": "EU" }, "ME": { "name": "Montenegro", "region": "EU" }, "MF": { "name": "Saint Martin (French part)", "region": "NA" }, "MG": { "name": "Madagascar", "region": "AF" }, "MH": { "name": "Marshall Islands", "region": "OC" }, "MK": { "name": "North Macedonia", "region": "EU" }, "ML": { "name": "Mali", "region": "AF" }, "MM": { "name": "Myanmar", "region": "AS" }, "MN": { "name": "Mongolia", "region": "AS" }, "MO": { "name": "Macao", "region": "AS" }, "MP": { "name": "Northern Mariana Islands", "region": "AS" }, "MQ": { "name": "Martinique", "region": "NA" }, "MR": { "name": "Mauritania", "region": "AF" }, "MS": { "name": "Montserrat", "region": "NA" }, "MT": { "name": "Malta", "region": "EU" }, "MU": { "name": "Mauritius", "region": "AF" }, "MV": { "name": "Maldives", "region": "AS" }, "MW": { "name": "Malawi", "region": "AF" }, "MX": { "name": "Mexico", "region": "NA" }, "MY": { "name": "Malaysia", "region": "AS" }, "MZ": { "name": "Mozambique", "region": "AF" }, 
        "NA": { "name": "Namibia", "region": "AF" }, "NC": { "name": "New Caledonia", "region": "OC" }, "NE": { "name": "Niger", "region": "AF" }, "NF": { "name": "Norfolk Island", "region": "OC" }, "NG": { "name": "Nigeria", "region": "AF" }, "NI": { "name": "Nicaragua", "region": "NA" }, "NL": { "name": "Netherlands", "region": "EU" }, "NO": { "name": "Norway", "region": "EU" }, "NP": { "name": "Nepal", "region": "AS" }, "NR": { "name": "Nauru", "region": "OC" }, "NU": { "name": "Niue", "region": "OC" }, "NZ": { "name": "New Zealand", "region": "OC" }, 
        "OM": { "name": "Oman", "region": "AS" }, 
        "PA": { "name": "Panama", "region": "NA" }, "PE": { "name": "Peru", "region": "SA" }, "PF": { "name": "French Polynesia", "region": "OC" }, "PG": { "name": "Papua New Guinea", "region": "OC" }, "PH": { "name": "Philippines", "region": "AS" }, "PK": { "name": "Pakistan", "region": "AS" }, "PL": { "name": "Poland", "region": "EU" }, "PM": { "name": "Saint Pierre and Miquelon", "region": "NA" }, "PN": { "name": "Pitcairn", "region": "OC" }, "PR": { "name": "Puerto Rico", "region": "NA" }, "PS": { "name": "Palestine", "altnames": "State of Palestine", "region": "AS" }, "PT": { "name": "Portugal", "region": "EU" }, "PW": { "name": "Palau", "region": "OC" }, "PY": { "name": "Paraguay", "region": "SA" }, 
        "QA": { "name": "Qatar", "region": "AS" }, 
        "RE": { "name": "Réunion", "region": "AF" }, "RO": { "name": "Romania", "region": "EU" }, "RS": { "name": "Serbia", "region": "EU" }, "RU": { "name": "Russia", "region": "EU" }, "RW": { "name": "Rwanda", "region": "AF" }, 
        "SA": { "name": "Saudi Arabia", "region": "AS" }, "SB": { "name": "Solomon Islands", "region": "OC" }, "SC": { "name": "Seychelles", "region": "AF" }, "SD": { "name": "Sudan", "region": "AF" }, "SE": { "name": "Sweden", "region": "EU" }, "SG": { "name": "Singapore", "region": "AS" }, "SH": { "name": "Saint Helena, Ascension and Tristan da Cunha", "region": "AF" }, "SI": { "name": "Slovenia", "region": "EU" }, "SJ": { "name": "Svalbard and Jan Mayen", "region": "EU" }, "SK": { "name": "Slovakia", "region": "EU" }, "SL": { "name": "Sierra Leone", "region": "AF" }, "SM": { "name": "San Marino", "region": "EU" }, "SN": { "name": "Senegal", "region": "AF" }, "SO": { "name": "Somalia", "region": "AF" }, "SR": { "name": "Suriname", "region": "SA" }, "SS": { "name": "South Sudan", "region": "AF" }, "ST": { "name": "Sao Tome and Principe", "altnames": "São Tomé and Príncipe", "region": "AF" }, "SV": { "name": "El Salvador", "region": "NA" }, "SX": { "name": "Sint Maarten (Dutch part)", "region": "NA" }, "SY": { "name": "Syria", "altnames": "Syrian Arab Republic", "region": "AS" }, "SZ": { "name": "Eswatini", "altnames": "Swaziland", "region": "AF" }, 
        "TC": { "name": "Turks and Caicos Islands", "region": "NA" }, "TD": { "name": "Chad", "region": "AF" }, "TF": { "name": "French Southern Territories", "region": "AF" }, "TG": { "name": "Togo", "region": "AF" }, "TH": { "name": "Thailand", "region": "AS" }, "TJ": { "name": "Tajikistan", "region": "AS" }, "TK": { "name": "Tokelau", "region": "OC" }, "TL": { "name": "Timor-Leste (East Timor)", "region": "AS" }, "TM": { "name": "Turkmenistan", "region": "AS" }, "TN": { "name": "Tunisia", "region": "AF" }, "TO": { "name": "Tonga", "region": "AF" }, "TR": { "name": "Turkey", "region": "AS" }, "TT": { "name": "Trinidad and Tobago", "region": "NA" }, "TV": { "name": "Tuvalu", "region": "OC" }, "TW": { "name": "Taiwan", "region": "AS" }, "TZ": { "name": "Tanzania", "region": "AF" }, 
        "UA": { "name": "Ukraine", "region": "EU" }, "UG": { "name": "Uganda", "region": "AF" }, "UM": { "name": "United States Minor Outlying Islands", "region": "OC" }, "US": { "name": "United States", "region": "NA" }, "UY": { "name": "Uruguay", "region": "SA" }, "UZ": { "name": "Uzbekistan", "region": "AS" }, 
        "VA": { "name": "Holy See", "region": "EU" }, "VC": { "name": "Saint Vincent and the Grenadines", "region": "NA" }, "VE": { "name": "Venezuela", "region": "SA" }, "VG": { "name": "Virgin Islands (British)", "region": "NA" }, "VI": { "name": "Virgin Islands (U.S.)", "region": "NA" }, "VN": { "name": "Viet Nam", "altnames": "Vietnam", "region": "AS" }, "VU": { "name": "Vanuatu", "region": "OC" }, 
        "WF": { "name": "Wallis and Futuna", "region": "OC" }, "WS": { "name": "Samoa", "region": "OC" }, 
        "XK": { "name": "Kosovo", "region": "EU" }, 
        "YE": { "name": "Yemen", "region": "AS" }, "YT": { "name": "Mayotte", "region": "AF" }, 
        "ZA": { "name": "South Africa", "region": "AF" }, "ZM": { "name": "Zambia", "region": "AF" }, "ZW": { "name": "Zimbabwe", "region": "AF" }
    };

    // Global variables for time controls
    var timer; // Interval
    var currDate = 0; // Current day, month, year etc.
    var ticks = 0; // For speed
    var speed = 10; // For ticks per date
    var timeData = false;
    var maxDates = false;
    var loop = false;
    var paused = true;

    // Time controls
    function svgWorldMapTimeControls(timePause, timeLoop, initTimeData) { 

        // Check time dataset
        if (initTimeData != undefined) {
            timeData = initTimeData;
            // Convert time date from object to array
            if (typeof(timeData) == 'object' && Array.isArray(timeData) == false) {
                var timeHelper = [];
                var keys = Object.keys(timeData);
                for (var k=0; k<keys.length; k++) {
                    timeHelper.push({ [keys[k]]: timeData[keys[k]] });
                }
                timeData = timeHelper;
            }
            maxDates = timeData.length-1;
        }

        // Set pause at start (= autoplay)
        if (timePause == false) {
            paused = false;
        }

        // Set loop
        if (timeLoop == true) {
            loop = true;
        }

        // Dynamically load webfont
        document.getElementsByTagName('head')[0].insertAdjacentHTML('beforeend', '<link rel="stylesheet" href="' + options.libPath + 'font/flaticon.css" />');

        // Start HTML injection
        initControls();
    }

    // Interval for day timer
    function initDayTimer() {
        timer = window.setInterval(function() {
            if (!paused) {
                increaseTimeTicks();
            }
        }, 100);
    }

    // 'Tick'-logic for time per speed
    function increaseTimeTicks() {
        ticks++;
        if (speed == 1 || (ticks % speed) == 1) {
            if (currDate < maxDates || maxDates == false) {
                currDate++;
            } else {
                if (loop) {
                    currDate = 0; // Return to start if loop is on
                } else {
                    paused = true; // Pause if last date of data is reached
                }
            }
            updateControls();
        }
    }

    // Slider control
    function initSilder() {
        if (timeData != false) {
            document.getElementById("map-slider").oninput = function() {
                paused = true;
                currDate = this.value;
                updateControls();
            } 
        } else {
            document.getElementById("map-slider").style.display = 'none';
            document.getElementById("map-slider-container").style.display = 'list-item';
            document.getElementById("map-slider-container").style.fontSize = '0';
        }
    }

    // Keyboard controls and start values
    function initKeyControls() {
        // Keyboard controls
        document.addEventListener('keyup', function(event) {
            if (event.keyCode == 32) { // Space
                document.getElementById("map-control-play-pause").firstChild.click();
            } else if (event.keyCode == 37) { // Arrow left
                document.getElementById("map-control-back").firstChild.click();
            } else if (event.keyCode == 38) { // Arrow up
                document.getElementById("map-control-start").firstChild.click();
            } else if (event.keyCode == 39) { // Arrow right
                document.getElementById("map-control-forward").firstChild.click();
            } else if (event.keyCode == 40) { // Arrow down
                document.getElementById("map-control-end").firstChild.click();
            } else if (event.keyCode == 171) { // Arrow right
                document.getElementById("map-control-faster").firstChild.click();
            } else if (event.keyCode == 173) { // Arrow down
                document.getElementById("map-control-slower").firstChild.click();
            }
        });
    }

    // Update controls output
    function updateControls() {
        if (paused) {
            document.getElementById("map-control-play-pause").innerHTML = '<i class="flaticon-play"></i>';
        } else {
            document.getElementById("map-control-play-pause").innerHTML = '<i class="flaticon-pause"></i>';
        }
        if (timeData && timeData.length > 0) {
            var dateKey = Object.keys(timeData[currDate])[0]; // Get date by first key
            document.getElementById("map-slider").value = currDate;
            document.getElementById("map-date").innerHTML = dateKey;
            //svgWorldMap.update(timeData[date][dateKey]); // Call update function in SVG World Map lib 
            svgMap.update(timeData[currDate][dateKey]); // Call update function in SVG World Map lib 
        } else {
            document.getElementById("map-date").innerHTML = currDate;
        }
        //svgWorldMap.date(date); // Call date and then callback function in SVG World Map 
        svgMap.date(currDate); // Call date and then callback function in SVG World Map lib 
    }

    // Play and pause controls
    window.clickPlayPause = function() {
        paused = !paused;
        updateControls();
    }

    // Controls for play, pause, forward, back, start, end
    window.clickControl = function() {
        var controlid = event.srcElement.parentNode.id; 
        if (controlid == 'map-control-start') {
            currDate = 0;
        } else if (controlid == 'map-control-end') {
            currDate = maxDates;
        } else if (controlid == 'map-control-back' && currDate > 0) {
            currDate--;
        } else if (controlid == 'map-control-forward' && currDate < maxDates) {
            currDate++;
        }
        paused = true;
        updateControls();
    }

    // Speed controls
    window.clickSpeed = function() {
        var speedid = event.srcElement.parentNode.id; 
        if (speedid == 'map-control-faster' && speed > 1) {
            speed--;
        } else if (speedid == 'map-control-slower' && speed < 20) {
            speed++;
        }
    }

    // HTML for time controls
    function initControls() {
        // Avoid double loading
        if (document.getElementById('map-controls') == null) {
            // Init CSS
            initControlsCSS();
            // Control elements
            var controlElements = { 'map-controls': { tag: 'div', append: 'svg-world-map-container' }, 
                                    'map-control-buttons': { tag: 'div', append: 'map-controls' }, 
                                    'map-control-start': { tag: 'button', append: 'map-control-buttons', icon: 'previous', click: 'clickControl()' }, 
                                    'map-control-back': { tag: 'button', append: 'map-control-buttons', icon: 'rewind', click: 'clickControl()' }, 
                                    'map-control-play-pause': { tag: 'button', append: 'map-control-buttons', icon: 'play', click: 'clickPlayPause()' }, 
                                    'map-control-forward': { tag: 'button', append: 'map-control-buttons', icon: 'fast-forward', click: 'clickControl()' }, 
                                    'map-control-end': { tag: 'button', append: 'map-control-buttons', icon: 'skip', click: 'clickControl()' }, 
                                    'map-slider-container': { tag: 'div', append: 'map-controls' }, 
                                    'map-slider': { tag: 'input', append: 'map-slider-container' }, 
                                    'map-speed-controls': { tag: 'div', append: 'map-controls' }, 
                                    'map-control-slower': { tag: 'button', append: 'map-speed-controls', icon: 'minus', click: 'clickSpeed()' }, 
                                    'map-control-faster': { tag: 'button', append: 'map-speed-controls', icon: 'plus', click: 'clickSpeed()' }, 
                                    'map-date': { tag: 'div', append: 'map-controls' } };
            // Create all elements dynamically
            for (var element in controlElements) {
                window[element] = document.createElement(controlElements[element].tag);
                window[element].setAttribute("id", element);
                window[controlElements[element].append].appendChild(window[element]);
                if (controlElements[element].tag == 'button') {
                    var i = document.createElement('i');
                    i.setAttribute("class", "flaticon-" + controlElements[element].icon);
                    window[element].appendChild(i);
                    window[element].setAttribute("onclick", controlElements[element].click);
                }
            }
            // Add missing attributes to slider
            document.getElementById("map-slider").setAttribute("type", "range");
            document.getElementById("map-slider").setAttribute("min", "0");
            document.getElementById("map-slider").setAttribute("max", maxDates);
            // Startup time control functions
            initKeyControls();
            initSilder();
            initDayTimer();
        }
    }

    // CSS for time controls
    function initControlsCSS() {
        var style = document.createElement('style');
        style.innerHTML = `
            #map-controls { position: absolute; bottom: 0; left: 0; right: 0; width: auto; height: 40px; padding: 0 10px; background-color: rgba(0, 0, 0, .75); }
            #map-control-buttons, #map-slider-container, #map-speed-controls, #map-date { float: left; }
            #map-control-buttons { width: 20%; }
            #map-slider-container { width: 60%; }
            #map-speed-controls, #map-date { width: 10%; text-align: right; }
            #map-date { margin-top: 10px; color: #FFFFFF; }
            #map-controls button { cursor: pointer; opacity: .5; margin-top: 10px; color: #FFFFFF; background-color: transparent; border: none; } /* broder: manu; */
            #map-controls button:hover { opacity: 1 !important; }
            #map-controls button i::before { margin: 0; }
            #map-speed-controls button i::before { font-size: 15px; font-weight: bold; }
            #map-slider { -webkit-appearance: none; width: 98%; height: 5px; border-radius: 5px; background: #8A8A8A; -moz-user-select: none; user-select: none; outline: none; margin: 17px 13px 0; }
            #map-slider:focus { outline: none; }
            #map-slider::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 15px; height: 15px; border-radius: 50%; background: #FFFFFF; cursor: pointer; opacity: .5; }
            #map-slider::-moz-range-thumb { width: 15px; height: 15px; border-radius: 50%; background: #FFFFFF; cursor: pointer; opacity: .5; -moz-user-select: none; user-select: none; }
            #map-slider:hover::-webkit-slider-thumb, #map-slider:hover::-moz-range-thumb { opacity: 1; }
            @media all and (max-width: 999px) { 
                #map-control-buttons { width: 25%; }
                #map-slider-container { width: 50%; }
                #map-speed-controls, #map-date { width: 12.5%; }
                #map-controls button { margin-top: 12px; } 
                #map-controls button i::before { font-size: 15px; } 
                #map-speed-controls button i::before { font-size: 12px; } 
            }
            @media all and (max-width: 666px) { 
                #map-speed-controls { display: none; }
                #map-control-buttons, #map-date { position: absolute; bottom: 41px; height: 30px; padding-top: 10px; text-align: center; background-color: rgba(0, 0, 0, .75); }
                #map-control-buttons { left: 0; width: 50%; }
                #map-date { right: 0; width: calc(50% - 1px); }
                #map-controls button { margin-top: 0px; } 
                #map-slider-container { width: 100%; }
                #map-slider { width: 100%; margin: 17px 0 0; }
            }
        `;
        document.head.appendChild(style);
    }

    // Return the main function
    return svgWorldMap;

})();
