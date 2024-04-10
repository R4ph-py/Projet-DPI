"""Module d'ouverture de la DB"""
import sqlite3

DB = sqlite3.connect("data.db", check_same_thread=False)

# def insert(table, columns, values):
#     """Insertion dans la DB"""
#     cursor = DB.cursor()
#     cursor.execute(f"INSERT INTO {table} ({columns}) VALUES ({values})")
#     DB.commit()

# def select(table, columns, condition):
#     """Selection dans la DB"""
#     cursor = DB.cursor()
#     cursor.execute(f"SELECT {columns} FROM {table} WHERE {condition}")
#     return cursor.fetchall()

# def update(table, columns, values, condition):
#     """Mise à jour dans la DB"""
#     cursor = DB.cursor()
#     cursor.execute(f"UPDATE {table} SET {columns} = {values} WHERE {condition}")
#     DB.commit()

# def delete(table, condition):
#     """Suppression dans la DB"""
#     cursor = DB.cursor()
#     cursor.execute(f"DELETE FROM {table} WHERE {condition}")
#     DB.commit()

# def create_table(table, columns):
#     """Création de table dans la DB"""
#     cursor = DB.cursor()
#     cursor.execute(f"CREATE TABLE {table} ({columns})")
#     DB.commit()
