import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import './main.html';
import { Accounts } from 'meteor/accounts-base';

var Activities = new Mongo.Collection("activities");
var Notes = new Mongo.Collection("notes");
Meteor.subscribe("activities");
Meteor.subscribe("notes");



Router.route('/', function () {
  this.redirect('/todo');
});
Router.route('/todo', function () {
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
		var user = Activities.findOne({"owner": Meteor.userId()});
		if (user) {

			var online = navigator.onLine;
			var activities;
			if (online) {
				activities = user.activities;
				activities = activities.sort(compare);
				return activities;
			} else {
				activities = localStorage.getItem("activities");
				activities = JSON.parse(activities).activities;
				return activities;
			}

		}
		else {
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
		if (user && user.notes) {

			let allNotes = user.notes;
			let notes = [];
			let currentCategory = Session.get("currentCategory");

			allNotes.map(note => {
				if (!currentCategory && !note.category) {
					notes.push(note);
				}
				else if (note.category === currentCategory) {
					notes.push(note);
				}
			});

			return notes.sort(compare);

		} else {
			return [];
		}
	},
	windowWidth:function() {
		return window.innerWidth;
	},
	notesCategory: function() {
		var data = Notes.findOne({"owner": Meteor.userId()});
		if (data)
			return data.categories;
	} 
});

Template.topPanel.helpers({
	showUndoButton:function() { return Session.get("showUndoButton");},
	offline: () => {
		return !navigator.onLine;
	}
});

Template.registerHelper('currentRouteIs', function (route) { 
	if (Router.current())	
		return Router.current().route.getName() === route; 
	else
		return false;
});



Template.topPanel.events({

	"click .js-addNoteButton":function(event) {
		Meteor.call("createNewNote", Session.get("currentCategory"));
	}

});

Template.notes.events({

	"input .js-notesTitle":function(event) {
		$(event.target).css("color", "red");
		renderMasonry();
	},
	"change .js-notesTitle":function(event) {
		var textarea = $(event.target);
		var topicID = textarea.parent().parent().attr("id");
		var newText = textarea.val();

		Meteor.call("updateNoteTitle", topicID, newText, function() {
			textarea.css("color", "black");
		});
	},
	"input .js-notesContent":function(event) {
		$(event.target).css("color", "red");
		renderMasonry();
	},
	"change .js-notesContent":function(event) {
		var textarea = $(event.target);
		var topicID = textarea.parent().parent().attr("id");
		var newText = textarea.val();

		Meteor.call("updateNoteContent", topicID, newText, function() {
			textarea.css("color", "black");
		});
	},
	"click .js-deleteNote":function(event) {
		var button = $(event.target);
		var topicID = button.parent().parent().parent().parent().attr("id");

		Meteor.call("deleteNote", topicID, function() {
			renderMasonry(); // doesn't work
		});
	},
	"click .js-change-note-category": function(event) {
		var button = $(event.target);
		var categoryID = button.attr("id");
		var currentCategory = Session.get("currentCategory");

		$(".notes-menu-category").each(function() {
			$(this).css("background-color", "transparent");
		});

		if (currentCategory === categoryID) {
			Session.set("currentCategory", null);
		} else {
			Session.set("currentCategory", categoryID);
			button.css("background-color", "rgb(224, 247, 224)");
		}
	},
	"click .js-addNewNotesCategory": function(event) {
		let newCategory = $("#userInputNewCategory").val();
		Meteor.call("addNotesCategory", newCategory);
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
			console.log(result);
			storeActivities(result);
		});
	},
	"click .js-deleteButton":function(event) {
		var button = $(event.currentTarget);
		var activityId = button.parent().parent().attr("id");
		var taskIndex = button.parent().index() - 1;

		$(".js-deleteButton").prop("disabled", true);

	 	Meteor.call("deleteTask", activityId, taskIndex, Session.get("activities"), function(error, result) {
	 		if (!Meteor.userId()) Session.set("activities", result);
	 		$(".js-deleteButton").prop("disabled", false);
	 		storeActivities(result);
	 	});
	},
	"change .js-task":function(event) {
		var inputField = $(event.target);
		var newTask = inputField.val();
		var activityId = inputField.parent().parent().attr("id");
		var taskIndex = inputField.parent().index() - 1;

		Meteor.call("modifyTask", newTask, activityId, taskIndex, Session.get("activities"), function(error, result) {
			if (!Meteor.userId()) Session.set("activities", result);
			$(event.target).css("color", "black");
			storeActivities(result);
		});
	},
	"input .js-task":function(event) {
		if (!Meteor.userId()) return;

		$(event.target).css("color", "red");

		renderMasonry();
	},
	"change .js-activityTitle":function(event) {
		if (!Meteor.userId()) return;

		var inputField = $(event.target);
		var activityId = inputField.parent().parent().attr("id");
		var newTitle = inputField.val();

		Meteor.call("updateActivityTitle", activityId, newTitle, function() {
			$(event.target).css("color", "black");
			storeActivities(result);
		});
	},
	"input .js-activityTitle":function(event) {
		if (!Meteor.userId()) return;

		$(event.target).css("color", "red");

		renderMasonry();
	},
	"click .js-deleteActivity":function(event) {
		var button = $(event.currentTarget);
		var activityId = button.parent().parent().attr("id");
		
		Meteor.call("deleteActivity", activityId, Session.get("activities"), function(error, result) {
			if (!Meteor.userId()) Session.set("activities", result);

			storeActivities(result);

			Session.set("showUndoButton", true);
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

	  		renderMasonry(); 			
  		}

  	});
	}

});

Template.activity.rendered = function() {
	renderMasonry();

	$(".note-textarea").autosize();
};
Template.task.rendered = function() {
	renderMasonry();

};
Template.notes.rendered = function() {
	renderMasonry();
};
Template.note.rendered = function() {
	renderMasonry();

	$(".note-textarea").autosize();

	
	// a slider for changing input area length
	$('#input-length-slider').bootstrapSlider({
		formatter: function(value) {
			$(".note").css("width", value - 48);

			if ($(".grid-item").length > 0) {
				$('.grid').masonry({
				  // options
				  itemSelector: '.grid-item'
				});
			}
		},
		tooltip: 'hide'
	});
};


Template.mainContent.rendered = function() {

	$(".note-textarea").autosize();

	$(".activity").css("width", 400);

	// a slider for changing input area length
	$('#input-length-slider').bootstrapSlider({
		formatter: function(value) {
			$(".activity").css("width", value - 48);

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

function renderMasonry() {

	$('.grid').masonry({}).masonry("destroy");

	$('.grid').masonry({
		itemSelector: '.grid-item',
		gutterWidth: 5
	});
}

function storeActivities(activities) {
	activities = JSON.stringify(activities);
	localStorage.setItem("activities", activities);
}