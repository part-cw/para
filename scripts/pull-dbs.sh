#!/bin/bash

# Path where databases will be copied locally
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEST_DIR="$SCRIPT_DIR/db"
mkdir -p "$DEST_DIR"

# Pull databases from emulator
adb exec-out run-as com.anonymous.para cat files/SQLite/para.db > "$DEST_DIR/para.db"

echo "Databases pulled successfully!"