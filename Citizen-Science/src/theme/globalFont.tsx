import React from "react";
import { Text, TextInput } from "react-native";

export const applyGlobalFonts = () => {
  const oldTextRender = Text.render;
  Text.render = function (...args) {
    const origin = oldTextRender.call(this, ...args);
    return React.cloneElement(origin, {
      style: [{ fontFamily: "Inter-Regular" }, origin.props.style],
    });
  };

  const oldTextInputRender = TextInput.render;
  TextInput.render = function (...args) {
    const origin = oldTextInputRender.call(this, ...args);
    return React.cloneElement(origin, {
      style: [{ fontFamily: "Inter-Regular" }, origin.props.style],
    });
  };
};
