import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import chapter1 from "../data/chapter1.md";
import HighlightForm from "./highlightForm";
import {
  highlightSelection,
  removeHighlight,
  getSelectionOffsets,
  hasSelection,
} from "../services/highlights";
import { useStateWithLocalStorage } from "../services/localStorage";

const sampleBookData = {
  title: "Harry Potter and the Philosopher's Stone",
  author: "J.K. Rowling",
};

export default function Chapter() {
  const LOCAL_STORAGE_KEY = "bbHighlights";
  const HIGHLIGHT_CLASS = "bbHighlighted";
  const HIGHLIGHT_ID_PREFIX = "highlightId";

  const [preview, setPreview] = useState("");

  const [currentHighlightId, setCurrentHighlightId] = useState();
  const [selection, setSelection] = useState();
  const [highlights, setHighlights] = useStateWithLocalStorage(
    LOCAL_STORAGE_KEY,
    []
  );
  const previewRef = useRef();

  useEffect(() => {
    document.addEventListener("selectionchange", handleSelectionChange);
    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
    };
  }, []);

  useEffect(() => {
    fetch(chapter1)
      .then((response) => {
        return response.text();
      })
      .then((content) => {
        // this doesn't force the contents to rerender since they're receiving the exact same props
        setPreview(content);
      });
  }, []);

  useEffect(() => {
    for (let { selectionStart, selectionEnd, highlightId } of highlights) {
      const highlightProps = {};
      highlightSelection(
        selectionStart,
        selectionEnd,
        previewRef.current,
        highlightProps,
        [HIGHLIGHT_CLASS, highlightId]
      );
    }
    // TODO track preview when chapter changes? track prev Chap
  }, [highlights, preview]);

  const handleDeleteCurrentHighlight = () => {
    const newState = highlights.filter(
      (highlight) => highlight.highlightId !== currentHighlightId
    );
    const highlightEls = previewRef.current.getElementsByClassName(
      currentHighlightId
    );
    // TODO how to do this declaratively so that remove highlight is handled in
    // useEffect?
    removeHighlight(highlightEls);
    setHighlights(newState);
    setCurrentHighlightId(null);
  };

  const saveHighlight = ({ comment, reaction }) => {
    const currentHighlight = getCurrentHighlight();
    const updatedHighlight = { ...currentHighlight, comment, reaction };
    const newState = [
      ...highlights.filter(
        (highlight) => highlight.highlightId !== currentHighlightId
      ),
      updatedHighlight,
    ];
    setHighlights(newState);
    setCurrentHighlightId(null);
    resetCurrentSelection();
  };

  const getCurrentHighlight = () => {
    const currentHighlight = highlights.find(
      (highlight) => highlight.highlightId === currentHighlightId
    );
    return currentHighlight;
  };

  const handleMaybeClickHighlight = (e) => {
    e.preventDefault();
    const classes = [...e.target.classList];
    if (classes.includes(HIGHLIGHT_CLASS)) {
      const highlightId = classes.find((className) =>
        className.startsWith(HIGHLIGHT_ID_PREFIX)
      );
      setCurrentHighlightId(highlightId);
    } else {
      setCurrentHighlightId(null);
    }
  };

  const handleSelectionChange = (e) => {
    let selectionOffsets = null;
    if (hasSelection()) {
      selectionOffsets = getSelectionOffsets(previewRef.current);
    }
    setSelection(selectionOffsets);
  };

  const resetCurrentSelection = (e) => {
    window.getSelection().removeAllRanges();
    setSelection(null);
  };

  const createHighlightFromCurrentSelection = () => {
    const { selectionStart, selectionEnd } = selection;
    // TODO add user specific info to id?
    const highlightId = `${HIGHLIGHT_ID_PREFIX}-${selectionStart}-${selectionEnd}`;
    const newState = [
      ...highlights,
      { selectionStart, selectionEnd, highlightId },
    ];
    setHighlights(newState);
    resetCurrentSelection();
    setCurrentHighlightId(highlightId);
  };

  const closeForm = () => {
    setCurrentHighlightId(null);
  };

  // if there is a currentSelectionId, we should be showing the highlight form
  return (
    <main className="chapter-container">
      {selection && (
        <button onClick={createHighlightFromCurrentSelection}>
          start highlight
        </button>
      )}
      {currentHighlightId && (
        <HighlightForm
          highlight={getCurrentHighlight()}
          onSubmit={saveHighlight}
          onCancel={closeForm}
          onDelete={handleDeleteCurrentHighlight}
        />
      )}

      <section className="book-header">
        <h1>{sampleBookData.title}</h1>
        <address>{sampleBookData.author}</address>
      </section>

      <section
        className="preview-container"
        onClick={handleMaybeClickHighlight}
      >
        <article className="preview-content" ref={previewRef}>
          <ReactMarkdown source={preview} />
        </article>
      </section>
    </main>
  );
}
