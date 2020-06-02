import React, { useState } from "react";
import { Reactions } from "../types/reactions";

export default function HighlightForm({
  highlight,
  onSubmit,
  onCancel,
  onDelete,
}) {
  const [comment, setComment] = useState(highlight.comment || "");
  const [reaction, setReaction] = useState(
    highlight.reaction || Reactions.MISC
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ comment, reaction });
  };

  const handleReactionChange = (e) => {
    const selectedReaction = e.target.value;
    setReaction(selectedReaction);
  };

  const handleCommentChange = (e) => {
    const newComment = e.target.value;
    setComment(newComment);
  };

  const renderCommentInput = () => {
    return <input type="text" value={comment} onChange={handleCommentChange} />;
  };

  const renderSelectReaction = () => {
    return (
      <select value={reaction} onChange={handleReactionChange}>
        {Object.values(Reactions).map((reactionOption) => {
          return <option key={reactionOption}>{reactionOption}</option>;
        })}
        }
      </select>
    );
  };

  // TODO how to force onsubmit to also submit both comment and reaction
  return (
    <form onSubmit={handleSubmit} onClick={(e) => e.preventDefault()}>
      {renderSelectReaction()}
      {renderCommentInput()}
      <button type="button" onClick={handleSubmit}>
        save
      </button>
      <button onClick={onCancel}>cancel</button>
      <button onClick={onDelete}>remove highlight</button>
    </form>
  );
}
