#!/usr/bin/env python3
"""Insère la bibliothèque commune (interface.css, interface.js, plus tard exercices.js) dans un fichier de carte interactive.
Utilisé par integrer.py (maths) et par inserer_francais() (français). Le résultat reste un fichier unique, sans fichier externe.
Repères : /*BIB-CSS*/ … /*BIB-CSS-FIN*/ et /*BIB-JS*/ … /*BIB-JS-FIN*/ (retirés puis remis à chaque lancement : relance sans effet)."""
import pathlib, re, sys
ICI = pathlib.Path(__file__).resolve().parent
def css():  return "/*BIB-CSS*/\n" + (ICI / "interface.css").read_text(encoding="utf8") + "\n/*BIB-CSS-FIN*/\n"
def js():
    t = (ICI / "interface.js").read_text(encoding="utf8")
    ex = ICI / "exercices.js"
    if ex.exists(): t += "\n" + ex.read_text(encoding="utf8")
    return "/*BIB-JS*/\n" + t + "\n/*BIB-JS-FIN*/\n"
def retirer(s):
    s = re.sub(r"/\*BIB-CSS\*/.*?/\*BIB-CSS-FIN\*/\n", "", s, flags=re.S)
    return re.sub(r"/\*BIB-JS\*/.*?/\*BIB-JS-FIN\*/\n", "", s, flags=re.S)
def inserer(s, avant_css, avant_js):
    """avant_css / avant_js : textes devant lesquels poser les blocs (premier exemplaire)."""
    s = retirer(s)
    for nom, ancre, bloc in (("css", avant_css, css()), ("js", avant_js, js())):
        if s.count(ancre) < 1: sys.exit(f"bibliothèque : repère {nom} introuvable : {ancre[:60]}")
        i = s.index(ancre); s = s[:i] + bloc + s[i:]
    return s
