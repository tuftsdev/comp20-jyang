var myLat = -99, myLng = -99, me;

//options for loading map
var myOptions =
{
    zoom: 14,
    center: me,
    mapTypeId: google.maps.MapTypeId.ROADMAP
};

var map, infoWindow = new google.maps.InfoWindow();

function init()
{
    map = new google.maps.Map(document.getElementById("canvas"), myOptions);
    getMyLocation();
}

function getMyLocation()
{
    if (navigator.geolocation) // the navigator.geolocation object is supported on your browser
    {
        navigator.geolocation.getCurrentPosition(function(position)
        {
            myLat = position.coords.latitude;
            myLng = position.coords.longitude;
            ajax();
        });
    }
    else
        alert("Geolocation is not supported by your web browser.  Sorry!");
}

function ajax()
{
    //make instance of XMLHttpRequest
    var request = new XMLHttpRequest();

    //set up http request
    request.open("POST", "https://defense-in-derpth.herokuapp.com/sendLocation", true);

    //add parameter to http request header
    request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

    //set up callback on what to do when response is received
    request.onreadystatechange = function()
    {
        if (request.readyState == 4 && request.status == 200)
        {
            var rawData = request.responseText;
            locations = JSON.parse(rawData);
            renderMap();
        }
    }
    
    //fire off request
    var parameters = "login=7QNJ31fE" + "&" +
                     "lat=" + myLat + "&" +
                     "lng=" + myLng;
    request.send(parameters);
}

function renderMap()
{
    me = new google.maps.LatLng(myLat, myLng);
    
    // Update map and go to my location
    map.panTo(me);
    
    //markers icons
    var myIcon = "me-emoji.png", friendIcon = "friend-emoji.png", landmarkIcon = "landmark-emoji.png";
    
    //create friend markers
    for (i = 0; i < locations["people"].length; i++)
        addFriendMarker(i, friendIcon);
    
    //set initial closest to first landmark
    var closestLandmark;

    //create landmark markers
    for (i = 0; i < locations["landmarks"].length; i++)
    {
        currMarker = addLandMarker(i, landmarkIcon);
        
        if (i == 0) //set initial closest to first marker in list
            closestLandmark = currMarker;
        
        if (currMarker.distance < closestLandmark.distance)
            closestLandmark = currMarker;
    }
    
    //console.log(locations);
    //create user marker
    addMyMarker(myIcon, closestLandmark);
}

//create friend marker
function addFriendMarker(i, friendIcon)
{
    //if person is not user
    if (locations["people"][i]["login"] != "7QNJ31fE")
    {
        var friendLat = locations["people"][i]["lat"];
        var friendLng = locations["people"][i]["lng"];
        friend = {lat: friendLat, lng: friendLng};
        
        //distance = google.maps.geometry.spherical.computeDistanceBetween(me, friend) / 1609.34;
        
        distance = calcDistance(myLat, myLng, friendLat, friendLng);    //distance between user and friend
        
        friendMarker = new google.maps.Marker({
            position: friend,
            map: map,
            icon: friendIcon
        });
        
        //info window content
        friendMarker.content = "<p>" + "Login: " + locations["people"][i]["login"] + "<br />" + "Distance: " + distance + " miles</p>";
        
        //set friend info window
        google.maps.event.addListener(friendMarker, 'click', function()
        {
            infoWindow.setContent(this.content);
            infoWindow.open(map, this);
        });
    }
}

//create landmark marker
//returns marker
function addLandMarker(i, landmarkIcon)
{
    var landmarkLat = locations["landmarks"][i]["geometry"]["coordinates"][1];
    var landmarkLng = locations["landmarks"][i]["geometry"]["coordinates"][0];
    
    landmark = {lat: landmarkLat, lng: landmarkLng};

    landMarker = new google.maps.Marker({
        position: landmark,
        map: map,
        icon: landmarkIcon
    });

    landMarker.name = locations["landmarks"][i]["properties"]["Location_Name"];      //set name
    
    landMarker.distance = calcDistance(myLat, myLng, landmarkLat, landmarkLng);     //set distance from user
    
    landMarker.content = locations["landmarks"][i]["properties"]["Details"];    //set info window content
    
    //set friend info window
    google.maps.event.addListener(landMarker, 'click', function()
    {
        infoWindow.setContent(this.content);
        infoWindow.open(map, this);
    });
    
    return landMarker;
}

 function addMyMarker(myIcon, closestLandmark)
 {
     //create user marker
     myMarker = new google.maps.Marker({
         position: me,
         map: map,
         icon: myIcon
     });
 
     //user info window content
     myMarker.content = "<p>" + "You are here!" + "<br />" + "Closest landmark: " + closestLandmark.name + "<br />" + "Distance: " + closestLandmark.distance + " miles</p>";
 
     //set user info window
     google.maps.event.addListener(myMarker, 'click', function()
     {
         infoWindow.setContent(myMarker.content);
         infoWindow.open(map, myMarker);
     });
 }

//convert to radians
Number.prototype.toRad = function()
{
    return this * Math.PI / 180;
}

//calculate distance in miles between 2 geolocations
function calcDistance(lat1, lng1, lat2, lng2)
{
    var x1 = lat2 - lat1;
    var dLat = x1.toRad();
    var x2 = lng2 - lng1;
    var dLng = x2.toRad();
    
    var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1.toRad()) * Math.cos(lat2.toRad()) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
    
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    
    return c * 3.9587657052;    //miles
}
