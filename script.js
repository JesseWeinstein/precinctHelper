//Written by Jesse Weinstein <jesse@wefu.org>, Sept 3, 2017
//Some code adapted from https://s3-us-west-2.amazonaws.com/kccaucus/script.js by Jon Culver
//
//To the extent possible under law, I have waived all copyright and related or neighboring
//rights to this work, via the CC0 declaration.
//<a rel="license" href="http://creativecommons.org/publicdomain/zero/1.0/">

var kccaucus = (function($){

    var obj = {
        init: function(){
            return obj;
        },

        handleFiles: function(files) {
            console.log('!!!');
            if (!files.length) {
                $("#messageElem").html("No files selected!");
            } else {
                obj.output = [];
                obj.rowCount = 0;
                obj.isComplete = false;
                Papa.parse(files[0], {
                    header: true,
                    step: function(row) {
	                console.log("Row:", row.data);
                        obj.rowCount += 1;
                        row.data[0].precinct = "";
                        obj.doAddressLookup(row.data[0].Address, row.data[0].Zip, row);
	            },
                    complete: function() {
                        obj.isComplete = true;
                    }
                });
            }
        },
        
        doAddressLookup: function(address, zip, row) {            
            if (!address || !zip) {
                console.log("Missing address (" + address + ") or zip (" + zip + ")" );
                obj.addToOutput(row);
                return;
            }
            var search_params = "Street=" + encodeURIComponent(address) + "&City=" + encodeURIComponent(zip);

            var url = "http://gismaps.kingcounty.gov/ArcGIS/rest/services/Address/Address_Points_locator/GeocodeServer/findAddressCandidates?" + search_params + "&f=json&outSR=%7B%22wkid%22%3A102100%7D&outFields=Loc_name";
            
            $.ajax({
                'url': url,
                'format': 'jsonp',
                'success': function(data, status, jqXHR){
                    console.log("Address looked up " + address);
                    obj.lookupPrecinctData(JSON.parse(data)['candidates'][0], row);
                }
            });

        },

        lookupPrecinctData: function(location, row){
            if (!location) {
                console.log("Unable to find address.");
                obj.addToOutput(row);
                return;
            }
            var lng = location['location']['x'],
                lat = location['location']['y'];
            var spatial_reference = {latestWkid: 3857};

            var geometry = encodeURIComponent("{\"points\":[[" + lng + "," + lat + "]],\"spatialReference\":" + JSON.stringify(spatial_reference) + "}");
            var url = "http://gismaps.kingcounty.gov/ArcGIS/rest/services/Districts/KingCo_Electoral_Districts/MapServer/identify?f=json&geometry=" + geometry + "&tolerance=3&returnGeometry=false&mapExtent=%7B%22xmin%22%3A0%2C%22ymin%22%3A0%2C%22xmax%22%3A-%2C%22ymax%22%3A0%2C%22spatialReference%22%3A%7B%22wkid%22%3A102100%7D%7D&imageDisplay=400%2C400%2C96&geometryType=esriGeometryMultipoint&sr=1021000&layers=all:0";

            $.ajax({
                'url': url,
                'format': 'jsonp',
                'success': function(data, status, jqXHR){
                    row.data[0].precinct = JSON.parse(data).results[0].value;
                    obj.addToOutput(row);
                }
            });
        },
        addToOutput: function(row) {
            obj.output.push(row.data[0]);
            if (obj.isComplete && obj.output.length === obj.rowCount) {
                console.log(obj.output);
                $("#messageElem").html(Papa.unparse(obj.output));
            }
        }
    }
    return obj.init();
})(jQuery);