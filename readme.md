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

Täglich werden unzählige Schachpartien gespielt, und generieren unzählige Daten, diese sind jedoch aufgrund der abstrakten Schachdokumentation für den Großteil der Bevökerung unverständlich. Ziel der Anwendung ist es, Muster im Schachspiel visuell erfahrbar zu machen, so etwa welche Felder besonders häufig bespielt werden, welche Figuren welche Zonen dominieren, oder wie hoch die Gewinnwahrscheinlichkeit nach einem bestimmten Zug ist.
Ebenso wollen wir aber auch aktiven Schachspielern eine alternative Möglichkeit zu klassischen Schach Engines bieten um ihr eigenes Spiel zu analysieren.
Wir wollen zeigen, wie aus einem Datensatz, der ausschließlich gespielte Schachpartien enthält, vielfältige und unterschiedliche Informationen über das Spiel sowie dem menschlichen Verhalten gewonnen werden können.


## Datenaufbereitung

In der Datenvorbereitung werden aus den Abstrakten Zugnatationen pro Partie die Spiele zugweise mithilfe von Pychess simuliert und nach jedem Zug wird das aktuelle Brett, also die Stellung der Figuren in FEN-Notation (kompakte Standard Version für das Speichern der Positionen aller Figuren in Schach auf dem Feld), gespeichert

moves.json — flache Liste aller Züge mit Ausgangsfeld, Zielfeld, Ursprungsfeld der Figur, Figurentyp, Farbe und Zugnummer. Wird für die Heatmap-Filterung in der Figurenanalyse verwendet.

games.json — strukturierte Partiedaten mit Eröffnungsname, ECO-Code, Ergebnis und dem Brettzustand nach jedem Zug als FEN-String. Wird für die Stellungssuche verwendet.

## Datenmapping
In unserer Visualisierung gibt es zwei unterschiedliche Visualisierungskomponenten die beide in 2D basis Funktionieren jedoch im 3D um eine weitere Information erweitert werden:

1. Stellungsanalyse:
   - Farbe der Felder = Häufigkeit der Folge-Züge
   - Gelbe Pfeile = häufigste Folge-Züge aus der aktuellen Stellung
   - Grüne Rahmen = Feld der Figuren zu den angezeigten möglichen Züge
   - Höhe (nur in 3D) = Gewinnrate der ziehenden Seite (niedrig = verliert oft, hoch = gewinnt oft)

2. Figurenanalyse:
    - Farbe der Felder = Häufigkeit (kalt = selten, warm = oft)
    - Farbe alternativ = Farbdominanz (dunkel = Schwarz dominiert, hell = Weiß dominiert)
    - Höhe (nur 3D) = Häufigkeit (selten = flach, oft = hoch)

## Interaktionen

Die Anwendung bietet zwei Hauptmodi, zwischen denen über einen Pfeil-Switcher gewechselt wird:

Stellungsanalyse

  - Bei der Stellungsanalyse dient das Schachbrett als Suchfilter.
  -Figuren per Drag-and-Drop auf dem Brett verschieben
  -Automatische Suche nach passenden Stellungen im Datensatz
  -Anzeige der häufigsten Folge-Züge, wahrscheinlichsten Eröffnung und Gewinnverteilung
  -Button "Häufigsten Zug spielen" führt automatisch den meistgespielten Zug aus
  -Undo und Reset für die Navigation durch Stellungen
  -Toggle "Züge anzeigen" blendet die Heatmap ein/aus
  -Toggle "Gewinnrate" (nur 3D) zeigt die Gewinnrate als Feldhöhe


Figurenanalyse


  -Filter nach Figurentyp (Bauer, Springer, Läufer, Turm, Dame, König)
  -Filter nach Startfeld durch Klick auf das Brett oder Texteingabe
  -Filter nach Farbe (Weiß / Beide / Schwarz) über einen Hebel
  -Filter nach Zugnummer
  -Toggle "Farbdominanz" wechselt zwischen Häufigkeits- und Dominanzdarstellung


Ansichten

Ebenso kann der User in der Anwendung zwischen 3 Darstellungskonzepten wählen.

2D — Canvas-Darstellung mit Heatmap und Drag-and-Drop
2D + 3D — beide Ansichten nebeneinander
3D — Three.js-Szene mit frei rotierbarer Kamera, Höhe als zusätzliche Informationsdimension


## Vergleich zu klassischen Engines

Unsere Anwendung finder ihre größte Konkurrenz für ihren Use-Case in den modernen Schach Engines, welche in der Lage sind ohne Datenbasis jeglich mögliche Stellungen in Schach zu evaluieren. Dies hat den Vorteil gegenüber unseren Ansatz das sie auch für tief gespielte Spiele an Akkurat nicht verlieren, eher im Gegenteil die Berechnung profitiert hier von weniger Figuren auf dem Feld. 

Bei unserem Ansatz ist es jedoch so das nur viel gespielte Stellungen bei der Gewinnverteilung akkurate (also ähnliche Ergebnisse wie etablierte Schach Engines) Ergebnisse liefert. Und ebenso nicht jede Stellung in den 20.000 Partien vorkommt, als Beispiel pro Zug exisitieren ca. 20 Züge, das bedeutet das nach 4 Zügen (20 * 20 * 20 * 20 = 160.000 > 20.000)  gar nicht mehr alle möglichen Stellungen abgedeckt werden können.

Unser Vorteil im direkten Vergleich ist jedoch das wir die Menschliche Muster und auch Menschliche Fehler im Natürlichen Spiel darstellen und nio


## EEG Studie

Zur Evaluation wurde eine Nutzerstudie mit EEG-Messung an einem Probanden durchgeführt. Die ersten beiden Segmente (ca. **−180 s bis 0 s**) dienten als Baseline mit Kalibrierungstests ohne Bezug zur Anwendung. Ab Segment 3 wurden sieben vordefinierte Tasks bearbeitet, jeweils mit einer Dauer von etwa **60 bis 90 Sekunden**.

### Ausgewertete Frequenzbänder

- **Alpha-Band (rot):** Entspannung und fokussierte Aufmerksamkeit
- **Beta-Band (blau):** Kognitive Belastung und aktive Informationsverarbeitung

### Interpretation

Während der Baseline zeigt das Signal eine ruhige und ausgeglichene Aktivität. Ab Segment 4 nimmt die Beta-Aktivität deutlich zu, was auf eine erhöhte kognitive Belastung bei der Farbdominanz-Aufgabe sowie den Filter-Interaktionen hindeutet. Segment 5 weist die höchste Belastung auf und korreliert mit den 3D-Aufgaben. Gegen Ende der Studie steigt die Varianz beider Frequenzbänder an, was auf Ermüdungseffekte schließen lässt.

### Abgeleitete Designänderungen

Aus den Ergebnissen der EEG-Auswertung wurden drei konkrete Verbesserungen der Anwendung abgeleitet:

- Die Legende der Farbdominanz-Ansicht wurde prominenter gestaltet und mit Endpunkt-Beschriftungen versehen.
- Aktive Filter werden nun visuell hervorgehoben.
- Die Steuerelemente der 3D-Ansicht wurden in funktionale Gruppen unterteilt, um die visuelle Suche zu reduzieren.

---

## Projektstruktur

```text
infvis_chess/
├── index.html
├── data/
│   ├── raw/
│   │   └── games.csv
│   ├── processed/
│   │   ├── moves.json
│   │   └── games.json
│   └── processing.py
└── src/
    ├── css/
    │   └── style.css
    └── js/
        ├── board.js
        ├── colorScale.js
        ├── filters.js
        ├── heatmap.js
        ├── tooltip.js
        ├── position.js
        ├── search.js
        ├── scene.js
        ├── pieces3d.js
        └── main.js
```

---

## Autoren

**Nick Wohlberg** & **Paul Zintl**  
OTH Amberg-Weiden  
**Informationsvisualisierung 2026** 




