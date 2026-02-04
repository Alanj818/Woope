import React from "react";
import { DrawerNavigationProp } from '@react-navigation/drawer';

// Accept title and navigation props used by CommunitySideMenu
type ScreenHeaderProps = {
	title?: string;
	navigation?: DrawerNavigationProp<Record<string, object | undefined>>;
};

// No-op header: intentionally returns null to remove the top hamburger/menu across the app
const ScreenHeader: React.FC<ScreenHeaderProps> = () => {
		return null;
};

export default ScreenHeader;
