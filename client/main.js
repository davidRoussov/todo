import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import './main.html';
import { Accounts } from 'meteor/accounts-base';

var Activities = new Mongo.Collection("activities");








 
Accounts.ui.config({
  passwordSignupFields: 'USERNAME_ONLY',
});

Meteor.subscribe("activities");

Template.mainContent.helpers({
	activities:function() {
		// try to get activities only if they exist
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
		var button = $(event.currentTarget);
		var activityId = button.parent().parent().parent().attr("id");
		
		Meteor.call("addNewTask", activityId);
	},
	"click .js-deleteButton":function(event) {
		var button = $(event.currentTarget);
		var activityId = button.parent().parent().parent().attr("id");
		var taskIndex = (button.parent().index()) / 2;

	 	Meteor.call("deleteTask", activityId, taskIndex);
	},
	"change .js-task":function(event) {
		var inputField = $(event.target);
		var newTask = inputField.val();
		var activityId = inputField.parent().parent().parent().attr("id");
		var taskIndex = inputField.parent().index() / 2;

		Meteor.call("modifyTask", newTask, activityId, taskIndex, function() {
			$(event.target).css("color", "black");
		});
	},
	"input .js-task":function(event) {
		$(event.target).css("color", "red");
	},
	"change .activityTitle":function(event) {
		var inputField = $(event.target);
		var activityId = inputField.parent().parent().attr("id");
		var newTitle = inputField.val();

		Meteor.call("updateActivityTitle", activityId, newTitle, function() {
			$(event.target).css("color", "black");
		});
	},
	"input .activityTitle":function(event) {
		$(event.target).css("color", "red");
	},
	"click .js-deleteActivity":function(event) {
		var button = $(event.currentTarget);
		var activityId = button.parent().parent().attr("id");
		
		Meteor.call("deleteActivity", activityId);
	},
	"click .js-addActivityButton":function(event) {
	  Meteor.call("addNewActivity");
	}

});

Template.mainContent.rendered = function() {

	$(".js-task, .activityTitle").attr('size', 10); // initial size of input
	// a slider for changing input area length
	$('#input-length-slider').bootstrapSlider({
		formatter: function(value) {
			console.log(value);

			$(".js-task, .activityTitle").attr('size', value);
		},
		tooltip: 'hide'
	});

	// jquery sortable allows dragging of activity + tasks by holding down and dragging div container
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