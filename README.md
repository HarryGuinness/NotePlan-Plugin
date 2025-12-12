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

### Manual Installation

1. Clone this repository or download the files
2. Copy the plugin folder to your NotePlan plugins directory
3. In NotePlan, go to Preferences → Plugins → Reload Plugin List

## Usage

### Automatic Mode

1. Create or open a Daily Note
2. Add the `#bookreview` tag anywhere in the note
3. Add a `## Book Review` heading
4. Write your book review under this heading
5. Save the note

The plugin will automatically:
- Extract the review content
- Detect the book title (from H3 heading, bold text, or first line)
- Create a new note in `30 - Resources/Books Read`
- Add a link back to your Daily Note
- Add a link to the book review note at the end of your review section

### Manual Mode

You can also manually trigger the extraction:

1. Open a note with a `## Book Review` section
2. Open Command Bar (Cmd+J or Ctrl+J)
3. Type "Extract Book Review" and press Enter

### Setting Up the Trigger

To enable automatic processing, add this to your Daily Note template frontmatter:

```yaml
---
triggers: onEditorWillSave => harryguinness.BookReview.onEditorWillSave
---
```

Or add it manually to any Daily Note you want to process.

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

### Plugin doesn't trigger automatically

- Make sure you have the `#bookreview` tag in your note
- Verify you have a `## Book Review` heading (exactly H2 level, not H1 or H3)
- Check that the trigger is set up in your note's frontmatter
- Make sure you're using a Daily Note (Calendar note type)

### Book review note not created

- Verify the `30 - Resources/Books Read` folder exists
- Check the NotePlan console (View → Developer → Show Console) for errors
- Make sure there's content under the `## Book Review` heading

### Duplicate notes being created

- The plugin checks for existing notes by title
- If you manually renamed or deleted the link, it might create a duplicate
- The plugin looks for the ➡️ symbol or existing links to prevent duplicates

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
