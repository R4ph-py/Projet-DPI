"""Module patients"""

import secrets
import datetime
from db import DB


def get_new_id():
    """Fonction qui génère un nouvel id de patient"""
    new_uid = secrets.token_hex(8)
    while load_patient(uid=new_uid) is not None:
        new_uid = secrets.token_hex(8)

    return new_uid


class Gender:
    """Enumération des genres de patient"""

    MALE = "M"
    FEMALE = "F"
    OTHER = "O"


class Patient:
    """Objet patient"""

    def __init__(
        self, first_name: str, last_name: str, birthdate: datetime, gender: Gender
    ):
        self.uid = None
        self.first_name = first_name
        self.last_name = last_name
        self.birthdate = birthdate
        self.gender = gender

    def store(self):
        """Enregistre le patient dans la DB"""
        if self.uid is None:
            self.uid = get_new_id()
            DB.execute(
                "INSERT INTO Patients(id, first_name, last_name, birthdate, gender) VALUES (?, ?, ?, ?, ?)",
                (
                    self.uid,
                    self.first_name,
                    self.last_name,
                    self.birthdate,
                    self.gender,
                ),
            )
            DB.commit()

        else:
            DB.execute(
                "UPDATE Patients SET first_name = ?, last_name = ?, birthdate = ?, gender = ? WHERE id = ?",
                (
                    self.first_name,
                    self.last_name,
                    self.birthdate,
                    self.gender,
                    self.uid,
                ),
            )
            DB.commit()


def load_patient(uid: str = None):
    """Renvoie le patient correspondant à l'id uid"""
    res = None
    if uid is not None:
        res = DB.execute("SELECT * FROM Patients WHERE id=?", (uid,)).fetchone()

    if res is None:
        return None

    uid, first_name, last_name, birthdate, gender = res
    patient = Patient(first_name, last_name, birthdate, gender)
    patient.uid = uid
    return patient


def load_patients_list():
    """Renvoie la liste de tous les patients"""
    res = DB.execute("SELECT * FROM Patients", ()).fetchall()

    if res is None:
        return None

    patients_list = []
    for row in res:
        uid, first_name, last_name, birthdate, gender = row
        patient = Patient(first_name, last_name, birthdate, gender)
        patient.uid = uid
        patients_list.append(patient)

    return patients_list


def create_patients_table():
    """Crée la table des patients"""
    DB.execute(
        """
    CREATE TABLE IF NOT EXISTS Patients(
        id VARCHAR(16) PRIMARY KEY,
        first_name VARCHAR(50),
        last_name VARCHAR(50),
        birthdate DATE,
        gender TEXT CHECK( gender IN ('M','F','O') ) NOT NULL DEFAULT 'M'
    )
    """
    )
    DB.commit()
