import React from "react";
import { FiMenu } from "react-icons/fi";
import logo from "../../img/Agrismart.png";
import "./FarmEditorHeader.css";

const FarmEditorHeader = () => {
  return (
    <header className="farm-editor-header dir=">
      <div className="farm-editor-header__logoWrap">
        <button
          type="button"
          className="farm-editor-header__menu"
          aria-label="القائمة">
          <FiMenu />
        </button>
        <img src={logo} alt="AgriSmart" className="farm-editor-header__logo" />
        <span className="farm-editor-header__brand">AgriSmart</span>
      </div>
    </header>
  );
};

export default FarmEditorHeader;
