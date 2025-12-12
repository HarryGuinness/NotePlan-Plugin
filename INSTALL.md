# Installation Guide for Book Review Helper Plugin

## Important: This plugin requires NotePlan on macOS/iOS

This development repository is on Linux, but NotePlan only runs on macOS/iOS. You need to install the plugin files on your Mac.

## Installation Methods

### Method 1: Manual Installation (Recommended for Development)

1. **On your Mac, find the NotePlan plugins directory:**

   Open Terminal and run:
   ```bash
   # For sandboxed NotePlan 3:
   open ~/Library/Containers/co.noteplan.NotePlan3/Data/Library/Application\ Support/co.noteplan.NotePlan3/Plugins/

   # OR for non-sandboxed NotePlan:
   open ~/Library/Application\ Support/NotePlan/Plugins/
   ```

2. **Create a folder for this plugin:**
   ```bash
   # Inside the Plugins directory, create:
   mkdir harryguinness.BookReview
   ```

3. **Copy these 2 files from this repository to that folder:**
   - `plugin.json`
   - `script.js`

   You can use:
   - Git clone/pull on your Mac
   - Sync via cloud storage (Dropbox, iCloud, etc.)
   - Copy files manually via USB/network

4. **In NotePlan on your Mac:**
   - Go to Preferences → Plugins
   - Click "Reload Plugin List"
   - Find "Book Review Helper" in the list
   - Make sure it's enabled (toggle ON)

5. **Test the plugin:**
   - Open Command Bar (⌘J)
   - Type "Test Plugin" and run it
   - Check if "Plugin Log" note is created

### Method 2: Using Symbolic Links (For Active Development)

If you want to edit the plugin files and have changes automatically reflected in NotePlan:

1. **On your Mac, create a symlink:**
   ```bash
   # Find your plugins directory first
   PLUGINS_DIR="$HOME/Library/Containers/co.noteplan.NotePlan3/Data/Library/Application Support/co.noteplan.NotePlan3/Plugins"

   # Create symlink to your development directory
   ln -s /path/to/your/NotePlan-Plugin "$PLUGINS_DIR/harryguinness.BookReview"
   ```

2. **Reload plugins in NotePlan after each change**

### Method 3: Plugin Developer Mode (If Available)

1. In NotePlan, check if there's a developer mode in Preferences
2. Point it to your development directory
3. This varies by NotePlan version

## Verification Checklist

After installation, verify:

- [ ] Files are in the correct Plugins directory
- [ ] Folder is named `harryguinness.BookReview` or similar
- [ ] Both `plugin.json` and `script.js` are present
- [ ] NotePlan shows the plugin in Preferences → Plugins
- [ ] Plugin is enabled (toggle is ON)
- [ ] "Test Plugin" command appears in Command Bar
- [ ] Running "Test Plugin" creates a "Plugin Log" note

## Troubleshooting Installation

### Plugin doesn't appear in NotePlan

1. Check you're in the correct Plugins directory:
   ```bash
   # List plugins
   ls -la ~/Library/Containers/co.noteplan.NotePlan3/Data/Library/Application\ Support/co.noteplan.NotePlan3/Plugins/
   ```

2. Verify file structure:
   ```
   Plugins/
   └── harryguinness.BookReview/
       ├── plugin.json
       └── script.js
   ```

3. Check file permissions:
   ```bash
   # Files should be readable
   chmod 644 plugin.json script.js
   ```

4. Restart NotePlan completely (Quit and reopen)

### Plugin appears but commands don't work

1. Check NotePlan console for errors:
   - View → Developer → Show Console
   - Look for JavaScript errors

2. Verify plugin.json is valid JSON:
   ```bash
   cat plugin.json | python3 -m json.tool
   ```

3. Check for syntax errors in script.js

## Development Workflow

For ongoing development:

1. Edit files in this repository
2. Sync/copy to Mac
3. In NotePlan: Preferences → Plugins → Reload Plugin List
4. Test changes
5. Check "Plugin Log" note and Console for errors
6. Commit changes to git when working

## Getting Help

If the plugin still doesn't work after installation:

1. Check the "Plugin Log" note in NotePlan
2. Open NotePlan Console (View → Developer → Show Console)
3. Look for error messages
4. Verify you've completed all setup steps in README.md
