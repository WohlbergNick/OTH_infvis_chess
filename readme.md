# README Schachanalyse
Webseite für die Visualisierung von Schachpartien und dem hervorheben von menschlichen Mustern in gespielten Partien.


## Live Version 
https://wohlbergnick.github.io/OTH_infvis_chess/

# Dokumentation


## Datensatz

Als Datenbasis wird der Lichess Open Database Datensatz von Kaggle verwendet. Dieser enthält circa 20.000 Schachpartien aus der Online-Plattform Lichess und steht kostenlos zur Verfügung.

Die verwendeten Spalten aus dem Datensatz:
moves: Zugfolge in Schachnotation
winner: Gewinner der Partie
opening_name: Name der Eröffnung
opening_eco: ECO-Code der Eröffnung


## Warum dieser Datensatz?

Täglich werden unzählige Schachpartien gespielt, diese Daten sind jedoch aufgrund der  , diese sind jedoch aufgrund der abstrakten Schachdokumentation für den Großteil der  Ziel der Anwendung ist es, Muster im Schachspiel visuell erfahrbar zu machen — etwa welche Felder besonders häufig bespielt werden, welche Figuren welche Zonen dominieren, oder wie hoch die Gewinnwahrscheinlichkeit nach einem bestimmten Zug ist. Wir wollen zeigen, wie aus einem Datensatz, der ausschließlich gespielte Schachpartien enthält, vielfältige und unterschiedliche Informationen über das Spiel gewonnen werden können.


## Datenaufbereitung

In der Datenvorbereitung werden aus den Abstrakten Zugnatationen pro Partie die Spiele zugweise mithilfe von Pychess simuliert und nach jedem Zug wird das aktuelle Brett, also die Stellung der Figuren in FEN-Notation (kompakte Standard Version für das Speichern der Positionen aller Figuren in Schach auf dem Feld),

moves.json — flache Liste aller Züge mit Ausgangsfeld, Zielfeld, Ursprungsfeld der Figur, Figurentyp, Farbe und Zugnummer. Wird für die Heatmap-Filterung in der Figurenanalyse verwendet.

games.json — strukturierte Partiedaten mit Eröffnungsname, ECO-Code, Ergebnis und dem Brettzustand nach jedem Zug als FEN-String. Wird für die Stellungssuche verwendet.

## Datemsatz

## Warum

## Datenmapping
## Interaktionen


## Vergleich zu klassischen Engines

Unsere Anwendung finder ihre größte Konkurrenz für ihren Use-Case in den modernen Schach Engines, welche in der Lage sind ohne Datenbasis jeglich mögliche Stellungen in Schach zu evaluieren. Dies hat den Vorteil gegenüber unseren Ansatz das sie auch für tief gespielte Spiele an Akkurat nicht verlieren, eher im Gegenteil die Berechnung profitiert hier von weniger Figuren auf dem Feld. 

Bei unserem Ansatz ist es jedoch so das nur viel gespielte Stellungen bei der Gewinnverteilung akkurate (also ähnliche Ergebnisse wie etablierte Schach Engines) Ergebnisse liefert. Und ebenso nicht jede Stellung in den 20.000 Partien vorkommt, als Beispiel pro Zug exisitieren ca. 20 Züge, das bedeutet das nach 4 Zügen (20 * 20 * 20 * 20 = 160.000 > 20.000)  gar nicht mehr alle möglichen Stellungen abgedeckt werden können.

Unser Vorteil im direkten Vergleich ist jedoch das wir die Menschliche Muster und auch Menschliche Fehler im Natürlichen Spiel darstellen und nio


# EEG-Report

Der EEG Report ist ingesamt 593 (9:53 Minuten) Sekunden lang, die zugehörige Videoaufnahme des EEG-Tests ist jedoch nur 414 Sekunden lang (6:54 Minuten), dieser Unterschied von ~ 3 Minuten lässt sich jedoch auf die Vortests zurückführen, welche  




