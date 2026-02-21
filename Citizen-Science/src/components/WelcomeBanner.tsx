import React, { useContext, useEffect, useRef, useState } from "react";
import {
	Text,
	View,
	TouchableOpacity,
	StyleSheet,
	Animated,
	LayoutAnimation,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import {
	responsiveFontSize,
	responsiveHeight,
	responsiveWidth,
} from "react-native-responsive-dimensions";
import { AuthContext } from "../util/AuthContext";
import { jwtDecode } from "jwt-decode";
import { AccessToken } from "../util/token";


const WelcomeBanner = () => {
	// intentionally disabled to avoid rendering the blue welcome strip
	return null;
};

const styles = StyleSheet.create({
	container: {
		width: responsiveWidth(100),
		borderBottomLeftRadius: 20,
		borderBottomRightRadius: 20,
		backgroundColor: "lightblue",

		shadowColor: "black",
		shadowOffset: {
			width: responsiveWidth(0),
			height: responsiveHeight(2),
		},
		shadowOpacity: 0.25,
		shadowRadius: 3,
		elevation: responsiveHeight(0),

		paddingTop: responsiveHeight(1),
		paddingBottom: responsiveHeight(1),
		paddingLeft: responsiveWidth(5),
		paddingRight: responsiveWidth(1),

		overflow: "hidden",
	},
});
export default WelcomeBanner;
