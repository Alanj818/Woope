import {
	TouchableOpacity,
	StyleSheet,
	StyleProp,
	ViewStyle,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { responsiveHeight } from "react-native-responsive-dimensions";
import { Double } from "react-native/Libraries/Types/CodegenTypes";

type IconButtonProps = {
	iconName: string;
	onPress: () => void;
	iconSize: number;
	iconColor: string;
	borderWidth?: number;
	borderRadius?: number;
	borderColor?: string;
	height?: number;
	width?: number;
	backgroundColor?: string;
	paddingHorizontal?: number;
	paddingBottom?: number;
	paddingTop?: number;
	paddingLeft?: number;
	paddingRight?: number;
	paddingVertical?: number;
};
import React from "react";

const IconButton: React.FC<IconButtonProps> = ({
	iconName,
	onPress,
	iconSize,
	iconColor,
	borderWidth,
	borderRadius,
	borderColor,
	height,
	width,
	backgroundColor,
	paddingHorizontal,
	paddingTop,
	paddingBottom,
	paddingLeft,
	paddingRight,
	paddingVertical,
}) => {
	const iconStyle: ViewStyle = {
		borderWidth,
		borderRadius,
		borderColor,
		height,
		width,
		backgroundColor,
		paddingHorizontal,
		paddingTop,
		paddingBottom,
		paddingLeft,
		paddingRight,
		paddingVertical,
	};

	return (
		<TouchableOpacity onPress={onPress} style={[iconStyle]}>
			<Icon name={iconName} size={iconSize} color={iconColor}></Icon>
		</TouchableOpacity>
	);
};

export default IconButton;
