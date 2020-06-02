import { useEffect, useState } from "react";

export const useStateWithLocalStorage = (localStorageKey, initialValue) => {
  const [value, setValue] = useState(
    (localStorage.getItem(localStorageKey) &&
      JSON.parse(localStorage.getItem(localStorageKey))) ||
      initialValue
  );
  useEffect(() => {
    localStorage.setItem(localStorageKey, JSON.stringify(value));
  });
  return [value, setValue];
};
