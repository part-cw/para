#!/bin/bash

# Path where databases will be copied locally
DEST_DIR="$HOME/documents/repos/IGH/dev/dbs/para_app"
# mkdir -p "$DEST_DIR"

# Pull databases from emulator
adb exec-out run-as com.anonymous.para cat files/SQLite/para.db > "$DEST_DIR/para.db"
#adb exec-out run-as com.anonymous.para cat files/SQLite/patient_records.db > "$DEST_DIR/patient_records.db"

echo "Databases pulled successfully!"