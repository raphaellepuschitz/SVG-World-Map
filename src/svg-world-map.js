/**
 * SVG World Map JS
 * v0.1.3
 * 
 * Description: A Javascript library to easily integrate one or more SVG world map(s) with all nations (countries) and political subdivisions (countries, provinces, states). 
 * Original author: Raphael Lepuschitz <raphael.lepuschitz@gmail.com>
 * URL: https://github.com/raphaellepuschitz/SVG-World-Map
 * Copyleft: GNU General Public License version 3
 **/

var svgWorldMap = (function(){ 

    // Global variables
    var baseNode;
    var svgMap = {};
    var countries = {};
    var countryData = {};
    var countryGroups = {};
    var countryLabels = {};
    // Start library addon module, if it's set in options.mapTimeControls
    var mapTimeControls = {}; // Set to 'true' to activate controls, but make sure to include 'svg-world-map-time-controls.js' 
    var selectedCountry;
    //var dragMap = false; // TODO: Check, doesn't work smooth 

    // Default options
    var options = {
        showOcean: true, 
        oceanColor: '#D8EBFF', 
        worldColor: '#FFFFFF', 
        // TODO: Currently this makes no sense for main country groups, until all country borders are existing in the SVG (a lot are missing, e.g. Japan, Greenland, Antarctica)
        //countryFill: { out: '#B9B9B9',  over: '#CCCCCC',  click: '#666666' }, 
        countryStroke: { out: '#FFFFFF',  over: '#FFFFFF',  click: '#333333' }, 
        countryStrokeWidth: { out: '0.5',  over: '1',  click: '1' }, 
        provinceFill: { out: '#B9B9B9',  over: '#FFFFFF',  click: '#666666' }, 
        provinceStroke: { out: '#FFFFFF',  over: '#FFFFFF',  click: '#666666' }, 
        provinceStrokeWidth: { out: '0.1',  over: '0.5',  click: '0.5' }, 
        labelFill: { out: '#666666',  over: '#CCCCCC',  click: '#000000' }, 
        showLabels: true, // Show normal country labels
        showMicroLabels: false, // Show microstate labels
        showMicroStates: true, // Show microstates on map
        groupCountries: true, // Enable or disable country grouping
        groupBy: [ "region" ], // Sort countryData by this value(s) and return to countryGroups
        mapOut: "mapOut", // Callback functions from the map to the outside, can have custom names
        mapOver: "mapOver", 
        mapClick: "mapClick", 
        timeControls: false // Set to 'true' to activate controls, but make sure to include 'svg-world-map-time-controls.js' 
    };

    // Main function: SVG map init, options handling, return the map object
    function svgWorldMap(svg, initOptions, initData) {
        // Get SVG object or embed by id
        if (typeof svg == 'string') {
            svg = document.getElementById(svg);
        }
        // Overwrite default options with initOptions
        for (var option in initOptions) {
            if (initOptions.hasOwnProperty(option)) { 
                options[option] = initOptions[option];
            }
        }
        // Overwrite countryData with initData
        if (initData != undefined) { 
            countryData = initData;
        }
        // Startup SVG path traversing, then country sorting, followed by click handlers, etc.
        initMapCountries(svg);
        // Return svgMap object after everything is ready and bind calling home functions
        svgMap = { 
            'countries': countries, 
            'countryData': countryData, 
            'countryGroups': countryGroups, 
            'countryLabels': countryLabels, 
            'mapTimeControls': mapTimeControls, 
            // Calling home functions from outside into the map 
            // TODO: maybe use 'this["countryXYZ"]' insted of 'window["countryXYZ"]' for several maps? -> Leads to too much recursion...
            'out': function(id) { window["countryOut"].call(null, id); }, 
            'over': function(id) { window["countryOver"].call(null, id); }, 
            'click': function(id) { window["countryClick"].call(null, id); }, 
            'update': function(data) { window["updateData"].call(null, data); }, 
            'labels': function(data) { window["toggleLabels"].call(null, data); }, 
        };
        return svgMap;
    }

    // Init countries on SVG map
    function initMapCountries(svg) {
        baseNode = svg.getSVGDocument().children[0]; // Make global?
        // Add drag listener // TODO: Check, doesn't work smooth
        //baseNode.addEventListener("mousemove", function() { dragMap = true; });
        //baseNode.addEventListener("mousedown", function() { dragMap = false; });
        // Iterate through child nodes and add them to countries object
        baseNode.childNodes.forEach(function(country) {
            // Skip unclear disputed territories and also metadata, defs etc. - we want a clean node list
            if (country.id != undefined && country.id.substr(0, 1) != '_' && country.tagName != 'metadata' && country.tagName != 'defs' && country.tagName != 'sodipodi:namedview') { 
                countries[country.id] = country;
            }
        });
        // World & ocean settings
        countries['World'].style.fill = options.worldColor; 
        countries['Ocean'].style.fill = options.oceanColor; 
        if (options.showOcean == false) {
            countries['Ocean'].style.fill = 'none'; 
            countries['Ocean'].style.stroke = 'none'; 
        }
        //delete countries['Ocean']; // (Delete ocean from countries object) Keep it currently
        // Sort countries alphabetically
        countries = sortObject(countries);
        // Get microstates from labels and remove from countries
        sortLabels();
        // Show labels on start, if it is set
        if (options.showLabels == true) {
            toggleLabels('all');
        }
        delete countries['labels']; // Delete labels from countries object, not from map
        // Next steps: country detail sort and country groups 
        sortProvinces();
        if (options.groupCountries == true) {
            buildCountryGroups();
        }
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
                label.addEventListener("mouseover", function() { countryOver(this.id.substr(0, 2)); });
                label.addEventListener("mouseout", function() { countryOut(this.id.substr(0, 2)); });
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
            } else if ((event.substr(0, 1) == '#' || event.substr(0, 3) == 'rgb')) { // && path != selectedCountry && path.country != selectedCountry
                path.setAttribute('fill', event);
                path.setAttribute('stroke', event);
            }
        }
    }

    // Map controls
    function initMapControls() {
        for (var country in countries) {
            countries[country].addEventListener("mouseover", function() { provinceOverOut('over'); });
            countries[country].addEventListener("mouseout", function() { provinceOverOut('out'); });
            countries[country].addEventListener("mouseup", function() { provinceClick(); });
        }
        // Start library addon module, if it's set in options.mapTimeControls
        /*if (options.timeControls == true) {
            timeControls = svgWorldMapTimeControls(svgMap);
        }*/
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
        callBack(province, overout);
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
            callBack(selectedCountry, 'click');
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
            pathSetAttributes(province, 'over');
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
            pathSetAttributes(province, 'out');
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
        callBack(country, 'click');
    }

    // Update function for calling home from the outside, defined in 'svgMap.update' 
    window.updateData = function(updateData) {
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
    window.toggleLabels = function(updateLabels) {
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

    // Fire the (custom) callback functions, defined in 'options.mapOver', 'options.mapOut' and 'options.mapClick'
    function callBack(path, event) {
        if (event == 'over' && window[options.mapOver] && typeof(window[options.mapOver]) === "function") { 
            window[options.mapOver].apply(window, [path]);
        } else if (event == 'out' && window[options.mapOut] && typeof(window[options.mapOut]) === "function") { 
            window[options.mapOut].apply(window, [path]);
        } else if (event == 'click' && window[options.mapClick] && typeof(window[options.mapClick]) === "function") { 
            if (path == undefined) { path = ''; } // If path is undefined (because of selectedCountry), return empty string
            window[options.mapClick].apply(window, [path]);
        } 
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

    // Helper function for object alphabetical sort
    function sortObject(input) {
        return Object.keys(input).sort().reduce(function (object, key) { 
            object[key] = input[key];
            return object;
        }, {});
    }

    // Helper function for all countries and provinces
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
        "CA": { "name": "Canada", "region": "NA" }, "CC": { "name": "Cocos (Keeling) Islands", "region": "AS" }, "CD": { "name": "Congo (Demo. Rep.)", "region": "AF" }, "CF": { "name": "Central African Republic", "region": "AF" }, "CG": { "name": "Congo", "region": "AF" }, "CH": { "name": "Switzerland", "region": "EU" }, "CI": { "name": "Côte d'Ivoire", "region": "AF" }, "CK": { "name": "Cook Islands", "region": "OC" }, "CL": { "name": "Chile", "region": "SA" }, "CM": { "name": "Cameroon", "region": "AF" }, "CN": { "name": "China", "region": "AS" }, "CO": { "name": "Colombia", "region": "SA" }, "CR": { "name": "Costa Rica", "region": "NA" }, "CU": { "name": "Cuba", "region": "NA" }, "CV": { "name": "Cabo Verde", "region": "AF" }, "CW": { "name": "Curaçao", "region": "SA" }, "CX": { "name": "Christmas Island", "region": "AS" }, "CY": { "name": "Cyprus", "region": "EU" }, "CZ": { "name": "Czechia", "region": "EU" }, 
        "DE": { "name": "Germany", "region": "EU" }, "DJ": { "name": "Djibouti", "region": "AF" }, "DK": { "name": "Denmark", "region": "EU" }, "DM": { "name": "Dominica", "region": "NA" }, "DO": { "name": "Dominican Republic", "region": "NA" }, "DZ": { "name": "Algeria", "region": "AF" }, 
        "EC": { "name": "Ecuador", "region": "SA" }, "EE": { "name": "Estonia", "region": "EU" }, "EG": { "name": "Egypt", "region": "AF" }, "EH": { "name": "Western Sahara", "region": "AF" }, "ER": { "name": "Eritrea", "region": "AF" }, "ES": { "name": "Spain", "region": "EU" }, "ET": { "name": "Ethiopia", "region": "AF" }, 
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
        "PA": { "name": "Panama", "region": "NA" }, "PE": { "name": "Peru", "region": "SA" }, "PF": { "name": "French Polynesia", "region": "OC" }, "PG": { "name": "Papua New Guinea", "region": "OC" }, "PH": { "name": "Philippines", "region": "AS" }, "PK": { "name": "Pakistan", "region": "AS" }, "PL": { "name": "Poland", "region": "EU" }, "PM": { "name": "Saint Pierre and Miquelon", "region": "NA" }, "PN": { "name": "Pitcairn", "region": "OC" }, "PR": { "name": "Puerto Rico", "region": "NA" }, "PS": { "name": "Palestine", "region": "AS" }, "PT": { "name": "Portugal", "region": "EU" }, "PW": { "name": "Palau", "region": "OC" }, "PY": { "name": "Paraguay", "region": "SA" }, 
        "QA": { "name": "Qatar", "region": "AS" }, 
        "RE": { "name": "Réunion", "region": "AF" }, "RO": { "name": "Romania", "region": "EU" }, "RS": { "name": "Serbia", "region": "EU" }, "RU": { "name": "Russia", "region": "EU" }, "RW": { "name": "Rwanda", "region": "AF" }, 
        "SA": { "name": "Saudi Arabia", "region": "AS" }, "SB": { "name": "Solomon Islands", "region": "OC" }, "SC": { "name": "Seychelles", "region": "AF" }, "SD": { "name": "Sudan", "region": "AF" }, "SE": { "name": "Sweden", "region": "EU" }, "SG": { "name": "Singapore", "region": "AS" }, "SH": { "name": "Saint Helena, Ascension and Tristan da Cunha", "region": "AF" }, "SI": { "name": "Slovenia", "region": "EU" }, "SJ": { "name": "Svalbard and Jan Mayen", "region": "EU" }, "SK": { "name": "Slovakia", "region": "EU" }, "SL": { "name": "Sierra Leone", "region": "AF" }, "SM": { "name": "San Marino", "region": "EU" }, "SN": { "name": "Senegal", "region": "AF" }, "SO": { "name": "Somalia", "region": "AF" }, "SR": { "name": "Suriname", "region": "SA" }, "SS": { "name": "South Sudan", "region": "AF" }, "ST": { "name": "Sao Tome and Principe", "region": "AF" }, "SV": { "name": "El Salvador", "region": "NA" }, "SX": { "name": "Sint Maarten (Dutch part)", "region": "NA" }, "SY": { "name": "Syria", "region": "AS" }, "SZ": { "name": "Eswatini (Swaziland)", "region": "AF" }, 
        "TC": { "name": "Turks and Caicos Islands", "region": "NA" }, "TD": { "name": "Chad", "region": "AF" }, "TF": { "name": "French Southern Territories", "region": "AF" }, "TG": { "name": "Togo", "region": "AF" }, "TH": { "name": "Thailand", "region": "AS" }, "TJ": { "name": "Tajikistan", "region": "AS" }, "TK": { "name": "Tokelau", "region": "OC" }, "TL": { "name": "Timor-Leste (East Timor)", "region": "AS" }, "TM": { "name": "Turkmenistan", "region": "AS" }, "TN": { "name": "Tunisia", "region": "AF" }, "TO": { "name": "Tonga", "region": "AF" }, "TR": { "name": "Turkey", "region": "AS" }, "TT": { "name": "Trinidad and Tobago", "region": "NA" }, "TV": { "name": "Tuvalu", "region": "OC" }, "TW": { "name": "Taiwan", "region": "AS" }, "TZ": { "name": "Tanzania", "region": "AF" }, 
        "UA": { "name": "Ukraine", "region": "EU" }, "UG": { "name": "Uganda", "region": "AF" }, "UM": { "name": "United States Minor Outlying Islands", "region": "OC" }, "US": { "name": "United States", "region": "NA" }, "UY": { "name": "Uruguay", "region": "SA" }, "UZ": { "name": "Uzbekistan", "region": "AS" }, 
        "VA": { "name": "Holy See", "region": "EU" }, "VC": { "name": "Saint Vincent and the Grenadines", "region": "NA" }, "VE": { "name": "Venezuela", "region": "SA" }, "VG": { "name": "Virgin Islands (British)", "region": "NA" }, "VI": { "name": "Virgin Islands (U.S.)", "region": "NA" }, "VN": { "name": "Viet Nam", "region": "AS" }, "VU": { "name": "Vanuatu", "region": "OC" }, 
        "WF": { "name": "Wallis and Futuna", "region": "OC" }, "WS": { "name": "Samoa", "region": "OC" }, 
        "XK": { "name": "Kosovo", "region": "EU" }, 
        "YE": { "name": "Yemen", "region": "AS" }, "YT": { "name": "Mayotte", "region": "AF" }, 
        "ZA": { "name": "South Africa", "region": "AF" }, "ZM": { "name": "Zambia", "region": "AF" }, "ZW": { "name": "Zimbabwe", "region": "AF" }
    };

    // Return the main function
    return svgWorldMap;

})();
