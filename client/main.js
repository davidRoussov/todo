import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import './main.html';
import { Accounts } from 'meteor/accounts-base';

var Activities = new Mongo.Collection("activities");
var Notes = new Mongo.Collection("notes");
Meteor.subscribe("activities");
Meteor.subscribe("notes");



Router.route('/', function () {
  this.redirect('/lists');
});
Router.route('/lists', function () {
  this.render('mainContent');
});

Router.route('/notes', function () {
  this.render('notes');
});









 
Accounts.ui.config({
  passwordSignupFields: 'USERNAME_ONLY',
});



Template.mainContent.helpers({
	activities:function() {
		// try to get activities only if they exist
		try { 
			var activities = Activities.findOne({"owner": Meteor.userId()})["activities"];
			activities = activities.sort(compare);

			return activities;
		} catch(err) {
			return Session.get("activities");
		}
	},
	windowWidth:function() {
		return window.innerWidth;
	}
});

Template.notes.helpers({
	notes:function() {
		var user = Notes.findOne({"owner": Meteor.userId()});
		if (user) {
			return user.notes;
		} else {
			return "";
		}

	}
});

Template.registerHelper('currentRouteIs', function (route) { 
	if (Router.current())	
		return Router.current().route.getName() === route; 
	else
		return false;
});



Template.topPanel.events({

	"click .js-save-quick-notes":function(event) {
		var newNotes = $(".quick-notes-textarea").val();
		Meteor.call("updateQuickNotes", newNotes, function() {
			$(".unsaved-notes-star").css("display", "none");
		});
	},

	"click .js-addActivityButton":function(event) {
	  	Meteor.call("addNewActivity", function(error, newActivity) {

	  		if (!Meteor.userId()) {
	  			if (typeof Session.get("activities") == 'undefined') {
	  				Session.set("activities", []);
	  			}
		  		var activities = Session.get("activities");
		  		activities.push(newActivity);
		  		Session.set("activities", activities);	  			
	  		}

	  	});
	}


});

Template.notes.events({

	"keyup .quick-notes-textarea":function(event) {
		$(".unsaved-notes-star").css("display", "inline");
	}

});





Template.mainContent.events({
	"click .js-addTask":function(event) {
		var button = $(event.currentTarget);
		var activityId = button.parent().parent().attr("id");

		button.prop("disabled", true);
		
		Meteor.call("addNewTask", activityId, Session.get("activities"), function(error, result) {
			if (!Meteor.userId()) Session.set("activities", result);
			button.prop("disabled", false);
		});
	},
	"click .js-deleteButton":function(event) {
		var button = $(event.currentTarget);
		var activityId = button.parent().parent().attr("id");
		var taskIndex = (button.parent().index()) / 2 - 1;

		$(".js-deleteButton").prop("disabled", true);

	 	Meteor.call("deleteTask", activityId, taskIndex, Session.get("activities"), function(error, result) {
	 		if (!Meteor.userId()) Session.set("activities", result);
	 		$(".js-deleteButton").prop("disabled", false);
	 	});
	},
	"change .js-task":function(event) {
		var inputField = $(event.target);
		var newTask = inputField.val();
		var activityId = inputField.parent().parent().attr("id");
		var taskIndex = inputField.parent().index() / 2 - 1;

		Meteor.call("modifyTask", newTask, activityId, taskIndex, Session.get("activities"), function(error, result) {
			if (!Meteor.userId()) Session.set("activities", result);
			$(event.target).css("color", "black");
		});
	},
	"input .js-task":function(event) {
		if (!Meteor.userId()) return;

		$(event.target).css("color", "red");
	},
	"change .activityTitle":function(event) {
		if (!Meteor.userId()) return;

		var inputField = $(event.target);
		var activityId = inputField.parent().parent().attr("id");
		var newTitle = inputField.val();

		Meteor.call("updateActivityTitle", activityId, newTitle, function() {
			$(event.target).css("color", "black");
		});
	},
	"input .activityTitle":function(event) {
		if (!Meteor.userId()) return;

		$(event.target).css("color", "red");
	},
	"click .js-deleteActivity":function(event) {
		var button = $(event.currentTarget);
		var activityId = button.parent().parent().attr("id");
		
		Meteor.call("deleteActivity", activityId, Session.get("activities"), function(error, result) {
			if (!Meteor.userId()) Session.set("activities", result);
		});
	}

});


Template.activity.rendered = function() {

	rerenderMasonry();

};



Template.mainContent.rendered = function() {

	$(".grid-item").css("width", 400);
	$(".input-field").css("width", 368);


	// a slider for changing input area length
	$('#input-length-slider').bootstrapSlider({
		formatter: function(value) {
			$(".grid-item").css("width", value - 48);
			$(".input-field").css('width', value - 80);


			if ($(".grid-item").length > 0) {
				$('.grid').masonry({
				  // options
				  itemSelector: '.grid-item'
				});
			}



		},
		tooltip: 'hide'
	});

	// // jquery sortable allows dragging of activity + tasks by holding down and dragging div container
	// this.$('.all-activities').sortable({
 //        start:  function(event, ui) {            
 //            ui.item.removeClass('masonry');
 //            ui.item.parent().masonry('reloadItems')
 //                },
 //        change: function(event, ui) {
 //            ui.item.parent().masonry('reloadItems');
 //                },
	// 	stop: function(e, ui) {

	// 		if (!Meteor.userId()) return;

	// 		el = ui.item.get(0);
	// 		before = ui.item.prev().get(0);
	// 		after = ui.item.next().get(0);


	// 		if (!before) {
	// 			newRank = Blaze.getData(after).rank - 1;
	// 		} else if (!after) {
	// 			newRank = Blaze.getData(before).rank + 1;
	// 		} else if (before.className === "activity" && after.className === "activity") {
	//         	newRank = (Blaze.getData(after).rank + Blaze.getData(before).rank)/2;				
	// 		}

	// 		if (newRank) {
	// 			Meteor.call("updateActivityRank", Blaze.getData(el)._id, newRank);

	// 			ui.item.addClass('masonry');
 //            ui.item.parent().masonry('reloadItems');
	// 		}
	// 	}
	// });




};



function compare(a,b) {
	if (a.rank < b.rank)
		return -1;
	if (a.rank > b.rank)
		return 1;
	return 0;
}

function rerenderMasonry() {

	$('.grid').masonry({}).masonry("destroy");

	$('.grid').masonry({
		itemSelector: '.grid-item'
	});
}