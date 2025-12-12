// @flow

/**
 * Book Review Helper Plugin for NotePlan
 * Automatically extracts book reviews from Daily Notes and creates dedicated notes
 */

/**
 * Triggered when a note is saved (onEditorWillSave trigger)
 * Checks if it's a Daily Note with #bookreview tag and processes it
 */
export async function onEditorWillSave(): Promise<void> {
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

    // Check if note has #bookreview tag
    if (!note.hashtags || !note.hashtags.includes('#bookreview')) {
      return
    }

    // Process the book review
    await processBookReview(note)
  } catch (error) {
    console.log('Error in onEditorWillSave:', error)
  }
}

/**
 * Manual command to extract book review from current note
 */
export async function extractBookReview(): Promise<void> {
  try {
    const note = Editor.note

    if (!note) {
      await CommandBar.prompt('No note is currently open', 'Please open a note first')
      return
    }

    await processBookReview(note)
    await CommandBar.prompt('Book Review Processed', 'The book review has been extracted and a new note has been created.')
  } catch (error) {
    console.log('Error in extractBookReview:', error)
    await CommandBar.prompt('Error', `Failed to extract book review: ${error.message}`)
  }
}

/**
 * Main function to process the book review
 * @param {Note} sourceNote - The note containing the book review
 */
async function processBookReview(sourceNote: Note): Promise<void> {
  // Find the "Book Review" heading
  const bookReviewHeading = findHeading(sourceNote, 'Book Review', 2)

  if (!bookReviewHeading) {
    console.log('No "## Book Review" heading found in note')
    return
  }

  // Extract content under the Book Review heading
  const reviewContent = extractContentUnderHeading(sourceNote, bookReviewHeading)

  if (!reviewContent || reviewContent.trim().length === 0) {
    console.log('No content found under Book Review heading')
    return
  }

  // Extract or prompt for book title
  const bookTitle = extractBookTitle(reviewContent)

  if (!bookTitle) {
    console.log('Could not determine book title')
    return
  }

  // Check if book review note already exists
  const bookNoteTitle = `Book Review: ${bookTitle}`
  const existingNotes = DataStore.projectNoteByTitle(bookNoteTitle, true, false)

  // Check if we already processed this review (look for link marker)
  const hasLinkMarker = checkForExistingLink(sourceNote, bookReviewHeading)

  if (hasLinkMarker && existingNotes.length > 0) {
    console.log('Book review already processed')
    return
  }

  // Create the book review note
  const bookNote = await createBookReviewNote(bookNoteTitle, reviewContent, sourceNote)

  if (!bookNote) {
    console.log('Failed to create book review note')
    return
  }

  // Add link to the book review note in the Daily Note
  addLinkToSourceNote(sourceNote, bookReviewHeading, bookNote)
}

/**
 * Find a heading in the note by title and level
 * @param {Note} note - The note to search
 * @param {string} headingText - The heading text to find
 * @param {number} level - The heading level (2 for ##)
 * @returns {Paragraph|null} - The heading paragraph or null
 */
function findHeading(note: Note, headingText: string, level: number): ?Paragraph {
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
function extractContentUnderHeading(note: Note, heading: Paragraph): string {
  const paragraphs = note.paragraphs
  const headingIndex = paragraphs.indexOf(heading)

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
 * Extract book title from review content
 * Looks for H3 heading, bold text, or first line
 * @param {string} content - The review content
 * @returns {string|null} - The extracted book title
 */
function extractBookTitle(content: string): ?string {
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
 * Check if a link to book review already exists under the heading
 * @param {Note} note - The source note
 * @param {Paragraph} heading - The heading paragraph
 * @returns {boolean} - True if link exists
 */
function checkForExistingLink(note: Note, heading: Paragraph): boolean {
  const paragraphs = note.paragraphs
  const headingIndex = paragraphs.indexOf(heading)

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

    // Look for our marker comment or a link to Books Read folder
    if (para.content.includes('[[Book Review:') || para.content.includes('➡️')) {
      return true
    }
  }

  return false
}

/**
 * Create a new book review note in the Books Read folder
 * @param {string} title - The book note title
 * @param {string} content - The review content
 * @param {Note} sourceNote - The source Daily Note
 * @returns {Note|null} - The created note or null
 */
async function createBookReviewNote(title: string, content: string, sourceNote: Note): Promise<?Note> {
  try {
    // Get the folder path from settings
    const folderPath = DataStore.settings.bookReviewFolder || '30 - Resources/Books Read'
    const filename = `${folderPath}/${title}.md`

    // Format the source note link
    const sourceDateStr = sourceNote.date ? sourceNote.date.toISOString().split('T')[0] : 'Daily Note'
    const sourceLink = sourceNote.type === 'Calendar' && sourceNote.date
      ? `[[${sourceNote.date.toISOString().split('T')[0]}]]`
      : `[[${sourceNote.title}]]`

    // Build the note content
    const noteContent = `# ${title}

📅 Reviewed on: ${sourceLink}

---

${content}

---

#book #review
`

    // Create the note
    const newFilename = DataStore.newNote(title, folderPath)

    if (!newFilename) {
      console.log('Failed to create note file')
      return null
    }

    // Get the note object
    const bookNote = DataStore.projectNoteByFilename(newFilename)

    if (!bookNote) {
      console.log('Failed to retrieve created note')
      return null
    }

    // Set the content
    bookNote.content = noteContent

    return bookNote
  } catch (error) {
    console.log('Error creating book review note:', error)
    return null
  }
}

/**
 * Add a link to the book review note in the source Daily Note
 * @param {Note} sourceNote - The Daily Note
 * @param {Paragraph} heading - The Book Review heading
 * @param {Note} bookNote - The created book review note
 */
function addLinkToSourceNote(sourceNote: Note, heading: Paragraph, bookNote: Note): void {
  try {
    const paragraphs = sourceNote.paragraphs
    const headingIndex = paragraphs.indexOf(heading)

    if (headingIndex === -1) {
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
    const linkText = `\n➡️ [[${bookNote.title}]]`

    // Insert the link at the end of the section
    sourceNote.insertParagraph(linkText, lastIndex + 1, 'text')

  } catch (error) {
    console.log('Error adding link to source note:', error)
  }
}
