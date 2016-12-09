import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import './main.html';
import { Accounts } from 'meteor/accounts-base';

import { Random } from 'meteor/random';
for (var i = 1; i < 20; i++) {
	console.log(Random.id());
}

var Activities = new Mongo.Collection("activities");
 
Accounts.ui.config({
  passwordSignupFields: 'USERNAME_ONLY',
});

Meteor.subscribe("activities");


Template.mainContent.helpers({
	activities:function() {
		// try to get activities if only if they exist
		try { 
			var activities = Activities.findOne({"owner": Meteor.userId()})["activities"];
			activities = activities.sort(compare);
			Session.set("activities", activities);
		} catch(err) {}
	
		return Session.get("activities");
	}
});

Template.mainContent.events({
	"click .js-addTask":function(event) {
		// CHANGE THIS
		// avoid assuming acitvity titles are unique
		var activity = $(event.target).attr("id");

		Meteor.call("addNewTask", activity, function(error, result) {
			Session.set("activities", result);
		});
	 
	},
	"click .js-deleteButton":function(event) {

	  var activity, taskIndex;
	  console.log($(event.target).is("span"));
	  if ($(event.target).is("span")) {
	    activity = $(event.target).parent().parent().parent().prev().children().eq(1).val();
	    taskIndex = $(event.target).parent().parent().index();
	  } else {
	    activity = $(event.target).parent().parent().prev().children().eq(1).val();
	    taskIndex = $(event.target).parent().index();
	  }
	  taskIndex/=2;

	  Meteor.call("deleteTask", activity, taskIndex, function(error, result) {
	    Session.set("activities", result);
	  });
	},
	"change .js-task":function(event) {
	  var task = $(event.target).val();
	  var activity = $(event.target).parent().parent().prev().children().eq(1).val();
	  var taskIndex = $(event.target).parent().index()/2;

	  Meteor.call("modifyTask", task, activity, taskIndex, function(error, result) {
	    Session.set("activities", result);
	  });
	},
	"keydown .js-task":function(event) {
	  $(event.target).attr("size", $(event.target).val().length);
	},
	"change .activityTitle":function(event) {
		var activityIndex = $(event.target).parent().parent().index();
		var newActivityTitle = $(event.target).val();

		Meteor.call("updateActivityTitle", activityIndex, newActivityTitle, function(error, result) {
			Session.set("activities", result);
		});
	},
	"keydown .activityTitle":function(event) {
	  $(event.target).removeAttr("style");
	  $(event.target).attr("size", $(event.target).val().length);
	},
	"click .js-deleteActivity":function(event) {
		// CHANGE THIS
		// currently, system assumes that activity titles are distinct but this is bad
		var activityTitle;
		if ($(event.target).is("span")) {
			activityTitle = $(event.target).parent().next().val();
		} else {
			activityTitle = $(event.target).next().val();
		}

		Meteor.call("deleteActivity", activityTitle, function(error, result) {
			Session.set("activities", result);
		});
	},
	"click .js-addActivityButton":function(event) {
	  Meteor.call("addNewActivity", function(error, result) {
	    Session.set("activities", result);
	  });
	}

});

Template.mainContent.rendered = function() {
	this.$('.allActivities').sortable({
		stop: function(e, ui) {

			el = ui.item.get(0);
			before = ui.item.prev().get(0);
			after = ui.item.next().get(0);

			if (!before) {
				newRank = Blaze.getData(after).rank - 1;
			} else if (!after) {
				newRank = Blaze.getData(before).rank + 1;
			} else if (before.className === "activity" && after.className === "activity") {
	        	newRank = (Blaze.getData(after).rank + Blaze.getData(before).rank)/2;				
			}

			if (newRank) {
				Meteor.call("updateActivityRank", Blaze.getData(el)._id, newRank);
			} else {
				console.log("hi");
			}

		}
	});
};

function compare(a,b) {
	if (a.rank < b.rank)
		return -1;
	if (a.rank > b.rank)
		return 1;
	return 0;
}