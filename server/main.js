import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';	

var Activities = new Mongo.Collection("activities");
var Notes = new Mongo.Collection("notes");

Meteor.publish("activities", function() {
	return Activities.find();
});
Meteor.publish("notes", function() {
	return Notes.find();
});


var emptyNote

Meteor.methods({
	addNewTask:function(activityId, activities) {

		if (Meteor.userId()) {
 			activities = Activities.findOne({"owner": Meteor.userId()})["activities"];
		}
	
     	for (var i = 0; i < activities.length; i++) {
        	if (activities[i]["_id"] === activityId) {
          		activities[i]["tasks"].push({task: ""});
        	}
      	}

      	if (!Meteor.userId()) {
      		return activities;
      	} else {
       		var newDoc = createUpdatedDocument(activities);
	    	Activities.update({_id:Activities.findOne({"owner": Meteor.userId()})["_id"]}, newDoc);   

	    	return newDoc;  		
      	}

	},
	deleteTask:function(activityId, taskIndex, activities) {

		if (Meteor.userId()) {
 			activities = Activities.findOne({"owner": Meteor.userId()})["activities"];
		}
		
		var i, j;
		for (i = 0; i < activities.length; i++) {
		  if (activities[i]["_id"] === activityId) {
		    activities[i]["tasks"].splice(taskIndex, 1);
		  }
		}

      	if (!Meteor.userId()) {
      		return activities;
      	} else {
       		var newDoc = createUpdatedDocument(activities);
	    	Activities.update({_id:Activities.findOne({"owner": Meteor.userId()})["_id"]}, newDoc); 

	    	return newDoc;    		
      	}
	},
	modifyTask:function(updateTask, activityId, taskIndex, activities) {

		if (Meteor.userId()) {
 			activities = Activities.findOne({"owner": Meteor.userId()})["activities"];
		}

		var i, j;
		for (i = 0; i < activities.length; i++) {
		  if (activities[i]["_id"] === activityId) {
		    activities[i]["tasks"][taskIndex] = {task: updateTask};
		  }
		}

      	if (!Meteor.userId()) {
      		return activities;
      	} else {
			var newDoc = createUpdatedDocument(activities);
			Activities.update({_id:Activities.findOne({"owner": Meteor.userId()})["_id"]}, newDoc);

			return newDoc;
		}
	},
	updateActivityTitle:function(activityId, newTitle) {
		var activities = Activities.findOne({"owner": Meteor.userId()})["activities"];

		var i;
		for (i = 0; i < activities.length; i++) {
			if (activities[i]["_id"] === activityId) {
				activities[i]["title"] = newTitle;
			}
		}

		var newDoc = createUpdatedDocument(activities);
		Activities.update({_id:Activities.findOne({"owner": Meteor.userId()})["_id"]}, newDoc);

		return newDoc;
	},
	addNewActivity:function() {
		var userExistence = Activities.findOne({"owner": Meteor.userId()});

		var highestRank = getHighestRank("activities");

		var json = {"title": "", "tasks": [], "rank": highestRank+1, _id: Random.id()};

		// if user exists this block is executed
		if (typeof userExistence != "undefined") {
			activities = Activities.findOne({"owner": Meteor.userId()})["activities"];

			activities.push(json);

			var newDoc = createUpdatedDocument(activities);

			Activities.update({_id:Activities.findOne({"owner": Meteor.userId()})["_id"]}, newDoc);
		}
		else if (!Meteor.userId()) {
			return json;
		}
		else {
			activities = [json];

			var newDoc = createUpdatedDocument(activities);
			
			Activities.insert(newDoc);

			return newDoc;
		}

	},
	deleteActivity:function(activityId, activities) {

		if (Meteor.userId()) {
 			activities = Activities.findOne({"owner": Meteor.userId()})["activities"];
		}

		
		var i;
		for (i = 0; i < activities.length; i++) {
		  if (activities[i]["_id"] === activityId) {
		    activities.splice(i, 1);
		  }
		}

      	if (!Meteor.userId()) {
      		return activities;
      	} else {
			var newDoc = createUpdatedDocument(activities);
			Activities.update({_id:Activities.findOne({"owner": Meteor.userId()})["_id"]}, newDoc);

			return newDoc;
		}
	},
	updateActivityRank:function(_id, newRank) {
		var activities = Activities.findOne({"owner": Meteor.userId()})["activities"];
		
		for (var i = 0; i < activities.length; i++) {
			if (activities[i]["_id"] === _id) {
				activities[i]["rank"] = newRank;
				var newDoc = createUpdatedDocument(activities);
				Activities.update({_id:Activities.findOne({"owner": Meteor.userId()})["_id"]}, newDoc);

				return newDoc;
			}
		}
	},










	createNewNote:function(category) {
		var emptyNote = {
			_id: Random.id(),
			topicName: "",
			notes: "",
			rank: getHighestRank("notes") + 1
		};

		if (category) emptyNote.category = category;

		if (Notes.findOne({"owner": Meteor.userId()})) {
			var json = Notes.findOne({"owner": Meteor.userId()});
			if (json.notes)
				json.notes.push(emptyNote);
			else
				json.notes = [emptyNote];
			Notes.update({_id:Notes.findOne({"owner": Meteor.userId()})["_id"]}, json);	
		} else {
			var json = {
				"owner": Meteor.userId(),
				"username": Meteor.user().username,
				"notes": [emptyNote]
			}
			Notes.insert(json);
		}		
	},
	updateNoteTitle:function(topicID, newText) {
		var user = Notes.findOne({"owner": Meteor.userId()});
		var notes = user.notes;
		for (var i = 0; i < notes.length; i++) {
			if (notes[i]._id == topicID) {
				notes[i].topicName = newText;
			}
		}

		Notes.update({_id:Notes.findOne({"owner": Meteor.userId()})["_id"]}, user);	
	},
	updateNoteContent:function(topicID, newText) {
		var user = Notes.findOne({"owner": Meteor.userId()});
		var notes = user.notes;
		for (var i = 0; i < notes.length; i++) {
			if (notes[i]._id == topicID) {
				notes[i].notes = newText;
			}
		}

		Notes.update({_id:Notes.findOne({"owner": Meteor.userId()})["_id"]}, user);	
	},
	deleteNote:function(topicID) {
		var user = Notes.findOne({"owner": Meteor.userId()});
		var notes = user.notes;
		for (var i = 0; i < notes.length; i++) {
			if (notes[i]._id == topicID) {
				notes.splice(i,1);
			}
		}

		Notes.update({_id:Notes.findOne({"owner": Meteor.userId()})["_id"]}, user);	
	},
	addNotesCategory: function(newCategory) {
		var userExistence = Notes.findOne({"owner": Meteor.userId()});

		var json = {_id: Random.id(), category: newCategory};

		let categories;
		if (typeof userExistence != "undefined") {
			categories = Notes.findOne({"owner": Meteor.userId()})["categories"];
			if (categories)
				categories.push(json);
			else
				categories = [json];
			Notes.update({_id:Notes.findOne({"owner": Meteor.userId()})["_id"]}, {$set: {categories: categories}});
		}
		else if (!Meteor.userId()) {
			return json;
		}
		else {
			categories = [json];

			var emptyNote = {
				_id: Random.id(),
				topicName: "",
				notes: "",
				rank: getHighestRank("notes") + 1
			};

			var newDoc = {
				"owner": Meteor.userId(),
				"username": Meteor.user().username,
				"categories": categories
			}

			Notes.insert(newDoc);

			return newDoc;
		}
	}


});

function createUpdatedDocumentNotes(activities) {
	return {
		"owner": Meteor.userId(),
		"username": Meteor.user().username,
		"activities": activities
	};
}

function createUpdatedDocument(activities) {
	return {
		"owner": Meteor.userId(),
		"username": Meteor.user().username,
		"activities": activities
	};
}

function getHighestRank(mode) {
	var user, objarr;
	if (mode == "activities") {
		user = Activities.findOne({"owner": Meteor.userId()});
		if (user == null)
			return 0;
		else
			objarr = user["activities"];
	} else if (mode == "notes") {
		user = Notes.findOne({"owner": Meteor.userId()});
		if (user == null || !user.notes)
			return 0;
		else
			objarr = user["notes"];
	} 

	if (objarr.length == 0)
		return 0;

	var maxRank = objarr[0]["rank"];
	for (var i = 1; i < objarr.length; i++) {
		if (objarr[i]["rank"] > maxRank) {
			maxRank = objarr[i]["rank"];
		}
	}

	return maxRank;
}
