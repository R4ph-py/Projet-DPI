"""Module utilisateurs"""
import secrets
from db import DB


def get_new_uid():
    """Fonction qui génère un nouvel id d'utilisateur"""
    new_uid = secrets.token_hex(8)
    while load_user(uid=new_uid) is not None:
        new_uid = secrets.token_hex(8)

    return new_uid


class User:
    """Objet utilisateur"""

    def __init__(self, first_name: str, last_name: str, occupation: str):
        self.uid = None
        self.first_name = first_name
        self.last_name = last_name
        self.occupation = occupation

    def store(self):
        """Enregistre l'utilisateur dans la DB"""
        if self.uid is None:
            self.uid = get_new_uid()
            DB.execute('INSERT INTO Users(id, first_name, last_name, occupation) VALUES (?, ?, ?, ?)',
                        (self.uid, self.first_name, self.last_name, self.occupation))
            DB.commit()

        else:
            DB.execute('UPDATE Users SET first_name = ?, last_name = ?, occupation = ? WHERE id = ?',
                        (self.first_name, self.last_name, self.occupation, self.uid))
            DB.commit()


def load_user(uid: str = None):
    """Renvoie l'utilisateur correspondant à l'id uid"""
    res = None

    if uid is not None:
        res = DB.execute("SELECT * FROM Users WHERE id=?", (uid,)).fetchone()

    if res is None:
        return None

    uid, first_name, last_name, occupation = res
    user = User(first_name, last_name, occupation)
    user.uid = uid
    return user


def load_users_list():
    """Renvoie la liste de tous les utilisateurs"""
    res = DB.execute("SELECT * FROM Users", ()).fetchall()

    if res is None:
        return None

    users_list = []
    for row in res:
        uid, first_name, last_name, occupation = row
        user = User(first_name, last_name, occupation)
        user.uid = uid
        users_list.append(user)

    return users_list


def create_users_table():
    """Crée la table des utilisateurs"""
    DB.execute('''
    CREATE TABLE IF NOT EXISTS Users(
        id VARCHAR(16) PRIMARY KEY,
        first_name VARCHAR(50),
        last_name VARCHAR(50),
        occupation VARCHAR(50)
    )
    ''')
    DB.commit()
