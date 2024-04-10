/*
	Arcana by HTML5 UP
	html5up.net | @ajlkn
	Free for personal and commercial use under the CCA 3.0 license (html5up.net/license)
*/

(function ($) {

	var $window = $(window),
		$body = $('body');

	// Breakpoints.
	breakpoints({
		wide: ['1281px', '1680px'],
		normal: ['981px', '1280px'],
		narrow: ['841px', '980px'],
		narrower: ['737px', '840px'],
		mobile: ['481px', '736px'],
		mobilep: [null, '480px']
	});

	// Play initial animations on page load.
	$window.on('load', function () {
		window.setTimeout(function () {
			$body.removeClass('is-preload');
		}, 100);
	});

	// Dropdowns.
	$('#nav > ul').dropotron({
		offsetY: -15,
		hoverDelay: 0,
		alignment: 'center'
	});

	// Nav.

	// Bar.
	$(
		'<div id="titleBar">' +
		'<a href="#navPanel" class="toggle"></a>' +
		'<span class="title">' + $('#logo').html() + '</span>' +
		'</div>'
	)
		.appendTo($body);

	// Panel.
	$(
		'<div id="navPanel">' +
		'<nav>' +
		$('#nav').navList() +
		'</nav>' +
		'</div>'
	)
		.appendTo($body)
		.panel({
			delay: 500,
			hideOnClick: true,
			hideOnSwipe: true,
			resetScroll: true,
			resetForms: true,
			side: 'left',
			target: $body,
			visibleClass: 'navPanel-visible'
		});

})(jQuery);

var commentArea = document.getElementById('comment-transmition');
var commentBox = document.getElementById('comment-box');

var update = {};

function showCommentBox(value) {
	commentArea.value = value;
	commentBox.style.display = 'block';
}

function hideCommentBox() {
	commentArea.value = '';
	commentBox.style.display = 'none';
}

function onClick(event) {
	if (event.item != null && !event.item.includes('time')) {
		var comment = timelineTR.itemsData.get(event.item).comment;
		showCommentBox(comment || '');
		return;
	}
	hideCommentBox();
}

function updateComment(itemId) {
	sendTransmission(itemId);
}

function onInput (event) {
	var item = timelineTR.itemsData.get(timelineTR.getSelection()[0]);
	item.comment = commentArea.value;
	timelineTR.itemsData.update(item);
	
	if (item.id in update) {
		clearTimeout(update[item.id]);
	}

	update[item.id] = setTimeout(updateComment, 100, item.id);
}

timelineTR.on('click', onClick);

commentArea.addEventListener('input', onInput);
