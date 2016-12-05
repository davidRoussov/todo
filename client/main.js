import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import './main.html';
import { Accounts } from 'meteor/accounts-base';

var Activities = new Mongo.Collection("activities");
 
Accounts.ui.config({
  passwordSignupFields: 'USERNAME_ONLY',
})

Session.keys = {};

Meteor.subscribe("activities");

Template.mainContent.helpers({
	activities:function() {
		// try to get activities if only if they exist
		try { 
			Session.set("activities", Activities.findOne({"owner": Meteor.userId()})["activities"]);
	  		return Session.get("activities");	
		} catch(err) {}

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
	// "mousedown .activityTitle":function(event) {
	// 	console.log('mousedown');
	// 	clearTimeout(this.downTimer);
	// 	this.downTimer = setTimeout(function() {
	// 		console.log("two seconds");
			
	// 	}, 2000);
	// },
	// "mouseup .activityTitle":function(event) {
	// 	clearTimeout(this.downTimer);
	// },
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
