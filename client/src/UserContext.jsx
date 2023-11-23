import axios from "axios";
import { createContext, useEffect, useState } from "react";

export const UserContext = createContext({});

export const UserContextProvider = ({ children }) => {
  const [loggedInUsername, setLoggedInUsername] = useState(null);
  const [id, setId] = useState(null);

  useEffect(() => {
    const authenticate = async () => {
      const { data } = await axios.get("/authenticate");
      setId(data.userId);
      setLoggedInUsername(data.username);
    };
    authenticate();
  }, []);

  return (
    <UserContext.Provider
      value={{ loggedInUsername, setLoggedInUsername, id, setId }}
    >
      {children}
    </UserContext.Provider>
  );
};
