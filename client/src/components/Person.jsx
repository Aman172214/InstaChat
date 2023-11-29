import React from "react";
import Avatar from "./Avatar";

const Person = ({ username, onClick, selected, online, userId }) => {
  return (
    <div
      className={
        "border-b border-gray-100  flex items-center gap-2 text-lg cursor-pointer " +
        (selected ? "bg-indigo-50" : "")
      }
      key={userId}
      onClick={onClick}
    >
      {selected && <div className="w-1 h-14 rounded-r-md bg-indigo-600"></div>}
      <div className="flex gap-2 py-3 pl-5">
        {" "}
        <Avatar online={online} username={username} userId={userId} />
        <span className="text-gray-800">{username}</span>
      </div>
    </div>
  );
};

export default Person;
