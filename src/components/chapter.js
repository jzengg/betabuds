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
  };

  const getCurrentHighlight = () => {
    const currentHighlight = highlights.find(
      (highlight) => highlight.highlightId === currentHighlightId
    );
    return currentHighlight;
  };

  const handleMaybeClickHighlight = (e) => {
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

  const saveCurrentSelection = (e) => {
    if (hasSelection()) {
      const selectionOffsets = getSelectionOffsets(previewRef.current);
      setSelection({ ...selectionOffsets });
    } else {
      setSelection(null);
    }
  };

  const resetCurrentSelection = (e) => {
    window.getSelection().removeAllRanges();
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
    setSelection(null);
    setCurrentHighlightId(highlightId);
  };

  const closeForm = () => {
    setCurrentHighlightId(null);
  };

  // if there is a currentSelectionId, we should be showing the highlight form
  return (
    <>
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

      <div
        className="preview-container"
        onClick={handleMaybeClickHighlight}
        onMouseUp={saveCurrentSelection}
        onMouseDown={resetCurrentSelection}
      >
        <div className="preview-content" ref={previewRef}>
          <ReactMarkdown source={preview} />
        </div>
      </div>
    </>
  );
}