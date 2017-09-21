$(document).ready(function(){
  var database = firebase.database();
  // declare global variables for different sections of code
  var summary = "";
  var location = "";
  var startTime ="";
  var endTime = "";
  var eventsFor = "";
  var attendees = "";
  var invitees = "";
  
  var storedData = JSON.parse(sessionStorage.getItem('userData'));
  var url = window.location.search;
  
  // Getting the calendar owner from session storage
  var calOwner = sessionStorage.getItem("calOwner");
  console.log(calOwner);
  // Checking to see whether user is logged in
  if(storedData){
    if (storedData.status && storedData.currentUser) {
      console.log(storedData);
      currentUser = storedData.currentUser;
      currentStatus = storedData.status;
      console.log("user:"+currentUser);
      console.log("status:"+currentStatus);
    }else{
      location.href = "login.html";
    }
  }else{
    location.href = "login.html";
  }  
$("#update").hide(); 
$("#addEvent").on("click", function(e){
  e.preventDefault();
  
  // If logged in user is not the calendar owner then add the event to firebase under /pending-events
  //else add event into calendar

  summary = $("#summary").val().trim();
  location = $("#autocomplete").val().trim();
  startTime = new Date($("#startTime").val().trim());
  var formattedStartDate = moment(startTime, "YYYY/MM/DD HH:mm A").unix();
  endTime = new Date($("#endTime").val().trim());
  var formattedEndDate = moment(endTime, "YYYY/MM/DD HH:mm A").unix();
  eventsFor = calOwner;
  //datetimes must be in this format YYYY-MM-DDTHH:MM:SS.MMM+HH:MM
  ////So that's year, month, day, the letter T, hours, minutes, seconds, miliseconds, + or -, timezoneoffset in hours and minutes
  attendees = $("#attendees").val().trim();
  invitees = splitStr(attendees);
  if(currentUser !== calOwner) {
    console.log("diff user");
    //Add event to the pending requests list and database
    var myKey = firebase.database().ref().push().key;
    database.ref('pending-events/').push({
      summary: summary,
      location: location,
      startTime: formattedStartDate,
      endTime: formattedEndDate,
      attendees: attendees,
      currentUser: currentUser,
      eventsFor: eventsFor,
      id: myKey
    });
    //Clear the input fields after data is added to database
    $("#summary").val("");
    $("#eventLocation").val("");
    $("#startTime").val("");
    $("#endTime").val("");
    $("#attendees").val("");
  }else {
    console.log("same user");
    // Add the new event to the Google Calendar
    // Check if there are guests for the event and include them in the event resource
    // else construct the event resource without attendees
    if(attendees){
      var event = {
        'summary': summary,
        'location': location,
        'start': {
          'dateTime': startTime.toISOString(),
          'timeZone': 'America/New_York'
        },
        'end': {
          'dateTime': endTime.toISOString(),
          'timeZone': 'America/New_York'
        },
        'attendees': invitees,
        'reminders': {
          'useDefault': false,
          'overrides': [
            {'method': 'email', 'minutes': 24 * 60},
            {'method': 'popup', 'minutes': 10}
          ]
        }
      };
    }else{
      var event = {
        'summary': summary,
        'location': location,
        'start': {
          'dateTime': startTime.toISOString(),
          'timeZone': 'America/New_York'
        },
        'end': {
          'dateTime': endTime.toISOString(),
          'timeZone': 'America/New_York'
        },
        'reminders': {
          'useDefault': false,
          'overrides': [
            {'method': 'email', 'minutes': 24 * 60},
            {'method': 'popup', 'minutes': 10}
          ]
        }
      };
    }
    console.log(event);
    //Clear the input fields after data is added to database
    $("#summary").val("");
    $("#autocomplete").val("");
    $("#startTime").val("");
    $("#endTime").val("");
    $("#attendees").val("");
    addUpcomingEvent(event);
  } 
});

$("body").on("click", "#deleteEvent", function(e){
  e.preventDefault();
  if(currentUser === calOwner){
    var calendarId = calOwner;
    var eventId = $(this).attr("data-key");
    var request = gapi.client.calendar.events.delete({
    'calendarId': calendarId,
    'eventId': eventId,
    'sendNotifications': true
    });

    request.execute(function(event) {
    Materialize.toast("Event deleted!", 4000);
  });
}else{
    Materialize.toast("Sign In to edit user details!", 4000);
}    
});

// -------------------------------------------------------------------
//  Pending requests related operations

$("body").on("click", "#addToCal", function(e){
e.preventDefault();
var key = $(this).attr("data-key");
addAnEvent(key);
})

function addAnEvent(key) {
//if logged in user is the calendar owner then delete event from firebase under /pending-events
//and add event into calendar
if(currentUser === calOwner) {
  summary = $("#eventSummary").text().trim();
  location = $("#eventLoc").text().trim();
  startTime = moment($("#eventStart").text().trim());
  endTime = moment($("#eventEnd").text().trim());
  attendees = $("#guests").text().trim();
  invitees = splitStr(attendees);
  console.log("same user");
  // Add the new event to the Google Calendar
  if(attendees){
    var event = {
      'summary': summary,
      'location': location,
      'start': {
        'dateTime': startTime.format(),
        'timeZone': 'America/New_York'
      },
      'end': {
        'dateTime': endTime.format(),
        'timeZone': 'America/New_York'
      },
       'attendees': invitees,
      'reminders': {
        'useDefault': false,
        'overrides': [
          {'method': 'email', 'minutes': 24 * 60},
          {'method': 'popup', 'minutes': 10}
        ]
      }
    };
  }else{
    var event = {
      'summary': summary,
      'location': location,
      'start': {
        'dateTime': startTime.format(),
        'timeZone': 'America/New_York'
      },
      'end': {
        'dateTime': endTime.format(),
        'timeZone': 'America/New_York'
      },
      'reminders': {
        'useDefault': false,
        'overrides': [
          {'method': 'email', 'minutes': 24 * 60},
          {'method': 'popup', 'minutes': 10}
        ]
      }
    };  
  }
  console.log(event);
  
  database.ref('pending-events/').orderByChild('id').equalTo(key).once('value').then(function(snapshot) {
    snapshot.forEach(function(childSnapshot) {
      //remove each child
      database.ref('pending-events/').child(childSnapshot.key).remove();
    });
  });
  addUpcomingEvent(event);
}else {
   Materialize.toast("You do not have permission to edit calendar!", 4000);
} 
}

// Function handles the deletion of records
$("body").on("click", "#delete", function(e){
  e.preventDefault();
  //if(currentStatus) {
  if(calOwner === currentUser) {  
    var key = $(this).attr("data-key");
    database.ref('pending-events/').orderByChild('id').equalTo(key).once('value').then(function(snapshot) {
      snapshot.forEach(function(childSnapshot) {
        //remove each child
        database.ref('pending-events/').child(childSnapshot.key).remove();
      });
    });
  }else {
    Materialize.toast("You do not have permission to edit calendar!", 4000);
  }  
});

// Function handles the editing of records
$("body").on("click", "#editEvent", function(e){
  e.preventDefault();
  console.log("hi");
  if(calOwner === currentUser) {
    $("#update").show();
    console.log("hi");
    var key = $(this).attr("data-key");
    database.ref('pending-events/').orderByChild("id").equalTo(key).once('value').then(function(snapshot){
        var data = Object.values(snapshot.val())[0]; 
        var dataKey = Object.keys(snapshot.val())[0];
       
        $("#summary").val(data.summary);
        $("#eventLocation").val(data.location);
        $("#startTime").val(moment(data.startTime,"X").format("YYYY/MM/DD HH:mm A"));
        $("#endTime").val(moment(data.endTime, "X").format("YYYY/MM/DD HH:mm A"));
        $("#attendees").val(data.attendees);
        $("#update").attr("data-id", dataKey);
    });
  }else {
    Materialize.toast("You do not have permission to edit calendar!", 4000); 
  }    
});  

$("#update").on("click", function(e) {
      e.preventDefault();
      if(currentStatus){
        
        summary = $("#summary").val().trim();
        location = $("#autocomplete").val().trim();
        startTime = new Date($("#startTime").val().trim());
        var formattedStartDate = moment(startTime, "YYYY/MM/DD HH:mm A").unix();
        endTime = new Date($("#endTime").val().trim());
        var formattedEndDate = moment(endTime, "YYYY/MM/DD HH:mm A").unix();
        attendees = $("#attendees").val().trim();
        var eventId = $(this).attr("data-id");
        database.ref('pending-events/').child(eventId).update({summary:summary, location:location, startTime:formattedStartDate, endTime:formattedEndDate, attendees:attendees, currentUser: currentUser});
        
        //Clear the input fields after data is added to database
        $("#summary").val("");
        $("#autocomplete").val("");
        $("#startTime").val("");
        $("#endTime").val("");
        $("#attendees").val("");
      }else {
          Materialize.toast("You do not have permission to edit calendar!", 4000);
      }    
  });

// ----------------------------------------------------------------------------------------
// Firebase database CRUD functions
// Function checks for new child added to database and updates the html display    
database.ref('pending-events/').on("child_added", function (snapshot) {
// storing the snapshot.val() in a variable for convenience
var sv = snapshot.val();
renderTable(sv);
// Handle the errors
}, function (errorObject) {
  console.log("inside added");
  console.log("Errors handled: " + errorObject.code);
});

// Function checks for change in child and updates the html display    
database.ref('pending-events/').on("child_changed", function (snapshot) {
   database.ref('pending-events/').once('value', function(snapshot) {
      var events = [];
     snapshot.forEach(function(childSnapshot) {
       var childKey = childSnapshot.key;
       var childData = childSnapshot.val();
       events.push(childData);
     });
     $("#pendingEvents").empty(); 
     renderOnChange(events);
  });
 
// Handle the errors
}, function (errorObject) {
    console.log("inside added");
    console.log("Errors handled: " + errorObject.code);
});

// Function checks for deletion of child and updates the html display    
database.ref('pending-events/').on("child_removed", function (snapshot) {
  database.ref('pending-events/').once('value', function(snapshot) {
      var events = [];
     snapshot.forEach(function(childSnapshot) {
       var childKey = childSnapshot.key;
       var childData = childSnapshot.val();
       events.push(childData);
     });
     $("#pendingEvents").empty(); 
     renderOnChange(events);
  });
  
// Handle the errors
}, function (errorObject) {
    console.log("inside added");
    console.log("Errors handled: " + errorObject.code);
});
}); 
// -------------------------------------------------------------------------------
// Event CRUD functions

function listUpcomingEvents() {
$("#event-data").empty();
var calendarId = sessionStorage.getItem("calOwner");
gapi.client.calendar.events.list({
  //'calendarId': 'primary',
  'calendarId': calendarId,
  'timeMin': (new Date()).toISOString(),
  'showDeleted': false,
  'singleEvents': true,
  'maxResults': 10,
  'orderBy': 'startTime',
}).then(function(response) {
  var events = response.result.items;
  console.log(events);
  var h5 = $("<h5>");
      h5.text(calendarId).attr("style","font-weight:bold");
     $("#owner").append(h5);
  if (events.length > 0) {
    for (i = 0; i < events.length; i++) {
      var event = events[i];
      var when = event.start.dateTime;
      var id = event.id;
      var owner = event.creator.email;
      var loc = event.location;
      if (!when) {
        when = event.start.date;
      }
      var row = $("<tr>");
      var td1 = $("<td>");
      td1.text(event.summary);
      var td2 = $("<td>");
      td2.text(when);
      var td3 = $("<td>"); 
      td3.text(event.location);
      td3.attr("id", "location");
      var owner = $("<span>");
      owner.attr("cal-owner", owner);
      owner.css("display", "none");
      var td4 = $("<td>");
      var btn = $("<span>");
      btn.attr("id", "deleteEvent");
      btn.attr("data-key", id);
      btn.html("<i class='fa fa-trash' aria-hidden='true'>");
      btn.addClass("btnClass");
      var btnMap = $("<span>");
      btnMap.html('<i class="fa fa-globe" aria-hidden="true"></i>');
      btnMap.attr("id", "map");
      btnMap.addClass("btnClass");
      btnMap.addClass("mapBtn");
      btnMap.attr("data-loc", event.location);
      td4.append(btn).append(btnMap);
      row.append(td1).append(td2).append(td3).append(owner).append(td4);
      $("#event-data").append(row);
    }
  } else {
    Materialize.toast("No upcoming events found.", 4000);
  }
});
}

function addUpcomingEvent(event) {
console.log(event);
var calendarId = sessionStorage.getItem("calOwner");       
var request = gapi.client.calendar.events.insert({
  //'calendarId': 'primary',
  'calendarId': calendarId,
  'resource': event,
  'sendNotifications': true
});

request.execute(function(event) {
console.log('Event created: ' + event.htmlLink);
Materialize.toast("Event created!", 4000);
});
}

// ------------------------------------------------------------------------------------------------
// DOM rendering functions
function renderTable(sv) {
var row = $("<tr>");
var col1 = $("<td>");
col1.text(sv.summary);
col1.attr("id", "eventSummary");
var col2 = $("<td>");
col2.text(sv.location);
col2.attr("id", "eventLoc");
var col3 = $("<td>");
col3.text(moment(sv.startTime, "X").format("YYYY/MM/DD HH:mm A"));
col3.attr("id", "eventStart");
var col4 = $("<td>");
col4.text(moment(sv.endTime, "X").format("YYYY/MM/DD HH:mm A"));
col4.attr("id", "eventEnd");
var col5 = $("<td>");
col5.text(sv.currentUser);
col5.attr("id", "curUser");
var col6 = $("<td>");
col6.text(sv.attendees);
col6.attr("id", "guests");
//if logged in user same as calendar owner allow to add events to calendar and delete it from firebase
// delete, edit button deletes,edits from firebase
var dataButtons = $("<td>");
var btn = $("<span>");
btn.attr("id", "delete");
btn.html("<i class='fa fa-trash' aria-hidden='true'>");
btn.addClass("btnClass");
btn.attr("data-key", sv.id);
var editBtn = $("<span>");
editBtn.attr("id", "editEvent");
editBtn.html("<i class='fa fa-pencil' aria-hidden='true'></i>");
editBtn.addClass("btnClass");
editBtn.attr("data-key", sv.id);
var addBtn = $("<span>");
addBtn.attr("id", "addToCal");
addBtn.html('<i class="fa fa-check" aria-hidden="true"></i>');
addBtn.addClass("btnClass");
addBtn.attr("data-key", sv.id);
dataButtons.append(addBtn).append(btn).append(editBtn);
if(sv.eventsFor === sessionStorage.getItem("calOwner")){
  row.append(col1).append(col2).append(col3).append(col4).append(col5).append(col6).append(dataButtons);
  $("#pendingEvents").append(row);  
}  
}

function renderOnChange(data) {
$("#pendingEvents").empty();
data.forEach(function(item){
  var row = $("<tr>");
  var col1 = $("<td>");
  col1.text(item.summary);
  col1.attr("id", "eventSummary");
  var col2 = $("<td>");
  col2.text(item.location);
  col2.attr("id", "eventLoc");
  var col3 = $("<td>");
  col3.text(moment(item.startTime, "X").format("YYYY/MM/DD HH:mm A"));
  col3.attr("id", "eventStart");
  var col4 = $("<td>");
  col4.text(moment(item.endTime, "X").format("YYYY/MM/DD HH:mm A"));
  col4.attr("id", "eventEnd");
  var col5 = $("<td>");
  col5.text(item.currentUser);
  col5.attr("id", "curUser");
  var col6 = $("<td>");
  col6.text(item.attendees);
  col6.attr("id", "guests");
  //if logged in user same as calendar owner allow to add events to calendar and delete it from firebase
  // delete, edit button deletes,edits from firebase
  var dataButtons = $("<td>");
  var btn = $("<span>");
  btn.attr("id", "delete");
  btn.attr("data-key", item.id);
  btn.html("<i class='fa fa-trash' aria-hidden='true'>");
  btn.addClass("btnClass");
  var editBtn = $("<span>");
  editBtn.attr("id", "editEvent");
  editBtn.attr("data-key", item.id);
  editBtn.html("<i class='fa fa-pencil' aria-hidden='true'></i>");
  editBtn.addClass("btnClass");
  var addBtn = $("<span>");
  addBtn.attr("id", "addToCal");
  addBtn.html('<i class="fa fa-check" aria-hidden="true"></i>');
  addBtn.addClass("btnClass");
  addBtn.attr("data-key", item.id);
  dataButtons.append(addBtn).append(btn).append(editBtn);
  if(item.eventsFor === sessionStorage.getItem("calOwner")){
    row.append(col1).append(col2).append(col3).append(col4).append(col5).append(col6).append(dataButtons);
    $("#pendingEvents").append(row);  
  }
});  
}

// ---------------------------------------------------
// Utility functions

function splitStr(str) {
var strArray = str.split(",");
var emails = [];
strArray.forEach(function(item) {
  // create an array of attendees object- email: 'value'
  emails.push(
    {"email": item.trim()});
});
  console.log(emails);
  return emails;
}