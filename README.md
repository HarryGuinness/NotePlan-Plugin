# Book Review Helper Plugin for NotePlan

A NotePlan plugin that automatically extracts book reviews from your Daily Notes and creates dedicated notes in a Books Read folder.

## Features

- **Automatic Processing**: Triggers when you save a Daily Note tagged with `#bookreview`
- **Smart Extraction**: Finds content under `## Book Review` heading
- **Organized Storage**: Creates notes in `30 - Resources/Books Read` folder
- **Bidirectional Links**: Automatically links between Daily Note and Book Review note
- **Duplicate Prevention**: Won't create duplicate notes if already processed
- **Manual Control**: Includes a manual command for on-demand extraction

## Installation

### From NotePlan Plugin Repository

1. Open NotePlan
2. Go to Preferences → Plugins
3. Search for "Book Review Helper"
4. Click Install
5. **IMPORTANT**: Follow the setup steps below!

### Manual Installation

1. Clone this repository or download the files
2. Copy the plugin folder to your NotePlan plugins directory
3. In NotePlan, go to Preferences → Plugins → Reload Plugin List
4. **IMPORTANT**: Follow the setup steps below!

## ⚠️ REQUIRED SETUP STEPS

### Step 1: Verify Plugin Installation

1. Open NotePlan
2. Go to Preferences → Plugins
3. Find "Book Review Helper" in the list
4. Make sure it's enabled (toggle should be ON)

### Step 2: Test the Plugin

1. Open Command Bar (Cmd+J or Ctrl+J)
2. Type "Test Plugin" and press Enter
3. Check if a "Plugin Log" note appears in your notes
4. If the test succeeds, you'll see a confirmation message

### Step 3: Set Up Automatic Trigger (Choose ONE option)

**Option A: Add to Daily Note Template (RECOMMENDED)**

1. Go to NotePlan Preferences → Templates
2. Find your Daily Note template
3. Add this to the **very top** of the template:

```yaml
---
triggers: onEditorWillSave => harryguinness.BookReview.onEditorWillSave
---
```

4. Save the template
5. All new Daily Notes will now automatically process book reviews!

**Option B: Add to Individual Notes (Manual)**

Add the following to the top of any Daily Note you want to process:

```yaml
---
triggers: onEditorWillSave => harryguinness.BookReview.onEditorWillSave
---
```

**Option C: Use Manual Command Only**

If you don't want automatic processing, just use the "Extract Book Review" command manually whenever you want to process a review.

### Step 4: Create the Book Review Folder

1. In NotePlan, create this folder structure:
   ```
   30 - Resources/
     └── Books Read/
   ```

2. Or configure a different folder in Preferences → Plugins → Book Review Helper settings

## Usage

### Automatic Mode (if you completed Step 3, Option A or B)

1. Create or open a Daily Note (one with the trigger in frontmatter)
2. Add the `#bookreview` tag anywhere in the note
3. Add a `## Book Review` heading
4. Write your book review under this heading
5. Save the note (Cmd+S or Ctrl+S)

The plugin will automatically:
- Extract the review content
- Detect the book title (from H3 heading, bold text, or first line)
- Create a new note in your configured folder
- Add a link back to your Daily Note
- Add a link to the book review note at the end of your review section

### Manual Mode

You can also manually trigger the extraction:

1. Open a note with a `## Book Review` section
2. Open Command Bar (Cmd+J or Ctrl+J)
3. Type "Extract Book Review" and press Enter

## Book Review Format

The plugin is flexible with your book review format. Here are some examples:

### Example 1: With H3 Title

```markdown
## Book Review #bookreview

### The Great Gatsby by F. Scott Fitzgerald

This classic novel explores themes of wealth, love, and the American Dream...

Rating: ⭐⭐⭐⭐⭐
```

### Example 2: With Bold Title

```markdown
## Book Review #bookreview

**Atomic Habits by James Clear**

An excellent guide to building better habits and breaking bad ones...

Key takeaways:
- Start small
- Focus on systems, not goals
```

### Example 3: Simple Format

```markdown
## Book Review #bookreview

Project Hail Mary

A thrilling science fiction novel with great character development...
```

## Created Note Structure

The plugin creates notes with the following structure:

```markdown
# Book Review: [Book Title]

📅 Reviewed on: [[2025-12-12]]

---

[Your review content]

---

#book #review
```

## Folder Structure

The plugin expects the following folder structure:

```
30 - Resources/
  └── Books Read/
```

If the folder doesn't exist, you'll need to create it manually in NotePlan before using the plugin.

## Configuration

Currently, the plugin uses these defaults:

- **Trigger Tag**: `#bookreview`
- **Heading**: `## Book Review` (H2 level)
- **Folder**: `30 - Resources/Books Read`
- **Link Symbol**: ➡️

These are hardcoded but can be modified in the `script.js` file if needed.

## Troubleshooting

### Plugin Log note not being created

**This means the plugin isn't loading at all. Try these steps:**

1. Open NotePlan Preferences → Plugins
2. Find "Book Review Helper" and make sure it's enabled
3. Click "Reload Plugin List"
4. Try running "Test Plugin" command again
5. Check the NotePlan console (View → Developer → Show Console) for errors
6. Make sure the plugin files are in the correct directory

### Plugin doesn't trigger automatically

**Run the "Test Plugin" command first to verify the plugin is working.**

Then check:
- Make sure you added the trigger to your note's frontmatter (see Step 3 in Setup)
- Verify you have the `#bookreview` tag in your note
- Verify you have a `## Book Review` heading (exactly H2 level, not H1 or H3)
- Make sure you're using a Daily Note (Calendar note type)
- Check the "Plugin Log" note for debug messages
- Try the manual "Extract Book Review" command to see if that works

### Book review note not created

1. First, check the "Plugin Log" note for error messages
2. Verify the configured folder exists (default: `30 - Resources/Books Read`)
3. Check the NotePlan console (View → Developer → Show Console) for errors
4. Make sure there's content under the `## Book Review` heading
5. Try running "Test Plugin" to verify basic functionality

### Duplicate notes being created

- The plugin checks for existing notes by title
- If you manually renamed or deleted the link, it might create a duplicate
- The plugin looks for the ➡️ symbol or existing links to prevent duplicates

### How to view detailed logs

1. Open the "Plugin Log" note in NotePlan
2. All plugin activity is logged here with timestamps
3. Look for ERROR messages to identify problems
4. DEBUG messages show detailed execution flow

## Technical Details

### Requirements

- NotePlan 3.7.2 or higher
- Works with Daily Notes (Calendar notes)

### Trigger Types

The plugin uses the `onEditorWillSave` trigger, which runs every time you save a note. This is efficient because:
- It only processes notes with `#bookreview` tag
- It only works on Calendar (Daily) notes
- It checks for existing links to prevent duplicates

### API Methods Used

- `Editor.note` - Access current note
- `DataStore.projectNoteByTitle()` - Find existing notes
- `DataStore.newNote()` - Create new notes
- `DataStore.projectNoteByFilename()` - Access note by filename
- Note paragraph manipulation for extracting content

## Development

### Structure

```
NotePlan-Plugin/
├── plugin.json      # Plugin metadata and configuration
├── script.js        # Main plugin code
└── README.md        # This file
```

### Building

This plugin doesn't require a build step. It's pure JavaScript that runs in NotePlan's plugin environment.

### Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## Resources

- [NotePlan Plugin Documentation](https://help.noteplan.co/article/67-create-command-bar-plugins)
- [NotePlan Plugins Repository](https://github.com/NotePlan/plugins)
- [Plugin Note Triggers](https://help.noteplan.co/article/173-plugin-note-triggers)
- [JavaScript Plugin API](https://help.noteplan.co/article/70-javascript-plugin-api)

## License

MIT License - feel free to use and modify as needed.

## Author

Harry Guinness

## Version History

### 1.0.0 (2025-12-12)
- Initial release
- Automatic book review extraction from Daily Notes
- Manual extraction command
- Bidirectional linking between Daily Notes and Book Review notes
- Duplicate prevention
