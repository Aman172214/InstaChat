import React, { useContext } from "react";
import Form from "./components/Form";
import axios from "axios";
import { UserContext } from "./UserContext";
import Chat from "./components/Chat";

const App = () => {
  axios.defaults.baseURL = "http://localhost:5000";
  axios.defaults.withCredentials = true;

  const { loggedInUsername } = useContext(UserContext);

  return (
    <>
      {loggedInUsername && <Chat />}
      {!loggedInUsername && <Form />}
    </>
  );
};

export default App;
