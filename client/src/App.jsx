import React, { useContext } from "react";
import Form from "./components/Form";
import axios from "axios";
import { UserContext } from "./UserContext";

const App = () => {
  axios.defaults.baseURL = "http://localhost:5000";
  axios.defaults.withCredentials = true;

  return <Form />;
};

export default App;
