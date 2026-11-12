import { useState } from "react";
import { Form, ListGroup } from "react-bootstrap";

const UserTypeahead = ({
  suggestions,
  onInputChange,
  onSelect,
  isLoading = false,
  minChars = 2,
  maxSuggestions = 10,
  controlId = "UserTypeahead",
  label = "Search by name or email",
}) => {
  const [text, setText] = useState("");
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState(null);

  const panelVisible = open && text.length >= minChars;
  const listVisible =
    panelVisible &&
    !isLoading &&
    suggestions.length > 0 &&
    suggestions.length <= maxSuggestions;
  const activeIndex = suggestions.findIndex((u) => u.id === activeId);

  const handleChange = (event) => {
    const value = event.target.value;
    setText(value);
    setOpen(true);
    setActiveId(null);
    onInputChange(value);
  };

  const handleSelect = (user) => {
    setText(user.fullName);
    setOpen(false);
    onSelect(user);
  };

  const handleKeyDown = (event) => {
    if (event.key === "Escape") {
      setOpen(false);
    }
    if (!listVisible) {
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      const next = Math.min(activeIndex + 1, suggestions.length - 1);
      setActiveId(suggestions[next].id);
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      const previous = Math.max(activeIndex - 1, 0);
      setActiveId(suggestions[previous].id);
    }
    if (event.key === "Enter" && activeIndex !== -1) {
      event.preventDefault();
      handleSelect(suggestions[activeIndex]);
    }
  };

  const renderPanel = () => {
    if (isLoading) {
      return <ListGroup.Item>Loading...</ListGroup.Item>;
    }
    if (suggestions.length === 0) {
      return <ListGroup.Item>No matching users</ListGroup.Item>;
    }
    if (suggestions.length > maxSuggestions) {
      return (
        <ListGroup.Item>
          {suggestions.length} matches. Keep typing to narrow the results.
        </ListGroup.Item>
      );
    }
    return suggestions.map((user, index) => (
      <ListGroup.Item
        key={user.id}
        id={`${controlId}-option-${index}`}
        data-testid={`${controlId}-option-${index}`}
        role="option"
        aria-selected={index === activeIndex}
        action
        active={index === activeIndex}
        onClick={() => handleSelect(user)}
      >
        {user.fullName} ({user.email})
      </ListGroup.Item>
    ));
  };

  return (
    <Form.Group controlId={controlId} data-testid={controlId}>
      <Form.Label>{label}</Form.Label>
      <Form.Control
        type="text"
        autoComplete="off"
        role="combobox"
        aria-expanded={panelVisible}
        aria-controls={`${controlId}-listbox`}
        aria-activedescendant={
          listVisible && activeIndex >= 0
            ? `${controlId}-option-${activeIndex}`
            : undefined
        }
        value={text}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
      />
      {panelVisible && (
        <ListGroup id={`${controlId}-listbox`} role="listbox">
          {renderPanel()}
        </ListGroup>
      )}
    </Form.Group>
  );
};

export default UserTypeahead;
