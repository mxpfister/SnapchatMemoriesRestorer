# 📸 Snapchat Memories Saver - Browser Version

Eine **100% private, vollständig im Browser laufende** Lösung zur Verarbeitung deiner Snapchat-Erinnerungen.

## ✨ Features

- ✅ **Komplett im Browser** - keine Server-Installation nötig
- 🔒 **Vollständig privat** - alle Daten bleiben lokal
- 📱 **Responsive Design** - funktioniert auf Desktop & Mobile
- 🎯 **Einfache Bedienung** - Drag & Drop Upload
- 📝 **EXIF-Daten** - automatisches Setzen von Datum & GPS
- 📦 **ZIP-Download** - verarbeitete Dateien als ZIP

## 🚀 So verwendest du es

### Lokal (schnell testen)
```bash
# Öffne einfach die index.html im Browser
open index.html
```

### GitHub Pages (für andere freigeben)

1. **Fork oder Clone dieses Repo**
   ```bash
   git clone https://github.com/dein-username/snapchat-memories-saver
   cd snapchat-memories-saver
   ```

2. **In GitHub-Einstellungen aktivieren:**
   - Settings → Pages
   - Source: Main Branch
   - Speichern

3. **Die Seite ist dann verfügbar unter:**
   ```
   https://dein-username.github.io/snapchat-memories-saver/
   ```

## 📖 Verwendung

1. **Deine Snapchat-Daten exportieren:**
   - Gehe zu https://accounts.snapchat.com/accounts/downloadmydata
   - Starte einen Datenexport
   - Warte auf die Email mit dem Download-Link
   - Lade `memories_history.json` herunter

2. **In der App hochladen:**
   - Lade die JSON-Datei hoch
   - Füge all deine Mediadateien hinzu (Fotos, Videos)
   - Klicke "Verarbeiten"
   - Die verarbeiteten Dateien werden als ZIP heruntergeladen

## 🔧 Was wird verarbeitet?

- 📷 **Fotos** (JPG, PNG, HEIC)
  - EXIF-Datum aus JSON-Historie
  - GPS-Koordinaten falls verfügbar
  
- 🎬 **Videos** (MP4, MOV, WebM)
  - Bleiben unverändert (keine EXIF in Browser)
  - Werden mit korrektem Namen versehen

## ⚠️ Wichtig

- **Keine Abhängigkeiten!** Alles läuft mit CDN-Libraries
- **Keine Datenübertragung** - wirklich alles lokal!
- Videos können bis zu 2GB groß sein (Browser-Limit)
- EXIF-Daten sind auf Fotos beschränkt

## 🛠️ Technologie Stack

- **HTML5 Canvas** - UI & Vorschau
- **piexifjs** - EXIF-Daten lesen/schreiben
- **jszip** - ZIP-Erstellung
- **Vanilla JavaScript** - keine Abhängigkeiten

## 📄 Lizenz

MIT - Frei verwendbar und modifizierbar

## ❓ Hilfe

Falls etwas nicht funktioniert:
1. Öffne die Browser-Konsole (F12) auf Fehler prüfen
2. Stelle sicher, dass die JSON-Datei korrekt ist
3. Versuche mit wenigen Dateien zuerst

---

**Feedback & Bug-Reports:** Erstelle einen Issue im GitHub Repo!
