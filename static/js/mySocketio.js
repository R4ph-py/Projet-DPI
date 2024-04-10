var user = {};
var patients = [];
var icons = Array.from(document.querySelectorAll('.item'));
var subicons = document.querySelectorAll('.subicon');


function sendTransmission(itemId) {
    var item = timelineTR.itemsData.get(itemId);
    var timeItem = timelineTR.itemsData.get(itemId + '-time');

    if (item === undefined || timeItem === undefined) {
        return;
    }

    var icon = item.content;

    var topic = icon.split('id="')[1].split('"')[0];
    var value = "0";

    if (icon.includes('subicon')) {
        value = topic[topic.length - 1];
        topic = topic.substring(0, topic.length - 1);
    }

    var type = 'add_transmission';
    if (!itemId.includes('added-item')) {
        type = 'update_transmission';
    }

    socket.emit(type, {
        trid: itemId,
        date: timeItem.start.getFullYear() + '-' + (timeItem.start.getMonth() + 1) + '-' + timeItem.start.getDate(),
        time: timeItem.start.getHours() + ':' + timeItem.start.getMinutes(),
        topic: topic,
        value: value,
        comment: item.comment,
    });
}


function sendRemoveTransmission(itemId) {
    socket.emit('remove_transmission', { trid: itemId });
}

socket.on('transmissions', function (data) {
    var transmissions = data.transmissions;
    for (var transmission of transmissions) {
        var date = transmission.date.split('-');
        var time = transmission.time.split(':');
        var itemContent = "";
        for (var icon of icons) {
            if (icon.childNodes[1].id === transmission.topic) {
                itemContent = icon.innerHTML;
                break;
            }
        }
        if (itemContent === "") {
            for (var subicon of subicons) {
                if (subicon.id === transmission.topic + transmission.value) {
                    itemContent = subicon.outerHTML;
                    break;
                }
            }
        }
        var startTime = new Date(date[0], date[1] - 1, date[2], time[0], time[1], 0, 0);
        timelineTR.itemsData.add({
            id: transmission.trid,
            content: itemContent,
            start: startTime,
            group: transmission.group,
            type: "box",
            comment: transmission.comment,
        });
        timelineTR.itemsData.add({
            id: transmission.trid + "-time",
            content: (String(time[0]).length === 1 ? '0' : '') + time[0] + ':' + (String(time[1]).length === 1 ? '0' : '') + time[1],
            start: startTime,
            group: 5,
            type: "point",
            className: "item-time",
        });
    }
});


socket.on('patients', function (data) {
    patients = data.patients;
    for (var patient of patients) {
        var patient_data = {
            id: patient.uid,
            name: patient.first_name + " " + patient.last_name,
            birthdate: patient.birthdate,
            gender: patient.gender,
        };
        patients.push(patient_data);
    }

    var patientSelect = document.getElementById('patientSelect');
    for (var patient of patients) {
        var option = document.createElement('option');
        option.value = patient.id;
        option.innerHTML = patient.name;
        patientSelect.appendChild(option);
    }
});


socket.on('auth', function (data) {
    if (data.uid !== null) {
        user.first_name = data.first_name;
        user.last_name = data.last_name;
        user.uid = data.uid;
        user.occupation = data.occupation;
        // socket.emit('get_patients');
        socket.emit('get_transmissions', "0");
    }
});


socket.on('transmission', function (data) {
    var selected = false;
    if (timelineTR.itemsData.get(data.trid) !== null) {
        if (timelineTR.getSelection()[0] === data.trid) {
            selected = true;
        }
        timelineTR.itemsData.remove(data.trid);
        timelineTR.itemsData.remove(data.trid + "-time");
    }

    var date = data.date.split('-');
    var time = data.time.split(':');
    var itemContent = "";
    for (var icon of icons) {
        if (icon.childNodes[1].id === data.topic) {
            itemContent = icon.innerHTML;
            break;
        }
    }
    if (itemContent === "") {
        for (var subicon of subicons) {
            if (subicon.id === data.topic + data.value) {
                itemContent = subicon.outerHTML;
                break;
            }
        }
    }
    var startTime = new Date(date[0], date[1] - 1, date[2], time[0], time[1], 0, 0);
    timelineTR.itemsData.add({
        id: data.trid,
        content: itemContent,
        start: startTime,
        group: data.group,
        type: "box",
        comment: data.comment,
    });
    timelineTR.itemsData.add({
        id: data.trid + "-time",
        content: (String(time[0]).length === 1 ? '0' : '') + time[0] + ':' + (String(time[1]).length === 1 ? '0' : '') + time[1],
        start: startTime,
        group: 5,
        type: "point",
        className: "item-time",
    });

    if (selected) {
        timelineTR.setSelection([data.trid]);
        showCommentBox(data.comment);
    }
});


socket.on('transmission_added', function (data) {
    var here = false;
    for (var item of timelineTR.itemsData.get()) {
        if (item.id === "added-item") {
            timelineTR.itemsData.remove(item.id);
            item.id = data.trid;
            timelineTR.itemsData.update(item);
            here = true;
        }
        if (item.id === "added-item-time") {
            timelineTR.itemsData.remove(item.id);
            item.id = data.trid + "-time";
            timelineTR.itemsData.update(item);
        }
    }
    if (!here) {
        socket.emit('get_transmission', {trid: data.trid});
    }
});


socket.on('transmission_updated', function (data) {
    socket.emit('get_transmission', {trid: data.trid});
});


socket.on('transmission_removed', function (data) {
    if (data.trid === timelineTR.getSelection()[0]) {
        hideCommentBox();
    }
    timelineTR.itemsData.remove(data.trid);
    timelineTR.itemsData.remove(data.trid + "-time");
});


socket.emit('get_auth');