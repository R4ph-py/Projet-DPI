var modalIcons = document.querySelectorAll('.modal-needed');
var icons = document.querySelectorAll('.item');
var subicons = document.querySelectorAll('.subicon');
var hiddenUl = document.getElementById('hiddenUl');
var shownUl = document.getElementById('shownUl');

function hideAllSubicons() {
    var length = shownUl.childNodes.length;
    for (var child = 0; child < length; child++) {
        if (shownUl.childNodes[0].nodeName === 'BR') {
            shownUl.removeChild(shownUl.childNodes[0]);
            continue;
        }
        hiddenUl.appendChild(shownUl.childNodes[0]);
    }
}

for (var modal of modalIcons) {
    modal.addEventListener('click', function (event) {
        hideAllSubicons();
        for (var subicon of subicons) {
            if (subicon.id.substring(0, subicon.id.length - 1) === event.target.id) {
                if (shownUl.childNodes.length === 5) {
                    shownUl.appendChild(document.createElement('br'));
                }
                shownUl.appendChild(subicon.parentElement);
            }
        }
    });
}

// create groups
var groups = new vis.DataSet([{
    id: 0,
    content: ''
},
{
    id: 1,
    content: 'Constantes vitales'
}, {
    id: 2,
    content: 'Etat'
}, {
    id: 3,
    content: 'Entrées/Sorties'
}, {
    id: 4,
    content: 'Soins'
}, {
    id: 5,
    content: ''
}]);

var items = new vis.DataSet();

function removeHandler(event) {
    sendRemoveTransmission(event.id);
}

// specify options
var options = {
    stack: true,
    zoomMin: 1000 * 60 * 60,
    zoomMax: 1000 * 60 * 60 * 12,
    editable: {
        add: true,            // add new items by double tapping
        updateTime: false,    // drag items horizontally
        updateGroup: false,   // drag items from one group to another
        remove: true,         // delete an item by tapping the delete button top right
        overrideItems: false  // allow these options to override item.editable
    },
    onRemove: removeHandler,
};

// create a Timeline
var container = document.getElementById('visualization');
var timelineTR = new vis.Timeline(container, items, groups, options);

setTimeout(() => {
    timelineTR.moveTo(new Date(), { animation: true });
}, 1000);

function handleDragStart(event) {
    var icon = event.target;

    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.dropEffect = 'move';

    var item = {
        id: 'added-item',
        content: icon.outerHTML,
    };

    event.dataTransfer.setData("text", JSON.stringify(item));

    if (!icon.className.includes('subicon')) {
        hideAllSubicons();
    }

}

function mouseOut(event) {
    var timelineRect = container.getBoundingClientRect();
    var x = event.clientX;
    var y = event.clientY;
    if (x > timelineRect.left && x < timelineRect.right && y > timelineRect.top && y < timelineRect.bottom) {
        return;
    }
    timelineTR.itemsData.remove('cursor-time');
    timelineTR.itemsData.remove('adding-item-time');
}

function handleDragEnd(event) {
    var timelineRect = timelineTR.dom.center.getBoundingClientRect();
    var x = event.clientX;
    var y = event.clientY;

    if (x < timelineRect.left || x > timelineRect.right || y < timelineRect.top || y > timelineRect.bottom) {
        mouseOut(event);
        return;
    }

    var item = timelineTR.itemsData.get('added-item');
    var timeItem = timelineTR.itemsData.get('adding-item-time');

    if (item === undefined) {
        return;
    }

    hideCommentBox();
    hideAllSubicons();

    if (item.content.includes('vital-constant')) {
        item.group = 1;
    }
    if (item.content.includes('state')) {
        item.group = 2;
    }
    if (item.content.includes('in-out')) {
        item.group = 3;
    }
    if (item.content.includes('cares')) {
        item.group = 4;
    }

    item.start = timeItem.start;
    item.comment = "";
    timelineTR.itemsData.update(item);

    timeItem.id = 'added-item-time';
    timeItem.className = 'item-time';
    timeItem.group = 5;
    timeItem.editable = false;
    timelineTR.itemsData.remove('adding-item-time');
    timelineTR.itemsData.add(timeItem);

    sendTransmission(item.id);
}


function showPreciseTime(params) {
    if (timelineTR.itemsData.get('cursor-time') != undefined && timelineTR.itemsData.get('cursor-time').start === params.time) {
        return;
    }
    var item = {
        id: "cursor-time",
        content: (String(params.time.getHours()).length === 1 ? '0' : '') + params.time.getHours() + ':' + (String(params.time.getMinutes()).length === 1 ? '0' : '') + params.time.getMinutes(),
        start: params.time,
        group: 0,
        type: "point",
        className: "cursor-time",
    };
    timelineTR.itemsData.update(item);
}

function showPreciseTimeDrag(params) {
    showPreciseTime(params);
    if (timelineTR.itemsData.get('adding-item-time') != undefined && timelineTR.itemsData.get('adding-item-time').start === params.time) {
        return;
    }
    var item = {
        id: "adding-item-time",
        content: (String(params.time.getHours()).length === 1 ? '0' : '') + params.time.getHours() + ':' + (String(params.time.getMinutes()).length === 1 ? '0' : '') + params.time.getMinutes(),
        start: params.time,
        group: 5,
        type: "point",
        className: "item-time",
    };
    timelineTR.itemsData.update(item);
}

for (var i = icons.length - 1; i >= 0; i--) {
    var item = icons[i];
    item.addEventListener('dragstart', handleDragStart.bind(this), false);
    item.addEventListener('dragend', handleDragEnd.bind(this), false);
}

timelineTR.on('mouseMove', showPreciseTime);
timelineTR.on('dragover', showPreciseTimeDrag);
container.addEventListener('mouseout', mouseOut);
