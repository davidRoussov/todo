import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';	

var Activities = new Mongo.Collection("activities");

Meteor.publish("activities", function() {
	return Activities.find();
});

Meteor.methods({
	addNewTask:function(activity) {

		if (typeof activity !== "undefined") {
			var activities = Activities.findOne({"owner": Meteor.userId()})["activities"];

	     	for (var i = 0; i < activities.length; i++) {
	        	if (activities[i]["title"] === activity) {
	          		activities[i]["tasks"].push({task: ""});
	        	}
	      	}

			var newDoc = createUpdatedDocument(activities);
	      	Activities.update({_id:Activities.findOne({"owner": Meteor.userId()})["_id"]}, newDoc);

	      	return activities;
	    }	
	},
	deleteTask:function(activity, taskIndex) {
		var activities = Activities.findOne({"owner": Meteor.userId()})["activities"];
		var i, j;
		for (i = 0; i < activities.length; i++) {
		  if (activities[i]["title"] === activity) {
		    activities[i]["tasks"].splice(taskIndex, 1);
		  }
		}

		var newDoc = createUpdatedDocument(activities);
		Activities.update({_id:Activities.findOne({"owner": Meteor.userId()})["_id"]}, newDoc);

		return activities;
	},
	modifyTask:function(updateTask, activity, taskIndex) {
		var activities = Activities.findOne({"owner": Meteor.userId()})["activities"];
		var i, j;
		for (i = 0; i < activities.length; i++) {
		  if (activities[i]["title"] === activity) {
		    activities[i]["tasks"][taskIndex] = {task: updateTask};
		  }
		}

		var newDoc = createUpdatedDocument(activities);
		Activities.update({_id:Activities.findOne({"owner": Meteor.userId()})["_id"]}, newDoc);

		return activities;
	},
	updateActivityTitle:function(activityIndex, newTitle) {
		var activities = Activities.findOne({"owner": Meteor.userId()})["activities"];

		activities[activityIndex]["title"] = newTitle;

		var newDoc = createUpdatedDocument(activities);

		Activities.update({_id:Activities.findOne({"owner": Meteor.userId()})["_id"]}, newDoc);

		return activities;
	},
	addNewActivity:function() {
		var userExistence = Activities.findOne({"owner": Meteor.userId()});

		var highestRank = getHighestRank();

		var json = {"title": "", "tasks": [], "rank": highestRank+1, _id: Random.id()};

		// if user exists this if block is executed
		if (typeof userExistence != "undefined") {
			activities = Activities.findOne({"owner": Meteor.userId()})["activities"];

			activities.push(json);

			var newDoc = createUpdatedDocument(activities);

			Activities.update({_id:Activities.findOne({"owner": Meteor.userId()})["_id"]}, newDoc);

			return activities;
		}
		else {
			activities = [json];

			var newDoc = createUpdatedDocument(activities);
			
			Activities.insert(newDoc);

			return activities;
		}

	},
	deleteActivity:function(activityTitle) {
		var activities = Activities.findOne({"owner": Meteor.userId()})["activities"];
		var i, j;
		for (i = 0; i < activities.length; i++) {
		  if (activities[i]["title"] === activityTitle) {
		    activities.splice(i, 1);
		  }
		}

		var newDoc = createUpdatedDocument(activities);
		Activities.update({_id:Activities.findOne({"owner": Meteor.userId()})["_id"]}, newDoc);

		return activities;
	},
	updateActivityRank:function(_id, newRank) {
		var activities = Activities.findOne({"owner": Meteor.userId()})["activities"];
		
		for (var i = 0; i < activities.length; i++) {
			if (activities[i]["_id"] === _id) {
				activities[i]["rank"] = newRank;
				var newDoc = createUpdatedDocument(activities);
				Activities.update({_id:Activities.findOne({"owner": Meteor.userId()})["_id"]}, newDoc);

				return activities;
			}
		}

		return false;

	}
});

function createUpdatedDocument(activities) {
	return {
		"owner": Meteor.userId(),
		"username": Meteor.user().username,
		"activities": activities
	};
}

function getHighestRank() {
	var user = Activities.findOne({"owner": Meteor.userId()});
	if (user == null)
		return 0;
	else
		var activities = user["activities"];

	var maxRank = activities[0]["rank"];
	for (var i = 1; i < activities.length; i++) {
		if (activities[i]["rank"] > maxRank) {
			maxRank = activities[i]["rank"];
		}
	}

	return maxRank;
}