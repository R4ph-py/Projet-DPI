"""Module transmissions"""

import secrets
from db import DB
import datetime


def get_new_id():
    """Fonction qui génère un nouvel id de transmission"""
    new_uid = secrets.token_hex(8)
    while load_transmission(trid=new_uid) is not None:
        new_uid = secrets.token_hex(8)

    return new_uid


class Topic:
    """Enumération des topics de transmission"""

    TEMP = "T"
    PRESSION_ARTERIELLE = "PA"
    POULS = "P"
    SATURATION = "S"
    DOULEUR = "D"
    ALIMENTATION = "A"
    ETAT_PSYCHOLOGIQUE = "EP"
    SELLES = "SE"
    URINES = "U"
    NAUSEES_VOMISSEMENTS = "NV"
    CHUTES = "C"
    CATHETER = "CA"
    PANSEMENT = "PAN"


class Category:
    """Enumération des catégories de transmission"""

    CONSTANTES = 1
    ETAT = 2
    ENTREES_SORTIES = 3
    SOINS = 4


class Transmission:
    """Objet transmission"""

    def __init__(
        self,
        id_patient: str,
        id_user: str,
        date: datetime,
        time: datetime,
        topic: Topic,
        value: str = None,
        comment: str = None,
    ):
        self.trid = None
        self.id_patient = id_patient
        self.id_user = id_user
        self.date = date
        self.time = time
        self.topic = topic
        self.value = value
        self.comment = comment

    def store(self):
        """Enregistre le transmission dans la DB"""
        if self.trid is None:
            self.trid = get_new_id()
            DB.execute(
                "INSERT INTO Transmissions(id, id_patient, id_user, date, time, topic, value, comment) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                (
                    self.trid,
                    self.id_patient,
                    self.id_user,
                    self.date,
                    self.time,
                    self.topic,
                    self.value,
                    self.comment,
                ),
            )
            DB.commit()

        else:
            DB.execute(
                "UPDATE Transmissions SET id_patient = ?, id_user = ?, date = ?, time = ?, topic = ?, value = ?, comment = ? WHERE id = ?",
                (
                    self.id_patient,
                    self.id_user,
                    self.date,
                    self.time,
                    self.topic,
                    self.value,
                    self.comment,
                    self.trid,
                ),
            )
            DB.commit()

    def remove(self):
        """Supprime le transmission de la DB"""
        if self.trid is not None:
            DB.execute("DELETE FROM Transmissions WHERE id=?", (self.trid,))
            DB.commit()

    def get_category(self):
        """Renvoie la catégorie de la transmission"""
        if self.topic in [Topic.TEMP, Topic.PRESSION_ARTERIELLE, Topic.POULS, Topic.SATURATION]:
            return Category.CONSTANTES
        if self.topic in [Topic.DOULEUR, Topic.ALIMENTATION, Topic.ETAT_PSYCHOLOGIQUE]:
            return Category.ETAT
        if self.topic in [Topic.URINES, Topic.SELLES, Topic.NAUSEES_VOMISSEMENTS]:
            return Category.ENTREES_SORTIES
        if self.topic in [Topic.CHUTES, Topic.CATHETER, Topic.PANSEMENT]:
            return Category.SOINS

        return None


def load_transmission(trid: str = None):
    """Renvoie le transmission correspondant à l'id trid"""
    res = None
    if trid is not None:
        res = DB.execute("SELECT * FROM Transmissions WHERE id=?", (trid,)).fetchone()

    if res is None:
        return None

    trid, id_patient, id_user, date, time, topic, value, comment = res
    transmission = Transmission(id_patient, id_user, date, time, topic, value, comment)
    transmission.trid = trid
    return transmission


def load_transmissions_list(id_patient: str):
    """Renvoie la liste de toutes les transmissions d'un patient"""
    res = DB.execute(
        "SELECT * FROM Transmissions WHERE id_patient=?", (id_patient,)
    ).fetchall()

    if res is None:
        return None

    transmissions_list = []
    for row in res:
        trid, id_patient, id_user, date, time, topic, value, comment = row
        transmission = Transmission(
            id_patient, id_user, date, time, topic, value, comment
        )
        transmission.trid = trid
        transmissions_list.append(transmission)

    return transmissions_list


def create_transmissions_table():
    """Crée la table des transmissions"""
    DB.execute(
        """
    CREATE TABLE IF NOT EXISTS Transmissions(
        id VARCHAR(16) PRIMARY KEY,
        id_patient VARCHAR(16) REFERENCES Patients(id),
        id_user VARCHAR(16) REFERENCES Users(id),
        date DATE,
        time TIME,
        topic TEXT CHECK( topic IN ('T','PA','P', 'S', 'D', 'A', 'EP', 'SE', 'U', 'NV', 'C', 'CA', 'PAN')),
        value TEXT,
        comment TEXT
    )
    """
    )
    DB.commit()
