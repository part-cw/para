# para

A new version of the Pediatric Risk Assessment (PARA) app in React and React Native

# Installation

This app is built with Expo. [Please see the Expo Docs](https://docs.expo.dev/get-started/installation/) for installing prerequisites.

After cloning the repo, run `npm install` from the project directory to install dependencies.

# Running

To run:

```bash
  npx expo start
```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

After launching, you can open the app on another platform simultaneously by pressing **a** (android) **i** (ios) or **w** (web) in the console.


## Testing SQLite Database

### Prerequisites
- Android emulator set up and running
- A DB viewer — [TablePlus](https://tableplus.com/) (or your favourite db manager) is recommended, or install the [SQLite Viewer](https://marketplace.visualstudio.com/items?itemName=qwtel.sqlite-viewer) extension in VS Code

### Steps

1. Launch PARA from an Android emulator by running one of the following in your terminal:
   - `npx expo run:android` — development build (recommended, most similar to what users will experience)
   - `npx expo start` — uses Expo Go

2. From the project root, run the pull script:
```bash
    cd scripts
    ./pull-dbs.sh
```
  This pulls the database into `scripts/db/`.

3. Open the `.db` file using one of these methods:
   - **TablePlus** (recommended) — drag and drop the `.db` file onto the dock icon, or go to File → Open
   - **VS Code** — open the file directly with the SQLite Viewer extension installed
   - **Terminal** (no install needed, macOS only):

      ```bash
            sqlite3 scripts/db/para.db
      ```
      This allows you to run SQL from your Terminal.
      
      Useful commands:
        - `.tables` — list all tables
        - `.schema <table>` — show table structure
        - `SELECT * FROM <table>;` — view all rows in a table
        - `.quit` — exit

        For more, see the [SQLite CLI reference](https://www.sqlite.org/cli.html).

> **Note:** `adb` only works for Android emulators and USB-connected Android devices with debugging enabled. It does not work for iOS. See `scripts/pull-dbs.sh` for details. 
