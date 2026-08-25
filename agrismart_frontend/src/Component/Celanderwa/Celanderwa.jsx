import React from "react";
import Calendar from "react-calendar";
import "./Celanderwa.css";

const Celanderwa = ({ date, setDate }) => {
  const onChange = (newDate) => {
    setDate(newDate);
  };
  return (
    <div className="calendar-card">
      <Calendar
        onChange={onChange}
        value={date}
        //ar sa اللغة
        locale="en-US"
      />
    </div>
  );
};

export default Celanderwa;
