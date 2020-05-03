/**
 * SVG World Map JS Time Controls
 * 
 * Package: SVG World Map JS
 * URL: https://github.com/raphaellepuschitz/SVG-World-Map
 **/

// Main function
export function svgWorldMapTimeControls(svgWorldMap, timePause, timeLoop, initTimeData) { 

    // Global variables
    var timer; // Interval
    var date = 0; // date = current day, month, year etc.
    var ticks = 0; // For speed
    var speed = 10; // For ticks per date
    var timeData = false;
    var maxDates = false;
    var loop = false;
    var paused = true;

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
    document.getElementsByTagName('head')[0].insertAdjacentHTML('beforeend', '<link rel="stylesheet" href="../src/font/flaticon.css" />');

    // Start HTML injection
    initControls();

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
            if (date < maxDates || maxDates == false) {
                date++;
            } else {
                if (loop) {
                    date = 0; // Return to start if loop is on
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
                date = this.value;
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
        if (timeData) {
            var dateKey = Object.keys(timeData[date])[0]; // Get date by first key
            document.getElementById("map-slider").value = date;
            document.getElementById("map-date").innerHTML = dateKey;
            svgWorldMap.update(timeData[date][dateKey]); // Call update function in SVG World Map lib 
        } else {
            document.getElementById("map-date").innerHTML = date;
        }
        svgWorldMap.date(date); // Call date and then callback function in SVG World Map lib 
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
            date = 0;
        } else if (controlid == 'map-control-end') {
            date = maxDates;
        } else if (controlid == 'map-control-back' && date > 0) {
            date--;
        } else if (controlid == 'map-control-forward' && date < maxDates) {
            date++;
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

    // HTML for controls
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
            initDayTimer();
            initSilder();
            initKeyControls();
            updateControls();
        }
    }

    // CSS for controls
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

}
