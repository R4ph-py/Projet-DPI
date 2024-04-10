"""Fichier serveur du projet"""

import secrets
from flask_socketio import SocketIO, emit
from flask import Flask, request, render_template, redirect, make_response
from patients import (
    Gender,
    Patient,
    load_patient,
    load_patients_list,
    create_patients_table,
)
from transmissions import (
    Category,
    Transmission,
    load_transmission,
    load_transmissions_list,
    create_transmissions_table,
)
from users import User, load_user, load_users_list, create_users_table

# <-----------------------------------> #
# <----- Configurations diverses -----> #


app = Flask(__name__)
app.config["SECRET_KEY"] = secrets.token_hex(6)
socketio = SocketIO(app, cors_allowed_origins="*", logger=True)

create_patients_table()
create_transmissions_table()
create_users_table()


# <-----------------------------------> #
# <-----------------------------------> #

# <-----------------------------------> #
# <---------- Routes  Flask ----------> #


@app.route("/")
def index():
    """Page principale"""
    return render_template("index.html")


@app.route("/accueil")
def accueil():
    """Page d'accueil"""
    return render_template("base/accueil.html")


@app.route("/lsidebar")
def lsidebar():
    """Left sidebar"""
    return render_template("base/left-sidebar.html")


@app.route("/rsidebar")
def rsidebar():
    """Right sidebar"""
    return render_template("base/right-sidebar.html")


@app.route("/nsidebar")
def nsidebar():
    """No sidebar"""
    return render_template("base/no-sidebar.html")


@app.route("/tsidebar")
def tsidebar():
    """Two sidebar"""
    return render_template("base/two-sidebar.html")


# <-----------------------------------> #
# <-----------------------------------> #

# <-----------------------------------> #
# <--------- Routes SocketIO ---------> #


@socketio.on("get_auth")
def get_auth():
    """Authentification"""
    user = load_users_list()[0]
    if user is not None:
        emit(
            "auth",
            {
                "uid": user.uid,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "occupation": user.occupation,
            },
        )
    else:
        emit("auth", {"uid": None})


@socketio.on("get_patients")
def get_patients():
    """Récupération des patients"""
    patients = load_patients_list()
    patients = []
    for p in patients:
        patients.append(
            {
                "uid": p.uid,
                "first_name": p.first_name,
                "last_name": p.last_name,
                "birthdate": p.birthdate,
            }
        )

    emit("patients", {"patients": patients})


@socketio.on('get_transmission')
def get_transmission(data):
    """Récupération d'une transmission"""
    tr = load_transmission(data['trid'])
    if tr is None:
        return

    emit('transmission', {
        'trid': tr.trid,
        'date': tr.date,
        'time': tr.time,
        'topic': tr.topic,
        'value': tr.value,
        'comment': tr.comment,
        'group': tr.get_category(),
    })


@socketio.on("get_transmissions")
def get_transmissions(data):
    """Récupération des transmissions"""
    # transmissions = load_transmissions_list(data["uid"])
    transmissions = load_transmissions_list(load_patients_list()[0].uid)
    transmissions = [
        {
            "trid": tr.trid,
            "date": tr.date,
            "time": tr.time,
            "topic": tr.topic,
            "value": tr.value,
            "comment": tr.comment,
            "group": tr.get_category(),
        }
        for tr in transmissions
    ]
    emit("transmissions", {"transmissions": transmissions})


@socketio.on("add_transmission")
def add_transmission(data):
    """Ajout d'une transmission"""
    tr = Transmission(
        date=data["date"],
        time=data["time"],
        topic=data["topic"],
        value=data["value"],
        comment=data["comment"],
        id_patient=load_patients_list()[0].uid,
        id_user=load_users_list()[0].uid,
    )
    tr.store()
    print(tr.trid)
    emit("transmission_added", {"trid": tr.trid}, broadcast=True)


@socketio.on("update_transmission")
def update_transmission(data):
    """Mise à jour d'une transmission"""
    tr = load_transmission(data["trid"])
    if tr is None:
        return

    tr.date = data["date"]
    tr.time = data["time"]
    tr.topic = data["topic"]
    tr.value = data["value"]
    tr.comment = data["comment"]
    tr.store()
    emit("transmission_updated", {"trid": tr.trid}, broadcast=True, include_self=False)


@socketio.on("remove_transmission")
def remove_transmission(data):
    """Suppression d'une transmission"""
    tr = load_transmission(data["trid"])
    if tr is None:
        return
    tr.remove()
    emit("transmission_removed", {"trid": data["trid"]}, broadcast=True)


# <-----------------------------------> #
# <-----------------------------------> #

# <-----------------------------------> #
# <-------- Démarrage serveur --------> #


socketio.run(app, host="0.0.0.0", port=5000, debug=True)
