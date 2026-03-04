import { View, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
	responsiveHeight,
	responsiveWidth,
} from "react-native-responsive-dimensions";
import IconButton from "./IconButton";
import React from "react";

import { usePalette} from '../theme/paletteController'

interface ScreenHeaderProps {
	navigation: any;
}

const ScreenHeader: React.FC<ScreenHeaderProps> = ({ navigation }) => {
	const { theme } = usePalette();

	return (
		<SafeAreaView
		style={{ backgroundColor: "transparent" }}
		edges={["top"]}>
			<View
				style={[
					styles.container,
					{
						zIndex: 2,
						backgroundColor: theme.main,
						height: responsiveHeight(8),
					},
				]}
			>
				<IconButton
					iconName={"menu"}
					onPress={() => {
						navigation.openDrawer();
					}}
					iconSize={responsiveHeight(4.5)}
					iconColor={"black"}
					paddingVertical={responsiveHeight(1)}
					paddingHorizontal={responsiveHeight(1)}
				></IconButton>

				
			</View>
		</SafeAreaView>
	);
};

const styles = StyleSheet.create({
	container: {
		paddingLeft: responsiveWidth(4),
		paddingRight: responsiveWidth(4),
		justifyContent: "space-between",
		alignItems: "center",
		flexDirection: "row",
	},
});

export default ScreenHeader;
