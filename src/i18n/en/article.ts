// The article page's own chrome. None of it lives in the MDX, so translating
// an article never reaches these strings.
export default {
  backToIndex: '← All notes',
  // Used twice on the rail: once as the visible label, once as its aria-label.
  toc: 'On this page',
  keepReading: 'Keep reading',
  // The last four belong to the client script that decorates code blocks and
  // headings. It cannot import this module, so ArticlePage hands them over on
  // data- attributes rather than keeping a second copy in the script.
  copy: 'Copy',
  copied: 'Copied',
  copyFailed: 'Failed',
  headingAnchor: 'Link to this section',
}
