// SVG World Map
// v0.0.4

var svgWorldMap = (function(){ 

    // Variables
    var svgMap;
    var countries;
    var countryData;
    var countryGroups = {};
    var options = {
        groupCountries: true, 
        groupBy: [ "region" ], 
    };

    // Main 
    function svgWorldMap(svg, options) {
        initMapCountries(svg);
        svgMap = { 'countries': countries, 'countryData': countryData, 'countryGroups': countryGroups};
        return svgMap;
    }

    // Init countries on map
    function initMapCountries(svg) {
        countries = {};
        countryNodes = svg.contentDocument.children[0].childNodes;
        countryNodes.forEach(function(country) {
             // Skip unclear disputed territories and also metadata, defs etc. - we want a clean node list
            if (country.id != undefined && country.id.substr(0, 1) != '_' && country.tagName != 'metadata' && country.tagName != 'defs' && country.tagName != 'sodipodi:namedview') { 
                countries[country.id] = country;
            }
        });
        sortProvinces();
        if (options.groupCountries == true) {
            buildCountryGroups();
        }
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
            country.removeAttribute('stroke');
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
            //var longname = countryData[nation.id].longname;
            //var sovereignty = countryData[nation.id].sovereignty;
            var region = countryData[nation.id].region;
            //console.log('Country: ' + countryData[country.id].name);
            //console.log('Region: ' + region.id);
            //document.getElementById("info").innerHTML = 'Country: ' + country.id + '<br>Nation: ' + name + '<br>Longname: ' + longname + '<br>Code: ' + code + '<br>Region: ' + region + '<br>Sovereignty: ' + sovereignty;
            document.getElementById("info").innerHTML = 'Country: ' + country.id + '<br>Nation: ' + name + '<br>Code: ' + code + '<br>Region: ' + region;
            document.getElementById("info").innerHTML += '<br><br>All countries / provinces / states in ' + name + ':<br>';
            nation.provinces.forEach(function(province) { document.getElementById("info").innerHTML += province.id + '<br>'; }); 
        } else {
            //console.log('Country data missing: ' + nation.id);
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
        for (var country in countries) {
            if (countries[country].id != 'Ocean') {
                if (countryData[countries[country].id] != undefined) { // Check for non-missing countries
                    for (var i=0; i<options.groupBy.length; i++) {
                        var mainGroup = options.groupBy[i]; // E.g. "region"
                        var subGroup = countryData[countries[country].id][mainGroup]; // E.g. "EU"
                        // Add new main group
                        if (countryGroups[mainGroup] == undefined) {
                            countryGroups[mainGroup] = {}; // New object for each main group
                        }
                        if (countryGroups[mainGroup][subGroup] == undefined) {
                            countryGroups[mainGroup][subGroup] = {}; // New object for each subGroup
                        }
                        countryGroups[mainGroup][subGroup][countries[country].id] = countries[country]; // Push country to subGroup
                    }
                } else {
                    //console.log('Country data missing: ' + countries[country].id);
                }
            }
        }
    }

    // Fallback countryData if no other is passed
    var countryData = { 
        "AD": { "name": "Andorra", "region": "EU" }, "AE": { "name": "United Arab Emirates", "region": "AS" }, "AF": { "name": "Afghanistan", "region": "AS" }, "AG": { "name": "Antigua and Barbuda", "region": "NA" }, "AI": { "name": "Anguilla", "region": "NA" }, "AL": { "name": "Albania", "region": "EU" }, "AM": { "name": "Armenia", "region": "EU" }, "AO": { "name": "Angola", "region": "AF" }, "AQ": { "name": "Antarctica", "region": "AN" }, "AR": { "name": "Argentina", "region": "SA" }, "AS": { "name": "American Samoa", "region": "OC" }, "AT": { "name": "Austria", "region": "EU" }, "AU": { "name": "Australia", "region": "OC" }, "AW": { "name": "Aruba", "region": "SA" }, "AX": { "name": "Åland Islands", "region": "EU" }, "AZ": { "name": "Azerbaijan", "region": "EU" }, 
        "BA": { "name": "Bosnia and Herzegovina", "region": "EU" }, "BB": { "name": "Barbados", "region": "SA" }, "BD": { "name": "Bangladesh", "region": "AS" }, "BE": { "name": "Belgium", "region": "EU" }, "BF": { "name": "Burkina Faso", "region": "AF" }, "BG": { "name": "Bulgaria", "region": "EU" }, "BH": { "name": "Bahrain", "region": "AS" }, "BI": { "name": "Burundi", "region": "AF" }, "BJ": { "name": "Benin", "region": "AF" }, "BL": { "name": "Saint Barthélemy", "region": "NA" }, "BM": { "name": "Bermuda", "region": "NA" }, "BN": { "name": "Brunei", "region": "AS" }, "BO": { "name": "Bolivia", "region": "SA" }, "BQ": { "name": "Bonaire, Sint Eustatius and Saba", "region": "SA" }, "BR": { "name": "Brazil", "region": "SA" }, "BS": { "name": "Bahamas", "region": "NA" }, "BT": { "name": "Bhutan", "region": "AS" }, "BV": { "name": "Bouvet Island", "region": "AN" }, "BW": { "name": "Botswana", "region": "AF" }, "BY": { "name": "Belarus", "region": "EU" }, "BZ": { "name": "Belize", "region": "NA" }, 
        "CA": { "name": "Canada", "region": "NA" }, "CC": { "name": "Cocos (Keeling) Islands", "region": "AS" }, "CD": { "name": "Congo (the Democratic Republic of the)", "region": "AF" }, "CF": { "name": "Central African Republic", "region": "AF" }, "CG": { "name": "Congo", "region": "AF" }, "CH": { "name": "Switzerland", "region": "EU" }, "CI": { "name": "Côte d'Ivoire", "region": "AF" }, "CK": { "name": "Cook Islands", "region": "OC" }, "CL": { "name": "Chile", "region": "SA" }, "CM": { "name": "Cameroon", "region": "AF" }, "CN": { "name": "China", "region": "AS" }, "CO": { "name": "Colombia", "region": "SA" }, "CR": { "name": "Costa Rica", "region": "NA" }, "CU": { "name": "Cuba", "region": "NA" }, "CV": { "name": "Cabo Verde", "region": "AF" }, "CW": { "name": "Curaçao", "region": "SA" }, "CX": { "name": "Christmas Island", "region": "AS" }, "CY": { "name": "Cyprus", "region": "EU" }, "CZ": { "name": "Czechia", "region": "EU" }, 
        "DE": { "name": "Germany", "region": "EU" }, "DJ": { "name": "Djibouti", "region": "AF" }, "DK": { "name": "Denmark", "region": "EU" }, "DM": { "name": "Dominica", "region": "NA" }, "DO": { "name": "Dominican Republic", "region": "NA" }, "DZ": { "name": "Algeria", "region": "AF" }, 
        "EC": { "name": "Ecuador", "region": "SA" }, "EE": { "name": "Estonia", "region": "EU" }, "EG": { "name": "Egypt", "region": "AF" }, "EH": { "name": "Western Sahara", "region": "AF" }, "ER": { "name": "Eritrea", "region": "AF" }, "ES": { "name": "Spain", "region": "EU" }, "ET": { "name": "Ethiopia", "region": "AF" }, 
        "FI": { "name": "Finland", "region": "EU" }, "FJ": { "name": "Fiji", "region": "OC" }, "FK": { "name": "Falkland Islands", "region": "SA" }, "FM": { "name": "Micronesia", "region": "OC" }, "FO": { "name": "Faroe Islands", "region": "EU" }, "FR": { "name": "France", "region": "EU" }, 
        "GA": { "name": "Gabon", "region": "AF" }, "GB": { "name": "United Kingdom of Great Britain and Northern Ireland", "region": "EU" }, "GD": { "name": "Grenada", "region": "NA" }, "GE": { "name": "Georgia", "region": "EU" }, "GF": { "name": "French Guiana", "region": "SA" }, "GG": { "name": "Guernsey", "region": "EU" }, "GH": { "name": "Ghana", "region": "AF" }, "GI": { "name": "Gibraltar", "region": "EU" }, "GL": { "name": "Greenland", "region": "NA" }, "GM": { "name": "Gambia", "region": "AF" }, "GN": { "name": "Guinea", "region": "AF" }, "GP": { "name": "Guadeloupe", "region": "NA" }, "GQ": { "name": "Equatorial Guinea", "region": "AF" }, "GR": { "name": "Greece", "region": "EU" }, "GS": { "name": "South Georgia and the South Sandwich Islands", "region": "AN" }, "GT": { "name": "Guatemala", "region": "NA" }, "GU": { "name": "Guam", "region": "OC" }, "GW": { "name": "Guinea-Bissau", "region": "AF" }, "GY": { "name": "Guyana", "region": "SA" }, 
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
        "RE": { "name": "Réunion", "region": "AF" }, "RO": { "name": "Romania", "region": "EU" }, "RS": { "name": "Serbia", "region": "EU" }, "RU": { "name": "Russian Federation", "region": "AS" }, "RW": { "name": "Rwanda", "region": "AF" }, 
        "SA": { "name": "Saudi Arabia", "region": "AS" }, "SB": { "name": "Solomon Islands", "region": "OC" }, "SC": { "name": "Seychelles", "region": "AF" }, "SD": { "name": "Sudan", "region": "AF" }, "SE": { "name": "Sweden", "region": "EU" }, "SG": { "name": "Singapore", "region": "AS" }, "SH": { "name": "Saint Helena, Ascension and Tristan da Cunha", "region": "AF" }, "SI": { "name": "Slovenia", "region": "EU" }, "SJ": { "name": "Svalbard and Jan Mayen", "region": "EU" }, "SK": { "name": "Slovakia", "region": "EU" }, "SL": { "name": "Sierra Leone", "region": "AF" }, "SM": { "name": "San Marino", "region": "EU" }, "SN": { "name": "Senegal", "region": "AF" }, "SO": { "name": "Somalia", "region": "AF" }, "SR": { "name": "Suriname", "region": "SA" }, "SS": { "name": "South Sudan", "region": "AF" }, "ST": { "name": "Sao Tome and Principe", "region": "AF" }, "SV": { "name": "El Salvador", "region": "NA" }, "SX": { "name": "Sint Maarten (Dutch part)", "region": "NA" }, "SY": { "name": "Syria", "region": "AS" }, "SZ": { "name": "Eswatini (Swaziland)", "region": "AF" }, 
        "TC": { "name": "Turks and Caicos Islands", "region": "NA" }, "TD": { "name": "Chad", "region": "AF" }, "TF": { "name": "French Southern Territories", "region": "AF" }, "TG": { "name": "Togo", "region": "AF" }, "TH": { "name": "Thailand", "region": "AS" }, "TJ": { "name": "Tajikistan", "region": "AS" }, "TK": { "name": "Tokelau", "region": "OC" }, "TL": { "name": "Timor-Leste (East Timor)", "region": "AS" }, "TM": { "name": "Turkmenistan", "region": "AS" }, "TN": { "name": "Tunisia", "region": "AF" }, "TO": { "name": "Tonga", "region": "AF" }, "TR": { "name": "Turkey", "region": "AS" }, "TT": { "name": "Trinidad and Tobago", "region": "NA" }, "TV": { "name": "Tuvalu", "region": "OC" }, "TW": { "name": "Taiwan", "region": "AS" }, "TZ": { "name": "Tanzania, the United Republic of", "region": "AF" }, 
        "UA": { "name": "Ukraine", "region": "EU" }, "UG": { "name": "Uganda", "region": "AF" }, "UM": { "name": "United States Minor Outlying Islands", "region": "OC" }, "US": { "name": "United States of America", "region": "NA" }, "UY": { "name": "Uruguay", "region": "SA" }, "UZ": { "name": "Uzbekistan", "region": "AS" }, 
        "VA": { "name": "Holy See", "region": "EU" }, "VC": { "name": "Saint Vincent and the Grenadines", "region": "NA" }, "VE": { "name": "Venezuela", "region": "SA" }, "VG": { "name": "Virgin Islands (British)", "region": "NA" }, "VI": { "name": "Virgin Islands (U.S.)", "region": "NA" }, "VN": { "name": "Viet Nam", "region": "AS" }, "VU": { "name": "Vanuatu", "region": "OC" }, 
        "WF": { "name": "Wallis and Futuna", "region": "OC" }, "WS": { "name": "Samoa", "region": "OC" }, 
        "YE": { "name": "Yemen", "region": "AS" }, "YT": { "name": "Mayotte", "region": "AF" }, 
        "ZA": { "name": "South Africa", "region": "AF" }, "ZM": { "name": "Zambia", "region": "AF" }, "ZW": { "name": "Zimbabwe", "region": "AF" }
    };

    return svgWorldMap;

})();
