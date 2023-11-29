import React, {
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
} from "react";
import { UserContext } from "../UserContext";
import { uniqBy } from "lodash";
import axios from "axios";
import Person from "./Person";

const Chat = () => {
  const [ws, setWs] = useState(null);
  const [onlinePeople, setOnlinePeople] = useState({});
  const [offlinePeople, setOfflinePeople] = useState({});
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [sentMessage, setSentMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const { loggedInUsername, id, setId, setLoggedInUsername } =
    useContext(UserContext);
  const scrollToEnd = useRef();

  const serverMessageHandler = useCallback((event) => {
    const messageData = JSON.parse(event.data);
    if ("online" in messageData) {
      showOnlinePeople(messageData.online);
    } else if ("text" in messageData) {
      if (messageData.sender === selectedPerson) {
        setMessages((prevMessage) => [...prevMessage, { ...messageData }]);
      }
    }
  }, []);

  const connectToWS = useCallback(() => {
    const ws = new WebSocket(import.meta.env.VITE_WEBSOCKET_URL);
    setWs(ws);
    ws.addEventListener("message", serverMessageHandler);
    ws.addEventListener("close", () => {
      setTimeout(() => {
        console.log("Trying to reconnect!");
        connectToWS();
      }, 1000);
    });
  }, [serverMessageHandler]);

  useEffect(() => {
    connectToWS();
  }, [connectToWS]);

  const showOnlinePeople = (peopleArray) => {
    const people = {};
    peopleArray.forEach(({ username, userId }) => {
      people[userId] = username;
    });
    setOnlinePeople(people);
  };

  const sendMessageHandler = (event, file) => {
    if (event) event.preventDefault();
    ws.send(
      JSON.stringify({
        receiverId: selectedPerson,
        text: sentMessage,
        file,
      })
    );
    if (file) {
      axios.get(`/messages/${selectedPerson}`).then((response) => {
        setMessages(response.data);
      });
    } else {
      setSentMessage(" ");
      setMessages((prevMessage) => [
        ...prevMessage,
        {
          text: sentMessage,
          sender: id,
          receiver: selectedPerson,
          _id: Date.now(),
        },
      ]);
    }
  };

  const fileSendHandler = (event) => {
    const reader = new FileReader();
    reader.readAsDataURL(event.target.files[0]);
    reader.onload = () => {
      sendMessageHandler(null, {
        name: event.target.files[0].name,
        data: reader.result,
      });
    };
  };

  const logoutHandler = () => {
    axios.post("/logout").then(() => {
      setId(null);
      setLoggedInUsername(null);
      setWs(null);
    });
  };

  useEffect(() => {
    const div = scrollToEnd.current;
    if (div) div.scrollIntoView({ behaviour: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (selectedPerson) {
      axios.get(`/messages/${selectedPerson}`).then((response) => {
        setMessages(response.data);
      });
    }
  }, [selectedPerson]);

  useEffect(() => {
    axios.get("/people").then((response) => {
      const offlinePeopleArr = response.data
        .filter((person) => person._id !== id)
        .filter((person) => !Object.keys(onlinePeople).includes(person._id));
      const offlinePeople = {};
      offlinePeopleArr.forEach(
        (person) => (offlinePeople[person._id] = person)
      );
      setOfflinePeople(offlinePeople);
    });
  }, [onlinePeople, id]);

  const onlinePeopleExcOurUser = { ...onlinePeople };
  delete onlinePeopleExcOurUser[id];

  const uniqueMessageData = uniqBy(messages, "_id");

  return (
    <div className="flex h-screen">
      <div className=" bg-white w-1/4 py-3 flex flex-col">
        <div className="flex-grow">
          <h1 className="text-indigo-600 font-bold text-3xl flex mb-5 justify-center">
            InstaChat
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="w-7 h-7"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
              />
            </svg>
          </h1>
          {Object.keys(onlinePeopleExcOurUser).map((userId) => (
            <Person
              key={userId}
              userId={userId}
              online={true}
              onClick={() => setSelectedPerson(userId)}
              selected={userId === selectedPerson}
              username={onlinePeopleExcOurUser[userId]}
            />
          ))}
          {Object.keys(offlinePeople).map((userId) => (
            <Person
              key={userId}
              userId={userId}
              online={false}
              onClick={() => setSelectedPerson(userId)}
              selected={userId === selectedPerson}
              username={offlinePeople[userId].username}
            />
          ))}
        </div>
        <div className="p-2 text-center flex items-center justify-center">
          <span className="flex m-2 text-gray-800 items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            {loggedInUsername}
          </span>
          <button
            onClick={logoutHandler}
            className="bg-indigo-600  hover:bg-indigo-500 text-white rounded-md p-2"
          >
            logout
          </button>
        </div>
      </div>
      <div className="flex flex-col bg-indigo-100 w-3/4 p-2">
        <div className="flex-grow">
          {!selectedPerson && (
            <div className="flex items-center justify-center h-full text-gray-400">
              Select a conversation from sidebar
            </div>
          )}
          {!!selectedPerson && (
            <div className="relative h-full ">
              <div className="absolute inset-0 overflow-y-auto mb-2 break-words">
                {uniqueMessageData.map((message) => (
                  <div
                    key={message._id}
                    className={
                      message.sender === id ? "text-right" : "text-left"
                    }
                  >
                    <div
                      className={
                        "px-2 my-1 inline-block rounded-md max-w-xs " +
                        (message.sender === id
                          ? "bg-indigo-600 text-white"
                          : "bg-white text-gray-800")
                      }
                    >
                      {message.text}
                      {message.file && (
                        <div className="flex items-center gap-1 underline underline-offset-2">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth="1.5"
                            stroke="currentColor"
                            className="w-4 h-4"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13"
                            />
                          </svg>
                          <a
                            href={
                              axios.defaults.baseURL +
                              "/uploads/" +
                              message.file
                            }
                            target="_blank"
                            rel="noreferrer"
                          >
                            {message.file}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={scrollToEnd}></div>
              </div>
            </div>
          )}
        </div>
        {!!selectedPerson && (
          <form className="flex gap-2 mx-1" onSubmit={sendMessageHandler}>
            <input
              type="text"
              value={sentMessage}
              placeholder="Type your message here"
              className="bg-white flex-grow rounded-md p-1 border-0"
              onChange={(event) => setSentMessage(event.target.value)}
            />
            <label className="bg-gray-300 rounded-md border border-gray-400 flex items-center cursor-pointer">
              <input
                type="file"
                className="hidden"
                onChange={fileSendHandler}
              />
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                className="w-8 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13"
                />
              </svg>
            </label>
            <button
              type="submit"
              disabled={sentMessage === " "}
              className="bg-indigo-600 p-2 text-white rounded-md font-semibold hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 cursor-pointer"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
                />
              </svg>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Chat;
