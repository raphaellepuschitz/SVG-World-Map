
SVG World Map JS
================

A JavaScript library to easily integrate one or more SVG world map(s) with all nations (countries) and political subdivisions (countries, provinces, states).  

Use this map and library as a boilerplate for a **Strategy Game**, for **Data Visualization** of scientific research and other data, or as an **Interactive Map** for your article, paper, website or app. 

> ***Attention:*** This library is under development and currently in an early alpha phase. Use it carefully! 

The SVG World Map JS library constists of 3 parts, which can be used separately:

* A detailed **[SVG world map](#part-1-the-map)** with all nations and second-level provinces, ready for editing with your preferred graphics editor
* A **[List of all world countries](#part-2-the-list)** with additional information, ready for use with the SVG map
* A **[JavaScript SVG library](#part-3-the-library)** developed for the map and optimized for quick SVG path access, customizable with options and a little callback-API

To unleash the full power of the SVG map you should of course use all 3 combined ;-)


Demos
-----

<!---
* Basics
* Callbacks
* Custom data
* Custom options
-->
* [Groups, callbacks & zoom](./demo/groups-callbacks-zoom.html) (width [svg-pan-zoom.js](https://github.com/ariutta/svg-pan-zoom))


Part 1: The Map
---------------

Download current version: [World_States_Provinces.svg](./src/World_States_Provinces.svg)  

The map is based on the creative commons [Blank Map World Secondary Political Divisions.svg](https://commons.wikimedia.org/wiki/File:Blank_Map_World_Secondary_Political_Divisions.svg) from [Wikimedia Commons](https://commons.wikimedia.org).  
It was modified to serve the purpose of this JavaScript library, so all world nations are **grouped**, **sorted** and **named** by their official [ISO 3166-1 alpha-2](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2) country codes.  
The country paths in the SVG are not the work of the library author. See the version history and authorship of the original file [here](https://commons.wikimedia.org/wiki/File:Blank_Map_World_Secondary_Political_Divisions.svg). 


Because of all the detailed subregions the map has a lot of vectors and is rather large for an image (~3,9 MB).  
Make sure to use the SVG only, if:

* You really need a fully detailed world map with all nations, provinces and states. If not, there's a ton of smaller SVGs at [Wikimedia Commons: SVG blank maps of the world](https://commons.wikimedia.org/wiki/Category:SVG_blank_maps_of_the_world) and elsewhere. 
* Your users have a fast internet connection, or:
* You add a preloader or caching layer for faster delivery (a simple loading bar will also work in some cases). 

> The political subdivisions (countries, provinces, states) are mostly not named correctly, like `<path id="path12345" ...>`. This issue will be addressed in future versions. 


Part 2: The List
----------------

There are 2 versions of the country list: 

* A [CSV file](./src/countrydata.csv) for easy editing with any office software
* A [JSON file](./src/countrydata.json) for easy integration with frontend or backend systems

The list includes 250 countries and microstates from Andorra to Zimbabwe with this additional information:  

* The ISO country **code**, e.g. "AT"
* The country **name**, e.g. "Austria"
* The official **longname**, e.g. "The Republic of Austria"
* The countries **sovereignty**, e.g. "UN"
* The world **region**, e.g. "EU"

> The political subdivisions (countries, provinces, states) are currently not included in the country list. They will be added in future versions. 


Part 3: The Library
-------------------

### Requirements

Although this project only uses frontend technologies, most browsers nowadays don't accept the `file://` protocol for SVGs or JSONs, so SVG World Map needs to run on a (local) server. If you are new to HTML / SVG / JavaScript integration, please see the Pitfalls section first.  


### How to use

First, add [World_States_Provinces.svg](./src/World_States_Provinces.svg) and [svg-world-map.js](./src/svg-world-map.js) to your HTML document:

```html
<object id="svg-world-map" data="World_States_Provinces.svg" type="image/svg+xml"></object>
```

```html
<script src="svg-world-map.js"></script>
```

Then initialize the library with the SVG map added before:

```js
var mySVG = document.getElementById('svg-world-map'); 
var myWorldMap = svgWorldMap(mySVG); 
```

So far for the basic setup.

> Note that the HTML, the SVG and the JS must all be loaded before the library is initialized. There's multiple ways of doing this, like `window.onload()`, `mySVG.addEventListener("load", ...)`, `$(document).ready()` (in JQuery), etc. 


### Custom options 

The default options can be overruled by passing an object of custom options. All `color`, `fill` and `stroke` arguments take hex and rgb(a) values or 'none' as input. The value of `mapClick` is a callback function name and can be customized (see the API section for details). The default options are: 

```js
var options = {
    showOcean: true, 
    oceanColor: '#D8EBFF', 
    provinceFill: { out: '#B9B9B9',  over: '#FFFFFF',  click: '#666666' }, 
    provinceStroke: { out: '#FFFFFF',  over: '#FFFFFF',  click: '#666666' }, 
    provinceStrokeWidth: { out: '0.1',  over: '0.5',  click: '0.5' }, 
    groupCountries: true, 
    groupBy: [ "region" ], // Sort countryData by this value(s) and return to countryGroups
    mapClick: "mapClick", // Callback function from the map to the outside, can have a custom name
};
```

The custom options are passed as second (optional) parameter to the map at startup. You can either hand them over as an object similar to the one above (with `myCustomOptions` instead of `options`): 

```js
var myWorldMap = svgWorldMap(mySVG, myCustomOptions); 
```

Or as inline paramater: 

```js
var myWorldMap = svgWorldMap(mySVG, { showOcean: false, groupCountries: false, mapClick: "customMapClick" }); 
```

> More options like countryFill, countryStroke and countryStrokeWidth will be added when the SVG map has all country borders (currently a lot are missing).  


### Map object return values

After initialization, the `svgWorldMap()` function will give you an object in return.  
If the map is called like this `var myWorldMap = svgWorldMap(mySVG);`, then the return data looks something like this: 

```js
myWorldMap = { 
    countries: { AD: '<g id="AD">', AE: '<g id="AE">', ... }, 
    countryData: { AD: { name: "Andorra", longname: ... }, ... }, 
    countryGroups: { region: { AF: {...}, AN: {...}, ... }, ... }, 
    out: function(id) { ... }, // Calling home functions from outside into the map 
    over: function(id) { ... }, 
    click: function(id) { ... }, 
    update: function(data) { ... } 
};
```

Let's break this down in detail, as each return object can be very useful:


#### Country list

This sub object `svgWorldMap.countries` includes a list of all top level countries (the main groups in the SVG), where key is the country code and value is the `<g id="AD">` group element (which includes all sub provinces).  

There are also some special informations added **directly to the `<g>` and all child `<path>`** elements, which can come in very handy for quick element access. Let's have a look at Canada: 

```js
svgWorldMap.countries['CA'].name = 'Canada'; 
svgWorldMap.countries['CA'].region = 'NA'; // North America
svgWorldMap.countries['CA'].country = '<g id="CA">'; // The group element of the main country
svgWorldMap.countries['CA'].provinces = [ '<path id="CA-AB" fill="#B9B9B9" ...>', '<path id="CA-BC" fill="#B9B9B9" ...>', ... ]; // Array with all sub-province paths
```

> The political subdivisions (countries, provinces, states) are mostly not named correctly, like `<path id="path12345" ...>`. This issue will be addressed in future versions. 


#### Country data 

The `svgWorldMap.countryData` is a copy of the (optional) `countryData` parameter at startup (see next section) or the fallback data from the library. If you don't modify the basic country data, this object inculdes the following information: 

```js
svgWorldMap.countryData['CA'].name = 'Canada'; 
svgWorldMap.countryData['CA'].longname = 'Canada'; 
svgWorldMap.countryData['CA'].region = 'NA'; // North America
svgWorldMap.countryData['CA'].sovereignty = 'UN'; // United Nations member state
```


#### Country groups

Country groups are an essential feature of the SVG World Map library and can help you access a whole bunch of countries simultaneously. Countries are grouped by the information of the `svgWorldMap.countryData` explained before. By default, the countries are grouped by their respective world region, so `svgWorldMap.countryGroups` contains the data as follows: 

```js
svgWorldMap.countryGroups.region: {
    AF: {                       // Africa 
        AO: '<g id="AO">',      // Angola
        BF: '<g id="BF">',      // Burkina Faso
        BI: '<g id="BI">',      // Burundi
        ...
        ZA: '<g id="ZA">',      // South Africa
        ZM: '<g id="ZM">',      // Zambia
        ZW: '<g id="ZW">'       // Zimbabwe
    }, 
    AN: { '<g id="AQ">', ... }, // Antarctica
    AS: { '<g id="AE">', ... }, // Asia
    ​​EU: { '<g id="AD">', ... }, // Europe
    ​​NA: { '<g id="AG">', ... }, // North America
    ​​OC: { '<g id="AS">', ... }​​, // Australia & Oceania
    SA: { '<g id="AR">', ... }​​  // South America
}
```

Groups can be deactivated by setting the `options.groupCountries` value to `false` (default is `true`):

```js
var myWorldMap = svgWorldMap(mySVG, { groupCountries: false }); 
```

If you want to add a country group, you have to add the category key from country data to the `options.groupBy`. Let's say we also want a `sovereignty` group, then the options would have to look like: 

```js
var myCustomOptions = {
    ...
    groupCountries: true, 
    groupBy: [ "region", "sovereignty" ], // Sort countryData by this value(s) and return to countryGroups
};
var myWorldMap = svgWorldMap(mySVG, myCustomOptions); 
```


#### Country over, out, click and update

These functions are part of the **API**, see below for further information.


### Change the basic country data

There's two kinds of data for countries: 

* The **initial country data** is passed as a JSON object in the same format as the [countrydata.json](./src/countrydata.json) 
* There's an **update map API-call**. For further information about manipulating the country color at runtime, see the sections below. 

> If you want to add custom data from a modified country list in CSV format, please covert it to a **keyed JSON file**. A good CSV to JSON converter can be found [here](https://www.convertcsv.com/csv-to-json.htm) (make sure to select "CSV to keyed JSON"). CSV import will be added in future versions. 


#### JSON format

To add or change the country information on startup, you can simply pass your JSON data to the `svgWorldMap()` as third (optional) parameter (the second one is options).  

```js
var myWorldMap = svgWorldMap(mySVG, {}, countryData); 
```

The library will then do the logic: For example, you could upload your own list with the country population in the year 1000 or change all the countries names with planet names from *Star Trek*. In that case, you would have to change the country data from this...

```js
var countryData = {
    AD: {
        name: "Andorra",
        longname: "The Principality of Andorra",
        sovereignty: "UN",
        region: "EU"
    }, ... 
}
```

...to this:

```js
var countryData = {
    AD: {
        name: "Andoria",
        longname: "Andorian Empire",
        sovereignty: "UFP", // United Federation of Planets
        region: "AQ" // Alpha Quadrant
    }, ... 
}
```

> **Note:** You can change all country information ***except*** the country code, which is the identifier for the corresponding map path.  


### Callback and home APIs


#### Calling back from the map

As seen in the options setup, there's a callback function for a click on the map, which can also have a custom name. Let's say you named it `"customMapClick"` and you want to to catch the callback for the clicked country, then the code would look something like this: 

```js
function customMapClick(country) {
    var countryid = country.id; // Id of clicked path on map
    ...
}
```


#### Calling home to the map

There are currently 4 calling home functions, 3 for country over, out and click and one for update.  

The `over()`, `out()` and `click()` functions will trigger the attribute changes for `fill`, `stroke` and `stroke-width` defined in `options`. They only need the country id parameter:  

```js
myWorldMap.out('AT');
myWorldMap.over('AT');
myWorldMap.click('AT');
```

```html
<li id="AT" onmouseover="myWorldMap.over('AT')" onmouseout="myWorldMap.out('AT')" onclick="myWorldMap.click('AT')">Austria</li>
```

The `update()` function changes the color of one or more countries at once. The input object uses the same format as the `svgWorldMap.countries` object. Each country can have an individual color, which is passed via country id and a color value:  

```js
myWorldMap.update({ DE: '#00FF00', AT: '#00FF00', CH: '#00FF00' });
```


TODOs & Further Development
---------------------------

* Add demos
* Fix path bugs
* Name all provinces in the SVG (This may take a while... Help appreciated!)
* Add further options
* Add info boxes to the map
* Add country names to the map
* Add bubbles / circles to the map
* Improve the API
* Modify the library for use with other SVG maps (RPG gamers, I'm talking to you!)


Pitfalls, Known Issues & Bugs
-----------------------------

### Pitfalls

* A lot of problems with SVGs include loading issues, make sure the SVG is fully loaded before you initialize the library
* SVGs can not be called via `file://`, so make sure you have a (local) server for this library (although it's completely frontend)
* Most browsers don't accept a mix of `http://` and `https://`, this can also affect SVG or JSON loading


### Known Issues & Bugs

* Currently several small bugs, mainly SVG path related
* It seem's that there is a problem running this with node live server
* Slow or old computers or bad internet conncetion will show nothing but the map
* If you find a bug, be nice to it (and also let me know of it) ;-) 
