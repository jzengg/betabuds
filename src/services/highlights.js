// starting from a given dom element, look for the element that is offset items farther
export function findContainer(elt, offset) {
  let containerOffset = 0;
  let container;
  let child = elt;
  do {
    container = child;
    child = child.firstChild;
    if (child) {
      do {
        const len = child.textContent.length;
        if (containerOffset <= offset && containerOffset + len > offset) {
          break;
        }
        containerOffset += len;
        child = child.nextSibling;
      } while (child);
    }
  } while (child && child.firstChild && child.nodeType !== 3);

  if (child) {
    return {
      container: child,
      offsetInContainer: offset - containerOffset,
    };
  }
  while (container.lastChild) {
    container = container.lastChild;
  }
  return {
    container,
    offsetInContainer:
      container.nodeType === 3 ? container.textContent.length : 0,
  };
}

export function highlightSelection(
  offsetStart,
  offsetEnd,
  htmlElt,
  eltProps,
  classNames
) {
  if (offsetStart != null && offsetEnd != null && offsetStart !== offsetEnd) {
    const start = findContainer(htmlElt, Math.min(offsetStart, offsetEnd));
    const end = findContainer(htmlElt, Math.max(offsetStart, offsetEnd));
    const range = document.createRange();
    range.setStart(start.container, start.offsetInContainer);
    range.setEnd(end.container, end.offsetInContainer);
    const properties = {
      ...eltProps,
      className: classNames.join(" "),
    };
    wrapRange(range, properties);
  }
}

export function wrapRange(range, eltProperties) {
  const rangeLength = `${range}`.length;
  let wrappedLength = 0;
  const treeWalker = document.createTreeWalker(
    range.commonAncestorContainer,
    NodeFilter.SHOW_TEXT
  );
  let { startOffset } = range;
  treeWalker.currentNode = range.startContainer;
  if (
    treeWalker.currentNode.nodeType === Node.TEXT_NODE ||
    treeWalker.nextNode()
  ) {
    do {
      if (treeWalker.currentNode.nodeValue !== "\n") {
        if (
          treeWalker.currentNode === range.endContainer &&
          range.endOffset < treeWalker.currentNode.nodeValue.length
        ) {
          treeWalker.currentNode.splitText(range.endOffset);
        }
        if (startOffset) {
          treeWalker.currentNode = treeWalker.currentNode.splitText(
            startOffset
          );
          startOffset = 0;
        }
        // this is the wrapper class that does the highlight styling. applies styles
        // from eltProperties
        // TODO try to convert this to react? any benefits?
        const elt = document.createElement("mark");
        Object.entries(eltProperties).forEach(([key, value]) => {
          elt[key] = value;
        });
        treeWalker.currentNode.parentNode.insertBefore(
          elt,
          treeWalker.currentNode
        );
        elt.appendChild(treeWalker.currentNode);
      }
      wrappedLength += treeWalker.currentNode.nodeValue.length;
      if (wrappedLength >= rangeLength) {
        break;
      }
    } while (treeWalker.nextNode());
  }
}

// basically need to pass span element we're using to highlight
export function removeHighlight(eltCollection) {
  Array.prototype.slice.call(eltCollection).forEach((elt) => {
    // Loop in case another wrapper has been added inside
    for (let child = elt.firstChild; child; child = elt.firstChild) {
      if (child.nodeType === 3) {
        if (elt.previousSibling && elt.previousSibling.nodeType === 3) {
          child.nodeValue = elt.previousSibling.nodeValue + child.nodeValue;
          elt.parentNode.removeChild(elt.previousSibling);
        }
        if (
          !child.nextSibling &&
          elt.nextSibling &&
          elt.nextSibling.nodeType === 3
        ) {
          child.nodeValue += elt.nextSibling.nodeValue;
          elt.parentNode.removeChild(elt.nextSibling);
        }
      }
      elt.parentNode.insertBefore(child, elt);
    }
    elt.parentNode.removeChild(elt);
  });
}

export function getSelectionOffsets(currentElt) {
  const selection = window.getSelection();
  let range = selection.rangeCount && selection.getRangeAt(0);
  if (
    !range ||
    /* eslint-disable no-bitwise */
    !(
      currentElt.compareDocumentPosition(range.startContainer) &
      window.Node.DOCUMENT_POSITION_CONTAINED_BY
    ) ||
    !(
      currentElt.compareDocumentPosition(range.endContainer) &
      window.Node.DOCUMENT_POSITION_CONTAINED_BY
    )
    /* eslint-enable no-bitwise */
  ) {
    return null;
  }

  let selectionStart;
  let selectionEnd;
  const startRange = document.createRange();
  startRange.setStart(currentElt, 0);
  startRange.setEnd(range.startContainer, range.startOffset);
  selectionStart = `${startRange}`.length;
  selectionEnd = selectionStart + `${range}`.length;
  if (selectionStart === selectionEnd) {
    return null;
  }
  return { selectionStart, selectionEnd };
}

export const hasSelection = () => {
  const selection = window.getSelection();
  return !!selection.toString();
};
