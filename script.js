/**
 * Harry's Auto Filer Plugin for NotePlan
 * Automatically extracts content from Daily Notes based on hashtags and files them into designated folders
 */

/**
 * Plugin initialization - called when plugin loads
 */
async function init() {
  try {
    console.log('Harry\'s Auto Filer Plugin v1.5.2 initializing...')
    console.log('Plugin initialized')
  } catch (error) {
    console.log(`Error during plugin initialization: ${String(error)}`)
  }
}

/**
 * Test command to verify plugin is working
 */
async function testPlugin() {
  try {
    console.log('Test command executed')
    console.log(`Current time: ${new Date().toISOString()}`)
    console.log(`DataStore available: ${typeof DataStore !== 'undefined'}`)
    console.log(`Editor available: ${typeof Editor !== 'undefined'}`)

    const note = Editor.note
    if (note) {
      console.log(`Current note: ${note.title || 'Untitled'} (type: ${note.type})`)
    } else {
      console.log('No note currently open in editor')
    }

    await CommandBar.prompt('Plugin Test', 'Test completed! Check the console for details.')
  } catch (error) {
    const errorMsg = `Test command error: ${String(error)}`
    console.log(errorMsg)
    await CommandBar.prompt('Test Failed', errorMsg)
  }
}

/**
 * Parse hashtag-folder pairs from settings
 * @returns {Array<{hashtag: string, folder: string}>} - Array of hashtag-folder pairs
 */
function parseHashtagFolderPairs() {
  const pairsString = DataStore.settings.hashtagFolderPairs || '#bookreview -> 30 - Resources/Books Read'
  const pairs = []

  const lines = pairsString.split('\n')
  for (const line of lines) {
    const trimmedLine = line.trim()
    if (trimmedLine.length === 0 || trimmedLine.startsWith('//')) {
      continue // Skip empty lines and comments
    }

    // Parse format: #hashtag -> folder/path
    const match = trimmedLine.match(/^(#\w+)\s*->\s*(.+)$/)
    if (match) {
      const hashtag = match[1].toLowerCase()
      const folder = match[2].trim()
      pairs.push({ hashtag, folder })
    }
  }

  return pairs
}

/**
 * Find which hashtag (if any) from the configured pairs exists in the note
 * @param {Note} note - The note to check
 * @returns {Object|null} - The matching pair or null
 */
function findMatchingHashtag(note) {
  if (!note.hashtags || note.hashtags.length === 0) {
    return null
  }

  const pairs = parseHashtagFolderPairs()
  const noteHashtags = note.hashtags.map(tag => tag.toLowerCase())

  for (const pair of pairs) {
    if (noteHashtags.includes(pair.hashtag)) {
      return pair
    }
  }

  return null
}

/**
 * Triggered when a note is saved (onEditorWillSave trigger)
 * Checks if it's a Daily Note with configured hashtags and processes it
 */
async function onEditorWillSave() {
  try {
    const note = Editor.note

    // Only process if note exists
    if (!note) {
      return
    }

    // Only process Calendar notes (Daily Notes)
    if (note.type !== 'Calendar') {
      return
    }

    // Check if note has any configured hashtag
    const matchingPair = findMatchingHashtag(note)
    if (!matchingPair) {
      return
    }

    // Process the content
    await processContent(note, matchingPair)
  } catch (error) {
    const errorMsg = `Error in onEditorWillSave: ${error.message || error}`
    console.log(errorMsg)
  }
}

/**
 * Manual command to extract content from current note
 */
async function extractContent() {
  try {
    const note = Editor.note

    if (!note) {
      await CommandBar.prompt('No note is currently open', 'Please open a note first')
      return
    }

    // Check if note has any configured hashtag
    const matchingPair = findMatchingHashtag(note)
    if (!matchingPair) {
      await CommandBar.prompt('No configured hashtags found', 'This note does not contain any of the configured hashtags. Please check your plugin settings.')
      return
    }

    await processContent(note, matchingPair)
    await CommandBar.prompt('Content Processed', `Content for ${matchingPair.hashtag} has been extracted and a new note has been created.`)
  } catch (error) {
    const errorMsg = `Error in extractContent: ${error.message || error}`
    console.log(errorMsg)
    await CommandBar.prompt('Error', `Failed to extract content: ${error.message}`)
  }
}

/**
 * Legacy function name for backward compatibility
 */
async function extractBookReview() {
  await extractContent()
}

/**
 * Main function to process the content based on hashtag
 * @param {Note} sourceNote - The note containing the content
 * @param {Object} pair - The hashtag-folder pair {hashtag, folder}
 */
async function processContent(sourceNote, pair) {
  // Get the heading name from settings or derive from hashtag
  console.log(`DEBUG: DataStore.settings.headingName = "${DataStore.settings.headingName}"`)
  console.log(`DEBUG: pair.hashtag = "${pair.hashtag}"`)
  const headingName = DataStore.settings.headingName || pair.hashtag.substring(1)
  console.log(`DEBUG: Using headingName = "${headingName}"`)

  // Find the heading
  const contentHeading = findHeading(sourceNote, headingName, 2)

  if (!contentHeading) {
    const msg = `No "## ${headingName}" heading found in note`
    console.log(msg)
    return
  }

  // Extract content under the heading
  const extractedContent = await extractContentUnderHeading(sourceNote, contentHeading)

  if (!extractedContent || extractedContent.trim().length === 0) {
    const msg = `No content found under ${headingName} heading`
    console.log(msg)
    return
  }

  // Extract title from content
  const contentTitle = extractContentTitle(extractedContent)

  if (!contentTitle) {
    const msg = 'Could not determine content title'
    console.log(msg)
    return
  }

  // Check if note already exists
  const noteTitle = contentTitle
  const existingNotes = DataStore.projectNoteByTitle(noteTitle, true, false)

  // Check if we already processed this content (look for link marker)
  const hasLinkMarker = checkForExistingLink(sourceNote, contentHeading)

  if (hasLinkMarker && existingNotes.length > 0) {
    const msg = `Content already processed (found ${existingNotes.length} existing note(s) and link marker)`
    console.log(msg)
    return
  }

  // Create the note
  const createdNote = await createNote(noteTitle, extractedContent, sourceNote, pair)

  if (!createdNote) {
    const msg = 'Failed to create note'
    console.log(msg)
    return
  }

  // Add link to the note in the Daily Note
  await addLinkToSourceNote(sourceNote, contentHeading, createdNote)
}

/**
 * Find a heading in the note by title and level
 * @param {Note} note - The note to search
 * @param {string} headingText - The heading text to find
 * @param {number} level - The heading level (2 for ##)
 * @returns {Paragraph|null} - The heading paragraph or null
 */
function findHeading(note, headingText, level) {
  const paragraphs = note.paragraphs

  for (const para of paragraphs) {
    if (para.type === 'title' && para.headingLevel === level) {
      // Remove any tags from the heading text for comparison
      const cleanHeading = para.content.replace(/#\w+/g, '').trim()
      if (cleanHeading.toLowerCase() === headingText.toLowerCase()) {
        return para
      }
    }
  }

  return null
}

/**
 * Extract content under a heading until the next heading of same or higher level
 * @param {Note} note - The note to extract from
 * @param {Paragraph} heading - The heading paragraph
 * @returns {string} - The extracted content
 */
async function extractContentUnderHeading(note, heading) {
  const paragraphs = note.paragraphs

  // Find the heading by matching its properties instead of using indexOf
  // (indexOf may fail if paragraphs array is regenerated)
  let headingIndex = -1
  for (let i = 0; i < paragraphs.length; i++) {
    const para = paragraphs[i]
    if (para.type === heading.type &&
        para.headingLevel === heading.headingLevel &&
        para.content === heading.content) {
      headingIndex = i
      break
    }
  }

  if (headingIndex === -1) {
    return ''
  }

  let content = []

  // Start from the paragraph after the heading
  for (let i = headingIndex + 1; i < paragraphs.length; i++) {
    const para = paragraphs[i]

    // Stop if we hit another H2 heading
    if (para.type === 'title' && para.headingLevel <= heading.headingLevel) {
      break
    }

    // Skip empty paragraphs at the start
    if (content.length === 0 && para.content.trim().length === 0) {
      continue
    }

    content.push(para.content)
  }

  return content.join('\n').trim()
}

/**
 * Extract content title from extracted content
 * Looks for H3 heading, bold text, or first line
 * @param {string} content - The extracted content
 * @returns {string|null} - The extracted title
 */
function extractContentTitle(content) {
  const lines = content.split('\n')

  // Look for H3 heading (###)
  const h3Match = lines.find(line => line.trim().startsWith('###'))
  if (h3Match) {
    return h3Match.replace(/^###\s*/, '').trim()
  }

  // Look for bold text on first meaningful line
  const firstLine = lines.find(line => line.trim().length > 0)
  if (firstLine) {
    // Check for **bold** or __bold__
    const boldMatch = firstLine.match(/\*\*(.+?)\*\*|__(.+?)__/)
    if (boldMatch) {
      return (boldMatch[1] || boldMatch[2]).trim()
    }

    // Check if first line looks like a title (not too long, no punctuation at end)
    if (firstLine.length < 100 && !firstLine.trim().endsWith('.')) {
      return firstLine.trim()
    }
  }

  return 'Untitled Book'
}

/**
 * Clean the content by removing H3 title line, duplicate title lines, and the specified hashtag
 * @param {string} content - The raw content
 * @param {string} hashtag - The hashtag to remove (e.g., '#bookreview')
 * @param {string} title - The title to remove if it appears as a plain text line
 * @returns {string} - The cleaned content
 */
function cleanContent(content, hashtag, title = '') {
  const lines = content.split('\n')
  const cleanedLines = []

  for (const line of lines) {
    // Skip H3 heading lines
    if (line.trim().startsWith('###')) {
      continue
    }

    // Skip lines that match the title exactly (case-sensitive)
    if (title && line.trim() === title) {
      continue
    }

    // Remove the specific hashtag from lines
    const hashtagPattern = new RegExp(hashtag.replace('#', '#') + '\\b', 'gi')
    const cleanedLine = line.replace(hashtagPattern, '').trim()

    // Only add non-empty lines or preserve intentional empty lines
    if (cleanedLine.length > 0 || cleanedLines.length > 0) {
      cleanedLines.push(cleanedLine)
    }
  }

  return cleanedLines.join('\n').trim()
}

/**
 * Check if a link to book review already exists under the heading
 * @param {Note} note - The source note
 * @param {Paragraph} heading - The heading paragraph
 * @returns {boolean} - True if link exists
 */
function checkForExistingLink(note, heading) {
  const paragraphs = note.paragraphs

  // Find the heading by matching its properties
  let headingIndex = -1
  for (let i = 0; i < paragraphs.length; i++) {
    const para = paragraphs[i]
    if (para.type === heading.type &&
        para.headingLevel === heading.headingLevel &&
        para.content === heading.content) {
      headingIndex = i
      break
    }
  }

  if (headingIndex === -1) {
    return false
  }

  // Check paragraphs after the heading for a link marker
  for (let i = headingIndex + 1; i < paragraphs.length; i++) {
    const para = paragraphs[i]

    // Stop if we hit another H2 heading
    if (para.type === 'title' && para.headingLevel <= heading.headingLevel) {
      break
    }

    // Look for our marker comment or a link to book review note
    if (para.content.match(/\[\[.*?\]\]/)) {
      return true
    }
  }

  return false
}

/**
 * Create a new note in the designated folder
 * @param {string} title - The note title
 * @param {string} content - The content
 * @param {Note} sourceNote - The source Daily Note
 * @param {Object} pair - The hashtag-folder pair {hashtag, folder}
 * @returns {Note|null} - The created note or null
 */
async function createNote(title, content, sourceNote, pair) {
  try {
    // Get the folder path from the pair
    const folderPath = pair.folder
    const filename = `${folderPath}/${title}.md`

    // Format the source note link
    const sourceDateStr = sourceNote.date ? sourceNote.date.toISOString().split('T')[0] : 'Daily Note'
    const sourceLink = sourceNote.type === 'Calendar' && sourceNote.date
      ? `[[${sourceNote.date.toISOString().split('T')[0]}]]`
      : `[[${sourceNote.title}]]`

    // Clean the content (remove H3 title, duplicate title line, and the configured hashtag)
    const cleanedContent = cleanContent(content, pair.hashtag, title)

    // Build the note content
    const noteContent = `# ${title}
${cleanedContent}
Reviewed on: ${sourceLink}
`

    // Create the note
    const newFilename = DataStore.newNote(title, folderPath)

    if (!newFilename) {
      const msg = `Failed to create note file in ${folderPath}. Does the folder exist?`
      console.log(msg)
      return null
    }

    // Get the note object
    const createdNote = DataStore.projectNoteByFilename(newFilename)

    if (!createdNote) {
      const msg = 'Failed to retrieve created note'
      console.log(msg)
      return null
    }

    // Set the content
    createdNote.content = noteContent

    return createdNote
  } catch (error) {
    const errorMsg = `Error creating note: ${error.message || error}`
    console.log(errorMsg)
    return null
  }
}

/**
 * Add a link to the created note in the source Daily Note
 * @param {Note} sourceNote - The Daily Note
 * @param {Paragraph} heading - The heading
 * @param {Note} createdNote - The created note
 */
async function addLinkToSourceNote(sourceNote, heading, createdNote) {
  try {
    const paragraphs = sourceNote.paragraphs

    // Find the heading by matching its properties
    let headingIndex = -1
    for (let i = 0; i < paragraphs.length; i++) {
      const para = paragraphs[i]
      if (para.type === heading.type &&
          para.headingLevel === heading.headingLevel &&
          para.content === heading.content) {
        headingIndex = i
        break
      }
    }

    if (headingIndex === -1) {
      console.log('Could not find heading in source note paragraphs')
      return
    }

    // Find the last paragraph under this heading
    let lastIndex = headingIndex + 1

    for (let i = headingIndex + 1; i < paragraphs.length; i++) {
      const para = paragraphs[i]

      // Stop if we hit another H2 heading
      if (para.type === 'title' && para.headingLevel <= heading.headingLevel) {
        break
      }

      lastIndex = i
    }

    // Create the link text
    const linkText = `\nLink: [[${createdNote.title}]]`

    // Insert the link at the end of the section
    sourceNote.insertParagraph(linkText, lastIndex + 1, 'text')

  } catch (error) {
    const errorMsg = `Error adding link to source note: ${error.message || error}`
    console.log(errorMsg)
  }
}
