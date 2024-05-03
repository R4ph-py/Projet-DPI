var modalIcons = document.querySelectorAll('.modal-needed');
var icons = document.querySelectorAll('.item');
var subicons = document.querySelectorAll('.subicon');
var hiddenUl = document.getElementById('hiddenUl');
var primaryItems = document.getElementById('primary-items');
var secondaryItems = document.getElementById('secondary-items');
var hideButton = document.getElementById('hide-button');
var commentArea = document.getElementById('comment-transmition');
var numInput1 = document.getElementById('num-1');
var numInput2 = document.getElementById('num-2');
var checkInput = document.getElementById('check-1');
var checkLabel = document.getElementById('check-1-label');

var update = {};

var groups = new vis.DataSet([{
    id: 0,
    content: ''
},
{
    id: 1,
    content: 'Constantes vitales',
    style: 'background: #ffeaea'
}, {
    id: 2,
    content: 'Etat',
    style: 'background: #e0fee0'
}, {
    id: 3,
    content: 'Entrées/Sorties',
    style: 'background: #f2f3ff'
}, {
    id: 4,
    content: 'Soins',
    style: 'background: #ffffe3'
}]);

var items = new vis.DataSet();

var options = {
    stack: true,
    zoomMin: 1000 * 60 * 60,
    zoomMax: 1000 * 60 * 60 * 12,
    editable: {
        add: true,
        updateTime: false,
        updateGroup: false,
        remove: true,
        overrideItems: false
    },
    onRemove: removeHandler,
    tooltip: {
        followMouse: true,
        overflowMethod: 'cap',
        delay: 200,
        template: function (item) {
            if (item.id.includes('cursor-time')) {
                return '';
            }
            var time = new Date(item.start);
            var comment = item.comment || '';
            var value = item.value || '';
            var topic = item.content.split('id="')[1].split('"')[0].replace(/[0-9]/g, '');
            var tooltip = '<div class="tooltip"><p>' + time.getHours() + ':' + (String(time.getMinutes()).length === 1 ? '0' : '') + time.getMinutes();
            if (comment !== '') {
                tooltip += '<br/>' + comment;
            }
            if (value !== '' && value !== undefined && value !== null) {
                switch (topic) {
                    case 'PA':
                        tooltip += '<br/>Pression artérielle : ' + value;
                        break;
                    case 'S':
                        tooltip += '<br/>Saturation : ' + value;
                        break;
                    case 'P':
                        tooltip += '<br/>Pouls : ' + value;
                        break;
                    case 'T':
                        tooltip += '<br/>Température : ' + value;
                        break;
                    case 'C':
                        tooltip += '<br/>Perte de conscience : ' + (value === 'true' ? 'Oui' : 'Non');
                        break;
                    default:
                        break;
                }
            }
            tooltip += '</p></div>';
            return tooltip;
        }
    },
};

var container = document.getElementById('visualization');
var timelineTR = new vis.Timeline(container, items, groups, options);


// Fonctions

function hideAllSubicons() {
    var length = secondaryItems.childNodes.length;
    hideButton.style.display = 'none';
    for (var child = 0; child < length; child++) {
        hiddenUl.appendChild(secondaryItems.childNodes[0]);
    }
    secondaryItems.appendChild(hideButton);
    primaryItems.style.display = 'block';
}

function removeHandler(event) {
    sendRemoveTransmission(event.id);
}

function handleDragStart(event) {
    var icon = event.target;

    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.dropEffect = 'move';

    var item = {
        id: 'added-item',
        content: icon.outerHTML,
    };

    event.dataTransfer.setData("text", JSON.stringify(item));
}

function mouseOut(event) {
    var timelineRect = container.getBoundingClientRect();
    var x = event.clientX;
    var y = event.clientY;
    if (x > timelineRect.left && x < timelineRect.right && y > timelineRect.top && y < timelineRect.bottom) {
        return;
    }
    timelineTR.itemsData.remove('cursor-time');
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

    if (item == null) {
        return;
    }

    if (selectedPatient == null) {
        timelineTR.itemsData.remove('added-item');
        alert('Veuillez sélectionner un patient');
        return;
    }

    hideInputs();
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

    item.start = timelineTR.itemsData.get('cursor-time').start;
    item.comment = "";
    timelineTR.itemsData.update(item);
    sendTransmission(item.id);
}

function cursorShowPreciseTime(params) {
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

function showCommentArea(value) {
    commentArea.value = value;
    commentArea.style.display = 'block';
}

function hideInputs() {
    commentArea.value = '';
    commentArea.style.display = 'none';
    numInput1.style.display = 'none';
    numInput2.style.display = 'none';
    checkInput.style.display = 'none';
}

function showItemInput(itemId) {
    var item = timelineTR.itemsData.get(itemId);
    var itemTopic = item.content.split('id="')[1].split('"')[0].replace(/[0-9]/g, '');
    if (itemTopic === "PA") {
        pressures = item.value.split('/') || [0, 0];
        numInput1.style.display = 'block';
        numInput1.setAttribute('placeholder', 'Systolique');
        numInput1.value = pressures[0];
        numInput1.max = 20;
        numInput1.min = 5;
        numInput1.step = 1;
        numInput2.style.display = 'block';
        numInput2.setAttribute('placeholder', 'Diastolique');
        numInput2.value = pressures[1];
        numInput2.max = 15;
        numInput2.min = 1;
        numInput2.step = 1;
        return;
    }
    if (itemTopic === "S") {
        numInput1.style.display = 'block';
        numInput1.setAttribute('placeholder', 'Saturation');
        numInput1.value = item.value;
        numInput1.max = 100;
        numInput1.min = 0;
        numInput1.step = 1;
        return;
    }
    if (itemTopic === "P") {
        numInput1.style.display = 'block';
        numInput1.setAttribute('placeholder', 'Pouls');
        numInput1.value = item.value;
        numInput1.max = 200;
        numInput1.min = 40;
        numInput1.step = 1;
        return;
    }
    if (itemTopic === "T") {
        numInput1.style.display = 'block';
        numInput1.setAttribute('placeholder', 'Température');
        numInput1.value = item.value;
        numInput1.max = 50;
        numInput1.min = 20;
        numInput1.step = 0.1;
        return;
    }
    if (itemTopic === "C") {
        checkInput.style.display = 'block';
        checkInput.className = item.value === 'true' ? '' : 'unchecked';
        return;
    }
}

function onClick(event) {
    hideInputs();
    if (event.item == null || event.item.includes('time')) {
        return;
    }
    showCommentArea(timelineTR.itemsData.get(event.item).comment || '');
    showItemInput(event.item);
}

function updateTransmission(itemId) {
    sendTransmission(itemId);
}

function onInput(event) {
    var item = timelineTR.itemsData.get(timelineTR.getSelection()[0]);
    var value = event.target.value;
    if (event.target.id === 'comment-transmition') {
        item.comment = value;
        timelineTR.itemsData.update(item);
    }
    if (event.target.id === 'num-1' || event.target.id === 'num-2') {
        if (item.content.includes('PA')) {
            item.value = numInput1.value + '/' + numInput2.value;
        } else {
            item.value = value;
        }
    }
    if (event.target.id === 'check-1') {
        if (checkInput.className.includes('unchecked')) {
            checkInput.className = '';
            item.value = true;
        }
        else {
            checkInput.className = 'unchecked';
            item.value = false;
        }
    }
    if (item.id in update) {
        clearTimeout(update[item.id]);
    }
    update[item.id] = setTimeout(updateTransmission, 100, item.id);
}


// Events

for (var i = icons.length - 1; i >= 0; i--) {
    var item = icons[i];
    item.addEventListener('dragstart', handleDragStart.bind(this), false);
    item.addEventListener('dragend', handleDragEnd.bind(this), false);
}

for (var modal of modalIcons) {
    modal.addEventListener('click', (event) => {
        primaryItems.style.display = 'none';
        hideButton.style.display = 'inline';
        for (var subicon of subicons) {
            if (subicon.id.substring(0, subicon.id.length - 1) === event.target.id) {
                secondaryItems.appendChild(subicon.parentElement);
            }
        }
    });
}

timelineTR.on('mouseMove', cursorShowPreciseTime);
timelineTR.on('dragover', cursorShowPreciseTime);
timelineTR.on('click', onClick);
container.addEventListener('mouseout', mouseOut);
commentArea.addEventListener('input', onInput);
numInput1.addEventListener('input', onInput);
numInput2.addEventListener('input', onInput);
checkInput.addEventListener('click', onInput);
hideButton.addEventListener('click', hideAllSubicons);

setTimeout(() => {
    timelineTR.moveTo((new Date() - 1000 * 60 * 60 * 4), { animation: true });
}, 0);
